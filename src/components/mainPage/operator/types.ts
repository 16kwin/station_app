// types.ts — контракт GET /api/dashboard/operator и пропсы карточек панели «Оператор склада»
import type { AnimatedCardProps } from '../shared/types';

export type { AnimatedCardProps } from '../shared/types';

/** Карточка-показатель: значение, база доли и сама доля (насколько заполнено кольцо) */
export interface OperatorMetric {
  key: string;
  name: string;
  value: number;
  base: number;
  percent: number;
}

/** Статус остатка: КО — критический, МО — минимальный */
export type StockStatus = 'critical' | 'minimal' | 'normal';

/** Строка pop-up станции */
export interface StationItem {
  id: number;
  name: string;
  quantity: number;
  minLevel: number;
  criticalLevel: number;
  status: StockStatus;
}

/** Столбик графика «Критические и минимальные остатки по станциям» */
export interface Station {
  key: string;
  name: string;
  /** Наименьший остаток среди номенклатуры станции — его и показывает график */
  quantity: number;
  nomName: string | null;
  minLevel: number;
  criticalLevel: number;
  status: StockStatus;
  items: StationItem[];
}

/** Строка ленты «Заказы на поставку» или «Экран событий» */
export interface OperatorEvent {
  id: number;
  title: string;
  at: string;
  done: boolean;
}

/** Ответ GET /api/dashboard/operator */
export interface OperatorDashboardData {
  statDate: string | null;
  metrics: OperatorMetric[];
  stations: Station[];
  orders: OperatorEvent[];
  events: OperatorEvent[];
}

export interface OperatorMetricCardProps extends AnimatedCardProps {
  metric: OperatorMetric;
  index: number;
}

export interface StationBalanceCardProps extends AnimatedCardProps {
  stations: Station[];
  /** Период, который показывается в подсказке над столбиком */
  period: { from: string; to: string };
}
