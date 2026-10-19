// bootstrapPwa.ts — запуск PWA по флагу установки (раздел 8.4 проекта «Дискретное отключение функций»).
// Манифест, теги «как приложение», событие установки и service worker включаются, только если сервер разрешил
// pwa (анонимный GET /api/features/public, до входа). Выключено — снимаем регистрации и кэши awms-*: оболочка
// и чанки модулей не должны оставаться на ТСД и общих ПК. Ответ не получен — ничего не меняем: сбой может быть
// временным, а снятие SW без нужды лишило бы пользователя страницы «нет связи».
// В сборке без PWA (вариант поставки, __AWMS_HAS_PWA__ = false) регистрации и манифеста в коде нет вовсе,
// остаётся только снятие — оно нужно, чтобы убрать SW, оставшийся от прежней полной сборки.
import { useSyncExternalStore } from 'react';
import { loadPublicFeatures, type PublicFeatures } from '../../services/features/publicFeatures';
import { listenInstallPrompt } from './installEvent';
import { disable, registerServiceWorker } from './serviceWorker';

/** Что решил запуск: PWA включена, снята или оставлена как была (флаги не получены) */
export type PwaDecision = 'enabled' | 'disabled' | 'unchanged';

/** Тег <head>, который раньше стоял в index.html статически */
export interface PwaHeadTag {
  tag: 'link' | 'meta';
  attrs: Readonly<Record<string, string>>;
}

/** Метка вставленных тегов: по ней повторный вызов (HMR, второй запуск) не дублирует их */
export const PWA_HEAD_MARK = 'data-awms-pwa';

/**
 * Манифест и теги установки на экран «Домой» (Chrome, Яндекс Браузер, Safari). theme-color и значки вкладки
 * остаются в index.html: они нужны и обычной странице
 */
export const PWA_HEAD_TAGS: readonly PwaHeadTag[] = [
  { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.json' } },
  { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'Динамика' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'default' } },
  { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' } },
];

/** Минимум документа для вставки тегов (E — тип элемента): подменяют тесты */
export interface HeadDocument<E extends { setAttribute(name: string, value: string): void }> {
  head: { appendChild(node: E): unknown; querySelector(selector: string): unknown };
  createElement(tag: 'link' | 'meta'): E;
}

/** Вставить теги PWA в <head>. Возвращает число вставленных: уже вставленные второй раз не добавляются */
export const insertPwaHead = <E extends { setAttribute(name: string, value: string): void }>(doc: HeadDocument<E>): number => {
  if (doc.head.querySelector(`[${PWA_HEAD_MARK}]`)) return 0;
  for (const { tag, attrs } of PWA_HEAD_TAGS) {
    const element = doc.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    element.setAttribute(PWA_HEAD_MARK, '');
    doc.head.appendChild(element);
  }
  return PWA_HEAD_TAGS.length;
};

// ---------- Состояние для PwaLayer ----------

let enabled = false;
const listeners = new Set<() => void>();

const setEnabled = (value: boolean) => {
  if (enabled === value) return;
  enabled = value;
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** PWA включена на этой загрузке страницы: только тогда показываются «Доступна новая версия» и «Установить» */
export const usePwaEnabled = (): boolean => useSyncExternalStore(subscribe, () => enabled, () => false);

// ---------- Запуск ----------

export interface PwaBootstrapDeps {
  /** Флаги до входа (pwa, passwords); при сбое loaded = false */
  loadFlags: () => Promise<PublicFeatures>;
  /** Строка запроса адреса страницы: ?sw=off — аварийное снятие для поддержки */
  search: string;
  /** Включить PWA: событие установки, теги, регистрация SW; null — модуля PWA нет в сборке */
  enable: (() => void) | null;
  /** Снять SW и кэши */
  disable: (reason: string) => Promise<unknown>;
}

const enablePwa = (): void => {
  listenInstallPrompt();
  insertPwaHead<HTMLElement>(document);
  registerServiceWorker();
};

const browserDeps = (): PwaBootstrapDeps => ({
  loadFlags: loadPublicFeatures,
  search: window.location.search,
  // Условие прямо здесь: в сборке без PWA enablePwa, регистрация SW и строки манифеста вырезаются целиком
  enable: __AWMS_HAS_PWA__ ? enablePwa : null,
  disable: reason => disable(reason),
});

/**
 * Включить или снять PWA по флагу установки. Вызывается один раз из main.tsx до монтирования React; запрос
 * флагов идёт параллельно загрузке приложения (страница входа берёт из того же запроса флаг passwords)
 */
export async function bootstrapPwa(deps: PwaBootstrapDeps = browserDeps()): Promise<PwaDecision> {
  if (new URLSearchParams(deps.search).get('sw') === 'off') {
    await deps.disable('?sw=off');
    return 'disabled';
  }
  if (!deps.enable) {
    await deps.disable('модуля PWA нет в сборке');
    return 'disabled';
  }
  const flags = await deps.loadFlags();
  if (!flags.loaded) return 'unchanged';
  if (!flags.pwa) {
    await deps.disable('выключено на установке');
    return 'disabled';
  }
  deps.enable();
  setEnabled(true);
  return 'enabled';
}
