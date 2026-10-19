// storagePurge.ts — удаление данных выключенных функций из браузера (localStorage и IndexedDB) при загрузке
// профиля: настройки и черновики модуля, который сервер выключил, не должны оставаться на общих ПК и ТСД.
// Серверные данные не трогаются. Удаляется только то, что выключено явно: сервер прислал false или модуля нет
// в сборке (и то же у родителя или зависимости). Ключ, которого в ответе нет (старый сервер, сбой разбора),
// данных не стирает: несохранённый черновик дороже лишней записи в localStorage.
// Флаги берутся уровня установки (поле installation ответа /api/features, без ролей): false «по роли» значит
// лишь, что функция закрыта этому пользователю, и не должен стирать на общем ПК данные других. Пока сервер
// поле не присылает, featureStore передаёт флаги пользователя — в шаблонах установки роли заданы только
// функциям без данных в браузере (export, video.archive), поэтому сейчас это различие не срабатывает.
import { FEATURE_REQUIRES, STORAGE_KEYS, featureParent, type FeatureKey } from './catalog';
import { inBuild } from './buildFlags';

type KeyStorage = Pick<Storage, 'length' | 'key' | 'removeItem'>;

export interface PurgeTargets {
  storage?: KeyStorage | null;
  indexedDb?: Pick<IDBFactory, 'deleteDatabase'> | null;
}

export interface PurgeResult {
  keys: string[];
  databases: string[];
}

/** Функция выключена явно: сервер прислал false или её модуля нет в сборке — у неё, родителя или зависимости */
export const isExplicitlyOff = (
  key: FeatureKey,
  features: Readonly<Record<string, unknown>>,
  inBuildFn: (key: FeatureKey) => boolean = inBuild,
): boolean => {
  if (!inBuildFn(key) || features[key] === false) return true;
  const parent = featureParent(key);
  if (parent !== null && isExplicitlyOff(parent, features, inBuildFn)) return true;
  return (FEATURE_REQUIRES[key] ?? []).some(dep => isExplicitlyOff(dep, features, inBuildFn));
};

const browserTargets = (): PurgeTargets => {
  const targets: PurgeTargets = {};
  // localStorage может быть недоступен (приватный режим, запрет данных сайта) — тогда чистить нечего
  try {
    targets.storage = typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    targets.storage = null;
  }
  targets.indexedDb = typeof indexedDB === 'undefined' ? null : indexedDB;
  return targets;
};

/**
 * Удаляет ключи localStorage и базы IndexedDB функций, выключенных в профиле `features` (ответ /api/features).
 * Возвращает удалённое — для тестов и отладки
 */
export const purgeDisabledFeatureStorage = (
  features: Readonly<Record<string, unknown>>,
  targets: PurgeTargets = browserTargets(),
  inBuildFn: (key: FeatureKey) => boolean = inBuild,
): PurgeResult => {
  const result: PurgeResult = { keys: [], databases: [] };
  const off = (Object.keys(STORAGE_KEYS) as FeatureKey[]).filter(key => isExplicitlyOff(key, features, inBuildFn));
  if (off.length === 0) return result;

  const patterns = off.flatMap(key => STORAGE_KEYS[key]?.local ?? []);
  const storage = targets.storage;
  if (storage && patterns.length > 0) {
    // Сначала собираем имена: удаление по ходу перебора сдвигает индексы
    const names: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const name = storage.key(i);
      if (name !== null) names.push(name);
    }
    for (const name of names) {
      if (!patterns.some(p => (typeof p === 'string' ? p === name : p.test(name)))) continue;
      try {
        storage.removeItem(name);
        result.keys.push(name);
      } catch {
        // не удалили — попробуем при следующей загрузке профиля
      }
    }
  }

  const idb = targets.indexedDb;
  if (idb) {
    for (const name of off.flatMap(key => STORAGE_KEYS[key]?.indexedDb ?? [])) {
      try {
        // Удаление несуществующей базы — не ошибка; открытая в другой вкладке база удалится после её закрытия
        idb.deleteDatabase(name);
        result.databases.push(name);
      } catch {
        // IndexedDB запрещён — данных в нём и нет
      }
    }
  }
  return result;
};
