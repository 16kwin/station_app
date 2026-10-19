// useLiveStream.ts — живой поток камеры в <video>. Сервер один раз подключается к камере и раздаёт её видео
// всем зрителям как фрагментированный MP4, по фрагменту на кадр, без перекодирования. Браузер воспроизводит
// поток через MediaSource. Показ держится у самого свежего кадра: если видео отстало — догоняет.
// Поток идёт, только пока на установке включён живой просмотр (функция video.live): выключили — поток
// закрывается. Ответ 404 — функцию выключили на сервере (или камеры нет): без переподключений, профиль
// функций перезапрашивается.
import { useEffect, useRef, useState } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useFeature } from '../../../services/features/featureStore';
import { noteApiNotFound } from '../../../services/features/routes';
import { liveUrl } from './api';

export type LiveState = 'connecting' | 'playing' | 'reconnecting' | 'error';

export interface LiveStats {
  state: LiveState;
  /** Причина, если поток не идёт */
  error: string | null;
  /** Кадров в секунду на экране за последнюю секунду */
  fps: number | null;
  /** На сколько показ отстаёт от последнего полученного кадра, с */
  lagSeconds: number | null;
  /** Строка кодека потока, например hev1.1.6.L120.90 */
  codec: string | null;
  /** Размер кадра, когда видео пошло */
  width: number | null;
  height: number | null;
}

/** Целевое отставание показа от последнего кадра и предел, после которого показ перескакивает вперёд, с */
const TARGET_LAG = 0.3;
const MAX_LAG = 1.2;
/** Сколько секунд видео держать позади текущего кадра; остальное освобождается */
const KEEP_BEHIND = 6;
/** Нет данных столько миллисекунд — поток считается зависшим и переподключается */
const STALL_MS = 6000;
const RETRY_MS = [1000, 2000, 4000, 8000];

/** Ошибка без повторов: роль без доступа, функция выключена или браузер без нужного кодека */
class FatalLiveError extends Error {}

/** 404 без своего сообщения (ворота функций отвечают стандартной страницей ошибки) */
const LIVE_UNAVAILABLE = 'Живое видео недоступно на этой установке';

const INITIAL: LiveStats = { state: 'connecting', error: null, fps: null, lagSeconds: null, codec: null, width: null, height: null };

const readError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: string; status?: unknown };
    // { error } — сообщение видеомодуля; стандартная страница ошибки Spring ({ status, error: "Not Found" }) — нет
    if (body.error && body.status === undefined) return body.error;
  } catch {
    // не JSON
  }
  return response.status === 404 ? LIVE_UNAVAILABLE : `Сервер ответил ${response.status}`;
};

const concat = (chunks: Uint8Array[]): Uint8Array => {
  if (chunks.length === 1) return chunks[0];
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

/**
 * Живой поток камеры. Возвращает ref для <video> и состояние: подключение, показ, переподключение, ошибка,
 * частота кадров на экране и отставание показа. Пока cameraId = null, enabled = false или живой просмотр
 * выключен на установке, поток не идёт.
 */
export const useLiveStream = (cameraId: number | null, enabled = true) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stats, setStats] = useState<LiveStats>(INITIAL);
  const liveOn = useFeature('video.live');

  useEffect(() => {
    if (cameraId === null || !enabled || !liveOn) return;
    let disposed = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    /** Очистка текущего сеанса; объект — чтобы TypeScript видел присваивания внутри session() */
    const current: { cleanup: (() => void) | null } = { cleanup: null };

    const update = (patch: Partial<LiveStats>) => {
      if (!disposed) setStats(prev => ({ ...prev, ...patch }));
    };

    /** Один сеанс: запрос потока, MediaSource, догон живого края. Завершается, когда поток закончился */
    const session = async (): Promise<void> => {
      const video = videoRef.current;
      if (!video) throw new Error('Нет элемента видео');
      const abort = new AbortController();
      let objectUrl: string | null = null;
      let frameHandle: number | null = null;
      const timers: { live?: number } = {};

      current.cleanup = () => {
        abort.abort();
        window.clearInterval(timers.live);
        if (frameHandle !== null && 'cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(frameHandle);
        video.removeAttribute('src');
        video.load();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        current.cleanup = null;
      };

      let response = await fetch(liveUrl(cameraId), { signal: abort.signal, credentials: 'include', cache: 'no-store' });
      if (response.status === 401) {
        // Истёк токен: AxiosService обновит его на проверке авторизации — и пробуем ещё раз
        await AxiosService.get(ConstantInfo.restApiCheckAuth).catch(() => undefined);
        response = await fetch(liveUrl(cameraId), { signal: abort.signal, credentials: 'include', cache: 'no-store' });
      }
      if (response.status === 403) throw new FatalLiveError(await readError(response));
      if (response.status === 404) {
        // Функцию могли выключить на ходу: свежий профиль закроет окна живого видео
        noteApiNotFound(response.url || liveUrl(cameraId));
        throw new FatalLiveError(await readError(response));
      }
      if (!response.ok || !response.body) throw new Error(await readError(response));

      const codec = response.headers.get('X-Video-Codec') ?? 'hev1.1.6.L120.90';
      const mime = `video/mp4; codecs="${codec}"`;
      if (typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported(mime)) {
        throw new FatalLiveError(
          codec.startsWith('hev') || codec.startsWith('hvc')
            ? 'Браузер не воспроизводит H.265. Нужен Chrome или Edge с аппаратным декодированием H.265'
            : `Браузер не воспроизводит кодек ${codec}`,
        );
      }
      update({ codec });

      const mediaSource = new MediaSource();
      objectUrl = URL.createObjectURL(mediaSource);
      video.src = objectUrl;
      await new Promise<void>(resolve => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));
      const buffer = mediaSource.addSourceBuffer(mime);

      const pending: Uint8Array[] = [];
      let lastData = Date.now();
      let started = false;

      const pump = () => {
        if (buffer.updating || pending.length === 0 || mediaSource.readyState !== 'open') return;
        const chunk = concat(pending.splice(0, pending.length));
        try {
          buffer.appendBuffer(chunk as BufferSource);
        } catch (error) {
          if ((error as DOMException).name === 'QuotaExceededError') {
            // Буфер переполнен — освободить старое и повторить
            pending.unshift(chunk);
            if (video.buffered.length) buffer.remove(0, Math.max(0, video.currentTime - 1));
          } else {
            abort.abort();
          }
        }
      };

      /** Держать показ у живого края: сильно отстали — перескок, немного — чуть быстрее */
      const keepLive = () => {
        if (!video.buffered.length) return;
        const end = video.buffered.end(video.buffered.length - 1);
        const start = video.buffered.start(0);
        if (!started) {
          started = true;
          video.currentTime = Math.max(start, end - TARGET_LAG);
          video.play().catch(() => undefined);
          attempt = 0;
          update({ state: 'playing', error: null });
          return;
        }
        const lag = end - video.currentTime;
        if (lag > MAX_LAG || video.currentTime < start) {
          video.currentTime = Math.max(start, end - TARGET_LAG);
        } else {
          video.playbackRate = lag > TARGET_LAG * 2 ? 1.08 : 1;
        }
        if (video.paused) video.play().catch(() => undefined);
        // Освободить то, что уже показано
        if (!buffer.updating && video.currentTime - start > KEEP_BEHIND * 2) {
          buffer.remove(start, video.currentTime - KEEP_BEHIND);
        }
      };

      buffer.addEventListener('updateend', () => {
        if (!started) keepLive();
        pump();
      });

      // Кадры на экране: requestVideoFrameCallback срабатывает на каждом показанном кадре
      let shown = 0;
      let windowStart = performance.now();
      const onFrame = () => {
        shown++;
        frameHandle = video.requestVideoFrameCallback(onFrame);
      };
      if ('requestVideoFrameCallback' in video) frameHandle = video.requestVideoFrameCallback(onFrame);

      timers.live = window.setInterval(() => {
        keepLive();
        if (Date.now() - lastData > STALL_MS) abort.abort();
        const now = performance.now();
        if (now - windowStart >= 1000) {
          const lag = video.buffered.length ? video.buffered.end(video.buffered.length - 1) - video.currentTime : null;
          update({
            fps: 'requestVideoFrameCallback' in video ? Math.round((shown * 1000) / (now - windowStart)) : null,
            lagSeconds: lag === null ? null : Math.max(0, lag),
            width: video.videoWidth || null,
            height: video.videoHeight || null,
          });
          shown = 0;
          windowStart = now;
        }
      }, 250);

      const reader = response.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done || disposed) break;
          lastData = Date.now();
          pending.push(value);
          pump();
        }
      } catch (error) {
        if (!abort.signal.aborted) throw error;
      } finally {
        current.cleanup?.();
      }
    };

    const loop = async () => {
      while (!disposed) {
        update({ state: attempt === 0 ? 'connecting' : 'reconnecting' });
        try {
          await session();
          if (disposed) return;
          // Поток закончился сам: камера переподключается или сервер перезапущен
          update({ state: 'reconnecting', error: 'Поток прервался — переподключение', fps: null });
        } catch (error) {
          if (disposed) return;
          const message = error instanceof Error ? error.message : 'Нет связи с сервером';
          if (error instanceof FatalLiveError) {
            update({ state: 'error', error: message, fps: null, lagSeconds: null });
            return;
          }
          update({ state: 'reconnecting', error: message === 'Failed to fetch' ? 'Нет связи с сервером' : message, fps: null });
        }
        const delay = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
        attempt++;
        await new Promise<void>(resolve => {
          retryTimer = window.setTimeout(resolve, delay);
        });
      }
    };

    setStats(INITIAL);
    loop();

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      current.cleanup?.();
    };
  }, [cameraId, enabled, liveOn]);

  return { videoRef, stats };
};
