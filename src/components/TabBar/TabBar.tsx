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
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const counterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  
  const MIN_TAB_WIDTH = 100;
  const MAX_TAB_WIDTH = 150;
  const LOGO_WIDTH = 165;
  const COUNTER_WIDTH = 65;
  const GAP_BETWEEN_LOGO_COUNTER = 20;
  const GAP_BETWEEN_COUNTER_TABS = 7;
  const GAP_BETWEEN_TABS = 7;
  const HORIZONTAL_PADDING = 15;

  const canCloseTab = (tab: Tab): boolean => {
    if (tabs.length > 1) return true;
    if (tabs.length === 1 && tab.path !== '/main') return true;
    return false;
  };

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
    
    const totalWidth = rootContainerRef.current.clientWidth;
    const fixedWidth = HORIZONTAL_PADDING + LOGO_WIDTH + GAP_BETWEEN_LOGO_COUNTER + COUNTER_WIDTH + GAP_BETWEEN_COUNTER_TABS + HORIZONTAL_PADDING;
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
    
    if (totalNeeded <= availableWidth) {
      setVisibleTabs([...tabs]);
      setTabWidths(naturalWidths);
      return;
    }
    
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

  // Функция для обновления позиции тултипа
  const updateTooltipPosition = (tabId: string) => {
    const tabElement = tabRefs.current.get(tabId);
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect();
      setTooltipPosition({
        left: rect.left + (rect.width / 2),
        top: rect.bottom + 4,
      });
    }
  };

  // Обработка тултипа с задержкой
  const handleTabMouseEnter = (tabId: string) => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredTabId(tabId);
      updateTooltipPosition(tabId);
    }, 300);
  };

  const handleTabMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setHoveredTabId(null);
  };

  // Обновление позиции тултипа при скролле или ресайзе
  useEffect(() => {
    if (!hoveredTabId) return;

    const handleUpdate = () => {
      updateTooltipPosition(hoveredTabId);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [hoveredTabId]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        counterButtonRef.current &&
        !counterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSwitchFromDropdown = (id: string) => {
    switchTab(id);
    setShowDropdown(false);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(id);
  };

  return (
    <>
      <div 
        ref={rootContainerRef}
        className="flex items-center h-[35px] w-full relative"
        style={{ paddingLeft: `${HORIZONTAL_PADDING}px`, paddingRight: `${HORIZONTAL_PADDING}px` }}
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

        {/* Счетчик вкладок с относительным позиционированием для дропдауна */}
        <div className="relative flex-shrink-0">
          <div
            ref={counterButtonRef}
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
            <motion.div
              animate={{ rotate: showDropdown ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                width: '12px',
                height: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img 
                src={Arrow} 
                alt="arrow" 
                style={{ width: '12px', height: '12px' }}
              />
            </motion.div>
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && tabs.length > 0 && (
              <motion.div 
                ref={dropdownRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: '100%',
                  marginTop: '4px',
                  width: '245px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #E5E7EB',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: '400px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>
                  {`
                    div[style*="overflowY: auto"]::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
                {tabs.map(tab => {
                  const isActive = activeTabId === tab.id;
                  const showCloseButton = canCloseTab(tab);
                  const textColor = isActive ? '#2D4059' : '#9CA3AF';
                  
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleSwitchFromDropdown(tab.id)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#E2E8FF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#BCC8FF' : '#FFFFFF',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: textColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {tab.label}
                      </span>
                      {showCloseButton && (
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleCloseTab(tab.id, e)}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            flexShrink: 0,
                            padding: 0,
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
                              stroke={isActive ? "#2D4059" : "#9CA3AF"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transition: 'stroke 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.setAttribute('stroke', '#2D4059');
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.setAttribute('stroke', isActive ? "#2D4059" : "#9CA3AF");
                              }}
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
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
            const tabWidth = tabWidths[index] || MAX_TAB_WIDTH;
            const showCloseButton = canCloseTab(tab);
            const textColor = isActive ? '#2D4059' : '#9CA3AF';
            
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
                className="flex-shrink-0"
                style={{ 
                  width: `${tabWidth}px`,
                }}
              >
                <div
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.id, el);
                    } else {
                      tabRefs.current.delete(tab.id);
                    }
                  }}
                  onClick={() => switchTab(tab.id)}
                  onMouseEnter={() => handleTabMouseEnter(tab.id)}
                  onMouseLeave={handleTabMouseLeave}
                  className="relative flex items-center cursor-pointer"
                  style={{ 
                    height: '35px',
                    width: '100%',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  {/* Левая челка */}
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
                  
                  {/* Текст - цвет применяется к div с text-overflow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '15px',
                      right: showCloseButton ? '31px' : '15px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: textColor,
                      fontSize: '15px',
                      fontWeight: 500,
                    }}
                  >
                    {tab.label}
                  </div>
                  
                  {/* Крестик */}
                  {showCloseButton && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                          stroke={isActive ? "#2D4059" : "#9CA3AF"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transition: 'stroke 0.2s ease',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.setAttribute('stroke', '#2D4059');
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.setAttribute('stroke', isActive ? "#2D4059" : "#9CA3AF");
                          }}
                        />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
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
              className="flex items-center"
              style={{ height: '35px', width: 'auto' }}
            >
              <div
                style={{
                  paddingLeft: '15px',
                  paddingRight: '31px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 500 }}>
                  {tab.label}
                </span>
              </div>
              <div style={{ width: '8px', marginLeft: '-23px', marginRight: '11px' }}>
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M1 1L7 7M7 1L1 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredTabId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              transform: 'translateX(-50%)',
              backgroundColor: '#FFFFFF',
              color: '#2D4059',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              zIndex: 9999,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E5E7EB',
            }}
          >
            {tabs.find(t => t.id === hoveredTabId)?.label}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TabBar;