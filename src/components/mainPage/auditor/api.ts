// api.ts — запросы панели «Аудитор»: новый эндпоинт аудита и сборка трёх ответов за выбранный период
import AxiosService from '../../../services/AxiosService';
import type { DateRange } from '../shared/types';
import { fetchEconomicDashboard } from '../economic/api';
import { fetchQualityDashboard } from '../quality/api';
import type { AuditDashboardData, AuditorDashboardData } from './types';

/** GET /api/dashboard/audit?from&to — инциденты, выдачи сверх нормы и закупки с завышенной ценой за период */
export const fetchAuditDashboard = (range: DateRange): Promise<AuditDashboardData> =>
  AxiosService.get<AuditDashboardData>('/api/dashboard/audit', {
    params: { from: range.from, to: range.to },
  }).then(r => r.data);

/** economic + quality + audit за один период параллельно; ошибка любого запроса — ошибка всей панели */
export const fetchAuditorDashboard = (range: DateRange): Promise<AuditorDashboardData> =>
  Promise.all([fetchEconomicDashboard(range), fetchQualityDashboard(range), fetchAuditDashboard(range)]).then(
    ([economic, quality, audit]) => ({ economic, quality, audit }),
  );
