// routes.ts — какие разделы интерфейса и какие адреса API принадлежат функциям (раздел 8.1 проекта).
// Раздел выключенной функции не открывается: вкладка показывает «Раздел недоступен», сохранённая вкладка
// не восстанавливается. 404 от API функции — повод перезапросить профиль: функцию могли выключить на ходу.
import type { FeatureKey } from './catalog';
import { isFeatureKnownOff, isFeatureOn, refreshFeatures, getFeatureSnapshot } from './featureStore';

/**
 * Разделы функций: путь раздела и все его подпути (/orders → /orders/create/…, /orders/<uid>).
 * Пути, которых здесь нет, — ядро
 */
export const ROUTE_FEATURES: ReadonlyArray<readonly [path: string, feature: FeatureKey]> = [
  ['/documents/video-archive', 'video.archive'],
  ['/documents/gpp', 'gpp'],
  ['/analytics', 'orders'],
  ['/orders', 'orders'],
  ['/tkp', 'orders'],
  ['/screen/events', 'dashboards.screen'],
  ['/screen/purchase-graph', 'dashboards.graph'],
  ['/reports', 'stubs'],
  ['/settings', 'stubs'],
  ['/notifications', 'stubs'],
];

/**
 * Разделы ядра (раздел 4.4 проекта) — работают при любом составе функций; путь сравнивается целиком.
 * Вместе с ROUTE_FEATURES это полный список разделов вкладок: новый раздел нужно явно отнести к ядру
 * или к функции (тест покрытия routes.test.ts)
 */
export const CORE_ROUTES: readonly string[] = [
  '/main',
  '/stations',
  '/references',
  '/documents',
  '/account',
  '/security',
  '/references/nomenclature',
  '/references/templates',
  '/references/accounting-groups',
  '/references/nomenclature-groups',
  '/references/nomenclature-types',
  '/references/attribute-groups',
  '/references/attribute-types',
  '/references/units',
  '/references/nomenclature-units',
  '/references/production-directions',
  '/references/manufacturers',
  '/references/brands',
  '/references/models',
  '/references/supplier-directions',
  '/references/supplier-brands',
  '/references/suppliers',
  '/references/countries',
  '/references/holdings',
  '/references/enterprises',
  '/references/workshops',
  '/references/sections',
  '/references/employees',
  '/references/station-types',
  '/references/station-manufacturers',
  '/references/station-models',
  '/references/station-configurations',
  '/references/stations',
  '/references/locations',
  '/documents/stock-level-control',
  '/documents/refill',
  '/documents/move-orders',
];

/** Карточки и документы ядра: путь и все его подпути (как isChildPath в MainLayout, без заказов и ТКП) */
export const CORE_CHILD_ROUTES: readonly string[] = [
  '/references/nomenclature/create',
  '/references/nomenclature/edit',
  '/references/suppliers/create',
  '/references/suppliers/edit',
  '/references/manufacturers/create',
  '/references/manufacturers/edit',
  '/references/station-models/create',
  '/references/station-models/edit',
  '/references/station-configurations/create',
  '/references/station-configurations/edit',
  '/references/stations/create',
  '/references/stations/edit',
  '/documents/schablon',
  '/documents/stock-level-control/create',
  '/documents/stock-level-control/edit',
  '/documents/refill/create',
  '/documents/refill/edit',
  '/documents/move-orders/create',
  '/documents/move-orders/edit',
];

/** Путь без адреса сервера, параметров, якоря и завершающей косой черты */
const pathOf = (url: string): string => {
  const path = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '').replace(/[?#].*$/, '');
  return path.length > 1 ? path.replace(/\/+$/, '') : path || '/';
};

const startsWithSegment = (path: string, prefix: string): boolean => path === prefix || path.startsWith(prefix + '/');

/** Функция раздела интерфейса; null — раздел ядра */
export const featureForPath = (path: string): FeatureKey | null => {
  const clean = pathOf(path);
  for (const [prefix, feature] of ROUTE_FEATURES) {
    if (startsWithSegment(clean, prefix)) return feature;
  }
  return null;
};

/** Раздел ядра или карточка ядра */
export const isCoreRoute = (path: string): boolean => {
  const clean = pathOf(path);
  return CORE_ROUTES.includes(clean) || CORE_CHILD_ROUTES.some(prefix => startsWithSegment(clean, prefix));
};

/** Раздел можно открыть: ядро или включённая функция */
export const isPathAllowed = (path: string, isOn: (key: FeatureKey) => boolean = isFeatureOn): boolean => {
  const feature = featureForPath(path);
  return feature === null || isOn(feature);
};

/**
 * Раздел точно закрыт: профиль получен и функция раздела в нём выключена, или её модуля нет в сборке.
 * Только по нему сохранённая вкладка отбрасывается при восстановлении. Пока профиль не получен (прежний
 * сервер, сбой при загрузке страницы), функция не выключена, а неизвестна: вкладка остаётся, а интерфейс
 * работает как до выключателей (featureStore); когда профиль придёт, перепроверка вкладок применит его
 */
export const isPathKnownOff = (path: string): boolean => {
  const feature = featureForPath(path);
  return feature !== null && isFeatureKnownOff(feature);
};

// ---------- Адреса API функций ----------

/**
 * Шаблоны адресов API функций — как правила ворот сервера (`*` — один сегмент, `**` — любое число сегментов).
 * Строки модулей, которые вариант поставки исключает, стоят под флагами сборки: в сборке без модуля их нет
 * (по ним verify-dist ищет следы модуля)
 */
const FEATURE_API: ReadonlyArray<readonly [pattern: string, feature: FeatureKey]> = [
  ...(__AWMS_HAS_VIDEO__ ? ([['/api/video/**', 'video']] as const) : []),
  ...(__AWMS_HAS_MAP__ ? ([['/api/station-plans/**', 'map.plan']] as const) : []),
  ...(__AWMS_HAS_MODEL3D__
    ? ([
        ['/api/nomenclature/models/3d/**', 'model3d'],
        ['/api/nomenclature/*/models/**', 'model3d'],
      ] as const)
    : []),
  ...(__AWMS_HAS_ORDERS__
    ? ([
        ['/api/orders/**', 'orders'],
        ['/api/tkp/**', 'orders'],
      ] as const)
    : []),
  ...(__AWMS_HAS_INTEGRATIONS__
    ? ([
        ['/api/nomenclature/*/integrations/**', 'integrations'],
        ['/api/nomenclature/integrations/**', 'integrations'],
        ['/api/suppliers/*/integrations/**', 'integrations'],
        ['/api/suppliers/integrations/**', 'integrations'],
      ] as const)
    : []),
  ['/api/dashboard/**', 'dashboards'],
  ['/api/gpp/**', 'gpp'],
  ['/api/**/export-pdf', 'export'],
  ['/api/**/export-excel', 'export'],
  ['/api/**/export-word', 'export'],
  ['/api/**/print', 'export'],
];

/** Шаблон в регулярное выражение: `/x/**` — сам /x и всё под ним, `**` в середине — любые сегменты, `*` — один */
const patternToRegExp = (pattern: string): RegExp => {
  const parts = pattern.split('/').filter(Boolean);
  let source = '^';
  parts.forEach((part, index) => {
    const last = index === parts.length - 1;
    if (part === '**') source += last ? '(?:/.*)?' : '(?:/[^/]+)*';
    else if (part === '*') source += '/[^/]+';
    else source += '/' + part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(source + '$');
};

const FEATURE_API_RULES = FEATURE_API.map(([pattern, feature]) => [patternToRegExp(pattern), feature] as const);

/** Функция, которой принадлежит адрес API (относительный или полный); null — адрес ядра */
export const featureForApiUrl = (url: string): FeatureKey | null => {
  const path = pathOf(url);
  for (const [rule, feature] of FEATURE_API_RULES) {
    if (rule.test(path)) return feature;
  }
  return null;
};

/** 404 от API функций перезапрашивает профиль не чаще (опрос раз в 2,5 с не превращается в опрос профиля) */
export const NOT_FOUND_REFRESH_MS = 15_000;

/**
 * Ответ 404 на адрес API: если адрес принадлежит функции и профиль не запрашивали последние
 * NOT_FOUND_REFRESH_MS — профиль перезапрашивается (функцию могли выключить на ходу). Отсчёт — от последнего
 * запроса, удачного или нет: иначе, пока /api/features отвечает ошибкой, каждый 404 опроса давал бы запрос.
 * true — запрос назначен
 */
export const noteApiNotFound = (url: string): boolean => {
  if (featureForApiUrl(url) === null) return false;
  const { status, pending, loadedAt, attemptedAt } = getFeatureSnapshot();
  if (status !== 'ready' && status !== 'error') return false;
  // Запрос уже идёт — его ответ и есть свежий профиль
  if (pending) return false;
  const last = Math.max(loadedAt ?? 0, attemptedAt ?? 0);
  if (last > 0 && Date.now() - last < NOT_FOUND_REFRESH_MS) return false;
  void refreshFeatures();
  return true;
};
