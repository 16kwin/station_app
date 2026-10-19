// verifyDist.test.ts — скрипт проверки дистрибутива build/verify-dist.mjs на собранных вручную каталогах:
// суммы, лишние и пропавшие файлы, файлы и сигнатуры исключённых модулей, ликвидатор sw.js, --expect.
// Сборка настоящим плагином — в variantBuild.test.ts.
import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { BUILD_MODULE_KEYS, BUILD_PRESETS, type BuildModuleKey } from '../../build/awmsBuildVariant';

const VERIFY = resolve(process.cwd(), 'build/verify-dist.mjs');
const KILLER = readFileSync(resolve(process.cwd(), 'build/sw-kill.js'), 'utf8');
const temp = mkdtempSync(join(tmpdir(), 'awms-verify-'));
after(() => rmSync(temp, { recursive: true, force: true }));

const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');

interface DistOptions {
  excluded: readonly BuildModuleKey[];
  /** Путь → содержимое */
  files: Record<string, string>;
  /** Путь → модули по карте сборки */
  modules?: Record<string, string[]>;
  variant?: string;
}

let dists = 0;
/** Каталог, как его пишет плагин: файлы, awms-build.json и SHA256SUMS */
const makeDist = ({ excluded, files, modules = {}, variant = 'test' }: DistOptions): string => {
  const dir = join(temp, `d${++dists}`);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  const entries = Object.entries(files)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([path, content]) => ({ path, size: Buffer.byteLength(content), sha256: sha256(content), ...(modules[path] ? { modules: modules[path] } : {}) }));
  const report = JSON.stringify({
    format: 'awms-build/1',
    buildId: 'test',
    variant,
    modules: Object.fromEntries(BUILD_MODULE_KEYS.map(key => [key, !excluded.includes(key)])),
    excluded,
    files: entries,
  });
  writeFileSync(join(dir, 'awms-build.json'), report);
  const sums = [...entries.map(e => [e.path, e.sha256]), ['awms-build.json', sha256(report)]]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([path, hash]) => `${hash}  ${path}\n`)
    .join('');
  writeFileSync(join(dir, 'SHA256SUMS'), sums);
  return dir;
};

const ISOLATED_FILES = {
  'index.html': '<!doctype html><script type="module" src="/assets/index.js"></script>',
  'assets/index.js': "console.log(['/api/video/**','/api/orders/**'].join())",
  'config.js': 'window.config = {}',
  'sw.js': KILLER,
};
const isolated = (patch: Record<string, string> = {}) => makeDist({ excluded: BUILD_PRESETS.isolated, files: { ...ISOLATED_FILES, ...patch }, variant: 'isolated' });

const verify = (dir: string, ...args: string[]) => {
  const run = spawnSync(process.execPath, [VERIFY, dir, ...args], { encoding: 'utf8' });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
};

describe('verify-dist: суммы', () => {
  test('целый каталог isolated проходит', () => {
    const result = verify(isolated(), '--expect=isolated');
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /суммы: 5 из 5 файлов совпадают/);
    assert.match(result.output, /Итог: проверка пройдена/);
  });

  test('изменённый файл, лишний файл и пропавший файл — ошибки', () => {
    const dir = isolated();
    writeFileSync(join(dir, 'assets/index.js'), 'console.log(1)');
    writeFileSync(join(dir, 'assets/extra.js'), 'console.log(2)');
    rmSync(join(dir, 'index.html'));
    const result = verify(dir);
    assert.equal(result.status, 1);
    assert.match(result.output, /assets\/index\.js: сумма SHA-256 не совпадает/);
    assert.match(result.output, /файла assets\/extra\.js нет в SHA256SUMS/);
    assert.match(result.output, /файла index\.html из SHA256SUMS нет в каталоге/);
  });

  test('изменённый config.js (адрес API установки) — только предупреждение', () => {
    const dir = isolated();
    writeFileSync(join(dir, 'config.js'), 'window.config = { ip_api: "https://awms.local" }');
    const result = verify(dir);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /\[внимание\] config\.js отличается от суммы сборки/);
  });

  test('без awms-build.json — не сборка плагина варианта', () => {
    const dir = isolated();
    rmSync(join(dir, 'awms-build.json'));
    const result = verify(dir);
    assert.equal(result.status, 1);
    assert.match(result.output, /собран не плагином варианта/);
  });
});

describe('verify-dist: исключённые модули', () => {
  test('сигнатура модуля в любом файле — ошибка с именем файла', () => {
    const result = verify(isolated({ 'assets/chunk-a.js': "fetch(u).then(r => r.headers.get('X-Video-Codec'))" }));
    assert.equal(result.status, 1);
    assert.match(result.output, /видео \(video\): исключён, но сигнатура «X-Video-Codec» .* есть в assets\/chunk-a\.js/);
  });

  test('шаблоны ворот ядра (/api/video/**, /api/orders/**) сигнатурами не считаются', () => {
    const result = verify(isolated({ 'assets/routes.js': "['/api/video/**','/api/station-plans/**','/api/tkp/**']" }));
    assert.equal(result.status, 0, result.output);
  });

  test('vendor/occt, vendor/sockjs и manifest.json без модуля — ошибки', () => {
    const result = verify(isolated({ 'vendor/occt/occt.js': 'x', 'vendor/sockjs/sockjs.min.js': 'y', 'manifest.json': '{}' }));
    assert.equal(result.status, 1);
    assert.match(result.output, /3D-модели \(model3d\): исключён, но в дистрибутиве есть vendor\/occt/);
    assert.match(result.output, /живые обновления \(websocket\): исключён, но в дистрибутиве есть vendor\/sockjs/);
    assert.match(result.output, /PWA \(pwa\): исключён, но в дистрибутиве есть manifest\.json/);
  });

  test('без PWA: sw.js — только ликвидатор, index.html без ссылки на манифест', () => {
    const notKiller = verify(isolated({ 'sw.js': "self.addEventListener('fetch', e => e.respondWith(caches.match(e.request)))" }));
    assert.equal(notKiller.status, 1);
    assert.match(notKiller.output, /sw\.js — не ликвидатор/);
    const linked = verify(isolated({ 'index.html': '<link rel="manifest" href="/manifest.json">' }));
    assert.equal(linked.status, 1);
    assert.match(linked.output, /index\.html ссылается на манифест/);
    const register = verify(isolated({ 'assets/pwa.js': 'navigator.serviceWorker.register("/sw.js",{scope:"/"})' }));
    assert.equal(register.status, 1);
    assert.match(register.output, /сигнатура «serviceWorker\.register»/);
  });

  test('модуль, отнесённый картой сборки к исключённому, — ошибка', () => {
    const dir = makeDist({ excluded: ['graph'], files: { 'assets/g.js': 'x' }, modules: { 'assets/g.js': ['graph'] } });
    const result = verify(dir, '--expect=graph');
    assert.equal(result.status, 1);
    assert.match(result.output, /граф закупок \(graph\): исключён, но по карте сборки к нему относятся assets\/g\.js/);
  });
});

describe('verify-dist: модули в сборке (проверка сигнатур)', () => {
  test('сигнатура не найдена — список устарел', () => {
    // В сборке только видео, и в его файле нет MediaSource
    const others = BUILD_MODULE_KEYS.filter(key => key !== 'video');
    const dir = makeDist({
      excluded: others,
      files: { ...ISOLATED_FILES, 'assets/video.js': "['X-Video-Codec','/api/video/status']" },
      modules: { 'assets/video.js': ['video'] },
    });
    const result = verify(dir);
    assert.equal(result.status, 1);
    assert.match(result.output, /сигнатура «MediaSource» не найдена — список сигнатур устарел/);
  });

  test('сигнатуры в файлах модуля — проверка пройдена', () => {
    const others = BUILD_MODULE_KEYS.filter(key => key !== 'integrations');
    const dir = makeDist({
      excluded: others,
      files: { ...ISOLATED_FILES, 'assets/IntegrationTab.js': "['SAP','Oracle EBS']" },
      modules: { 'assets/IntegrationTab.js': ['core', 'integrations'] },
    });
    const result = verify(dir);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /вкладки «Интеграции» \(integrations\): в сборке — сигнатуры найдены только в файлах модуля/);
  });
});

describe('verify-dist: --expect и пресеты', () => {
  test('пресеты скрипта совпадают с пресетами плагина', () => {
    for (const [name, excluded] of Object.entries(BUILD_PRESETS)) {
      const dir = makeDist({ excluded, files: { 'index.html': '<!doctype html>' }, variant: name });
      const result = verify(dir, `--expect=${name}`);
      assert.doesNotMatch(result.output, /ожидался вариант/, `${name}: ${result.output}`);
    }
  });

  test('--expect списком модулей; неизвестный модуль — ошибка аргументов', () => {
    assert.equal(verify(isolated(), `--expect=${BUILD_MODULE_KEYS.join(',')}`).status, 0);
    const wrong = verify(isolated(), '--expect=video,pwa');
    assert.equal(wrong.status, 1);
    assert.match(wrong.output, /ожидался вариант без модулей \[video, pwa\]/);
    assert.equal(verify(isolated(), '--expect=video,vidoe').status, 2);
    assert.equal(verify(isolated(), '--unknown').status, 2);
  });
});
