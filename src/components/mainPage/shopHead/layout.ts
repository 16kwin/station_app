// layout.ts — расположение и палитра карточек панели «Начальник цеха: Цех №1» внутри белого блока 1800×840
// (макет 6.png). Общая палитра, тени и шрифт — в shared/layout.ts
export { CANVAS, COLORS, SHADOWS, FONT, DEFAULT_RANGE } from '../shared/layout';
export type { CardRect } from '../shared/layout';

import { COLORS } from '../shared/layout';
import type { CardRect } from '../shared/layout';
import type { MetricIconKind } from '../operator/types';
import type { IndicatorColumn, ProductionChartPalette, ProductionQcPalette } from '../quality/types';

/** Карточка-показатель ТМЦ: какой показатель ответа /api/dashboard/operator она показывает и как выглядит */
export interface MetricCardSpec {
  /** Ключ показателя в `metrics` */
  key: string;
  /** Подпись, пока ответа сервера нет (потом — название показателя из ответа) */
  name: string;
  rect: CardRect;
  /** Цвет волн, дуги и кружка с иконкой */
  color: string;
  icon: MetricIconKind;
}

/** Три карточки-показателя в ряд слева направо */
export const METRIC_CARDS: readonly MetricCardSpec[] = [
  { key: 'tmc_in_stations', name: 'ТМЦ в станциях', rect: { x: 40, y: 107, w: 220, h: 272 }, color: COLORS.accent, icon: 'stations' },
  { key: 'issued_tmc', name: 'Выдано ТМЦ', rect: { x: 290, y: 107, w: 220, h: 272 }, color: COLORS.salmon, icon: 'issued' },
  { key: 'issued_over_norm', name: 'Выдано сверхнормы', rect: { x: 540, y: 107, w: 220, h: 272 }, color: COLORS.rose, icon: 'overNorm' },
];

export const CARD_RECTS = {
  /** «Показатели качества» */
  quality: { x: 790, y: 107, w: 282, h: 272 },
  /** «Крит. остатки / В заказ» */
  stock: { x: 1102, y: 107, w: 282, h: 272 },
  /** «Расход объема производственной номенклатуры по цеху» */
  production: { x: 40, y: 409, w: 970, h: 391 },
  /** «Средний уровень брака» — строка */
  average: { x: 1040, y: 409, w: 344, h: 65 },
  /** «Производство» */
  qc: { x: 1040, y: 504, w: 344, h: 296 },
  /** Лента «Выпуск продукции» */
  releases: { x: 1414, y: 107, w: 346, h: 693 },
} as const satisfies Record<string, CardRect>;

/** «Показатели качества»: левый столбик — брак, правый — выпуск */
export const QUALITY_COLUMNS: { left: IndicatorColumn; right: IndicatorColumn } = {
  left: { label: 'Брак', letter: 'Б', color: COLORS.rose, circleColor: COLORS.roseDark },
  right: { label: 'Выпуск', letter: 'В', color: COLORS.peach, circleColor: COLORS.peachDark },
};

/** «Крит. остатки / В заказ»: левый столбик — позиции с критическим остатком, правый — заказы в работе */
export const STOCK_COLUMNS: { left: IndicatorColumn; right: IndicatorColumn } = {
  left: { label: 'Крит. остатки', letter: 'К', color: COLORS.rose, circleColor: COLORS.roseDark },
  right: { label: 'Заказ', letter: 'З', color: COLORS.accent, circleColor: COLORS.accentBorder },
};

/** «Расход объема»: факт — синий, план — лососевый, плашка месяца — фиолетовая */
export const PRODUCTION_PALETTE: ProductionChartPalette = {
  fact: COLORS.accent,
  plan: COLORS.salmon,
  pill: COLORS.purple,
};

/** Кольцо «Производство» */
export const QC_PALETTE: ProductionQcPalette = {
  passed: COLORS.accent,
  waiting: COLORS.salmon,
  failed: COLORS.rose,
};

/** Сноска под кольцом «Производство» на панелях ролей */
export const QC_FOOTNOTE = '*единицы продукции на СГД';
