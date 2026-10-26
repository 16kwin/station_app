// mobileReadOnly.test.ts — телефон, ТСД, планшет: распознавание устройства и что можно в режиме «только просмотр»
// (device.ts, readOnly.ts, ReadOnlyGuard). Сервер проверяет то же (MobileReadOnlyFilterTest).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMobileSignals, type DeviceSignals } from '../../src/services/device';
import { allowedInReadOnly, requestPath } from '../../src/services/readOnly';
import { WRITE_LABEL } from '../../src/components/ReadOnly/writeControls';

const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const desktop: DeviceSignals = { userAgent: WINDOWS, maxTouchPoints: 0, coarsePointer: false, finePointer: true };

describe('устройство', () => {
  test('компьютер — не мобильное, в том числе ноутбук с сенсорным экраном и тачпадом', () => {
    assert.equal(isMobileSignals(desktop), false);
    assert.equal(isMobileSignals({ ...desktop, maxTouchPoints: 10, coarsePointer: false, finePointer: true }), false);
  });

  test('телефоны, ТСД и планшеты — мобильные', () => {
    assert.equal(isMobileSignals({ ...desktop, userAgent: 'Mozilla/5.0 (Linux; Android 11; DT40) Chrome/120 Mobile Safari/537.36' }), true);
    assert.equal(isMobileSignals({ ...desktop, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148' }), true);
    assert.equal(isMobileSignals({ ...desktop, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X200) Chrome/130 Safari/537.36' }), true, 'Android-планшет');
    assert.equal(isMobileSignals({ ...desktop, uaMobile: true }), true);
  });

  test('iPad и «версия для ПК» в мобильном браузере — тоже мобильные', () => {
    assert.equal(isMobileSignals({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', maxTouchPoints: 5, coarsePointer: true, finePointer: false }), true);
    assert.equal(isMobileSignals({ ...desktop, maxTouchPoints: 5, coarsePointer: true, finePointer: false }), true);
  });
});

describe('только просмотр', () => {
  test('чтение и вход разрешены', () => {
    assert.equal(allowedInReadOnly('get', '/api/move-orders'), true);
    assert.equal(allowedInReadOnly(undefined, '/api/move-orders'), true, 'метод по умолчанию — GET');
    assert.equal(allowedInReadOnly('post', '/api/auth/login'), true);
    assert.equal(allowedInReadOnly('post', '/logout'), true);
  });

  test('чтение методом POST, выгрузки и личные настройки вида разрешены', () => {
    assert.equal(allowedInReadOnly('post', '/api/stations/static/filtered'), true);
    assert.equal(allowedInReadOnly('post', 'http://localhost/api/workshops/export-pdf'), true);
    assert.equal(allowedInReadOnly('patch', '/api/employees/columns-settings?userId=1'), true);
    assert.equal(allowedInReadOnly('patch', '/api/nomenclature/settings?userId=1'), true);
    assert.equal(allowedInReadOnly('post', '/api/user/filters'), true);
    assert.equal(allowedInReadOnly('post', '/api/security-profile/events'), true, 'аудит просмотра отчёта');
  });

  test('запись данных не отправляется', () => {
    assert.equal(allowedInReadOnly('post', '/api/move-orders'), false);
    assert.equal(allowedInReadOnly('patch', '/api/nomenclature/items/1'), false);
    assert.equal(allowedInReadOnly('delete', '/api/employees/5'), false);
    assert.equal(allowedInReadOnly('put', '/api/gpp'), false);
    assert.equal(allowedInReadOnly('post', '/api/security-profile/purge'), false, 'управлять установкой с телефона нельзя');
  });

  test('путь запроса — без сервера и параметров', () => {
    assert.equal(requestPath('https://dynamikaawms.ru/api/x/columns-settings?userId=1'), '/api/x/columns-settings');
    assert.equal(requestPath('api/x'), '/api/x');
  });

  test('кнопки записи узнаются по подписи, кнопки просмотра — нет', () => {
    for (const label of ['Записать', 'Создать', 'Создать каталог', 'Удалить', 'Добавить отзыв', 'Пополнить', 'Провести']) {
      assert.match(label, WRITE_LABEL, label);
    }
    for (const label of ['Созданные', 'Открыть', 'Закрыть', 'Поиск', 'Изменить период', 'Загрузить ещё', 'Скачать PDF']) {
      assert.doesNotMatch(label, WRITE_LABEL, label);
    }
  });
});
