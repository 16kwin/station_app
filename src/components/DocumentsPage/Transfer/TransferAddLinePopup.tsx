// TransferAddLinePopup.tsx — попап добавления номенклатуры в перемещение
import React, { useState, useEffect, useMemo } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import FormField from '../../elements/FormField';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';

import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import ArticleIcon18Gray from '../../../assets/Icons/ArticleIcons/ArticleIcon18Gray.svg';
import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';

export interface TransferLineDraft {
  uid: string;
  materialUid: string | null;
  materialName: string | null;
  materialArticle: string | null;
  materialCode: number | null;
  quantity: number | null;
  cellUid: string | null;
  cellName: string | null;
  available: number | null;
}

interface MaterialOption {
  uid: string;
  name: string;
  article: string;
  code: number | null;
}

interface TransferAddLinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (line: TransferLineDraft) => void;
  materialOptions: MaterialOption[];
  stockFromUid: string | null;
  initialMaterialUid?: string;
  initialMaterialName?: string;
  initialMaterialArticle?: string;
  initialMaterialCode?: number | null;
  initialQuantity?: number | null;
  initialCellUid?: string | null;
  initialCellName?: string | null;
  initialAvailable?: number | null;
  editingUid?: string | null;
  lockMaterial?: boolean;
}

const POPUP_W = 720;
const POPUP_H = 520;
const TITLE_TOP = 30;
const TITLE_H = 21;
const LEFT_OFFSET = 40;
const FIELD_W = 640;
const FIELD_H = 50;
const FIELD_GAP = 30;
const TOP_FIRST = 90;
const BOTTOM_BTN_BOTTOM = 30;
const BOTTOM_BTN_RIGHT = 40;
const BTN_GAP = 30;
const BTN_RADIUS = 30;
const CANCEL_W = 108;
const SAVE_W = 140;
const BTN_H = 44;

const extractCode = (data: any): number | null => {
  if (!data) return null;
  const raw = data.codeMaterial ?? data.code ?? data.materialCode ?? null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw != null) { const p = Number(raw); if (Number.isFinite(p)) return p; }
  return null;
};

const TransferAddLinePopup: React.FC<TransferAddLinePopupProps> = ({
  isOpen, onClose, onAdd, materialOptions, stockFromUid,
  initialMaterialUid = '', initialMaterialName = '', initialMaterialArticle = '',
  initialMaterialCode = null, initialQuantity = null,
  initialCellUid = null, initialCellName = '',
  initialAvailable = null, editingUid = null, lockMaterial = false,
}) => {
  const [materialUid, setMaterialUid] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [materialArticle, setMaterialArticle] = useState('');
  const [materialCode, setMaterialCode] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [cellUid, setCellUid] = useState<string | null>(null);
  const [cellName, setCellName] = useState<string>('');
  const [availableOnStock, setAvailableOnStock] = useState<number | null>(null);
  const [fullListOpen, setFullListOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMaterialUid(initialMaterialUid || '');
    setMaterialName(initialMaterialName || '');
    setMaterialArticle(initialMaterialArticle || '');
    setMaterialCode(initialMaterialCode ?? null);
    setQuantity(typeof initialQuantity === 'number' ? initialQuantity : '');
    setCellUid(initialCellUid ?? null);
    setCellName(initialCellName || '');
    setAvailableOnStock(typeof initialAvailable === 'number' ? initialAvailable : null);
    setFullListOpen(false);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    if (!materialUid || !stockFromUid) { setAvailableOnStock(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const [balanceRes, kuoRes] = await Promise.allSettled([
          AxiosService.get(ConstantInfo.restApiRefillStockBalances(stockFromUid)),
          AxiosService.get(ConstantInfo.restApiStockLevelControlReg(stockFromUid, materialUid)),
        ]);
        let free: number | null = null;
        if (balanceRes.status === 'fulfilled') {
          const list = (balanceRes.value.data || []) as Array<{ materialUid: string; cleanQuantity: number | null }>;
          const found = list.find(b => b.materialUid === materialUid);
          free = found?.cleanQuantity ?? null;
        }
        let critical: number | null = null;
        if (kuoRes.status === 'fulfilled') {
          const kuo = kuoRes.value.data as { minStock: number | null; criticalStock: number | null } | null;
          if (kuo) critical = kuo.criticalStock ?? null;
        }
        if (free == null) { if (!cancelled) setAvailableOnStock(null); return; }
        const toMoveMax = critical != null ? Math.max(0, free - critical) : free;
        if (!cancelled) setAvailableOnStock(toMoveMax);
      } catch { if (!cancelled) setAvailableOnStock(null); }
    })();
    return () => { cancelled = true; };
  }, [isOpen, materialUid, stockFromUid]);

  const materialSelectOptions = useMemo(() => materialOptions.map(m => ({ uid: m.uid, name: m.name })), [materialOptions]);

  const handleMaterialSelect = async (uid: string, name: string) => {
    if (lockMaterial) return;
    setMaterialUid(uid); setMaterialName(name);
    const found = materialOptions.find(m => m.uid === uid);
    if (found) { setMaterialArticle(found.article || ''); setMaterialCode(found.code ?? null); }
  };

  const handleFullListSelect = async (uid: string, name: string, item?: any) => {
    if (lockMaterial) return;
    setFullListOpen(false);
    setMaterialUid(uid); setMaterialName(name);
    setMaterialArticle(item?.article || '');
    setMaterialCode(extractCode(item));
  };

  const quantityIsNumber = typeof quantity === 'number';
  const quantityPositive = quantityIsNumber && (quantity as number) > 0;
  const isValid = !!materialUid && quantityPositive;

  const handleSave = () => {
    if (!isValid) return;
    onAdd({
      uid: editingUid || `line_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      materialUid: materialUid || null,
      materialName: materialName || null,
      materialArticle: materialArticle || null,
      materialCode: materialCode ?? null,
      quantity: quantityIsNumber ? (quantity as number) : null,
      cellUid,
      cellName: cellName || null,
      available: availableOnStock,
    });
    onClose();
  };

  if (!isOpen) return null;

  const posMaterial = TOP_FIRST;
  const posQuantity = posMaterial + FIELD_H + FIELD_GAP;
  const posArticle = posQuantity + FIELD_H + FIELD_GAP;
  const posAvailable = posArticle + FIELD_H + FIELD_GAP;
  const posCell = posAvailable + FIELD_H + FIELD_GAP;

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div style={{ width: POPUP_W, height: POPUP_H, backgroundColor: '#FFFFFF', borderRadius: 15, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
          <div style={{ position: 'absolute', top: TITLE_TOP, left: 0, right: 0, height: TITLE_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 17, color: '#2D4059', lineHeight: `${TITLE_H}px` }}>
              {editingUid ? 'Изменение номенклатуры в перемещении' : 'Добавление номенклатуры в перемещение'}
            </span>
          </div>

          <div style={{ position: 'absolute', top: posMaterial, left: LEFT_OFFSET }}>
            <FormField width={FIELD_W} height={FIELD_H} label="Номенклатура:" labelPosition="inside" value={materialName} placeholder="Выберите номенклатуру" type="select" disabled={lockMaterial} icon={NomenclatureIcon16Gray} iconActive={NomenclatureIcon16Blue} selectIconWidth={16} selectIconHeight={18} searchOptions={materialSelectOptions} onSelectOption={handleMaterialSelect} onOpenFullList={() => { if (!lockMaterial) setFullListOpen(true); }} searchTitle="Найденная номенклатура" searchNotFoundText="Номенклатура не найдена" />
          </div>

          <div style={{ position: 'absolute', top: posQuantity, left: LEFT_OFFSET }}>
            <FormField width={FIELD_W} height={FIELD_H} label="Количество:" labelPosition="inside" value={quantityIsNumber ? String(quantity) : ''} placeholder="0" type="input" inputType="text" icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} onChange={e => { const digits = e.target.value.replace(/[^0-9]/g, ''); setQuantity(digits === '' ? '' : Number(digits)); }} />
          </div>

          <div style={{ position: 'absolute', top: posArticle, left: LEFT_OFFSET }}>
            <FormField width={FIELD_W} height={FIELD_H} label="Артикул:" labelPosition="inside" value={materialArticle} type="input" disabled icon={materialArticle ? ArticleIcon18Blue : ArticleIcon18Gray} iconWidth={18} iconHeight={10} />
          </div>

          <div style={{ position: 'absolute', top: posAvailable, left: LEFT_OFFSET }}>
            <FormField width={FIELD_W} height={FIELD_H} label="Доступно на складе-отправителе:" labelPosition="inside" value={availableOnStock != null ? String(availableOnStock) : ''} type="input" disabled icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} />
          </div>

          <div style={{ position: 'absolute', top: posCell, left: LEFT_OFFSET }}>
            <FormField width={FIELD_W} height={FIELD_H} label="Ячейка на складе-отправителе:" labelPosition="inside" value={cellName} placeholder="Не выбрана" type="input" disabled icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} />
          </div>

          <div style={{ position: 'absolute', bottom: BOTTOM_BTN_BOTTOM, right: BOTTOM_BTN_RIGHT, display: 'flex', alignItems: 'center', gap: BTN_GAP }}>
            <button onClick={handleSave} disabled={!isValid} style={{ width: SAVE_W, height: BTN_H, borderRadius: BTN_RADIUS, border: 'none', backgroundColor: '#666EFE', color: '#FFFFFF', cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, opacity: isValid ? 1 : 0.5 }}>
              {editingUid ? 'Сохранить' : 'Добавить'}
            </button>
            <button onClick={onClose} style={{ width: CANCEL_W, height: BTN_H, borderRadius: BTN_RADIUS, border: 'none', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>
              Отмена
            </button>
          </div>
        </div>
      </div>

      <CatalogSelectPopup isOpen={fullListOpen} onClose={() => setFullListOpen(false)} onSelect={handleFullListSelect} popupType="analogSelect" />
    </>
  );
};

export default TransferAddLinePopup;