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
import Popup2 from '../../../assets/References/popup2.svg';

interface SupplierDirectionRowData { [key: string]: any; }
interface SupplierDirectionListResponse {
  columns: string[];
  data: SupplierDirectionRowData[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}

interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
];

const REQUIRED_COLUMNS = new Set(['name']);

const SORT_FIELDS = [
  { key: 'name', label: 'Наименование', iconType: '19' as const },
];

const FILTER_FIELDS: any[] = [];

const USER_ID = 1;

const SupplierDirectionsPage = () => {
  const { openTab } = useTabs();
  const [responseData, setResponseData] = useState<SupplierDirectionListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState<SupplierDirectionRowData | null>(null);
  const [formName, setFormName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [deleteTargetUid, setDeleteTargetUid] = useState<string | null>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [accountingIndex, setAccountingIndex] = useState(-1);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});

  const fetchData = useCallback(async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-directions?userId=${USER_ID}`);
      const response = r.data as SupplierDirectionListResponse;
      setResponseData(response);
      setVisibleColumns(new Set(response.columns));
      if (response.columnWidths) setColumnWidths(response.columnWidths);
      if (response.requiredColumns && response.requiredColumns.length > 0) {
        setRequiredColumns(new Set(response.requiredColumns));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/settings?userId=${USER_ID}`);
      const settings = r.data as { sortJson: string };
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

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/events`);
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
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/sort-settings?userId=${USER_ID}`, { sortJson }).catch(e => console.error(e));
  }, []);

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
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
  }, [visibleColumns, requiredColumns]);

  const handleResetToBase = useCallback(() => {
    const baseCols = new Set(requiredColumns);
    setVisibleColumns(baseCols);
    setResponseData(prev => ({ ...prev, columns: ALL_COLUMNS.filter(c => baseCols.has(c.key)).map(c => c.key) }));
    setColumnWidths({});
  }, [requiredColumns]);

  const handleSaveColumns = (cols: Set<string>) => {
    const finalCols = new Set(cols);
    requiredColumns.forEach(key => finalCols.add(key));
    setVisibleColumns(finalCols);
    setResponseData(prev => ({ ...prev, columns: ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key) }));
    setColumnWidths({});
    const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
    ALL_COLUMNS.forEach(col => {
      columnsJsonObj[col.key] = {
        visible: requiredColumns.has(col.key) ? true : finalCols.has(col.key),
        width: 0,
        required: requiredColumns.has(col.key),
      };
    });
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/columns-settings?userId=${USER_ID}`, { columnsJson }).catch(e => console.error(e));
  };

  const handleCreateClick = () => {
    setFormName('');
    setEditItem(null);
    setShowCreatePopup(true);
  };

  const handleCreateSubmit = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/supplier-directions`, { name: formName.trim() });
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
      await AxiosService.patch(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/${editItem.uid}`, { name: formName.trim() });
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
        await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/${deleteTargetUid}`);
      } else {
        for (const uid of selectedIds) {
          await AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/supplier-directions/${uid}`);
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

  const renderCell = (key: string, item: SupplierDirectionRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '—';
    return String(val);
  };

  const isGrayColumn = (key: string): boolean => {
    return !['name'].includes(key);
  };

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (sortColumn === 'name') {
      result.sort((a, b) => {
        const aVal = String(a['name'] || '');
        const bVal = String(b['name'] || '');
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, sortColumn, sortDirection]);

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

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Направления поставщиков (История изменений)' : 'Справочник: Направления поставщиков'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={[]}
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
          onClearFilters={() => {}}
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
                rowIcon={Popup2}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Направления поставщиков (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns}
      />

      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание направления поставщика</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Наименование</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateSubmit(); else if (e.key === 'Escape') setShowCreatePopup(false); }} placeholder="Введите наименование" autoFocus style={inputStyle} />
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
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование направления поставщика</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Наименование</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); else if (e.key === 'Escape') setShowEditPopup(false); }} placeholder="Введите наименование" autoFocus style={inputStyle} />
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

export default SupplierDirectionsPage;