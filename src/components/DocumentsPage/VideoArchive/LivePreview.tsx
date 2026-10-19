// LivePreview.tsx — превью «Видеопоток Cam01» внизу страницы: живое видео камеры 25 к/с,
// отметка REC во время записи. Клик открывает окно потока камеры.
import React from 'react';
import { motion } from 'framer-motion';
import type { VideoCamera } from './types';
import { COLORS, FONT } from './theme';
import LiveVideo from './LiveVideo';

/** Размер превью и положение первого на холсте 1800×840; следующее — правее на шаг */
const PREVIEW = { left: 50, top: 708, width: 198, height: 120, step: 220 } as const;

interface LivePreviewProps {
  camera: VideoCamera;
  index: number;
  onOpen: (camera: VideoCamera) => void;
  /** Пауза, пока поверх открыто окно просмотра: видео под размытым фоном только нагружает браузер */
  paused?: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({ camera, index, onOpen, paused = false }) => {
  const left = PREVIEW.left + index * PREVIEW.step;

  return (
    <>
      <span
        style={{
          position: 'absolute',
          left,
          top: PREVIEW.top - 22,
          width: PREVIEW.width,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.text,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        Видеопоток {camera.name}
      </span>

      <motion.button
        type="button"
        onClick={() => onOpen(camera)}
        aria-label={`Открыть поток ${camera.name}`}
        whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(102, 110, 254, 0.22)' }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'absolute',
          left,
          top: PREVIEW.top,
          width: PREVIEW.width,
          height: PREVIEW.height,
          padding: 0,
          borderRadius: 10,
          border: `1.5px solid ${camera.recording ? COLORS.rec : COLORS.fieldBorder}`,
          overflow: 'hidden',
          backgroundColor: '#0E1118',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'border-color 0.25s ease',
        }}
      >
        <LiveVideo camera={camera} size="preview" fit="cover" enabled={!paused} />
      </motion.button>
    </>
  );
};

export default LivePreview;
