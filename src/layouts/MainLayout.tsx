// MainLayout.tsx — ПОЛНЫЙ ФАЙЛ (добавлены роуты перемещения)
import { useLocation } from 'react-router-dom';
import FloatingMenu from '../components/Menu/FloatingMenu';
import TabBar from '../components/TabBar/TabBar';
import { useTabs } from '../context/TabContext';
import { Suspense, useEffect, useState, useRef, type ReactNode } from 'react';
import MainPage from '../components/mainPage/MainPage';
import StationsPage from '../components/StationsPage/StationsPage';
import ReferencesPage from '../components/ReferencesPage/ReferencesPage';
import DocumentsPage from '../components/DocumentsPage/DocumentsPage';
import ReportsPage from '../components/ReportsPage/ReportsPage';
import SettingsPage from '../components/SettingsPage/SettingsPage';
import AccountPage from '../components/AccountPage/AccountPage';
import SchablonPage from '../components/DocumentsPage/Schablon/SchablonPage';
import StockLevelControlPage from '../components/DocumentsPage/StockLevelControl/StockLevelControlPage';
import GppPage from '../components/DocumentsPage/Gpp/GppPage';
import StockLevelControlCreatePage from '../components/DocumentsPage/StockLevelControl/StockLevelControlCreatePage';
import RefillPage from '../components/DocumentsPage/Refill/RefillPage';
import RefillCreatePage from '../components/DocumentsPage/Refill/RefillCreatePage';
import MoveOrderPage from '../components/DocumentsPage/MoveOrder/MoveOrderPage';
import MoveOrderCreatePage from '../components/DocumentsPage/MoveOrder/MoveOrderCreatePage';
import TransferPage from '../components/DocumentsPage/Transfer/TransferPage';
import TransferCreatePage from '../components/DocumentsPage/Transfer/TransferCreatePage';
import NomenclaturePage from '../components/ReferencesPage/NomenclaturePage/NomenclaturePage';
import NomenclatureCreatePage from '../components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage';
import AccountingGroupsPage from '../components/ReferencesPage/AccountingGroupsPage/AccountingGroupsPage';
import NomenclatureGroupsPage from '../components/ReferencesPage/NomenclatureGroupsPage/NomenclatureGroupsPage';
import NomenclatureTypesPage from '../components/ReferencesPage/NomenclatureTypesPage/NomenclatureTypesPage';
import AttributeGroupsPage from '../components/ReferencesPage/AttributeGroupsPage/AttributeGroupsPage';
import AttributeTypesPage from '../components/ReferencesPage/AttributeTypesPage/AttributeTypesPage';
import UnitsPage from '../components/ReferencesPage/UnitsPage/UnitsPage';
import NomenclatureUnitsPage from '../components/ReferencesPage/NomenclatureUnitsPage/NomenclatureUnitsPage';
import ProductionDirectionsPage from '../components/ReferencesPage/ProductionDirectionsPage/ProductionDirectionsPage';
import ManufacturersPage from '../components/ReferencesPage/ManufacturersPage/ManufacturersPage';
import ManufacturerCreatePage from '../components/ReferencesPage/ManufacturersPage/ManufacturerCreatePage';
import BrandsPage from '../components/ReferencesPage/BrandsPage/BrandsPage';
import ModelsPage from '../components/ReferencesPage/ModelsPage/ModelsPage';
import SupplierDirectionsPage from '../components/ReferencesPage/SupplierDirectionsPage/SupplierDirectionsPage';
import SupplierBrandsPage from '../components/ReferencesPage/SupplierBrandsPage/SupplierBrandsPage';
import SuppliersPage from '../components/ReferencesPage/SuppliersPage/SuppliersPage';
import SupplierCreatePage from '../components/ReferencesPage/SuppliersPage/SupplierCreatePage';
import TemplatesPage from '../components/ReferencesPage/TemplatesPage/TemplatesPage';
import HoldingsPage from '../components/ReferencesPage/HoldingsPage/HoldingsPage';
import EnterprisesPage from '../components/ReferencesPage/EnterprisesPage/EnterprisesPage';
import WorkshopsPage from '../components/ReferencesPage/WorkshopsPage/WorkshopsPage';
import SectionsPage from '../components/ReferencesPage/SectionsPage/SectionsPage';
import EmployeesPage from '../components/ReferencesPage/EmployeesPage/EmployeesPage';
import StationTypesPage from '../components/ReferencesPage/StationTypesPage/StationTypesPage';
import StationManufacturersPage from '../components/ReferencesPage/StationManufacturersPage/StationManufacturersPage';
import StationModelsPage from '../components/ReferencesPage/StationModelsPage/StationModelsPage';
import StationModelCreatePage from '../components/ReferencesPage/StationModelsPage/StationModelCreatePage';
import StationConfigurationsPage from '../components/ReferencesPage/StationConfigurationsPage/StationConfigurationsPage';
import StationConfigurationCreatePage from '../components/ReferencesPage/StationConfigurationsPage/StationConfigurationCreatePage';
import StationsCrudPage from '../components/ReferencesPage/StationsCrudPage/StationsCrudPage';
import StationCreatePage from '../components/ReferencesPage/StationsCrudPage/StationCreatePage';
import LocationsPage from '../components/ReferencesPage/LocationsPage/LocationsPage';
import CountriesPage from '../components/ReferencesPage/CountriesPage/CountriesPage';
import AxiosService from '../services/AxiosService';
import ConstantInfo from '../info/ConstantInfo';
import { AnalyticsPage, OrderCreatePage, OrdersPage, TkpPage, TkpViewPage, VideoArchivePage } from '../services/features/lazyModules';
import FeatureUnavailablePage from '../services/features/FeatureUnavailablePage';
import { useFeature } from '../services/features/featureStore';
import { featureForPath } from '../services/features/routes';
import type { FeatureKey } from '../services/features/catalog';
import SecurityTab from './SecurityTab';
import {
  childTabPrefixOf,
  isChildTabPath,
  isTabSection,
  tabPathname,
  uidTabSectionOf,
  type TabChildPrefix,
  type TabSection,
  type TabUidSection,
} from './tabRoutes';

const templateInfoCache: Map<string, string> = new Map();
const nomenclatureInfoCache: Map<string, string> = new Map();
const supplierInfoCache: Map<string, string> = new Map();

const fetchTemplateName = async (uid: string): Promise<string> => {
  if (templateInfoCache.has(uid)) return templateInfoCache.get(uid)!;
  try { const response = await AxiosService.get(ConstantInfo.restApiTemplate(uid)); const name = response.data?.name || uid; templateInfoCache.set(uid, name); return name; }
  catch { templateInfoCache.set(uid, uid); return uid; }
};

const fetchNomenclatureName = async (uid: string): Promise<string> => {
  if (nomenclatureInfoCache.has(uid)) return nomenclatureInfoCache.get(uid)!;
  try { const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid)); const name = response.data?.name || uid; nomenclatureInfoCache.set(uid, name); return name; }
  catch { nomenclatureInfoCache.set(uid, uid); return uid; }
};

const fetchSupplierName = async (uid: string): Promise<string> => {
  if (supplierInfoCache.has(uid)) return supplierInfoCache.get(uid)!;
  try { const response = await AxiosService.get(ConstantInfo.restApiSupplierGet(uid)); const name = response.data?.name || uid; supplierInfoCache.set(uid, name); return name; }
  catch { supplierInfoCache.set(uid, uid); return uid; }
};

const staticComponents: Record<TabSection, ReactNode> = {
  '/main': <MainPage />, '/stations': <StationsPage />, '/references': <ReferencesPage />,
  '/documents': <DocumentsPage />, '/reports': <ReportsPage />, '/analytics': <AnalyticsPage />,
  '/orders': <OrdersPage />, '/tkp': <TkpPage />,
  '/settings': <SettingsPage />, '/account': <AccountPage />,
  '/security': <SecurityTab />,
  '/references/nomenclature': <NomenclaturePage />, '/references/templates': <TemplatesPage />,
  '/references/accounting-groups': <AccountingGroupsPage />, '/references/nomenclature-groups': <NomenclatureGroupsPage />,
  '/references/nomenclature-types': <NomenclatureTypesPage />, '/references/attribute-groups': <AttributeGroupsPage />,
  '/references/attribute-types': <AttributeTypesPage />,
  '/references/units': <UnitsPage />, '/references/nomenclature-units': <NomenclatureUnitsPage />,
  '/references/production-directions': <ProductionDirectionsPage />,
  '/references/manufacturers': <ManufacturersPage />,
  '/references/brands': <BrandsPage />, '/references/models': <ModelsPage />,
  '/references/supplier-directions': <SupplierDirectionsPage />,
  '/references/supplier-brands': <SupplierBrandsPage />,
  '/references/suppliers': <SuppliersPage />,
  '/references/countries': <CountriesPage />,
  '/references/holdings': <HoldingsPage />,
  '/references/enterprises': <EnterprisesPage />, '/references/workshops': <WorkshopsPage />,
  '/references/sections': <SectionsPage />,
  '/references/employees': <EmployeesPage />,
  '/references/station-types': <StationTypesPage />,
  '/references/station-manufacturers': <StationManufacturersPage />, '/references/station-models': <StationModelsPage />,
  '/references/station-configurations': <StationConfigurationsPage />, '/references/stations': <StationsCrudPage />,
  '/references/locations': <LocationsPage />,
  '/documents/stock-level-control': <StockLevelControlPage />,
  '/documents/refill': <RefillPage />,
  '/documents/move-orders': <MoveOrderPage />,
  '/documents/transfers': <TransferPage />,
  '/documents/video-archive': <VideoArchivePage />,
  '/documents/gpp': <GppPage />,
};

const childComponents: Record<TabChildPrefix, ReactNode> = {
  '/references/nomenclature/create/': <NomenclatureCreatePage />,
  '/references/nomenclature/edit/': <NomenclatureCreatePage />,
  '/references/suppliers/create/': <SupplierCreatePage />,
  '/references/suppliers/edit/': <SupplierCreatePage />,
  '/references/manufacturers/create/': <ManufacturerCreatePage />,
  '/references/manufacturers/edit/': <ManufacturerCreatePage />,
  '/references/station-models/create/': <StationModelCreatePage />,
  '/references/station-models/edit/': <StationModelCreatePage />,
  '/references/station-configurations/create/': <StationConfigurationCreatePage />,
  '/references/station-configurations/edit/': <StationConfigurationCreatePage />,
  '/references/stations/create/': <StationCreatePage />,
  '/references/stations/edit/': <StationCreatePage />,
  '/orders/create/': <OrderCreatePage />,
  '/documents/schablon/': <SchablonPage />,
  '/documents/stock-level-control/create/': <StockLevelControlCreatePage />,
  '/documents/stock-level-control/edit/': <StockLevelControlCreatePage />,
  '/documents/refill/create/': <RefillCreatePage />,
  '/documents/refill/edit/': <RefillCreatePage />,
  '/documents/move-orders/create/': <MoveOrderCreatePage />,
  '/documents/move-orders/edit/': <MoveOrderCreatePage />,
  '/documents/transfers/create/': <TransferCreatePage />,
  '/documents/transfers/edit/': <TransferCreatePage />,
};

const uidComponents: Record<TabUidSection, ReactNode> = {
  '/orders': <OrderCreatePage />,
  '/tkp': <TkpViewPage />,
};

const getComponentByPath = (fullPath: string): ReactNode => {
  const path = tabPathname(fullPath);
  if (isTabSection(path)) return staticComponents[path];
  const prefix = childTabPrefixOf(path);
  if (prefix !== null) return childComponents[prefix];
  const uidSection = uidTabSectionOf(path);
  if (uidSection !== null) return uidComponents[uidSection];
  return null;
};

const FeatureTab = ({ feature, children }: { feature: FeatureKey; children: ReactNode }) =>
  useFeature(feature) ? <>{children}</> : <FeatureUnavailablePage feature={feature} />;

const getGuardedComponent = (path: string): ReactNode => {
  const component = getComponentByPath(path);
  const feature = featureForPath(path);
  return component !== null && feature !== null ? <FeatureTab feature={feature}>{component}</FeatureTab> : component;
};

const getLabelByPath = (path: string): string => {
  const staticLabels: Record<TabSection, string> = {
    '/main': 'Главная', '/stations': 'Станции', '/references': 'Справочники', '/documents': 'Документы',
    '/reports': 'Отчеты', '/analytics': 'Аналитика', '/orders': 'Заказы', '/tkp': 'ТКП',
    '/settings': 'Настройки', '/account': 'Аккаунт', '/security': 'Безопасность',
    '/references/nomenclature': 'Справочник: Номенклатура', '/references/templates': 'Справочник: Шаблоны пополнения',
    '/references/accounting-groups': 'Справочник: Группы учета', '/references/nomenclature-groups': 'Справочник: Группы номенклатуры',
    '/references/nomenclature-types': 'Справочник: Виды номенклатуры', '/references/attribute-groups': 'Справочник: Группы характеристик',
    '/references/attribute-types': 'Справочник: Виды характеристик',
    '/references/units': 'Справочник: Единицы измерения характеристик', '/references/nomenclature-units': 'Справочник: Единицы измерения',
    '/references/production-directions': 'Справочник: Направления производства',
    '/references/manufacturers': 'Справочник: Производители',
    '/references/brands': 'Справочник: Бренды',
    '/references/models': 'Справочник: Модели',
    '/references/supplier-directions': 'Справочник: Направления поставщиков',
    '/references/supplier-brands': 'Справочник: Бренды поставщиков',
    '/references/suppliers': 'Справочник: Поставщики',
    '/references/countries': 'Справочник: Страны',
    '/references/holdings': 'Справочник: Холдинги', '/references/enterprises': 'Справочник: Предприятия',
    '/references/workshops': 'Справочник: Цеха', '/references/sections': 'Справочник: Участки',
    '/references/employees': 'Справочник: Сотрудники',
    '/references/station-types': 'Справочник: Типы станций', '/references/station-manufacturers': 'Справочник: Производители станций',
    '/references/station-models': 'Справочник: Модели станций', '/references/station-configurations': 'Справочник: Конфигурации станций',
    '/references/stations': 'Справочник: Станции', '/references/locations': 'Справочник: Расположения',
    '/documents/stock-level-control': 'Документ: Контроль уровня остатков',
    '/documents/refill': 'Документ: Пополнение',
    '/documents/move-orders': 'Документ: Заказ на перемещение',
    '/documents/transfers': 'Документ: Перемещение',
    '/documents/video-archive': 'Журнал событий: видеоархив',
    '/documents/gpp': 'Документ: ГПП',
  };
  if (isTabSection(path)) return staticLabels[path];
  if (path.startsWith('/references/nomenclature/create/')) { const code = path.split('/').pop(); return `Номенклатура: ${code}`; }
  if (path.startsWith('/references/nomenclature/edit/')) { const uid = path.split('/').slice(-2, -1)[0]; return nomenclatureInfoCache.get(uid) || 'Номенклатура'; }
  if (path.startsWith('/references/suppliers/create/')) { const code = path.split('/').pop(); return `Поставщик: ${code}`; }
  if (path.startsWith('/references/suppliers/edit/')) { const uid = path.split('/').pop() || ''; return supplierInfoCache.get(uid) || 'Поставщик'; }
  if (path.startsWith('/references/manufacturers/create/')) { const code = path.split('/').pop(); return `Производитель: ${code}`; }
  if (path.startsWith('/references/manufacturers/edit/')) { return 'Производитель'; }
  if (path.startsWith('/references/station-models/create/')) { const code = path.split('/').pop(); return `Модель станции: ${code}`; }
  if (path.startsWith('/references/station-models/edit/')) { return 'Модель станции'; }
  if (path.startsWith('/references/station-configurations/create/')) { const code = path.split('/').pop(); return `Конфигурация: ${code}`; }
  if (path.startsWith('/references/station-configurations/edit/')) { return 'Конфигурация станции'; }
  if (path.startsWith('/references/stations/create/')) { const code = path.split('/').pop(); return `Станция: ${code}`; }
  if (path.startsWith('/references/stations/edit/')) { return 'Станция'; }
  if (path.startsWith('/orders/create/')) { return 'Заказ (новый)'; }
  if (path.match(/^\/orders\/[^/]+$/)) { const uid = path.split('/').pop(); return `Заказ ${uid?.slice(0, 8)}`; }
  if (path.match(/^\/tkp\/[^/]+$/)) { const uid = path.split('/').pop(); return `ТКП ${uid?.slice(0, 8)}`; }
  if (path.startsWith('/documents/stock-level-control/create/')) { return 'Контроль уровня остатков (новый)'; }
  if (path.startsWith('/documents/stock-level-control/edit/')) { return 'Контроль уровня остатков'; }
  if (path.startsWith('/documents/refill/create/')) { return 'Пополнение (новый)'; }
  if (path.startsWith('/documents/refill/edit/')) { return 'Пополнение'; }
  if (path.startsWith('/documents/move-orders/create/')) { return 'Заказ на перемещение (новый)'; }
  if (path.startsWith('/documents/move-orders/edit/')) { return 'Заказ на перемещение'; }
  if (path.startsWith('/documents/transfers/create/')) { return 'Перемещение (новый)'; }
  if (path.startsWith('/documents/transfers/edit/')) { return 'Перемещение'; }
  if (path.startsWith('/documents/schablon/')) { const pathOnly = path.split('?')[0]; const uid = pathOnly.replace('/documents/schablon/', ''); const cached = templateInfoCache.get(uid); return cached ? `Шаблон - ${cached}` : `Шаблон - ${uid}`; }
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
  const MIN_HEIGHT = 920; 
  const MAX_WIDTH = 1920; 
  const MAX_HEIGHT = 1080;

  const WHITE_BLOCK_WIDTH = 1800;
  const WHITE_BLOCK_HEIGHT = 840;
  const TAB_BAR_HEIGHT = 35;
  const TAB_BAR_GAP = 5;

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
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('F') && e.key.length <= 3) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    tabs.forEach(tab => {
      if (tab.component === null) {
        const component = getGuardedComponent(tab.path);
        if (component) {
          updateTabComponent(tab.id, component);
        }
      }
    });
  }, [tabs, isLoaded, updateTabComponent]);

  useEffect(() => {
    if (!isLoaded) return;
    const fullPath = location.pathname + location.search;
    if (prevPathRef.current === fullPath) return;
    prevPathRef.current = fullPath;
    
    const existingTab = tabs.find(tab => tab.path === fullPath);
    if (existingTab) {
      if (activeTabId !== existingTab.id) switchTab(existingTab.id);
      if (existingTab.component === null) {
        const component = getGuardedComponent(location.pathname);
        if (component) updateTabComponent(existingTab.id, component);
      }
      return;
    }
    
    const label = getLabelByPath(fullPath);
    const component = getGuardedComponent(location.pathname);

    const parentTabId = isChildTabPath(location.pathname) ? (activeTabId ?? undefined) : undefined;
    const newTabId = openTab(fullPath, label, component, parentTabId);
    
    if (location.pathname.startsWith('/documents/schablon/')) { const uid = location.pathname.replace('/documents/schablon/', ''); fetchTemplateName(uid).then(name => updateTabLabel(newTabId, `Шаблон - ${name}`)); }
    if (location.pathname.startsWith('/references/nomenclature/edit/')) { const segments = location.pathname.split('/'); const uid = segments[segments.length - 2]; fetchNomenclatureName(uid).then(name => updateTabLabel(newTabId, name)); }
    if (location.pathname.startsWith('/references/suppliers/edit/')) { const uid = location.pathname.split('/').pop() || ''; if (uid) { fetchSupplierName(uid).then(name => updateTabLabel(newTabId, name)); } }
  }, [location.pathname, location.search, isLoaded]);

  useEffect(() => { 
    const fullPath = location.pathname + location.search; 
    const currentPathExists = tabs.some(tab => tab.path === fullPath); 
    if (!currentPathExists) prevPathRef.current = ''; 
  }, [tabs, location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => { 
      const width = window.innerWidth; 
      const height = window.innerHeight; 
      const scaleX = width / windowSize.width; 
      const scaleY = height / windowSize.height; 
      const scale = Math.min(scaleX, scaleY); 
      if (scale > 1) setPadding(60 * scale); 
      else setPadding(60); 
    };
    if (isLoaded) { 
      handleResize(); 
      window.addEventListener('resize', handleResize); 
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize, isLoaded]);

  if (!isLoaded) return null;

  const whiteBlockTop = (windowSize.height - WHITE_BLOCK_HEIGHT) / 2;
  const tabBarTop = whiteBlockTop - TAB_BAR_HEIGHT - TAB_BAR_GAP;

  return (
    <div className="w-full h-dvh relative overflow-auto" style={{ minWidth: `${windowSize.width}px`, minHeight: `${windowSize.height}px` }}>
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }} className="relative">
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: `${tabBarTop}px` }}>
            <div style={{ width: `${windowSize.width - padding * 2}px` }}><TabBar /></div>
          </div>
          
          <div 
            style={{ 
              position: 'absolute', 
              left: '50%', 
              marginLeft: `-${WHITE_BLOCK_WIDTH / 2}px`,
              top: `${whiteBlockTop}px`,
              width: `${WHITE_BLOCK_WIDTH}px`,
              height: `${WHITE_BLOCK_HEIGHT}px`,
              backgroundColor: '#FAFBFC',
            }} 
            className="rounded-[20px] shadow overflow-auto white-block relative"
          >
            {tabs.map(tab => (
              <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
                <Suspense fallback={null}>{tab.component}</Suspense>
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