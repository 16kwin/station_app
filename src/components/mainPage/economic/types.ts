// types.ts — контракт API и пропсы карточек панели «Экономический блок» (главная страница)

/** Диапазон дат в формате ISO 'YYYY-MM-DD' (включительно) */
export interface DateRange {
  from: string;
  to: string;
}

/** Точка графика «Затраты на приобретение» — одна на каждый день, суммы в рублях */
export interface CostPoint {
  date: string; // 'YYYY-MM-DD'
  plan: number; // руб.
  fact: number; // руб.
}

/** Справочная запись вида номенклатуры */
export interface NomenclatureTypeRef {
  key: string;
  name: string;
}

/** Вид номенклатуры с суммой затрат за период (руб.) */
export interface TypeAmount extends NomenclatureTypeRef {
  amount: number;
}

/** Вид номенклатуры с долей для паутинки: 0..100, максимум среди выбранных = 100 / 1.1 ≈ 90.9 */
export interface TypePercent extends TypeAmount {
  percent: number;
}

/** Ответ GET /api/dashboard/economic?from&to&userId */
export interface EconomicDashboardData {
  from: string;
  to: string;
  costs: { points: CostPoint[] };
  costsByType: { selected: string[]; items: TypeAmount[] };
  indicators: { purchases: number; issue: number };
  budget: { plan: number; fact: number; percent: number };
  distribution: { selected: string[]; items: TypePercent[] };
  availableTypes: NomenclatureTypeRef[];
}

/** Тело PATCH /api/dashboard/economic/settings?userId — упорядоченные списки ключей видов */
export interface DashboardSettings {
  barTypes: string[];
  radarTypes: string[];
}

export const BAR_TYPES_MIN = 1;
export const BAR_TYPES_MAX = 9;
export const RADAR_TYPES_MIN = 5;
export const RADAR_TYPES_MAX = 9;

/** Общий проп всех карточек: при изменении значения анимация загрузки проигрывается заново */
export interface AnimatedCardProps {
  animationKey: number;
}

export interface CostsChartProps extends AnimatedCardProps {
  points: CostPoint[];
  from: string;
  to: string;
}

export interface CostsByTypeCardProps extends AnimatedCardProps {
  items: TypeAmount[];
  onSettingsClick: () => void;
}

export interface CostIndicatorsCardProps extends AnimatedCardProps {
  purchases: number;
  issue: number;
}

export interface BudgetExecutionCardProps extends AnimatedCardProps {
  /** Факт / План × 100, может быть больше 300 */
  percent: number;
}

export interface CostDistributionRadarProps extends AnimatedCardProps {
  items: TypePercent[];
  onSettingsClick: () => void;
}
