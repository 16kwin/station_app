// ManufacturersPage.tsx — ИСПРАВЛЕННЫЙ (дефолтная инициализация + barcodeSearch в типе)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import Popup6 from '../../../assets/References/popup6.svg';

interface ManufacturerRowData { [key: string]: any; }
interface ManufacturerListResponse {
  columns: string[];
  data: ManufacturerRowData[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}

interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'code', label: 'Код' },
  { key: 'name', label: 'Наименование' },
  { key: 'countryName', label: 'Страна' },
  { key: 'directionName', label: 'Направление производства' },
  { key: 'address', label: 'Адрес' },
  { key: 'description', label: 'Описание' },
  { key: 'email', label: 'E-mail' },
  { key: 'website', label: 'Сайт' },
  { key: 'phone', label: 'Телефон' },
];

const REQUIRED_COLUMNS = new Set(['code', 'name', 'countryName', 'directionName']);

const SORT_FIELDS = [
  { key: 'code', label: 'Код', iconType: '19' as const },
  { key: 'name', label: 'Наименование', iconType: '20' as const },
  { key: 'countryName', label: 'Страна' },
  { key: 'directionName', label: 'Направление производства' },
];

const FILTER_FIELDS = [
  { key: 'countryName', label: 'Страна' },
  { key: 'directionName', label: 'Направление производства' },
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
  columnKeys.forEach(key => {
    widths[key] = columnWidth;
  });
  
  return widths;
};

const ManufacturersPage = () => {
  const { openTab } = useTabs();
  const [responseData, setResponseData] = useState<ManufacturerListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
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
  const [filterOptions, setFilterOptions] = useState<Record<string, { uid: string; name: string }[]>>({});
  const [isFirstInit, setIsFirstInit] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud?userId=${USER_ID}`);
      const response = r.data as ManufacturerListResponse;
      
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
  }, []);

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
      AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/columns-settings?userId=${USER_ID}`, { columnsJson })
        .then(() => setIsFirstInit(false))
        .catch(e => {
          console.error('Ошибка сохранения настроек колонок:', e);
          setIsFirstInit(false);
        });
    }
  }, [isFirstInit, isLoading, visibleColumns, columnWidths, requiredColumns]);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/settings?userId=${USER_ID}`);
      const settings = r.data as { filtersJson: string; sortJson: string };
      if (settings.filtersJson && settings.filtersJson !== '{}') {
        const filters = JSON.parse(settings.filtersJson) as Record<string, string[]>;
        const newFilterValues: Record<string, Set<string>> = {};
        const newActiveFilters = new Set<string>();
        Object.entries(filters).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            newFilterValues[key] = new Set(values);
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
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [countriesR, directionsR] = await Promise.all([
        AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/countries-crud?userId=${USER_ID}`),
        AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/production-directions?userId=${USER_ID}`),
      ]);
      const countries = countriesR.data?.data || countriesR.data || [];
      const directions = directionsR.data?.data || directionsR.data || [];
      setFilterOptions({
        countryName: countries.map((c: any) => ({ uid: c.uid || c.name, name: c.name || c.typeName })),
        directionName: directions.map((d: any) => ({ uid: d.uid || d.name, name: d.name || d.typeName })),
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/events`);
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription })));
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSettings();
    fetchFilterOptions();
  }, []);

  const saveFilters = useCallback((filters: Record<string, Set<string>>) => {
    const filtersJsonObj: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) filtersJsonObj[key] = Array.from(values);
    });
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/filters-settings?userId=${USER_ID}`, { filtersJson }).catch(e => console.error(e));
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/sort-settings?userId=${USER_ID}`, { sortJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (!isLoading) saveFilters(filterValues);
  }, [filterValues, isLoading]);

  useEffect(() => {
    if (!isLoading) saveSort(sortColumn, sortDirection);
  }, [sortColumn, sortDirection, isLoading]);

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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
  };

  const handleCreateClick = async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/generate-code`);
      const code = r.data;
      const newUid = crypto.randomUUID();
      openTab(`/references/manufacturers/create/${newUid}/${code}`, `Производитель: ${String(code).padStart(4, '0')}`, null);
    } catch {
      const newUid = crypto.randomUUID();
      openTab(`/references/manufacturers/create/${newUid}/0`, 'Производитель (новый)', null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteTargetUid(null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${uid}`);
        }
      }
      await fetchData();
      setSelectedIds(new Set());
      setDeleteTargetUid(null);
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const toggleSelectItem = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
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
    const all = filteredData.length > 0 && filteredData.every(d => selectedIds.has(d.uid));
    if (all) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map(d => d.uid)));
  };

  const handleDoubleClick = (uid: string, name: string) => {
    const item = responseData.data.find(d => d.uid === uid);
    if (item) {
      openTab(`/references/manufacturers/edit/${uid}/${item.code || 0}`, `Производитель: ${item.name || ''}`, null);
    }
  };

  const rowContextMenuItems = useCallback((uid: string, name: string): ContextMenuItem[] => {
    return [
      { id: 'open', label: 'Открыть', icon: ContextMenuOpenIcon16, onClick: () => {
        const item = responseData.data.find(d => d.uid === uid);
        if (item) {
          openTab(`/references/manufacturers/edit/${uid}/${item.code || 0}`, `Производитель: ${item.name || ''}`, null);
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

  const renderCell = (key: string, item: ManufacturerRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '—';
    if (key === 'code' && typeof val === 'number') return String(val).padStart(4, '0');
    return String(val);
  };

  const isGrayColumn = (key: string): boolean => {
    return !['code', 'name', 'countryName', 'directionName'].includes(key);
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (filterValues['countryName'] && filterValues['countryName'].size > 0) {
      result = result.filter(row => filterValues['countryName'].has(String(row['countryUid'])));
    }
    if (filterValues['directionName'] && filterValues['directionName'].size > 0) {
      result = result.filter(row => filterValues['directionName'].has(String(row['directionUid'])));
    }
    if (sortColumn) {
      result.sort((a, b) => {
        if (sortColumn === 'code') {
          return sortDirection === 'asc' ? Number(a.code) - Number(b.code) : Number(b.code) - Number(a.code);
        }
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

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Производители (История изменений)' : 'Справочник: Производители'}
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
              if (col === 'code' || col === 'name') {
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
            if (key === 'countryName' || key === 'directionName') fetchFilterOptions();
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
          onCreate={handleCreateClick}
          onDelete={handleDeleteClick}
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
                rowIcon={Popup6}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Производители (Настройки списка)"
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

export default ManufacturersPage;