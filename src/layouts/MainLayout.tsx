// MainLayout.tsx — ПОЛНЫЙ ФАЙЛ
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
import AttributeTypesPage from '../components/ReferencesPage/AttributeTypesPage/AttributeTypesPage';
import UnitsPage from '../components/ReferencesPage/UnitsPage/UnitsPage';
import BrandsPage from '../components/ReferencesPage/BrandsPage/BrandsPage';
import ModelsPage from '../components/ReferencesPage/ModelsPage/ModelsPage';
import CountriesPage from '../components/ReferencesPage/CountriesPage/CountriesPage';
import ManufacturersPage from '../components/ReferencesPage/ManufacturersPage/ManufacturersPage';
import SuppliersPage from '../components/ReferencesPage/SuppliersPage/SuppliersPage';
import SupplierCreatePage from '../components/ReferencesPage/SuppliersPage/SupplierCreatePage';
import TemplatesPage from '../components/ReferencesPage/TemplatesPage/TemplatesPage';
import EnterprisesPage from '../components/ReferencesPage/EnterprisesPage/EnterprisesPage';
import WorkshopsPage from '../components/ReferencesPage/WorkshopsPage/WorkshopsPage';
import SectionsPage from '../components/ReferencesPage/SectionsPage/SectionsPage';
import StationTypesPage from '../components/ReferencesPage/StationTypesPage/StationTypesPage';
import StationManufacturersPage from '../components/ReferencesPage/StationManufacturersPage/StationManufacturersPage';
import StationModelsPage from '../components/ReferencesPage/StationModelsPage/StationModelsPage';
import StationModelCreatePage from '../components/ReferencesPage/StationModelsPage/StationModelCreatePage';
import StationConfigurationsPage from '../components/ReferencesPage/StationConfigurationsPage/StationConfigurationsPage';
import StationConfigurationCreatePage from '../components/ReferencesPage/StationConfigurationsPage/StationConfigurationCreatePage';
import AxiosService from '../services/AxiosService';
import ConstantInfo from '../info/ConstantInfo';

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
  '/references/templates': <TemplatesPage />,
  '/references/accounting-groups': <AccountingGroupsPage />,
  '/references/nomenclature-groups': <NomenclatureGroupsPage />,
  '/references/nomenclature-types': <NomenclatureTypesPage />,
  '/references/attribute-types': <AttributeTypesPage />,
  '/references/units': <UnitsPage />,
  '/references/brands': <BrandsPage />,
  '/references/models': <ModelsPage />,
  '/references/countries': <CountriesPage />,
  '/references/manufacturers': <ManufacturersPage />,
  '/references/suppliers': <SuppliersPage />,
  '/references/enterprises': <EnterprisesPage />,
  '/references/workshops': <WorkshopsPage />,
  '/references/sections': <SectionsPage />,
  '/references/station-types': <StationTypesPage />,
  '/references/station-manufacturers': <StationManufacturersPage />,
  '/references/station-models': <StationModelsPage />,
  '/references/station-configurations': <StationConfigurationsPage />,
};

const getComponentByPath = (path: string): React.ReactNode => {
  if (staticComponents[path] !== undefined) return staticComponents[path];
  if (path.startsWith('/references/nomenclature/create/')) return <NomenclatureCreatePage />;
  if (path.startsWith('/references/nomenclature/edit/')) return <NomenclatureCreatePage />;
  if (path.startsWith('/references/suppliers/create/')) return <SupplierCreatePage />;
  if (path.startsWith('/references/suppliers/edit/')) return <SupplierCreatePage />;
  if (path.startsWith('/references/station-models/create/')) return <StationModelCreatePage />;
  if (path.startsWith('/references/station-models/edit/')) return <StationModelCreatePage />;
  if (path.startsWith('/references/station-configurations/create/')) return <StationConfigurationCreatePage />;
  if (path.startsWith('/references/station-configurations/edit/')) return <StationConfigurationCreatePage />;
  const schablonMatch = path.match(/^\/documents\/schablon\/(.+)$/);
  if (schablonMatch) return <SchablonPage />;
  return null;
};

const getLabelByPath = (path: string): string => {
  const staticLabels: Record<string, string> = {
    '/main': 'Главная', '/stations': 'Станции', '/references': 'Справочники', '/documents': 'Документы',
    '/reports': 'Отчеты', '/analytics': 'Аналитика', '/settings': 'Настройки', '/account': 'Аккаунт',
    '/references/nomenclature': 'Справочник: Номенклатура',
    '/references/templates': 'Справочник: Шаблоны пополнения',
    '/references/accounting-groups': 'Справочник: Группы учета',
    '/references/nomenclature-groups': 'Справочник: Группы номенклатуры',
    '/references/nomenclature-types': 'Справочник: Виды номенклатуры',
    '/references/attribute-types': 'Справочник: Виды характеристик',
    '/references/units': 'Справочник: Единицы измерения',
    '/references/brands': 'Справочник: Бренды', '/references/models': 'Справочник: Модели',
    '/references/countries': 'Справочник: Страны', '/references/manufacturers': 'Справочник: Производители',
    '/references/suppliers': 'Справочник: Поставщики',
    '/references/enterprises': 'Справочник: Предприятия',
    '/references/workshops': 'Справочник: Цеха',
    '/references/sections': 'Справочник: Участки',
    '/references/station-types': 'Справочник: Типы станций',
    '/references/station-manufacturers': 'Справочник: Производители станций',
    '/references/station-models': 'Справочник: Модели станций',
    '/references/station-configurations': 'Справочник: Конфигурации станций',
  };
  if (staticLabels[path]) return staticLabels[path];
  if (path.startsWith('/references/nomenclature/create/')) { const code = path.split('/').pop(); return `Номенклатура: ${code}`; }
  if (path.startsWith('/references/nomenclature/edit/')) { const uid = path.split('/').slice(-2, -1)[0]; return nomenclatureInfoCache.get(uid) || 'Номенклатура'; }
  if (path.startsWith('/references/suppliers/create/')) { const code = path.split('/').pop(); return `Поставщик: ${code}`; }
  if (path.startsWith('/references/suppliers/edit/')) { const uid = path.split('/').slice(-2, -1)[0]; return supplierInfoCache.get(uid) || 'Поставщик'; }
  if (path.startsWith('/references/station-models/create/')) { const code = path.split('/').pop(); return `Модель станции: ${code}`; }
  if (path.startsWith('/references/station-models/edit/')) { const uid = path.split('/').pop(); return 'Модель станции'; }
  if (path.startsWith('/references/station-configurations/create/')) { const code = path.split('/').pop(); return `Конфигурация: ${code}`; }
  if (path.startsWith('/references/station-configurations/edit/')) { const uid = path.split('/').pop(); return 'Конфигурация станции'; }
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

  const MIN_WIDTH = 1920; const MIN_HEIGHT = 900; const MAX_WIDTH = 1920; const MAX_HEIGHT = 1080;

  useEffect(() => {
    const width = window.innerWidth; const height = window.innerHeight;
    let finalWidth = width; let finalHeight = height;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) { finalWidth = MIN_WIDTH; finalHeight = MIN_HEIGHT; }
    if (width > MAX_WIDTH || height > MAX_HEIGHT) { finalWidth = MAX_WIDTH; finalHeight = MAX_HEIGHT; }
    setWindowSize({ width: finalWidth, height: finalHeight });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const fullPath = location.pathname + location.search;
    if (prevPathRef.current === fullPath) return;
    prevPathRef.current = fullPath;
    const existingTab = tabs.find(tab => tab.path === fullPath);
    if (existingTab) {
      if (activeTabId !== existingTab.id) switchTab(existingTab.id);
      if (existingTab.component === null) { const component = getComponentByPath(location.pathname); if (component) updateTabComponent(existingTab.id, component); }
      return;
    }
    const label = getLabelByPath(fullPath);
    const component = getComponentByPath(location.pathname);
    const newTabId = openTab(fullPath, label, component);
    if (location.pathname.startsWith('/documents/schablon/')) { const uid = location.pathname.replace('/documents/schablon/', ''); fetchTemplateName(uid).then(name => updateTabLabel(newTabId, `Шаблон - ${name}`)); }
    if (location.pathname.startsWith('/references/nomenclature/edit/')) { const segments = location.pathname.split('/'); const uid = segments[segments.length - 2]; fetchNomenclatureName(uid).then(name => updateTabLabel(newTabId, name)); }
    if (location.pathname.startsWith('/references/suppliers/edit/')) { const segments = location.pathname.split('/'); const uid = segments[segments.length - 1]; fetchSupplierName(uid).then(name => updateTabLabel(newTabId, name)); }
  }, [location.pathname, location.search, isLoaded]);

  useEffect(() => { const fullPath = location.pathname + location.search; const currentPathExists = tabs.some(tab => tab.path === fullPath); if (!currentPathExists) prevPathRef.current = ''; }, [tabs, location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => { const width = window.innerWidth; const height = window.innerHeight; const scaleX = width / windowSize.width; const scaleY = height / windowSize.height; const scale = Math.min(scaleX, scaleY); if (scale > 1) setPadding(60 * scale); else setPadding(60); };
    if (isLoaded) { handleResize(); window.addEventListener('resize', handleResize); }
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize, isLoaded]);

  if (!isLoaded) return null;

  const tabBarHeight = 35; const topOffset = 20; const gapBetweenTabBarAndWhiteBlock = 5;

  return (
    <div className="w-full h-dvh relative overflow-auto" style={{ minWidth: `${windowSize.width}px`, minHeight: `${windowSize.height}px` }}>
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }} className="relative">
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: `${topOffset}px` }}>
            <div style={{ width: `${windowSize.width - padding * 2}px` }}><TabBar /></div>
          </div>
          <div style={{ position: 'absolute', left: `${padding}px`, right: `${padding}px`, top: `${topOffset + tabBarHeight + gapBetweenTabBarAndWhiteBlock}px`, bottom: `${padding}px`, backgroundColor: '#FAFBFC' }} className="rounded-[20px] shadow overflow-auto white-block relative">
            {tabs.map(tab => (
              <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
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