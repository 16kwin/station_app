// featureStore.test.ts — хранилище функций: закрытые правила, сборка, каскад, ревизия, сбои (раздел 11.2 проекта).
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REFRESH_DEBOUNCE_MS,
  REVISION_RETRY_MS,
  acknowledgeFeatureChanges,
  connectFeatureHttp,
  featuresRevision,
  getFeatureSnapshot,
  hidePresetNotice,
  isFeatureKnownOff,
  isFeatureOn,
  loadFeatures,
  noteFeaturesRevision,
  parseFeatureProfile,
  refreshFeatures,
  resetFeatures,
  resolveEnabledFeatures,
  subscribeFeatures,
  type FeatureHttp,
} from '../../src/services/features/featureStore';
import { buildModuleOf } from '../../src/services/features/buildFlags';
import { isPathAllowed } from '../../src/services/features/routes';
import { connectLiveUpdates } from '../../src/services/liveUpdatesClient';
import { deferred, profile, stubHttp, waitFor } from './helpers';

beforeEach(() => {
  resetFeatures();
  // «Профиль функций не получен» — ожидаемое предупреждение в тестах сбоев
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('закрытые правила', () => {
  test('неизвестный, отсутствующий и не логический ключ — выключено', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { video: true, 'video.live': true, bogus: true, export: 'true', uploads: 1 })));
    assert.equal(await loadFeatures(), true);
    assert.equal(isFeatureOn('video'), true);
    assert.equal(isFeatureOn('video.live'), true);
    assert.equal(isFeatureOn('export'), false, 'строка "true" — не true');
    assert.equal(isFeatureOn('uploads'), false, '1 — не true');
    assert.equal(isFeatureOn('orders'), false, 'ключа нет в ответе');
    assert.equal([...getFeatureSnapshot().on].includes('bogus' as never), false, 'неизвестный ключ никуда не попадает');
  });

  test('ошибка загрузки — закрытый режим: видно только ядро', async () => {
    connectFeatureHttp(stubHttp(new Error('404')));
    assert.equal(await loadFeatures(), false);
    const snapshot = getFeatureSnapshot();
    assert.equal(snapshot.status, 'error');
    assert.equal(snapshot.on.size, 0);
    assert.equal(isPathAllowed('/stations'), true);
    assert.equal(isPathAllowed('/references/nomenclature'), true);
    assert.equal(isPathAllowed('/analytics'), false);
    assert.equal(isPathAllowed('/documents/video-archive'), false);
  });

  test('ответ без объекта features (старый сервер, страница вместо JSON) — ошибка', async () => {
    connectFeatureHttp(stubHttp('<!doctype html><html></html>'));
    assert.equal(await loadFeatures(), false);
    assert.equal(getFeatureSnapshot().status, 'error');
    assert.throws(() => parseFeatureProfile({ revision: 'r1' }));
    assert.throws(() => parseFeatureProfile(null));
    assert.throws(() => parseFeatureProfile({ features: [] }));
  });

  test('исключённое при сборке выключено, даже если сервер его разрешает', () => {
    const withoutVideo = (key: Parameters<typeof buildModuleOf>[0]) => buildModuleOf(key) !== 'video';
    const on = resolveEnabledFeatures({ video: true, 'video.live': true, 'video.archive': true, map: true }, withoutVideo);
    assert.deepEqual([...on].sort(), ['map']);
  });

  test('выключен родитель или зависимость — выключено', () => {
    assert.deepEqual([...resolveEnabledFeatures({ video: false, 'video.live': true })], []);
    const clips = resolveEnabledFeatures({ video: true, 'video.live': true, 'video.download': false, 'video.clips': true });
    assert.equal(clips.has('video.clips'), false, 'клипам нужно скачивание');
    assert.equal(clips.has('video.live'), true);
    const graph = resolveEnabledFeatures({ dashboards: true, 'dashboards.audit': false, 'dashboards.graph': true });
    assert.equal(graph.has('dashboards.graph'), false, 'графу нужна панель аудитора');
    const upload = resolveEnabledFeatures({ model3d: true, 'model3d.upload': true, uploads: false });
    assert.deepEqual([...upload], ['model3d']);
  });
});

describe('ответ сервера', () => {
  test('пресет, таймауты и права разбираются; неверные значения отбрасываются', () => {
    const parsed = parseFeatureProfile(
      profile('abc123', { pwa: true }, { presetSource: 'default', canViewSecurity: true, ui: { inactivityMinutes: -5, warningMinutes: 2 } }),
    );
    assert.equal(parsed.preset, 'full');
    assert.equal(parsed.presetSource, 'default');
    assert.equal(parsed.revision, 'abc123');
    assert.deepEqual(parsed.ui, { inactivityMinutes: null, warningMinutes: 2 });
    assert.equal(parsed.canViewSecurity, true);
    assert.equal(parsed.canManage, false);
    assert.equal(parsed.installation, null, 'сервер не прислал состояние установки');
  });

  test('состояние установки без ролей (installation) разбирается так же, как features', () => {
    const parsed = parseFeatureProfile(profile('r1', { gpp: false }, { installation: { gpp: true, map: 'false', drafts: false } }));
    assert.deepEqual(parsed.installation, { gpp: true, drafts: false });
    assert.deepEqual(parsed.features, { gpp: false });
  });
});

describe('загрузка и обновление', () => {
  test('параллельные загрузки делят один запрос', async () => {
    const http = stubHttp(profile('r1', { video: true }));
    connectFeatureHttp(http);
    const results = await Promise.all([loadFeatures(), loadFeatures(), loadFeatures()]);
    assert.deepEqual(results, [true, true, true]);
    assert.deepEqual(http.calls, ['/api/features']);
  });

  test('несколько обновлений подряд — один запрос', async () => {
    const http = stubHttp(profile('r1', { video: true }));
    connectFeatureHttp(http);
    await loadFeatures();
    const results = await Promise.all([refreshFeatures(), refreshFeatures(), refreshFeatures()]);
    assert.deepEqual(results, [true, true, true]);
    assert.equal(http.calls.length, 2);
  });

  test('смена ревизии в заголовке — профиль перезапрошен, подписчики уведомлены', async () => {
    const http = stubHttp(profile('r1', { video: true, 'video.live': true }), profile('r2', { video: false }));
    connectFeatureHttp(http);
    await loadFeatures();
    let notified = 0;
    const unsubscribe = subscribeFeatures(() => notified++);
    try {
      assert.equal(noteFeaturesRevision('r1'), false, 'та же ревизия — без запроса');
      assert.equal(noteFeaturesRevision(null), false);
      assert.equal(noteFeaturesRevision('r2'), true);
      await waitFor(() => featuresRevision() === 'r2');
      assert.ok(notified > 0);
      assert.equal(isFeatureOn('video'), false);
      assert.equal(isFeatureOn('video.live'), false);
      assert.equal(getFeatureSnapshot().changes, 1, 'состав изменился один раз');
    } finally {
      unsubscribe();
    }
  });

  test('та же ревизия без изменений состава — набор включённых функций прежний', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { video: true }), profile('r1', { video: true })));
    await loadFeatures();
    const before = getFeatureSnapshot().on;
    await refreshFeatures();
    assert.equal(getFeatureSnapshot().on, before);
    assert.equal(getFeatureSnapshot().changes, 0);
  });

  test('одну и ту же новую ревизию не перезапрашиваем чаще REVISION_RETRY_MS', async () => {
    const http = stubHttp(profile('r1', { video: true }), new Error('сбой'));
    connectFeatureHttp(http);
    await loadFeatures();
    assert.equal(noteFeaturesRevision('r2'), true);
    await waitFor(() => http.calls.length === 2 && !getFeatureSnapshot().pending);
    assert.equal(noteFeaturesRevision('r2'), false, `повтор — не раньше чем через ${REVISION_RETRY_MS} мс`);
    assert.equal(noteFeaturesRevision('r3'), true, 'другая ревизия — сразу');
  });

  test('сбой обновления сохраняет полученный профиль', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { video: true }), new Error('нет связи')));
    await loadFeatures();
    assert.equal(await refreshFeatures(), false);
    assert.equal(getFeatureSnapshot().status, 'ready');
    assert.equal(isFeatureOn('video'), true);
  });

  test('повтор после ошибки не возвращает прелоадер', async () => {
    const reply = deferred();
    connectFeatureHttp(stubHttp(new Error('нет связи'), reply));
    await loadFeatures();
    const retry = loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'error', 'приложение не прячется за прелоадер');
    assert.equal(getFeatureSnapshot().pending, true);
    reply.resolve(profile('r1', { orders: true }));
    assert.equal(await retry, true);
    assert.equal(getFeatureSnapshot().status, 'ready');
    assert.equal(isPathAllowed('/analytics'), true);
  });

  test('заголовок ревизии на ответе самого /api/features — один запрос, а не два', async () => {
    // Сервер ставит X-AWMS-Features и на /api/features; перехватчик Axios видит его раньше, чем хранилище — данные
    const calls: string[] = [];
    const http: FeatureHttp = {
      async get(url) {
        calls.push(url);
        noteFeaturesRevision('r1');
        return { data: profile('r1', { video: true }) };
      },
    };
    connectFeatureHttp(http);
    assert.equal(await loadFeatures(), true);
    await new Promise(resolve => setTimeout(resolve, REFRESH_DEBOUNCE_MS + 100));
    assert.equal(calls.length, 1);
    assert.equal(getFeatureSnapshot().pending, false);
  });

  test('ревизия сменилась, пока шёл запрос, — после ответа профиль перезапрошен', async () => {
    const replies = [profile('r1', { video: true }), profile('r2', { video: false })];
    const calls: string[] = [];
    const http: FeatureHttp = {
      async get(url) {
        calls.push(url);
        // Во время первого запроса пришёл ответ другого API уже с новой ревизией
        if (calls.length === 1) noteFeaturesRevision('r2');
        return { data: replies[Math.min(calls.length, replies.length) - 1] };
      },
    };
    connectFeatureHttp(http);
    await loadFeatures();
    assert.equal(featuresRevision(), 'r1');
    await waitFor(() => featuresRevision() === 'r2');
    assert.equal(calls.length, 2);
    assert.equal(isFeatureOn('video'), false);
  });

  test('профиль после сбоя загрузки — новый набор on: по нему вкладки перепроверяются в обе стороны', async () => {
    connectFeatureHttp(stubHttp(new Error('нет связи'), profile('r1', { orders: true })));
    await loadFeatures();
    const failed = getFeatureSnapshot();
    assert.equal(failed.status, 'error');
    assert.equal(isFeatureKnownOff('orders'), false, 'профиля нет — функция не выключена, а неизвестна');
    assert.equal(isFeatureOn('orders'), false, 'но и не показывается');
    await loadFeatures();
    const ready = getFeatureSnapshot();
    assert.notEqual(ready.on, failed.on, 'объект on сменился, хотя changes не вырос');
    assert.equal(ready.changes, 0);
    assert.equal(isFeatureKnownOff('orders'), false);
    assert.equal(isFeatureKnownOff('video'), true, 'профиль получен — ключа нет, значит выключено');
  });

  test('просмотренные уведомления хранятся в хранилище и сбрасываются при выходе', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { video: true }), profile('r2', { video: false })));
    await loadFeatures();
    await refreshFeatures();
    assert.equal(getFeatureSnapshot().changes, 1);
    assert.equal(getFeatureSnapshot().changesSeen, 0, 'уведомление «Состав изменён» видно');
    acknowledgeFeatureChanges();
    assert.equal(getFeatureSnapshot().changesSeen, 1, 'после «Понятно» (и после разблокировки экрана) не видно');
    acknowledgeFeatureChanges(5);
    assert.equal(getFeatureSnapshot().changesSeen, 1, 'больше, чем было изменений, не подтверждается');
    hidePresetNotice();
    assert.equal(getFeatureSnapshot().presetNoticeHidden, true);
    resetFeatures();
    assert.equal(getFeatureSnapshot().changesSeen, 0);
    assert.equal(getFeatureSnapshot().presetNoticeHidden, false, 'следующему пользователю плашка видна');
  });

  test('выход сбрасывает профиль; ответ, пришедший после выхода, не применяется', async () => {
    const reply = deferred();
    connectFeatureHttp(stubHttp(reply));
    const pending = loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'loading');
    resetFeatures();
    reply.resolve(profile('r1', { video: true }));
    assert.equal(await pending, false);
    assert.equal(getFeatureSnapshot().status, 'idle');
    assert.equal(isFeatureOn('video'), false);
    assert.equal(await refreshFeatures(), false, 'до входа обновлять нечего');
    assert.equal(noteFeaturesRevision('r1'), false);
  });
});

describe('живые обновления', () => {
  test('функция websocket выключена — соединения нет', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { websocket: false })));
    await loadFeatures();
    let received = 0;
    const connection = connectLiveUpdates({ name: 'тест', topics: { '/topic/stations/dynamic': () => received++ } });
    connection.close();
    connection.close();
    assert.equal(received, 0);
  });
});
