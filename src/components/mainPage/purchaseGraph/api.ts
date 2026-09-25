// api.ts — запрос данных графа закупок за период
import AxiosService from '../../../services/AxiosService';
import type { DateRange } from '../shared/types';
import { normalizeGraphData } from './model';
import type { PurchaseGraphData } from './types';

/** GET /api/dashboard/purchase-graph?from&to — справочники, закупки пар за период и связи поставщиков */
export const fetchPurchaseGraph = (range: DateRange): Promise<PurchaseGraphData> =>
  AxiosService.get<unknown>('/api/dashboard/purchase-graph', {
    params: { from: range.from, to: range.to },
  }).then(r => normalizeGraphData(r.data));
