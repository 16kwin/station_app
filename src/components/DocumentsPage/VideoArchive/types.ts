// types.ts — контракт API видеоархива (/api/video) для страницы «Журнал событий: видеоархив»

/** 'station' — камера станции, 'overview' — обзорная камера */
export type CameraType = 'station' | 'overview';

/** Код события станции, по которому пишется видео */
export type VideoEventType = 'authority' | 'issue';

/** Фаза события: начало запускает запись, окончание останавливает */
export type VideoEventPhase = 'start' | 'stop';

/** 'recording' — идёт запись, 'done' — готово, 'failed' — не записалось */
export type RecordStatus = 'recording' | 'done' | 'failed';

export interface VideoCamera {
  id: number;
  uid: string;
  name: string;
  ip: string;
  mac: string | null;
  cameraType: CameraType;
  /** «Станция» или «Обзорная» */
  cameraTypeTitle: string;
  /** Строка подключения; пароль заменён на «***» — сервер подставит сохранённый, если его не меняли */
  rtspUrl: string;
  stationId: number | null;
  /** Код станции, например ST-001 */
  stationUid: string | null;
  stationName: string | null;
  /** Идёт ли сейчас запись с этой камеры */
  recording: boolean;
}

/** Поля камеры, которые правятся на странице */
export interface VideoCameraUpdate {
  name?: string;
  ip?: string;
  mac?: string;
  cameraType?: CameraType;
  rtspUrl?: string;
}

export interface VideoRecordFile {
  id: number;
  cameraId: number | null;
  cameraName: string;
  cameraIp: string;
  cameraType: CameraType;
  /** «Камера станции» или «Обзорная камера» */
  cameraTitle: string;
  fileName: string;
  fileSize: number | null;
  durationSeconds: number | null;
  status: RecordStatus;
  errorMessage: string | null;
  /** Путь для плеера относительно адреса API */
  contentUrl: string;
  /** Путь для скачивания относительно адреса API */
  downloadUrl: string;
}

/** Строка журнала видеоархива */
export interface VideoRecord {
  id: number;
  /** Номер для заголовка «Видеозапись № 001» */
  number: number;
  uid: string;
  eventType: VideoEventType | string;
  /** «Авторизация», «Выдача» */
  eventTitle: string;
  stationId: number | null;
  stationName: string | null;
  status: RecordStatus;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  files: VideoRecordFile[];
}

export interface VideoStatus {
  ffmpegAvailable: boolean;
  ffmpegVersion: string | null;
  storageDir: string;
  activeRecords: VideoRecord[];
}

/** Запись с живого потока по кнопке «Записать» — файл для скачивания на компьютер зрителя */
export interface VideoClip {
  id: string;
  cameraId: number;
  cameraName: string;
  startedAt: string;
  /** Заполняются после остановки */
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  downloadUrl: string | null;
}

/** Живой поток камеры на сервере: зрители и частота кадров с камеры */
export interface LiveChannelStatus {
  cameraId: number;
  cameraName: string;
  codec: string | null;
  viewers: number;
  fps: number;
  bitrateMbps: number;
  droppedFrames: number;
  startedAt: string;
}

export interface StreamCheck {
  cameraId: number;
  ok: boolean;
  message: string;
  codec: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  elapsedMs: number;
}
