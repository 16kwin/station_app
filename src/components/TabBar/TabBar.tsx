import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import type { Tab } from '../../context/TabContext';

const TabBar = () => {
  const { tabs, activeTabId, closeTab, switchTab, openNewTab } = useTabs();
  const [showDropdown, setShowDropdown] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<Tab[]>([]);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);
  
  const MIN_TAB_WIDTH = 120;
  const MAX_TAB_WIDTH = 300;
  const LOGO_WIDTH = 165;
  const COUNTER_WIDTH = 85;
  const GAP_BETWEEN_LOGO_COUNTER = 20;
  const GAP_BETWEEN_COUNTER_TABS = 7;
  const GAP_BETWEEN_TABS = 7;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Получаем естественные ширины всех вкладок через измеряющий контейнер
  const getNaturalWidths = (): number[] => {
    if (!measureContainerRef.current) return tabs.map(() => MIN_TAB_WIDTH);
    
    const widths: number[] = [];
    const children = measureContainerRef.current.children;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const naturalWidth = child.offsetWidth;
      const clampedWidth = Math.min(MAX_TAB_WIDTH, Math.max(MIN_TAB_WIDTH, naturalWidth));
      widths.push(clampedWidth);
    }
    
    return widths;
  };

  const calculateVisibleTabs = () => {
    if (!rootContainerRef.current || tabs.length === 0) return;
    
    // Получаем общую ширину контейнера TabBar
    const totalWidth = rootContainerRef.current.clientWidth;
    
    // Фиксированная ширина левой части (логотип + отступ + счетчик + отступ)
    const fixedWidth = LOGO_WIDTH + GAP_BETWEEN_LOGO_COUNTER + COUNTER_WIDTH + GAP_BETWEEN_COUNTER_TABS;
    const availableWidth = totalWidth - fixedWidth;
    
    if (availableWidth <= MIN_TAB_WIDTH) {
      setVisibleTabs([]);
      setTabWidths([]);
      return;
    }
    
    // Получаем естественные ширины
    const naturalWidths = getNaturalWidths();
    const totalGaps = (tabs.length - 1) * GAP_BETWEEN_TABS;
    const totalNaturalWidth = naturalWidths.reduce((sum, w) => sum + w, 0);
    const totalNeeded = totalNaturalWidth + totalGaps;
    
    // Если всё помещается
    if (totalNeeded <= availableWidth) {
      setVisibleTabs([...tabs]);
      setTabWidths(naturalWidths);
      return;
    }
    
    // Пытаемся поместить как можно больше вкладок
    let bestCount = 0;
    let bestWidths: number[] = [];
    
    // Начинаем с максимального количества вкладок, которые могут поместиться хотя бы с минимальной шириной
    const maxPossibleByMinWidth = Math.floor((availableWidth + GAP_BETWEEN_TABS) / (MIN_TAB_WIDTH + GAP_BETWEEN_TABS));
    const maxCount = Math.min(tabs.length, maxPossibleByMinWidth);
    
    for (let count = maxCount; count >= 1; count--) {
      // Показываем последние count вкладок
      const candidateTabs = tabs.slice(-count);
      const candidateNaturalWidths = naturalWidths.slice(-count);
      const candidateGaps = (count - 1) * GAP_BETWEEN_TABS;
      const totalCandidateNatural = candidateNaturalWidths.reduce((sum, w) => sum + w, 0);
      
      // Проверяем, помещаются ли без сжатия
      if (totalCandidateNatural + candidateGaps <= availableWidth) {
        bestCount = count;
        bestWidths = candidateNaturalWidths;
        break;
      }
      
      // Пробуем сжать
      const availableForWidths = availableWidth - candidateGaps;
      if (availableForWidths > 0) {
        const scale = availableForWidths / totalCandidateNatural;
        const compressedWidths = candidateNaturalWidths.map(w => {
          const compressed = w * scale;
          return Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, compressed));
        });
        
        const totalCompressed = compressedWidths.reduce((sum, w) => sum + w, 0);
        
        if (totalCompressed + candidateGaps <= availableWidth + 0.5) {
          bestCount = count;
          bestWidths = compressedWidths;
          break;
        }
      }
    }
    
    if (bestCount > 0) {
      setVisibleTabs(tabs.slice(-bestCount));
      setTabWidths(bestWidths);
    } else if (tabs.length > 0) {
      // Хотя бы одну показываем
      setVisibleTabs([tabs[tabs.length - 1]]);
      setTabWidths([MIN_TAB_WIDTH]);
    } else {
      setVisibleTabs([]);
      setTabWidths([]);
    }
  };

  useLayoutEffect(() => {
    if (tabs.length > 0) {
      calculateVisibleTabs();
    } else {
      setVisibleTabs([]);
      setTabWidths([]);
    }
  }, [tabs]);
  
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    
    if (rootContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateVisibleTabs();
      });
      resizeObserver.observe(rootContainerRef.current);
    }
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [tabs]);

  // Также пересчитываем при монтировании и изменениях
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateVisibleTabs();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [tabs]);

  const handleDropdownClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSwitchFromDropdown = (id: string) => {
    switchTab(id);
    setShowDropdown(false);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    closeTab(id);
  };

  return (
    <div 
      ref={rootContainerRef}
      className="flex items-center h-[35px] w-full relative"
    >
      {/* Логотип */}
      <div 
        className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-md flex items-center justify-center"
        style={{ width: `${LOGO_WIDTH}px`, height: '35px' }}
      >
        <span className="text-gray-700 font-medium text-sm">Логотип</span>
      </div>

      <div style={{ width: `${GAP_BETWEEN_LOGO_COUNTER}px`, flexShrink: 0 }} />

      {/* Счетчик вкладок */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <div
          onClick={handleDropdownClick}
          className="flex items-center justify-between gap-2 px-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md cursor-pointer hover:bg-white transition-colors"
          style={{ width: `${COUNTER_WIDTH}px`, height: '35px' }}
        >
          <span className="text-sm font-medium text-gray-700">{tabs.length}</span>
          <span className="text-gray-500 text-xs">▼</span>
        </div>

        {showDropdown && tabs.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-20 min-w-[200px] max-h-64 overflow-y-auto">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => handleSwitchFromDropdown(tab.id)}
                className={`
                  flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors
                  ${activeTabId === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
              >
                <span className="text-sm">{tab.label}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Отступ между счетчиком и вкладками */}
      <div style={{ width: `${GAP_BETWEEN_COUNTER_TABS}px`, flexShrink: 0 }} />

      {/* Контейнер для вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center flex-1 min-w-0 overflow-hidden"
        style={{ gap: `${GAP_BETWEEN_TABS}px` }}
      >
        {visibleTabs.map((tab, index) => {
          const isActive = activeTabId === tab.id;
          const tabWidth = tabWidths[index] || MIN_TAB_WIDTH;
          
          return (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 rounded-xl cursor-pointer transition-all flex-shrink-0
                ${isActive 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                }
              `}
              style={{ 
                height: '35px',
                width: `${tabWidth}px`,
              }}
            >
              <span className="text-sm font-medium truncate flex-1 min-w-0">{tab.label}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className={`
                    w-5 h-5 flex items-center justify-center rounded-full transition-colors flex-shrink-0
                    ${isActive 
                      ? 'hover:bg-blue-400 text-white' 
                      : 'hover:bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Невидимый контейнер для измерения — с такой же структурой, как основной */}
      <div
        ref={measureContainerRef}
        className="fixed invisible top-0 left-0 flex"
        style={{ 
          gap: `${GAP_BETWEEN_TABS}px`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {tabs.map(tab => (
          <div
            key={`measure-${tab.id}`}
            className="flex items-center gap-2 px-3 rounded-xl"
            style={{ height: '35px', width: 'auto' }}
          >
            <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
            {tabs.length > 1 && (
              <span className="w-5 h-5 flex items-center justify-center">×</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabBar;