// PriceHistoryTab.tsx — ПОЛНЫЙ ФАЙЛ (выделение строк, удаление выделенных, кнопки button1/button4/button5)
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps } from './NomenclatureCreatePage';
import IconUp from '../../../assets/References/NomenclatureCreatePage/IconUp.svg';
import IconDown from '../../../assets/References/NomenclatureCreatePage/IconDown.svg';
import IconRavno from '../../../assets/References/NomenclatureCreatePage/IconRavno.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';

const PriceHistoryTab: React.FC<CommonProps> = (props) => {
  const {
    uid, prices, suppliers, showAddPricePopup,
    newPrice, newPriceDate, newPriceSupplierUid,
    setShowAddPricePopup, setNewPrice, setNewPriceDate, setNewPriceSupplierUid,
    handleAddPrice, handleDeletePrice,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingPriceUid, setEditingPriceUid] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPriceDate, setEditPriceDate] = useState('');
  const [editPriceSupplierUid, setEditPriceSupplierUid] = useState('');

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; priceUid: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Сортировка: самая последняя (новая) вверху
  const sortedPrices = [...prices].sort((a, b) => new Date(b.priceDate).getTime() - new Date(a.priceDate).getTime());

  const renderChart = () => {
    if (sortedPrices.length === 0) return null;
    const chronologicalPrices = [...sortedPrices].reverse();
    const cw = 490, ch = 220;
    const pad = { top: 15, right: 15, bottom: 22, left: 5 };
    const pw = cw - pad.left - pad.right, ph = ch - pad.top - pad.bottom;
    const maxP = Math.max(...chronologicalPrices.map(p => p.price)) * 1.1;
    const minP = Math.min(...chronologicalPrices.map(p => p.price)) * 0.9;
    const range = maxP - minP || 1;

    const firstDate = new Date(chronologicalPrices[0].priceDate);
    const lastDate = new Date(chronologicalPrices[chronologicalPrices.length - 1].priceDate);
    const firstTime = firstDate.getTime();
    const lastTime = lastDate.getTime();
    const timeRange = lastTime - firstTime || 1;

    const allPts = chronologicalPrices.map(p => {
      const t = new Date(p.priceDate).getTime();
      return {
        x: pad.left + ((t - firstTime) / timeRange) * pw,
        y: pad.top + ph - ((p.price - minP) / range) * ph,
      };
    });

    const allMonths: { x: number; label: string }[] = [];
    const startMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const endMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    for (let d = new Date(startMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
      const t = d.getTime();
      allMonths.push({
        x: pad.left + ((t - firstTime) / timeRange) * pw,
        label: d.toLocaleDateString('ru', { month: 'short' }),
      });
    }

    const catmullRomToBezier = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const smoothPath = catmullRomToBezier(allPts);
    const gradientId = `pg-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <svg width={cw} height={ch} style={{ fontFamily: 'Inter, sans-serif', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#666EFE" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#666EFE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${smoothPath} L ${allPts[allPts.length - 1].x} ${ch - pad.bottom} L ${allPts[0].x} ${ch - pad.bottom} Z`} fill={`url(#${gradientId})`} />
        <path d={smoothPath} fill="none" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {allPts.map((pt, i) => (
          <circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r="4" fill="#666EFE" />
        ))}
        {allMonths.map((m, i) => (
          <text key={`m-${i}`} x={m.x} y={ch - 3} textAnchor="middle" fontSize="10" fill="#2D4059">{m.label}</text>
        ))}
      </svg>
    );
  };

  const getDynamicsIcon = (change: number | null) => {
    if (change === null || change === 0) return <img src={IconRavno} alt="=" style={{ width: 22, height: 4 }} />;
    if (change > 0) return <img src={IconUp} alt="▲" style={{ width: 44, height: 15 }} />;
    return <img src={IconDown} alt="▼" style={{ width: 44, height: 15 }} />;
  };

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const TABLE_WIDTH = 1054;
  const TABLE_HEIGHT = 464;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;

  const COL_DATE = 50;
  const COL_DYNAMICS = 314;
  const COL_PRICE = 538;
  const COL_SUPPLIER = 802;

  const checkScroll = () => {
    const c = scrollContainerRef.current;
    if (c) setHasScroll(c.scrollHeight > c.clientHeight);
  };

  useEffect(() => {
    const t = setTimeout(checkScroll, 100);
    return () => clearTimeout(t);
  }, [sortedPrices]);

  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    checkScroll();
    c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(c);
    return () => {
      c.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const h = () => setContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [contextMenu]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const toggleSelect = (priceUid: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(priceUid)) next.delete(priceUid);
        else next.add(priceUid);
        return next;
      });
    } else if (e.shiftKey && lastSelectedId) {
      const allIds = sortedPrices.map(p => p.uid);
      const lastIdx = allIds.indexOf(lastSelectedId);
      const currentIdx = allIds.indexOf(priceUid);
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const rangeIds = allIds.slice(start, end + 1);
        setSelectedIds(prev => {
          const next = new Set(prev);
          rangeIds.forEach(id => next.add(id));
          return next;
        });
      }
    } else {
      if (selectedIds.has(priceUid) && selectedIds.size === 1) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set([priceUid]));
      }
    }
    setLastSelectedId(priceUid);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      for (const priceUid of selectedIds) {
        handleDeletePrice(priceUid);
      }
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error('Ошибка удаления цен:', e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, priceUid: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.has(priceUid)) {
      setSelectedIds(new Set([priceUid]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, priceUid });
  };

  const handleContextEdit = () => {
    if (!contextMenu) return;
    const price = sortedPrices.find(p => p.uid === contextMenu.priceUid);
    if (!price) return;

    setEditingPriceUid(price.uid);
    setEditPrice(price.price.toString());
    setEditPriceDate(price.priceDate ? new Date(price.priceDate).toISOString().slice(0, 16) : '');
    setEditPriceSupplierUid('');
    setShowEditPopup(true);
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    if (!confirm('Удалить запись цены?')) {
      setContextMenu(null);
      return;
    }
    const uidsToDelete = selectedIds.has(contextMenu.priceUid) ? selectedIds : new Set([contextMenu.priceUid]);
    uidsToDelete.forEach(uid => handleDeletePrice(uid));
    setSelectedIds(new Set());
    setContextMenu(null);
  };

  const handleEditSubmit = async () => {
    if (!uid || !editingPriceUid || !editPrice) return;

    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeletePrice(editingPriceUid));
      await AxiosService.post(ConstantInfo.restApiNomenclaturePrices(uid), {
        price: parseFloat(editPrice),
        priceDate: editPriceDate,
        supplierUid: editPriceSupplierUid || null,
      });
      window.dispatchEvent(new CustomEvent('refreshPrices'));
      setShowEditPopup(false);
      setEditingPriceUid('');
    } catch (e) {
      console.error('Ошибка редактирования цены:', e);
    }
  };

  const totalRows = Math.max(sortedPrices.length, VISIBLE_ROWS);

  const getRowSeparator = (index: number, isRealData: boolean): React.CSSProperties => {
    if (!isRealData) return { borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' };
    const isFirst = index === 0;
    const isLast = index === sortedPrices.length - 1;
    return {
      borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
      borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
    };
  };

  const contextMenuButtonStyle: React.CSSProperties = {
    width: 174, height: 40, border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', paddingLeft: 20,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
  };

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        {/* График */}
        <div style={{ position: 'absolute', bottom: 156, left: 73, width: 490, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {sortedPrices.length > 0 ? renderChart() : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#9CA3AF' }}>Нет данных о ценах</span>}
        </div>

        {/* Таблица с кнопками */}
        <div style={{ position: 'absolute', top: 14, right: 40, display: 'flex', flexDirection: 'column' }}>
          {/* Кнопки над таблицей */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8, paddingLeft: 0, justifyContent: 'flex-start' }}>
            <button style={smallButtonStyle}>
              <img src={Button1} alt="" style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={() => setShowAddPricePopup(true)} style={smallButtonStyle}>
              <img src={Button4} alt="" style={{ width: 14, height: 14 }} />
            </button>
            <button onClick={handleDeleteSelected} style={{ ...smallButtonStyle, opacity: selectedIds.size > 0 ? 1 : 0.5, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed' }}>
              <img src={Button5} alt="" style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Шапка */}
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DATE }}>ДАТА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DYNAMICS }}>ДИНАМИКА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_PRICE }}>ЦЕНА С НДС РУБ.</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_SUPPLIER }}>ПОСТАВЩИК</span>
              </div>
              
              {/* Тело таблицы */}
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ minWidth: TABLE_WIDTH }}>
                  {sortedPrices.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Нет данных</span>
                    </div>
                  ) : (
                    <>
                      {Array.from({ length: totalRows }).map((_, index) => {
                        const price = sortedPrices[index];
                        const isRealData = !!price;
                        const isSelected = price && selectedIds.has(price.uid);

                        if (!isRealData) {
                          return (
                            <div 
                              key={`empty-${index}`} 
                              style={{ 
                                height: ROW_HEIGHT, 
                                backgroundColor: '#FFFFFF', 
                                boxSizing: 'border-box',
                                display: 'flex', 
                                alignItems: 'center',
                                borderTop: '0.5px solid #E5ECF5',
                                borderBottom: '0.5px solid #E5ECF5',
                              }} 
                            />
                          );
                        }

                        const prev = sortedPrices[index + 1]?.price ?? null;
                        const change = prev !== null ? price.price - prev : null;

                        return (
                          <div 
                            key={price.uid} 
                            onClick={(e) => toggleSelect(price.uid, e)}
                            onContextMenu={(e) => handleContextMenu(e, price.uid)}
                            style={{ 
                              height: ROW_HEIGHT, 
                              display: 'flex', 
                              alignItems: 'center', 
                              backgroundColor: isSelected ? '#DEEEFF' : '#FFFFFF', 
                              position: 'relative', 
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              userSelect: 'none',
                              ...getRowSeparator(index, true),
                            }}
                          >
                            <span style={{ position: 'absolute', left: COL_DATE, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_DYNAMICS - COL_DATE - 20 }}>
                              {formatDate(price.priceDate)}
                            </span>
                            <span style={{ position: 'absolute', left: COL_DYNAMICS, display: 'flex', alignItems: 'center', width: COL_PRICE - COL_DYNAMICS - 20 }}>
                              {getDynamicsIcon(change)}
                            </span>
                            <span style={{ position: 'absolute', left: COL_PRICE, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_SUPPLIER - COL_PRICE - 20 }}>
                              {price.price.toFixed(2)} ₽
                            </span>
                            <span style={{ position: 'absolute', left: COL_SUPPLIER, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TABLE_WIDTH - COL_SUPPLIER - 40 }}>
                              {price.supplierName || '-'}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Скроллбар */}
            {hasScroll && (
              <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}>
                <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button style={contextMenuButtonStyle} onClick={handleContextEdit}>Редактировать</button>
          <button style={contextMenuButtonStyle} onClick={handleContextDelete}>Удалить</button>
        </div>
      )}

      {/* Попап добавления цены */}
      {showAddPricePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPricePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавить цену</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Цена</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Введите цену" style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата</label>
              <input type="datetime-local" value={newPriceDate} onChange={e => setNewPriceDate(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <select value={newPriceSupplierUid} onChange={e => setNewPriceSupplierUid(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                <option value="">Без поставщика</option>
                {suppliers.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPricePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddPrice} disabled={!newPrice} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newPrice ? '#666EFE' : '#BCC8FF', cursor: newPrice ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Попап редактирования цены */}
      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактировать цену</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Цена</label>
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="Введите цену" style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата</label>
              <input type="datetime-local" value={editPriceDate} onChange={e => setEditPriceDate(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <select value={editPriceSupplierUid} onChange={e => setEditPriceSupplierUid(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                <option value="">Без поставщика</option>
                {suppliers.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={!editPrice} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: editPrice ? '#666EFE' : '#BCC8FF', cursor: editPrice ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Попап подтверждения удаления */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные элементы?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDeleteSelected} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryTab;