// tree.ts — дерево строк ГПП: индекс родителей и детей, видимые строки (свёрнутые узлы, поиск, фильтр,
// сортировка внутри уровня, сквозная нумерация), копирование и удаление поддеревьев, новые строки.
// Все функции чистые: на входе и выходе — плоский список в порядке обхода дерева.
import type { GppRowDTO, RowKind, SortMode, VisibleRow } from './types';
import { parseDay } from './dates';

export interface TreeIndex {
  byUid: Map<string, GppRowDTO>;
  /** Дети узла по порядку; ключ null — изделия (корни) */
  children: Map<string | null, GppRowDTO[]>;
  depth: Map<string, number>;
  /** Изделие, к которому относится строка */
  productOf: Map<string, string>;
}

const byPosition = (a: GppRowDTO, b: GppRowDTO): number => a.position - b.position;

export const buildIndex = (rows: readonly GppRowDTO[]): TreeIndex => {
  const byUid = new Map<string, GppRowDTO>();
  rows.forEach(r => byUid.set(r.uid, r));
  const children = new Map<string | null, GppRowDTO[]>();
  rows.forEach(r => {
    // Строка с потерянным родителем показывается как корень, чтобы не пропасть из таблицы
    const parent = r.parentUid !== null && byUid.has(r.parentUid) ? r.parentUid : null;
    const list = children.get(parent);
    if (list) list.push(r);
    else children.set(parent, [r]);
  });
  children.forEach(list => list.sort(byPosition));

  const depth = new Map<string, number>();
  const productOf = new Map<string, string>();
  const walk = (parent: string | null, level: number, product: string | null) => {
    (children.get(parent) ?? []).forEach(r => {
      if (depth.has(r.uid)) return; // защита от зацикливания по родителям
      depth.set(r.uid, level);
      const root = product ?? r.uid;
      productOf.set(r.uid, root);
      walk(r.uid, level + 1, root);
    });
  };
  walk(null, 0, null);
  return { byUid, children, depth, productOf };
};

/** Список в порядке обхода дерева с позициями 0..n среди братьев */
export const normalize = (rows: readonly GppRowDTO[]): GppRowDTO[] => {
  const { children } = buildIndex(rows);
  const out: GppRowDTO[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null) => {
    (children.get(parent) ?? []).forEach((r, i) => {
      if (seen.has(r.uid)) return;
      seen.add(r.uid);
      out.push(r.position === i && r.parentUid === parent ? r : { ...r, position: i, parentUid: parent });
      walk(r.uid);
    });
  };
  walk(null);
  return out;
};

/** Все потомки узла (без него самого) */
export const descendants = (index: TreeIndex, uid: string): string[] => {
  const out: string[] = [];
  const walk = (id: string) => {
    (index.children.get(id) ?? []).forEach(c => {
      out.push(c.uid);
      walk(c.uid);
    });
  };
  walk(uid);
  return out;
};

/** Предки строки от родителя к корню */
export const ancestors = (index: TreeIndex, uid: string): string[] => {
  const out: string[] = [];
  let current = index.byUid.get(uid)?.parentUid ?? null;
  while (current !== null && index.byUid.has(current) && !out.includes(current)) {
    out.push(current);
    current = index.byUid.get(current)?.parentUid ?? null;
  }
  return out;
};

/** Узлы с детьми — их можно сворачивать */
export const expandableUids = (rows: readonly GppRowDTO[]): string[] => {
  const parents = new Set(rows.map(r => r.parentUid).filter((p): p is string => p !== null));
  return rows.filter(r => parents.has(r.uid)).map(r => r.uid);
};

/** Подпись строки как на экране: «Р03.200.000.12 Вал приводной в сборе» */
export const rowLabel = (row: Pick<GppRowDTO, 'code' | 'name'>): string => (row.code ? `${row.code} ${row.name}` : row.name);

export interface ViewOptions {
  collapsed: ReadonlySet<string>;
  search: string;
  /** Пустое множество — фильтра по виду нет */
  kinds: ReadonlySet<RowKind>;
  sort: SortMode;
}

const compareText = (a: string, b: string): number => a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' });

const sorter = (mode: SortMode) => (a: GppRowDTO, b: GppRowDTO): number => {
  if (mode === 'name') return compareText(rowLabel(a), rowLabel(b)) || a.position - b.position;
  if (mode === 'start') {
    const sa = parseDay(a.start);
    const sb = parseDay(b.start);
    // У материалов дат нет — они остаются внизу уровня в исходном порядке
    if (sa === null && sb === null) return a.position - b.position;
    if (sa === null) return 1;
    if (sb === null) return -1;
    return sa - sb || a.position - b.position;
  }
  return a.position - b.position;
};

/**
 * Строки таблицы. При поиске или фильтре видны совпавшие строки и их предки (предки — приглушённым
 * контекстом); свёрнутые узлы раскрываются, иначе найденная строка могла бы спрятаться внутри «+».
 */
export const visibleRows = (rows: readonly GppRowDTO[], options: ViewOptions): VisibleRow[] => {
  const index = buildIndex(rows);
  const query = options.search.trim().toLowerCase();
  const filtering = query !== '' || options.kinds.size > 0;

  let shown: Set<string> | null = null;
  const matched = new Set<string>();
  if (filtering) {
    shown = new Set<string>();
    rows.forEach(r => {
      const kindOk = options.kinds.size === 0 || options.kinds.has(r.kind);
      const textOk = query === '' || rowLabel(r).toLowerCase().includes(query) || (r.opNumber ?? '').toLowerCase() === query;
      if (kindOk && textOk) {
        matched.add(r.uid);
        shown!.add(r.uid);
        ancestors(index, r.uid).forEach(a => shown!.add(a));
      }
    });
  }

  const ignoreCollapsed = filtering;
  const compare = sorter(options.sort);
  const out: VisibleRow[] = [];
  const walk = (parent: string | null) => {
    const list = [...(index.children.get(parent) ?? [])].sort(compare);
    list.forEach(r => {
      if (shown && !shown.has(r.uid)) return;
      const kids = index.children.get(r.uid) ?? [];
      const hasChildren = kids.length > 0;
      const expanded = hasChildren && (ignoreCollapsed || !options.collapsed.has(r.uid));
      out.push({ row: r, depth: index.depth.get(r.uid) ?? 0, number: out.length + 1, hasChildren, expanded, context: filtering && !matched.has(r.uid) });
      if (expanded) walk(r.uid);
    });
  };
  walk(null);
  return out;
};

/** UUID v4: crypto.randomUUID есть только на https и localhost, в локальной сети по http — нет */
export const newUid = (): string => {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Верхние из отмеченных: отмеченные потомки уже входят в поддерево отмеченного предка */
const topMost = (index: TreeIndex, uids: Iterable<string>): string[] => {
  const set = new Set([...uids].filter(u => index.byUid.has(u)));
  return [...set].filter(u => !ancestors(index, u).some(a => set.has(a)));
};

/**
 * Копия отмеченных строк вместе с поддеревьями: новые uid, зависимости внутри копии переназначены,
 * копия встаёт сразу после оригинала. Возвращает строки и uid новых верхних копий.
 * Таблица новых uid общая для всех отмеченных: копия 003 ждёт копию 002, если отмечены обе детали.
 */
export const copySubtrees = (rows: readonly GppRowDTO[], uids: Iterable<string>): { rows: GppRowDTO[]; copies: string[] } => {
  const index = buildIndex(rows);
  const roots = topMost(index, uids);
  if (roots.length === 0) return { rows: [...rows], copies: [] };

  const subtrees = roots.map(rootUid => [rootUid, ...descendants(index, rootUid)]);
  const remap = new Map(subtrees.flat().map(u => [u, newUid()]));
  const rootSet = new Set(roots);
  const cloned = subtrees.flat().map(u => {
    const r = index.byUid.get(u)!;
    const isRoot = rootSet.has(u);
    return {
      ...r,
      uid: remap.get(u)!,
      parentUid: isRoot ? r.parentUid : remap.get(r.parentUid ?? '') ?? r.parentUid,
      dependsOn: r.dependsOn.map(d => remap.get(d) ?? d),
      // Копия верхней строки — сразу после оригинала; у братьев позиции целые, так что копии не перемешаются
      position: isRoot ? r.position + 0.5 : r.position,
    };
  });
  return { rows: normalize([...rows, ...cloned]), copies: roots.map(u => remap.get(u)!) };
};

/** Строки, которые уйдут при удалении: отмеченные вместе со всеми вложенными */
export const subtreeOf = (rows: readonly GppRowDTO[], uids: Iterable<string>): Set<string> => {
  const index = buildIndex(rows);
  const gone = new Set<string>();
  topMost(index, uids).forEach(u => {
    gone.add(u);
    descendants(index, u).forEach(d => gone.add(d));
  });
  return gone;
};

/** Удаление строк с поддеревьями; ссылки на удалённые строки убираются из зависимостей */
export const deleteSubtrees = (rows: readonly GppRowDTO[], uids: Iterable<string>): GppRowDTO[] => {
  const gone = subtreeOf(rows, uids);
  if (gone.size === 0) return [...rows];
  return normalize(
    rows
      .filter(r => !gone.has(r.uid))
      .map(r => (r.dependsOn.some(d => gone.has(d)) ? { ...r, dependsOn: r.dependsOn.filter(d => !gone.has(d)) } : r)),
  );
};

/** Следующий номер операции среди братьев: «001», «002»… */
export const nextOpNumber = (siblings: readonly GppRowDTO[]): string => {
  const max = siblings.reduce((m, s) => {
    const n = Number.parseInt(s.opNumber ?? '', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1).padStart(3, '0');
};

/** Куда вставить новую строку нужного вида относительно строки, на которой открыли меню */
export const placeNewRow = (
  rows: readonly GppRowDTO[],
  kind: RowKind,
  anchorUid: string | null,
): { parentUid: string | null; position: number } => {
  const index = buildIndex(rows);
  const anchor = anchorUid ? index.byUid.get(anchorUid) ?? null : null;
  const roots = index.children.get(null) ?? [];

  if (kind === 'PRODUCT' || !anchor) {
    // Изделие — новым корнем сразу после изделия, на котором открыли меню (или в конец)
    const product = anchor ? index.byUid.get(index.productOf.get(anchor.uid) ?? '') : undefined;
    return { parentUid: null, position: product ? product.position + 0.5 : roots.length };
  }
  const lastChildOf = (uid: string) => ({ parentUid: uid, position: (index.children.get(uid) ?? []).length });
  if (kind === 'MATERIAL') {
    // Материал — последним в детали или изделии; на материале — сразу после него
    return anchor.kind === 'MATERIAL' ? { parentUid: anchor.parentUid, position: anchor.position + 0.5 } : lastChildOf(anchor.uid);
  }
  // Деталь: на изделии — последней в нём; на детали — сразу после неё; на материале — после его детали
  if (anchor.kind === 'PRODUCT') return lastChildOf(anchor.uid);
  const part = anchor.kind === 'MATERIAL' ? (anchor.parentUid ? index.byUid.get(anchor.parentUid) : undefined) : anchor;
  if (!part) return { parentUid: null, position: roots.length };
  if (part.kind === 'PRODUCT') return lastChildOf(part.uid);
  return { parentUid: part.parentUid, position: part.position + 0.5 };
};
