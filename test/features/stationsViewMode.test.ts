// stationsViewMode.test.ts — режимы панели станций под функцией map (раздел 11.2 проекта, пакет F3):
// сохранённый «map» без функции карты открывается плиткой, кнопки «Карта» нет. Страница (StationsPage.tsx)
// импортирует SVG, которые сборщик тестов не загружает, поэтому правило вынесено в viewMode.ts; что страница
// берёт его вместе с состоянием функции — проверка исходника.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  VIEW_MODE_BUTTONS,
  isViewButton,
  toViewMode,
  viewButtonIndexes,
  viewModeOfButton,
} from '../../src/components/StationsPage/viewMode';

describe('toViewMode', () => {
  test('map без функции карты — плитка', () => {
    assert.equal(toViewMode('map', false), 'grid');
  });

  test('map с функцией карты — карта; список и плитка — как сохранены', () => {
    assert.equal(toViewMode('map', true), 'map');
    assert.equal(toViewMode('list', true), 'list');
    assert.equal(toViewMode('list', false), 'list');
    assert.equal(toViewMode('grid', false), 'grid');
  });

  test('незнакомое или пустое значение — плитка', () => {
    for (const value of [undefined, null, '', 'MAP', 'tiles', 12, {}]) {
      assert.equal(toViewMode(value, true), 'grid', String(value));
    }
  });
});

describe('кнопки режима', () => {
  test('без карты — только плитка и список', () => {
    assert.deepEqual([...viewButtonIndexes(false)], [VIEW_MODE_BUTTONS.grid, VIEW_MODE_BUTTONS.list]);
    assert.deepEqual([...viewButtonIndexes(true)], [VIEW_MODE_BUTTONS.grid, VIEW_MODE_BUTTONS.list, VIEW_MODE_BUTTONS.map]);
  });

  test('кнопка «Карта» без функции карты не включает режим карты', () => {
    assert.equal(viewModeOfButton(VIEW_MODE_BUTTONS.map, false), 'grid');
    assert.equal(viewModeOfButton(VIEW_MODE_BUTTONS.map, true), 'map');
    assert.equal(viewModeOfButton(VIEW_MODE_BUTTONS.list, false), 'list');
    assert.equal(viewModeOfButton(VIEW_MODE_BUTTONS.grid, true), 'grid');
  });

  test('«Карта» остаётся кнопкой режима: из сохранённого набора кнопок она снимается вместе с режимом', () => {
    assert.equal(isViewButton(VIEW_MODE_BUTTONS.map), true);
    assert.equal(isViewButton(0), false);
    assert.equal(isViewButton(11), false);
  });
});

describe('исходник страницы станций', () => {
  const text = readFileSync(resolve(process.cwd(), 'src/components/StationsPage/StationsPage.tsx'), 'utf8');

  test('режим из localStorage и из фильтров сервера разбирается с учётом функции map', () => {
    const calls = text.match(/toViewMode\([^)]*\)/g) ?? [];
    assert.ok(calls.length >= 2, 'и сохранённое состояние, и фильтры пользователя');
    for (const call of calls) assert.match(call, /isFeatureOn\('map'\)/, call);
  });

  test('показанный режим без функции карты — плитка, кнопки — по функции', () => {
    assert.match(text, /useFeature\('map'\)/);
    assert.match(text, /selectedViewMode === 'map' && !mapOn \? 'grid'/);
    assert.match(text, /viewButtonIndexes\(mapOn\)/);
    assert.doesNotMatch(text, /VIEW_BUTTON_INDEXES/);
  });
});
