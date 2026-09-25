// model.ts — чистые функции графа закупок: флаг «свыше лимита», объёмы поставщиков, счёт
// подозрительности (фокус мини-карточки), фильтры, группы, подписи, подсказки и дерево слева.
// Без React и DOM — проверяются на фикстуре отдельно от отрисовки.

import { COLORS } from '../shared/layout';
import {
  estimateTextWidth,
  formatDateTimeRu,
  formatMoney,
  formatPriceTag,
  formatQty,
  formatSignedPercent,
  formatUnits,
  formatVolume,
  overPercent,
  wrapLabel,
} from './format';
import type {
  ColorGroup,
  GraphEdge,
  GraphGroupDto,
  GraphModel,
  GraphNode,
  GraphNomenclatureDto,
  GraphPurchaseDto,
  GraphQuery,
  GraphSupplierDto,
  GraphSupplierLinkDto,
  HoverTarget,
  PrintRow,
  PurchaseGraphData,
  SupplierCategory,
  TooltipContent,
  TooltipListItem,
} from './types';

/* ---------- Константы вида ---------- */

export const NOM_BASE_RADIUS = 20;
export const SUPPLIER_BASE_RADIUS = 17;
/** Подпись длиннее — переносится на две строки */
const NOM_LABEL_MAX = 20;
const SUPPLIER_LABEL_MAX = 14;

/** Цвета категорий поставщиков (якорный приоритетнее красного) */
export const CATEGORY_COLORS: Record<SupplierCategory, string> = {
  regular: COLORS.accent,
  over: COLORS.rose,
  anchor: COLORS.anchorGreen,
};

/* ---------- Идентификаторы ---------- */

export const nomNodeId = (key: string): string => `n:${key}`;
export const supplierNodeId = (key: string): string => `s:${key}`;
export const purchaseEdgeId = (nomKey: string, supplierKey: string): string => `p:${nomKey}|${supplierKey}`;
export const affiliationEdgeId = (a: string, b: string): string => `a:${a}|${b}`;

/* ---------- Нормализация ответа API ---------- */

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const toText = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

const toNullableText = (value: unknown): string | null => {
  const text = toText(value).trim();
  return text ? text : null;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

/**
 * Приводит ответ сервера к типам модели: числа — числами (BigDecimal может прийти строкой),
 * отсутствующие массивы — пустыми, пустые ключи отбрасываются.
 */
export const normalizeGraphData = (raw: unknown): PurchaseGraphData => {
  const root = asRecord(raw);
  return {
    from: toText(root.from),
    to: toText(root.to),
    limitPercent: toNumber(root.limitPercent, 20),
    groups: asArray(root.groups)
      .map(asRecord)
      .map(g => ({ key: toText(g.key), name: toText(g.name) }))
      .filter(g => g.key),
    nomenclature: asArray(root.nomenclature)
      .map(asRecord)
      .map(n => ({
        key: toText(n.key),
        name: toText(n.name) || toText(n.key),
        groupKey: toText(n.groupKey),
        unit: toText(n.unit),
        refPrice: toNumber(n.refPrice),
        favorite: n.favorite === true,
      }))
      .filter(n => n.key),
    suppliers: asArray(root.suppliers)
      .map(asRecord)
      .map(s => ({
        key: toText(s.key),
        name: toText(s.name) || toText(s.key),
        anchor: s.anchor === true,
        inn: toNullableText(s.inn),
        city: toNullableText(s.city),
      }))
      .filter(s => s.key),
    purchases: asArray(root.purchases)
      .map(asRecord)
      .map(p => ({
        nomKey: toText(p.nomKey),
        supplierKey: toText(p.supplierKey),
        orders: toNumber(p.orders),
        qty: toNumber(p.qty),
        amount: toNumber(p.amount),
        avgPrice: toNumber(p.avgPrice),
        lastAt: toText(p.lastAt),
        lastOrderNo: toText(p.lastOrderNo),
      }))
      .filter(p => p.nomKey && p.supplierKey),
    links: asArray(root.links)
      .map(asRecord)
      .map(l => ({ a: toText(l.a), b: toText(l.b), kind: toText(l.kind) || 'affiliated', reason: toNullableText(l.reason) }))
      .filter(l => l.a && l.b && l.a !== l.b),
  };
};

/* ---------- Правила ---------- */

/**
 * Закупка свыше лимита: avgPrice > refPrice × (1 + limit/100).
 * Сравнение в масштабе ×100 с допуском — 180 при ориентире 120 и лимите 50% не превышение.
 */
export const isOverLimit = (avgPrice: number, refPrice: number, limitPercent: number): boolean => {
  if (!(refPrice > 0) || !Number.isFinite(avgPrice)) return false;
  return avgPrice * 100 > refPrice * (100 + limitPercent) + 1e-6;
};

/** Итоги закупок одного поставщика по набору закупок */
export interface SupplierTotals {
  amount: number;
  qty: number;
  orders: number;
  positions: number;
}

/** Объём закупок каждого поставщика по переданным закупкам (в текущем виде — по видимым) */
export const supplierTotals = (purchases: readonly GraphPurchaseDto[]): Map<string, SupplierTotals> => {
  const totals = new Map<string, SupplierTotals>();
  purchases.forEach(p => {
    const current = totals.get(p.supplierKey) ?? { amount: 0, qty: 0, orders: 0, positions: 0 };
    current.amount += p.amount;
    current.qty += p.qty;
    current.orders += p.orders;
    current.positions += 1;
    totals.set(p.supplierKey, current);
  });
  return totals;
};

/** Цвет первой цветовой группы, чей запрос входит в имя узла (без учёта регистра) */
export const matchGroupColor = (name: string, groups: readonly ColorGroup[]): string | null => {
  const lower = name.toLowerCase();
  for (const group of groups) {
    const query = group.query.trim().toLowerCase();
    if (query && lower.includes(query)) return group.color;
  }
  return null;
};

/** Счёт подозрительности позиции для фокуса мини-карточки */
export interface FocusScore {
  nomKey: string;
  score: number;
  overSuppliers: number;
  affiliatedPair: boolean;
  overAmount: number;
}

/**
 * Счёт = 10 × (поставщиков свыше лимита) + 5 × (есть аффилированная пара среди её поставщиков).
 * При равенстве выше та, у которой больше сумма закупок свыше лимита.
 */
export const focusScores = (data: PurchaseGraphData, limitPercent = data.limitPercent): FocusScore[] => {
  const nomByKey = new Map(data.nomenclature.map(n => [n.key, n] as const));
  const suppliersByNom = new Map<string, Set<string>>();
  const scores = new Map<string, FocusScore>();
  data.purchases.forEach(p => {
    const nom = nomByKey.get(p.nomKey);
    if (!nom) return;
    const set = suppliersByNom.get(p.nomKey) ?? new Set<string>();
    set.add(p.supplierKey);
    suppliersByNom.set(p.nomKey, set);
    const score = scores.get(p.nomKey) ?? { nomKey: p.nomKey, score: 0, overSuppliers: 0, affiliatedPair: false, overAmount: 0 };
    if (isOverLimit(p.avgPrice, nom.refPrice, limitPercent)) {
      score.overSuppliers += 1;
      score.overAmount += p.amount;
    }
    scores.set(p.nomKey, score);
  });
  const result: FocusScore[] = [];
  // Порядок справочника — последний критерий равенства
  data.nomenclature.forEach(nom => {
    const score = scores.get(nom.key);
    if (!score) return;
    const suppliers = suppliersByNom.get(nom.key) ?? new Set<string>();
    score.affiliatedPair = data.links.some(l => suppliers.has(l.a) && suppliers.has(l.b));
    score.score = 10 * score.overSuppliers + (score.affiliatedPair ? 5 : 0);
    result.push(score);
  });
  return result.sort((x, y) => y.score - x.score || y.overAmount - x.overAmount);
};

/** Ключ номенклатуры с наибольшим счётом подозрительности; null — закупок нет */
export const pickFocusKey = (data: PurchaseGraphData, limitPercent = data.limitPercent): string | null =>
  focusScores(data, limitPercent)[0]?.nomKey ?? null;

/* ---------- Построение графа ---------- */

/** Узлы и связи для текущих фильтров, фокуса, групп и лимита */
export const buildGraph = (data: PurchaseGraphData, query: GraphQuery): GraphModel => {
  const nomByKey = new Map(data.nomenclature.map(n => [n.key, n] as const));
  const supplierByKey = new Map(data.suppliers.map(s => [s.key, s] as const));
  const groupByKey = new Map(data.groups.map(g => [g.key, g] as const));
  const { filters, limitPercent } = query;

  // Закупки с известными концами — остальные пропускаем
  const purchases = data.purchases.filter(p => nomByKey.has(p.nomKey) && supplierByKey.has(p.supplierKey));
  const nomWithPurchases = new Set(purchases.map(p => p.nomKey));
  const suppliersWithPurchases = new Set(purchases.map(p => p.supplierKey));

  const overOf = (p: GraphPurchaseDto): boolean => isOverLimit(p.avgPrice, nomByKey.get(p.nomKey)?.refPrice ?? 0, limitPercent);
  // Категория закупки — как строки легенды: якорный поставщик, свыше лимита, рядовая
  const categoryVisible = (p: GraphPurchaseDto): boolean => {
    if (supplierByKey.get(p.supplierKey)?.anchor) return filters.showAnchor;
    return overOf(p) ? filters.showOverLimit : filters.showRegular;
  };

  const focusKey = query.focusKey && nomByKey.has(query.focusKey) ? query.focusKey : null;
  const nomSelection = focusKey || !query.nomSelection ? null : new Set(query.nomSelection);
  const supplierSelection = focusKey || !query.supplierSelection ? null : new Set(query.supplierSelection);

  let visiblePurchases = purchases.filter(p => {
    if (!categoryVisible(p)) return false;
    if (focusKey) return p.nomKey === focusKey;
    if (nomSelection && !nomSelection.has(p.nomKey)) return false;
    if (supplierSelection && !supplierSelection.has(p.supplierKey)) return false;
    return true;
  });

  // Узлы: концы закупок + явно выбранные (фокус, фильтры) + «объекты без связей»
  let nomVisible = new Set<string>();
  let supplierVisible = new Set<string>();
  visiblePurchases.forEach(p => {
    nomVisible.add(p.nomKey);
    supplierVisible.add(p.supplierKey);
  });
  if (focusKey) nomVisible.add(focusKey);
  nomSelection?.forEach(key => {
    if (nomByKey.has(key)) nomVisible.add(key);
  });
  supplierSelection?.forEach(key => {
    if (supplierByKey.has(key)) supplierVisible.add(key);
  });
  if (filters.showOrphans && !focusKey) {
    if (!supplierSelection) {
      data.nomenclature.forEach(n => {
        if (!nomWithPurchases.has(n.key) && (!nomSelection || nomSelection.has(n.key))) nomVisible.add(n.key);
      });
    }
    if (!nomSelection) {
      data.suppliers.forEach(s => {
        if (!suppliersWithPurchases.has(s.key) && (!supplierSelection || supplierSelection.has(s.key))) supplierVisible.add(s.key);
      });
    }
  }

  // Аффилированность — только между видимыми поставщиками, без повторов пары
  const seenPairs = new Set<string>();
  let visibleLinks: GraphSupplierLinkDto[] = filters.showAffiliated
    ? data.links.filter(l => {
        if (!supplierVisible.has(l.a) || !supplierVisible.has(l.b)) return false;
        const pair = l.a < l.b ? `${l.a}|${l.b}` : `${l.b}|${l.a}`;
        if (seenPairs.has(pair)) return false;
        seenPairs.add(pair);
        return true;
      })
    : [];

  // «Искать в…»: совпавшие по имени узлы и их прямые соседи (в режиме фокуса не применяется)
  const search = focusKey ? '' : filters.search.trim().toLowerCase();
  if (search) {
    const matchedNom = new Set([...nomVisible].filter(key => nomByKey.get(key)?.name.toLowerCase().includes(search)));
    const matchedSupplier = new Set(
      [...supplierVisible].filter(key => supplierByKey.get(key)?.name.toLowerCase().includes(search)),
    );
    const keepNom = new Set(matchedNom);
    const keepSupplier = new Set(matchedSupplier);
    visiblePurchases.forEach(p => {
      if (matchedNom.has(p.nomKey)) keepSupplier.add(p.supplierKey);
      if (matchedSupplier.has(p.supplierKey)) keepNom.add(p.nomKey);
    });
    visibleLinks.forEach(l => {
      if (matchedSupplier.has(l.a)) keepSupplier.add(l.b);
      if (matchedSupplier.has(l.b)) keepSupplier.add(l.a);
    });
    nomVisible = keepNom;
    supplierVisible = keepSupplier;
    visiblePurchases = visiblePurchases.filter(p => keepNom.has(p.nomKey) && keepSupplier.has(p.supplierKey));
    visibleLinks = visibleLinks.filter(l => keepSupplier.has(l.a) && keepSupplier.has(l.b));
  }

  // Степени и итоги по видимым связям
  const degree = new Map<string, number>();
  const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);
  visiblePurchases.forEach(p => {
    bump(nomNodeId(p.nomKey));
    bump(supplierNodeId(p.supplierKey));
  });
  visibleLinks.forEach(l => {
    bump(supplierNodeId(l.a));
    bump(supplierNodeId(l.b));
  });
  const supplierAgg = supplierTotals(visiblePurchases);
  const supplierOver = new Set(visiblePurchases.filter(overOf).map(p => p.supplierKey));
  const nomAgg = new Map<string, { amount: number; qty: number; orders: number }>();
  visiblePurchases.forEach(p => {
    const current = nomAgg.get(p.nomKey) ?? { amount: 0, qty: 0, orders: 0 };
    current.amount += p.amount;
    current.qty += p.qty;
    current.orders += p.orders;
    nomAgg.set(p.nomKey, current);
  });

  const nodes: GraphNode[] = [];
  const colorById = new Map<string, string>();

  data.nomenclature.forEach(nom => {
    if (!nomVisible.has(nom.key)) return;
    const id = nomNodeId(nom.key);
    const color = matchGroupColor(nom.name, query.groups) ?? COLORS.accent;
    const agg = nomAgg.get(nom.key);
    colorById.set(id, color);
    nodes.push({
      id,
      kind: 'nom',
      key: nom.key,
      name: nom.name,
      color,
      category: null,
      baseRadius: NOM_BASE_RADIUS,
      degree: degree.get(id) ?? 0,
      nameLines: wrapLabel(nom.name, NOM_LABEL_MAX),
      subLines: [],
      amount: agg?.amount ?? 0,
      qty: agg?.qty ?? 0,
      orders: agg?.orders ?? 0,
      orphan: !nomWithPurchases.has(nom.key),
    });
  });

  data.suppliers.forEach(supplier => {
    if (!supplierVisible.has(supplier.key)) return;
    const id = supplierNodeId(supplier.key);
    const category: SupplierCategory = supplier.anchor ? 'anchor' : supplierOver.has(supplier.key) ? 'over' : 'regular';
    const color = matchGroupColor(supplier.name, query.groups) ?? CATEGORY_COLORS[category];
    const agg = supplierAgg.get(supplier.key);
    const subLines: string[] = [];
    if (query.showVolumes && agg) {
      subLines.push(formatVolume(agg.amount));
      if (supplier.anchor) subLines.push(formatUnits(agg.qty));
    }
    colorById.set(id, color);
    nodes.push({
      id,
      kind: 'supplier',
      key: supplier.key,
      name: supplier.name,
      color,
      category,
      baseRadius: SUPPLIER_BASE_RADIUS,
      degree: degree.get(id) ?? 0,
      nameLines: wrapLabel(supplier.name, SUPPLIER_LABEL_MAX),
      subLines,
      amount: agg?.amount ?? 0,
      qty: agg?.qty ?? 0,
      orders: agg?.orders ?? 0,
      orphan: !suppliersWithPurchases.has(supplier.key),
    });
  });

  const edges: GraphEdge[] = [];
  visibleLinks.forEach(l => {
    edges.push({
      id: affiliationEdgeId(l.a, l.b),
      kind: 'affiliated',
      source: supplierNodeId(l.a),
      target: supplierNodeId(l.b),
      sourceColor: COLORS.rose,
      targetColor: COLORS.rose,
      over: false,
      priceLabel: '',
      purchase: null,
      reason: l.reason,
    });
  });
  visiblePurchases.forEach(p => {
    const source = supplierNodeId(p.supplierKey);
    const target = nomNodeId(p.nomKey);
    edges.push({
      id: purchaseEdgeId(p.nomKey, p.supplierKey),
      kind: 'purchase',
      source,
      target,
      sourceColor: colorById.get(source) ?? COLORS.accent,
      targetColor: colorById.get(target) ?? COLORS.accent,
      over: overOf(p),
      priceLabel: formatPriceTag(p.avgPrice),
      purchase: p,
      reason: null,
    });
  });

  const selectionEmpty = (query.nomSelection?.length === 0 || query.supplierSelection?.length === 0) && !focusKey;
  const emptyReason = nodes.length
    ? null
    : purchases.length === 0 && !filters.showOrphans
      ? 'no-data'
      : selectionEmpty
        ? 'nothing-selected'
        : 'filtered';

  return { nodes, edges, limitPercent, focusKey, emptyReason, nomByKey, supplierByKey, groupByKey };
};

/* ---------- Геометрия узла (общая для разметки и движка) ---------- */

/** Радиус: базовый × «Размер узла» × (1 + 0.12·log2(1 + степень)) — хабы чуть крупнее */
export const nodeRadius = (node: Pick<GraphNode, 'baseRadius' | 'degree'>, sizeFactor: number): number =>
  node.baseRadius * sizeFactor * (1 + 0.12 * Math.log2(1 + node.degree));

/** Размер белой иконки в круге: иконка нарисована в квадрате 18×18 */
export const ICON_BOX = 18;
export const iconScale = (radius: number): number => (radius * 0.95) / ICON_BOX;

/** Межстрочные интервалы подписей узла */
export const LABEL_LINE = 15;
export const SUBLABEL_LINE = 14;
export const NOM_LABEL_GAP = 8;
export const SUPPLIER_LABEL_GAP = 16;

/** Базовые линии строк подписи относительно центра узла (y) */
export const labelLayout = (node: Pick<GraphNode, 'kind' | 'nameLines' | 'subLines'>, radius: number): { name: number[]; sub: number[] } => {
  if (node.kind === 'nom') {
    const count = node.nameLines.length;
    return { name: node.nameLines.map((_, i) => -(radius + NOM_LABEL_GAP) - (count - 1 - i) * LABEL_LINE), sub: [] };
  }
  const first = radius + SUPPLIER_LABEL_GAP;
  const name = node.nameLines.map((_, i) => first + i * LABEL_LINE);
  const subStart = first + node.nameLines.length * LABEL_LINE - 1;
  return { name, sub: node.subLines.map((_, i) => subStart + i * SUBLABEL_LINE) };
};

/** Габариты узла с подписями относительно центра — для «вписать граф» */
export const nodeExtent = (
  node: Pick<GraphNode, 'kind' | 'nameLines' | 'subLines'>,
  radius: number,
): { left: number; right: number; top: number; bottom: number } => {
  const nameWidth = Math.max(0, ...node.nameLines.map(line => estimateTextWidth(line, 13, node.kind === 'nom' ? 600 : 500)));
  const subWidth = Math.max(0, ...node.subLines.map(line => estimateTextWidth(line, 11.5, 500)));
  const half = Math.max(radius, nameWidth / 2, subWidth / 2) + 2;
  const layout = labelLayout(node, radius);
  if (node.kind === 'nom') {
    const top = layout.name.length ? -layout.name[0] + 12 : radius;
    return { left: half, right: half, top: Math.max(radius, top), bottom: radius };
  }
  const lastName = layout.name[layout.name.length - 1] ?? radius;
  const lastSub = layout.sub[layout.sub.length - 1];
  const bottom = (lastSub ?? lastName) + 4;
  return { left: half, right: half, top: radius, bottom: Math.max(radius, bottom) };
};

/** Длина наконечника стрелки: растёт с толщиной линии */
export const arrowLength = (lineWidth: number): number => 6 + 2 * lineWidth;

/* ---------- Подсказки ---------- */

const MAX_TOOLTIP_POSITIONS = 5;

const visiblePurchasesOf = (model: GraphModel, nodeId: string): GraphPurchaseDto[] =>
  model.edges
    .filter(edge => edge.kind === 'purchase' && (edge.source === nodeId || edge.target === nodeId))
    .map(edge => edge.purchase)
    .filter((p): p is GraphPurchaseDto => p !== null);

const supplierTooltip = (model: GraphModel, node: GraphNode): TooltipContent => {
  const supplier = model.supplierByKey.get(node.key);
  const purchases = visiblePurchasesOf(model, node.id).sort((a, b) => b.amount - a.amount);
  const place = [supplier?.city, supplier?.inn ? `ИНН ${supplier.inn}` : null].filter(Boolean).join(' · ');
  const list: TooltipListItem[] = purchases.slice(0, MAX_TOOLTIP_POSITIONS).map(p => {
    const nom = model.nomByKey.get(p.nomKey);
    const over = isOverLimit(p.avgPrice, nom?.refPrice ?? 0, model.limitPercent);
    return { text: nom?.name ?? p.nomKey, value: formatPriceTag(p.avgPrice), tone: over ? 'danger' : undefined };
  });
  const badge =
    node.category === 'anchor'
      ? { text: 'Якорный поставщик', color: COLORS.anchorGreen }
      : node.category === 'over'
        ? { text: `Закупки свыше лимита ${model.limitPercent}%`, color: COLORS.rose }
        : undefined;
  return {
    title: node.name,
    subtitle: place || undefined,
    badge,
    rows: purchases.length
      ? [
          { label: 'Сумма закупок', value: formatMoney(node.amount) },
          { label: 'Количество', value: formatUnits(node.qty) },
          { label: 'Заказов', value: String(node.orders) },
        ]
      : [{ label: 'Закупки', value: node.orphan ? 'нет за период' : 'скрыты фильтрами', tone: 'muted' }],
    listTitle: list.length ? 'Позиции' : undefined,
    list,
    more: purchases.length > MAX_TOOLTIP_POSITIONS ? `и ещё ${purchases.length - MAX_TOOLTIP_POSITIONS}` : undefined,
  };
};

const nomTooltip = (model: GraphModel, node: GraphNode): TooltipContent => {
  const nom = model.nomByKey.get(node.key);
  const purchases = visiblePurchasesOf(model, node.id);
  const prices = purchases.map(p => p.avgPrice);
  const unit = nom?.unit ?? '';
  const group = nom ? model.groupByKey.get(nom.groupKey)?.name : undefined;
  const range =
    prices.length === 0
      ? '—'
      : Math.min(...prices) === Math.max(...prices)
        ? formatMoney(prices[0])
        : `${formatMoney(Math.min(...prices))} – ${formatMoney(Math.max(...prices))}`;
  const overCount = purchases.filter(p => isOverLimit(p.avgPrice, nom?.refPrice ?? 0, model.limitPercent)).length;
  return {
    title: node.name,
    subtitle: group,
    badge: overCount ? { text: `Свыше лимита: ${overCount}`, color: COLORS.rose } : undefined,
    rows: [
      { label: 'Цена-ориентир', value: nom ? formatMoney(nom.refPrice) : '—' },
      { label: 'Мин – макс цена', value: range },
      { label: 'Поставщиков', value: String(purchases.length) },
      { label: 'Сумма закупок', value: formatMoney(node.amount) },
      { label: 'Количество', value: formatQty(node.qty, unit) },
    ],
  };
};

const purchaseTooltip = (model: GraphModel, edge: GraphEdge): TooltipContent | null => {
  const p = edge.purchase;
  if (!p) return null;
  const nom = model.nomByKey.get(p.nomKey);
  const supplier = model.supplierByKey.get(p.supplierKey);
  const ref = nom?.refPrice ?? 0;
  const percent = overPercent(p.avgPrice, ref);
  const lastOrder = [p.lastOrderNo ? `№${p.lastOrderNo}` : '', p.lastAt ? `от ${formatDateTimeRu(p.lastAt)}` : '']
    .filter(Boolean)
    .join(' ');
  return {
    title: `${supplier?.name ?? p.supplierKey} → ${nom?.name ?? p.nomKey}`,
    badge: supplier?.anchor
      ? { text: 'Якорный поставщик', color: COLORS.anchorGreen }
      : edge.over
        ? { text: `Свыше лимита ${model.limitPercent}%`, color: COLORS.rose }
        : undefined,
    rows: [
      { label: 'Средняя цена', value: formatMoney(p.avgPrice) },
      { label: 'Ориентир', value: ref > 0 ? formatMoney(ref) : '—' },
      {
        label: 'Превышение',
        value: ref > 0 ? formatSignedPercent(percent) : '—',
        tone: edge.over ? 'danger' : percent <= 0 ? 'success' : undefined,
      },
      { label: 'Количество', value: formatQty(p.qty, nom?.unit ?? '') },
      { label: 'Сумма', value: formatMoney(p.amount) },
      { label: 'Заказов', value: String(p.orders) },
      { label: 'Последний заказ', value: lastOrder || '—' },
    ],
  };
};

const affiliationTooltip = (model: GraphModel, edge: GraphEdge): TooltipContent => {
  const nameOf = (id: string) => model.supplierByKey.get(id.slice(2))?.name ?? id.slice(2);
  return {
    title: 'Аффилированность',
    subtitle: `${nameOf(edge.source)} — ${nameOf(edge.target)}`,
    badge: { text: 'Связанные поставщики', color: COLORS.rose },
    rows: [{ label: 'Основание', value: edge.reason ?? 'не указано' }],
  };
};

/** Содержимое подсказки для узла или связи под курсором; null — объекта уже нет в графе */
export const describeHover = (model: GraphModel, target: HoverTarget): TooltipContent | null => {
  if (target.kind === 'node') {
    const node = model.nodes.find(n => n.id === target.id);
    if (!node) return null;
    return node.kind === 'supplier' ? supplierTooltip(model, node) : nomTooltip(model, node);
  }
  const edge = model.edges.find(e => e.id === target.id);
  if (!edge) return null;
  return edge.kind === 'purchase' ? purchaseTooltip(model, edge) : affiliationTooltip(model, edge);
};

/* ---------- Печатная таблица ---------- */

/** Видимые закупки для печатной формы: по порядку справочника номенклатуры, затем поставщиков */
export const buildPrintRows = (model: GraphModel): PrintRow[] => {
  const nomOrder = new Map([...model.nomByKey.keys()].map((key, i) => [key, i] as const));
  const supplierOrder = new Map([...model.supplierByKey.keys()].map((key, i) => [key, i] as const));
  const orderOf = (p: GraphPurchaseDto): number =>
    (nomOrder.get(p.nomKey) ?? 0) * 100_000 + (supplierOrder.get(p.supplierKey) ?? 0);
  const rows: { order: number; row: PrintRow }[] = [];
  model.edges.forEach(edge => {
    const p = edge.purchase;
    if (edge.kind !== 'purchase' || !p) return;
    const nom = model.nomByKey.get(p.nomKey);
    const ref = nom?.refPrice ?? 0;
    rows.push({
      order: orderOf(p),
      row: {
        id: edge.id,
        nomName: nom?.name ?? p.nomKey,
        supplierName: model.supplierByKey.get(p.supplierKey)?.name ?? p.supplierKey,
        price: p.avgPrice,
        refPrice: ref,
        overPercent: overPercent(p.avgPrice, ref),
        over: edge.over,
        qty: p.qty,
        unit: nom?.unit ?? '',
        amount: p.amount,
        lastAt: p.lastAt,
        lastOrderNo: p.lastOrderNo,
      },
    });
  });
  return rows.sort((a, b) => a.order - b.order).map(item => item.row);
};

/* ---------- Дерево слева и списки фильтров ---------- */

export interface NavItem {
  key: string;
  name: string;
  /** Поставщиков за период */
  suppliers: number;
  favorite: boolean;
}

export interface NavSection {
  key: string;
  title: string;
  icon: 'star' | 'layers';
  items: NavItem[];
}

/** Число разных поставщиков каждой позиции за период */
export const supplierCountByNom = (data: PurchaseGraphData): Map<string, number> => {
  const sets = new Map<string, Set<string>>();
  data.purchases.forEach(p => {
    const set = sets.get(p.nomKey) ?? new Set<string>();
    set.add(p.supplierKey);
    sets.set(p.nomKey, set);
  });
  return new Map([...sets].map(([key, set]) => [key, set.size] as const));
};

/** Позиция в избранном: выбор пользователя поверх признака из API */
export const isFavorite = (nom: GraphNomenclatureDto, overrides: Readonly<Record<string, boolean>>): boolean =>
  overrides[nom.key] ?? nom.favorite;

/** Разделы дерева: «Избранное», затем группы по порядку справочника; поиск — по подстроке имени */
export const buildNavSections = (
  data: PurchaseGraphData,
  overrides: Readonly<Record<string, boolean>>,
  search: string,
): NavSection[] => {
  const counts = supplierCountByNom(data);
  const needle = search.trim().toLowerCase();
  const matching = data.nomenclature.filter(n => !needle || n.name.toLowerCase().includes(needle));
  const toItem = (n: GraphNomenclatureDto): NavItem => ({
    key: n.key,
    name: n.name,
    suppliers: counts.get(n.key) ?? 0,
    favorite: isFavorite(n, overrides),
  });
  const sections: NavSection[] = [];
  const favorites = matching.filter(n => isFavorite(n, overrides));
  if (favorites.length) sections.push({ key: '__favorites', title: 'Избранное', icon: 'star', items: favorites.map(toItem) });
  const known = new Set(data.groups.map(g => g.key));
  data.groups.forEach((group: GraphGroupDto) => {
    const groupItems = matching.filter(n => n.groupKey === group.key);
    if (groupItems.length) sections.push({ key: group.key, title: group.name, icon: 'layers', items: groupItems.map(toItem) });
  });
  const rest = matching.filter(n => !known.has(n.groupKey));
  if (rest.length) sections.push({ key: '__other', title: 'Без группы', icon: 'layers', items: rest.map(toItem) });
  return sections;
};

export interface FilterOption {
  key: string;
  name: string;
  /** Серый текст справа (число поставщиков или позиций) */
  hint: string;
  /** Цветная точка слева (категория поставщика) */
  color?: string;
  groupKey?: string;
}

/** Пункты фильтра «Номенклатура»: позиции с группой и числом поставщиков */
export const nomFilterOptions = (data: PurchaseGraphData): FilterOption[] => {
  const counts = supplierCountByNom(data);
  return data.nomenclature.map(n => ({ key: n.key, name: n.name, hint: String(counts.get(n.key) ?? 0), groupKey: n.groupKey }));
};

/** Пункты фильтра «Поставщик»: цвет категории при текущем лимите и число позиций за период */
export const supplierFilterOptions = (data: PurchaseGraphData, limitPercent: number): FilterOption[] => {
  const nomByKey = new Map(data.nomenclature.map(n => [n.key, n] as const));
  const positions = new Map<string, number>();
  const over = new Set<string>();
  data.purchases.forEach(p => {
    positions.set(p.supplierKey, (positions.get(p.supplierKey) ?? 0) + 1);
    const nom = nomByKey.get(p.nomKey);
    if (nom && isOverLimit(p.avgPrice, nom.refPrice, limitPercent)) over.add(p.supplierKey);
  });
  return data.suppliers.map((s: GraphSupplierDto) => ({
    key: s.key,
    name: s.name,
    hint: String(positions.get(s.key) ?? 0),
    color: s.anchor ? CATEGORY_COLORS.anchor : over.has(s.key) ? CATEGORY_COLORS.over : CATEGORY_COLORS.regular,
  }));
};

/**
 * Переключение пункта множественного выбора. null — «все»; снятие галочки при «все» оставляет
 * все, кроме пункта; если отмечены все — снова null.
 */
export const toggleSelection = (
  selection: readonly string[] | null,
  key: string,
  allKeys: readonly string[],
): string[] | null => {
  const current = new Set(selection ?? allKeys);
  if (current.has(key)) current.delete(key);
  else current.add(key);
  return normalizeSelection([...current], allKeys);
};

/** Отметить или снять сразу несколько пунктов (группа в фильтре номенклатуры) */
export const setSelectionKeys = (
  selection: readonly string[] | null,
  keys: readonly string[],
  checked: boolean,
  allKeys: readonly string[],
): string[] | null => {
  const current = new Set(selection ?? allKeys);
  keys.forEach(key => (checked ? current.add(key) : current.delete(key)));
  return normalizeSelection([...current], allKeys);
};

/** Выбор в порядке справочника; все пункты — null («Все») */
export const normalizeSelection = (keys: readonly string[], allKeys: readonly string[]): string[] | null => {
  const set = new Set(keys);
  const ordered = allKeys.filter(key => set.has(key));
  return ordered.length === allKeys.length && allKeys.length > 0 ? null : ordered;
};

/** Отмечен ли пункт при текущем выборе */
export const isSelected = (selection: readonly string[] | null, key: string): boolean =>
  selection === null || selection.includes(key);
