// StationConfigurationCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (обновленный внешний вид)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
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

const StationConfigurationCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { tabs, activeTabId, closeTab } = useTabs();

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
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getPopupOpenKey = () => `station_config_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('stationModel');

  const LEFT_PANEL_WIDTH = 391;
  const RIGHT_PANEL_WIDTH = 345;

  const dividerStyle: React.CSSProperties = { position: 'absolute', top: 60, width: 2, height: 444, backgroundColor: '#E6E9F4' };

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    setIsEdit(cp.includes('/edit/'));
    if (cp.includes('/edit/')) loadConfigData(uid);
  }, [uid]);

  const loadConfigData = async (configUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationConfiguration(configUid))).data;
      setName(d.name || '');
      if (d.modelId) { setModelId(d.modelId); setModelName(d.modelName || ''); await loadModelCells(d.modelId, d.cellsStructure); }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const loadModelCells = async (mid: string, existingStructure?: string) => {
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationModel(mid))).data;
      if (d.cellsStructure) {
        const parsed = JSON.parse(d.cellsStructure);
        setGridType(parsed.type);
        if (parsed.type === 'postamat') { setColumns(parsed.columns); setCellsPerColumn(parsed.cellsPerColumn); }
        else if (parsed.type === 'drum') { setDrums(parsed.drums); setColumnsPerDrum(parsed.columnsPerDrum); setRowsPerColumn(parsed.rowsPerColumn); }
        if (existingStructure) {
          try {
            const existing = JSON.parse(existingStructure);
            if (existing.cells?.length > 0) { setCells(existing.cells); return; }
          } catch {}
        }
        if (parsed.cells?.length > 0) setCells(parsed.cells.map((c: any) => ({ ...c, colSpan: c.colSpan || 1, rowSpan: c.rowSpan || 1, deleted: c.deleted || false })));
      }
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      setHistoryEvents([]);
    } catch (e) { console.error(e); } finally { setHistoryLoading(false); }
  };

  const handleHistoryClick = () => {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  };

  const openModelPopup = () => { setPopupType('stationModel'); setPopupOpen(true); if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true'); };
  const handlePopupSelect = (id: string, nm: string) => { if (popupType === 'stationModel') { setModelId(id); setModelName(nm); loadModelCells(id); } };
  const handlePopupClose = () => { setPopupOpen(false); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };

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
      if (isEdit) await AxiosService.patch(`${ConstantInfo.restApiStationConfigurations}/${uid}`, body);
      else await AxiosService.post(ConstantInfo.restApiStationConfigurations, body);
      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      if (!isEdit) { setIsEdit(true); navigate(`/references/station-configurations/edit/${uid}`, { replace: true }); }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };
  const handleCloseWithoutSaving = () => { if (uid) sessionStorage.removeItem(getPopupOpenKey()); handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };
  const canSave = name.trim().length > 0 && modelId.length > 0;

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
    backgroundColor: 'transparent', paddingLeft: 12, paddingRight: 12, borderRadius: 10,
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

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#F5F6FA' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory ? 'Справочник: Конфигурации станций (История изменений)' : (isEdit ? (name || 'Конфигурация') : 'Справочник: Конфигурации станций (Создание)')}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => setShowHistory(false)} style={{ width: 151, height: 40, borderRadius: 10, backgroundColor: !showHistory ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: !showHistory ? '#FFFFFF' : '#2D4059' }}>
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

      {showHistory ? (
        <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden', padding: 20 }}>
          <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={window.innerWidth - 60 - 60 - 40} visibleRows={12} rowHeight={58} headerHeight={58} dateLabel="Дата и время" authorLabel="Автор" eventLabel="Событие" />
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden', display: 'flex' }}>
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
                <input type="text" value={name} onChange={e => setName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Введите название" style={inputStyle} />
              </fieldset>
            </div>

            <div style={{ position: 'absolute', top: modelFieldTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
              <fieldset style={getFieldsetStyle(!!modelId)}>
                <legend style={getLegendStyle(!!modelId)}>Выбор модели</legend>
                <div onClick={openModelPopup} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer', paddingLeft: 12, paddingRight: 12, boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: modelId ? '#666EFE' : '#A0A3BD' }}>{modelName || 'Выберите модель'}</span>
                </div>
              </fieldset>
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

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '42px 30px 40px 30px' }}>
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
      )}

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        <button onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving} style={{ width: 154, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', opacity: canSave ? 1 : 0.5 }}>
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17 }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
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