// helpers.ts — общие заготовки тестов хранилища функций: заглушка HTTP вместо AxiosService и ожидание условия.
import type { FeatureHttp } from '../../src/services/features/featureStore';

/** Ответ заглушки: данные, ошибка или отложенный ответ (тест сам решает, когда он придёт) */
export type StubReply = unknown | Error | Deferred;

export interface Deferred {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

export const deferred = (): Deferred => {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const isDeferred = (value: unknown): value is Deferred =>
  typeof value === 'object' && value !== null && 'promise' in value && 'resolve' in value;

export interface StubHttp extends FeatureHttp {
  /** Адреса запросов по порядку */
  calls: string[];
  /** Ответы на следующие запросы; когда кончились — повторяется последний */
  replies: StubReply[];
}

export const stubHttp = (...replies: StubReply[]): StubHttp => {
  const stub: StubHttp = {
    calls: [],
    replies,
    async get(url: string) {
      stub.calls.push(url);
      const reply = stub.replies.length > 1 ? stub.replies.shift() : stub.replies[0];
      if (reply instanceof Error) throw reply;
      if (isDeferred(reply)) return { data: await reply.promise };
      return { data: reply };
    },
  };
  return stub;
};

/** Профиль сервера (раздел 6.7 проекта) с нужными функциями */
export const profile = (revision: string, features: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  preset: 'full',
  presetSource: 'file',
  revision,
  features,
  ui: { inactivityMinutes: 10, warningMinutes: 1 },
  canViewSecurity: false,
  canManage: false,
  ...extra,
});

/** Дождаться условия (запрос после антидребезга, обработка ответа) */
export const waitFor = async (condition: () => boolean, timeoutMs = 3000): Promise<void> => {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeoutMs) throw new Error('Условие не выполнилось за ' + timeoutMs + ' мс');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
