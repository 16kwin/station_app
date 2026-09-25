// layout.ts — расположение карточек панели «Служба закупа: Инструментальный отдел» внутри белого блока 1800×840 (7.png).
// Палитра, тени, шрифт и период по умолчанию — общие, см. shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, DEFAULT_RANGE } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import type { CardRect } from '../shared/layout';

export const CARD_RECTS = {
  /** «Затраты на приобретение производственной номенклатуры (по цеху)» */
  costs: { x: 40, y: 107, w: 970, h: 333 },
  /** «Исполнение бюджета» */
  budget: { x: 1040, y: 107, w: 410, h: 283 },
  /** «Заказы на поставку» */
  orders: { x: 1480, y: 107, w: 280, h: 693 },
  /** «Расход объема производственной номенклатуры по цеху» */
  production: { x: 40, y: 470, w: 970, h: 330 },
  /** «Крит./Мин. остатки» — компактный вариант остатков по станциям */
  stations: { x: 1040, y: 420, w: 410, h: 380 },
} as const satisfies Record<string, CardRect>;
