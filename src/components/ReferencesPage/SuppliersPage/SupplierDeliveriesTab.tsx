// SupplierDeliveriesTab.tsx — ПОЛНЫЙ ФАЙЛ (кнопки space-between)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../../elements/DataTable';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
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
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import type { CommonSupplierProps } from './SupplierCreatePage';

interface DeliveryItem {
  uid: string;
  materialUid: string;
  materialName: string;
  supplierUid: string;
  supplierName: string;
  supplyDate: string;
  documentName: string;
  filePath: string;
  originalName: string;
  fileUrl: string;
}

interface SortField {
  key: string;
  label: string;
  iconType: '19' | '20' | null;
}

const DELIVERY_COLUMNS = [
  { key: 'materialName', label: 'Наименование номенклатуры' },
  { key: 'supplyDate', label: 'Дата поставки' },
  { key: 'documentName', label: 'Документ поставки' },
];

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

const SupplierDeliveriesTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid, isEdit } = props;

  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; name: string } | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);
  const [newMaterialUid, setNewMaterialUid] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newSupplyDate, setNewSupplyDate] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState<'search' | 'sort' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const SORT_FIELDS: SortField[] = [
    { key: 'materialName', label: 'Наименование', iconType: '20' },
    { key: 'supplyDate', label: 'Дата поставки', iconType: '19' },
    { key: 'documentName', label: 'Документ', iconType: '20' },
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

  const fetchDeliveries = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiSupplierDeliveries(uid));
      setDeliveries((res.data || []).map((d: any) => ({
        ...d,
        materialName: d.materialName || '—',
        fileUrl: d.fileUrl ? ConstantInfo.fileDir + d.fileUrl.replace(/^\//, '') : null,
      })));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchDeliveries(); }, [uid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);
  useEffect(() => { if (expanded === 'sort') { const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  const filteredDeliveries = React.useMemo(() => {
    let result = [...deliveries];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(d => {
        return [d.materialName, formatDate(d.supplyDate), d.documentName].some(v => v && String(v).toLowerCase().includes(q));
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
  }, [deliveries, searchValue, sortColumn, sortDirection]);

  const getFullUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return ConstantInfo.fileDir + url.replace(/^\//, '');
  };

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = filteredDeliveries.length > 0 && filteredDeliveries.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredDeliveries.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  
  const handleContextMenu = (e: React.MouseEvent, uid: string) => {
    e.preventDefault();
    e.stopPropagation();
    const delivery = deliveries.find(d => d.uid === uid);
    setContextMenu({ x: e.clientX, y: e.clientY, uid, name: delivery?.materialName || '' });
  };
  
  const handleDoubleClick = (uid: string) => {
    const delivery = deliveries.find(x => x.uid === uid);
    if (!delivery) return;
    if (delivery.fileUrl) {
      const fullUrl = getFullUrl(delivery.fileUrl);
      window.open(fullUrl, '_blank');
    }
  };

  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      for (const deliveryUid of selectedIds) {
        await AxiosService.delete(ConstantInfo.restApiSupplierDeleteDelivery(deliveryUid));
      }
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      await fetchDeliveries();
      window.dispatchEvent(new CustomEvent('refreshSupplierDeliveries'));
    } catch (e) { console.error(e); }
  };

  const handleAddClick = () => {
    setNewMaterialUid('');
    setNewMaterialName('');
    setNewSupplyDate(new Date().toISOString().slice(0, 16));
    setNewDocumentName('');
    setSelectedFile(null);
    setShowAddPopup(true);
  };

  const handleAddSubmit = async () => {
    if (!uid || !newMaterialUid) return;
    setIsAdding(true);
    try {
      const fd = new FormData();
      fd.append('materialUid', newMaterialUid);
      if (newSupplyDate) fd.append('supplyDate', newSupplyDate + ':00');
      if (newDocumentName.trim()) fd.append('documentName', newDocumentName.trim());
      if (selectedFile) fd.append('file', selectedFile);
      await AxiosService.post(ConstantInfo.restApiSupplierDeliveries(uid), fd);
      await fetchDeliveries();
      setShowAddPopup(false);
      window.dispatchEvent(new CustomEvent('refreshSupplierDeliveries'));
    } catch (e) { console.error(e); } finally { setIsAdding(false); }
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
    if (key === 'supplyDate') return formatDate(v);
    if (key === 'documentName') return v || item.originalName || '—';
    return String(v);
  };
  const isGrayColumn = (key: string): boolean => key !== 'materialName';
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };
  const popupFieldStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxSizing: 'border-box' };

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
          columns={DELIVERY_COLUMNS}
          visibleKeys={['materialName', 'supplyDate', 'documentName']}
          data={filteredDeliveries}
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
          noWrapColumns={['materialName', 'supplyDate', 'documentName']}
          highlightText={searchValue.trim() || undefined}
          fitToWidth
        />
      </div>
      
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setSelectedIds(new Set([contextMenu.uid])); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
            <img src={ContextMenuDeleteIcon16} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
            Удалить
          </button>
        </div>
      )}

      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление поставки</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Номенклатура</label><div onClick={() => setShowMaterialPopup(true)} style={{ ...popupFieldStyle, color: newMaterialName ? '#666EFE' : '#9CA3AF' }}><span>{newMaterialName || 'Выберите номенклатуру'}</span></div></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата поставки</label><input type="datetime-local" value={newSupplyDate} onChange={e => setNewSupplyDate(e.target.value)} style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название документа</label><input type="text" value={newDocumentName} onChange={e => setNewDocumentName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setShowAddPopup(false); }} placeholder="Введите название документа" style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Файл документа</label><div onClick={() => fileInputRef.current?.click()} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedFile ? '#666EFE' : '#9CA3AF' }}>{selectedFile ? selectedFile.name : 'Выберите файл'}</span></div><input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={!newMaterialUid || isAdding} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newMaterialUid && !isAdding ? '#666EFE' : '#BCC8FF', cursor: newMaterialUid && !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные поставки?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup isOpen={showMaterialPopup} onClose={() => setShowMaterialPopup(false)} onSelect={(id, name) => { setNewMaterialUid(id); setNewMaterialName(name); setShowMaterialPopup(false); }} popupType="analogSelect" />
    </div>
  );
};

export default SupplierDeliveriesTab;