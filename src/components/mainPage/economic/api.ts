// api.ts — запросы панели «Экономический блок»: данные за период и настройки видов номенклатуры
import AxiosService from '../../../services/AxiosService';
import type { DashboardSettings, DateRange, EconomicDashboardData } from './types';

/** Идентификатор пользователя — как в справочниках проекта (const USER_ID = 1) */
export const USER_ID = 1;

/** GET /api/dashboard/economic?from&to&userId — данные всех карточек за период (baseURL задан в AxiosService) */
export const fetchEconomicDashboard = (range: DateRange): Promise<EconomicDashboardData> =>
  AxiosService.get<EconomicDashboardData>('/api/dashboard/economic', {
    params: { from: range.from, to: range.to, userId: USER_ID },
  }).then(r => r.data);

/** PATCH /api/dashboard/economic/settings?userId — сохранить упорядоченные списки видов для карточек 2 и 4 */
export const saveDashboardSettings = (settings: DashboardSettings): Promise<void> =>
  AxiosService.patch(`/api/dashboard/economic/settings?userId=${USER_ID}`, settings).then(() => undefined);
