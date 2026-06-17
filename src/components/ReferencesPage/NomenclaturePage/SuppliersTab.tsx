// SuppliersTab.tsx — ПОЛНЫЙ ФАЙЛ (новый дизайн, контекстное меню)
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import CatalogSelectPopup from './CatalogSelectPopup';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps } from './NomenclatureCreatePage';
import PostIcon from '../../../assets/References/NomenclatureCreatePage/Post.svg';

interface SupplyItem {
  uid: string;
  materialUid: string;
  supplierUid: string;
  supplierName: string;
  supplyDate: string;
  documentName: string;
  filePath: string;
  originalName: string;
  fileUrl: string;
}

const SuppliersTab: React.FC<CommonProps> = (props) => {
  const { uid, isEdit } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showSupplierPopup, setShowSupplierPopup] = useState(false);
  const [newSupplierUid, setNewSupplierUid] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplyDate, setNewSupplyDate] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; supplyUid: string; supplierName: string } | null>(null);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const TABLE_WIDTH = 1660;
  const TABLE_HEIGHT = 464;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;

  const COL_NAME = 50;
  const COL_DATE = 640;
  const COL_DOCUMENT = 1200;

  const fetchSupplies = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureSupply(uid));
      setSupplies((res.data || []).map((s: any) => ({
        ...s,
        fileUrl: s.fileUrl ? ConstantInfo.fileDir + s.fileUrl.replace(/^\//, '') : null,
      })));
    } catch (e) {
      console.error('Ошибка загрузки поставок:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uid && isEdit) fetchSupplies();
  }, [uid, isEdit]);

  useEffect(() => {
    const handler = () => { if (uid) fetchSupplies(); };
    window.addEventListener('refreshSupplies', handler);
    return () => window.removeEventListener('refreshSupplies', handler);
  }, [uid]);

  useEffect(() => {
    if (!contextMenu) return;
    const h = () => setContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [contextMenu]);

  const checkScroll = () => {
    const c = scrollContainerRef.current;
    if (c) setHasScroll(c.scrollHeight > c.clientHeight);
  };

  useEffect(() => {
    const t = setTimeout(checkScroll, 100);
    return () => clearTimeout(t);
  }, [supplies]);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const handleAddClick = () => {
    setNewSupplierUid('');
    setNewSupplierName('');
    setNewSupplyDate(new Date().toISOString().slice(0, 16));
    setNewDocumentName('');
    setSelectedFile(null);
    setShowAddPopup(true);
  };

  const handleAddSubmit = async () => {
    if (!uid || !newSupplierUid) return;
    setIsAdding(true);
    try {
      const fd = new FormData();
      fd.append('supplierUid', newSupplierUid);
      if (newSupplyDate) fd.append('supplyDate', newSupplyDate + ':00');
      if (newDocumentName.trim()) fd.append('documentName', newDocumentName.trim());
      if (selectedFile) fd.append('file', selectedFile);
      await AxiosService.post(ConstantInfo.restApiNomenclatureSupply(uid), fd);
      await fetchSupplies();
      setShowAddPopup(false);
      window.dispatchEvent(new CustomEvent('refreshSupplies'));
    } catch (e) {
      console.error('Ошибка добавления поставщика:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, supplyUid: string, supplierName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, supplyUid, supplierName });
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    if (!confirm('Удалить привязку поставщика?')) {
      setContextMenu(null);
      return;
    }
    AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteSupply(contextMenu.supplyUid))
      .then(() => fetchSupplies())
      .catch(e => console.error('Ошибка удаления:', e));
    setContextMenu(null);
  };

  const popupFieldStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF',
    display: 'flex', alignItems: 'center',
    paddingLeft: 14, paddingRight: 13,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', boxSizing: 'border-box',
  };

  const totalRows = Math.max(supplies.length, VISIBLE_ROWS);

  const getRowSeparator = (index: number, isRealData: boolean): React.CSSProperties => {
    if (!isRealData) return { borderTop: 'none', borderBottom: 'none' };
    const isFirst = index === 0;
    const isLast = index === supplies.length - 1;
    
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
        {/* Кнопки */}
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="1" y1="4" x2="17" y2="4" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="9" x2="17" y2="9" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="14" x2="12" y2="14" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button style={smallButtonStyle}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <path d="M1 7H19M1 1H19M1 13H19" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={handleAddClick} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Таблица */}
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 15 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Шапка */}
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ ПОСТАВЩИКА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DATE }}>ДАТА ПОСЛЕДНЕЙ ПОСТАВКИ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DOCUMENT }}>ДОКУМЕНТ ПОСТАВКИ</span>
            </div>
            
            {/* Тело таблицы */}
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div style={{ minWidth: TABLE_WIDTH }}>
                {isLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
                  </div>
                ) : (
                  <>
                    {Array.from({ length: totalRows }).map((_, index) => {
                      const supply = supplies[index];
                      const isRealData = !!supply;

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
                              borderTop: 'none',
                              borderBottom: 'none',
                            }} 
                          />
                        );
                      }

                      return (
                        <div 
                          key={supply.uid} 
                          onContextMenu={(e) => handleContextMenu(e, supply.uid, supply.supplierName)}
                          style={{ 
                            height: ROW_HEIGHT, 
                            display: 'flex', 
                            alignItems: 'center', 
                            backgroundColor: '#FFFFFF', 
                            position: 'relative', 
                            boxSizing: 'border-box',
                            cursor: 'context-menu',
                            userSelect: 'none',
                            ...getRowSeparator(index, true),
                          }}
                        >
                          <img src={PostIcon} alt="" style={{ position: 'absolute', left: 21, width: 20, height: 20, flexShrink: 0 }} />
                          <span style={{ position: 'absolute', left: COL_NAME, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_DATE - COL_NAME - 30 }}>
                            {supply.supplierName}
                          </span>
                          <span style={{ position: 'absolute', left: COL_DATE, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_DOCUMENT - COL_DATE - 30 }}>
                            {formatDate(supply.supplyDate)}
                          </span>
                          <span style={{ position: 'absolute', left: COL_DOCUMENT, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TABLE_WIDTH - COL_DOCUMENT - 60 }}>
                            {supply.fileUrl ? (
                              <a href={supply.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#666EFE', textDecoration: 'none' }}>
                                {supply.originalName || supply.documentName || 'Документ'}
                              </a>
                            ) : (supply.documentName || '-')}
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

      {/* Контекстное меню */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button style={contextMenuButtonStyle} onClick={handleContextDelete}>Удалить</button>
        </div>
      )}

      {/* Попап добавления поставщика */}
      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление поставщика</h3>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <div onClick={() => setShowSupplierPopup(true)} style={{ ...popupFieldStyle, color: newSupplierName ? '#666EFE' : '#9CA3AF' }}>
                <span>{newSupplierName || 'Выберите поставщика'}</span>
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата поставки</label>
              <input
                type="datetime-local"
                value={newSupplyDate}
                onChange={e => setNewSupplyDate(e.target.value)}
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название документа</label>
              <input
                type="text"
                value={newDocumentName}
                onChange={e => setNewDocumentName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setShowAddPopup(false); }}
                placeholder="Введите название документа"
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Файл документа</label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedFile ? '#666EFE' : '#9CA3AF' }}>
                  {selectedFile ? selectedFile.name : 'Выберите файл'}
                </span>
              </div>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={!newSupplierUid || isAdding} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newSupplierUid && !isAdding ? '#666EFE' : '#BCC8FF', cursor: newSupplierUid && !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup
        isOpen={showSupplierPopup}
        onClose={() => setShowSupplierPopup(false)}
        onSelect={(id, name) => {
          setNewSupplierUid(id);
          setNewSupplierName(name);
          setShowSupplierPopup(false);
        }}
        popupType="supplier"
      />
    </div>
  );
};

export default SuppliersTab;