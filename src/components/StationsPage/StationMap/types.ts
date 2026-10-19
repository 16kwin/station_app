// types.ts — данные режима «Карта» панели станций: станции и иерархия размещения (как их уже загрузила
// страница), план цеха с сервера и расстановка станций на нём.

/** Код статуса станции, как в StationCell */
export type StationStatusCode = 'WORKING' | 'OFFLINE' | 'MINIMAL_STOCK' | 'CRITICAL_STOCK';

/** Станция — поля StationStatic страницы, которые нужны карте */
export interface MapStation {
  uid: string;
  name: string;
  workshop?: string | null;
  section?: string | null;
  enterprise?: string | null;
  holdingId?: number | null;
  enterpriseId?: number | null;
  workshopId?: number | null;
  sectionId?: number | null;
  status: string;
  hasError?: boolean | null;
  modelName?: string | null;
}

/** Показатели станции — поля StationDynamic страницы */
export interface MapStationDynamic {
  uid: string;
  filledCellsPercent?: number | null;
  totalCells?: number | null;
  filledCells?: number | null;
  maxReadyParts?: number | null;
  readyPartsCount?: number | null;
}

/** Иерархия GET /api/locations/hierarchy: холдинги → предприятия → цеха → участки (станций в ней нет) */
export interface MapHierarchy {
  holdings: MapHolding[];
}

export interface MapHolding {
  id: number;
  name: string;
  enterprises?: MapEnterprise[] | null;
}

export interface MapEnterprise {
  id: number;
  name: string;
  workshops?: MapWorkshop[] | null;
}

export interface MapWorkshop {
  id: number;
  name: string;
  sections?: MapSection[] | null;
}

export interface MapSection {
  id: number;
  name: string;
}

/** Вид карты в правой панели */
export type MapKind = 'mnemo' | 'interactive';

/** Точка на плане — доли 0..1 от ширины и высоты плана */
export interface PlanPoint {
  x: number;
  y: number;
}

/** Картинка плана цеха с сервера */
export interface PlanImage {
  url: string;
  width: number;
  height: number;
  mime: string;
  updatedAt: string | null;
}

/** План цеха: GET /api/station-plans/workshops/{workshopId} */
export interface StationPlan {
  workshopId: number;
  version: number;
  image: PlanImage | null;
  positions: { stationUid: string; x: number; y: number }[];
  /** Только в ответе на сохранение: станции, чьи места сервер пропустил — их уже нет в этом цехе */
  skippedStationUids?: string[];
}

/** Действия со станцией, которые уже есть на странице */
export interface StationActions {
  /** «Шаблоны загрузки» */
  onOpenTemplates: (station: MapStation) => void;
  /** «Видео» — только руководителю */
  onOpenVideo: (station: MapStation) => void;
  canViewVideo: boolean;
}
