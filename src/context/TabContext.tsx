// context/TabContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Tab {
  id: string;
  path: string;
  label: string;
  component: ReactNode;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (path: string, label: string, component: ReactNode) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  openNewTab: () => void;
  updateTabComponent: (id: string, component: ReactNode) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const getLabelWithNumber = (path: string, baseLabel: string, existingTabs: Tab[]): string => {
  const samePathTabs = existingTabs.filter(tab => tab.path === path);
  const count = samePathTabs.length;
  
  if (count === 0) {
    return baseLabel;
  }
  
  return `${baseLabel} (${count + 1})`;
};

// Сохранение в localStorage
const saveTabsToStorage = (tabs: Tab[], activeId: string | null) => {
  const toSave = {
    tabs: tabs.map(tab => ({
      id: tab.id,
      path: tab.path,
      label: tab.label,
      // component не сохраняем, восстановим при загрузке
    })),
    activeTabId: activeId,
  };
  localStorage.setItem('tabs_state', JSON.stringify(toSave));
};

const loadTabsFromStorage = (): { tabs: Omit<Tab, 'component'>[]; activeTabId: string | null } | null => {
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
  const navigate = useNavigate();

  // Восстановление из localStorage при загрузке
  useEffect(() => {
    const saved = loadTabsFromStorage();
    if (saved && saved.tabs.length > 0) {
      // Восстанавливаем вкладки без компонентов (компоненты будут загружены позже)
      const restoredTabs: Tab[] = saved.tabs.map(tab => ({
        ...tab,
        component: null,
      }));
      setTabs(restoredTabs);
      setActiveTabId(saved.activeTabId);
      
      // Переходим на последнюю активную вкладку
      const activeTab = restoredTabs.find(t => t.id === saved.activeTabId);
      if (activeTab) {
        navigate(activeTab.path);
      } else if (restoredTabs.length > 0) {
        navigate(restoredTabs[0].path);
      }
    } else {
      // Если нет сохранённых вкладок, создаём главную
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
  }, []);

  // Сохраняем в localStorage при каждом изменении
  useEffect(() => {
    if (isRestored && tabs.length > 0) {
      saveTabsToStorage(tabs, activeTabId);
    }
  }, [tabs, activeTabId, isRestored]);

  const openTab = (path: string, baseLabel: string, component: ReactNode) => {
    const label = getLabelWithNumber(path, baseLabel, tabs);
    
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    const newTab: Tab = {
      id: newId,
      path,
      label,
      component,
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    navigate(path);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      return;
    }
    
    const tabIndex = tabs.findIndex(tab => tab.id === id);
    const newTabs = tabs.filter(tab => tab.id !== id);
    
    setTabs(newTabs);
    
    if (activeTabId === id) {
      if (newTabs.length > 0) {
        const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        const newActiveTab = newTabs[newActiveIndex];
        setActiveTabId(newActiveTab.id);
        navigate(newActiveTab.path);
      } else {
        setActiveTabId(null);
        navigate('/main');
      }
    }
  };

  const switchTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      navigate(tab.path);
    }
  };

  const openNewTab = () => {
    openTab('/main', 'Главная', null);
  };

  const updateTabComponent = (id: string, component: ReactNode) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === id ? { ...tab, component } : tab
      )
    );
  };

  if (!isRestored) {
    return null; // или лоадер
  }

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, switchTab, openNewTab, updateTabComponent }}>
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