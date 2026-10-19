// liveUpdatesClient.ts — единая фабрика живых обновлений (STOMP поверх SockJS, адрес /ws-stations).
// Соединение открывается, только если функция websocket включена (раздел 4.2 проекта «Дискретное отключение
// функций»): иначе нет ни соединения, ни переподключений раз в 5 с. Библиотеки @stomp/stompjs и sockjs-client
// грузятся динамически при первом соединении. Путь и импорты стоят под флагом сборки __AWMS_HAS_WEBSOCKET__:
// в сборке без живых обновлений их нет. Соединение следит за функцией само: выключили (сервер перезапущен
// с другим потолком) — закрывается, включили (профиль пришёл после сбоя, «Повторить») — открывается, без
// повторного монтирования страницы. Совсем закрывает его только close().
import { isFeatureOn, subscribeFeatures } from './features/featureStore';

/** Обработчик сообщения темы; тело — разобранный JSON (или строка, если это не JSON) */
export type LiveTopicHandler = (payload: unknown) => void;

export interface LiveUpdatesOptions {
  /** Темы STOMP и их обработчики: { '/topic/stations/dynamic': data => … } */
  topics: Readonly<Record<string, LiveTopicHandler>>;
  /** Имя для сообщений в консоли: «Станции», «Заказы» */
  name?: string;
}

export interface LiveUpdatesConnection {
  /** Закрыть соединение (в очистке эффекта). Повторный вызов ничего не делает */
  close(): void;
}

/** Переподключение после обрыва, мс (как было на страницах заказов и ТКП) */
const RECONNECT_DELAY_MS = 5000;

const NOOP: LiveUpdatesConnection = { close: () => {} };

/** Адрес точки SockJS на сервере API: window.config.ip_api + /ws-stations */
const endpointUrl = (): string => {
  const base = (globalThis as { config?: { ip_api?: unknown } }).config?.ip_api;
  const path = __AWMS_HAS_WEBSOCKET__ ? '/ws-stations' : '';
  return new URL((typeof base === 'string' ? base : '') + path, window.location.href).toString();
};

const parseBody = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

/**
 * Подключиться к живым обновлениям. Пока функция websocket выключена (или профиль ещё не получен), запросов
 * нет; включится — соединение откроется само, выключится — закроется. Модуля нет в сборке — пустое
 * соединение. Пустой массив зависимостей эффекта достаточен:
 *   useEffect(() => connectLiveUpdates({ name: 'Заказы', topics: { '/topic/orders/refresh': refresh } }).close, []);
 */
export const connectLiveUpdates = (options: LiveUpdatesOptions): LiveUpdatesConnection => {
  if (!__AWMS_HAS_WEBSOCKET__) return NOOP;

  const label = options.name ? `Живые обновления (${options.name})` : 'Живые обновления';
  let closed = false;
  /** Соединение запущено (или грузятся библиотеки для него) */
  let running = false;
  /** Номер запуска: библиотеки, догрузившиеся после остановки, соединение уже не открывают */
  let attempt = 0;
  let deactivate: (() => void) | null = null;

  const start = () => {
    running = true;
    const current = ++attempt;
    const libraries = __AWMS_HAS_WEBSOCKET__
      ? Promise.all([import('@stomp/stompjs'), import('sockjs-client')])
      : Promise.reject(new Error('Живых обновлений нет в сборке'));

    libraries
      .then(([{ Client }, { default: SockJS }]) => {
        if (closed || current !== attempt) return;
        const url = endpointUrl();
        const client = new Client({
          webSocketFactory: () => new SockJS(url),
          reconnectDelay: RECONNECT_DELAY_MS,
          onConnect: () => {
            for (const [topic, handler] of Object.entries(options.topics)) {
              client.subscribe(topic, message => handler(parseBody(message.body)));
            }
          },
          onStompError: frame => console.error(`${label}: ошибка STOMP`, frame.headers.message ?? '', frame.body),
        });
        deactivate = () => void client.deactivate();
        client.activate();
      })
      .catch(error => {
        console.error(`${label}: не удалось загрузить клиент`, error);
        // Следующее включение функции попробует снова
        if (current === attempt) running = false;
      });
  };

  const stop = () => {
    running = false;
    attempt++;
    deactivate?.();
    deactivate = null;
  };

  // Соединение следует за функцией: выключили — закрываем, включили — открываем
  const sync = () => {
    if (closed) return;
    const on = isFeatureOn('websocket');
    if (on && !running) start();
    else if (!on && running) stop();
  };

  const unsubscribe = subscribeFeatures(sync);
  sync();

  return {
    close: () => {
      if (closed) return;
      closed = true;
      unsubscribe();
      stop();
    },
  };
};
