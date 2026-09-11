// layout.ts — геометрия и палитра панели «Экономический блок». Координаты взяты из макета Glavmenu.svg (1800×840)

export const CANVAS = { width: 1800, height: 840 } as const;

export interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Положение карточек внутри белого блока 1800×840 */
export const CARD_RECTS = {
  costs: { x: 40, y: 107, w: 970, h: 390 },
  costsByType: { x: 40, y: 527, w: 970, h: 273 },
  indicators: { x: 1040, y: 107, w: 278, h: 273 },
  budget: { x: 1348, y: 107, w: 412, h: 273 },
  distribution: { x: 1040, y: 410, w: 720, h: 390 },
} as const satisfies Record<string, CardRect>;

export const COLORS = {
  text: '#2D4059',
  textMuted: '#7B91B0',
  valueText: '#273240',
  accent: '#666EFE',
  accentBorder: '#5D65EF',
  dashedLine: '#422F8A',
  plan: '#3CC8E0',
  fact: '#FF8787',
  teal: '#36D9D8',
  track: '#ECEFF5',
  grid: '#EFF1F3',
  purple: '#775DA6',
  yellow: '#FFD964',
  orange: '#FEB26F',
  red: '#FF8787',
  pinkDark: '#EE6666',
  tealDark: '#18B0CA',
  white: '#FFFFFF',
} as const;

export const SHADOWS = {
  card: '0 10px 40px rgba(226, 236, 249, 0.9)',
  button: '0 2px 15px rgba(226, 236, 249, 0.9)',
  datePill: '0 2px 9px rgba(102, 110, 254, 0.35)',
  tooltip: '0 18px 16px rgba(50, 50, 71, 0.06), 0 8px 8px rgba(50, 50, 71, 0.08)',
} as const;

/** Цвета осей паутинки по порядку выбранных видов (до 9) */
export const RADAR_PALETTE = [
  '#E572F6',
  '#07E098',
  '#666EFE',
  '#FDA373',
  '#36D9D8',
  '#FF3052',
  '#9F81F2',
  '#FFD964',
  '#3CC8E0',
] as const;

export const FONT = "'Inter', sans-serif";

/** Длительность «загрузочных» анимаций, мс */
export const ANIM = {
  countUp: 2000,
  bars: 1600,
  line: 1800,
  radar: 1600,
  ring: 900,
  indicators: 1600,
} as const;
