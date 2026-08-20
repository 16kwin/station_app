// StationModelFilesTab.tsx — ПОЛНЫЙ ФАЙЛ (расстояние 15px между всеми кнопками)
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
import FilesIcon14Black from '../../../assets/Icons/FilesIcons/FilesIcon14Black.svg';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';

interface DocumentItem {
  uid: string;
  documentName: string;
  originalName: string;
  url: string;
  createdAt: string;
}

export interface LocalDocumentItem {
  localId: string;
  documentName: string;
  file: File;
  serverUid?: string;
  isNew?: boolean;
}

export interface DocumentChange {
  serverUid?: string;
  action: 'add' | 'rename' | 'delete';
  documentName?: string;
  file?: File;
}

interface StationModelFilesTabProps {
  modelUid: string;
  isEdit: boolean;
  localDocuments?: LocalDocumentItem[];
  setLocalDocuments?: React.Dispatch<React.SetStateAction<LocalDocumentItem[]>>;
  documentChanges?: DocumentChange[];
  setDocumentChanges?: React.Dispatch<React.SetStateAction<DocumentChange[]>>;
}

const FILE_COLUMNS = [
  { key: 'documentName', label: 'Наименование' },
  { key: 'originalName', label: 'Файл' },
  { key: 'createdAt', label: 'Дата' },
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

const StationModelFilesTab: React.FC<StationModelFilesTabProps> = ({ 
  modelUid, 
  isEdit, 
  localDocuments = [], 
  setLocalDocuments,
  documentChanges = [],
  setDocumentChanges,
}) => {
  const [serverDocuments, setServerDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileLocalRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; name: string; isLocal: boolean } | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editDocUid, setEditDocUid] = useState('');
  const [editDocName, setEditDocName] = useState('');
  const [editIsLocal, setEditIsLocal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formDocName, setFormDocName] = useState('');

  const [expanded, setExpanded] = useState<'search' | 'sort' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const SORT_FIELDS = [
    { key: 'documentName', label: 'Наименование', iconType: '20' as const },
    { key: 'createdAt', label: 'Дата', iconType: '19' as const },
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

  useEffect(() => { if (modelUid && isEdit) fetchDocuments(); }, [modelUid, isEdit]);
  useEffect(() => {
    if (isEdit && modelUid && documentChanges.length === 0 && localDocuments.length === 0) {
      fetchDocuments();
    }
  }, [documentChanges.length, localDocuments.length, isEdit, modelUid]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);
  useEffect(() => { if (expanded === 'sort') { const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiStationModelDocuments(modelUid));
      const serverDocs = res.data || [];
      const deletedServerUids = documentChanges.filter(c => c.action === 'delete' && c.serverUid).map(c => c.serverUid);
      setServerDocuments(serverDocs.filter((d: any) => !deletedServerUids.includes(d.uid)));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const allDocuments: DocumentItem[] = [
    ...serverDocuments.map(d => {
      const renameChange = documentChanges.find(c => c.action === 'rename' && c.serverUid === d.uid);
      return renameChange ? { ...d, documentName: renameChange.documentName || d.documentName } : d;
    }),
    ...localDocuments.map(d => ({
      uid: d.localId,
      documentName: d.documentName,
      originalName: d.file.name,
      url: '',
      createdAt: new Date().toISOString(),
    })),
  ];

  const filteredDocuments = React.useMemo(() => {
    let result = [...allDocuments];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(doc => {
        return [doc.documentName, doc.originalName].some(v => v && String(v).toLowerCase().includes(q));
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
  }, [allDocuments, searchValue, sortColumn, sortDirection]);

  const getFullUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return ConstantInfo.fileDir + url.replace(/^\//, '');
  };

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = filteredDocuments.length > 0 && filteredDocuments.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredDocuments.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  
  const handleContextMenu = (e: React.MouseEvent, uid: string) => {
    e.preventDefault();
    e.stopPropagation();
    const doc = allDocuments.find(d => d.uid === uid);
    const isLocal = localDocuments.some(d => d.localId === uid);
    setContextMenu({ x: e.clientX, y: e.clientY, uid, name: doc?.documentName || '', isLocal });
  };
  
  const handleDoubleClick = (uid: string) => {
    const doc = allDocuments.find(x => x.uid === uid);
    if (!doc) return;
    
    if (doc.url) {
      const fullUrl = getFullUrl(doc.url);
      window.open(fullUrl, '_blank');
      return;
    }
    
    const localDoc = localDocuments.find(d => d.localId === uid);
    if (localDoc) {
      const blobUrl = URL.createObjectURL(localDoc.file);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }
  };

  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; setShowDeleteConfirm(true); };

  const confirmDelete = () => {
    for (const uid of selectedIds) {
      const isLocal = localDocuments.some(d => d.localId === uid);
      if (isLocal) {
        setLocalDocuments?.(prev => prev.filter(d => d.localId !== uid));
      } else {
        setDocumentChanges?.(prev => [...prev, { serverUid: uid, action: 'delete' as const }]);
        setServerDocuments(prev => prev.filter(d => d.uid !== uid));
      }
    }
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleAddClick = () => {
    setSelectedFile(null);
    setFormDocName('');
    setShowAddPopup(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormDocName(file.name);
    }
    if (fileLocalRef.current) fileLocalRef.current.value = '';
  };

  const handleAddSubmit = () => {
    if (!selectedFile || !formDocName.trim()) return;
    
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setLocalDocuments?.(prev => [...prev, { localId, documentName: formDocName.trim(), file: selectedFile, isNew: true }]);
    setShowAddPopup(false);
    setSelectedFile(null);
    setFormDocName('');
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    setEditDocUid(contextMenu.uid);
    setEditDocName(contextMenu.name);
    setEditIsLocal(contextMenu.isLocal);
    setContextMenu(null);
    setShowEditPopup(true);
  };

  const handleEditSubmit = () => {
    if (!editDocName.trim()) return;
    
    if (editIsLocal) {
      setLocalDocuments?.(prev => prev.map(d => d.localId === editDocUid ? { ...d, documentName: editDocName.trim() } : d));
    } else {
      setDocumentChanges?.(prev => {
        const existing = prev.find(c => c.action === 'rename' && c.serverUid === editDocUid);
        if (existing) {
          return prev.map(c => c.serverUid === editDocUid ? { ...c, documentName: editDocName.trim() } : c);
        }
        return [...prev, { serverUid: editDocUid, action: 'rename' as const, documentName: editDocName.trim() }];
      });
      setServerDocuments(prev => prev.map(d => d.uid === editDocUid ? { ...d, documentName: editDocName.trim() } : d));
    }
    setShowEditPopup(false);
  };

  const handleSortFieldClick = (field: { key: string; label: string; iconType?: '19' | '20' | null }) => {
    if (sortColumn === field.key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field.key);
      setSortDirection('asc');
    }
    const idx = SORT_FIELDS.findIndex(f => f.key === field.key);
    if (idx >= 0) animateSortIndicator(getIndicatorTarget(idx));
  };

  const getSortIcon = (field: { key: string; iconType?: '19' | '20' | null }): string | null => {
    if (!field.iconType || sortColumn !== field.key) return null;
    if (field.iconType === '19') return sortDirection === 'asc' ? SortingIcon19BlueUp : SortingIcon19BlueDown;
    if (field.iconType === '20') return sortDirection === 'asc' ? SortingIcon20BlueUp : SortingIcon20BlueDown;
    return null;
  };

  const formatDate = (d: string) => { if (!d) return ''; try { return new Date(d).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
  const renderCell = (key: string, item: any): string => { const v = item[key]; if (v === null || v === undefined) return '-'; if (key === 'createdAt') return formatDate(v); return String(v); };
  const isGrayColumn = (key: string): boolean => key !== 'documentName';
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };

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
          columns={FILE_COLUMNS}
          visibleKeys={['documentName', 'originalName', 'createdAt']}
          data={filteredDocuments}
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
          rowIcon={FilesIcon14Black}
          rowIconSize={20}
          noWrapColumns={['documentName', 'originalName', 'createdAt']}
          highlightText={searchValue.trim() || undefined}
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
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление документа</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Файл</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button onClick={() => fileLocalRef.current?.click()} style={{ height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', whiteSpace: 'nowrap' }}>
                  Выбрать файл
                </button>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile ? selectedFile.name : 'Файл не выбран'}
                </span>
              </div>
              <input ref={fileLocalRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название документа</label>
              <input type="text" value={formDocName} onChange={e => setFormDocName(e.target.value)} placeholder="Введите название" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={!selectedFile || !formDocName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: selectedFile && formDocName.trim() ? '#666EFE' : '#BCC8FF', cursor: selectedFile && formDocName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование документа</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название документа</label>
              <input type="text" value={editDocName} onChange={e => setEditDocName(e.target.value)} placeholder="Введите название" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={!editDocName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: editDocName.trim() ? '#666EFE' : '#BCC8FF', cursor: editDocName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные файлы?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationModelFilesTab;