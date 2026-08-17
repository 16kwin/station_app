// TableToolbar.tsx — ПОЛНЫЙ ФАЙЛ (SUBMENU_MAX_WIDTH = 700, +5px запас)
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon18Black from '../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import SortingIcon20White from '../../assets/Icons/SortingIcons/SortingIcon20White.svg';
import FilterIcon18Black from '../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import CreateIcon14Black from '../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon18Black from '../../assets/Icons/DeleteIcons/DeleteIcon18Black.svg';
import PrintIcon18Black from '../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';
import ConfigurationIcon18Black from '../../assets/Icons/ConfigurationIcons/ConfigurationIcon18Black.svg';
import SortingIcon19BlueDown from '../../assets/Icons/SortingIcons/SortingIcon19BlueDown.svg';
import SortingIcon19BlueUp from '../../assets/Icons/SortingIcons/SortingIcon19BlueUp.svg';
import SortingIcon20BlueDown from '../../assets/Icons/SortingIcons/SortingIcon20BlueDown.svg';
import SortingIcon20BlueUp from '../../assets/Icons/SortingIcons/SortingIcon20BlueUp.svg';
import ArrowIcon6Black from '../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import CheckboxIcon18OffBlack from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

interface SortField { key: string; label: string; iconType?: '19' | '20' | null; isAccounting?: boolean; }
interface FilterField { key: string; label: string; hasSubmenu?: boolean; options?: { uid: string; name: string }[]; }
interface PlacementLevel { key: string; label: string; emptyText: string; }

interface HierarchyDTO { holdings: HoldingDTO[] }
interface HoldingDTO { id: number; name: string; enterprises: EnterpriseDTO[] }
interface EnterpriseDTO { id: number; name: string; holdingId: number; workshops: WorkshopDTO[] }
interface WorkshopDTO { id: number; name: string; enterpriseId: number; holdingId: number; sections: SectionDTO[] }
interface SectionDTO { id: number; name: string; workshopId: number; enterpriseId: number; holdingId: number }

type PlacementKey = string;
type PlacementSelections = Record<string, Set<string>>;

interface TableToolbarProps {
  sortFields: SortField[];
  filterFields: FilterField[];
  placementLevels: PlacementLevel[];
  accountingTypes: readonly string[];
  accountingColumnKeys: readonly string[];
  filterOptions?: Record<string, { uid: string; name: string }[]>;
  
  searchValue: string;
  onSearchChange: (value: string) => void;
  
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  accountingIndex: number;
  onSortSelect: (col: string) => void;
  onAccountingClick: () => void;
  onClearSort: () => void;
  
  activeFilters: Set<string>;
  filterValues: Record<string, Set<string>>;
  placementSelections: PlacementSelections;
  hasPlacementSelections: boolean;
  onFilterToggle: (key: string) => void;
  onCheckFilterOption: (filterKey: string, optionUid: string) => void;
  onPlacementLevelClick: (level: string) => void;
  onPlacementCheck: (level: string, value: string) => void;
  onClearFilters: () => void;
  
  hierarchy: HierarchyDTO | null;
  modelList: { uid: string; name: string; article: string }[];
  configList: string[];
  onFetchHierarchy: () => void;
  onFetchModels: () => void;
  onFetchConfigurations: () => void;
  
  selectedCount: number;
  onCreate: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onPrintPdf: () => void;
  showHistory: boolean;
  onHistory: () => void;
  onConfiguration: () => void;
  
  expanded: 'search' | 'sort' | 'filter' | null;
  setExpanded: React.Dispatch<React.SetStateAction<'search' | 'sort' | 'filter' | null>>;
}

const BTN_COLLAPSED = 40; const BTN_SEARCH_EXPANDED = 280; const BTN_SORT_EXPANDED = 230; const BTN_FILTER_EXPANDED = 230;
const BTN_GAP = 15; const GROUP_GAP = 110; const BTN_HEADER = 40; const BTN_CLEAR = 44;
const TEXT_HEIGHT = 18; const ITEM_GAP = 20; const TOP_PAD = 20; const BOTTOM_PAD = 20;
const LEFT_OFFSET = 30; const TEXT_WIDTH = 180; const INDICATOR_LEFT = 15; const INDICATOR_WIDTH = 2;
const INDICATOR_HEIGHT = 22; const ICON_RIGHT_PAD = 4;
const SUBMENU_WIDTH = 262;
const SUBMENU_OFFSET = 3;
const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
const SUBMENU_MAX_HEIGHT = 400;
const SUBMENU_MIN_WIDTH = 200;
const SUBMENU_MAX_WIDTH = 700;
const SUBMENU_LEFT_PAD = 30;
const SUBMENU_TEXT_TO_CHECKBOX_GAP = 20;
const SUBMENU_CHECKBOX_WIDTH = 20;
const SUBMENU_RIGHT_PAD = 20;
const SUBMENU_WIDTH_EXTRA = 5;

const getTextWidth = (text: string, fontSize: number, fontWeight: number): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * (fontSize * 0.6);
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  return ctx.measureText(text).width;
};

const TableToolbar: React.FC<TableToolbarProps> = ({
  sortFields,
  filterFields,
  placementLevels,
  accountingTypes,
  accountingColumnKeys,
  filterOptions = {},
  
  searchValue,
  onSearchChange,
  
  sortColumn,
  sortDirection,
  accountingIndex,
  onSortSelect,
  onAccountingClick,
  onClearSort,
  
  activeFilters,
  filterValues,
  placementSelections,
  hasPlacementSelections,
  onFilterToggle,
  onCheckFilterOption,
  onPlacementLevelClick,
  onPlacementCheck,
  onClearFilters,
  
  hierarchy,
  modelList,
  configList,
  onFetchHierarchy,
  onFetchModels,
  onFetchConfigurations,
  
  selectedCount,
  onCreate,
  onDelete,
  onPrint,
  onPrintPdf,
  showHistory,
  onHistory,
  onConfiguration,
  
  expanded,
  setExpanded,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [placementOpen, setPlacementOpen] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  const hasFilterFields = filterFields.length > 0;
  const hasActiveSort = sortColumn !== null;
  const hasActiveFilter = activeFilters.size > 0 || hasPlacementSelections;

  const getIndicatorTarget = useCallback((idx: number): number => TOP_PAD + idx * ROW_STEP + (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, []);
  
  const animateSortIndicator = useCallback((to: number) => { 
    if (rafRef.current) cancelAnimationFrame(rafRef.current); 
    const from = sortIndicatorY; 
    const duration = 200; 
    const startTime = performance.now(); 
    const animate = (currentTime: number) => { 
      const elapsed = currentTime - startTime; 
      const progress = Math.min(elapsed / duration, 1); 
      const eased = 1 - Math.pow(1 - progress, 3); 
      setSortIndicatorY(from + (to - from) * eased); 
      if (progress < 1) rafRef.current = requestAnimationFrame(animate); 
    }; 
    rafRef.current = requestAnimationFrame(animate); 
  }, [sortIndicatorY]);

  useEffect(() => { if (expanded === 'sort') { const idx = sortFields.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);

  const handleMouseEnter = useCallback((e: React.MouseEvent, text: string) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollWidth > target.clientWidth) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
      }, 400);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setTooltip(null);
  }, []);

  const toggleExpand = (type: 'search' | 'sort' | 'filter') => { 
    if (type === 'search' && expanded === 'search') { 
      setExpanded(null); 
      onSearchChange(''); 
      return; 
    }
    if (type === 'filter' && expanded === 'filter') {
      setExpanded(null);
      setSubmenuOpen(null);
      setPlacementOpen(null);
      return;
    }
    setExpanded(prev => prev === type ? null : type); 
  };
  
  const handleSearchClose = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setExpanded(null); 
    onSearchChange(''); 
  };
  
  const handleSortFieldClick = (field: SortField) => {
    if (field.isAccounting) {
      onAccountingClick();
    } else {
      onSortSelect(field.key);
    }
    const idx = sortFields.findIndex(f => f.key === field.key);
    if (idx >= 0) {
      animateSortIndicator(getIndicatorTarget(idx));
    }
  };
  
  const getSortIcon = (field: SortField): string | null => { 
    if (!field.iconType || sortColumn !== field.key) return null; 
    if (field.iconType === '19') return sortDirection === 'asc' ? SortingIcon19BlueUp : SortingIcon19BlueDown; 
    if (field.iconType === '20') return sortDirection === 'asc' ? SortingIcon20BlueUp : SortingIcon20BlueDown; 
    return null; 
  };
  
  const getSortLabel = (field: SortField): string => { 
    if (field.isAccounting && accountingIndex >= 0) return `${field.label} (${accountingTypes[accountingIndex]})`; 
    return field.label; 
  };

  const handleFilterToggle = (key: string) => {
    setSubmenuOpen(prev => prev === key ? null : key);
    setPlacementOpen(null);
    onFilterToggle(key);
  };

  const getPlacementOptions = (level: string): { uid: string; name: string }[] => { 
    if (!hierarchy) return []; 
    if (level === 'holdingName') return hierarchy.holdings.map(h => ({ uid: String(h.id), name: h.name })); 
    let holdings = hierarchy.holdings; 
    const sh = placementSelections['holdingName']; 
    if (sh && sh.size > 0) holdings = holdings.filter(h => sh.has(String(h.id))); 
    if (level === 'enterpriseName') { 
      const result: { uid: string; name: string }[] = []; 
      const seen = new Set<string>(); 
      holdings.forEach(h => h.enterprises.forEach(e => { 
        if (!seen.has(String(e.id))) { seen.add(String(e.id)); result.push({ uid: String(e.id), name: e.name }); } 
      })); 
      return result.sort((a, b) => a.name.localeCompare(b.name)); 
    } 
    let enterprises: EnterpriseDTO[] = []; 
    holdings.forEach(h => enterprises.push(...h.enterprises)); 
    const se = placementSelections['enterpriseName']; 
    if (se && se.size > 0) enterprises = enterprises.filter(e => se.has(String(e.id))); 
    if (level === 'workshopName') { 
      const result: { uid: string; name: string }[] = []; 
      const seen = new Set<string>(); 
      enterprises.forEach(e => e.workshops.forEach(w => { 
        if (!seen.has(String(w.id))) { seen.add(String(w.id)); result.push({ uid: String(w.id), name: w.name }); } 
      })); 
      return result.sort((a, b) => a.name.localeCompare(b.name)); 
    } 
    let workshops: WorkshopDTO[] = []; 
    enterprises.forEach(e => workshops.push(...e.workshops)); 
    const sw = placementSelections['workshopName']; 
    if (sw && sw.size > 0) workshops = workshops.filter(w => sw.has(String(w.id))); 
    if (level === 'sectionName') { 
      const result: { uid: string; name: string }[] = []; 
      const seen = new Set<string>(); 
      workshops.forEach(w => w.sections.forEach(s => { 
        if (!seen.has(String(s.id))) { seen.add(String(s.id)); result.push({ uid: String(s.id), name: s.name }); } 
      })); 
      return result.sort((a, b) => a.name.localeCompare(b.name)); 
    } 
    return []; 
  };
  
  const handlePlacementLevelClick = (level: string) => {
    setPlacementOpen(prev => prev === level ? null : level);
    onPlacementLevelClick(level);
  };
  
  const handlePlacementCheck = (level: string, value: string) => { 
    onPlacementCheck(level, value);
  };

  const isPlacementChecked = (level: string, value: string): boolean => 
    placementSelections[level]?.has(value) || false;
  
  const handleClearFilters = () => { 
    setSubmenuOpen(null); 
    setPlacementOpen(null); 
    onClearFilters();
  };
  
  const getFilterIndicatorIdx = (key: string): number => 
    filterFields.findIndex(f => f.key === key);

  const isFilterOptionChecked = (filterKey: string, optionUid: string): boolean => 
    filterValues[filterKey]?.has(optionUid) || false;

  const getSubmenuOptions = (key: string): { uid: string; name: string }[] => {
    if (key === 'sectionName') return [];
    if (filterOptions[key]) return filterOptions[key];
    const field = filterFields.find(f => f.key === key);
    if (field?.options) return field.options;
    return [];
  };

  const getSubmenuHeight = (key: string): number => {
    const opts = getSubmenuOptions(key);
    if (opts.length === 0) return TOP_PAD + TEXT_HEIGHT + BOTTOM_PAD;
    const h = TOP_PAD + opts.length * TEXT_HEIGHT + (opts.length - 1) * ITEM_GAP + BOTTOM_PAD;
    return Math.min(h, SUBMENU_MAX_HEIGHT);
  };

  const getSubmenuTop = (key: string): number => {
    const idx = filterFields.findIndex(f => f.key === key);
    return idx * ROW_STEP;
  };

  const getSubmenuWidth = (key: string): number => {
    const opts = getSubmenuOptions(key);
    const longestName = opts.reduce((max, o) => {
      const textWidth = getTextWidth(o.name, 15, 500);
      return textWidth > max ? textWidth : max;
    }, 0);
    const calculated = SUBMENU_LEFT_PAD + longestName + SUBMENU_TEXT_TO_CHECKBOX_GAP + SUBMENU_CHECKBOX_WIDTH + SUBMENU_RIGHT_PAD + SUBMENU_WIDTH_EXTRA;
    return Math.min(Math.max(calculated, SUBMENU_MIN_WIDTH), SUBMENU_MAX_WIDTH);
  };

  const searchWidth = expanded === 'search' ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED; 
  const sortWidth = expanded === 'sort' ? BTN_SORT_EXPANDED : BTN_COLLAPSED; 
  const filterWidth = expanded === 'filter' ? BTN_FILTER_EXPANDED : BTN_COLLAPSED;
  const sortX = searchWidth + BTN_GAP; 
  const filterX = searchWidth + sortWidth + BTN_GAP * 2; 
  const createGroupX = searchWidth + sortWidth + (hasFilterFields ? filterWidth + BTN_GAP * 3 : BTN_GAP) + GROUP_GAP;
  const spring = { type: 'spring' as const, stiffness: 300, damping: 25 }; 
  const tween = { type: 'tween' as const, duration: 0.2 };
  const sortListHeight = TOP_PAD + sortFields.length * TEXT_HEIGHT + (sortFields.length - 1) * ITEM_GAP + BOTTOM_PAD;
  const filterListHeight = TOP_PAD + filterFields.length * TEXT_HEIGHT + (filterFields.length - 1) * ITEM_GAP + BOTTOM_PAD;
  const placementSubmenuHeight = TOP_PAD + placementLevels.length * TEXT_HEIGHT + (placementLevels.length - 1) * ITEM_GAP + BOTTOM_PAD;

  return (
    <div style={{ position: 'relative', height: 40 }}>
      <motion.div 
        style={{ position: 'absolute', left: 0, top: 0, height: 40, borderRadius: 10, backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF', border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }} 
        animate={{ width: searchWidth }} 
        transition={tween}
      >
        <div onClick={expanded === 'search' ? handleSearchClose : () => setExpanded('search')} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
          <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </div>
        {expanded === 'search' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
            <input ref={searchInputRef} type="text" value={searchValue} onChange={e => onSearchChange(e.target.value)} placeholder="Поиск" style={{ width: '100%', maxWidth: 211, height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
          </div>
        )}
      </motion.div>

      <motion.div 
        style={{ position: 'absolute', left: 0, top: 0, borderRadius: 10, backgroundColor: '#FFFFFF', border: expanded === 'sort' ? 'none' : (hasActiveSort ? 'none' : '1px solid rgba(102, 110, 254, 0.15)'), boxShadow: expanded === 'sort' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', overflow: 'hidden', zIndex: expanded === 'sort' ? 20 : 1 }} 
        animate={{ x: sortX, width: sortWidth, height: expanded === 'sort' ? BTN_HEADER + sortListHeight + BTN_CLEAR : BTN_COLLAPSED }} 
        transition={{ x: spring, width: tween, height: tween }}
      >
        <div onClick={() => toggleExpand('sort')} style={{ height: BTN_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: expanded === 'sort' || hasActiveSort ? '#666EFE' : 'transparent', borderRadius: expanded === 'sort' ? '10px 10px 0 0' : 10, userSelect: 'none' }}>
          {expanded === 'sort' ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Сортировка</span> : <img src={hasActiveSort ? SortingIcon20White : SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />}
        </div>
        
        <AnimatePresence>
          {expanded === 'sort' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} 
              exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }} 
              style={{ position: 'relative', height: sortListHeight, userSelect: 'none', overflow: 'hidden' }}
            >
              {sortColumn && <motion.div style={{ position: 'absolute', left: INDICATOR_LEFT, top: 0, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} animate={{ y: sortIndicatorY }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              
              <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                {sortFields.map((field) => { 
                  const isSelected = sortColumn === field.key; 
                  const sortIcon = getSortIcon(field); 
                  const label = getSortLabel(field); 
                  const iconWidth = field.iconType === '19' ? 19 : field.iconType === '20' ? 20 : 0; 
                  const textMaxWidth = sortIcon ? TEXT_WIDTH - iconWidth - ICON_RIGHT_PAD : TEXT_WIDTH; 
                  
                  return (
                    <div key={field.key} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSortFieldClick(field)} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: sortFields.indexOf(field) < sortFields.length - 1 ? ITEM_GAP : 0, paddingLeft: LEFT_OFFSET, position: 'relative', userSelect: 'none' }}>
                      <div style={{ width: TEXT_WIDTH, display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isSelected ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, transition: 'color 0.2s ease', maxWidth: textMaxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                        {sortIcon && <img src={sortIcon} alt="" style={{ width: iconWidth, height: field.iconType === '19' ? 12 : 10, position: 'absolute', right: ICON_RIGHT_PAD }} />}
                      </div>
                    </div>
                  ); 
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {expanded === 'sort' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} 
              exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }} 
              style={{ userSelect: 'none' }}
            >
              <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
              <button onMouseDown={(e) => e.preventDefault()} onClick={onClearSort} style={{ width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px', userSelect: 'none' }}>
                Очистить сортировку
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {hasFilterFields && (
        <motion.div 
          style={{ position: 'absolute', left: 0, top: 0, borderRadius: 10, backgroundColor: '#FFFFFF', border: expanded === 'filter' ? 'none' : (hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)'), boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', overflow: 'visible', zIndex: expanded === 'filter' ? 20 : 1 }} 
          animate={{ x: filterX, width: filterWidth, height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : BTN_COLLAPSED }} 
          transition={{ x: spring, width: tween, height: tween }}
        >
          <div onClick={() => toggleExpand('filter')} style={{ height: BTN_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent', borderRadius: expanded === 'filter' ? '10px 10px 0 0' : 10, userSelect: 'none' }}>
            {expanded === 'filter' ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span> : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="" style={{ width: 18, height: 18 }} />}
          </div>
          
          <AnimatePresence>
            {expanded === 'filter' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} 
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }} 
                style={{ position: 'relative', height: filterListHeight, userSelect: 'none', overflow: 'visible' }}
              >
                {Array.from(activeFilters).map(filterKey => { 
                  const idx = getFilterIndicatorIdx(filterKey); 
                  if (idx < 0) return null; 
                  return (
                    <motion.div key={filterKey} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', left: INDICATOR_LEFT, top: getIndicatorTarget(idx), width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />
                  ); 
                })}
                
                <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                  {filterFields.map((field) => { 
                    const isActive = field.key === 'sectionName' ? hasPlacementSelections : activeFilters.has(field.key); 
                    return (
                      <div key={field.key} onMouseDown={(e) => e.preventDefault()} onClick={() => handleFilterToggle(field.key)} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: filterFields.indexOf(field) < filterFields.length - 1 ? ITEM_GAP : 0, paddingLeft: LEFT_OFFSET, position: 'relative', userSelect: 'none' }}>
                        <div style={{ width: TEXT_WIDTH, display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, transition: 'color 0.2s ease', maxWidth: TEXT_WIDTH - 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {field.label}
                          </span>
                          <div style={{ position: 'absolute', right: ICON_RIGHT_PAD, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={isActive ? ArrowIcon6Blue : ArrowIcon6Black} alt="" style={{ width: 6, height: 10 }} />
                          </div>
                        </div>
                      </div>
                    ); 
                  })}
                </div>

                <AnimatePresence>
                  {submenuOpen && submenuOpen !== 'sectionName' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                      style={{ position: 'absolute', left: BTN_FILTER_EXPANDED + SUBMENU_OFFSET, top: getSubmenuTop(submenuOpen), width: getSubmenuWidth(submenuOpen), height: getSubmenuHeight(submenuOpen), backgroundColor: '#FFFFFF', borderRadius: '0 15px 15px 15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 25, overflow: 'hidden' }}>
                      <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: SUBMENU_MAX_HEIGHT }}>
                        {getSubmenuOptions(submenuOpen).map((option) => { 
                          const checked = isFilterOptionChecked(submenuOpen, option.uid); 
                          const textMaxWidth = getSubmenuWidth(submenuOpen) - SUBMENU_LEFT_PAD - SUBMENU_TEXT_TO_CHECKBOX_GAP - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD;
                          return (
                            <div key={option.uid} onMouseDown={(e) => e.preventDefault()} onClick={() => onCheckFilterOption(submenuOpen, option.uid)} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: getSubmenuOptions(submenuOpen).indexOf(option) < getSubmenuOptions(submenuOpen).length - 1 ? ITEM_GAP : 0, paddingLeft: SUBMENU_LEFT_PAD, position: 'relative', userSelect: 'none' }}>
                              {checked && <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />}
                              <span 
                                style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, maxWidth: textMaxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                onMouseEnter={(e) => handleMouseEnter(e, option.name)} 
                                onMouseLeave={handleMouseLeave}
                              >
                                {option.name}
                              </span>
                              <div style={{ position: 'absolute', right: SUBMENU_RIGHT_PAD, width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }}>
                                <img src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }} />
                              </div>
                            </div>
                          ); 
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {submenuOpen === 'sectionName' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} 
                      style={{ position: 'absolute', left: BTN_FILTER_EXPANDED + SUBMENU_OFFSET, top: getSubmenuTop('sectionName'), width: SUBMENU_WIDTH, height: placementSubmenuHeight, backgroundColor: '#FFFFFF', borderRadius: '0 15px 15px 15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 25, overflow: 'visible' }}>
                      <div style={{ position: 'relative', height: '100%' }}>
                        {placementLevels.map((level, i) => {
                          const hasSelection = placementSelections[level.key] && placementSelections[level.key]!.size > 0;
                          return (
                            <div key={level.key} onMouseDown={(e) => e.preventDefault()} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'absolute', top: TOP_PAD + i * ROW_STEP, left: LEFT_OFFSET, right: 20, userSelect: 'none' }}>
                              <div onClick={() => handlePlacementLevelClick(level.key)} style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                                {hasSelection && <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', left: -LEFT_OFFSET + INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />}
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: hasSelection ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, maxWidth: SUBMENU_WIDTH - LEFT_OFFSET - 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {level.label}
                                </span>
                              </div>
                              <div onClick={() => handlePlacementLevelClick(level.key)} style={{ position: 'absolute', right: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={hasSelection ? ArrowIcon6Blue : ArrowIcon6Black} alt="" style={{ width: 6, height: 10 }} />
                              </div>
                            </div>
                          );
                        })}
                        
                        <AnimatePresence>
                          {placementOpen && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                              style={{ position: 'absolute', left: SUBMENU_WIDTH + SUBMENU_OFFSET, top: placementLevels.findIndex(l => l.key === placementOpen) * ROW_STEP, width: SUBMENU_WIDTH, maxHeight: 260, backgroundColor: '#FFFFFF', borderRadius: '0 15px 15px 15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 30, overflow: 'hidden' }}>
                              <div style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: 260, scrollbarWidth: 'none', msOverflowStyle: 'none', paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                                {getPlacementOptions(placementOpen).length === 0 ? (
                                  <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>
                                      {placementLevels.find(l => l.key === placementOpen)?.emptyText || 'Нет данных'}
                                    </span>
                                  </div>
                                ) : getPlacementOptions(placementOpen).map((option, j) => {
                                  const checked = isPlacementChecked(placementOpen, option.uid);
                                  return (
                                    <div key={option.uid} onMouseDown={(e) => e.preventDefault()} onClick={() => handlePlacementCheck(placementOpen, option.uid)} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: j < getPlacementOptions(placementOpen).length - 1 ? ITEM_GAP : 0, paddingLeft: LEFT_OFFSET, position: 'relative', userSelect: 'none' }}>
                                      {checked && <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />}
                                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, maxWidth: SUBMENU_WIDTH - LEFT_OFFSET - 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {option.name}
                                      </span>
                                      <div style={{ position: 'absolute', right: 20, width: 20, height: 20 }}>
                                        <img src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: 20, height: 20 }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {expanded === 'filter' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} 
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }} 
                style={{ userSelect: 'none' }}
              >
                <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                <button onMouseDown={(e) => e.preventDefault()} onClick={handleClearFilters} style={{ width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px', userSelect: 'none' }}>
                  Очистить фильтр
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', gap: 15 }} animate={{ x: createGroupX }} transition={spring}>
        <button style={{ height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, width: 130 }} 
          onClick={onCreate}>
          <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14, marginLeft: 12 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать</span>
        </button>
        <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} 
          onClick={onDelete}>
          <img src={DeleteIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </button>
      </motion.div>
      
      <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 15 }}>
        <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={onPrint}>
          <img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </button>
        <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={onPrintPdf}>
          <img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} />
        </button>
        <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF', border: showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} 
          onClick={onHistory}>
          <img src={showHistory ? HistoryIcon18White : HistoryIcon18Black} alt="" style={{ width: 18, height: 16 }} />
        </button>
        <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} 
          onClick={onConfiguration}>
          <img src={ConfigurationIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {tooltip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)', backgroundColor: '#2D4059', color: '#FFFFFF', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default TableToolbar;