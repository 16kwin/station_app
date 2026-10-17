// MoveOrderPage.tsx — журнал документов «Заказ на перемещение»
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTabs } from '../../../context/TabContext';
import { motion } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import DataTable from '../../elements/DataTable';
import TableToolbar from '../../elements/TableToolbar';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuCopyIcon16 from '../../../assets/Icons/CopyIcons/CopyIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DocumentIcon16Black from '../../../assets/Icons/StationIcons/StationIcon16Black.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';

interface RowData { [key: string]: any; }
interface ListResponse {
  columns: string[];
  data: RowData[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const REQUIRED_COLUMNS = new Set(['code', 'docDatetime', 'stockToName', 'status']);
const ALL_COLUMNS: ColumnItem[] = [
  { key: 'code', label: 'Код' },
  { key: 'docDatetime', label: 'Дата' },
  { key: 'stockToName', label: 'Склад-получатель' },
  { key: 'deadline', label: 'Крайний срок' },
  { key: 'comment', label: 'Комментарий' },
  { key: 'status', label: 'Статус' },
  { key: 'uid', label: 'UID' },
];

interface SortField { key: string; label: string; iconType?: '19' | '20' | null; }
const SORT_FIELDS: SortField[] = [
  { key: 'code', label: 'Код', iconType: '19' },
  { key: 'docDatetime', label: 'Дата', iconType: '19' },
  { key: 'stockToName', label: 'Склад-получатель' },
  { key: 'deadline', label: 'Крайний срок', iconType: '19' },
  { key: 'status', label: 'Статус' },
];

const FILTER_FIELDS = [
  { key: 'stockToName', label: 'Склад-получатель' },
  { key: 'status', label: 'Статус', options: [
    { uid: 'DRAFT', name: 'Не акцептован' },
    { uid: 'POSTED', name: 'Проведён' },
    { uid: 'ACCEPTED', name: 'Акцептован' },
    { uid: 'CANCELLED', name: 'Отменён' },
  ]},
];

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
  columnKeys.forEach(key => { widths[key] = columnWidth; });
  return widths;
};

type ExpandedType = 'search' | 'sort' | 'filter' | 'barcodeSearch' | null;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Не акцептован',
  POSTED: 'Проведён',
  ACCEPTED: 'Акцептован',
  CANCELLED: 'Отменён',
};

const MoveOrderPage = () => {
  const { openTab } = useTabs();
  const [responseData, setResponseData] = useState<ListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(REQUIRED_COLUMNS));
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [deleteTargetUid, setDeleteTargetUid] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedType>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [isFirstInit, setIsFirstInit] = useState(false);
  const [stationOptions, setStationOptions] = useState<{ uid: string; name: string }[]>([]);

  // Обычное создание
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formStockToUid, setFormStockToUid] = useState('');
  const [formStockToName, setFormStockToName] = useState('');
  const [showStationSelect, setShowStationSelect] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Создание на основании
  const [showBasedPopup, setShowBasedPopup] = useState(false);
  const [basedSourceUid, setBasedSourceUid] = useState<string | null>(null);
  const [basedStockToUid, setBasedStockToUid] = useState('');
  const [basedStockToName, setBasedStockToName] = useState('');
  const [showBasedStationSelect, setShowBasedStationSelect] = useState(false);
  const [isCreatingBased, setIsCreatingBased] = useState(false);

  const filterOptions = useMemo(() => ({
    stockToName: stationOptions,
    status: FILTER_FIELDS.find(f => f.key === 'status')?.options || [],
  }), [stationOptions]);

  const fetchData = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiMoveOrderCrud(USER_ID));
      const response = r.data as ListResponse;

      const mappedData = (response.data || []).map(item => ({
        ...item,
        uid: String(item.uid ?? ''),
      }));

      let effectiveColumns = response.columns;
      let effectiveRequiredColumns = new Set(REQUIRED_COLUMNS);
      if (response.requiredColumns && response.requiredColumns.length > 0) {
        effectiveRequiredColumns = new Set(response.requiredColumns);
      }
      let effectiveColumnWidths = response.columnWidths || {};

      if (!effectiveColumns || effectiveColumns.length === 0) {
        setIsFirstInit(true);
        effectiveColumns = ALL_COLUMNS.map(c => c.key);
        effectiveColumnWidths = calculateAdaptiveWidths(effectiveColumns);
      } else {
        effectiveRequiredColumns.forEach(key => {
          if (!effectiveColumns.includes(key)) effectiveColumns = [...effectiveColumns, key];
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
        data: mappedData,
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

  const fetchStations = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID));
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setStationOptions(items.map((s: any) => ({ uid: s.uid, name: s.name })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); fetchStations(); }, []);

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
      AxiosService.patch(ConstantInfo.restApiMoveOrderColumnsSettingsSave(USER_ID), { columnsJson: JSON.stringify(columnsJsonObj) })
        .then(() => setIsFirstInit(false))
        .catch(e => { console.error(e); setIsFirstInit(false); });
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
    AxiosService.patch(ConstantInfo.restApiMoveOrderColumnsSettingsSave(USER_ID), { columnsJson: JSON.stringify(columnsJsonObj) }).catch(e => console.error(e));
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
    AxiosService.patch(ConstantInfo.restApiMoveOrderColumnsSettingsSave(USER_ID), { columnsJson: JSON.stringify(columnsJsonObj) }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiMoveOrderAllSettings(USER_ID));
      const settings = r.data as { filtersJson: string; sortJson: string };
      if (settings.filtersJson && settings.filtersJson !== '{}') {
        const filters = JSON.parse(settings.filtersJson) as Record<string, any>;
        const newFilterValues: Record<string, Set<string>> = {};
        const newActiveFilters = new Set<string>();
        Object.entries(filters).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            newFilterValues[key] = new Set(values as string[]);
            newActiveFilters.add(key);
          }
        });
        setFilterValues(newFilterValues);
        setActiveFilters(newActiveFilters);
      }
      if (settings.sortJson && settings.sortJson !== '{}') {
        const sort = JSON.parse(settings.sortJson) as { column?: string; direction?: 'asc' | 'desc' };
        if (sort.column) {
          setSortColumn(sort.column);
          setSortDirection(sort.direction || 'asc');
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveFilters = useCallback((filters: Record<string, Set<string>>) => {
    const filtersJsonObj: Record<string, any> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) filtersJsonObj[key] = Array.from(values);
    });
    AxiosService.patch(ConstantInfo.restApiMoveOrderFiltersSettingsSave(USER_ID), { filtersJson: JSON.stringify(filtersJsonObj) }).catch(e => console.error(e));
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiMoveOrderSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => { if (!isLoading) saveFilters(filterValues); }, [filterValues, isLoading]);
  useEffect(() => { if (!isLoading) saveSort(sortColumn, sortDirection); }, [sortColumn, sortDirection, isLoading]);

  const ensureColumnVisible = useCallback((key: string) => {
    setVisibleColumns(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      setResponseData(prevData => prevData.columns.includes(key) ? prevData : { ...prevData, columns: [...prevData.columns, key] });
      return next;
    });
  }, []);

  const handleSortSelect = (col: string) => {
    ensureColumnVisible(col);
    const reversibleFields = ['code', 'docDatetime', 'deadline'];
    if (sortColumn === col) {
      if (reversibleFields.includes(col)) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleFilterToggle = (key: string) => {
    if (key === 'stockToName') ensureColumnVisible('stockToName');
  };

  const handleCheckFilterOption = (filterKey: string, optionUid: string) => {
    ensureColumnVisible(filterKey);
    setActiveFilters(prev => { const n = new Set(prev); n.add(filterKey); return n; });
    setFilterValues(prev => {
      const current = new Set(prev[filterKey] || []);
      if (current.has(optionUid)) current.delete(optionUid); else current.add(optionUid);
      if (current.size === 0) {
        const { [filterKey]: _, ...rest } = prev;
        setActiveFilters(prev2 => { const n = new Set(prev2); n.delete(filterKey); return n; });
        return rest;
      }
      return { ...prev, [filterKey]: current };
    });
  };

  const handleClearFilters = () => { setActiveFilters(new Set()); setFilterValues({}); };

  const handleDoubleClick = (uid: string, name: string) =>
    openTab(`/documents/move-orders/edit/${uid}`, `Заказ на перемещение`, null);

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
    AxiosService.patch(ConstantInfo.restApiMoveOrderColumnsSettingsSave(USER_ID), { columnsJson: JSON.stringify(columnsJsonObj) }).catch(e => console.error(e));
  };

  const formatCode = (code: number) => String(code).padStart(4, '0');

  const formatDateTime = (s: string): string => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
    } catch { return s; }
  };

  const renderCell = (key: string, item: RowData): string => {
    const val = item[key];
    if (val === null || val === undefined || val === '') return '—';
    switch (key) {
      case 'code': return formatCode(Number(val));
      case 'status': return STATUS_LABELS[String(val)] || String(val);
      case 'docDatetime': return formatDateTime(String(val));
      case 'deadline': return formatDateTime(String(val));
      default: return String(val);
    }
  };

  const isGrayColumn = (key: string): boolean => !['code', 'docDatetime', 'stockToName', 'status'].includes(key);

  const openBasedPopup = (sourceUid: string) => {
    setBasedSourceUid(sourceUid);
    setBasedStockToUid('');
    setBasedStockToName('');
    setShowBasedPopup(true);
  };

  const rowContextMenuItems = useCallback((uid: string, name: string): ContextMenuItem[] => {
    const item = responseData.data.find(d => d.uid === uid);
    const status = item?.status;
    const isLocked = status === 'POSTED' || status === 'ACCEPTED';

    const items: ContextMenuItem[] = [
      { id: 'open', label: 'Открыть', icon: ContextMenuOpenIcon16, onClick: () => {
        openTab(`/documents/move-orders/edit/${uid}`, `Заказ на перемещение`, null);
      }},
      { id: 'create-based', label: 'Создать на основании', icon: CreateIcon14Black, onClick: () => {
        openBasedPopup(uid);
      }},
    ];
    if (!isLocked) {
      items.push({ id: 'delete', label: 'Удалить', icon: ContextMenuDeleteIcon16, onClick: () => {
        setDeleteTargetUid(uid);
        setTimeout(() => setShowDeleteConfirm(true), 50);
      }});
    }
    return items;
  }, [responseData.data, openTab]);

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) await AxiosService.delete(ConstantInfo.restApiMoveOrder(deleteTargetUid));
      else for (const uid of selectedIds) await AxiosService.delete(ConstantInfo.restApiMoveOrder(uid));
      await fetchData();
      setSelectedIds(new Set());
      setDeleteTargetUid(null);
      setShowDeleteConfirm(false);
    } catch (e) { console.error(e); }
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => responseData.columns.some(col => {
        const v = row[col];
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
      }));
    }
    if (filterValues['stockToName'] && filterValues['stockToName'].size > 0)
      result = result.filter(row => filterValues['stockToName'].has(String(row['stockToUid'])));
    if (filterValues['status'] && filterValues['status'].size > 0)
      result = result.filter(row => filterValues['status'].has(String(row['status'])));

    if (sortColumn) {
      result.sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];
        if (sortColumn === 'code') { aVal = Number(aVal) || 0; bVal = Number(bVal) || 0; }
        if (typeof aVal === 'number' && typeof bVal === 'number')
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    return result;
  }, [responseData.data, responseData.columns, searchValue, filterValues, sortColumn, sortDirection]);

  const toggleSelectItem = (uid: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(uid); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(uid); };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const all = filteredData.length > 0 && filteredData.every(d => selectedIds.has(d.uid));
    all ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredData.map(d => d.uid)));
  };

  const openCreatePopup = () => {
    setFormStockToUid('');
    setFormStockToName('');
    setShowCreatePopup(true);
  };

  const handleCreateSubmit = async () => {
    if (!formStockToUid || isCreating) return;
    setIsCreating(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiMoveOrderGenerateCode);
      const code = String(r.data).padStart(4, '0');
      const newUid = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('stockToUid', formStockToUid);
      if (formStockToName) params.set('stockToName', formStockToName);
      openTab(
        `/documents/move-orders/create/${newUid}?${params.toString()}`,
        `Заказ на перемещение: ${code}`,
        null
      );
      setShowCreatePopup(false);
    } catch {
      const newUid = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('stockToUid', formStockToUid);
      if (formStockToName) params.set('stockToName', formStockToName);
      openTab(
        `/documents/move-orders/create/${newUid}?${params.toString()}`,
        'Заказ на перемещение (новый)',
        null
      );
      setShowCreatePopup(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBasedSubmit = async () => {
    if (!basedStockToUid || !basedSourceUid || isCreatingBased) return;
    setIsCreatingBased(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiMoveOrderGenerateCode);
      const code = String(r.data).padStart(4, '0');
      const newUid = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('stockToUid', basedStockToUid);
      if (basedStockToName) params.set('stockToName', basedStockToName);
      params.set('basedOn', basedSourceUid);
      openTab(
        `/documents/move-orders/create/${newUid}?${params.toString()}`,
        `Заказ на перемещение: ${code}`,
        null
      );
      setShowBasedPopup(false);
    } catch {
      const newUid = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('stockToUid', basedStockToUid);
      if (basedStockToName) params.set('stockToName', basedStockToName);
      params.set('basedOn', basedSourceUid);
      openTab(
        `/documents/move-orders/create/${newUid}?${params.toString()}`,
        'Заказ на перемещение (новый)',
        null
      );
      setShowBasedPopup(false);
    } finally {
      setIsCreatingBased(false);
    }
  };

  if (isLoading) return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          Документ: Заказ на перемещение
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          filterOptions={filterOptions}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortSelect={handleSortSelect}
          onClearSort={() => setSortColumn(null)}
          activeFilters={activeFilters}
          filterValues={filterValues}
          onFilterToggle={handleFilterToggle}
          onCheckFilterOption={handleCheckFilterOption}
          onClearFilters={handleClearFilters}
          selectedCount={selectedIds.size}
          onCreate={openCreatePopup}
          onDelete={() => { if (selectedIds.size > 0) { setDeleteTargetUid(null); setShowDeleteConfirm(true); } }}
          onConfiguration={() => setShowConfigurationPopup(true)}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40, right: 15, bottom: 0, overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
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
            rowIcon={DocumentIcon16Black}
          />
        </motion.div>
      </div>

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Заказ на перемещение (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns}
      />

      {/* Попап обычного создания */}
      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание заказа на перемещение</h3>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Склад-получатель</label>
              <div
                onClick={() => setShowStationSelect(true)}
                style={{
                  width: '100%', height: 44, borderRadius: 10,
                  border: formStockToUid ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex', alignItems: 'center',
                  paddingLeft: 12, paddingRight: 12,
                  cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                <img src={formStockToUid ? StationIcon16Blue : StationIcon16Gray} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span style={{
                  marginLeft: 12, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  color: formStockToUid ? '#666EFE' : '#A0A3BD',
                }}>
                  {formStockToName || 'Выберите склад-получатель'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreatePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Отмена
              </button>
              <button onClick={handleCreateSubmit} disabled={isCreating || !formStockToUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formStockToUid && !isCreating ? '#666EFE' : '#BCC8FF', cursor: formStockToUid && !isCreating ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>
                {isCreating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Попап создания на основании */}
      {showBasedPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBasedPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание на основании</h3>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Склад-получатель</label>
              <div
                onClick={() => setShowBasedStationSelect(true)}
                style={{
                  width: '100%', height: 44, borderRadius: 10,
                  border: basedStockToUid ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex', alignItems: 'center',
                  paddingLeft: 12, paddingRight: 12,
                  cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                <img src={basedStockToUid ? StationIcon16Blue : StationIcon16Gray} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span style={{
                  marginLeft: 12, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                  color: basedStockToUid ? '#666EFE' : '#A0A3BD',
                }}>
                  {basedStockToName || 'Выберите склад-получатель'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowBasedPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Отмена
              </button>
              <button onClick={handleBasedSubmit} disabled={isCreatingBased || !basedStockToUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: basedStockToUid && !isCreatingBased ? '#666EFE' : '#BCC8FF', cursor: basedStockToUid && !isCreatingBased ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>
                {isCreatingBased ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup
        isOpen={showStationSelect}
        onClose={() => setShowStationSelect(false)}
        onSelect={(id: string, name: string) => {
          setFormStockToUid(id);
          setFormStockToName(name);
          setShowStationSelect(false);
        }}
        popupType="station"
      />

      <CatalogSelectPopup
        isOpen={showBasedStationSelect}
        onClose={() => setShowBasedStationSelect(false)}
        onSelect={(id: string, name: string) => {
          setBasedStockToUid(id);
          setBasedStockToName(name);
          setShowBasedStationSelect(false);
        }}
        popupType="station"
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

export default MoveOrderPage;