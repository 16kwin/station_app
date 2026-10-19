// fileAccess.test.ts — загрузки файлов в интерфейсе (функция uploads, пакет F4b): режим «только просмотр»
// по профилю, формы без файла уходят JSON, скачивание загруженного файла — с cookie и проверкой ответа.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canUploadNow, fetchUploadedFile, optionalFileBody } from '../../src/services/features/fileAccess';
import { connectFeatureHttp, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { profile, stubHttp } from './helpers';

beforeEach(() => {
  resetFeatures();
  // «Профиль функций не получен» — ожидаемое предупреждение в тесте сбоя
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('режим «только просмотр» (uploads)', () => {
  test('профиль не загружен — загрузка закрыта (fail-closed)', () => {
    assert.equal(canUploadNow(), false);
  });

  test('uploads включена — можно загружать, выключена — только просмотр', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { uploads: true })));
    assert.equal(await loadFeatures(), true);
    assert.equal(canUploadNow(), true);

    resetFeatures();
    connectFeatureHttp(stubHttp(profile('r2', { uploads: false, export: true })));
    assert.equal(await loadFeatures(), true);
    assert.equal(canUploadNow(), false);
  });

  test('профиль не получен — только просмотр', async () => {
    connectFeatureHttp(stubHttp(new Error('503')));
    assert.equal(await loadFeatures(), false);
    assert.equal(canUploadNow(), false);
  });
});

describe('тело формы с необязательным файлом', () => {
  test('без файла — обычный объект (Axios отправит JSON), пустые поля не отправляются', () => {
    const body = optionalFileBody({ supplierUid: 'u-1', supplyDate: '2026-10-14T09:30:00', documentName: '', comment: null, extra: undefined });
    assert.equal(body instanceof FormData, false);
    assert.deepEqual(body, { supplierUid: 'u-1', supplyDate: '2026-10-14T09:30:00' });
    assert.equal(JSON.stringify(body), '{"supplierUid":"u-1","supplyDate":"2026-10-14T09:30:00"}');
    assert.equal(optionalFileBody({ materialUid: 'm-1' }, null) instanceof FormData, false);
  });

  test('с файлом — FormData: те же поля и файл в поле file', () => {
    const file = new File(['накладная'], 'накладная.pdf', { type: 'application/pdf' });
    const body = optionalFileBody({ materialUid: 'm-1', supplyDate: '2026-10-14T09:30:00', documentName: '' }, file);
    assert.ok(body instanceof FormData);
    assert.deepEqual([...body.keys()], ['materialUid', 'supplyDate', 'file']);
    assert.equal(body.get('materialUid'), 'm-1');
    const sent = body.get('file');
    assert.ok(sent instanceof File);
    assert.equal(sent.name, 'накладная.pdf');
  });

  test('поставки и ассортимент не собирают FormData без файла (контракт JSON-вариантов B4)', () => {
    const tabs = [
      'src/components/ReferencesPage/NomenclaturePage/SuppliersTab.tsx',
      'src/components/ReferencesPage/SuppliersPage/SupplierDeliveriesTab.tsx',
      'src/components/ReferencesPage/SuppliersPage/SupplierAssortmentTab.tsx',
    ];
    for (const tab of tabs) {
      const source = readFileSync(resolve(process.cwd(), tab), 'utf8');
      assert.equal(source.includes('new FormData('), false, `${tab}: тело поставки — через optionalFileBody`);
      assert.match(source, /optionalFileBody\(/, tab);
    }
  });
});

describe('скачивание загруженного файла', () => {
  test('запрос с cookie сессии: при закрытом анонимном /uploads без них ответ 401', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response('PDF', { status: 200, headers: { 'Content-Type': 'application/pdf' } });
    });
    const blob = await fetchUploadedFile('http://localhost/uploads/doc.pdf');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://localhost/uploads/doc.pdf');
    assert.equal(calls[0].init?.credentials, 'include');
    assert.equal(await blob.text(), 'PDF');
  });

  test('ответ с ошибкой — исключение, а не страница ошибки вместо файла', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('<html>401</html>', { status: 401 }));
    await assert.rejects(fetchUploadedFile('http://localhost/uploads/doc.pdf'), /HTTP 401/);
  });
});
