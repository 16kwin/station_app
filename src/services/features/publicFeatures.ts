// publicFeatures.ts — флаги, которые нужны до входа (pwa, passwords): анонимный GET /api/features/public.
// Запрос идёт мимо AxiosService: на старом сервере без этого адреса аноним получает 403, а перехватчик Axios
// на 401/403 обновляет токен и уводит на /login — до входа это лишнее. При любой ошибке оба флага выключены,
// а loaded = false: регистрация service worker при сбое ничего не меняет (сбой может быть временным, раздел 8.4).
import type { PublicFeatureKey } from './catalog';
import { inBuild } from './buildFlags';

export const PUBLIC_FEATURES_API = '/api/features/public';

/** Ответ дольше этого считается ошибкой: от него зависит запуск приложения (bootstrapPwa) */
export const PUBLIC_FEATURES_TIMEOUT_MS = 5000;

export type PublicFeatures = Readonly<Record<PublicFeatureKey, boolean>> & {
  /** Ответ сервера получен и разобран; false — сбой запроса, флаги выключены */
  loaded: boolean;
  revision: string | null;
};

const FAILED: PublicFeatures = { loaded: false, revision: null, pwa: false, passwords: false };

/** Разбор ответа: флаг включён, только если сервер прислал true и модуль есть в сборке */
export const parsePublicFeatures = (data: unknown): PublicFeatures => {
  if (typeof data !== 'object' || data === null) return FAILED;
  const body = data as { revision?: unknown; features?: unknown };
  if (typeof body.features !== 'object' || body.features === null) return FAILED;
  const features = body.features as Record<string, unknown>;
  const flag = (key: PublicFeatureKey) => features[key] === true && inBuild(key);
  return {
    loaded: true,
    revision: typeof body.revision === 'string' && body.revision !== '' ? body.revision : null,
    pwa: flag('pwa'),
    passwords: flag('passwords'),
  };
};

const apiBase = (): string => {
  const config = (globalThis as { config?: { ip_api?: unknown } }).config;
  return typeof config?.ip_api === 'string' ? config.ip_api : '';
};

/** Запрос без кэша и без куки: адрес анонимный, ответу из кэша service worker'а или браузера верить нельзя */
export const fetchPublicFeatures = async (fetchFn: typeof fetch = fetch, base: string = apiBase()): Promise<PublicFeatures> => {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), PUBLIC_FEATURES_TIMEOUT_MS) : null;
  try {
    const response = await fetchFn(base + PUBLIC_FEATURES_API, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });
    if (!response.ok) return FAILED;
    return parsePublicFeatures(await response.json());
  } catch {
    return FAILED;
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
};

let cached: Promise<PublicFeatures> | null = null;

/** Публичные флаги — один запрос на загрузку страницы (их читают и запуск PWA, и страница входа) */
export const loadPublicFeatures = (): Promise<PublicFeatures> => {
  if (!cached) {
    cached = fetchPublicFeatures().then(result => {
      // Сбой не запоминаем: следующий вызов (например, на странице входа) попробует ещё раз
      if (!result.loaded) cached = null;
      return result;
    });
  }
  return cached;
};
