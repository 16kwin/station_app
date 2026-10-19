// api.ts — запросы видеоархива. Адрес API берётся из window.config.ip_api (как во всём приложении)
import AxiosService from '../../../services/AxiosService';
import type {
  LiveChannelStatus,
  StreamCheck,
  VideoCamera,
  VideoCameraUpdate,
  VideoClip,
  VideoEventPhase,
  VideoEventType,
  VideoRecord,
  VideoStatus,
} from './types';

const BASE = '/api/video';

export const fetchCameras = (): Promise<VideoCamera[]> =>
  AxiosService.get<VideoCamera[]>(`${BASE}/cameras`).then(r => r.data);

/** Камеры одной станции — для окна «Видео» на панели станций */
export const fetchStationCameras = (stationUid: string): Promise<VideoCamera[]> =>
  AxiosService.get<VideoCamera[]>(`${BASE}/cameras`, { params: { stationUid } }).then(r => r.data);

/** Адрес живого потока камеры (фрагментированный MP4) */
export const liveUrl = (cameraId: number): string => apiUrl(`${BASE}/cameras/${cameraId}/live`);

export const fetchLiveStatus = (): Promise<LiveChannelStatus[]> =>
  AxiosService.get<LiveChannelStatus[]>(`${BASE}/live`).then(r => r.data);

export const startClip = (cameraId: number): Promise<VideoClip> =>
  AxiosService.post<VideoClip>(`${BASE}/cameras/${cameraId}/clips`).then(r => r.data);

export const stopClip = (clipId: string): Promise<VideoClip> =>
  AxiosService.post<VideoClip>(`${BASE}/clips/${clipId}/stop`).then(r => r.data);

/** Скачать готовую запись на компьютер зрителя под понятным именем */
export const downloadClip = async (clip: VideoClip, fileName: string): Promise<void> => {
  if (!clip.downloadUrl) return;
  const response = await AxiosService.get<Blob>(clip.downloadUrl, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const updateCamera = (id: number, body: VideoCameraUpdate): Promise<VideoCamera> =>
  AxiosService.put<VideoCamera>(`${BASE}/cameras/${id}`, body).then(r => r.data);

export const checkCamera = (id: number): Promise<StreamCheck> =>
  AxiosService.post<StreamCheck>(`${BASE}/cameras/${id}/check`).then(r => r.data);

export const fetchRecords = (): Promise<VideoRecord[]> =>
  AxiosService.get<VideoRecord[]>(`${BASE}/records`).then(r => r.data);

export const fetchStatus = (): Promise<VideoStatus> =>
  AxiosService.get<VideoStatus>(`${BASE}/status`).then(r => r.data);

export const sendEvent = (stationId: number, eventType: VideoEventType, phase: VideoEventPhase): Promise<VideoRecord> =>
  AxiosService.post<VideoRecord>(`${BASE}/events`, { stationId, eventType, phase }).then(r => r.data);

/** Абсолютный адрес ресурса API — для <img> и <video>, которые ходят мимо AxiosService */
export const apiUrl = (path: string): string => `${window.config.ip_api.replace(/\/$/, '')}${path}`;

/** Текст ошибки из ответа API ({ error }) или запасной текст */
export const errorText = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { error?: unknown } } })?.response?.data;
  return typeof data?.error === 'string' && data.error ? data.error : fallback;
};
