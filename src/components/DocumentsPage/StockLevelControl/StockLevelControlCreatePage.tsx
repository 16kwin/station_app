// StockLevelControlCreatePage.tsx — ПОЛНЫЙ ФАЙЛ
// 1) Проведён — StatusIcon114Green
// 2) Критический уровень нельзя ввести больше минимального — обрезаем до минимума
// 3) До первой записи в заголовке нет кода и времени; после записи — код и дата+время (до секунд)
// 4) Кнопка «Провести» по внешнему виду как «Записать» (та же иконка WriteIcon21Black)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import FormField from '../../elements/FormField';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import ContextMenu from '../../elements/ContextMenu';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import DataTable from '../../elements/DataTable';

import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import LevelIcon16Gray from '../../../assets/Icons/LevelIcons/LevelIcon16Gray.svg';
import LevelIcon16Blue from '../../../assets/Icons/LevelIcons/LevelIcon16Blue.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';
import StatusIcon114Green from '../../../assets/Icons/StatusIcons/StatusIcon114Green.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import SortingIcon20White from '../../../assets/Icons/SortingIcons/SortingIcon20White.svg';
import SortingIcon19BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon19BlueDown.svg';
import SortingIcon19BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon19BlueUp.svg';
import SortingIcon20BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon20BlueDown.svg';
import SortingIcon20BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon20BlueUp.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon18Black from '../../../assets/Icons/DeleteIcons/DeleteIcon18Black.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import FilesIcon14Black from '../../../assets/Icons/FilesIcons/FilesIcon14Black.svg';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

const USER_ID = 1;

const TITLE_TOP = 35;
const TITLE_LEFT = 60;
const STATUS_OFFSET = 57;

const HEADER_TOP = 100;
const HEADER_LEFT = 40;
const HEADER_W = 1720;
const HEADER_H = 142;

const BTN_BAR_TOP = HEADER_TOP + HEADER_H + 30;
const BTN_BAR_LEFT = HEADER_LEFT;
const BTN_SIZE = 40;
const BTN_GAP = 15;
const BTN_TO_TABLE_GAP = 12;

const TABLE_TOP = BTN_BAR_TOP + BTN_SIZE + BTN_TO_TABLE_GAP;
const TABLE_LEFT = HEADER_LEFT;
const TABLE_W = 1720;
const TABLE_H = 406;
const TABLE_ROW_H = 58;
const TABLE_HEADER_H = 58;
const TABLE_VISIBLE_ROWS = 6;

const COUNTER_TOP = TABLE_TOP + TABLE_H + 20;
const COUNTER_LEFT = HEADER_LEFT;
const COUNTER_W = 299;
const COUNTER_H = 60;

const FIELD_WIDTH = 340;
const FIELD_HEIGHT = 44;
const FIELD_TOP = 30;
const FIELD_LEFT = 40;
const FIELD_GAP = 90;

const SEARCH_EXPANDED = 280;
const SORT_EXPANDED = 230;
const FILTER_EXPANDED = 260;

const ADD_BTN_W = 132;
const ADD_BTN_H = 40;
const ADD_BTN_OFFSET = 140;
const GROUP_GAP = 15;

const BTN_HEADER = 40;
const BTN_CLEAR = 44;
const TOP_PAD = 20;
const BOTTOM_PAD = 20;
const TEXT_HEIGHT = 18;
const ITEM_GAP = 20;
const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
const LEFT_OFFSET = 30;
const SUBMENU_WIDTH = 260;
const SUBMENU_OFFSET = 3;
const INDICATOR_LEFT = 15;
const INDICATOR_WIDTH = 2;
const INDICATOR_HEIGHT = 22;
const SUBMENU_LEFT_PAD = 30;
const SUBMENU_CHECKBOX_WIDTH = 20;
const SUBMENU_RIGHT_PAD = 20;

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
const TWEEN = { type: 'tween' as const, duration: 0.2 };

const btnBaseStyle: React.CSSProperties = {
  outline: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
};

const POPUP_W = 481;
const POPUP_H = 481;
const POPUP_PAD = 30;
const POPUP_FIELD_W = 401;
const POPUP_FIELD_H = 44;
const POPUP_LABEL_H = 17;
const POPUP_LABEL_GAP = 11;
const POPUP_BLOCK_GAP = 30;
const POPUP_TITLE_H = 21;
const POPUP_BUTTONS_GAP = 50;

interface BindingRow {
  localId: string;
  uid?: string;
  materialUid: string;
  materialName: string;
  materialArticle: string;
  materialCode: number | null;
  minStock: number | '';
  criticalStock: number | '';
}

interface InitialState {
  docDate: string;
  stationUid: string;
  bindings: string;
}

interface SortField {
  key: string;
  label: string;
  iconType?: '19' | '20' | null;
}

interface MaterialOption {
  uid: string;
  name: string;
  article: string;
  code: number | null;
}

const DOC_COLUMNS = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialCode', label: 'Код' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'minStock', label: 'Уровень минимального остатка' },
  { key: 'criticalStock', label: 'Уровень критического остатка' },
];
const DOC_VISIBLE = ['materialName', 'materialCode', 'materialArticle', 'minStock', 'criticalStock'];
const CENTERED_COLUMNS = ['minStock', 'criticalStock'];

const SORT_FIELDS: SortField[] = [
  { key: 'materialName', label: 'Номенклатура', iconType: '20' },
  { key: 'materialCode', label: 'Код', iconType: '19' },
  { key: 'materialArticle', label: 'Артикул', iconType: '20' },
  { key: 'minStock', label: 'Мин. остаток', iconType: '19' },
  { key: 'criticalStock', label: 'Крит. остаток', iconType: '19' },
];

const FILTER_FIELDS: { key: string; label: string }[] = [
  { key: 'level', label: 'По уровню остатка' },
  { key: 'warehouse', label: 'По складу' },
];

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

const todayDot = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const formatDateWithSeconds = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
  } catch {
    return dateStr;
  }
};

const formatStockValue = (val: number | '' | null | undefined): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  return '—';
};

const extractArticle = (data: any): string => {
  if (!data) return '';
  return data.article || data.articleMaterial || data.articleName || '';
};

const extractCode = (data: any): number | null => {
  if (!data) return null;
  const raw = data.codeMaterial ?? data.code ?? data.materialCode ?? null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw != null) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const StockLevelControlCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [code, setCode] = useState<number>(0);
  const [docDate, setDocDate] = useState<string>(todayDot());
  const [docCreatedAt, setDocCreatedAt] = useState<string>('');
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

  const [stationOptions, setStationOptions] = useState<{ uid: string; name: string }[]>([]);
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);

  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [addMaterialUid, setAddMaterialUid] = useState('');
  const [addMaterialName, setAddMaterialName] = useState('');
  const [addMaterialArticle, setAddMaterialArticle] = useState('');
  const [addMaterialCode, setAddMaterialCode] = useState<number | null>(null);
  const [addMinStock, setAddMinStock] = useState<number | ''>('');
  const [addCriticalStock, setAddCriticalStock] = useState<number | ''>('');
  const [addFullListOpen, setAddFullListOpen] = useState(false);
  const [editRowLocalId, setEditRowLocalId] = useState<string | null>(null);

  const [stationPopupOpen, setStationPopupOpen] = useState(false);

  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; localId: string } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortIndicatorY, setSortIndicatorY] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const fetchMaterialDetails = useCallback(async (materialUid: string): Promise<{ article: string; code: number | null }> => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(materialUid));
      const data = r.data;
      return {
        article: extractArticle(data),
        code: extractCode(data),
      };
    } catch (e) {
      console.error('Не удалось загрузить данные материала:', e);
      return { article: '', code: null };
    }
  }, []);

  const loadData = useCallback(async (docUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStockLevelControl(docUid))).data;
      setCode(d.code || 0);
      setDocDate(convertISOToDot(d.docDate || '') || todayDot());
      setDocCreatedAt(d.createdAt || d.docDate || '');
      setStationUid(d.stationUid || '');
      setStationName(d.stationName || '');
      setIsPosted(d.isPosted || false);

      const rows: BindingRow[] = (d.bindings || []).map((b: any) => ({
        localId: b.uid || `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: b.uid,
        materialUid: b.materialUid || '',
        materialName: b.materialName || '',
        materialArticle: b.materialArticle || '',
        materialCode: typeof b.materialCode === 'number' ? b.materialCode : (typeof b.code === 'number' ? b.code : null),
        minStock: typeof b.minStock === 'number' ? b.minStock : '',
        criticalStock: typeof b.criticalStock === 'number' ? b.criticalStock : '',
      }));
      setBindings(rows);

      setInitialState({
        docDate: convertISOToDot(d.docDate || '') || todayDot(),
        stationUid: d.stationUid || '',
        bindings: JSON.stringify(rows),
      });

      const rowsMissing = rows.filter(r => r.materialUid && (!r.materialArticle || r.materialCode == null));
      for (const row of rowsMissing) {
        const details = await fetchMaterialDetails(row.materialUid);
        setBindings(prev => prev.map(r => r.localId === row.localId ? {
          ...r,
          materialArticle: details.article || r.materialArticle,
          materialCode: details.code ?? r.materialCode,
        } : r));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMaterialDetails]);

  const fetchGenerateCode = useCallback(async () => {
    try { const r = await AxiosService.get(ConstantInfo.restApiStockLevelControlGenerateCode); setCode(r.data || 0); }
    catch { setCode(0); }
  }, []);

  const fetchStations = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID));
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setStationOptions(items.map((s: any) => ({ uid: s.uid, name: s.name })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      const respData = r.data as any;
      const items: MaterialOption[] = [];
      const seen = new Set<string>();

      const pushMaterial = (m: any) => {
        if (!m || !m.uid) return;
        if (seen.has(m.uid)) return;
        seen.add(m.uid);
        items.push({
          uid: m.uid,
          name: m.name || m.nameMaterial || 'Без названия',
          article: m.article || m.articleMaterial || '',
          code: extractCode(m),
        });
      };

      const walk = (nodes: any[]) => {
        nodes.forEach((n: any) => {
          if (n.materials && Array.isArray(n.materials)) {
            n.materials.forEach((m: any) => pushMaterial(m));
          }
          if (n.children && Array.isArray(n.children)) walk(n.children);
        });
      };

      if (Array.isArray(respData)) walk(respData);
      else if (respData?.tree) walk(respData.tree);
      else if (respData?.data) walk(respData.data);

      setMaterialOptions(items);
    } catch (e) { console.error('Ошибка загрузки номенклатуры:', e); }
  }, []);

  useEffect(() => {
    if (!uid) return;

    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);

    const initCreate = async () => {
      await fetchGenerateCode();
      setDocDate(todayDot());
      setDocCreatedAt('');

      const qStationUid = searchParams.get('stationUid') || '';
      const qStationName = searchParams.get('stationName') || '';
      const qMaterialUid = searchParams.get('materialUid') || '';
      const qMaterialName = searchParams.get('materialName') || '';
      const qMaterialArticle = searchParams.get('materialArticle') || '';

      if (qStationUid) setStationUid(qStationUid);
      if (qStationName) setStationName(qStationName);

      if (qMaterialUid) {
        setEditRowLocalId(null);
        setAddMaterialUid(qMaterialUid);
        setAddMaterialName(qMaterialName);
        setAddMaterialArticle(qMaterialArticle);
        setAddMaterialCode(null);
        setAddMinStock('');
        setAddCriticalStock('');
        setAddFullListOpen(false);
        setAddPopupOpen(true);

        try {
          const mr = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(qMaterialUid));
          const data = mr.data;
          const art = extractArticle(data);
          const codeVal = extractCode(data);
          setAddMaterialArticle(prev => prev || art);
          setAddMaterialCode(codeVal);
          setAddMaterialName(prev => prev || (data.nameMaterial || data.name || ''));
        } catch (e) {
          console.error('Не удалось загрузить артикул/код материала:', e);
        }
      }
    };

    if (isEditMode) {
      setIsDataSaved(true);
      loadData(uid);
    } else {
      initCreate();
    }
  }, [uid, searchParams, loadData, fetchGenerateCode]);

  useEffect(() => {
    fetchStations();
    fetchMaterials();
  }, [fetchStations, fetchMaterials]);

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

  useEffect(() => {
    if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [expanded]);

  const getIndicatorTarget = useCallback((idx: number): number => TOP_PAD + idx * ROW_STEP + (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, []);

  useEffect(() => {
    if (expanded === 'sort') {
      const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn);
      if (idx >= 0) setSortIndicatorY(getIndicatorTarget(idx));
    }
  }, [expanded, sortColumn, getIndicatorTarget]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialState) return bindings.length > 0 || stationUid !== '';
    return (
      docDate !== initialState.docDate ||
      stationUid !== initialState.stationUid ||
      JSON.stringify(bindings) !== initialState.bindings
    );
  }, [isEdit, initialState, docDate, stationUid, bindings]);

  const canSave = isDirty && !isPosted && (stationUid.length > 0);

  // === Статус ===
  // Проведён → StatusIcon114Green (114)
  // Не записан → StatusIcon93Red (93)
  // Записан, но изменён → StatusIcon107Orange (107)
  // Записан → StatusIcon104Blue (104)
  const getStatusIcon = (): string => {
    if (isPosted) return StatusIcon114Green;
    if (!isDataSaved) return StatusIcon93Red;
    if (isDirty) return StatusIcon107Orange;
    return StatusIcon104Blue;
  };
  const getStatusIconWidth = (): number => {
    if (isPosted) return 114;
    if (!isDataSaved) return 93;
    if (isDirty) return 107;
    return 104;
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const isoDate = convertDotToISO(docDate);
      const nowIso = new Date().toISOString();
      const body: any = {
        docDate: isoDate,
        stationUid: stationUid || null,
        bindings: bindings.map(b => ({
          uid: b.uid || null,
          materialUid: b.materialUid || null,
          bindingDate: isoDate,
          minStock: typeof b.minStock === 'number' ? b.minStock : null,
          criticalStock: typeof b.criticalStock === 'number' ? b.criticalStock : null,
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
      // сохраняем время записи для отображения в заголовке и в поле «Дата»
      setDocCreatedAt(nowIso);

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

  const removeRow = (localId: string) => {
    setBindings(prev => prev.filter(r => r.localId !== localId));
    setSelectedRowIds(prev => { const next = new Set(prev); next.delete(localId); return next; });
  };

  const openAddPopup = () => {
    if (isPosted) return;
    setEditRowLocalId(null);
    setAddMaterialUid('');
    setAddMaterialName('');
    setAddMaterialArticle('');
    setAddMaterialCode(null);
    setAddMinStock('');
    setAddCriticalStock('');
    setAddFullListOpen(false);
    setAddPopupOpen(true);
  };

  const openEditPopup = (localId: string) => {
    if (isPosted) return;
    const row = bindings.find(b => b.localId === localId);
    if (!row) return;
    setEditRowLocalId(localId);
    setAddMaterialUid(row.materialUid);
    setAddMaterialName(row.materialName);
    setAddMaterialArticle(row.materialArticle);
    setAddMaterialCode(row.materialCode);
    setAddMinStock(row.minStock);
    setAddCriticalStock(row.criticalStock);
    setAddFullListOpen(false);
    setAddPopupOpen(true);
  };

  const handleAddPopupSave = () => {
    if (!isAddPopupValid) return;
    const minVal: number | '' = typeof addMinStock === 'number' ? addMinStock : '';
    const critVal: number | '' = typeof addCriticalStock === 'number' ? addCriticalStock : '';

    if (editRowLocalId) {
      setBindings(prev => prev.map(r => r.localId === editRowLocalId ? {
        ...r,
        materialUid: addMaterialUid,
        materialName: addMaterialName,
        materialArticle: addMaterialArticle,
        materialCode: addMaterialCode,
        minStock: minVal,
        criticalStock: critVal,
      } : r));
    } else {
      setBindings(prev => [...prev, {
        localId: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialUid: addMaterialUid,
        materialName: addMaterialName,
        materialArticle: addMaterialArticle,
        materialCode: addMaterialCode,
        minStock: minVal,
        criticalStock: critVal,
      }]);
    }

    setAddPopupOpen(false);
    setEditRowLocalId(null);
  };

  const handleAddPopupClose = () => {
    setAddPopupOpen(false);
    setEditRowLocalId(null);
  };

  const handleMaterialSelect = async (uidV: string, name: string) => {
    setAddMaterialUid(uidV);
    setAddMaterialName(name);

    const found = materialOptions.find(m => m.uid === uidV);
    if (found && (found.article || found.code != null)) {
      setAddMaterialArticle(found.article || '');
      setAddMaterialCode(typeof found.code === 'number' ? found.code : null);
    }

    const details = await fetchMaterialDetails(uidV);
    if (details.article) setAddMaterialArticle(details.article);
    if (details.code != null) setAddMaterialCode(details.code);
  };

  const handleFullListSelect = async (id: string, name: string, item?: any) => {
    setAddMaterialUid(id);
    setAddMaterialName(name);
    setAddFullListOpen(false);

    const itemArticle = item?.article ?? '';
    const itemCodeRaw = item?.code ?? item?.codeMaterial ?? null;
    const itemCode = typeof itemCodeRaw === 'number' ? itemCodeRaw : (itemCodeRaw != null ? Number(itemCodeRaw) || null : null);
    if (itemArticle) setAddMaterialArticle(itemArticle);
    if (itemCode != null) setAddMaterialCode(itemCode);

    const found = materialOptions.find(m => m.uid === id);
    if (found) {
      if (found.article && !itemArticle) setAddMaterialArticle(found.article);
      if (typeof found.code === 'number' && itemCode == null) setAddMaterialCode(found.code);
    }

    const details = await fetchMaterialDetails(id);
    if (details.article) setAddMaterialArticle(details.article);
    if (details.code != null) setAddMaterialCode(details.code);
  };

  const rowContextMenuItems: ContextMenuItem[] = rowContextMenu ? [
    { id: 'open', label: 'Изменить', icon: ContextMenuOpenIcon16, onClick: () => openEditPopup(rowContextMenu.localId) },
    { id: 'delete', label: 'Удалить строку', icon: ContextMenuDeleteIcon16, onClick: () => removeRow(rowContextMenu.localId) },
  ] : [];

  const animateSortIndicator = useCallback((to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = sortIndicatorY;
    const duration = 200;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSortIndicatorY(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [sortIndicatorY]);

  const handleSortFieldClick = (field: SortField) => {
    if (sortColumn === field.key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field.key);
      setSortDirection('asc');
    }
    const idx = SORT_FIELDS.findIndex(f => f.key === field.key);
    if (idx >= 0) animateSortIndicator(getIndicatorTarget(idx));
  };

  const getSortIcon = (field: SortField): string | null => {
    if (!field.iconType || sortColumn !== field.key) return null;
    if (field.iconType === '19') return sortDirection === 'asc' ? SortingIcon19BlueUp : SortingIcon19BlueDown;
    if (field.iconType === '20') return sortDirection === 'asc' ? SortingIcon20BlueUp : SortingIcon20BlueDown;
    return null;
  };

  const getSubmenuOptions = (key: string): { uid: string; name: string }[] => {
    if (key === 'level') return [
      { uid: 'MIN', name: 'Ниже минимального' },
      { uid: 'CRIT', name: 'Ниже критического' },
      { uid: 'OK', name: 'В норме' },
    ];
    if (key === 'warehouse') return stationOptions.map(s => ({ uid: s.uid, name: s.name }));
    return [];
  };

  const getSubmenuHeight = (key: string): number => {
    const opts = getSubmenuOptions(key);
    if (opts.length === 0) return TOP_PAD + TEXT_HEIGHT + BOTTOM_PAD;
    const h = TOP_PAD + opts.length * TEXT_HEIGHT + (opts.length - 1) * ITEM_GAP + BOTTOM_PAD;
    return Math.min(h, 400);
  };

  const getSubmenuTop = (key: string): number => {
    const idx = FILTER_FIELDS.findIndex(f => f.key === key);
    return idx * ROW_STEP;
  };

  const isOptionChecked = (filterKey: string, optionUid: string): boolean => {
    return activeFilters.has(`${filterKey}:${optionUid}`);
  };

  const handleCheckOption = (filterKey: string, optionUid: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      const key = `${filterKey}:${optionUid}`;
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setSubmenuOpen(null);
  };

  const hasActiveFilter = activeFilters.size > 0;

  const tableRows = useMemo(() => {
    let rows = [...bindings];

    const q = searchValue.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r =>
        (r.materialName || '').toLowerCase().includes(q) ||
        (r.materialArticle || '').toLowerCase().includes(q) ||
        (typeof r.materialCode === 'number' ? String(r.materialCode).toLowerCase().includes(q) : false)
      );
    }

    const levelFilters = Array.from(activeFilters).filter(k => k.startsWith('level:')).map(k => k.split(':')[1]);
    if (levelFilters.length > 0) {
      rows = rows.filter(r => {
        const min = typeof r.minStock === 'number' ? r.minStock : null;
        const crit = typeof r.criticalStock === 'number' ? r.criticalStock : null;
        const isMin = min != null && min > 0 && min < 5;
        const isCrit = crit != null && crit > 0 && crit < (min ?? 999);
        const isOk = !isMin && !isCrit;
        return (levelFilters.includes('MIN') && isMin)
          || (levelFilters.includes('CRIT') && isCrit)
          || (levelFilters.includes('OK') && isOk);
      });
    }

    if (sortColumn) {
      rows.sort((a, b) => {
        const av = (a as any)[sortColumn];
        const bv = (b as any)[sortColumn];
        let cmp = 0;
        if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [bindings, searchValue, activeFilters, sortColumn, sortDirection]);

  const handleCheckboxClick = (uidRow: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(uidRow)) next.delete(uidRow); else next.add(uidRow);
      return next;
    });
  };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allSelected = tableRows.length > 0 && tableRows.every(r => selectedRowIds.has(r.localId));
    if (allSelected) setSelectedRowIds(new Set());
    else setSelectedRowIds(new Set(tableRows.map(r => r.localId)));
  };
  const handleRowClick = (uidRow: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(uidRow)) next.delete(uidRow); else next.add(uidRow);
      return next;
    });
  };
  const handleRowContextMenu = (e: React.MouseEvent, uidRow: string, _name: string) => {
    if (isPosted) return;
    e.preventDefault();
    e.stopPropagation();
    setRowContextMenu({ x: e.clientX, y: e.clientY, localId: uidRow });
  };
  const handleRowDoubleClick = (uidRow: string) => {
    if (isPosted) return;
    openEditPopup(uidRow);
  };

  const renderDocumentCell = (key: string, item: BindingRow): string => {
    switch (key) {
      case 'materialName':
        return item.materialName || '—';
      case 'materialCode':
        return typeof item.materialCode === 'number' ? String(item.materialCode) : '—';
      case 'materialArticle':
        return item.materialArticle || '—';
      case 'minStock':
        return formatStockValue(item.minStock);
      case 'criticalStock':
        return formatStockValue(item.criticalStock);
      default: {
        const val = (item as any)[key];
        if (val === null || val === undefined) return '—';
        if (typeof val === 'string') return val === '' ? '—' : val;
        return String(val);
      }
    }
  };

  const blockStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    position: 'relative',
    flexShrink: 0,
  };

  const docBtnStyle: React.CSSProperties = {
    ...btnBaseStyle,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  };

  const searchWidth = expanded === 'search' ? SEARCH_EXPANDED : BTN_SIZE;
  const sortWidth = expanded === 'sort' ? SORT_EXPANDED : BTN_SIZE;
  const filterWidth = expanded === 'filter' ? FILTER_EXPANDED : BTN_SIZE;

  const btnSearchLeft = BTN_BAR_LEFT + BTN_GAP;
  const btnSortLeft = btnSearchLeft + searchWidth + BTN_GAP;
  const btnFilterLeft = btnSortLeft + sortWidth + BTN_GAP;

  const groupLeft = btnFilterLeft + filterWidth + ADD_BTN_OFFSET;

  const btnDownloadLeft = BTN_BAR_LEFT + TABLE_W - BTN_GAP - BTN_SIZE;
  const btnPrintLeft = btnDownloadLeft - BTN_GAP - BTN_SIZE;

  const sortListHeight = TOP_PAD + SORT_FIELDS.length * TEXT_HEIGHT + (SORT_FIELDS.length - 1) * ITEM_GAP + BOTTOM_PAD;
  const filterListHeight = TOP_PAD + FILTER_FIELDS.length * TEXT_HEIGHT + (FILTER_FIELDS.length - 1) * ITEM_GAP + BOTTOM_PAD;

  const materialSelectOptions = materialOptions.map(m => ({ uid: m.uid, name: m.name }));

  const minIsNumber = typeof addMinStock === 'number';
  const critIsNumber = typeof addCriticalStock === 'number';
  const hasBothStock = minIsNumber && critIsNumber;

  const isCriticalValid =
    !hasBothStock ||
    (minIsNumber && critIsNumber && (addCriticalStock as number) <= (addMinStock as number));

  const isAddPopupValid = addMaterialUid !== '' && hasBothStock && isCriticalValid;

  // === Заголовок ===
  // До первой записи: без кода и времени.
  // После записи: "Документ: Контроль уровня остатка N<код> от <дата+время до секунд>"
  const isSavedOnce = isDataSaved || isEdit;
  const titleText = isSavedOnce
    ? `Документ: Контроль уровня остатка N${String(code).padStart(4, '0')} от ${formatDateWithSeconds(docCreatedAt || docDate)}`
    : `Документ: Контроль уровня остатка`;

  // === Поле «Дата» — с временем (до секунд), только если записан ===
  const dateFieldValue = isSavedOnce
    ? formatDateWithSeconds(docCreatedAt || docDate)
    : '';

  const addMinStockDisplay = minIsNumber ? String(addMinStock) : '';
  const addCriticalStockDisplay = critIsNumber ? String(addCriticalStock) : '';

  if (isLoading) return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
    </div>
  );

  const P_TITLE_TOP = POPUP_PAD;
  const P_FIRST_LABEL_TOP = P_TITLE_TOP + POPUP_TITLE_H + POPUP_PAD;
  const P_FIELD_1_TOP = P_FIRST_LABEL_TOP + POPUP_LABEL_H + POPUP_LABEL_GAP;
  const P_FIELD_2_TOP = P_FIELD_1_TOP + POPUP_FIELD_H + POPUP_BLOCK_GAP + POPUP_LABEL_H + POPUP_LABEL_GAP;
  const P_FIELD_3_TOP = P_FIELD_2_TOP + POPUP_FIELD_H + POPUP_BLOCK_GAP + POPUP_LABEL_H + POPUP_LABEL_GAP;
  const P_FIELD_3_BOTTOM = P_FIELD_3_TOP + POPUP_FIELD_H;
  const P_BUTTONS_TOP = P_FIELD_3_BOTTOM + POPUP_BUTTONS_GAP;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>

      {/* === Заголовок === */}
      <div style={{ position: 'absolute', top: TITLE_TOP, left: TITLE_LEFT, display: 'flex', alignItems: 'center', gap: STATUS_OFFSET, zIndex: 10 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>
          {titleText}
        </h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>

      {/* === Шапка документа === */}
      <div style={{ position: 'absolute', top: HEADER_TOP, left: HEADER_LEFT, width: HEADER_W, height: HEADER_H, ...blockStyle }}>
        <div style={{ position: 'absolute', top: FIELD_TOP, left: FIELD_LEFT }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Код:"
            icon={CodeIcon20LightBlue}
            value={isSavedOnce ? String(code).padStart(4, '0') : ''}
            type="input"
            disabled
            iconWidth={20} iconHeight={14}
          />
        </div>

        <div style={{ position: 'absolute', top: FIELD_TOP, left: FIELD_LEFT + FIELD_WIDTH + FIELD_GAP }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Дата:"
            icon={CalendarIcon16Gray}
            value={dateFieldValue}
            type="input"
            disabled
            iconWidth={16} iconHeight={18}
          />
        </div>

        <div style={{ position: 'absolute', top: FIELD_TOP, left: FIELD_LEFT + (FIELD_WIDTH + FIELD_GAP) * 2 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Склад:"
            icon={StationIcon16Gray}
            iconActive={StationIcon16Blue}
            value={stationName}
            placeholder="Выберите склад"
            type="select"
            disabled={isPosted}
            searchOptions={stationOptions}
            onSelectOption={(uidV, name) => { setStationUid(uidV); setStationName(name); }}
            onOpenFullList={() => { if (!isPosted) setStationPopupOpen(true); }}
            selectIconWidth={16} selectIconHeight={16}
            searchTitle="Найденный склад"
            searchNotFoundText="Склады не найдены"
          />
        </div>
      </div>

      {/* === Панель кнопок над таблицей === */}
      <div style={{ position: 'absolute', top: BTN_BAR_TOP, left: 0, right: 0, height: BTN_SIZE }}>

        <motion.div
          style={{
            position: 'absolute', top: 0, height: BTN_SIZE, borderRadius: 10,
            backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF',
            border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
            display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
            zIndex: expanded === 'search' ? 20 : 5,
          }}
          animate={{ left: btnSearchLeft, width: searchWidth }}
          transition={{ left: SPRING, width: TWEEN }}
        >
          <div
            onClick={() => {
              if (expanded === 'search') { setExpanded(null); setSearchValue(''); }
              else { setExpanded('search'); setSubmenuOpen(null); }
            }}
            style={{ ...btnBaseStyle, width: BTN_SIZE, height: BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          >
            <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="Поиск" style={{ width: 18, height: 18 }} />
          </div>
          <AnimatePresence>
            {expanded === 'search' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Поиск"
                  style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', top: 0, borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: expanded === 'sort' || sortColumn ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
            boxShadow: expanded === 'sort' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
            overflow: 'hidden',
            zIndex: expanded === 'sort' ? 25 : 5,
          }}
          animate={{
            left: btnSortLeft,
            width: sortWidth,
            height: expanded === 'sort' ? BTN_HEADER + sortListHeight + BTN_CLEAR : BTN_SIZE,
          }}
          transition={{ left: SPRING, width: TWEEN, height: TWEEN }}
        >
          <div
            onClick={() => setExpanded(prev => prev === 'sort' ? null : 'sort')}
            style={{
              ...btnBaseStyle,
              height: BTN_HEADER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: expanded === 'sort' || sortColumn ? '#666EFE' : 'transparent',
              borderRadius: expanded === 'sort' ? '10px 10px 0 0' : 10,
            }}
          >
            {expanded === 'sort'
              ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Сортировка</span>
              : <img src={sortColumn ? SortingIcon20White : SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />
            }
          </div>
          <AnimatePresence>
            {expanded === 'sort' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                style={{ position: 'relative', height: sortListHeight, overflow: 'hidden' }}
              >
                {sortColumn && (
                  <motion.div
                    style={{
                      position: 'absolute', left: INDICATOR_LEFT, top: 0,
                      width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT,
                      backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                    }}
                    animate={{ y: sortIndicatorY }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                  {SORT_FIELDS.map((field) => {
                    const isSelected = sortColumn === field.key;
                    const sortIcon = getSortIcon(field);
                    const iconWidth = field.iconType === '19' ? 19 : field.iconType === '20' ? 20 : 0;
                    return (
                      <div
                        key={field.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSortFieldClick(field)}
                        style={{
                          ...btnBaseStyle,
                          height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                          marginBottom: SORT_FIELDS.indexOf(field) < SORT_FIELDS.length - 1 ? ITEM_GAP : 0,
                          paddingLeft: LEFT_OFFSET, position: 'relative',
                        }}
                      >
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isSelected ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {field.label}
                        </span>
                        {sortIcon && <img src={sortIcon} alt="" style={{ width: iconWidth, height: field.iconType === '19' ? 12 : 10, marginLeft: 8, flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {expanded === 'sort' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
              >
                <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSortColumn(null); setSortDirection('asc'); }}
                  style={{
                    ...btnBaseStyle,
                    width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px',
                  }}
                >
                  Очистить сортировку
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', top: 0, borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: expanded === 'filter' || hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
            boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
            overflow: 'visible',
            zIndex: expanded === 'filter' ? 25 : 5,
          }}
          animate={{
            left: btnFilterLeft,
            width: filterWidth,
            height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : BTN_SIZE,
          }}
          transition={{ left: SPRING, width: TWEEN, height: TWEEN }}
        >
          <div
            onClick={() => {
              if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); }
              else { setExpanded('filter'); setSubmenuOpen(null); }
            }}
            style={{
              ...btnBaseStyle,
              height: BTN_HEADER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent',
              borderRadius: expanded === 'filter' ? '10px 10px 0 0' : 10,
            }}
          >
            {expanded === 'filter'
              ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
              : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="Фильтр" style={{ width: 18, height: 18, display: 'block' }} />
            }
          </div>
          <AnimatePresence>
            {expanded === 'filter' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}
              >
                <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                  {FILTER_FIELDS.map((field, fieldIdx) => {
                    const isActive = Array.from(activeFilters).some(k => k.startsWith(`${field.key}:`));
                    return (
                      <div
                        key={field.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSubmenuOpen(prev => prev === field.key ? null : field.key)}
                        style={{
                          ...btnBaseStyle,
                          height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                          marginBottom: fieldIdx < FILTER_FIELDS.length - 1 ? ITEM_GAP : 0,
                          paddingLeft: LEFT_OFFSET, position: 'relative',
                        }}
                      >
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {field.label}
                        </span>
                        <div style={{ position: 'absolute', right: 20, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <img src={isActive ? ArrowIcon6Blue : ArrowIcon6Black} alt="" style={{ width: 6, height: 10 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {submenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        left: filterWidth + SUBMENU_OFFSET,
                        top: getSubmenuTop(submenuOpen),
                        width: SUBMENU_WIDTH,
                        height: getSubmenuHeight(submenuOpen),
                        backgroundColor: '#FFFFFF',
                        borderRadius: '0 15px 15px 15px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(102, 110, 254, 0.15)',
                        zIndex: 30,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 400 }}>
                        {getSubmenuOptions(submenuOpen).length === 0 ? (
                          <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Нет данных</span>
                          </div>
                        ) : getSubmenuOptions(submenuOpen).map((option, i, arr) => {
                          const checked = isOptionChecked(submenuOpen, option.uid);
                          return (
                            <div
                              key={option.uid}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleCheckOption(submenuOpen, option.uid)}
                              style={{
                                ...btnBaseStyle,
                                height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                marginBottom: i < arr.length - 1 ? ITEM_GAP : 0,
                                paddingLeft: SUBMENU_LEFT_PAD, position: 'relative',
                              }}
                            >
                              {checked && (
                                <motion.div
                                  initial={{ opacity: 0, scaleY: 0 }}
                                  animate={{ opacity: 1, scaleY: 1 }}
                                  exit={{ opacity: 0, scaleY: 0 }}
                                  transition={{ duration: 0.15 }}
                                  style={{
                                    position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2,
                                    width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT,
                                    backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                                  }}
                                />
                              )}
                              <span style={{
                                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`,
                                maxWidth: SUBMENU_WIDTH - SUBMENU_LEFT_PAD - 20 - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {option.name}
                              </span>
                              <div style={{ position: 'absolute', right: SUBMENU_RIGHT_PAD, width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }}>
                                <img src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {expanded === 'filter' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
              >
                <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearFilters}
                  style={{
                    ...btnBaseStyle,
                    width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px',
                  }}
                >
                  Очистить фильтр
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', top: 0,
            display: 'flex',
            gap: GROUP_GAP,
            alignItems: 'center',
          }}
          animate={{ left: groupLeft }}
          transition={SPRING}
        >
          <button
            onClick={openAddPopup}
            disabled={isPosted}
            style={{
              ...btnBaseStyle,
              width: ADD_BTN_W, height: ADD_BTN_H,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(102, 110, 254, 0.15)',
              cursor: isPosted ? 'not-allowed' : 'pointer',
              opacity: isPosted ? 0.5 : 1,
              display: 'flex', alignItems: 'center',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14, marginLeft: 12 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15, userSelect: 'none' }}>Добавить</span>
          </button>

          <button
            onClick={() => {
              if (isPosted) return;
              if (selectedRowIds.size === 0) return;
              const toCopy = bindings.filter(b => selectedRowIds.has(b.localId));
              const now = Date.now();
              const copies: BindingRow[] = toCopy.map((r, i) => ({
                ...r,
                localId: `row_${now}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                uid: undefined,
              }));
              setBindings(prev => [...prev, ...copies]);
              setSelectedRowIds(new Set());
            }}
            disabled={isPosted || selectedRowIds.size === 0}
            style={{
              ...docBtnStyle,
              cursor: (isPosted || selectedRowIds.size === 0) ? 'not-allowed' : 'pointer',
              opacity: (isPosted || selectedRowIds.size === 0) ? 0.5 : 1,
            }}
            title="Копировать выбранные"
          >
            <img src={FilesIcon14Black} alt="" style={{ width: 16, height: 16 }} />
          </button>

          <button
            onClick={() => {
              if (isPosted) return;
              if (selectedRowIds.size === 0) return;
              setBindings(prev => prev.filter(b => !selectedRowIds.has(b.localId)));
              setSelectedRowIds(new Set());
            }}
            disabled={isPosted || selectedRowIds.size === 0}
            style={{
              ...docBtnStyle,
              cursor: (isPosted || selectedRowIds.size === 0) ? 'not-allowed' : 'pointer',
              opacity: (isPosted || selectedRowIds.size === 0) ? 0.5 : 1,
            }}
            title="Удалить выбранные"
          >
            <img src={DeleteIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </button>
        </motion.div>

        <button
          style={{ ...docBtnStyle, position: 'absolute', left: btnPrintLeft, top: 0 }}
          title="Печать"
        >
          <img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </button>

        <button
          style={{ ...docBtnStyle, position: 'absolute', left: btnDownloadLeft, top: 0 }}
          title="Скачать"
        >
          <img src={DownloadIcon18Black} alt="" style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* === Таблица === */}
      <div style={{ position: 'absolute', top: TABLE_TOP, left: TABLE_LEFT, width: TABLE_W, height: TABLE_H }}>
        <DataTable
          columns={DOC_COLUMNS}
          visibleKeys={DOC_VISIBLE}
          data={tableRows}
          selectedIds={selectedRowIds}
          onCheckboxClick={handleCheckboxClick}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          onContextMenu={handleRowContextMenu}
          onDoubleClick={handleRowDoubleClick}
          renderCell={renderDocumentCell}
          isGrayColumn={(key) => key !== 'materialName' && key !== 'materialCode' && key !== 'materialArticle'}
          tableWidth={TABLE_W}
          rowHeight={TABLE_ROW_H}
          headerHeight={TABLE_HEADER_H}
          visibleRows={TABLE_VISIBLE_ROWS}
          fitToWidth
          highlightText={searchValue.trim() || undefined}
          centerColumns={CENTERED_COLUMNS}
        />
      </div>

      {/* === Нижний левый блок === */}
      <div
        style={{
          position: 'absolute',
          top: COUNTER_TOP,
          left: COUNTER_LEFT,
          width: COUNTER_W,
          height: COUNTER_H,
          backgroundColor: '#FFFFFF',
          borderRadius: 15,
          border: '1px solid rgba(102, 110, 254, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
          Количество номенклатуры
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', lineHeight: '18px' }}>
          {bindings.length}
        </span>
      </div>

      {/* === Нижние правые кнопки === */}
      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
        {!isPosted && (
          <button
            onClick={handlePost}
            disabled={!isEdit || bindings.length === 0}
            style={{
              width: 154, height: 51, borderRadius: 10,
              border: '1px solid rgba(102, 110, 254, 0.15)',
              backgroundColor: '#FFFFFF',
              cursor: (isEdit && bindings.length > 0) ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', paddingLeft: 20,
              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059',
              opacity: (isEdit && bindings.length > 0) ? 1 : 0.5,
            }}
          >
            <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
            <span style={{ marginLeft: 17 }}>Провести</span>
          </button>
        )}
        <button
          onClick={canSave ? handleSave : undefined}
          disabled={!canSave || isSaving}
          style={{
            width: 154, height: 51, borderRadius: 10,
            border: '1px solid rgba(102, 110, 254, 0.15)',
            backgroundColor: '#FFFFFF',
            cursor: canSave && !isSaving ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', paddingLeft: 20,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059',
            opacity: canSave ? 1 : 0.5,
          }}
        >
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17 }}>Записать</span>
        </button>
        <button
          onClick={() => setShowClosePopup(true)}
          style={{
            width: 116, height: 51, borderRadius: 10,
            border: '1px solid rgba(102, 110, 254, 0.15)',
            backgroundColor: '#FFFFFF', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059',
          }}
        >
          Закрыть
        </button>
      </div>

      {/* === Попап "Добавить / Изменить" — 481×481 === */}
      {addPopupOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={handleAddPopupClose}
        >
          <div
            style={{
              width: POPUP_W,
              height: POPUP_H,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div
              style={{
                position: 'absolute',
                top: P_TITLE_TOP,
                left: 0,
                right: 0,
                height: POPUP_TITLE_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 17,
                  fontWeight: 500,
                  color: '#2D4059',
                  lineHeight: `${POPUP_TITLE_H}px`,
                }}
              >
                {editRowLocalId ? 'Изменить запись' : 'Добавить номенклатуру'}
              </span>
            </div>

            {/* Поле 1: Номенклатура */}
            <div style={{ position: 'absolute', top: P_FIELD_1_TOP, left: POPUP_PAD }}>
              <FormField
                width={POPUP_FIELD_W} height={POPUP_FIELD_H}
                label="Номенклатура"
                value={addMaterialName}
                placeholder="Выберите номенклатуру"
                type="select"
                icon={NomenclatureIcon16Gray}
                iconActive={NomenclatureIcon16Blue}
                selectIconWidth={16}
                selectIconHeight={18}
                searchOptions={materialSelectOptions}
                onSelectOption={handleMaterialSelect}
                onOpenFullList={() => setAddFullListOpen(true)}
                searchTitle="Найденная номенклатура"
                searchNotFoundText="Номенклатура не найдена"
                labelMarginBottom={POPUP_LABEL_GAP}
              />
            </div>

            {/* Поле 2: Минимальный уровень остатка */}
            <div style={{ position: 'absolute', top: P_FIELD_2_TOP, left: POPUP_PAD }}>
              <FormField
                width={POPUP_FIELD_W} height={POPUP_FIELD_H}
                label="Минимальный уровень остатка"
                value={addMinStockDisplay}
                placeholder="0"
                type="input"
                inputType="number"
                icon={LevelIcon16Gray}
                iconActive={LevelIcon16Blue}
                iconWidth={16}
                iconHeight={14}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  const nv = v === '' ? '' : Number(v);
                  setAddMinStock(nv);
                  // Если критический уже введён и стал больше нового минимума — обрезаем до минимума
                  if (typeof nv === 'number' && typeof addCriticalStock === 'number' && addCriticalStock > nv) {
                    setAddCriticalStock(nv);
                  }
                }}
                labelMarginBottom={POPUP_LABEL_GAP}
              />
            </div>

            {/* Поле 3: Критический уровень остатка */}
            <div style={{ position: 'absolute', top: P_FIELD_3_TOP, left: POPUP_PAD }}>
              <FormField
                width={POPUP_FIELD_W} height={POPUP_FIELD_H}
                label="Критический уровень остатка"
                value={addCriticalStockDisplay}
                placeholder="0"
                type="input"
                inputType="number"
                icon={LevelIcon16Gray}
                iconActive={LevelIcon16Blue}
                iconWidth={16}
                iconHeight={14}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  const nv = v === '' ? '' : Number(v);
                  // Если минимум введён и критический больше минимума — принудительно ставим минимум
                  if (typeof nv === 'number' && typeof addMinStock === 'number' && nv > addMinStock) {
                    setAddCriticalStock(addMinStock);
                  } else {
                    setAddCriticalStock(nv);
                  }
                }}
                labelMarginBottom={POPUP_LABEL_GAP}
              />
            </div>

            {/* Кнопки */}
            <div
              style={{
                position: 'absolute',
                top: P_BUTTONS_TOP,
                right: POPUP_PAD,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <button
                onClick={handleAddPopupSave}
                disabled={!isAddPopupValid}
                style={{
                  width: 113,
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isAddPopupValid ? '#666EFE' : '#BCC8FF',
                  cursor: isAddPopupValid ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {editRowLocalId ? 'Сохранить' : 'Добавить'}
              </button>
              <button
                onClick={handleAddPopupClose}
                style={{
                  width: 108,
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(102, 110, 254, 0.15)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#2D4059',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Полный список номенклатуры === */}
      <CatalogSelectPopup
        isOpen={addFullListOpen}
        onClose={() => setAddFullListOpen(false)}
        onSelect={handleFullListSelect}
        popupType="analogSelect"
      />

      {/* === Полный список складов === */}
      <CatalogSelectPopup
        isOpen={stationPopupOpen}
        onClose={() => setStationPopupOpen(false)}
        onSelect={(id, name) => { setStationUid(id); setStationName(name); setStationPopupOpen(false); }}
        popupType="station"
      />

      {/* === Контекстное меню строки === */}
      {rowContextMenu && (
        <ContextMenu x={rowContextMenu.x} y={rowContextMenu.y} items={rowContextMenuItems} />
      )}

      {/* === Попап закрытия === */}
      {showClosePopup && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowClosePopup(false)}
        >
          <div
            style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>
              Закрыть вкладку
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>
              {canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canSave && (
                <button
                  onClick={handleSaveAndClose}
                  style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}
                >
                  Сохранить и закрыть
                </button>
              )}
              <button
                onClick={handleCloseWithoutSaving}
                style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}
              >
                Закрыть без сохранения
              </button>
              <button
                onClick={() => setShowClosePopup(false)}
                style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockLevelControlCreatePage;