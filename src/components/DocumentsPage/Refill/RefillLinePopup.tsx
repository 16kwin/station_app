// RefillLinePopup.tsx — попап редактирования строки пополнения (ячейка + материал + количество + источники)
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import FormField from '../../elements/FormField';
import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import WriteIcon20White from '../../../assets/Icons/WriteIcons/WriteIcon20White.svg';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';

export interface RefillCellSource {
  uid: string;
  stockFromUid: string;
  stockFromName: string | null;
  quantity: number | null;
}

export interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialNameSnapshot?: string | null;
  materialArticleSnapshot?: string | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  refillQuantity?: number | null;
  acceptedQuantity?: number | null;
  status?: string | null;
  cancelled?: boolean | null;
  sources?: RefillCellSource[];
}

interface IncomingStation {
  uid: string;
  name: string;
  available?: number | null;
  free?: number | null;
  reserved?: number | null;
  minStock?: number | null;
  criticalStock?: number | null;
}

interface RefillLinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  cell: RefillCell;
  stationUid: string | null;
  stationName: string | null;
  onSave: (patch: Partial<RefillCell>) => void;
  readOnly?: boolean;
}

const RefillLinePopup: React.FC<RefillLinePopupProps> = ({
  isOpen, onClose, cell, stationUid, stationName, onSave, readOnly = false,
}) => {
  const [qty, setQty] = useState<string>('');
  const [incoming, setIncoming] = useState<IncomingStation[]>([]);
  const [incomingLoaded, setIncomingLoaded] = useState(false);
  const [sourcesMap, setSourcesMap] = useState<Record<string, string>>({});
  const [sumError, setSumError] = useState<string | null>(null);
  const [loadingIncoming, setLoadingIncoming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQty(cell.refillQuantity != null ? String(cell.refillQuantity) : '');
    const initialSources: Record<string, string> = {};
    (cell.sources || []).forEach(s => { initialSources[s.stockFromUid] = String(s.quantity ?? ''); });
    setSourcesMap(initialSources);
    setSumError(null);
    setIncomingLoaded(false);
    setIncoming([]);

    if (!stationUid) { setIncomingLoaded(true); return; }

    setLoadingIncoming(true);
    (async () => {
      try {
        const linksRes = await AxiosService.get(ConstantInfo.restApiStationDistributionLinks(stationUid));
        const linksData = linksRes.data as any;

        const candidates: Array<{ uid: string; name?: string; isDistribution?: boolean }> =
          Array.isArray(linksData?.incomingCandidates) ? linksData.incomingCandidates : [];
        const selectedUids: string[] =
          Array.isArray(linksData?.incomingSelected) ? linksData.incomingSelected : [];

        // В попапе пополнения показываем ТОЛЬКО связанные распределители
        // (incomingSelected). incomingCandidates используется как справочник имён.
        const nameByUid = new Map<string, string>();
        for (const c of candidates) {
          if (c?.uid) nameByUid.set(c.uid, c.name || c.uid);
        }

        const combined: Array<{ uid: string; name: string }> = selectedUids
          .filter(uid => !!uid)
          .map(uid => ({ uid, name: nameByUid.get(uid) || uid }));

        if (combined.length === 0) {
          setIncoming([]);
          setIncomingLoaded(true);
          setLoadingIncoming(false);
          return;
        }

        const withAvail: IncomingStation[] = [];
        for (const st of combined) {
          let available: number | null = null;
          let free: number | null = null;
          let reserved: number | null = null;
          let minStock: number | null = null;
          let criticalStock: number | null = null;
          try {
            if (cell.materialUid) {
              const res = await AxiosService.get(ConstantInfo.restApiRefillStockBalances(st.uid));
              const list = (res.data || []) as any[];
              const row = list.find(b => b.materialUid === cell.materialUid);
              free = row?.cleanQuantity ?? null;
              reserved = row?.reservedQuantity ?? null;
              available = free != null && reserved != null ? Math.max(0, free - reserved) : free;
            }
            const kuoRes = await AxiosService.get(ConstantInfo.restApiStockLevelControlReg(st.uid, cell.materialUid || ''));
            const kuo = kuoRes.data;
            if (kuo) { minStock = kuo.minStock ?? null; criticalStock = kuo.criticalStock ?? null; }
          } catch {}

          withAvail.push({
            uid: st.uid,
            name: st.name,
            available, free, reserved, minStock, criticalStock,
          });
        }
        setIncoming(withAvail);
      } catch (e) {
        console.error('Ошибка загрузки распределителей:', e);
        setIncoming([]);
      } finally {
        setIncomingLoaded(true);
        setLoadingIncoming(false);
      }
    })();
  }, [isOpen, cell, stationUid]);

  const maxRefill = useMemo(() => {
    if (cell.templateQuantity == null) return null;
    const fact = Number(cell.factQuantity ?? 0);
    return Math.max(0, Number(cell.templateQuantity) - fact);
  }, [cell.templateQuantity, cell.factQuantity]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (digits === '') { setQty(''); return; }
    let num = Number(digits);
    if (maxRefill != null && num > maxRefill) num = maxRefill;
    setQty(String(num));
  };

  const handleSourceChange = (stockFromUid: string, v: string) => {
    if (readOnly) return;
    const digits = v.replace(/[^0-9]/g, '');
    setSourcesMap(prev => ({ ...prev, [stockFromUid]: digits }));
  };

  const totalQty = Number(qty || 0);
  const totalSources = Object.values(sourcesMap).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSave = () => {
    if (readOnly) return;
    if (totalQty > 0 && totalSources > 0 && totalSources !== totalQty) {
      setSumError(`Сумма по складам (${totalSources}) не совпадает с количеством (${totalQty})`);
      return;
    }
    if (totalQty > 0 && totalSources === 0) {
      setSumError(`Укажите количество хотя бы по одному складу-отправителю`);
      return;
    }
    setSumError(null);

    const sources = Object.entries(sourcesMap)
      .filter(([, v]) => Number(v) > 0)
      .map(([stockFromUid, v]) => {
        const found = incoming.find(x => x.uid === stockFromUid);
        return {
          uid: (cell.sources || []).find(s => s.stockFromUid === stockFromUid)?.uid || `${cell.uid}-${stockFromUid}`,
          stockFromUid,
          stockFromName: found?.name || null,
          quantity: Number(v),
        };
      });

    onSave({
      refillQuantity: totalQty > 0 ? totalQty : null,
      sources,
    });
  };

  if (!isOpen) return null;

  const POPUP_W = 1080;
  const POPUP_H = 700;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
    color: '#2D4059', lineHeight: '17px', display: 'block', marginBottom: 8,
  };
  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
    color: '#2D4059', marginBottom: 12,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 10000 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{ width: POPUP_W, height: POPUP_H, backgroundColor: '#FFFFFF', borderRadius: 15, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative', padding: 30, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: '#2D4059', marginBottom: 20 }}>
            Редактирование строки пополнения
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25 }}>
            <div>
              <span style={labelStyle}>Номер ячейки</span>
              <FormField width={450} height={44} value={`${cell.columnNumber ?? 0}-${cell.numberCell ?? 0}`} type="input" disabled icon={StationIcon16Gray} iconActive={StationIcon16Blue} iconWidth={16} iconHeight={16} />
            </div>
            <div>
              <span style={labelStyle}>Станция-получатель</span>
              <FormField width={450} height={44} value={stationName || stationUid || ''} type="input" disabled icon={StationIcon16Gray} iconActive={StationIcon16Blue} iconWidth={16} iconHeight={16} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={labelStyle}>Номенклатура</span>
              <FormField width={930} height={44} value={cell.materialName || cell.materialNameSnapshot || ''} type="input" disabled icon={NomenclatureIcon16Gray} iconActive={NomenclatureIcon16Blue} iconWidth={16} iconHeight={18} />
            </div>
            <div>
              <span style={labelStyle}>Количество к загрузке{maxRefill != null ? ` (макс. ${maxRefill})` : ''}</span>
              <FormField width={450} height={44} value={qty} placeholder="0" type="input" inputType="text" disabled={readOnly} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} onChange={handleQtyChange} />
            </div>
            <div>
              <span style={labelStyle}>По схеме / В ячейке</span>
              <FormField width={450} height={44} value={`${cell.templateQuantity ?? '—'} / ${cell.factQuantity ?? '—'}`} type="input" disabled icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} />
            </div>
          </div>

          <div style={{ marginTop: 25, flex: 1, overflowY: 'auto' }}>
            <div style={sectionTitle}>Распределение по складам-отправителям</div>
            {loadingIncoming && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка складов...</div>
            )}
            {!loadingIncoming && incoming.length === 0 && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>
                Нет связанных распределительных складов для этой станции
              </div>
            )}
            {!loadingIncoming && incoming.map(st => {
              const srcVal = sourcesMap[st.uid] ?? '';
              return (
                <div key={st.uid} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10 }}>
                  <div style={{ width: 320 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>{st.name}</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(45,64,89,0.6)', marginTop: 2 }}>
                      Доступно: {st.available ?? '—'}
                      {st.criticalStock != null ? ` · крит.: ${st.criticalStock}` : ''}
                    </div>
                  </div>
                  <FormField width={200} height={40} value={srcVal} placeholder="0" type="input" inputType="text" disabled={readOnly} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} onChange={(e) => handleSourceChange(st.uid, e.target.value)} />
                </div>
              );
            })}

            <div style={{ marginTop: 15, display: 'flex', gap: 20, fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(45,64,89,0.7)' }}>
              <span>Итого по складам: <b style={{ color: '#2D4059' }}>{totalSources}</b></span>
              <span>Количество: <b style={{ color: '#2D4059' }}>{totalQty}</b></span>
            </div>
            {sumError && (
              <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FF3052' }}>{sumError}</div>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
            {!readOnly && (
              <button onClick={handleSave} style={{ width: 156, height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <img src={WriteIcon20White} alt="" style={{ width: 20, height: 20 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>Сохранить</span>
              </button>
            )}
            <button onClick={onClose} style={{ width: 111, height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#2D4059' }}>Закрыть</button>
          </div>

          <div style={{ position: 'absolute', bottom: 22, left: 25, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={InfoIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Информация</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RefillLinePopup;