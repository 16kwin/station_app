// NomenclaturePage.tsx — ПОЛНЫЙ ФАЙЛ (с обработчиком клавиш и barcodeHighlightText)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CreateGroupPopup from './CreateGroupPopup';
import CatalogSelectPopup from './CatalogSelectPopup';
import NomenclatureDataTable from '../../elements/NomenclatureDataTable';
import TableToolbar from '../../elements/TableToolbar';
import type { TableToolbarRef } from '../../elements/TableToolbar';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import HistoryTable from '../../elements/HistoryTable';
import { useTabs } from '../../../context/TabContext';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
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

interface ColumnItem { key: string; label: string; }

interface RowItem { 
  uid: string; 
  name: string; 
  type: 'folder' | 'material'; 
  depth: number;
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
  isExpanded?: boolean;
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
  const tableToolbarRef = useRef<TableToolbarRef>(null);
  const [treeData, setTreeData] = useState<GroupTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [showCopySelectPopup, setShowCopySelectPopup] = useState(false);
  const [showMoveSelectPopup, setShowMoveSelectPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string; name: string; type: 'folder' | 'material' } | null>(null);
  const [createGroupPreselectedParent, setCreateGroupPreselectedParent] = useState<{ uid: string; name: string } | null>(null);
  const [showRenamePopup, setShowRenamePopup] = useState(false);
  const [renameGroupUid, setRenameGroupUid] = useState<string | null>(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const contextMenuUidRef = useRef<string | null>(null);

  const [responseColumns, setResponseColumns] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [requiredColumns, setRequiredColumns] = useState<Set<string>>(REQUIRED_COLUMNS);
  const [searchValue, setSearchValue] = useState('');
  const [barcodeSearchValue, setBarcodeSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({});
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<'search' | 'sort' | 'filter' | 'barcodeSearch' | null>(null);
  const [filterOptions, setFilterOptions] = useState<Record<string, { uid: string; name: string }[]>>({});

  // Обработчик клавиш — автооткрытие поиска по штрихкоду
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4' || e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || e.key === 'F8' || e.key === 'F9' || e.key === 'F10' || e.key === 'F11' || e.key === 'F12') return;
      
      if (e.key.length === 1) {
        e.preventDefault();
        
        if (expanded === 'barcodeSearch') {
          setBarcodeSearchValue(prev => prev + e.key);
        } else {
          setExpanded('barcodeSearch');
          setBarcodeSearchValue(e.key);
        }
        
        setTimeout(() => {
          tableToolbarRef.current?.focusBarcodeSearch();
        }, 50);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

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
        try {
          const path = JSON.parse(data.currentPathJson) as string[];
          if (Array.isArray(path) && path.length > 0) {
            setExpandedFolders(new Set(path));
          }
        } catch (e) { /* игнорируем */ }
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

  const saveExpandedFolders = useCallback((folders: Set<string>) => {
    const currentPathJson = JSON.stringify(Array.from(folders));
    AxiosService.patch(ConstantInfo.restApiNomenclatureCurrentPathSave(USER_ID), { currentPathJson }).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveExpandedFolders(expandedFolders);
    }
  }, [expandedFolders, isLoading]);

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

  const collectAllUids = useCallback((node: GroupTreeNode): string[] => {
    const uids: string[] = [node.uid];
    if (node.children) {
      node.children.forEach(child => {
        uids.push(...collectAllUids(child));
      });
    }
    if (node.materials) {
      node.materials.forEach(m => uids.push(m.uid));
    }
    return uids;
  }, []);

  const addToSelected = (uid: string, type: 'folder' | 'material') => {
    if (type === 'folder') {
      const folder = findNodeById(treeData, uid);
      if (folder) {
        const allUids = collectAllUids(folder);
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

  const toggleSelectItem = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleFolder = (folderUid: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderUid)) next.delete(folderUid);
      else next.add(folderUid);
      return next;
    });
  };

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = rowItems.find(r => r.uid === uid);
    if (item?.type === 'folder') {
      const folder = findNodeById(treeData, uid);
      if (folder) {
        const allUids = collectAllUids(folder);
        setSelectedIds(prev => {
          const next = new Set(prev);
          const allSelected = allUids.every(id => next.has(id));
          if (allSelected) {
            allUids.forEach(id => next.delete(id));
          } else {
            allUids.forEach(id => next.add(id));
          }
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
    if (item?.type === 'folder') {
      toggleFolder(uid);
    }
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

  const handleDoubleClick = (uid: string, name: string, type: string) => {
    if (type === 'material') {
      const material = findMaterialById(treeData, uid);
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

  const getAllGroupsFlat = (nodes: GroupTreeNode[]): { uid: string; name: string }[] => {
    let result: { uid: string; name: string }[] = [];
    nodes.forEach(node => {
      result.push({ uid: node.uid, name: node.name });
      if (node.children) result = result.concat(getAllGroupsFlat(node.children));
    });
    return result;
  };

  const handleCreateClick = async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGenerate);
      const { uid, code } = response.data;
      navigate(`/references/nomenclature/create/${uid}/${code}`);
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
    }
  };

  const handleCreateGroupFromButton = () => {
    setCreateGroupPreselectedParent(null);
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
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteItems, { data: { groupUids, materialUids } });
      await fetchTreeWithSettings();
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getFilteredSelectedIds = (): { groupUids: string[], materialUids: string[] } => {
    const allGroupUids = new Set<string>();
    const collectGroups = (nodes: GroupTreeNode[]) => {
      nodes.forEach(node => {
        allGroupUids.add(node.uid);
        if (node.children) collectGroups(node.children);
      });
    };
    collectGroups(treeData);
    
    const selectedGroupUids: string[] = [];
    const selectedMaterialUids: string[] = [];
    selectedIds.forEach(uid => {
      if (allGroupUids.has(uid)) selectedGroupUids.push(uid);
      else selectedMaterialUids.push(uid);
    });
    
    const childUidsToExclude = new Set<string>();
    selectedGroupUids.forEach(groupUid => {
      const node = findNodeById(treeData, groupUid);
      if (node) {
        collectAllUids(node).forEach(uid => childUidsToExclude.add(uid));
        childUidsToExclude.delete(groupUid);
      }
    });
    
    const groupUids = selectedGroupUids.filter(uid => !childUidsToExclude.has(uid));
    const materialUids = selectedMaterialUids.filter(uid => !childUidsToExclude.has(uid));
    return { groupUids, materialUids };
  };

  const handleCopyClick = () => {
    if (selectedIds.size === 0) return;
    setShowCopyPopup(true);
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

  const applyFiltersToMaterial = (material: MaterialItem): boolean => {
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
    if (barcodeSearchValue.trim()) {
      const q = barcodeSearchValue.toLowerCase();
      const barcodeText = (material.barcode || '').toLowerCase();
      const skuText = (material.sku || '').toLowerCase();
      if (!barcodeText.includes(q) && !skuText.includes(q)) return false;
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

  const hasActiveSearchOrFilter = searchValue.trim() !== '' || barcodeSearchValue.trim() !== '' || activeFilters.size > 0;

  const rowItems = useMemo((): RowItem[] => {
    const items: RowItem[] = [];
    
    const rootNode = treeData.length > 0 ? treeData[0] : null;
    
    if (!rootNode) return items;
    
    const buildRows = (nodes: GroupTreeNode[], depth: number) => {
      nodes.forEach(folder => {
        const folderMatchesSearch = searchValue.trim() !== '' && folder.name.toLowerCase().includes(searchValue.toLowerCase());
        
        const filteredMaterials = (folder.materials || []).filter(applyFiltersToMaterial);
        const sortedMaterials = sortMaterials(filteredMaterials);
        
        const hasMatchingChildren = (folder.children || []).some(child => {
          const childMatchesSearch = searchValue.trim() !== '' && child.name.toLowerCase().includes(searchValue.toLowerCase());
          const childMaterials = (child.materials || []).filter(applyFiltersToMaterial);
          return childMatchesSearch || childMaterials.length > 0 || (child.children || []).length > 0;
        });
        
        const shouldShowFolder = !hasActiveSearchOrFilter || folderMatchesSearch || sortedMaterials.length > 0 || hasMatchingChildren;
        
        if (!shouldShowFolder) return;
        
        const isExpanded = hasActiveSearchOrFilter ? true : expandedFolders.has(folder.uid);
        
        items.push({
          uid: folder.uid,
          name: folder.name,
          type: 'folder',
          depth,
          code: folder.code,
          folderData: folder,
          isExpanded,
        });
        
        if (isExpanded) {
          if (hasMatchingChildren) {
            buildRows(folder.children || [], depth + 1);
          }
          sortedMaterials.forEach(material => {
            items.push({
              uid: material.uid,
              name: material.name || '',
              type: 'material',
              depth: depth + 1,
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
        }
      });
    };
    
    const rootFilteredMaterials = (rootNode.materials || []).filter(applyFiltersToMaterial);
    const rootSortedMaterials = sortMaterials(rootFilteredMaterials);
    
    rootSortedMaterials.forEach(material => {
      items.push({
        uid: material.uid,
        name: material.name || '',
        type: 'material',
        depth: 0,
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
    
    buildRows(rootNode.children || [], 0);
    
    return items;
  }, [treeData, expandedFolders, searchValue, barcodeSearchValue, filterValues, activeFilters, sortColumn, sortDirection, hasActiveSearchOrFilter]);

  const renderCell = (key: string, item: any): string => {
    const rowType = item.type;
    
    if (rowType === 'folder') {
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
          {showHistory ? 'Справочник: Номенклатура (История изменений)' : 'Справочник: Номенклатура'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, zIndex: 10 }}>
        <TableToolbar
          ref={tableToolbarRef}
          sortFields={SORT_FIELDS}
          filterFields={FILTER_FIELDS}
          placementLevels={[]}
          accountingTypes={[]}
          accountingColumnKeys={[]}
          filterOptions={filterOptions}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          barcodeSearchValue={barcodeSearchValue}
          onBarcodeSearchChange={setBarcodeSearchValue}
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
          onHistory={() => {
            setShowHistory(prev => {
              const next = !prev;
              if (next) {
                setHistoryLoading(true);
                const allEvents: any[] = [];
                const collectEvents = async (nodes: GroupTreeNode[]) => {
                  for (const node of nodes) {
                    if (node.materials) {
                      for (const mat of node.materials) {
                        try {
                          const r = await AxiosService.get(ConstantInfo.restApiNomenclatureEvents(mat.uid));
                          allEvents.push(...(r.data || []).map((e: any) => ({
                            uid: e.uid,
                            createdAt: e.createdAt,
                            author: e.author,
                            eventDescription: e.eventDescription,
                          })));
                        } catch (e) { /* пропускаем */ }
                      }
                    }
                    if (node.children) await collectEvents(node.children);
                  }
                };
                collectEvents(treeData).then(() => {
                  allEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  setHistoryEvents(allEvents);
                  setHistoryLoading(false);
                });
              }
              return next;
            });
          }}
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
          <NomenclatureDataTable
            columns={ALL_COLUMNS}
            visibleKeys={responseColumns}
            data={rowItems}
            selectedIds={selectedIds}
            onCheckboxClick={handleCheckboxClick}
            onSelectAll={(e) => { e.stopPropagation(); }}
            onRowClick={handleRowClick}
            onDoubleClick={(uid, name) => {
              const item = rowItems.find(r => r.uid === uid);
              if (item) handleDoubleClick(uid, name, item.type);
            }}
            renderCell={renderCell}
            isGrayColumn={isGrayColumn}
            highlightText={searchValue.trim() || undefined}
            barcodeHighlightText={barcodeSearchValue.trim() || undefined}
            initialWidths={columnWidths}
            onWidthsChange={setColumnWidths}
            requiredColumns={requiredColumns}
            rowContextMenuItems={(uid, name) => {
              const item = rowItems.find(r => r.uid === uid);
              if (!item) return [];
              if (item.type === 'folder') {
                return [
                  { id: 'create-nomenclature', label: 'Создать номенклатуру', icon: Icon20, onClick: () => { setContextMenu({ x: 0, y: 0, uid, name, type: 'folder' }); handleContextCreateNomenclature(); } },
                  { id: 'create-folder', label: 'Создать каталог', icon: Icon21, onClick: () => { setCreateGroupPreselectedParent({ uid: item.uid, name: item.name }); setShowCreateGroup(true); } },
                  { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
                  { id: 'rename', label: 'Переименовать', icon: Icon23, onClick: () => { setRenameGroupUid(uid); setRenameGroupName(name); setShowRenamePopup(true); } },
                  { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowCopyPopup(true), 50); } },
                  { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'folder'); setTimeout(() => setShowDeleteConfirm(true), 50); } },
                ];
              }
              return [
                { id: 'open', label: 'Открыть', icon: Icon20, onClick: () => { const material = findMaterialById(treeData, uid); if (material) handleDoubleClick(uid, name, 'material'); } },
                { id: 'move', label: 'Переместить', icon: Icon22, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowMoveSelectPopup(true), 50); } },
                { id: 'copy', label: 'Скопировать', icon: Icon24, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowCopyPopup(true), 50); } },
                { id: 'delete', label: 'Удалить', icon: Icon25, onClick: () => { contextMenuUidRef.current = uid; addToSelected(uid, 'material'); setTimeout(() => setShowDeleteConfirm(true), 50); } },
              ];
            }}
            onResetToBase={() => {
              setResponseColumns(ALL_COLUMNS.filter(c => requiredColumns.has(c.key)).map(c => c.key));
              setColumnWidths({});
            }}
            getRowIcon={(item: any) => {
              if (item.type === 'folder') {
                return item.isExpanded ? Icon12 : Icon11;
              }
              return Popup1;
            }}
            getRowFontWeight={(item: any) => {
              if (item.type === 'folder') return 700;
              return 400;
            }}
            getRowNameIndent={(item: any) => {
              return item.depth * 20;
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