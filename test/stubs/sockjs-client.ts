// sockjs-client.ts (заглушка тестов) — вместо sockjs-client: запоминает адрес, сети не касается.
export default class SockJS {
  readonly url: string;

  constructor(url: string) {
    this.url = url;
  }
}
