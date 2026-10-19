// api.ts — запросы интерактивной карты: план цеха, расстановка станций и картинка плана.
// Картинка отдаётся только после входа, поэтому грузится через AxiosService (cookie, обновление токена)
// и показывается по blob-ссылке.
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { MapStation, PlanPoint, StationPlan } from './types';

const BASE = '/api/station-plans/workshops';

/** Все станции без фильтров страницы: полный состав цехов и участков */
export const fetchAllStations = (): Promise<MapStation[]> =>
  AxiosService.get<MapStation[]>(ConstantInfo.restApiStationsStatic).then(r => r.data ?? []);

export const fetchPlan = (workshopId: number): Promise<StationPlan> =>
  AxiosService.get<StationPlan>(`${BASE}/${workshopId}`).then(r => r.data);

/** Полная замена расстановки; при устаревшей версии сервер отвечает 409 */
export const savePositions = (workshopId: number, version: number, positions: ReadonlyMap<string, PlanPoint>): Promise<StationPlan> =>
  AxiosService.put<StationPlan>(`${BASE}/${workshopId}/positions`, {
    version,
    positions: [...positions].map(([stationUid, p]) => ({ stationUid, x: p.x, y: p.y })),
  }).then(r => r.data);

export const uploadPlanImage = (workshopId: number, file: File, onProgress?: (share: number) => void): Promise<StationPlan> => {
  const form = new FormData();
  form.append('file', file);
  return AxiosService.post<StationPlan>(`${BASE}/${workshopId}/image`, form, {
    onUploadProgress: event => {
      if (onProgress && event.total) onProgress(event.loaded / event.total);
    },
  }).then(r => r.data);
};

export const deletePlanImage = (workshopId: number): Promise<StationPlan> =>
  AxiosService.delete<StationPlan>(`${BASE}/${workshopId}/image`).then(r => r.data);

/** Картинка плана как blob-ссылка; освобождать через URL.revokeObjectURL */
export const fetchPlanImage = async (url: string): Promise<string> => {
  const response = await AxiosService.get<Blob>(url, { responseType: 'blob' });
  return URL.createObjectURL(response.data);
};

/** HTTP-статус ошибки запроса */
export const errorStatus = (error: unknown): number | null =>
  (error as { response?: { status?: number } })?.response?.status ?? null;

/** Текст ошибки из ответа API ({ error }) или запасной текст */
export const errorText = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { error?: unknown } } })?.response?.data;
  return typeof data?.error === 'string' && data.error ? data.error : fallback;
};
