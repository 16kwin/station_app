// awmsBuildVariant.test.ts — плагин варианта поставки (раздел 8.5 проекта): выбор варианта, флаги сборки,
// отнесение файлов к модулям, имя кэша статики, сверка со списками ядра фронтенда (buildFlags.ts, awms-build.d.ts).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BUILD_MODULES,
  BUILD_MODULE_KEYS,
  BUILD_PRESETS,
  buildDefines,
  describeViolations,
  makeBuildId,
  moduleOfPath,
  modulePath,
  packageOf,
  projectPath,
  renameStaticCache,
  resolveVariant,
} from '../../build/awmsBuildVariant';
import { BUILD_MODULES as APP_BUILD_MODULES } from '../../src/services/features/buildFlags';

const ROOT = process.cwd().replace(/\\/g, '/');
const ROOT_FIXTURE = 'C:/AWMS/Front/station_app';

describe('выбор варианта', () => {
  test('без переменных — полная сборка', () => {
    assert.deepEqual(resolveVariant({}), { name: 'full', excluded: [] });
    assert.deepEqual(resolveVariant({ AWMS_VARIANT: ' ', AWMS_EXCLUDE: '' }), { name: 'full', excluded: [] });
  });

  test('пресет: isolated без всех модулей, standard оставляет 3D и карту', () => {
    assert.deepEqual(resolveVariant({ AWMS_VARIANT: 'isolated' }).excluded, [...BUILD_MODULE_KEYS]);
    const standard = resolveVariant({ AWMS_VARIANT: 'standard' });
    assert.equal(standard.name, 'standard');
    assert.deepEqual(standard.excluded, ['video', 'graph', 'orders', 'websocket', 'pwa', 'integrations']);
    assert.deepEqual(resolveVariant({ AWMS_VARIANT: 'full' }).excluded, []);
  });

  test('свой состав: порядок и пробелы не важны; совпал с пресетом — имя пресета', () => {
    const custom = resolveVariant({ AWMS_EXCLUDE: ' pwa, video ,model3d,,' });
    assert.deepEqual(custom.excluded, ['video', 'model3d', 'pwa']);
    assert.equal(custom.name, 'custom-video-model3d-pwa');
    assert.equal(resolveVariant({ AWMS_EXCLUDE: 'integrations,pwa,websocket,orders,graph,video' }).name, 'standard');
  });

  test('неизвестный вариант или модуль — ошибка с перечнем допустимых', () => {
    assert.throws(() => resolveVariant({ AWMS_VARIANT: 'minimal' }), /AWMS_VARIANT=minimal.*isolated, standard, full/);
    assert.throws(() => resolveVariant({ AWMS_EXCLUDE: 'video,vidoe' }), /неизвестные модули vidoe/);
    // gpp появится вместе с флагом __AWMS_HAS_GPP__ (пакет F10); до того — ошибка, а не молчаливая полная сборка
    assert.throws(() => resolveVariant({ AWMS_EXCLUDE: 'gpp' }), /неизвестные модули gpp/);
  });

  test('пресет и свой состав вместе: одинаковые — можно, разные — ошибка', () => {
    assert.equal(resolveVariant({ AWMS_VARIANT: 'standard', AWMS_EXCLUDE: 'video,graph,orders,websocket,pwa,integrations' }).name, 'standard');
    assert.throws(() => resolveVariant({ AWMS_VARIANT: 'isolated', AWMS_EXCLUDE: 'video' }), /разный состав/);
  });

  test('флаги сборки: false только у исключённых модулей', () => {
    const defines = buildDefines(['video', 'pwa']);
    assert.equal(defines.__AWMS_HAS_VIDEO__, 'false');
    assert.equal(defines.__AWMS_HAS_PWA__, 'false');
    assert.equal(defines.__AWMS_HAS_MODEL3D__, 'true');
    assert.equal(Object.keys(defines).length, BUILD_MODULE_KEYS.length);
  });

  test('идентификатор сборки — время UTC, как в sw.js', () => {
    assert.equal(makeBuildId(new Date('2026-10-13T19:22:00.123Z')), '20261013-192200-123');
  });
});

describe('сверка со списками ядра фронтенда', () => {
  test('модули плагина — те же, что в src/services/features/buildFlags.ts', () => {
    assert.deepEqual([...BUILD_MODULE_KEYS], Object.keys(APP_BUILD_MODULES));
  });

  test('плагин задаёт каждый флаг из src/types/awms-build.d.ts — иначе код упал бы с ReferenceError', () => {
    const declared = [...readFileSync(resolve(ROOT, 'src/types/awms-build.d.ts'), 'utf8').matchAll(/declare const (__AWMS_HAS_\w+__)/g)].map(m => m[1]);
    assert.ok(declared.length > 0);
    assert.deepEqual(Object.keys(buildDefines([])).sort(), declared.sort());
  });

  test('каталоги, файлы и пакеты модулей существуют: переименование не отключит проверку молча', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
    for (const key of BUILD_MODULE_KEYS) {
      const spec = BUILD_MODULES[key];
      for (const dir of spec.dirs) assert.ok(existsSync(resolve(ROOT, dir)), `${key}: нет каталога ${dir}`);
      for (const file of spec.files) assert.ok(existsSync(resolve(ROOT, file)), `${key}: нет файла ${file}`);
      for (const name of spec.packages) assert.ok(name in pkg.dependencies, `${key}: пакета ${name} нет в dependencies`);
      for (const path of spec.publicPaths) assert.ok(!path.startsWith('/') && !path.endsWith('/'), `${key}: ${path} — путь от public/ без «/» по краям`);
    }
  });

  test('пресеты называют только известные модули', () => {
    for (const [name, modules] of Object.entries(BUILD_PRESETS)) {
      for (const key of modules) assert.ok((BUILD_MODULE_KEYS as readonly string[]).includes(key), `${name}: ${key}`);
    }
  });
});

describe('отнесение файлов к модулям', () => {
  test('id сборщика → путь: без \\0, параметров и с «/»', () => {
    assert.equal(modulePath('C:\\AWMS\\a\\b.ts?worker_file&type=module'), 'C:/AWMS/a/b.ts');
    assert.equal(modulePath('\0C:/AWMS/node_modules/x/index.js?commonjs-module'), 'C:/AWMS/node_modules/x/index.js');
    assert.equal(modulePath('/home/build/src/main.tsx'), '/home/build/src/main.tsx');
    assert.equal(modulePath('\0vite/preload-helper.js'), null);
  });

  test('пакет npm: последний node_modules в пути, пакеты с областью имён', () => {
    assert.deepEqual(packageOf('C:/p/node_modules/three/examples/jsm/loaders/GLTFLoader.js'), { name: 'three', dir: 'C:/p/node_modules/three' });
    assert.deepEqual(packageOf('C:/p/node_modules/@stomp/stompjs/bundles/stomp.umd.js')?.name, '@stomp/stompjs');
    assert.equal(packageOf('C:/p/node_modules/a/node_modules/url-parse/index.js')?.name, 'url-parse');
    assert.equal(packageOf('C:/p/src/main.tsx'), null);
  });

  test('путь от корня проекта; на Windows регистр буквы диска не важен', () => {
    assert.equal(projectPath(`${ROOT_FIXTURE}/src/main.tsx`, ROOT_FIXTURE), 'src/main.tsx');
    assert.equal(projectPath('C:/other/src/main.tsx', ROOT_FIXTURE), null);
    if (process.platform === 'win32') assert.equal(projectPath('c:/AWMS/Front/station_app/src/x.ts', ROOT_FIXTURE), 'src/x.ts');
  });

  test('каталоги, отдельные файлы и пакеты модулей; остальное — ядро', () => {
    const at = (rel: string) => moduleOfPath(`${ROOT_FIXTURE}/${rel}`, ROOT_FIXTURE);
    assert.equal(at('src/components/DocumentsPage/VideoArchive/useLiveStream.ts'), 'video');
    assert.equal(at('src/components/ReferencesPage/NomenclaturePage/Model3D/convert.worker.ts'), 'model3d');
    assert.equal(at('src/components/StationsPage/StationMap/StationMapView.tsx'), 'map');
    assert.equal(at('src/components/mainPage/purchaseGraph/simulation.ts'), 'graph');
    assert.equal(at('src/components/AnalyticsPage/api.ts'), 'orders');
    assert.equal(at('src/components/ReferencesPage/SuppliersPage/SupplierIntegrationTab.tsx'), 'integrations');
    assert.equal(at('node_modules/three/build/three.module.js'), 'model3d');
    assert.equal(at('node_modules/d3-force/src/simulation.js'), 'graph');
    assert.equal(at('node_modules/sockjs-client/lib/entry.js'), 'websocket');
    assert.equal(at('node_modules/@stomp/stompjs/bundles/stomp.umd.js'), 'websocket');
    // Ядро: страницы ядра, политика видео вне каталога модуля, зависимости пакетов модуля, Pwa/ (снятие SW нужно всем)
    assert.equal(at('src/components/StationsPage/StationsPage.tsx'), null);
    assert.equal(at('src/services/features/videoAccess.ts'), null);
    assert.equal(at('src/components/ReferencesPage/SuppliersPage/SupplierCreatePage.tsx'), null);
    assert.equal(at('src/components/Pwa/serviceWorker.ts'), null);
    assert.equal(at('node_modules/react/index.js'), null);
    // Похожее имя не путается с каталогом модуля
    assert.equal(at('src/components/DocumentsPage/VideoArchiveLegacy.tsx'), null);
  });
});

describe('кэш статики в sw.js по варианту', () => {
  test("'awms-static-v1' → 'awms-static-<вариант>-v1'", () => {
    const source = "const SHELL_CACHE = 'awms-shell-' + BUILD_ID;\nconst STATIC_CACHE = 'awms-static-v1';\n";
    const renamed = renameStaticCache(source, 'isolated');
    assert.equal(renamed.cacheName, 'awms-static-isolated-v1');
    assert.match(renamed.source, /const STATIC_CACHE = 'awms-static-isolated-v1';/);
    assert.match(renamed.source, /'awms-shell-' \+ BUILD_ID/);
    assert.equal(renameStaticCache('const STATIC_CACHE = "awms-static-v12";', 'full').cacheName, 'awms-static-full-v12');
  });

  test('имени нет или их два — ошибка: молча оставить общий кэш нельзя', () => {
    assert.throws(() => renameStaticCache("const STATIC_CACHE = 'static';", 'full'), /найдено 0 раз/);
    assert.throws(() => renameStaticCache("'awms-static-v1'; 'awms-static-v2'", 'full'), /найдено 2 раз/);
  });

  test('настоящий public/sw.js переименовывается', () => {
    const sw = readFileSync(resolve(ROOT, 'public/sw.js'), 'utf8');
    assert.equal(renameStaticCache(sw, 'standard').cacheName, 'awms-static-standard-v1');
  });
});

describe('текст ошибки сборки', () => {
  test('называет модуль, выходной файл и импорт извне модуля', () => {
    const text = describeViolations('isolated', [
      {
        module: 'video',
        file: 'src/components/DocumentsPage/VideoArchive/StationVideoPopup.tsx',
        output: 'assets/index-abc.js',
        importers: ['src/components/StationsPage/StationsPage.tsx'],
      },
      { module: 'video', file: 'src/components/DocumentsPage/VideoArchive/api.ts', output: 'assets/index-abc.js', importers: [] },
    ]);
    assert.match(text, /Вариант поставки «isolated»/);
    assert.match(text, /видео \(video\): файлов модуля в сборке — 2, в assets\/index-abc\.js/);
    assert.match(text, /StationsPage\.tsx → src\/components\/DocumentsPage\/VideoArchive\/StationVideoPopup\.tsx/);
    assert.match(text, /lazyModules\.ts/);
    assert.doesNotMatch(text, /3D-модели/);
  });
});
