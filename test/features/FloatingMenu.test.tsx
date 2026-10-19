// FloatingMenu.test.tsx — пункты нижнего меню по составу функций (раздел 11.2 проекта, пакет F2a): без orders
// нет «Аналитики», без stubs — заглушек «Отчёты», «Настройки», «Уведомления», «Безопасность» — только при
// canViewSecurity. Меню (FloatingMenu.tsx) берёт пункты из menuItems.ts — его и проверяем: компонент меню
// грузит иконки, которых в Node нет.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ITEMS, visibleMenuItems } from '../../src/components/Menu/menuItems';
import { connectFeatureHttp, getFeatureSnapshot, isFeatureOn, loadFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { featureForPath, isCoreRoute } from '../../src/services/features/routes';
import { profile, stubHttp } from './helpers';

/** Пункты меню текущего пользователя — так их выбирает FloatingMenu */
const menuLabels = (): string[] =>
  visibleMenuItems(isFeatureOn, getFeatureSnapshot().profile?.canViewSecurity === true).map(item => item.label);

const ALL = ['Главная', 'Станции', 'Справочники', 'Документы', 'Отчеты', 'Аналитика', 'Настройки', 'Уведомления', 'Аккаунт', 'Спящий режим'];
const CORE = ['Главная', 'Станции', 'Справочники', 'Документы', 'Аккаунт', 'Спящий режим'];

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('пункты меню', () => {
  test('full: все пункты как раньше; «Безопасность» — перед «Аккаунтом», если доступна', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { orders: true, stubs: true })));
    await loadFeatures();
    assert.deepEqual(menuLabels(), ALL);
    resetFeatures();
    connectFeatureHttp(stubHttp(profile('r1', { orders: true, stubs: true }, { canViewSecurity: true })));
    await loadFeatures();
    assert.deepEqual(menuLabels(), [...ALL.slice(0, 8), 'Безопасность', ...ALL.slice(8)]);
  });

  test('без orders нет «Аналитики»', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { orders: false, stubs: true })));
    await loadFeatures();
    assert.equal(menuLabels().includes('Аналитика'), false);
    assert.equal(menuLabels().includes('Отчеты'), true);
  });

  test('без stubs нет «Отчетов», «Настроек» и «Уведомлений»', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { orders: true, stubs: false })));
    await loadFeatures();
    assert.deepEqual(menuLabels(), ['Главная', 'Станции', 'Справочники', 'Документы', 'Аналитика', 'Аккаунт', 'Спящий режим']);
  });

  test('isolated (функций нет) и профиль не получен — только ядро', async () => {
    connectFeatureHttp(stubHttp(profile('r1', {}, { preset: 'isolated' })));
    await loadFeatures();
    assert.deepEqual(menuLabels(), CORE);
    resetFeatures();
    connectFeatureHttp(stubHttp(new Error('сеть')));
    await loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'error');
    assert.deepEqual(menuLabels(), CORE);
  });

  test('«Безопасность» — по canViewSecurity, а не по набору функций', async () => {
    connectFeatureHttp(stubHttp(profile('r1', {}, { canViewSecurity: true })));
    await loadFeatures();
    assert.deepEqual(menuLabels(), [...CORE.slice(0, 4), 'Безопасность', ...CORE.slice(4)]);
  });

  test('«Уведомления» открывают «Главную»: раздела уведомлений нет', () => {
    const notifications = MENU_ITEMS.find(item => item.path === '/notifications');
    assert.deepEqual(notifications?.opens, { path: '/main', label: 'Главная' });
  });
});

describe('согласованность с разделами вкладок', () => {
  test('функция пункта — та же, что у его раздела (routes.ts); пункты без функции — разделы ядра', () => {
    for (const item of MENU_ITEMS) {
      if (item.isSleep) continue;
      assert.equal(featureForPath(item.path), item.feature ?? null, item.path);
      if (item.feature === undefined) assert.equal(isCoreRoute(item.path), true, `${item.path} — раздел ядра`);
    }
  });

  test('у каждого пункта своя иконка и уникальный путь', () => {
    const paths = MENU_ITEMS.map(item => item.path);
    assert.equal(new Set(paths).size, paths.length);
    const icons = MENU_ITEMS.map(item => item.icon);
    assert.equal(new Set(icons).size, icons.length);
  });
});
