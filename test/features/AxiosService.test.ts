// AxiosService.test.ts — реакция HTTP-клиента на состав функций (раздел 11.2 проекта, пакет F2a): FormData
// без файлов уходит при выключенных uploads, с File или Blob — отклоняется на месте; новая ревизия в заголовке
// X-AWMS-Features и 404 на адрес функции перезапрашивают профиль. AxiosService при загрузке читает
// window.config (в тестах он заменён заглушкой), поэтому перехватчики ставятся на свой клиент Axios — те же,
// что ставит AxiosService (installFeatureInterceptors).
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError, AxiosHeaders, isAxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
  FEATURES_REVISION_HEADER,
  UPLOADS_DISABLED_CODE,
  UPLOADS_DISABLED_MESSAGE,
  formDataHasFile,
  installFeatureInterceptors,
  revisionFromHeaders,
} from '../../src/services/features/httpFeatures';
import {
  REFRESH_DEBOUNCE_MS,
  connectFeatureHttp,
  getFeatureSnapshot,
  loadFeatures,
  resetFeatures,
} from '../../src/services/features/featureStore';
import { NOT_FOUND_REFRESH_MS } from '../../src/services/features/routes';
import { profile, stubHttp, waitFor, type StubHttp } from './helpers';

interface Reply {
  status?: number;
  revision?: string;
}

/** Клиент Axios с перехватчиками функций; запросы уходят в заглушку адаптера, а не в сеть */
const makeClient = (reply: (config: InternalAxiosRequestConfig) => Reply = () => ({})) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const client = axios.create({
    adapter: async config => {
      sent.push(config);
      const { status = 200, revision } = reply(config);
      const headers = new AxiosHeaders();
      if (revision) headers.set(FEATURES_REVISION_HEADER, revision);
      const response: AxiosResponse = { data: { ok: true }, status, statusText: String(status), headers, config, request: {} };
      if (status >= 400) throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response);
      return response;
    },
  });
  installFeatureInterceptors(client);
  return { client, sent };
};

const fileForm = () => {
  const form = new FormData();
  form.append('code', '4600000000000');
  form.append('file', new File(['%PDF'], 'passport.pdf', { type: 'application/pdf' }));
  return form;
};

const blobForm = () => {
  const form = new FormData();
  form.append('image', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
  return form;
};

const plainForm = () => {
  const form = new FormData();
  form.append('code', '4600000000000');
  form.append('type', 'BARCODE');
  return form;
};

/** Профиль загружен через заглушку; возвращает её — по числу запросов видно, перезапрашивался ли профиль */
const withProfile = async (features: Record<string, unknown>, revision = 'r1'): Promise<StubHttp> => {
  const http = stubHttp(profile(revision, features));
  connectFeatureHttp(http);
  assert.equal(await loadFeatures(), true);
  return http;
};

const settle = () => new Promise(resolve => setTimeout(resolve, REFRESH_DEBOUNCE_MS + 100));

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  mock.timers.reset();
  mock.restoreAll();
  resetFeatures();
  connectFeatureHttp(null);
});

describe('FormData при выключенных uploads', () => {
  test('без файлов — уходит (штрихкоды, поставки без документа)', async () => {
    await withProfile({ uploads: false });
    const { client, sent } = makeClient();
    const response = await client.post('/api/nomenclature/uid/codes', plainForm());
    assert.equal(response.status, 200);
    assert.equal(sent.length, 1);
    assert.ok(sent[0].data instanceof FormData);
  });

  test('с File или Blob — отклоняется на месте, запроса нет', async () => {
    await withProfile({ uploads: false });
    const { client, sent } = makeClient();
    for (const form of [fileForm(), blobForm()]) {
      await assert.rejects(client.post('/api/nomenclature/uid/documents', form), (error: unknown) => {
        assert.ok(isAxiosError(error));
        assert.equal(error.code, UPLOADS_DISABLED_CODE);
        assert.equal(error.message, UPLOADS_DISABLED_MESSAGE);
        assert.equal(error.response, undefined, 'это не ответ сервера');
        assert.equal(error.config?.url, '/api/nomenclature/uid/documents');
        return true;
      });
    }
    assert.equal(sent.length, 0);
  });

  test('JSON и запросы без тела — как раньше', async () => {
    await withProfile({ uploads: false });
    const { client, sent } = makeClient();
    await client.post('/api/nomenclature/uid/codes', { code: '1', type: 'QR' });
    await client.get('/api/nomenclature/tree');
    assert.equal(sent.length, 2);
  });

  test('uploads включены — файл уходит', async () => {
    await withProfile({ uploads: true });
    const { client, sent } = makeClient();
    await client.post('/api/nomenclature/uid/documents', fileForm());
    assert.equal(sent.length, 1);
  });

  test('профиль не получен (сбой связи) — решает сервер: файл уходит', async () => {
    connectFeatureHttp(stubHttp(new Error('сеть')));
    await loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'error');
    const { client, sent } = makeClient();
    await client.post('/api/nomenclature/uid/documents', fileForm());
    assert.equal(sent.length, 1);
  });

  test('formDataHasFile: File и Blob — файл, строки — нет', () => {
    assert.equal(formDataHasFile(fileForm()), true);
    assert.equal(formDataHasFile(blobForm()), true);
    assert.equal(formDataHasFile(plainForm()), false);
    assert.equal(formDataHasFile(new FormData()), false);
  });
});

describe('ревизия профиля в заголовке ответа', () => {
  test('новая ревизия — профиль перезапрашивается; та же — нет', async () => {
    const http = await withProfile({ uploads: true }, 'r1');
    http.replies = [profile('r2', { uploads: false })];
    const { client } = makeClient(config => ({ revision: config.url === '/api/a' ? 'r1' : 'r2' }));

    await client.get('/api/a');
    await settle();
    assert.equal(http.calls.length, 1, 'ревизия совпадает с профилем');

    await client.get('/api/b');
    await waitFor(() => getFeatureSnapshot().profile?.revision === 'r2');
    assert.equal(http.calls.length, 2);
    assert.equal(getFeatureSnapshot().on.has('uploads'), false, 'состав обновился без перезагрузки');
  });

  test('ответ с ошибкой тоже несёт ревизию', async () => {
    const http = await withProfile({ uploads: true }, 'r1');
    const { client } = makeClient(() => ({ status: 500, revision: 'r9' }));
    await assert.rejects(client.get('/api/nomenclature/tree'));
    await waitFor(() => http.calls.length === 2);
  });

  test('несколько ответов подряд — один запрос профиля', async () => {
    const http = await withProfile({}, 'r1');
    http.replies = [profile('r2', {})];
    const { client } = makeClient(() => ({ revision: 'r2' }));
    await Promise.all([client.get('/api/1'), client.get('/api/2'), client.get('/api/3')]);
    await settle();
    assert.equal(http.calls.length, 2);
  });

  test('до входа (профиль не запрашивали) заголовок ничего не запускает', async () => {
    const http = stubHttp(profile('r1', {}));
    connectFeatureHttp(http);
    const { client } = makeClient(() => ({ revision: 'r2' }));
    await client.get('/api/auth/check_auth');
    await settle();
    assert.equal(http.calls.length, 0);
    assert.equal(getFeatureSnapshot().status, 'idle');
  });

  test('revisionFromHeaders: без учёта регистра; нет заголовка — null', () => {
    assert.equal(revisionFromHeaders(new AxiosHeaders({ 'x-awms-features': 'abc-1' })), 'abc-1');
    assert.equal(revisionFromHeaders({ 'X-AWMS-Features': 'abc-2' }), 'abc-2');
    assert.equal(revisionFromHeaders(new AxiosHeaders({ 'content-type': 'application/json' })), null);
    assert.equal(revisionFromHeaders({ 'x-awms-features': '' }), null);
    assert.equal(revisionFromHeaders(undefined), null);
  });
});

describe('404 на адрес API', () => {
  test('адрес функции — профиль перезапрашивается (не чаще NOT_FOUND_REFRESH_MS); адрес ядра — нет', async () => {
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
    const http = await withProfile({ video: true, 'video.live': true });
    const { client } = makeClient(() => ({ status: 404 }));

    await assert.rejects(client.get('/api/video/status'));
    await settle();
    assert.equal(http.calls.length, 1, 'профиль только что получен');

    mock.timers.setTime(1_000_000 + NOT_FOUND_REFRESH_MS + 1);
    await assert.rejects(client.get('/api/nomenclature/missing-uid'));
    await settle();
    assert.equal(http.calls.length, 1, '404 ядра — обычный ответ');

    await assert.rejects(client.get('/api/video/status'));
    await settle();
    assert.equal(http.calls.length, 2, '404 функции — профиль перезапрошен');
  });

  test('полный адрес (как у ConstantInfo.apiBaseUrl) — так же', async () => {
    mock.timers.enable({ apis: ['Date'], now: 2_000_000 });
    const http = await withProfile({ gpp: true });
    mock.timers.setTime(2_000_000 + NOT_FOUND_REFRESH_MS + 1);
    const { client } = makeClient(() => ({ status: 404 }));
    await assert.rejects(client.get('http://localhost/api/gpp/documents/5'));
    await settle();
    assert.equal(http.calls.length, 2);
  });

  test('ошибка ответа проходит к вызывающему коду без изменений', async () => {
    await withProfile({});
    const { client } = makeClient(() => ({ status: 404 }));
    await assert.rejects(client.get('/api/video/status'), (error: unknown) => {
      assert.ok(isAxiosError(error));
      assert.equal(error.response?.status, 404);
      return true;
    });
  });
});
