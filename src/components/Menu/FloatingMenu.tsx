// FloatingMenu.tsx — ПОЛНЫЙ ФАЙЛ (убраны выплывающие окна)
import React, { useState, useRef, useEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import { useAuth } from '../../services/AuthContext';

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
import ArrowIcon from '../../assets/Menu/Arrow2.svg';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  isSleep?: boolean;
  iconWidth: number;
  iconHeight: number;
}

const menuItems: MenuItem[] = [
  { path: '/main', label: 'Главная', icon: Icon1, iconWidth: 24, iconHeight: 24 },
  { path: '/stations', label: 'Станции', icon: Icon2, iconWidth: 24, iconHeight: 24 },
  { path: '/references', label: 'Справочники', icon: Icon3, iconWidth: 22, iconHeight: 24 },
  { path: '/documents', label: 'Документы', icon: Icon4, iconWidth: 20, iconHeight: 24 },
  { path: '/reports', label: 'Отчеты', icon: Icon5, iconWidth: 21, iconHeight: 24 },
  { path: '/analytics', label: 'Аналитика', icon: Icon6, iconWidth: 23, iconHeight: 24 },
  { path: '/settings', label: 'Настройки', icon: Icon7, iconWidth: 25, iconHeight: 24 },
  { path: '/notifications', label: 'Уведомления', icon: Icon8, iconWidth: 23, iconHeight: 24 },
  { path: '/account', label: 'Аккаунт', icon: Icon9, iconWidth: 24, iconHeight: 24 },
  { path: '', label: 'Спящий режим', icon: LockIcon, isSleep: true, iconWidth: 21, iconHeight: 24 },
];

const FloatingMenu = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [canHoverItems, setCanHoverItems] = useState(false);
  const { openTab } = useTabs();
  const { setLocked } = useAuth();
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

  const handleNavigate = (path: string, label: string, isSleep?: boolean) => {
    if (isSleep) {
      setLocked(true);
    } else {
      openTab(path, label, null);
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
                const isItemHovered = hoveredItem === index;
                const isFirst = index === 0;
                const isLast = index === menuItems.length - 1;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-center transition-all duration-700 ease-out"
                    style={{
                      paddingLeft: isFirst ? '20px' : '15px',
                      paddingRight: isLast ? '20px' : '15px',
                    }}
                    onMouseEnter={() => handleItemMouseEnter(index)}
                    onMouseLeave={handleItemMouseLeave}
                    onClick={() => handleNavigate(item.path, item.label, item.isSleep)}
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
                        src={item.icon}
                        alt={item.label}
                        className="transition-all duration-700 ease-out"
                        style={{
                          width: `${item.iconWidth}px`,
                          height: `${item.iconHeight}px`,
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