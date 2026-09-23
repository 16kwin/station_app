// api.ts — запрос данных панели «Оператор склада» (показатели на последнюю дату, без периода)
import AxiosService from '../../../services/AxiosService';
import type { OperatorDashboardData } from './types';

/** GET /api/dashboard/operator — показатели, остатки станций и ленты заказов и событий */
export const fetchOperatorDashboard = (): Promise<OperatorDashboardData> =>
  AxiosService.get<OperatorDashboardData>('/api/dashboard/operator').then(r => r.data);
