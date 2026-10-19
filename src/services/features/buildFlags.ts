// buildFlags.ts — какие модули есть в этой сборке (вариант поставки, уровень L4). Функция модуля, которого нет
// в сборке, выключена, даже если сервер её разрешает: показывать нечего. Константы подставляет сборка
// (src/types/awms-build.d.ts); для условных импортов они читаются прямо у import() в lazyModules.ts.
import type { FeatureKey } from './catalog';

/** Модули, которые вариант поставки может исключить из сборки */
export const BUILD_MODULES = {
  video: __AWMS_HAS_VIDEO__,
  model3d: __AWMS_HAS_MODEL3D__,
  map: __AWMS_HAS_MAP__,
  graph: __AWMS_HAS_GRAPH__,
  orders: __AWMS_HAS_ORDERS__,
  websocket: __AWMS_HAS_WEBSOCKET__,
  pwa: __AWMS_HAS_PWA__,
  integrations: __AWMS_HAS_INTEGRATIONS__,
} as const;

export type BuildModule = keyof typeof BUILD_MODULES;

/** Функция → модуль сборки; функция покрывает и свои подфункции (video → video.live, video.archive, …) */
const FEATURE_MODULES: ReadonlyArray<readonly [FeatureKey, BuildModule]> = [
  ['video', 'video'],
  ['model3d', 'model3d'],
  ['map', 'map'],
  ['dashboards.graph', 'graph'],
  ['orders', 'orders'],
  ['websocket', 'websocket'],
  ['pwa', 'pwa'],
  ['integrations', 'integrations'],
  // gpp — флаг __AWMS_HAS_GPP__ добавит пакет F10
];

/** Модуль сборки, без которого функции нет; null — функция ядра или чисто серверная */
export const buildModuleOf = (key: FeatureKey): BuildModule | null => {
  for (const [root, module] of FEATURE_MODULES) {
    if (key === root || key.startsWith(root + '.')) return module;
  }
  return null;
};

/** Код функции есть в этой сборке */
export const inBuild = (key: FeatureKey): boolean => {
  const module = buildModuleOf(key);
  return module === null || BUILD_MODULES[module];
};
