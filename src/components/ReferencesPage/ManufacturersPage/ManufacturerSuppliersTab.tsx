// ManufacturerSuppliersTab.tsx — ПОЛНЫЙ ФАЙЛ (fitToWidth)
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
import type { CommonManufacturerProps } from './ManufacturerCreatePage';

interface SupplierItem {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SortField {
  key: string;
  label: string;
  iconType: '19' | '20' | null;
}

const SUPPLIER_COLUMNS = [
  { key: 'name', label: 'Наименование' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Телефон' },
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

const ManufacturerSuppliersTab: React.FC<CommonManufacturerProps> = (props) => {
  const { uid, isEdit } = props;

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [expanded, setExpanded] = useState<'search' | 'sort' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const SORT_FIELDS: SortField[] = [
    { key: 'name', label: 'Наименование', iconType: '20' },
    { key: 'email', label: 'Email', iconType: '20' },
    { key: 'phone', label: 'Телефон', iconType: '20' },
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

  const fetchSuppliers = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const brandsRes = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/brands-crud?userId=1`);
      const brands = brandsRes.data?.data || brandsRes.data || [];
      const manufacturerBrands = brands.filter((b: any) => b.manufacturerUid === uid);
      const brandUids = manufacturerBrands.map((b: any) => b.uid);
      
      const supplierBrandsRes = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-brands?userId=1`);
      const supplierBrands = supplierBrandsRes.data?.data || supplierBrandsRes.data || [];
      
      const suppliersRes = await AxiosService.get(ConstantInfo.restApiSuppliersList);
      const allSuppliers = Array.isArray(suppliersRes.data) ? suppliersRes.data : (suppliersRes.data?.data || []);
      
      const supplierUids = new Set<string>();
      supplierBrands.forEach((sb: any) => {
        if (brandUids.includes(sb.brandUid) && sb.supplierUid) {
          supplierUids.add(sb.supplierUid);
        }
      });
      
      setSuppliers(allSuppliers.filter((s: any) => supplierUids.has(s.uid)));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchSuppliers(); }, [uid, isEdit]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);
  useEffect(() => { if (expanded === 'sort') { const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);

  const filteredSuppliers = React.useMemo(() => {
    let result = [...suppliers];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(s => {
        return [s.name, s.email, s.phone].some(v => v && String(v).toLowerCase().includes(q));
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
  }, [suppliers, searchValue, sortColumn, sortDirection]);

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = filteredSuppliers.length > 0 && filteredSuppliers.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredSuppliers.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleDoubleClick = (uid: string) => {};

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

  const renderCell = (key: string, item: any): string => { const v = item[key]; if (v === null || v === undefined) return '-'; return String(v); };
  const isGrayColumn = (key: string): boolean => key !== 'name';

  const sortListHeight = TOP_PAD + SORT_FIELDS.length * TEXT_HEIGHT + (SORT_FIELDS.length - 1) * ITEM_GAP + BOTTOM_PAD;
  const searchWidth = expanded === 'search' ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const sortWidth = expanded === 'sort' ? BTN_SORT_EXPANDED : BTN_COLLAPSED;
  const sortX = searchWidth + BTN_GAP;
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
      </div>
      <div style={{ position: 'absolute', top: 52, left: 0 }}>
        <DataTable
          columns={SUPPLIER_COLUMNS}
          visibleKeys={['name', 'email', 'phone']}
          data={filteredSuppliers}
          selectedIds={selectedIds}
          onCheckboxClick={handleCheckboxClick}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          onDoubleClick={handleDoubleClick}
          renderCell={renderCell}
          isGrayColumn={isGrayColumn}
          tableWidth={1740}
          visibleRows={8}
          rowHeight={58}
          headerHeight={58}
          firstColLeft={60}
          noWrapColumns={['name', 'email', 'phone']}
          highlightText={searchValue.trim() || undefined}
          fitToWidth
        />
      </div>
    </div>
  );
};

export default ManufacturerSuppliersTab;