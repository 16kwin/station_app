// probes.test.ts — «Проверка из браузера» страницы «Безопасность»: адреса проб, методы GET и HEAD с входом
// и без, разбор ответов, таймаут, отмена загрузки тела, только безопасные адреса.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSecurityReport } from '../../src/components/SecurityPage/api';
import {
  classifyStatus,
  isSafeProbePath,
  probeEventDetails,
  probeTargets,
  runProbes,
  type ProbeFetch,
} from '../../src/components/SecurityPage/probes';
import { stubReport } from './fixtures';

const BASE = 'http://localhost';

interface Call {
  url: string;
  init: RequestInit;
}

/** fetch-заглушка: статус по адресу и методу; запоминает вызовы и их сигналы */
const stubFetch = (status: (url: string, method: string) => number | Error | 'hang') => {
  const calls: Call[] = [];
  let active = 0;
  let maxActive = 0;
  const fn: ProbeFetch = async (url, init) => {
    calls.push({ url, init });
    active++;
    maxActive = Math.max(maxActive, active);
    try {
      await new Promise(r => setTimeout(r, 2));
      const s = status(url, String(init.method));
      if (s === 'hang') {
        await new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
      }
      if (s instanceof Error) throw s;
      return { status: s as number };
    } finally {
      active--;
    }
  };
  return { fn, calls, maxActive: () => maxActive };
};

describe('probeTargets', () => {
  test('isolated: адрес каждой выключенной функции с пробой, без дублей', () => {
    const report = parseSecurityReport(stubReport('isolated'));
    const targets = probeTargets(report);
    const urls = targets.map(t => t.url);
    assert.ok(urls.includes('/api/video/status'));
    assert.ok(urls.includes('/api/video/files/1/download'));
    assert.ok(urls.includes('/ws-stations/info'));
    assert.ok(urls.includes('/api/orders/active'));
    assert.equal(new Set(urls).size, urls.length);
    // Включённых функций и функций без маршрутов среди проб нет
    assert.ok(targets.every(t => report.features?.find(f => f.key === t.feature)?.enabled === false));
    assert.ok(!targets.some(t => t.feature === 'pwa' || t.feature === 'legacy'));
    assert.equal(targets.find(t => t.feature === 'video')?.title, 'Видео с IP-камер');
  });

  test('full: только служебные функции, выключенные во всех пресетах', () => {
    const targets = probeTargets(parseSecurityReport(stubReport('full')));
    assert.deepEqual(
      targets.map(t => t.feature),
      ['testsync'],
    );
  });

  test('явный список сервера важнее; чужие адреса и обходы отбрасываются', () => {
    const report = parseSecurityReport({
      ...stubReport('isolated'),
      probes: [
        { feature: 'video', url: '/api/video/status' },
        { feature: 'x', url: 'http://evil.example/api' },
        { feature: 'x', url: '//evil.example/api' },
        { feature: 'x', url: '/api/../admin' },
        { feature: 'x', url: '/api/%2e%2e/admin' },
        { feature: 'x', url: '/api\\admin' },
        { feature: 'x', url: '/api/a;b' },
        { feature: 'video', url: '/api/video/status' },
      ],
    });
    assert.deepEqual(
      probeTargets(report).map(t => t.url),
      ['/api/video/status'],
    );
  });

  test('isSafeProbePath', () => {
    assert.equal(isSafeProbePath('/api/gpp'), true);
    assert.equal(isSafeProbePath('/api/dashboard/economic?from=2026-01-01'), true);
    for (const bad of ['api/gpp', '', '/', '//x', '/a/./b', '/a/..', 'https://x/y', '/a b', '/a%2Fb']) {
      assert.equal(isSafeProbePath(bad), false, bad);
    }
  });
});

describe('classifyStatus', () => {
  test('только 404 — «закрыто»', () => {
    assert.equal(classifyStatus(404), 'closed');
    assert.equal(classifyStatus(200), 'open');
    assert.equal(classifyStatus(206), 'open');
    assert.equal(classifyStatus(302), 'open');
    assert.equal(classifyStatus(0), 'open');
    assert.equal(classifyStatus(401), 'denied');
    assert.equal(classifyStatus(403), 'denied');
    assert.equal(classifyStatus(405), 'method');
    assert.equal(classifyStatus(500), 'other');
    assert.equal(classifyStatus(null), 'error');
  });
});

describe('runProbes', () => {
  const targets = [
    { feature: 'video', title: 'Видео', url: '/api/video/status' },
    { feature: 'orders', title: 'Заказы', url: '/api/orders/active' },
  ];

  test('каждый адрес — GET и HEAD, с куки и без; без кэша и перенаправлений', async () => {
    const stub = stubFetch(() => 404);
    const progress: number[] = [];
    const run = await runProbes(targets, { baseUrl: BASE + '/', fetchFn: stub.fn, onProgress: done => progress.push(done) });
    assert.equal(run.total, 8);
    assert.equal(run.passed, 8);
    assert.equal(run.failed, 0);
    assert.ok(run.results.every(r => r.ok));
    const video = stub.calls.filter(c => c.url === BASE + '/api/video/status');
    assert.deepEqual(
      video.map(c => [c.init.method, c.init.credentials]),
      [
        ['GET', 'include'],
        ['HEAD', 'include'],
        ['GET', 'omit'],
        ['HEAD', 'omit'],
      ],
    );
    assert.ok(stub.calls.every(c => c.init.cache === 'no-store' && c.init.redirect === 'manual'));
    // Тело ответа не читается: запрос прерывается сразу после статуса
    assert.ok(stub.calls.every(c => c.init.signal?.aborted === true));
    assert.deepEqual(progress, [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('открытый маршрут, правила доступа, метод и сбой — не «закрыто»', async () => {
    const stub = stubFetch((url, method) => {
      if (url.endsWith('/orders/active')) return method === 'HEAD' ? 405 : 200;
      return method === 'GET' ? 403 : new TypeError('Failed to fetch');
    });
    const run = await runProbes(targets, { baseUrl: BASE, fetchFn: stub.fn });
    assert.equal(run.passed, 0);
    assert.equal(run.failed, 8);
    const orders = run.results.find(r => r.target.feature === 'orders');
    assert.deepEqual(
      orders?.attempts.map(a => a.outcome),
      ['open', 'method', 'open', 'method'],
    );
    const video = run.results.find(r => r.target.feature === 'video');
    assert.deepEqual(
      video?.attempts.map(a => [a.status, a.outcome]),
      [
        [403, 'denied'],
        [null, 'error'],
        [403, 'denied'],
        [null, 'error'],
      ],
    );
  });

  test('ответа нет дольше таймаута — «нет ответа», запрос прерван', async () => {
    const stub = stubFetch(() => 'hang');
    const run = await runProbes([targets[0]], { baseUrl: BASE, fetchFn: stub.fn, timeoutMs: 30 });
    assert.ok(run.results[0].attempts.every(a => a.outcome === 'error'));
    assert.ok(stub.calls.every(c => c.init.signal?.aborted));
  });

  test('не больше concurrency запросов одновременно', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ feature: 'f' + i, title: 'f', url: `/api/f${i}` }));
    const stub = stubFetch(() => 404);
    await runProbes(many, { baseUrl: BASE, fetchFn: stub.fn, concurrency: 3 });
    assert.equal(stub.calls.length, 20);
    assert.ok(stub.maxActive() <= 3);
  });

  test('отмена проверки: оставшиеся запросы не уходят', async () => {
    const controller = new AbortController();
    const stub = stubFetch(() => 404);
    const run = await runProbes(targets, {
      baseUrl: BASE,
      fetchFn: stub.fn,
      concurrency: 1,
      signal: controller.signal,
      onProgress: done => done === 2 && controller.abort(),
    });
    assert.equal(stub.calls.length, 2);
    assert.equal(run.passed, 2);
  });

  test('подробности для журнала — только адреса и коды', async () => {
    const stub = stubFetch(() => 404);
    const run = await runProbes([targets[0]], { baseUrl: BASE, fetchFn: stub.fn });
    const details = probeEventDetails(run);
    assert.equal(details.total, 4);
    assert.deepEqual((details.results as Array<{ attempts: string[] }>)[0].attempts, [
      'GET session 404',
      'HEAD session 404',
      'GET anonymous 404',
      'HEAD anonymous 404',
    ]);
  });
});
