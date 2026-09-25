// layout.ts — расположение карточек панели «Аудитор» внутри белого блока 1800×840 (8.png).
// Палитра, тени и шрифт — общие, см. shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import type { CardRect } from '../shared/layout';

export const CARD_RECTS = {
  /** «Затраты на приобретение производственной номенклатуры (по цеху)» — как у службы закупа */
  costs: { x: 40, y: 107, w: 970, h: 333 },
  /** «Инциденты» | «Выдано сверхнормы» */
  metrics: { x: 1040, y: 107, w: 344, h: 236 },
  /** «Средний уровень брака» — строка-плашка */
  average: { x: 1040, y: 373, w: 344, h: 65 },
  /** «Расход объема производственной номенклатуры по цеху» — как у службы закупа */
  production: { x: 40, y: 470, w: 970, h: 330 },
  /** Мини-карточка «Граф закупок» */
  graph: { x: 1040, y: 470, w: 344, h: 330 },
  /** Лента «Закупка с завышенной ценой» */
  overpriced: { x: 1414, y: 107, w: 346, h: 693 },
} as const satisfies Record<string, CardRect>;
