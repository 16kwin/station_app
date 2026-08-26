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

interface RatingItem {
  uid: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

interface SortField {
  key: string;
  label: string;
  iconType: '19' | '20' | null;
}

const RATING_COLUMNS = [
  { key: 'createdAt', label: 'Дата и время' },
  { key: 'comment', label: 'Наименование' },
  { key: 'rating', label: 'Рейтинг' },
  { key: 'author', label: 'Автор' },
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

const RatingTab: React.FC<CommonProps> = (props) => {
  const { uid, isEdit } = props;

  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; rating: number; comment: string; author: string } | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editRatingUid, setEditRatingUid] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewComment, setViewComment] = useState('');
  const [viewAuthor, setViewAuthor] = useState('');

  const [expanded, setExpanded] = useState<'search' | 'sort' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const SORT_FIELDS: SortField[] = [
    { key: 'createdAt', label: 'Дата и время', iconType: '19' },
    { key: 'rating', label: 'Рейтинг', iconType: '20' },
    { key: 'author', label: 'Автор', iconType: '20' },
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

  const StarRatingSmall = ({ value, size = 18 }: { value: number; size?: number }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fillPercent = Math.min(100, Math.max(0, (value - i + 1) * 100));
      stars.push(
        <div key={i} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
          <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
            <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#DBDBDB" stroke="#DBDBDB" strokeWidth="1"/>
          </svg>
          {fillPercent > 0 && (
            <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}>
              <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/>
            </svg>
          )}
        </div>
      );
    }
    return <div style={{ display: 'flex', gap: 8 }}>{stars}</div>;
  };

  const fetchRatings = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const [ratingsRes, avgRes] = await Promise.all([
        AxiosService.get(ConstantInfo.restApiNomenclatureRatings(uid)),
        AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)),
      ]);
      setRatings(ratingsRes.data || []);
      setAverageRating(Math.round((avgRes.data || 0) * 10) / 10);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchRatings(); }, [uid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);
  useEffect(() => { if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [expanded]);
  useEffect(() => { if (expanded === 'sort') { const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn); if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx)); } }, [expanded]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  const getRatingStatus = (avg: number): string => {
    if (avg === 0) return 'Новый товар или рейтинг отсутствует';
    if (avg <= 2) return 'Товар низкого качества';
    if (avg <= 4) return 'Товар среднего качества';
    return 'Товар высокого качества';
  };

  const filteredRatings = React.useMemo(() => {
    let result = [...ratings];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(r => {
        return [formatDate(r.createdAt), r.comment, String(r.rating), r.author].some(v => v && String(v).toLowerCase().includes(q));
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
  }, [ratings, searchValue, sortColumn, sortDirection]);

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = filteredRatings.length > 0 && filteredRatings.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredRatings.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  
  const handleContextMenu = (e: React.MouseEvent, uid: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rating = ratings.find(d => d.uid === uid);
    if (rating) {
      setContextMenu({ x: e.clientX, y: e.clientY, uid, rating: rating.rating, comment: rating.comment, author: rating.author });
    }
  };
  
  const handleDoubleClick = (uid: string) => {
    const rating = ratings.find(x => x.uid === uid);
    if (!rating) return;
    setViewComment(rating.comment || '');
    setViewAuthor(rating.author || '');
    setShowViewPopup(true);
  };

  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      for (const ratingUid of selectedIds) {
        await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteRating(ratingUid));
      }
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      await fetchRatings();
    } catch (e) { console.error(e); }
  };

  const handleAddClick = () => { setNewAuthor(''); setNewComment(''); setNewRating(0); setHoverRating(0); setShowAddPopup(true); };

  const handleAddSubmit = async () => {
    if (!uid || newRating === 0) return;
    setIsAdding(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureRatings(uid), { rating: newRating, comment: newComment.trim(), author: newAuthor.trim() });
      await fetchRatings();
      setShowAddPopup(false);
    } catch (e) { console.error(e); } finally { setIsAdding(false); }
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    const rating = ratings.find(r => r.uid === contextMenu.uid);
    if (rating) {
      setEditRatingUid(rating.uid);
      setEditAuthor(rating.author || '');
      setEditComment(rating.comment || '');
      setEditRating(rating.rating);
      setEditHoverRating(0);
      setContextMenu(null);
      setShowEditPopup(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!uid || !editRatingUid || editRating === 0) return;
    setIsEditing(true);
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteRating(editRatingUid));
      await AxiosService.post(ConstantInfo.restApiNomenclatureRatings(uid), { rating: editRating, comment: editComment.trim(), author: editAuthor.trim() });
      await fetchRatings();
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
    if (key === 'comment') return 'Отзыв';
    if (key === 'rating') return String(v);
    return String(v);
  };

  const renderCellNode = (key: string, item: any): React.ReactNode => {
    if (key === 'rating') {
      return <StarRatingSmall value={Number(item.rating) || 0} size={18} />;
    }
    if (key === 'comment') {
      return (
        <span 
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#666EFE', textDecoration: 'underline', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); setViewComment(item.comment || ''); setViewAuthor(item.author || ''); setShowViewPopup(true); }}
        >
          Отзыв
        </span>
      );
    }
    return null;
  };

  const isGrayColumn = (key: string): boolean => key !== 'comment';
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
    <div style={{ position: 'absolute', top: 164, left: 30, right: 30, bottom: 111, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', width: 1740, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 40, display: 'flex', alignItems: 'center', gap: 18 }}>
          <StarRatingSmall value={averageRating} size={18} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Средний рейтинг: {averageRating.toFixed(1)}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE', marginLeft: 42 }}>{getRatingStatus(averageRating)}</span>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
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
            columns={RATING_COLUMNS}
            visibleKeys={['createdAt', 'comment', 'rating', 'author']}
            data={filteredRatings}
            selectedIds={selectedIds}
            onCheckboxClick={handleCheckboxClick}
            onSelectAll={handleSelectAll}
            onRowClick={handleRowClick}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            renderCell={renderCell}
            renderCellNode={renderCellNode}
            isGrayColumn={isGrayColumn}
            tableWidth={1740}
            visibleRows={6}
            rowHeight={58}
            headerHeight={58}
            firstColLeft={60}
            noWrapColumns={['createdAt', 'comment', 'rating', 'author']}
            highlightText={searchValue.trim() || undefined}
          />
        </div>
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
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление отзыва</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Автор</label><input type="text" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setShowAddPopup(false); }} placeholder="Введите имя автора" autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Текст отзыва</label><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Введите текст отзыва" rows={3} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', resize: 'none' }} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Рейтинг</label><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ display: 'flex', gap: 8 }}>{[1, 2, 3, 4, 5].map(i => { const fillPercent = Math.min(100, Math.max(0, ((hoverRating || newRating) - i + 1) * 100)); const isHovered = hoverRating >= i; return (<div key={i} onClick={() => setNewRating(i)} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} style={{ width: 32, height: 32, position: 'relative', cursor: 'pointer', flexShrink: 0 }}><svg width={32} height={32} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill={isHovered ? '#666EFE' : '#E5E7EB'} stroke={isHovered ? '#666EFE' : '#D1D5DB'} strokeWidth="1"/></svg>{!isHovered && fillPercent > 0 && (<svg width={32} height={32} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/></svg>)}</div>); })}</div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>{hoverRating || newRating || 0}</span></div></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={isAdding || newRating === 0} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newRating > 0 && !isAdding ? '#666EFE' : '#BCC8FF', cursor: newRating > 0 && !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование отзыва</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Автор</label><input type="text" value={editAuthor} onChange={e => setEditAuthor(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setShowEditPopup(false); }} placeholder="Введите имя автора" autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Текст отзыва</label><textarea value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Введите текст отзыва" rows={3} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', resize: 'none' }} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Рейтинг</label><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ display: 'flex', gap: 8 }}>{[1, 2, 3, 4, 5].map(i => { const fillPercent = Math.min(100, Math.max(0, ((editHoverRating || editRating) - i + 1) * 100)); const isHovered = editHoverRating >= i; return (<div key={i} onClick={() => setEditRating(i)} onMouseEnter={() => setEditHoverRating(i)} onMouseLeave={() => setEditHoverRating(0)} style={{ width: 32, height: 32, position: 'relative', cursor: 'pointer', flexShrink: 0 }}><svg width={32} height={32} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill={isHovered ? '#666EFE' : '#E5E7EB'} stroke={isHovered ? '#666EFE' : '#D1D5DB'} strokeWidth="1"/></svg>{!isHovered && fillPercent > 0 && (<svg width={32} height={32} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/></svg>)}</div>); })}</div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>{editHoverRating || editRating || 0}</span></div></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={isEditing || editRating === 0} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: editRating > 0 && !isEditing ? '#666EFE' : '#BCC8FF', cursor: editRating > 0 && !isEditing ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isEditing ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {showViewPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowViewPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Отзыв</h3>
            {viewAuthor && (<div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Автор: </span><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{viewAuthor}</span></div>)}
            <div><p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', margin: 0, lineHeight: '1.5' }}>{viewComment || 'Без текста'}</p></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setShowViewPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные отзывы?</p>
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

export default RatingTab;