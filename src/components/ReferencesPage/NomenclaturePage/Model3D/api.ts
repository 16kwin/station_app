// api.ts — запросы 3D-моделей номенклатуры. Все адреса — только после входа (cookie через AxiosService).
// Адреса одной модели — /models/3d/{uid}: DELETE /api/nomenclature/models/{uid} занят моделями брендов.
// Автора загрузки и удаления сервер берёт из входа — с клиента он не передаётся.
import AxiosService from '../../../../services/AxiosService';
import type { NomenclatureModel } from './types';

const BASE = '/api/nomenclature';

export type ProgressCallback = (ratio: number | null) => void;

export const fetchModels = (materialUid: string, signal?: AbortSignal): Promise<NomenclatureModel[]> =>
  AxiosService.get<NomenclatureModel[]>(`${BASE}/${materialUid}/models`, { signal }).then(response => response.data ?? []);

export interface UploadModelInput {
  file: File;
  /** Копия GLB для просмотра; null — просмотр будет открывать исходник */
  view: ArrayBuffer | null;
  triangles: number | null;
}

const viewName = (fileName: string) => `${fileName.replace(/\.[^.]+$/, '') || 'model'}.view.glb`;

export const uploadModel = (materialUid: string, input: UploadModelInput, onProgress: ProgressCallback, signal?: AbortSignal): Promise<NomenclatureModel> => {
  const form = new FormData();
  form.append('file', input.file, input.file.name);
  if (input.view) form.append('view', new Blob([input.view], { type: 'model/gltf-binary' }), viewName(input.file.name));
  if (input.triangles !== null) form.append('triangles', String(Math.round(input.triangles)));
  return AxiosService.post<NomenclatureModel>(`${BASE}/${materialUid}/models`, form, {
    signal,
    onUploadProgress: event => onProgress(event.total ? event.loaded / event.total : null),
  }).then(response => response.data);
};

export const deleteModel = (uid: string): Promise<void> =>
  AxiosService.delete(`${BASE}/models/3d/${uid}`).then(() => undefined);

/** Модель для просмотра: копия GLB или, если её нет, исходник */
export const fetchModelView = (uid: string, onProgress: ProgressCallback, signal?: AbortSignal): Promise<ArrayBuffer> =>
  AxiosService.get<ArrayBuffer>(`${BASE}/models/3d/${uid}/view`, {
    responseType: 'arraybuffer',
    signal,
    onDownloadProgress: event => onProgress(event.total ? event.loaded / event.total : null),
  }).then(response => response.data);

/** Скачать исходный файл на компьютер под исходным именем */
export const downloadModelSource = async (model: NomenclatureModel): Promise<void> => {
  const response = await AxiosService.get<Blob>(`${BASE}/models/3d/${model.uid}/source`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = model.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/**
 * Текст ошибки API ({ error }). Для ответов arraybuffer/blob тело приходит двоичным — разбираем его как JSON.
 */
export const apiErrorText = async (error: unknown, fallback: string): Promise<string> => {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (!response) return (error as { code?: string })?.code === 'ERR_NETWORK' ? 'Нет связи с сервером. Проверьте сеть и попробуйте ещё раз.' : fallback;
  let data = response.data;
  try {
    if (data instanceof ArrayBuffer) data = JSON.parse(new TextDecoder().decode(data));
    else if (data instanceof Blob) data = JSON.parse(await data.text());
  } catch {
    data = null;
  }
  const message = (data as { error?: unknown } | null)?.error;
  if (typeof message === 'string' && message) return message;
  if (response.status === 413) return 'Файл слишком большой для сервера.';
  if (response.status === 401 || response.status === 403) return 'Нет доступа: войдите в систему заново.';
  return fallback;
};
