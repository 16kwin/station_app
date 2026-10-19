// lazyModules.ts — единственное место, откуда код ядра подключает модули, которые вариант поставки может
// исключить из сборки (раздел 8.1 проекта). Флаг сборки стоит прямо у import(): при false сборщик не видит
// импорта и не создаёт кусок модуля — в дистрибутиве кода модуля нет (уровень L4). Вынести условие в общую
// функцию нельзя: import() внутри неё остался бы в коде. Правило ESLint запрещает импорт каталогов модулей
// извне, кроме этого файла (типы — через import type, они стираются при сборке).
//
// Модуль в сборке — ленивый компонент со своей границей ошибок и ожиданием (Suspense): загрузка куска не прячет
// остальную страницу, сбой загрузки не роняет приложение. Модуля нет — для раздела «Раздел недоступен»,
// для компонента внутри страницы ядра — ничего.
// Ленивые компоненты должны жить на уровне модуля (как здесь), а не создаваться при отрисовке.
import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import ModuleBoundary from './ModuleBoundary';
import { FeatureUnavailableScreen, FeatureUnavailableTab } from './FeatureUnavailablePage';
import type StationVideoPopupModule from '../../components/DocumentsPage/VideoArchive/StationVideoPopup';
import type StationMapViewModule from '../../components/StationsPage/StationMap/StationMapView';
import type PurchaseGraphPageModule from '../../components/mainPage/purchaseGraph/PurchaseGraphPage';
import type PurchaseGraphCardModule from '../../components/mainPage/purchaseGraph/PurchaseGraphCard';
import type Model3DButtonModule from '../../components/ReferencesPage/NomenclaturePage/Model3D/Model3DButton';
import type Model3DLoadBoundaryModule from '../../components/ReferencesPage/NomenclaturePage/Model3D/LoadBoundary';
import type Model3DPopupModule from '../../components/ReferencesPage/NomenclaturePage/Model3D/Model3DPopup';
import type IntegrationTabModule from '../../components/ReferencesPage/NomenclaturePage/IntegrationTab';
import type SupplierIntegrationTabModule from '../../components/ReferencesPage/SuppliersPage/SupplierIntegrationTab';
import type ManufacturerIntegrationTabModule from '../../components/ReferencesPage/ManufacturersPage/ManufacturerIntegrationTab';

type PropsOf<C> = C extends ComponentType<infer P> ? P : never;

/** Модуля нет в сборке: компонент внутри страницы ядра не показывается */
const Absent = (): null => null;

/**
 * Ленивый модуль с границей ошибок и ожиданием. page — при сбое загрузки сообщение «обновите страницу»
 * (раздел, крупный блок); silent — ничего (кнопка, окно)
 */
const mounted = <P extends object>(name: string, Lazy: LazyExoticComponent<ComponentType<P>>, variant: 'page' | 'silent'): ComponentType<P> => {
  const Mounted = (props: P) =>
    createElement(ModuleBoundary, {
      variant,
      children: createElement(Suspense, { fallback: null }, createElement(Lazy as ComponentType<P>, props)),
    });
  Mounted.displayName = name;
  return Mounted;
};

// ---------- Видео (__AWMS_HAS_VIDEO__) ----------

/** Раздел «Журнал событий: видеоархив» */
export const VideoArchivePage: ComponentType = __AWMS_HAS_VIDEO__
  ? mounted('VideoArchivePage', lazy(() => import('../../components/DocumentsPage/VideoArchive/VideoArchivePage')), 'page')
  : FeatureUnavailableTab;

/** Окно «Видео» станции */
export const StationVideoPopup: ComponentType<PropsOf<typeof StationVideoPopupModule>> = __AWMS_HAS_VIDEO__
  ? mounted('StationVideoPopup', lazy(() => import('../../components/DocumentsPage/VideoArchive/StationVideoPopup')), 'silent')
  : Absent;

// ---------- Карта станций (__AWMS_HAS_MAP__) ----------

/** Карта станций (мнемосхема и план цеха) на странице «Станции» */
export const StationMapView: ComponentType<PropsOf<typeof StationMapViewModule>> = __AWMS_HAS_MAP__
  ? mounted('StationMapView', lazy(() => import('../../components/StationsPage/StationMap/StationMapView')), 'page')
  : Absent;

// ---------- Граф закупок (__AWMS_HAS_GRAPH__) ----------

/** Экран /screen/purchase-graph */
export const PurchaseGraphPage: ComponentType<PropsOf<typeof PurchaseGraphPageModule>> = __AWMS_HAS_GRAPH__
  ? mounted('PurchaseGraphPage', lazy(() => import('../../components/mainPage/purchaseGraph/PurchaseGraphPage')), 'page')
  : FeatureUnavailableScreen;

/** Карточка графа на панели аудитора */
export const PurchaseGraphCard: ComponentType<PropsOf<typeof PurchaseGraphCardModule>> = __AWMS_HAS_GRAPH__
  ? mounted('PurchaseGraphCard', lazy(() => import('../../components/mainPage/purchaseGraph/PurchaseGraphCard')), 'page')
  : Absent;

// ---------- Второй экран (флага сборки нет: модуль не исключается, только грузится отдельно) ----------

/** Экран /screen/events */
export const EventsScreenPage: ComponentType = mounted(
  'EventsScreenPage',
  lazy(() => import('../../components/mainPage/eventsScreen/EventsScreenPage')),
  'page',
);

// ---------- Заказы и ТКП (__AWMS_HAS_ORDERS__) ----------

export const AnalyticsPage: ComponentType = __AWMS_HAS_ORDERS__
  ? mounted('AnalyticsPage', lazy(() => import('../../components/AnalyticsPage/AnalyticsPage')), 'page')
  : FeatureUnavailableTab;

export const OrdersPage: ComponentType = __AWMS_HAS_ORDERS__
  ? mounted('OrdersPage', lazy(() => import('../../components/AnalyticsPage/OrdersPage')), 'page')
  : FeatureUnavailableTab;

export const OrderCreatePage: ComponentType = __AWMS_HAS_ORDERS__
  ? mounted('OrderCreatePage', lazy(() => import('../../components/AnalyticsPage/OrderCreatePage')), 'page')
  : FeatureUnavailableTab;

export const TkpPage: ComponentType = __AWMS_HAS_ORDERS__
  ? mounted('TkpPage', lazy(() => import('../../components/AnalyticsPage/TkpPage')), 'page')
  : FeatureUnavailableTab;

export const TkpViewPage: ComponentType = __AWMS_HAS_ORDERS__
  ? mounted('TkpViewPage', lazy(() => import('../../components/AnalyticsPage/TkpViewPage')), 'page')
  : FeatureUnavailableTab;

// ---------- 3D-модели (__AWMS_HAS_MODEL3D__) ----------

/** Кнопка «3D» в блоке «Изображение» карточки номенклатуры */
export const Model3DButton: ComponentType<PropsOf<typeof Model3DButtonModule>> = __AWMS_HAS_MODEL3D__
  ? mounted('Model3DButton', lazy(() => import('../../components/ReferencesPage/NomenclaturePage/Model3D/Model3DButton')), 'silent')
  : Absent;

/** Граница ошибок окна 3D. Модуля нет — не показывает и содержимое (окна 3D без модуля нет) */
export const Model3DLoadBoundary: ComponentType<PropsOf<typeof Model3DLoadBoundaryModule>> = __AWMS_HAS_MODEL3D__
  ? mounted('Model3DLoadBoundary', lazy(() => import('../../components/ReferencesPage/NomenclaturePage/Model3D/LoadBoundary')), 'silent')
  : Absent;

/**
 * Окно «3D-модель» — без своей границы и Suspense: сбой его загрузки показывает Model3DLoadBoundary
 * (сообщение и кнопка «Обновить»), ожидание — Suspense в CharacteristicsTab
 */
export const Model3DPopup: ComponentType<PropsOf<typeof Model3DPopupModule>> = __AWMS_HAS_MODEL3D__
  ? lazy(() => import('../../components/ReferencesPage/NomenclaturePage/Model3D/Model3DPopup'))
  : Absent;

// ---------- Вкладки «Интеграции» (__AWMS_HAS_INTEGRATIONS__) ----------

export const IntegrationTab: ComponentType<PropsOf<typeof IntegrationTabModule>> = __AWMS_HAS_INTEGRATIONS__
  ? mounted('IntegrationTab', lazy(() => import('../../components/ReferencesPage/NomenclaturePage/IntegrationTab')), 'page')
  : Absent;

export const SupplierIntegrationTab: ComponentType<PropsOf<typeof SupplierIntegrationTabModule>> = __AWMS_HAS_INTEGRATIONS__
  ? mounted('SupplierIntegrationTab', lazy(() => import('../../components/ReferencesPage/SuppliersPage/SupplierIntegrationTab')), 'page')
  : Absent;

export const ManufacturerIntegrationTab: ComponentType<PropsOf<typeof ManufacturerIntegrationTabModule>> = __AWMS_HAS_INTEGRATIONS__
  ? mounted(
      'ManufacturerIntegrationTab',
      lazy(() => import('../../components/ReferencesPage/ManufacturersPage/ManufacturerIntegrationTab')),
      'page',
    )
  : Absent;
