// tabFeatures.ts — вкладки приложения и состав функций установки (разделы 8.1–8.3 проекта «Дискретное
// отключение функций»). Чистые функции без React-состояния: их вызывает TabContext и проверяют тесты.
//  • Восстановление: сохранённые вкладки разделов, которые точно выключены (isPathKnownOff), и «Безопасность»
//    без права на неё (isTabKnownOff) молча отбрасываются.
//    Пока профиль не получен (прежний сервер без /api/features, сбой связи), раздел не выключен, а неизвестен:
//    вкладка остаётся, интерфейс работает как до выключателей (featureStore), функции закрывает только сервер.
//  • Правило вкладки: раздел закрыт (!isPathAllowed) — вместо раздела «Раздел недоступен» (FeatureUnavailablePage).
//    Заглушка — не null, поэтому MainLayout не подставит в такую вкладку настоящий раздел.
//  • Перепроверка: состав функций изменился — закрытые разделы открытых вкладок меняются на заглушку (модуль
//    размонтируется, его опросы и соединения останавливаются), разрешённые снова получают null, и MainLayout
//    создаёт раздел заново.
import { createElement, isValidElement, type ReactNode } from 'react';
import FeatureUnavailablePage from '../services/features/FeatureUnavailablePage';
import { getFeatureSnapshot } from '../services/features/featureStore';
import { featureForPath, isPathAllowed, isPathKnownOff } from '../services/features/routes';

/** Страница «Безопасность»: раздел ядра, но только для тех, кому сервер её открыл (canViewSecurity) */
const SECURITY_PATH = '/security';

/**
 * Сохранённая вкладка точно закрыта для этого пользователя: раздел выключенной функции (isPathKnownOff) или
 * страница «Безопасность», когда полученный профиль не даёт права на неё (роль сменили, вошёл другой пользователь
 * общего ПК). Пока профиля нет, право неизвестно — вкладка остаётся
 */
export const isTabKnownOff = (path: string): boolean => {
  if (isPathKnownOff(path)) return true;
  const { profile } = getFeatureSnapshot();
  return profile !== null && !profile.canViewSecurity && path.replace(/[?#].*$/, '').replace(/\/+$/, '') === SECURITY_PATH;
};

/** Вкладка в localStorage (tabs_state): без компонента */
export interface SavedTab {
  id: string;
  path: string;
  label: string;
  parentTabId?: string;
}

export interface RestoredTabs {
  tabs: SavedTab[];
  activeTabId: string;
}

/** Вкладка с компонентом — как Tab из TabContext */
export interface GuardedTab {
  path: string;
  component: ReactNode;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Сохранённая вкладка: id, путь и подпись — строки; остальное не восстанавливается */
const savedTab = (value: unknown): SavedTab | null => {
  if (!isRecord(value)) return null;
  const { id, path, label, parentTabId } = value;
  if (typeof id !== 'string' || typeof path !== 'string' || typeof label !== 'string') return null;
  return typeof parentTabId === 'string' ? { id, path, label, parentTabId } : { id, path, label };
};

/**
 * Вкладки из сохранённого состояния: повреждённые записи и разделы точно выключенных функций отбрасываются
 * молча. Активной остаётся сохранённая вкладка, а если её отбросили — первая. null — восстанавливать нечего
 * (открывается «Главная»)
 */
export const restoreTabs = (saved: unknown, knownOff: (path: string) => boolean = isTabKnownOff): RestoredTabs | null => {
  if (!isRecord(saved) || !Array.isArray(saved.tabs)) return null;
  const tabs = saved.tabs
    .map(savedTab)
    .filter((tab): tab is SavedTab => tab !== null)
    .filter(tab => !knownOff(tab.path));
  if (tabs.length === 0) return null;
  const active = tabs.find(tab => tab.id === saved.activeTabId) ?? tabs[0];
  return { tabs, activeTabId: active.id };
};

/** Заглушка «Раздел недоступен» для вкладки раздела выключенной функции */
export const unavailableTab = (path: string): ReactNode =>
  createElement(FeatureUnavailablePage, { feature: featureForPath(path) ?? undefined });

/** Компонент вкладки — заглушка выключенного раздела (наша или из MainLayout) */
export const isUnavailableTab = (component: ReactNode): boolean =>
  isValidElement(component) && component.type === FeatureUnavailablePage;

/**
 * Компонент для вкладки с путём path: раздел закрыт — заглушка вместо любого компонента (в том числе null,
 * чтобы MainLayout не подставил настоящий раздел); открыт — как передали
 */
export const guardTabComponent = (
  path: string,
  component: ReactNode,
  allowed: (path: string) => boolean = isPathAllowed,
): ReactNode => {
  if (allowed(path)) return component;
  return isUnavailableTab(component) ? component : unavailableTab(path);
};

/**
 * Перепроверка открытых вкладок по текущему составу функций. Закрытый раздел — заглушка, разрешённый раздел
 * с заглушкой — null (MainLayout создаст раздел заново). Ничего не изменилось — тот же массив: состояние
 * вкладок не обновляется и tabs_state не перезаписывается
 */
export const revalidateTabList = <T extends GuardedTab>(tabs: T[], allowed: (path: string) => boolean = isPathAllowed): T[] => {
  let changed = false;
  const next = tabs.map(tab => {
    const open = allowed(tab.path);
    const stub = isUnavailableTab(tab.component);
    if (!open && !stub) {
      changed = true;
      return { ...tab, component: unavailableTab(tab.path) };
    }
    if (open && stub) {
      changed = true;
      return { ...tab, component: null };
    }
    return tab;
  });
  return changed ? next : tabs;
};
