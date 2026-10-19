// config.js — адрес API. Классический скрипт: выполняется раньше модуля приложения.
(function () {
  var host = window.location.hostname;
  // Частные адреса локальной сети: 192.168.x.x, 10.x.x.x, 172.16–31.x.x
  var isLan = /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  var apiUrl;
  if (host === 'localhost' || host === '127.0.0.1') {
    // Локальная разработка — как раньше: прокси (nginx или Vite) на 80-м порту
    apiUrl = 'http://localhost';
  } else if (isLan) {
    // Локальная сеть: API на том же адресе и порту, с которого открыта страница (прокси /api, /csrf, /ws*
    // на том же хосте). Раньше здесь был http://localhost — с телефона по сети запросы уходили на сам телефон.
    apiUrl = window.location.protocol + '//' + window.location.host;
  } else {
    // Внешний домен — как раньше
    apiUrl = window.location.protocol + '//' + window.location.hostname;
  }
  window.config = { ip_api: apiUrl };
})();
