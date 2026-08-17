// CellDetailsPopup.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import Schablon7 from '../../../assets/Schablon/Schablon7.svg';
import Schablon8 from '../../../assets/Schablon/Schablon8.svg';
import CatalogSelectPopup from '../../../components/ReferencesPage/NomenclaturePage/CatalogSelectPopup';

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  typeMainUid?: string | null;
  typeMainName?: string | null;
  purposeMaterial?: string | null;
  purposeSgd?: string | null;
  maxQuantity?: number | null;
  dimensions?: string | null;
}

interface CellDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cellId: number;
  cellName: string;
  selectedColumn: number;
  selectedDrum: number;
  cellData?: CellData | null;
  onSaved: () => void;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
  codeMaterial: number;
  typeProductName?: string;
  usage?: boolean;
  imageUrl?: string;
  barcode?: string;
}

const CellDetailsPopup: React.FC<CellDetailsPopupProps> = ({ 
  isOpen, onClose, cellId, cellName, selectedColumn, selectedDrum, cellData, onSaved 
}) => {
  const { uid: templateUid } = useParams<{ uid: string }>();
  
  const [selectedMaterialUid, setSelectedMaterialUid] = useState<string>('');
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [maxQuantity, setMaxQuantity] = useState<number>(0);
  const [purposeMaterial, setPurposeMaterial] = useState(false);
  const [purposeSgd, setPurposeSgd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const title = `Выбранная ячейка ${selectedColumn}-${cellId}`;

  const loadMaterialDetail = useCallback(async (uid: string) => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid));
      const data = res.data;
      
      let barcode = '';
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = codesRes.data || [];
        const barcodeItem = codes.find((c: any) => c.codeKind === 'BARCODE' || c.codeKind === 'EAN_13' || c.codeKind === 'CODE_128');
        if (barcodeItem) barcode = barcodeItem.codeValue || '';
      } catch {}

      let imageUrl = '';
      try {
        const imagesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid));
        const images = imagesRes.data || [];
        if (images.length > 0) {
          imageUrl = `${ConstantInfo.fileDir}uploads/nomenclature/${uid}/${images[0].filePath}`;
        }
      } catch {}

      setMaterialDetail({
        uid: data.uid,
        nameMaterial: data.nameMaterial || '',
        article: data.article || '',
        codeMaterial: data.codeMaterial || 0,
        typeProductName: data.typeProductName || '',
        usage: data.usage,
        imageUrl,
        barcode,
      });
    } catch (e) {
      console.error('Ошибка загрузки материала:', e);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    if (cellData?.materialUid) {
      setSelectedMaterialUid(cellData.materialUid);
      loadMaterialDetail(cellData.materialUid);
      setQuantity(cellData.quantity || 0);
      setMaxQuantity(cellData.maxQuantity || 0);
      setPurposeMaterial(cellData.purposeMaterial === 'ТМЦ');
      setPurposeSgd(cellData.purposeSgd === 'СГД');
    } else {
      setSelectedMaterialUid('');
      setMaterialDetail(null);
      setQuantity(0);
      setMaxQuantity(0);
      setPurposeMaterial(false);
      setPurposeSgd(false);
    }
    setShowCatalog(false);
  }, [isOpen, cellData, loadMaterialDetail]);

  const handleSelectMaterial = (uid: string, name: string) => {
    setSelectedMaterialUid(uid);
    loadMaterialDetail(uid);
    setShowCatalog(false);
  };

  const handleClose = async () => {
    if (selectedMaterialUid && !isSaving) {
      setIsSaving(true);
      try {
        const payload = {
          materialUid: selectedMaterialUid,
          quantity: quantity,
          purposeMaterial: purposeMaterial ? 'ТМЦ' : null,
          purposeSgd: purposeSgd ? 'СГД' : null,
          maxQuantity: maxQuantity || null,
          numberCell: cellId,
          columnNumber: selectedColumn,
          drumNumber: selectedDrum,
        };

        if (cellData?.uid) {
          await AxiosService.put(ConstantInfo.restApiTemplateCell(cellData.uid), payload);
        } else if (templateUid) {
          await AxiosService.post(ConstantInfo.restApiTemplateCellsCreate, {
            ...payload,
            docPatternUid: templateUid,
          });
        }
        onSaved();
      } catch (e) {
        console.error('Ошибка сохранения:', e);
      } finally {
        setIsSaving(false);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div style={{ width: '1052px', height: '602px', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#2D4059' }}>{title}</span>
          </div>
          <div style={{ position: 'absolute', top: '76px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '400px', backgroundColor: '#E9EDFF', borderRadius: '1px' }} />

          <div style={{ position: 'absolute', top: '77px', left: '30px', width: '460px' }}>
            <div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Назначение ячейки</span>
              <div style={{ display: 'flex', gap: '16px', marginTop: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}><input type="checkbox" checked={purposeMaterial} onChange={e => setPurposeMaterial(e.target.checked)} /> ТМЦ</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}><input type="checkbox" checked={purposeSgd} onChange={e => setPurposeSgd(e.target.checked)} /> СГД</label>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Номенклатура</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '11px', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '44px', backgroundColor: '#E9F2F9', borderRadius: '8px', display: 'flex', alignItems: 'center', paddingLeft: '15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: materialDetail ? '#2D4059' : '#6C7A8B', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{materialDetail ? materialDetail.nameMaterial : 'Не выбрано'}</span>
                </div>
                <button onClick={() => setShowCatalog(true)} style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#FFFFFF" strokeWidth="1.5"/><path d="M11 11L14.5 14.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Количество в ячейке</span>
              <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder={maxQuantity ? `Макс: ${maxQuantity}` : '0'} min={0} max={maxQuantity || undefined}
                style={{ width: '100%', height: '44px', backgroundColor: '#E9F2F9', borderRadius: '8px', border: 'none', padding: '0 15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059', outline: 'none', boxSizing: 'border-box', marginTop: '11px' }} />
            </div>
          </div>

          <div style={{ position: 'absolute', top: '77px', right: '30px', width: '460px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#E9F2F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {materialDetail?.imageUrl ? <img src={materialDetail.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#6C7A8B' }}>Нет фото</span>}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Код номенклатуры</span><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>{materialDetail?.codeMaterial || '—'}</div></div>
                <div><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Артикул</span><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>{materialDetail?.article || '—'}</div></div>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Использование</span><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>{materialDetail?.usage === true ? 'Многоразовый' : materialDetail?.usage === false ? 'Одноразовый' : '—'}</div></div>
            <div style={{ marginTop: '16px' }}><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Вид номенклатуры</span><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}><img src={Schablon8} alt="" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059' }}>{materialDetail?.typeProductName || '—'}</span></div></div>
            <div style={{ marginTop: '16px' }}><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Штрихкод</span><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}><img src={Schablon7} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059' }}>{materialDetail?.barcode || '—'}</span></div></div>
          </div>

          <div style={{ position: 'absolute', left: '30px', bottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059' }}>Всего остаток на основном складе</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059' }}>Заблокировано оператором склада Иванов И.И. для размещения в станции № ХХХ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059' }}>Доступный остаток на основном складе</span>
          </div>

          <div style={{ position: 'absolute', top: '17px', right: '30px' }}>
            <button onClick={handleClose} disabled={isSaving} style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: isSaving ? 0.5 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" /><line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      </div>
      {showCatalog && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <CatalogSelectPopup isOpen={showCatalog} onClose={() => setShowCatalog(false)} onSelect={handleSelectMaterial} popupType="analogSelect" />
        </div>
      )}
    </>
  );
};

export default CellDetailsPopup;