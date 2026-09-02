// StationModelsPage.tsx — ПОЛНЫЙ ФАЙЛ (дефолтная инициализация + автосохранение при первом запуске)
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
import ModelIcon16Black from '../../../assets/Icons/ModelIcons/ModelIcon16Black.svg';

interface StationModelRowData { [key: string]: any; }
interface StationModelListResponse { 
  columns: string[]; 
  data: StationModelRowData[]; 
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'code', label: 'Код' },
  { key: 'typeName', label: 'Тип' },
  { key: 'manufacturerName', label: 'Производитель' },
  { key: 'article', label: 'Артикул' },
  { key: 'description', label: 'Описание' },
  { key: 'revision', label: 'Ревизия' },
];

const REQUIRED_COLUMNS = new Set(['name']);

const SORT_FIELDS = [
  { key: 'name', label: 'Наименование', iconType: '19' as const },
  { key: 'code', label: 'Код' },
  { key: 'typeName', label: 'Тип' },
  { key: 'manufacturerName', label: 'Производитель' },
  { key: 'article', label: 'Артикул' },
];

const FILTER_FIELDS = [
  { key: 'typeName', label: 'Тип' },
  { key: 'manufacturerName', label: 'Производитель' },
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

const StationModelsPage = () => {
  const { activeTabId, openTab } = useTabs();
  const [responseData, setResponseData] = useState<StationModelListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
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
  const [typeList, setTypeList] = useState<{ uid: string; name: string }[]>([]);
  const [manufacturerList, setManufacturerList] = useState<{ uid: string; name: string }[]>([]);
  const [isFirstInit, setIsFirstInit] = useState(false);

  const filterOptions = useMemo(() => ({
    typeName: typeList.map(t => ({ uid: t.uid, name: t.name })),
    manufacturerName: manufacturerList.map(m => ({ uid: m.uid, name: m.name })),
  }), [typeList, manufacturerList]);

  const fetchData = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationModels}?userId=${USER_ID}`); 
      const response = r.data as StationModelListResponse;
      
      let effectiveColumns = response.columns;
      let effectiveRequiredColumns = new Set(REQUIRED_COLUMNS);
      
      if (response.requiredColumns && response.requiredColumns.length > 0) {
        effectiveRequiredColumns = new Set(response.requiredColumns);
      }
      
      let effectiveColumnWidths = response.columnWidths || {};
      
      // Если columns пустой — первый запуск, заполняем обязательными колонками
      if (!effectiveColumns || effectiveColumns.length === 0) {
        setIsFirstInit(true);
        
        effectiveColumns = ALL_COLUMNS
          .filter(c => effectiveRequiredColumns.has(c.key))
          .map(c => c.key);
        
        // Адаптивная ширина
        if (effectiveColumns.length > 0) {
          effectiveColumnWidths = calculateAdaptiveWidths(effectiveColumns);
        }
      } else {
        // Добавляем обязательные колонки, если их нет
        effectiveRequiredColumns.forEach(key => {
          if (!effectiveColumns.includes(key)) {
            effectiveColumns = [...effectiveColumns, key];
          }
        });
        
        // Если ширины пустые — заполняем адаптивно
        if (Object.keys(effectiveColumnWidths).length === 0) {
          effectiveColumnWidths = calculateAdaptiveWidths(effectiveColumns);
        }
      }
      
      setRequiredColumns(effectiveRequiredColumns);
      
      const visible = new Set(effectiveColumns);
      setVisibleColumns(visible);
      
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

  // Сохраняем настройки при первом запуске
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
      AxiosService.patch(ConstantInfo.restApiStationModelColumnsSettingsSave(USER_ID), { columnsJson })
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
    AxiosService.patch(ConstantInfo.restApiStationModelColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [visibleColumns, requiredColumns]);

  const handleResetToBase = useCallback(() => {
    const baseCols = new Set(requiredColumns);
    setVisibleColumns(baseCols);
    setResponseData(prev => ({ ...prev, columns: ALL_COLUMNS.filter(c => baseCols.has(c.key)).map(c => c.key) }));
    
    const newWidths = calculateAdaptiveWidths(ALL_COLUMNS.filter(c => baseCols.has(c.key)).map(c => c.key));
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
    AxiosService.patch(ConstantInfo.restApiStationModelColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationModelAllSettings(USER_ID)); 
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
    AxiosService.patch(ConstantInfo.restApiStationModelFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);
  
  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiStationModelSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);
  
  const fetchHistory = async () => { 
    setHistoryLoading(true); 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiStationModelEvents); 
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription }))); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setHistoryLoading(false); 
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
  
  const fetchManufacturers = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiStationManufacturers}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setManufacturerList(items.map((item: any) => ({ uid: item.uid, name: item.name }))); 
    } catch (e) { console.error(e); } 
  };

  useEffect(() => { fetchData(); fetchTypes(); fetchManufacturers(); fetchSettings(); }, []);

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
    openTab(`/references/station-models/edit/${uid}`, `Модель: ${name}`, null);
  };

  const handleSaveColumns = (cols: Set<string>) => { 
    const finalCols = new Set(cols);
    requiredColumns.forEach(key => finalCols.add(key));
    
    setVisibleColumns(finalCols); 
    setResponseData(prev => ({ ...prev, columns: ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key) }));
    
    const newWidths = calculateAdaptiveWidths(ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key));
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
    AxiosService.patch(ConstantInfo.restApiStationModelColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
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
          openTab(`/references/station-models/edit/${item.uid}`, `Модель: ${item.name}`, null);
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

  const formatCode = (code: number) => String(code).padStart(4, '0');

  const renderCell = (key: string, item: StationModelRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '-';
    switch (key) {
      case 'code': return formatCode(Number(val));
      default: return String(val);
    }
  };

  const isGrayColumn = (key: string): boolean => {
    const mainColumns = ['name', 'code'];
    return !mainColumns.includes(key);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        await AxiosService.delete(`${ConstantInfo.restApiStationModels}/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.restApiStationModels}/${uid}`);
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
    if (filterValues['typeName'] && filterValues['typeName'].size > 0) {
      result = result.filter(row => filterValues['typeName'].has(String(row['typeId'])));
    }
    if (filterValues['manufacturerName'] && filterValues['manufacturerName'].size > 0) {
      result = result.filter(row => filterValues['manufacturerName'].has(String(row['manufacturerId'])));
    }
    if (sortColumn) {
      result.sort((a, b) => {
        if (sortColumn === 'code') {
          return sortDirection === 'asc' ? Number(a.code) - Number(b.code) : Number(b.code) - Number(a.code);
        }
        const aVal = String(a[sortColumn] || '');
        const bVal = String(b[sortColumn] || '');
        if (sortColumn === 'name' || sortColumn === 'article') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return aVal.localeCompare(bVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, filterValues, sortColumn, sortDirection]);

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Модели станций (История изменений)' : 'Справочник: Модели станций'}
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
            if (col === 'name' || col === 'code' || col === 'article') {
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
          placementSelections={{}}
          hasPlacementSelections={false}
          onFilterToggle={(key) => {
            if (key === 'typeName') fetchTypes();
            if (key === 'manufacturerName') fetchManufacturers();
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
          onCreate={async () => {
            try {
              const response = await AxiosService.get(ConstantInfo.restApiStationModelGenerateCode);
              const { uid, code } = response.data;
              openTab(`/references/station-models/create/${uid}`, `Модель станции: ${String(code).padStart(4, '0')}`, null);
            } catch {
              const newUid = crypto.randomUUID();
              openTab(`/references/station-models/create/${newUid}`, 'Модель станции (новая)', null);
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
                rowIcon={ModelIcon16Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
        />
      )}

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Модели станций (Настройки списка)"
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

export default StationModelsPage;