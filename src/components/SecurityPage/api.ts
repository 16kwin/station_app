// api.ts — отчёт «Профиль безопасности» (разделы 6.7 и 9.2 проекта «Дискретное отключение функций»): запрос
// отчёта, разбор ответа, события журнала профиля и удаление данных выключенной функции.
//
// Отчёт строит сервер из реестра функций и живого состояния (пакет B6); интерфейс показывает, печатает и выгружает
// его. Разбор терпимый, но честный:
//  • раздел, которого сервер не прислал, показывается как «сервер не прислал раздел», а не пропадает молча;
//  • неизвестные поля известных разделов выводятся как есть, неизвестные разделы — в «Прочих сведениях»:
//    в печатном отчёте не должно быть меньше сведений, чем прислал сервер;
//  • ответ без отпечатка профиля не принимается: отчёт без отпечатка нельзя сверить ни со службой, ни с CLI.
//
// Контракт GET /api/security-profile (доступ — SECURITY_VIEWERS: ADMIN, DIRECTOR, SECURITY). Все поля, кроме
// header.fingerprint, необязательны; поля шапки допускаются и на верхнем уровне ответа.
//
// {
//   "generatedAt": "2026-10-14T10:20:30Z",
//   "viewer": { "login": "ib_ivanov", "role": "SECURITY", "canPurge": true },
//   "header": {
//     "backend": { "version": "1.4.0", "buildTime": "2026-10-13T18:00:00Z" },     // build-info
//     "host": "srv-awms-01",
//     "preset": "standard", "presetSource": "file",              // file | default | env
//     "fingerprint": "<64 hex>", "revision": "2fc45350c815-0",
//     "ceilingFile": { "path": "C:/AWMS/config/awms-features.properties", "exists": true,
//                      "sha256": "<64 hex>", "modifiedAt": "…", "owner": "BUILTIN\\Administrators" },
//     "ticket": "СЗ-ИБ-2026-041 от 14.10.2026",
//     "adminMode": "disable-only",                               // off | disable-only | full
//     "journalHead": { "id": 1234, "hash": "<64 hex>" },
//     "secrets": { "state": "generated", "text": "сгенерированы при установке" },   // generated | repository | absent
//     "roleSource": "token",                                     // db (после B10) | token
//     "dbUser": { "name": "awms_app", "superuser": false },
//     "warnings": ["…"]
//   },
//   "features": [ { "key": "video", "title": "Видео с IP-камер", "enabled": false, "reason": "PRESET",
//                   "reasonText": "выключена пресетом", "level": "L3", "levelText": "код не загружен",
//                   "origin": "пресет standard", "roles": [], "rolesGuaranteed": false, "probe": "/api/…",
//                   "checks": [ { "text": "бин VideoController отсутствует", "ok": true } ] } ],
//   "params":  [ { "key": "awms.video.retention-days", "value": "30", "origin": "файл awms-features.properties:7" } ],
//   "absent":  [ { "key": "ai", "title": "ИИ, ML, распознавание лиц", "reason": "…" } ],
//   "runtime": [ { "text": "actuator в classpath отсутствует", "ok": true } ],      // раздел 3: проверки среды
//   "inbound":    { "port": 8084, "address": "", "tls": false, "websocket": false,
//                   "routes": { "total": 412, "byPrefix": [ { "prefix": "/api/nomenclature", "count": 57 } ] },
//                   "gated": [ { "feature": "gpp", "rule": "/api/gpp/**" } ], "anonymous": [ "GET /api/features/public" ] },
//   "outbound":   { "database": "localhost:5432", "syncService": null, "restTemplates": 0,
//                   "cameras": { "count": 2, "polled": false, "withPassword": 2, "encrypted": false, "passwordInArgs": true } },
//   "background": { "threads": [ { "prefix": "http-nio-", "count": 10 } ], "scheduled": 0, "childProcesses": [],
//                   "startupTasks": [ "…" ], "ffmpeg": { "path": "C:/ffmpeg/bin/ffmpeg.exe", "exists": false } },
//   "storedData": [ { "feature": "video", "title": "Видео с IP-камер", "tables": [ { "name": "video_record", "rows": 340 } ],
//                     "dirs": [ { "path": "video-archive", "files": 680, "bytes": 13207024435 } ],
//                     "oldest": "2026-09-14T08:00:00Z", "retentionDays": 30, "note": "хранится, доступ закрыт",
//                     "purgeAllowed": true } ],
//   "components": { "backendSbom": null, "…": "…" },
//   "journal": { "chainValid": true, "brokenAt": null, "keyed": false, "head": { "id": 1234, "hash": "…" },
//                "entries": [ { "id": 1234, "occurredAt": "…", "type": "STARTUP", "featureKey": null, "oldValue": null,
//                               "newValue": null, "actor": "awms-service", "reason": null, "ticket": "…" } ] },
//   "selfCheck": [ { "title": "…", "command": "curl -i http://<сервер>:8084/…", "expected": "404" } ],
//   "roles": { "source": "token", "matrix": [ { "role": "SECURITY", "title": "Администратор ИБ", "users": 1,
//                                               "can": [ "профиль безопасности", "остальное — только чтение" ] } ] },
//   "usage": { "days": 30, "rows": [ { "actor": "director_test", "role": "DIRECTOR",
//                                      "counts": { "VIDEO_VIEWED": 3, "EXPORT": 12 } } ] },
//   "caveats": [ "…" ],
//   "probes": [ { "feature": "video", "url": "/api/…" } ]        // по желанию; иначе — probe выключенных функций
// }
//
// POST /api/security-profile/events  {type, fingerprint, revision, details} — REPORT_VIEWED, REPORT_PRINTED,
//                                    REPORT_EXPORTED, PROBE_RUN (SECURITY_VIEWERS, CSRF)
// POST /api/security-profile/purge   {feature, reason, password} → {feature, tables:[{name, rows}],
//                                    dirs:[{path, files, bytes}], journalId} (только SECURITY, CSRF, пакет B11)
import AxiosService from '../../services/AxiosService';

export const SECURITY_PROFILE_API = '/api/security-profile';
export const SECURITY_EVENTS_API = '/api/security-profile/events';
export const SECURITY_PURGE_API = '/api/security-profile/purge';

// ---------- Модель отчёта ----------

/** Самопроверка: «бин VideoController отсутствует» — да / нет / не проверялось (null) */
export interface Check {
  text: string;
  ok: boolean | null;
}

export interface FeatureRow {
  key: string;
  title: string;
  enabled: boolean;
  /** Код причины: PRESET, PROPERTY, DEPENDENCY:video, ABSENT_IN_BUILD, SWITCH, TAMPER; '' — сервер не прислал */
  reason: string;
  reasonText: string | null;
  /** L1–L4 */
  level: string | null;
  levelText: string | null;
  /** «файл awms-features.properties:5» / «jar: умолчание» / «пресет standard» */
  origin: string | null;
  roles: string[];
  /** false — роли не гарантируются (роль из токена, ключ общий); null — сервер не сказал */
  rolesGuaranteed: boolean | null;
  probe: string | null;
  checks: Check[];
}

export interface ParamRow {
  key: string;
  value: string;
  origin: string | null;
  title: string | null;
}

export interface AbsentRow {
  key: string;
  title: string;
  reason: string;
}

/** Строка «свойство — значение» разделов 4, 5, 6, 8 */
export interface Fact {
  label: string;
  value: string;
  /** Подсветка: true — хорошо, false — внимание, null — нейтрально */
  ok: boolean | null;
  note: string | null;
}

export interface FactTable {
  title: string;
  columns: string[];
  rows: string[][];
}

/** Раздел из фактов и таблиц: входящие, исходящие, фон, компоненты */
export interface FactSection {
  facts: Fact[];
  tables: FactTable[];
  /** Простые списки: «Доступно без входа», «Задачи при старте» */
  lists: Array<{ title: string; items: string[] }>;
}

export interface StoredDataRow {
  feature: string;
  title: string | null;
  tables: Array<{ name: string; rows: number | null }>;
  dirs: Array<{ path: string; files: number | null; bytes: number | null }>;
  oldest: string | null;
  retentionDays: number | null;
  note: string | null;
  /** Сервер разрешает удаление (функция выключена потолком); null — сервер не сказал */
  purgeAllowed: boolean | null;
}

export interface JournalHead {
  id: number | null;
  hash: string | null;
}

export interface JournalEntry {
  id: number | null;
  occurredAt: string | null;
  type: string;
  featureKey: string | null;
  oldValue: string | null;
  newValue: string | null;
  actor: string | null;
  reason: string | null;
  ticket: string | null;
}

export interface Journal {
  /** null — сервер не проверял цепочку */
  chainValid: boolean | null;
  brokenAt: number | null;
  /** false — цепочка без ключа HMAC (SHA-256): подделка администратором БД не выявляется */
  keyed: boolean | null;
  head: JournalHead | null;
  entries: JournalEntry[];
}

export interface SelfCheckRow {
  title: string;
  command: string;
  expected: string | null;
}

export interface RoleRow {
  role: string;
  title: string | null;
  users: number | null;
  can: string[];
}

export interface Roles {
  source: string | null;
  matrix: RoleRow[];
}

export interface UsageRow {
  actor: string;
  role: string | null;
  counts: Record<string, number>;
}

export interface Usage {
  days: number | null;
  rows: UsageRow[];
  /** Типы событий в порядке столбцов */
  types: string[];
}

export interface ReportHeader {
  backendVersion: string | null;
  backendBuildTime: string | null;
  host: string | null;
  preset: string | null;
  presetSource: string | null;
  fingerprint: string;
  revision: string | null;
  ceilingFile: {
    path: string | null;
    exists: boolean | null;
    sha256: string | null;
    modifiedAt: string | null;
    owner: string | null;
  } | null;
  ticket: string | null;
  adminMode: string | null;
  journalHead: JournalHead | null;
  secretsState: string | null;
  secretsText: string | null;
  roleSource: string | null;
  dbUser: { name: string | null; superuser: boolean | null } | null;
  warnings: string[];
  /** Поля шапки, которых интерфейс не знает: печатаются как есть */
  extra: Fact[];
}

export interface ProbeSpec {
  feature: string;
  url: string;
}

export interface SecurityReport {
  /** Ответ сервера как есть — для выгрузки JSON */
  raw: unknown;
  generatedAt: string | null;
  viewer: { login: string | null; role: string | null; canPurge: boolean | null };
  header: ReportHeader;
  /** null — сервер не прислал раздел */
  features: FeatureRow[] | null;
  params: ParamRow[] | null;
  absent: AbsentRow[] | null;
  runtime: Check[] | null;
  inbound: FactSection | null;
  outbound: FactSection | null;
  background: FactSection | null;
  storedData: StoredDataRow[] | null;
  components: FactSection | null;
  journal: Journal | null;
  selfCheck: SelfCheckRow[] | null;
  roles: Roles | null;
  usage: Usage | null;
  caveats: string[] | null;
  probes: ProbeSpec[] | null;
  /** Разделы, которых интерфейс не знает: «Прочие сведения» */
  extra: Array<{ key: string; value: unknown }>;
}

export class ReportFormatError extends Error {}

// ---------- Разбор: примитивы ----------

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonNull = <T,>(value: T | null | undefined): value is T => value !== null && value !== undefined;

const str = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() === '' ? null : value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const num = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
};

const bool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

/** Список строк: массив или «A,B» */
const strList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(str).filter(nonNull);
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

/** Первое заданное поле из синонимов */
const pick = (obj: Json | null | undefined, ...names: string[]): unknown => {
  if (!obj) return undefined;
  for (const name of names) {
    if (obj[name] !== undefined && obj[name] !== null) return obj[name];
  }
  return undefined;
};

const records = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isRecord) : []);

// ---------- Значения «как есть» ----------

/** Значение для печати: да/нет, число, строка, список; объект — «ключ: значение; …» */
export const plainValue = (value: unknown, depth = 0): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  // Числа как есть: среди них порты и номера, разряды им не нужны
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value === '' ? '—' : value;
  if (Array.isArray(value)) return value.length === 0 ? 'нет' : value.map(v => plainValue(v, depth + 1)).join(', ');
  if (isRecord(value)) {
    if (depth > 2) return JSON.stringify(value);
    const parts = Object.entries(value).map(([k, v]) => `${k}: ${plainValue(v, depth + 1)}`);
    return parts.length === 0 ? '—' : parts.join('; ');
  }
  return String(value);
};

/** Массив объектов → таблица по объединению ключей */
const tableOf = (title: string, value: unknown[], columnTitles: Record<string, string> = {}): FactTable => {
  const rows = value.map(v => (isRecord(v) ? v : { значение: v }));
  const keys: string[] = [];
  rows.forEach(r => Object.keys(r).forEach(k => keys.includes(k) || keys.push(k)));
  return {
    title,
    columns: keys.map(k => columnTitles[k] ?? k),
    rows: rows.map(r => keys.map(k => plainValue(r[k]))),
  };
};

/** Неизвестные поля раздела → факты, массивы объектов → таблицы */
const appendRest = (section: FactSection, obj: Json, consumed: readonly string[]) => {
  for (const [key, value] of Object.entries(obj)) {
    if (consumed.includes(key) || value === undefined) continue;
    if (Array.isArray(value) && value.some(isRecord)) section.tables.push(tableOf(key, value));
    else section.facts.push({ label: key, value: plainValue(value), ok: null, note: null });
  }
};

const fact = (label: string, value: string, ok: boolean | null = null, note: string | null = null): Fact => ({
  label,
  value,
  ok,
  note,
});

/** Раздел, присланный списком фактов: [{title|label, value, ok, note}] */
const factsFromItems = (items: Json[]): Fact[] =>
  items.map(i =>
    fact(
      str(pick(i, 'title', 'label', 'name', 'key')) ?? '—',
      plainValue(pick(i, 'value', 'text')),
      bool(pick(i, 'ok')),
      str(pick(i, 'note', 'comment')),
    ),
  );

const emptySection = (): FactSection => ({ facts: [], tables: [], lists: [] });

// ---------- Разбор разделов ----------

const parseChecks = (value: unknown): Check[] =>
  Array.isArray(value)
    ? value
        .map(c => {
          if (typeof c === 'string') return { text: c, ok: null };
          if (!isRecord(c)) return null;
          const text = str(pick(c, 'text', 'title', 'name'));
          return text ? { text, ok: bool(pick(c, 'ok', 'passed', 'result')) } : null;
        })
        .filter(nonNull)
    : [];

const parseFeatures = (value: unknown): FeatureRow[] | null => {
  if (value === undefined || value === null) return null;
  // Карта «ключ → вкл» (как в /api/features) или «ключ → объект»
  const list: Json[] = isRecord(value)
    ? Object.entries(value).map(([key, v]) => (isRecord(v) ? { key, ...v } : { key, enabled: v }))
    : records(value);
  return list
    .map(f => {
      const key = str(pick(f, 'key'));
      if (!key) return null;
      const roles = strList(pick(f, 'roles'));
      return {
        key,
        title: str(pick(f, 'title', 'name')) ?? key,
        enabled: pick(f, 'enabled', 'on', 'state') === true,
        reason: str(pick(f, 'reason', 'reasonCode')) ?? '',
        reasonText: str(pick(f, 'reasonText', 'stateText')),
        level: str(pick(f, 'level')),
        levelText: str(pick(f, 'levelText')),
        origin: str(pick(f, 'origin', 'source')),
        roles,
        rolesGuaranteed: bool(pick(f, 'rolesGuaranteed')),
        probe: str(pick(f, 'probe')),
        checks: parseChecks(pick(f, 'checks', 'selfChecks')),
      } satisfies FeatureRow;
    })
    .filter(nonNull);
};

const parseParams = (value: unknown): ParamRow[] | null => {
  if (value === undefined || value === null) return null;
  const list: Json[] = isRecord(value)
    ? Object.entries(value).map(([key, v]) => (isRecord(v) ? { key, ...v } : { key, value: v }))
    : records(value);
  return list
    .map(p => {
      const key = str(pick(p, 'key', 'name'));
      if (!key) return null;
      const raw = pick(p, 'value');
      return {
        key,
        value: raw === undefined || raw === null || raw === '' ? '' : plainValue(raw),
        origin: str(pick(p, 'origin', 'source')),
        title: str(pick(p, 'title')),
      } satisfies ParamRow;
    })
    .filter(nonNull);
};

const parseAbsent = (value: unknown): AbsentRow[] | null => {
  if (value === undefined || value === null) return null;
  return records(value)
    .map(a => {
      const key = str(pick(a, 'key'));
      if (!key) return null;
      return {
        key,
        title: str(pick(a, 'title', 'name')) ?? key,
        reason: str(pick(a, 'reason', 'absentReason', 'proof')) ?? '',
      };
    })
    .filter(nonNull);
};

const yesNo = (value: boolean): string => (value ? 'да' : 'нет');

const parseInbound = (value: unknown): FactSection | null => {
  if (!isRecord(value)) return null;
  const s = emptySection();
  if (Array.isArray(value.items)) s.facts.push(...factsFromItems(records(value.items)));
  const port = str(value.port);
  if (port) s.facts.push(fact('Порт приложения', port));
  if (value.address !== undefined) s.facts.push(fact('Адрес (server.address)', str(value.address) ?? 'все интерфейсы'));
  const tls = bool(value.tls);
  if (tls !== null) s.facts.push(fact('TLS', tls ? 'включён' : 'выключен', tls ? true : null));
  const ws = bool(value.websocket);
  if (ws !== null) s.facts.push(fact('/ws-stations (брокер WebSocket)', ws ? 'есть' : 'нет'));
  const routes = isRecord(value.routes) ? value.routes : null;
  if (routes) {
    const total = num(routes.total);
    if (total !== null) s.facts.push(fact('Эндпоинтов всего', total.toLocaleString('ru-RU')));
    const byPrefix = records(routes.byPrefix);
    if (byPrefix.length) {
      s.tables.push({
        title: 'Таблица маршрутизации по префиксам',
        columns: ['Префикс', 'Эндпоинтов'],
        rows: byPrefix.map(r => [str(r.prefix) ?? '—', plainValue(r.count)]),
      });
    }
    appendRest(s, routes, ['total', 'byPrefix']);
  }
  const gated = records(value.gated);
  if (gated.length) {
    s.tables.push({
      title: 'Закрыто воротами (L2): бины есть, маршрут отвечает 404',
      columns: ['Функция', 'Правило'],
      rows: gated.map(g => [str(pick(g, 'feature', 'key')) ?? '—', str(pick(g, 'rule', 'pattern')) ?? '—']),
    });
  } else if (Array.isArray(value.gated)) {
    s.facts.push(fact('Закрыто воротами (L2)', 'нет правил'));
  }
  if (Array.isArray(value.anonymous)) {
    const items = strList(value.anonymous);
    s.lists.push({ title: 'Доступно без входа', items: items.length ? items : ['нет'] });
  }
  appendRest(s, value, ['items', 'port', 'address', 'tls', 'websocket', 'routes', 'gated', 'anonymous']);
  return s;
};

const parseOutbound = (value: unknown): FactSection | null => {
  if (!isRecord(value)) return null;
  const s = emptySection();
  if (Array.isArray(value.items)) s.facts.push(...factsFromItems(records(value.items)));
  if (value.database !== undefined) s.facts.push(fact('PostgreSQL', plainValue(value.database)));
  if (value.syncService !== undefined) {
    const sync = str(value.syncService);
    s.facts.push(fact('Внешняя система заказов (sync.service.url)', sync ?? 'нет', sync ? null : true));
  }
  if (value.outboundAllowed !== undefined) {
    const allowed = strList(value.outboundAllowed);
    s.facts.push(fact('Разрешённые исходящие (awms.network.outbound.allowed)', allowed.length ? allowed.join(', ') : 'нет'));
  }
  const restTemplates = num(value.restTemplates);
  if (restTemplates !== null) s.facts.push(fact('Бинов RestTemplate', String(restTemplates), restTemplates === 0 ? true : null));
  const cameras = isRecord(value.cameras) ? value.cameras : null;
  if (cameras) {
    const count = num(cameras.count);
    const polled = bool(cameras.polled);
    if (count !== null) {
      const tail = polled === false ? ', не опрашиваются' : polled ? ', опрашиваются' : '';
      s.facts.push(fact('Камер в БД', `${count}${tail}`));
    }
    const hosts = strList(cameras.hosts);
    if (hosts.length) s.facts.push(fact('Хосты камер (без учётных данных)', hosts.join(', ')));
    const withPassword = num(cameras.withPassword);
    if (withPassword !== null) {
      const encrypted = bool(cameras.encrypted);
      const how = withPassword === 0 ? '' : encrypted === true ? ' (зашифрованы)' : encrypted === false ? ' (открытым текстом)' : '';
      s.facts.push(fact('Камер с сохранённым паролем', `${withPassword}${how}`, withPassword === 0 || encrypted === true ? null : false));
    }
    const inArgs = bool(cameras.passwordInArgs);
    if (inArgs !== null) s.facts.push(fact('Пароль камеры в аргументах ffmpeg', yesNo(inArgs), inArgs ? false : true));
    appendRest(s, cameras, ['count', 'polled', 'hosts', 'withPassword', 'encrypted', 'passwordInArgs']);
  }
  appendRest(s, value, ['items', 'database', 'syncService', 'outboundAllowed', 'restTemplates', 'cameras']);
  return s;
};

const parseBackground = (value: unknown): FactSection | null => {
  if (!isRecord(value)) return null;
  const s = emptySection();
  if (Array.isArray(value.items)) s.facts.push(...factsFromItems(records(value.items)));
  const threads = records(value.threads);
  if (threads.length) {
    s.tables.push({
      title: 'Потоки приложения по префиксам',
      columns: ['Префикс', 'Потоков'],
      rows: threads.map(t => [str(pick(t, 'prefix', 'name')) ?? '—', plainValue(t.count)]),
    });
  }
  const scheduled = num(value.scheduled);
  if (scheduled !== null) s.facts.push(fact('Задач @Scheduled', String(scheduled)));
  if (value.childProcesses !== undefined) {
    const children = value.childProcesses;
    const names = Array.isArray(children) ? children.map(c => (isRecord(c) ? str(pick(c, 'name')) : str(c))).filter(nonNull) : [];
    const count = Array.isArray(children) ? children.length : num(children);
    s.facts.push(
      fact('Дочерние процессы', count === 0 ? 'нет' : names.length ? names.join(', ') : plainValue(children), count === 0 ? true : null),
    );
  }
  if (Array.isArray(value.startupTasks)) {
    const tasks = strList(value.startupTasks);
    s.lists.push({ title: 'Задачи при старте', items: tasks.length ? tasks : ['нет'] });
  }
  const ffmpeg = isRecord(value.ffmpeg) ? value.ffmpeg : null;
  if (ffmpeg) {
    const exists = bool(ffmpeg.exists);
    const path = str(ffmpeg.path);
    s.facts.push(fact('Файл ffmpeg по video.ffmpeg-path', exists === null ? '—' : exists ? 'есть' : 'нет', null, path));
  }
  appendRest(s, value, ['items', 'threads', 'scheduled', 'childProcesses', 'startupTasks', 'ffmpeg']);
  return s;
};

const parseComponents = (value: unknown): FactSection | null => {
  if (!isRecord(value)) return null;
  const s = emptySection();
  if (Array.isArray(value.items)) s.facts.push(...factsFromItems(records(value.items)));
  if (value.backendSbom !== undefined) s.facts.push(fact('SBOM бэкенда', str(value.backendSbom) ?? 'не сформирован'));
  appendRest(s, value, ['items', 'backendSbom']);
  return s;
};

const parseStoredData = (value: unknown): StoredDataRow[] | null => {
  if (value === undefined || value === null) return null;
  return records(value)
    .map(d => {
      const feature = str(pick(d, 'feature', 'key'));
      if (!feature) return null;
      return {
        feature,
        title: str(pick(d, 'title')),
        tables: records(d.tables)
          .map(t => {
            const name = str(pick(t, 'name', 'table'));
            return name ? { name, rows: num(pick(t, 'rows', 'count')) } : null;
          })
          .filter(nonNull),
        dirs: records(pick(d, 'dirs', 'directories'))
          .map(t => {
            const path = str(pick(t, 'path', 'dir'));
            return path ? { path, files: num(t.files), bytes: num(pick(t, 'bytes', 'size')) } : null;
          })
          .filter(nonNull),
        oldest: str(pick(d, 'oldest', 'oldestAt')),
        retentionDays: num(d.retentionDays),
        note: str(d.note),
        purgeAllowed: bool(pick(d, 'purgeAllowed', 'canPurge')),
      } satisfies StoredDataRow;
    })
    .filter(nonNull);
};

const parseHead = (value: unknown): JournalHead | null => {
  if (!isRecord(value)) return null;
  const id = num(pick(value, 'id', 'number'));
  const hash = str(pick(value, 'hash', 'rowHash', 'row_hash'));
  return id === null && hash === null ? null : { id, hash };
};

const parseJournal = (value: unknown): Journal | null => {
  if (!isRecord(value)) return null;
  return {
    chainValid: bool(pick(value, 'chainValid', 'valid')),
    brokenAt: num(value.brokenAt),
    keyed: bool(value.keyed),
    head: parseHead(value.head),
    entries: records(value.entries).map(e => ({
      id: num(e.id),
      occurredAt: str(pick(e, 'occurredAt', 'time', 'at')),
      type: str(pick(e, 'type', 'eventType')) ?? '—',
      featureKey: str(pick(e, 'featureKey', 'feature')),
      oldValue: str(e.oldValue),
      newValue: str(e.newValue),
      actor: str(e.actor),
      reason: str(e.reason),
      ticket: str(e.ticket),
    })),
  };
};

const parseSelfCheck = (value: unknown): SelfCheckRow[] | null => {
  if (!Array.isArray(value)) return null;
  return value
    .map(c => {
      if (typeof c === 'string') return { title: '', command: c, expected: null };
      if (!isRecord(c)) return null;
      const command = str(pick(c, 'command', 'cmd'));
      return command ? { title: str(pick(c, 'title', 'what')) ?? '', command, expected: str(pick(c, 'expected', 'expect')) } : null;
    })
    .filter(nonNull);
};

const parseRoles = (value: unknown): Roles | null => {
  if (value === undefined || value === null) return null;
  const obj = isRecord(value) ? value : { matrix: value };
  return {
    source: str(obj.source),
    matrix: records(pick(obj, 'matrix', 'rows'))
      .map(r => {
        const role = str(pick(r, 'role', 'name'));
        return role
          ? { role, title: str(pick(r, 'title', 'description')), users: num(pick(r, 'users', 'userCount')), can: strList(pick(r, 'can', 'permissions')) }
          : null;
      })
      .filter(nonNull),
  };
};

/** Порядок столбцов сводки использования (раздел 9.2, строка 13); прочие типы — после них */
export const USAGE_TYPES = [
  'VIDEO_VIEWED',
  'VIDEO_LIVE_OPENED',
  'VIDEO_DOWNLOADED',
  'VIDEO_RECORDING_STARTED',
  'EXPORT',
  'MODEL3D_SOURCE',
  'CAMERA_CHANGED',
  'OUTBOUND_SENT',
] as const;

const parseUsage = (value: unknown): Usage | null => {
  if (value === undefined || value === null) return null;
  const obj = isRecord(value) ? value : { rows: value };
  const byActor = new Map<string, UsageRow>();
  for (const r of records(obj.rows)) {
    const actor = str(pick(r, 'actor', 'user', 'login')) ?? '—';
    const row = byActor.get(actor) ?? { actor, role: str(pick(r, 'role', 'actorRole')), counts: {} };
    if (isRecord(r.counts)) {
      for (const [type, count] of Object.entries(r.counts)) {
        const n = num(count);
        if (n !== null) row.counts[type] = (row.counts[type] ?? 0) + n;
      }
    } else {
      // Плоская строка: {actor, event, count}
      const type = str(pick(r, 'event', 'type', 'eventType'));
      const n = num(r.count);
      if (type && n !== null) row.counts[type] = (row.counts[type] ?? 0) + n;
    }
    byActor.set(actor, row);
  }
  const rows = [...byActor.values()];
  const seen = new Set(rows.flatMap(r => Object.keys(r.counts)));
  const types = [...USAGE_TYPES.filter(t => seen.has(t)), ...[...seen].filter(t => !(USAGE_TYPES as readonly string[]).includes(t)).sort()];
  return { days: num(obj.days), rows, types };
};

const parseProbes = (value: unknown): ProbeSpec[] | null => {
  if (!Array.isArray(value)) return null;
  return records(value)
    .map(p => {
      const url = str(pick(p, 'url', 'probe', 'path'));
      return url ? { feature: str(pick(p, 'feature', 'key')) ?? '—', url } : null;
    })
    .filter(nonNull);
};

/** Поля шапки (на верхнем уровне ответа или в header) */
const HEADER_FIELDS = [
  'backend',
  'backendVersion',
  'version',
  'buildTime',
  'host',
  'hostName',
  'preset',
  'presetSource',
  'fingerprint',
  'revision',
  'ceilingFile',
  'ticket',
  'adminMode',
  'journalHead',
  'secrets',
  'roleSource',
  'dbUser',
  'warnings',
];

/** Разделы ответа, которые интерфейс разбирает сам */
const KNOWN_SECTIONS = [
  'generatedAt',
  'viewer',
  'header',
  'features',
  'params',
  'absent',
  'runtime',
  'inbound',
  'outbound',
  'background',
  'storedData',
  'components',
  'journal',
  'selfCheck',
  'roles',
  'usage',
  'caveats',
  'probes',
];

const parseHeader = (h: Json, fallbackHead: JournalHead | null): ReportHeader => {
  const fingerprint = str(h.fingerprint);
  if (!fingerprint || !/^[0-9a-f]{12,128}$/i.test(fingerprint)) {
    throw new ReportFormatError('В ответе нет отпечатка профиля');
  }
  const backend = isRecord(h.backend) ? h.backend : null;
  const file = isRecord(h.ceilingFile) ? h.ceilingFile : null;
  const secrets = h.secrets;
  const dbUser = isRecord(h.dbUser) ? h.dbUser : typeof h.dbUser === 'string' ? { name: h.dbUser } : null;
  const header: ReportHeader = {
    backendVersion: str(pick(backend, 'version')) ?? str(pick(h, 'backendVersion', 'version')),
    backendBuildTime: str(pick(backend, 'buildTime', 'time')) ?? str(h.buildTime),
    host: str(pick(h, 'host', 'hostName')),
    preset: str(h.preset),
    presetSource: str(h.presetSource),
    fingerprint: fingerprint.toLowerCase(),
    revision: str(h.revision),
    ceilingFile: file
      ? {
          path: str(file.path),
          exists: bool(file.exists),
          sha256: str(file.sha256),
          modifiedAt: str(pick(file, 'modifiedAt', 'modified', 'lastModified')),
          owner: str(file.owner),
        }
      : null,
    ticket: str(h.ticket),
    adminMode: str(h.adminMode),
    journalHead: parseHead(h.journalHead) ?? fallbackHead,
    secretsState: isRecord(secrets) ? str(pick(secrets, 'state', 'status')) : str(secrets),
    secretsText: isRecord(secrets) ? str(pick(secrets, 'text', 'description')) : null,
    roleSource: str(h.roleSource),
    dbUser: dbUser ? { name: str(pick(dbUser, 'name', 'user')), superuser: bool(dbUser.superuser) } : null,
    warnings: strList(h.warnings),
    extra: [],
  };
  return header;
};

/**
 * Разбор ответа GET /api/security-profile. Ответ без отпечатка профиля → ReportFormatError: такой отчёт нельзя
 * сверить, печатать его нельзя
 */
export const parseSecurityReport = (data: unknown): SecurityReport => {
  if (!isRecord(data)) throw new ReportFormatError('Ответ сервера — не отчёт');
  const headerObj = isRecord(data.header) ? data.header : data;
  const journal = parseJournal(data.journal);
  const header = parseHeader(headerObj, journal?.head ?? null);
  if (isRecord(data.header)) {
    // Неизвестные поля шапки печатаются как есть
    for (const [key, value] of Object.entries(data.header)) {
      if (!HEADER_FIELDS.includes(key) && value !== undefined) header.extra.push(fact(key, plainValue(value)));
    }
  }
  const viewer = isRecord(data.viewer) ? data.viewer : {};
  const consumed = [...KNOWN_SECTIONS, ...(isRecord(data.header) ? [] : HEADER_FIELDS)];
  const extra = Object.entries(data)
    .filter(([key, value]) => !consumed.includes(key) && value !== undefined)
    .map(([key, value]) => ({ key, value }));
  const caveats = Array.isArray(data.caveats) ? strList(data.caveats) : null;
  return {
    raw: data,
    generatedAt: str(data.generatedAt),
    viewer: { login: str(pick(viewer, 'login', 'username')), role: str(viewer.role), canPurge: bool(viewer.canPurge) },
    header,
    features: parseFeatures(data.features),
    params: parseParams(data.params),
    absent: parseAbsent(data.absent),
    runtime: data.runtime === undefined || data.runtime === null ? null : parseChecks(data.runtime),
    inbound: parseInbound(data.inbound),
    outbound: parseOutbound(data.outbound),
    background: parseBackground(data.background),
    storedData: parseStoredData(data.storedData),
    components: parseComponents(data.components),
    journal,
    selfCheck: parseSelfCheck(data.selfCheck),
    roles: parseRoles(data.roles),
    usage: parseUsage(data.usage),
    caveats,
    probes: parseProbes(data.probes),
    extra,
  };
};

// ---------- Сборка фронтенда (/awms-build.json, вариант поставки F7) ----------

export interface BuildPackage {
  name: string;
  version: string | null;
  license: string | null;
}

/** awms-build.json варианта поставки (формат awms-build/1, build/awmsBuildVariant.ts) */
export interface FrontendBuild {
  variant: string | null;
  buildId: string | null;
  builtAt: string | null;
  excluded: string[];
  /** Пакеты npm, вошедшие в чанки */
  packages: BuildPackage[];
  /** Готовые файлы библиотек в public/vendor (OCCT, SockJS) */
  vendored: Array<BuildPackage & { path: string | null }>;
  /** Файл как есть — для выгрузки JSON */
  raw: unknown;
}

/** Разбор awms-build.json; null — файла нет или это не он (dev-сервер отдаёт index.html на любой путь) */
export const parseFrontendBuild = (data: unknown): FrontendBuild | null => {
  if (!isRecord(data)) return null;
  const variant = str(pick(data, 'variant', 'preset'));
  const buildId = str(pick(data, 'buildId', 'id', 'build', 'hash'));
  if (!variant && !buildId) return null;
  const packagesRaw = pick(data, 'packages', 'dependencies', 'components');
  const packages: BuildPackage[] = Array.isArray(packagesRaw)
    ? records(packagesRaw)
        .map(p => {
          const name = str(p.name);
          return name ? { name, version: str(p.version), license: str(p.license) } : null;
        })
        .filter(nonNull)
    : isRecord(packagesRaw)
      ? Object.entries(packagesRaw).map(([name, v]) =>
          isRecord(v) ? { name, version: str(v.version), license: str(v.license) } : { name, version: str(v), license: null },
        )
      : [];
  const vendored = records(data.vendored)
    .map(v => {
      const name = str(pick(v, 'name', 'package'));
      return name ? { name, version: str(v.version), license: str(v.license), path: str(v.path) } : null;
    })
    .filter(nonNull);
  return {
    variant,
    buildId,
    builtAt: str(pick(data, 'builtAt', 'createdAt', 'date', 'time')),
    excluded: strList(pick(data, 'excluded', 'exclude', 'excludes')),
    packages,
    vendored,
    raw: data,
  };
};

// ---------- Запросы ----------

/** HTTP-клиент отчёта: подходит экземпляр Axios (AxiosService). Тесты подменяют его через connectSecurityHttp */
export interface SecurityHttp {
  get(url: string): Promise<{ data: unknown }>;
  post(url: string, body: unknown): Promise<{ data: unknown }>;
}

/** Ответ запроса с паролем: статус и тело (JSON или null) */
export interface SecretResponse {
  status: number;
  data: unknown;
}

/**
 * Отправка запроса с паролем (удаление данных). Не через AxiosService: его перехватчик ошибок пишет в консоль
 * объект ошибки целиком, вместе с телом запроса, — пароль оказался бы в консоли браузера
 */
export type SecretPost = (url: string, body: unknown) => Promise<SecretResponse>;

let http: SecurityHttp | null = null;
let secretPost: SecretPost | null = null;
let buildFetch: (() => Promise<unknown>) | null = null;

export const connectSecurityHttp = (
  client: SecurityHttp | null,
  options: { secretPost?: SecretPost | null; frontendBuild?: (() => Promise<unknown>) | null } = {},
) => {
  http = client;
  secretPost = options.secretPost ?? null;
  buildFetch = options.frontendBuild ?? null;
};

const client = (): SecurityHttp => http ?? AxiosService;

/** Код ответа HTTP из ошибки Axios или похожей; null — ответа не было (нет связи) */
export const httpStatusOf = (error: unknown): number | null => {
  if (!isRecord(error)) return null;
  const response = isRecord(error.response) ? error.response : null;
  return num(response?.status) ?? num(error.status);
};

/** Сообщение сервера из тела ошибки: {message} / {error} / строка */
export const serverMessageOf = (data: unknown): string | null => {
  if (typeof data === 'string') return data.length > 0 && data.length <= 300 && !/^\s*</.test(data) ? data : null;
  if (!isRecord(data)) return null;
  return str(pick(data, 'message', 'error', 'detail', 'title'));
};

/** Почему отчёт не получен — для экрана */
export type ReportFailure =
  | { kind: 'forbidden' }
  | { kind: 'unsupported' }
  | { kind: 'format'; message: string }
  | { kind: 'network' }
  | { kind: 'server'; status: number };

export class ReportLoadError extends Error {
  readonly failure: ReportFailure;
  constructor(failure: ReportFailure) {
    super(failure.kind);
    this.failure = failure;
  }
}

/** Запрос отчёта. Ошибка — ReportLoadError с причиной */
export const fetchSecurityReport = async (): Promise<SecurityReport> => {
  let data: unknown;
  try {
    ({ data } = await client().get(SECURITY_PROFILE_API));
  } catch (error) {
    const status = httpStatusOf(error);
    if (status === 401 || status === 403) throw new ReportLoadError({ kind: 'forbidden' });
    // 404 и 405: сервер старее отчёта
    if (status === 404 || status === 405) throw new ReportLoadError({ kind: 'unsupported' });
    if (status === null) throw new ReportLoadError({ kind: 'network' });
    throw new ReportLoadError({ kind: 'server', status });
  }
  try {
    return parseSecurityReport(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ответ сервера не разобран';
    throw new ReportLoadError({ kind: 'format', message });
  }
};

/** Файл сборки фронтенда с того же адреса, что и страница. Нет файла или не JSON — null */
export const fetchFrontendBuild = async (): Promise<FrontendBuild | null> => {
  try {
    if (buildFetch) return parseFrontendBuild(await buildFetch());
    const response = await fetch('/awms-build.json', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok || !/json/i.test(response.headers.get('content-type') ?? '')) return null;
    return parseFrontendBuild(await response.json());
  } catch {
    return null;
  }
};

export type SecurityEventType = 'REPORT_VIEWED' | 'REPORT_PRINTED' | 'REPORT_EXPORTED' | 'PROBE_RUN';

/** Запись события в журнал профиля. true — сервер принял; сбой не бросает исключение (журнал — не повод не печатать) */
export const postSecurityEvent = async (
  type: SecurityEventType,
  report: Pick<SecurityReport, 'header'>,
  details: Record<string, unknown> = {},
): Promise<boolean> => {
  try {
    await client().post(SECURITY_EVENTS_API, {
      type,
      fingerprint: report.header.fingerprint,
      revision: report.header.revision,
      details,
    });
    return true;
  } catch {
    return false;
  }
};

// ---------- Удаление данных выключенной функции ----------

export interface PurgeRequest {
  feature: string;
  reason: string;
  password: string;
}

export interface PurgeResult {
  feature: string;
  tables: Array<{ name: string; rows: number | null }>;
  dirs: Array<{ path: string; files: number | null; bytes: number | null }>;
  journalId: number | null;
}

export type PurgeOutcome =
  | { ok: true; result: PurgeResult }
  | { ok: false; kind: 'invalid' | 'rejected' | 'forbidden' | 'unsupported' | 'network' | 'server'; message: string };

/** Проверка формы до отправки; null — можно отправлять */
export const validatePurge = (request: PurgeRequest): string | null => {
  if (!request.feature.trim()) return 'Не выбрана функция';
  if (request.reason.trim().length < 5) return 'Укажите причину удаления (не короче 5 знаков)';
  if (!request.password) return 'Введите свой пароль';
  return null;
};

const csrfToken = async (): Promise<string | null> => {
  const cookie = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  if (cookie) return decodeURIComponent(cookie[1]);
  const headers = AxiosService.defaults.headers as unknown as Record<string, unknown> & { common?: Record<string, unknown> };
  const known = str(headers['X-XSRF-TOKEN']) ?? str(headers.common?.['X-XSRF-TOKEN']);
  if (known) return known;
  try {
    const response = await fetch(window.config.ip_api + '/csrf', { credentials: 'include', cache: 'no-store' });
    const body: unknown = await response.json();
    return isRecord(body) ? str(body.token) : null;
  } catch {
    return null;
  }
};

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Отправка запроса с паролем через fetch: CSRF как у AxiosService, при 401/403 — один повтор после обновления токена */
const defaultSecretPost: SecretPost = async (url, body) => {
  const send = async () => {
    const token = await csrfToken();
    return fetch(window.config.ip_api + url, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-XSRF-TOKEN': token } : {}) },
      body: JSON.stringify(body),
    });
  };
  let response = await send();
  if (response.status === 401 || response.status === 403) {
    const refreshed = await fetch(window.config.ip_api + '/api/auth/refresh_token', { credentials: 'include', cache: 'no-store' })
      .then(r => r.ok)
      .catch(() => false);
    if (refreshed) response = await send();
  }
  return { status: response.status, data: await readJson(response) };
};

const parsePurgeResult = (data: unknown, feature: string): PurgeResult => {
  const obj = isRecord(data) ? data : {};
  return {
    feature: str(obj.feature) ?? feature,
    tables: records(obj.tables)
      .map(t => {
        const name = str(pick(t, 'name', 'table'));
        return name ? { name, rows: num(pick(t, 'rows', 'deleted', 'count')) } : null;
      })
      .filter(nonNull),
    dirs: records(pick(obj, 'dirs', 'directories'))
      .map(d => {
        const path = str(pick(d, 'path', 'dir'));
        return path ? { path, files: num(d.files), bytes: num(pick(d, 'bytes', 'size')) } : null;
      })
      .filter(nonNull),
    journalId: num(pick(obj, 'journalId', 'logId', 'entryId')),
  };
};

/**
 * Удаление данных функции, выключенной потолком (6.7, B11): только SECURITY, пароль, запись PURGE в журнал.
 * Пароль уходит только в теле запроса и нигде не сохраняется
 */
export const purgeFeatureData = async (request: PurgeRequest): Promise<PurgeOutcome> => {
  const invalid = validatePurge(request);
  if (invalid) return { ok: false, kind: 'invalid', message: invalid };
  let response: SecretResponse;
  try {
    response = await (secretPost ?? defaultSecretPost)(SECURITY_PURGE_API, {
      feature: request.feature,
      reason: request.reason.trim(),
      password: request.password,
    });
  } catch {
    return { ok: false, kind: 'network', message: 'Нет связи с сервером. Данные не удалены.' };
  }
  const { status, data } = response;
  if (status >= 200 && status < 300) return { ok: true, result: parsePurgeResult(data, request.feature) };
  const message = serverMessageOf(data);
  if (status === 400 || status === 409 || status === 422) {
    return { ok: false, kind: 'rejected', message: message ?? 'Сервер отклонил запрос: неверный пароль или функция разрешена потолком.' };
  }
  if (status === 401 || status === 403) {
    return { ok: false, kind: 'forbidden', message: 'Удалять данные может только администратор ИБ.' };
  }
  if (status === 404 || status === 405) {
    return { ok: false, kind: 'unsupported', message: 'Сервер не поддерживает удаление данных: нужна новая версия сервера.' };
  }
  return { ok: false, kind: 'server', message: message ?? `Ошибка сервера (${status}). Данные не удалены.` };
};
