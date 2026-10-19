// VideoPlayerPopup.tsx — окно «Видеозапись № 001 от 30.09.2026»: период, событие, длительность,
// выбор камер, одно или два видео рядом с общими кнопками, перемотка, время кадра и скачивание.
// Скачивание — функция установки video.download: выключена — кнопки нет. У <video> нет меню «Сохранить
// видео как…», кнопки скачивания и «картинки в картинке». Это уровень L1 (раздел 3.1 проекта): кто может
// смотреть запись, тот может её сохранить (тот же файл отдаёт /content), от curl это не защищает.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VideoRecord, VideoRecordFile } from './types';
import { apiUrl } from './api';
import { COLORS, FONT, SHADOWS } from './theme';
import { formatClock, formatDate, formatDateTime, formatRecordNumber, parseServerDate } from './format';
import { ChevronDownIcon, DownloadIcon, PauseIcon, PlayIcon, StopIcon } from './icons';
import { ActionButton, ModalShell, Spinner } from './ui';
import { useCanDownloadVideo } from './access';

/** Геометрия окна по макету: две камеры — 1242 в ширину, одна — 799 */
const WIDTH_BOTH = 1242;
const WIDTH_SINGLE = 799;
const HEIGHT = 762;
const SIDE = 50;
const VIDEO_W = 545;
const VIDEO_H = 323;
const VIDEO_GAP = 51;
const VIDEO_TOP = 194;
const BAR_TOP = VIDEO_TOP + VIDEO_H + 18;
const TIME_TOP = BAR_TOP + 14;
const INFO_TOP = 76;
const CLOCK_TOP = 583;
const CONTROLS_TOP = 614;
const CLOSE_TOP = 688;
/** Допустимое расхождение двух видео, сек — больше этого второе подтягивается к первому */
const SYNC_TOLERANCE = 0.35;

type ViewMode = 'both' | 'station' | 'overview';

const MODE_LABELS: Record<ViewMode, string> = {
  both: 'Камера станции/Обзорная камера',
  station: 'Камера станции',
  overview: 'Обзорная камера',
};

interface VideoPlayerPopupProps {
  /** Запись остаётся заданной и после закрытия — чтобы окно доиграло анимацию исчезновения */
  record: VideoRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Квадратная кнопка управления плеером 44×44 */
const ControlButton: React.FC<{ label: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  active,
  children,
}) => (
  <motion.button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    whileHover={{ y: -1, boxShadow: SHADOWS.buttonHover }}
    whileTap={{ scale: 0.94 }}
    style={{
      width: 44,
      height: 44,
      borderRadius: 10,
      border: 'none',
      backgroundColor: active ? 'rgba(102, 110, 254, 0.1)' : COLORS.white,
      boxShadow: SHADOWS.button,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
    }}
  >
    {children}
  </motion.button>
);

interface ProgressBarProps {
  width: number;
  current: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

/** Полоса перемотки: клик или перетаскивание. Под ползунком — текущее время, справа — общая длительность */
const ProgressBar: React.FC<ProgressBarProps> = ({ width, current, duration, onSeek }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const share = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;
  const knobX = share * width;

  const seekFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || duration <= 0) return;
    onSeek(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * duration);
  };

  return (
    <div style={{ position: 'relative', width, height: 40 }}>
      <div
        ref={trackRef}
        role="slider"
        aria-label="Позиция видео"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          seekFromPointer(event.clientX);
        }}
        onPointerMove={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromPointer(event.clientX);
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowRight') onSeek(Math.min(duration, current + 5));
          if (event.key === 'ArrowLeft') onSeek(Math.max(0, current - 5));
        }}
        style={{ position: 'absolute', left: 0, top: -6, width, height: 16, cursor: 'pointer', outline: 'none' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 6, width, height: 4, borderRadius: 2, backgroundColor: COLORS.track }} />
        <div style={{ position: 'absolute', left: 0, top: 6, width: knobX, height: 4, borderRadius: 2, backgroundColor: COLORS.text }} />
        <div
          style={{
            position: 'absolute',
            left: knobX - 7,
            top: 1,
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: COLORS.text,
            boxShadow: '0 1px 4px rgba(45, 64, 89, 0.35)',
          }}
        />
      </div>
      <span
        style={{
          position: 'absolute',
          top: TIME_TOP - BAR_TOP,
          left: Math.min(Math.max(knobX, 32), width - 100),
          transform: 'translateX(-50%)',
          fontSize: 16,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatClock(current)}
      </span>
      <span
        style={{
          position: 'absolute',
          top: TIME_TOP - BAR_TOP,
          left: width,
          transform: 'translateX(-50%)',
          fontSize: 16,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatClock(duration)}
      </span>
    </div>
  );
};

const VideoPlayerPopup: React.FC<VideoPlayerPopupProps> = ({ record, isOpen, onClose }) => {
  const canDownload = useCanDownloadVideo();
  const playable = useMemo(() => (record?.files ?? []).filter(file => file.status === 'done'), [record]);
  const failed = useMemo(() => (record?.files ?? []).filter(file => file.status !== 'done'), [record]);
  const stationFile = playable.find(file => file.cameraType === 'station') ?? null;
  const overviewFile = playable.find(file => file.cameraType === 'overview') ?? null;
  const hasBoth = stationFile !== null && overviewFile !== null;

  const [mode, setMode] = useState<ViewMode>('both');
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<number>>(new Set());
  const videos = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Новая запись — исходное состояние: обе камеры, если обе записались
  useEffect(() => {
    if (!record) return;
    setMode(hasBoth ? 'both' : stationFile ? 'station' : 'overview');
    setMenuOpen(false);
    setPlaying(false);
    setCurrent(0);
    setDurations({});
    setErrorIds(new Set());
    setLoadingIds(new Set(playable.map(file => file.id)));
  }, [record, hasBoth, stationFile, playable]);

  const visible: VideoRecordFile[] = useMemo(() => {
    if (mode === 'both') return [stationFile, overviewFile].filter((file): file is VideoRecordFile => file !== null);
    const one = mode === 'station' ? stationFile : overviewFile;
    return one ? [one] : playable.slice(0, 1);
  }, [mode, stationFile, overviewFile, playable]);

  const twoUp = visible.length > 1;
  const width = twoUp ? WIDTH_BOTH : WIDTH_SINGLE;
  const masterId = visible[0]?.id ?? null;
  const masterDuration = masterId !== null ? durations[masterId] ?? visible[0]?.durationSeconds ?? 0 : 0;

  const visibleVideos = useCallback(
    () => visible.map(file => videos.current.get(file.id)).filter((video): video is HTMLVideoElement => Boolean(video)),
    [visible],
  );

  // Смена набора камер — пауза и выравнивание позиции, чтобы видео шли вместе
  useEffect(() => {
    for (const video of visibleVideos()) {
      video.pause();
      if (Math.abs(video.currentTime - current) > SYNC_TOLERANCE) video.currentTime = Math.min(current, video.duration || current);
    }
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const play = () => {
    const list = visibleVideos();
    if (list.length === 0) return;
    // Досмотрели до конца — начать сначала
    if (masterDuration > 0 && current >= masterDuration - 0.05) {
      list.forEach(video => (video.currentTime = 0));
      setCurrent(0);
    }
    list.forEach(video => {
      video.play().catch(() => setPlaying(false));
    });
    setPlaying(true);
  };

  const pause = () => {
    visibleVideos().forEach(video => video.pause());
    setPlaying(false);
  };

  const stop = () => {
    visibleVideos().forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
    setPlaying(false);
    setCurrent(0);
  };

  const seek = (seconds: number) => {
    visibleVideos().forEach(video => {
      video.currentTime = Math.min(seconds, Number.isFinite(video.duration) ? video.duration : seconds);
    });
    setCurrent(seconds);
  };

  /** Скачать видимые записи — по файлу на камеру */
  const download = () => {
    if (!canDownload) return;
    visible.forEach((file, index) => {
      window.setTimeout(() => {
        const link = document.createElement('a');
        link.href = apiUrl(file.downloadUrl);
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 400);
    });
  };

  // Закрытие окна останавливает воспроизведение
  useEffect(() => {
    if (!isOpen) {
      videos.current.forEach(video => video.pause());
      setPlaying(false);
    }
  }, [isOpen]);

  // Пробел — пуск и пауза
  useEffect(() => {
    if (!record || !isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || (event.target as HTMLElement)?.tagName === 'INPUT') return;
      event.preventDefault();
      if (playing) pause();
      else play();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTimeUpdate = (file: VideoRecordFile, video: HTMLVideoElement) => {
    if (file.id !== masterId) return;
    setCurrent(video.currentTime);
    // Второе видео подтягивается к первому, если разошлось
    for (const other of visibleVideos()) {
      if (other !== video && Math.abs(other.currentTime - video.currentTime) > SYNC_TOLERANCE) {
        other.currentTime = Math.min(video.currentTime, other.duration || video.currentTime);
      }
    }
  };

  const markLoaded = (id: number) =>
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  if (!record) return null;

  const started = parseServerDate(record.startedAt);
  const finished = record.finishedAt ? parseServerDate(record.finishedAt) : null;
  const frameTime = new Date(started.getTime() + current * 1000);
  const firstLeft = twoUp ? SIDE : (WIDTH_SINGLE - VIDEO_W) / 2;
  const availableModes: ViewMode[] = hasBoth ? ['both', 'station', 'overview'] : [mode];

  const infoLine: React.CSSProperties = { fontSize: 15, lineHeight: '18px', whiteSpace: 'nowrap' };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      width={width}
      height={HEIGHT}
      animateSize
      title={`Видеозапись № ${formatRecordNumber(record.number)} от ${formatDate(started)}`}
    >
      {/* Сведения о записи */}
      <div style={{ position: 'absolute', left: SIDE, top: INFO_TOP, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <span style={infoLine}>
          Период: {formatDateTime(started)} - {finished ? formatDateTime(finished) : '…'}
        </span>
        <span style={infoLine}>Событие: {record.eventTitle}</span>
        <span style={infoLine}>Продолжительность видео: {formatClock(record.durationSeconds)}</span>
        {failed.length > 0 && (
          <span style={{ ...infoLine, fontSize: 13, color: COLORS.rec, whiteSpace: 'normal', maxWidth: width - 2 * SIDE - 320 }}>
            {failed.map(file => `${file.cameraTitle}: ${file.errorMessage ?? 'нет файла'}`).join('; ')}
          </span>
        )}
      </div>

      {/* Выбор камер */}
      <div style={{ position: 'absolute', right: SIDE, top: INFO_TOP - 6 }}>
        <button
          type="button"
          onClick={() => hasBoth && setMenuOpen(open => !open)}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 30,
            padding: '0 4px',
            border: 'none',
            background: 'transparent',
            fontFamily: FONT,
            fontSize: 15,
            color: COLORS.text,
            cursor: hasBoth ? 'pointer' : 'default',
          }}
        >
          {MODE_LABELS[mode]}
          {hasBoth && (
            <motion.span animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
              <ChevronDownIcon />
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              role="listbox"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 36,
                margin: 0,
                padding: 6,
                listStyle: 'none',
                minWidth: 280,
                backgroundColor: COLORS.white,
                borderRadius: 12,
                boxShadow: '0 18px 16px rgba(50, 50, 71, 0.06), 0 8px 8px rgba(50, 50, 71, 0.08)',
                border: `1px solid ${COLORS.rowBorder}`,
                zIndex: 3,
              }}
            >
              {availableModes.map(option => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === mode}
                    onClick={() => {
                      setMode(option);
                      setMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: 8,
                      backgroundColor: option === mode ? 'rgba(102, 110, 254, 0.08)' : 'transparent',
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: option === mode ? 600 : 500,
                      color: option === mode ? COLORS.accent : COLORS.text,
                      cursor: 'pointer',
                    }}
                  >
                    {MODE_LABELS[option]}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Видео камер */}
      {playable.length === 0 && (
        <div
          style={{
            position: 'absolute',
            left: SIDE,
            right: SIDE,
            top: VIDEO_TOP,
            height: VIDEO_H,
            borderRadius: 10,
            backgroundColor: '#F1F3F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.muted,
            fontSize: 15,
          }}
        >
          Ни одна камера не записала это событие
        </div>
      )}

      <AnimatePresence initial={false}>
        {visible.map((file, index) => {
          const left = firstLeft + index * (VIDEO_W + VIDEO_GAP);
          const duration = durations[file.id] ?? file.durationSeconds ?? 0;
          const videoCurrent = file.id === masterId ? current : Math.min(current, duration);
          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, left }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              style={{ position: 'absolute', top: VIDEO_TOP - 26, width: VIDEO_W }}
            >
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 500, color: COLORS.accent, height: 26 }}>{file.cameraTitle}</div>
              <div
                style={{
                  position: 'relative',
                  width: VIDEO_W,
                  height: VIDEO_H,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: '#0E1118',
                  border: `1.5px solid ${COLORS.text}`,
                }}
              >
                <video
                  ref={element => {
                    if (element) videos.current.set(file.id, element);
                    else videos.current.delete(file.id);
                  }}
                  src={apiUrl(file.contentUrl)}
                  preload="metadata"
                  playsInline
                  muted
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={event => event.preventDefault()}
                  onLoadedMetadata={event => {
                    const value = event.currentTarget.duration;
                    if (Number.isFinite(value)) setDurations(prev => ({ ...prev, [file.id]: value }));
                  }}
                  onCanPlay={() => markLoaded(file.id)}
                  onTimeUpdate={event => onTimeUpdate(file, event.currentTarget)}
                  onEnded={() => file.id === masterId && setPlaying(false)}
                  onError={() => {
                    markLoaded(file.id);
                    setErrorIds(prev => new Set(prev).add(file.id));
                  }}
                  onClick={() => (playing ? pause() : play())}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                />
                {(loadingIds.has(file.id) || errorIds.has(file.id)) && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      color: '#C9D0DE',
                      fontSize: 14,
                      backgroundColor: 'rgba(14, 17, 24, 0.6)',
                    }}
                  >
                    {errorIds.has(file.id) ? 'Не удалось загрузить видео' : (
                      <>
                        <Spinner color="#C9D0DE" /> Загрузка видео…
                      </>
                    )}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 18 }}>
                <ProgressBar width={VIDEO_W} current={videoCurrent} duration={duration} onSeek={seek} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Время кадра — начало записи плюс позиция */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: CLOCK_TOP,
          textAlign: 'center',
          fontSize: 16,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatDateTime(frameTime)}
      </div>

      {/* Управление */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: CONTROLS_TOP, display: 'flex', justifyContent: 'center', gap: 25 }}>
        <ControlButton label="Воспроизвести" onClick={play} active={playing}>
          <PlayIcon color={playing ? COLORS.accent : COLORS.text} />
        </ControlButton>
        <ControlButton label="Пауза" onClick={pause}>
          <PauseIcon />
        </ControlButton>
        <ControlButton label="Стоп" onClick={stop}>
          <StopIcon />
        </ControlButton>
        {canDownload && (
          <ControlButton label={twoUp ? 'Скачать обе записи' : 'Скачать запись'} onClick={download}>
            <DownloadIcon />
          </ControlButton>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: CLOSE_TOP, display: 'flex', justifyContent: 'center' }}>
        <ActionButton label="Закрыть" width={168} height={44} onClick={onClose} />
      </div>
    </ModalShell>
  );
};

export default VideoPlayerPopup;
