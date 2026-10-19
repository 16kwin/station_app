// catalog.test.ts — контракт каталога функций интерфейса: ключи, родители, зависимости, модули сборки,
// сверка с реестром сервера (feature-keys.txt пакета B1), если он есть рядом.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FEATURE_KEYS,
  FEATURE_REQUIRES,
  PUBLIC_FEATURE_KEYS,
  STORAGE_KEYS,
  featureParent,
  isFeatureKey,
  type FeatureKey,
} from '../../src/services/features/catalog';
import { BUILD_MODULES, buildModuleOf, inBuild } from '../../src/services/features/buildFlags';

const KEY_FORMAT = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

/** Список ключей реестра сервера (тест FeatureCatalogContractTest пакета B1) — в соседнем репозитории бэкенда */
const BACKEND_KEYS_FILE = resolve(process.cwd(), '../../Back/dinamika_back/src/test/resources/feature-keys.txt');

describe('каталог функций', () => {
  test('ключи уникальны и записаны сегментами [a-z0-9]+ через точку', () => {
    assert.equal(new Set(FEATURE_KEYS).size, FEATURE_KEYS.length);
    for (const key of FEATURE_KEYS) assert.match(key, KEY_FORMAT);
  });

  test('у вложенного ключа есть родитель в каталоге', () => {
    for (const key of FEATURE_KEYS) {
      if (key.includes('.')) assert.notEqual(featureParent(key), null, `${key}: нет родителя`);
      else assert.equal(featureParent(key), null);
    }
    assert.equal(featureParent('video.live'), 'video');
  });

  test('зависимости существуют и не образуют циклов', () => {
    const visiting = new Set<FeatureKey>();
    const done = new Set<FeatureKey>();
    const visit = (key: FeatureKey) => {
      if (done.has(key)) return;
      assert.ok(!visiting.has(key), `цикл через ${key}`);
      visiting.add(key);
      const parent = featureParent(key);
      for (const dep of [...(parent ? [parent] : []), ...(FEATURE_REQUIRES[key] ?? [])]) {
        assert.ok(isFeatureKey(dep), `${key} зависит от неизвестного ${dep}`);
        visit(dep);
      }
      visiting.delete(key);
      done.add(key);
    };
    FEATURE_KEYS.forEach(visit);
  });

  test('ключи данных браузера и публичные флаги — из каталога', () => {
    for (const key of Object.keys(STORAGE_KEYS)) assert.ok(isFeatureKey(key), key);
    for (const key of PUBLIC_FEATURE_KEYS) assert.ok(isFeatureKey(key), key);
  });

  test('модуль сборки покрывает функцию и её подфункции', () => {
    assert.equal(buildModuleOf('video'), 'video');
    assert.equal(buildModuleOf('video.archive'), 'video');
    assert.equal(buildModuleOf('map.edit'), 'map');
    assert.equal(buildModuleOf('dashboards.graph'), 'graph');
    assert.equal(buildModuleOf('dashboards'), null, 'панели — не модуль сборки');
    assert.equal(buildModuleOf('uploads'), null);
    // В тестах, как и в vite.config.ts до пакета F7, в сборке все модули
    assert.ok(Object.values(BUILD_MODULES).every(Boolean));
    assert.ok(FEATURE_KEYS.every(inBuild));
  });

  test('каталог интерфейса совпадает с реестром сервера', t => {
    if (!existsSync(BACKEND_KEYS_FILE)) {
      t.skip('feature-keys.txt бэкенда не найден рядом — сверка при сквозной проверке V2');
      return;
    }
    const backend = new Set(
      readFileSync(BACKEND_KEYS_FILE, 'utf8')
        .split(/\r?\n/)
        .map(line => line.replace(/#.*$/, '').trim().split(/[\s;,=]+/)[0])
        .filter(key => key && KEY_FORMAT.test(key)),
    );
    const missing = FEATURE_KEYS.filter(key => !backend.has(key));
    assert.deepEqual(missing, [], 'ключи интерфейса, которых нет в реестре сервера');
  });
});
