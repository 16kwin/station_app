// api.ts — запрос ленты «Экран событий» панелей контролера и главного контролера
import AxiosService from '../../../services/AxiosService';
import type { ControlEventsData, ControlScope } from './types';

/** GET /api/dashboard/control-events?scope= — события контроля участка (section) или всего предприятия (enterprise) */
export const fetchControlEvents = (scope: ControlScope): Promise<ControlEventsData> =>
  AxiosService.get<ControlEventsData>('/api/dashboard/control-events', {
    params: { scope },
  }).then(r => r.data);
