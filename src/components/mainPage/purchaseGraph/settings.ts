// settings.ts — настройки графа закупок: значения по умолчанию, диапазоны ползунков,
// проверка и хранение в localStorage (без localStorage всё работает на значениях по умолчанию)

import type {
  ColorGroup,
  GradientMode,
  GraphDisplay,
  GraphFilters,
  GraphForces,
  GraphSettings,
  SettingsSection,
} from './types';

export const SETTINGS_STORAGE_KEY = 'awms.purchaseGraph.settings.v1';
export const FAVORITES_STORAGE_KEY = 'awms.purchaseGraph.favorites.v1';

/** Палитра цветовых групп: по клику на кружок — следующий цвет */
export const GROUP_PALETTE = ['#9F81F2', '#FE967E', '#17DECD', '#FFD964', '#FF5C77', '#07E098'] as const;

export interface SliderRange {
  min: number;
  max: number;
  step: number;
  /** Знаков после запятой в подписи значения */
  decimals: number;
}

/** Диапазоны ползунков панели настроек */
export const SLIDERS = {
  textFade: { min: -3, max: 3, step: 0.01, decimals: 2 },
  nodeSize: { min: 0.5, max: 2.5, step: 0.01, decimals: 2 },
  lineWidth: { min: 0.5, max: 3, step: 0.01, decimals: 2 },
  limitPercent: { min: 0, max: 100, step: 1, decimals: 0 },
  center: { min: 0, max: 1, step: 0.01, decimals: 2 },
  repel: { min: 0, max: 20, step: 0.1, decimals: 2 },
  link: { min: 0, max: 1, step: 0.01, decimals: 2 },
  distance: { min: 30, max: 500, step: 1, decimals: 0 },
} as const satisfies Record<string, SliderRange>;

export const DEFAULT_FILTERS: GraphFilters = {
  search: '',
  showRegular: true,
  showOverLimit: true,
  showAnchor: true,
  showAffiliated: true,
  showOrphans: false,
};

export const DEFAULT_DISPLAY: GraphDisplay = {
  arrows: true,
  // −0.5, а не 0: при вписывании всего графа (масштаб ≈0.77) цены на связях видны сразу, без приближения
  textFade: -0.5,
  nodeSize: 1,
  lineWidth: 1,
  gradient: 'fixed',
  limitPercent: null,
  prices: true,
};

export const DEFAULT_FORCES: GraphForces = {
  center: 0.39,
  repel: 10,
  link: 1,
  distance: 250,
};

export const DEFAULT_SETTINGS: GraphSettings = {
  filters: DEFAULT_FILTERS,
  groups: [],
  display: DEFAULT_DISPLAY,
  forces: DEFAULT_FORCES,
  collapsed: { filters: false, groups: false, display: false, forces: false },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readBool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

const readNumber = (value: unknown, range: SliderRange, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(range.max, Math.max(range.min, value));
};

const readString = (value: unknown, fallback: string, maxLength = 120): string =>
  typeof value === 'string' ? value.slice(0, maxLength) : fallback;

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const readGroups = (value: unknown): ColorGroup[] => {
  if (!Array.isArray(value)) return [];
  const groups: ColorGroup[] = [];
  value.slice(0, 30).forEach((item, index) => {
    if (!isRecord(item)) return;
    const color = typeof item.color === 'string' && COLOR_RE.test(item.color) ? item.color : GROUP_PALETTE[index % GROUP_PALETTE.length];
    const id = typeof item.id === 'string' && item.id ? item.id : `g${index + 1}`;
    if (groups.some(group => group.id === id)) return;
    groups.push({ id, query: readString(item.query, ''), color });
  });
  return groups;
};

/** Разбор сохранённых настроек: неизвестные поля отбрасываются, числа приводятся к диапазонам */
export const sanitizeSettings = (raw: unknown): GraphSettings => {
  const root = isRecord(raw) ? raw : {};
  const f = isRecord(root.filters) ? root.filters : {};
  const d = isRecord(root.display) ? root.display : {};
  const p = isRecord(root.forces) ? root.forces : {};
  const c = isRecord(root.collapsed) ? root.collapsed : {};
  const gradient: GradientMode = d.gradient === 'ratio' ? 'ratio' : 'fixed';
  const limit = d.limitPercent;

  return {
    filters: {
      search: readString(f.search, DEFAULT_FILTERS.search),
      showRegular: readBool(f.showRegular, DEFAULT_FILTERS.showRegular),
      showOverLimit: readBool(f.showOverLimit, DEFAULT_FILTERS.showOverLimit),
      showAnchor: readBool(f.showAnchor, DEFAULT_FILTERS.showAnchor),
      showAffiliated: readBool(f.showAffiliated, DEFAULT_FILTERS.showAffiliated),
      showOrphans: readBool(f.showOrphans, DEFAULT_FILTERS.showOrphans),
    },
    groups: readGroups(root.groups),
    display: {
      arrows: readBool(d.arrows, DEFAULT_DISPLAY.arrows),
      textFade: readNumber(d.textFade, SLIDERS.textFade, DEFAULT_DISPLAY.textFade),
      nodeSize: readNumber(d.nodeSize, SLIDERS.nodeSize, DEFAULT_DISPLAY.nodeSize),
      lineWidth: readNumber(d.lineWidth, SLIDERS.lineWidth, DEFAULT_DISPLAY.lineWidth),
      gradient,
      limitPercent: limit === null || limit === undefined ? null : readNumber(limit, SLIDERS.limitPercent, 20),
      prices: readBool(d.prices, DEFAULT_DISPLAY.prices),
    },
    forces: {
      center: readNumber(p.center, SLIDERS.center, DEFAULT_FORCES.center),
      repel: readNumber(p.repel, SLIDERS.repel, DEFAULT_FORCES.repel),
      link: readNumber(p.link, SLIDERS.link, DEFAULT_FORCES.link),
      distance: readNumber(p.distance, SLIDERS.distance, DEFAULT_FORCES.distance),
    },
    collapsed: (['filters', 'groups', 'display', 'forces'] as SettingsSection[]).reduce(
      (acc, key) => ({ ...acc, [key]: readBool(c[key], false) }),
      { ...DEFAULT_SETTINGS.collapsed },
    ),
  };
};

/** Настройки из localStorage; при любой ошибке — значения по умолчанию */
export const loadSettings = (): GraphSettings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? sanitizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: GraphSettings): void => {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage недоступен (приватный режим, запрет) — настройки живут до закрытия вкладки
  }
};

/** Избранное пользователя: ключ позиции → в избранном или нет (поверх признака из API) */
export type FavoriteOverrides = Record<string, boolean>;

export const loadFavorites = (): FavoriteOverrides => {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(parsed)) return {};
    const result: FavoriteOverrides = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === 'boolean') result[key] = value;
    });
    return result;
  } catch {
    return {};
  }
};

export const saveFavorites = (favorites: FavoriteOverrides): void => {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // см. saveSettings
  }
};

/** Следующий свободный идентификатор цветовой группы: g1, g2, … */
export const nextGroupId = (groups: readonly ColorGroup[]): string => {
  const max = groups.reduce((acc, group) => Math.max(acc, Number(group.id.replace(/\D/g, '')) || 0), 0);
  return `g${max + 1}`;
};

/** Следующий цвет палитры после `color` */
export const nextPaletteColor = (color: string): string => {
  const index = GROUP_PALETTE.findIndex(item => item.toLowerCase() === color.toLowerCase());
  return GROUP_PALETTE[(index + 1) % GROUP_PALETTE.length];
};
