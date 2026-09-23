// layout.ts — общая геометрия, палитра и тайминги информационных панелей главной страницы.
// Холст у всех панелей одинаковый (1800×840), расположение карточек — в layout.ts самой панели.

export const CANVAS = { width: 1800, height: 840 } as const;

export interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Диапазон дат панелей по умолчанию — как на макете */
export const DEFAULT_RANGE = { from: '2025-01-01', to: '2025-11-30' } as const;

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

  /* ---- Панель «Показатели» ---- */
  /** Вид «По деталям»: столбик до линии среднего уровня и часть выше неё */
  defectBar: '#FDA85F',
  defectBarOver: '#FF3F62',
  defectAvgLine: '#FFA63D',
  /** Вид «По подразделениям»: та же логика, но своя пара цветов */
  defectBarAlt: '#35C8D8',
  defectBarAltOver: '#E5427E',
  defectAvgLineAlt: '#2FA8CE',
  /** Выпуск (годная продукция) */
  green: '#07E098',
  greenDark: '#06C486',
  /** Брак */
  crimson: '#FF3F62',
  crimsonDark: '#E82D51',
  /** «Ожидают КК» в кольце производства */
  neutral: '#808080',
  /** «Не прошли КК» в кольце производства */
  pink: '#FF4B6B',
  /** Фон подсказки-пояснения (тёмная плашка) */
  hintBg: '#2B3445',

  /* ---- Панель «Оператор склада» ---- */
  violet: '#9F81F2',
  amber: '#FE9A3D',
} as const;

export const SHADOWS = {
  card: '0 10px 40px rgba(226, 236, 249, 0.9)',
  button: '0 2px 15px rgba(226, 236, 249, 0.9)',
  datePill: '0 2px 9px rgba(102, 110, 254, 0.35)',
  tooltip: '0 18px 16px rgba(50, 50, 71, 0.06), 0 8px 8px rgba(50, 50, 71, 0.08)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
} as const;

export const FONT = "'Inter', sans-serif";

/** Длительность «загрузочных» анимаций, мс */
export const ANIM = {
  countUp: 2000,
  bars: 1600,
  line: 1800,
  radar: 1600,
  ring: 900,
  indicators: 1600,
  /** Столбики «Уровня брака» растут снизу вверх */
  defectBars: 1500,
  /** Кольца карточек оператора заполняются от 6 часов по часовой стрелке */
  gauge: 1400,
} as const;
