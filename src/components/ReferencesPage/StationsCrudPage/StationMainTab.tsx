// StationMainTab.tsx — ПОЛНЫЙ ФАЙЛ (3 блока: Предприятие → Цех → Участок, холдинг автоматом)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import Icon6 from '../../../assets/References/NomenclatureCreatePage/Icon6.svg';
import Icon8 from '../../../assets/References/NomenclatureCreatePage/Icon8.svg';
import Icon9 from '../../../assets/References/NomenclatureCreatePage/Icon9.svg';
import Icon21 from '../../../assets/References/NomenclatureCreatePage/Icon21.svg';
import Icon22 from '../../../assets/References/NomenclatureCreatePage/Icon22.svg';
import Icon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';

export interface StationMainTabProps {
  uid?: string; code: number; name: string;
  modelId: string; modelName: string;
  article: string; typeName: string; revision: string;
  serialNumber: string; productionDate: string;
  modelImageUrl: string;
  holdingId: number | null; holdingName: string;
  enterpriseId: number | null; enterpriseName: string;
  workshopId: number | null; workshopName: string;
  sectionId: number | null; sectionName: string;
  setHoldingId: (v: number | null) => void; setHoldingName: (v: string) => void;
  setEnterpriseId: (v: number | null) => void; setEnterpriseName: (v: string) => void;
  setWorkshopId: (v: number | null) => void; setWorkshopName: (v: string) => void;
  setSectionId: (v: number | null) => void; setSectionName: (v: string) => void;
  hasError: boolean; setHasError: (v: boolean) => void;
  isTmc: boolean; setIsTmc: (v: boolean) => void;
  isSgd: boolean; setIsSgd: (v: boolean) => void;
  isOk: boolean; setIsOk: (v: boolean) => void;
  isAdditionalModule: boolean; setIsAdditionalModule: (v: boolean) => void;
  hasAdditionalModule: boolean; setHasAdditionalModule: (v: boolean) => void;
  status: string; setStatus: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  ipAddress: string; setIpAddress: (v: string) => void;
  networkPort: number | ''; setNetworkPort: (v: number | '') => void;
  parentUid: string; setParentUid: (v: string) => void;
  setName: (v: string) => void;
  setSerialNumber: (v: string) => void;
  setProductionDate: (v: string) => void;
  openPopup: (type: PopupType, filter?: string) => void;
  onEnterpriseSelected?: (enterpriseId: number, enterpriseName: string) => void;
  isEdit: boolean;
  [key: string]: any;
}

const StationMainTab: React.FC<StationMainTabProps> = (props) => {
  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', position: 'relative' };

  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const COL_GAP = 100;
  const ROW_GAP = 30;
  const START_LEFT = 40;
  const START_TOP = 30;

  const fieldBaseStyle = (locked?: boolean): React.CSSProperties => ({
    width: FIELD_WIDTH, height: FIELD_HEIGHT, borderRadius: 10, marginTop: 11,
    display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    outline: 'none', backgroundColor: locked ? '#F5F6FA' : '#FFFFFF',
    position: 'relative', boxSizing: 'border-box',
    border: locked ? '1px solid rgba(102, 110, 254, 0.5)' : '1px solid rgba(102, 110, 254, 0.15)',
    cursor: locked ? 'not-allowed' : 'default',
  });

  const inputStyle: React.CSSProperties = { width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none', marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', backgroundColor: 'transparent' };

  const getColLeft = (col: number) => START_LEFT + col * (FIELD_WIDTH + COL_GAP);
  const getRowTop = (row: number) => START_TOP + row * (FIELD_HEIGHT + 11 + ROW_GAP + 14);

  const TOP_BLOCK_TOP = 165;
  const TOP_BLOCK_HEIGHT = 234;
  const TOP_BLOCK_WIDTH = 1740;
  const BOTTOM_BLOCK_TOP = TOP_BLOCK_TOP + TOP_BLOCK_HEIGHT + 30;
  const BOTTOM_BLOCK_HEIGHT = 300;

  const [centerMode, setCenterMode] = useState<'main' | 'placement'>('main');
  const [showAccountingChecklist, setShowAccountingChecklist] = useState(false);
  const checklistRef = useRef<HTMLDivElement>(null);
  const checklistContainerRef = useRef<HTMLDivElement>(null);
  const [checklistStyle, setChecklistStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!showAccountingChecklist) return;
    const h = (e: MouseEvent) => {
      if (checklistRef.current && !checklistRef.current.contains(e.target as Node)) {
        setShowAccountingChecklist(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showAccountingChecklist]);

  const updateChecklistPosition = () => {
    if (checklistContainerRef.current) {
      const rect = checklistContainerRef.current.getBoundingClientRect();
      setChecklistStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 10001 });
    }
  };

  useEffect(() => { if (showAccountingChecklist) updateChecklistPosition(); }, [showAccountingChecklist]);

  const placementText = [props.holdingName, props.enterpriseName, props.workshopName, props.sectionName].filter(Boolean).join('; ') || 'Выберите размещение';

  const accountingItems = [
    { label: 'ТМЦ', value: props.isTmc, setter: () => props.setIsTmc(!props.isTmc) },
    { label: 'СГД', value: props.isSgd, setter: () => props.setIsSgd(!props.isSgd) },
    { label: 'ОК', value: props.isOk, setter: () => props.setIsOk(!props.isOk) },
    { label: 'Ошибка', value: props.hasError, setter: () => props.setHasError(!props.hasError) },
    { label: 'Доп. модуль', value: props.isAdditionalModule, setter: () => props.setIsAdditionalModule(!props.isAdditionalModule) },
    { label: 'Имеет доп. модуль', value: props.hasAdditionalModule, setter: () => props.setHasAdditionalModule(!props.hasAdditionalModule) },
  ];

  const accountingLabels = accountingItems.filter(item => item.value).map(item => item.label);
  const accountingText = accountingLabels.length > 0 ? accountingLabels.join(', ') : 'Выберите вид учёта';

  const renderCenterContent = () => {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <motion.div key="main" initial={false} animate={{ x: centerMode === 'main' ? 0 : -536 }} transition={{ type: 'tween', duration: 0.3 }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '25px 30px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Размещение:</span>
          </div>
          <div onClick={() => setCenterMode('placement')} style={{ width: '100%', height: 44, borderRadius: 10, marginTop: 11, border: props.enterpriseId ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: props.enterpriseId ? '#666EFE' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
            {placementText}
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: 'rgba(45, 64, 89, 0.3)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: 2, left: 2 }} />
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Выдача по операционной карте</span>
          </div>
          <div style={{ marginTop: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ ...labelStyle, marginLeft: 9 }}>Вид учёта станции:</span>
            </div>
            <div ref={checklistContainerRef} style={{ position: 'relative' }}>
              <div onClick={() => { updateChecklistPosition(); setShowAccountingChecklist(!showAccountingChecklist); }}
                style={{ width: '100%', height: 44, borderRadius: 10, marginTop: 11, border: accountingLabels.length > 0 ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: accountingLabels.length > 0 ? '#666EFE' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                {accountingText}
                <motion.img src={Icon9} alt="" style={{ width: 18, height: 18, flexShrink: 0, marginLeft: 'auto', transition: 'transform 0.3s ease', transform: showAccountingChecklist ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div key="placement" initial={false} animate={{ x: centerMode === 'placement' ? 0 : 536 }} transition={{ type: 'tween', duration: 0.3 }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '25px 30px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setCenterMode('main')} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#2D4059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ ...labelStyle }}>Размещение станции</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Предприятие</span>
            <div onClick={() => {
              props.openPopup('enterprise');
            }} style={{ width: '100%', height: 44, borderRadius: 10, border: props.enterpriseId ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 15, paddingRight: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: props.enterpriseId ? '#666EFE' : '#9CA3AF', boxSizing: 'border-box' }}>
              <img src={props.enterpriseId ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.enterpriseName || 'Выберите предприятие'}</span>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Цех</span>
            <div onClick={() => props.enterpriseId && props.openPopup('workshop', String(props.enterpriseId))} style={{ width: '100%', height: 44, borderRadius: 10, border: props.workshopId ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 15, paddingRight: 13, cursor: props.enterpriseId ? 'pointer' : 'not-allowed', opacity: props.enterpriseId ? 1 : 0.5, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: props.workshopId ? '#666EFE' : '#9CA3AF', boxSizing: 'border-box' }}>
              <img src={props.workshopId ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.enterpriseId ? (props.workshopName || 'Выберите цех') : 'Сначала выберите предприятие'}</span>
            </div>
          </div>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Участок</span>
            <div onClick={() => props.workshopId && props.openPopup('section', String(props.workshopId))} style={{ width: '100%', height: 44, borderRadius: 10, border: props.sectionId ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 15, paddingRight: 13, cursor: props.workshopId ? 'pointer' : 'not-allowed', opacity: props.workshopId ? 1 : 0.5, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: props.sectionId ? '#666EFE' : '#9CA3AF', boxSizing: 'border-box' }}>
              <img src={props.sectionId ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.workshopId ? (props.sectionName || 'Выберите участок') : 'Сначала выберите цех'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      {/* ВЕРХНИЙ БЛОК */}
      <div style={{ position: 'absolute', top: TOP_BLOCK_TOP, left: 30, width: TOP_BLOCK_WIDTH, height: TOP_BLOCK_HEIGHT, ...blockStyle }}>
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(0) }}>
          <span style={labelStyle}>Код:</span>
          <div style={fieldBaseStyle(true)}><span style={{ marginLeft: 0, color: '#666EFE', opacity: 0.5 }}>{String(props.code).padStart(4, '0')}</span></div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(1) }}>
          <span style={labelStyle}>Модель:</span>
          <div onClick={() => props.openPopup('stationModel')} style={{ ...fieldBaseStyle(), cursor: 'pointer', border: props.modelId ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)' }}>
            <img src={props.modelId ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, position: 'absolute', left: 15 }} />
            <span style={{ marginLeft: 44, color: props.modelId ? '#666EFE' : '#A0A3BD' }}>{props.modelName || 'Выберите модель'}</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(2) }}>
          <span style={labelStyle}>Артикул:</span>
          <div style={fieldBaseStyle(true)}><span style={{ marginLeft: 0, color: '#666EFE', opacity: props.article ? 1 : 0.5 }}>{props.article || '—'}</span></div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(3) }}>
          <span style={labelStyle}>Дата производства:</span>
          <div style={{ ...fieldBaseStyle(), border: props.productionDate ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)' }}>
            <input type="date" style={{ ...inputStyle, color: props.productionDate ? '#666EFE' : '#A0A3BD', marginLeft: 0 }} value={props.productionDate} onChange={e => props.setProductionDate(e.target.value)} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(0) }}>
          <span style={labelStyle}>Наименование:</span>
          <div style={{ ...fieldBaseStyle(), border: props.name ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)' }}>
            <img src={props.name ? Icon22 : Icon21} alt="" style={{ width: 16, height: 16, position: 'absolute', left: 14 }} />
            <input style={inputStyle} value={props.name} onChange={e => props.setName(e.target.value)} placeholder="Введите название" />
            {props.name && <button onClick={() => props.setName('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}
          </div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(1) }}>
          <span style={labelStyle}>Тип:</span>
          <div style={fieldBaseStyle(true)}><span style={{ marginLeft: 0, color: '#666EFE', opacity: props.typeName ? 1 : 0.5 }}>{props.typeName || '—'}</span></div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(2) }}>
          <span style={labelStyle}>Ревизия:</span>
          <div style={fieldBaseStyle(true)}><span style={{ marginLeft: 0, color: '#666EFE', opacity: props.revision ? 1 : 0.5 }}>{props.revision || '—'}</span></div>
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(3) }}>
          <span style={labelStyle}>Серийный номер:</span>
          <div style={{ ...fieldBaseStyle(), border: props.serialNumber ? '1px solid #666EFE' : '1px solid rgba(102,110,254,0.15)' }}>
            <input style={inputStyle} value={props.serialNumber} onChange={e => props.setSerialNumber(e.target.value)} placeholder="Введите серийный номер" />
            {props.serialNumber && <button onClick={() => props.setSerialNumber('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}
          </div>
        </div>
      </div>

      {/* НИЖНИЕ ТРИ БЛОКА */}
      <div style={{ position: 'absolute', top: BOTTOM_BLOCK_TOP, left: 30, right: 30, height: BOTTOM_BLOCK_HEIGHT, display: 'flex', gap: 30 }}>
        {/* ЛЕВЫЙ — Изображение */}
        <div style={{ width: 300, height: BOTTOM_BLOCK_HEIGHT, ...blockStyle, padding: 0 }}>
          <div style={{ position: 'absolute', top: 30, left: 40 }}><span style={labelStyle}>Изображение:</span></div>
          <div style={{ position: 'absolute', top: 55, left: 40, width: 220, height: 220, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#F5F6FA', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {props.modelImageUrl ? <img src={props.modelImageUrl} alt="Модель" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображения</span>}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНЫЙ — Размещение и вид учёта */}
        <div style={{ width: 536, height: BOTTOM_BLOCK_HEIGHT, ...blockStyle, overflow: 'hidden' }}>
          {renderCenterContent()}
        </div>

        {/* ПРАВЫЙ — Описание */}
        <div style={{ width: 844, height: BOTTOM_BLOCK_HEIGHT, ...blockStyle, padding: 0 }}>
          <div style={{ position: 'absolute', top: 30, left: 30 }}>
            <span style={labelStyle}>Описание:</span>
          </div>
          <div style={{
            position: 'absolute', top: 55, left: 30,
            width: 784, height: 212, borderRadius: 10,
            border: props.description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
            backgroundColor: '#FFFFFF',
          }}>
            <textarea
              style={{
                width: '100%', height: '100%', border: 'none', outline: 'none',
                padding: '15px 35px 15px 15px', fontFamily: 'Inter, sans-serif',
                fontSize: 14, fontWeight: 500,
                color: props.description ? '#666EFE' : '#A0A3BD',
                backgroundColor: 'transparent', resize: 'none',
                borderRadius: 10, boxSizing: 'border-box',
              }}
              value={props.description}
              onChange={e => props.setDescription(e.target.value)}
              placeholder="Введите описание станции"
            />
            {props.description && (
              <button
                onClick={() => props.setDescription('')}
                style={{ position: 'absolute', top: 15, right: 10, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              >
                <img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Чеклист (портал) */}
      <AnimatePresence>
        {showAccountingChecklist && (
          <motion.div ref={checklistRef} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            style={{ ...checklistStyle, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', padding: '4px 0', position: 'fixed' }}
            onClick={e => e.stopPropagation()}>
            {accountingItems.map(item => (
              <div key={item.label} onClick={(e) => { e.stopPropagation(); item.setter(); }}
                style={{ height: 40, display: 'flex', alignItems: 'center', paddingLeft: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', backgroundColor: item.value ? '#F0F1FF' : '#FFFFFF' }}
                onMouseEnter={(e) => { if (!item.value) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }}
                onMouseLeave={(e) => { if (!item.value) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: item.value ? 'none' : '2px solid rgba(45,64,89,0.3)', backgroundColor: item.value ? '#666EFE' : 'transparent', marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.value && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                {item.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StationMainTab;