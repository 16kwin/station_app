// ordersApi.test.ts — адреса заказов и ТКП и их живые обновления (пакет F5): соединение идёт через общий клиент
// на сервер API из window.config (а не на http://localhost:8085), только при функции websocket; любое сообщение
// трёх тем перечитывает список. Библиотеки STOMP и SockJS подменены заглушками (test/stubs), сети нет.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { connectFeatureHttp, loadFeatures, refreshFeatures, resetFeatures } from '../../src/services/features/featureStore';
import {
  ORDERS_API,
  ORDERS_LIVE_TOPICS,
  TKP_API,
  connectOrdersLive,
  ordersListUrl,
  tkpListUrl,
} from '../../src/components/AnalyticsPage/api';
import { stompClients } from '../stubs/stompjs';
import { profile, stubHttp, waitFor } from '../features/helpers';

const browser = globalThis as { window?: unknown; config?: unknown };

const settle = () => new Promise(resolve => setTimeout(resolve, 30));

beforeEach(() => {
  resetFeatures();
  stompClients.length = 0;
  mock.method(console, 'warn', () => {});
  browser.window = { location: { href: 'http://awms.local/orders' } };
  browser.config = { ip_api: 'http://awms.local' };
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
  delete browser.window;
  delete browser.config;
});

describe('адреса заказов и ТКП', () => {
  test('списки и карточки — те же адреса, что были в ConstantInfo', () => {
    assert.equal(ordersListUrl('active'), '/api/orders/active');
    assert.equal(ordersListUrl('closed'), '/api/orders/closed');
    assert.equal(ORDERS_API.order('a1'), '/api/orders/a1');
    assert.equal(tkpListUrl('active'), '/api/tkp/active');
    assert.equal(tkpListUrl('closed'), '/api/tkp/closed');
    assert.equal(TKP_API.tkp('t1'), '/api/tkp/t1');
  });
});

describe('живые обновления заказов и ТКП', () => {
  test('websocket включён: соединение с сервером API, три темы, сообщение перечитывает список', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { orders: true, websocket: true })));
    await loadFeatures();
    let refreshes = 0;
    const connection = connectOrdersLive('Заказы', () => refreshes++);
    await waitFor(() => stompClients.length === 1 && stompClients[0].active);
    const client = stompClients[0];
    const socket = client.socket as { url: string };
    assert.equal(socket.url, 'http://awms.local/ws-stations', 'адрес — из window.config, не localhost:8085');

    client.config.onConnect?.();
    assert.deepEqual([...client.subscriptions.keys()].sort(), [...ORDERS_LIVE_TOPICS].sort());
    for (const topic of ORDERS_LIVE_TOPICS) client.subscriptions.get(topic)?.({ body: 'не JSON' });
    assert.equal(refreshes, ORDERS_LIVE_TOPICS.length);

    connection.close();
    assert.equal(client.active, false);
  });

  test('websocket выключен — соединения нет; включили на ходу — открылось', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { orders: true, websocket: false }), profile('r2', { orders: true, websocket: true })));
    await loadFeatures();
    const connection = connectOrdersLive('ТКП', () => {});
    await settle();
    assert.equal(stompClients.length, 0, 'без функции websocket нет ни соединения, ни переподключений');

    await refreshFeatures();
    await waitFor(() => stompClients.length === 1 && stompClients[0].active);
    connection.close();
    assert.equal(stompClients[0].active, false);
  });

  test('профиль не получен — соединения нет', async () => {
    connectFeatureHttp(stubHttp(new Error('нет связи')));
    await loadFeatures();
    const connection = connectOrdersLive('Заказы', () => {});
    await settle();
    assert.equal(stompClients.length, 0);
    connection.close();
  });
});
