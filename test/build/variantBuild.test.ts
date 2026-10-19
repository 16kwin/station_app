// variantBuild.test.ts — сквозная проверка варианта поставки на маленьком проекте-образце: настоящая сборка Vite
// с плагином build/awmsBuildVariant.ts и проверка результата скриптом build/verify-dist.mjs (раздел 8.5 проекта).
// Образец повторяет раскладку модулей приложения (каталоги, пакеты, public/vendor) и содержит их сигнатуры,
// поэтому полная сборка проверяет и сам список сигнатур: каждая найдена и только в файлах своего модуля.
import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { build } from 'vite';
import awmsBuildVariant from '../../build/awmsBuildVariant';

const PROJECT = process.cwd();
const KILLER = resolve(PROJECT, 'build/sw-kill.js');
const VERIFY = resolve(PROJECT, 'build/verify-dist.mjs');
const temp = mkdtempSync(join(tmpdir(), 'awms-variant-'));
after(() => rmSync(temp, { recursive: true, force: true }));

const write = (root: string, path: string, content: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

/** Пакет npm образца: одна функция, возвращающая строку-сигнатуру */
const fakePackage = (root: string, name: string, body: string) => {
  write(root, `node_modules/${name}/package.json`, JSON.stringify({ name, version: '1.0.0-test', license: 'MIT', type: 'module', main: 'index.js' }));
  write(root, `node_modules/${name}/index.js`, body);
};

interface FixtureOptions {
  /** Ядро импортирует модуль видео статически — мимо флага сборки */
  staticVideo?: boolean;
  /** Ядро импортирует из модуля видео только тип */
  typeOnlyVideo?: boolean;
  /** Ядро импортирует three статически */
  staticThree?: boolean;
  /** Строка, которую ядро печатает в консоль (подмешать сигнатуру в ядро) */
  coreText?: string;
}

let fixtures = 0;
const makeFixture = (options: FixtureOptions = {}): string => {
  const root = join(temp, `p${++fixtures}`);
  write(root, 'index.html', '<!doctype html><html><head><title>t</title></head><body><script type="module" src="/src/main.ts"></script></body></html>');
  write(root, 'src/types.d.ts', [
    'declare const __AWMS_HAS_VIDEO__: boolean; declare const __AWMS_HAS_MODEL3D__: boolean; declare const __AWMS_HAS_MAP__: boolean;',
    'declare const __AWMS_HAS_GRAPH__: boolean; declare const __AWMS_HAS_ORDERS__: boolean; declare const __AWMS_HAS_WEBSOCKET__: boolean;',
    'declare const __AWMS_HAS_PWA__: boolean; declare const __AWMS_HAS_INTEGRATIONS__: boolean;',
  ].join('\n'));
  const lines = [
    // Шаблоны ворот лежат в ядре (как в routes.ts) и сигнатурами не считаются
    "console.log(['/api/video/**', '/api/station-plans/**', '/api/orders/**', '/api/tkp/**'].join());",
    'const loaders = [',
    "  __AWMS_HAS_VIDEO__ ? () => import('./components/DocumentsPage/VideoArchive/live') : null,",
    "  __AWMS_HAS_MODEL3D__ ? () => import('./components/ReferencesPage/NomenclaturePage/Model3D/viewer') : null,",
    "  __AWMS_HAS_MAP__ ? () => import('./components/StationsPage/StationMap/api') : null,",
    "  __AWMS_HAS_GRAPH__ ? () => import('./components/mainPage/purchaseGraph/simulation') : null,",
    "  __AWMS_HAS_ORDERS__ ? () => import('./components/AnalyticsPage/api') : null,",
    "  __AWMS_HAS_INTEGRATIONS__ ? () => import('./components/ReferencesPage/NomenclaturePage/IntegrationTab') : null,",
    "  __AWMS_HAS_WEBSOCKET__ ? () => Promise.all([import('@stomp/stompjs'), import('sockjs-client')]).then(([a, b]) => ({ default: () => a.frame() + b.transport() })) : null,",
    '];',
    'for (const load of loaders) if (load) load().then((m) => console.log(m.default()));',
    "if (__AWMS_HAS_PWA__) navigator.serviceWorker.register('/sw.js');",
    "console.log('ядро');",
  ];
  if (options.staticVideo) lines.unshift("import live from './components/DocumentsPage/VideoArchive/live';", 'console.log(live());');
  if (options.typeOnlyVideo) lines.unshift("import type { LiveInfo } from './components/DocumentsPage/VideoArchive/live';", "const info: LiveInfo = { codec: 'h264' };", 'console.log(info);');
  if (options.staticThree) lines.unshift("import { renderer } from 'three';", 'console.log(renderer());');
  if (options.coreText) lines.push(`console.log(${JSON.stringify(options.coreText)});`);
  write(root, 'src/main.ts', lines.join('\n'));

  write(root, 'src/components/DocumentsPage/VideoArchive/live.ts', [
    'export interface LiveInfo { codec: string }',
    "export default () => ['MediaSource', 'X-Video-Codec', '/api/video/cameras/1/live'].join();",
  ].join('\n'));
  write(root, 'src/components/ReferencesPage/NomenclaturePage/Model3D/viewer.ts', [
    "import { renderer } from 'three';",
    "const worker = new Worker(new URL('./convert.worker.ts', import.meta.url), { type: 'module' });",
    'export default () => { worker.postMessage(1); return renderer(); };',
  ].join('\n'));
  write(root, 'src/components/ReferencesPage/NomenclaturePage/Model3D/convert.worker.ts', "import { renderer } from 'three';\nself.onmessage = () => self.postMessage(renderer() + ' occt-import-js');");
  write(root, 'src/components/StationsPage/StationMap/api.ts', "export default () => '/api/station-plans/workshops/1';");
  write(root, 'src/components/mainPage/purchaseGraph/simulation.ts', "import { simulate } from 'd3-force';\nexport default () => simulate();");
  write(root, 'src/components/AnalyticsPage/api.ts', "export default () => ['/api/orders/active', '/api/tkp/list'].join();");
  write(root, 'src/components/ReferencesPage/NomenclaturePage/IntegrationTab.tsx', "export default () => ['SAP', 'Oracle EBS'].join();");

  fakePackage(root, 'three', "export const renderer = () => 'WebGLRenderer';");
  fakePackage(root, 'd3-force', "export const simulate = () => 'velocityDecay alphaTarget';");
  fakePackage(root, '@stomp/stompjs', "export const frame = () => 'accept-version';");
  fakePackage(root, 'sockjs-client', "export const transport = () => 'xhr_streaming';");

  write(root, 'public/sw.js', "const STATIC_CACHE = 'awms-static-v1';\nself.addEventListener('fetch', () => {});\n");
  write(root, 'public/manifest.json', '{"name":"t"}');
  write(root, 'public/offline.html', '<!doctype html><title>Нет связи</title>');
  write(root, 'public/config.js', 'window.config = { ip_api: "" };');
  write(root, 'public/vendor/occt/occt-import-js.js', "importScripts('occt-import-js.wasm');");
  write(root, 'public/vendor/sockjs/sockjs.min.js', "var t = 'xhr_streaming';");
  return root;
};

interface BuildResult {
  outDir: string;
  error: Error | null;
}

const buildFixture = async (root: string, env: Record<string, string>, outName = 'dist', emptyOutDir = true): Promise<BuildResult> => {
  const variant = awmsBuildVariant({ buildId: 'test', env, killerFile: KILLER });
  const outDir = join(root, outName);
  try {
    await build({
      configFile: false,
      root,
      logLevel: 'silent',
      plugins: [variant.plugin],
      worker: { plugins: () => [variant.workerPlugin()] },
      build: { outDir, emptyOutDir },
    });
    return { outDir, error: null };
  } catch (error) {
    return { outDir, error: error as Error };
  }
};

const verify = (dir: string, ...args: string[]) => {
  const run = spawnSync(process.execPath, [VERIFY, dir, ...args], { encoding: 'utf8' });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
};

interface Report {
  variant: string;
  excluded: string[];
  removed: string[];
  serviceWorker: { mode: string; staticCache?: string };
  packages: Array<{ name: string; version: string; license: string }>;
  vendored: Array<{ path: string }>;
  chunks: Array<{ file: string; kind: string; modules: string[]; packages: string[] }>;
  files: Array<{ path: string; sha256: string; modules?: string[] }>;
}
const readReport = (dir: string): Report => JSON.parse(readFileSync(join(dir, 'awms-build.json'), 'utf8')) as Report;

describe('сборка варианта на проекте-образце', () => {
  test('full: все модули в отдельных чанках, воркер отнесён к 3D, кэш статики назван по варианту, verify-dist проходит', async () => {
    const { outDir, error } = await buildFixture(makeFixture(), {});
    assert.equal(error, null);
    const report = readReport(outDir);
    assert.equal(report.variant, 'full');
    assert.deepEqual(report.excluded, []);
    assert.deepEqual(report.serviceWorker, { mode: 'pwa', staticCache: 'awms-static-full-v1' });
    assert.match(readFileSync(join(outDir, 'sw.js'), 'utf8'), /'awms-static-full-v1'/);
    const worker = report.chunks.find(c => c.kind === 'worker');
    assert.ok(worker, 'воркер в карте чанков');
    assert.deepEqual(worker.modules, ['model3d']);
    assert.deepEqual(worker.packages, ['three']);
    assert.deepEqual(report.packages.map(p => p.name).sort(), ['@stomp/stompjs', 'd3-force', 'sockjs-client', 'three']);
    assert.ok(report.vendored.some(v => v.path === 'vendor/occt'));
    const entry = report.chunks.find(c => c.kind === 'entry');
    assert.deepEqual(entry?.modules, ['core']);
    // SHA256SUMS — все файлы, кроме себя, в формате sha256sum
    const sums = readFileSync(join(outDir, 'SHA256SUMS'), 'utf8').trim().split('\n');
    assert.equal(sums.length, report.files.length + 1);
    for (const line of sums) assert.match(line, /^[0-9a-f]{64} {2}\S/);
    const result = verify(outDir, '--expect=full');
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /видео \(video\): в сборке — сигнатуры найдены только в файлах модуля/);
  });

  test('isolated: кода модулей нет, public/ без vendor и манифеста, sw.js — ликвидатор, verify-dist проходит', async () => {
    const { outDir, error } = await buildFixture(makeFixture(), { AWMS_VARIANT: 'isolated' });
    assert.equal(error, null);
    const report = readReport(outDir);
    assert.equal(report.variant, 'isolated');
    assert.equal(report.excluded.length, 8);
    assert.deepEqual(report.removed.sort(), ['manifest.json', 'offline.html', 'vendor/occt', 'vendor/sockjs']);
    assert.deepEqual(report.serviceWorker, { mode: 'kill' });
    assert.deepEqual(report.packages, []);
    assert.deepEqual(report.vendored, []);
    assert.ok(!existsSync(join(outDir, 'vendor')), 'пустой vendor/ удалён');
    assert.equal(readFileSync(join(outDir, 'sw.js'), 'utf8'), readFileSync(KILLER, 'utf8'));
    assert.ok(report.chunks.every(c => c.modules.every(m => m === 'core')));
    const result = verify(outDir, '--expect=isolated');
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /PWA \(pwa\): исключён — сигнатур нет .*sw\.js — ликвидатор/);
    // Чужой вариант — ошибка
    assert.equal(verify(outDir, '--expect=standard').status, 1);
  });

  test('standard: 3D и карта остаются вместе с vendor/occt, остальное исключено', async () => {
    const { outDir, error } = await buildFixture(makeFixture(), { AWMS_VARIANT: 'standard' });
    assert.equal(error, null);
    const report = readReport(outDir);
    assert.deepEqual(report.removed.sort(), ['manifest.json', 'offline.html', 'vendor/sockjs']);
    assert.ok(existsSync(join(outDir, 'vendor/occt/occt-import-js.js')));
    assert.deepEqual(report.packages.map(p => p.name), ['three']);
    const result = verify(outDir, '--expect=standard');
    assert.equal(result.status, 0, result.output);
  });

  test('статический импорт модуля мимо флага — сборка падает и называет, откуда импорт', async () => {
    const { error } = await buildFixture(makeFixture({ staticVideo: true }), { AWMS_VARIANT: 'isolated' });
    assert.ok(error, 'сборка должна упасть');
    assert.match(error.message, /Вариант поставки «isolated»: в сборку попал код исключённых модулей/);
    assert.match(error.message, /видео \(video\)/);
    assert.match(error.message, /src\/main\.ts → src\/components\/DocumentsPage\/VideoArchive\/live\.ts/);
  });

  test('статический импорт пакета модуля (three) — сборка падает', async () => {
    const { error } = await buildFixture(makeFixture({ staticThree: true }), { AWMS_EXCLUDE: 'model3d' });
    assert.ok(error, 'сборка должна упасть');
    assert.match(error.message, /3D-модели \(model3d\)/);
    assert.match(error.message, /node_modules\/three/);
  });

  test('импорт одного типа из модуля сборке не мешает', async () => {
    const { outDir, error } = await buildFixture(makeFixture({ typeOnlyVideo: true }), { AWMS_EXCLUDE: 'video' });
    assert.equal(error, null);
    assert.equal(readReport(outDir).variant, 'custom-video');
  });

  test('сигнатура модуля в ядре: полная сборка собирается, но verify-dist сообщает о ложной тревоге', async () => {
    const { outDir, error } = await buildFixture(makeFixture({ coreText: 'X-Video-Codec' }), {});
    assert.equal(error, null);
    const result = verify(outDir);
    assert.equal(result.status, 1);
    assert.match(result.output, /сигнатура «X-Video-Codec» есть вне модуля/);
  });

  test('сборка в непустой каталог без очистки — ошибка: чужие файлы попали бы в суммы', async () => {
    const root = makeFixture();
    write(root, 'stale/assets/old-video-chunk.js', "console.log('MediaSource')");
    const { error } = await buildFixture(root, { AWMS_VARIANT: 'isolated' }, 'stale', false);
    assert.ok(error, 'сборка должна упасть');
    assert.match(error.message, /файлы не из этой сборки: assets\/old-video-chunk\.js/);
  });
});
