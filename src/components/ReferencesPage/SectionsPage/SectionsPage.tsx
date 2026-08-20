// SectionsPage.tsx — ПОЛНЫЙ ФАЙЛ (добавлена иконка SectionIcon18Black, исправлено сохранение колонок)
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
import SectionIcon18Black from '../../../assets/Icons/SectionIcons/SectionIcon18Black.svg';

interface SectionRowData { [key: string]: any; }
interface SectionListResponse { 
  columns: string[]; 
  data: SectionRowData[]; 
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
}
interface ColumnItem { key: string; label: string; }

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'workshopName', label: 'Цех' },
  { key: 'enterpriseName', label: 'Предприятие' },
  { key: 'holdingName', label: 'Холдинг' },
];

const REQUIRED_COLUMNS = new Set(['name']);

const SORT_FIELDS = [
  { key: 'name', label: 'Наименование', iconType: '19' as const },
  { key: 'locationName', label: 'Размещение' },
];

const FILTER_FIELDS = [
  { key: 'sectionName', label: 'Размещение' },
];

const PLACEMENT_LEVELS = [
  { key: 'holdingName', label: 'Холдинг', emptyText: 'Нет холдингов' },
  { key: 'enterpriseName', label: 'Предприятие', emptyText: 'Нет предприятий' },
  { key: 'workshopName', label: 'Цех', emptyText: 'Нет цехов' },
];

const USER_ID = 1;

interface HierarchyDTO { holdings: HoldingDTO[] }
interface HoldingDTO { id: number; name: string; enterprises: EnterpriseDTO[] }
interface EnterpriseDTO { id: number; name: string; holdingId: number; workshops: WorkshopDTO[] }
interface WorkshopDTO { id: number; name: string; enterpriseId: number; holdingId: number; sections: SectionDTO[] }
interface SectionDTO { id: number; name: string; workshopId: number; enterpriseId: number; holdingId: number }

type PlacementKey = typeof PLACEMENT_LEVELS[number]['key'];
type PlacementSelections = Record<PlacementKey, Set<string>>;

const EMPTY_PLACEMENT: PlacementSelections = { holdingName: new Set(), enterpriseName: new Set(), workshopName: new Set() };

const SectionsPage = () => {
  const { activeTabId } = useTabs();
  const [responseData, setResponseData] = useState<SectionListResponse>({ columns: [], data: [], columnWidths: {}, requiredColumns: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const [placementSelections, setPlacementSelections] = useState<PlacementSelections>(EMPTY_PLACEMENT);
  const [hierarchy, setHierarchy] = useState<HierarchyDTO | null>(null);
  const [workshopList, setWorkshopList] = useState<{ id: string; name: string; enterpriseId: string }[]>([]);
  const [enterpriseList, setEnterpriseList] = useState<{ id: string; name: string }[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string; name: string } | null>(null);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editItem, setEditItem] = useState<SectionRowData | null>(null);
  const [formName, setFormName] = useState('');
  const [formEnterpriseId, setFormEnterpriseId] = useState<string>('');
  const [formWorkshopId, setFormWorkshopId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiSections}?userId=${USER_ID}`); 
      const response = r.data as SectionListResponse;
      const mappedData = response.data.map(item => ({
        ...item,
        uid: String(item.id),
      }));
      setResponseData({ ...response, data: mappedData });
      
      const visible = new Set(response.columns);
      requiredColumns.forEach(key => visible.add(key));
      setVisibleColumns(visible);
      
      if (response.columnWidths) {
        setColumnWidths(response.columnWidths);
      }
      if (response.requiredColumns && response.requiredColumns.length > 0) {
        setRequiredColumns(new Set(response.requiredColumns));
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    } 
  };

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
    AxiosService.patch(ConstantInfo.restApiSectionColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [visibleColumns, requiredColumns]);

  const handleResetToBase = useCallback(() => {
    const baseCols = new Set(requiredColumns);
    setVisibleColumns(baseCols);
    setResponseData(prev => ({ ...prev, columns: ALL_COLUMNS.filter(c => baseCols.has(c.key)).map(c => c.key) }));
    setColumnWidths({});
  }, [requiredColumns]);

  const fetchSettings = async () => { 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiSectionAllSettings(USER_ID)); 
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
          });
        }
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
    AxiosService.patch(ConstantInfo.restApiSectionFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);
  
  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    const sortJson = column ? JSON.stringify({ column, direction }) : '{}';
    AxiosService.patch(ConstantInfo.restApiSectionSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);
  
  const fetchHistory = async () => { 
    setHistoryLoading(true); 
    try { 
      const r = await AxiosService.get(ConstantInfo.restApiSectionEvents); 
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
  
  const fetchWorkshops = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiWorkshops}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setWorkshopList(items.map((item: any) => ({ id: String(item.id), name: item.name, enterpriseId: String(item.enterpriseId) }))); 
    } catch (e) { 
      console.error(e); 
    } 
  };

  const fetchEnterprises = async () => { 
    try { 
      const r = await AxiosService.get(`${ConstantInfo.restApiEnterprises}?userId=${USER_ID}`); 
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setEnterpriseList(items.map((item: any) => ({ id: String(item.id), name: item.name }))); 
    } catch (e) { 
      console.error(e); 
    } 
  };

  useEffect(() => { fetchData(); fetchHierarchy(); fetchWorkshops(); fetchEnterprises(); fetchSettings(); }, []);

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
      saveSort(sortColumn, sortDirection);
    }
  }, [sortColumn, sortDirection, isLoading, saveSort]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const filteredWorkshops = useMemo(() => {
    if (!formEnterpriseId) return [];
    return workshopList.filter(w => w.enterpriseId === formEnterpriseId);
  }, [workshopList, formEnterpriseId]);

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleCheckboxClick = (id: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(id); };
  const handleRowClick = (id: string, e: React.MouseEvent) => { e.stopPropagation(); toggleSelectItem(id); };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isAllSelected = responseData.data.length > 0 && responseData.data.every(item => selectedIds.has(item.uid));
    if (isAllSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(responseData.data.map(item => item.uid)));
  };
  const handleContextMenu = (e: React.MouseEvent, id: string, name: string) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, id, name }); };
  const handleDoubleClick = (id: string, name: string) => {};
  
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
    AxiosService.patch(ConstantInfo.restApiSectionColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  };
  
  const handleHistoryClick = () => { 
    setShowHistory(prev => {
      const next = !prev;
      if (next) fetchHistory();
      return next;
    });
  };

  const handleCreateClick = () => { setFormName(''); setFormEnterpriseId(''); setFormWorkshopId(''); setEditItem(null); setShowCreatePopup(true); };
  const handleCreateSubmit = async () => {
    if (!formName.trim() || !formWorkshopId) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiSections, { 
        name: formName.trim(), 
        workshopId: Number(formWorkshopId),
      });
      await fetchData();
      setShowCreatePopup(false);
    } catch (error) { console.error('Ошибка создания:', error); } finally { setIsSaving(false); }
  };

  const handleEditClick = () => {
    if (!contextMenu) return;
    const item = responseData.data.find(d => d.uid === contextMenu.id);
    if (item) { 
      setEditItem(item); 
      setFormName(item.name); 
      setFormEnterpriseId(item.enterpriseId ? String(item.enterpriseId) : ''); 
      setFormWorkshopId(item.workshopId ? String(item.workshopId) : ''); 
      setShowEditPopup(true); 
    }
    setContextMenu(null);
  };

  const handleEditSubmit = async () => {
    if (!editItem || !formName.trim() || !formWorkshopId) return;
    setIsSaving(true);
    try {
      await AxiosService.patch(`${ConstantInfo.restApiSections}/${editItem.id}`, { 
        name: formName.trim(), 
        workshopId: Number(formWorkshopId),
      });
      await fetchData();
      setShowEditPopup(false); setEditItem(null);
    } catch (error) { console.error('Ошибка редактирования:', error); } finally { setIsSaving(false); }
  };

  const contextMenuItems: ContextMenuItem[] = [
    { id: 'edit', label: 'Редактировать', icon: ContextMenuOpenIcon16, onClick: handleEditClick },
    { id: 'delete', label: 'Удалить', icon: ContextMenuDeleteIcon16, onClick: () => { if (!contextMenu) return; setDeleteTargetUid(contextMenu.id); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); } },
  ];

  const renderCell = (key: string, item: SectionRowData): string => {
    const val = item[key];
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        const item = responseData.data.find(d => d.uid === deleteTargetUid);
        await AxiosService.delete(`${ConstantInfo.restApiSections}/${item?.id}`);
      } else {
        for (const uid of selectedIds) {
          const item = responseData.data.find(d => d.uid === uid);
          await AxiosService.delete(`${ConstantInfo.restApiSections}/${item?.id}`);
        }
      }
      await fetchData(); setSelectedIds(new Set()); setDeleteTargetUid(null); setShowDeleteConfirm(false);
    } catch (error) { console.error('Ошибка удаления:', error); }
  };

  const getSortValue = (row: SectionRowData, sortKey: string): string => {
    const code = String(row['name'] || '');
    
    switch (sortKey) {
      case 'locationName': {
        const holding = row['holdingName'] || '';
        const enterprise = row['enterpriseName'] || '';
        const workshop = row['workshopName'] || '';
        const section = row['name'] || '';
        
        if (!holding) return `999|${code}`;
        if (!enterprise) return `998|${holding}|${code}`;
        if (!workshop) return `997|${holding}|${enterprise}|${code}`;
        if (!section) return `996|${holding}|${enterprise}|${workshop}|${code}`;
        
        return `0|${holding}|${enterprise}|${workshop}|${section}|${code}`;
      }
      default: {
        const val = row[sortKey];
        if (!val || val === '-') return `999|${code}`;
        return `0|${val}|${code}`;
      }
    }
  };

  const findParentValues = (level: PlacementKey, value: string): Partial<Record<PlacementKey, string>> => { 
    if (!hierarchy) return {}; 
    const result: Partial<Record<PlacementKey, string>> = {}; 
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

  const filteredData = useMemo(() => {
    let result = [...responseData.data];
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    
    if (placementSelections['holdingName'] && placementSelections['holdingName'].size > 0) 
      result = result.filter(row => placementSelections['holdingName'].has(String(row['holdingId'])));
    if (placementSelections['enterpriseName'] && placementSelections['enterpriseName'].size > 0) 
      result = result.filter(row => placementSelections['enterpriseName'].has(String(row['enterpriseId'])));
    if (placementSelections['workshopName'] && placementSelections['workshopName'].size > 0) 
      result = result.filter(row => placementSelections['workshopName'].has(String(row['workshopId'])));
    
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = getSortValue(a, sortColumn);
        const bVal = getSortValue(b, sortColumn);
        if (sortColumn === 'locationName') {
          return aVal.localeCompare(bVal);
        }
        if (sortColumn === 'name') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return aVal.localeCompare(bVal);
      });
    }
    return result;
  }, [responseData.data, searchValue, placementSelections, sortColumn, sortDirection]);

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' };
  const selectStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', cursor: 'pointer', appearance: 'none' };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Участки (История изменений)' : 'Справочник: Участки'}
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
          placementSelections={placementSelections}
          hasPlacementSelections={hasPlacementSelections}
          onFilterToggle={(key) => { if (key === 'sectionName') fetchHierarchy(); }}
          onCheckFilterOption={() => {}}
          onPlacementLevelClick={() => {}}
          onPlacementCheck={handlePlacementCheck}
          onClearFilters={() => { setActiveFilters(new Set()); setFilterValues({}); setPlacementSelections(EMPTY_PLACEMENT); }}
          hierarchy={hierarchy}
          modelList={[]}
          configList={[]}
          onFetchHierarchy={fetchHierarchy}
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
                rowIcon={SectionIcon18Black}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} />}

      <ConfigurationPopup 
        isOpen={showConfigurationPopup} 
        onClose={() => setShowConfigurationPopup(false)} 
        title="Справочник: Участки (Настройки списка)" 
        columns={ALL_COLUMNS} 
        visibleColumns={visibleColumns} 
        requiredColumns={requiredColumns}
        onSave={handleSaveColumns} 
      />

      {showCreatePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreatePopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание участка</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Введите название" autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Предприятие</label><select value={formEnterpriseId} onChange={e => { setFormEnterpriseId(e.target.value); setFormWorkshopId(''); }} style={selectStyle}><option value="">Выберите предприятие</option>{enterpriseList.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Цех</label><select value={formWorkshopId} onChange={e => setFormWorkshopId(e.target.value)} disabled={!formEnterpriseId} style={{ ...selectStyle, opacity: formEnterpriseId ? 1 : 0.5, cursor: formEnterpriseId ? 'pointer' : 'not-allowed' }}><option value="">Выберите цех</option>{filteredWorkshops.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}</select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreatePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleCreateSubmit} disabled={isSaving || !formName.trim() || !formWorkshopId} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formName.trim() && formWorkshopId && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formName.trim() && formWorkshopId && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование участка</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} autoFocus style={inputStyle} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Предприятие</label><select value={formEnterpriseId} onChange={e => { setFormEnterpriseId(e.target.value); setFormWorkshopId(''); }} style={selectStyle}><option value="">Выберите предприятие</option>{enterpriseList.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Цех</label><select value={formWorkshopId} onChange={e => setFormWorkshopId(e.target.value)} disabled={!formEnterpriseId} style={{ ...selectStyle, opacity: formEnterpriseId ? 1 : 0.5, cursor: formEnterpriseId ? 'pointer' : 'not-allowed' }}><option value="">Выберите цех</option>{filteredWorkshops.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}</select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowEditPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleEditSubmit} disabled={isSaving || !formName.trim() || !formWorkshopId} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: formName.trim() && formWorkshopId && !isSaving ? '#666EFE' : '#BCC8FF', cursor: formName.trim() && formWorkshopId && !isSaving ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
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

export default SectionsPage;