// settings.ts — настройки вида ГПП и «избранное» у пользователя в браузере. localStorage может быть
// недоступен (приватный режим, запрет сайта) — тогда работают значения по умолчанию.
import type { GppViewSettings, ScaleMode } from './types';

const SETTINGS_KEY = 'awms.gpp.settings.v1';
const FAVORITE_KEY = 'awms.gpp.favorite.v1';

export const DEFAULT_SETTINGS: GppViewSettings = { scale: 'months', showLinks: true, showToday: true };

const SCALES: readonly ScaleMode[] = ['days', 'weeks', 'months'];

export const loadSettings = (): GppViewSettings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw) as Partial<GppViewSettings>;
    return {
      scale: SCALES.includes(data.scale as ScaleMode) ? (data.scale as ScaleMode) : DEFAULT_SETTINGS.scale,
      showLinks: typeof data.showLinks === 'boolean' ? data.showLinks : DEFAULT_SETTINGS.showLinks,
      showToday: typeof data.showToday === 'boolean' ? data.showToday : DEFAULT_SETTINGS.showToday,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: GppViewSettings): void => {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* хранилище недоступно — настройки живут до закрытия вкладки */
  }
};

export const loadFavorite = (): boolean => {
  try {
    return window.localStorage.getItem(FAVORITE_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveFavorite = (favorite: boolean): void => {
  try {
    window.localStorage.setItem(FAVORITE_KEY, favorite ? '1' : '0');
  } catch {
    /* хранилище недоступно */
  }
};
