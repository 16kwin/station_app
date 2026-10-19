// StationVideoPopup.tsx — окно «Видео» из карточки станции на панели управления станциями: живое видео
// всех камер станции 25 к/с, отметка REC во время записи по событиям, запись живого видео на этот компьютер.
// Клик по камере открывает её крупно в окне «Поток». Доступно администратору и директору при включённом
// живом просмотре (video.live) — окно показывает страница станций. «Записать» — при функции video.clips,
// «Открыть видеоархив» — при video.archive: выключенной функции кнопки нет.
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTabs } from '../../../context/TabContext';
import type { LiveChannelStatus, VideoCamera } from './types';
import { errorText, fetchLiveStatus, fetchStationCameras } from './api';
import { COLORS, FONT, STATUS_POLL_MS } from './theme';
import { BulletCameraIcon, DomeCameraIcon } from './icons';
import { ActionButton, ModalShell, RecordButton, Spinner } from './ui';
import LiveVideo from './LiveVideo';
import StreamPopup from './StreamPopup';
import { useClipRecorder } from './useClipRecorder';
import { useCanViewVideoArchive } from './access';

const WIDTH = 1260;
const TILE_W = 560;
const TILE_H = 315;
const TILE_GAP = 40;
const ROW_H = TILE_H + 34;

export interface StationVideoTarget {
  uid: string;
  name: string;
  workshop?: string;
  section?: string;
  /** Код статуса станции: WORKING, OFFLINE, MINIMAL_STOCK, CRITICAL_STOCK */
  status?: string;
}

/** Подписи статусов — как на карточке станции */
const STATUS_TEXT: Record<string, string> = {
  WORKING: 'В работе',
  OFFLINE: 'Не в сети',
  MINIMAL_STOCK: 'Минимальный остаток',
  CRITICAL_STOCK: 'Критический остаток',
};

interface StationVideoPopupProps {
  /** Станция остаётся заданной после закрытия — для анимации исчезновения */
  station: StationVideoTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

const StationVideoPopup: React.FC<StationVideoPopupProps> = ({ station, isOpen, onClose }) => {
  const { openTab } = useTabs();
  // Камеры и ошибка привязаны к станции: при открытии окна другой станции старые данные не показываются
  const [loaded, setLoaded] = useState<{ uid: string; cameras: VideoCamera[] } | null>(null);
  const [failed, setFailed] = useState<{ uid: string; message: string } | null>(null);
  const [live, setLive] = useState<LiveChannelStatus[]>([]);
  const [zoomCamera, setZoomCamera] = useState<VideoCamera | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  const cameras = station && loaded?.uid === station.uid ? loaded.cameras : null;
  const loadError = station && failed?.uid === station.uid ? failed.message : null;
  const visibleCameras = useMemo(() => (cameras ?? []).slice(0, 4), [cameras]);
  const recorder = useClipRecorder(visibleCameras, station?.name);
  const canOpenArchive = useCanViewVideoArchive();

  // Камеры станции и отметки REC; пока окно открыто — опрос, чтобы REC появлялся при событиях станции
  useEffect(() => {
    if (!isOpen || !station) return;
    let cancelled = false;
    const uid = station.uid;
    const load = async () => {
      try {
        const [list, channels] = await Promise.all([fetchStationCameras(uid), fetchLiveStatus().catch(() => [])]);
        if (cancelled) return;
        setLoaded({ uid, cameras: list });
        setLive(channels);
        setFailed(null);
      } catch (error) {
        if (!cancelled) setFailed({ uid, message: errorText(error, 'Не удалось загрузить камеры станции') });
      }
    };
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden) load();
    }, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, station]);

  if (!station) return null;

  const rows = Math.max(1, Math.ceil(visibleCameras.length / 2));
  // Заголовок и подпись сверху, строка состояния и кнопки снизу — плюс ряды камер
  const height = 260 + rows * ROW_H - 20;
  const subtitle = [station.workshop, station.section].filter(Boolean).join(' · ');
  const anyRecording = visibleCameras.some(camera => camera.recording);
  const statusText = station.status ? STATUS_TEXT[station.status] ?? station.status : null;

  const handleClose = () => {
    if (recorder.recording) recorder.stop();
    onClose();
  };

  const openArchive = () => {
    openTab('/documents/video-archive', 'Журнал событий: видеоархив', null);
    handleClose();
  };

  // Что сервер получает с камер станции: частота кадров и число зрителей — видно, что поток не проседает
  const serverLine = visibleCameras
    .map(camera => {
      const channel = live.find(item => item.cameraId === camera.id);
      return channel ? `${camera.name} — ${channel.fps.toFixed(1).replace('.', ',')} к/с, зрителей ${channel.viewers}` : null;
    })
    .filter(Boolean)
    .join(' · ');

  const statusLine = recorder.error
    ? { text: recorder.error, color: COLORS.rec }
    : recorder.saved.length > 0
      ? { text: `Сохранено на этот компьютер: ${recorder.saved.join(', ')}`, color: COLORS.ok }
      : anyRecording
        ? { text: 'Идёт запись по событию станции', color: COLORS.rec }
        : serverLine
          ? { text: `Сервер получает: ${serverLine}`, color: COLORS.muted }
          : null;

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={handleClose} width={WIDTH} height={height} title={`Видео станции «${station.name}»`}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 66, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 14, color: COLORS.muted }}>
          {subtitle && <span>{subtitle}</span>}
          {statusText && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: station.status === 'OFFLINE' ? COLORS.muted : COLORS.ok }} />
              {statusText}
            </span>
          )}
        </div>

        {/* Камеры станции */}
        <div style={{ position: 'absolute', left: 50, right: 50, top: 108, bottom: 116 }}>
          {loadError ? (
            <EmptyState text={loadError} tone="error" />
          ) : cameras === null ? (
            <EmptyState text="Загрузка камер станции…" tone="loading" />
          ) : visibleCameras.length === 0 ? (
            <EmptyState
              text="К станции не привязаны камеры"
              hint={canOpenArchive ? 'Камеры станции настраиваются в «Журнал событий: видеоархив»' : undefined}
              tone="empty"
            />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: TILE_GAP, rowGap: 14 }}>
              {visibleCameras.map(camera => (
                <div key={camera.id} style={{ width: TILE_W }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 26, marginBottom: 8, fontSize: 15, fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', transform: 'scale(0.62)', transformOrigin: 'left center', width: 34 }}>
                      {camera.cameraType === 'overview' ? <BulletCameraIcon /> : <DomeCameraIcon />}
                    </span>
                    <span>{camera.cameraType === 'overview' ? 'Обзорная камера' : 'Камера станции'}</span>
                    <span style={{ color: COLORS.muted, fontWeight: 400 }}>
                      {camera.name} · {camera.ip}
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setZoomCamera(camera);
                      setZoomOpen(true);
                    }}
                    aria-label={`Открыть ${camera.name} крупно`}
                    title="Открыть крупно"
                    whileHover={{ y: -2, boxShadow: '0 10px 24px rgba(102, 110, 254, 0.22)' }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'relative',
                      display: 'block',
                      width: TILE_W,
                      height: TILE_H,
                      padding: 0,
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                      border: `1.5px solid ${camera.recording || recorder.recording ? COLORS.rec : COLORS.text}`,
                      backgroundColor: '#0E1118',
                      transition: 'border-color 0.25s ease',
                    }}
                  >
                    {/* Пока камера открыта крупно, плитки на паузе — браузер декодирует одно видео, а не три */}
                    {isOpen && <LiveVideo camera={camera} size="large" enabled={!zoomOpen} />}
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Строка состояния: запись, сохранение или что сервер получает с камер */}
        <div style={{ position: 'absolute', left: 50, right: 50, bottom: 86, height: 20, display: 'flex', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {statusLine && (
              <motion.span
                key={statusLine.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 13, fontWeight: 500, color: statusLine.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}
              >
                {statusLine.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, display: 'flex', justifyContent: 'center', gap: 20 }}>
          {recorder.available && (
            <RecordButton
              recording={recorder.recording}
              elapsed={recorder.elapsed}
              busy={recorder.busy}
              disabled={visibleCameras.length === 0}
              onClick={recorder.recording ? recorder.stop : recorder.start}
            />
          )}
          {canOpenArchive && <ActionButton label="Открыть видеоархив" width={220} height={44} onClick={openArchive} />}
          <ActionButton label="Закрыть" width={168} height={44} onClick={handleClose} />
        </div>
      </ModalShell>

      <StreamPopup
        camera={zoomCamera ? visibleCameras.find(camera => camera.id === zoomCamera.id) ?? zoomCamera : null}
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </>
  );
};

/** Заглушка вместо камер: загрузка, нет камер или ошибка */
const EmptyState: React.FC<{ text: string; hint?: string; tone: 'loading' | 'empty' | 'error' }> = ({ text, hint, tone }) => (
  <div
    style={{
      height: TILE_H + 34,
      borderRadius: 12,
      border: `1.5px dashed ${tone === 'error' ? COLORS.rec : COLORS.fieldBorder}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontFamily: FONT,
      color: tone === 'error' ? COLORS.rec : COLORS.text,
      textAlign: 'center',
    }}
  >
    {tone === 'loading' ? <Spinner size={22} /> : tone === 'empty' ? <DomeCameraIcon /> : null}
    <span style={{ fontSize: 16, fontWeight: 500 }}>{text}</span>
    {hint && <span style={{ fontSize: 14, color: COLORS.muted }}>{hint}</span>}
  </div>
);

export default StationVideoPopup;
