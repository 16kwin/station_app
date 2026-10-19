// bootstrapPwa.test.ts — запуск PWA по флагу установки и снятие service worker (раздел 8.4 проекта, пакет F6).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PWA_HEAD_MARK,
  PWA_HEAD_TAGS,
  bootstrapPwa,
  insertPwaHead,
  type PwaBootstrapDeps,
} from '../../src/components/Pwa/bootstrapPwa';
import { canUseServiceWorker, disable, type PwaCleanupTargets } from '../../src/components/Pwa/serviceWorker';
import type { PublicFeatures } from '../../src/services/features/publicFeatures';

const flags = (loaded: boolean, pwa: boolean): PublicFeatures => ({ loaded, revision: loaded ? 'r1' : null, pwa, passwords: false });

/** Заглушка окружения запуска: что вызывалось и в каком порядке */
const deps = (reply: PublicFeatures, extra: Partial<PwaBootstrapDeps> = {}) => {
  const calls: string[] = [];
  const value: PwaBootstrapDeps = {
    loadFlags: async () => {
      calls.push('flags');
      return reply;
    },
    search: '',
    enable: () => calls.push('enable'),
    disable: async reason => {
      calls.push('disable:' + reason);
    },
    ...extra,
  };
  return { value, calls };
};

describe('bootstrapPwa', () => {
  test('pwa=true — PWA включается, ничего не снимается', async () => {
    const { value, calls } = deps(flags(true, true));
    assert.equal(await bootstrapPwa(value), 'enabled');
    assert.deepEqual(calls, ['flags', 'enable']);
  });

  test('pwa=false — SW и кэши снимаются, регистрации нет', async () => {
    const { value, calls } = deps(flags(true, false));
    assert.equal(await bootstrapPwa(value), 'disabled');
    assert.deepEqual(calls, ['flags', 'disable:выключено на установке']);
  });

  test('флаги не получены (ошибка /api/features/public) — ничего не меняется', async () => {
    const { value, calls } = deps(flags(false, false));
    assert.equal(await bootstrapPwa(value), 'unchanged');
    assert.deepEqual(calls, ['flags']);
  });

  test('?sw=off — снятие без запроса флагов, даже если установка разрешает pwa', async () => {
    const { value, calls } = deps(flags(true, true), { search: '?tab=1&sw=off' });
    assert.equal(await bootstrapPwa(value), 'disabled');
    assert.deepEqual(calls, ['disable:?sw=off']);
  });

  test('сборка без PWA — снятие без запроса флагов: включать нечего', async () => {
    const { value, calls } = deps(flags(true, true), { enable: null });
    assert.equal(await bootstrapPwa(value), 'disabled');
    assert.deepEqual(calls, ['disable:модуля PWA нет в сборке']);
  });
});

/** Документ-заглушка: элементы — записи атрибутов */
const fakeDocument = () => {
  const appended: Array<{ tag: string; attrs: Record<string, string> }> = [];
  type FakeElement = { tag: string; attrs: Record<string, string>; setAttribute(name: string, value: string): void };
  const doc = {
    head: {
      appendChild: (node: FakeElement) => appended.push({ tag: node.tag, attrs: node.attrs }),
      querySelector: (selector: string) =>
        selector === `[${PWA_HEAD_MARK}]` ? appended.find(e => PWA_HEAD_MARK in e.attrs) ?? null : null,
    },
    createElement: (tag: 'link' | 'meta'): FakeElement => {
      const attrs: Record<string, string> = {};
      return { tag, attrs, setAttribute: (name, value) => void (attrs[name] = value) };
    },
  };
  return { doc, appended };
};

describe('теги PWA в <head>', () => {
  test('вставляются манифест и теги установки, с меткой; повторный вызов ничего не добавляет', () => {
    const { doc, appended } = fakeDocument();
    assert.equal(insertPwaHead(doc), PWA_HEAD_TAGS.length);
    assert.deepEqual(appended[0], { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.json', [PWA_HEAD_MARK]: '' } });
    const names = appended.map(e => e.attrs.name ?? e.attrs.rel);
    assert.deepEqual(names, [
      'manifest',
      'mobile-web-app-capable',
      'apple-mobile-web-app-capable',
      'apple-mobile-web-app-title',
      'apple-mobile-web-app-status-bar-style',
      'apple-touch-icon',
    ]);
    assert.equal(insertPwaHead(doc), 0);
    assert.equal(appended.length, PWA_HEAD_TAGS.length);
  });

  test('index.html: манифеста и тегов установки нет, theme-color и значки вкладки остались', () => {
    const html = readFileSync('index.html', 'utf8');
    assert.doesNotMatch(html, /rel="manifest"/);
    assert.doesNotMatch(html, /apple-mobile-web-app|mobile-web-app-capable|apple-touch-icon/);
    assert.match(html, /name="theme-color"/);
    assert.match(html, /rel="icon"[^>]*favicon-32\.png/);
    // Всё, что убрано из index.html, вставляет bootstrapPwa
    for (const { attrs } of PWA_HEAD_TAGS) assert.ok(attrs.name !== 'theme-color' && attrs.rel !== 'icon');
  });
});

/** Заглушки регистраций и кэшей */
const targets = (registrations: boolean[], cacheKeys: string[]) => {
  const unregistered: number[] = [];
  const deleted: string[] = [];
  const value: PwaCleanupTargets = {
    serviceWorker: {
      getRegistrations: async () =>
        registrations.map((result, i) => ({
          unregister: async () => {
            unregistered.push(i);
            return result;
          },
        })) as unknown as ServiceWorkerRegistration[],
    },
    caches: {
      keys: async () => cacheKeys,
      delete: async (key: string) => {
        deleted.push(key);
        return true;
      },
    },
  };
  return { value, unregistered, deleted };
};

/** Перехват console.info: disable пишет, только когда что-то снял */
const captureInfo = async <T>(run: () => Promise<T>): Promise<{ result: T; lines: string[] }> => {
  const original = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    return { result: await run(), lines };
  } finally {
    console.info = original;
  }
};

describe('disable — снятие service worker', () => {
  test('снимает все регистрации и удаляет только кэши awms-*', async () => {
    const t = targets([true, true], ['awms-shell-20261013', 'awms-static-v1', 'other-app']);
    const { result, lines } = await captureInfo(() => disable('выключено на установке', t.value));
    assert.deepEqual(t.unregistered, [0, 1]);
    assert.deepEqual(t.deleted, ['awms-shell-20261013', 'awms-static-v1']);
    assert.deepEqual(result, { registrations: 2, caches: ['awms-shell-20261013', 'awms-static-v1'] });
    assert.equal(lines.length, 1);
  });

  test('по HTTP в ЛВС (SW недоступен) кэши всё равно чистятся, ошибок нет', async () => {
    const t = targets([], ['awms-static-v1']);
    const { result } = await captureInfo(() => disable('выключено на установке', { serviceWorker: null, caches: t.value.caches }));
    assert.deepEqual(result, { registrations: 0, caches: ['awms-static-v1'] });
  });

  test('снимать нечего — консоль чистая; сбой браузера — не отклоняется', async () => {
    const { result, lines } = await captureInfo(() => disable('выключено на установке', { serviceWorker: null, caches: null }));
    assert.deepEqual(result, { registrations: 0, caches: [] });
    assert.deepEqual(lines, []);
    const failing: PwaCleanupTargets = {
      serviceWorker: { getRegistrations: async () => Promise.reject(new DOMException('запрет', 'SecurityError')) },
      caches: { keys: async () => Promise.reject(new DOMException('запрет', 'SecurityError')), delete: async () => false },
    };
    assert.deepEqual(await disable('выключено на установке', failing), { registrations: 0, caches: [] });
  });

  test('без окна браузера проверка SW не падает', () => {
    assert.equal(canUseServiceWorker(), false);
  });
});
