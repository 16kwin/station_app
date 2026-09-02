// SupplierBrandsPage.tsx — ИСПРАВЛЕННЫЙ (дефолтная инициализация + barcodeSearch в типе)
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
import Popup7 from '../../../assets/References/popup7.svg';

interface SupplierBrandRowData { [key: string]: any; }
interface SupplierBrandListResponse {
  columns: string[];
  data: SupplierBrandRowData[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}

interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'supplierName', label: 'Поставщик' },
];

const REQUIRED_COLUMNS = new Set(['name', 'supplierName']);

const SORT_FIELDS = [
  { key: 'name', label: 'Наименование', iconType: '19' as const },
  { key: 'supplierName', label: 'Поставщик' },
];

const FILTER_FIELDS = [
  { key: 'supplierName', label: 'Поставщик' },
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

const SupplierBrandsPage = () => {
  const { openTab } = useTabs();
  const [responseData, setResponseData] = useState<SupplierBrandListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState<SupplierBrandRowData | null>(null);
  const [formName, setFormName] = useState('');
  const [formSupplierUid, setFormSupplierUid] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-brands?userId=${USER_ID}`);
      const response = r.data as SupplierBrandListResponse;
      
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
      AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/columns-settings?userId=${USER_ID}`, { columnsJson })
        .then(() => setIsFirstInit(false))
        .catch(e => {
          console.error('Ошибка сохранения настроек колонок:', e);
          setIsFirstInit(false);
        });
    }
  }, [isFirstInit, isLoading, visibleColumns, columnWidths, requiredColumns]);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/settings?userId=${USER_ID}`);
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
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/suppliers`);
      const items = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setFilterOptions({
        supplierName: items.map((s: any) => ({ uid: s.uid || s.name, name: s.name || s.typeName })),
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/events`);
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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/filters-settings?userId=${USER_ID}`, { filtersJson }).catch(e => console.error(e));
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/sort-settings?userId=${USER_ID}`, { sortJson }).catch(e => console.error(e));
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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
  };

  const handleCreateClick = () => {
    setFormName('');
    setFormSupplierUid('');
    setEditItem(null);
    setShowCreatePopup(true);
  };

  const handleCreateSubmit = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/supplier-brands`, {
        name: formName.trim(),
        supplierUid: formSupplierUid || null,
      });
      await fetchData();
      setShowCreatePopup(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editItem || !formName.trim()) return;
    setIsSaving(true);
    try {
      await AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/${editItem.uid}`, {
        name: formName.trim(),
        supplierUid: formSupplierUid || null,
      });
      await fetchData();
      setShowEditPopup(false);
      setEditItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
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
        await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/supplier-brands/${uid}`);
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
      setEditItem(item);
      setFormName(item.name || '');
      setFormSupplierUid(item.supplierUid || '');
      setShowEditPopup(true);
    }
  };

  const rowContextMenuItems = useCallback((uid: string, name: string): ContextMenuItem[] => {
    return [
      { id: 'edit', label: 'Редактировать', icon: ContextMenuOpenIcon16, onClick: () => {
        const item = responseData.data.find(d => d.uid === uid);
        if (item) {
          setEditItem(item);
          setFormName(item.name || '');
          setFormSupplierUid(item.supplierUid || '');
          setShowEditPopup(true);
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
  }, [responseData.data]);

  const renderCell = (key: string, item: SupplierBrandRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '—';
    return String(val);
  };

  const isGrayColumn = (key: string): boolean => {
    return !['name', 'supplierName'].includes(key);
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (filterValues['supplierName'] && filterValues['supplierName'].size > 0) {
      result = result.filter(row => filterValues['supplierName'].has(String(row['supplierUid'])));
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

  const suppliersForForm = useMemo(() => {
    return filterOptions['supplierName'] || [];
  }, [filterOptions]);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    paddingLeft: 12, paddingRight: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    paddingLeft: 12, paddingRight: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF',
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Бренды поставщиков (История изменений)' : 'Справочник: Бренды поставщиков'}
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
              if (col === 'name') {
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
            if (key === 'supplierName') fetchFilterOptions();
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
                rowIcon={Popup7}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Бренды поставщиков (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns}
      />

      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание бренда поставщика</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Наименование</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateSubmit(); else if (e.key === 'Escape') setShowCreatePopup(false); }} placeholder="Введите наименование" autoFocus style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <select value={formSupplierUid} onChange={e => setFormSupplierUid(e.target.value)} style={selectStyle}>
                <option value="">Без поставщика</option>
                {suppliersForForm.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreatePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleCreateSubmit} disabled={isSaving || !formName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formName.trim() && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formName.trim() && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование бренда поставщика</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Наименование</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); else if (e.key === 'Escape') setShowEditPopup(false); }} placeholder="Введите наименование" autoFocus style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <select value={formSupplierUid} onChange={e => setFormSupplierUid(e.target.value)} style={selectStyle}>
                <option value="">Без поставщика</option>
                {suppliersForForm.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={isSaving || !formName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formName.trim() && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formName.trim() && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
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

export default SupplierBrandsPage;