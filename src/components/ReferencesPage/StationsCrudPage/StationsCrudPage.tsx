// StationsCrudPage.tsx — ИСПРАВЛЕННЫЙ (дефолтная инициализация + barcodeSearch в типе)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import HistoryTable from '../../elements/HistoryTable';
import DataTable from '../../elements/DataTable';
import TableToolbar from '../../elements/TableToolbar';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuCopyIcon16 from '../../../assets/Icons/CopyIcons/CopyIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import StationIcon16Black from '../../../assets/Icons/StationIcons/StationIcon16Black.svg';

interface StationRowData { [key: string]: any; }
interface StationListResponse { 
  columns: string[]; 
  data: StationRowData[]; 
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const REQUIRED_COLUMNS = new Set([
  'name', 'code', 'hasError', 'status', 'enterpriseName', 'workshopName', 'sectionName', 'modelName', 'stationType'
]);

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'code', label: 'Код' },
  { key: 'hasError', label: 'Ошибка' },
  { key: 'status', label: 'Статус' },
  { key: 'enterpriseName', label: 'Предприятие' },
  { key: 'workshopName', label: 'Цех' },
  { key: 'sectionName', label: 'Участок' },
  { key: 'modelName', label: 'Модель' },
  { key: 'stationType', label: 'Тип' },
  { key: 'isTmc', label: 'ТМЦ' },
  { key: 'isSgd', label: 'СГД' },
  { key: 'isOk', label: 'ОК' },
  { key: 'holdingName', label: 'Холдинг' },
  { key: 'description', label: 'Описание' },
  { key: 'configurationName', label: 'Конфигурация' },
  { key: 'hasAdditionalModule', label: 'Имеет доп. модуль' },
  { key: 'activeTemplateName', label: 'Шаблон' },
  { key: 'article', label: 'Артикул' },
  { key: 'productionDate', label: 'Дата производства' },
  { key: 'serialNumber', label: 'Серийный номер' },
  { key: 'revision', label: 'Ревизия' },
  { key: 'ipAddress', label: 'IP-адрес' },
  { key: 'networkPort', label: 'Порт' },
  { key: 'uid', label: 'UID' },
];

interface SortField { key: string; label: string; iconType?: '19' | '20' | null; isAccounting?: boolean; }
const SORT_FIELDS: SortField[] = [
  { key: 'code', label: 'Код', iconType: '19' }, { key: 'name', label: 'Наименование', iconType: '20' },
  { key: 'hasError', label: 'Ошибка' }, { key: 'status', label: 'Статус' },
  { key: 'sectionName', label: 'Размещение' }, { key: 'modelName', label: 'Модель станции' },
  { key: 'stationType', label: 'Тип станции' }, { key: 'isTmc', label: 'Вид учета', isAccounting: true },
  { key: 'configurationName', label: 'Конфигурация' }, { key: 'hasAdditionalModule', label: 'Имеет доп модуль' },
  { key: 'article', label: 'Артикул' }, { key: 'productionDate', label: 'Дата производства', iconType: '19' },
  { key: 'ipAddress', label: 'IP-адрес' },
];

const FILTER_FIELDS = [
  { key: 'status', label: 'Статус', options: [
    { uid: 'WORKING', name: 'В работе' },
    { uid: 'OFFLINE', name: 'Не в сети' },
    { uid: 'MINIMAL_STOCK', name: 'Минимальный остаток' },
    { uid: 'CRITICAL_STOCK', name: 'Критический остаток' },
  ]},
  { key: 'sectionName', label: 'Размещение' },
  { key: 'modelName', label: 'Модель станции' },
  { key: 'stationType', label: 'Тип станции' },
  { key: 'isTmc', label: 'Вид учета', options: [
    { uid: 'isTmc', name: 'ТМЦ' },
    { uid: 'isSgd', name: 'СГД' },
    { uid: 'isOk', name: 'ОК' },
  ]},
  { key: 'hasError', label: 'Ошибка', options: [
    { uid: 'true', name: 'Ошибка на станции' },
  ]},
  { key: 'configurationName', label: 'Конфигурация' },
  { key: 'hasAdditionalModule', label: 'Имеет доп. модуль', options: [
    { uid: 'true', name: 'Станция имеет доп. модуль' },
  ]},
  { key: 'article', label: 'Артикул' },
];

const PLACEMENT_LEVELS = [
  { key: 'holdingName', label: 'Холдинг', emptyText: 'Нет холдингов' },
  { key: 'enterpriseName', label: 'Предприятие', emptyText: 'Нет предприятий' },
  { key: 'workshopName', label: 'Цех', emptyText: 'Нет цехов' },
  { key: 'sectionName', label: 'Участок', emptyText: 'Нет участков' },
];

interface HierarchyDTO { holdings: HoldingDTO[] }
interface HoldingDTO { id: number; name: string; enterprises: EnterpriseDTO[] }
interface EnterpriseDTO { id: number; name: string; holdingId: number; workshops: WorkshopDTO[] }
interface WorkshopDTO { id: number; name: string; enterpriseId: number; holdingId: number; sections: SectionDTO[] }
interface SectionDTO { id: number; name: string; workshopId: number; enterpriseId: number; holdingId: number }

type PlacementKey = typeof PLACEMENT_LEVELS[number]['key'];
type PlacementSelections = Record<PlacementKey, Set<string>>;

const ACCOUNTING_TYPES = ['ТМЦ', 'СГД', 'ОК'] as const;
const ACCOUNTING_COLUMN_KEYS = ['isTmc', 'isSgd', 'isOk'] as const;
const USER_ID = 1;

const TABLE_WIDTH = 1720;
const CHECKBOX_LEFT = 17;
const CHECKBOX_BLOCK_WIDTH = 24;
const CHECKBOX_TO_ICON_GAP = 17;
const ROW_ICON_BLOCK_WIDTH = 20;
const ICON_TO_FIRST_TEXT = 17;
const LAST_COLUMN_RIGHT_PADDING = 30;
const RESIZER_WIDTH = 60;

const EFFECTIVE_FIRST_COL_LEFT = CHECKBOX_LEFT + CHECKBOX_BLOCK_WIDTH + CHECKBOX_TO_ICON_GAP + ROW_ICON_BLOCK_WIDTH + ICON_TO_FIRST_TEXT;

const calculateAdaptiveWidths = (columnKeys: string[]): Record<string, number> => {
  if (columnKeys.length === 0) return {};
  
  const totalResizerWidth = RESIZER_WIDTH * (columnKeys.length - 1);
  const availableWidth = TABLE_WIDTH - EFFECTIVE_FIRST_COL_LEFT - LAST_COLUMN_RIGHT_PADDING - totalResizerWidth;
  const columnWidth = availableWidth / columnKeys.length;
  
  const widths: Record<string, number> = {};
  columnKeys.forEach(key => {
    widths[key] = columnWidth;
  });
  
  return widths;
};

const EMPTY_PLACEMENT: PlacementSelections = { holdingName: new Set(), enterpriseName: new Set(), workshopName: new Set(), sectionName: new Set() };

const STATUS_ORDER: Record<string, number> = {
  'WORKING': 0,
  'OFFLINE': 1,
  'MINIMAL_STOCK': 2,
  'CRITICAL_STOCK': 3,
};

type ExpandedType = 'search' | 'sort' | 'filter' | 'barcodeSearch' | null;

const StationsCrudPage = () => {
  const { openTab } = useTabs();
  const [responseData, setResponseData] = useState<StationListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(REQUIRED_COLUMNS));
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [deleteTargetUid, setDeleteTargetUid] = useState<string | null>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedType>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [accountingIndex, setAccountingIndex] = useState(-1);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [placementSelections, setPlacementSelections] = useState<PlacementSelections>(EMPTY_PLACEMENT);
  const [hierarchy, setHierarchy] = useState<HierarchyDTO | null>(null);
  const [modelList, setModelList] = useState<{ uid: string; name: string; article: string }[]>([]);
  const [configList, setConfigList] = useState<string[]>([]);
  const [typeList, setTypeList] = useState<{ uid: string; name: string }[]>([]);
  const [isFirstInit, setIsFirstInit] = useState(false);

  const filterOptions = useMemo(() => ({
    status: FILTER_FIELDS.find(f => f.key === 'status')?.options || [],
    stationType: typeList.map(t => ({ uid: t.name, name: t.name })),
    isTmc: FILTER_FIELDS.find(f => f.key === 'isTmc')?.options || [],
    hasError: FILTER_FIELDS.find(f => f.key === 'hasError')?.options || [],
    hasAdditionalModule: FILTER_FIELDS.find(f => f.key === 'hasAdditionalModule')?.options || [],
    modelName: modelList.map(m => ({ uid: m.uid, name: m.name })),
    configurationName: configList.map(c => ({ uid: c, name: c })),
    article: modelList.filter(m => m.article).map(m => ({ uid: m.article, name: m.article })),
  }), [typeList, modelList, configList]);

  const fetchData = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID)); 
      const response = r.data as StationListResponse;
      
      let effectiveColumns = response.columns;
      let effectiveRequiredColumns = new Set(REQUIRED_COLUMNS);
      
      if (response.requiredColumns && response.requiredColumns.length > 0) {
        effectiveRequiredColumns = new Set(response.requiredColumns);
      }
      
      let effectiveColumnWidths = response.columnWidths || {};
      
      if (!effectiveColumns || effectiveColumns.length === 0) {
        setIsFirstInit(true);
        effectiveColumns = ALL_COLUMNS.filter(c => effectiveRequiredColumns.has(c.key)).map(c => c.key);
        effectiveColumnWidths = calculateAdaptiveWidths(effectiveColumns);
      } else {
        effectiveRequiredColumns.forEach(key => {
          if (!effectiveColumns.includes(key)) {
            effectiveColumns = [...effectiveColumns, key];
          }
        });
        if (Object.keys(effectiveColumnWidths).length === 0) {
          effectiveColumnWidths = calculateAdaptiveWidths(effectiveColumns);
        }
      }
      
      setRequiredColumns(effectiveRequiredColumns);
      setVisibleColumns(new Set(effectiveColumns));
      setColumnWidths(effectiveColumnWidths);
      
      setResponseData({
        ...response,
        columns: effectiveColumns,
        columnWidths: effectiveColumnWidths,
        requiredColumns: Array.from(effectiveRequiredColumns),
      });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    } 
  };

  useEffect(() => {
    if (isFirstInit && !isLoading) {
      const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
      ALL_COLUMNS.forEach(col => {
        columnsJsonObj[col.key] = {
          visible: visibleColumns.has(col.key),
          width: columnWidths[col.key] || 0,
          required: requiredColumns.has(col.key),
        };
      });
      const columnsJson = JSON.stringify(columnsJsonObj);
      AxiosService.patch(ConstantInfo.restApiStationColumnsSettingsSave(USER_ID), { columnsJson })
        .then(() => setIsFirstInit(false))
        .catch(e => {
          console.error('Ошибка сохранения настроек колонок:', e);
          setIsFirstInit(false);
        });
    }
  }, [isFirstInit, isLoading, visibleColumns, columnWidths, requiredColumns]);

  const handleColumnWidthsChange = useCallback((widths: Record<string, number>) => {
    setColumnWidths(widths);
    
    const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
    ALL_COLUMNS.forEach(col => {
      columnsJsonObj[col.key] = {
        visible: visibleColumns.has(col.key),
        width: widths[col.key] || 0,
        required: requiredColumns.has(col.key),
      };
    });
    
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(ConstantInfo.restApiStationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [visibleColumns, requiredColumns]);

  const handleResetToBase = useCallback(() => {
    const baseCols = new Set(requiredColumns);
    setVisibleColumns(baseCols);
    const newCols = ALL_COLUMNS.filter(c => baseCols.has(c.key)).map(c => c.key);
    setResponseData(prev => ({ ...prev, columns: newCols }));
    const newWidths = calculateAdaptiveWidths(newCols);
    setColumnWidths(newWidths);
    
    const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
    ALL_COLUMNS.forEach(col => {
      columnsJsonObj[col.key] = {
        visible: requiredColumns.has(col.key),
        width: newWidths[col.key] || 0,
        required: requiredColumns.has(col.key),
      };
    });
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(ConstantInfo.restApiStationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationAllSettings(USER_ID)); 
      const settings = r.data as { filtersJson: string; sortJson: string };
      
      if (settings.filtersJson && settings.filtersJson !== '{}') {
        const filters = JSON.parse(settings.filtersJson) as Record<string, any>;
        const newFilterValues: Record<string, Set<string>> = {};
        const newActiveFilters = new Set<string>();
        
        Object.entries(filters).forEach(([key, values]) => {
          if (key === 'placementSelections') return;
          if (Array.isArray(values) && values.length > 0) {
            newFilterValues[key] = new Set(values as string[]);
            newActiveFilters.add(key);
          }
        });
        
        setFilterValues(newFilterValues);
        setActiveFilters(newActiveFilters);
        
        const placementData = filters.placementSelections as any;
        if (placementData && typeof placementData === 'object') {
          setPlacementSelections({
            holdingName: Array.isArray(placementData.holdingName) ? new Set<string>(placementData.holdingName) : new Set<string>(),
            enterpriseName: Array.isArray(placementData.enterpriseName) ? new Set<string>(placementData.enterpriseName) : new Set<string>(),
            workshopName: Array.isArray(placementData.workshopName) ? new Set<string>(placementData.workshopName) : new Set<string>(),
            sectionName: Array.isArray(placementData.sectionName) ? new Set<string>(placementData.sectionName) : new Set<string>(),
          });
        }
      }
      
      if (settings.sortJson && settings.sortJson !== '{}') {
        const sort = JSON.parse(settings.sortJson) as { column?: string; direction?: 'asc' | 'desc'; accountingIndex?: number };
        if (sort.column) {
          setSortColumn(sort.column);
          setSortDirection(sort.direction || 'asc');
          setAccountingIndex(sort.accountingIndex !== undefined ? sort.accountingIndex : -1);
        }
      }
    } catch (e) { 
      console.error(e); 
    } 
  };
  
  const saveFilters = useCallback((filters: Record<string, Set<string>>, placement: PlacementSelections) => {
    const filtersJsonObj: Record<string, any> = {};
    
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) {
        filtersJsonObj[key] = Array.from(values);
      }
    });
    
    const placementObj: Record<string, string[]> = {};
    (Object.keys(placement) as PlacementKey[]).forEach(key => {
      if (placement[key].size > 0) {
        placementObj[key] = Array.from(placement[key]);
      }
    });
    
    if (Object.keys(placementObj).length > 0) {
      filtersJsonObj.placementSelections = placementObj;
    }
    
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(ConstantInfo.restApiStationFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);
  
  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc', accountingIdx: number) => {
    let sortJson = '{}';
    
    if (column) {
      const sortObj: Record<string, any> = { column, direction };
      if (column === 'isTmc' && accountingIdx >= 0) {
        sortObj.accountingIndex = accountingIdx;
      }
      sortJson = JSON.stringify(sortObj);
    }
    
    AxiosService.patch(ConstantInfo.restApiStationSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);
  
  const fetchHistory = async () => { 
    setHistoryLoading(true); 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationEvents); 
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription }))); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setHistoryLoading(false); 
    } 
  };
  
  const fetchHierarchy = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiLocationHierarchy); 
      setHierarchy(r.data); 
    } catch (e) { 
      console.error(e); 
    } 
  };
  
  const fetchModels = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationModels}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setModelList(items.map((m: any) => ({ uid: m.uid, name: m.name, article: m.article || '' }))); 
    } catch (e) { 
      console.error(e); 
    } 
  };
  
  const fetchConfigurations = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationConfigurations}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setConfigList(items.map((c: any) => c.name)); 
    } catch (e) { 
      console.error(e); 
    } 
  };
  
  const fetchTypes = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationTypes}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setTypeList(items.map((item: any) => ({ uid: item.uid, name: item.name }))); 
    } catch (e) { console.error(e); } 
  };

  useEffect(() => { fetchData(); fetchHierarchy(); fetchSettings(); fetchTypes(); }, []);

  const hasPlacementSelections = useMemo(() => (Object.values(placementSelections) as Set<string>[]).some(s => s.size > 0), [placementSelections]);
  
  useEffect(() => { 
    setActiveFilters(prev => { 
      const next = new Set(prev); 
      if (hasPlacementSelections) next.add('sectionName'); 
      else next.delete('sectionName'); 
      return next; 
    }); 
  }, [hasPlacementSelections]);

  useEffect(() => {
    if (!isLoading) {
      saveFilters(filterValues, placementSelections);
    }
  }, [filterValues, placementSelections, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveSort(sortColumn, sortDirection, accountingIndex);
    }
  }, [sortColumn, sortDirection, accountingIndex, isLoading]);

  const ensureColumnVisible = useCallback((key: string) => {
    setVisibleColumns(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      setResponseData(prevData => {
        if (prevData.columns.includes(key)) return prevData;
        return { ...prevData, columns: [...prevData.columns, key] };
      });
      return next;
    });
  }, []);

  const ensurePlacementColumnsVisible = useCallback(() => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      let changed = false;
      PLACEMENT_LEVELS.forEach(level => {
        if (!next.has(level.key)) {
          next.add(level.key);
          changed = true;
        }
      });
      if (changed) {
        setResponseData(prevData => {
          const newColumns = [...prevData.columns];
          PLACEMENT_LEVELS.forEach(level => {
            if (!newColumns.includes(level.key)) {
              newColumns.push(level.key);
            }
          });
          return { ...prevData, columns: newColumns };
        });
      }
      return next;
    });
  }, []);

  const ensureAccountingColumnsVisible = useCallback(() => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      let changed = false;
      ACCOUNTING_COLUMN_KEYS.forEach(key => {
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      });
      if (changed) {
        setResponseData(prevData => {
          const newColumns = [...prevData.columns];
          ACCOUNTING_COLUMN_KEYS.forEach(key => {
            if (!newColumns.includes(key)) {
              newColumns.push(key);
            }
          });
          return { ...prevData, columns: newColumns };
        });
      }
      return next;
    });
  }, []);

  const handleSortSelect = (col: string) => {
    if (col === 'sectionName') {
      ensurePlacementColumnsVisible();
    } else {
      ensureColumnVisible(col);
    }
    if (col !== 'isTmc') setAccountingIndex(-1);
    
    const reversibleFields = ['code', 'name', 'productionDate'];
    
    if (sortColumn === col) {
      if (reversibleFields.includes(col)) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };
  
  const handleAccountingClick = () => {
    const newIndex = accountingIndex === -1 ? 0 : accountingIndex === 2 ? 0 : accountingIndex + 1;
    ensureAccountingColumnsVisible();
    setAccountingIndex(newIndex);
    setSortColumn('isTmc');
    setSortDirection('asc');
  };
  
  const handleClearSort = () => { 
    setSortColumn(null); 
    setAccountingIndex(-1);
  };

  const handleFilterToggle = (key: string) => {
    if (key === 'sectionName') {
      ensurePlacementColumnsVisible();
      fetchHierarchy();
    }
    if (key === 'modelName') {
      fetchModels();
    }
    if (key === 'configurationName') {
      fetchConfigurations();
    }
    if (key === 'article') {
      fetchModels();
    }
    if (key === 'isTmc') {
      ensureAccountingColumnsVisible();
    }
    if (key === 'stationType') {
      fetchTypes();
    }
  };

  const handleCheckFilterOption = (filterKey: string, optionUid: string) => {
    if (filterKey === 'isTmc') {
      ensureAccountingColumnsVisible();
    } else if (filterKey === 'hasError') {
      ensureColumnVisible('hasError');
    } else if (filterKey === 'sectionName') {
      ensurePlacementColumnsVisible();
    } else {
      ensureColumnVisible(filterKey);
    }
    
    setActiveFilters(prev => { 
      const next = new Set(prev); 
      next.add(filterKey); 
      return next; 
    });
    
    setFilterValues(prev => {
      const current = new Set(prev[filterKey] || []);
      if (current.has(optionUid)) current.delete(optionUid); 
      else current.add(optionUid);
      if (current.size === 0) {
        const { [filterKey]: _, ...rest } = prev;
        setActiveFilters(prev2 => { 
          const n = new Set(prev2); 
          n.delete(filterKey); 
          return n; 
        });
        return rest;
      }
      return { ...prev, [filterKey]: current };
    });
  };

  const findParentValues = (level: PlacementKey, value: string): Partial<Record<PlacementKey, string>> => { 
    if (!hierarchy) return {}; 
    const result: Partial<Record<PlacementKey, string>> = {}; 
    if (level === 'sectionName') { 
      for (const h of hierarchy.holdings) 
        for (const e of h.enterprises) 
          for (const w of e.workshops) { 
            const s = w.sections.find(s => String(s.id) === value); 
            if (s) { 
              result.holdingName = String(h.id); 
              result.enterpriseName = String(e.id); 
              result.workshopName = String(w.id); 
              return result; 
            } 
          } 
    } 
    if (level === 'workshopName') { 
      for (const h of hierarchy.holdings) 
        for (const e of h.enterprises) { 
          const w = e.workshops.find(w => String(w.id) === value); 
          if (w) { 
            result.holdingName = String(h.id); 
            result.enterpriseName = String(e.id); 
            return result; 
          } 
        } 
    } 
    if (level === 'enterpriseName') { 
      for (const h of hierarchy.holdings) { 
        const e = h.enterprises.find(e => String(e.id) === value); 
        if (e) { 
          result.holdingName = String(h.id); 
          return result; 
        } 
      } 
    } 
    return result; 
  };
  
  const handlePlacementCheck = (level: PlacementKey, value: string) => { 
    ensurePlacementColumnsVisible();
    setPlacementSelections(prev => { 
      const current = new Set(prev[level] || []); 
      if (current.has(value)) { 
        current.delete(value); 
        const next = { ...prev, [level]: current }; 
        const idx = PLACEMENT_LEVELS.findIndex(l => l.key === level); 
        for (let i = idx + 1; i < PLACEMENT_LEVELS.length; i++) 
          next[PLACEMENT_LEVELS[i].key] = new Set(); 
        if (current.size === 0) next[level] = new Set(); 
        return next; 
      } else { 
        current.add(value); 
        const next = { ...prev, [level]: current }; 
        const parents = findParentValues(level, value); 
        (Object.keys(parents) as PlacementKey[]).forEach((key) => { 
          if (parents[key] && !next[key]?.has(parents[key]!)) 
            next[key] = new Set([...(next[key] || []), parents[key]!]); 
        }); 
        return next; 
      } 
    }); 
  };
  
  const handleClearFilters = () => { 
    setActiveFilters(new Set()); 
    setFilterValues({}); 
    setPlacementSelections(EMPTY_PLACEMENT); 
  };
  
  const handleDoubleClick = (uid: string, name: string) => 
    openTab(`/references/stations/edit/${uid}`, `Станция: ${name}`, null);
  
  const handleSaveColumns = (cols: Set<string>) => { 
    const finalCols = new Set(cols);
    requiredColumns.forEach(key => finalCols.add(key));
    
    setVisibleColumns(finalCols); 
    const newCols = ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key);
    setResponseData(prev => ({ ...prev, columns: newCols }));
    const newWidths = calculateAdaptiveWidths(newCols);
    setColumnWidths(newWidths);
    
    const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
    ALL_COLUMNS.forEach(col => {
      columnsJsonObj[col.key] = {
        visible: requiredColumns.has(col.key) ? true : finalCols.has(col.key),
        width: newWidths[col.key] || 0,
        required: requiredColumns.has(col.key),
      };
    });
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(ConstantInfo.restApiStationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  };
  
  const handleHistoryClick = () => { 
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const rowContextMenuItems = useCallback((uid: string, name: string): ContextMenuItem[] => {
    return [
      { id: 'open', label: 'Открыть', icon: ContextMenuOpenIcon16, onClick: () => { 
        const item = responseData.data.find(d => d.uid === uid); 
        if (item) { 
          openTab(`/references/stations/edit/${item.uid}`, `Станция: ${item.name}`, null); 
        } 
      } },
      { id: 'copy', label: 'Копировать', icon: ContextMenuCopyIcon16, onClick: () => { 
        navigator.clipboard.writeText(uid).catch(() => {}); 
      } },
      { id: 'delete', label: 'Удалить', icon: ContextMenuDeleteIcon16, onClick: () => { 
        setDeleteTargetUid(uid); 
        setTimeout(() => setShowDeleteConfirm(true), 50); 
      } },
    ];
  }, [responseData.data, openTab]);

  const formatCode = (code: number) => String(code).padStart(4, '0'); 
  const formatBool = (val: boolean) => val ? 'Да' : 'Нет';
  
  const renderCell = (key: string, item: StationRowData): string => { 
    const val = item[key]; 
    if (val === null || val === undefined) return '-'; 
    switch (key) { 
      case 'code': return formatCode(Number(val)); 
      case 'hasError': 
      case 'isTmc': 
      case 'isSgd': 
      case 'isOk': 
      case 'hasAdditionalModule': return formatBool(Boolean(val)); 
      case 'networkPort': return val ? String(val) : '-'; 
      case 'status': {
        const statusMap: Record<string, string> = {
          'WORKING': 'В работе',
          'OFFLINE': 'Не в сети',
          'MINIMAL_STOCK': 'Минимальный остаток',
          'CRITICAL_STOCK': 'Критический остаток',
        };
        return statusMap[val] || val;
      }
      case 'stationType': return String(val);
      default: return String(val); 
    } 
  };
  
  const isGrayColumn = (key: string): boolean => 
    !['code', 'name', 'status', 'hasError', 'isTmc', 'isSgd', 'isOk', 'hasAdditionalModule'].includes(key);
  
  const confirmDelete = async () => { 
    try { 
      if (deleteTargetUid) await AxiosService.delete(ConstantInfo.restApiStationCrud(deleteTargetUid) + '?author=admin'); 
      else for (const uid of selectedIds) await AxiosService.delete(ConstantInfo.restApiStationCrud(uid) + '?author=admin'); 
      await fetchData(); 
      setSelectedIds(new Set()); 
      setDeleteTargetUid(null); 
      setShowDeleteConfirm(false); 
    } catch (e) { 
      console.error(e); 
    } 
  };

  const getSortValue = (row: StationRowData, sortKey: string): any => {
    const code = String(row['code'] || '').padStart(4, '0');
    
    switch (sortKey) {
      case 'sectionName': {
        const holding = row['holdingName'] || '';
        const enterprise = row['enterpriseName'] || '';
        const workshop = row['workshopName'] || '';
        const section = row['sectionName'] || '';
        
        if (!holding) return `999|${code}`;
        if (!enterprise) return `998|${holding}|${code}`;
        if (!workshop) return `997|${holding}|${enterprise}|${code}`;
        if (!section) return `996|${holding}|${enterprise}|${workshop}|${code}`;
        
        return `0|${holding}|${enterprise}|${workshop}|${section}|${code}`;
      }
      case 'stationType': {
        const t = row['stationType'] || '';
        return `0|${t}|${code}`;
      }
      case 'status': {
        const s = row['status'] || '';
        const order = STATUS_ORDER[s] ?? 99;
        return `${order}|${code}`;
      }
      case 'isTmc': {
        const tmc = row['isTmc'] === true;
        const ok = row['isOk'] === true;
        const sgd = row['isSgd'] === true;
        
        if (accountingIndex === 0) {
          if (tmc && !ok && !sgd) return `0|${code}`;
          if (tmc && ok && !sgd) return `1|${code}`;
          if (tmc && ok && sgd) return `2|${code}`;
          if (tmc && !ok && sgd) return `3|${code}`;
          if (sgd && !tmc && !ok) return `4|${code}`;
          return `5|${code}`;
        } else if (accountingIndex === 1) {
          if (sgd && !tmc && !ok) return `0|${code}`;
          if (sgd && tmc && !ok) return `1|${code}`;
          if (sgd && tmc && ok) return `2|${code}`;
          if (!sgd && tmc && ok) return `3|${code}`;
          if (!sgd && tmc && !ok) return `4|${code}`;
          return `5|${code}`;
        } else {
          if (ok && !tmc && !sgd) return `0|${code}`;
          if (ok && tmc && !sgd) return `1|${code}`;
          if (ok && tmc && sgd) return `2|${code}`;
          if (!ok && tmc && sgd) return `3|${code}`;
          if (!ok && tmc && !sgd) return `4|${code}`;
          if (!ok && !tmc && sgd) return `5|${code}`;
          return `6|${code}`;
        }
      }
      case 'hasError':
      case 'hasAdditionalModule': {
        const val = row[sortKey];
        if (val === null || val === undefined || val === '') return `999|${code}`;
        return `${val ? '1' : '0'}|${code}`;
      }
      case 'modelName':
      case 'configurationName':
      case 'ipAddress':
      case 'article': {
        const val = row[sortKey];
        if (!val || val === '-') return `999|${code}`;
        return `0|${val}|${code}`;
      }
      case 'productionDate': {
        const val = row['productionDate'];
        if (!val) return '999';
        return val;
      }
      case 'name': {
        const val = row['name'];
        if (!val || val === '-') return `999|${code}`;
        return `0|${val}|${code}`;
      }
      case 'code':
        return Number(row['code'] || 0);
      default: {
        const val = row[sortKey];
        if (!val || val === '-') return `999|${code}`;
        return `0|${val}|${code}`;
      }
    }
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    
    if (searchValue.trim()) { 
      const q = searchValue.toLowerCase(); 
      result = result.filter(row => 
        responseData.columns.some(col => { 
          const v = row[col]; 
          return v !== null && v !== undefined && String(v).toLowerCase().includes(q); 
        })
      ); 
    }
    
    if (filterValues['status'] && filterValues['status'].size > 0) 
      result = result.filter(row => filterValues['status'].has(String(row['status'])));
    
    if (filterValues['stationType'] && filterValues['stationType'].size > 0) 
      result = result.filter(row => filterValues['stationType'].has(String(row['stationType'])));
    
    if (filterValues['isTmc'] && filterValues['isTmc'].size > 0) {
      result = result.filter(row => {
        return Array.from(filterValues['isTmc']).every(uid => {
          return row[uid] === true;
        });
      });
    }
    
    if (filterValues['hasError'] && filterValues['hasError'].size > 0) 
      result = result.filter(row => row['hasError'] === true);
    
    if (filterValues['hasAdditionalModule'] && filterValues['hasAdditionalModule'].size > 0) 
      result = result.filter(row => row['hasAdditionalModule'] === true);
    
    if (filterValues['configurationName'] && filterValues['configurationName'].size > 0) 
      result = result.filter(row => filterValues['configurationName'].has(String(row['configurationName'])));
    
    if (filterValues['modelName'] && filterValues['modelName'].size > 0) 
      result = result.filter(row => filterValues['modelName'].has(String(row['modelId'])));
    
    if (filterValues['article'] && filterValues['article'].size > 0) 
      result = result.filter(row => filterValues['article'].has(String(row['article'])));
    
    if (placementSelections['holdingName'] && placementSelections['holdingName'].size > 0) 
      result = result.filter(row => placementSelections['holdingName'].has(String(row['holdingId'])));
    if (placementSelections['enterpriseName'] && placementSelections['enterpriseName'].size > 0) 
      result = result.filter(row => placementSelections['enterpriseName'].has(String(row['enterpriseId'])));
    if (placementSelections['workshopName'] && placementSelections['workshopName'].size > 0) 
      result = result.filter(row => placementSelections['workshopName'].has(String(row['workshopId'])));
    if (placementSelections['sectionName'] && placementSelections['sectionName'].size > 0) 
      result = result.filter(row => placementSelections['sectionName'].has(String(row['sectionId'])));
    
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = getSortValue(a, sortColumn);
        const bVal = getSortValue(b, sortColumn);
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal);
        const bStr = String(bVal);
        
        if (['status', 'stationType', 'sectionName', 'isTmc'].includes(sortColumn)) {
          return aStr.localeCompare(bStr);
        }
        
        if (['hasError', 'hasAdditionalModule'].includes(sortColumn)) {
          return bStr.localeCompare(aStr);
        }
        
        if (['code', 'name', 'productionDate'].includes(sortColumn)) {
          return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }
        
        return aStr.localeCompare(bStr);
      });
    }
    
    return result;
  }, [responseData.data, responseData.columns, searchValue, filterValues, placementSelections, sortColumn, sortDirection, accountingIndex]);

  if (isLoading) 
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );

  const toggleSelectItem = (uid: string) => 
    setSelectedIds(prev => { 
      const n = new Set(prev); 
      n.has(uid) ? n.delete(uid) : n.add(uid); 
      return n; 
    });
  
  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { 
    e.stopPropagation(); 
    toggleSelectItem(uid); 
  };
  
  const handleRowClick = (uid: string, e: React.MouseEvent) => { 
    e.stopPropagation(); 
    toggleSelectItem(uid); 
  };
  
  const handleSelectAll = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    const all = filteredData.length > 0 && filteredData.every(d => selectedIds.has(d.uid)); 
    all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredData.map(d => d.uid))); 
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Станции (История изменений)' : 'Справочник: Станции'}
        </h1>
      </div>
      
      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar 
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={PLACEMENT_LEVELS}
          accountingTypes={ACCOUNTING_TYPES}
          accountingColumnKeys={ACCOUNTING_COLUMN_KEYS}
          filterOptions={filterOptions}
          
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          accountingIndex={accountingIndex}
          onSortSelect={handleSortSelect}
          onAccountingClick={handleAccountingClick}
          onClearSort={handleClearSort}
          
          activeFilters={activeFilters}
          filterValues={filterValues}
          placementSelections={placementSelections}
          hasPlacementSelections={hasPlacementSelections}
          onFilterToggle={handleFilterToggle}
          onCheckFilterOption={handleCheckFilterOption}
          onPlacementLevelClick={() => {}}
          onPlacementCheck={handlePlacementCheck}
          onClearFilters={handleClearFilters}
          
          hierarchy={hierarchy}
          modelList={modelList}
          configList={configList}
          onFetchHierarchy={fetchHierarchy}
          onFetchModels={fetchModels}
          onFetchConfigurations={fetchConfigurations}
          
          selectedCount={selectedIds.size}
          onCreate={async () => { 
            try { 
              const r = await AxiosService.get(ConstantInfo.restApiStationsCrudGenerateCode); 
              openTab(`/references/stations/create/${crypto.randomUUID()}`, `Станция: ${String(r.data).padStart(4, '0')}`, null); 
            } catch { 
              openTab(`/references/stations/create/${crypto.randomUUID()}`, 'Станция (новая)', null); 
            } 
          }}
          onDelete={() => { if (selectedIds.size > 0) { setDeleteTargetUid(null); setShowDeleteConfirm(true); } }}
          onPrint={() => {}}
          onPrintPdf={() => {}}
          showHistory={showHistory}
          onHistory={handleHistoryClick}
          onConfiguration={() => setShowConfigurationPopup(true)}
          
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
      
      <div style={{ position: 'absolute', top: 162, left: 40, right: 15, bottom: 0, overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {showHistory ? (
            <motion.div 
              key="history"
              initial={{ x: 'calc(100% + 40px)', opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 'calc(100% + 40px)', opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            >
              <HistoryTable events={historyEvents} isLoading={historyLoading} />
            </motion.div>
          ) : (
            <motion.div 
              key="data"
              initial={{ x: 'calc(-100% - 40px)', opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 'calc(-100% - 40px)', opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            >
              <DataTable 
                columns={ALL_COLUMNS} 
                visibleKeys={responseData.columns} 
                data={filteredData} 
                selectedIds={selectedIds} 
                onCheckboxClick={handleCheckboxClick} 
                onSelectAll={handleSelectAll} 
                onRowClick={handleRowClick} 
                onDoubleClick={handleDoubleClick} 
                renderCell={renderCell} 
                isGrayColumn={isGrayColumn} 
                highlightText={searchValue.trim() || undefined}
                initialWidths={columnWidths}
                onWidthsChange={handleColumnWidthsChange}
                rowContextMenuItems={rowContextMenuItems}
                requiredColumns={requiredColumns}
                onResetToBase={handleResetToBase}
                rowIcon={StationIcon16Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ConfigurationPopup 
        isOpen={showConfigurationPopup} 
        onClose={() => setShowConfigurationPopup(false)} 
        title="Справочник: Станции (Настройки списка)" 
        columns={ALL_COLUMNS} 
        visibleColumns={visibleColumns} 
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns} 
      />
      
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} 
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>
              Подтверждение удаления
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>
              Вы уверены, что хотите удалить выбранные элементы?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} 
                style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Отмена
              </button>
              <button onClick={confirmDelete} 
                style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationsCrudPage;