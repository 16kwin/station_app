// TabContext.test.tsx — вкладки и состав функций (раздел 11.2 проекта, пакет F2a): восстановление молча
// отбрасывает вкладки выключенных разделов, перепроверка подменяет компонент заглушкой и возвращает раздел.
// Правила вкладок — чистые функции tabFeatures.ts; TabContext вызывает их при восстановлении, открытии вкладки,
// заполнении раздела (updateTabComponent) и при смене состава функций.
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidElement, type ReactNode } from 'react';
import {
  guardTabComponent,
  isTabKnownOff,
  isUnavailableTab,
  restoreTabs,
  revalidateTabList,
  unavailableTab,
  type GuardedTab,
} from '../../src/context/tabFeatures';
import FeatureUnavailablePage from '../../src/services/features/FeatureUnavailablePage';
import { connectFeatureHttp, getFeatureSnapshot, loadFeatures, refreshFeatures, resetFeatures } from '../../src/services/features/featureStore';
import { isPathAllowed, isPathKnownOff } from '../../src/services/features/routes';
import { profile, stubHttp } from './helpers';

/** Профиль установки full: всё, что интерфейс проверяет, включено */
const FULL = {
  video: true,
  'video.live': true,
  'video.archive': true,
  'video.download': true,
  gpp: true,
  orders: true,
  stubs: true,
  dashboards: true,
  'dashboards.screen': true,
  uploads: true,
};

const saved = (tabs: Array<{ id: string; path: string; label?: string; parentTabId?: string }>, activeTabId: string | null) => ({
  tabs: tabs.map(tab => ({ label: tab.path, ...tab })),
  activeTabId,
});

/** Раздел-заглушка в тестах: настоящие страницы тянут браузерные модули */
const Section = (props: { name: string }) => props.name;

interface TestTab extends GuardedTab {
  id: string;
  label: string;
}

const tab = (id: string, path: string, component: ReactNode): TestTab => ({ id, path, label: path, component });

const featureOf = (component: ReactNode): unknown =>
  isValidElement<{ feature?: unknown }>(component) ? component.props.feature : undefined;

beforeEach(() => {
  resetFeatures();
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  resetFeatures();
  connectFeatureHttp(null);
  mock.restoreAll();
});

describe('восстановление сохранённых вкладок', () => {
  test('вкладки выключенных разделов отбрасываются молча, активной становится первая', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { ...FULL, video: false, orders: false })));
    await loadFeatures();
    const restored = restoreTabs(
      saved(
        [
          { id: 'm', path: '/main' },
          { id: 'v', path: '/documents/video-archive' },
          { id: 'g', path: '/documents/gpp' },
          { id: 'o', path: '/orders/abc', parentTabId: 'a' },
          { id: 'a', path: '/analytics' },
          { id: 'n', path: '/references/nomenclature/edit/uid/code', parentTabId: 'm' },
        ],
        'v',
      ),
    );
    assert.ok(restored);
    assert.deepEqual(
      restored.tabs.map(t => t.id),
      ['m', 'g', 'n'],
    );
    assert.equal(restored.activeTabId, 'm', 'активная вкладка выключена — первая из оставшихся');
    assert.deepEqual(restored.tabs[2], { id: 'n', path: '/references/nomenclature/edit/uid/code', label: '/references/nomenclature/edit/uid/code', parentTabId: 'm' });
  });

  test('сохранённая активная вкладка остаётся активной', async () => {
    connectFeatureHttp(stubHttp(profile('r1', FULL)));
    await loadFeatures();
    const restored = restoreTabs(saved([{ id: 'm', path: '/main' }, { id: 'v', path: '/documents/video-archive' }], 'v'));
    assert.deepEqual(restored, {
      tabs: [
        { id: 'm', path: '/main', label: '/main' },
        { id: 'v', path: '/documents/video-archive', label: '/documents/video-archive' },
      ],
      activeTabId: 'v',
    });
  });

  test('профиль не получен — работает как до выключателей: вкладки восстанавливаются, разделы открыты', async () => {
    connectFeatureHttp(stubHttp(new Error('сеть')));
    await loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'ready');
    assert.equal(isPathAllowed('/documents/video-archive'), true, 'раздел открыт, как до выключателей');
    const section = <Section name="video" />;
    assert.equal(guardTabComponent('/documents/video-archive', section), section, 'без заглушки');
    const restored = restoreTabs(saved([{ id: 'm', path: '/main' }, { id: 'v', path: '/documents/video-archive' }], 'v'));
    assert.deepEqual(
      restored?.tabs.map(t => t.id),
      ['m', 'v'],
    );
    assert.equal(restored?.activeTabId, 'v');
  });

  test('«Безопасность» без права на страницу не восстанавливается; с правом и без профиля — остаётся', async () => {
    const tabs = saved([{ id: 'm', path: '/main' }, { id: 's', path: '/security' }], 's');
    connectFeatureHttp(stubHttp(profile('r1', FULL, { canViewSecurity: false })));
    await loadFeatures();
    assert.deepEqual(restoreTabs(tabs), { tabs: [{ id: 'm', path: '/main', label: '/main' }], activeTabId: 'm' });
    assert.equal(isTabKnownOff('/security?x=1'), true);
    assert.equal(isTabKnownOff('/main'), false);

    resetFeatures();
    connectFeatureHttp(stubHttp(profile('r2', FULL, { canViewSecurity: true })));
    await loadFeatures();
    assert.deepEqual(restoreTabs(tabs)?.tabs.map(t => t.id), ['m', 's']);

    resetFeatures();
    connectFeatureHttp(stubHttp(new Error('сеть')));
    await loadFeatures();
    assert.deepEqual(restoreTabs(tabs)?.tabs.map(t => t.id), ['m', 's'], 'профиля нет — право неизвестно, вкладка остаётся');
  });

  test('модуля нет в сборке — вкладка отбрасывается и без профиля', () => {
    const withoutVideo = (path: string) => path.startsWith('/documents/video-archive') || isPathKnownOff(path);
    const restored = restoreTabs(saved([{ id: 'm', path: '/main' }, { id: 'v', path: '/documents/video-archive' }], 'v'), withoutVideo);
    assert.deepEqual(
      restored?.tabs.map(t => t.id),
      ['m'],
    );
  });

  test('всё отброшено или сохранено повреждённое — восстанавливать нечего', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { ...FULL, orders: false })));
    await loadFeatures();
    assert.equal(restoreTabs(saved([{ id: 'a', path: '/analytics' }], 'a')), null);
    assert.equal(restoreTabs(null), null);
    assert.equal(restoreTabs('tabs'), null);
    assert.equal(restoreTabs({ tabs: 'x' }), null);
    assert.equal(restoreTabs({ tabs: [] }), null);
    const restored = restoreTabs({ tabs: [{ id: 1, path: '/main' }, null, { id: 'm', path: '/main', label: 'Главная', extra: true }], activeTabId: 'x' });
    assert.deepEqual(restored, { tabs: [{ id: 'm', path: '/main', label: 'Главная' }], activeTabId: 'm' });
  });
});

describe('компонент вкладки', () => {
  test('закрытый раздел — заглушка «Раздел недоступен» вместо раздела и вместо null', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { ...FULL, gpp: false })));
    await loadFeatures();
    const section = <Section name="gpp" />;
    const guarded = guardTabComponent('/documents/gpp', section);
    assert.equal(isUnavailableTab(guarded), true);
    assert.equal(featureOf(guarded), 'gpp', 'страница отличает «выключено» от «профиль не получен» по функции');
    assert.equal(isUnavailableTab(guardTabComponent('/documents/gpp', null)), true, 'null — тоже заглушка: MainLayout не подставит раздел');
    assert.equal(guardTabComponent('/documents/gpp', guarded), guarded, 'заглушка не пересоздаётся');
  });

  test('открытый раздел и ядро — компонент как передали', async () => {
    connectFeatureHttp(stubHttp(profile('r1', FULL)));
    await loadFeatures();
    const section = <Section name="gpp" />;
    assert.equal(guardTabComponent('/documents/gpp', section), section);
    assert.equal(guardTabComponent('/documents/gpp', null), null);
    assert.equal(guardTabComponent('/references/nomenclature', null), null);
  });

  test('профиль ещё не загружен — разделы функций закрыты, ядро открыто', () => {
    assert.equal(getFeatureSnapshot().status, 'idle');
    assert.equal(isUnavailableTab(guardTabComponent('/orders/abc', <Section name="order" />)), true);
    const main = <Section name="main" />;
    assert.equal(guardTabComponent('/main', main), main);
  });

  test('заглушку распознаёт и та, что создал MainLayout', () => {
    assert.equal(isUnavailableTab(<FeatureUnavailablePage feature="video.archive" />), true);
    assert.equal(isUnavailableTab(unavailableTab('/screen/events')), true);
    assert.equal(featureOf(unavailableTab('/references/nomenclature')), undefined, 'у ядра функции нет');
    assert.equal(isUnavailableTab(<Section name="x" />), false);
    assert.equal(isUnavailableTab(null), false);
    assert.equal(isUnavailableTab('текст'), false);
  });
});

describe('перепроверка открытых вкладок', () => {
  test('функцию выключили — раздел меняется на заглушку, остальные вкладки не трогаются', async () => {
    const http = stubHttp(profile('r1', FULL), profile('r2', { ...FULL, video: false }));
    connectFeatureHttp(http);
    await loadFeatures();
    const main = tab('m', '/main', <Section name="main" />);
    const video = tab('v', '/documents/video-archive', <Section name="video" />);
    const gpp = tab('g', '/documents/gpp', <Section name="gpp" />);
    const tabs = [main, video, gpp];
    assert.equal(revalidateTabList(tabs), tabs, 'состав не менялся — тот же массив, tabs_state не перезаписывается');

    await refreshFeatures();
    assert.equal(getFeatureSnapshot().profile?.revision, 'r2');
    const next = revalidateTabList(tabs);
    assert.notEqual(next, tabs);
    assert.equal(next[0], main);
    assert.equal(next[2], gpp);
    assert.equal(isUnavailableTab(next[1].component), true, 'модуль размонтируется — опросы и соединения останавливаются');
    assert.equal(featureOf(next[1].component), 'video.archive');
    assert.deepEqual({ id: next[1].id, path: next[1].path, label: next[1].label }, { id: 'v', path: '/documents/video-archive', label: '/documents/video-archive' });
    assert.equal(revalidateTabList(next), next, 'повторная перепроверка ничего не меняет');
  });

  test('функцию включили обратно — заглушка сменяется на null, MainLayout создаёт раздел заново', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { ...FULL, orders: false }), profile('r2', FULL)));
    await loadFeatures();
    const tabs = [tab('m', '/main', null), tab('a', '/analytics', guardTabComponent('/analytics', null))];
    assert.equal(isUnavailableTab(tabs[1].component), true);
    await refreshFeatures();
    const next = revalidateTabList(tabs);
    assert.equal(next[1].component, null);
    assert.equal(next[0], tabs[0]);
  });

  test('профиль не получен — заглушки вкладок сменяются разделами; пришёл профиль — выключенный раздел закрыт', async () => {
    connectFeatureHttp(stubHttp(new Error('сеть'), profile('r1', { ...FULL, gpp: false })));
    const waiting = revalidateTabList([tab('g', '/documents/gpp', <Section name="gpp" />)]);
    assert.equal(isUnavailableTab(waiting[0].component), true, 'пока профиль не запрашивали — заглушка');
    await loadFeatures();
    assert.equal(getFeatureSnapshot().status, 'ready');
    const opened = revalidateTabList(waiting);
    assert.equal(opened[0].component, null, 'как до выключателей: MainLayout создаёт раздел заново');

    const tabs = [tab('g', '/documents/gpp', <Section name="gpp" />), tab('v', '/documents/video-archive', <Section name="video" />)];
    assert.equal(revalidateTabList(tabs), tabs, 'профиля нет — открытые разделы не трогаются');
    await loadFeatures();
    assert.equal(getFeatureSnapshot().profile?.revision, 'r1');
    const next = revalidateTabList(tabs);
    assert.equal(isUnavailableTab(next[0].component), true, 'профиль выключил ГПП — заглушка');
    assert.equal(featureOf(next[0].component), 'gpp');
    assert.equal(next[1], tabs[1], 'включённый раздел не трогается');
  });

  test('сравнение — по пути раздела без параметров и якоря', async () => {
    connectFeatureHttp(stubHttp(profile('r1', { ...FULL, stubs: false })));
    await loadFeatures();
    const next = revalidateTabList([tab('r', '/reports?from=menu', <Section name="reports" />), tab('s', '/references/stations', <Section name="s" />)]);
    assert.equal(isUnavailableTab(next[0].component), true);
    assert.equal(isUnavailableTab(next[1].component), false);
  });
});
