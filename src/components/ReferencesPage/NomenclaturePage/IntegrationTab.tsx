// IntegrationTab.tsx — ПОЛНЫЙ ФАЙЛ (DataTable, поиск, сортировка, space-between, fitToWidth)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../../elements/DataTable';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import SortingIcon20White from '../../../assets/Icons/SortingIcons/SortingIcon20White.svg';
import SortingIcon19BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon19BlueDown.svg';
import SortingIcon19BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon19BlueUp.svg';
import SortingIcon20BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon20BlueDown.svg';
import SortingIcon20BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon20BlueUp.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon18Black from '../../../assets/Icons/DeleteIcons/DeleteIcon18Black.svg';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import type { CommonProps } from './NomenclatureCreatePage';

interface IntegrationItem {
  uid: string;
  materialUid: string;
  event: string;
  exchangeType: string;
  direction: string;
  protocol: string;
  targetSystem: string;
  createdAt: string;
}

interface SortField {
  key: string;
  label: string;
  iconType: '19' | '20' | null;
}

const INTEGRATION_COLUMNS = [
  { key: 'createdAt', label: 'Дата и время' },
  { key: 'event', label: 'Событие' },
  { key: 'exchangeType', label: 'Тип обмена' },
  { key: 'direction', label: 'Направление' },
  { key: 'protocol', label: 'Протокол' },
  { key: 'targetSystem', label: 'Обмен с системой' },
];

const EXCHANGE_TYPES = ['Внутренний', 'Внешний'];
const DIRECTIONS = ['Исходящий', 'Входящий'];
const PROTOCOLS = ['WebSocket', 'REST'];
const TARGET_SYSTEMS = ['1С:Предприятие', 'SAP', 'Oracle EBS'];

const BTN_COLLAPSED = 40;
const BTN_SEARCH_EXPANDED = 280;
const BTN_SORT_EXPANDED = 230;
const BTN_GAP = 15;
const BTN_HEADER = 40;
const BTN_CLEAR = 44;
const TEXT_HEIGHT = 18;
const ITEM_GAP = 20;
const TOP_PAD = 20;
const BOTTOM_PAD = 20;
const LEFT_OFFSET = 30;
const TEXT_WIDTH = 180;
const INDICATOR_LEFT = 15;
const INDICATOR_WIDTH = 2;
const INDICATOR_HEIGHT = 22;
const ICON_RIGHT_PAD = 4;

const IntegrationTab: React.FC<CommonProps> = (props) => {
  const { uid, isEdit } = props;

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; exchangeType: string; direction: string; protocol: string; targetSystem: string } | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newExchangeType, setNewExchangeType] = useState(EXCHANGE_TYPES[0]);
  const [newDirection, setNewDirection] = useState(DIRECTIONS[0]);
  const [newProtocol, setNewProtocol] = useState(PROTOCOLS[0]);
  const [newTargetSystem, setNewTargetSystem] = useState(TARGET_SYSTEMS[0]);
  const [isAdding, setIsAdding] = useState(false);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editIntegrationUid, setEditIntegrationUid] = useState('');
  const [editExchangeType, setEditExchangeType] = useState(EXCHANGE_TYPES[0]);
  const [editDirection, setEditDirection] = useState(DIRECTIONS[0]);
  const [editProtocol, setEditProtocol] = useState(PROTOCOLS[0]);
  const [editTargetSystem, setEditTargetSystem] = useState(TARGET_SYSTEMS[0]);
  const [isEditing, setIsEditing] = useState(false);

  const [expanded, setExpanded] = useState<'search' | 'sort' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const SORT_FIELDS: SortField[] = [
    { key: 'createdAt', label: 'Дата и время', iconType: '19' },
    { key: 'event', label: 'Событие', iconType: '20' },
    { key: 'exchangeType', label: 'Тип обмена', iconType: '20' },
    { key: 'direction', label: 'Направление', iconType: '20' },
    { key: 'protocol', label: 'Протокол', iconType: '20' },
    { key: 'targetSystem', label: 'Обмен с системой', iconType: '20' },
  ];

  const hasActiveSort = sortColumn !== null;

  const getIndicatorTarget = (idx: number): number => TOP_PAD + idx * (TEXT_HEIGHT + ITEM_GAP) + (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2;

  const animateSortIndicator = (to: number) => { 
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
  };

  const fetchIntegrations = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureIntegrations(uid));
      setIntegrations(res.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchIntegrations(); }, [uid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);
  useEffect(() => { if (expanded === 'sort') { const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { 
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    }
    catch { return dateStr; }
  };

  const filteredIntegrations = React.useMemo(() => {
    let result = [...integrations];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(item => {
        return [formatDate(item.createdAt), item.event, item.exchangeType, item.direction, item.protocol, item.targetSystem].some(v => v && String(v).toLowerCase().includes(q));
      });
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = String((a as any)[sortColumn] || '');
        const bVal = String((b as any)[sortColumn] || '');
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [integrations, searchValue, sortColumn, sortDirection]);

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = filteredIntegrations.length > 0 && filteredIntegrations.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredIntegrations.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  
  const handleContextMenu = (e: React.MouseEvent, uid: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = integrations.find(d => d.uid === uid);
    if (item) {
      setContextMenu({ x: e.clientX, y: e.clientY, uid, exchangeType: item.exchangeType, direction: item.direction, protocol: item.protocol, targetSystem: item.targetSystem });
    }
  };
  
  const handleDoubleClick = (uid: string) => {
    const item = integrations.find(x => x.uid === uid);
    if (!item) return;
    setEditIntegrationUid(item.uid);
    setEditExchangeType(item.exchangeType || EXCHANGE_TYPES[0]);
    setEditDirection(item.direction || DIRECTIONS[0]);
    setEditProtocol(item.protocol || PROTOCOLS[0]);
    setEditTargetSystem(item.targetSystem || TARGET_SYSTEMS[0]);
    setShowEditPopup(true);
  };

  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      for (const itemUid of selectedIds) {
        await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteIntegration(itemUid));
      }
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      await fetchIntegrations();
    } catch (e) { console.error(e); }
  };

  const handleAddClick = () => { setNewExchangeType(EXCHANGE_TYPES[0]); setNewDirection(DIRECTIONS[0]); setNewProtocol(PROTOCOLS[0]); setNewTargetSystem(TARGET_SYSTEMS[0]); setShowAddPopup(true); };

  const handleAddSubmit = async () => {
    if (!uid) return;
    setIsAdding(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureIntegrations(uid), { exchangeType: newExchangeType, direction: newDirection, protocol: newProtocol, targetSystem: newTargetSystem });
      await fetchIntegrations();
      setShowAddPopup(false);
    } catch (e) { console.error(e); } finally { setIsAdding(false); }
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    const item = integrations.find(i => i.uid === contextMenu.uid);
    if (item) {
      setEditIntegrationUid(item.uid);
      setEditExchangeType(item.exchangeType || EXCHANGE_TYPES[0]);
      setEditDirection(item.direction || DIRECTIONS[0]);
      setEditProtocol(item.protocol || PROTOCOLS[0]);
      setEditTargetSystem(item.targetSystem || TARGET_SYSTEMS[0]);
      setContextMenu(null);
      setShowEditPopup(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!uid || !editIntegrationUid) return;
    setIsEditing(true);
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteIntegration(editIntegrationUid));
      await AxiosService.post(ConstantInfo.restApiNomenclatureIntegrations(uid), { exchangeType: editExchangeType, direction: editDirection, protocol: editProtocol, targetSystem: editTargetSystem });
      await fetchIntegrations();
      setShowEditPopup(false);
    } catch (e) { console.error(e); } finally { setIsEditing(false); }
  };

  const handleSortFieldClick = (field: SortField) => {
    if (sortColumn === field.key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field.key);
      setSortDirection('asc');
    }
    const idx = SORT_FIELDS.findIndex(f => f.key === field.key);
    if (idx >= 0) animateSortIndicator(getIndicatorTarget(idx));
  };

  const getSortIcon = (field: SortField): string | null => {
    if (!field.iconType || sortColumn !== field.key) return null;
    if (field.iconType === '19') return sortDirection === 'asc' ? SortingIcon19BlueUp : SortingIcon19BlueDown;
    if (field.iconType === '20') return sortDirection === 'asc' ? SortingIcon20BlueUp : SortingIcon20BlueDown;
    return null;
  };

  const renderCell = (key: string, item: any): string => {
    const v = item[key];
    if (v === null || v === undefined) return '-';
    if (key === 'createdAt') return formatDate(v);
    return String(v);
  };
  const isGrayColumn = (key: string): boolean => key !== 'event';
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const selectStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };

  const sortListHeight = TOP_PAD + SORT_FIELDS.length * TEXT_HEIGHT + (SORT_FIELDS.length - 1) * ITEM_GAP + BOTTOM_PAD;
  const searchWidth = expanded === 'search' ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const sortWidth = expanded === 'sort' ? BTN_SORT_EXPANDED : BTN_COLLAPSED;
  const sortX = searchWidth + BTN_GAP;
  const createGroupX = searchWidth + sortWidth + BTN_GAP * 2;
  const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };
  const tween = { type: 'tween' as const, duration: 0.2 };

  return (
    <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96 }}>
      <div style={{ position: 'absolute', top: 0, left: 15, display: 'flex', gap: 15, zIndex: 10 }}>
        <motion.div 
          style={{ position: 'absolute', left: 0, top: 0, height: 40, borderRadius: 10, backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF', border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }} 
          animate={{ width: searchWidth }} 
          transition={tween}
        >
          <div onClick={expanded === 'search' ? () => { setExpanded(null); setSearchValue(''); } : () => setExpanded('search')} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </div>
          {expanded === 'search' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
              <input ref={searchInputRef} type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', maxWidth: 211, height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
            </div>
          )}
        </motion.div>

        <motion.div 
          style={{ position: 'absolute', left: 0, top: 0, borderRadius: 10, backgroundColor: '#FFFFFF', border: expanded === 'sort' ? 'none' : (hasActiveSort ? 'none' : '1px solid rgba(102, 110, 254, 0.15)'), boxShadow: expanded === 'sort' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', overflow: 'hidden', zIndex: expanded === 'sort' ? 20 : 1 }} 
          animate={{ x: sortX, width: sortWidth, height: expanded === 'sort' ? BTN_HEADER + sortListHeight + BTN_CLEAR : BTN_COLLAPSED }} 
          transition={{ x: spring, width: tween, height: tween }}
        >
          <div onClick={() => setExpanded(prev => prev === 'sort' ? null : 'sort')} style={{ height: BTN_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: expanded === 'sort' || hasActiveSort ? '#666EFE' : 'transparent', borderRadius: expanded === 'sort' ? '10px 10px 0 0' : 10, userSelect: 'none' }}>
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
                  {SORT_FIELDS.map((field) => { 
                    const isSelected = sortColumn === field.key; 
                    const sortIcon = getSortIcon(field); 
                    const iconWidth = field.iconType === '19' ? 19 : field.iconType === '20' ? 20 : 0; 
                    const textMaxWidth = sortIcon ? TEXT_WIDTH - iconWidth - ICON_RIGHT_PAD : TEXT_WIDTH; 
                    
                    return (
                      <div key={field.key} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSortFieldClick(field)} style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: SORT_FIELDS.indexOf(field) < SORT_FIELDS.length - 1 ? ITEM_GAP : 0, paddingLeft: LEFT_OFFSET, position: 'relative', userSelect: 'none' }}>
                        <div style={{ width: TEXT_WIDTH, display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isSelected ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, transition: 'color 0.2s ease', maxWidth: textMaxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {field.label}
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
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setSortColumn(null); setSortDirection('asc'); }} style={{ width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px', userSelect: 'none' }}>
                  Очистить сортировку
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', gap: 15 }} animate={{ x: createGroupX }} transition={spring}>
          <button style={smallButtonStyle} onClick={handleAddClick}><img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} /></button>
          <button style={{ ...smallButtonStyle, opacity: selectedIds.size > 0 ? 1 : 0.5 }} onClick={handleDeleteSelected}><img src={DeleteIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
        </motion.div>
      </div>
      <div style={{ position: 'absolute', top: 52, left: 0 }}>
        <DataTable
          columns={INTEGRATION_COLUMNS}
          visibleKeys={['createdAt', 'event', 'exchangeType', 'direction', 'protocol', 'targetSystem']}
          data={filteredIntegrations}
          selectedIds={selectedIds}
          onCheckboxClick={handleCheckboxClick}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
          renderCell={renderCell}
          isGrayColumn={isGrayColumn}
          tableWidth={1740}
          visibleRows={8}
          rowHeight={58}
          headerHeight={58}
          firstColLeft={60}
          noWrapColumns={['createdAt', 'event', 'exchangeType', 'direction', 'protocol', 'targetSystem']}
          highlightText={searchValue.trim() || undefined}
          fitToWidth
        />
      </div>
      
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={handleEditClick} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
            <img src={ContextMenuOpenIcon16} alt="" style={{ width: 16, height: 16, marginRight: 17 }} />
            Редактировать
          </button>
          <button onClick={() => { setSelectedIds(new Set([contextMenu.uid])); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
            <img src={ContextMenuDeleteIcon16} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
            Удалить
          </button>
        </div>
      )}

      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление интеграции</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип обмена</label><select value={newExchangeType} onChange={e => setNewExchangeType(e.target.value)} style={selectStyle}>{EXCHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Направление</label><select value={newDirection} onChange={e => setNewDirection(e.target.value)} style={selectStyle}>{DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Протокол</label><select value={newProtocol} onChange={e => setNewProtocol(e.target.value)} style={selectStyle}>{PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Обмен с системой</label><select value={newTargetSystem} onChange={e => setNewTargetSystem(e.target.value)} style={selectStyle}>{TARGET_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={isAdding} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: !isAdding ? '#666EFE' : '#BCC8FF', cursor: !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование интеграции</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип обмена</label><select value={editExchangeType} onChange={e => setEditExchangeType(e.target.value)} style={selectStyle}>{EXCHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Направление</label><select value={editDirection} onChange={e => setEditDirection(e.target.value)} style={selectStyle}>{DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Протокол</label><select value={editProtocol} onChange={e => setEditProtocol(e.target.value)} style={selectStyle}>{PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Обмен с системой</label><select value={editTargetSystem} onChange={e => setEditTargetSystem(e.target.value)} style={selectStyle}>{TARGET_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={isEditing} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: !isEditing ? '#666EFE' : '#BCC8FF', cursor: !isEditing ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isEditing ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные интеграции?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationTab;