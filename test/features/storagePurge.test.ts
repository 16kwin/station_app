// storagePurge.test.ts — удаление данных выключенных функций из браузера (раздел 11.2 проекта).
import { afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { isExplicitlyOff, purgeDisabledFeatureStorage } from '../../src/services/features/storagePurge';
import { buildModuleOf } from '../../src/services/features/buildFlags';
import type { FeatureKey } from '../../src/services/features/catalog';
import { connectFeatureHttp, isFeatureOn, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { profile, stubHttp } from './helpers';

/** localStorage в памяти: только то, что использует очистка */
const memoryStorage = (keys: string[], failOn: string[] = []) => {
  const items = new Map(keys.map(key => [key, '1']));
  return {
    items,
    get length() {
      return items.size;
    },
    key: (index: number) => [...items.keys()][index] ?? null,
    removeItem: (key: string) => {
      if (failOn.includes(key)) throw new Error('запрещено');
      items.delete(key);
    },
  };
};

const memoryIndexedDb = () => {
  const deleted: string[] = [];
  return {
    deleted,
    deleteDatabase: (name: string) => {
      deleted.push(name);
      return {} as IDBOpenDBRequest;
    },
  };
};

const ALL_KEYS = [
  'stationsMapState',
  'stationsMapTree',
  'awms.model3d.upAxis.42',
  'awms.purchaseGraph.settings.v1',
  'awms.purchaseGraph.favorites.v1',
  'awms.gpp.settings.v1',
  'awms.pwa.installDismissedAt',
  'nomenclature_draft_1_tab',
  'supplier_draft_2',
  'manufacturer_draft_3',
  // ядро — не трогается никогда
  'tabs_state',
  'drafts_state',
  'app_locked_state',
  'app_login_event',
];

describe('очистка хранилища браузера', () => {
  test('удаляются только ключи и базы выключенных функций', () => {
    const storage = memoryStorage(ALL_KEYS);
    const indexedDb = memoryIndexedDb();
    const result = purgeDisabledFeatureStorage(
      { map: false, model3d: true, dashboards: true, 'dashboards.audit': true, 'dashboards.graph': false, gpp: true, pwa: true, drafts: false },
      { storage, indexedDb },
    );
    assert.deepEqual(result.keys.sort(), [
      'awms.purchaseGraph.favorites.v1',
      'awms.purchaseGraph.settings.v1',
      'manufacturer_draft_3',
      'nomenclature_draft_1_tab',
      'stationsMapState',
      'stationsMapTree',
      'supplier_draft_2',
    ]);
    assert.deepEqual([...storage.items.keys()].sort(), [
      'app_locked_state',
      'app_login_event',
      'awms.gpp.settings.v1',
      'awms.model3d.upAxis.42',
      'awms.pwa.installDismissedAt',
      'drafts_state',
      'tabs_state',
    ]);
    assert.deepEqual(indexedDb.deleted.sort(), ['nomenclature_drafts_db', 'supplier_drafts_db']);
  });

  test('ключ, которого нет в ответе сервера, данных не стирает', () => {
    const storage = memoryStorage(ALL_KEYS);
    const indexedDb = memoryIndexedDb();
    const result = purgeDisabledFeatureStorage({}, { storage, indexedDb });
    assert.deepEqual(result, { keys: [], databases: [] });
    assert.equal(storage.items.size, ALL_KEYS.length);
  });

  test('выключен родитель или зависимость — данные функции удаляются', () => {
    assert.equal(isExplicitlyOff('dashboards.graph', { dashboards: false, 'dashboards.graph': true }), true);
    assert.equal(isExplicitlyOff('dashboards.graph', { dashboards: true, 'dashboards.audit': false, 'dashboards.graph': true }), true);
    assert.equal(isExplicitlyOff('dashboards.graph', { dashboards: true, 'dashboards.audit': true, 'dashboards.graph': true }), false);
    assert.equal(isExplicitlyOff('dashboards.graph', { 'dashboards.graph': true }), false, 'нет ключей родителя — не явно');
  });

  test('модуля нет в сборке — данные удаляются, даже если сервер функцию разрешает', () => {
    const storage = memoryStorage(ALL_KEYS);
    const withoutModel3d = (key: FeatureKey) => buildModuleOf(key) !== 'model3d';
    const result = purgeDisabledFeatureStorage({ model3d: true }, { storage, indexedDb: null }, withoutModel3d);
    assert.deepEqual(result.keys, ['awms.model3d.upAxis.42']);
  });

  test('хранилище недоступно или запрещает удаление — без ошибок', () => {
    assert.deepEqual(purgeDisabledFeatureStorage({ drafts: false }, { storage: null, indexedDb: null }), { keys: [], databases: [] });
    const storage = memoryStorage(['supplier_draft_1', 'supplier_draft_2'], ['supplier_draft_1']);
    const result = purgeDisabledFeatureStorage({ drafts: false }, { storage, indexedDb: null });
    assert.deepEqual(result.keys, ['supplier_draft_2']);
  });
});

describe('очистка при загрузке профиля', () => {
  const browser = globalThis as { localStorage?: unknown };
  afterEach(() => {
    resetFeatures();
    connectFeatureHttp(null);
    mock.restoreAll();
    delete browser.localStorage;
  });

  test('чистится по состоянию установки (installation), а не по флагам пользователя', async () => {
    // Пользователю без роли gpp и drafts закрыты, но на установке включены: данные других пользователей
    // общего ПК остаются. model3d выключен на установке — его данные удаляются
    const storage = memoryStorage(['awms.gpp.settings.v1', 'nomenclature_draft_1_tab', 'awms.model3d.upAxis.42', 'tabs_state']);
    browser.localStorage = storage;
    connectFeatureHttp(
      stubHttp(profile('r1', { gpp: false, drafts: false, model3d: false }, { installation: { gpp: true, drafts: true, model3d: false } })),
    );
    assert.equal(await loadFeatures(), true);
    assert.equal(isFeatureOn('gpp'), false, 'показ — по флагам пользователя');
    assert.deepEqual([...storage.items.keys()].sort(), ['awms.gpp.settings.v1', 'nomenclature_draft_1_tab', 'tabs_state']);
  });

  test('сервер без поля installation — чистится по флагам пользователя, как раньше', async () => {
    const storage = memoryStorage(['awms.gpp.settings.v1', 'nomenclature_draft_1_tab', 'tabs_state']);
    browser.localStorage = storage;
    connectFeatureHttp(stubHttp(profile('r1', { gpp: false, drafts: true })));
    assert.equal(await loadFeatures(), true);
    assert.deepEqual([...storage.items.keys()].sort(), ['nomenclature_draft_1_tab', 'tabs_state']);
  });
});
