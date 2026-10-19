// api.ts — адреса API заказов и ТКП и их живые обновления (функция orders, раздел 4.2 проекта «Дискретное
// отключение функций»). Адреса лежат в каталоге модуля, а не в ConstantInfo ядра: в сборке без заказов
// (__AWMS_HAS_ORDERS__ = false) этих строк в дистрибутиве нет. Живые обновления — через общий клиент
// liveUpdatesClient (адрес сервера из window.config, только при функции websocket), а не своим соединением.
import { connectLiveUpdates, type LiveUpdatesConnection } from '../../services/liveUpdatesClient';

/** Список заказов или ТКП: действующие или закрытые */
export type ListTab = 'active' | 'closed';

/** Заказы на поставку */
export const ORDERS_API = {
  active: '/api/orders/active',
  closed: '/api/orders/closed',
  /** Заказ: GET — карточка, POST — создать или изменить, POST …/cancel — отменить */
  order: (orderUid: string) => `/api/orders/${orderUid}`,
} as const;

/** ТКП (технико-коммерческие предложения) */
export const TKP_API = {
  active: '/api/tkp/active',
  closed: '/api/tkp/closed',
  /** ТКП: GET — карточка, POST …/confirm и …/cancel — подтвердить и отменить */
  tkp: (tkpUid: string) => `/api/tkp/${tkpUid}`,
} as const;

export const ordersListUrl = (tab: ListTab): string => (tab === 'active' ? ORDERS_API.active : ORDERS_API.closed);

export const tkpListUrl = (tab: ListTab): string => (tab === 'active' ? TKP_API.active : TKP_API.closed);

/**
 * Темы, после которых списки заказов и ТКП перечитываются: новое ТКП, смена его статуса, изменение заказов
 * (сервер публикует их при колбэках внешней системы)
 */
export const ORDERS_LIVE_TOPICS = ['/topic/tkp/new', '/topic/tkp/status', '/topic/orders/refresh'] as const;

/**
 * Подписаться на изменения заказов и ТКП: refresh вызывается на каждое сообщение любой темы (тело не нужно —
 * список перечитывается целиком). Соединения нет, пока функция websocket выключена; закрыть — close()
 */
export const connectOrdersLive = (name: string, refresh: () => void): LiveUpdatesConnection =>
  connectLiveUpdates({
    name,
    topics: Object.fromEntries(ORDERS_LIVE_TOPICS.map(topic => [topic, () => refresh()])),
  });
