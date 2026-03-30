// layouts/MainLayout.tsx
import { useLocation } from 'react-router-dom';
import AnimatedGradientBackground from '../effects/AnimatedGradientBackground';
import FloatingMenu from '../components/Menu/FloatingMenu';
import TabBar from '../components/TabBar/TabBar';
import { useTabs } from '../context/TabContext';
import { useEffect, useState, useRef } from 'react';
import MainPage from '../components/mainPage/MainPage';
import StationsPage from '../components/StationsPage/StationsPage';
import ReferencesPage from '../components/ReferencesPage/ReferencesPage';
import DocumentsPage from '../components/DocumentsPage/DocumentsPage';
import ReportsPage from '../components/ReportsPage/ReportsPage';
import AnalyticsPage from '../components/AnalyticsPage/AnalyticsPage';
import SettingsPage from '../components/SettingsPage/SettingsPage';
import AccountPage from '../components/AccountPage/AccountPage';
import { useAuth } from '../services/AuthContext';
import LockIcon from '../assets/Menu/Lock.svg';

// Маппинг путей к компонентам
const pageComponents: Record<string, React.ReactNode> = {
  '/main': <MainPage />,
  '/stations': <StationsPage />,
  '/references': <ReferencesPage />,
  '/documents': <DocumentsPage />,
  '/reports': <ReportsPage />,
  '/analytics': <AnalyticsPage />,
  '/settings': <SettingsPage />,
  '/account': <AccountPage />,
};

const MainLayout = () => {
  const [padding, setPadding] = useState(60);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSleepButtonVisible, setIsSleepButtonVisible] = useState(true);
  const { tabs, activeTabId, openTab, updateTabComponent } = useTabs();
  const { setLocked } = useAuth();
  const location = useLocation();
  const isInitialMount = useRef(true);

  const MIN_WIDTH = 1366;
  const MIN_HEIGHT = 768;
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let finalWidth = width;
    let finalHeight = height;
    
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      finalWidth = MIN_WIDTH;
      finalHeight = MIN_HEIGHT;
    }
    
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      finalWidth = MAX_WIDTH;
      finalHeight = MAX_HEIGHT;
    }
    
    setWindowSize({ width: finalWidth, height: finalHeight });
    setIsLoaded(true);
  }, []);

  // Проверка видимости кнопки спящего режима
  useEffect(() => {
    const checkVisibility = () => {
      const whiteBlock = document.querySelector('.white-block');
      if (whiteBlock) {
        const rect = whiteBlock.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const isFullyVisibleRight = rect.right <= windowWidth;
        const isFullyVisibleTop = rect.top >= 0;
        const isFullyVisible = isFullyVisibleRight && isFullyVisibleTop;
        setIsSleepButtonVisible(isFullyVisible);
      }
    };

    if (isLoaded) {
      checkVisibility();
      window.addEventListener('scroll', checkVisibility);
      window.addEventListener('resize', checkVisibility);
    }
    
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [isLoaded]);

  // Синхронизация URL с активной вкладкой и создание компонентов
  useEffect(() => {
    if (!isLoaded) return;
    
    const currentTab = tabs.find(tab => tab.path === location.pathname);
    
    if (currentTab) {
      // Если вкладка существует, делаем её активной
      if (activeTabId !== currentTab.id) {
        // Переключаемся на существующую вкладку
        const switchTab = () => {};
        // Нужно добавить switchTab в контекст, но пока используем navigate
      }
    } else {
      // Если вкладки нет, создаём новую
      const path = location.pathname;
      const labels: Record<string, string> = {
        '/main': 'Главная',
        '/stations': 'Станции',
        '/references': 'Справочники',
        '/documents': 'Документы',
        '/reports': 'Отчеты',
        '/analytics': 'Аналитика',
        '/settings': 'Настройки',
        '/account': 'Аккаунт',
      };
      const label = labels[path] || path.replace('/', '') || 'Главная';
      const component = pageComponents[path] || null;
      
      openTab(path, label, component);
    }
  }, [location.pathname, isLoaded]);

  // Обновляем компонент вкладки, если он изменился
  useEffect(() => {
    tabs.forEach(tab => {
      const currentComponent = pageComponents[tab.path];
      if (currentComponent && tab.component !== currentComponent) {
        updateTabComponent(tab.id, currentComponent);
      }
    });
  }, [tabs, location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const baseWidth = windowSize.width;
      const baseHeight = windowSize.height;
      
      const scaleX = width / baseWidth;
      const scaleY = height / baseHeight;
      const scale = Math.min(scaleX, scaleY);
      
      if (scale > 1) {
        setPadding(60 * scale);
      } else {
        setPadding(60);
      }
    };

    if (isLoaded) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize, isLoaded]);

  if (!isLoaded) {
    return null;
  }

  const tabBarHeight = 35;
  const topOffset = 20;
  const gapBetweenTabBarAndWhiteBlock = 5;

  return (
    <div 
      className="w-full h-dvh relative overflow-auto"
      style={{
        minWidth: `${windowSize.width}px`,
        minHeight: `${windowSize.height}px`,
      }}
    >
      <AnimatedGradientBackground />
      
      {/* Кнопка спящего режима */}
      {isSleepButtonVisible && (
        <button
          onClick={() => setLocked(true)}
          className="fixed top-5 right-5 z-50 w-9 h-9 rounded-full bg-[#3F3E3F] hover:bg-[#5a5a5a] transition-colors flex items-center justify-center shadow-lg"
          style={{ width: '36px', height: '36px' }}
        >
          <img src={LockIcon} alt="lock" className="w-5 h-5" />
        </button>
      )}
      
      <div className="w-full h-full flex items-center justify-center">
        <div 
          style={{ 
            width: `${windowSize.width}px`,
            height: `${windowSize.height}px`,
          }} 
          className="relative"
        >
          <div 
            className="absolute left-0 right-0 flex justify-center"
            style={{ 
              top: `${topOffset}px`,
            }}
          >
            <div style={{ width: `${windowSize.width - padding * 2}px` }}>
              <TabBar />
            </div>
          </div>
          
          <div 
            style={{ 
              position: 'absolute',
              left: `${padding}px`,
              right: `${padding}px`,
              top: `${topOffset + tabBarHeight + gapBetweenTabBarAndWhiteBlock}px`,
              bottom: `${padding}px`,
            }}
            className="bg-white rounded-[20px] shadow overflow-auto white-block relative"
          >
            {/* Рендерим все сохранённые компоненты вкладок */}
            {tabs.map(tab => (
              <div
                key={tab.id}
                style={{
                  display: activeTabId === tab.id ? 'block' : 'none',
                  height: '100%',
                  overflow: 'auto',
                }}
              >
                {tab.component}
              </div>
            ))}
          </div>
        </div>
      </div>
      <FloatingMenu />
    </div>
  );
};

export default MainLayout;