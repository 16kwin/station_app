// catalog.ts — каталог функций установки для интерфейса (раздел 4.2 проекта «Дискретное отключение функций»).
// Ключи совпадают с реестром сервера (Feature.java): сегменты [a-z0-9]+ через точку, вложенность — родитель
// (video.live → video). Состояние присылает сервер (GET /api/features); ключ, которого здесь нет, интерфейс
// не знает и не показывает, ключ, которого нет в ответе сервера, — выключен.

export const FEATURE_KEYS = [
  // Видео с IP-камер
  'video',
  'video.live',
  'video.clips',
  'video.recording',
  'video.archive',
  'video.download',
  'video.cameras',
  // Карта станций и план цеха
  'map',
  'map.plan',
  'map.edit',
  // 3D-модели номенклатуры
  'model3d',
  'model3d.upload',
  // ГПП — график подготовки производства
  'gpp',
  // Информационные панели главной
  'dashboards',
  'dashboards.economic',
  'dashboards.audit',
  'dashboards.graph',
  'dashboards.screen',
  // Заказы и ТКП, живые обновления
  'orders',
  'websocket',
  // Выгрузки, загрузки файлов, вкладки «Интеграции»
  'export',
  'uploads',
  'integrations',
  // Только в браузере: установка как приложение, сохранение пароля, черновики, заглушки разделов
  'pwa',
  'passwords',
  'drafts',
  'stubs',
  // Только на сервере: интерфейс их не проверяет, ключи здесь — для сверки с реестром сервера
  'anonymous',
  'testsync',
  'legacy',
  'photoimport',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

const KEY_SET: ReadonlySet<string> = new Set(FEATURE_KEYS);

export const isFeatureKey = (key: string): key is FeatureKey => KEY_SET.has(key);

/** Родитель функции по ключу: video.live → video; у функции верхнего уровня — null */
export const featureParent = (key: FeatureKey): FeatureKey | null => {
  const dot = key.lastIndexOf('.');
  if (dot < 0) return null;
  const parent = key.slice(0, dot);
  return isFeatureKey(parent) ? parent : null;
};

/**
 * Зависимости помимо родителя (столбец «Зависит от» таблицы 4.2). Сервер уже учитывает их в ответе;
 * здесь они нужны, чтобы исключённое из сборки выключало и зависящие функции, и для каскада в интерфейсе
 */
export const FEATURE_REQUIRES: Readonly<Partial<Record<FeatureKey, readonly FeatureKey[]>>> = {
  'video.clips': ['video.live', 'video.download'],
  'map.edit': ['map.plan'],
  'model3d.upload': ['uploads'],
  'dashboards.graph': ['dashboards.audit'],
};

/** Флаги, которые нужны до входа: их отдаёт анонимный GET /api/features/public */
export const PUBLIC_FEATURE_KEYS = ['pwa', 'passwords'] as const satisfies readonly FeatureKey[];

export type PublicFeatureKey = (typeof PUBLIC_FEATURE_KEYS)[number];

/** Что функция хранит в браузере: ключи localStorage (точное имя или шаблон) и базы IndexedDB */
export interface FeatureStorage {
  local?: ReadonlyArray<string | RegExp>;
  indexedDb?: readonly string[];
}

/**
 * Данные функций в браузере. Когда сервер выключил функцию, storagePurge удаляет их при загрузке профиля:
 * настройки и черновики выключенного модуля не должны оставаться на общих ПК и ТСД. Серверные данные не трогаются
 */
export const STORAGE_KEYS: Readonly<Partial<Record<FeatureKey, FeatureStorage>>> = {
  // StationMapView.tsx, StationTree.tsx
  map: { local: ['stationsMapState', 'stationsMapTree'] },
  // ModelViewer.tsx: awms.model3d.upAxis.<модель>
  model3d: { local: [/^awms\.model3d\./] },
  // purchaseGraph/settings.ts
  'dashboards.graph': { local: [/^awms\.purchaseGraph\./] },
  // Gpp/settings.ts
  gpp: { local: [/^awms\.gpp\./] },
  // Pwa/InstallPrompt.tsx: отказ от установки, подсказка iOS
  pwa: { local: [/^awms\.pwa\./] },
  // Черновики карточек: nomenclature_draft_*, supplier_draft_*, manufacturer_draft_* и базы IndexedDB
  drafts: { local: [/_draft_/], indexedDb: ['nomenclature_drafts_db', 'supplier_drafts_db'] },
};
