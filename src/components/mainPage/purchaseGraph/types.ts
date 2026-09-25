// types.ts — типы графа закупок: ответ API, модель графа (узлы и связи), настройки страницы

/* ---------- Ответ GET /api/dashboard/purchase-graph?from&to ---------- */

/** Группа номенклатуры — раздел дерева слева */
export interface GraphGroupDto {
  key: string;
  name: string;
}

/** Позиция номенклатуры с ценой-ориентиром */
export interface GraphNomenclatureDto {
  key: string;
  name: string;
  groupKey: string;
  unit: string;
  /** Цена-ориентир, ₽ */
  refPrice: number;
  /** «Избранное» по умолчанию (дальше пользователь меняет у себя) */
  favorite: boolean;
}

/** Поставщик; якорный — основной поставщик с согласованными ценами */
export interface GraphSupplierDto {
  key: string;
  name: string;
  anchor: boolean;
  inn: string | null;
  city: string | null;
}

/** Закупки пары «номенклатура — поставщик» за период (агрегат по заказам) */
export interface GraphPurchaseDto {
  nomKey: string;
  supplierKey: string;
  /** Число заказов */
  orders: number;
  /** Σ количества */
  qty: number;
  /** Σ(кол-во × цена), ₽ */
  amount: number;
  /** Средняя цена = amount / qty, ₽ */
  avgPrice: number;
  /** Последний заказ пары в периоде: время 'YYYY-MM-DDTHH:mm:ss' и номер */
  lastAt: string;
  lastOrderNo: string;
}

/** Связь между поставщиками (пока только аффилированность) */
export interface GraphSupplierLinkDto {
  a: string;
  b: string;
  kind: string;
  reason: string | null;
}

export interface PurchaseGraphData {
  from: string;
  to: string;
  /** Лимит превышения цены по умолчанию, % */
  limitPercent: number;
  groups: GraphGroupDto[];
  nomenclature: GraphNomenclatureDto[];
  suppliers: GraphSupplierDto[];
  purchases: GraphPurchaseDto[];
  links: GraphSupplierLinkDto[];
}

/* ---------- Модель графа ---------- */

export type GraphNodeKind = 'nom' | 'supplier';

/** Категория поставщика: рядовой, свыше лимита цены, якорный */
export type SupplierCategory = 'regular' | 'over' | 'anchor';

export interface GraphNode {
  /** 'n:<ключ>' — номенклатура, 's:<ключ>' — поставщик */
  id: string;
  kind: GraphNodeKind;
  key: string;
  name: string;
  /** Цвет круга: цвет группы, иначе цвет типа или категории */
  color: string;
  /** Категория поставщика; у номенклатуры — null */
  category: SupplierCategory | null;
  /** Базовый радиус (20 у номенклатуры, 17 у поставщика) до множителей размера и степени */
  baseRadius: number;
  /** Число видимых связей узла */
  degree: number;
  /** Имя, перенесённое на 1–2 строки */
  nameLines: string[];
  /** Строки под именем поставщика: объём закупок, у якорного — ещё количество */
  subLines: string[];
  /** Итоги видимых закупок узла */
  amount: number;
  qty: number;
  orders: number;
  /** Нет закупок за период */
  orphan: boolean;
}

export type GraphEdgeKind = 'purchase' | 'affiliated';

export interface GraphEdge {
  /** 'p:<номенклатура>|<поставщик>' или 'a:<поставщик>|<поставщик>' */
  id: string;
  kind: GraphEdgeKind;
  /** Узел-поставщик (у аффилированности — первый поставщик пары) */
  source: string;
  /** Узел-номенклатура (у аффилированности — второй поставщик пары) */
  target: string;
  /** Цвет линии у конца поставщика и у конца номенклатуры */
  sourceColor: string;
  targetColor: string;
  /** Закупка свыше лимита цены */
  over: boolean;
  /** Подпись цены «₽180»; у аффилированности пустая */
  priceLabel: string;
  purchase: GraphPurchaseDto | null;
  reason: string | null;
}

/** Почему граф пуст: нет закупок за период или всё скрыто фильтрами */
export type GraphEmptyReason = 'no-data' | 'filtered' | 'nothing-selected' | null;

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Лимит, по которому посчитаны флаги «свыше лимита», % */
  limitPercent: number;
  /** Фокус (ключ номенклатуры), если он применён */
  focusKey: string | null;
  emptyReason: GraphEmptyReason;
  nomByKey: ReadonlyMap<string, GraphNomenclatureDto>;
  supplierByKey: ReadonlyMap<string, GraphSupplierDto>;
  groupByKey: ReadonlyMap<string, GraphGroupDto>;
}

/* ---------- Настройки страницы (панель как в Obsidian) ---------- */

/** Градиент линии: «Фикс. длина» (28 px цвета поставщика + 40 px перехода) или «10:90» */
export type GradientMode = 'fixed' | 'ratio';

export interface GraphFilters {
  /** «Искать в…»: узлы, чьё имя содержит строку, и их прямые соседи */
  search: string;
  showRegular: boolean;
  showOverLimit: boolean;
  showAnchor: boolean;
  showAffiliated: boolean;
  /** «Объекты без связей» — узлы без закупок в периоде */
  showOrphans: boolean;
}

/** Цветовая группа: узлы, чьё имя содержит запрос, красятся её цветом */
export interface ColorGroup {
  id: string;
  query: string;
  color: string;
}

export interface GraphDisplay {
  /** «Направление связей» — наконечник у номенклатуры */
  arrows: boolean;
  /** «Порог исчезания текста», −3…3 */
  textFade: number;
  /** «Размер узла», 0.5…2.5 */
  nodeSize: number;
  /** «Толщина линий», 0.5…3 */
  lineWidth: number;
  gradient: GradientMode;
  /** «Лимит превышения цены, %»; null — значение из ответа API */
  limitPercent: number | null;
  /** «Цены на связях» */
  prices: boolean;
}

export interface GraphForces {
  /** «Сила притяжения» к центру, 0…1 */
  center: number;
  /** «Сила отталкивания», 0…20 */
  repel: number;
  /** «Сила связи», 0…1 */
  link: number;
  /** «Расстояние между узлами», 30…500 */
  distance: number;
}

export type SettingsSection = 'filters' | 'groups' | 'display' | 'forces';

export interface GraphSettings {
  filters: GraphFilters;
  groups: ColorGroup[];
  display: GraphDisplay;
  forces: GraphForces;
  /** Свёрнутые секции панели настроек */
  collapsed: Record<SettingsSection, boolean>;
}

/** Запрос к модели: всё, что определяет состав и цвета графа */
export interface GraphQuery {
  limitPercent: number;
  filters: GraphFilters;
  groups: readonly ColorGroup[];
  /** Выбранные позиции номенклатуры; null — все */
  nomSelection: readonly string[] | null;
  /** Выбранные поставщики; null — все */
  supplierSelection: readonly string[] | null;
  /** Режим фокуса: позиция, её поставщики и их связи между собой */
  focusKey: string | null;
  /** Строки объёма и количества под поставщиками */
  showVolumes: boolean;
}

/* ---------- Отрисовка ---------- */

export type GraphMode = 'full' | 'compact';

/** Объект под курсором */
export interface HoverTarget {
  kind: 'node' | 'edge';
  id: string;
}

/** Отступы области графа, закрытые панелями (для «вписать граф»), px */
export interface GraphInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type TooltipTone = 'danger' | 'success' | 'muted';

export interface TooltipRow {
  label: string;
  value: string;
  tone?: TooltipTone;
}

export interface TooltipListItem {
  text: string;
  value: string;
  tone?: TooltipTone;
}

/** Содержимое всплывающей подсказки узла или связи */
export interface TooltipContent {
  title: string;
  subtitle?: string;
  badge?: { text: string; color: string };
  rows: TooltipRow[];
  listTitle?: string;
  list?: TooltipListItem[];
  /** «и ещё 3» под списком */
  more?: string;
}

/** Строка печатной таблицы видимых закупок */
export interface PrintRow {
  id: string;
  nomName: string;
  supplierName: string;
  price: number;
  refPrice: number;
  overPercent: number;
  over: boolean;
  qty: number;
  unit: string;
  amount: number;
  lastAt: string;
  lastOrderNo: string;
}
