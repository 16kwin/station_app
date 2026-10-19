// videoAccess.ts — политика видео для интерфейса (раздел 8.1 проекта «Дискретное отключение функций»):
// действие доступно, если его разрешает роль пользователя И функция включена на установке.
//  • Роли — как на сервере (VideoAccess): живой просмотр, запись фрагментов, настройки камер и кнопки событий —
//    администратору и директору; журнал, просмотр и скачивание сохранённых записей — всем ролям.
//  • Функции — из профиля установки (featureStore): подфункция выключена — её точек входа нет даже у
//    администратора. Родитель и зависимости хранилище уже учло: video.clips без video.live не включится.
// Файл лежит вне каталога модуля видео: станции, карта и меню спрашивают политику, не подключая сам модуль
// (в сборке без видео его кода нет). Файлы модуля берут её через VideoArchive/access.ts.
import { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { isManagerRole } from '../roles';
import type { FeatureKey } from './catalog';
import { isFeatureOn, useFeature, useFeatureSnapshot } from './featureStore';

/** Что пользователю можно делать с видео на этой установке */
export interface VideoAccess {
  /** Живое видео камер и кадр: окно «Видео» станции, превью и окно «Поток» (video.live) */
  viewLive: boolean;
  /** Кнопка «Записать» в окнах живого видео (video.clips) */
  recordClips: boolean;
  /** Изменение адресов камер и проверка потока (video.cameras) */
  setupCameras: boolean;
  /** Кнопки событий станции на странице архива — запись по событию (video.recording) */
  sendEvents: boolean;
  /** Журнал видеоархива и просмотр сохранённых записей (video.archive) */
  viewArchive: boolean;
  /** Скачивание записи на рабочее место (video.download) */
  downloadVideo: boolean;
}

/** Действия только для администратора и директора; остальные — для всех ролей */
const MANAGER_ONLY: Readonly<Record<keyof VideoAccess, boolean>> = {
  viewLive: true,
  recordClips: true,
  setupCameras: true,
  sendEvents: true,
  viewArchive: false,
  downloadVideo: false,
};

/** Функция установки каждого действия */
const ACTION_FEATURES: Readonly<Record<keyof VideoAccess, FeatureKey>> = {
  viewLive: 'video.live',
  recordClips: 'video.clips',
  setupCameras: 'video.cameras',
  sendEvents: 'video.recording',
  viewArchive: 'video.archive',
  downloadVideo: 'video.download',
};

/**
 * Политика видео по роли и состоянию функций. isOn — включена ли функция (по умолчанию — текущий профиль
 * установки); роль — как в userInfo.role (ADMIN или ROLE_ADMIN)
 */
export const videoAccessFor = (
  role: string | null | undefined,
  isOn: (key: FeatureKey) => boolean = isFeatureOn,
): VideoAccess => {
  const manager = isManagerRole(role);
  const allowed = (action: keyof VideoAccess): boolean => (manager || !MANAGER_ONLY[action]) && isOn(ACTION_FEATURES[action]);
  return {
    viewLive: allowed('viewLive'),
    recordClips: allowed('recordClips'),
    setupCameras: allowed('setupCameras'),
    sendEvents: allowed('sendEvents'),
    viewArchive: allowed('viewArchive'),
    downloadVideo: allowed('downloadVideo'),
  };
};

/** Хук: вся политика видео текущего пользователя; пересчитывается при смене роли или состава функций */
export const useVideoAccess = (): VideoAccess => {
  const role = useAuth().userInfo.role;
  const { on } = useFeatureSnapshot();
  return useMemo(() => videoAccessFor(role, key => on.has(key)), [role, on]);
};

/** Одно действие: роль и функция; подписка только на свою функцию */
const useVideoAction = (action: keyof VideoAccess): boolean => {
  const manager = isManagerRole(useAuth().userInfo.role);
  const on = useFeature(ACTION_FEATURES[action]);
  return on && (manager || !MANAGER_ONLY[action]);
};

/** Живое видео: пункт «Видео» у станции и на карте, превью и окно «Поток» */
export const useCanViewLive = (): boolean => useVideoAction('viewLive');

/** Кнопка «Записать» в окнах живого видео */
export const useCanRecordClips = (): boolean => useVideoAction('recordClips');

/** Правка адресов камер и «Проверить камеру» */
export const useCanSetupCameras = (): boolean => useVideoAction('setupCameras');

/** Кнопки событий станции (запись по событию) */
export const useCanSendEvents = (): boolean => useVideoAction('sendEvents');

/** Журнал видеоархива: раздел и кнопка «Открыть видеоархив» */
export const useCanViewVideoArchive = (): boolean => useVideoAction('viewArchive');

/** Кнопка «Скачать запись» в плеере архива */
export const useCanDownloadVideo = (): boolean => useVideoAction('downloadVideo');
