// routes.test.ts — разделы и адреса API функций, покрытие разделов вкладок (раздел 11.2 проекта).
import { afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_CHILD_ROUTES,
  CORE_ROUTES,
  NOT_FOUND_REFRESH_MS,
  ROUTE_FEATURES,
  featureForApiUrl,
  featureForPath,
  isCoreRoute,
  isPathAllowed,
  isPathKnownOff,
  noteApiNotFound,
} from '../../src/services/features/routes';
import {
  TAB_CHILD_PREFIXES,
  TAB_SECTIONS,
  TAB_UID_SECTIONS,
  childTabPrefixOf,
  isChildTabPath,
  isTabSection,
  tabPathname,
  uidTabSectionOf,
} from '../../src/layouts/tabRoutes';
import {
  REFRESH_DEBOUNCE_MS,
  connectFeatureHttp,
  getFeatureSnapshot,
  loadFeatures,
  resetFeatures,
} from '../../src/services/features/featureStore';
import { isFeatureKey, type FeatureKey } from '../../src/services/features/catalog';
import { profile, stubHttp } from './helpers';

afterEach(() => {
  mock.timers.reset();
  mock.restoreAll();
  resetFeatures();
  connectFeatureHttp(null);
});

/**
 * Все пути, которые MainLayout открывает во вкладках: разделы, карточки (префикс + uid и код), заказ и ТКП по uid.
 * Списки — из tabRoutes.ts, по ним же типизированы таблицы компонентов MainLayout: новый раздел без решения
 * «ядро или функция» уронит тест
 */
const MAIN_LAYOUT_PATHS = [
  ...TAB_SECTIONS,
  ...TAB_CHILD_PREFIXES.map(prefix => prefix + 'uid-1/code-1'),
  ...TAB_UID_SECTIONS.map(section => section + '/uid-1'),
];

/** Пути функций вне вкладок: отдельные вкладки браузера (App.tsx) и бывший битый пункт меню (редирект на /main) */
const NOT_TAB_FEATURE_PATHS = ['/screen/events', '/screen/purchase-graph', '/notifications'];

describe('разделы интерфейса', () => {
  test('функция раздела: путь, подпути, параметры, завершающая косая черта', () => {
    assert.equal(featureForPath('/orders'), 'orders');
    assert.equal(featureForPath('/orders/create/abc'), 'orders');
    assert.equal(featureForPath('/tkp/abc?tab=1'), 'orders');
    assert.equal(featureForPath('/analytics/'), 'orders');
    assert.equal(featureForPath('/documents/video-archive#top'), 'video.archive');
    assert.equal(featureForPath('/screen/purchase-graph'), 'dashboards.graph');
    assert.equal(featureForPath('/screen/events?source=quality'), 'dashboards.screen');
    assert.equal(featureForPath('/notifications'), 'stubs');
    assert.equal(featureForPath('/ordersx'), null, 'совпадение только по целому сегменту');
    assert.equal(featureForPath('/documents'), null);
    assert.equal(featureForPath('/main'), null);
  });

  test('раздел открывается: ядро всегда, функция — только включённая', () => {
    const only = (...keys: FeatureKey[]) => (key: FeatureKey) => keys.includes(key);
    assert.equal(isPathAllowed('/stations', only()), true);
    assert.equal(isPathAllowed('/orders/1', only()), false);
    assert.equal(isPathAllowed('/orders/1', only('orders')), true);
    assert.equal(isPathAllowed('/documents/gpp', only('orders')), false);
  });

  test('сохранённую вкладку отбрасывает только точно выключенная функция, а не сбой профиля', async () => {
    mock.method(console, 'warn', () => {});
    connectFeatureHttp(stubHttp(new Error('нет связи'), profile('r1', { orders: true, video: true, 'video.archive': false })));
    await loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'error');
    for (const path of ['/orders/1', '/documents/video-archive', '/documents/gpp', '/stations']) {
      assert.equal(isPathKnownOff(path), false, `${path}: профиль не получен — вкладку не отбрасываем`);
    }
    assert.equal(isPathAllowed('/orders/1'), false, 'но и раздел не показываем');

    await loadFeatures();
    assert.equal(isPathKnownOff('/orders/1'), false);
    assert.equal(isPathAllowed('/orders/1'), true, 'профиль пришёл — вкладка получает свой раздел');
    assert.equal(isPathKnownOff('/documents/video-archive'), true, 'выключено явно');
    assert.equal(isPathKnownOff('/documents/gpp'), true, 'ключа нет в ответе — выключено');
    assert.equal(isPathKnownOff('/stations'), false, 'ядро');
  });

  test('каждый раздел вкладок — либо ядро, либо функция, но не то и другое', () => {
    for (const path of MAIN_LAYOUT_PATHS) {
      const feature = featureForPath(path);
      const core = isCoreRoute(path);
      assert.ok(feature !== null || core, `${path}: не отнесён ни к ядру, ни к функции`);
      assert.ok(!(feature !== null && core), `${path}: и ядро, и функция ${feature}`);
    }
  });

  test('списки разделов согласованы с каталогом', () => {
    for (const [path, feature] of ROUTE_FEATURES) {
      assert.ok(isFeatureKey(feature), `${path}: неизвестная функция ${feature}`);
      assert.equal(isCoreRoute(path), false, `${path} есть и в ядре`);
    }
    assert.equal(new Set(CORE_ROUTES).size, CORE_ROUTES.length, 'повтор в CORE_ROUTES');
    assert.ok(isCoreRoute('/security'), 'страница «Безопасность» — ядро (раздел 4.4)');
  });

  test('списки ядра и функций не ссылаются на разделы, которых нет во вкладках', () => {
    for (const path of CORE_ROUTES) {
      assert.ok(isTabSection(path), `${path} в CORE_ROUTES, но MainLayout такого раздела не открывает`);
    }
    for (const path of CORE_CHILD_ROUTES) {
      assert.ok(
        (TAB_CHILD_PREFIXES as readonly string[]).includes(path + '/'),
        `${path} в CORE_CHILD_ROUTES, но MainLayout такой карточки не открывает`,
      );
    }
    for (const [path] of ROUTE_FEATURES) {
      assert.ok(isTabSection(path) || NOT_TAB_FEATURE_PATHS.includes(path), `${path} в ROUTE_FEATURES, но такого раздела нет`);
    }
  });

  test('во вкладках нет повторов, «Безопасность» — раздел вкладок', () => {
    assert.equal(new Set(TAB_SECTIONS).size, TAB_SECTIONS.length, 'повтор в TAB_SECTIONS');
    assert.equal(new Set(TAB_CHILD_PREFIXES).size, TAB_CHILD_PREFIXES.length, 'повтор в TAB_CHILD_PREFIXES');
    assert.ok(isTabSection('/security'));
    for (const prefix of TAB_CHILD_PREFIXES) assert.ok(prefix.endsWith('/'), `${prefix}: префикс карточки — до косой черты включительно`);
  });
});

describe('пути вкладок MainLayout', () => {
  test('раздел — точный путь без параметров', () => {
    assert.equal(tabPathname('/stations?view=map#top'), '/stations');
    assert.equal(tabPathname('/documents/schablon/abc?from=refill'), '/documents/schablon/abc');
    assert.ok(isTabSection('/documents/gpp'));
    assert.equal(isTabSection('/documents/gpp/1'), false);
    assert.equal(isTabSection('/documents/'), false);
  });

  test('карточка — по префиксу, заказ и ТКП — ровно один сегмент uid', () => {
    assert.equal(childTabPrefixOf('/references/nomenclature/edit/u1/c1'), '/references/nomenclature/edit/');
    assert.equal(childTabPrefixOf('/references/stations/create/u1'), '/references/stations/create/');
    assert.equal(childTabPrefixOf('/references/station-models/create/u1'), '/references/station-models/create/');
    assert.equal(childTabPrefixOf('/documents/refill'), null, 'раздел, а не карточка');
    assert.equal(childTabPrefixOf('/orders/create/u1'), '/orders/create/');

    assert.equal(uidTabSectionOf('/orders/u1'), '/orders');
    assert.equal(uidTabSectionOf('/tkp/u1'), '/tkp');
    assert.equal(uidTabSectionOf('/orders'), null);
    assert.equal(uidTabSectionOf('/orders/'), null);
    assert.equal(uidTabSectionOf('/orders/create/u1'), null, 'два сегмента — это карточка нового заказа');
    assert.equal(uidTabSectionOf('/ordersx/u1'), null);
    assert.equal(uidTabSectionOf('/tkpx'), null);
  });

  test('карточки открываются из активной вкладки, разделы — сами по себе', () => {
    for (const path of ['/references/suppliers/edit/u1', '/documents/schablon/u1', '/orders/create/u1', '/orders/u1', '/tkp/u1']) {
      assert.ok(isChildTabPath(path), path);
    }
    for (const path of ['/orders', '/tkp', '/documents/stock-level-control', '/main', '/security']) {
      assert.equal(isChildTabPath(path), false, path);
    }
  });

  test('пути кнопок раздела «Документы»: видеоархив и ГПП открываются только при включённых функциях', () => {
    const only = (...keys: FeatureKey[]) => (key: FeatureKey) => keys.includes(key);
    const core = ['/references/templates', '/documents/stock-level-control', '/documents/refill'];
    for (const path of core) assert.ok(isTabSection(path) && isPathAllowed(path, only()), `${path} — ядро`);
    assert.equal(isPathAllowed('/documents/video-archive', only('video')), false, 'видео без архива');
    assert.equal(isPathAllowed('/documents/video-archive', only('video', 'video.archive')), true);
    assert.equal(isPathAllowed('/documents/gpp', only()), false);
    assert.equal(isPathAllowed('/documents/gpp', only('gpp')), true);
  });
});

describe('адреса API функций', () => {
  test('адрес относится к функции', () => {
    assert.equal(featureForApiUrl('/api/video/status'), 'video');
    assert.equal(featureForApiUrl('http://localhost/api/video/records?page=2'), 'video');
    assert.equal(featureForApiUrl('/api/station-plans/workshops/1/image'), 'map.plan');
    assert.equal(featureForApiUrl('/api/nomenclature/models/3d/5/source'), 'model3d');
    assert.equal(featureForApiUrl('/api/nomenclature/abc/models'), 'model3d');
    assert.equal(featureForApiUrl('/api/nomenclature/abc/integrations'), 'integrations');
    assert.equal(featureForApiUrl('/api/suppliers/integrations/log'), 'integrations');
    assert.equal(featureForApiUrl('/api/orders'), 'orders');
    assert.equal(featureForApiUrl('/api/tkp/active'), 'orders');
    assert.equal(featureForApiUrl('/api/dashboard/stats'), 'dashboards');
    assert.equal(featureForApiUrl('/api/gpp/plans'), 'gpp');
    assert.equal(featureForApiUrl('/api/templates/export-pdf'), 'export');
    assert.equal(featureForApiUrl('https://example.org:8443/api/nomenclature/items/export-excel'), 'export');
  });

  test('адреса ядра функции не принадлежат', () => {
    assert.equal(featureForApiUrl('/api/nomenclature/models'), null, 'справочник моделей — ядро');
    assert.equal(featureForApiUrl('/api/nomenclature/models/12'), null);
    assert.equal(featureForApiUrl('/api/stations/static'), null);
    assert.equal(featureForApiUrl('/api/ordersx'), null);
    assert.equal(featureForApiUrl('/api/auth/check_auth'), null);
    assert.equal(featureForApiUrl('/api/features'), null);
  });

  test('404 функции перезапрашивает профиль, но не чаще NOT_FOUND_REFRESH_MS', async () => {
    assert.equal(noteApiNotFound('/api/video/status'), false, 'до входа профиля нет');
    const http = stubHttp(profile('r1', { video: true }));
    connectFeatureHttp(http);
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
    await loadFeatures();
    assert.equal(noteApiNotFound('/api/stations/static'), false, 'адрес ядра');
    assert.equal(noteApiNotFound('/api/video/status'), false, 'профиль только что получен');
    mock.timers.setTime(1_000_000 + NOT_FOUND_REFRESH_MS + 1);
    assert.equal(noteApiNotFound('/api/video/status'), true);
  });

  test('после неудачного обновления 404 опроса не превращается в опрос профиля', async () => {
    mock.method(console, 'warn', () => {});
    const http = stubHttp(profile('r1', { video: true }), new Error('500'));
    connectFeatureHttp(http);
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
    await loadFeatures();
    const failedAt = 1_000_000 + NOT_FOUND_REFRESH_MS + 1;
    mock.timers.setTime(failedAt);
    assert.equal(noteApiNotFound('/api/video/status'), true);
    // Часы Date заморожены, поэтому waitFor (он отсчитывает время по Date) здесь не годится — ждём антидребезг
    await new Promise(resolve => setTimeout(resolve, REFRESH_DEBOUNCE_MS + 100));
    assert.equal(http.calls.length, 2);
    assert.equal(getFeatureSnapshot().pending, false);
    assert.equal(getFeatureSnapshot().status, 'ready', 'прежний профиль остался');

    // Опрос /api/video/status раз в 2,5 с: отсчёт — от неудачной попытки, а не от последнего успеха
    for (let poll = 1; poll <= 5; poll++) {
      mock.timers.setTime(failedAt + poll * 2_500);
      assert.equal(noteApiNotFound('/api/video/status'), false, `опрос ${poll}`);
    }
    await new Promise(resolve => setTimeout(resolve, REFRESH_DEBOUNCE_MS + 50));
    assert.equal(http.calls.length, 2, 'лишних запросов профиля нет');
    mock.timers.setTime(failedAt + NOT_FOUND_REFRESH_MS + 1);
    assert.equal(noteApiNotFound('/api/video/status'), true);
  });
});
