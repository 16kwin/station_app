// verify-dist.mjs — проверка готового дистрибутива фронтенда «Динамики» (раздел 8.5 проекта «Дискретное
// отключение функций»). Нужен только Node.js (18+), без пакетов: скрипт можно отдать безопаснику вместе с dist.
//
//   node build/verify-dist.mjs [каталог=dist] [--expect=isolated|standard|full|video,model3d,…]
//
// Что проверяется:
//  1. Суммы: каждый файл каталога есть в SHA256SUMS и совпадает с ним; лишних и пропавших файлов нет.
//     config.js (адрес API) на установке могут править — его расхождение только предупреждение.
//  2. Состав из awms-build.json (его пишет плагин build/awmsBuildVariant.ts): с --expect — что это нужный вариант.
//  3. Исключённые модули: ни один чанк по карте сборки к модулю не относится, файлов модуля (vendor/occt,
//     vendor/sockjs, manifest.json, offline.html) нет, и ни в одном файле нет уникальных сигнатур модуля.
//     Общие строки (/ws-stations, sockjs, /api/orders в шаблонах ворот) не годятся: они есть и в ядре. Без PWA
//     sw.js должен быть ликвидатором, а index.html — без ссылки на манифест.
//  4. Модули, которые в сборке есть, — проверка самих сигнатур: каждая найдена и только в файлах своего модуля
//     (по карте awms-build.json). На сборке full так проверяется весь список: сигнатура, которая встречается
//     в ядре, дала бы ложную тревогу в сборке без модуля, а ненайденная — устарела.
// Код выхода: 0 — проверка пройдена, 1 — есть ошибки, 2 — неверные аргументы.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_KEYS = ['video', 'model3d', 'map', 'graph', 'orders', 'websocket', 'pwa', 'integrations'];

/** Пресеты — те же, что BUILD_PRESETS в build/awmsBuildVariant.ts (проверяет тест test/build/verifyDist.test.ts) */
const PRESETS = {
  isolated: [...MODULE_KEYS],
  standard: ['video', 'graph', 'orders', 'websocket', 'pwa', 'integrations'],
  full: [],
};

const TITLES = {
  video: 'видео',
  model3d: '3D-модели',
  map: 'карта станций',
  graph: 'граф закупок',
  orders: 'заказы и ТКП',
  websocket: 'живые обновления',
  pwa: 'PWA',
  integrations: 'вкладки «Интеграции»',
};

/**
 * Уникальные сигнатуры модулей: строки, которые остаются в собранном коде (имена свойств, строковые литералы,
 * заголовки протоколов) и есть только в коде модуля. Имена функций не годятся — их сжимает минификатор.
 * Шаблоны ворот вида /api/video/** из src/services/features/routes.ts стоят под флагом сборки и в сборке без
 * модуля пропадают, но в полной сборке лежат в ядре — поэтому они из сигнатур исключены
 */
export const SIGNATURES = {
  video: [
    { text: 'MediaSource', why: 'живой поток через Media Source Extensions (VideoArchive/useLiveStream.ts)' },
    { text: 'X-Video-Codec', why: 'заголовок ответа живого потока (VideoArchive/useLiveStream.ts)' },
    { re: /\/api\/video(?!\/\*\*)/, label: '/api/video', why: 'адреса API видео (VideoArchive/api.ts)' },
  ],
  model3d: [
    { text: 'WebGLRenderer', why: 'отрисовка three.js' },
    { text: 'occt-import-js', why: 'чтение STEP/IGES: vendor/occt и воркер конвертации' },
  ],
  map: [
    { re: /\/api\/station-plans(?!\/\*\*)/, label: '/api/station-plans', why: 'API плана цеха (StationMap/api.ts)' },
  ],
  graph: [
    { text: 'velocityDecay', why: 'раскладка графа d3-force (purchaseGraph/simulation.ts)' },
    { text: 'alphaTarget', why: 'раскладка графа d3-force (purchaseGraph/simulation.ts)' },
  ],
  orders: [
    { re: /\/api\/(?:orders|tkp)(?!\/\*\*)/, label: '/api/orders, /api/tkp', why: 'адреса API заказов и ТКП (AnalyticsPage/)' },
  ],
  websocket: [
    { text: 'accept-version', why: 'кадр CONNECT протокола STOMP (@stomp/stompjs)' },
    { text: 'xhr_streaming', why: 'транспорт SockJS (sockjs-client)' },
  ],
  pwa: [
    // Каталога у PWA нет: регистрация лежит в ядре (src/components/Pwa/serviceWorker.ts — оттуда же снятие SW,
    // нужное любой сборке) и вырезается флагом __AWMS_HAS_PWA__. Поэтому в сборке с PWA проверяется только,
    // что сигнатура найдена, а не где
    { re: /serviceWorker\s*\.\s*register\s*\(/, label: 'serviceWorker.register', why: 'регистрация service worker', inCore: true },
  ],
  integrations: [
    { text: 'Oracle EBS', why: 'список систем вкладок «Интеграции» (IntegrationTab.tsx и др.)' },
  ],
};

/** Файлы и каталоги модуля, которых без него в дистрибутиве быть не должно */
const MODULE_PATHS = {
  model3d: ['vendor/occt'],
  websocket: ['vendor/sockjs'],
  pwa: ['manifest.json', 'offline.html'],
};

/** Метка ликвидатора service worker (build/sw-kill.js) */
const SW_KILL_MARK = 'AWMS_SW_KILL';
const REPORT = 'awms-build.json';
const SUMS = 'SHA256SUMS';
const REPORT_FORMAT = 'awms-build/1';
/** Файлы, которые правят при установке: их расхождение с суммами — предупреждение, а не ошибка */
const INSTALL_FILES = ['config.js'];

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

const listFiles = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  );

const signatureLabel = (s) => s.label ?? s.text;
const matches = (s, content) => (s.re ? s.re.test(content) : content.includes(s.text));

const parseArgs = (argv) => {
  let dir = null;
  let expect = null;
  for (const arg of argv) {
    if (arg.startsWith('--expect=')) expect = arg.slice('--expect='.length);
    else if (arg === '--help' || arg === '-h') return { help: true };
    else if (arg.startsWith('--')) return { error: `неизвестный ключ ${arg}` };
    else if (dir === null) dir = arg;
    else return { error: `лишний аргумент ${arg}` };
  }
  return { dir: dir ?? 'dist', expect };
};

/** Ожидаемый состав из --expect: имя пресета или список модулей через запятую */
const expectedExcluded = (expect) => {
  if (Object.hasOwn(PRESETS, expect)) return PRESETS[expect];
  const items = expect.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = items.filter((item) => !MODULE_KEYS.includes(item));
  if (unknown.length) throw new Error(`--expect: неизвестные модули ${unknown.join(', ')}`);
  return MODULE_KEYS.filter((key) => items.includes(key));
};

/**
 * Проверка каталога. Возвращает { errors, warnings, notes } — строки для вывода; ошибок нет — проверка пройдена
 */
export function verifyDist(dirArg, { expect = null } = {}) {
  const dir = resolve(dirArg);
  const errors = [];
  const warnings = [];
  const notes = [];
  const result = { dir, errors, warnings, notes };

  if (!existsSync(dir)) {
    errors.push(`каталога ${dir} нет`);
    return result;
  }
  if (!existsSync(join(dir, REPORT)) || !existsSync(join(dir, SUMS))) {
    errors.push(`нет ${REPORT} или ${SUMS}: каталог собран не плагином варианта (build/awmsBuildVariant.ts)`);
    return result;
  }
  let report;
  try {
    report = JSON.parse(readFileSync(join(dir, REPORT), 'utf8'));
  } catch (error) {
    errors.push(`${REPORT} не читается как JSON: ${error.message}`);
    return result;
  }
  if (report.format !== REPORT_FORMAT) {
    errors.push(`${REPORT}: формат «${report.format}», ожидался «${REPORT_FORMAT}»`);
    return result;
  }

  // ---------- 1. Суммы ----------
  const files = listFiles(dir).sort();
  const sums = new Map();
  readFileSync(join(dir, SUMS), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line, index) => {
      const found = /^([0-9a-f]{64}) [ *](.+)$/.exec(line);
      if (found) sums.set(found[2], found[1]);
      else errors.push(`${SUMS}, строка ${index + 1}: не разобрана`);
    });
  const contents = new Map();
  let matched = 0;
  for (const path of files) {
    if (path === SUMS) continue;
    const data = readFileSync(join(dir, path));
    contents.set(path, data);
    const expected = sums.get(path);
    if (!expected) errors.push(`файла ${path} нет в ${SUMS}: он не из этой сборки`);
    else if (expected !== sha256(data)) {
      if (INSTALL_FILES.includes(path)) warnings.push(`${path} отличается от суммы сборки — файл настройки установки, его могли править; просмотрите его`);
      else errors.push(`${path}: сумма SHA-256 не совпадает с ${SUMS}`);
    } else matched++;
  }
  for (const path of sums.keys()) if (!contents.has(path)) errors.push(`файла ${path} из ${SUMS} нет в каталоге`);
  for (const entry of report.files ?? []) {
    if (sums.has(entry.path) && sums.get(entry.path) !== entry.sha256) errors.push(`${REPORT} и ${SUMS} расходятся в сумме ${entry.path}`);
  }
  notes.push(`суммы: ${matched} из ${sums.size} файлов совпадают с ${SUMS}`);

  // ---------- 2. Состав ----------
  const excluded = Array.isArray(report.excluded) ? report.excluded : [];
  const unknown = excluded.filter((key) => !MODULE_KEYS.includes(key));
  if (unknown.length) errors.push(`${REPORT}: неизвестные модули ${unknown.join(', ')} — скрипт проверки старше сборки`);
  for (const key of MODULE_KEYS) {
    if (report.modules && report.modules[key] === excluded.includes(key)) errors.push(`${REPORT}: модуль ${key} одновременно в сборке и исключён`);
  }
  notes.push(
    `сборка ${report.buildId}, вариант ${report.variant}: ` + (excluded.length ? `без модулей ${excluded.join(', ')}` : 'все модули'),
  );
  if (expect !== null) {
    const want = expectedExcluded(expect);
    const same = want.length === excluded.length && want.every((key) => excluded.includes(key));
    if (same) notes.push(`состав совпадает с ожидаемым (--expect=${expect})`);
    else errors.push(`ожидался вариант без модулей [${want.join(', ')}] (--expect=${expect}), а в сборке исключены [${excluded.join(', ')}]`);
  }

  // Карта «файл → модули» из отчёта сборки; файлы без отметки относятся к ядру
  const fileModules = new Map((report.files ?? []).map((entry) => [entry.path, entry.modules ?? []]));
  // Сигнатуры ищутся во всех файлах, кроме самих отчётов: в них только имена файлов
  const texts = [...contents.entries()].filter(([path]) => path !== REPORT).map(([path, data]) => [path, data.toString('latin1')]);
  const hitsOf = (signature) => texts.filter(([, text]) => matches(signature, text)).map(([path]) => path);

  // ---------- 3, 4. Модули ----------
  for (const key of MODULE_KEYS) {
    const name = `${TITLES[key]} (${key})`;
    const signatures = SIGNATURES[key];
    if (excluded.includes(key)) {
      const before = errors.length;
      const inMap = [...fileModules.entries()].filter(([, modules]) => modules.includes(key)).map(([path]) => path);
      if (inMap.length) errors.push(`${name}: исключён, но по карте сборки к нему относятся ${inMap.slice(0, 5).join(', ')}`);
      for (const path of MODULE_PATHS[key] ?? []) {
        if (existsSync(join(dir, path))) errors.push(`${name}: исключён, но в дистрибутиве есть ${path}`);
      }
      for (const signature of signatures) {
        const hits = hitsOf(signature);
        if (hits.length) errors.push(`${name}: исключён, но сигнатура «${signatureLabel(signature)}» (${signature.why}) есть в ${hits.slice(0, 5).join(', ')}`);
      }
      if (key === 'pwa') {
        const sw = contents.get('sw.js')?.toString('utf8');
        if (sw === undefined) errors.push(`${name}: исключён, но sw.js нет — при 404 браузер оставит прежнюю регистрацию; нужен ликвидатор`);
        else if (!sw.includes(SW_KILL_MARK) || /addEventListener\(\s*['"]fetch['"]/.test(sw)) errors.push(`${name}: исключён, но sw.js — не ликвидатор (build/sw-kill.js)`);
        const linked = texts.filter(([path, text]) => path.endsWith('.html') && /rel\s*=\s*["']?manifest\b/i.test(text)).map(([path]) => path);
        if (linked.length) errors.push(`${name}: исключён, но ${linked.join(', ')} ссылается на манифест`);
      }
      if (errors.length === before) {
        const paths = MODULE_PATHS[key] ? `, нет ${MODULE_PATHS[key].join(', ')}` : '';
        notes.push(`${name}: исключён — сигнатур нет (${signatures.map(signatureLabel).join(', ')})${paths}${key === 'pwa' ? ', sw.js — ликвидатор' : ''}`);
      }
    } else {
      const before = errors.length;
      for (const signature of signatures) {
        const hits = hitsOf(signature);
        if (!hits.length) {
          errors.push(`${name}: в сборке, но сигнатура «${signatureLabel(signature)}» не найдена — список сигнатур устарел, обновите его`);
          continue;
        }
        const outside = signature.inCore ? [] : hits.filter((path) => !(fileModules.get(path) ?? []).includes(key));
        if (outside.length) {
          errors.push(
            `${name}: сигнатура «${signatureLabel(signature)}» есть вне модуля — в ${outside.slice(0, 5).join(', ')} ` +
              `(по карте сборки: ${outside.slice(0, 5).map((p) => (fileModules.get(p) ?? []).join('+') || 'ядро').join('; ')}). ` +
              'В сборке без модуля это дало бы ложную тревогу: уберите строку из ядра или замените сигнатуру',
          );
        }
      }
      if (key === 'pwa' && contents.has('sw.js')) {
        const sw = contents.get('sw.js').toString('utf8');
        if (!sw.includes(`awms-static-${report.variant}-`)) errors.push(`${name}: кэш статики в sw.js не назван по варианту (awms-static-${report.variant}-v…)`);
      }
      if (errors.length === before) {
        const where = signatures.some((s) => s.inCore) ? 'найдены (регистрация SW — в ядре, под флагом сборки)' : 'найдены только в файлах модуля';
        notes.push(`${name}: в сборке — сигнатуры ${where}`);
      }
    }
  }
  return result;
}

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.error) {
    if (args.error) console.error(`verify-dist: ${args.error}`);
    console.error('Запуск: node build/verify-dist.mjs [каталог=dist] [--expect=isolated|standard|full|video,model3d,…]');
    process.exit(args.error ? 2 : 0);
  }
  let result;
  try {
    result = verifyDist(args.dir, { expect: args.expect });
  } catch (error) {
    console.error(`verify-dist: ${error.message}`);
    process.exit(2);
  }
  console.log(`Проверка дистрибутива ${result.dir}`);
  for (const line of result.notes) console.log(`  [ок] ${line}`);
  for (const line of result.warnings) console.log(`  [внимание] ${line}`);
  for (const line of result.errors) console.log(`  [ОШИБКА] ${line}`);
  console.log(result.errors.length ? `Итог: проверка НЕ пройдена, ошибок — ${result.errors.length}` : 'Итог: проверка пройдена');
  process.exit(result.errors.length ? 1 : 0);
};

// Запуск из командной строки (при импорте из теста — только функции)
const samePath = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
if (process.argv[1] && samePath(resolve(process.argv[1]), fileURLToPath(import.meta.url))) main();
