// tabRoutes.ts — какие разделы и карточки MainLayout открывает во вкладках. Отдельно от MainLayout.tsx и без
// компонентов: список читает тест покрытия (test/features/routes.test.ts) — каждый раздел вкладок отнесён либо
// к ядру, либо к функции (services/features/routes.ts, раздел 11.2 проекта «Дискретное отключение функций»).
// MainLayout типизирует свои таблицы компонентов этими списками: раздел без записи здесь не пройдёт проверку
// типов, лишняя запись — тоже. Новый раздел: строка здесь, компонент и подпись в MainLayout, маршрут в App.tsx,
// решение «ядро или функция» в routes.ts.

/** Разделы: путь вкладки сравнивается целиком, без параметров */
export const TAB_SECTIONS = [
  '/main',
  '/stations',
  '/references',
  '/documents',
  '/reports',
  '/analytics',
  '/orders',
  '/tkp',
  '/settings',
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
  '/documents/video-archive',
  '/documents/gpp',
] as const;

export type TabSection = (typeof TAB_SECTIONS)[number];

/** Карточки и документы, которые открываются из разделов: путь начинается с префикса, дальше uid и код */
export const TAB_CHILD_PREFIXES = [
  '/references/nomenclature/create/',
  '/references/nomenclature/edit/',
  '/references/suppliers/create/',
  '/references/suppliers/edit/',
  '/references/manufacturers/create/',
  '/references/manufacturers/edit/',
  '/references/station-models/create/',
  '/references/station-models/edit/',
  '/references/station-configurations/create/',
  '/references/station-configurations/edit/',
  '/references/stations/create/',
  '/references/stations/edit/',
  '/orders/create/',
  '/documents/schablon/',
  '/documents/stock-level-control/create/',
  '/documents/stock-level-control/edit/',
  '/documents/refill/create/',
  '/documents/refill/edit/',
  '/documents/move-orders/create/',
  '/documents/move-orders/edit/',
] as const;

export type TabChildPrefix = (typeof TAB_CHILD_PREFIXES)[number];

/** Заказ и ТКП: раздел и ровно один сегмент uid (/orders/<uid>, /tkp/<uid>) */
export const TAB_UID_SECTIONS = ['/orders', '/tkp'] as const;

export type TabUidSection = (typeof TAB_UID_SECTIONS)[number];

/** Путь вкладки без параметров и якоря: вкладка хранит путь вместе с ?… */
export const tabPathname = (path: string): string => path.replace(/[?#].*$/, '');

const SECTION_SET: ReadonlySet<string> = new Set(TAB_SECTIONS);

/** Путь — раздел (без параметров) */
export const isTabSection = (path: string): path is TabSection => SECTION_SET.has(path);

/** Префикс карточки, с которого начинается путь; null — не карточка */
export const childTabPrefixOf = (path: string): TabChildPrefix | null =>
  TAB_CHILD_PREFIXES.find(prefix => path.startsWith(prefix)) ?? null;

/** Раздел заказа или ТКП с одним сегментом uid после него; null — не такой путь */
export const uidTabSectionOf = (path: string): TabUidSection | null =>
  TAB_UID_SECTIONS.find(section => path.startsWith(section + '/') && /^[^/]+$/.test(path.slice(section.length + 1))) ?? null;

/** Карточка открывается из активной вкладки: та становится родительской, закрытие карточки возвращает в неё */
export const isChildTabPath = (path: string): boolean => childTabPrefixOf(path) !== null || uidTabSectionOf(path) !== null;
