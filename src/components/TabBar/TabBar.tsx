import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import type { Tab } from '../../context/TabContext';
import Logo from '../../assets/Menu/Logo.svg';
import Arrow from '../../assets/Menu/Arrow.svg';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const MIN_TAB_WIDTH = 100;
  const MAX_TAB_WIDTH = 150;
  const LOGO_WIDTH = 165;
  const COUNTER_WIDTH = 65;
  const GAP_BETWEEN_LOGO_COUNTER = 20;
  const GAP_BETWEEN_COUNTER_TABS = 7;
  const GAP_BETWEEN_TABS = 7;

  // Проверяем, можно ли закрыть вкладку
  const canCloseTab = (tab: Tab): boolean => {
    if (tabs.length > 1) return true;
    if (tabs.length === 1 && tab.path !== '/main') return true;
    return false;
  };

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
    if (!measureContainerRef.current) return tabs.map(() => MAX_TAB_WIDTH);
    
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
    
    const totalWidth = rootContainerRef.current.clientWidth;
    const LEFT_MARGIN = 15;
    const fixedWidth = LEFT_MARGIN + LOGO_WIDTH + GAP_BETWEEN_LOGO_COUNTER + COUNTER_WIDTH + GAP_BETWEEN_COUNTER_TABS;
    const availableWidth = totalWidth - fixedWidth;
    
    if (availableWidth <= MIN_TAB_WIDTH) {
      setVisibleTabs([]);
      setTabWidths([]);
      return;
    }
    
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
    
    const maxPossibleByMinWidth = Math.floor((availableWidth + GAP_BETWEEN_TABS) / (MIN_TAB_WIDTH + GAP_BETWEEN_TABS));
    const maxCount = Math.min(tabs.length, maxPossibleByMinWidth);
    
    for (let count = maxCount; count >= 1; count--) {
      const candidateTabs = tabs.slice(-count);
      const candidateNaturalWidths = naturalWidths.slice(-count);
      const candidateGaps = (count - 1) * GAP_BETWEEN_TABS;
      const totalCandidateNatural = candidateNaturalWidths.reduce((sum, w) => sum + w, 0);
      
      if (totalCandidateNatural + candidateGaps <= availableWidth) {
        bestCount = count;
        bestWidths = candidateNaturalWidths;
        break;
      }
      
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

  const handleCloseTab = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    closeTab(id);
  };

  return (
    <div 
      ref={rootContainerRef}
      className="flex items-center h-[35px] w-full relative"
      style={{ paddingLeft: '15px' }}
    >
      {/* Логотип */}
      <div 
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: `${LOGO_WIDTH}px`, height: '35px' }}
      >
        <img 
          src={Logo} 
          alt="Logo" 
          className="h-full w-auto object-contain"
        />
      </div>

      <div style={{ width: `${GAP_BETWEEN_LOGO_COUNTER}px`, flexShrink: 0 }} />

      {/* Счетчик вкладок */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <div
          onClick={handleDropdownClick}
          className="flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md"
          style={{ 
            width: `${COUNTER_WIDTH}px`, 
            height: '35px',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
          }}
        >
          <span 
            className="font-medium"
            style={{ 
              fontSize: '15px',
              fontWeight: 500,
              color: '#2D4059',
            }}
          >
            {tabs.length}
          </span>
          <div
            style={{
              width: '12px',
              height: '12px',
              transform: showDropdown ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <img 
              src={Arrow} 
              alt="arrow" 
              style={{ width: '12px', height: '12px' }}
            />
          </div>
        </div>

        {showDropdown && tabs.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-20 min-w-[200px] max-h-64 overflow-y-auto">
            {tabs.map(tab => {
              const showCloseButton = canCloseTab(tab);
              
              return (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchFromDropdown(tab.id)}
                  className={`
                    flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors
                    ${activeTabId === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                  `}
                >
                  <span className="text-sm">{tab.label}</span>
                  {showCloseButton && (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleCloseTab(tab.id, e)}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
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
        <AnimatePresence mode="popLayout">
          {visibleTabs.map((tab, index) => {
            const isActive = activeTabId === tab.id;
            const tabWidth = tabWidths[index] || MAX_TAB_WIDTH;
            const showCloseButton = canCloseTab(tab);
            
            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 40,
                  duration: 0.3
                }}
                onClick={() => switchTab(tab.id)}
                className="relative flex items-center cursor-pointer flex-shrink-0"
                style={{ 
                  height: '35px',
                  width: `${tabWidth}px`,
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                }}
              >
                {/* Левая челка - скругление только справа */}
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    width: '4px',
                    height: '22px',
                    borderTopRightRadius: '3px',
                    borderBottomRightRadius: '3px',
                    backgroundColor: '#666EFE',
                  }}
                />
                
                {/* Текст */}
                <div
                  style={{
                    position: 'absolute',
                    left: '15px',
                    right: showCloseButton ? '31px' : '15px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#2D4059',
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
                
                {/* Крестик */}
                {showCloseButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: isActive ? 1 : 0.5, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleCloseTab(tab.id, e)}
                    className="absolute flex items-center justify-center"
                    style={{
                      right: '11px',
                      width: '8px',
                      height: '8px',
                      top: '50%',
                      marginTop: '-4px',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.opacity = isActive ? '1' : '0.5';
                    }}
                  >
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1L7 7M7 1L1 7"
                        stroke="#2D4059"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Невидимый контейнер для измерения */}
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
            {canCloseTab(tab) && (
              <span className="w-5 h-5 flex items-center justify-center">×</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabBar;