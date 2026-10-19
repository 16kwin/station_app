// report.test.tsx — разметка отчёта «Профиль безопасности» (ProfileReport) на экране и на бумаге: все разделы 9.2,
// честное «сервер не прислал», шапка листа с отпечатком и головой журнала, блок подписей, кнопки только на экране.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import ReactDOMServer from 'react-dom/server';
import { parseSecurityReport, type SecurityReport } from '../../src/components/SecurityPage/api';
import ProfileReport, { type ProfileReportProps } from '../../src/components/SecurityPage/ProfileReport';
import { probeTargets, type ProbeRun } from '../../src/components/SecurityPage/probes';
import { OUTLINE } from '../../src/components/SecurityPage/sections/outline';
import { FINGERPRINT, JOURNAL_HASH, stubReport } from './fixtures';

const render = (report: SecurityReport, over: Partial<ProfileReportProps> = {}): string =>
  ReactDOMServer.renderToStaticMarkup(
    <ProfileReport
      report={report}
      build={null}
      mode="screen"
      probeTargets={probeTargets(report)}
      probeRun={null}
      probeProgress={null}
      probeLogged={null}
      viewerCanPurge={false}
      onPurge={() => {}}
      onRunProbes={() => {}}
      {...over}
    />,
  );

/** Текст без разметки (для поиска фраз, разбитых тегами) */
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

describe('ProfileReport: экран', () => {
  test('все разделы 1–14 с якорями оглавления; «Прочие сведения» — только когда есть что показать', () => {
    const html = render(parseSecurityReport(stubReport('isolated')));
    for (const item of OUTLINE.filter(i => i.n <= 14)) {
      assert.ok(html.includes(`id="${item.anchor}"`), item.anchor);
      assert.ok(text(html).includes(`${item.n}.${item.title}`), item.title);
    }
    assert.ok(!html.includes('sp-s-other'));
    assert.ok(!html.includes('sp-frame'));
    assert.ok(!html.includes('Подписи'));
  });

  test('раздел, которого нет в ответе, — «Сервер не прислал этот раздел»', () => {
    const html = render(parseSecurityReport({ header: { fingerprint: FINGERPRINT } }));
    const missing = html.split('Сервер не прислал этот раздел отчёта.').length - 1;
    // функции, параметры, отсутствующее, среда, входящие, исходящие, фон, хранимое, сервер-компоненты, журнал, роли, использование
    assert.ok(missing >= 12, `разделов «не прислал»: ${missing}`);
    // Оговорки и команды проверки строятся и без сервера
    assert.ok(text(html).includes('Что этот отчёт не гарантирует'));
    assert.ok(text(html).includes('print-features'));
  });

  test('функции: состояние, уровень, пометка о ролях из токена', () => {
    const data = stubReport('standard');
    const plan = data.features.find(f => f.key === 'map.plan')!;
    Object.assign(plan, { enabled: false, reason: 'DEPENDENCY:map', reasonText: 'выключена: выключена функция map' });
    const html = text(render(parseSecurityReport(data)));
    assert.ok(html.includes('Включено 12 из 31'), 'счётчик включённых');
    assert.ok(html.includes('выключена потолком'));
    assert.ok(html.includes('L3 — код не загружен'));
    assert.ok(html.includes('выключена: выключена map'));
    // У export в standard роли ADMIN, DIRECTOR, а роль берётся из токена
    assert.ok(html.includes('ADMIN, DIRECTOR'));
    assert.ok(html.includes('роль из токена, ключ общий — не гарантируется'));
  });

  test('кнопка «Удалить данные» — только администратору ИБ и не в печати', () => {
    const report = parseSecurityReport(stubReport('isolated'));
    assert.ok(!render(report).includes('Удалить данные</button>'));
    assert.ok(render(report, { viewerCanPurge: true }).includes('Удалить данные</button>'));
    assert.ok(!render(report, { viewerCanPurge: true, mode: 'print' }).includes('<button'));
  });

  test('результат проверки из браузера', () => {
    const report = parseSecurityReport(stubReport('isolated'));
    const targets = probeTargets(report);
    const run: ProbeRun = {
      startedAt: '2026-10-14T07:00:00Z',
      finishedAt: '2026-10-14T07:00:03Z',
      results: targets.map((target, i) => ({
        target,
        ok: i !== 0,
        attempts: (['GET', 'HEAD', 'GET', 'HEAD'] as const).map((method, j) => ({
          method,
          auth: j < 2 ? ('session' as const) : ('anonymous' as const),
          status: i === 0 && j === 3 ? 403 : 404,
          outcome: i === 0 && j === 3 ? ('denied' as const) : ('closed' as const),
        })),
      })),
      total: targets.length * 4,
      passed: targets.length * 4 - 1,
      failed: 1,
    };
    const html = text(render(report, { probeRun: run, probeLogged: false }));
    assert.ok(html.includes(`Не 404: 1 из ${targets.length * 4}`));
    assert.ok(html.includes('ответили правила доступа'));
    assert.ok(html.includes('в журнал профиля не записана'));
  });

  test('строки сервера выводятся текстом, а не разметкой', () => {
    const data = stubReport('isolated');
    data.header.ticket = '<img src=x onerror=alert(1)>';
    data.features[0].title = '<script>alert(1)</script>';
    const html = render(parseSecurityReport(data));
    assert.ok(!html.includes('<img src=x'));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;img src=x'));
  });

  test('неизвестные разделы сервера — в «Прочих сведениях»', () => {
    const html = render(parseSecurityReport({ ...stubReport(), sbom: { format: 'CycloneDX', components: 211 } }));
    assert.ok(html.includes('id="sp-s-other"'));
    assert.ok(text(html).includes('CycloneDX'));
  });
});

describe('ProfileReport: печать', () => {
  const report = parseSecurityReport(stubReport('isolated'));
  const html = render(report, { mode: 'print', printedAt: '2026-10-14T07:31:00Z' });

  test('шапка листа (повторяется на каждой странице): отпечаток целиком и голова журнала', () => {
    const thead = html.slice(html.indexOf('<table class="sp-frame">'), html.indexOf('</thead>'));
    assert.ok(thead.includes(FINGERPRINT), 'отпечаток в шапке листа');
    assert.ok(thead.includes(JOURNAL_HASH), 'голова журнала в шапке листа');
    assert.ok(text(thead).includes('запись № 128'));
    const tfoot = html.slice(html.indexOf('<tfoot>'), html.indexOf('</tfoot>'));
    assert.ok(text(tfoot).includes(FINGERPRINT.slice(0, 12)));
  });

  test('без якорей и кнопок; в конце блок подписей с отпечатком', () => {
    assert.ok(!html.includes(' id="sp-s-'));
    assert.ok(!html.includes('<button'));
    const sign = html.slice(html.indexOf('sp-signatures'));
    assert.ok(text(sign).includes('Представитель поставщика'));
    assert.ok(text(sign).includes('Ответственный за ИБ заказчика'));
    assert.ok(sign.includes(FINGERPRINT));
  });

  test('проверка из браузера не выполнялась — так и написано', () => {
    assert.ok(text(html).includes('Проверка из браузера не выполнялась.'));
  });
});
