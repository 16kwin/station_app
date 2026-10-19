// LiveVideo.tsx — живое видео камеры: поток 25 к/с через MediaSource (useLiveStream) и подписи поверх кадра —
// подключение, причина ошибки, отметка REC, частота кадров и задержка показа.
// Видео, которого не видно (вкладка приложения скрыта) или которое поставлено на паузу, не воспроизводится:
// браузер не тратит силы на декодирование, сервер — на лишнего зрителя.
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VideoCamera } from './types';
import { COLORS, FONT } from './theme';
import { NoSignalIcon, PauseIcon } from './icons';
import { RecBadge, Spinner } from './ui';
import { useLiveStream } from './useLiveStream';
import type { LiveStats } from './useLiveStream';

interface LiveVideoProps {
  camera: VideoCamera;
  /** Крупный вид — подписи и счётчик к/с крупнее; превью — компактные */
  size?: 'preview' | 'large';
  /** Показывать счётчик к/с и задержку */
  showStats?: boolean;
  /** Поток идёт, только пока true; false — пауза, например пока поверх открыто окно просмотра */
  enabled?: boolean;
  /** Как вписать кадр: целиком (contain) или заполнить (cover) */
  fit?: 'contain' | 'cover';
  /** Состояние потока наружу — для строки под видео */
  onStats?: (stats: LiveStats) => void;
}

const LiveVideo: React.FC<LiveVideoProps> = ({ camera, size = 'large', showStats = true, enabled = true, fit = 'contain', onStats }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Видно ли видео: вкладки приложения остаются на странице скрытыми — такое видео ставится на паузу
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const active = enabled && visible;
  const { videoRef, stats } = useLiveStream(camera.id, active);
  const compact = size === 'preview';
  const playing = active && stats.state === 'playing';

  useEffect(() => {
    onStats?.(stats);
  }, [stats, onStats]);

  const overlayText =
    stats.state === 'error'
      ? stats.error
      : stats.state === 'reconnecting'
        ? stats.error ?? 'Переподключение…'
        : 'Подключение к камере…';

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, backgroundColor: '#0E1118', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        disablePictureInPicture
        aria-label={`Живое видео камеры ${camera.name}`}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: fit,
          opacity: playing ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Пауза: видео не видно или поверх открыто окно просмотра */}
      {!active && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PauseIcon size={compact ? 18 : 28} color="#7B8496" />
        </div>
      )}

      {/* Нет картинки: подключение, переподключение или причина */}
      <AnimatePresence>
        {active && !playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            title={overlayText ?? undefined}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 6 : 12,
              padding: compact ? '0 12px' : '0 60px',
              fontFamily: FONT,
              fontSize: compact ? 11 : 15,
              fontWeight: 500,
              lineHeight: compact ? '14px' : '20px',
              color: '#C9D0DE',
              textAlign: 'center',
            }}
          >
            {stats.state === 'error' ? <NoSignalIcon color="#C9D0DE" /> : <Spinner color="#C9D0DE" size={compact ? 14 : 22} />}
            <span style={{ display: '-webkit-box', WebkitLineClamp: compact ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {overlayText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {camera.recording && (
          <span style={{ position: 'absolute', top: compact ? 6 : 12, right: compact ? 6 : 12 }}>
            <RecBadge compact={compact} />
          </span>
        )}
      </AnimatePresence>

      {/* Частота кадров на экране и задержка показа — видно, что поток живой и не отстаёт */}
      {showStats && playing && stats.fps !== null && (
        <span
          style={{
            position: 'absolute',
            left: compact ? 6 : 12,
            bottom: compact ? 5 : 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: compact ? '1px 6px' : '3px 9px',
            borderRadius: 6,
            backgroundColor: 'rgba(14, 17, 24, 0.6)',
            color: '#E4E8F0',
            fontFamily: FONT,
            fontSize: compact ? 10 : 12,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: compact ? 6 : 7, height: compact ? 6 : 7, borderRadius: '50%', backgroundColor: COLORS.ok }} />
          {stats.fps} к/с
          {!compact && stats.lagSeconds !== null && ` · задержка ${stats.lagSeconds.toFixed(1).replace('.', ',')} с`}
        </span>
      )}
    </div>
  );
};

export default LiveVideo;
