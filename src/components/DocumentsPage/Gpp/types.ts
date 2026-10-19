// types.ts — документ «График подготовки производства (ГПП по предприятию)»: контракт API (GET/PUT /api/gpp)
// и типы экрана. Строки приходят в порядке обхода дерева: родитель, затем его дети по position.

/** Тип графика: общий по предприятию (детали параллельно, по зависимостям) или последовательный (цепочкой по дереву) */
export type GppType = 'GENERAL' | 'SEQUENTIAL';

/** Вид элемента: изделие (корень), деталь, материал (без дат и без детей) */
export type RowKind = 'PRODUCT' | 'PART' | 'MATERIAL';

export interface GppRowDTO {
  uid: string;
  parentUid: string | null;
  /** Порядок среди братьев, с 0 */
  position: number;
  /** «000», «001»… (до 10 символов) */
  opNumber: string | null;
  /** Децимальный номер «Р03.200.000.12» (до 100) */
  code: string | null;
  /** Наименование, не пустое (до 500) */
  name: string;
  kind: RowKind;
  /** ≥ 0, до 3 знаков после запятой */
  quantity: number;
  unit: string;
  /** 'YYYY-MM-DD'; у материала всегда null */
  start: string | null;
  /** 'YYYY-MM-DD' — последний день этапа включительно */
  finish: string | null;
  /** Календарные дни 1..3650; у изделия — длительность его собственной операции (000) */
  durationDays: number | null;
  /** '#RRGGBB' */
  color: string | null;
  /** uid предшественников (окончание → начало) */
  dependsOn: string[];
  /** Узел свёрнут при открытии */
  collapsed: boolean;
}

export interface GppDocumentDTO {
  uid: string;
  title: string;
  gppType: GppType;
  autoCalc: boolean;
  /** 'YYYY-MM-DD' — начало «Периода выборки» */
  periodFrom: string;
  periodTo: string;
  version: number;
  updatedAt: string | null;
  updatedBy: string | null;
  /** true для ADMIN и DIRECTOR */
  canEdit: boolean;
  rows: GppRowDTO[];
}

export interface GppSaveRequest {
  version: number;
  gppType: GppType;
  autoCalc: boolean;
  periodFrom: string;
  periodTo: string;
  rows: GppRowDTO[];
}

/** Масштаб шкалы времени */
export type ScaleMode = 'days' | 'weeks' | 'months';

/** Сортировка внутри уровня дерева */
export type SortMode = 'order' | 'name' | 'start';

/** Настройки вида — хранятся у пользователя в браузере */
export interface GppViewSettings {
  scale: ScaleMode;
  showLinks: boolean;
  showToday: boolean;
}

/** Строка, видимая в таблице: с глубиной, номером п/п и признаками узла */
export interface VisibleRow {
  row: GppRowDTO;
  depth: number;
  /** Сквозной номер по видимым строкам, с 1 */
  number: number;
  hasChildren: boolean;
  expanded: boolean;
  /** Показана только как предок найденной строки — рисуется приглушённо */
  context: boolean;
}

/** Что меняет перетаскивание полосы: сдвиг целиком или правый край (длительность) */
export type BarEditMode = 'move' | 'resize';

/** Связь между полосами на диаграмме */
export interface GanttLink {
  id: string;
  from: string;
  to: string;
  /** drop — от начала изделия / между деталями вертикально; step — «ступенькой» в последовательном графике */
  style: 'drop' | 'step';
  /** от начала полосы-источника (изделие → первая деталь) или от её окончания */
  anchor: 'start' | 'finish';
  /** Последующий этап начинается раньше, чем позволяет связь */
  violated: boolean;
}
