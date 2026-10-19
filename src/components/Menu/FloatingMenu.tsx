// FloatingMenu.tsx — ПОЛНЫЙ ФАЙЛ (убраны выплывающие окна)
// Пункты меню и их функции — в menuItems.ts: пункт выключенной функции не показывается (раздел 8.2 проекта
// «Дискретное отключение функций»), «Безопасность» — только при canViewSecurity.
import { useState, useRef, useEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import { useAuth } from '../../services/AuthContext';
import { useFeatureSnapshot } from '../../services/features/featureStore';
import { visibleMenuItems, type MenuIcon, type MenuItem } from './menuItems';

import Icon1 from '../../assets/Menu/1.svg';
import Icon2 from '../../assets/Menu/2.svg';
import Icon3 from '../../assets/Menu/3.svg';
import Icon4 from '../../assets/Menu/4.svg';
import Icon5 from '../../assets/Menu/5.svg';
import Icon6 from '../../assets/Menu/6.svg';
import Icon7 from '../../assets/Menu/7.svg';
import Icon8 from '../../assets/Menu/8.svg';
import Icon9 from '../../assets/Menu/9.svg';
import LockIcon from '../../assets/Menu/10.svg';
import SecurityIcon from '../../assets/Menu/11.svg';
import ArrowIcon from '../../assets/Menu/Arrow2.svg';

const MENU_ICONS: Record<MenuIcon, { src: string; width: number; height: number }> = {
  main: { src: Icon1, width: 24, height: 24 },
  stations: { src: Icon2, width: 24, height: 24 },
  references: { src: Icon3, width: 22, height: 24 },
  documents: { src: Icon4, width: 20, height: 24 },
  reports: { src: Icon5, width: 21, height: 24 },
  analytics: { src: Icon6, width: 23, height: 24 },
  settings: { src: Icon7, width: 25, height: 24 },
  notifications: { src: Icon8, width: 23, height: 24 },
  security: { src: SecurityIcon, width: 22, height: 24 },
  account: { src: Icon9, width: 24, height: 24 },
  sleep: { src: LockIcon, width: 21, height: 24 },
};

const FloatingMenu = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [canHoverItems, setCanHoverItems] = useState(false);
  const { openTab } = useTabs();
  const { setLocked } = useAuth();
  const { on, profile } = useFeatureSnapshot();
  const menuItems = visibleMenuItems(key => on.has(key), profile?.canViewSecurity === true);
  const itemLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverEnableTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedMenuRef = useRef<HTMLDivElement | null>(null);
  const menuFullyClosedRef = useRef(true);

  useEffect(() => {
    const checkVisibility = () => {
      const whiteBlock = document.querySelector('.white-block');
      if (whiteBlock) {
        const rect = whiteBlock.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isFullyVisible = rect.bottom <= windowHeight;
        setIsVisible(isFullyVisible);
      }
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);

    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, []);

  const collapseMenu = () => {
    setIsHovered(false);
    setCanHoverItems(false);
    menuFullyClosedRef.current = true;
    setHoveredItem(null);
  };

  const enableHoverWithDelay = () => {
    if (hoverEnableTimeoutRef.current) {
      clearTimeout(hoverEnableTimeoutRef.current);
    }
    setCanHoverItems(false);
    menuFullyClosedRef.current = false;
    hoverEnableTimeoutRef.current = setTimeout(() => {
      setCanHoverItems(true);
    }, 500);
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);

    if (menuFullyClosedRef.current || !canHoverItems) {
      enableHoverWithDelay();
    }
  };

  const handleMouseLeave = () => {
    if (hoverEnableTimeoutRef.current) {
      clearTimeout(hoverEnableTimeoutRef.current);
      hoverEnableTimeoutRef.current = null;
    }

    collapseTimeoutRef.current = setTimeout(() => {
      collapseMenu();
    }, 700);
  };

  const handleItemMouseEnter = (index: number) => {
    if (itemLeaveTimeoutRef.current) {
      clearTimeout(itemLeaveTimeoutRef.current);
      itemLeaveTimeoutRef.current = null;
    }
    setHoveredItem(index);
  };

  const handleItemMouseLeave = () => {
    itemLeaveTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (itemLeaveTimeoutRef.current) clearTimeout(itemLeaveTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
      if (hoverEnableTimeoutRef.current) clearTimeout(hoverEnableTimeoutRef.current);
    };
  }, []);

  const handleNavigate = (item: MenuItem) => {
    if (item.isSleep) {
      setLocked(true);
    } else {
      const target = item.opens ?? item;
      openTab(target.path, target.label, null);
    }
    setHoveredItem(null);
    collapseMenu();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 px-4 flex justify-center"
      style={{ width: 'auto', minWidth: '640px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="transition-all duration-1000 ease-out relative"
        style={{ display: 'inline-block', width: 'auto', minWidth: '640px' }}
      >
        <div
          ref={expandedMenuRef}
          className={`transition-all duration-1000 ease-out ${
            isHovered
              ? '-translate-y-10 rounded-[30px] bg-[#3F3E3F] shadow-xl'
              : 'translate-y-[30px] rounded-[30px] bg-[#3F3E3F]'
          } flex items-center justify-center px-4 cursor-pointer relative`}
          style={{
            height: isHovered ? 'auto' : '60px',
            minHeight: isHovered ? '64px' : '60px',
            paddingTop: isHovered ? '17px' : '0',
            paddingBottom: isHovered ? '17px' : '0',
            width: isHovered ? 'auto' : '640px',
            minWidth: '640px',
            transformOrigin: 'center',
          }}
        >
          {!isHovered && (
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '10px' }}>
              <img src={ArrowIcon} alt="arrow" className="w-5 h-auto" />
            </div>
          )}

          {isHovered && (
            <div className="flex items-center animate-fadeIn">
              {menuItems.map((item, index) => {
                const icon = MENU_ICONS[item.icon];
                const isItemHovered = hoveredItem === index;
                const isFirst = index === 0;
                const isLast = index === menuItems.length - 1;

                return (
                  <div
                    key={item.path || item.label}
                    className="flex items-center justify-center transition-all duration-700 ease-out"
                    style={{
                      paddingLeft: isFirst ? '20px' : '15px',
                      paddingRight: isLast ? '20px' : '15px',
                    }}
                    onMouseEnter={() => handleItemMouseEnter(index)}
                    onMouseLeave={handleItemMouseLeave}
                    onClick={() => handleNavigate(item)}
                  >
                    <div
                      className="relative flex items-center justify-center cursor-pointer transition-all duration-700 ease-out"
                      style={{
                        width: isItemHovered && canHoverItems ? '120px' : '30px',
                        height: '30px',
                        borderRadius: '30px',
                        transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
                      }}
                    >
                      <span
                        className="absolute text-white text-sm font-medium whitespace-nowrap transition-all duration-700 ease-out"
                        style={{
                          opacity: isItemHovered && canHoverItems ? 1 : 0,
                          transform: isItemHovered && canHoverItems ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
                          left: '50%',
                          top: '50%',
                        }}
                      >
                        {item.label}
                      </span>
                      <img
                        src={icon.src}
                        alt={item.label}
                        className="transition-all duration-700 ease-out"
                        style={{
                          width: `${icon.width}px`,
                          height: `${icon.height}px`,
                          opacity: isItemHovered && canHoverItems ? 0 : 1,
                          transform: isItemHovered && canHoverItems ? 'scale(0)' : 'scale(1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FloatingMenu;