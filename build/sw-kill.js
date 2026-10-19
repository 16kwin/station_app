// sw-kill.js — ликвидатор service worker для варианта поставки без PWA (раздел 8.4 проекта «Дискретное
// отключение функций»). Плагин варианта (build/awmsBuildVariant.ts) кладёт этот файл в сборку вместо sw.js.
// Просто удалить sw.js нельзя: на 404 браузер оставляет прежнюю регистрацию, и рабочие места (ТСД, общие ПК)
// продолжали бы получать из кэша оболочку и чанки прежней полной сборки — с кодом видео, 3D и графа.
// Браузер находит новый sw.js по изменившимся байтам, ставит ликвидатор сразу (skipWaiting), тот удаляет все
// кэши awms-*, снимает регистрацию и перезагружает открытые вкладки — они открываются уже из сети, без SW.
// Обработчика fetch нет: пока ликвидатор активен, запросы идут в сеть как без service worker.
// Метка для build/verify-dist.mjs: AWMS_SW_KILL
'use strict';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('awms-')).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    // Вкладку, которую браузер не даёт перезагрузить (не под этим SW), пропускаем: она уйдёт без SW при следующем открытии
    await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => undefined)));
  })());
});
