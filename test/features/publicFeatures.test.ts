// publicFeatures.test.ts — флаги до входа (pwa, passwords): разбор ответа и поведение при сбоях (раздел 8.4 проекта).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_FEATURES_API, fetchPublicFeatures, parsePublicFeatures } from '../../src/services/features/publicFeatures';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('публичные флаги', () => {
  test('включено только то, что сервер прислал как true', () => {
    assert.deepEqual(parsePublicFeatures({ revision: 'r1', features: { pwa: true, passwords: 'true' } }), {
      loaded: true,
      revision: 'r1',
      pwa: true,
      passwords: false,
    });
    assert.deepEqual(parsePublicFeatures({ features: {} }), { loaded: true, revision: null, pwa: false, passwords: false });
  });

  test('ответ без features — сбой: оба выключены, loaded = false', () => {
    for (const body of [null, 'текст', { revision: 'r1' }, { features: null }]) {
      assert.deepEqual(parsePublicFeatures(body), { loaded: false, revision: null, pwa: false, passwords: false });
    }
  });

  test('запрос: адрес сервера API, без куки и без кэша', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchStub = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return jsonResponse(200, { revision: 'r1', features: { pwa: true, passwords: true } });
    }) as typeof fetch;
    const result = await fetchPublicFeatures(fetchStub, 'http://localhost');
    assert.deepEqual(result, { loaded: true, revision: 'r1', pwa: true, passwords: true });
    assert.equal(calls[0].url, 'http://localhost' + PUBLIC_FEATURES_API);
    assert.equal(calls[0].init?.credentials, 'omit');
    assert.equal(calls[0].init?.cache, 'no-store');
  });

  test('старый сервер (403/404) и обрыв связи — оба выключены, loaded = false', async () => {
    for (const status of [403, 404, 500]) {
      const result = await fetchPublicFeatures((async () => jsonResponse(status, {})) as unknown as typeof fetch, '');
      assert.equal(result.loaded, false, `статус ${status}`);
      assert.equal(result.pwa, false);
    }
    const offline = await fetchPublicFeatures((async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch, '');
    assert.deepEqual(offline, { loaded: false, revision: null, pwa: false, passwords: false });
  });
});
