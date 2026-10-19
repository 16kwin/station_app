// api.test.ts — разбор отчёта «Профиль безопасности», запросы и удаление данных (страница «Безопасность», F8).
import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  connectSecurityHttp,
  fetchSecurityReport,
  parseFrontendBuild,
  parseSecurityReport,
  postSecurityEvent,
  purgeFeatureData,
  ReportFormatError,
  ReportLoadError,
  SECURITY_EVENTS_API,
  SECURITY_PROFILE_API,
  SECURITY_PURGE_API,
  type SecretResponse,
} from '../../src/components/SecurityPage/api';
import { FINGERPRINT, JOURNAL_HASH, stubReport } from './fixtures';

/** Ошибка, как у Axios: ответ со статусом или без ответа (нет связи) */
const httpError = (status: number | null) => Object.assign(new Error('http'), status === null ? {} : { response: { status } });

const stubClient = (reply: (url: string) => unknown) => {
  const posts: Array<{ url: string; body: unknown }> = [];
  const client = {
    posts,
    async get(url: string) {
      const value = reply(url);
      if (value instanceof Error) throw value;
      return { data: value };
    },
    async post(url: string, body: unknown) {
      posts.push({ url, body });
      const value = reply(url);
      if (value instanceof Error) throw value;
      return { data: value };
    },
  };
  return client;
};

afterEach(() => connectSecurityHttp(null));

describe('parseSecurityReport', () => {
  test('отчёт по контракту: шапка, функции, параметры, журнал, использование', () => {
    const report = parseSecurityReport(stubReport('isolated'));
    assert.equal(report.header.fingerprint, FINGERPRINT);
    assert.equal(report.header.preset, 'isolated');
    assert.equal(report.header.presetSource, 'file');
    assert.equal(report.header.ceilingFile?.path, 'C:/AWMS/config/awms-features.properties');
    assert.deepEqual(report.header.journalHead, { id: 128, hash: JOURNAL_HASH });
    assert.equal(report.header.secretsState, 'generated');
    assert.equal(report.features?.length, 31);
    const video = report.features?.find(f => f.key === 'video');
    assert.equal(video?.enabled, false);
    assert.equal(video?.level, 'L3');
    assert.equal(video?.probe, '/api/video/status');
    assert.equal(video?.checks.length, 2);
    assert.equal(report.params?.find(p => p.key === 'awms.video.retention-days')?.value, '30');
    assert.equal(report.absent?.length, 7);
    assert.equal(report.journal?.chainValid, true);
    assert.equal(report.journal?.entries.length, 3);
    assert.deepEqual(report.usage?.types, ['VIDEO_VIEWED', 'EXPORT']);
    assert.equal(report.storedData?.[0].dirs[0].bytes, 13207024435);
    assert.deepEqual(report.extra, []);
  });

  test('без отпечатка профиля отчёт не принимается', () => {
    const data = stubReport();
    (data.header as Record<string, unknown>).fingerprint = undefined;
    assert.throws(() => parseSecurityReport(data), ReportFormatError);
    assert.throws(() => parseSecurityReport({ header: { fingerprint: 'не хэш' } }), ReportFormatError);
    assert.throws(() => parseSecurityReport('<html>'), ReportFormatError);
  });

  test('раздела нет — null («сервер не прислал»), а не пустой список', () => {
    const report = parseSecurityReport({ header: { fingerprint: FINGERPRINT } });
    assert.equal(report.features, null);
    assert.equal(report.storedData, null);
    assert.equal(report.journal, null);
    assert.equal(report.usage, null);
    assert.equal(report.caveats, null);
    assert.equal(report.selfCheck, null);
  });

  test('поля шапки на верхнем уровне, функции картой «ключ → вкл»', () => {
    const report = parseSecurityReport({
      fingerprint: FINGERPRINT.toUpperCase(),
      preset: 'standard',
      presetSource: 'default',
      features: { video: false, export: true },
    });
    assert.equal(report.header.fingerprint, FINGERPRINT);
    assert.equal(report.header.presetSource, 'default');
    assert.deepEqual(
      report.features?.map(f => [f.key, f.enabled]),
      [
        ['video', false],
        ['export', true],
      ],
    );
    // Поля шапки на верхнем уровне не попадают в «Прочие сведения»
    assert.deepEqual(report.extra, []);
  });

  test('неизвестное печатается как есть: поля шапки и разделов, новые разделы', () => {
    const data: Record<string, unknown> = stubReport();
    (data.header as Record<string, unknown>).nginx = 'не настроен';
    (data.inbound as Record<string, unknown>).listeners = [{ port: 8084, proto: 'http' }];
    data.sbom = { format: 'CycloneDX' };
    const report = parseSecurityReport(data);
    assert.deepEqual(report.header.extra, [{ label: 'nginx', value: 'не настроен', ok: null, note: null }]);
    assert.ok(report.inbound?.tables.some(t => t.title === 'listeners' && t.rows[0].includes('8084')));
    assert.deepEqual(report.extra, [{ key: 'sbom', value: { format: 'CycloneDX' } }]);
  });

  test('сводка использования из плоских строк {actor, event, count}', () => {
    const report = parseSecurityReport({
      header: { fingerprint: FINGERPRINT },
      usage: {
        days: 7,
        rows: [
          { actor: 'a', event: 'EXPORT', count: 2 },
          { actor: 'a', event: 'VIDEO_VIEWED', count: 1 },
          { actor: 'b', event: 'AI_QUERY', count: 5 },
        ],
      },
    });
    assert.equal(report.usage?.days, 7);
    assert.deepEqual(report.usage?.types, ['VIDEO_VIEWED', 'EXPORT', 'AI_QUERY']);
    assert.deepEqual(report.usage?.rows.find(r => r.actor === 'a')?.counts, { EXPORT: 2, VIDEO_VIEWED: 1 });
  });

  test('голова журнала берётся из раздела журнала, если в шапке её нет', () => {
    const data = stubReport();
    (data.header as Record<string, unknown>).journalHead = undefined;
    assert.deepEqual(parseSecurityReport(data).header.journalHead, { id: 128, hash: JOURNAL_HASH });
  });
});

describe('fetchSecurityReport', () => {
  const failure = async (reply: unknown) => {
    connectSecurityHttp(stubClient(() => reply));
    try {
      await fetchSecurityReport();
    } catch (error) {
      assert.ok(error instanceof ReportLoadError);
      return error.failure.kind;
    }
    assert.fail('ожидалась ошибка');
  };

  test('запрашивает /api/security-profile и разбирает ответ', async () => {
    const urls: string[] = [];
    connectSecurityHttp(stubClient(url => (urls.push(url), stubReport('full'))));
    const report = await fetchSecurityReport();
    assert.deepEqual(urls, [SECURITY_PROFILE_API]);
    assert.equal(report.features?.filter(f => !f.enabled).length, 4);
  });

  test('причины отказа: доступ, старый сервер, связь, ошибка сервера, формат', async () => {
    assert.equal(await failure(httpError(403)), 'forbidden');
    assert.equal(await failure(httpError(401)), 'forbidden');
    assert.equal(await failure(httpError(404)), 'unsupported');
    assert.equal(await failure(httpError(null)), 'network');
    assert.equal(await failure(httpError(500)), 'server');
    assert.equal(await failure('<!doctype html>'), 'format');
  });
});

describe('postSecurityEvent', () => {
  test('тип, отпечаток, ревизия и подробности; сбой — false без исключения', async () => {
    const client = stubClient(() => ({}));
    connectSecurityHttp(client);
    const report = parseSecurityReport(stubReport());
    assert.equal(await postSecurityEvent('REPORT_PRINTED', report, { probesRun: false }), true);
    assert.deepEqual(client.posts, [
      {
        url: SECURITY_EVENTS_API,
        body: { type: 'REPORT_PRINTED', fingerprint: FINGERPRINT, revision: FINGERPRINT.slice(0, 12) + '-0', details: { probesRun: false } },
      },
    ]);
    connectSecurityHttp(stubClient(() => httpError(404)));
    assert.equal(await postSecurityEvent('REPORT_VIEWED', report), false);
  });
});

describe('purgeFeatureData', () => {
  const PASSWORD = 'тестовый-пароль-не-настоящий';

  const connect = (reply: SecretResponse | Error) => {
    const sent: Array<{ url: string; body: unknown }> = [];
    const http = stubClient(() => ({}));
    connectSecurityHttp(http, {
      secretPost: async (url, body) => {
        sent.push({ url, body });
        if (reply instanceof Error) throw reply;
        return reply;
      },
    });
    return { sent, http };
  };

  test('без причины или пароля запрос не уходит', async () => {
    const { sent } = connect({ status: 200, data: {} });
    const noReason = await purgeFeatureData({ feature: 'video', reason: ' ', password: PASSWORD });
    const noPassword = await purgeFeatureData({ feature: 'video', reason: 'решение комиссии', password: '' });
    assert.equal(noReason.ok, false);
    assert.equal(noPassword.ok, false);
    assert.equal(sent.length, 0);
  });

  test('пароль — только в теле запроса и мимо общего клиента (его перехватчик пишет ошибки в консоль)', async () => {
    const { sent, http } = connect({
      status: 200,
      data: { feature: 'video', tables: [{ name: 'video_record', rows: 340 }], dirs: [{ path: 'video-archive', files: 680, bytes: 1024 }], journalId: 131 },
    });
    const outcome = await purgeFeatureData({ feature: 'video', reason: '  решение комиссии  ', password: PASSWORD });
    assert.deepEqual(sent, [{ url: SECURITY_PURGE_API, body: { feature: 'video', reason: 'решение комиссии', password: PASSWORD } }]);
    assert.ok(!sent[0].url.includes(PASSWORD));
    assert.equal(http.posts.length, 0);
    assert.deepEqual(outcome, {
      ok: true,
      result: { feature: 'video', tables: [{ name: 'video_record', rows: 340 }], dirs: [{ path: 'video-archive', files: 680, bytes: 1024 }], journalId: 131 },
    });
  });

  test('отказы сервера словами, без повтора пароля в сообщении', async () => {
    const cases: Array<[SecretResponse | Error, string]> = [
      [{ status: 400, data: { message: 'Неверный пароль' } }, 'rejected'],
      [{ status: 403, data: null }, 'forbidden'],
      [{ status: 404, data: '<html>' }, 'unsupported'],
      [{ status: 502, data: null }, 'server'],
      [new TypeError('Failed to fetch'), 'network'],
    ];
    for (const [reply, kind] of cases) {
      connect(reply);
      const outcome = await purgeFeatureData({ feature: 'video', reason: 'решение комиссии', password: PASSWORD });
      assert.equal(outcome.ok, false);
      if (!outcome.ok) {
        assert.equal(outcome.kind, kind);
        assert.ok(!outcome.message.includes(PASSWORD));
      }
    }
    connect({ status: 400, data: { message: 'Неверный пароль' } });
    const rejected = await purgeFeatureData({ feature: 'video', reason: 'решение комиссии', password: PASSWORD });
    assert.equal(!rejected.ok && rejected.message, 'Неверный пароль');
  });
});

describe('parseFrontendBuild', () => {
  test('файл варианта поставки; не он (страница dev-сервера, пусто) — null', () => {
    assert.equal(parseFrontendBuild('<!doctype html>'), null);
    assert.equal(parseFrontendBuild({}), null);
    const build = parseFrontendBuild({
      variant: 'isolated',
      buildId: 'a1b2c3',
      excluded: ['video', 'model3d'],
      packages: { react: '19.2.4', three: { version: '0.186.1', license: 'MIT' } },
    });
    assert.equal(build?.variant, 'isolated');
    assert.deepEqual(build?.excluded, ['video', 'model3d']);
    assert.deepEqual(build?.packages, [
      { name: 'react', version: '19.2.4', license: null },
      { name: 'three', version: '0.186.1', license: 'MIT' },
    ]);
  });
});
