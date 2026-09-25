// types.ts — контракт GET /api/dashboard/control-events: лента «Экран событий» контролера и главного контролера

/** Чья лента: контролер участка «Цех 1, Участок 2» (section) или главный контролер всего предприятия (enterprise) */
export type ControlScope = 'section' | 'enterprise';

/** Статус контроля — он же вкладка ленты: «На контроль», «Контроль пройден», «Контроль не пройден» */
export type ControlEventStatus = 'pending' | 'passed' | 'failed';

/** Событие контроля качества детали или изделия */
export interface ControlEvent {
  id: number;
  title: string;
  /** Время события 'YYYY-MM-DDTHH:mm:ss' (без часового пояса) */
  at: string;
  /** Подразделение, например «Цех 1, Участок 2» */
  department: string;
  /** ФИО исполнителя */
  executor: string;
  /** ФИО контролера */
  controller: string;
  status: ControlEventStatus;
}

/** Ответ GET /api/dashboard/control-events?scope=… */
export interface ControlEventsData {
  scope: ControlScope;
  /** «Цех 1, Участок 2» для section, «Предприятие» для enterprise */
  department: string;
  /** Уже отсортированы сервером по `at` убыванию, не больше 60 */
  items: ControlEvent[];
}

export const CONTROL_EVENT_STATUSES: readonly ControlEventStatus[] = ['pending', 'passed', 'failed'];

/** Ключ вкладки ленты — это статус контроля? */
export const isControlEventStatus = (value: string): value is ControlEventStatus =>
  (CONTROL_EVENT_STATUSES as readonly string[]).includes(value);
