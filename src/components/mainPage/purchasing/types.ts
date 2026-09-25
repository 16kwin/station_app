// types.ts — данные панели «Служба закупа»: ответы трёх существующих эндпоинтов, собранные вместе
import type { EconomicDashboardData } from '../economic/types';
import type { QualityDashboardData } from '../quality/types';
import type { OperatorDashboardData } from '../operator/types';

/** Всё, что нужно панели: затраты и бюджет, расход объема, остатки станций и заказы на поставку */
export interface PurchasingDashboardData {
  /** GET /api/dashboard/economic — затраты на приобретение и исполнение бюджета */
  economic: EconomicDashboardData;
  /** GET /api/dashboard/quality — расход объема производственной номенклатуры */
  quality: QualityDashboardData;
  /** GET /api/dashboard/operator — остатки по станциям и заказы на поставку */
  operator: OperatorDashboardData;
}
