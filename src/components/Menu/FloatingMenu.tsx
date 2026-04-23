// components/Menu/FloatingMenu.tsx
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
import LockIcon from '../../assets/Menu/Lock.svg';
import ArrowIcon from '../../assets/Menu/Arrow2.svg';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  isSleep?: boolean;
}

const menuItems: MenuItem[] = [
  { path: '/main', label: 'Главная', icon: Icon1 },
  { path: '/stations', label: 'Станции', icon: Icon2 },
  { path: '/references', label: 'Справочники', icon: Icon3 },
  { path: '/documents', label: 'Документы', icon: Icon4 },
  { path: '/reports', label: 'Отчеты', icon: Icon5 },
  { path: '/analytics', label: 'Аналитика', icon: Icon6 },
  { path: '/settings', label: 'Настройки', icon: Icon7 },
  { path: '/notifications', label: 'Уведомления', icon: Icon8 },
  { path: '/account', label: 'Аккаунт', icon: Icon9 },
  { path: '', label: 'Спящий режим', icon: LockIcon, isSleep: true },
];

const FloatingMenu = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { openTab } = useTabs();
  const { setLocked } = useAuth();
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);

    collapseTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleNavigate = (path: string, label: string, isSleep?: boolean) => {
    if (isSleep) {
      setLocked(true);
    } else {
      openTab(path, label, null);
    }
    setHoveredItem(null);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 px-4 flex justify-center"
      style={{
        width: 'auto',
        minWidth: '702px',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          display: 'inline-block',
          width: 'auto',
          minWidth: '702px',
        }}
      >
        <div 
          className={`transition-all duration-1000 ease-out ${
            isHovered 
              ? '-translate-y-4 rounded-[30px] bg-[#3F3E3F] shadow-xl' 
              : 'translate-y-[30px] rounded-t-[30px] bg-[#3F3E3F]'
          } flex items-center justify-center px-4 cursor-pointer relative`}
          style={{
            height: isHovered ? 'auto' : '60px',
            minHeight: '60px',
            paddingTop: isHovered ? '10px' : '0',
            paddingBottom: isHovered ? '10px' : '0',
            width: isHovered ? 'auto' : '702px',
            minWidth: '702px',
            transformOrigin: 'center',
          }}
        >
          {/* Стрелка в скрытом состоянии */}
          {!isHovered && (
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '10px' }}>
              <img 
                src={ArrowIcon} 
                alt="arrow" 
                className="w-5 h-auto"
              />
            </div>
          )}

          {isHovered && (
            <div className="flex items-center animate-fadeIn">
              {menuItems.map((item, index) => {
                const isItemHovered = hoveredItem === index;
                
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-center transition-all duration-700 ease-out"
                    style={{ 
                      marginLeft: index === 0 ? '0' : '30px', 
                      marginRight: index === menuItems.length - 1 ? '0' : '0',
                    }}
                  >
                    <div
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleNavigate(item.path, item.label, item.isSleep)}
                      className="relative flex items-center justify-center cursor-pointer transition-all duration-700 ease-out"
                      style={{
                        width: isItemHovered ? '120px' : '40px',
                        height: '40px',
                        borderRadius: '40px',
                        transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
                      }}
                    >
                      <span 
                        className="absolute text-white text-sm font-medium whitespace-nowrap transition-all duration-700 ease-out"
                        style={{
                          opacity: isItemHovered ? 1 : 0,
                          transform: isItemHovered ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
                          left: '50%',
                          top: '50%',
                        }}
                      >
                        {item.label}
                      </span>
                      <img 
                        src={item.icon} 
                        alt={item.label} 
                        className="w-6 h-6 transition-all duration-700 ease-out"
                        style={{
                          opacity: isItemHovered ? 0 : 1,
                          transform: isItemHovered ? 'scale(0)' : 'scale(1)',
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
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FloatingMenu;