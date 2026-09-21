// CellDetailsPopup.tsx — ПОЛНЫЙ ФАЙЛ (упрощённая форма: номенклатура, количество, ТМЦ/СГД; кнопки Сохранить/Отмена)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
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
  onSaved: (updated: CellData | null, key: { numberCell: number; columnNumber: number; drumNumber: number }) => void;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
}

const CellDetailsPopup: React.FC<CellDetailsPopupProps> = ({
  isOpen, onClose, cellId, cellName, selectedColumn, selectedDrum, cellData, onSaved
}) => {
  const [selectedMaterialUid, setSelectedMaterialUid] = useState<string>('');
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [purposeMaterial, setPurposeMaterial] = useState(false);
  const [purposeSgd, setPurposeSgd] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const materialDetailRef = useRef<MaterialDetail | null>(null);
  const selectedMaterialUidRef = useRef<string>('');
  useEffect(() => { materialDetailRef.current = materialDetail; }, [materialDetail]);
  useEffect(() => { selectedMaterialUidRef.current = selectedMaterialUid; }, [selectedMaterialUid]);

  const title = `Выбранная ячейка ${selectedColumn}-${cellId}`;

  const loadMaterialDetail = useCallback(async (uid: string): Promise<MaterialDetail | null> => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid));
      const data = res.data;

      const detail: MaterialDetail = {
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
      };
      setMaterialDetail(detail);
      materialDetailRef.current = detail;
      return detail;
    } catch (e) {
      console.error('Ошибка загрузки материала:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (cellData?.materialUid) {
      setSelectedMaterialUid(cellData.materialUid);
      selectedMaterialUidRef.current = cellData.materialUid;
      loadMaterialDetail(cellData.materialUid);
      setQuantity(cellData.quantity || 0);
      setPurposeMaterial(cellData.purposeMaterial === 'ТМЦ');
      setPurposeSgd(cellData.purposeSgd === 'СГД');
    } else {
      setSelectedMaterialUid('');
      selectedMaterialUidRef.current = '';
      setMaterialDetail(null);
      materialDetailRef.current = null;
      setQuantity(0);
      setPurposeMaterial(false);
      setPurposeSgd(false);
    }
    setShowCatalog(false);
    setIsLoading(false);
  }, [isOpen, cellData, loadMaterialDetail]);

  const handleSelectMaterial = async (uid: string, _name: string) => {
    setIsLoading(true);
    setSelectedMaterialUid(uid);
    selectedMaterialUidRef.current = uid;
    setShowCatalog(false);
    await loadMaterialDetail(uid);
    setIsLoading(false);
  };

  // Сохранить в локальный стейт родителя (без бэка)
  const handleSave = () => {
    const key = { numberCell: cellId, columnNumber: selectedColumn, drumNumber: selectedDrum };
    const uid = selectedMaterialUidRef.current;
    const detail = materialDetailRef.current;

    if (uid) {
      onSaved({
        materialUid: uid,
        materialName: detail?.nameMaterial || '',
        materialArticle: detail?.article || '',
        quantity: quantity ?? null,
        purposeMaterial: purposeMaterial ? 'ТМЦ' : null,
        purposeSgd: purposeSgd ? 'СГД' : null,
      }, key);
    } else if (cellData?.materialUid) {
      // Была номенклатура — очищаем
      onSaved(null, key);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div style={{ width: '1052px', height: '602px', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}>
          {/* Заголовок */}
          <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#2D4059' }}>{title}</span>
          </div>

          {/* Форма — слева */}
          <div style={{ position: 'absolute', top: '77px', left: '30px', width: '460px' }}>
            {/* Назначение ячейки (тип) */}
            <div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Тип ячейки</span>
              <div style={{ display: 'flex', gap: '16px', marginTop: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}>
                  <input type="checkbox" checked={purposeMaterial} onChange={e => setPurposeMaterial(e.target.checked)} /> ТМЦ
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}>
                  <input type="checkbox" checked={purposeSgd} onChange={e => setPurposeSgd(e.target.checked)} /> СГД
                </label>
              </div>
            </div>

            {/* Номенклатура */}
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Номенклатура</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '11px', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '44px', backgroundColor: '#E9F2F9', borderRadius: '8px', display: 'flex', alignItems: 'center', paddingLeft: '15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: materialDetail ? '#2D4059' : '#6C7A8B', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isLoading ? 'Загрузка...' : (materialDetail ? materialDetail.nameMaterial : 'Не выбрано')}
                  </span>
                </div>
                <button
                  onClick={() => setShowCatalog(true)}
                  style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <path d="M11 11L14.5 14.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Количество */}
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Количество в ячейке</span>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                placeholder="0"
                min={0}
                style={{ width: '100%', height: '44px', backgroundColor: '#E9F2F9', borderRadius: '8px', border: 'none', padding: '0 15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059', outline: 'none', boxSizing: 'border-box', marginTop: '11px' }}
              />
            </div>
          </div>

          {/* Кнопки внизу */}
          <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              onClick={handleSave}
              style={{
                height: '44px', paddingLeft: '30px', paddingRight: '30px', borderRadius: '10px',
                border: 'none', backgroundColor: '#666EFE', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#FFFFFF',
              }}
            >
              Сохранить
            </button>
            <button
              onClick={handleCancel}
              style={{
                height: '44px', paddingLeft: '30px', paddingRight: '30px', borderRadius: '10px',
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 400, color: '#2D4059',
              }}
            >
              Отмена
            </button>
          </div>

          {/* Крестик */}
          <div style={{ position: 'absolute', top: '17px', right: '30px' }}>
            <button
              onClick={handleCancel}
              style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
                <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
              </svg>
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