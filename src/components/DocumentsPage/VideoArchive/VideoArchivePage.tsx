// VideoArchivePage.tsx — страница «Журнал событий: видеоархив»: камеры станции, журнал видеозаписей
// по событиям, живые превью камер и кнопки имитации событий (Login / Logout, Выдача начало / окончание).
// Настройки камер, живое видео и кнопки событий — администратору и директору; остальным ролям — только журнал.
// Каждая часть страницы — ещё и функция установки (services/features/videoAccess.ts): живое видео (video.live),
// правка камер (video.cameras), кнопки событий (video.recording), журнал (video.archive), скачивание
// (video.download). Выключенной функции на странице нет, и её адреса API страница не запрашивает.
// Состояние модуля опрашивается, только пока есть что показывать (живое видео или запись по событиям) и
// вкладка архива активна в приложении: скрытая вкладка приложения сервер не нагружает.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTabs } from '../../../context/TabContext';
import { useFeature } from '../../../services/features/featureStore';
import type { VideoCamera, VideoEventPhase, VideoEventType, VideoRecord, VideoStatus } from './types';
import { errorText, fetchCameras, fetchRecords, fetchStatus, sendEvent } from './api';
import { COLORS, FONT, STATUS_POLL_MS } from './theme';
import { formatClock, formatRecordNumber } from './format';
import CameraSettingsCard from './CameraSettingsCard';
import RecordsTable from './RecordsTable';
import LivePreview from './LivePreview';
import EventPanel from './EventPanel';
import type { BusyKey } from './EventPanel';
import VideoPlayerPopup from './VideoPlayerPopup';
import StreamPopup from './StreamPopup';
import { useVideoAccess } from './access';

/** Путь раздела во вкладках приложения */
const ARCHIVE_PATH = '/documents/video-archive';

/** Название события в сообщениях */
const EVENT_TITLES: Record<VideoEventType, string> = { authority: 'Авторизация', issue: 'Выдача' };

interface Notice {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}

/** Сколько держать сообщение на экране, мс */
const NOTICE_MS = 6000;

const VideoArchivePage: React.FC = () => {
  const { tabs, activeTabId, closeTab } = useTabs();
  const access = useVideoAccess();
  // Карточка камер — чтобы смотреть поток или править адреса; без них на её месте журнал
  const showCameras = access.viewLive || access.setupCameras;
  const liveOn = useFeature('video.live');
  const recordingOn = useFeature('video.recording');
  const tabActive = tabs.find(item => item.id === activeTabId)?.path.split('?')[0] === ARCHIVE_PATH;
  const pollStatus = (liveOn || recordingOn) && tabActive;

  const [cameras, setCameras] = useState<VideoCamera[]>([]);
  const [records, setRecords] = useState<VideoRecord[]>([]);
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyKey>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [playerRecord, setPlayerRecord] = useState<VideoRecord | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [streamCamera, setStreamCamera] = useState<VideoCamera | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);

  /** id записей, которые шли при прошлом опросе — чтобы заметить запись, оборвавшуюся сама */
  const knownActive = useRef<Set<number>>(new Set());
  const noticeTimer = useRef<number | undefined>(undefined);

  const showNotice = useCallback((kind: Notice['kind'], text: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ id: Date.now(), kind, text });
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  // Журнал — только при функции video.archive (иначе ворота сервера отвечают 404)
  const archiveOn = access.viewArchive;
  const reloadRecords = useCallback(async () => {
    const list = archiveOn ? await fetchRecords() : [];
    setRecords(list);
    return list;
  }, [archiveOn]);

  // Первая загрузка: камеры, журнал и состояние модуля
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCameras(), archiveOn ? fetchRecords() : Promise.resolve([]), fetchStatus()])
      .then(([cameraList, recordList, moduleStatus]) => {
        if (cancelled) return;
        setCameras(cameraList);
        setRecords(recordList);
        setStatus(moduleStatus);
        knownActive.current = new Set(moduleStatus.activeRecords.map(record => record.id));
        setLoadError(null);
      })
      .catch(error => {
        if (!cancelled) setLoadError(errorText(error, 'Не удалось загрузить видеоархив. Проверьте, что сервер запущен'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveOn]);

  // Опрос состояния: отметки REC, строка идущей записи, запись, оборвавшаяся сама (камера отключилась).
  // Только при живом видео или записи по событиям и только на активной вкладке архива
  useEffect(() => {
    if (!pollStatus) return;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const moduleStatus = await fetchStatus();
        setStatus(moduleStatus);
        const nowActive = new Set(moduleStatus.activeRecords.map(record => record.id));
        const ended = [...knownActive.current].filter(id => !nowActive.has(id));
        const started = [...nowActive].some(id => !knownActive.current.has(id));
        knownActive.current = nowActive;
        if (ended.length > 0 || started || nowActive.size > 0) {
          const list = await reloadRecords();
          const failed = list.find(record => ended.includes(record.id) && record.status === 'failed');
          if (failed) showNotice('error', `Запись «${failed.eventTitle}» не удалась: ${failed.errorMessage ?? 'нет причины'}`);
        }
      } catch {
        // временная ошибка сети — следующий опрос повторит
      }
    }, STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [pollStatus, reloadRecords, showNotice]);

  // Камеры, которые пишут сейчас: по файлам идущих записей
  const recordingCameraIds = useMemo(() => {
    const ids = new Set<number>();
    for (const record of status?.activeRecords ?? []) {
      for (const file of record.files) if (file.status === 'recording' && file.cameraId !== null) ids.add(file.cameraId);
    }
    return ids;
  }, [status]);

  const camerasWithState = useMemo(
    () => cameras.map(camera => ({ ...camera, recording: recordingCameraIds.has(camera.id) })),
    [cameras, recordingCameraIds],
  );

  /** События относятся к станции, к которой привязаны камеры */
  const stationId = useMemo(() => cameras.find(camera => camera.stationId !== null)?.stationId ?? null, [cameras]);
  const stationName = useMemo(() => cameras.find(camera => camera.stationId !== null)?.stationName ?? null, [cameras]);

  const active = useMemo<Record<VideoEventType, boolean>>(() => {
    const list = (status?.activeRecords ?? []).filter(record => record.stationId === stationId);
    return {
      authority: list.some(record => record.eventType === 'authority'),
      issue: list.some(record => record.eventType === 'issue'),
    };
  }, [status, stationId]);

  const disabledReason =
    loadError !== null
      ? 'Сервер видеоархива недоступен'
      : stationId === null
        ? 'Камеры не привязаны к станции'
        : status && !status.ffmpegAvailable
          ? 'На сервере не найден FFmpeg'
          : null;

  const handleEvent = async (type: VideoEventType, phase: VideoEventPhase) => {
    if (stationId === null) return;
    setBusy(`${type}:${phase}`);
    try {
      const record = await sendEvent(stationId, type, phase);
      if (phase === 'start') {
        const names = record.files.map(file => file.cameraName).join(', ');
        if (record.status === 'failed') showNotice('error', `Запись не началась: ${record.errorMessage ?? 'камеры не ответили'}`);
        else showNotice('info', `Идёт запись «${EVENT_TITLES[type]}»: ${names}`);
      } else if (record.status === 'done') {
        showNotice('ok', `Видеозапись № ${formatRecordNumber(record.number)} сохранена · ${formatClock(record.durationSeconds)}`);
      } else {
        showNotice('error', `Видео не сохранено: ${record.errorMessage ?? 'камеры не передали кадры'}`);
      }
      const [moduleStatus] = await Promise.all([fetchStatus(), reloadRecords()]);
      setStatus(moduleStatus);
      knownActive.current = new Set(moduleStatus.activeRecords.map(item => item.id));
    } catch (error) {
      showNotice('error', errorText(error, 'Сервер не принял событие'));
      try {
        setStatus(await fetchStatus());
      } catch {
        // состояние обновит следующий опрос
      }
    } finally {
      setBusy(null);
    }
  };

  const handleCameraUpdated = (camera: VideoCamera) =>
    setCameras(prev => prev.map(item => (item.id === camera.id ? camera : item)));

  const openPlayer = (record: VideoRecord) => {
    setPlayerRecord(record);
    setPlayerOpen(true);
  };

  const openStream = (camera: VideoCamera) => {
    setStreamCamera(camera);
    setStreamOpen(true);
  };

  const handleClose = () => {
    const tab = tabs.find(item => item.id === activeTabId);
    if (tab) closeTab(tab.id);
  };

  const noticeColors: Record<Notice['kind'], { bg: string; fg: string; dot: string }> = {
    ok: { bg: COLORS.okSoft, fg: COLORS.ok, dot: COLORS.ok },
    error: { bg: COLORS.errorSoft, fg: COLORS.rec, dot: COLORS.rec },
    info: { bg: 'rgba(102, 110, 254, 0.1)', fg: COLORS.accent, dot: COLORS.rec },
  };

  // Камера, открытая в окне «Поток», — с актуальной отметкой REC
  const streamCameraLive = streamCamera
    ? camerasWithState.find(camera => camera.id === streamCamera.id) ?? streamCamera
    : null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 840,
        backgroundColor: COLORS.pageBg,
        overflow: 'hidden',
        fontFamily: FONT,
        color: COLORS.text,
      }}
    >
      {/* Заголовок */}
      <h1
        style={{
          position: 'absolute',
          top: 35,
          left: 60,
          margin: 0,
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 600,
          lineHeight: '29px',
          color: COLORS.text,
        }}
      >
        Журнал событий: видеоархив
      </h1>

      {/* Состояние модуля: FFmpeg и каталог архива — пригодится при настройке стенда */}
      <div
        style={{
          position: 'absolute',
          top: 42,
          right: 40,
          maxWidth: 900,
          fontSize: 13,
          color: status && !status.ffmpegAvailable ? COLORS.rec : COLORS.muted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'right',
        }}
        title={status?.storageDir}
      >
        {status === null
          ? ''
          : status.ffmpegAvailable
            ? [
                stationName ? `Станция: ${stationName}` : null,
                `FFmpeg ${status.ffmpegVersion?.match(/version\s+(\d+(?:\.\d+)*)/)?.[1] ?? ''}`.trim(),
                `архив: ${status.storageDir}`,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'FFmpeg не найден на сервере: проверьте video.ffmpeg-path в application.properties'}
      </div>

      {loadError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            top: 100,
            padding: '18px 24px',
            borderRadius: 12,
            backgroundColor: COLORS.errorSoft,
            color: COLORS.rec,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {loadError}
        </motion.div>
      ) : (
        <>
          {showCameras ? (
            <>
              <CameraSettingsCard cameras={camerasWithState} onUpdated={handleCameraUpdated} onOpenStream={openStream} onMessage={showNotice} />
              {archiveOn && <RecordsTable records={records} loading={loading} onOpen={openPlayer} />}
              {access.viewLive &&
                camerasWithState.slice(0, 2).map((camera, index) => (
                  <LivePreview key={camera.id} camera={camera} index={index} onOpen={openStream} paused={streamOpen || playerOpen} />
                ))}
            </>
          ) : (
            // Только журнал: таблица на месте настроек камер и выше
            archiveOn && <RecordsTable records={records} loading={loading} onOpen={openPlayer} top={100} visibleRows={9} />
          )}
        </>
      )}

      {/* Сообщение о последнем действии — между превью и кнопками событий */}
      <div style={{ position: 'absolute', left: 495, width: 410, top: 752, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {notice && (
            <motion.div
              key={notice.id}
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: '100%',
                padding: '10px 16px',
                borderRadius: 10,
                backgroundColor: noticeColors[notice.kind].bg,
                color: noticeColors[notice.kind].fg,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: '18px',
              }}
            >
              {notice.kind === 'info' ? (
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: noticeColors[notice.kind].dot }}
                />
              ) : (
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: noticeColors[notice.kind].dot }} />
              )}
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notice.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EventPanel active={active} busy={busy} disabledReason={disabledReason} onEvent={handleEvent} onClose={handleClose} showEvents={access.sendEvents} />

      {archiveOn && <VideoPlayerPopup record={playerRecord} isOpen={playerOpen} onClose={() => setPlayerOpen(false)} />}
      {access.viewLive && <StreamPopup camera={streamCameraLive} isOpen={streamOpen} onClose={() => setStreamOpen(false)} />}
    </div>
  );
};

export default VideoArchivePage;
