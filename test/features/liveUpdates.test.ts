// liveUpdates.test.ts — клиент живых обновлений следует за функцией websocket (разделы 4.2 и 8.1 проекта):
// открывается, когда функция включилась (в том числе когда профиль не получен — как до выключателей),
// и закрывается, когда выключилась.
// Библиотеки STOMP и SockJS подменены заглушками (test/stubs), сети нет.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { connectFeatureHttp, loadFeatures, refreshFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { connectLiveUpdates } from '../../src/services/liveUpdatesClient';
import { stompClients } from '../stubs/stompjs';
import SockJS from '../stubs/sockjs-client';
import { profile, stubHttp, waitFor } from './helpers';

const browser = globalThis as { window?: unknown; config?: unknown };

const settle = () => new Promise(resolve => setTimeout(resolve, 30));

beforeEach(() => {
  resetFeatures();
  stompClients.length = 0;
  mock.method(console, 'warn', () => {});
  // Адрес соединения: window.config.ip_api + /ws-stations относительно страницы
  browser.window = { location: { href: 'http://awms.local/main' } };
  browser.config = { ip_api: 'http://awms.local:8084' };
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
  delete browser.window;
  delete browser.config;
});

describe('живые обновления и функция websocket', () => {
  test('профиль не получен — работает как до выключателей: соединение открыто; профиль выключил websocket — закрыто без нового монтирования', async () => {
    connectFeatureHttp(stubHttp(new Error('нет связи'), profile('r1', { websocket: false })));
    assert.equal(await loadFeatures(), false);
    const received: unknown[] = [];
    const connection = connectLiveUpdates({ name: 'тест', topics: { '/topic/orders/refresh': data => received.push(data) } });
    try {
      await waitFor(() => stompClients.length === 1 && stompClients[0].active);
      const client = stompClients[0];
      assert.ok(client.socket instanceof SockJS);
      assert.equal(client.socket.url, 'http://awms.local:8084/ws-stations');

      // Подписка на темы — после соединения; тело сообщения разбирается как JSON
      client.config.onConnect?.();
      client.subscriptions.get('/topic/orders/refresh')?.({ body: '{"uid":"a1"}' });
      assert.deepEqual(received, [{ uid: 'a1' }]);

      assert.equal(await loadFeatures(), true);
      assert.equal(client.active, false, 'профиль пришёл и выключил websocket — соединение закрыто');
      await settle();
      assert.equal(stompClients.length, 1, 'нового соединения нет');
    } finally {
      connection.close();
      connection.close();
    }
  });

  test('функцию выключили — соединение закрыто; включили снова — открыто', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { websocket: true }), profile('r2', { websocket: false }), profile('r3', { websocket: true })));
    await loadFeatures();
    const connection = connectLiveUpdates({ topics: {} });
    await waitFor(() => stompClients.length === 1 && stompClients[0].active);

    await refreshFeatures();
    assert.equal(stompClients[0].active, false, 'выключили — закрыто, страницу размонтировать не нужно');

    await refreshFeatures();
    await waitFor(() => stompClients.length === 2 && stompClients[1].active);
    connection.close();
    assert.equal(stompClients[1].active, false);
  });

  test('закрыто до загрузки библиотек — клиент не создаётся; после close() включение не открывает', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { websocket: false }), profile('r2', { websocket: true })));
    await loadFeatures();
    const first = connectLiveUpdates({ topics: {} });
    first.close();
    await refreshFeatures();
    await settle();
    assert.equal(stompClients.length, 0, 'закрытое соединение за функцией больше не следит');

    const second = connectLiveUpdates({ topics: {} });
    second.close();
    await settle();
    assert.equal(stompClients.length, 0, 'закрыто раньше, чем догрузились библиотеки');
  });
});
