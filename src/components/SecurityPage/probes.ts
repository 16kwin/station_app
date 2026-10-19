// probes.ts — «Проверка из браузера» (раздел 9.2, строка 10 и протокол 9.3, п. 4 проекта): адрес пробы каждой
// выключенной функции запрашивается методами GET и HEAD — под учётной записью вошедшего и без входа (без куки).
// Ворота сервера стоят раньше Spring Security, поэтому закрытая функция отвечает 404 обоим и на оба метода.
// Любой другой ответ — повод разбираться: 401/403 значит, что запрос дошёл до правил доступа мимо ворот,
// 405 — что ворота не закрыли этот метод, 2xx — что маршрут открыт.
//
// Тело ответа не читается: запрос прерывается, как только пришёл статус (проба скачивания не тянет файл).
// Адреса проб присылает сервер; запросы уходят только на относительные пути того же API — чужие адреса
// и пути с обходами (`//`, `..`, `\`) отбрасываются.
import type { FeatureRow, SecurityReport } from './api';

export type ProbeMethod = 'GET' | 'HEAD';
/** session — с куки вошедшего пользователя; anonymous — без куки */
export type ProbeAuth = 'session' | 'anonymous';

export interface ProbeTarget {
  feature: string;
  title: string;
  url: string;
}

/**
 * closed — 404, функция закрыта; open — 2xx/3xx, маршрут открыт; denied — 401/403, ответили правила доступа;
 * method — 405, ворота не закрыли метод; other — прочие коды; error — нет ответа (связь, таймаут)
 */
export type ProbeOutcome = 'closed' | 'open' | 'denied' | 'method' | 'other' | 'error';

export interface ProbeAttempt {
  method: ProbeMethod;
  auth: ProbeAuth;
  status: number | null;
  outcome: ProbeOutcome;
}

export interface ProbeResult {
  target: ProbeTarget;
  attempts: ProbeAttempt[];
  /** Все попытки ответили 404 */
  ok: boolean;
}

export interface ProbeRun {
  startedAt: string;
  finishedAt: string;
  results: ProbeResult[];
  /** Число запросов (адрес × метод × вход) */
  total: number;
  passed: number;
  failed: number;
}

/** Порядок попыток для каждого адреса */
export const PROBE_PLAN: ReadonlyArray<{ method: ProbeMethod; auth: ProbeAuth }> = [
  { method: 'GET', auth: 'session' },
  { method: 'HEAD', auth: 'session' },
  { method: 'GET', auth: 'anonymous' },
  { method: 'HEAD', auth: 'anonymous' },
];

export const PROBE_TIMEOUT_MS = 8000;
export const PROBE_CONCURRENCY = 4;

/** Относительный путь API без обходов: только такие адреса проверяются */
export const isSafeProbePath = (url: string): boolean =>
  /^\/[^/\\]/.test(url) &&
  !/[\s\\;]/.test(url) &&
  !/%2e|%2f|%5c/i.test(url) &&
  !/(^|\/)\.\.?(\/|$|\?)/.test(url) &&
  !url.includes('//') &&
  url.length <= 300;

/**
 * Адреса проб: явный список сервера (report.probes) или probe каждой выключенной функции.
 * Дубли адресов убираются, небезопасные адреса отбрасываются
 */
export const probeTargets = (report: Pick<SecurityReport, 'features' | 'probes'>): ProbeTarget[] => {
  const titles = new Map<string, string>((report.features ?? []).map((f: FeatureRow) => [f.key, f.title]));
  const raw: Array<{ feature: string; url: string }> = report.probes
    ? report.probes
    : (report.features ?? []).filter(f => !f.enabled && f.probe).map(f => ({ feature: f.key, url: f.probe as string }));
  const seen = new Set<string>();
  const targets: ProbeTarget[] = [];
  for (const { feature, url } of raw) {
    if (!isSafeProbePath(url) || seen.has(url)) continue;
    seen.add(url);
    targets.push({ feature, title: titles.get(feature) ?? feature, url });
  }
  return targets;
};

export const classifyStatus = (status: number | null): ProbeOutcome => {
  if (status === null) return 'error';
  if (status === 404) return 'closed';
  if (status === 401 || status === 403) return 'denied';
  if (status === 405) return 'method';
  // fetch с redirect: 'manual' отдаёт перенаправление как opaqueredirect со статусом 0
  if (status === 0 || (status >= 200 && status < 400)) return 'open';
  return 'other';
};

export const OUTCOME_TEXT: Record<ProbeOutcome, string> = {
  closed: 'закрыто',
  open: 'маршрут открыт',
  denied: 'ответили правила доступа',
  method: 'метод не закрыт',
  other: 'неожиданный ответ',
  error: 'нет ответа',
};

/** Минимум fetch, который нужен пробам (тесты подставляют свой) */
export type ProbeFetch = (url: string, init: RequestInit) => Promise<{ status: number; type?: string }>;

export interface ProbeOptions {
  /** Адрес API (window.config.ip_api) */
  baseUrl: string;
  fetchFn?: ProbeFetch;
  timeoutMs?: number;
  concurrency?: number;
  /** Ход проверки: сколько запросов выполнено из скольких */
  onProgress?: (done: number, total: number) => void;
  /** Отмена всей проверки (уход со страницы) */
  signal?: AbortSignal;
}

const probeOnce = async (
  fetchFn: ProbeFetch,
  url: string,
  method: ProbeMethod,
  auth: ProbeAuth,
  timeoutMs: number,
  outer?: AbortSignal,
): Promise<number | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  outer?.addEventListener('abort', onOuterAbort);
  try {
    const response = await fetchFn(url, {
      method,
      credentials: auth === 'session' ? 'include' : 'omit',
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response.type === 'opaqueredirect' ? 0 : response.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
    // Тело не нужно: прерываем загрузку (скачивание файла, долгий ответ)
    controller.abort();
  }
};

/** Пробы по адресам: каждый адрес — GET и HEAD, с входом и без; не больше concurrency запросов одновременно */
export const runProbes = async (targets: readonly ProbeTarget[], options: ProbeOptions): Promise<ProbeRun> => {
  const fetchFn: ProbeFetch = options.fetchFn ?? ((url, init) => fetch(url, init));
  const timeoutMs = options.timeoutMs ?? PROBE_TIMEOUT_MS;
  const concurrency = Math.max(1, options.concurrency ?? PROBE_CONCURRENCY);
  const base = options.baseUrl.replace(/\/+$/, '');
  const startedAt = new Date().toISOString();

  const jobs = targets.flatMap((target, t) => PROBE_PLAN.map((plan, p) => ({ target, t, p, ...plan })));
  const attempts: ProbeAttempt[][] = targets.map(() => []);
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const status = options.signal?.aborted
        ? null
        : await probeOnce(fetchFn, base + job.target.url, job.method, job.auth, timeoutMs, options.signal);
      attempts[job.t][job.p] = { method: job.method, auth: job.auth, status, outcome: classifyStatus(status) };
      done++;
      options.onProgress?.(done, jobs.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(jobs.length, 1)) }, worker));

  const results = targets.map((target, t) => {
    const list = attempts[t];
    return { target, attempts: list, ok: list.length > 0 && list.every(a => a.outcome === 'closed') };
  });
  const all = results.flatMap(r => r.attempts);
  const passed = all.filter(a => a.outcome === 'closed').length;
  return { startedAt, finishedAt: new Date().toISOString(), results, total: all.length, passed, failed: all.length - passed };
};

/** Подробности события PROBE_RUN для журнала профиля: только адреса и коды, без данных ответов */
export const probeEventDetails = (run: ProbeRun): Record<string, unknown> => ({
  total: run.total,
  passed: run.passed,
  failed: run.failed,
  startedAt: run.startedAt,
  finishedAt: run.finishedAt,
  results: run.results.map(r => ({
    feature: r.target.feature,
    url: r.target.url,
    attempts: r.attempts.map(a => `${a.method} ${a.auth === 'session' ? 'session' : 'anonymous'} ${a.status ?? 'error'}`),
  })),
});
