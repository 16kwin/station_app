// theme.ts — цвета, тени и размеры режима «Карта». Палитра — из общих элементов приложения
// (mainPage/shared/layout.ts, VideoArchive/theme.ts), цвета статусов — как на карточке станции (StationCell).
import type { StationStatusCode } from './types';

export const FONT = "'Inter', sans-serif";

export const COLORS = {
  text: '#2D4059',
  muted: '#7B91B0',
  faint: '#A9B6C9',
  accent: '#666EFE',
  accentSoft: 'rgba(102, 110, 254, 0.08)',
  accentRing: 'rgba(102, 110, 254, 0.35)',
  white: '#FFFFFF',
  line: '#EEF1F6',
  border: '#E5ECF5',
  rowHover: '#F4F6FB',
  pill: '#F2F4F8',
  canvas: '#F6F8FC',
  track: '#ECEFF5',
  error: '#FF3052',
  errorSoft: '#FFECEF',
  warn: '#FF9F6B',
  warnSoft: '#FFF3EA',
  ok: '#07B07B',
  overlay: 'rgba(0, 0, 0, 0.3)',
} as const;

export const SHADOWS = {
  card: '0 10px 40px rgba(226, 236, 249, 0.9)',
  button: '0 2px 8px rgba(0, 0, 0, 0.08)',
  buttonHover: '0 4px 14px rgba(102, 110, 254, 0.18)',
  active: '0 4px 12px rgba(102, 110, 254, 0.3)',
  tooltip: '0 18px 16px rgba(50, 50, 71, 0.06), 0 8px 8px rgba(50, 50, 71, 0.08)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
} as const;

/** Размеры области карты на холсте страницы */
export const MAP_AREA = { height: 640, treeWidth: 380, gap: 24 } as const;

interface StatusStyle {
  label: string;
  /** Градиент карточки станции: сверху вниз */
  from: string;
  to: string;
  /** Сплошной цвет точки статуса */
  dot: string;
  /** Чем больше, тем хуже: «худший» статус узла дерева и блока мнемосхемы */
  severity: number;
}

export const STATUS: Record<StationStatusCode, StatusStyle> = {
  WORKING: { label: 'В работе', from: '#5FB0E2', to: '#5D5FEF', dot: '#5E86E9', severity: 1 },
  OFFLINE: { label: 'Не в сети', from: '#B5B5B5', to: '#777777', dot: '#9A9A9A', severity: 2 },
  MINIMAL_STOCK: { label: 'Минимальный остаток', from: '#F9B38E', to: '#FFAF81', dot: '#FF9F6B', severity: 3 },
  CRITICAL_STOCK: { label: 'Критический остаток', from: '#FF6C84', to: '#FF3052', dot: '#FF3052', severity: 4 },
};

/** Статус станции; неизвестный код показывается как «Не в сети» — так же, как на карточке */
export const statusOf = (code: string | null | undefined): StationStatusCode =>
  code && code in STATUS ? (code as StationStatusCode) : 'OFFLINE';

export const statusStyle = (code: string | null | undefined): StatusStyle => STATUS[statusOf(code)];

export const statusGradient = (code: string | null | undefined, angle = 180): string => {
  const s = statusStyle(code);
  return `linear-gradient(${angle}deg, ${s.from} 0%, ${s.to} 100%)`;
};

/** Мнемосхема: «В работе» — приглушённо, цвет только у отклонений */
export const MNEMO_TONE: Record<StationStatusCode, { from: string; to: string; ring: string | null }> = {
  WORKING: { from: '#C4CEE4', to: '#97A6C6', ring: null },
  OFFLINE: { from: '#E1E4EA', to: '#B9BFC9', ring: '#C3C9D4' },
  MINIMAL_STOCK: { from: '#FFC7A6', to: '#FF9F6B', ring: '#FFB98F' },
  CRITICAL_STOCK: { from: '#FF7C92', to: '#FF3052', ring: '#FF6C84' },
};

/** Пастельные «полы» участков на автоматической схеме цеха и их подписи */
export const ZONE_TONES: readonly { floor: string; edge: string; ink: string }[] = [
  { floor: '#E4EEFF', edge: '#B7CCF3', ink: '#6F8FCB' },
  { floor: '#E3F5EC', edge: '#ABDCC1', ink: '#5FA683' },
  { floor: '#FFF3DC', edge: '#F1D59B', ink: '#C59A45' },
  { floor: '#FCE7EE', edge: '#F0B9CB', ink: '#C6728F' },
  { floor: '#EEEAFF', edge: '#C9BFF5', ink: '#8B7BD6' },
  { floor: '#E1F4F5', edge: '#A8DADC', ink: '#4F9EA2' },
  { floor: '#FFEBDF', edge: '#F5C3A6', ink: '#CB8159' },
  { floor: '#EDF1F6', edge: '#C9D3E0', ink: '#7D8DA6' },
];

/** Сравнение названий «по-человечески»: «Цех 2» раньше «Цех 10» */
export const byName = (a: string, b: string): number => a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' });
