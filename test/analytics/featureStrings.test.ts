// featureStrings.test.ts — строки функций orders и websocket не лежат в ядре (пакет F5, разделы 8.1 и 8.5 проекта
// «Дискретное отключение функций»): в сборке без модуля их не должно быть, а verify-dist ищет следы модуля по
// строкам. Адреса заказов и ТКП — только в каталоге модуля (и под флагом сборки в routes.ts), библиотеки
// STOMP и SockJS — только в общем клиенте живых обновлений. Клиент SockJS для сервера лежит в public/vendor
// без изменений — тот же файл, что в пакете npm.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Тест запускается из корня фронтенда (test/run-tests.mjs)
const root = process.cwd();
const src = join(root, 'src');

/** Исходники приложения: путь от src/ через «/» и текст */
const sources = readdirSync(src, { recursive: true })
  .map(String)
  .filter(file => /\.(ts|tsx)$/.test(file))
  .map(file => ({ path: relative(src, join(src, file)).split(sep).join('/'), text: readFileSync(join(src, file), 'utf8') }));

const filesWith = (pattern: RegExp) => sources.filter(file => pattern.test(file.text)).map(file => file.path);

describe('строки заказов, ТКП и живых обновлений вне ядра', () => {
  test('адреса заказов и ТКП — только в каталоге модуля и под флагом сборки в routes.ts', () => {
    const outside = filesWith(/\/api\/(orders|tkp)\b/).filter(
      path => !path.startsWith('components/AnalyticsPage/') && path !== 'services/features/routes.ts',
    );
    assert.deepEqual(outside, []);
  });

  test('нет адреса стороннего сервера http://localhost:8085', () => {
    assert.deepEqual(filesWith(/localhost:8085/), []);
  });

  test('STOMP и SockJS подключает только общий клиент живых обновлений', () => {
    const importers = filesWith(/from\s+['"](@stomp\/stompjs|sockjs-client)['"]|import\(\s*['"](@stomp\/stompjs|sockjs-client)['"]\s*\)/);
    assert.deepEqual(importers, ['services/liveUpdatesClient.ts']);
  });

  test('ConstantInfo: нет адресов заказов и ТКП, точки и тем живых обновлений', () => {
    const constants = sources.find(file => file.path === 'info/ConstantInfo.tsx');
    assert.ok(constants);
    for (const pattern of [/\/api\/orders/, /\/api\/tkp/, /ws-stations/, /\/topic\//, /wsBaseUrl/, /ws:\/\//]) {
      assert.doesNotMatch(constants.text, pattern);
    }
  });
});

describe('клиент SockJS для сервера', () => {
  test('public/vendor/sockjs/sockjs.min.js — копия dist пакета sockjs-client без изменений', () => {
    const sha = (path: string) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
    assert.equal(sha('public/vendor/sockjs/sockjs.min.js'), sha('node_modules/sockjs-client/dist/sockjs.min.js'));
  });
});
