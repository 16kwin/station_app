// api.ts — запрос данных панели «Показатели» за период
import AxiosService from '../../../services/AxiosService';
import type { DateRange } from '../shared/types';
import type { QualityDashboardData } from './types';

/** GET /api/dashboard/quality?from&to — данные всех карточек панели за период */
export const fetchQualityDashboard = (range: DateRange): Promise<QualityDashboardData> =>
  AxiosService.get<QualityDashboardData>('/api/dashboard/quality', {
    params: { from: range.from, to: range.to },
  }).then(r => r.data);
