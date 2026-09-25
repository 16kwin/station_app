// api.ts — события текущего дня для «второго экрана»: запрос, проверка ответа и цикл автообновления
import AxiosService from '../../../services/AxiosService';
import { DAY_SOURCE_NAMES, isDaySource } from './types';
import type { DayEvent, DayEventTone, DayEventsData, DaySource } from './types';

/** Зависший запрос отменяется раньше следующего такта автообновления (30 с) */
const REQUEST_TIMEOUT_MS = 20_000;

const TONES: readonly DayEventTone[] = ['progress', 'success', 'danger'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Строки колонки: без пустых записей и повторов id (id — ключ анимации строки); неизвестный тон → «в работе» */
const toEvents = (list: unknown): DayEvent[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<number>();
  const events: DayEvent[] = [];
  for (const raw of list as Array<Partial<DayEvent> | null>) {
    const id = Number(raw?.id);
    if (!raw || !Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      title: raw.title ?? '',
      at: raw.at ?? '',
      person: raw.person ?? '',
      status: raw.status ?? '',
      tone: raw.tone && TONES.includes(raw.tone) ? raw.tone : 'progress',
    });
  }
  return events;
};

/** Ответ сервера → данные экрана; `date` пустая, если сервер прислал не 'YYYY-MM-DD' */
const normalizeDayEvents = (raw: Partial<DayEventsData> | null | undefined, source: DaySource): DayEventsData => ({
  date: typeof raw?.date === 'string' && ISO_DATE.test(raw.date) ? raw.date : '',
  source: isDaySource(raw?.source) ? raw.source : source,
  sourceName: raw?.sourceName || DAY_SOURCE_NAMES[source],
  inWork: toEvents(raw?.inWork),
  done: toEvents(raw?.done),
});

/** GET /api/dashboard/day-events?source=… — что в работе и что завершено за сегодня */
export const fetchDayEvents = (source: DaySource, signal?: AbortSignal): Promise<DayEventsData> =>
  AxiosService.get<DayEventsData>('/api/dashboard/day-events', { params: { source }, signal, timeout: REQUEST_TIMEOUT_MS }).then(
    r => normalizeDayEvents(r.data, source),
  );

/** Куда доставлять ответы цикла автообновления */
export interface DayEventsPollHandlers {
  /** Свежие данные (ответ не старше уже доставленного) */
  onData: (data: DayEventsData) => void;
  /** Запрос не удался — на экране остаются последние данные */
  onError: () => void;
}

/**
 * Автообновление экрана: первый запрос сразу, дальше каждые `intervalMs`.
 * Ответ, обогнанный более новым запросом, отбрасывается. Возвращает остановку для очистки эффекта:
 * интервал снимается, незавершённые запросы отменяются, их ответы уже никуда не доставляются.
 */
export const pollDayEvents = (
  source: DaySource,
  intervalMs: number,
  handlers: DayEventsPollHandlers,
  fetcher: (source: DaySource, signal: AbortSignal) => Promise<DayEventsData> = fetchDayEvents,
): (() => void) => {
  let stopped = false;
  let issued = 0; // номер последнего отправленного запроса
  let delivered = 0; // номер последнего доставленного ответа
  const inFlight = new Set<AbortController>();

  const load = () => {
    const seq = ++issued;
    const controller = new AbortController();
    inFlight.add(controller);
    // Доставляем, только если цикл жив и более свежий ответ ещё не пришёл
    const isFresh = () => !stopped && seq > delivered;
    fetcher(source, controller.signal)
      .then(
        data => {
          if (!isFresh()) return;
          delivered = seq;
          handlers.onData(data);
        },
        () => {
          if (!isFresh()) return;
          delivered = seq;
          handlers.onError();
        },
      )
      .finally(() => inFlight.delete(controller));
  };

  load();
  const timer = setInterval(load, intervalMs);
  return () => {
    stopped = true;
    clearInterval(timer);
    inFlight.forEach(controller => controller.abort());
    inFlight.clear();
  };
};
