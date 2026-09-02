// LocationsPage.tsx — ИСПРАВЛЕННЫЙ (дефолтная инициализация + barcodeSearch в типе)
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
import LocationIcon18Black from '../../../assets/Icons/LocationIcons/LocationIcon18Black.svg';

interface LocationRowData { [key: string]: any; }
interface LocationListResponse { 
  columns: string[]; 
  data: LocationRowData[]; 
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Расположение' },
];

const REQUIRED_COLUMNS = new Set(['name']);

const SORT_FIELDS = [
  { key: 'name', label: 'Расположение', iconType: '19' as const },
];

const FILTER_FIELDS: any[] = [];
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

const LocationsPage = () => {
  const { activeTabId } = useTabs();
  const [responseData, setResponseData] = useState<LocationListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; name: string } | null>(null);
  const [isFirstInit, setIsFirstInit] = useState(false);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState<LocationRowData | null>(null);
  const [formName, setFormName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiLocationsCrud}?userId=${USER_ID}`); 
      const response = r.data as LocationListResponse;
      
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
      AxiosService.patch(ConstantInfo.restApiLocationColumnsSettingsSave(USER_ID), { columnsJson })
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
    AxiosService.patch(ConstantInfo.restApiLocationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
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
    AxiosService.patch(ConstantInfo.restApiLocationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  const fetchSettings = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiLocationAllSettings(USER_ID)); 
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
    AxiosService.patch(ConstantInfo.restApiLocationFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);
  
  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiLocationSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);
  
  const fetchHistory = async () => { 
    setHistoryLoading(true); 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiLocationEvents); 
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription }))); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setHistoryLoading(false); 
    } 
  };

  useEffect(() => { fetchData(); fetchSettings(); }, []);

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
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
  };

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(uid); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(uid); };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isAllSelected = responseData.data.length > 0 && responseData.data.every(item => selectedIds.has(item.uid));
    if (isAllSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(responseData.data.map(item => item.uid)));
  };
  const handleContextMenu = (e: React.MouseEvent, uid: string, name: string) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, uid, name }); };
  const handleDoubleClick = (uid: string, name: string) => {};
  
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
    AxiosService.patch(ConstantInfo.restApiLocationColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  };
  
  const handleHistoryClick = () => { 
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const handleCreateClick = () => { setFormName(''); setEditItem(null); setShowCreatePopup(true); };
  const handleCreateSubmit = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiLocationsCrud, { name: formName.trim() });
      await fetchData();
      setShowCreatePopup(false);
    } catch (error) { console.error('Ошибка создания:', error); } finally { setIsSaving(false); }
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    const item = responseData.data.find(d => d.uid === contextMenu.uid);
    if (item) { setEditItem(item); setFormName(item.name); setShowEditPopup(true); }
    setContextMenu(null);
  };

  const handleEditSubmit = async () => {
    if (!editItem || !formName.trim()) return;
    setIsSaving(true);
    try {
      await AxiosService.patch(`${ConstantInfo.restApiLocationsCrud}/${editItem.uid}`, { name: formName.trim() });
      await fetchData();
      setShowEditPopup(false); setEditItem(null);
    } catch (error) { console.error('Ошибка редактирования:', error); } finally { setIsSaving(false); }
  };

  const contextMenuItems: ContextMenuItem[] = [
    { id: 'edit', label: 'Редактировать', icon: ContextMenuOpenIcon16, onClick: handleEditClick },
    { id: 'delete', label: 'Удалить', icon: ContextMenuDeleteIcon16, onClick: () => { if (!contextMenu) return; setDeleteTargetUid(contextMenu.uid); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); } },
  ];

  const renderCell = (key: string, item: LocationRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        await AxiosService.delete(`${ConstantInfo.restApiLocationsCrud}/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.restApiLocationsCrud}/${uid}`);
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
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = String(a[sortColumn] || '');
        const bVal = String(b[sortColumn] || '');
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, sortColumn, sortDirection]);

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Расположения (История изменений)' : 'Справочник: Расположения'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar 
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={PLACEMENT_LEVELS}
          accountingTypes={[]}
          accountingColumnKeys={[]}
          filterOptions={{}}
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
          onCheckFilterOption={() => {}}
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
                highlightText={searchValue.trim() || undefined}
                initialWidths={columnWidths}
                onWidthsChange={handleColumnWidthsChange}
                requiredColumns={requiredColumns}
                onResetToBase={handleResetToBase}
                rowIcon={LocationIcon18Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} />}

      <ConfigurationPopup 
        isOpen={showConfigurationPopup} 
        onClose={() => setShowConfigurationPopup(false)} 
        title="Справочник: Расположения (Настройки списка)" 
        columns={ALL_COLUMNS} 
        visibleColumns={visibleColumns} 
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns} 
      />

      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание расположения</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Введите название" autoFocus style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreatePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleCreateSubmit} disabled={isSaving || !formName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formName.trim() && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formName.trim() && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование расположения</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} autoFocus style={inputStyle} /></div>
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

export default LocationsPage;