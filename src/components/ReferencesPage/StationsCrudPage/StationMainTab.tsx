// StationMainTab.tsx — ПОЛНЫЙ ФАЙЛ (иконки ArrowIcon18BlackBack, Manufacturer, Workshop, Section)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import FormField from '../../elements/FormField';
import Checkbox from '../../elements/Checkbox';
import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import CalendarIcon16Blue from '../../../assets/Icons/CalendarIcons/CalendarIcon16Blue.svg';
import ModelIcon16Gray from '../../../assets/Icons/ModelIcons/ModelIcon16Gray.svg';
import ModelIcon16Blue from '../../../assets/Icons/ModelIcons/ModelIcon16Blue.svg';
import TypeIcon16LightBlue from '../../../assets/Icons/TypeIcons/TypeIcon16LightBlue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import RevisionIcon18LightBlue from '../../../assets/Icons/RevisionIcons/RevisionIcon18LightBlue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import PlacementIcon16Gray from '../../../assets/Icons/PlacementIcons/PlacementIcon16Gray.svg';
import PlacementIcon16Blue from '../../../assets/Icons/PlacementIcons/PlacementIcon16Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import ArrowIcon18Gray from '../../../assets/Icons/ArrowIcons/ArrowIcon18Gray.svg';
import ArrowIcon18Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon18Blue.svg';
import ArrowIcon18BlackBack from '../../../assets/Icons/ArrowIcons/ArrowIcon18BlackBack.svg';
import ManufacturerIcon18Gray from '../../../assets/Icons/ManufacturerIcons/ManufacturerIcon18Gray.svg';
import ManufacturerIcon18Blue from '../../../assets/Icons/ManufacturerIcons/ManufacturerIcon18Blue.svg';
import WorkshopIcon17Gray from '../../../assets/Icons/WorkshopIcons/WorkshopIcon17Gray.svg';
import WorkshopIcon17Blue from '../../../assets/Icons/WorkshopIcons/WorkshopIcon17Blue.svg';
import SectionIcon20Gray from '../../../assets/Icons/SectionIcons/SectionIcon20Gray.svg';
import SectionIcon20Blue from '../../../assets/Icons/SectionIcons/SectionIcon20Blue.svg';

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
  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', lineHeight: '17px' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', position: 'relative', flexShrink: 0 };

  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const COL_GAP = 100;
  const START_LEFT = 40;
  const START_TOP = 30;
  const ROW_HEIGHT = 99;

  const getColLeft = (col: number) => START_LEFT + col * (FIELD_WIDTH + COL_GAP);
  const getRowTop = (row: number) => START_TOP + row * ROW_HEIGHT;

  const TOP_BLOCK_HEIGHT = 234;
  const BOTTOM_BLOCK_TOP = TOP_BLOCK_HEIGHT + 30;
  const BOTTOM_BLOCK_HEIGHT = 300;

  const [centerMode, setCenterMode] = useState<'main' | 'placement' | 'accounting'>('main');
  const [showCalendar, setShowCalendar] = useState(false);

  const placementText = [props.holdingName, props.enterpriseName, props.workshopName, props.sectionName].filter(Boolean).join('; ') || 'Выберите размещение';

  const accountingItems = [
    { label: 'Товарно-материальная ценность (ТМЦ)', value: props.isTmc, setter: () => props.setIsTmc(!props.isTmc) },
    { label: 'Склад готовых деталей (СГД)', value: props.isSgd, setter: () => props.setIsSgd(!props.isSgd) },
    { label: 'Выдача по операционной карте (ОК)', value: props.isOk, setter: () => props.setIsOk(!props.isOk) },
    { label: 'Имеет дополнительный модуль', value: props.hasAdditionalModule, setter: () => props.setHasAdditionalModule(!props.hasAdditionalModule) },
  ];

  const accountingLabels = accountingItems.filter(item => item.value).map(item => item.label);
  const accountingText = accountingLabels.length > 0 ? accountingLabels.join(', ') : 'Выберите вид учёта';

  const selectFieldStyle = (hasValue: boolean): React.CSSProperties => ({
    width: 456,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 14,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    border: hasValue ? '1px solid #666EFE' : '1px solid #A0A3BD',
    cursor: 'pointer',
  });

  const selectTextColor = (hasValue: boolean): string => hasValue ? '#666EFE' : '#A0A3BD';

  const screenLabelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D4059',
    lineHeight: '17px',
    display: 'block',
  };

  const screenTitleStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D4059',
    lineHeight: '17px',
  };

  const checkboxTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
    lineHeight: '18px',
  };

  const backButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 14,
    left: 17,
    width: 24,
    height: 24,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 30 }}>
      {/* ВЕРХНИЙ БЛОК */}
      <div style={{ width: '100%', height: TOP_BLOCK_HEIGHT, ...blockStyle }}>
        {/* Колонка 1: Код + Артикул */}
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(0) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Код:"
            icon={CodeIcon20LightBlue}
            value={String(props.code).padStart(4, '0')}
            type="input"
            locked
            iconWidth={20}
            iconHeight={14}
          />
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(0) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Артикул:"
            icon={ArticleIcon18Blue}
            value={props.article || '—'}
            type="input"
            locked
            iconWidth={18}
            iconHeight={18}
          />
        </div>

        {/* Колонка 2: Наименование + Дата производства */}
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(1) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Наименование:"
            icon={NameIcon18Gray}
            iconActive={NameIcon18Blue}
            value={props.name}
            placeholder="Введите название"
            type="input"
            onChange={e => props.setName(e.target.value)}
            onClear={() => props.setName('')}
            iconWidth={18}
            iconHeight={18}
          />
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(1) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Дата производства:"
            icon={CalendarIcon16Gray}
            iconActive={CalendarIcon16Blue}
            value={props.productionDate}
            placeholder="Выберите дату"
            type="calendar"
            onCalendarClick={() => setShowCalendar(!showCalendar)}
            iconWidth={16}
            iconHeight={18}
          />
          {showCalendar && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4 }}>
              <input
                type="date"
                value={props.productionDate}
                onChange={e => { props.setProductionDate(e.target.value); setShowCalendar(false); }}
                autoFocus
                style={{ width: 340, height: 44, borderRadius: 10, border: '1px solid #666EFE', padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Колонка 3: Модель станции + Тип станции */}
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(2) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Модель станции:"
            icon={ModelIcon16Gray}
            iconActive={ModelIcon16Blue}
            value={props.modelName}
            placeholder="Выберите модель"
            type="select"
            onClick={() => props.openPopup('stationModel')}
            selectIconWidth={16}
            selectIconHeight={16}
          />
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(2) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Тип станции:"
            icon={TypeIcon16LightBlue}
            value={props.typeName || '—'}
            type="input"
            locked
            iconWidth={16}
            iconHeight={16}
          />
        </div>

        {/* Колонка 4: Серийный номер + Ревизия */}
        <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(3) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Серийный номер:"
            icon={CodeIcon20Gray}
            iconActive={CodeIcon20Blue}
            value={props.serialNumber}
            placeholder="Введите серийный номер"
            type="input"
            onChange={e => props.setSerialNumber(e.target.value)}
            onClear={() => props.setSerialNumber('')}
            iconWidth={20}
            iconHeight={20}
          />
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(3) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Ревизия:"
            icon={RevisionIcon18LightBlue}
            value={props.revision || '—'}
            type="input"
            locked
            iconWidth={18}
            iconHeight={18}
          />
        </div>
      </div>

      {/* НИЖНИЕ ТРИ БЛОКА */}
      <div style={{ width: '100%', height: BOTTOM_BLOCK_HEIGHT, display: 'flex', gap: 30, flexShrink: 0 }}>
        {/* ЛЕВЫЙ — Изображение */}
        <div style={{ width: 300, height: BOTTOM_BLOCK_HEIGHT, ...blockStyle }}>
          <div style={{ position: 'absolute', top: 30, left: 40 }}><span style={labelStyle}>Изображение:</span></div>
          <div style={{ position: 'absolute', top: 55, left: 40, width: 220, height: 220, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#F5F6FA', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {props.modelImageUrl ? <img src={props.modelImageUrl} alt="Модель" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображения</span>}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНЫЙ — Размещение и вид учёта (536×300) */}
        <div style={{ width: 536, height: 300, ...blockStyle, overflow: 'hidden', flexShrink: 0 }}>
          {/* Главный экран */}
          <motion.div
            animate={{ x: centerMode === 'main' ? 0 : -536 }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{ position: 'absolute', top: 0, left: 0, width: 536, height: '100%', boxSizing: 'border-box' }}
          >
            {/* Размещение */}
            <div style={{ position: 'absolute', top: 45, left: 40 }}>
              <span style={labelStyle}>Размещение:</span>
            </div>
            <div onClick={() => setCenterMode('placement')} style={{ position: 'absolute', top: 73, left: 40, ...selectFieldStyle(!!props.enterpriseId) }}>
              <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
                <img src={props.enterpriseId ? PlacementIcon16Blue : PlacementIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectTextColor(!!props.enterpriseId) }}>{placementText}</span>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>
                <img src={props.enterpriseId ? ArrowIcon18Blue : ArrowIcon18Gray} alt="" style={{ width: 18, height: 18 }} />
              </div>
            </div>

            {/* Вид учёта */}
            <div style={{ position: 'absolute', top: 73 + 44 + 55, left: 40 }}>
              <span style={labelStyle}>Вид учёта станции:</span>
            </div>
            <div onClick={() => setCenterMode('accounting')} style={{ position: 'absolute', top: 73 + 44 + 55 + 17 + 11, left: 40, ...selectFieldStyle(accountingLabels.length > 0) }}>
              <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
                <img src={accountingLabels.length > 0 ? AccountingIcon16Blue : AccountingIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectTextColor(accountingLabels.length > 0) }}>{accountingText}</span>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>
                <img src={accountingLabels.length > 0 ? ArrowIcon18Blue : ArrowIcon18Gray} alt="" style={{ width: 18, height: 18 }} />
              </div>
            </div>
          </motion.div>

          {/* Второй экран */}
          <motion.div
            animate={{ x: centerMode !== 'main' ? 0 : 536 }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{ position: 'absolute', top: 0, left: 0, width: 536, height: '100%', boxSizing: 'border-box' }}
          >
            {centerMode === 'placement' && (
              <>
                <button onClick={() => setCenterMode('main')} style={backButtonStyle}>
                  <img src={ArrowIcon18BlackBack} alt="" style={{ width: 18, height: 18 }} />
                </button>

                <div style={{ position: 'absolute', top: 17, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 17 }}>
                  <span style={screenTitleStyle}>Размещение станции</span>
                </div>

                <div style={{ position: 'absolute', top: 17 + 17 + 17, left: 40, width: 456 }}>
                  <span style={screenLabelStyle}>Предприятие:</span>
                  <div style={{ marginTop: 6 }}>
                    <FormField
                      width={456} height={44}
                      icon={ManufacturerIcon18Gray}
                      iconActive={ManufacturerIcon18Blue}
                      value={props.enterpriseName}
                      placeholder="Выберите предприятие"
                      type="select"
                      onClick={() => props.openPopup('enterprise')}
                      selectIconWidth={18}
                      selectIconHeight={18}
                    />
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 17 + 17 + 17 + 17 + 6 + 44 + 11, left: 40, width: 456 }}>
                  <span style={screenLabelStyle}>Цех:</span>
                  <div style={{ marginTop: 6 }}>
                    <FormField
                      width={456} height={44}
                      icon={WorkshopIcon17Gray}
                      iconActive={WorkshopIcon17Blue}
                      value={props.workshopName}
                      placeholder={props.enterpriseId ? 'Выберите цех' : 'Сначала выберите предприятие'}
                      type="select"
                      locked={!props.enterpriseId}
                      onClick={() => props.enterpriseId && props.openPopup('workshop', String(props.enterpriseId))}
                      selectIconWidth={17}
                      selectIconHeight={18}
                    />
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 17 + 17 + 17 + 17 + 6 + 44 + 11 + 17 + 6 + 44 + 11, left: 40, width: 456 }}>
                  <span style={screenLabelStyle}>Участок:</span>
                  <div style={{ marginTop: 6 }}>
                    <FormField
                      width={456} height={44}
                      icon={SectionIcon20Gray}
                      iconActive={SectionIcon20Blue}
                      value={props.sectionName}
                      placeholder={props.workshopId ? 'Выберите участок' : 'Сначала выберите цех'}
                      type="select"
                      locked={!props.workshopId}
                      onClick={() => props.workshopId && props.openPopup('section', String(props.workshopId))}
                      selectIconWidth={20}
                      selectIconHeight={16}
                    />
                  </div>
                </div>
              </>
            )}
            {centerMode === 'accounting' && (
              <>
                <button onClick={() => setCenterMode('main')} style={backButtonStyle}>
                  <img src={ArrowIcon18BlackBack} alt="" style={{ width: 18, height: 18 }} />
                </button>

                <div style={{ position: 'absolute', top: 17, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 17 }}>
                  <span style={screenTitleStyle}>Вид учёта станции</span>
                </div>

                {accountingItems.map((item, index) => {
                  const rowTop = 17 + 17 + 35 + index * (18 + 36);
                  return (
                    <div key={item.label} style={{ position: 'absolute', top: rowTop, left: 70, height: 18, display: 'flex', alignItems: 'center', width: 536 - 70 - 83, boxSizing: 'border-box' }}>
                      <span style={checkboxTextStyle}>{item.label}</span>
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Checkbox checked={item.value} onChange={item.setter} size={18} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        </div>

        {/* ПРАВЫЙ — Описание */}
        <div style={{ flex: 1, height: BOTTOM_BLOCK_HEIGHT, ...blockStyle, minWidth: 0 }}>
          <div style={{ position: 'absolute', top: 30, left: 30 }}>
            <span style={labelStyle}>Описание:</span>
          </div>
          <div style={{
            position: 'absolute', top: 55, left: 30, right: 30,
            height: 212, borderRadius: 10,
            border: props.description ? '1px solid #666EFE' : '1px solid #A0A3BD',
            backgroundColor: '#FFFFFF',
          }}>
            <div style={{ position: 'absolute', top: 14, left: 13, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={props.description ? DescriptionIcon16Blue : DescriptionIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
            </div>
            <textarea
              style={{
                width: '100%', height: '100%', border: 'none', outline: 'none',
                padding: '14px 35px 14px 42px', fontFamily: 'Inter, sans-serif',
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
                style={{ position: 'absolute', top: 13, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="#666EFE" fillOpacity="0.15" />
                  <path d="M6 6L12 12M12 6L6 12" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationMainTab;