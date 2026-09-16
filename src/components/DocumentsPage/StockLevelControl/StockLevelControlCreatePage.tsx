// StockLevelControlCreatePage.tsx — форма документа "Контроль уровня остатков" (с чтением query для быстрого создания)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import FormField from '../../elements/FormField';
import CalendarPopup from '../../elements/CalendarPopup';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import ContextMenu from '../../elements/ContextMenu';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import CalendarIcon16Blue from '../../../assets/Icons/CalendarIcons/CalendarIcon16Blue.svg';
import StationIcon16Black from '../../../assets/Icons/StationIcons/StationIcon16Black.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon18Black from '../../../assets/Icons/DeleteIcons/DeleteIcon18Black.svg';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';

const USER_ID = 1;

const T_BLOCK_TOP = 155;
const T_BLOCK_LEFT = 30;
const T_BLOCK_RIGHT = 30;
const HEADER_H = 234;
const GAP = 30;

const FIELD_WIDTH = 340;
const FIELD_HEIGHT = 44;
const COL_GAP = 100;
const START_LEFT = 40;
const START_TOP = 30;
const ROW_HEIGHT = 99;

const getColLeft = (col: number) => START_LEFT + col * (FIELD_WIDTH + COL_GAP);
const getRowTop = (row: number) => START_TOP + row * ROW_HEIGHT;

interface BindingRow {
  localId: string;
  uid?: string;
  materialUid: string;
  materialName: string;
  materialArticle: string;
  bindingDate: string;
  minStock: number | '';
  criticalStock: number | '';
}

interface InitialState {
  docDate: string;
  stationUid: string;
  bindings: string;
}

type PickerTarget = 'station' | 'row';

const getDaysInMonth = (month: number, year: number): number => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) return 29;
  }
  return daysInMonth[month - 1] || 31;
};

const formatDateInput = (input: string): string => {
  if (!input || input === '') return '';
  let digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 0) return '';
  let day = digits.slice(0, 2);
  let month = digits.length >= 3 ? digits.slice(2, 4) : '';
  let year = digits.length >= 5 ? digits.slice(4, 8) : '';
  let dayNum = parseInt(day) || 0;
  let monthNum = parseInt(month) || 0;
  let yearNum = parseInt(year) || new Date().getFullYear();
  if (dayNum > 31) dayNum = 31;
  if (dayNum < 1 && day.length === 2) dayNum = 1;
  if (monthNum > 12) monthNum = 12;
  if (monthNum < 1 && month.length === 2) monthNum = 1;
  if (monthNum > 0 && dayNum > 0) {
    const maxDays = getDaysInMonth(monthNum, yearNum);
    if (dayNum > maxDays) dayNum = maxDays;
  }
  let result = '';
  if (day.length === 1) result += String(dayNum);
  else if (day.length === 2) result += String(dayNum).padStart(2, '0');
  if (month.length === 1) result += '.' + String(monthNum);
  else if (month.length === 2) result += '.' + String(monthNum).padStart(2, '0');
  if (year.length > 0) result += '.' + year;
  return result;
};

const convertISOToDot = (s: string): string => {
  if (!s) return '';
  if (s.includes('.')) return s;
  const parts = s.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return s;
};

const convertDotToISO = (s: string): string | null => {
  if (!s) return null;
  if (s.includes('-') && s.length === 10) return s;
  const parts = s.split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};

const StockLevelControlCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [code, setCode] = useState<number>(0);
  const [docDate, setDocDate] = useState('');
  const [stationUid, setStationUid] = useState('');
  const [stationName, setStationName] = useState('');
  const [isPosted, setIsPosted] = useState(false);

  const [bindings, setBindings] = useState<BindingRow[]>([]);

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [initialState, setInitialState] = useState<InitialState | null>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarFieldRef = useRef<HTMLDivElement>(null);

  const [stationOptions, setStationOptions] = useState<{ uid: string; name: string }[]>([]);
  const [materialOptions, setMaterialOptions] = useState<{ uid: string; name: string; article: string; code: number }[]>([]);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<PopupType>('analogSelect');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [activeRowLocalId, setActiveRowLocalId] = useState<string | null>(null);

  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; localId: string } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    if (isEditMode) {
      setIsDataSaved(true);
      loadData(uid);
    } else {
      fetchGenerateCode();
      const today = new Date().toLocaleDateString('ru-RU').replace(/\//g, '.');
      setDocDate(today);

      const qStationUid = searchParams.get('stationUid') || '';
      const qStationName = searchParams.get('stationName') || '';
      const qMaterialUid = searchParams.get('materialUid') || '';
      const qMaterialName = searchParams.get('materialName') || '';
      const qMaterialArticle = searchParams.get('materialArticle') || '';

      if (qStationUid) setStationUid(qStationUid);
      if (qStationName) setStationName(qStationName);

      if (qMaterialUid) {
        setBindings([{
          localId: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          materialUid: qMaterialUid,
          materialName: qMaterialName,
          materialArticle: qMaterialArticle,
          bindingDate: today,
          minStock: '',
          criticalStock: '',
        }]);
      }
    }
  }, [uid]);

  useEffect(() => {
    fetchStations();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (!showCalendar) return;
    const h = (e: MouseEvent) => {
      if (calendarFieldRef.current && !calendarFieldRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showCalendar]);

  useEffect(() => {
    if (!rowContextMenu) return;
    const h = () => setRowContextMenu(null);
    document.addEventListener('click', h);
    document.addEventListener('wheel', h, true);
    return () => {
      document.removeEventListener('click', h);
      document.removeEventListener('wheel', h, true);
    };
  }, [rowContextMenu]);

  const fetchGenerateCode = async () => {
    try { const r = await AxiosService.get(ConstantInfo.restApiStockLevelControlGenerateCode); setCode(r.data || 0); }
    catch { setCode(0); }
  };

  const fetchStations = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID));
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setStationOptions(items.map((s: any) => ({ uid: s.uid, name: s.name })));
    } catch (e) { console.error(e); }
  };

  const fetchMaterials = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureTree + `?userId=${USER_ID}`);
      const respData = r.data as any;
      const items: any[] = [];
      const walk = (arr: any[]) => {
        arr.forEach((n: any) => {
          if (n.type === 'item' || n.isItem || (!n.children && n.uid)) {
            items.push({ uid: n.uid, name: n.name || n.nameMaterial || '', article: n.article || '', code: n.code || n.codeMaterial || 0 });
          } else if (n.children) walk(n.children);
        });
      };
      if (Array.isArray(respData)) walk(respData);
      else if (respData?.tree) walk(respData.tree);
      else if (respData?.data) walk(respData.data);
      setMaterialOptions(items);
    } catch (e) { console.error(e); }
  };

  const loadData = async (docUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStockLevelControl(docUid))).data;
      setCode(d.code || 0);
      setDocDate(convertISOToDot(d.docDate || ''));
      setStationUid(d.stationUid || '');
      setStationName(d.stationName || '');
      setIsPosted(d.isPosted || false);

      const rows: BindingRow[] = (d.bindings || []).map((b: any) => ({
        localId: b.uid || `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: b.uid,
        materialUid: b.materialUid || '',
        materialName: b.materialName || '',
        materialArticle: b.materialArticle || '',
        bindingDate: convertISOToDot(b.bindingDate || ''),
        minStock: b.minStock ?? '',
        criticalStock: b.criticalStock ?? '',
      }));
      setBindings(rows);

      setInitialState({
        docDate: convertISOToDot(d.docDate || ''),
        stationUid: d.stationUid || '',
        bindings: JSON.stringify(rows),
      });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const isDirty = useMemo(() => {
    if (!isEdit || !initialState) return bindings.length > 0 || stationUid !== '' || docDate !== '';
    return (
      docDate !== initialState.docDate ||
      stationUid !== initialState.stationUid ||
      JSON.stringify(bindings) !== initialState.bindings
    );
  }, [isEdit, initialState, docDate, stationUid, bindings]);

  const canSave = isDirty && !isPosted && (stationUid.length > 0 || docDate.length > 0);

  const getStatusIcon = (): string => {
    if (isPosted) return StatusIcon104Blue;
    if (!isDataSaved) return StatusIcon93Red;
    if (isDirty) return StatusIcon107Orange;
    return StatusIcon104Blue;
  };
  const getStatusIconWidth = (): number => {
    if (isPosted) return 104;
    if (!isDataSaved) return 93;
    if (isDirty) return 107;
    return 104;
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const isoDate = convertDotToISO(docDate);
      const body: any = {
        docDate: isoDate,
        stationUid: stationUid || null,
        bindings: bindings.map(b => ({
          uid: b.uid || null,
          materialUid: b.materialUid || null,
          bindingDate: convertDotToISO(b.bindingDate) || isoDate,
          minStock: b.minStock === '' ? null : Number(b.minStock),
          criticalStock: b.criticalStock === '' ? null : Number(b.criticalStock),
        })),
      };

      const wasCreate = !isEdit;
      if (isEdit) {
        await AxiosService.patch(ConstantInfo.restApiStockLevelControl(uid), body);
      } else {
        await AxiosService.post(
          ConstantInfo.restApiStockLevelControlCrud(USER_ID).split('?')[0],
          { uid, ...body }
        );
      }

      setInitialState({
        docDate,
        stationUid,
        bindings: JSON.stringify(bindings),
      });
      setIsDataSaved(true);

      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/documents/stock-level-control/edit/${uid}`;
        const newLabel = `Контроль остатков: ${String(code).padStart(4, '0')}`;
        replaceTab(activeTabId, newPath, newLabel, <StockLevelControlCreatePage />);
      }
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      alert('Ошибка при сохранении: ' + (e as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePost = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiStockLevelControlPost(uid));
      setIsPosted(true);
      setIsDataSaved(true);
    } catch (e) {
      console.error('Ошибка проведения:', e);
      alert('Ошибка при проведении: ' + (e as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); };
  const handleCloseWithoutSaving = () => { handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };

  const addRow = () => {
    setBindings(prev => [...prev, {
      localId: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      materialUid: '',
      materialName: '',
      materialArticle: '',
      bindingDate: docDate,
      minStock: '',
      criticalStock: '',
    }]);
  };

  const removeRow = (localId: string) => {
    setBindings(prev => prev.filter(r => r.localId !== localId));
  };

  const updateRow = (localId: string, field: keyof BindingRow, value: any) => {
    setBindings(prev => prev.map(r => r.localId === localId ? { ...r, [field]: value } : r));
  };

  const openMaterialPopup = (localId: string) => {
    setPickerTarget('row');
    setActiveRowLocalId(localId);
    setPopupType('analogSelect');
    setPopupOpen(true);
  };

  const openStationPopup = () => {
    if (isPosted) return;
    setPickerTarget('station');
    setPopupType('station');
    setPopupOpen(true);
  };

  const handlePopupSelect = (id: string, name: string, item?: any) => {
    if (pickerTarget === 'station') {
      setStationUid(id);
      setStationName(name);
    } else if (pickerTarget === 'row' && activeRowLocalId) {
      const found = materialOptions.find(m => m.uid === id);
      const article = item?.article || found?.article || '';
      setBindings(prev => prev.map(r => r.localId === activeRowLocalId ? {
        ...r,
        materialUid: id,
        materialName: name,
        materialArticle: article,
      } : r));
    }
    setActiveRowLocalId(null);
    setPickerTarget(null);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    setActiveRowLocalId(null);
    setPickerTarget(null);
  };

  const rowContextMenuItems: ContextMenuItem[] = rowContextMenu ? [
    { id: 'open', label: 'Изменить номенклатуру', icon: ContextMenuOpenIcon16, onClick: () => openMaterialPopup(rowContextMenu.localId) },
    { id: 'delete', label: 'Удалить строку', icon: ContextMenuDeleteIcon16, onClick: () => removeRow(rowContextMenu.localId) },
  ] : [];

  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 151, height: 40, borderRadius: 10,
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
    color: isActive ? '#FFFFFF' : '#2D4059',
    transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21,
  });

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', position: 'relative', flexShrink: 0 };

  if (isLoading) return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, zIndex: 10, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {isEdit
            ? `Документ: Контроль уровня остатков №${String(code).padStart(4, '0')}`
            : 'Документ: Контроль уровня остатков (Создание)'}
        </h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button style={mainButtonStyle(true)}><span>Основное</span></button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: T_BLOCK_TOP, left: T_BLOCK_LEFT, right: T_BLOCK_RIGHT, bottom: 96, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <div style={{ width: '100%', height: HEADER_H, ...blockStyle }}>
          <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(0) }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Код:"
              icon={CodeIcon20LightBlue}
              value={String(code).padStart(4, '0')}
              type="input"
              disabled
              iconWidth={20} iconHeight={14}
            />
          </div>
          <div ref={calendarFieldRef} style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(1) }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Дата:"
              icon={CalendarIcon16Gray}
              iconActive={CalendarIcon16Blue}
              value={docDate}
              placeholder="__.__.____"
              type="calendar"
              onChange={e => setDocDate(formatDateInput(e.target.value))}
              onCalendarClick={() => !isPosted && setShowCalendar(v => !v)}
              disabled={isPosted}
              iconWidth={16} iconHeight={18}
            />
            <CalendarPopup
              isOpen={showCalendar}
              onClose={() => setShowCalendar(false)}
              onConfirm={(dateStr) => { setDocDate(dateStr); }}
              selectedDate={docDate}
              anchorRef={calendarFieldRef}
            />
          </div>
          <div style={{ position: 'absolute', top: getRowTop(0), left: getColLeft(2) }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Станция (склад):"
              icon={StationIcon16Black}
              value={stationName}
              placeholder="Выберите станцию"
              type="select"
              disabled={isPosted}
              searchOptions={stationOptions}
              onSelectOption={(uidV, name) => { setStationUid(uidV); setStationName(name); }}
              onOpenFullList={openStationPopup}
              selectIconWidth={16} selectIconHeight={16}
              searchTitle="Найденная станция"
              searchNotFoundText="Станции не найдены"
            />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, ...blockStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 58, backgroundColor: '#666EFE', display: 'flex', alignItems: 'center', paddingLeft: 30, paddingRight: 30, gap: 0, color: '#FFFFFF' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, width: 380 }}>Номенклатура</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, width: 160 }}>Артикул</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, width: 200 }}>Дата привязки</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, width: 200 }}>Мин. остаток</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, flex: 1 }}>Крит. остаток</span>
            {!isPosted && (
              <div onClick={addRow} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {bindings.length === 0 ? (
              <div style={{ height: 58, display: 'flex', alignItems: 'center', paddingLeft: 30 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет привязок. Нажмите + чтобы добавить строку.</span>
              </div>
            ) : bindings.map((row, idx) => (
              <div
                key={row.localId}
                onContextMenu={(e) => { if (isPosted) return; e.preventDefault(); e.stopPropagation(); setRowContextMenu({ x: e.clientX, y: e.clientY, localId: row.localId }); }}
                style={{
                  height: 58, display: 'flex', alignItems: 'center', paddingLeft: 30, paddingRight: 30,
                  borderTop: idx === 0 ? 'none' : '1px solid #E5ECF5',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div style={{ width: 380, display: 'flex', alignItems: 'center' }}>
                  {row.materialName ? (
                    <span
                      onClick={() => !isPosted && openMaterialPopup(row.localId)}
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360, cursor: isPosted ? 'default' : 'pointer' }}
                    >
                      {row.materialName}
                    </span>
                  ) : (
                    <button onClick={() => !isPosted && openMaterialPopup(row.localId)}
                      style={{ height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 8, border: '1px solid rgba(102,110,254,0.3)', backgroundColor: '#FFFFFF', cursor: isPosted ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#666EFE' }}>
                      Выбрать номенклатуру
                    </button>
                  )}
                </div>
                <span style={{ width: 160, fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.materialArticle || '-'}</span>
                <div style={{ width: 200 }}>
                  <input
                    type="text"
                    value={row.bindingDate}
                    disabled={isPosted}
                    onChange={e => updateRow(row.localId, 'bindingDate', formatDateInput(e.target.value))}
                    placeholder="__.__.____"
                    maxLength={10}
                    style={{ width: 170, height: 34, borderRadius: 8, border: '1px solid ' + (row.bindingDate ? '#666EFE' : '#A0A3BD'), paddingLeft: 10, paddingRight: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, color: row.bindingDate ? '#666EFE' : '#A0A3BD', outline: 'none' }}
                  />
                </div>
                <div style={{ width: 200 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.minStock}
                    disabled={isPosted}
                    onChange={e => updateRow(row.localId, 'minStock', e.target.value.replace(/\D/g, ''))}
                    style={{ width: 170, height: 34, borderRadius: 8, border: '1px solid ' + (row.minStock !== '' ? '#666EFE' : '#A0A3BD'), paddingLeft: 10, paddingRight: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, color: row.minStock !== '' ? '#666EFE' : '#A0A3BD', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 15 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.criticalStock}
                    disabled={isPosted}
                    onChange={e => updateRow(row.localId, 'criticalStock', e.target.value.replace(/\D/g, ''))}
                    style={{ width: 170, height: 34, borderRadius: 8, border: '1px solid ' + (row.criticalStock !== '' ? '#666EFE' : '#A0A3BD'), paddingLeft: 10, paddingRight: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, color: row.criticalStock !== '' ? '#666EFE' : '#A0A3BD', outline: 'none' }}
                  />
                  {!isPosted && (
                    <button onClick={() => removeRow(row.localId)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,48,82,0.3)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <img src={DeleteIcon18Black} alt="" style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
        {!isPosted && (
          <button onClick={handlePost} disabled={!isEdit || bindings.length === 0}
            style={{ width: 154, height: 51, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: (isEdit && bindings.length > 0) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', opacity: (isEdit && bindings.length > 0) ? 1 : 0.5 }}>
            Провести
          </button>
        )}
        <button onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving}
          style={{ width: 154, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', opacity: canSave ? 1 : 0.5 }}>
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17 }}>Записать</span>
        </button>
        <button onClick={() => setShowClosePopup(true)} style={{ width: 116, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Закрыть</button>
      </div>

      <CatalogSelectPopup
        isOpen={popupOpen}
        onClose={handlePopupClose}
        onSelect={handlePopupSelect}
        popupType={popupType}
      />

      {rowContextMenu && (
        <ContextMenu x={rowContextMenu.x} y={rowContextMenu.y} items={rowContextMenuItems} />
      )}

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canSave && <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}
              <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
              <button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockLevelControlCreatePage;