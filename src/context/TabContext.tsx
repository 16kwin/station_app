// TabContext.tsx
// Вкладки учитывают состав функций установки (раздел 8.3 проекта «Дискретное отключение функций», правила —
// в tabFeatures.ts): сохранённые вкладки выключенных разделов не восстанавливаются, раздел выключенной функции
// (закладка, прямая ссылка) открывается заглушкой «Раздел недоступен», при смене состава функций открытые
// вкладки перепроверяются.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeatureSnapshot, subscribeFeatures, useFeatureStatus } from '../services/features/featureStore';
import { guardTabComponent, restoreTabs, revalidateTabList } from './tabFeatures';

export interface Tab {
  id: string;
  path: string;
  label: string;
  component: ReactNode;
  parentTabId?: string;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (path: string, label: string, component: ReactNode, parentTabId?: string) => string;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  switchTab: (id: string) => void;
  openNewTab: () => void;
  updateTabComponent: (id: string, component: ReactNode) => void;
  updateTabLabel: (id: string, label: string) => void;
  replaceTab: (id: string, path: string, label: string, component: ReactNode) => void;
  setTabLocked: (id: string, locked: boolean) => void;
  isTabLocked: (id: string) => boolean;
  registerTabCloseGuard: (id: string, handler: () => void) => void;
  unregisterTabCloseGuard: (id: string) => void;
  triggerTabCloseGuard: (id: string) => boolean;
  /** Перепроверить открытые вкладки по составу функций (вызывается и сама при смене состава) */
  revalidateTabs: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

/**
 * Сколько вкладки ждут профиль функций перед восстановлением. Обычно профиль уже получен: его загружает
 * AuthContext после проверки входа (а после пакета F2b — FeatureProvider выше TabProvider). Если сервер
 * отвечает дольше, вкладки восстанавливаются без него: отбрасываются только разделы модулей, которых нет
 * в сборке, остальные закрытые разделы показывают заглушку до прихода профиля
 */
const PROFILE_WAIT_MS = 5000;

const getLabelWithNumber = (path: string, baseLabel: string, existingTabs: Tab[]): string => {
  const samePathTabs = existingTabs.filter(tab => tab.path === path);
  const count = samePathTabs.length;
  if (count === 0) {
    return baseLabel;
  }
  return `${baseLabel} (${count + 1})`;
};

const saveTabsToStorage = (tabs: Tab[], activeId: string | null) => {
  const toSave = {
    tabs: tabs.map(tab => ({
      id: tab.id,
      path: tab.path,
      label: tab.label,
      parentTabId: tab.parentTabId,
    })),
    activeTabId: activeId,
  };
  localStorage.setItem('tabs_state', JSON.stringify(toSave));
};

const loadTabsFromStorage = (): unknown => {
  const saved = localStorage.getItem('tabs_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

export const TabProvider = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [lockedTabs, setLockedTabs] = useState<Set<string>>(new Set());
  const closeGuardsRef = React.useRef<Map<string, () => void>>(new Map());
  const navigate = useNavigate();

  // Вкладки восстанавливаются, когда профиль функций получен (или не получен из-за сбоя)
  const featureStatus = useFeatureStatus();
  const profileSettled = featureStatus === 'ready' || featureStatus === 'error';
  const [profileWaitExpired, setProfileWaitExpired] = useState(false);

  useEffect(() => {
    if (isRestored || profileSettled) return;
    const timer = setTimeout(() => setProfileWaitExpired(true), PROFILE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isRestored, profileSettled]);

  useEffect(() => {
    if (isRestored || !(profileSettled || profileWaitExpired)) return;
    const saved = restoreTabs(loadTabsFromStorage());
    if (saved) {
      const restoredTabs: Tab[] = saved.tabs.map(tab => ({
        ...tab,
        component: null,
      }));
      setTabs(restoredTabs);
      setActiveTabId(saved.activeTabId);

      const activeTab = restoredTabs.find(t => t.id === saved.activeTabId) ?? restoredTabs[0];
      navigate(activeTab.path);
    } else {
      const mainTab: Tab = {
        id: Date.now().toString(),
        path: '/main',
        label: 'Главная',
        component: null,
      };
      setTabs([mainTab]);
      setActiveTabId(mainTab.id);
      navigate('/main');
    }
    setIsRestored(true);
  }, [isRestored, profileSettled, profileWaitExpired, navigate]);

  const revalidateTabs = useCallback(() => {
    setTabs(prevTabs => revalidateTabList(prevTabs));
  }, []);

  // Состав функций изменился (новая ревизия, первый профиль после сбоя) — перепроверяем открытые вкладки.
  // До подписки вкладки уже сверены: восстановление и заполнение разделов (updateTabComponent) читают текущий
  // профиль. Объект on меняется, только когда меняется состав, поэтому обновление профиля с тем же составом
  // вкладки не трогает. Пока профиля нет совсем (выход, смена пользователя: status idle или loading), вкладки
  // тоже не трогаем: при выходе их состояние не должно снова попасть в tabs_state
  useEffect(() => {
    if (!isRestored) return;
    let { on: lastOn, status: lastStatus } = getFeatureSnapshot();
    return subscribeFeatures(() => {
      const { on, status } = getFeatureSnapshot();
      if (on === lastOn && status === lastStatus) return;
      lastOn = on;
      lastStatus = status;
      if (status === 'ready' || status === 'error') setTabs(prevTabs => revalidateTabList(prevTabs));
    });
  }, [isRestored]);

  useEffect(() => {
    if (isRestored && tabs.length > 0) {
      saveTabsToStorage(tabs, activeTabId);
    }
  }, [tabs, activeTabId, isRestored]);

  const openTab = useCallback((path: string, baseLabel: string, component: ReactNode, parentTabId?: string): string => {
    const existingTab = tabs.find(tab => tab.path === path);
    if (existingTab) {
      if (activeTabId !== existingTab.id) {
        setActiveTabId(existingTab.id);
      }
      navigate(path);
      return existingTab.id;
    }

    const label = getLabelWithNumber(path, baseLabel, tabs);
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    const newTab: Tab = {
      id: newId,
      path,
      label,
      // Раздел выключенной функции открывается заглушкой «Раздел недоступен», а не самим разделом
      component: guardTabComponent(path, component),
      parentTabId,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    navigate(path);
    return newId;
  }, [tabs, activeTabId, navigate]);

  const replaceTab = useCallback((id: string, path: string, label: string, component: ReactNode) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === id ? { ...tab, path, label, component: guardTabComponent(path, component) } : tab
      )
    );
    navigate(path, { replace: true });
  }, [navigate]);

  const closeTabInternal = useCallback((id: string) => {
    const tabToClose = tabs.find(tab => tab.id === id);

    if (tabs.length === 1 && tabToClose?.path === '/main') {
      return;
    }

    const newTabs = tabs.filter(tab => tab.id !== id);

    if (newTabs.length === 0) {
      const mainTab: Tab = {
        id: Date.now().toString(),
        path: '/main',
        label: 'Главная',
        component: null,
      };
      setTabs([mainTab]);
      setActiveTabId(mainTab.id);
      navigate('/main');
      return;
    }

    setTabs(newTabs);

    if (activeTabId === id) {
      if (tabToClose?.parentTabId) {
        const parentTab = newTabs.find(t => t.id === tabToClose.parentTabId);
        if (parentTab) {
          setActiveTabId(parentTab.id);
          navigate(parentTab.path);
          return;
        }
      }

      const tabIndex = tabs.findIndex(tab => tab.id === id);
      const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
      const newActiveTab = newTabs[newActiveIndex];
      setActiveTabId(newActiveTab.id);
      navigate(newActiveTab.path);
    }
  }, [tabs, activeTabId, navigate]);

  // Простое закрытие без проверок guard
  const closeTab = useCallback((id: string) => {
    closeTabInternal(id);
  }, [closeTabInternal]);

  const closeAllTabs = useCallback(() => {
    const mainTab: Tab = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      path: '/main',
      label: 'Главная',
      component: null,
    };
    setTabs([mainTab]);
    setActiveTabId(mainTab.id);
    navigate('/main');
  }, [navigate]);

  const switchTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      navigate(tab.path);
    }
  }, [tabs, navigate]);

  const openNewTab = useCallback(() => {
    openTab('/main', 'Главная', null);
  }, [openTab]);

  // MainLayout подставляет сюда раздел по пути вкладки: закрытый раздел получает заглушку
  const updateTabComponent = useCallback((id: string, component: ReactNode) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === id ? { ...tab, component: guardTabComponent(tab.path, component) } : tab
      )
    );
  }, []);

  const updateTabLabel = useCallback((id: string, label: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === id ? { ...tab, label } : tab
      )
    );
  }, []);

  const setTabLocked = useCallback((id: string, locked: boolean) => {
    setLockedTabs(prev => {
      const next = new Set(prev);
      if (locked) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const isTabLocked = useCallback((id: string) => lockedTabs.has(id), [lockedTabs]);

  // Guard-методы оставлены — страница может сама их вызывать при необходимости.
  // Но closeTab их больше не дёргает.
  const registerTabCloseGuard = useCallback((id: string, handler: () => void) => {
    closeGuardsRef.current.set(id, handler);
  }, []);

  const unregisterTabCloseGuard = useCallback((id: string) => {
    closeGuardsRef.current.delete(id);
  }, []);

  const triggerTabCloseGuard = useCallback((id: string): boolean => {
    const guard = closeGuardsRef.current.get(id);
    if (guard) {
      guard();
      return true;
    }
    return false;
  }, []);

  if (!isRestored) {
    return null;
  }

  return (
    <TabContext.Provider value={{
      tabs,
      activeTabId,
      openTab,
      closeTab,
      closeAllTabs,
      switchTab,
      openNewTab,
      updateTabComponent,
      updateTabLabel,
      replaceTab,
      setTabLocked,
      isTabLocked,
      registerTabCloseGuard,
      unregisterTabCloseGuard,
      triggerTabCloseGuard,
      revalidateTabs,
    }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within TabProvider');
  }
  return context;
};
