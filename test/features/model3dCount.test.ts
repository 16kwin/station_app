// model3dCount.test.ts — счётчик 3D-моделей на кнопке «3D» карточки номенклатуры (пакет F4a, раздел 8.2 проекта):
// без функции model3d запроса к /models нет (у выключенной функции адрес отвечает 404, в сборке без 3D его нет).
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { connectFeatureHttp, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { requestModelCount, type ModelCountHttp } from '../../src/components/ReferencesPage/NomenclaturePage/model3dCount';
import { deferred, profile, stubHttp, waitFor } from './helpers';

interface ModelsStub extends ModelCountHttp {
  calls: string[];
  signals: Array<AbortSignal | undefined>;
}

/** Заглушка списка моделей: каждый запрос записывается, ответ — reply (данные, ошибка или отложенный) */
const modelsHttp = (reply: unknown | Error | ReturnType<typeof deferred>): ModelsStub => {
  const stub: ModelsStub = {
    calls: [],
    signals: [],
    async get(url, config) {
      stub.calls.push(url);
      stub.signals.push(config?.signal);
      if (reply instanceof Error) throw reply;
      if (reply && typeof reply === 'object' && 'promise' in reply) return { data: await (reply as ReturnType<typeof deferred>).promise };
      return { data: reply };
    },
  };
  return stub;
};

const UID = '5b0d6c1e-8f3a-4c2b-9a77-1d2e3f405162';

const loadProfile = async (features: Record<string, unknown>) => {
  connectFeatureHttp(stubHttp(profile('r1', features)));
  assert.equal(await loadFeatures(), true);
};

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('без функции model3d запроса нет', () => {
  test('сервер выключил model3d — запроса нет, счётчик не меняется', async () => {
    await loadProfile({ model3d: false, 'model3d.upload': false, uploads: true });
    const http = modelsHttp([{ uid: 'm1' }]);
    const counts: number[] = [];
    assert.equal(requestModelCount(UID, count => counts.push(count), http), null);
    assert.deepEqual(http.calls, []);
    assert.deepEqual(counts, []);
  });

  test('ключа model3d нет в ответе — выключено, запроса нет', async () => {
    await loadProfile({ uploads: true });
    const http = modelsHttp([]);
    assert.equal(requestModelCount(UID, () => {}, http), null);
    assert.deepEqual(http.calls, []);
  });

  test('профиль ещё не загружен — запроса нет', () => {
    const http = modelsHttp([]);
    assert.equal(requestModelCount(UID, () => {}, http), null, 'профиль ещё не запрашивали');
    assert.deepEqual(http.calls, []);
  });

  test('номенклатура не записана — запроса нет и при включённом model3d', async () => {
    await loadProfile({ model3d: true });
    const http = modelsHttp([]);
    assert.equal(requestModelCount(null, () => {}, http), null);
    assert.deepEqual(http.calls, []);
  });
});

describe('с функцией model3d', () => {
  test('один запрос списка моделей номенклатуры, счётчик — длина списка', async () => {
    await loadProfile({ model3d: true });
    const http = modelsHttp([{ uid: 'm1' }, { uid: 'm2' }]);
    const counts: number[] = [];
    const cancel = requestModelCount(UID, count => counts.push(count), http);
    assert.equal(typeof cancel, 'function');
    await waitFor(() => counts.length > 0);
    assert.deepEqual(http.calls, [`/api/nomenclature/${UID}/models`]);
    assert.deepEqual(counts, [2]);
    assert.ok(http.signals[0] instanceof AbortSignal, 'запрос отменяемый');
  });

  test('профиль не получен — работает как до выключателей: запрос списка моделей идёт', async () => {
    connectFeatureHttp(stubHttp(new Error('сбой')));
    assert.equal(await loadFeatures(), false);
    const http = modelsHttp([{ uid: 'm1' }]);
    const counts: number[] = [];
    assert.equal(typeof requestModelCount(UID, count => counts.push(count), http), 'function');
    await waitFor(() => counts.length > 0);
    assert.deepEqual(http.calls, [`/api/nomenclature/${UID}/models`]);
    assert.deepEqual(counts, [1]);
  });

  test('загрузка моделей (model3d.upload) счётчику не нужна', async () => {
    await loadProfile({ model3d: true, 'model3d.upload': false, uploads: false });
    const http = modelsHttp([{ uid: 'm1' }]);
    const counts: number[] = [];
    requestModelCount(UID, count => counts.push(count), http);
    await waitFor(() => counts.length > 0);
    assert.deepEqual(counts, [1]);
  });

  test('ответ не список — 0; ошибка — счётчик не трогается', async () => {
    await loadProfile({ model3d: true });
    const counts: number[] = [];
    requestModelCount(UID, count => counts.push(count), modelsHttp({ error: 'странный ответ' }));
    await waitFor(() => counts.length > 0);
    assert.deepEqual(counts, [0]);

    const failing = modelsHttp(new Error('404'));
    const after: number[] = [];
    requestModelCount(UID, count => after.push(count), failing);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(failing.calls.length, 1);
    assert.deepEqual(after, [], 'сбой запроса счётчик не меняет и не бросает');
  });

  test('отмена до ответа (закрыли карточку, выключили функцию) — ответ не применяется', async () => {
    await loadProfile({ model3d: true });
    const reply = deferred();
    const http = modelsHttp(reply);
    const counts: number[] = [];
    const cancel = requestModelCount(UID, count => counts.push(count), http);
    assert.ok(cancel);
    cancel();
    assert.equal(http.signals[0]?.aborted, true, 'запрос отменён');
    reply.resolve([{ uid: 'm1' }]);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.deepEqual(counts, []);
  });
});
