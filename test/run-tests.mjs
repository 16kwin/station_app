// run-tests.mjs — юнит-тесты фронтенда встроенным `node --test`, без отдельной библиотеки тестов.
// Node сам исполняет только .ts без JSX и с импортами с расширениями, а код приложения пишет импорты без
// расширений и с флагами сборки (__AWMS_HAS_*__). Поэтому каждый тест сначала собирается тем же сборщиком,
// что у Vite (rolldown): TypeScript и JSX снимаются, относительные импорты склеиваются в один файл,
// пакеты из node_modules остаются внешними, флаги сборки — true, как в vite.config.ts.
//
//   npm test                 — все test/**/*.test.ts
//   npm test -- featureStore — только файлы, в пути которых есть «featureStore»
//   npm run test:types       — проверка типов тестов (tsconfig.test.json)
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testDir = join(root, 'test');
// Внутри проекта: так собранные тесты находят пакеты в node_modules проекта
const outDir = join(root, 'node_modules', '.cache', 'awms-node-test');

const BUILD_FLAGS = ['VIDEO', 'MODEL3D', 'MAP', 'GRAPH', 'ORDERS', 'WEBSOCKET', 'PWA', 'INTEGRATIONS'];
const define = Object.fromEntries(BUILD_FLAGS.map((name) => [`__AWMS_HAS_${name}__`, 'true']));

const filters = process.argv.slice(2);
const tests = readdirSync(testDir, { recursive: true })
  .map((file) => join(testDir, String(file)))
  .filter((file) => /\.test\.tsx?$/.test(file))
  .filter((file) => filters.length === 0 || filters.some((f) => file.includes(f)))
  .sort();

if (tests.length === 0) {
  console.error('Тесты не найдены' + (filters.length ? `: ${filters.join(', ')}` : ''));
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Модули приложения, которые при загрузке обращаются к браузеру (window.config), подменяются заглушками
// из test/stubs/: тест подключает свой HTTP-клиент (connectFeatureHttp), настоящий AxiosService не нужен
const STUBS = { AxiosService: join(testDir, 'stubs', 'AxiosService.ts') };
// Пакеты, которые в Node открыли бы настоящее сетевое соединение: тест живых обновлений проверяет, когда
// клиент создаётся и закрывается, по заглушкам
const PACKAGE_STUBS = {
  '@stomp/stompjs': join(testDir, 'stubs', 'stompjs.ts'),
  'sockjs-client': join(testDir, 'stubs', 'sockjs-client.ts'),
};

// Внешние — пакеты (react, node:test): всё, что не относительный и не абсолютный путь и не заглушка
const isPackage = (id) => !id.startsWith('.') && !isAbsolute(id) && !id.startsWith('\0') && !Object.hasOwn(PACKAGE_STUBS, id);

const stubs = {
  name: 'awms-test-stubs',
  resolveId(source) {
    if (Object.hasOwn(PACKAGE_STUBS, source)) return PACKAGE_STUBS[source];
    if (!source.startsWith('.')) return null;
    const name = source.split(/[\\/]/).pop().replace(/\.tsx?$/, '');
    return Object.hasOwn(STUBS, name) ? STUBS[name] : null;
  },
};

const bundles = [];
for (const file of tests) {
  const out = join(outDir, relative(testDir, file).replace(/[\\/]/g, '__').replace(/\.tsx?$/, '.mjs'));
  const bundle = await rolldown({
    input: file,
    cwd: root,
    platform: 'node',
    external: isPackage,
    plugins: [stubs],
    transform: { define, jsx: 'react-jsx' },
    logLevel: 'warn',
  });
  // Один файл на тест: динамические import() (живые обновления) встраиваются, а не уходят в чанки
  await bundle.write({ file: out, format: 'esm', sourcemap: true, codeSplitting: false });
  await bundle.close();
  bundles.push(out);
}

const { status } = spawnSync(process.execPath, ['--test', '--enable-source-maps', ...bundles], { stdio: 'inherit', cwd: root });
process.exit(status ?? 1);
