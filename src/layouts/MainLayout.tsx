// MainLayout.tsx
import { useLocation } from 'react-router-dom';
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
import SchablonPage from '../components/DocumentsPage/Schablon/SchablonPage';
import NomenclaturePage from '../components/ReferencesPage/NomenclaturePage/NomenclaturePage';
import NomenclatureCreatePage from '../components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage';
import AccountingGroupsPage from '../components/ReferencesPage/AccountingGroupsPage/AccountingGroupsPage';
import NomenclatureGroupsPage from '../components/ReferencesPage/NomenclatureGroupsPage/NomenclatureGroupsPage';
import NomenclatureTypesPage from '../components/ReferencesPage/NomenclatureTypesPage/NomenclatureTypesPage';
import UnitsPage from '../components/ReferencesPage/UnitsPage/UnitsPage';
import BrandsPage from '../components/ReferencesPage/BrandsPage/BrandsPage';
import ModelsPage from '../components/ReferencesPage/ModelsPage/ModelsPage';
import CountriesPage from '../components/ReferencesPage/CountriesPage/CountriesPage';
import ManufacturersPage from '../components/ReferencesPage/ManufacturersPage/ManufacturersPage';
import SuppliersPage from '../components/ReferencesPage/SuppliersPage/SuppliersPage';
import AxiosService from '../services/AxiosService';
import ConstantInfo from '../info/ConstantInfo';

const stationInfoCache: Map<string, { name: string; workshop: string; section: string }> = new Map();

const fetchStationInfo = async (uid: string): Promise<{ name: string; workshop: string; section: string }> => {
  if (stationInfoCache.has(uid)) {
    return stationInfoCache.get(uid)!;
  }
  
  try {
    const response = await AxiosService.get(`${ConstantInfo.restApiStationsStatic}/${uid}`);
    const data = response.data;
    const info = {
      name: data?.name || uid,
      workshop: data?.workshop || '',
      section: data?.section || '',
    };
    stationInfoCache.set(uid, info);
    return info;
  } catch {
    const fallback = { name: uid, workshop: '', section: '' };
    stationInfoCache.set(uid, fallback);
    return fallback;
  }
};

const staticComponents: Record<string, React.ReactNode> = {
  '/main': <MainPage />,
  '/stations': <StationsPage />,
  '/references': <ReferencesPage />,
  '/documents': <DocumentsPage />,
  '/reports': <ReportsPage />,
  '/analytics': <AnalyticsPage />,
  '/settings': <SettingsPage />,
  '/account': <AccountPage />,
  '/references/nomenclature': <NomenclaturePage />,
  '/references/accounting-groups': <AccountingGroupsPage />,
  '/references/nomenclature-groups': <NomenclatureGroupsPage />,
  '/references/nomenclature-types': <NomenclatureTypesPage />,
  '/references/units': <UnitsPage />,
  '/references/brands': <BrandsPage />,
  '/references/models': <ModelsPage />,
  '/references/countries': <CountriesPage />,
  '/references/manufacturers': <ManufacturersPage />,
  '/references/suppliers': <SuppliersPage />,
};

const getComponentByPath = (path: string): React.ReactNode => {
  if (staticComponents[path] !== undefined) return staticComponents[path];
  
  if (path.startsWith('/references/nomenclature/create/')) {
    return <NomenclatureCreatePage />;
  }
  
  const schablonMatch = path.match(/^\/documents\/schablon\/(.+)$/);
  if (schablonMatch) {
    return <SchablonPage />;
  }
  
  return null;
};

const getLabelByPath = (path: string): string => {
  const staticLabels: Record<string, string> = {
    '/main': 'Главная',
    '/stations': 'Станции',
    '/references': 'Справочники',
    '/documents': 'Документы',
    '/reports': 'Отчеты',
    '/analytics': 'Аналитика',
    '/settings': 'Настройки',
    '/account': 'Аккаунт',
    '/references/nomenclature': 'Справочник: Номенклатура',
    '/references/accounting-groups': 'Справочник: Группы учета',
    '/references/nomenclature-groups': 'Справочник: Группы номенклатуры',
    '/references/nomenclature-types': 'Справочник: Виды номенклатуры',
    '/references/units': 'Справочник: Единицы измерения',
    '/references/brands': 'Справочник: Бренды',
    '/references/models': 'Справочник: Модели',
    '/references/countries': 'Справочник: Страны',
    '/references/manufacturers': 'Справочник: Производители',
    '/references/suppliers': 'Справочник: Поставщики',
  };
  
  if (staticLabels[path]) return staticLabels[path];
  
  if (path.startsWith('/references/nomenclature/create/')) {
    const code = path.split('/').pop();
    return `Номенклатура: ${code}`;
  }
  
  if (path.startsWith('/documents/schablon/')) {
    const uid = path.replace('/documents/schablon/', '');
    const cached = stationInfoCache.get(uid);
    if (cached) {
      return `Шаблон - ${cached.name}`;
    }
    return `Шаблон - ${uid}`;
  }
  
  return path.replace('/', '') || 'Главная';
};

const MainLayout = () => {
  const [padding, setPadding] = useState(60);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [isLoaded, setIsLoaded] = useState(false);
  const { tabs, activeTabId, openTab, updateTabComponent, updateTabLabel, switchTab } = useTabs();
  const location = useLocation();
  const prevPathRef = useRef('');

  const MIN_WIDTH = 1920;
  const MIN_HEIGHT = 900;
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

  useEffect(() => {
    if (!isLoaded) return;
    
    const path = location.pathname;
    
    if (prevPathRef.current === path) {
      return;
    }
    prevPathRef.current = path;
    
    const existingTab = tabs.find(tab => tab.path === path);
    
    if (existingTab) {
      if (activeTabId !== existingTab.id) {
        switchTab(existingTab.id);
      }
      if (existingTab.component === null) {
        const component = getComponentByPath(path);
        if (component) {
          updateTabComponent(existingTab.id, component);
        }
      }
      return;
    }
    
    const label = getLabelByPath(path);
    const component = getComponentByPath(path);
    
    const newTabId = openTab(path, label, component);
    
    if (path.startsWith('/documents/schablon/')) {
      const uid = path.replace('/documents/schablon/', '');
      fetchStationInfo(uid).then(info => {
        updateTabLabel(newTabId, `Шаблон - ${info.name}`);
      });
    }
  }, [location.pathname, isLoaded]);

  useEffect(() => {
    const currentPathExists = tabs.some(tab => tab.path === location.pathname);
    if (!currentPathExists) {
      prevPathRef.current = '';
    }
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
              backgroundColor: '#FAFBFC',
            }}
            className="rounded-[20px] shadow overflow-auto white-block relative"
          >
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