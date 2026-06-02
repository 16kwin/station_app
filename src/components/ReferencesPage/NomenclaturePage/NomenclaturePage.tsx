// NomenclaturePage.tsx — полный файл с группами учета/ном./вида в строках
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CreateGroupPopup from './CreateGroupPopup';
import CatalogSelectPopup from './CatalogSelectPopup';
import { useTabs } from '../../../context/TabContext';
import Icon1 from '../../../assets/References/Icon1.svg';
import Icon2 from '../../../assets/References/Icon2.svg';
import Icon3 from '../../../assets/References/Icon3.svg';
import Icon4 from '../../../assets/References/Icon4.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon6 from '../../../assets/References/Icon6.svg';
import Icon7 from '../../../assets/References/Icon7.svg';
import Icon8 from '../../../assets/References/Icon8.svg';
import Icon9 from '../../../assets/References/Icon9.svg';
import Icon10 from '../../../assets/References/Icon10.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon13 from '../../../assets/References/Icon13.svg';
import Icon14 from '../../../assets/References/Icon14.svg';
import Icon15 from '../../../assets/References/Icon15.svg';
import Icon16 from '../../../assets/References/Icon16.svg';
import Icon17 from '../../../assets/References/Icon17.svg';
import Icon18 from '../../../assets/References/Icon18.svg';
import Icon19 from '../../../assets/References/Icon19.svg';
import Icon20 from '../../../assets/References/Icon20.svg';
import Icon21 from '../../../assets/References/Icon21.svg';
import Icon22 from '../../../assets/References/Icon22.svg';
import Icon23 from '../../../assets/References/Icon23.svg';
import Icon24 from '../../../assets/References/Icon24.svg';
import Icon25 from '../../../assets/References/Icon25.svg';

interface MaterialItem {
  uid: string;
  name: string;
  article: string;
  code: number | null;
  typeMainName?: string;
  typePurposeName?: string;
  typeProductName?: string;
}

interface GroupTreeNode {
  uid: string;
  name: string;
  code: number | null;
  children: GroupTreeNode[];
  materials: MaterialItem[];
}

type ContextMenuType = 'folder' | 'material';

interface ContextMenuState {
  x: number;
  y: number;
  uid: string;
  name: string;
  type: ContextMenuType;
}

const NomenclaturePage = () => {
  const navigate = useNavigate();
  const { activeTabId } = useTabs();
  const tabIdRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const breadcrumbsRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
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
  const contextMenuUidRef = useRef<string | null>(null);

  const TABLE_WIDTH = 1720;
  const TABLE_HEIGHT = 638;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 10;

  const COL_CODE = 360;
  const COL_ARTICLE = 530;
  const COL_ACCOUNT_GROUP = 720;
  const COL_NOMENCLATURE_GROUP = 960;
  const COL_NOMENCLATURE_TYPE = 1200;

  const MAX_BREADCRUMBS_WIDTH = 500;

  useEffect(() => {
    tabIdRef.current = activeTabId;
  }, []);

  const refreshTree = async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      setTreeData(response.data);
    } catch (error) {
      console.error('Ошибка обновления дерева:', error);
    }
  };

  useEffect(() => {
    if (activeTabId && activeTabId === tabIdRef.current && treeData.length > 0) {
      refreshTree();
    }
  }, [activeTabId]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        setTreeData(response.data);
      } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTree();
  }, []);

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

  const handleContextMove = () => {
    if (!contextMenu) return;
    if (isMultipleSelected(contextMenu.uid)) {
      setContextMenu(null);
      setTimeout(() => setShowMoveSelectPopup(true), 50);
    } else {
      contextMenuUidRef.current = contextMenu.uid;
      addToSelected(contextMenu.uid, contextMenu.type);
      setContextMenu(null);
      setTimeout(() => setShowMoveSelectPopup(true), 50);
    }
  };

  const handleContextCopy = () => {
    if (!contextMenu) return;
    if (isMultipleSelected(contextMenu.uid)) {
      setContextMenu(null);
      setTimeout(() => setShowCopyPopup(true), 50);
    } else {
      contextMenuUidRef.current = contextMenu.uid;
      addToSelected(contextMenu.uid, contextMenu.type);
      setContextMenu(null);
      setTimeout(() => setShowCopyPopup(true), 50);
    }
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    if (isMultipleSelected(contextMenu.uid)) {
      setContextMenu(null);
      setTimeout(() => setShowDeleteConfirm(true), 50);
    } else {
      contextMenuUidRef.current = contextMenu.uid;
      addToSelected(contextMenu.uid, contextMenu.type);
      setContextMenu(null);
      setTimeout(() => setShowDeleteConfirm(true), 50);
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

  const handleContextOpen = () => {
    if (!contextMenu) return;
    const { uid } = contextMenu;
    const material = findMaterialById(treeData, uid);
    const code = material?.code || '';
    setContextMenu(null);
    const path = `/references/nomenclature/edit/${uid}/${code}`;
    navigate(path);
  };

  const handleRenameSubmit = async () => {
    if (!renameGroupUid || !renameGroupName.trim()) return;
    setIsRenaming(true);
    try {
      await AxiosService.patch(ConstantInfo.restApiNomenclatureRenameGroup(renameGroupUid), { name: renameGroupName.trim() });
      await refreshTree();
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
    if (breadcrumbsRef.current) {
      ro.observe(breadcrumbsRef.current);
    }
    
    return () => ro.disconnect();
  }, [breadcrumbs]);

  const enterFolder = (folderUid: string) => {
    setCurrentPath(prev => [...prev, folderUid]);
    setSelectedIds(new Set());
  };

  const goBack = () => {
    setCurrentPath(prev => prev.slice(0, -1));
    setSelectedIds(new Set());
  };

  const goToBreadcrumb = (index: number) => {
    if (index === breadcrumbs.length - 1) return;
    setSelectedIds(new Set());
    if (index === 0) setCurrentPath([]);
    else {
      const pathIndex = index - 1;
      if (pathIndex < currentPath.length) setCurrentPath(prev => prev.slice(0, pathIndex));
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
      setCreateGroupPreselectedParent({
        uid: rootNode?.uid || '',
        name: rootNode?.name || '',
      });
    } else {
      setCreateGroupPreselectedParent({
        uid: currentNode?.uid || '',
        name: currentNode?.name || '',
      });
    }
    setShowCreateGroup(true);
  };

  const handleCreateGroup = async (groupName: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      await AxiosService.post('/api/nomenclature/groups', { name: groupName, parentUid: parentUid });
      await refreshTree();
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
      await refreshTree();
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      contextMenuUidRef.current = null;
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getFilteredSelectedIds = (): { groupUids: string[], materialUids: string[] } => {
    const allGroupUids = getAllGroupUids(treeData);
    const groupUids: string[] = [];
    const materialUids: string[] = [];
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
    
    selectedGroupUids.forEach(uid => { if (!childUidsToExclude.has(uid)) groupUids.push(uid); });
    selectedMaterialUids.forEach(uid => { if (!childUidsToExclude.has(uid)) materialUids.push(uid); });
    
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
      await refreshTree();
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

  const handleCopySelectGroup = async (groupId: string, _groupName: string) => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureCopyItems, { groupUids, materialUids, targetParentUid: groupId });
      await refreshTree();
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

  const handleMoveSelectGroup = async (groupId: string, _groupName: string) => {
    const { groupUids, materialUids } = getFilteredSelectedIds();
    try {
      await AxiosService.patch(ConstantInfo.restApiNomenclatureMoveItems, { groupUids, materialUids, targetParentUid: groupId });
      await refreshTree();
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
      if (node.children) { const childUids = getAllGroupUids(node.children); childUids.forEach(uid => uids.add(uid)); }
    });
    return uids;
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [currentPath, treeData]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(container);
    return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const mediumButtonStyle: React.CSSProperties = { height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 };

  const EmptySquare = ({ isSelected = false, onClick, isHeader = false }: { isSelected?: boolean; onClick?: (e: React.MouseEvent) => void; isHeader?: boolean }) => (
    <div onClick={(e) => { e.stopPropagation(); onClick?.(e); }} style={{ width: 18, height: 18, borderRadius: 2, border: isSelected ? 'none' : `2px solid ${isHeader ? '#FFFFFF' : '#2D4059'}`, opacity: isHeader && !isSelected ? 1 : isSelected ? 1 : 0.5, flexShrink: 0, boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isSelected && <img src={Icon19} alt="" style={{ width: 18, height: 18 }} />}
    </div>
  );

  const rowBoxShadow = 'inset 0px -0.7px 0px 0px #666EFE, inset 2px 0px 0px 0px #666EFE, inset -2px 0px 0px 0px #666EFE';
  const contextMenuButtonStyle: React.CSSProperties = { height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' };

  const cellTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
    position: 'absolute',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };

  const renderCurrentLevel = () => {
    if (!currentNode) return null;
    const items: React.ReactNode[] = [];
    const depth = currentPath.length;
    const shift = depth > 0 ? 20 : 0;

    if (depth > 0) {
      const parentNode = currentNode;
      items.push(
        <div key={parentNode.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', userSelect: 'none', boxSizing: 'border-box', position: 'relative', boxShadow: rowBoxShadow }} onContextMenu={(e) => handleContextMenu(e, parentNode.uid, parentNode.name, 'folder')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 18, height: 18, flexShrink: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 19 }}>
            <img src={Icon12} alt="" style={{ width: 19, height: 16, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 10, maxWidth: 310, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parentNode.name}</span>
            <button onClick={(e) => { e.stopPropagation(); goBack(); }} style={{ marginLeft: 18, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}><img src={Icon17} alt="Назад" style={{ width: 18, height: 18 }} /></button>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_CODE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{parentNode.code !== null && parentNode.code !== undefined ? String(parentNode.code).padStart(5, '0') : '—'}</span>
        </div>
      );
    }

    const folders = currentNode.children || [];
    folders.forEach(folder => {
      const isSelected = selectedIds.has(folder.uid);
      items.push(
        <div key={folder.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: isSelected ? '#EDF6FF' : '#FFFFFF', cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box', position: 'relative', boxShadow: rowBoxShadow }} onContextMenu={(e) => handleContextMenu(e, folder.uid, folder.name, 'folder')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}><EmptySquare isSelected={isSelected} onClick={() => toggleSelectNode(folder)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: shift + 19 }} onClick={() => enterFolder(folder.uid)}>
            <img src={Icon11} alt="" style={{ width: 18, height: 16, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 10, maxWidth: 350 - shift, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_CODE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{folder.code !== null && folder.code !== undefined ? String(folder.code).padStart(5, '0') : '—'}</span>
        </div>
      );
    });

    const materials = currentNode.materials || [];
    materials.forEach(material => {
      const isSelected = selectedIds.has(material.uid);
      items.push(
        <div key={material.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: isSelected ? '#EDF6FF' : '#FFFFFF', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', boxShadow: rowBoxShadow }} onContextMenu={(e) => handleContextMenu(e, material.uid, material.name || '', 'material')}>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}><EmptySquare isSelected={isSelected} onClick={() => toggleSelectItem(material.uid)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: shift + 19 }}>
            <img src={Icon13} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 10, maxWidth: 310 - shift, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{material.name || '—'}</span>
          </div>
          <span style={{ ...cellTextStyle, left: COL_CODE, maxWidth: COL_ARTICLE - COL_CODE - 20 }}>{material.code || '—'}</span>
          <span style={{ ...cellTextStyle, left: COL_ARTICLE, maxWidth: COL_ACCOUNT_GROUP - COL_ARTICLE - 20 }}>{material.article || '—'}</span>
          <span style={{ ...cellTextStyle, left: COL_ACCOUNT_GROUP, maxWidth: COL_NOMENCLATURE_GROUP - COL_ACCOUNT_GROUP - 20 }}>{material.typeMainName || '—'}</span>
          <span style={{ ...cellTextStyle, left: COL_NOMENCLATURE_GROUP, maxWidth: COL_NOMENCLATURE_TYPE - COL_NOMENCLATURE_GROUP - 20 }}>{material.typePurposeName || '—'}</span>
          <span style={{ ...cellTextStyle, left: COL_NOMENCLATURE_TYPE, maxWidth: TABLE_WIDTH - COL_NOMENCLATURE_TYPE - 60 }}>{material.typeProductName || '—'}</span>
        </div>
      );
    });

    return items;
  };

  const totalItems = (currentPath.length > 0 ? 1 : 0) + (currentNode?.children?.length || 0) + (currentNode?.materials?.length || 0);
  const emptyRows = Math.max(0, VISIBLE_ROWS - totalItems);

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
        @keyframes crumbFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes crumbTextIn {
          from { opacity: 0; max-width: 0; }
          to { opacity: 1; max-width: 200px; }
        }
        @keyframes crumbTextOut {
          from { opacity: 1; max-width: 200px; }
          to { opacity: 0; max-width: 0; }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .crumb-item {
          animation: crumbFadeIn 0.3s ease-out both;
        }
        .crumb-text-enter {
          animation: crumbTextIn 0.25s ease-out both;
          overflow: hidden;
          white-space: nowrap;
        }
        .crumb-text-leave {
          animation: crumbTextOut 0.25s ease-out both;
          overflow: hidden;
          white-space: nowrap;
        }
        .crumb-tooltip {
          animation: tooltipIn 0.2s ease-out both;
        }
      `}</style>

      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>Справочник: Номенклатура</h1>
      </div>

      <div 
        ref={breadcrumbsRef}
        style={{ position: 'absolute', top: 79, left: 60, right: 40, height: 17, display: 'flex', alignItems: 'center', overflow: 'hidden' }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const showOnlyIcon = isCollapsed && !isLast;
          const showText = !showOnlyIcon;

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
                {showText ? (
                  <>
                    <span style={{ width: 7, flexShrink: 0 }} />
                    <span className="crumb-text-enter" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(45, 64, 89, 0.67)', lineHeight: '17px', height: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isLast ? 'none' : 200 }}>{crumb.name}</span>
                  </>
                ) : null}
                {showOnlyIcon && hoveredCrumb === index && (
                  <div className="crumb-tooltip" style={{
                    position: 'absolute',
                    top: 22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#2D4059',
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: 400,
                    padding: '4px 8px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    zIndex: 10000,
                    pointerEvents: 'none'
                  }}>
                    {crumb.name}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon2} alt="" style={{ width: 20, height: 14 }} /></button>
          <button style={smallButtonStyle}><img src={Icon3} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ position: 'absolute', left: 586, display: 'flex', gap: 15 }}>
          <button style={{ ...mediumButtonStyle, width: 124 }} onClick={handleCreateClick}><img src={Icon4} alt="" style={{ width: 16, height: 16, marginLeft: 12 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать</span></button>
          <button style={{ ...mediumButtonStyle, width: 186 }} onClick={handleCreateGroupFromButton}><img src={Icon5} alt="" style={{ width: 20, height: 20, marginLeft: 15 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать каталог</span></button>
          <button style={smallButtonStyle} onClick={handleMoveClick}><img src={Icon18} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle} onClick={handleCopyClick}><img src={Icon6} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle} onClick={handleDeleteClick}><img src={Icon7} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon10} alt="" style={{ width: 18, height: 16 }} /></button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', outline: '2px solid #666EFE', outlineOffset: -1 }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 20, paddingRight: 40, boxSizing: 'border-box', boxShadow: 'inset 0px -0.7px 0px 0px #666EFE' }}>
            <EmptySquare isSelected={isHeaderSelected()} onClick={toggleSelectAll} isHeader />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 47 }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_CODE }}>КОД</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ACCOUNT_GROUP }}>ГРУППА УЧЕТА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NOMENCLATURE_GROUP }}>ГРУППА НОМ.</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NOMENCLATURE_TYPE }}>ВИД НОМ.</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {renderCurrentLevel()}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', paddingLeft: 20, boxShadow: rowBoxShadow }}><EmptySquare /></div>
              ))}
            </div>
          </div>
        </div>
        {hasVerticalScroll && (<div style={{ position: 'absolute', right: -25, top: HEADER_HEIGHT, height: TABLE_HEIGHT - HEADER_HEIGHT, width: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>)}
        {hasHorizontalScroll && (<div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} /></div>)}
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

      {contextMenu && (
        <div style={{ 
          position: 'fixed', 
          top: contextMenu.y, 
          left: contextMenu.x, 
          width: contextMenu.type === 'folder' && !isMultipleSelected(contextMenu.uid) ? 244 : 174, 
          backgroundColor: '#FFFFFF', 
          borderRadius: 6, 
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', 
          zIndex: 10001, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '8px 0' 
        }} onClick={e => e.stopPropagation()}>
          {isMultipleSelected(contextMenu.uid) ? (
            <>
              <button style={contextMenuButtonStyle} onClick={handleContextMove}>
                <img src={Icon22} alt="" style={{ width: 16, height: 14, marginRight: 17 }} />
                Переместить
              </button>
              <button style={contextMenuButtonStyle} onClick={handleContextCopy}>
                <img src={Icon24} alt="" style={{ width: 16, height: 16, marginRight: 17 }} />
                Скопировать
              </button>
              <button style={contextMenuButtonStyle} onClick={handleContextDelete}>
                <img src={Icon25} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Удалить
              </button>
            </>
          ) : contextMenu.type === 'folder' ? (
            <>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextCreateNomenclature}>
                <img src={Icon20} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Создать номенклатуру
              </button>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextCreateGroup}>
                <img src={Icon21} alt="" style={{ width: 16, height: 14, marginRight: 17 }} />
                Создать каталог
              </button>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextMove}>
                <img src={Icon22} alt="" style={{ width: 16, height: 14, marginRight: 17 }} />
                Переместить
              </button>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextRename}>
                <img src={Icon23} alt="" style={{ width: 16, height: 15, marginRight: 17 }} />
                Переименовать
              </button>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextCopy}>
                <img src={Icon24} alt="" style={{ width: 16, height: 16, marginRight: 17 }} />
                Скопировать
              </button>
              <button style={{ ...contextMenuButtonStyle, width: 244 }} onClick={handleContextDelete}>
                <img src={Icon25} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Удалить
              </button>
            </>
          ) : (
            <>
              <button style={contextMenuButtonStyle} onClick={handleContextOpen}>
                <img src={Icon20} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Открыть
              </button>
              <button style={contextMenuButtonStyle} onClick={handleContextMove}>
                <img src={Icon22} alt="" style={{ width: 16, height: 14, marginRight: 17 }} />
                Переместить
              </button>
              <button style={contextMenuButtonStyle} onClick={handleContextCopy}>
                <img src={Icon24} alt="" style={{ width: 16, height: 16, marginRight: 17 }} />
                Скопировать
              </button>
              <button style={contextMenuButtonStyle} onClick={handleContextDelete}>
                <img src={Icon25} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
                Удалить
              </button>
            </>
          )}
        </div>
      )}

      {showRenamePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRenamePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Переименование каталога</h3>
            <input
              type="text"
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); else if (e.key === 'Escape') setShowRenamePopup(false); }}
              placeholder="Введите новое название"
              autoFocus
              style={{
                width: '100%', height: 44, borderRadius: 10,
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif',
                fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box',
              }}
            />
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