// api.ts — данные панели «Служба закупа»: три существующих эндпоинта параллельно, период роли — DEFAULT_RANGE
import { DEFAULT_RANGE } from '../shared/layout';
import { fetchEconomicDashboard } from '../economic/api';
import { fetchQualityDashboard } from '../quality/api';
import { fetchOperatorDashboard } from '../operator/api';
import type { PurchasingDashboardData } from './types';

/** economic + quality за DEFAULT_RANGE и operator (без периода); ошибка любого запроса — ошибка всей панели */
export const fetchPurchasingDashboard = (): Promise<PurchasingDashboardData> =>
  Promise.all([fetchEconomicDashboard(DEFAULT_RANGE), fetchQualityDashboard(DEFAULT_RANGE), fetchOperatorDashboard()]).then(
    ([economic, quality, operator]) => ({ economic, quality, operator }),
  );
