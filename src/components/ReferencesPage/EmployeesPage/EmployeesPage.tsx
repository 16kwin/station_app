// EmployeesPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import HistoryTable from '../../elements/HistoryTable';
import DataTable from '../../elements/DataTable';
import TableToolbar from '../../elements/TableToolbar';
import ContextMenu from '../../elements/ContextMenu';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import EmployeeIcon16Black from '../../../assets/Icons/WorkshopIcons/WorkshopIcon16Black.svg';

interface EmployeeRowData { [key: string]: any; }
interface EmployeeListResponse {
  columns: string[];
  data: EmployeeRowData[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'lastName', label: 'Фамилия' },
  { key: 'firstName', label: 'Имя' },
  { key: 'middleName', label: 'Отчество' },
  { key: 'profession', label: 'Профессия' },
  { key: 'scopeName', label: 'Объект' },
];

const REQUIRED_COLUMNS = new Set(['lastName']);

const SORT_FIELDS = [
  { key: 'lastName', label: 'Фамилия', iconType: '19' as const },
  { key: 'profession', label: 'Профессия' },
  { key: 'scopeName', label: 'Объект' },
];

const FILTER_FIELDS = [
  { key: 'profession', label: 'Профессия' },
  { key: 'scopeName', label: 'Объект' },
];

const PROFESSIONS = [
  { code: 'SECTION_HEAD', label: 'Начальник участка', scopeKey: 'section', scopeLabel: 'Участок' },
  { code: 'WORKSHOP_HEAD', label: 'Начальник цеха', scopeKey: 'workshop', scopeLabel: 'Цех' },
  { code: 'PRODUCTION_HEAD', label: 'Начальник производства', scopeKey: 'enterprise', scopeLabel: 'Предприятие' },
];

const professionLabel = (code: string): string => {
  const p = PROFESSIONS.find(x => x.code === code);
  return p ? p.label : code;
};

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

const getScopeName = (item: EmployeeRowData): string => {
  if (item.enterpriseName) return item.enterpriseName;
  if (item.workshopName) return item.workshopName;
  if (item.sectionName) return item.sectionName;
  return '-';
};

const EmployeesPage = () => {
  const { activeTabId } = useTabs();
  const [responseData, setResponseData] = useState<EmployeeListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
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
  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | 'barcodeSearch' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [accountingIndex, setAccountingIndex] = useState(-1);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string; name: string } | null>(null);
  const [isFirstInit, setIsFirstInit] = useState(false);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeRowData | null>(null);
  const [formLastName, setFormLastName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formProfession, setFormProfession] = useState<string>('');
  const [formScopeId, setFormScopeId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [enterpriseList, setEnterpriseList] = useState<{ id: string; name: string }[]>([]);
  const [workshopList, setWorkshopList] = useState<{ id: string; name: string }[]>([]);
  const [sectionList, setSectionList] = useState<{ id: string; name: string }[]>([]);

  // ===== FETCH =====

  const fetchData = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiEmployees(USER_ID));
      const response = r.data as EmployeeListResponse;
      const mappedData = response.data.map(item => ({
        ...item,
        uid: String(item.uid),
      }));

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
      AxiosService.patch(ConstantInfo.restApiEmployeeColumnsSettingsSave(USER_ID), { columnsJson })
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
        visible: requiredColumns.has(col.key) ? true : visibleColumns.has(col.key),
        width: widths[col.key] || 0,
        required: requiredColumns.has(col.key),
      };
    });
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(ConstantInfo.restApiEmployeeColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(ConstantInfo.restApiEmployeeColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiEmployeeAllSettings(USER_ID));
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
    } catch (e) {
      console.error(e);
    }
  };

  const saveFilters = useCallback((filters: Record<string, Set<string>>) => {
    const filtersJsonObj: Record<string, any> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) filtersJsonObj[key] = Array.from(values);
    });
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(ConstantInfo.restApiEmployeeFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiEmployeeSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiEmployeeEvents);
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription })));
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchEnterprises = async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.restApiEnterprises}?userId=${USER_ID}`);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setEnterpriseList(items.map((item: any) => ({ id: String(item.id), name: item.name })));
    } catch (e) { console.error(e); }
  };

  const fetchWorkshops = async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.restApiWorkshops}?userId=${USER_ID}`);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setWorkshopList(items.map((item: any) => ({ id: String(item.id), name: item.name })));
    } catch (e) { console.error(e); }
  };

  const fetchSections = async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.restApiSections}?userId=${USER_ID}`);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setSectionList(items.map((item: any) => ({ id: String(item.id), name: item.name })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    fetchEnterprises();
    fetchWorkshops();
    fetchSections();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveFilters(filterValues);
    }
  }, [filterValues, isLoading, saveFilters]);

  useEffect(() => {
    if (!isLoading) {
      saveSort(sortColumn, sortDirection);
    }
  }, [sortColumn, sortDirection, isLoading, saveSort]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleClearFilters = () => {
    setActiveFilters(new Set());
    setFilterValues({});
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const handleCheckboxClick = (id: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(id); };
  const handleRowClick = (id: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(id); };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isAllSelected = filteredData.length > 0 && filteredData.every(item => selectedIds.has(item.uid));
    if (isAllSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredData.map(item => item.uid)));
  };
  const handleContextMenu = (e: React.MouseEvent, id: string, name: string) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, id, name }); };
  const handleDoubleClick = (id: string, name: string) => {};

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
    AxiosService.patch(ConstantInfo.restApiEmployeeColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  };

  const handleHistoryClick = () => {
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const resetForm = () => {
    setFormLastName('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormProfession('');
    setFormScopeId('');
  };

  const handleCreateClick = () => {
    resetForm();
    setEditItem(null);
    setShowCreatePopup(true);
  };

  const buildPayload = () => {
    const profession = formProfession;
    const scopeId = formScopeId ? Number(formScopeId) : null;
    return {
      lastName: formLastName.trim(),
      firstName: formFirstName.trim() || null,
      middleName: formMiddleName.trim() || null,
      profession,
      enterpriseId: profession === 'PRODUCTION_HEAD' ? scopeId : null,
      workshopId: profession === 'WORKSHOP_HEAD' ? scopeId : null,
      sectionId: profession === 'SECTION_HEAD' ? scopeId : null,
    };
  };

  const handleCreateSubmit = async () => {
    if (!formLastName.trim() || !formProfession || !formScopeId) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiEmployees(USER_ID).split('?')[0], buildPayload());
      await fetchData();
      setShowCreatePopup(false);
      resetForm();
    } catch (error) { console.error('Ошибка создания:', error); } finally { setIsSaving(false); }
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    const item = responseData.data.find(d => d.uid === contextMenu.id);
    if (item) {
      setEditItem(item);
      setFormLastName(item.lastName || '');
      setFormFirstName(item.firstName || '');
      setFormMiddleName(item.middleName || '');
      setFormProfession(item.profession || '');
      if (item.enterpriseId) setFormScopeId(String(item.enterpriseId));
      else if (item.workshopId) setFormScopeId(String(item.workshopId));
      else if (item.sectionId) setFormScopeId(String(item.sectionId));
      else setFormScopeId('');
      setShowEditPopup(true);
    }
    setContextMenu(null);
  };

  const handleEditSubmit = async () => {
    if (!editItem || !formLastName.trim() || !formProfession || !formScopeId) return;
    setIsSaving(true);
    try {
      await AxiosService.patch(`${ConstantInfo.restApiEmployees(USER_ID).split('?')[0]}/${editItem.uid}`, buildPayload());
      await fetchData();
      setShowEditPopup(false);
      setEditItem(null);
    } catch (error) { console.error('Ошибка редактирования:', error); } finally { setIsSaving(false); }
  };

  const contextMenuItems: ContextMenuItem[] = [
    { id: 'edit', label: 'Редактировать', icon: ContextMenuOpenIcon16, onClick: handleEditClick },
    { id: 'delete', label: 'Удалить', icon: ContextMenuDeleteIcon16, onClick: () => { if (!contextMenu) return; setDeleteTargetUid(contextMenu.id); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); } },
  ];

  const renderCell = (key: string, item: EmployeeRowData): string => {
    if (key === 'scopeName') return getScopeName(item);
    if (key === 'profession') return item.profession ? professionLabel(item.profession) : '-';
    const val = item[key];
    if (val === null || val === undefined || val === '') return '-';
    return String(val);
  };

  const confirmDelete = async () => {
    try {
      const base = ConstantInfo.restApiEmployees(USER_ID).split('?')[0];
      if (deleteTargetUid) {
        await AxiosService.delete(`${base}/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${base}/${uid}`);
        }
      }
      await fetchData(); setSelectedIds(new Set()); setDeleteTargetUid(null); setShowDeleteConfirm(false);
    } catch (error) { console.error('Ошибка удаления:', error); }
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        const fields = [
          row.lastName, row.firstName, row.middleName,
          row.profession ? professionLabel(row.profession) : '',
          getScopeName(row),
        ];
        return fields.some(v => v && String(v).toLowerCase().includes(q));
      });
    }
    if (activeFilters.has('profession')) {
      const vals = filterValues['profession'];
      if (vals && vals.size > 0) {
        result = result.filter(row => vals.has(String(row.profession)));
      }
    }
    if (activeFilters.has('scopeName')) {
      const vals = filterValues['scopeName'];
      if (vals && vals.size > 0) {
        result = result.filter(row => vals.has(getScopeName(row)));
      }
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const getVal = (row: EmployeeRowData): string => {
          if (sortColumn === 'profession') return row.profession ? professionLabel(row.profession) : '';
          if (sortColumn === 'scopeName') return getScopeName(row);
          return String(row[sortColumn] || '');
        };
        const aVal = getVal(a);
        const bVal = getVal(b);
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, activeFilters, filterValues, sortColumn, sortDirection]);

  // ===== ЭКСПОРТ =====

  const getColumnLabel = (key: string) => {
    const col = ALL_COLUMNS.find(c => c.key === key);
    return col ? col.label : key;
  };

  const columnKeys = ALL_COLUMNS.filter(c => responseData.columns.includes(c.key)).map(c => c.key);
  const columnLabels = columnKeys.map(getColumnLabel);

  const sortLabel = sortColumn
    ? `${getColumnLabel(sortColumn)} (${sortDirection === 'asc' ? 'возр.' : 'убыв.'})`
    : '';

  let filtersText = '';
  if (activeFilters.size > 0) {
    const filterLabels = Array.from(activeFilters).map(key => {
      const field = FILTER_FIELDS.find(f => f.key === key);
      const fieldLabel = field ? field.label : getColumnLabel(key);
      const values = filterValues[key];
      if (!values || values.size === 0) return fieldLabel;
      const optionLabels = Array.from(values).map(v => {
        if (key === 'profession') return professionLabel(v);
        return v;
      });
      return `${fieldLabel}: ${optionLabels.join(', ')}`;
    });
    filtersText = filterLabels.join('; ');
  }

  const preparePayload = useCallback(() => {
    const preparedData = filteredData.map(item => {
      const row: Record<string, string> = {};
      columnKeys.forEach(key => { row[key] = renderCell(key, item); });
      return row;
    });
    const footerLines: string[] = [];
    if (sortLabel) footerLines.push(`Сортировка: ${sortLabel}`);
    if (filtersText) footerLines.push(`Фильтры: ${filtersText}`);
    return {
      title: 'Сотрудники',
      columns: columnKeys,
      columnLabels,
      data: preparedData,
      landscape: true,
      footerLines,
    };
  }, [filteredData, columnKeys, columnLabels, sortLabel, filtersText]);

  const handlePrint = async () => {
    try {
      const res = await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/employees/print`, preparePayload(), { responseType: 'blob' });
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed'; iframe.style.left = '-9999px'; iframe.style.top = '0';
      iframe.style.width = '800px'; iframe.style.height = '600px'; iframe.style.visibility = 'visible';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => { setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }, 500); };
    } catch (e) { console.error('Ошибка печати', e); }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/employees/export-pdf`, preparePayload(), { responseType: 'blob' });
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a'); link.href = url; link.download = 'employees.pdf';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e) { console.error('Ошибка выгрузки PDF', e); }
  };

  const handleDownloadExcel = async () => {
    try {
      const res = await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/employees/export-excel`, preparePayload(), { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'employees.xlsx';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e) { console.error('Ошибка выгрузки Excel', e); }
  };

  const handleDownloadWord = async () => {
    try {
      const res = await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/employees/export-word`, preparePayload(), { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'employees.docx';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e) { console.error('Ошибка выгрузки Word', e); }
  };

  // ===== RENDER =====

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  const currentProfession = PROFESSIONS.find(p => p.code === formProfession);
  const scopeOptions =
    currentProfession?.scopeKey === 'enterprise' ? enterpriseList :
    currentProfession?.scopeKey === 'workshop'   ? workshopList :
    currentProfession?.scopeKey === 'section'    ? sectionList :
    [];

  const filterOptions: Record<string, { uid: string; name: string }[]> = {
    profession: PROFESSIONS.map(p => ({ uid: p.code, name: p.label })),
    scopeName: (() => {
      const seen = new Set<string>();
      const list: { uid: string; name: string }[] = [];
      responseData.data.forEach(row => {
        const name = getScopeName(row);
        if (name && name !== '-' && !seen.has(name)) { seen.add(name); list.push({ uid: name, name }); }
      });
      return list.sort((a, b) => a.name.localeCompare(b.name));
    })(),
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Сотрудники (История изменений)' : 'Справочник: Сотрудники'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={[]}
          accountingTypes={[]}
          accountingColumnKeys={[]}
          filterOptions={filterOptions}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          accountingIndex={accountingIndex}
          onSortSelect={(col) => {
            if (sortColumn === col) {
              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
            } else {
              setSortColumn(col);
              setSortDirection('asc');
            }
          }}
          onAccountingClick={() => {}}
          onClearSort={() => { setSortColumn(null); setAccountingIndex(-1); }}
          activeFilters={activeFilters}
          filterValues={filterValues}
          placementSelections={{}}
          hasPlacementSelections={false}
          onFilterToggle={() => {}}
          onCheckFilterOption={(filterKey, optionUid) => {
            setFilterValues(prev => {
              const current = new Set(prev[filterKey] || []);
              if (current.has(optionUid)) current.delete(optionUid); else current.add(optionUid);
              const next = { ...prev, [filterKey]: current };
              setActiveFilters(prevFilters => {
                const nextFilters = new Set(prevFilters);
                if (current.size > 0) nextFilters.add(filterKey); else nextFilters.delete(filterKey);
                return nextFilters;
              });
              return next;
            });
          }}
          onPlacementLevelClick={() => {}}
          onPlacementCheck={() => {}}
          onClearFilters={handleClearFilters}
          hierarchy={null}
          modelList={[]}
          configList={[]}
          onFetchHierarchy={() => {}}
          onFetchModels={() => {}}
          onFetchConfigurations={() => {}}
          selectedCount={selectedIds.size}
          onCreate={handleCreateClick}
          onDelete={() => { if (selectedIds.size > 0) { setDeleteTargetUid(null); setShowDeleteConfirm(true); } }}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          onDownloadExcel={handleDownloadExcel}
          onDownloadWord={handleDownloadWord}
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
            <motion.div key="history" initial={{ x: 'calc(100% + 40px)' }} animate={{ x: 0 }} exit={{ x: 'calc(100% + 40px)' }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <HistoryTable events={historyEvents} isLoading={historyLoading} />
            </motion.div>
          ) : (
            <motion.div key="data" initial={{ x: 'calc(-100% - 40px)' }} animate={{ x: 0 }} exit={{ x: 'calc(-100% - 40px)' }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <DataTable
                columns={ALL_COLUMNS}
                visibleKeys={responseData.columns}
                data={filteredData}
                selectedIds={selectedIds}
                onCheckboxClick={handleCheckboxClick}
                onSelectAll={handleSelectAll}
                onRowClick={handleRowClick}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
                renderCell={renderCell}
                highlightText={searchValue.trim() || undefined}
                initialWidths={columnWidths}
                onWidthsChange={handleColumnWidthsChange}
                requiredColumns={requiredColumns}
                onResetToBase={handleResetToBase}
                rowIcon={EmployeeIcon16Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} />}

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Сотрудники (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns}
      />

      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание сотрудника</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Фамилия</label><input type="text" value={formLastName} onChange={e => setFormLastName(e.target.value)} placeholder="Введите фамилию" autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Имя</label><input type="text" value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="Введите имя" style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Отчество</label><input type="text" value={formMiddleName} onChange={e => setFormMiddleName(e.target.value)} placeholder="Введите отчество" style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Профессия</label><select value={formProfession} onChange={e => { setFormProfession(e.target.value); setFormScopeId(''); }} style={selectStyle}><option value="">Выберите профессию</option>{PROFESSIONS.map(p => (<option key={p.code} value={p.code}>{p.label}</option>))}</select></div>
            {currentProfession && (
              <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>{currentProfession.scopeLabel}</label><select value={formScopeId} onChange={e => setFormScopeId(e.target.value)} style={selectStyle}><option value="">Выберите {currentProfession.scopeLabel.toLowerCase()}</option>{scopeOptions.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreatePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleCreateSubmit} disabled={isSaving || !formLastName.trim() || !formProfession || !formScopeId} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formLastName.trim() && formProfession && formScopeId && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formLastName.trim() && formProfession && formScopeId && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование сотрудника</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Фамилия</label><input type="text" value={formLastName} onChange={e => setFormLastName(e.target.value)} autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Имя</label><input type="text" value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="Введите имя" style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Отчество</label><input type="text" value={formMiddleName} onChange={e => setFormMiddleName(e.target.value)} placeholder="Введите отчество" style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Профессия</label><select value={formProfession} onChange={e => { setFormProfession(e.target.value); setFormScopeId(''); }} style={selectStyle}><option value="">Выберите профессию</option>{PROFESSIONS.map(p => (<option key={p.code} value={p.code}>{p.label}</option>))}</select></div>
            {currentProfession && (
              <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>{currentProfession.scopeLabel}</label><select value={formScopeId} onChange={e => setFormScopeId(e.target.value)} style={selectStyle}><option value="">Выберите {currentProfession.scopeLabel.toLowerCase()}</option>{scopeOptions.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={isSaving || !formLastName.trim() || !formProfession || !formScopeId} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formLastName.trim() && formProfession && formScopeId && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formLastName.trim() && formProfession && formScopeId && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные элементы?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;