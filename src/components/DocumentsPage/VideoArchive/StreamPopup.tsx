// StreamPopup.tsx — окно кнопки «Поток»: живое видео камеры 25 к/с со строкой состояния (кодек, размер кадра,
// частота на экране, задержка), проверка камеры по кнопке и запись живого видео на этот компьютер.
// Окно открывают только при живом просмотре (video.live); «Записать» — при функции video.clips,
// «Проверить камеру» — при video.cameras: выключенной функции кнопки нет.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { StreamCheck, VideoCamera } from './types';
import { checkCamera, errorText } from './api';
import { COLORS } from './theme';
import { ActionButton, ModalShell, RecordButton, Spinner } from './ui';
import LiveVideo from './LiveVideo';
import type { LiveStats } from './useLiveStream';
import { useClipRecorder } from './useClipRecorder';
import { useCanSetupCameras } from './access';

const WIDTH = 900;
const HEIGHT = 744;
const VIEW_W = 800;
const VIEW_H = 450;
/** Сколько показывать результат проверки камеры, прежде чем вернуть строку живого видео, мс */
const CHECK_SHOWN_MS = 12_000;

/** hev1.1.6.L120.90 → H.265, avc1.640028 → H.264 */
const codecTitle = (codec: string | null): string =>
  !codec ? '' : /^(hev1|hvc1)/.test(codec) ? 'H.265' : /^(avc1|avc3)/.test(codec) ? 'H.264' : codec;

const seconds = (value: number): string => value.toFixed(1).replace('.', ',');

type Tone = 'ok' | 'error' | 'muted';

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: COLORS.okSoft, fg: COLORS.ok },
  error: { bg: COLORS.errorSoft, fg: COLORS.rec },
  muted: { bg: '#F1F3F9', fg: COLORS.muted },
};

interface StreamPopupProps {
  /** Камера остаётся заданной после закрытия — для анимации исчезновения */
  camera: VideoCamera | null;
  isOpen: boolean;
  onClose: () => void;
}

const StreamPopup: React.FC<StreamPopupProps> = ({ camera, isOpen, onClose }) => {
  const [check, setCheck] = useState<StreamCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  /** Когда показан результат проверки; через CHECK_SHOWN_MS строка возвращается к живому видео */
  const [checkShownAt, setCheckShownAt] = useState<number | null>(null);
  const [live, setLive] = useState<LiveStats | null>(null);
  const recordCameras = useMemo(() => (camera ? [camera] : []), [camera]);
  const recorder = useClipRecorder(recordCameras, camera?.stationName ?? undefined);
  const canCheck = useCanSetupCameras();

  /** Проверка камеры — отдельное новое подключение: кодек, размер кадра, частота и время подключения */
  const runCheck = useCallback(async () => {
    if (!camera || !canCheck) return;
    setChecking(true);
    setCheckError(null);
    try {
      setCheck(await checkCamera(camera.id));
    } catch (error) {
      setCheck(null);
      setCheckError(errorText(error, 'Не удалось проверить камеру'));
    } finally {
      setChecking(false);
      setCheckShownAt(Date.now());
    }
  }, [camera, canCheck]);

  // Результат проверки виден несколько секунд, потом снова строка живого видео
  useEffect(() => {
    if (checkShownAt === null) return;
    const timer = window.setTimeout(() => setCheckShownAt(null), CHECK_SHOWN_MS);
    return () => window.clearTimeout(timer);
  }, [checkShownAt]);

  const handleClose = () => {
    if (recorder.recording) recorder.stop();
    setCheckShownAt(null);
    onClose();
  };

  if (!camera) return null;

  // Строка под видео: запись, проверка камеры по кнопке или состояние живого видео
  const liveText =
    live?.state === 'playing'
      ? [
          `Живое видео: ${codecTitle(live.codec)}${live.width && live.height ? `, ${live.width}×${live.height}` : ''}`,
          live.fps !== null ? `${live.fps} к/с на экране` : null,
          live.lagSeconds !== null ? `задержка ${seconds(live.lagSeconds)} с` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : live?.state === 'error' || live?.state === 'reconnecting'
        ? live.error ?? 'Переподключение…'
        : 'Подключение к камере…';

  const status: { text: string; tone: Tone } = recorder.error
    ? { text: recorder.error, tone: 'error' }
    : recorder.saved.length > 0
      ? { text: `Сохранено на этот компьютер: ${recorder.saved.join(', ')}`, tone: 'ok' }
      : checking
        ? { text: 'Проверка камеры: новое подключение и чтение параметров потока…', tone: 'muted' }
        : checkShownAt !== null && (check || checkError)
          ? check?.ok
            ? { text: `${check.message} · подключение заняло ${seconds(check.elapsedMs / 1000)} с`, tone: 'ok' }
            : { text: checkError ?? check?.message ?? 'Камера не ответила', tone: 'error' }
          : { text: liveText, tone: live?.state === 'playing' ? 'ok' : live?.state === 'error' ? 'error' : 'muted' };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} width={WIDTH} height={HEIGHT} title={`Поток камеры ${camera.name}`}>
      <div style={{ position: 'absolute', left: 50, right: 50, top: 76, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <span style={{ fontSize: 15, whiteSpace: 'nowrap' }}>
          {camera.cameraType === 'overview' ? 'Обзорная камера' : 'Камера станции'} · {camera.ip}
          {camera.stationName ? ` · ${camera.stationName}` : ''}
        </span>
        <span
          title={camera.rtspUrl}
          style={{ fontSize: 13, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
        >
          {camera.rtspUrl}
        </span>
      </div>

      {/* Живое видео */}
      <div
        style={{
          position: 'absolute',
          left: (WIDTH - VIEW_W) / 2,
          top: 112,
          width: VIEW_W,
          height: VIEW_H,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1.5px solid ${recorder.recording ? COLORS.rec : COLORS.text}`,
          transition: 'border-color 0.25s ease',
        }}
      >
        {isOpen && <LiveVideo camera={camera} size="large" onStats={setLive} />}
      </div>

      {/* Строка состояния: живое видео, проверка камеры или сохранение записи */}
      <div style={{ position: 'absolute', left: 50, right: 50, top: 590, display: 'flex', justifyContent: 'center' }}>
        <motion.div
          key={status.tone + (checking ? ':checking' : '')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: '100%',
            padding: '9px 16px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            backgroundColor: TONE_COLORS[status.tone].bg,
            color: TONE_COLORS[status.tone].fg,
          }}
        >
          {status.tone === 'muted' ? (
            <Spinner />
          ) : (
            <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, backgroundColor: TONE_COLORS[status.tone].fg }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status.text}</span>
        </motion.div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 660, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {recorder.available && (
          <RecordButton
            recording={recorder.recording}
            elapsed={recorder.elapsed}
            busy={recorder.busy}
            onClick={recorder.recording ? recorder.stop : recorder.start}
          />
        )}
        {canCheck && (
          <ActionButton
            label="Проверить камеру"
            width={190}
            height={44}
            busy={checking}
            disabled={checking}
            title="Отдельное подключение к камере: кодек, размер кадра, частота и сколько заняло подключение"
            onClick={runCheck}
          />
        )}
        <ActionButton label="Закрыть" width={168} height={44} onClick={handleClose} />
      </div>
    </ModalShell>
  );
};

export default StreamPopup;
