// StationConfigurationsPage.tsx — ИСПРАВЛЕННЫЙ (дефолтная инициализация + barcodeSearch в типе + печать и PDF)
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
import ContextMenuCopyIcon16 from '../../../assets/Icons/CopyIcons/CopyIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import StructureIcon18Black from '../../../assets/Icons/StructureIcons/StructureIcon18Black.svg';

interface ConfigurationRowData { [key: string]: any; }
interface ConfigurationListResponse { 
  columns: string[]; 
  data: ConfigurationRowData[]; 
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'modelName', label: 'Модель' },
];

const REQUIRED_COLUMNS = new Set(['name']);

const SORT_FIELDS = [
  { key: 'name', label: 'Наименование', iconType: '19' as const },
  { key: 'modelName', label: 'Модель' },
];

const FILTER_FIELDS = [
  { key: 'modelName', label: 'Модель' },
];

const PLACEMENT_LEVELS: { key: string; label: string; emptyText: string }[] = [];
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

const StationConfigurationsPage = () => {
  const { activeTabId, openTab } = useTabs();
  const [responseData, setResponseData] = useState<ConfigurationListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(REQUIRED_COLUMNS));
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; name: string } | null>(null);
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
  const [modelList, setModelList] = useState<{ uid: string; name: string }[]>([]);
  const [isFirstInit, setIsFirstInit] = useState(false);

  const filterOptions = useMemo(() => ({
    modelName: modelList.map(m => ({ uid: m.uid, name: m.name })),
  }), [modelList]);

  const fetchData = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationConfigurations}?userId=${USER_ID}`); 
      const response = r.data as ConfigurationListResponse;
      
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
      AxiosService.patch(ConstantInfo.restApiStationConfigurationColumnsSettingsSave(USER_ID), { columnsJson })
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
    AxiosService.patch(ConstantInfo.restApiStationConfigurationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(ConstantInfo.restApiStationConfigurationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationConfigurationAllSettings(USER_ID)); 
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
      if (values.size > 0) {
        filtersJsonObj[key] = Array.from(values);
      }
    });
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(ConstantInfo.restApiStationConfigurationFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);
  
  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiStationConfigurationSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);
  
  const fetchHistory = async () => { 
    setHistoryLoading(true); 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationConfigurationEvents); 
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription }))); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setHistoryLoading(false); 
    } 
  };
  
  const fetchModels = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationModels}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setModelList(items.map((item: any) => ({ uid: item.uid, name: item.name }))); 
    } catch (e) { console.error(e); } 
  };

  useEffect(() => { fetchData(); fetchModels(); fetchSettings(); }, []);

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

  const toggleSelectItem = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

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
    const isAllSelected = responseData.data.length > 0 && responseData.data.every(item => selectedIds.has(item.uid));
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(responseData.data.map(item => item.uid)));
  };

  const handleContextMenu = (e: React.MouseEvent, uid: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, uid, name });
  };

  const handleDoubleClick = (uid: string, name: string) => {
    openTab(`/references/station-configurations/edit/${uid}`, `Конфигурация: ${name}`, null);
  };

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
    AxiosService.patch(ConstantInfo.restApiStationConfigurationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  };

  const handleHistoryClick = () => {
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'open',
      label: 'Открыть',
      icon: ContextMenuOpenIcon16,
      onClick: () => {
        if (!contextMenu) return;
        const item = responseData.data.find(d => d.uid === contextMenu.uid);
        if (item) {
          setContextMenu(null);
          openTab(`/references/station-configurations/edit/${item.uid}`, `Конфигурация: ${item.name}`, null);
        }
      },
    },
    {
      id: 'copy',
      label: 'Копировать',
      icon: ContextMenuCopyIcon16,
      onClick: () => {
        if (!contextMenu) return;
        navigator.clipboard.writeText(contextMenu.uid).catch(() => {});
        setContextMenu(null);
      },
    },
    {
      id: 'delete',
      label: 'Удалить',
      icon: ContextMenuDeleteIcon16,
      onClick: () => {
        if (!contextMenu) return;
        setDeleteTargetUid(contextMenu.uid);
        setContextMenu(null);
        setTimeout(() => setShowDeleteConfirm(true), 50);
      },
    },
  ];

  const renderCell = (key: string, item: ConfigurationRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  const isGrayColumn = (key: string): boolean => {
    return key === 'modelName';
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        await AxiosService.delete(`${ConstantInfo.restApiStationConfigurations}/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.restApiStationConfigurations}/${uid}`);
        }
      }
      await fetchData();
      setSelectedIds(new Set());
      setDeleteTargetUid(null);
      setShowDeleteConfirm(false);
    } catch (error) { console.error('Ошибка удаления:', error); }
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (filterValues['modelName'] && filterValues['modelName'].size > 0) {
      result = result.filter(row => filterValues['modelName'].has(String(row['modelId'])));
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = String(a[sortColumn] || '');
        const bVal = String(b[sortColumn] || '');
        if (sortColumn === 'name') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return aVal.localeCompare(bVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, filterValues, sortColumn, sortDirection]);

  // ===== ВСТАВЛЕННЫЙ БЛОК ПЕЧАТИ И PDF (из варианта 6) =====
  const getColumnLabel = (key: string) => {
    const col = ALL_COLUMNS.find(c => c.key === key);
    return col ? col.label : key;
  };

  const columnKeys = ALL_COLUMNS
      .filter(c => responseData.columns.includes(c.key))
      .map(c => c.key);

  const columnLabels = columnKeys.map(getColumnLabel);

  const visibleLabels = responseData.columns.map(getColumnLabel);
  const hiddenLabels = ALL_COLUMNS
      .filter(c => !responseData.columns.includes(c.key))
      .map(c => c.label);

  const sortLabel = sortColumn
      ? `${getColumnLabel(sortColumn)} (${sortDirection === 'asc' ? 'возр.' : 'убыв.'})`
      : 'Без сортировки';

  let filtersText = 'Нет фильтров';
  if (activeFilters.size > 0) {
    const filterLabels = Array.from(activeFilters).map(key => {
      const field = FILTER_FIELDS.find(f => f.key === key);
      const fieldLabel = field ? field.label : getColumnLabel(key);
      const values = filterValues[key];
      if (!values || values.size === 0) return fieldLabel;
      const optionLabels = Array.from(values).map(uid => {
        const opt = (field?.options || []).find(o => o.uid === uid);
        return opt ? opt.name : uid;
      });
      return `${fieldLabel}: ${optionLabels.join(', ')}`;
    });
    filtersText = filterLabels.join('; ');
  }

  const handlePrint = async () => {
    const preparedData = filteredData.map(item => {
      const row: Record<string, string> = {};
      columnKeys.forEach(key => {
        row[key] = renderCell(key, item);
      });
      return row;
    });

    const payload = {
      title: 'Конфигурации станций',
      columns: columnKeys,
      columnLabels: columnLabels,
      data: preparedData,
      landscape: true,
      footerLines: [
        `Сортировка: ${sortLabel}`,
        `Фильтры: ${filtersText}`,
        `Видимые поля: ${visibleLabels.join(', ')}`,
        `Невидимые поля: ${hiddenLabels.length > 0 ? hiddenLabels.join(', ') : '—'}`,
      ],
    };

    try {
      const res = await AxiosService.post(
          `${ConstantInfo.apiBaseUrl}/api/station-configurations/print`,
          payload,
          { responseType: 'blob' }
      );
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      iframe.style.visibility = 'visible';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 500);
      };
    } catch (e) { console.error('Ошибка печати', e); }
  };

  const handlePrintPdf = async () => {
    const preparedData = filteredData.map(item => {
      const row: Record<string, string> = {};
      columnKeys.forEach(key => {
        row[key] = renderCell(key, item);
      });
      return row;
    });

    const payload = {
      title: 'Конфигурации станций',
      columns: columnKeys,
      columnLabels: columnLabels,
      data: preparedData,
      landscape: true,
      footerLines: [
        `Сортировка: ${sortLabel}`,
        `Фильтры: ${filtersText}`,
        `Видимые поля: ${visibleLabels.join(', ')}`,
        `Невидимые поля: ${hiddenLabels.length > 0 ? hiddenLabels.join(', ') : '—'}`,
      ],
    };

    try {
      const res = await AxiosService.post(
          `${ConstantInfo.apiBaseUrl}/api/station-configurations/export-pdf`,
          payload,
          { responseType: 'blob' }
      );
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'export.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(pdfUrl);
    } catch (e) { console.error('Ошибка выгрузки PDF', e); }
  };
  // ===== КОНЕЦ ВСТАВКИ =====

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Конфигурации станций (История изменений)' : 'Справочник: Конфигурации станций'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar 
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={PLACEMENT_LEVELS}
          accountingTypes={[]}
          accountingColumnKeys={[]}
          filterOptions={filterOptions}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          accountingIndex={accountingIndex}
          onSortSelect={(col) => {
            if (col === 'name') {
              if (sortColumn === col) {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortColumn(col);
                setSortDirection('asc');
              }
            } else {
              setSortColumn(col);
              setSortDirection('asc');
            }
          }}
          onAccountingClick={() => {}}
          onClearSort={() => { setSortColumn(null); setAccountingIndex(-1); }}
          activeFilters={activeFilters}
          filterValues={filterValues}
          placementSelections={{}}          hasPlacementSelections={false}
          onFilterToggle={(key) => {
            if (key === 'modelName') fetchModels();
          }}
          onCheckFilterOption={(filterKey, optionUid) => {
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
          }}
          onPlacementLevelClick={() => {}}
          onPlacementCheck={() => {}}
          onClearFilters={() => { setActiveFilters(new Set()); setFilterValues({}); }}
          hierarchy={null}
          modelList={[]}
          configList={[]}
          onFetchHierarchy={() => {}}
          onFetchModels={() => {}}
          onFetchConfigurations={() => {}}
          selectedCount={selectedIds.size}
          onCreate={() => {
            const newUid = crypto.randomUUID();
            openTab(`/references/station-configurations/create/${newUid}`, 'Конфигурация (новая)', null);
          }}
          onDelete={() => { if (selectedIds.size > 0) { setDeleteTargetUid(null); setShowDeleteConfirm(true); } }}
          onPrint={handlePrint}
          onPrintPdf={handlePrintPdf}
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
                isGrayColumn={isGrayColumn}
                highlightText={searchValue.trim() || undefined}
                initialWidths={columnWidths}
                onWidthsChange={handleColumnWidthsChange}
                requiredColumns={requiredColumns}
                onResetToBase={handleResetToBase}
                rowIcon={StructureIcon18Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} />}

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Конфигурации станций (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns}
      />

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

export default StationConfigurationsPage;