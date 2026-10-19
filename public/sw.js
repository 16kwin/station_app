// sw.js — service worker «Динамики»: своя страница «нет связи», кэш статики, обновление по кнопке.
// Без библиотек. API, WebSocket, файлы, видео и служебные запросы dev-сервера Vite не перехватываются —
// они идут в сеть так же, как без service worker.
'use strict';

// Идентификатор сборки: `vite build` подставляет вместо метки время сборки (плагин в vite.config.ts),
// поэтому каждая выкатка даёт новый sw.js — браузер находит обновление и показывает «Доступна новая версия».
// Кэш оболочки привязан к сборке: при активации новой версии кэши прежних сборок удаляются.
// В dev-режиме метка остаётся как есть.
const BUILD_ID = '__AWMS_BUILD_ID__';
const SHELL_CACHE = 'awms-shell-' + BUILD_ID;
// Кэш статики общий для сборок: файлы /assets/ с хешем в имени не меняются, а вкладка на прежней сборке
// после обновления в соседней вкладке догружает из него свои чанки. Размер ограничен STATIC_MAX_ENTRIES,
// сбросить его целиком — поднять номер.
const STATIC_CACHE = 'awms-static-v1';
const OFFLINE_URL = '/offline.html';

/** Оболочка: нужна, чтобы без связи показать свою страницу вместо ошибки браузера */
const SHELL = [
  OFFLINE_URL,
  '/manifest.json',
  '/config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/icons/favicon-48.png',
];
/** Файлы оболочки, которые могут меняться без смены имени: сначала сеть, кэш — только без связи */
const NETWORK_FIRST = new Set(['/manifest.json', '/config.js']);

const NAV_TIMEOUT_MS = 10000;
const STATIC_MAX_ENTRIES = 120;
const STATIC_MAX_ENTRY_BYTES = 6 * 1024 * 1024;

/**
 * Пути, которые не перехватываем совсем (префикс целиком или с подпутём).
 * /vendor — чтение STEP (occt): JS и .wasm должны быть из одной версии. .wasm (7,6 МБ) больше лимита кэша
 * и без связи недоступен в любом случае, поэтому JS тоже не кэшируем — все файлы идут в сеть вместе.
 */
const BYPASS = ['/api', '/csrf', '/ws', '/ws-stations', '/uploads', '/src', '/node_modules', '/sw.js', '/vendor'];
const STATIC_EXT = /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico)$/i;
const MEDIA_EXT = /\.(?:mp4|webm|m4v|mov|mkv|avi|m3u8|ts|mp3|wav|ogg)$/i;

const isBypassed = (path) =>
  // /@vite, /@react-refresh, /@fs, /@id, /__vite… — служебное dev-сервера
  path.startsWith('/@') || path.startsWith('/__') ||
  BYPASS.some((p) => path === p || path.startsWith(p + '/'));

self.addEventListener('install', (event) => {
  // skipWaiting здесь нет: новая версия ждёт, пока пользователь не нажмёт «Обновить»
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, STATIC_CACHE];
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('awms-') && !keep.includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) return;
  if (isBypassed(url.pathname)) return;
  if (req.destination === 'video' || req.destination === 'audio' || MEDIA_EXT.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    event.respondWith(navigate(req));
    return;
  }
  // Всё с параметрами (?import, ?t=, ?v= — модули и HMR dev-сервера) — мимо
  if (url.search) return;
  if (NETWORK_FIRST.has(url.pathname)) {
    event.respondWith(networkFirst(event, req));
    return;
  }
  if (STATIC_EXT.test(url.pathname)) {
    // /assets/* — файлы сборки с хешем в имени, не меняются; остальная статика обновляется в фоне
    event.respondWith(cacheFirst(event, req, !url.pathname.startsWith('/assets/')));
  }
});

/** Навигация: сеть с таймаутом; без связи или при ошибке шлюза — /offline.html */
async function navigate(req) {
  let timer;
  try {
    // Таймаут через гонку: запрос навигации нельзя пересоздать с AbortSignal
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS); }),
    ]);
    if (res.status === 502 || res.status === 503 || res.status === 504) return offlinePage();
    return res;
  } catch {
    return offlinePage();
  } finally {
    clearTimeout(timer);
  }
}

async function offlinePage() {
  const cached = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE });
  return cached || new Response('<!doctype html><meta charset="utf-8"><title>Нет связи</title><h1>Нет связи с сервером AWMS</h1>', {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function networkFirst(event, req) {
  try {
    const res = await fetch(req);
    if (isCacheable(res)) {
      const copy = res.clone();
      event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy)).catch(() => {}));
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req, { cacheName: SHELL_CACHE });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(event, req, revalidate) {
  const cached = await caches.match(req);
  if (cached) {
    if (revalidate) event.waitUntil(fetchAndStore(event, req).catch(() => {}));
    return cached;
  }
  return fetchAndStore(event, req);
}

/** Сеть; удачный ответ кладётся в кэш в фоне — страница получает файл, не дожидаясь записи */
async function fetchAndStore(event, req) {
  const res = await fetch(req);
  if (isCacheable(res)) event.waitUntil(putStatic(req, res.clone()).catch(() => {}));
  return res;
}

/** Кэшируем только полноценный ответ своего сервера; HTML-заглушку SPA вместо файла — нет */
function isCacheable(res) {
  if (res.status !== 200 || res.type !== 'basic') return false;
  const type = res.headers.get('content-type') || '';
  if (type.startsWith('video/') || type.startsWith('audio/') || type.startsWith('text/html')) return false;
  return !/no-store/i.test(res.headers.get('cache-control') || '');
}

/**
 * Кладёт файл в кэш, если он не больше лимита. Файлы оболочки обновляются в своём кэше,
 * в кэше статики самые старые записи сверх лимита удаляются.
 */
async function putStatic(req, res) {
  const declared = Number(res.headers.get('content-length'));
  if (declared > STATIC_MAX_ENTRY_BYTES) return;
  if (!declared) {
    // Размер неизвестен (сжатие на лету) — измеряем копию
    const size = (await res.clone().arrayBuffer()).byteLength;
    if (size > STATIC_MAX_ENTRY_BYTES) return;
  }
  const inShell = SHELL.includes(new URL(req.url).pathname);
  const cache = await caches.open(inShell ? SHELL_CACHE : STATIC_CACHE);
  await cache.put(req, res);
  if (inShell) return;
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - STATIC_MAX_ENTRIES; i++) await cache.delete(keys[i]);
}
