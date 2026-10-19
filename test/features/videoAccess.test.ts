// videoAccess.test.ts — политика видео «роль ∧ функция установки» (раздел 11.2 проекта, пакет F3).
// Хуки (useCanViewLive и др.) — тонкие обёртки над той же таблицей действий, что и videoAccessFor: проверяется
// функция и, по исходникам, что станции и карта берут политику отсюда, не подключая модуль видео.
import './browserWindow';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { videoAccessFor, type VideoAccess } from '../../src/services/features/videoAccess';
import { connectFeatureHttp, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import type { FeatureKey } from '../../src/services/features/catalog';
import { profile, stubHttp } from './helpers';

const VIDEO_KEYS = ['video', 'video.live', 'video.clips', 'video.recording', 'video.archive', 'video.download', 'video.cameras'] as const;

/** Состав «как в пресете full»: всё видео включено; overrides — что сервер прислал иначе */
const videoFeatures = (overrides: Partial<Record<(typeof VIDEO_KEYS)[number], boolean>> = {}) => ({
  ...Object.fromEntries(VIDEO_KEYS.map(key => [key, true])),
  ...overrides,
});

const NOTHING: VideoAccess = {
  viewLive: false,
  recordClips: false,
  setupCameras: false,
  sendEvents: false,
  viewArchive: false,
  downloadVideo: false,
};

const EVERYTHING: VideoAccess = {
  viewLive: true,
  recordClips: true,
  setupCameras: true,
  sendEvents: true,
  viewArchive: true,
  downloadVideo: true,
};

/** Загрузить профиль с заданными функциями в хранилище (как после входа) */
const loadProfile = async (features: Record<string, unknown>) => {
  connectFeatureHttp(stubHttp(profile('r1', features)));
  assert.equal(await loadFeatures(), true);
};

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('политика видео: роль', () => {
  const allOn = (key: FeatureKey) => key.startsWith('video');

  test('администратор и директор — всё, в том числе с префиксом ROLE_ и в нижнем регистре', () => {
    for (const role of ['ADMIN', 'DIRECTOR', 'ROLE_ADMIN', 'director', ' ROLE_DIRECTOR ']) {
      assert.deepEqual(videoAccessFor(role, allOn), EVERYTHING, role);
    }
  });

  test('остальные роли — только журнал, просмотр и скачивание записей', () => {
    for (const role of ['OPERATOR', 'STOREKEEPER', 'SECURITY', 'ROLE_OPERATOR', '', null, undefined]) {
      assert.deepEqual(
        videoAccessFor(role, allOn),
        { ...NOTHING, viewArchive: true, downloadVideo: true },
        String(role),
      );
    }
  });
});

describe('политика видео: функции установки', () => {
  test('профиль не загружен — ничего, даже у администратора', () => {
    assert.deepEqual(videoAccessFor('ADMIN'), NOTHING);
  });

  test('full — как раньше: администратору всё', async () => {
    await loadProfile(videoFeatures());
    assert.deepEqual(videoAccessFor('ADMIN'), EVERYTHING);
  });

  test('video.live выключен — нет живого видео даже у ADMIN, а с ним и записи фрагментов', async () => {
    await loadProfile(videoFeatures({ 'video.live': false }));
    const access = videoAccessFor('ADMIN');
    assert.equal(access.viewLive, false);
    assert.equal(access.recordClips, false, 'video.clips зависит от video.live');
    assert.equal(access.setupCameras, true);
    assert.equal(access.sendEvents, true);
    assert.equal(access.viewArchive, true);
    assert.equal(access.downloadVideo, true);
  });

  test('video.download выключен — нет скачивания и записи фрагментов (запись сохраняется скачиванием)', async () => {
    await loadProfile(videoFeatures({ 'video.download': false }));
    assert.deepEqual(videoAccessFor('ADMIN'), { ...EVERYTHING, downloadVideo: false, recordClips: false });
    assert.deepEqual(videoAccessFor('OPERATOR'), { ...NOTHING, viewArchive: true });
  });

  test('каждая подфункция закрывает только своё действие', async () => {
    const cases: Array<[(typeof VIDEO_KEYS)[number], keyof VideoAccess]> = [
      ['video.clips', 'recordClips'],
      ['video.cameras', 'setupCameras'],
      ['video.recording', 'sendEvents'],
      ['video.archive', 'viewArchive'],
    ];
    for (const [key, action] of cases) {
      resetFeatures();
      await loadProfile(videoFeatures({ [key]: false }));
      assert.deepEqual(videoAccessFor('DIRECTOR'), { ...EVERYTHING, [action]: false }, key);
    }
  });

  test('модуль video выключен — подфункции закрыты, даже если сервер прислал их включёнными', async () => {
    await loadProfile(videoFeatures({ video: false }));
    assert.deepEqual(videoAccessFor('ADMIN'), NOTHING);
  });

  test('ключей видео нет в ответе (изолированный минимум) — ничего', async () => {
    await loadProfile({ map: true, export: true });
    assert.deepEqual(videoAccessFor('ADMIN'), NOTHING);
  });
});

describe('исходники: политика вне модуля видео', () => {
  test('videoAccess.ts не тянет модуль видео и не содержит его адресов API (сигнатура verify-dist)', () => {
    const text = source('src/services/features/videoAccess.ts');
    assert.doesNotMatch(text, /from\s+['"][^'"]*VideoArchive/);
    assert.doesNotMatch(text, /\/api\/video\//);
    assert.doesNotMatch(text, /MediaSource|X-Video-Codec/);
  });

  test('страница станций: видео и карта — через lazyModules и политику, отсюда — только типы', () => {
    const text = source('src/components/StationsPage/StationsPage.tsx');
    const imports = text.match(/^import\s.+$/gm) ?? [];
    const moduleImports = imports.filter(l => /from '[^']*(VideoArchive|StationMap)\//.test(l));
    assert.ok(moduleImports.length > 0, 'типы модулей страница берёт');
    for (const line of moduleImports) {
      assert.match(line, /^import type /, line);
    }
    assert.match(text, /from '..\/..\/services\/features\/lazyModules'/);
    assert.match(text, /useCanViewLive\(\)/);
    assert.doesNotMatch(text, /\/api\/video\//);
  });

  test('сокет станций — только через общий клиент живых обновлений и при функции websocket', () => {
    const text = source('src/components/StationsPage/StationsPage.tsx');
    assert.doesNotMatch(text, /new WebSocket\(/);
    assert.doesNotMatch(text, /ws:\/\//);
    assert.doesNotMatch(text, /serverPort/);
    assert.match(text, /connectLiveUpdates\(/);
    assert.match(text, /useFeature\('websocket'\)/);
  });

  test('файлы модуля берут политику через VideoArchive/access.ts; useCanManageVideo — синоним живого просмотра', () => {
    const access = source('src/components/DocumentsPage/VideoArchive/access.ts');
    assert.match(access, /useCanViewLive as useCanManageVideo/);
    assert.match(access, /services\/features\/videoAccess/);
    assert.doesNotMatch(access, /isManagerRole|useIsManager/, 'роль без функции установки больше не решает');
  });
});
