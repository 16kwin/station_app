// TableToolbar.test.tsx — выгрузка и печать в панели справочников под функцией export (раздел 11.2 проекта, F4b).
// Панель (TableToolbar.tsx) импортирует SVG-иконки, которые сборщик тестов не загружает, поэтому решение
// «что показать» вынесено в toolbarExport.ts и проверяется здесь; что панель берёт его, а не свои свойства, —
// проверка исходника.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toolbarExport, type ToolbarExportHandlers } from '../../src/components/elements/toolbarExport';
import { connectFeatureHttp, isFeatureOn, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { profile, stubHttp } from './helpers';

const noop = () => {};
const ALL: Required<ToolbarExportHandlers> = { onPrint: noop, onDownloadPdf: noop, onDownloadExcel: noop, onDownloadWord: noop };

/** То, что видит пользователь при текущем профиле: панель вызывает toolbarExport(…, useCanExport()) */
const current = (handlers: ToolbarExportHandlers) => toolbarExport(handlers, isFeatureOn('export'));

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('выгрузка в панели справочников', () => {
  test('export включена — как раньше: меню выгрузки и печать с обработчиками страницы', () => {
    const actions = toolbarExport(ALL, true);
    assert.equal(actions.downloadMenu, true);
    assert.equal(actions.onPrint, ALL.onPrint);
    assert.equal(actions.onDownloadPdf, ALL.onDownloadPdf);
    assert.equal(actions.onDownloadExcel, ALL.onDownloadExcel);
    assert.equal(actions.onDownloadWord, ALL.onDownloadWord);
    // Страница без печати — кнопки печати нет, меню выгрузки остаётся (как до выключателей)
    const withoutPrint = toolbarExport({ onDownloadPdf: noop }, true);
    assert.equal(withoutPrint.onPrint, undefined);
    assert.equal(withoutPrint.downloadMenu, true);
  });

  test('export выключена — без меню выгрузки и без печати', () => {
    const actions = toolbarExport(ALL, false);
    assert.deepEqual(actions, { downloadMenu: false });
  });

  test('по профилю: выключена на установке или по роли — меню нет; профиль не загружен — нет', async () => {
    assert.equal(current(ALL).downloadMenu, false, 'до загрузки профиля — закрыто');

    connectFeatureHttp(stubHttp(profile('r1', { export: true })));
    assert.equal(await loadFeatures(), true);
    assert.equal(current(ALL).downloadMenu, true);
    assert.equal(current(ALL).onPrint, ALL.onPrint);

    // awms.features.export.roles без роли пользователя: сервер присылает export=false
    resetFeatures();
    connectFeatureHttp(stubHttp(profile('r2', { export: false, uploads: true })));
    assert.equal(await loadFeatures(), true);
    assert.deepEqual(current(ALL), { downloadMenu: false });
  });

  test('панель показывает выгрузку только через toolbarExport', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/elements/TableToolbar.tsx'), 'utf8');
    assert.match(source, /useToolbarExport\(\{ onPrint, onDownloadPdf, onDownloadExcel, onDownloadWord \}\)/);
    assert.match(source, /\{exportActions\.downloadMenu && \(/, 'меню «Скачать» — под downloadMenu');
    assert.match(source, /\{exportActions\.onPrint && (!phone && )?\(/, 'кнопка печати — под onPrint из toolbarExport');
    // Свойства страницы напрямую в разметке не вызываются: обработчик сработал бы и при выключенной export
    assert.doesNotMatch(source, /[^.]onDownload(Pdf|Excel|Word)\?\.\(\)/);
    assert.doesNotMatch(source, /onClick=\{onPrint\}/);
  });
});
