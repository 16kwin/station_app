// theme.ts — цвета, тени и раскладка документа ГПП на холсте 1800×840. Палитра — как в остальных документах
// (Пополнение, видеоархив, карта станций): текст #2D4059, акцент #666EFE, белые карточки с мягкой тенью.
import type { RowKind, ScaleMode } from './types';

export const FONT = "'Inter', sans-serif";

export const COLORS = {
  text: '#2D4059',
  muted: '#7B91B0',
  faint: '#A9B6C9',
  placeholder: '#A0A3BD',
  accent: '#666EFE',
  accentHover: '#5A61F0',
  accentSoft: 'rgba(102, 110, 254, 0.08)',
  accentLine: 'rgba(102, 110, 254, 0.15)',
  white: '#FFFFFF',
  pageBg: '#FAFBFF',
  border: '#E5ECF5',
  line: '#EEF1F6',
  rowHover: '#F7F8FF',
  rowChecked: 'rgba(102, 110, 254, 0.06)',
  track: '#E7EAF2',
  danger: '#FF3052',
  dangerSoft: '#FFECEF',
  ok: '#07B07B',
  overlay: 'rgba(0, 0, 0, 0.3)',
  hintBg: '#2B3445',
  /** Пунктирные стрелки зависимостей */
  link: '#8D99B3',
  /** Тонкие вертикальные линии начала и конца плана изделия */
  planLine: '#9AA6C0',
  /** Сетка месяцев на диаграмме */
  grid: '#F1F3F8',
  weekend: '#FAFAFD',
  today: '#FF8787',
  divider: '#5B6B82',
} as const;

export const SHADOWS = {
  card: '0 10px 40px rgba(226, 236, 249, 0.9)',
  button: '0 2px 8px rgba(0, 0, 0, 0.08)',
  buttonHover: '0 4px 14px rgba(102, 110, 254, 0.18)',
  active: '0 4px 12px rgba(102, 110, 254, 0.3)',
  menu: '0 8px 32px rgba(0, 0, 0, 0.12)',
  tooltip: '0 18px 16px rgba(50, 50, 71, 0.06), 0 8px 8px rgba(50, 50, 71, 0.08)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
} as const;

/** Раскладка страницы: таблица шириной 1720 от x = 40, как в форме документа «Пополнение» */
export const LAYOUT = {
  left: 40,
  width: 1720,
  titleTop: 35,
  infoTop: 82,
  toolbarTop: 150,
  toolButton: 40,
  tableTop: 201,
  headerHeight: 58,
  rowHeight: 58,
  visibleRows: 8,
  scrollbarGap: 12,
  scrollbarSize: 6,
  bottomButtonsBottom: 20,
  bottomButtonHeight: 50,
} as const;

/** Колонки таблицы слева от диаграммы; сумма — 1000 */
export const COLUMNS = { check: 58, num: 50, op: 102, name: 534, kind: 120, qty: 136 } as const;
export const TABLE_WIDTH = COLUMNS.check + COLUMNS.num + COLUMNS.op + COLUMNS.name + COLUMNS.kind + COLUMNS.qty;
/** Полоса-разделитель между таблицей и диаграммой */
export const DIVIDER_WIDTH = 32;
export const GANTT_WIDTH = LAYOUT.width - TABLE_WIDTH - DIVIDER_WIDTH;
export const BODY_HEIGHT = LAYOUT.rowHeight * LAYOUT.visibleRows;

/** Отступ дерева на уровень и место под «−/+» в колонке «Наименование» */
export const TREE = { left: 44, indent: 16, toggle: 22 } as const;

/** Полоса этапа: высота и скругление */
export const BAR = { height: 26, radius: 6, handle: 8 } as const;

/** Пиксели на день по масштабу; «Месяцы» растягиваются на всю ширину диаграммы, но не уже 3 px на день */
export const SCALE_PX: Record<ScaleMode, number> = { days: 30, weeks: 12, months: 3 };

/** Пастельная палитра этапов (окно «Этап»); первые пять — цвета исходного документа на сервере */
export const BAR_PALETTE = ['#BFE3FF', '#FFB3B3', '#FFE08A', '#A8EFC0', '#D9C8FF', '#FFD0A8', '#B5EAF0', '#F7C3E0'] as const;

/** Цвет полосы: свой цвет строки, иначе по виду и порядку */
export const barColor = (color: string | null | undefined, kind: RowKind, order = 0): string => {
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (kind === 'PRODUCT') return BAR_PALETTE[0];
  return BAR_PALETTE[1 + (order % (BAR_PALETTE.length - 1))];
};

/** Чуть темнее цвета полосы — для обводки при наведении и маркера в списках */
export const darken = (hex: string, amount = 0.18): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`;
};

export const KIND_LABEL: Record<RowKind, string> = { PRODUCT: 'Изделие', PART: 'Деталь', MATERIAL: 'Материал' };

export const TYPE_LABEL = { GENERAL: 'Общий по предприятию', SEQUENTIAL: 'Последовательный' } as const;
