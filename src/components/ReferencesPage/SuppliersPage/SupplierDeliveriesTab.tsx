// SupplierDeliveriesTab.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonSupplierProps } from './SupplierCreatePage';

interface DeliveryItem {
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

const SupplierDeliveriesTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid, isEdit } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);
  const [newMaterialUid, setNewMaterialUid] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newSupplyDate, setNewSupplyDate] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const fetchDeliveries = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiSupplierDeliveries(uid));
      setDeliveries((res.data || []).map((d: any) => ({
        ...d,
        fileUrl: d.fileUrl ? ConstantInfo.fileDir + d.fileUrl.replace(/^\//, '') : null,
      })));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchDeliveries(); }, [uid, isEdit]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [deliveries]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  const handleAddClick = () => {
    setNewMaterialUid(''); setNewMaterialName('');
    setNewSupplyDate(new Date().toISOString().slice(0, 16));
    setNewDocumentName(''); setSelectedFile(null);
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
    } catch (e) { console.error(e); } finally { setIsAdding(false); }
  };

  const handleDelete = async (deliveryUid: string) => {
    if (!confirm('Удалить поставку?')) return;
    try {
      await AxiosService.delete(ConstantInfo.restApiSupplierDeleteDelivery(deliveryUid));
      await fetchDeliveries();
    } catch (e) { console.error(e); }
  };

  const popupFieldStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxSizing: 'border-box',
  };

  const TABLE_WIDTH = 1665; const HEADER_HEIGHT = 54; const ROW_HEIGHT = 54; const TABLE_HEIGHT = 450;

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <button onClick={handleAddClick} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 450 }}>НАИМЕНОВАНИЕ НОМЕНКЛАТУРЫ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 250 }}>ДАТА ПОСТАВКИ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ДОКУМЕНТ</span>
              <span style={{ width: 40 }} />
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span></div>
              : deliveries.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет поставок</span></div>
              : deliveries.map(d => (
                <div key={d.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15, width: 415, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.supplierName || '—'}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 235 }}>{formatDate(d.supplyDate)}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#666EFE', textDecoration: 'none' }}>{d.originalName || d.documentName || 'Документ'}</a> : (d.documentName || '—')}
                  </span>
                  <button onClick={() => handleDelete(d.uid)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="3" y1="3" x2="11" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>

      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление поставки</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Номенклатура</label>
              <div onClick={() => setShowMaterialPopup(true)} style={{ ...popupFieldStyle, color: newMaterialName ? '#666EFE' : '#9CA3AF' }}><span>{newMaterialName || 'Выберите номенклатуру'}</span></div>
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата поставки</label>
              <input type="datetime-local" value={newSupplyDate} onChange={e => setNewSupplyDate(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название документа</label>
              <input type="text" value={newDocumentName} onChange={e => setNewDocumentName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setShowAddPopup(false); }} placeholder="Введите название документа" style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Файл документа</label>
              <div onClick={() => fileInputRef.current?.click()} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedFile ? '#666EFE' : '#9CA3AF' }}>{selectedFile ? selectedFile.name : 'Выберите файл'}</span>
              </div>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={!newMaterialUid || isAdding} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newMaterialUid && !isAdding ? '#666EFE' : '#BCC8FF', cursor: newMaterialUid && !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup isOpen={showMaterialPopup} onClose={() => setShowMaterialPopup(false)} onSelect={(id, name) => { setNewMaterialUid(id); setNewMaterialName(name); setShowMaterialPopup(false); }} popupType="analogSelect" />
    </div>
  );
};

export default SupplierDeliveriesTab;