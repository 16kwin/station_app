// layout.ts — расположение карточек панели «Оператор склада» внутри белого блока 1800×840.
// Палитра, тени, шрифт и тайминги — общие, см. shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, ANIM } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import { COLORS } from '../shared/layout';
import type { CardRect } from '../shared/layout';

/** Четыре карточки-показателя в ряд */
export const METRIC_RECTS: CardRect[] = [
  { x: 40, y: 107, w: 240, h: 230 },
  { x: 300, y: 107, w: 240, h: 230 },
  { x: 560, y: 107, w: 240, h: 230 },
  { x: 820, y: 107, w: 240, h: 230 },
];

export const CARD_RECTS = {
  /** «Критические и минимальные остатки по станциям» */
  stations: { x: 40, y: 357, w: 1020, h: 443 },
  /** «Заказы на поставку» */
  orders: { x: 1080, y: 107, w: 330, h: 693 },
  /** «Экран событий» */
  events: { x: 1430, y: 107, w: 330, h: 693 },
} as const satisfies Record<string, CardRect>;

/** Цвет кольца и подсветки карточки-показателя по её порядку — как на макете */
export const METRIC_COLORS = [COLORS.green, COLORS.amber, COLORS.crimson, COLORS.violet] as const;

/** Цвет столбика остатка: критический — красный, минимальный — оранжевый */
export const STOCK_COLORS = {
  critical: COLORS.crimson,
  minimal: COLORS.defectBar,
  normal: COLORS.green,
} as const;

export const STOCK_LABELS = {
  critical: 'Критический',
  minimal: 'Минимальный',
  normal: 'В норме',
} as const;
