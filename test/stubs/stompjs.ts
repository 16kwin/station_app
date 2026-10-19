// stompjs.ts (заглушка тестов) — вместо @stomp/stompjs: клиент не открывает соединение, а записывает, что с ним
// делали. Подключается в test/run-tests.mjs; тест живых обновлений читает созданные клиенты из stompClients.

export interface StubMessage {
  body: string;
}

export interface StubClientConfig {
  webSocketFactory?: () => unknown;
  reconnectDelay?: number;
  onConnect?: () => void;
  onStompError?: (frame: { headers: Record<string, string>; body: string }) => void;
}

/** Созданные клиенты по порядку; тест очищает массив перед каждым случаем */
export const stompClients: Client[] = [];

export class Client {
  readonly config: StubClientConfig;
  /** Соединение «открыто»: activate() без последующего deactivate() */
  active = false;
  /** Сокет, который вернула фабрика при activate() (заглушка SockJS с адресом) */
  socket: unknown = null;
  /** Подписки: тема → обработчик */
  readonly subscriptions = new Map<string, (message: StubMessage) => void>();

  constructor(config: StubClientConfig) {
    this.config = config;
    stompClients.push(this);
  }

  activate() {
    this.active = true;
    this.socket = this.config.webSocketFactory?.() ?? null;
  }

  async deactivate() {
    this.active = false;
  }

  subscribe(topic: string, handler: (message: StubMessage) => void) {
    this.subscriptions.set(topic, handler);
    return { unsubscribe: () => this.subscriptions.delete(topic) };
  }
}
