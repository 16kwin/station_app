// layout.ts — расположение и палитра карточек панелей контролера и главного контролера
// внутри белого блока 1800×840 (макеты 1.png и 2.png). Общая палитра, тени и шрифт — в shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, DEFAULT_RANGE } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import { COLORS } from '../shared/layout';
import type { CardRect } from '../shared/layout';
import type { DefectRatePalette, IndicatorColumn, ProductionQcPalette } from '../quality/types';

export const CARD_RECTS = {
  /** «Уровень брака по деталям» / «по подразделениям» */
  defects: { x: 40, y: 107, w: 1080, h: 350 },
  /** «Средний уровень брака» — число в кольце */
  average: { x: 40, y: 487, w: 215, h: 313 },
  /** «Показатели качества» */
  quality: { x: 285, y: 487, w: 278, h: 313 },
  /** «Производство» */
  qc: { x: 593, y: 487, w: 527, h: 313 },
  /** Лента «Экран событий» */
  events: { x: 1150, y: 107, w: 610, h: 693 },
} as const satisfies Record<string, CardRect>;

/** «Уровень брака»: столбик — фиолетовый, часть выше среднего — розовая, линия среднего — янтарная */
export const DEFECT_PALETTE: DefectRatePalette = {
  bar: COLORS.purple,
  barOver: COLORS.rose,
  avgLine: COLORS.amberLine,
};

/** «Показатели качества»: левый столбик — брак, правый — выпуск */
export const QUALITY_COLUMNS: { left: IndicatorColumn; right: IndicatorColumn } = {
  left: { label: 'Брак', letter: 'Б', color: COLORS.rose, circleColor: COLORS.roseDark },
  right: { label: 'Выпуск', letter: 'В', color: COLORS.aqua, circleColor: COLORS.aquaDark },
};

/** Кольцо «Производство» */
export const QC_PALETTE: ProductionQcPalette = {
  passed: COLORS.purple,
  waiting: COLORS.aqua,
  failed: COLORS.rose,
};

/** Сноска под кольцом «Производство» на панелях ролей */
export const QC_FOOTNOTE = '*единицы продукции на СГД';
