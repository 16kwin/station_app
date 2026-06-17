// SupplierAssortmentTab.tsx — ПОЛНЫЙ ФАЙЛ (с кнопкой добавления)
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonSupplierProps } from './SupplierCreatePage';

interface AssortmentItem {
  uid: string;
  name: string;
  article: string;
  code: number | null;
  typeMainName?: string;
}

const SupplierAssortmentTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid, isEdit } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [items, setItems] = useState<AssortmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const fetchAssortment = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiSupplierAssortment(uid));
      setItems(res.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchAssortment(); }, [uid, isEdit]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [items]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  const handleAddMaterial = async (materialUid: string, materialName: string) => {
    if (!uid) return;
    try {
      const fd = new FormData();
      fd.append('materialUid', materialUid);
      fd.append('supplyDate', new Date().toISOString().slice(0, 16) + ':00');
      await AxiosService.post(ConstantInfo.restApiSupplierDeliveries(uid), fd);
      await fetchAssortment();
    } catch (e) { console.error(e); }
    setShowMaterialPopup(false);
  };

  const TABLE_WIDTH = 1665; const HEADER_HEIGHT = 54; const ROW_HEIGHT = 54; const TABLE_HEIGHT = 450;

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <button onClick={() => setShowMaterialPopup(true)} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>КОД</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 500 }}>НАИМЕНОВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 300 }}>АРТИКУЛ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ГРУППА УЧЕТА</span>
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span></div>
              : items.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет номенклатуры</span></div>
              : items.map(item => (
                <div key={item.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', position: 'relative' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 135 }}>{item.code || '—'}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', width: 485, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 285, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.article || '—'}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1 }}>{item.typeMainName || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>

      <CatalogSelectPopup isOpen={showMaterialPopup} onClose={() => setShowMaterialPopup(false)} onSelect={handleAddMaterial} popupType="analogSelect" />
    </div>
  );
};

export default SupplierAssortmentTab;