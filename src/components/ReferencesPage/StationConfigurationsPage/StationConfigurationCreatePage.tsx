// StationConfigurationCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (заголовок использует initialState.name)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import HistoryTable from '../../elements/HistoryTable';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import StructureIcon18Black from '../../../assets/Icons/StructureIcons/StructureIcon18Black.svg';
import UnificationIcon12White from '../../../assets/Icons/UnificationIcons/UnificationIcon12White.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import ModelIcon16Gray from '../../../assets/Icons/ModelIcons/ModelIcon16Gray.svg';
import ModelIcon16Blue from '../../../assets/Icons/ModelIcons/ModelIcon16Blue.svg';
import PopupIcon16Blue from '../../../assets/Icons/PopupIcons/PopupIcon16Blue.svg';
import PopupIcon16Gray from '../../../assets/Icons/PopupIcons/PopupIcon16Gray.svg';
import CloseIcon18Blue from '../../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';

interface CellData {
  id: string;
  drum?: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
}

const CELL_GAP_V = 5;
const CELL_GAP_H = 8;
const MERGED_MIN_WIDTH = 46;

const BTN_COLLAPSED = 40;
const BTN_SEARCH_EXPANDED = 280;

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ backgroundColor: 'rgba(102, 110, 254, 0.2)', color: '#2D4059' }}>{text.slice(idx, idx + highlight.length)}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
};

const StationConfigurationCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');
  const [cells, setCells] = useState<CellData[]>([]);
  const [gridType, setGridType] = useState<'postamat' | 'drum' | null>(null);
  const [columns, setColumns] = useState<number | null>(null);
  const [cellsPerColumn, setCellsPerColumn] = useState<number | null>(null);
  const [drums, setDrums] = useState<number | null>(null);
  const [columnsPerDrum, setColumnsPerDrum] = useState<number | null>(null);
  const [rowsPerColumn, setRowsPerColumn] = useState<number | null>(null);
  const [selectedDrum, setSelectedDrum] = useState<number>(1);
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchValue, setHistorySearchValue] = useState('');
  const [historySearchExpanded, setHistorySearchExpanded] = useState(false);
  const historySearchInputRef = useRef<HTMLInputElement>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);

  const [modelOptions, setModelOptions] = useState<{ uid: string; name: string }[]>([]);
  const [isModelSearchMode, setIsModelSearchMode] = useState(false);
  const [modelSearchValue, setModelSearchValue] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelDropdownPosition, setModelDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const modelFieldRef = useRef<HTMLDivElement>(null);

  const [initialState, setInitialState] = useState<{
    name: string;
    modelId: string;
    cells: CellData[];
    gridType: 'postamat' | 'drum' | null;
    columns: number | null;
    cellsPerColumn: number | null;
    drums: number | null;
    columnsPerDrum: number | null;
    rowsPerColumn: number | null;
  } | null>(null);

  const getPopupOpenKey = () => `station_config_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('stationModel');

  const LEFT_PANEL_WIDTH = 391;
  const RIGHT_PANEL_WIDTH = 345;

  const dividerStyle: React.CSSProperties = { position: 'absolute', top: 60, width: 2, height: 444, backgroundColor: '#E6E9F4' };

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    if (isEditMode) {
      setIsDataSaved(true);
      loadConfigData(uid);
    }
    fetchModelOptions();
  }, [uid]);

  useEffect(() => { if (historySearchExpanded && historySearchInputRef.current) setTimeout(() => historySearchInputRef.current?.focus(), 100); }, [historySearchExpanded]);

  const fetchModelOptions = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationModels);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setModelOptions(items.map((item: any) => ({ uid: item.uid, name: item.name })));
    } catch (e) { console.error(e); }
  };

  const loadConfigData = async (configUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationConfiguration(configUid))).data;
      setName(d.name || '');
      if (d.modelId) { setModelId(d.modelId); setModelName(d.modelName || ''); await loadModelCells(d.modelId, d.cellsStructure); }
      
      setInitialState({
        name: d.name || '',
        modelId: d.modelId || '',
        cells: JSON.parse(JSON.stringify(cells)),
        gridType: gridType,
        columns: columns,
        cellsPerColumn: cellsPerColumn,
        drums: drums,
        columnsPerDrum: columnsPerDrum,
        rowsPerColumn: rowsPerColumn,
      });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const loadModelCells = async (mid: string, existingStructure?: string) => {
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationModel(mid))).data;
      if (d.cellsStructure) {
        const parsed = JSON.parse(d.cellsStructure);
        const newGridType = parsed.type;
        let newColumns = null;
        let newCellsPerColumn = null;
        let newDrums = null;
        let newColumnsPerDrum = null;
        let newRowsPerColumn = null;
        let newCells: CellData[] = [];
        
        setGridType(parsed.type);
        if (parsed.type === 'postamat') { 
          newColumns = parsed.columns; newCellsPerColumn = parsed.cellsPerColumn;
          setColumns(parsed.columns); setCellsPerColumn(parsed.cellsPerColumn); 
        }
        else if (parsed.type === 'drum') { 
          newDrums = parsed.drums; newColumnsPerDrum = parsed.columnsPerDrum; newRowsPerColumn = parsed.rowsPerColumn;
          setDrums(parsed.drums); setColumnsPerDrum(parsed.columnsPerDrum); setRowsPerColumn(parsed.rowsPerColumn); 
        }
        
        if (existingStructure) {
          try {
            const existing = JSON.parse(existingStructure);
            if (existing.cells?.length > 0) { 
              newCells = existing.cells;
              setCells(existing.cells); 
            }
          } catch {}
        }
        
        if (newCells.length === 0 && parsed.cells?.length > 0) {
          newCells = parsed.cells.map((c: any) => ({ ...c, colSpan: c.colSpan || 1, rowSpan: c.rowSpan || 1, deleted: c.deleted || false }));
          setCells(newCells);
        }

        setInitialState({
          name: name,
          modelId: mid,
          cells: JSON.parse(JSON.stringify(newCells)),
          gridType: newGridType,
          columns: newColumns,
          cellsPerColumn: newCellsPerColumn,
          drums: newDrums,
          columnsPerDrum: newColumnsPerDrum,
          rowsPerColumn: newRowsPerColumn,
        });
      }
    } catch (e) { console.error(e); }
  };

  const normalizeCells = useCallback((list: CellData[]) => {
    return list.map(c => ({
      drum: c.drum,
      column: c.column,
      row: c.row,
      colSpan: c.colSpan,
      rowSpan: c.rowSpan,
      deleted: c.deleted,
    })).sort((a, b) => a.column - b.column || a.row - b.row || (a.drum || 0) - (b.drum || 0));
  }, []);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialState) return name.trim().length > 0 && modelId.length > 0;
    
    const cellsChanged = JSON.stringify(normalizeCells(cells)) !== JSON.stringify(normalizeCells(initialState.cells));
    
    return (
      name !== initialState.name ||
      modelId !== initialState.modelId ||
      gridType !== initialState.gridType ||
      columns !== initialState.columns ||
      cellsPerColumn !== initialState.cellsPerColumn ||
      drums !== initialState.drums ||
      columnsPerDrum !== initialState.columnsPerDrum ||
      rowsPerColumn !== initialState.rowsPerColumn ||
      cellsChanged
    );
  }, [isEdit, initialState, name, modelId, gridType, columns, cellsPerColumn, drums, columnsPerDrum, rowsPerColumn, cells, normalizeCells]);

  const canSave = isDirty && name.trim().length > 0 && modelId.length > 0;

  const getStatusIcon = (): string => {
    if (!isDataSaved) return StatusIcon93Red;
    if (isDirty) return StatusIcon107Orange;
    return StatusIcon104Blue;
  };

  const getStatusIconWidth = (): number => {
    if (!isDataSaved) return 93;
    if (isDirty) return 107;
    return 104;
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationConfigurationEventsByUid(uid || ''));
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription })));
    } catch (e) { console.error(e); } finally { setHistoryLoading(false); }
  };

  const handleHistoryClick = () => {
    if (!showHistory) {
      fetchHistory();
      setSlideDirection('left');
    } else {
      setSlideDirection('right');
    }
    setShowHistory(!showHistory);
  };

  const handleMainClick = () => {
    if (showHistory) {
      setSlideDirection('right');
      setShowHistory(false);
    }
  };

  const openModelPopup = () => { setPopupType('stationModel'); setPopupOpen(true); if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true'); };
  const handlePopupSelect = (id: string, nm: string) => { if (popupType === 'stationModel') { setModelId(id); setModelName(nm); loadModelCells(id); } };
  const handlePopupClose = () => { setPopupOpen(false); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };

  const filteredModelOptions = React.useMemo(() => {
    if (!modelSearchValue.trim()) return [];
    const q = modelSearchValue.toLowerCase();
    return modelOptions.filter(opt => opt.name.toLowerCase().includes(q)).slice(0, 5);
  }, [modelOptions, modelSearchValue]);

  const handleModelFieldClick = () => {
    setIsModelSearchMode(true);
    setModelSearchValue('');
    setShowModelDropdown(false);
  };

  const handleModelSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelSearchValue(e.target.value);
    if (e.target.value.trim()) {
      setShowModelDropdown(true);
      if (modelFieldRef.current) {
        const rect = modelFieldRef.current.getBoundingClientRect();
        setModelDropdownPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
      }
    } else {
      setShowModelDropdown(false);
    }
  };

  const handleModelOptionClick = (uid: string, name: string) => {
    setModelId(uid);
    setModelName(name);
    setIsModelSearchMode(false);
    setShowModelDropdown(false);
    setModelSearchValue('');
    loadModelCells(uid);
  };

  const handleModelRightIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModelPopup();
  };

  useEffect(() => {
    if (isModelSearchMode) {
      const handleClickOutside = (e: MouseEvent) => {
        if (modelFieldRef.current && !modelFieldRef.current.contains(e.target as Node)) {
          setIsModelSearchMode(false);
          setShowModelDropdown(false);
          setModelSearchValue('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelSearchMode]);

  const totalActiveCells = cells.filter(c => !c.deleted).length;

  const cols = gridType === 'postamat' ? (columns || 1) : (columnsPerDrum || 1);
  const rows = gridType === 'postamat' ? (cellsPerColumn || 1) : (rowsPerColumn || 1);

  const cellW = (() => {
    const calculated = (900 - (cols - 1) * CELL_GAP_H) / cols;
    return Math.min(calculated, 160);
  })();

  const cellH = (() => {
    const calculated = (450 - (rows - 1) * CELL_GAP_V) / rows;
    return Math.min(calculated, 65);
  })();

  const handleCellClick = (cellId: string, e: React.MouseEvent) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    if (cell.deleted) { setCells(prev => prev.map(c => c.id === cellId ? { ...c, deleted: false } : c)); return; }
    setSelectedCellIds(prev => { const next = new Set(prev); next.has(cellId) ? next.delete(cellId) : next.add(cellId); return next; });
  };

  const canMergeSelected = useCallback((): boolean => {
    if (selectedCellIds.size < 2) return false;
    const sc = cells.filter(c => selectedCellIds.has(c.id) && !c.deleted);
    if (sc.length !== selectedCellIds.size) return false;
    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    for (const c of sc) { minCol = Math.min(minCol, c.column); maxCol = Math.max(maxCol, c.column + c.colSpan - 1); minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row + c.rowSpan - 1); }
    for (const c of cells) { if (c.deleted || (gridType === 'drum' && c.drum !== selectedDrum)) continue; const cS = c.column, cE = c.column + c.colSpan - 1, rS = c.row, rE = c.row + c.rowSpan - 1; if (cE >= minCol && cS <= maxCol && rE >= minRow && rS <= maxRow && !selectedCellIds.has(c.id)) return false; }
    return true;
  }, [selectedCellIds, cells, gridType, selectedDrum]);

  const handleMergeSelected = () => {
    if (!canMergeSelected()) return;
    const sc = cells.filter(c => selectedCellIds.has(c.id) && !c.deleted);
    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    for (const c of sc) { minCol = Math.min(minCol, c.column); maxCol = Math.max(maxCol, c.column + c.colSpan - 1); minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row + c.rowSpan - 1); }
    const tl = cells.find(c => c.column === minCol && c.row === minRow && !c.deleted && (gridType === 'drum' ? c.drum === selectedDrum : true));
    if (!tl) return;
    setCells(prev => prev.map(c => {
      if (c.id === tl.id) return { ...c, colSpan: maxCol - minCol + 1, rowSpan: maxRow - minRow + 1 };
      if (c.column >= minCol && c.column <= maxCol && c.row >= minRow && c.row <= maxRow && c.id !== tl.id && (gridType !== 'drum' || c.drum === selectedDrum)) return { ...c, deleted: true, colSpan: 1, rowSpan: 1 };
      return c;
    }));
    setSelectedCellIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedCellIds.size === 0) return;
    setCells(prev => {
      const toDelete = new Set(selectedCellIds);
      const mergedToSplit = prev.filter(c => toDelete.has(c.id) && (c.colSpan > 1 || c.rowSpan > 1));
      let updated = [...prev];
      mergedToSplit.forEach(merged => {
        updated = updated.map(c => {
          if (c.id === merged.id) return { ...c, colSpan: 1, rowSpan: 1, deleted: true };
          if (c.deleted && c.column >= merged.column && c.column < merged.column + merged.colSpan && c.row >= merged.row && c.row < merged.row + merged.rowSpan && c.id !== merged.id && (gridType !== 'drum' || c.drum === selectedDrum)) return { ...c, deleted: true };
          return c;
        });
      });
      updated = updated.map(c => toDelete.has(c.id) ? { ...c, deleted: true } : c);
      return updated;
    });
    setSelectedCellIds(new Set());
  };

  const handleCellContextMenu = (cellId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    if (cell.deleted) { setCells(prev => prev.map(c => c.id === cellId ? { ...c, deleted: false } : c)); }
    else if (cell.colSpan > 1 || cell.rowSpan > 1) { setCells(prev => prev.map(c => { if (c.id === cellId) return { ...c, colSpan: 1, rowSpan: 1 }; if (c.deleted && c.column >= cell.column && c.column < cell.column + cell.colSpan && c.row >= cell.row && c.row < cell.row + cell.rowSpan && (gridType !== 'drum' || c.drum === selectedDrum)) return { ...c, deleted: false }; return c; })); }
  };

  const handleClearSelection = () => setSelectedCellIds(new Set());

  const renderCells = () => {
    if (!gridType) return null;
    if (!cols || !rows) return null;
    const rendered = new Set<string>();
    const elements: React.ReactNode[] = [];
    cells.filter(c => !c.deleted && (gridType === 'drum' ? c.drum === selectedDrum : true)).forEach(cell => {
      const key = `${cell.column}-${cell.row}`; if (rendered.has(key)) return;
      const isSelected = selectedCellIds.has(cell.id), isMerged = cell.colSpan > 1 || cell.rowSpan > 1;
      const left = (cell.column - 1) * (cellW + CELL_GAP_H), top = (cell.row - 1) * (cellH + CELL_GAP_V);
      const w = cellW * cell.colSpan + CELL_GAP_H * (cell.colSpan - 1), h = cellH * cell.rowSpan + CELL_GAP_V * (cell.rowSpan - 1);
      for (let c = 0; c < cell.colSpan; c++) for (let r = 0; r < cell.rowSpan; r++) rendered.add(`${cell.column + c}-${cell.row + r}`);

      const colStart = cell.column;
      const rowStart = cell.row;
      const colEnd = cell.column + cell.colSpan - 1;
      const rowEnd = cell.row + cell.rowSpan - 1;
      const fitsInOneRow = w >= MERGED_MIN_WIDTH;

      elements.push(
        <div key={cell.id} onClick={(e) => handleCellClick(cell.id, e)} onContextMenu={(e) => handleCellContextMenu(cell.id, e)} style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: 3, backgroundColor: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', zIndex: 1, overflow: 'hidden', transition: 'background-color 0.15s ease' }}>
          {isMerged ? (
            fitsInOneRow ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
                <img src={UnificationIcon12White} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colEnd}-{rowEnd}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
                <img src={UnificationIcon12White} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colEnd}-{rowEnd}</span>
              </div>
            )
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
          )}
        </div>
      );
    });
    cells.filter(c => c.deleted && (gridType === 'drum' ? c.drum === selectedDrum : true)).forEach(cell => {
      const key = `${cell.column}-${cell.row}`; if (rendered.has(key)) return;
      const left = (cell.column - 1) * (cellW + CELL_GAP_H), top = (cell.row - 1) * (cellH + CELL_GAP_V);
      rendered.add(key);
      elements.push(
        <div key={cell.id} onClick={(e) => handleCellClick(cell.id, e)} onContextMenu={(e) => handleCellContextMenu(cell.id, e)} style={{ position: 'absolute', left, top, width: cellW, height: cellH, borderRadius: 3, border: '1px dashed rgba(45, 64, 89, 0.25)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', zIndex: 0 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>+</span>
        </div>
      );
    });
    return <div style={{ position: 'relative', width: cols * cellW + (cols - 1) * CELL_GAP_H, height: rows * cellH + (rows - 1) * CELL_GAP_V }}>{elements}</div>;
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const cellsStructure = JSON.stringify({ type: gridType, columns: gridType === 'postamat' ? columns : undefined, cellsPerColumn: gridType === 'postamat' ? cellsPerColumn : undefined, drums: gridType === 'drum' ? drums : undefined, columnsPerDrum: gridType === 'drum' ? columnsPerDrum : undefined, rowsPerColumn: gridType === 'drum' ? rowsPerColumn : undefined, cells });
      const body = { uid, name: name.trim(), modelId: modelId || null, cellsStructure };
      const wasCreate = !isEdit;
      if (isEdit) await AxiosService.patch(`${ConstantInfo.restApiStationConfigurations}/${uid}`, body);
      else await AxiosService.post(ConstantInfo.restApiStationConfigurations, body);
      
      setInitialState({
        name: name.trim(),
        modelId: modelId,
        cells: JSON.parse(JSON.stringify(cells)),
        gridType: gridType,
        columns: columns,
        cellsPerColumn: cellsPerColumn,
        drums: drums,
        columnsPerDrum: columnsPerDrum,
        rowsPerColumn: rowsPerColumn,
      });
      
      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      setIsDataSaved(true);
      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/references/station-configurations/edit/${uid}`;
        const newLabel = name.trim() || 'Конфигурация станции';
        replaceTab(activeTabId, newPath, newLabel, <StationConfigurationCreatePage />);
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };
  const handleCloseWithoutSaving = () => { if (uid) sessionStorage.removeItem(getPopupOpenKey()); handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };

  const CONTENT_LEFT = 30;
  const CONTENT_TOP = 30;
  const FIELD_LEFT = 71;
  const FIELD_WIDTH = 250;
  const FIELD_HEIGHT = 56;

  const INFO_BLOCK_LEFT = 71;
  const INFO_ROW_HEIGHT = 17;
  const INFO_ROW_GAP = 14;

  const DRUM_SWITCHER_LEFT = 53;
  const DRUM_SWITCHER_RIGHT = 53;
  const DRUM_TEXT_HEIGHT = 17;
  const DRUM_TEXT_TO_LINE = 7;
  const LINE_HEIGHT = 3;
  const LINE_GAP = 30;
  const DRUM_SWITCHER_TOTAL_HEIGHT = DRUM_TEXT_HEIGHT + DRUM_TEXT_TO_LINE + LINE_HEIGHT;

  const BUTTON_WIDTH = 311;
  const BUTTON_HEIGHT = 40;
  const BUTTON_LEFT = 40;
  const BUTTON_GAP = 12;
  const BUTTONS_BOTTOM = 30;

  const getDrumLabel = (drumNum: number, totalDrums: number): string => {
    if (totalDrums === 2) return drumNum === 1 ? 'Левый барабан' : 'Правый барабан';
    return `${drumNum}`;
  };

  const getDrumLayout = (totalDrums: number) => {
    const availableWidth = LEFT_PANEL_WIDTH - DRUM_SWITCHER_LEFT - DRUM_SWITCHER_RIGHT;
    const lineWidth = (availableWidth - (totalDrums - 1) * LINE_GAP) / totalDrums;
    const positions: number[] = [];
    for (let i = 0; i < totalDrums; i++) positions.push(DRUM_SWITCHER_LEFT + i * (lineWidth + LINE_GAP));
    return { lineWidth, positions };
  };

  const getFieldsetStyle = (hasValue: boolean): React.CSSProperties => ({
    width: '100%', height: FIELD_HEIGHT,
    border: `1px solid ${hasValue ? '#666EFE' : 'rgba(45, 64, 89, 0.5)'}`,
    borderRadius: 10, padding: 0, margin: 0,
    display: 'flex', alignItems: 'center', boxSizing: 'border-box', position: 'relative',
  });

  const getLegendStyle = (hasValue: boolean): React.CSSProperties => ({
    fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
    color: hasValue ? '#666EFE' : 'rgba(45, 64, 89, 0.5)',
    padding: '0 4px', marginLeft: 8,
    position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)',
    backgroundColor: '#FFFFFF', lineHeight: '14px', height: 14,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none',
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059',
    backgroundColor: 'transparent', paddingLeft: 46, paddingRight: 36, borderRadius: 10,
  };

  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const mergeAllowed = canMergeSelected();
  const hasSelection = selectedCellIds.size > 0;
  const headerTop = CONTENT_TOP;
  const drumSwitcherTop = headerTop + 18 + 30;
  const nameFieldTop = drumSwitcherTop + DRUM_SWITCHER_TOTAL_HEIGHT + 29;
  const modelFieldTop = nameFieldTop + FIELD_HEIGHT + 29;
  const infoBlockTop = modelFieldTop + FIELD_HEIGHT + 20;

  const button3Bottom = BUTTONS_BOTTOM;
  const button2Bottom = button3Bottom + BUTTON_HEIGHT + BUTTON_GAP;
  const button1Bottom = button2Bottom + BUTTON_HEIGHT + BUTTON_GAP;

  const buttonBaseStyle: React.CSSProperties = {
    position: 'absolute',
    left: BUTTON_LEFT,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 8,
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const infoTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
    opacity: 0.6,
  };

  const infoNumberStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
  };

  const historySearchWidth = historySearchExpanded ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const tween = { type: 'tween' as const, duration: 0.2 };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -200 : 200,
      opacity: 0,
    }),
  };

  const currentView = showHistory ? 'history' : 'main';

  const renderContent = () => {
    if (showHistory) {
      return (
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 15, zIndex: 10, height: 40 }}>
            <motion.div 
              style={{ position: 'absolute', left: 0, top: 0, height: 40, borderRadius: 10, backgroundColor: historySearchExpanded ? '#666EFE' : '#FFFFFF', border: historySearchExpanded ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }} 
              animate={{ width: historySearchWidth }} 
              transition={tween}
            >
              <div onClick={historySearchExpanded ? () => { setHistorySearchExpanded(false); setHistorySearchValue(''); } : () => setHistorySearchExpanded(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <img src={historySearchExpanded ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              </div>
              {historySearchExpanded && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
                  <input ref={historySearchInputRef} type="text" value={historySearchValue} onChange={e => setHistorySearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', maxWidth: 211, height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                </div>
              )}
            </motion.div>
          </div>
          <div style={{ position: 'absolute', top: 52, left: 0 }}>
            <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={1740} visibleRows={8} rowHeight={58} headerHeight={58} dateLabel="Дата и время" authorLabel="Автор" eventLabel="Событие" searchValue={historySearchValue} />
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: LEFT_PANEL_WIDTH, flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: headerTop, left: CONTENT_LEFT, display: 'flex', alignItems: 'center', height: 18 }}>
            <img src={StructureIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', marginLeft: 12 }}>Конфигурация ячеек</span>
          </div>

          {gridType === 'drum' && (
            <div style={{ position: 'absolute', top: drumSwitcherTop, left: 0, right: 0, height: DRUM_SWITCHER_TOTAL_HEIGHT }}>
              {drums != null && drums > 1 ? (
                (() => {
                  const totalDrums = drums;
                  const { lineWidth, positions } = getDrumLayout(totalDrums);
                  return Array.from({ length: totalDrums }).map((_, i) => {
                    const drumNum = i + 1;
                    const isSelected = selectedDrum === drumNum;
                    const left = positions[i];
                    const label = getDrumLabel(drumNum, totalDrums);
                    return (
                      <React.Fragment key={drumNum}>
                        <button onClick={() => { setSelectedDrum(drumNum); setSelectedCellIds(new Set()); }}
                          style={{ position: 'absolute', left, top: 0, width: lineWidth, height: DRUM_TEXT_HEIGHT, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_TEXT_HEIGHT}px`, transition: 'color 0.3s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</button>
                        <div style={{ position: 'absolute', top: DRUM_TEXT_HEIGHT + DRUM_TEXT_TO_LINE, left, width: lineWidth, height: LINE_HEIGHT, backgroundColor: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.06)', borderRadius: '1.5px', transition: 'background-color 0.3s ease' }} />
                      </React.Fragment>
                    );
                  });
                })()
              ) : (
                <div style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          )}

          <div style={{ position: 'absolute', top: nameFieldTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
            <fieldset style={getFieldsetStyle(!!name)}>
              <legend style={getLegendStyle(!!name)}>Наименование</legend>
              <div style={{ position: 'absolute', left: 17, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={name ? NameIcon18Blue : NameIcon18Gray} alt="" style={{ width: 18, height: 18 }} />
              </div>
              <input type="text" value={name} onChange={e => setName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Введите название" style={{ ...inputStyle, color: name ? '#666EFE' : '#A0A3BD', paddingLeft: 46, paddingRight: name ? 36 : 12 }} />
              {name && (
                <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setName('')}>
                  <img src={CloseIcon18Blue} alt="Очистить" style={{ width: 18, height: 18 }} />
                </div>
              )}
            </fieldset>
          </div>

          <div ref={modelFieldRef} style={{ position: 'absolute', top: modelFieldTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
            <fieldset style={getFieldsetStyle(!!modelId)}>
              <legend style={getLegendStyle(!!modelId)}>Выбор модели</legend>
              {isModelSearchMode ? (
                <>
                  <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={ModelIcon16Blue} alt="" style={{ width: 16, height: 16 }} />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={modelSearchValue}
                    onChange={handleModelSearchChange}
                    placeholder="Поиск..."
                    style={{ ...inputStyle, color: '#666EFE', paddingLeft: 46, paddingRight: 36 }}
                  />
                  <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleModelRightIconClick}>
                    <img src={PopupIcon16Blue} alt="" style={{ width: 16, height: 4 }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={modelId ? ModelIcon16Blue : ModelIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
                  </div>
                  <div onClick={handleModelFieldClick} style={{ position: 'absolute', left: 46, right: 36, top: 0, bottom: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: modelId ? '#666EFE' : '#A0A3BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelName || 'Выберите модель'}</span>
                  </div>
                  <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleModelRightIconClick}>
                    <img src={modelId ? PopupIcon16Blue : PopupIcon16Gray} alt="" style={{ width: 16, height: 4 }} />
                  </div>
                </>
              )}
            </fieldset>

            {showModelDropdown && (
              <div style={{ position: 'fixed', top: modelDropdownPosition.top, left: modelDropdownPosition.left, width: modelDropdownPosition.width, backgroundColor: '#FFFFFF', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 10001, padding: '15px 40px' }}>
                {filteredModelOptions.length === 0 ? (
                  <div style={{ height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Модели не найдены</span>
                  </div>
                ) : (
                  filteredModelOptions.map((opt, idx) => (
                    <div key={opt.uid} onClick={() => handleModelOptionClick(opt.uid, opt.name)} style={{ height: 17, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: idx < filteredModelOptions.length - 1 ? 15 : 0 }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <HighlightedText text={opt.name} highlight={modelSearchValue} />
                      </span>
                    </div>
                  ))
                )}
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => { openModelPopup(); setIsModelSearchMode(false); setShowModelDropdown(false); setModelSearchValue(''); }}
                    style={{ width: 126, height: 34, borderRadius: 8, backgroundColor: '#666EFE', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}
                  >
                    Весь список
                  </button>
                </div>
              </div>
            )}
          </div>

          {gridType && (
            <div style={{ position: 'absolute', top: infoBlockTop, left: INFO_BLOCK_LEFT }}>
              <div style={{ height: INFO_ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>
                <span style={infoTextStyle}>Общее количество ячеек&nbsp;</span>
                <span style={infoNumberStyle}>{totalActiveCells}</span>
              </div>
              <div style={{ height: INFO_ROW_HEIGHT, display: 'flex', alignItems: 'center', marginTop: INFO_ROW_GAP }}>
                <span style={infoTextStyle}>Колонок&nbsp;</span>
                <span style={infoNumberStyle}>{cols}</span>
              </div>
              <div style={{ height: INFO_ROW_HEIGHT, display: 'flex', alignItems: 'center', marginTop: INFO_ROW_GAP }}>
                <span style={infoTextStyle}>Строк&nbsp;</span>
                <span style={infoNumberStyle}>{rows}</span>
              </div>
            </div>
          )}

          <button
            onClick={hasSelection ? handleClearSelection : undefined}
            disabled={!hasSelection}
            style={{ ...buttonBaseStyle, bottom: button3Bottom, backgroundColor: 'rgba(45, 64, 89, 0.5)', opacity: hasSelection ? 1 : 0.35, cursor: hasSelection ? 'pointer' : 'default' }}
          >
            Снять выделение
          </button>

          <button
            onClick={hasSelection ? handleDeleteSelected : undefined}
            disabled={!hasSelection}
            style={{ ...buttonBaseStyle, bottom: button2Bottom, backgroundColor: '#FF3052', opacity: hasSelection ? 1 : 0.6, cursor: hasSelection ? 'pointer' : 'default' }}
          >
            Удалить выбранные ячейки
          </button>

          <button
            onClick={hasSelection && mergeAllowed ? handleMergeSelected : undefined}
            disabled={!hasSelection || !mergeAllowed}
            style={{ ...buttonBaseStyle, bottom: button1Bottom, backgroundColor: '#666EFE', opacity: hasSelection && mergeAllowed ? 1 : 0.6, cursor: hasSelection && mergeAllowed ? 'pointer' : 'default' }}
          >
            Объединить выбранные ячейки
          </button>
        </div>

        <div style={{ ...dividerStyle, left: LEFT_PANEL_WIDTH }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '42px 30px 40px 30px' }}>
          {totalActiveCells > 0 ? renderCells() : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Выберите модель станции</span>
          )}
        </div>

        <div style={{ ...dividerStyle, right: RIGHT_PANEL_WIDTH }} />

        <div style={{ width: RIGHT_PANEL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: 200, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, cursor: 'pointer', margin: '0 30px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE' }}>У модели нет библиотеки</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#F5F6FA', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, zIndex: 10, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory 
            ? `Конфигурация станции: ${initialState?.name || 'Конфигурация'} (История изменений)` 
            : isEdit 
              ? `Справочник: Конфигурация станции (${initialState?.name || 'Конфигурация'})` 
              : 'Справочник: Конфигурация станции (Создание)'}
        </h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={handleMainClick} style={{ width: 151, height: 40, borderRadius: 10, backgroundColor: !showHistory ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: !showHistory ? '#FFFFFF' : '#2D4059' }}>
            Основное
          </button>
        </div>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={{ ...smallButtonStyle, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF' }} onClick={handleHistoryClick}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: showHistory ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 155, left: 30, right: 30, bottom: 96, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentView}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
        <button 
          onClick={canSave ? handleSave : undefined} 
          disabled={!canSave || isSaving} 
          style={{ 
            width: 154, 
            height: 51, 
            borderRadius: 10, 
            border: '1px solid rgba(102, 110, 254, 0.15)', 
            backgroundColor: '#FFFFFF', 
            cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', 
            display: 'flex', 
            alignItems: 'center', 
            paddingLeft: 20,
            paddingRight: 20,
            fontFamily: 'Inter, sans-serif', 
            fontSize: 15, 
            fontWeight: 600, 
            color: '#2D4059', 
            opacity: canSave ? 1 : 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17, flexShrink: 0 }}>Записать</span>
        </button>
        <button onClick={() => setShowClosePopup(true)} style={{ width: 116, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Закрыть</button>
      </div>

      <CatalogSelectPopup isOpen={popupOpen} onClose={handlePopupClose} onSelect={handlePopupSelect} popupType={popupType} />

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canSave && <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}
              <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
              <button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationConfigurationCreatePage;