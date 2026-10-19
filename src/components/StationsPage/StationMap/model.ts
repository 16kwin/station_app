// model.ts — структура «Предприятие → Цех → Участок → Станции» из иерархии размещения и станций страницы.
// В иерархии станций нет: станции привязываются по workshopId/sectionId. Порядок с сервера не гарантирован,
// поэтому всё сортируется здесь по названию. Цеха без станций (с учётом фильтров страницы) не показываются.
import type { MapHierarchy, MapStation, StationStatusCode } from './types';
import { byName, STATUS, statusOf } from './theme';

export interface NodeStats {
  total: number;
  errors: number;
  critical: number;
  minimal: number;
  offline: number;
  /** Худший статус внутри узла */
  worst: StationStatusCode | null;
}

export interface SectionNode {
  kind: 'section';
  key: string;
  /** null — станции цеха без участка */
  id: number | null;
  name: string;
  workshopId: number;
  stations: MapStation[];
  stats: NodeStats;
}

export interface WorkshopNode {
  kind: 'workshop';
  key: string;
  id: number;
  name: string;
  enterpriseId: number | null;
  enterpriseName: string;
  /** Все участки цеха из иерархии, в конце — «Без участка», если такие станции есть */
  sections: SectionNode[];
  stations: MapStation[];
  stats: NodeStats;
}

export interface EnterpriseNode {
  kind: 'enterprise';
  key: string;
  id: number | null;
  name: string;
  workshops: WorkshopNode[];
  stats: NodeStats;
}

export interface HoldingNode {
  kind: 'holding';
  key: string;
  id: number | null;
  name: string;
  enterprises: EnterpriseNode[];
  stats: NodeStats;
}

export interface StationStructure {
  holdings: HoldingNode[];
  /** Холдинг показывается в дереве, только если их больше одного */
  showHoldings: boolean;
  /** Станции без цеха — на карте цеха их не разместить */
  unplaced: MapStation[];
  workshops: Map<number, WorkshopNode>;
  enterprises: EnterpriseNode[];
  total: number;
}

export const NO_SECTION = 'Без участка';

export const statsOf = (stations: readonly MapStation[]): NodeStats => {
  const stats: NodeStats = { total: stations.length, errors: 0, critical: 0, minimal: 0, offline: 0, worst: null };
  for (const station of stations) {
    const status = statusOf(station.status);
    if (station.hasError) stats.errors += 1;
    if (status === 'CRITICAL_STOCK') stats.critical += 1;
    else if (status === 'MINIMAL_STOCK') stats.minimal += 1;
    else if (status === 'OFFLINE') stats.offline += 1;
    if (!stats.worst || STATUS[status].severity > STATUS[stats.worst].severity) stats.worst = status;
  }
  return stats;
};

const sortStations = (stations: MapStation[]): MapStation[] => [...stations].sort((a, b) => byName(a.name, b.name));

interface RawWorkshop {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

/** Узел цеха: участки из иерархии и станции по sectionId; неизвестные участки берутся из станций */
const buildWorkshop = (raw: RawWorkshop, enterpriseId: number | null, enterpriseName: string, stations: MapStation[]): WorkshopNode => {
  const sections = new Map<number, { id: number; name: string; stations: MapStation[] }>();
  for (const section of raw.sections) sections.set(section.id, { id: section.id, name: section.name, stations: [] });
  const loose: MapStation[] = [];
  for (const station of stations) {
    const sectionId = station.sectionId ?? null;
    if (sectionId === null) {
      loose.push(station);
      continue;
    }
    let section = sections.get(sectionId);
    if (!section) {
      // Участок есть у станции, но не пришёл в иерархии — берём название со станции
      section = { id: sectionId, name: station.section || `Участок ${sectionId}`, stations: [] };
      sections.set(sectionId, section);
    }
    section.stations.push(station);
  }
  const sectionNodes: SectionNode[] = [...sections.values()]
    .sort((a, b) => byName(a.name, b.name))
    .map(section => ({
      kind: 'section',
      key: `s:${section.id}`,
      id: section.id,
      name: section.name,
      workshopId: raw.id,
      stations: sortStations(section.stations),
      stats: statsOf(section.stations),
    }));
  if (loose.length > 0) {
    sectionNodes.push({
      kind: 'section',
      key: `s:none:${raw.id}`,
      id: null,
      name: NO_SECTION,
      workshopId: raw.id,
      stations: sortStations(loose),
      stats: statsOf(loose),
    });
  }
  return {
    kind: 'workshop',
    key: `w:${raw.id}`,
    id: raw.id,
    name: raw.name,
    enterpriseId,
    enterpriseName,
    sections: sectionNodes,
    stations: sortStations(stations),
    stats: statsOf(stations),
  };
};

export const buildStructure = (hierarchy: MapHierarchy | null, stations: readonly MapStation[]): StationStructure => {
  // Станции по цехам
  const byWorkshop = new Map<number, MapStation[]>();
  const unplaced: MapStation[] = [];
  for (const station of stations) {
    const workshopId = station.workshopId ?? null;
    if (workshopId === null) {
      unplaced.push(station);
      continue;
    }
    const list = byWorkshop.get(workshopId);
    if (list) list.push(station);
    else byWorkshop.set(workshopId, [station]);
  }

  const workshops = new Map<number, WorkshopNode>();
  const holdings: HoldingNode[] = [];
  const enterpriseIndex = new Map<number, EnterpriseNode>();

  for (const holding of hierarchy?.holdings ?? []) {
    const enterprises: EnterpriseNode[] = [];
    for (const enterprise of holding.enterprises ?? []) {
      const workshopNodes: WorkshopNode[] = [];
      for (const workshop of enterprise.workshops ?? []) {
        const list = byWorkshop.get(workshop.id);
        if (!list || workshops.has(workshop.id)) continue;
        const node = buildWorkshop(
          { id: workshop.id, name: workshop.name, sections: workshop.sections ?? [] },
          enterprise.id,
          enterprise.name,
          list,
        );
        workshops.set(workshop.id, node);
        workshopNodes.push(node);
      }
      const node: EnterpriseNode = {
        kind: 'enterprise',
        key: `e:${enterprise.id}`,
        id: enterprise.id,
        name: enterprise.name,
        workshops: workshopNodes,
        stats: statsOf(workshopNodes.flatMap(w => w.stations)),
      };
      enterpriseIndex.set(enterprise.id, node);
      enterprises.push(node);
    }
    holdings.push({ kind: 'holding', key: `h:${holding.id}`, id: holding.id, name: holding.name, enterprises, stats: statsOf([]) });
  }

  // Цеха станций, которых нет в иерархии (иерархия не загрузилась или устарела) — по полям станций
  let fallbackHolding: HoldingNode | null = null;
  for (const [workshopId, list] of byWorkshop) {
    if (workshops.has(workshopId)) continue;
    const sample = list[0];
    const enterpriseId = sample.enterpriseId ?? null;
    let enterprise = enterpriseId !== null ? enterpriseIndex.get(enterpriseId) : undefined;
    if (!enterprise) {
      if (!fallbackHolding) {
        fallbackHolding = { kind: 'holding', key: 'h:none', id: null, name: 'Без холдинга', enterprises: [], stats: statsOf([]) };
        holdings.push(fallbackHolding);
      }
      enterprise = {
        kind: 'enterprise',
        key: `e:${enterpriseId ?? 'none'}`,
        id: enterpriseId,
        name: sample.enterprise || (enterpriseId !== null ? `Предприятие ${enterpriseId}` : 'Без предприятия'),
        workshops: [],
        stats: statsOf([]),
      };
      if (enterpriseId !== null) enterpriseIndex.set(enterpriseId, enterprise);
      fallbackHolding.enterprises.push(enterprise);
    }
    const node = buildWorkshop(
      { id: workshopId, name: sample.workshop || `Цех ${workshopId}`, sections: [] },
      enterprise.id,
      enterprise.name,
      list,
    );
    workshops.set(workshopId, node);
    enterprise.workshops.push(node);
  }

  // Сортировка, счётчики и отсев пустых веток
  const visibleHoldings = holdings
    .map(holding => {
      const enterprises = holding.enterprises
        .map(enterprise => {
          const sorted = [...enterprise.workshops].sort((a, b) => byName(a.name, b.name));
          return { ...enterprise, workshops: sorted, stats: statsOf(sorted.flatMap(w => w.stations)) };
        })
        .filter(enterprise => enterprise.workshops.length > 0)
        .sort((a, b) => byName(a.name, b.name));
      return { ...holding, enterprises, stats: statsOf(enterprises.flatMap(e => e.workshops.flatMap(w => w.stations))) };
    })
    .filter(holding => holding.enterprises.length > 0)
    .sort((a, b) => byName(a.name, b.name));

  return {
    holdings: visibleHoldings,
    showHoldings: visibleHoldings.length > 1,
    unplaced: sortStations(unplaced),
    workshops,
    enterprises: visibleHoldings.flatMap(h => h.enterprises),
    total: stations.length,
  };
};

/** Первый цех в порядке дерева */
export const firstWorkshop = (structure: StationStructure): WorkshopNode | null =>
  structure.enterprises.find(e => e.workshops.length > 0)?.workshops[0] ?? null;

/** Предприятие цеха в структуре */
export const enterpriseOf = (structure: StationStructure, workshopId: number | null): EnterpriseNode | null =>
  workshopId === null ? null : structure.enterprises.find(e => e.workshops.some(w => w.id === workshopId)) ?? null;

/* ---------- Поиск по дереву ---------- */

const matches = (text: string | null | undefined, query: string): boolean => !!text && text.toLowerCase().includes(query);

/**
 * Ветки, где есть совпадение: узел, совпавший по названию, остаётся целиком, иначе — только совпавшие
 * станции и участки. Пустой запрос — дерево без изменений.
 */
export const filterHoldings = (holdings: HoldingNode[], rawQuery: string): HoldingNode[] => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return holdings;
  const filterSection = (section: SectionNode): SectionNode | null => {
    if (matches(section.name, query)) return section;
    const stations = section.stations.filter(s => matches(s.name, query) || matches(s.uid, query));
    return stations.length > 0 ? { ...section, stations } : null;
  };
  const filterWorkshop = (workshop: WorkshopNode): WorkshopNode | null => {
    if (matches(workshop.name, query)) return workshop;
    const sections = workshop.sections.map(filterSection).filter((s): s is SectionNode => s !== null);
    return sections.length > 0 ? { ...workshop, sections } : null;
  };
  const filterEnterprise = (enterprise: EnterpriseNode): EnterpriseNode | null => {
    if (matches(enterprise.name, query)) return enterprise;
    const workshops = enterprise.workshops.map(filterWorkshop).filter((w): w is WorkshopNode => w !== null);
    return workshops.length > 0 ? { ...enterprise, workshops } : null;
  };
  return holdings
    .map(holding => {
      if (matches(holding.name, query)) return holding;
      const enterprises = holding.enterprises.map(filterEnterprise).filter((e): e is EnterpriseNode => e !== null);
      return enterprises.length > 0 ? { ...holding, enterprises } : null;
    })
    .filter((h): h is HoldingNode => h !== null);
};

/** Склонение: 1 станция, 2 станции, 5 станций */
export const plural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export const stationsWord = (n: number): string => `${n} ${plural(n, 'станция', 'станции', 'станций')}`;
