// types.ts — контракт GET /api/dashboard/day-events и источники «Экрана событий текущего дня»

/** Лента, с которой открыт экран: параметр `?source=` адреса и запроса */
export type DaySource = 'operator' | 'control' | 'release' | 'overpriced';

/** Цвет плашки статуса: в работе — зелёный, завершено — фиолетовый, отказ — красный */
export type DayEventTone = 'progress' | 'success' | 'danger';

/** Строка колонки «В работе» или «Завершено» */
export interface DayEvent {
  id: number;
  title: string;
  /** Время события 'YYYY-MM-DDTHH:mm:ss' (без часового пояса) */
  at: string;
  /** Исполнитель, например «Колпаков А.В.» */
  person: string;
  /** Подпись плашки статуса, например «На контроле» */
  status: string;
  tone: DayEventTone;
}

/** Ответ GET /api/dashboard/day-events?source=… */
export interface DayEventsData {
  /** Текущая дата сервера 'YYYY-MM-DD' */
  date: string;
  source: DaySource;
  /** Название источника для подзаголовка: «Склад», «Контроль качества» … */
  sourceName: string;
  /** Колонки уже отсортированы сервером по `at` убыванию */
  inWork: DayEvent[];
  done: DayEvent[];
}

export const DAY_SOURCES: readonly DaySource[] = ['operator', 'control', 'release', 'overpriced'];

/** Источник, если в адресе его нет или он неизвестен */
export const DEFAULT_DAY_SOURCE: DaySource = 'operator';

/** Названия источников — подзаголовок до первого ответа сервера (как `sourceName` в SPEC-API) */
export const DAY_SOURCE_NAMES: Record<DaySource, string> = {
  operator: 'Склад',
  control: 'Контроль качества',
  release: 'Выпуск продукции',
  overpriced: 'Закупки с завышенной ценой',
};

export const isDaySource = (value: unknown): value is DaySource =>
  typeof value === 'string' && (DAY_SOURCES as readonly string[]).includes(value);
