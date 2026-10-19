// awms-build.d.ts — флаги варианта поставки (раздел 8.5 проекта «Дискретное отключение функций»).
// Значения подставляет сборка (define в vite.config.ts, позже — плагин варианта F7): true — модуль в сборке,
// false — кода модуля в дистрибутиве нет. Проверять флаг нужно прямо у import(), иначе чанк не вырежется.

/** Видео с IP-камер: каталог VideoArchive/ */
declare const __AWMS_HAS_VIDEO__: boolean;
/** 3D-модели номенклатуры: каталог Model3D/, three.js, occt-import-js, vendor/occt */
declare const __AWMS_HAS_MODEL3D__: boolean;
/** Карта станций и план цеха: каталог StationMap/ */
declare const __AWMS_HAS_MAP__: boolean;
/** Граф закупок и аффилированности: каталог purchaseGraph/, d3-force */
declare const __AWMS_HAS_GRAPH__: boolean;
/** Заказы и ТКП: каталог AnalyticsPage/ */
declare const __AWMS_HAS_ORDERS__: boolean;
/** Живые обновления: @stomp/stompjs, sockjs-client, vendor/sockjs */
declare const __AWMS_HAS_WEBSOCKET__: boolean;
/** Установка как приложение: service worker, манифест */
declare const __AWMS_HAS_PWA__: boolean;
/** Вкладки «Интеграции» карточек номенклатуры, поставщика и производителя */
declare const __AWMS_HAS_INTEGRATIONS__: boolean;
