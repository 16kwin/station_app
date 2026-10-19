// StationTree.tsx — левая панель «Структура станций»: поиск и дерево Предприятие → Цех → Участок → Станции
// (холдинг — только если их больше одного). У узлов — число станций и точка худшего статуса.
// Клик по цеху открывает его карту, по участку — подсвечивает зону, по станции — показывает её на карте.
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MapStation } from './types';
import type { EnterpriseNode, HoldingNode, NodeStats, SectionNode, StationStructure, WorkshopNode } from './model';
import { filterHoldings, stationsWord } from './model';
import { COLORS, FONT, SHADOWS, STATUS, statusGradient, statusStyle } from './theme';
import { ChevronIcon, CloseIcon, SearchIcon } from './icons';
import HoldingIcon from '../../../assets/Station/12.svg';
import EnterpriseIcon from '../../../assets/Station/4.svg';
import WorkshopIcon from '../../../assets/Station/5.svg';
import SectionIcon from '../../../assets/Station/6.svg';

export interface TreeSelection {
  enterpriseKey: string | null;
  workshopId: number | null;
  sectionKey: string | null;
  stationUid: string | null;
}

interface StationTreeProps {
  structure: StationStructure;
  selection: TreeSelection;
  loading: boolean;
  onSelectEnterprise: (enterprise: EnterpriseNode) => void;
  onSelectWorkshop: (workshop: WorkshopNode) => void;
  onSelectSection: (workshop: WorkshopNode, section: SectionNode) => void;
  onSelectStation: (workshop: WorkshopNode, station: MapStation) => void;
}

const STORAGE_KEY = 'stationsMapTree';
const ROW_HEIGHT = 34;
const INDENT = 18;

/** Подсветка строк при наведении — через классы: инлайном :hover не задать */
const TREE_CSS = `
.sm-tree-row:hover { background-color: ${COLORS.rowHover}; }
.sm-tree-row[aria-selected="true"]:hover { background-color: rgba(102, 110, 254, 0.12); }
.sm-tree-row:focus-visible { outline: 2px solid ${COLORS.accentRing}; outline-offset: -2px; }
.sm-tree-list::-webkit-scrollbar { width: 6px; }
.sm-tree-list::-webkit-scrollbar-thumb { background: #C9D2E0; border-radius: 3px; }
.sm-tree-list::-webkit-scrollbar-track { background: transparent; }
`;

const loadExpanded = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
};

const saveExpanded = (keys: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    // хранилище недоступно — раскрытие просто не запомнится
  }
};

/** Совпадение с поиском — акцентом */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span style={{ color: COLORS.accent, fontWeight: 700 }}>{text.slice(at, at + q.length)}</span>
      {text.slice(at + q.length)}
    </>
  );
};

/** Точка худшего статуса и число станций узла */
const NodeBadge: React.FC<{ stats: NodeStats }> = ({ stats }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    {stats.worst && (
      <span
        title={STATUS[stats.worst].label}
        style={{ width: 8, height: 8, borderRadius: '50%', background: statusGradient(stats.worst) }}
      />
    )}
    <span style={{ minWidth: 16, textAlign: 'right', fontSize: 12, fontWeight: 500, color: stats.total ? COLORS.muted : COLORS.faint }}>
      {stats.total}
    </span>
  </span>
);

interface RowProps {
  level: number;
  icon?: string;
  name: string;
  query: string;
  expandable: boolean;
  expanded: boolean;
  selected: boolean;
  strong?: boolean;
  onToggle?: () => void;
  onClick: () => void;
  right: React.ReactNode;
  leading?: React.ReactNode;
  title?: string;
}

const TreeRow: React.FC<RowProps> = ({ level, icon, name, query, expandable, expanded, selected, strong, onToggle, onClick, right, leading, title }) => (
  <div
    role="treeitem"
    tabIndex={0}
    aria-selected={selected}
    aria-expanded={expandable ? expanded : undefined}
    className="sm-tree-row"
    title={title ?? name}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      } else if (expandable && ((e.key === 'ArrowRight' && !expanded) || (e.key === 'ArrowLeft' && expanded))) {
        e.preventDefault();
        onToggle?.();
      }
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: ROW_HEIGHT,
      padding: `0 10px 0 ${6 + level * INDENT}px`,
      borderRadius: 9,
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      color: selected ? COLORS.accent : COLORS.text,
      backgroundColor: selected ? COLORS.accentSoft : undefined,
      transition: 'background-color 0.15s ease, color 0.15s ease',
    }}
  >
    {expandable ? (
      <span
        role="button"
        aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        onClick={e => {
          e.stopPropagation();
          onToggle?.();
        }}
        style={{
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${expanded ? 90 : 0}deg)`,
          transition: 'transform 0.2s ease',
          flexShrink: 0,
          borderRadius: 5,
        }}
      >
        <ChevronIcon size={15} color={selected ? COLORS.accent : COLORS.muted} strokeWidth={2.2} />
      </span>
    ) : (
      <span style={{ width: 18, flexShrink: 0 }} />
    )}
    {leading}
    {icon && <img src={icon} alt="" aria-hidden="true" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0, opacity: selected ? 1 : 0.85 }} />}
    <span
      style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 14,
        fontWeight: strong || selected ? 600 : 400,
        lineHeight: '18px',
      }}
    >
      <Highlight text={name} query={query} />
    </span>
    {right}
  </div>
);

/** Плавное раскрытие ветки */
const Branch: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        role="group"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const StationTree: React.FC<StationTreeProps> = ({
  structure,
  selection,
  loading,
  onSelectEnterprise,
  onSelectWorkshop,
  onSelectSection,
  onSelectStation,
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(loadExpanded()));

  // Выбор пришёл снаружи (мнемосхема, первый показ) — раскрываем путь к нему
  const pathKey = `${selection.enterpriseKey ?? ''}|${selection.workshopId ?? ''}|${selection.sectionKey ?? ''}`;
  const [shownPath, setShownPath] = useState('');
  if (shownPath !== pathKey) {
    setShownPath(pathKey);
    const path: string[] = [];
    for (const holding of structure.holdings) {
      for (const enterprise of holding.enterprises) {
        const workshop = enterprise.workshops.find(w => w.id === selection.workshopId);
        if (workshop) {
          path.push(holding.key, enterprise.key);
          if (selection.sectionKey) path.push(workshop.key);
        } else if (enterprise.key === selection.enterpriseKey) {
          path.push(holding.key, enterprise.key);
        }
      }
    }
    if (path.some(key => !expanded.has(key))) {
      const next = new Set(expanded);
      path.forEach(key => next.add(key));
      setExpanded(next);
    }
  }

  useEffect(() => saveExpanded(expanded), [expanded]);

  const searching = search.trim().length > 0;
  const holdings = useMemo(() => filterHoldings(structure.holdings, search), [structure.holdings, search]);

  const isOpen = (key: string): boolean => searching || expanded.has(key);
  const toggle = (key: string): void => {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  };
  const open = (key: string): void => {
    if (expanded.has(key)) return;
    const next = new Set(expanded);
    next.add(key);
    setExpanded(next);
  };

  const renderStation = (workshop: WorkshopNode, station: MapStation, level: number) => (
    <TreeRow
      key={station.uid}
      level={level}
      name={station.name}
      query={search}
      expandable={false}
      expanded={false}
      selected={selection.stationUid === station.uid}
      onClick={() => onSelectStation(workshop, station)}
      title={`${station.name} — ${statusStyle(station.status).label}`}
      leading={<span style={{ width: 9, height: 9, borderRadius: '50%', background: statusGradient(station.status), flexShrink: 0, marginLeft: 4 }} />}
      right={
        station.hasError ? (
          <span title="Есть ошибка" style={{ fontSize: 11, fontWeight: 700, color: COLORS.error, flexShrink: 0 }}>
            ERR
          </span>
        ) : null
      }
    />
  );

  const renderSection = (workshop: WorkshopNode, section: SectionNode, level: number) => {
    const key = `${workshop.key}/${section.key}`;
    const opened = isOpen(key);
    return (
      <div key={section.key}>
        <TreeRow
          level={level}
          icon={SectionIcon}
          name={section.name}
          query={search}
          expandable={section.stations.length > 0}
          expanded={opened}
          selected={selection.sectionKey === section.key && selection.stationUid === null}
          onToggle={() => toggle(key)}
          onClick={() => {
            open(key);
            onSelectSection(workshop, section);
          }}
          right={<NodeBadge stats={section.stats} />}
        />
        <Branch open={opened && section.stations.length > 0}>{section.stations.map(s => renderStation(workshop, s, level + 1))}</Branch>
      </div>
    );
  };

  const renderWorkshop = (workshop: WorkshopNode, level: number) => {
    const opened = isOpen(workshop.key);
    const active = selection.workshopId === workshop.id;
    return (
      <div key={workshop.key}>
        <TreeRow
          level={level}
          icon={WorkshopIcon}
          name={workshop.name}
          query={search}
          expandable={workshop.sections.length > 0}
          expanded={opened}
          selected={active && selection.sectionKey === null && selection.stationUid === null}
          strong={active}
          onToggle={() => toggle(workshop.key)}
          onClick={() => {
            open(workshop.key);
            onSelectWorkshop(workshop);
          }}
          right={<NodeBadge stats={workshop.stats} />}
        />
        <Branch open={opened}>{workshop.sections.map(section => renderSection(workshop, section, level + 1))}</Branch>
      </div>
    );
  };

  const renderEnterprise = (enterprise: EnterpriseNode, level: number) => {
    const opened = isOpen(enterprise.key);
    return (
      <div key={enterprise.key}>
        <TreeRow
          level={level}
          icon={EnterpriseIcon}
          name={enterprise.name}
          query={search}
          expandable={enterprise.workshops.length > 0}
          expanded={opened}
          selected={selection.enterpriseKey === enterprise.key && selection.workshopId === null}
          strong
          onToggle={() => toggle(enterprise.key)}
          onClick={() => {
            toggle(enterprise.key);
            onSelectEnterprise(enterprise);
          }}
          right={<NodeBadge stats={enterprise.stats} />}
        />
        <Branch open={opened}>{enterprise.workshops.map(workshop => renderWorkshop(workshop, level + 1))}</Branch>
      </div>
    );
  };

  const renderHolding = (holding: HoldingNode) => {
    const opened = isOpen(holding.key);
    return (
      <div key={holding.key}>
        <TreeRow
          level={0}
          icon={HoldingIcon}
          name={holding.name}
          query={search}
          expandable
          expanded={opened}
          selected={false}
          strong
          onToggle={() => toggle(holding.key)}
          onClick={() => toggle(holding.key)}
          right={<NodeBadge stats={holding.stats} />}
        />
        <Branch open={opened}>{holding.enterprises.map(enterprise => renderEnterprise(enterprise, 1))}</Branch>
      </div>
    );
  };

  const empty = holdings.length === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        boxShadow: SHADOWS.card,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <style>{TREE_CSS}</style>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>Структура станций</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.muted }}>{stationsWord(structure.total)}</span>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 38,
            padding: '0 8px 0 14px',
            borderRadius: 19,
            backgroundColor: COLORS.pill,
            cursor: 'text',
          }}
        >
          <SearchIcon size={16} color={COLORS.accent} strokeWidth={2.2} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск станции, цеха, участка"
            aria-label="Поиск по структуре станций"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.text,
            }}
          />
          {searching && (
            <button
              type="button"
              aria-label="Очистить поиск"
              onClick={() => setSearch('')}
              style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
            >
              <CloseIcon size={13} color={COLORS.muted} />
            </button>
          )}
        </label>
      </div>
      <div style={{ height: 1, margin: '0 16px', backgroundColor: COLORS.line }} />

      <div role="tree" aria-label="Структура станций" className="sm-tree-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px 12px' }}>
        {structure.showHoldings
          ? holdings.map(renderHolding)
          : holdings.flatMap(holding => holding.enterprises).map(enterprise => renderEnterprise(enterprise, 0))}

        {empty && (
          <div style={{ padding: '18px 12px', fontSize: 13, color: COLORS.muted, lineHeight: '19px' }}>
            {loading ? 'Загрузка…' : searching ? 'Ничего не найдено' : 'Нет станций с размещением по цехам — проверьте фильтры страницы'}
          </div>
        )}

        {!searching && structure.unplaced.length > 0 && (
          <div style={{ margin: '12px 8px 0', padding: '10px 12px', borderRadius: 10, backgroundColor: COLORS.canvas, fontSize: 12, lineHeight: '17px', color: COLORS.muted }}>
            Ещё {stationsWord(structure.unplaced.length)} без цеха — на карте не показаны
          </div>
        )}
      </div>
    </div>
  );
};

export default StationTree;
