// api.ts — запросы документа ГПП. Один документ на предприятие: GET /api/gpp — прочитать,
// PUT /api/gpp — полная замена строк (409 — документ уже сохранил другой пользователь, 400 — ошибка проверки).
import AxiosService from '../../../services/AxiosService';
import type { GppDocumentDTO, GppSaveRequest } from './types';

const BASE = '/api/gpp';

export const fetchGpp = (): Promise<GppDocumentDTO> => AxiosService.get<GppDocumentDTO>(BASE).then(r => r.data);

export const saveGpp = (body: GppSaveRequest): Promise<GppDocumentDTO> => AxiosService.put<GppDocumentDTO>(BASE, body).then(r => r.data);

/** HTTP-статус ошибки запроса; null — ответа не было (нет связи) */
export const errorStatus = (error: unknown): number | null =>
  (error as { response?: { status?: number } })?.response?.status ?? null;

/** Текст ошибки из ответа API ({ message } или { error }) или запасной текст */
export const errorText = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: unknown; error?: unknown } } })?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  return fallback;
};

/** Понятная причина, почему документ не загрузился */
export const loadErrorText = (error: unknown): string => {
  const status = errorStatus(error);
  if (status === null) return 'Нет связи с сервером. Проверьте подключение и повторите.';
  if (status === 404) return 'Документ ГПП не найден на сервере.';
  if (status === 403) return 'Нет прав на просмотр документа.';
  return errorText(error, `Не удалось загрузить документ (код ${status}).`);
};
