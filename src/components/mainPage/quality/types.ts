// types.ts — контракт GET /api/dashboard/quality и пропсы карточек панели «Показатели»
import type { AnimatedCardProps } from '../shared/types';
import type { CardRect } from '../shared/layout';

export type { DateRange, AnimatedCardProps } from '../shared/types';

/** Точка графика «Расход объема производственной номенклатуры»: план и факт расхода ТМЦ за день */
export interface ProductionPoint {
  date: string; // 'YYYY-MM-DD'
  plan: number;
  fact: number;
}

/** Строка раскрытия столбика: подразделение (вид «По деталям») или номенклатура (вид «По подразделениям») */
export interface DefectItem {
  key: string;
  name: string;
  released: number;
  defect: number;
  percent: number;
}

/** Столбик графика «Уровень брака» */
export interface DefectSubject {
  key: string;
  name: string;
  released: number;
  defect: number;
  percent: number;
  items: DefectItem[];
}

/** Вид графика «Уровень брака» целиком; averagePercent — линия среднего уровня по предприятию */
export interface DefectView {
  released: number;
  defect: number;
  averagePercent: number;
  subjects: DefectSubject[];
}

/** Карточка «Показатели качества» */
export interface QualityIndicators {
  released: number;
  defect: number;
  total: number;
  defectPercent: number;
}

/** Карточка «Производство» */
export interface QcData {
  passed: number;
  waiting: number;
  failed: number;
  total: number;
  passedPercent: number;
  waitingPercent: number;
  failedPercent: number;
}

/** Строка ленты «Выпуск продукции» */
export interface ReleaseEvent {
  id: number;
  name: string;
  at: string; // ISO date-time
}

/** Ответ GET /api/dashboard/quality?from&to */
export interface QualityDashboardData {
  from: string;
  to: string;
  production: ProductionPoint[];
  parts: DefectView;
  workshops: DefectView;
  quality: QualityIndicators;
  qc: QcData;
  releases: ReleaseEvent[];
}

/** Какой вид графика «Уровень брака» показан */
export type DefectViewKind = 'parts' | 'workshops';

/* ---------- Настройки карточек для панелей ролей (все необязательные: без них — прежний вид) ---------- */

/** Палитра графика «Расход объема»: линии и заливки плана и факта, плашка месяца при наведении */
export interface ProductionChartPalette {
  plan?: string;
  fact?: string;
  /** Плашка месяца наведённого дня; если задана — этим же цветом рисуются кружки наведения */
  pill?: string;
}

/** Где легенда графика «Расход объема»: внизу по центру или справа в строке заголовка */
export type ProductionChartLegend = 'bottom' | 'header';

/** Палитра «Уровня брака»: если задана, заменяет собственные пары цветов обоих видов */
export interface DefectRatePalette {
  /** Столбик до линии среднего уровня */
  bar: string;
  /** Часть столбика выше линии среднего уровня */
  barOver: string;
  /** Линия среднего уровня и обводка наведённого столбика */
  avgLine: string;
}

/** Вид карточки «Средний уровень брака»: строка «подпись — значение» или число в кольце */
export type AverageDefectVariant = 'pill' | 'ring';

/** Столбик-«градусник» карточки «Показатели качества» */
export interface IndicatorColumn {
  /** Подпись под столбиком, например «Брак» */
  label: string;
  /** Буква в кружке, например «Б» */
  letter: string;
  /** Цвет линии, бейджа и свечения */
  color: string;
  /** Цвет кружка с буквой */
  circleColor: string;
}

/** Палитра кольца «Производство» */
export interface ProductionQcPalette {
  passed: string;
  waiting: string;
  failed: string;
}

export interface ProductionChartProps extends AnimatedCardProps {
  points: ProductionPoint[];
  from: string;
  to: string;
  /** Место карточки на холсте; по умолчанию CARD_RECTS.production */
  rect?: CardRect;
  /** Заголовок; по умолчанию «Расход объема производственной номенклатуры по предприятию» */
  title?: string;
  /**
   * Легенда: 'header' — справа в строке заголовка с разделителем, 'bottom' — внизу по центру.
   * Без пропа — прежняя легенда в шапке (без разделителя).
   */
  legend?: ProductionChartLegend;
  palette?: ProductionChartPalette;
}

export interface DefectRateCardProps extends AnimatedCardProps {
  parts: DefectView;
  workshops: DefectView;
  from: string;
  to: string;
  /** Место карточки на холсте; по умолчанию CARD_RECTS.defects */
  rect?: CardRect;
  palette?: DefectRatePalette;
}

export interface QualityIndicatorsCardProps extends AnimatedCardProps {
  released: number;
  defect: number;
  total: number;
  /** Место карточки; если задано — раскладка столбиков панелей ролей (≈31% и ≈70% ширины, низ — от высоты) */
  rect?: CardRect;
  /** Заголовок; по умолчанию «Показатели качества» */
  title?: string;
  /** Подписи, буквы и цвета столбиков: левый показывает `defect`, правый — `released` */
  columns?: { left: IndicatorColumn; right: IndicatorColumn };
  /** Строка «Всего N» справа в шапке; по умолчанию показывается */
  showTotal?: boolean;
}

export interface AverageDefectCardProps extends AnimatedCardProps {
  percent: number;
  /** Место карточки на холсте; по умолчанию CARD_RECTS.average */
  rect?: CardRect;
  /** По умолчанию 'pill' — как на панели «Показатели» */
  variant?: AverageDefectVariant;
  /** Цвет кольца варианта 'ring'; по умолчанию COLORS.purple */
  color?: string;
}

export interface ProductionQcCardProps extends AnimatedCardProps {
  qc: QcData;
  /** Место карточки на холсте; по умолчанию CARD_RECTS.qc */
  rect?: CardRect;
  palette?: ProductionQcPalette;
  /** Сноска под кольцом; по умолчанию «*единицы продукции с производства» */
  footnote?: string;
}

export interface ReleaseFeedCardProps {
  items: ReleaseEvent[];
}
