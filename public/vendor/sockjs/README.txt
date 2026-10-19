sockjs-client 1.6.1 — клиент SockJS для страницы-посредника (iframe) сервера живых обновлений /ws-stations.
Сервер (WebSocketConfig, setClientLibraryUrl) указывает браузеру брать клиент отсюда, а не с CDN: в закрытом
контуре внешних адресов нет. Приложение само этот файл не грузит — его клиент собирается из пакета npm.
Вариант поставки без живых обновлений (функция websocket) этот каталог удаляет.

Лицензия: MIT (LICENSE.sockjs-client.txt). Файл скопирован без изменений: SHA-256 совпадает с
node_modules/sockjs-client/dist/sockjs.min.js.

Источник: пакет npm sockjs-client@1.6.1 (каталог dist).
При обновлении пакета скопируйте сюда заново dist/sockjs.min.js и LICENSE.
