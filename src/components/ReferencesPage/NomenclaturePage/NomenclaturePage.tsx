// NomenclaturePage.tsx — ПОЛНЫЙ ФАЙЛ (responseData.columns для visibleKeys)
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CreateGroupPopup from './CreateGroupPopup';
import CatalogSelectPopup from './CatalogSelectPopup';
import DataTable from '../../elements/DataTable';
import TableToolbar from '../../elements/TableToolbar';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import HistoryTable from '../../elements/HistoryTable';
import { useTabs } from '../../../context/TabContext';
import Icon4 from '../../../assets/References/Icon4.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon14 from '../../../assets/References/Icon14.svg';
import Icon15 from '../../../assets/References/Icon15.svg';
import Icon16 from '../../../assets/References/Icon16.svg';
import Icon17 from '../../../assets/References/Icon17.svg';
import Icon19 from '../../../assets/References/Icon19.svg';
import Icon20 from '../../../assets/References/Icon20.svg';
import Icon21 from '../../../assets/References/Icon21.svg';
import Icon22 from '../../../assets/References/Icon22.svg';
import Icon23 from '../../../assets/References/Icon23.svg';
import Icon24 from '../../../assets/References/Icon24.svg';
import Icon25 from '../../../assets/References/Icon25.svg';
import Popup1 from '../../../assets/References/popup1.svg';

interface MaterialItem {
  uid: string;
  name: string;
  article: string;
  code: number | null;
  typeMainName?: string;
  typePurposeName?: string;
  typeProductName?: string;
  barcode?: string;
  sku?: string;
  rating?: number;
  description?: string;
  usage?: boolean;
  wasteMaterial?: boolean;
  recycleMaterial?: boolean;
  manufacturerName?: string;
  countryName?: string;
  brandName?: string;
  modelName?: string;
  lastPrice?: number;
}

interface GroupTreeNode {
  uid: string;
  name: string;
  code: number | null;
  children: GroupTreeNode[];
  materials: MaterialItem[];
}

interface NomenclatureTreeResponse {
  tree: GroupTreeNode[];
  columns: string[];
  columnWidths?: Record<string, number>;
  requiredColumns?: string[];
  columnsJson?: string;
  filtersJson?: string;
  sortJson?: string;
  currentPathJson?: string;
}

type ContextMenuType = 'folder' | 'material';

interface ContextMenuState {
  x: number;
  y: number;
  uid: string;
  name: string;
  type: ContextMenuType;
}

interface ColumnItem { key: string; label: string; }

interface RowItem { 
  uid: string; 
  name: string; 
  type: 'parent' | 'folder' | 'material'; 
  code?: number | null;
  article?: string;
  typeMainName?: string;
  typePurposeName?: string;
  typeProductName?: string;
  barcode?: string;
  sku?: string;
  rating?: number;
  description?: string;
  usage?: boolean;
  wasteMaterial?: boolean;
  recycleMaterial?: boolean;
  manufacturerName?: string;
  countryName?: string;
  brandName?: string;
  modelName?: string;
  lastPrice?: number;
  folderData?: GroupTreeNode;
  materialData?: MaterialItem;
}

const REQUIRED_COLUMNS = new Set([
  'name', 'code', 'article', 'typeMainName', 'typePurposeName', 'typeProductName',
  'barcode', 'sku', 'rating'
]);

const ALL_COLUMNS: ColumnItem[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'code', label: 'Код' },
  { key: 'article', label: 'Артикул' },
  { key: 'typeMainName', label: 'Группа учета' },
  { key: 'typePurposeName', label: 'Группа номенклатуры' },
  { key: 'typeProductName', label: 'Вид номенклатуры' },
  { key: 'barcode', label: 'Штрихкод' },
  { key: 'sku', label: 'SKU' },
  { key: 'rating', label: 'Рейтинг' },
  { key: 'description', label: 'Описание' },
  { key: 'usage', label: 'Многократное использование' },
  { key: 'wasteMaterial', label: 'Сдача на лом' },
  { key: 'recycleMaterial', label: 'Сдача на переточку' },
  { key: 'manufacturerName', label: 'Производитель' },
  { key: 'countryName', label: 'Страна происхождения' },
  { key: 'brandName', label: 'Бренд' },
  { key: 'modelName', label: 'Модель' },
  { key: 'lastPrice', label: 'Последняя цена' },
];

interface SortField { key: string; label: string; }
const SORT_FIELDS: SortField[] = [
  { key: 'name', label: 'Наименование' },
  { key: 'code', label: 'Код' },
  { key: 'article', label: 'Артикул' },
  { key: 'typeMainName', label: 'Группа учета' },
  { key: 'typePurposeName', label: 'Группа номенклатуры' },
  { key: 'typeProductName', label: 'Вид номенклатуры' },
  { key: 'rating', label: 'Рейтинг' },
  { key: 'usage', label: 'Многократное использование' },
  { key: 'wasteMaterial', label: 'Сдача в лом' },
  { key: 'recycleMaterial', label: 'Сдача на переточку' },
  { key: 'manufacturerName', label: 'Производитель' },
  { key: 'countryName', label: 'Страна происхождения' },
];

interface FilterField { key: string; label: string; options?: { uid: string; name: string }[]; }
const FILTER_FIELDS: FilterField[] = [
  { key: 'typeMainName', label: 'Группа учета' },
  { key: 'typePurposeName', label: 'Группа номенклатуры' },
  { key: 'typeProductName', label: 'Вид номенклатуры' },
  { key: 'rating', label: 'Рейтинг', options: [
    { uid: '1', name: '1 звезда' },
    { uid: '2', name: '2 звезды' },
    { uid: '3', name: '3 звезды' },
    { uid: '4', name: '4 звезды' },
    { uid: '5', name: '5 звезд' },
  ]},
  { key: 'usage', label: 'Многократное использование', options: [
    { uid: 'true', name: 'Да' },
    { uid: 'false', name: 'Нет' },
  ]},
  { key: 'wasteMaterial', label: 'Сдача в лом', options: [
    { uid: 'true', name: 'Да' },
    { uid: 'false', name: 'Нет' },
  ]},
  { key: 'recycleMaterial', label: 'Сдача на переточку', options: [
    { uid: 'true', name: 'Да' },
    { uid: 'false', name: 'Нет' },
  ]},
  { key: 'manufacturerName', label: 'Производитель' },
  { key: 'countryName', label: 'Страна происхождения' },
  { key: 'brandName', label: 'Бренд' },
];

const USER_ID = 1;

const NomenclaturePage = () => {
  const navigate = useNavigate();
  const { openTab } = useTabs();
  const breadcrumbsRef = useRef<HTMLDivElement>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<GroupTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [showCopySelectPopup, setShowCopySelectPopup] = useState(false);
  const [showMoveSelectPopup, setShowMoveSelectPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [hoveredCrumb, setHoveredCrumb] = useState<number | null>(null);
  const [createGroupPreselectedParent, setCreateGroupPreselectedParent] = useState<{ uid: string; name: string } | null>(null);
  const [showRenamePopup, setShowRenamePopup] = useState(false);
  const [renameGroupUid, setRenameGroupUid] = useState<string | null>(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const contextMenuUidRef = useRef<string | null>(null);

  const [responseColumns, setResponseColumns] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | null>(null);
  const [filterOptions, setFilterOptions] = useState<Record<string, { uid: string; name: string }[]>>({});

  const MAX_BREADCRUMBS_WIDTH = 500;

  const fetchTreeWithSettings = useCallback(async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTreeWithSettings(USER_ID));
      const data = response.data as NomenclatureTreeResponse;
      setTreeData(data.tree);
      if (data.columns && data.columns.length > 0) {
        setResponseColumns(data.columns);
      }
      if (data.columnWidths && Object.keys(data.columnWidths).length > 0) {
        setColumnWidths(data.columnWidths);
      }
      if (data.requiredColumns && data.requiredColumns.length > 0) {
        setRequiredColumns(new Set(data.requiredColumns));
      }
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
        const path = JSON.parse(data.currentPathJson) as string[];
        setCurrentPath(path);
      }
    } catch (error) {
      console.error('Ошибка загрузки дерева с настройками:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreeWithSettings();
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [typeMaterials, typePurposes, typeProducts, manufacturers, countries, brands] = await Promise.all([
        AxiosService.get(ConstantInfo.restApiNomenclatureTypeMaterials),
        AxiosService.get(ConstantInfo.restApiNomenclatureTypePurposes),
        AxiosService.get(ConstantInfo.restApiNomenclatureTypeProducts),
        AxiosService.get(ConstantInfo.restApiNomenclatureManufacturers),
        AxiosService.get(ConstantInfo.restApiNomenclatureCountries),
        AxiosService.get(ConstantInfo.restApiNomenclatureBrands),
      ]);
      setFilterOptions({
        typeMainName: (typeMaterials.data || []).map((m: any) => ({ uid: m.typeName || m.name, name: m.typeName || m.name })),
        typePurposeName: (typePurposes.data || []).map((p: any) => ({ uid: p.typeName || p.name, name: p.typeName || p.name })),
        typeProductName: (typeProducts.data || []).map((p: any) => ({ uid: p.typeName || p.name, name: p.typeName || p.name })),
        manufacturerName: (manufacturers.data || []).map((m: any) => ({ uid: m.name, name: m.name })),
        countryName: (countries.data || []).map((c: any) => ({ uid: c.name, name: c.name })),
        brandName: (brands.data || []).map((b: any) => ({ uid: b.name, name: b.name })),
      });
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const saveCurrentPath = useCallback((path: string[]) => {
    const currentPathJson = JSON.stringify(path);
    AxiosService.patch(ConstantInfo.restApiNomenclatureCurrentPathSave(USER_ID), { currentPathJson }).catch(e => console.error(e));
  }, []);

  const saveFilters = useCallback((filters: Record<string, Set<string>>) => {
    const filtersJsonObj: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.size > 0) filtersJsonObj[key] = Array.from(values);
    });
    const filtersJson = JSON.stringify(filtersJsonObj);
    AxiosService.patch(ConstantInfo.restApiNomenclatureFiltersSettingsSave(USER_ID), { filtersJson }).catch(e => console.error(e));
  }, []);

  const saveSort = useCallback((column: string | null, direction: 'asc' | 'desc') => {
    let sortJson = '{}';
    if (column) sortJson = JSON.stringify({ column, direction });
    AxiosService.patch(ConstantInfo.restApiNomenclatureSortSettingsSave(USER_ID), { sortJson }).catch(e => console.error(e));
  }, []);

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
    AxiosService.patch(ConstantInfo.restApiNomenclatureColumnsSettingsSave(USER_ID), { columnsJson }).catch(e => console.error(e));
  }, [requiredColumns]);

  useEffect(() => {
    if (!isLoading) saveCurrentPath(currentPath);
  }, [currentPath, isLoading]);

  useEffect(() => {
    if (!isLoading) saveFilters(filterValues);
  }, [filterValues, isLoading]);

  useEffect(() => {
    if (!isLoading) saveSort(sortColumn, sortDirection);
  }, [sortColumn, sortDirection, isLoading]);

  useEffect(() => {
    if (!isLoading) saveColumns(responseColumns, columnWidths);
  }, [responseColumns, columnWidths, isLoading]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const rootNode = treeData.length > 0 ? treeData[0] : null;

  const getNodeByPath = (path: string[]): GroupTreeNode | null => {
    if (!rootNode) return null;
    if (path.length === 0) return rootNode;
    let level = rootNode.children || [];
    let result: GroupTreeNode | null = null;
    for (const uid of path) {
      const found = level.find(n => n.uid === uid);
      if (!found) return null;
      result = found;
      level = found.children || [];
    }
    return result;
  };

  const currentNode = getNodeByPath(currentPath);

  const collectChildrenUids = useCallback((node: GroupTreeNode): string[] => {
    const uids: string[] = [];
    if (node.children) {
      node.children.forEach(child => {
        uids.push(child.uid);
        uids.push(...collectChildrenUids(child));
      });
    }
    if (node.materials) {
      node.materials.forEach(m => uids.push(m.uid));
    }
    return uids;
  }, []);

  const collectAllUidsWithSelf = useCallback((node: GroupTreeNode): string[] => {
    return [node.uid, ...collectChildrenUids(node)];
  }, [collectChildrenUids]);

  const findNodeById = (nodes: GroupTreeNode[], uid: string): GroupTreeNode | null => {
    for (const node of nodes) {
      if (node.uid === uid) return node;
      if (node.children) {
        const found = findNodeById(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  const findMaterialById = (nodes: GroupTreeNode[], uid: string): MaterialItem | null => {
    for (const node of nodes) {
      if (node.materials) {
        const found = node.materials.find(m => m.uid === uid);
        if (found) return found;
      }
      if (node.children) {
        const found = findMaterialById(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  const addToSelected = (uid: string, type: ContextMenuType) => {
    if (type === 'folder') {
      const folder = findNodeById(treeData, uid);
      if (folder) {
        const allUids = collectAllUidsWithSelf(folder);
        setSelectedIds(prev => {
          const next = new Set(prev);
          allUids.forEach(id => next.add(id));
          return next;
        });
      }
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.add(uid);
        return next;
      });
    }
  };

  const getCurrentLevelUids = (): string[] => {
    if (!currentNode) return [];
    return collectChildrenUids(currentNode);
  };

  const isHeaderSelected = (): boolean => {
    const allUids = getCurrentLevelUids();
    if (allUids.length === 0) return false;
    return allUids.every(uid => selectedIds.has(uid));
  };

  const toggleSelectAll = () => {
    const allUids = getCurrentLevelUids();
    if (allUids.length === 0) return;
    const allSelected = allUids.every(uid => selectedIds.has(uid));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) allUids.forEach(uid => next.delete(uid));
      else allUids.forEach(uid => next.add(uid));
      return next;
    });
  };

  const toggleSelectNode = (node: GroupTreeNode) => {
    const allUids = collectAllUidsWithSelf(node);
    const allSelected = allUids.every(uid => selectedIds.has(uid));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allUids.forEach(uid => next.delete(uid));
      } else {
        allUids.forEach(uid => next.add(uid));
      }
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

  const handleContextMenu = (e: React.MouseEvent, uid: string, name: string, type: ContextMenuType) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, uid, name, type });
  };

  const isMultipleSelected = (uid: string): boolean => {
    return selectedIds.size > 1 && selectedIds.has(uid);
  };

  const handleContextCreateNomenclature = async () => {
    if (!contextMenu) return;
    const { uid, name } = contextMenu;
    setContextMenu(null);
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGenerate);
      const { uid: newUid, code } = response.data;
      sessionStorage.setItem('nomenclature_preselected_group', JSON.stringify({ groupUid: uid, groupName: name }));
      navigate(`/references/nomenclature/create/${newUid}/${code}`);
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
    }
  };

  const handleContextCreateGroup = () => {
    if (!contextMenu) return;
    const { uid, name } = contextMenu;
    setContextMenu(null);
    setCreateGroupPreselectedParent({ uid, name });
    setShowCreateGroup(true);
  };

  const handleContextRename = () => {
    if (!contextMenu) return;
    const { uid, name } = contextMenu;
    setContextMenu(null);
    setRenameGroupUid(uid);
    setRenameGroupName(name);
    setShowRenamePopup(true);
  };

  const handleContextOpen = () => {
    if (!contextMenu) return;
    const { uid } = contextMenu;
    const material = findMaterialById(treeData, uid);
    const code = material?.code || '';
    setContextMenu(null);
    navigate(`/references/nomenclature/edit/${uid}/${code}`);
  };

  const handleDoubleClick = (uid: string, name: string) => {
    const item = rowItems.find(r => r.uid === uid);
    if (item?.type === 'folder') {
      enterFolder(uid);
    } else if (item?.type === 'material') {
      const material = item.materialData;
      if (material) {
        openTab(`/references/nomenclature/edit/${uid}/${material.code || ''}`, `Номенклатура: ${material.name || ''}`, null);
      }
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameGroupUid || !renameGroupName.trim()) return;
    setIsRenaming(true);
    try {
      await AxiosService.patch(ConstantInfo.restApiNomenclatureRenameGroup(renameGroupUid), { name: renameGroupName.trim() });
      await fetchTreeWithSettings();
      setShowRenamePopup(false);
      setRenameGroupUid(null);
      setRenameGroupName('');
    } catch (error) {
      console.error('Ошибка переименования:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const getBreadcrumbs = (): GroupTreeNode[] => {
    if (!rootNode) return [];
    const crumbs: GroupTreeNode[] = [rootNode];
    let level = rootNode.children || [];
    for (const uid of currentPath) {
      const found = level.find(n => n.uid === uid);
      if (found) { crumbs.push(found); level = found.children || []; }
      else break;
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  useEffect(() => {
    const checkWidth = () => {
      const container = breadcrumbsRef.current;
      if (!container) return;
      setIsCollapsed(container.scrollWidth > MAX_BREADCRUMBS_WIDTH);
    };
    checkWidth();
    const ro = new ResizeObserver(checkWidth);
    if (breadcrumbsRef.current) ro.observe(breadcrumbsRef.current);
    return () => ro.disconnect();
  }, [breadcrumbs]);

  const enterFolder = (folderUid: string) => {
    setCurrentPath(prev => {
      const next = [...prev, folderUid];
      saveCurrentPath(next);
      return next;
    });
    setSelectedIds(new Set());
  };

  const goBack = () => {
    setCurrentPath(prev => {
      const next = prev.slice(0, -1);
      saveCurrentPath(next);
      return next;
    });
    setSelectedIds(new Set());
  };

  const goToBreadcrumb = (index: number) => {
    if (index === breadcrumbs.length - 1) return;
    setSelectedIds(new Set());
    if (index === 0) {
      setCurrentPath([]);
      saveCurrentPath([]);
    } else {
      const pathIndex = index - 1;
      if (pathIndex < currentPath.length) {
        const next = currentPath.slice(0, pathIndex);
        setCurrentPath(next);
        saveCurrentPath(next);
      }
    }
  };

  const getAllGroupsFlat = (nodes: GroupTreeNode[]): { uid: string; name: string }[] => {
    let result: { uid: string; name: string }[] = [];
    nodes.forEach(node => {
      result.push({ uid: node.uid, name: node.name });
      if (node.children) result = result.concat(getAllGroupsFlat(node.children));
    });
    return result;
  };

  const getCurrentFolderUid = (): string | null => {
    if (currentPath.length === 0) return rootNode?.uid || null;
    return currentNode?.uid || null;
  };

  const getCurrentFolderName = (): string => {
    if (currentPath.length === 0) return rootNode?.name || '';
    return currentNode?.name || '';
  };

  const handleCreateClick = async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGenerate);
      const { uid, code } = response.data;
      const folderUid = getCurrentFolderUid();
      const folderName = getCurrentFolderName();
      if (folderUid) {
        sessionStorage.setItem('nomenclature_preselected_group', JSON.stringify({ groupUid: folderUid, groupName: folderName }));
      }
      navigate(`/references/nomenclature/create/${uid}/${code}`);
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
    }
  };

  const handleCreateGroupFromButton = () => {
    if (currentPath.length === 0) {
      setCreateGroupPreselectedParent({ uid: rootNode?.uid || '', name: rootNode?.name || '' });
    } else {
      setCreateGroupPreselectedParent({ uid: currentNode?.uid || '', name: currentNode?.name || '' });
    }
    setShowCreateGroup(true);
  };

  const handleCreateGroup = async (groupName: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      await AxiosService.post('/api/nomenclature/groups', { name: groupName, parentUid: parentUid });
      await fetchTreeWithSettings();
      setShowCreateGroup(false);
      setCreateGroupPreselectedParent(null);
    } catch (error) {
      console.error('Ошибка создания группы:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    const isCurrentNodeDeleted = currentNode && groupUids.includes(currentNode.uid);
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteItems, { data: { groupUids, materialUids } });
      if (isCurrentNodeDeleted) goBack();
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getFilteredSelectedIds = (): { groupUids: string[], materialUids: string[] } => {
    const allGroupUids = getAllGroupUids(treeData);
    const selectedGroupUids: string[] = [];
    const selectedMaterialUids: string[] = [];
    selectedIds.forEach(uid => {
      if (allGroupUids.has(uid)) selectedGroupUids.push(uid);
      else selectedMaterialUids.push(uid);
    });
    const childUidsToExclude = new Set<string>();
    selectedGroupUids.forEach(groupUid => {
      const node = findNodeById(treeData, groupUid);
      if (node) collectChildrenUids(node).forEach(uid => childUidsToExclude.add(uid));
    });
    const groupUids = selectedGroupUids.filter(uid => !childUidsToExclude.has(uid));
    const materialUids = selectedMaterialUids.filter(uid => !childUidsToExclude.has(uid));
    return { groupUids, materialUids };
  };

  const handleCopyClick = () => {
    if (selectedIds.size === 0) return;
    setShowCopyPopup(true);
  };

  const handleCopyToCurrent = async () => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureCopyItems, { groupUids, materialUids, targetParentUid: getCurrentFolderUid() });
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowCopyPopup(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const handleCopyToOther = () => {
    setShowCopyPopup(false);
    setShowCopySelectPopup(true);
  };

  const handleCopySelectGroup = async (groupId: string) => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureCopyItems, { groupUids, materialUids, targetParentUid: groupId });
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowCopySelectPopup(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const handleMoveClick = () => {
    if (selectedIds.size === 0) return;
    setShowMoveSelectPopup(true);
  };

  const handleMoveSelectGroup = async (groupId: string) => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    try {
      await AxiosService.patch(ConstantInfo.restApiNomenclatureMoveItems, { groupUids, materialUids, targetParentUid: groupId });
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowMoveSelectPopup(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка перемещения:', error);
    }
  };

  const getAllGroupUids = (nodes: GroupTreeNode[]): Set<string> => {
    const uids = new Set<string>();
    nodes.forEach(node => {
      uids.add(node.uid);
      if (node.children) {
        const childUids = getAllGroupUids(node.children);
        childUids.forEach(uid => uids.add(uid));
      }
    });
    return uids;
  };

  const applyFilters = (material: MaterialItem): boolean => {
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      const searchableText = [
        material.name, material.article, String(material.code || ''),
        material.typeMainName, material.typePurposeName, material.typeProductName,
        material.barcode, material.sku, material.manufacturerName,
        material.countryName, material.brandName, material.modelName
      ].join(' ').toLowerCase();
      if (!searchableText.includes(q)) return false;
    }
    if (filterValues['typeMainName']?.size) {
      if (!material.typeMainName || !filterValues['typeMainName'].has(material.typeMainName)) return false;
    }
    if (filterValues['typePurposeName']?.size) {
      if (!material.typePurposeName || !filterValues['typePurposeName'].has(material.typePurposeName)) return false;
    }
    if (filterValues['typeProductName']?.size) {
      if (!material.typeProductName || !filterValues['typeProductName'].has(material.typeProductName)) return false;
    }
    if (filterValues['rating']?.size) {
      if (material.rating === undefined || !filterValues['rating'].has(String(material.rating))) return false;
    }
    if (filterValues['usage']?.size) {
      if (material.usage === undefined || !filterValues['usage'].has(String(material.usage))) return false;
    }
    if (filterValues['wasteMaterial']?.size) {
      if (material.wasteMaterial === undefined || !filterValues['wasteMaterial'].has(String(material.wasteMaterial))) return false;
    }
    if (filterValues['recycleMaterial']?.size) {
      if (material.recycleMaterial === undefined || !filterValues['recycleMaterial'].has(String(material.recycleMaterial))) return false;
    }
    if (filterValues['manufacturerName']?.size) {
      if (!material.manufacturerName || !filterValues['manufacturerName'].has(material.manufacturerName)) return false;
    }
    if (filterValues['countryName']?.size) {
      if (!material.countryName || !filterValues['countryName'].has(material.countryName)) return false;
    }
    if (filterValues['brandName']?.size) {
      if (!material.brandName || !filterValues['brandName'].has(material.brandName)) return false;
    }
    return true;
  };

  const sortMaterials = (materials: MaterialItem[]): MaterialItem[] => {
    if (!sortColumn) return materials;
    const getSortValue = (m: MaterialItem): string => {
      switch (sortColumn) {
        case 'name': return (m.name || '').toLowerCase();
        case 'code': return String(m.code || 0).padStart(10, '0');
        case 'article': return (m.article || '').toLowerCase();
        case 'typeMainName': return (m.typeMainName || '').toLowerCase();
        case 'typePurposeName': return (m.typePurposeName || '').toLowerCase();
        case 'typeProductName': return (m.typeProductName || '').toLowerCase();
        case 'rating': return String(m.rating || 0).padStart(3, '0');
        case 'usage': return m.usage ? '1' : '0';
        case 'wasteMaterial': return m.wasteMaterial ? '1' : '0';
        case 'recycleMaterial': return m.recycleMaterial ? '1' : '0';
        case 'manufacturerName': return (m.manufacturerName || '').toLowerCase();
        case 'countryName': return (m.countryName || '').toLowerCase();
        default: return '';
      }
    };
    return [...materials].sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);
      const result = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? result : -result;
    });
  };

  const rowItems = useMemo((): RowItem[] => {
    if (!currentNode) return [];
    const items: RowItem[] = [];
    
    if (currentPath.length > 0) {
      items.push({
        uid: currentNode.uid,
        name: currentNode.name,
        type: 'parent',
        code: currentNode.code,
        folderData: currentNode,
      });
    }
    
    (currentNode.children || []).forEach(folder => {
      items.push({
        uid: folder.uid,
        name: folder.name,
        type: 'folder',
        code: folder.code,
        folderData: folder,
      });
    });
    
    const filteredMaterials = (currentNode.materials || []).filter(applyFilters);
    const sortedMaterials = sortMaterials(filteredMaterials);
    sortedMaterials.forEach(material => {
      items.push({
        uid: material.uid,
        name: material.name || '',
        type: 'material',
        code: material.code,
        article: material.article,
        typeMainName: material.typeMainName,
        typePurposeName: material.typePurposeName,
        typeProductName: material.typeProductName,
        barcode: material.barcode,
        sku: material.sku,
        rating: material.rating,
        description: material.description,
        usage: material.usage,
        wasteMaterial: material.wasteMaterial,
        recycleMaterial: material.recycleMaterial,
        manufacturerName: material.manufacturerName,
        countryName: material.countryName,
        brandName: material.brandName,
        modelName: material.modelName,
        lastPrice: material.lastPrice,
        materialData: material,
      });
    });
    
    return items;
  }, [currentNode, currentPath, filterValues, searchValue, sortColumn, sortDirection]);

  const renderCell = (key: string, item: any): string => {
    const rowType = item.type;
    
    if (rowType === 'folder' || rowType === 'parent') {
      if (key === 'name') return item.name || '';
      if (key === 'code') return item.code !== null && item.code !== undefined ? String(item.code).padStart(5, '0') : '—';
      return '';
    }
    
    const val = item[key];
    if (val === null || val === undefined) return '—';
    if (key === 'usage' || key === 'wasteMaterial' || key === 'recycleMaterial') {
      return val ? 'Да' : 'Нет';
    }
    if (key === 'rating' && val === 0) return '—';
    if (key === 'code' && typeof val === 'number') return String(val).padStart(5, '0');
    return String(val);
  };

  const isGrayColumn = (key: string): boolean => {
    return !['name', 'code', 'article', 'typeMainName', 'typePurposeName', 'typeProductName', 'barcode', 'sku', 'rating'].includes(key);
  };

  const getRowType = useCallback((item: any): 'default' | 'folder' | 'parent' | 'material' => {
    return item.type || 'default';
  }, []);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <style>{`
        @keyframes crumbFadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes crumbTextIn { from { opacity: 0; max-width: 0; } to { opacity: 1; max-width: 200px; } }
        @keyframes tooltipIn { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .crumb-item { animation: crumbFadeIn 0.3s ease-out both; }
        .crumb-text-enter { animation: crumbTextIn 0.25s ease-out both; overflow: hidden; white-space: nowrap; }
        .crumb-tooltip { animation: tooltipIn 0.2s ease-out both; }
      `}</style>

      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>
          {showHistory ? 'Справочник: Номенклатура (История изменений)' : 'Справочник: Номенклатура'}
        </h1>
      </div>

      <div ref={breadcrumbsRef} style={{ position: 'absolute', top: 79, left: 60, right: 40, height: 17, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const showOnlyIcon = isCollapsed && !isLast;
          return (
            <React.Fragment key={crumb.uid}>
              {index > 0 && (
                <span className="crumb-item" style={{ display: 'flex', alignItems: 'center', animationDelay: `${index * 0.05}s`, flexShrink: 0 }}>
                  <span style={{ width: 15, flexShrink: 0 }} />
                  <img src={Icon15} alt="" style={{ width: 7, height: 11, flexShrink: 0 }} />
                  <span style={{ width: 15, flexShrink: 0 }} />
                </span>
              )}
              <div
                className="crumb-item"
                onMouseEnter={() => showOnlyIcon && setHoveredCrumb(index)}
                onMouseLeave={() => setHoveredCrumb(null)}
                style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: isLast ? 'default' : 'pointer', animationDelay: `${index * 0.05}s`, flexShrink: isLast ? 1 : (showOnlyIcon ? 0 : 1), minWidth: 0 }}
                onClick={() => !isLast && goToBreadcrumb(index)}
              >
                <img src={index === 0 ? Icon14 : Icon16} alt="" style={{ width: index === 0 ? 18 : 17, height: 15, flexShrink: 0 }} />
                {!showOnlyIcon && (
                  <>
                    <span style={{ width: 7, flexShrink: 0 }} />
                    <span className="crumb-text-enter" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(45, 64, 89, 0.67)', lineHeight: '17px', height: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isLast ? 'none' : 200 }}>{crumb.name}</span>
                  </>
                )}
                {showOnlyIcon && hoveredCrumb === index && (
                  <div className="crumb-tooltip" style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2D4059', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 10000, pointerEvents: 'none' }}>
                    {crumb.name}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
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
          accountingIndex={-1}
          onSortSelect={(col) => {
            setSortColumn(prev => {
              if (prev === col) {
                setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                return prev;
              }
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
          onCreate={handleCreateClick}
          onDelete={handleDeleteClick}
          onPrint={() => {}}
          onPrintPdf={() => {}}
          showHistory={showHistory}
          onHistory={() => setShowHistory(prev => !prev)}
          onConfiguration={() => setShowConfigurationPopup(true)}
          extraButtons={
            <button style={{ height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 15px', flexShrink: 0 }}
              onClick={handleCreateGroupFromButton}>
              <img src={Icon5} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 10 }}>Создать каталог</span>
            </button>
          }
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40, right: 15, bottom: 0 }}>
        {showHistory ? (
          <HistoryTable events={historyEvents} isLoading={historyLoading} />
        ) : (
          <DataTable
            columns={ALL_COLUMNS}
            visibleKeys={responseColumns}
            data={rowItems}
            selectedIds={selectedIds}
            onCheckboxClick={(uid, e) => { e.stopPropagation(); toggleSelectItem(uid); }}
            onSelectAll={(e) => { e.stopPropagation(); toggleSelectAll(); }}
            onRowClick={(uid, e) => { e.stopPropagation(); }}
            onDoubleClick={handleDoubleClick}
            renderCell={renderCell}
            isGrayColumn={isGrayColumn}
            highlightText={searchValue.trim() || undefined}
            initialWidths={columnWidths}
            onWidthsChange={setColumnWidths}
            requiredColumns={requiredColumns}
            getRowType={getRowType}
            rowIcons={{
              folder: Icon11,
              parent: Icon12,
              material: Popup1,
              back: Icon17,
            }}
            rowFontWeight={{
              folder: 700,
              parent: 700,
              material: 400,
              default: 400,
            }}
            onFolderClick={(uid) => enterFolder(uid)}
            onParentBack={() => goBack()}
            showHeaderCheckbox={true}
            totalRowsCount={rowItems.length}
            rowContextMenuItems={(uid, name) => {
              const item = rowItems.find(r => r.uid === uid);
              if (!item) return [];
              if (item.type === 'folder') {
                return [
                  { id: 'create-nomenclature', label: 'Создать номенклатуру', icon: Icon20, onClick: () => { const folder = findNodeById(treeData, uid); setContextMenu({ x: 0, y: 0, uid, name, type: 'folder' }); handleContextCreateNomenclature(); } },
                  { id: 'create-folder', label: 'Создать каталог', icon: Icon21, onClick: () => { setCreateGroupPreselectedParent({ uid: item.uid, name: item.name }); setShowCreateGroup(true); } },
                  { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
                  { id: 'rename', label: 'Переименовать', icon: Icon23, onClick: () => { setRenameGroupUid(uid); setRenameGroupName(name); setShowRenamePopup(true); } },
                  { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowCopyPopup(true), 50); } },
                  { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowDeleteConfirm(true), 50); } },
                ];
              }
              if (item.type === 'parent') {
                return [
                  { id: 'back', label: 'Назад', icon: Icon17, onClick: () => goBack() },
                  { id: 'rename', label: 'Переименовать', icon: Icon23, onClick: () => { setRenameGroupUid(uid); setRenameGroupName(name); setShowRenamePopup(true); } },
                ];
              }
              return [
                { id: 'open', label: 'Открыть', icon: Icon20, onClick: () => handleDoubleClick(uid, name) },
                { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
                { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowCopyPopup(true), 50); } },
                { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowDeleteConfirm(true), 50); } },
              ];
            }}
            onResetToBase={() => {
              setResponseColumns(ALL_COLUMNS.filter(c => requiredColumns.has(c.key)).map(c => c.key));
              setColumnWidths({});
            }}
          />
        )}
      </div>

      <CreateGroupPopup
        isOpen={showCreateGroup}
        currentParentName={createGroupPreselectedParent?.name || null}
        currentParentUid={createGroupPreselectedParent?.uid || null}
        groups={getAllGroupsFlat(treeData)}
        onClose={() => { setShowCreateGroup(false); setCreateGroupPreselectedParent(null); }}
        onSubmit={handleCreateGroup}
        isLoading={isCreatingGroup}
      />

      <ConfigurationPopup
        isOpen={showConfigurationPopup}
        onClose={() => setShowConfigurationPopup(false)}
        title="Справочник: Номенклатура (Настройки списка)"
        columns={ALL_COLUMNS}
        visibleColumns={new Set(responseColumns)}
        requiredColumns={requiredColumns}
        onSave={(cols) => {
          const finalCols = new Set(cols);
          requiredColumns.forEach(key => finalCols.add(key));
          setResponseColumns(ALL_COLUMNS.filter(c => finalCols.has(c.key)).map(c => c.key));
          setColumnWidths({});
        }}
      />

      {showRenamePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRenamePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Переименование каталога</h3>
            <input type="text" value={renameGroupName} onChange={(e) => setRenameGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); else if (e.key === 'Escape') setShowRenamePopup(false); }} placeholder="Введите новое название" autoFocus
              style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowRenamePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleRenameSubmit} disabled={isRenaming || !renameGroupName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: renameGroupName.trim() && !isRenaming ? '#666EFE' : '#BCC8FF', cursor: renameGroupName.trim() && !isRenaming ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isRenaming ? 'Сохранение...' : 'Переименовать'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные элементы? Это действие нельзя отменить.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCopyPopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Копирование</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Выберите куда скопировать выбранные элементы</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleCopyToCurrent} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>В текущую группу</button>
              <button onClick={handleCopyToOther} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>В другую группу</button>
              <button onClick={() => setShowCopyPopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      <CatalogSelectPopup isOpen={showCopySelectPopup} onClose={() => setShowCopySelectPopup(false)} onSelect={handleCopySelectGroup} popupType="catalog" />
      <CatalogSelectPopup isOpen={showMoveSelectPopup} onClose={() => setShowMoveSelectPopup(false)} onSelect={handleMoveSelectGroup} popupType="catalog" />
    </div>
  );
};

export default NomenclaturePage;