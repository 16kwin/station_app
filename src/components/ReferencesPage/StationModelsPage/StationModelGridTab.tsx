// StationModelGridTab.tsx — ПОЛНЫЙ ФАЙЛ (name = "column-row" при генерации, отображение cell.name, fallback на адрес)
import React, { useState, useCallback } from 'react';
import StructureIcon18Black from '../../../assets/Icons/StructureIcons/StructureIcon18Black.svg';
import UnificationIcon12White from '../../../assets/Icons/UnificationIcons/UnificationIcon12White.svg';
import CreateIcon14Gray from '../../../assets/Icons/СreateIcons/СreateIcon14Gray.svg';

export interface CellData {
  id: string;
  drum?: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
  name: string;
}

interface StationModelGridTabProps {
  isAddress: boolean;
  selectedDrum: number;
  setSelectedDrum: (v: number) => void;
  cells: CellData[];
  setCells: React.Dispatch<React.SetStateAction<CellData[]>>;
}

const CELL_GAP_V = 5;
const CELL_GAP_H = 8;

const StationModelGridTab: React.FC<StationModelGridTabProps> = ({
  isAddress,
  selectedDrum, setSelectedDrum,
  cells, setCells,
}) => {
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
  const [renamingCellId, setRenamingCellId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  // Параметры генерации сетки (только UI)
  const [drums, setDrums] = useState<number | null>(null);
  const [columnsPerDrum, setColumnsPerDrum] = useState<number | null>(null);
  const [rowsPerColumn, setRowsPerColumn] = useState<number | null>(null);

  const LEFT_PANEL_WIDTH = 391;
  const RIGHT_PANEL_WIDTH = 345;
  const dividerStyle: React.CSSProperties = { position: 'absolute', top: 60, width: 2, height: 444, backgroundColor: '#E6E9F4' };

  const totalActiveCells = cells.filter(c => !c.deleted).length;

  const cols = isAddress ? (columnsPerDrum || 1) : 1;
  const rows = isAddress ? (rowsPerColumn || 1) : 1;

  const cellW = (() => {
    const calculated = (944 - (cols - 1) * CELL_GAP_H) / cols;
    return Math.min(calculated, 160);
  })();

  const cellH = (() => {
    const calculated = (481 - (rows - 1) * CELL_GAP_V) / rows;
    return Math.min(calculated, 65);
  })();

  const generateGrid = () => {
    if (!isAddress) {
      // неадресный: одна ячейка "СКЛАД"
      setCells([{
        id: crypto.randomUUID(),
        drum: 1, column: 1, row: 1,
        colSpan: 1, rowSpan: 1, deleted: false,
        name: 'СКЛАД',
      }]);
      return;
    }
    const d = drums || 1;
    const c = columnsPerDrum || 1;
    const r = rowsPerColumn || 1;
    const newCells: CellData[] = [];
    for (let drum = 1; drum <= d; drum++)
      for (let col = 1; col <= c; col++)
        for (let row = 1; row <= r; row++)
          newCells.push({
            id: crypto.randomUUID(),
            drum, column: col, row,
            colSpan: 1, rowSpan: 1, deleted: false,
            name: `${col}-${row}`,            // имя = адрес по умолчанию
          });
    setCells(newCells);
  };

  const handleCellClick = (cellId: string, e: React.MouseEvent) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    if (cell.deleted) { setCells(prev => prev.map(c => c.id === cellId ? { ...c, deleted: false } : c)); return; }
    setSelectedCellIds(prev => { const next = new Set(prev); if (next.has(cellId)) next.delete(cellId); else next.add(cellId); return next; });
  };

  const handleRenameCell = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    setRenamingCellId(cellId);
    setRenamingValue(cell.name || '');
  };

  const submitRename = () => {
    if (!renamingCellId) return;
    setCells(prev => prev.map(c => c.id === renamingCellId ? { ...c, name: renamingValue } : c));
    setRenamingCellId(null);
    setRenamingValue('');
  };

  const canMergeSelected = useCallback((): boolean => {
    if (selectedCellIds.size < 2) return false;
    const sc = cells.filter(c => selectedCellIds.has(c.id) && !c.deleted);
    if (sc.length !== selectedCellIds.size) return false;
    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    for (const c of sc) { minCol = Math.min(minCol, c.column); maxCol = Math.max(maxCol, c.column + c.colSpan - 1); minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row + c.rowSpan - 1); }
    for (const c of cells) { if (c.deleted || (isAddress && c.drum !== selectedDrum)) continue; const cS = c.column, cE = c.column + c.colSpan - 1, rS = c.row, rE = c.row + c.rowSpan - 1; if (cE >= minCol && cS <= maxCol && rE >= minRow && rS <= maxRow && !selectedCellIds.has(c.id)) return false; }
    return true;
  }, [selectedCellIds, cells, isAddress, selectedDrum]);

  const handleMergeSelected = () => {
    if (!canMergeSelected()) return;
    const sc = cells.filter(c => selectedCellIds.has(c.id) && !c.deleted);
    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    for (const c of sc) { minCol = Math.min(minCol, c.column); maxCol = Math.max(maxCol, c.column + c.colSpan - 1); minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row + c.rowSpan - 1); }
    const tl = cells.find(c => c.column === minCol && c.row === minRow && !c.deleted && (!isAddress || c.drum === selectedDrum));
    if (!tl) return;
    setCells(prev => prev.map(c => {
      if (c.id === tl.id) return { ...c, colSpan: maxCol - minCol + 1, rowSpan: maxRow - minRow + 1 };
      if (c.column >= minCol && c.column <= maxCol && c.row >= minRow && c.row <= maxRow && c.id !== tl.id && (!isAddress || c.drum === selectedDrum)) return { ...c, deleted: true, colSpan: 1, rowSpan: 1 };
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
          if (c.deleted && c.column >= merged.column && c.column < merged.column + merged.colSpan && c.row >= merged.row && c.row < merged.row + merged.rowSpan && c.id !== merged.id && (!isAddress || c.drum === selectedDrum)) return { ...c, deleted: true };
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
    if (cell.deleted) { setCells(prev => prev.map(c => c.id === cellId ? { ...c, deleted: false } : c)); return; }
    if (cell.colSpan > 1 || cell.rowSpan > 1) {
      setCells(prev => prev.map(c => {
        if (c.id === cellId) return { ...c, colSpan: 1, rowSpan: 1 };
        if (c.deleted && c.column >= cell.column && c.column < cell.column + cell.colSpan && c.row >= cell.row && c.row < cell.row + cell.rowSpan && (!isAddress || c.drum === selectedDrum)) return { ...c, deleted: false };
        return c;
      }));
      return;
    }
    handleRenameCell(cellId);
  };

  const handleClearSelection = () => setSelectedCellIds(new Set());

  const MERGED_MIN_WIDTH = 46;

  const renderCells = () => {
    if (!cols || !rows) return null;
    const rendered = new Set<string>();
    const elements: React.ReactNode[] = [];

    const visibleCells = isAddress
      ? cells.filter(c => !c.deleted && c.drum === selectedDrum)
      : cells.filter(c => !c.deleted);

    visibleCells.forEach(cell => {
      const key = `${cell.column}-${cell.row}`; if (rendered.has(key)) return;
      const isSelected = selectedCellIds.has(cell.id), isMerged = cell.colSpan > 1 || cell.rowSpan > 1;
      const left = (cell.column - 1) * (cellW + CELL_GAP_H), top = (cell.row - 1) * (cellH + CELL_GAP_V);
      const w = cellW * cell.colSpan + CELL_GAP_H * (cell.colSpan - 1), h = cellH * cell.rowSpan + CELL_GAP_V * (cell.rowSpan - 1);
      for (let c = 0; c < cell.colSpan; c++) for (let r = 0; r < cell.rowSpan; r++) rendered.add(`${cell.column + c}-${cell.row + r}`);

      const colStart = cell.column, rowStart = cell.row, colEnd = cell.column + cell.colSpan - 1, rowEnd = cell.row + cell.rowSpan - 1;
      const fitsInOneRow = w >= MERGED_MIN_WIDTH;

      // Имя ячейки = её адрес по умолчанию ("column-row"), но пользователь может изменить
      const displayText = cell.name?.trim() || `${colStart}-${rowStart}`;

      elements.push(
        <div key={cell.id} onClick={(e) => handleCellClick(cell.id, e)} onContextMenu={(e) => handleCellContextMenu(cell.id, e)}
          title={cell.name || ''}
          style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: 3, backgroundColor: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', zIndex: 1, overflow: 'hidden', transition: 'background-color 0.15s ease', padding: 4, boxSizing: 'border-box' }}>
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{displayText}</span>
          )}
        </div>
      );
    });

    cells.filter(c => c.deleted && (!isAddress || c.drum === selectedDrum)).forEach(cell => {
      const key = `${cell.column}-${cell.row}`; if (rendered.has(key)) return;
      const left = (cell.column - 1) * (cellW + CELL_GAP_H), top = (cell.row - 1) * (cellH + CELL_GAP_V);
      rendered.add(key);
      elements.push(
        <div key={cell.id} onClick={(e) => handleCellClick(cell.id, e)} style={{ position: 'absolute', left, top, width: cellW, height: cellH, borderRadius: 3, border: '1px dashed rgba(45, 64, 89, 0.25)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', zIndex: 0 }}>
          <img src={CreateIcon14Gray} alt="" style={{ width: 14, height: 14 }} />
        </div>
      );
    });

    return <div style={{ position: 'relative', width: cols * cellW + (cols - 1) * CELL_GAP_H, height: rows * cellH + (rows - 1) * CELL_GAP_V }}>{elements}</div>;
  };

  const CONTENT_LEFT = 30;
  const CONTENT_TOP = 30;
  const FIELD_LEFT = 71;
  const FIELD_WIDTH = 250;
  const FIELD_HEIGHT = 56;

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

  const numberInputStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none',
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059',
    backgroundColor: 'transparent', paddingLeft: 12, paddingRight: 12, borderRadius: 10,
  };

  const mergeAllowed = canMergeSelected();
  const hasSelection = selectedCellIds.size > 0;
  const headerTop = CONTENT_TOP;
  const drumSwitcherTop = headerTop + 18 + 30;
  const drumsFieldTop = drumSwitcherTop + DRUM_SWITCHER_TOTAL_HEIGHT + 40;
  const columnsRowTop = drumsFieldTop + FIELD_HEIGHT + 40;

  const button3Bottom = BUTTONS_BOTTOM;
  const button2Bottom = button3Bottom + BUTTON_HEIGHT + BUTTON_GAP;
  const button1Bottom = button2Bottom + BUTTON_HEIGHT + BUTTON_GAP;

  const buttonBaseStyle: React.CSSProperties = {
    position: 'absolute', left: BUTTON_LEFT, width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
    borderRadius: 8, border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
      <div style={{ width: LEFT_PANEL_WIDTH, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: headerTop, left: CONTENT_LEFT, display: 'flex', alignItems: 'center', height: 18 }}>
          <img src={StructureIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', marginLeft: 12 }}>Структура ячеек</span>
        </div>

        {isAddress && (
          <>
            <div style={{ position: 'absolute', top: drumSwitcherTop, left: 0, right: 0, height: DRUM_SWITCHER_TOTAL_HEIGHT }}>
              {drums != null && drums > 1 && (() => {
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
              })()}
            </div>
            <div style={{ position: 'absolute', top: drumsFieldTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
              <fieldset style={getFieldsetStyle(!!drums)}>
                <legend style={getLegendStyle(!!drums)}>Барабаны</legend>
                <input type="number" min={1} max={4} value={drums ?? ''} onChange={e => { let val = e.target.value ? parseInt(e.target.value) : null; if (val !== null && val > 4) val = 4; setDrums(val); setSelectedDrum(1); }} placeholder="0" style={numberInputStyle} />
              </fieldset>
            </div>
            <div style={{ position: 'absolute', top: columnsRowTop, left: FIELD_LEFT, display: 'flex', gap: 15, width: FIELD_WIDTH }}>
              <div style={{ flex: 1 }}>
                <fieldset style={getFieldsetStyle(!!columnsPerDrum)}>
                  <legend style={getLegendStyle(!!columnsPerDrum)}>Колонки</legend>
                  <input type="number" min={1} max={14} value={columnsPerDrum ?? ''} onChange={e => { let val = e.target.value ? parseInt(e.target.value) : null; if (val !== null && val > 14) val = 14; setColumnsPerDrum(val); }} placeholder="0" style={numberInputStyle} />
                </fieldset>
              </div>
              <div style={{ flex: 1 }}>
                <fieldset style={getFieldsetStyle(!!rowsPerColumn)}>
                  <legend style={getLegendStyle(!!rowsPerColumn)}>Ячейки</legend>
                  <input type="number" min={1} max={18} value={rowsPerColumn ?? ''} onChange={e => { let val = e.target.value ? parseInt(e.target.value) : null; if (val !== null && val > 18) val = 18; setRowsPerColumn(val); }} placeholder="0" style={numberInputStyle} />
                </fieldset>
              </div>
            </div>
            <div style={{ position: 'absolute', top: columnsRowTop + FIELD_HEIGHT + 20, left: FIELD_LEFT, width: FIELD_WIDTH }}>
              <button onClick={generateGrid} style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', backgroundColor: '#666EFE', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Сгенерировать сетку</button>
            </div>
          </>
        )}

        {!isAddress && (
          <div style={{ position: 'absolute', top: drumSwitcherTop + 20, left: FIELD_LEFT, width: FIELD_WIDTH, fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', lineHeight: '18px' }}>
            Неадресный склад имеет одну ячейку. Нажмите «Создать ячейку», чтобы добавить её.
            <button onClick={generateGrid} style={{ marginTop: 16, width: '100%', height: 40, borderRadius: 8, border: 'none', backgroundColor: '#666EFE', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Создать ячейку</button>
          </div>
        )}

        <div style={{ position: 'absolute', top: (isAddress ? columnsRowTop + FIELD_HEIGHT + 80 : drumSwitcherTop + 160), left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: 17, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Общее количество ячеек</span>
          </div>
          <div style={{ height: 22, display: 'flex', alignItems: 'center', marginTop: 5 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>{totalActiveCells}</span>
          </div>
        </div>

        <button onClick={hasSelection ? handleClearSelection : undefined} disabled={!hasSelection}
          style={{ ...buttonBaseStyle, bottom: button3Bottom, backgroundColor: 'rgba(45, 64, 89, 0.5)', opacity: hasSelection ? 1 : 0.35, cursor: hasSelection ? 'pointer' : 'default' }}>
          Снять выделение
        </button>

        <button onClick={hasSelection ? handleDeleteSelected : undefined} disabled={!hasSelection}
          style={{ ...buttonBaseStyle, bottom: button2Bottom, backgroundColor: '#FF3052', opacity: hasSelection ? 1 : 0.6, cursor: hasSelection ? 'pointer' : 'default' }}>
          Удалить выбранные ячейки
        </button>

        <button onClick={hasSelection && mergeAllowed ? handleMergeSelected : undefined} disabled={!hasSelection || !mergeAllowed}
          style={{ ...buttonBaseStyle, bottom: button1Bottom, backgroundColor: '#666EFE', opacity: hasSelection && mergeAllowed ? 1 : 0.6, cursor: hasSelection && mergeAllowed ? 'pointer' : 'default' }}>
          Объединить выбранные ячейки
        </button>
      </div>

      <div style={{ ...dividerStyle, left: LEFT_PANEL_WIDTH }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '42px 30px 40px 30px' }}>
        {totalActiveCells > 0 ? renderCells() : (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>
            {isAddress ? 'Задайте параметры сетки и нажмите «Сгенерировать сетку»' : 'Нажмите «Создать ячейку»'}
          </span>
        )}
      </div>

      <div style={{ ...dividerStyle, right: RIGHT_PANEL_WIDTH }} />

      <div style={{ width: RIGHT_PANEL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', textAlign: 'center', padding: '0 30px' }}>
          Правый клик по ячейке — переименовать.<br />Правый клик по объединённой — разъединить.
        </span>
      </div>

      {/* Модалка переименования */}
      {renamingCellId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setRenamingCellId(null)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Имя ячейки</h3>
            <input type="text" value={renamingValue} onChange={e => setRenamingValue(e.target.value)} autoFocus
              style={{ height: 44, borderRadius: 10, border: '1px solid #666EFE', padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D4059', outline: 'none', boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingCellId(null); }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={submitRename} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
              <button onClick={() => setRenamingCellId(null)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationModelGridTab;