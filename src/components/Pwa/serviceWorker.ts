// serviceWorker.ts — регистрация service worker и обновление по кнопке: новая версия ставится в фоне
// и ждёт; пользователь жмёт «Обновить» → SKIP_WAITING → одна перезагрузка при смене контроллера.
// Перезагружается только вкладка, где нажали кнопку: в остальных могут быть несохранённые данные.
// Регистрирует и снимает SW bootstrapPwa.ts по флагу установки pwa; снятие (disable) нужно и сборке без PWA.
import { useSyncExternalStore } from 'react';

const SW_URL = '/sw.js';
/** Плановая проверка новой версии: страницы станций держат открытыми сутками */
const UPDATE_CHECK_MS = 30 * 60 * 1000;
/** При возврате на вкладку — не чаще этого */
const UPDATE_THROTTLE_MS = 5 * 60 * 1000;

export interface UpdateState {
  /** Новая версия установлена и ждёт */
  available: boolean;
  /** Пользователь нажал «Обновить», ждём смены контроллера */
  updating: boolean;
}

let state: UpdateState = { available: false, updating: false };
let waiting: ServiceWorker | null = null;
let reloading = false;
const listeners = new Set<() => void>();

const setState = (patch: Partial<UpdateState>) => {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const SERVER_STATE: UpdateState = { available: false, updating: false };

/** Состояние обновления для компонентов */
export const useUpdateState = (): UpdateState => useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);

/** Запоминаем ожидающую версию; если её активировали из другой вкладки — уведомление убираем */
const watchWaiting = (worker: ServiceWorker) => {
  waiting = worker;
  setState({ available: true });
  worker.addEventListener('statechange', () => {
    if ((worker.state === 'activated' || worker.state === 'redundant') && waiting === worker && !state.updating) {
      waiting = null;
      setState({ available: false });
    }
  });
};

const watchInstalling = (worker: ServiceWorker) => {
  worker.addEventListener('statechange', () => {
    // installed при уже работающем SW — обновление ждёт; без controller это первая установка, она активируется сама
    if (worker.state === 'installed' && navigator.serviceWorker.controller) watchWaiting(worker);
  });
};

const track = (registration: ServiceWorkerRegistration) => {
  if (registration.waiting && navigator.serviceWorker.controller) watchWaiting(registration.waiting);
  if (registration.installing) watchInstalling(registration.installing);
  registration.addEventListener('updatefound', () => {
    if (registration.installing) watchInstalling(registration.installing);
  });

  let lastCheck = Date.now();
  const check = () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    if (Date.now() - lastCheck < UPDATE_THROTTLE_MS) return;
    lastCheck = Date.now();
    registration.update().catch(() => undefined);
  };
  window.setInterval(check, UPDATE_CHECK_MS);
  document.addEventListener('visibilitychange', check);
};

/**
 * Регистрации SW есть только в безопасном контексте (HTTPS, localhost). По HTTP в ЛВС navigator.serviceWorker
 * нет вовсе: обращение к нему без проверки уронило бы запуск
 */
export const canUseServiceWorker = (): boolean =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && window.isSecureContext;

/** Что снимает disable(): регистрации SW и кэши; null — в этом браузере или контексте их нет */
export interface PwaCleanupTargets {
  serviceWorker: Pick<ServiceWorkerContainer, 'getRegistrations'> | null;
  caches: Pick<CacheStorage, 'keys' | 'delete'> | null;
}

export interface PwaCleanupResult {
  /** Сколько регистраций снято */
  registrations: number;
  /** Удалённые кэши awms-* */
  caches: string[];
}

const browserTargets = (): PwaCleanupTargets => ({
  serviceWorker: canUseServiceWorker() ? navigator.serviceWorker : null,
  // Кэши чистим независимо от проверки SW: они могли остаться от прежней регистрации
  caches: typeof window !== 'undefined' && 'caches' in window ? window.caches : null,
});

/**
 * Снять service worker и удалить кэши awms-* (оболочка, статика, чанки модулей): PWA выключена на установке,
 * её нет в сборке или поддержка открыла адрес с ?sw=off. Страница, которой SW уже управляет, остаётся под ним
 * до перезагрузки; следующая загрузка идёт мимо него и снова вызывает disable() — до кэшей, созданных за это
 * время, тоже дойдёт очередь. Не отклоняется: сбой (запрет данных сайта) — просто ничего не снято
 */
export async function disable(reason: string, targets: PwaCleanupTargets = browserTargets()): Promise<PwaCleanupResult> {
  const result: PwaCleanupResult = { registrations: 0, caches: [] };
  const { serviceWorker, caches: cacheStorage } = targets;
  try {
    if (serviceWorker) {
      const registrations = await serviceWorker.getRegistrations();
      const removed = await Promise.all(registrations.map(registration => registration.unregister().catch(() => false)));
      result.registrations = removed.filter(Boolean).length;
    }
  } catch {
    // регистрации недоступны — снимать нечего
  }
  try {
    if (cacheStorage) {
      const keys = (await cacheStorage.keys()).filter(key => key.startsWith('awms-'));
      const deleted = await Promise.all(keys.map(key => cacheStorage.delete(key).catch(() => false)));
      result.caches = keys.filter((_, i) => deleted[i]);
    }
  } catch {
    // хранилище кэшей недоступно — удалять нечего
  }
  // Пишем, только если что-то было: при каждой загрузке с выключенной PWA консоль остаётся чистой
  if (result.registrations > 0 || result.caches.length > 0) {
    console.info(`[PWA] service worker отключён (${reason}): снято регистраций ${result.registrations}, удалено кэшей ${result.caches.length}`);
  }
  return result;
}

let registered = false;

/** Регистрация после загрузки страницы, чтобы не отнимать сеть у первого запуска. Аварийный ?sw=off — в bootstrapPwa */
export function registerServiceWorker(): void {
  if (!canUseServiceWorker() || registered) return;
  registered = true;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!state.updating || reloading) return;
    reloading = true;
    window.location.reload();
  });

  const register = () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .then(track)
      .catch((error: unknown) => console.warn('[PWA] service worker не зарегистрирован:', error));
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** Кнопка «Обновить»: активировать ожидающую версию, перезагрузка — по controllerchange */
export function applyUpdate(): void {
  const worker = waiting;
  if (!worker || state.updating) return;
  setState({ updating: true });
  if (worker.state === 'activated') {
    // Уже активировали из другой вкладки — смены контроллера здесь не будет
    reloading = true;
    window.location.reload();
    return;
  }
  worker.postMessage({ type: 'SKIP_WAITING' });
}
