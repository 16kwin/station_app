// types.ts — контракт GET /api/dashboard/quality и пропсы карточек панели «Показатели»
import type { AnimatedCardProps } from '../shared/types';

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

export interface ProductionChartProps extends AnimatedCardProps {
  points: ProductionPoint[];
  from: string;
  to: string;
}

export interface DefectRateCardProps extends AnimatedCardProps {
  parts: DefectView;
  workshops: DefectView;
  from: string;
  to: string;
}

export interface QualityIndicatorsCardProps extends AnimatedCardProps {
  released: number;
  defect: number;
  total: number;
}

export interface AverageDefectCardProps extends AnimatedCardProps {
  percent: number;
}

export interface ProductionQcCardProps extends AnimatedCardProps {
  qc: QcData;
}

export interface ReleaseFeedCardProps {
  items: ReleaseEvent[];
}
