// format.ts — подписи и вычисления отчёта «Профиль безопасности»: состояния и уровни функций, пресеты, даты,
// объёмы, честные оговорки (раздел 9.4 проекта) и команды самостоятельной проверки (9.2, строка 11), если сервер
// их не прислал, имя и состав выгрузки JSON. Чистые функции без React — их проверяют тесты.
import type { FeatureRow, FrontendBuild, SecurityReport, SelfCheckRow, StoredDataRow } from '../api';
import type { ProbeRun } from '../probes';

// ---------- Числа и даты ----------

const pad = (n: number) => String(n).padStart(2, '0');

/** «14.10.2026, 10:20» в часовом поясе браузера; не дата — как пришло */
export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export const formatCount = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : n.toLocaleString('ru-RU');

const UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

/** «12,3 ГБ» */
export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '—';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${UNITS[unit]}`;
};

/** Первые знаки хэша для экрана; полностью — в шапке и на бумаге */
export const shortHash = (hash: string | null | undefined, length = 12): string =>
  !hash ? '—' : hash.length > length ? hash.slice(0, length) + '…' : hash;

// ---------- Профиль ----------

export const PRESET_TITLES: Record<string, string> = {
  isolated: 'Изолированный минимум',
  standard: 'Стандарт',
  full: 'Расширенный',
};

export const presetText = (preset: string | null): string =>
  !preset ? '—' : PRESET_TITLES[preset] ? `«${PRESET_TITLES[preset]}» (${preset})` : preset;

/** Источник пресета: file / default / env (5.2) */
export const presetSourceText = (source: string | null): string => {
  switch (source) {
    case 'file':
      return 'файл потолка';
    case 'default':
      return 'файла потолка нет — действует изолированный минимум';
    case 'env':
      return 'переменная окружения AWMS_FEATURES_PRESET — для согласования непригоден';
    case null:
      return '—';
    default:
      return source;
  }
};

export const adminModeText = (mode: string | null): string => {
  switch (mode) {
    case 'off':
      return 'выключены: переключателей нет, только потолок';
    case 'disable-only':
      return 'только выключение; включает обратно только администратор ИБ';
    case 'full':
      return 'выключение и включение (разрешено потолком)';
    case null:
      return '—';
    default:
      return mode;
  }
};

/** Состояние секретов установки: generated / repository / absent */
export const secretsText = (state: string | null, text: string | null): { text: string; ok: boolean | null } => {
  switch (state) {
    case 'generated':
      return { text: text ?? 'сгенерированы при установке', ok: true };
    case 'repository':
      return { text: text ?? 'совпадают со значениями из репозитория', ok: false };
    case 'absent':
      return { text: text ?? 'файл секретов не найден', ok: false };
    default:
      return { text: text ?? state ?? 'нет данных', ok: null };
  }
};

/** Откуда роль пользователя (B10): db / token */
export const roleSourceText = (source: string | null): { text: string; ok: boolean | null } => {
  switch (source) {
    case 'db':
      return { text: 'БД на каждом запросе, ключ токенов — свой у установки', ok: true };
    case 'token':
      return { text: 'токен, ключ общий для всех установок — роли не гарантируются', ok: false };
    default:
      return { text: source ?? 'нет данных', ok: null };
  }
};

// ---------- Функции ----------

export type FeatureStateKind = 'on' | 'ceiling' | 'switch' | 'dependency' | 'tamper' | 'build' | 'absent';

export const featureStateKind = (f: Pick<FeatureRow, 'enabled' | 'reason'>): FeatureStateKind => {
  if (f.enabled) return 'on';
  const reason = f.reason.toUpperCase();
  if (reason === 'SWITCH') return 'switch';
  if (reason === 'TAMPER') return 'tamper';
  if (reason.startsWith('DEPENDENCY')) return 'dependency';
  if (reason === 'ABSENT_IN_BUILD') return 'build';
  if (reason === 'ABSENT') return 'absent';
  return 'ceiling';
};

/** Ключ выключенной зависимости из причины DEPENDENCY:video */
export const dependencyOf = (reason: string): string | null => {
  const at = reason.indexOf(':');
  return reason.toUpperCase().startsWith('DEPENDENCY') && at > 0 ? reason.slice(at + 1) : null;
};

/** Состояние словами (9.2, строка 2) */
export const featureStateText = (f: Pick<FeatureRow, 'enabled' | 'reason'>): string => {
  switch (featureStateKind(f)) {
    case 'on':
      return 'включена';
    case 'switch':
      return 'выключена администратором';
    case 'tamper':
      return 'выключена: расхождение с журналом';
    case 'dependency': {
      const dep = dependencyOf(f.reason);
      return dep ? `выключена: выключена ${dep}` : 'выключена: выключена зависимость';
    }
    case 'build':
      return 'отсутствует в сборке';
    case 'absent':
      return 'отсутствует в продукте';
    default:
      return 'выключена потолком';
  }
};

export const LEVEL_TITLES: Record<string, string> = {
  L1: 'скрыто в интерфейсе',
  L2: 'маршрут закрыт',
  L3: 'код не загружен',
  L4: 'нет в поставке',
};

/** «L3 — код не загружен»; для включённой функции уровень не печатается */
export const levelText = (f: Pick<FeatureRow, 'enabled' | 'level' | 'levelText'>): string => {
  if (f.enabled || !f.level) return '—';
  const title = f.levelText ?? LEVEL_TITLES[f.level.toUpperCase()];
  return title ? `${f.level} — ${title}` : f.level;
};

/** Роли функции словами; до B10 у функции с ролями — честная пометка */
export const rolesText = (f: Pick<FeatureRow, 'roles'>): string => (f.roles.length ? f.roles.join(', ') : 'все вошедшие');

export const rolesNotGuaranteed = (f: Pick<FeatureRow, 'roles' | 'rolesGuaranteed'>, roleSource: string | null): boolean =>
  f.roles.length > 0 && (f.rolesGuaranteed === false || (f.rolesGuaranteed === null && roleSource !== 'db'));

// ---------- Журналы ----------

export const JOURNAL_EVENT_TITLES: Record<string, string> = {
  STARTUP: 'Запуск службы',
  CEILING_CHANGED: 'Изменён потолок',
  SWITCH: 'Переключение',
  TAMPER: 'Расхождение с журналом',
  PURGE: 'Удаление данных',
  RETENTION: 'Срок хранения видео',
  CREDENTIALS_PURGED: 'Стёрты пароли камер',
  USER_CREATED: 'Создан пользователь',
  REPORT_VIEWED: 'Просмотр отчёта',
  REPORT_PRINTED: 'Печать отчёта',
  REPORT_EXPORTED: 'Выгрузка отчёта',
  PROBE_RUN: 'Проверка из браузера',
  DENIED_SUMMARY: 'Сводка отказов ворот',
  OUTBOUND_BLOCKED: 'Исходящий запрос заблокирован',
};

/** События, на которые безопасник смотрит первым */
export const ALERT_EVENTS: ReadonlySet<string> = new Set(['TAMPER', 'PURGE', 'CREDENTIALS_PURGED', 'OUTBOUND_BLOCKED']);

export const USAGE_TITLES: Record<string, string> = {
  VIDEO_VIEWED: 'Просмотр видео',
  VIDEO_LIVE_OPENED: 'Живой поток',
  VIDEO_DOWNLOADED: 'Скачивание видео',
  VIDEO_RECORDING_STARTED: 'Запись по событию',
  EXPORT: 'Выгрузки',
  MODEL3D_SOURCE: 'Исходники 3D',
  CAMERA_CHANGED: 'Смена адреса камеры',
  OUTBOUND_SENT: 'Исходящие запросы',
};

// ---------- Хранимые данные ----------

/**
 * Кнопка «Удалить данные» (6.7, 6.8): только администратору ИБ и только для функции, выключенной потолком.
 * Решает сервер; здесь — чтобы не показывать заведомо недоступную кнопку
 */
export const canPurgeRow = (
  row: Pick<StoredDataRow, 'feature' | 'purgeAllowed'>,
  features: readonly FeatureRow[] | null,
  viewerCanPurge: boolean,
): boolean => {
  if (!viewerCanPurge || row.purgeAllowed === false) return false;
  if (row.purgeAllowed === true) return true;
  const f = features?.find(x => x.key === row.feature);
  if (!f) return false;
  const kind = featureStateKind(f);
  return kind === 'ceiling' || kind === 'dependency' || kind === 'build';
};

// ---------- Оговорки и самостоятельная проверка ----------

const featureOff = (report: Pick<SecurityReport, 'features'>, key: string): boolean =>
  report.features?.some(f => f.key === key && !f.enabled) ?? false;

const paramValue = (report: Pick<SecurityReport, 'params'>, key: string): string | null =>
  report.params?.find(p => p.key === key)?.value || null;

const rawSection = (report: Pick<SecurityReport, 'raw'>, name: string): Record<string, unknown> | null => {
  const raw = report.raw;
  if (typeof raw !== 'object' || raw === null) return null;
  const value = (raw as Record<string, unknown>)[name];
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
};

/** Порт приложения: из раздела «Входящие», иначе параметр server.port */
export const applicationPort = (report: Pick<SecurityReport, 'raw' | 'params'>): string | null => {
  const port = rawSection(report, 'inbound')?.port;
  if (typeof port === 'number' || (typeof port === 'string' && port !== '')) return String(port);
  return paramValue(report, 'server.port');
};

/**
 * Честные оговорки (9.4), если сервер их не прислал. Общие — всегда, остальные — по состоянию установки:
 * отчёт не должен обещать больше, чем гарантирует
 */
export const fallbackCaveats = (report: SecurityReport): string[] => {
  const { header } = report;
  const list: string[] = [
    'Переключатель администратора — уровень L2 внутри потолка: бины модуля остаются, закрыт маршрут. Если функцию ' +
      'нельзя включать ни при каких условиях, её выключают потолком установки.',
    'Подфункции видео и вкладки интеграций закрываются маршрутом (L2): бины модуля есть, если модуль разрешён.',
    'Скачивание видео и выгрузка при разрешённом просмотре — уровень L1: кто видит видео или таблицу, может их ' +
      'сохранить. Для запрета выключается просмотр; каждая отдача видео и каждая выгрузка пишутся в журнал доступа.',
    'Суперпользователь БД обходит триггеры журналов. Правку записей выявляет HMAC-цепочка (ключ вне БД), удаление ' +
      'хвоста — сверка головы журнала с бумагой и файловым логом. Кто управляет и сервером приложения, и ключом HMAC, ' +
      'тот может всё.',
    'Конфигурация веб-сервера (порты 80/443, раздача /sw.js) — вне приложения: раздел заполняется при внедрении по шаблону.',
  ];
  if (header.roleSource !== 'db') {
    list.push('Роль пользователя берётся из токена, а ключ токенов общий для всех установок: роли функций не гарантируются.');
  }
  if (header.secretsState === 'repository') {
    list.push('Секреты установки совпадают со значениями из репозитория: их нужно сгенерировать заново.');
  }
  if (header.dbUser?.superuser) {
    list.push('Приложение работает под суперпользователем БД: права «только добавление» на журналы не действуют.');
  }
  if (report.journal?.keyed === false) {
    list.push('Цепочка журнала профиля считается без ключа HMAC: подделку записей администратором БД она не выявит.');
  }
  const cameras = rawSection(report, 'outbound')?.cameras;
  if (typeof cameras === 'object' && cameras !== null && (cameras as Record<string, unknown>).passwordInArgs === true) {
    list.push('Пароль камеры передаётся процессу ffmpeg в аргументах командной строки: его видит администратор сервера.');
  }
  return list;
};

/** Команды «Как проверить самостоятельно» (9.2, строка 11), если сервер их не прислал */
export const fallbackSelfCheck = (report: SecurityReport, probes: readonly string[]): SelfCheckRow[] => {
  const port = applicationPort(report) ?? '<порт>';
  const base = `http://<сервер>:${port}`;
  const rows: SelfCheckRow[] = [];
  if (probes.length) {
    rows.push({ title: 'Закрытая функция — анонимно и под администратором', command: `curl -i ${base}${probes[0]}`, expected: '404' });
    const head = probes.find(p => /download/.test(p)) ?? probes[0];
    rows.push({ title: 'Метод HEAD закрыт так же, как GET', command: `curl -I ${base}${head}`, expected: '404' });
  }
  rows.push({ title: 'Открытые порты сервера', command: 'nmap -p- <сервер>', expected: 'один порт приложения' });
  if (featureOff(report, 'video')) {
    rows.push({ title: 'Процессов ffmpeg нет (Windows / Linux)', command: 'tasklist | findstr /i ffmpeg   /   pgrep -a ffmpeg', expected: 'пусто' });
    const ffmpeg = paramValue(report, 'video.ffmpeg-path');
    rows.push({ title: 'Файла ffmpeg на сервере нет', command: ffmpeg ? `dir "${ffmpeg}"` : 'dir <video.ffmpeg-path>', expected: 'файл не найден' });
    rows.push({ title: 'Соединений с камерами (RTSP) нет', command: 'netstat -ano | findstr :554', expected: 'пусто' });
  }
  rows.push({
    title: 'Запрет всех исходящих соединений с сервера, кроме БД',
    command: 'правило межсетевого экрана на сервере',
    expected: 'система работает',
  });
  const file = report.header.ceilingFile?.path;
  rows.push({
    title: 'SHA-256 файла потолка совпадает с шапкой отчёта',
    command: `Get-FileHash -Algorithm SHA256 "${file ?? '<файл потолка>'}"`,
    expected: shortHash(report.header.ceilingFile?.sha256, 16),
  });
  rows.push({
    title: 'Отпечаток профиля на сервере совпадает с напечатанным',
    command: `java -jar dinamika_back.jar print-features --config="${file ?? '<файл потолка>'}"`,
    expected: shortHash(report.header.fingerprint, 16),
  });
  rows.push({
    title: 'Файлы интерфейса совпадают с контрольными суммами',
    command: 'Get-FileHash -Algorithm SHA256 <каталог dist>\\* против SHA256SUMS',
    expected: 'суммы совпадают',
  });
  return rows;
};

// ---------- Выгрузка JSON ----------

const stamp = (date: Date): string =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;

/** awms-security-profile-<хост>-<отпечаток 12>-<дата>.json; в имени только безопасные знаки */
export const exportFileName = (report: Pick<SecurityReport, 'header'>, now: Date = new Date()): string => {
  const host = (report.header.host ?? '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const parts = ['awms-security-profile', host, report.header.fingerprint.slice(0, 12), stamp(now)].filter(Boolean);
  return parts.join('-') + '.json';
};

export const EXPORT_FORMAT = 'awms-security-profile-export/1';

/** Состав выгрузки: отчёт сервера как есть, файл сборки интерфейса и результат проверки из браузера */
export const buildExport = (
  report: SecurityReport,
  build: FrontendBuild | null,
  probes: ProbeRun | null,
  now: Date = new Date(),
): Record<string, unknown> => ({
  format: EXPORT_FORMAT,
  exportedAt: now.toISOString(),
  fingerprint: report.header.fingerprint,
  report: report.raw,
  frontendBuild: build?.raw ?? null,
  browserProbes: probes,
});
