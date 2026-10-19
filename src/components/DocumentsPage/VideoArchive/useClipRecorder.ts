// useClipRecorder.ts — кнопка «Записать» в окнах живого видео: сервер пишет живой поток камер в файл,
// по «Стоп» собирает обычный MP4 и браузер сохраняет его на этот компьютер (в «Загрузки»).
// Запись — функция установки video.clips (ей нужны живой просмотр и скачивание): выключена — available = false,
// окно не показывает кнопку «Записать», а start ничего не отправляет на сервер.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoCamera, VideoClip } from './types';
import { downloadClip, errorText, startClip, stopClip } from './api';
import { useCanRecordClips } from './access';

export interface ClipRecorder {
  /** Запись доступна: роль и функция video.clips; иначе кнопки «Записать» нет */
  available: boolean;
  recording: boolean;
  /** Секунд с начала записи */
  elapsed: number;
  busy: boolean;
  error: string | null;
  /** Сохранённые файлы последней записи */
  saved: string[];
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/** Имя файла: станция и камера из записи сервера, без символов, недопустимых в Windows */
const fileNameFor = (clip: VideoClip, prefix?: string): string => {
  const base = clip.fileName ?? `${clip.cameraName}.mp4`;
  const safePrefix = prefix?.replace(/[\\/:*?"<>|]+/g, '-').trim();
  return safePrefix ? `${safePrefix}_${base}` : base;
};

export const useClipRecorder = (cameras: VideoCamera[], filePrefix?: string): ClipRecorder => {
  const available = useCanRecordClips();
  const [clips, setClips] = useState<VideoClip[] | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  /** Идущие записи для остановки при закрытии окна */
  const active = useRef<VideoClip[] | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const start = useCallback(async () => {
    if (!available || cameras.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setSaved([]);
    const results = await Promise.allSettled(cameras.map(camera => startClip(camera.id)));
    const started = results.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []));
    const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) setError(errorText(failed.reason, 'Не удалось начать запись'));
    if (started.length > 0) {
      active.current = started;
      setClips(started);
      setStartedAt(Date.now());
      setElapsed(0);
    }
    setBusy(false);
  }, [available, cameras, busy]);

  const stop = useCallback(async () => {
    const running = active.current;
    if (!running || busy) return;
    setBusy(true);
    active.current = null;
    const results = await Promise.allSettled(running.map(clip => stopClip(clip.id)));
    const files: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const name = fileNameFor(result.value, filePrefix);
        try {
          await downloadClip(result.value, name);
          files.push(name);
        } catch (downloadError) {
          setError(errorText(downloadError, 'Не удалось скачать запись'));
        }
      } else {
        setError(errorText(result.reason, 'Не удалось сохранить запись'));
      }
    }
    setSaved(files);
    setClips(null);
    setStartedAt(null);
    setBusy(false);
  }, [busy, filePrefix]);

  // Окно закрыли посреди записи — остановить на сервере, чтобы запись не шла впустую
  useEffect(
    () => () => {
      active.current?.forEach(clip => stopClip(clip.id).catch(() => undefined));
      active.current = null;
    },
    [],
  );

  return { available, recording: clips !== null, elapsed, busy, error, saved, start, stop };
};
