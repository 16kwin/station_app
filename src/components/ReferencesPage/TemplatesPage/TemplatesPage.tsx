// TemplatesPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import HistoryTable from '../../elements/HistoryTable';
import NomenclatureDataTable from '../../elements/NomenclatureDataTable';
import TableToolbar from '../../elements/TableToolbar';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import ContextMenuOpenIcon16 from '../../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon21 from '../../../assets/References/Icon21.svg';
import Icon22 from '../../../assets/References/Icon22.svg';
import Icon23 from '../../../assets/References/Icon23.svg';
import Icon24 from '../../../assets/References/Icon24.svg';
import Icon25 from '../../../assets/References/Icon25.svg';
import PopupIcon2 from '../../../assets/Station/PopupIcon2.svg';
import PopupIcon7 from '../../../assets/Station/PopupIcon7.svg';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import TemplateCreateGroupPopup from './TemplateCreateGroupPopup';
import TemplateCreateEditPopup from './TemplateCreateEditPopup';

interface TemplateItem {
  uid: string;
  name: string;
  number: number | null;
  categoryId: number | null;
  categoryName: string | null;
  configuration: string | null;
  configurationUid: string | null;
  configurationName: string | null;
  modelName: string | null;
  totalCells: number;
  filledCells: number;
  freeCells: number;
  createdAt: string;
  active: boolean;
  stationNames: string[];
}

interface CategoryNode {
  id: number;
  uid: string;
  name: string;
  code: number | null;
  parentCategoryId: number | null;
  parentCategoryUid: string | null;
  parentCategoryName: string | null;
  children: CategoryNode[];
  templates: TemplateItem[];
}

interface TemplatesTreeResponse {
  tree: CategoryNode[];
  columns: string[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
  columnsJson?: string;
  filtersJson?: string;
  sortJson?: string;
  currentPathJson?: string;
}

interface ColumnItem { key: string; label: string; }

interface RowItem {
  uid: string;
  name: string;
  type: 'folder' | 'template';
  depth: number;
  code?: number | null;
  number?: number | null;
  configurationName?: string | null;
  modelName?: string | null;
  stationNames?: string[];
  active?: boolean;
  createdAt?: string;
  folderData?: CategoryNode;
  templateData?: TemplateItem;
  isExpanded?: boolean;
}

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'number', label: 'Код' },
  { key: 'configurationName', label: 'Конфигурация' },
  { key: 'modelName', label: 'Модель' },
  { key: 'stationNames', label: 'Станция' },
  { key: 'active', label: 'Статус' },
  { key: 'createdAt', label: 'Дата' },
];

const REQUIRED_COLUMNS = new Set([
  'name', 'number', 'configurationName', 'modelName', 'stationNames', 'active', 'createdAt'
]);

interface SortField { key: string; label: string; }
const SORT_FIELDS: SortField[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'number', label: 'Код' },
  { key: 'configurationName', label: 'Конфигурация' },
  { key: 'modelName', label: 'Модель' },
];

interface FilterField { key: string; label: string; options?: { uid: string; name: string }[]; }
const FILTER_FIELDS: FilterField[] = [
  { key: 'active', label: 'Статус', options: [
    { uid: 'true', name: 'Активные' },
    { uid: 'false', name: 'Неактивные' },
  ]},
  { key: 'hasStations', label: 'Есть станции', options: [
    { uid: 'true', name: 'Есть' },
    { uid: 'false', name: 'Нет' },
  ]},
];

const USER_ID = 1;

const TemplatesPage = () => {
  const { openTab, activeTabId } = useTabs();
  const tabIdRef = useRef<string | null>(null);

  const [treeData, setTreeData] = useState<CategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetUid, setDeleteTargetUid] = useState<string | null>(null);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showCreateTemplatePopup, setShowCreateTemplatePopup] = useState(false);
  const [createMode, setCreateMode] = useState<'create' | 'copy'>('create');
  const [createTemplateName, setCreateTemplateName] = useState('');
  const [createTemplateCategoryUid, setCreateTemplateCategoryUid] = useState<string | null>(null);
  const [createTemplateCategoryName, setCreateTemplateCategoryName] = useState('');
  const [createTemplateModelUid, setCreateTemplateModelUid] = useState('');
  const [createTemplateModelName, setCreateTemplateModelName] = useState('');
  const [createTemplateConfigUid, setCreateTemplateConfigUid] = useState('');
  const [createTemplateConfigName, setCreateTemplateConfigName] = useState('');
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showConfigSelect, setShowConfigSelect] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupParentUid, setCreateGroupParentUid] = useState<string | null>(null);
  const [createGroupParentName, setCreateGroupParentName] = useState<string | null>(null);

  const [showRenamePopup, setShowRenamePopup] = useState(false);
  const [renameUid, setRenameUid] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameType, setRenameType] = useState<'category' | 'template'>('category');
  const [isRenaming, setIsRenaming] = useState(false);

  const [showMoveSelectPopup, setShowMoveSelectPopup] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [showCopySelectPopup, setShowCopySelectPopup] = useState(false);
  const [operationUid, setOperationUid] = useState<string | null>(null);

  const [responseColumns, setResponseColumns] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | 'barcodeSearch' | null>(null);

  useEffect(() => { tabIdRef.current = activeTabId; }, []);

  const fetchTreeWithSettings = useCallback(async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiTemplatesTreeWithSettings(USER_ID));
      const data = response.data as TemplatesTreeResponse;
      setTreeData(data.tree || []);
      if (data.columns && data.columns.length > 0) setResponseColumns(data.columns);
      if (data.columnWidths && Object.keys(data.columnWidths).length > 0) setColumnWidths(data.columnWidths);
      if (data.requiredColumns && data.requiredColumns.length > 0) setRequiredColumns(new Set(data.requiredColumns));
      if (data.filtersJson && data.filtersJson !== '{}') {
        const filters = JSON.parse(data.filtersJson) as Record<string, string[]>;
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
      if (data.sortJson && data.sortJson !== '{}') {
        const sort = JSON.parse(data.sortJson) as { column?: string; direction?: 'asc' | 'desc' };
        if (sort.column) {
          setSortColumn(sort.column);
          setSortDirection(sort.direction || 'asc');
        }
      }
      if (data.currentPathJson && data.currentPathJson !== '[]') {
        try {
          const path = JSON.parse(data.currentPathJson) as string[];
          if (Array.isArray(path) && path.length > 0) setExpandedFolders(new Set(path));
        } catch (e) { /* ignore */ }
      }
    } catch (error) {
      console.error('Ошибка загрузки дерева шаблонов:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTreeWithSettings(); }, []);

  const saveExpandedFolders = useCallback((folders: Set<string>) => {
    const currentPathJson = JSON.stringify(Array.from(folders));
    AxiosService.patch(ConstantInfo.restApiTemplatesCurrentPathSave(USER_ID), { currentPathJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => { if (!isLoading) saveExpandedFolders(expandedFolders); }, [expandedFolders, isLoading]);

  const saveFilters = useCallback((filters: Record<string, Set<string>>) => {
    const filtersJsonObj: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) filtersJsonObj[key] = Array.from(values);
    });
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(ConstantInfo.restApiTemplatesFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => { if (!isLoading) saveFilters(filterValues); }, [filterValues, isLoading]);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    let sortJson = '{}';
    if (column) sortJson = JSON.stringify({ column, direction });
    AxiosService.patch(ConstantInfo.restApiTemplatesSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => { if (!isLoading) saveSort(sortColumn, sortDirection); }, [sortColumn, sortDirection, isLoading]);

  const saveColumns = useCallback((cols: string[], widths: Record<string, number>) => {
    const columnsJsonObj: Record<string, { visible: boolean; width: number; required?: boolean }> = {};
    ALL_COLUMNS.forEach(col => {
      columnsJsonObj[col.key] = {
        visible: cols.includes(col.key),
        width: widths[col.key] || 0,
        required: requiredColumns.has(col.key),
      };
    });
    const columnsJson = JSON.stringify(columnsJsonObj);
    AxiosService.patch(ConstantInfo.restApiTemplatesColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  useEffect(() => {
    if (!isLoading && responseColumns.length > 0) saveColumns(responseColumns, columnWidths);
  }, [responseColumns, columnWidths, isLoading]);

  const findCategoryByUid = (nodes: CategoryNode[], uid: string): CategoryNode | null => {
    for (const node of nodes) {
      if (node.uid === uid) return node;
      if (node.children) {
        const found = findCategoryByUid(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  const findTemplateByUid = (nodes: CategoryNode[], uid: string): TemplateItem | null => {
    for (const node of nodes) {
      const t = node.templates.find(t => t.uid === uid);
      if (t) return t;
      if (node.children) {
        const found = findTemplateByUid(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  const collectAllUids = useCallback((node: CategoryNode): string[] => {
    const uids: string[] = [node.uid];
    node.templates.forEach(t => uids.push(t.uid));
    if (node.children) {
      node.children.forEach(child => { uids.push(...collectAllUids(child)); });
    }
    return uids;
  }, []);

  const toggleFolder = (folderUid: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderUid)) next.delete(folderUid);
      else next.add(folderUid);
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
    const item = rowItems.find(r => r.uid === uid);
    if (item?.type === 'folder') {
      const folder = findCategoryByUid(treeData, uid);
      if (folder) {
        const allUids = collectAllUids(folder);
        setSelectedIds(prev => {
          const next = new Set(prev);
          const allSelected = allUids.every(id => next.has(id));
          if (allSelected) allUids.forEach(id => next.delete(id));
          else allUids.forEach(id => next.add(id));
          return next;
        });
      }
    } else {
      toggleSelectItem(uid);
    }
  };

  const handleRowClick = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = rowItems.find(r => r.uid === uid);
    if (item?.type === 'folder') toggleFolder(uid);
  };

  const handleDoubleClick = (uid: string, name: string) => {
    const item = rowItems.find(r => r.uid === uid);
    if (item?.type === 'template') {
      openTab(`/documents/schablon/${uid}`, `Шаблон - ${name}`, null);
    } else if (item?.type === 'folder') {
      toggleFolder(uid);
    }
  };

  const resetCreateTemplateForm = () => {
    setCreateTemplateName('');
    setCreateTemplateCategoryUid(null);
    setCreateTemplateCategoryName('');
    setCreateTemplateModelUid('');
    setCreateTemplateModelName('');
    setCreateTemplateConfigUid('');
    setCreateTemplateConfigName('');
    setCreateMode('create');
  };

  const handleCreateTemplate = (categoryUid: string | null, categoryName: string) => {
    resetCreateTemplateForm();
    setCreateTemplateCategoryUid(categoryUid);
    setCreateTemplateCategoryName(categoryName);
    setCreateMode('create');
    setShowCreateTemplatePopup(true);
  };

  const handleCreateTemplateSubmit = async () => {
    if (!createTemplateName.trim()) return;
    setIsCreatingTemplate(true);
    try {
      const category = createTemplateCategoryUid ? findCategoryByUid(treeData, createTemplateCategoryUid) : null;
      const body: any = { name: createTemplateName.trim(), configuration: '' };
      if (category) body.categoryId = category.id;
      if (createTemplateConfigUid) body.configurationUid = createTemplateConfigUid;
      const res = await AxiosService.post(ConstantInfo.restApiTemplates, body);
      const newUid = res.data.uid;
      const newName = res.data.name || createTemplateName.trim();
      await fetchTreeWithSettings();
      setShowCreateTemplatePopup(false);
      resetCreateTemplateForm();
      openTab(`/documents/schablon/${newUid}`, `Шаблон - ${newName}`, null);
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleCreateGroupFromToolbar = () => {
    setCreateGroupParentUid(null);
    setCreateGroupParentName(null);
    setShowCreateGroup(true);
  };

  const handleCreateGroupFromContext = (parentUid: string, parentName: string) => {
    setCreateGroupParentUid(parentUid);
    setCreateGroupParentName(parentName);
    setShowCreateGroup(true);
  };

  const handleCreateGroup = async (name: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      const body: any = { name };
      if (parentUid) body.parentCategoryUid = parentUid;
      await AxiosService.post(ConstantInfo.restApiTemplatesCategories, body);
      await fetchTreeWithSettings();
      if (parentUid) setExpandedFolders(prev => new Set(prev).add(parentUid));
      setShowCreateGroup(false);
      setCreateGroupParentUid(null);
      setCreateGroupParentName(null);
    } catch (error) {
      console.error('Ошибка создания категории:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameUid || !renameName.trim()) return;
    setIsRenaming(true);
    try {
      if (renameType === 'category') {
        const cat = findCategoryByUid(treeData, renameUid);
        if (cat) {
          await AxiosService.put(ConstantInfo.restApiTemplatesCategory(cat.id), { name: renameName.trim() });
        }
      } else {
        await AxiosService.put(ConstantInfo.restApiTemplate(renameUid), { name: renameName.trim() });
      }
      await fetchTreeWithSettings();
      setShowRenamePopup(false);
      setRenameUid(null);
      setRenameName('');
    } catch (error) {
      console.error('Ошибка переименования:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteTargetUid) {
        const cat = findCategoryByUid(treeData, deleteTargetUid);
        if (cat) await AxiosService.delete(ConstantInfo.restApiTemplatesCategory(cat.id));
        else await AxiosService.delete(ConstantInfo.restApiTemplate(deleteTargetUid));
      } else {
        for (const uid of selectedIds) {
          const cat = findCategoryByUid(treeData, uid);
          if (cat) await AxiosService.delete(ConstantInfo.restApiTemplatesCategory(cat.id));
          else await AxiosService.delete(ConstantInfo.restApiTemplate(uid));
        }
      }
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      setDeleteTargetUid(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleCopyToOther = () => {
    setShowCopyPopup(false);
    setShowCopySelectPopup(true);
  };

  const handleCopySelectCategory = async (targetCategoryUid: string) => {
    try {
      const uidToCopy = operationUid || (selectedIds.size === 1 ? Array.from(selectedIds)[0] : null);
      if (!uidToCopy) return;
      const sourceTemplate = findTemplateByUid(treeData, uidToCopy);
      const targetCat = findCategoryByUid(treeData, targetCategoryUid);
      if (sourceTemplate) {
        const res = await AxiosService.post(ConstantInfo.restApiTemplateCopy, {
          sourceTemplateUid: sourceTemplate.uid,
          targetCategoryId: targetCat ? targetCat.id : null,
        });
        const newUid = res.data.uid;
        const newName = res.data.name || sourceTemplate.name;
        await fetchTreeWithSettings();
        openTab(`/documents/schablon/${newUid}`, `Шаблон - ${newName}`, null);
      }
      setSelectedIds(new Set());
      setShowCopySelectPopup(false);
      setOperationUid(null);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const handleMoveSelectCategory = async (targetCategoryUid: string) => {
    try {
      const uidToMove = operationUid || (selectedIds.size === 1 ? Array.from(selectedIds)[0] : null);
      if (!uidToMove) return;
      const sourceTemplate = findTemplateByUid(treeData, uidToMove);
      const sourceCat = findCategoryByUid(treeData, uidToMove);
      if (sourceTemplate) {
        await AxiosService.post(ConstantInfo.restApiTemplateMove, { templateUid: sourceTemplate.uid, newCategoryUid: targetCategoryUid });
      } else if (sourceCat) {
        await AxiosService.post(ConstantInfo.restApiTemplatesCategoryMove, { categoryUid: sourceCat.uid, newParentUid: targetCategoryUid });
      }
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowMoveSelectPopup(false);
      setOperationUid(null);
    } catch (error) {
      console.error('Ошибка перемещения:', error);
    }
  };

  const rowItems = useMemo((): RowItem[] => {
    const items: RowItem[] = [];
    const q = searchValue.trim().toLowerCase();

    const templateMatchesSearch = (t: TemplateItem): boolean => {
      if (!q) return true;
      return [t.name, t.number, t.configurationName, t.modelName, t.stationNames?.join(' ')]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    };

    const templateMatchesFilters = (t: TemplateItem): boolean => {
      if (filterValues['active']?.size) {
        if (!filterValues['active'].has(String(t.active))) return false;
      }
      if (filterValues['hasStations']?.size) {
        const has = t.stationNames && t.stationNames.length > 0;
        if (!filterValues['hasStations'].has(String(has))) return false;
      }
      return true;
    };

    const sortTemplates = (list: TemplateItem[]): TemplateItem[] => {
      if (!sortColumn) return list;
      return [...list].sort((a, b) => {
        let aV = ''; let bV = '';
        switch (sortColumn) {
          case 'name': aV = (a.name || '').toLowerCase(); bV = (b.name || '').toLowerCase(); break;
          case 'number': aV = String(a.number || 0).padStart(10, '0'); bV = String(b.number || 0).padStart(10, '0'); break;
          case 'configurationName': aV = (a.configurationName || '').toLowerCase(); bV = (b.configurationName || '').toLowerCase(); break;
          case 'modelName': aV = (a.modelName || '').toLowerCase(); bV = (b.modelName || '').toLowerCase(); break;
        }
        const r = aV.localeCompare(bV);
        return sortDirection === 'asc' ? r : -r;
      });
    };

    const buildNode = (node: CategoryNode, depth: number) => {
      const filteredTemplates = sortTemplates(node.templates.filter(t => templateMatchesSearch(t) && templateMatchesFilters(t)));
      const hasChildren = node.children && node.children.length > 0;
      const hasAnyFilter = q || activeFilters.size > 0;
      const isExpanded = hasAnyFilter ? true : expandedFolders.has(node.uid);
      const shouldShow = !hasAnyFilter || filteredTemplates.length > 0 || (node.children && node.children.length > 0);
      if (!shouldShow) return;

      items.push({ uid: node.uid, name: node.name, type: 'folder', depth, code: node.code, folderData: node, isExpanded });

      if (isExpanded) {
        if (hasChildren) node.children.forEach(child => buildNode(child, depth + 1));
        filteredTemplates.forEach(t => {
          items.push({
            uid: t.uid, name: t.name, type: 'template', depth: depth + 1,
            number: t.number, configurationName: t.configurationName, modelName: t.modelName,
            stationNames: t.stationNames, active: t.active, createdAt: t.createdAt, templateData: t,
          });
        });
      }
    };

    treeData.forEach(root => buildNode(root, 0));
    return items;
  }, [treeData, expandedFolders, searchValue, filterValues, activeFilters, sortColumn, sortDirection]);

  const renderCell = (key: string, item: any): string => {
    if (item.type === 'folder') {
      if (key === 'name') return item.name || '';
      if (key === 'number') return item.code != null ? String(item.code).padStart(4, '0') : '—';
      return '';
    }
    const val = item[key];
    if (val === null || val === undefined) return '—';
    if (key === 'number') return val != null ? String(val).padStart(4, '0') : '—';
    if (key === 'active') return val ? 'Активен' : 'Неактивен';
    if (key === 'stationNames') {
      const arr = item.stationNames || [];
      if (arr.length === 0) return '';
      if (arr.length === 1) return arr[0];
      return `Станций: ${arr.length}`;
    }
    if (key === 'createdAt') {
      try { const d = new Date(val); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch { return String(val); }
    }
    return String(val);
  };

  const isGrayColumn = (key: string): boolean =>
    !['name', 'number', 'configurationName', 'modelName', 'stationNames', 'active', 'createdAt'].includes(key);

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteTargetUid(null);
    setShowDeleteConfirm(true);
  };

  const handleHistoryClick = () => {
    setShowHistory(prev => !prev);
    if (!showHistory) { setHistoryLoading(true); setHistoryEvents([]); setHistoryLoading(false); }
  };

  const rowContextMenuItems = useCallback((uid: string, name: string): ContextMenuItem[] => {
    const item = rowItems.find(r => r.uid === uid);
    if (!item) return [];

    if (item.type === 'folder') {
      return [
        { id: 'create-template', label: 'Создать шаблон', icon: PopupIcon2, onClick: () => handleCreateTemplate(uid, name) },
        { id: 'create-category', label: 'Создать подкатегорию', icon: Icon21, onClick: () => handleCreateGroupFromContext(uid, name) },
        { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { setSelectedIds(new Set([uid])); setOperationUid(uid); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
        { id: 'rename', label: 'Переименовать', icon: Icon23, onClick: () => { setRenameUid(uid); setRenameName(name); setRenameType('category'); setShowRenamePopup(true); } },
        { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { setSelectedIds(new Set([uid])); setOperationUid(uid); setTimeout(() => setShowCopyPopup(true), 50); } },
        { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { setSelectedIds(new Set([uid])); setDeleteTargetUid(uid); setTimeout(() => setShowDeleteConfirm(true), 50); } },
      ];
    }
    return [
      { id: 'open', label: 'Открыть', icon: ContextMenuOpenIcon16, onClick: () => { openTab(`/documents/schablon/${uid}`, `Шаблон - ${name}`, null); } },
      { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { setSelectedIds(new Set([uid])); setOperationUid(uid); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
      { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { setSelectedIds(new Set([uid])); setOperationUid(uid); setTimeout(() => setShowCopyPopup(true), 50); } },
      { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { setSelectedIds(new Set([uid])); setDeleteTargetUid(uid); setTimeout(() => setShowDeleteConfirm(true), 50); } },
    ];
  }, [rowItems, openTab]);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>
          {showHistory ? 'Каталог шаблонов (История изменений)' : 'Каталог шаблонов загрузки станции'}
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
          accountingIndex={-1}
          onSortSelect={(col) => {
            setSortColumn(prev => {
              if (prev === col) { setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
              setSortDirection('asc');
              return col;
            });
          }}
          onClearSort={() => setSortColumn(null)}
          activeFilters={activeFilters}
          filterValues={filterValues}
          placementSelections={{}}
          hasPlacementSelections={false}
          onFilterToggle={() => {}}
          onCheckFilterOption={(filterKey, optionUid) => {
            setFilterValues(prev => {
              const current = new Set(prev[filterKey] || []);
              if (current.has(optionUid)) current.delete(optionUid);
              else current.add(optionUid);
              if (current.size === 0) {
                const { [filterKey]: _, ...rest } = prev;
                setActiveFilters(prev2 => { const n = new Set(prev2); n.delete(filterKey); return n; });
                return rest;
              }
              setActiveFilters(prev2 => { const n = new Set(prev2); n.add(filterKey); return n; });
              return { ...prev, [filterKey]: current };
            });
          }}
          onClearFilters={() => { setActiveFilters(new Set()); setFilterValues({}); }}
          hierarchy={null}
          modelList={[]}
          configList={[]}
          selectedCount={selectedIds.size}
          onCreate={() => handleCreateTemplate(null, '')}
          onDelete={handleDeleteClick}
          onPrint={() => {}}
          onPrintPdf={() => {}}
          showHistory={showHistory}
          onHistory={handleHistoryClick}
          onConfiguration={() => setShowConfigurationPopup(true)}
          extraButtons={
            <button style={{ height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 15px', flexShrink: 0 }}
              onClick={handleCreateGroupFromToolbar}>
              <img src={Icon5} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 10 }}>Создать категорию</span>
            </button>
          }
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40, right: 15, bottom: 0 }}>
        <AnimatePresence initial={false}>
          {showHistory ? (
            <motion.div key="history"
              initial={{ x: 'calc(100% + 40px)', opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 'calc(100% + 40px)', opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <HistoryTable events={historyEvents} isLoading={historyLoading} />
            </motion.div>
          ) : (
            <motion.div key="data"
              initial={{ x: 'calc(-100% - 40px)', opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 'calc(-100% - 40px)', opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <NomenclatureDataTable
                columns={ALL_COLUMNS}
                visibleKeys={responseColumns.length > 0 ? responseColumns : ALL_COLUMNS.map(c => c.key)}
                data={rowItems}
                selectedIds={selectedIds}
                onCheckboxClick={handleCheckboxClick}
                onSelectAll={(e) => e.stopPropagation()}
                onRowClick={handleRowClick}
                onDoubleClick={handleDoubleClick}
                renderCell={renderCell}
                isGrayColumn={isGrayColumn}
                highlightText={searchValue.trim() || undefined}
                initialWidths={columnWidths}
                onWidthsChange={setColumnWidths}
                requiredColumns={requiredColumns}
                rowContextMenuItems={rowContextMenuItems}
                onResetToBase={() => {
                  setResponseColumns(ALL_COLUMNS.filter(c => requiredColumns.has(c.key)).map(c => c.key));
                  setColumnWidths({});
                }}
                getRowIcon={(item: any) => {
                  if (item.type === 'folder') return item.isExpanded ? Icon12 : Icon11;
                  return PopupIcon7;
                }}
                getRowFontWeight={(item: any) => item.type === 'folder' ? 700 : 400}
                getRowNameIndent={(item: any) => item.depth * 20}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Каталог шаблонов (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={new Set(responseColumns.length > 0 ? responseColumns : ALL_COLUMNS.map(c => c.key))}
        requiredColumns={requiredColumns}
        onSave={(cols) => {
          const finalCols = new Set(cols);
          requiredColumns.forEach(key => finalCols.add(key));
          setResponseColumns(ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key));
        }}
      />

      <TemplateCreateEditPopup
        isOpen={showCreateTemplatePopup}
        onClose={() => { setShowCreateTemplatePopup(false); resetCreateTemplateForm(); }}
        onConfirm={handleCreateTemplateSubmit}
        name={createTemplateName}
        onNameChange={setCreateTemplateName}
        categoryUid={createTemplateCategoryUid}
        categoryName={createTemplateCategoryName}
        onCategoryChange={(uid, name) => { setCreateTemplateCategoryUid(uid || null); setCreateTemplateCategoryName(name); }}
        onOpenCategoryFullList={() => setShowCategorySelect(true)}
        modelUid={createTemplateModelUid}
        modelName={createTemplateModelName}
        onModelChange={(uid, name) => { setCreateTemplateModelUid(uid); setCreateTemplateModelName(name); }}
        onOpenModelFullList={() => setShowModelSelect(true)}
        configUid={createTemplateConfigUid}
        configName={createTemplateConfigName}
        onConfigChange={(uid, name) => { setCreateTemplateConfigUid(uid); setCreateTemplateConfigName(name); }}
        onOpenConfigFullList={() => setShowConfigSelect(true)}
        isSubmitting={isCreatingTemplate}
        mode={createMode}
      />

      <CatalogSelectPopup isOpen={showCategorySelect} onClose={() => setShowCategorySelect(false)} onSelect={(id, name) => { setCreateTemplateCategoryUid(id); setCreateTemplateCategoryName(name); setShowCategorySelect(false); }} popupType="templateCategory" />
      <CatalogSelectPopup isOpen={showModelSelect} onClose={() => setShowModelSelect(false)} onSelect={(id, name) => { setCreateTemplateModelUid(id); setCreateTemplateModelName(name); setCreateTemplateConfigUid(''); setCreateTemplateConfigName(''); setShowModelSelect(false); }} popupType="stationModel" />
      <CatalogSelectPopup isOpen={showConfigSelect} onClose={() => setShowConfigSelect(false)} onSelect={(id, name) => { setCreateTemplateConfigUid(id); setCreateTemplateConfigName(name); setShowConfigSelect(false); }} popupType="stationConfiguration" filterParam={createTemplateModelUid || undefined} />

      <TemplateCreateGroupPopup
        isOpen={showCreateGroup}
        onClose={() => { setShowCreateGroup(false); setCreateGroupParentUid(null); setCreateGroupParentName(null); }}
        onSubmit={handleCreateGroup}
        isLoading={isCreatingGroup}
        initialParentUid={createGroupParentUid}
        initialParentName={createGroupParentName}
      />

      {showRenamePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Переименование {renameType === 'category' ? 'категории' : 'шаблона'}</h3>
            <input type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }} placeholder="Введите новое название" autoFocus
              style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowRenamePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleRenameSubmit} disabled={isRenaming || !renameName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: renameName.trim() && !isRenaming ? '#666EFE' : '#BCC8FF', cursor: renameName.trim() && !isRenaming ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isRenaming ? 'Сохранение...' : 'Переименовать'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные элементы?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Копирование</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Выберите куда скопировать</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setShowCopyPopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>В текущую категорию</button>
              <button onClick={handleCopyToOther} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>В другую категорию</button>
              <button onClick={() => setShowCopyPopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup isOpen={showCopySelectPopup} onClose={() => { setShowCopySelectPopup(false); setOperationUid(null); }} onSelect={(id) => handleCopySelectCategory(id)} popupType="templateCategory" />
      <CatalogSelectPopup isOpen={showMoveSelectPopup} onClose={() => { setShowMoveSelectPopup(false); setOperationUid(null); }} onSelect={(id) => handleMoveSelectCategory(id)} popupType="templateCategory" />
    </div>
  );
};

export default TemplatesPage;