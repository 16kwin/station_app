// featureStore.ts — состав функций установки для интерфейса (раздел 8.1 проекта «Дискретное отключение функций»).
// Источник правды — сервер: GET /api/features отдаёт состояние, уже вычисленное по потолку установки,
// зависимостям и роли пользователя. Интерфейс только прячет точки входа. Правила — закрытые (fail-closed):
//  • ключа нет в ответе или его значение не true — функция выключена;
//  • модуля нет в сборке — выключена, даже если сервер её разрешает;
//  • выключен родитель или зависимость — выключена;
//  • профиль не получен — видно только ядро (status = 'error').
// Хранилище живёт вне React (useSyncExternalStore), поэтому его читают и компоненты, и перехватчики Axios.
import { useSyncExternalStore } from 'react';
import AxiosService from '../AxiosService';
import { FEATURE_KEYS, FEATURE_REQUIRES, featureParent, type FeatureKey } from './catalog';
import { inBuild } from './buildFlags';
import { purgeDisabledFeatureStorage } from './storagePurge';

/** Профиль функций вошедшего пользователя */
export const FEATURES_API = '/api/features';

/** Через сколько миллисекунд после запроса на обновление идёт запрос (несколько ответов API подряд — один запрос) */
export const REFRESH_DEBOUNCE_MS = 300;
/** Ту же новую ревизию из заголовка не перезапрашиваем чаще: защита от бесконечных запросов при сбое */
export const REVISION_RETRY_MS = 30_000;

/**
 * idle — профиль ещё не запрашивали (до входа или после выхода); loading — первая загрузка;
 * ready — профиль получен; error — профиль получить не удалось, видно только ядро
 */
export type FeatureStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Ответ GET /api/features (раздел 6.7 проекта) после проверки */
export interface FeatureProfile {
  /** Пресет потолка: isolated, standard, full */
  preset: string | null;
  /** Откуда пресет: file, default (файла потолка нет — изолированный минимум), env (режим разработчика) */
  presetSource: string | null;
  /** Ревизия профиля: первые 12 знаков отпечатка + версия переключателей; та же — в заголовке X-AWMS-Features */
  revision: string | null;
  /** Состояние функций как прислал сервер (только логические значения) */
  features: Readonly<Record<string, boolean>>;
  /**
   * Состояние функций на установке без учёта ролей пользователя (потолок, зависимости, переключатели);
   * null — сервер поле не прислал. По нему чистится браузер: false «по роли» не значит, что функции на
   * установке нет, и не должен стирать данные других пользователей общего ПК
   */
  installation: Readonly<Record<string, boolean>> | null;
  /** Таймауты автоблокировки из профиля установки; null — не заданы, действуют значения интерфейса */
  ui: { inactivityMinutes: number | null; warningMinutes: number | null };
  /** Пользователю доступна страница «Безопасность» */
  canViewSecurity: boolean;
  /** Пользователю доступны переключатели администратора (этап 2) */
  canManage: boolean;
}

export interface FeatureSnapshot {
  status: FeatureStatus;
  /** Последний полученный профиль; при сбое обновления остаётся прежним */
  profile: FeatureProfile | null;
  /** Включённые функции с учётом сборки, родителей и зависимостей */
  on: ReadonlySet<FeatureKey>;
  /** Время получения профиля (Date.now()) */
  loadedAt: number | null;
  /** Время завершения последнего запроса профиля, удачного или нет: ограничивает повторы после сбоя */
  attemptedAt: number | null;
  /** Идёт запрос профиля */
  pending: boolean;
  /** Сколько раз состав функций менялся после первой загрузки — для уведомления «Состав функций изменён» */
  changes: number;
  /**
   * Сколько изменений пользователь уже видел. Хранится здесь, а не в компоненте: FeatureProvider
   * размонтируется на время экрана блокировки, и уведомление не должно возвращаться после разблокировки
   */
  changesSeen: number;
  /** Пользователь скрыл плашку «Профиль функций установки не задан» (до выхода) */
  presetNoticeHidden: boolean;
}

/** HTTP-клиент профиля: подходит экземпляр Axios (AxiosService) */
export interface FeatureHttp {
  get(url: string): Promise<{ data: unknown }>;
}

const NOTHING_ON: ReadonlySet<FeatureKey> = new Set();

const INITIAL: FeatureSnapshot = {
  status: 'idle',
  profile: null,
  on: NOTHING_ON,
  loadedAt: null,
  attemptedAt: null,
  pending: false,
  changes: 0,
  changesSeen: 0,
  presetNoticeHidden: false,
};

let snapshot: FeatureSnapshot = INITIAL;
const listeners = new Set<() => void>();

let http: FeatureHttp | null = null;
let inflight: Promise<boolean> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshWaiters: Array<(ok: boolean) => void> = [];
/** Поколение хранилища: ответ, пришедший после resetFeatures (выход), не применяется */
let generation = 0;
let lastRevisionTrigger: { revision: string; at: number } | null = null;
/**
 * Ревизия из заголовка ответа, пришедшего, пока шёл запрос профиля (в том числе ответа самого /api/features:
 * сервер ставит заголовок и на него). Сверяется с полученным профилем, а не порождает второй запрос
 */
let revisionSeenWhilePending: string | null = null;

const setSnapshot = (next: FeatureSnapshot) => {
  snapshot = next;
  listeners.forEach(listener => listener());
};

// ---------- Разбор ответа ----------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

const minutes = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

/** Только логические значения; не объект — null */
const flags = (value: unknown): Record<string, boolean> | null => {
  if (!isRecord(value)) return null;
  const result: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(value)) {
    if (typeof flag === 'boolean') result[key] = flag;
  }
  return result;
};

/** Проверка ответа /api/features. Без объекта features ответ не принимается (старый сервер, страница ошибки) */
export const parseFeatureProfile = (data: unknown): FeatureProfile => {
  const features = isRecord(data) ? flags(data.features) : null;
  if (!isRecord(data) || features === null) throw new Error('Ответ /api/features без объекта features');
  const ui = isRecord(data.ui) ? data.ui : {};
  return {
    preset: text(data.preset),
    presetSource: text(data.presetSource),
    revision: text(data.revision),
    features,
    installation: flags(data.installation),
    ui: { inactivityMinutes: minutes(ui.inactivityMinutes), warningMinutes: minutes(ui.warningMinutes) },
    canViewSecurity: data.canViewSecurity === true,
    canManage: data.canManage === true,
  };
};

/**
 * Включённые функции: сервер прислал ровно true, модуль есть в сборке, включены родитель и зависимости.
 * Ключи, которых нет в каталоге, не попадают никуда
 */
export const resolveEnabledFeatures = (
  features: Readonly<Record<string, unknown>>,
  inBuildFn: (key: FeatureKey) => boolean = inBuild,
): ReadonlySet<FeatureKey> => {
  const memo = new Map<FeatureKey, boolean>();
  const enabled = (key: FeatureKey): boolean => {
    const known = memo.get(key);
    if (known !== undefined) return known;
    memo.set(key, false); // защита от цикла: каталог без циклов проверяет тест, но и здесь цикл = выключено
    const parent = featureParent(key);
    const value =
      inBuildFn(key) &&
      features[key] === true &&
      (parent === null || enabled(parent)) &&
      (FEATURE_REQUIRES[key] ?? []).every(enabled);
    memo.set(key, value);
    return value;
  };
  return new Set(FEATURE_KEYS.filter(enabled));
};

const sameSet = (a: ReadonlySet<FeatureKey>, b: ReadonlySet<FeatureKey>): boolean =>
  a.size === b.size && [...a].every(key => b.has(key));

// ---------- Загрузка ----------

/**
 * Клиент для запроса профиля; null — AxiosService (обновление токена, CSRF — как у остальных запросов).
 * Подменяют его тесты. AxiosService, в свою очередь, читает хранилище в перехватчиках (ревизия, 404): кольцо
 * импортов безопасно, пока ни один из модулей не обращается к другому при загрузке, только из функций
 */
export const connectFeatureHttp = (client: FeatureHttp | null) => {
  http = client;
};

const applyProfile = (profile: FeatureProfile) => {
  const on = resolveEnabledFeatures(profile.features);
  const first = snapshot.profile === null;
  const changed = !first && !sameSet(on, snapshot.on);
  const now = Date.now();
  setSnapshot({
    ...snapshot,
    status: 'ready',
    profile,
    // Прежний объект, если состав не изменился: подписчики с селекторами не перерисовываются зря. Первый
    // профиль (в том числе после сбоя загрузки) — всегда новый объект: по нему перепроверяются вкладки
    on: first || changed ? on : snapshot.on,
    loadedAt: now,
    attemptedAt: now,
    pending: false,
    changes: snapshot.changes + (changed ? 1 : 0),
  });
  try {
    // Состояние на установке, если сервер его прислал; иначе — флаги пользователя (см. FeatureProfile.installation)
    purgeDisabledFeatureStorage(profile.installation ?? profile.features);
  } catch (error) {
    console.warn('Не удалось удалить данные выключенных функций из браузера', error);
  }
};

const request = (): Promise<boolean> => {
  if (inflight) return inflight;
  const started = generation;
  // «Загрузка» — только первая: при повторе после ошибки и при обновлении приложение не прячется за прелоадер
  setSnapshot({ ...snapshot, status: snapshot.status === 'idle' ? 'loading' : snapshot.status, pending: true });
  const run = async (): Promise<boolean> => {
    try {
      const client: FeatureHttp = http ?? AxiosService;
      const { data } = await client.get(FEATURES_API);
      const profile = parseFeatureProfile(data);
      if (started !== generation) return false;
      applyProfile(profile);
      return true;
    } catch (error) {
      if (started !== generation) return false;
      console.warn('Профиль функций не получен', error);
      // Профиль уже был — сервер его не отзывал, оставляем; не было — закрытый режим: только ядро
      setSnapshot({ ...snapshot, status: snapshot.profile ? 'ready' : 'error', pending: false, attemptedAt: Date.now() });
      return false;
    }
  };
  // run() не отклоняется: сбой — false. Снимаем inflight здесь, сверяя с самим запросом: после выхода
  // (resetFeatures) мог начаться новый, и его трогать нельзя
  const current: Promise<boolean> = run().then(ok => {
    if (inflight === current) inflight = null;
    if (started !== generation) return ok;
    // Пока шёл запрос, ответ API принёс ревизию. Та же, что у полученного профиля (обычно это ответ самого
    // /api/features), — ничего не делаем; другая (функцию переключили во время запроса) — обычная реакция.
    // Запрос не удался — забываем: следующий ответ API повторит заголовок
    const seen = revisionSeenWhilePending;
    revisionSeenWhilePending = null;
    if (ok && seen !== null) noteFeaturesRevision(seen);
    return ok;
  });
  inflight = current;
  return current;
};

/** Загрузить профиль (после входа и проверки сессии). Параллельные вызовы делят один запрос. true — получен */
export const loadFeatures = (): Promise<boolean> => request();

/**
 * Обновить профиль: ответ API принёс новую ревизию, функция ответила 404, вкладка вернулась из фона.
 * Вызовы в пределах REFRESH_DEBOUNCE_MS дают один запрос. Пока профиль ни разу не запрашивали — ничего не делает
 */
export const refreshFeatures = (): Promise<boolean> => {
  if (snapshot.status === 'idle') return Promise.resolve(false);
  return new Promise(resolve => {
    refreshWaiters.push(resolve);
    if (refreshTimer !== null) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      const waiters = refreshWaiters;
      refreshWaiters = [];
      request().then(
        ok => waiters.forEach(done => done(ok)),
        () => waiters.forEach(done => done(false)),
      );
    }, REFRESH_DEBOUNCE_MS);
  });
};

/** Обновить профиль, если он старше maxAgeMs (при возвращении вкладки браузера из фона) */
export const refreshIfStale = (maxAgeMs: number): Promise<boolean> => {
  const { status, loadedAt } = snapshot;
  if (status === 'idle' || status === 'loading') return Promise.resolve(false);
  if (loadedAt !== null && Date.now() - loadedAt < maxAgeMs) return Promise.resolve(false);
  return refreshFeatures();
};

/**
 * Значение заголовка X-AWMS-Features из ответа API. Ревизия отличается от известной — сервер перезапущен
 * с другим потолком или администратор переключил функцию: профиль перезапрашивается. true — запрос назначен
 */
export const noteFeaturesRevision = (revision: string | null | undefined): boolean => {
  if (!revision || snapshot.status === 'idle') return false;
  if (snapshot.pending) {
    // Ответ идущего запроса и так несёт свежую ревизию: сверим заголовок с ним, когда он придёт (request)
    revisionSeenWhilePending = revision;
    return false;
  }
  if (snapshot.profile !== null && revision === snapshot.profile.revision) return false;
  const now = Date.now();
  if (lastRevisionTrigger && lastRevisionTrigger.revision === revision && now - lastRevisionTrigger.at < REVISION_RETRY_MS) {
    return false;
  }
  lastRevisionTrigger = { revision, at: now };
  void refreshFeatures();
  return true;
};

/** Сброс при выходе пользователя: флаги зависят от роли, следующий вход загрузит профиль заново */
export const resetFeatures = () => {
  generation++;
  inflight = null;
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = null;
  refreshWaiters.forEach(done => done(false));
  refreshWaiters = [];
  lastRevisionTrigger = null;
  revisionSeenWhilePending = null;
  setSnapshot(INITIAL);
};

/** Пользователь увидел уведомление об изменении состава функций (кнопка «Понятно» или таймер) */
export const acknowledgeFeatureChanges = (upTo: number = snapshot.changes) => {
  const seen = Math.min(Math.max(upTo, snapshot.changesSeen), snapshot.changes);
  if (seen !== snapshot.changesSeen) setSnapshot({ ...snapshot, changesSeen: seen });
};

/** Скрыть плашку «Профиль функций установки не задан» до выхода пользователя */
export const hidePresetNotice = () => {
  if (!snapshot.presetNoticeHidden) setSnapshot({ ...snapshot, presetNoticeHidden: true });
};

// ---------- Чтение ----------

export const subscribeFeatures = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getFeatureSnapshot = (): FeatureSnapshot => snapshot;

/** Функция включена для текущего пользователя */
export const isFeatureOn = (key: FeatureKey): boolean => snapshot.on.has(key);

/** Функции, которые есть в сборке вместе с родителями и зависимостями (вычисляется при первом обращении) */
let buildable: ReadonlySet<FeatureKey> | null = null;

/**
 * Функция точно выключена: профиль получен и в нём она выключена, или её (родителя, зависимости) нет в сборке.
 * Пока профиля нет (не загружен или не получен из-за сбоя), состояние неизвестно — false. Различие важно там,
 * где решение необратимо: сохранённую вкладку раздела отбрасывают, только если функция точно выключена
 * (routes.isPathKnownOff). Показывать раздел, пока профиль не получен, всё равно нельзя — isFeatureOn
 */
export const isFeatureKnownOff = (key: FeatureKey): boolean => {
  if (snapshot.profile !== null) return !snapshot.on.has(key);
  if (buildable === null) buildable = resolveEnabledFeatures(Object.fromEntries(FEATURE_KEYS.map(k => [k, true])));
  return !buildable.has(key);
};

/** Ревизия текущего профиля; null — профиля нет */
export const featuresRevision = (): string | null => snapshot.profile?.revision ?? null;

const allOn = (when: FeatureKey | readonly FeatureKey[]): boolean =>
  typeof when === 'string' ? isFeatureOn(when) : when.every(isFeatureOn);

/** Хук: функция включена (для массива — включены все) */
export const useFeature = (when: FeatureKey | readonly FeatureKey[]): boolean =>
  useSyncExternalStore(subscribeFeatures, () => allOn(when));

/** Хук: снимок хранилища целиком (статус, профиль, включённые функции) */
export const useFeatureSnapshot = (): FeatureSnapshot => useSyncExternalStore(subscribeFeatures, getFeatureSnapshot);

/** Хук: статус загрузки профиля */
export const useFeatureStatus = (): FeatureStatus => useSyncExternalStore(subscribeFeatures, () => snapshot.status);
