// types.ts — контракт GET /api/dashboard/operator и пропсы карточек панели «Оператор склада»
import type { AnimatedCardProps } from '../shared/types';
import type { CardRect } from '../shared/layout';

export type { AnimatedCardProps } from '../shared/types';

/**
 * Белая иконка в цветном кружке кольца-показателя (shared/MetricGauge):
 * 'stations' — коробка с галочкой (ТМЦ в станциях), 'issued' — лоток со стрелкой (выдано ТМЦ),
 * 'overNorm' — стопка со стрелкой вверх (выдано сверхнормы), 'sgd' — склад (СГД),
 * 'incidents' — треугольник с «!» (инциденты)
 */
export type MetricIconKind = 'stations' | 'issued' | 'overNorm' | 'sgd' | 'incidents';

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
  /** Порядковый номер карточки: место, цвет и сдвиг волн по умолчанию */
  index: number;
  /** Место карточки на холсте; по умолчанию METRIC_RECTS[index] */
  rect?: CardRect;
  /** Цвет волн, дуги и кружка; по умолчанию METRIC_COLORS[index] */
  color?: string;
  /**
   * Иконка кольца. Если задана — карточка рисуется по макету начальника цеха (6.png):
   * название 16px тёмным, число 20px, кольцо у низа карточки с цветным кружком и белой иконкой, без подписи доли.
   * Без неё — как на панели оператора склада.
   */
  icon?: MetricIconKind;
}

export interface StationBalanceCardProps extends AnimatedCardProps {
  stations: Station[];
  /** Период, который показывается в подсказке над столбиком */
  period: { from: string; to: string };
  /** Место карточки на холсте; по умолчанию CARD_RECTS.stations */
  rect?: CardRect;
  /** Заголовок; по умолчанию «Критические и минимальные остатки по станциям» */
  title?: string;
  /**
   * 'full' (по умолчанию) — как на панели оператора склада;
   * 'compact' — «трубки» на три видимые станции с горизонтальной прокруткой и кнопкой сортировки по остатку (7.png)
   */
  variant?: 'full' | 'compact';
}
