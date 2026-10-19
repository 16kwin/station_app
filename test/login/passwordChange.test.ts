// passwordChange.test.ts — вход: обязательная смена пароля (контракт B10) и сохранение пароля браузером только
// под флагом passwords (пакет F6). Запросы — на заглушке HTTP: API смены пароля появится в B10.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHANGE_PASSWORD_API,
  MIN_PASSWORD_LENGTH,
  changePassword,
  checkNewPassword,
  parseLoginResponse,
  type PasswordHttp,
} from '../../src/components/loginPage/passwordChange';
import { offerToSavePassword, type CredentialWindow } from '../../src/components/loginPage/browserCredentials';

describe('ответ входа', () => {
  test('смена пароля нужна, только если сервер прислал mustChangePassword: true', () => {
    assert.equal(parseLoginResponse({ mustChangePassword: true }).mustChangePassword, true);
    // Сервер без B10 отвечает строкой — вход как раньше
    for (const data of ['Успешная аутентификация', null, undefined, {}, { mustChangePassword: 'true' }, { mustChangePassword: 1 }]) {
      assert.equal(parseLoginResponse(data).mustChangePassword, false, JSON.stringify(data));
    }
  });
});

describe('проверка нового пароля в форме', () => {
  const good = 'x'.repeat(MIN_PASSWORD_LENGTH);
  test('ошибки по порядку полей', () => {
    assert.equal(checkNewPassword('', good, good), 'current');
    assert.equal(checkNewPassword('old', '', ''), 'empty');
    assert.equal(checkNewPassword('old', 'x'.repeat(MIN_PASSWORD_LENGTH - 1), 'x'.repeat(MIN_PASSWORD_LENGTH - 1)), 'short');
    assert.equal(checkNewPassword('old', good, good + 'y'), 'mismatch');
    assert.equal(checkNewPassword(good, good, good), 'same');
    assert.equal(checkNewPassword('old', good, good), null);
  });
});

/** Заглушка Axios: ответ /csrf и ответ (или ошибка) смены пароля */
const stubHttp = (reply: { status: number; data?: unknown } | { error: unknown }) => {
  const calls: Array<{ method: string; url: string; body?: unknown; csrf?: unknown }> = [];
  const http: PasswordHttp = {
    defaults: { headers: {} },
    async get(url) {
      calls.push({ method: 'GET', url });
      return { data: { token: 'csrf-1' } };
    },
    async post(url, body) {
      calls.push({ method: 'POST', url, body, csrf: http.defaults.headers['X-XSRF-TOKEN'] });
      if ('error' in reply) throw reply.error;
      return { status: reply.status, data: reply.data };
    },
  };
  return { http, calls };
};

const axiosError = (status: number | null, data?: unknown, code?: string) =>
  Object.assign(new Error('Request failed'), { code, response: status === null ? undefined : { status, data } });

const request = { currentPassword: 'выдан-админом', newPassword: 'свой-новый-пароль' };

describe('POST /api/auth/change_password (заглушка контракта B10)', () => {
  test('успех: сначала свежий CSRF, затем запрос с текущим и новым паролем', async () => {
    for (const status of [200, 204]) {
      const { http, calls } = stubHttp({ status });
      assert.deepEqual(await changePassword(http, request), { ok: true });
      assert.deepEqual(calls, [
        { method: 'GET', url: '/csrf' },
        { method: 'POST', url: CHANGE_PASSWORD_API, body: request, csrf: 'csrf-1' },
      ]);
    }
  });

  test('400 — пароль не принят: текст сервера показывается как есть', async () => {
    const cases: Array<[unknown, string]> = [
      [{ message: 'Пароль слишком простой' }, 'Пароль слишком простой'],
      ['Неверный текущий пароль', 'Неверный текущий пароль'],
      [{}, 'Пароль не принят сервером'],
      ['', 'Пароль не принят сервером'],
    ];
    for (const [data, message] of cases) {
      const { http } = stubHttp({ error: axiosError(400, data) });
      assert.deepEqual(await changePassword(http, request), { ok: false, reason: 'rejected', message });
    }
  });

  test('401/403 — сеанс завершён; обрыв связи и 500 — ошибка сервиса', async () => {
    for (const status of [401, 403]) {
      const { http } = stubHttp({ error: axiosError(status) });
      const result = await changePassword(http, request);
      assert.equal(result.ok, false);
      assert.equal(!result.ok && result.reason, 'session');
    }
    const offline = await changePassword(stubHttp({ error: axiosError(null, undefined, 'ERR_NETWORK') }).http, request);
    assert.equal(!offline.ok && offline.reason, 'network');
    const failed = await changePassword(stubHttp({ error: axiosError(500, 'stack trace…') }).http, request);
    assert.deepEqual(failed, { ok: false, reason: 'server', message: 'Внимание! Ошибка на стороне сервиса' });
  });
});

/** Окно-заглушка с Credential Management API */
const credentialWindow = (storeImpl?: (credential: Credential) => Promise<void>) => {
  const stored: Array<Record<string, unknown>> = [];
  class FakePasswordCredential {
    data: { id: string; password: string; name?: string };
    constructor(data: { id: string; password: string; name?: string }) {
      this.data = data;
    }
  }
  const win: CredentialWindow = {
    PasswordCredential: FakePasswordCredential as unknown as CredentialWindow['PasswordCredential'],
    navigator: {
      credentials: {
        store: storeImpl ?? (async (credential: Credential) => {
          stored.push((credential as unknown as FakePasswordCredential).data);
        }),
      },
    },
  };
  return { win, stored };
};

describe('сохранение пароля браузером (passwords)', () => {
  test('passwords выключен или не получен — браузеру ничего не передаётся', () => {
    const { win, stored } = credentialWindow();
    assert.equal(offerToSavePassword('ivanov', 'секрет', false, win), false);
    assert.deepEqual(stored, []);
  });

  test('passwords включён — PasswordCredential с логином и паролем', () => {
    const { win, stored } = credentialWindow();
    assert.equal(offerToSavePassword('ivanov', 'секрет', true, win), true);
    assert.deepEqual(stored, [{ id: 'ivanov', password: 'секрет', name: 'ivanov' }]);
  });

  test('браузер без PasswordCredential или с отказом — без ошибок', async () => {
    assert.equal(offerToSavePassword('ivanov', 'секрет', true, { navigator: {} }), false);
    const rejecting = credentialWindow(() => Promise.reject(new DOMException('отказ', 'NotAllowedError')));
    assert.equal(offerToSavePassword('ivanov', 'секрет', true, rejecting.win), true);
    const throwing = credentialWindow(() => {
      throw new TypeError('нет безопасного контекста');
    });
    assert.equal(offerToSavePassword('ivanov', 'секрет', true, throwing.win), false);
    await new Promise(resolve => setTimeout(resolve, 0)); // отказ store() обработан, необработанного отклонения нет
  });

  test('в коде входа нет скрытого iframe и XHR с паролем; пароль браузеру передаёт только browserCredentials.ts', () => {
    const login = readFileSync(join('src', 'components', 'loginPage', 'LoginPage.tsx'), 'utf8');
    assert.doesNotMatch(login, /XMLHttpRequest|iframe|savePasswordToBrowser|PasswordCredential/);
    const sources = readdirSync('src', { recursive: true })
      .map(file => String(file))
      .filter(file => /\.tsx?$/.test(file))
      .filter(file => /credentials\.store\(|PasswordCredential\(/.test(readFileSync(join('src', file), 'utf8')));
    assert.deepEqual(sources, [join('components', 'loginPage', 'browserCredentials.ts')]);
  });
});
