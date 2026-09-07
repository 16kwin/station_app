// StationMainTab.tsx — ПОЛНЫЙ ФАЙЛ (с автокоррекцией при вводе)
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import FormField from '../../elements/FormField';
import Checkbox from '../../elements/Checkbox';
import CalendarPopup from '../../elements/CalendarPopup';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
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
  setModelId?: (v: string) => void; setModelName?: (v: string) => void;
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
  const BOTTOM_BLOCK_HEIGHT = 300;

  const [centerMode, setCenterMode] = useState<'main' | 'placement' | 'accounting'>('main');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarFieldRef = useRef<HTMLDivElement>(null);
  const [dateInputValue, setDateInputValue] = useState('');

  const [modelOptions, setModelOptions] = useState<{ uid: string; name: string }[]>([]);
  const [enterpriseOptions, setEnterpriseOptions] = useState<{ uid: string; name: string }[]>([]);
  const [workshopOptions, setWorkshopOptions] = useState<{ uid: string; name: string }[]>([]);
  const [sectionOptions, setSectionOptions] = useState<{ uid: string; name: string }[]>([]);

  useEffect(() => {
    fetchModelOptions();
    fetchEnterpriseOptions();
  }, []);

  useEffect(() => {
    if (props.enterpriseId) {
      fetchWorkshopOptions(props.enterpriseId);
    } else {
      setWorkshopOptions([]);
    }
  }, [props.enterpriseId]);

  useEffect(() => {
    if (props.workshopId) {
      fetchSectionOptions(props.workshopId);
    } else {
      setSectionOptions([]);
    }
  }, [props.workshopId]);

  useEffect(() => {
    if (props.productionDate) {
      const converted = convertISOToDotFormat(props.productionDate);
      if (converted !== dateInputValue) {
        setDateInputValue(converted);
      }
    }
  }, [props.productionDate]);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClick = (e: MouseEvent) => {
      if (calendarFieldRef.current && !calendarFieldRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

  const getDaysInMonth = (month: number, year: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2) {
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        return 29;
      }
    }
    return daysInMonth[month - 1] || 31;
  };

  const formatDateInput = (input: string): string => {
    if (!input || input === '') return '';
    
    let digits = input.replace(/\D/g, '');
    digits = digits.slice(0, 8);
    
    if (digits.length === 0) return '';
    
    let day = '';
    let month = '';
    let year = '';
    
    // Парсим день
    if (digits.length >= 1) {
      day = digits.slice(0, 2);
    }
    
    // Парсим месяц
    if (digits.length >= 3) {
      month = digits.slice(2, 4);
    }
    
    // Парсим год
    if (digits.length >= 5) {
      year = digits.slice(4, 8);
    }
    
    // Автокоррекция
    let dayNum = parseInt(day) || 0;
    let monthNum = parseInt(month) || 0;
    let yearNum = parseInt(year) || new Date().getFullYear();
    
    // Корректируем день
    if (dayNum > 31) dayNum = 31;
    if (dayNum < 1 && day.length === 2) dayNum = 1;
    
    // Корректируем месяц
    if (monthNum > 12) monthNum = 12;
    if (monthNum < 1 && month.length === 2) monthNum = 1;
    
    // Корректируем день относительно месяца
    if (monthNum > 0 && dayNum > 0) {
      const maxDays = getDaysInMonth(monthNum, yearNum);
      if (dayNum > maxDays) dayNum = maxDays;
    }
    
    // Собираем результат
    let result = '';
    
    if (day.length === 1) {
      result += String(dayNum);
    } else if (day.length === 2) {
      result += String(dayNum).padStart(2, '0');
    }
    
    if (month.length === 1) {
      result += '.' + String(monthNum);
    } else if (month.length === 2) {
      result += '.' + String(monthNum).padStart(2, '0');
    }
    
    if (year.length > 0) {
      result += '.' + year;
    }
    
    return result;
  };

  const convertISOToDotFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('.')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    if (input === '' || input === null) {
      setDateInputValue('');
      props.setProductionDate('');
      return;
    }
    
    const formatted = formatDateInput(input);
    setDateInputValue(formatted);
    
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = formatted.match(dateRegex);
    
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const maxDays = getDaysInMonth(month, year);
      
      if (day >= 1 && day <= maxDays && month >= 1 && month <= 12) {
        props.setProductionDate(formatted);
      }
    } else {
      props.setProductionDate(formatted);
    }
  };

  const fetchModelOptions = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationModels);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setModelOptions(items.map((item: any) => ({ uid: item.uid, name: item.name })));
    } catch (e) { console.error(e); }
  };

  const fetchEnterpriseOptions = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiEnterprises);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setEnterpriseOptions(items.map((item: any) => ({ uid: String(item.id), name: item.name })));
    } catch (e) { console.error(e); }
  };

  const fetchWorkshopOptions = async (entId: number) => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiWorkshops);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setWorkshopOptions(items.filter((w: any) => w.enterpriseId === entId).map((w: any) => ({ uid: String(w.id), name: w.name })));
    } catch (e) { console.error(e); }
  };

  const fetchSectionOptions = async (wsId: number) => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiSections);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setSectionOptions(items.filter((s: any) => s.workshopId === wsId).map((s: any) => ({ uid: String(s.id), name: s.name })));
    } catch (e) { console.error(e); }
  };

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
            disabled
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
            disabled
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
        <div ref={calendarFieldRef} style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(1) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Дата производства:"
            icon={CalendarIcon16Gray}
            iconActive={CalendarIcon16Blue}
            value={dateInputValue}
            placeholder="__.__.____"
            type="calendar"
            onChange={handleDateChange}
            onCalendarClick={() => setShowCalendar(!showCalendar)}
            iconWidth={16}
            iconHeight={18}
          />
          <CalendarPopup
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
            onConfirm={(dateStr) => {
              props.setProductionDate(dateStr);
              setDateInputValue(dateStr);
            }}
            selectedDate={dateInputValue}
            anchorRef={calendarFieldRef}
          />
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
            searchOptions={modelOptions}
            onSelectOption={(uid, name) => {
              props.setModelId?.(uid);
              props.setModelName?.(name);
            }}
            onOpenFullList={() => props.openPopup('stationModel')}
            selectIconWidth={16}
            selectIconHeight={16}
            searchTitle="Найденная модель"
            searchNotFoundText="Модели не найдены"
          />
        </div>
        <div style={{ position: 'absolute', top: getRowTop(1), left: getColLeft(2) }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Тип станции:"
            icon={TypeIcon16LightBlue}
            value={props.typeName || '—'}
            type="input"
            disabled
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
            disabled
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
                      searchOptions={enterpriseOptions}
                      onSelectOption={(uid, name) => {
                        const entId = Number(uid);
                        props.setEnterpriseId(entId);
                        props.setEnterpriseName(name);
                        props.setWorkshopId(null);
                        props.setWorkshopName('');
                        props.setSectionId(null);
                        props.setSectionName('');
                      }}
                      onOpenFullList={() => props.openPopup('enterprise')}
                      selectIconWidth={18}
                      selectIconHeight={18}
                      searchTitle="Найденное предприятие"
                      searchNotFoundText="Предприятия не найдены"
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
                      disabled={!props.enterpriseId}
                      searchOptions={workshopOptions}
                      onSelectOption={(uid, name) => {
                        props.setWorkshopId(Number(uid));
                        props.setWorkshopName(name);
                        props.setSectionId(null);
                        props.setSectionName('');
                      }}
                      onOpenFullList={() => props.enterpriseId && props.openPopup('workshop', String(props.enterpriseId))}
                      selectIconWidth={17}
                      selectIconHeight={18}
                      searchTitle="Найденный цех"
                      searchNotFoundText="Цеха не найдены"
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
                      disabled={!props.workshopId}
                      searchOptions={sectionOptions}
                      onSelectOption={(uid, name) => {
                        props.setSectionId(Number(uid));
                        props.setSectionName(name);
                      }}
                      onOpenFullList={() => props.workshopId && props.openPopup('section', String(props.workshopId))}
                      selectIconWidth={20}
                      selectIconHeight={16}
                      searchTitle="Найденный участок"
                      searchNotFoundText="Участки не найдены"
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
                        <Checkbox checked={item.value} onChange={item.setter} />
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