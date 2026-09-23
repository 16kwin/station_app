// layout.ts — геометрия панели «Экономический блок». Координаты взяты из макета Glavmenu.svg (1800×840).
// Палитра, тени, шрифт и тайминги общие для всех панелей — они лежат в shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, ANIM, DEFAULT_RANGE } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import type { CardRect } from '../shared/layout';

/** Положение карточек внутри белого блока 1800×840 */
export const CARD_RECTS = {
  costs: { x: 40, y: 107, w: 970, h: 390 },
  costsByType: { x: 40, y: 527, w: 970, h: 273 },
  indicators: { x: 1040, y: 107, w: 278, h: 273 },
  budget: { x: 1348, y: 107, w: 412, h: 273 },
  distribution: { x: 1040, y: 410, w: 720, h: 390 },
} as const satisfies Record<string, CardRect>;

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
