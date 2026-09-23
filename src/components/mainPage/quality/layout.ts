// layout.ts — расположение карточек панели «Показатели» внутри белого блока 1800×840.
// Палитра, тени, шрифт и тайминги — общие, см. shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, ANIM, DEFAULT_RANGE } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import type { CardRect } from '../shared/layout';

export const CARD_RECTS = {
  /** «Расход объема производственной номенклатуры по предприятию» */
  production: { x: 40, y: 107, w: 1000, h: 330 },
  /** «Уровень брака по деталям» / «по подразделениям» */
  defects: { x: 40, y: 457, w: 1000, h: 343 },
  /** «Показатели качества» */
  quality: { x: 1060, y: 107, w: 400, h: 250 },
  /** «Средний уровень брака» */
  average: { x: 1060, y: 377, w: 400, h: 76 },
  /** «Производство» — шире соседей: кольцу нужны выноски с подписями по бокам */
  qc: { x: 1060, y: 473, w: 400, h: 327 },
  /** «Выпуск продукции» */
  releases: { x: 1480, y: 107, w: 280, h: 693 },
} as const satisfies Record<string, CardRect>;
