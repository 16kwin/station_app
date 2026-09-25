// SchablonTable.tsx — ПОЛНЫЙ ФАЙЛ (синхронная анимация линии, фикс TS-ошибки)
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import CustomScrollbar from '../../elements/CustomScrollbar';
import SchablonTableCell from './SchablonTableCell';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

interface ModelCell {
  id: string;
  drum?: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
}

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeUid?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
}

interface SchablonTableProps {
  onSelectionChange: (selectedIds: Set<number>) => void;
  onContextChange?: (column: number, drum: number) => void;
  clearSelectionSignal?: number;
  totalRows: number;
  totalColumns: number;
  totalDrums: number;
  cellType: 'postamat' | 'drum';
  selectedDrum: number;
  onDrumChange: (drum: number) => void;
  onCellDoubleClick: (id: number, column: number, selectedIds: Set<number>) => void;
  isBlurred: boolean;
  modelCells: ModelCell[];
  cellsData: CellData[];
  filteredCells?: CellData[] | null;
  highlightText?: string;
  onCellCleared: () => void;
  onOpenDetails: (rowId: number, column: number, cellData?: CellData) => void;
  onOpenView: (rowId: number, column: number, cellData?: CellData) => void;
  onCellLocalClear: (rowId: number, column: number, drum: number) => void;
}

// === Глобальные часы для синхронизации всех "змеек" ===
// Все SnakeBorder используют один источник времени и одну скорость,
// поэтому двигаются абсолютно синхронно, независимо от момента включения.
const snakeClock = {
  start: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  subscribers: new Set<() => void>(),
};

// === Непрерывно движущаяся линия по периметру со скруглением ===
// Позиция головы зависит только от глобального времени и длины периметра,
// поэтому в момент появления линия всегда находится в одной и той же "фазе".
const SnakeBorder: React.FC<{
  width: number;
  height: number;
  radius?: number;
  speed?: number;       // px/сек
  dashLen?: number;     // длина видимой "змейки"
  thickness?: number;
  phase?: number;       // смещение фазы, 0..1 (по умолчанию 0 — синхронно)
}> = ({ width, height, radius = 8, speed = 45, dashLen = 22, thickness = 1.5, phase = 0 }) => {
  const r = Math.min(radius, width / 2, height / 2);
  const wStraight = width - 2 * r;
  const hStraight = height - 2 * r;
  const arc = (Math.PI * r) / 2;
  const perim = 2 * wStraight + 2 * hStraight + 4 * arc;
  const sideLens = [wStraight + arc, hStraight + arc, wStraight + arc, hStraight + arc];

  // Точка на периметре в пикселях
  const pointAt = (d: number): { x: number; y: number } => {
    d = ((d % perim) + perim) % perim;
    let acc = 0;
    if (d <= acc + sideLens[0]) {
      const local = d - acc;
      if (local <= wStraight) return { x: r + local, y: 0 };
      const a = local - wStraight;
      const angle = -Math.PI / 2 + (a / arc) * (Math.PI / 2);
      return { x: width - r + Math.cos(angle) * r, y: r + Math.sin(angle) * r };
    }
    acc += sideLens[0];
    if (d <= acc + sideLens[1]) {
      const local = d - acc;
      if (local <= hStraight) return { x: width, y: r + local };
      const a = local - hStraight;
      const angle = 0 + (a / arc) * (Math.PI / 2);
      return { x: width - r + Math.cos(angle) * r, y: height - r + Math.sin(angle) * r };
    }
    acc += sideLens[1];
    if (d <= acc + sideLens[2]) {
      const local = d - acc;
      if (local <= wStraight) return { x: width - r - local, y: height };
      const a = local - wStraight;
      const angle = Math.PI / 2 + (a / arc) * (Math.PI / 2);
      return { x: r + Math.cos(angle) * r, y: height - r + Math.sin(angle) * r };
    }
    acc += sideLens[2];
    {
      const local = d - acc;
      if (local <= hStraight) return { x: 0, y: height - r - local };
      const a = local - hStraight;
      const angle = Math.PI + (a / arc) * (Math.PI / 2);
      return { x: r + Math.cos(angle) * r, y: r + Math.sin(angle) * r };
    }
  };

  // Рисуем позицию на основе глобального времени — синхронно для всех
  const [head, setHead] = useState(() => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t = (now - snakeClock.start) / 1000;
    return ((t * speed + phase * perim) % perim + perim) % perim;
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const t = (now - snakeClock.start) / 1000;
      const next = ((t * speed + phase * perim) % perim + perim) % perim;
      setHead(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, perim, phase]);

  const tail = ((head - dashLen) % perim + perim) % perim;

  const points: string = useMemo(() => {
    const total = ((head - tail) % perim + perim) % perim;
    if (total <= 0.001) return '';
    const steps = Math.max(8, Math.ceil(total / 2));
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const d = (tail + (total * i) / steps) % perim;
      const p = pointAt(d);
      pts.push(`${p.x},${p.y}`);
    }
    return pts.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head, tail, perim, width, height, radius]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', background: 'transparent' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgba(102, 110, 254, 0.75)"
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SchablonTable: React.FC<SchablonTableProps> = ({
  onSelectionChange,
  onContextChange,
  clearSelectionSignal,
  totalRows, totalColumns, totalDrums, cellType,
  selectedDrum, onDrumChange, onCellDoubleClick, isBlurred,
  modelCells, cellsData, filteredCells = null, highlightText,
  onOpenDetails, onOpenView, onCellLocalClear
}) => {
  const [selectedColumn, setSelectedColumn] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationHighlight, setAnimationHighlight] = useState<number | null>(null);
  const [selectedCellIds, setSelectedCellIds] = useState<Set<number>>(new Set());
  const [expandedCellId, setExpandedCellId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cellRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

  const TABLE_HEIGHT = 560;
  const HEADER_HEIGHT = 80;
  const ROW_HEIGHT = 80;
  const VISIBLE_ROWS = 6;

  useEffect(() => {
    onContextChange?.(selectedColumn, selectedDrum);
  }, [selectedColumn, selectedDrum, onContextChange]);

  useEffect(() => {
    if (clearSelectionSignal !== undefined) setSelectedCellIds(new Set());
  }, [clearSelectionSignal]);

  const displayModelCells = cellType === 'drum'
    ? modelCells.filter(c => c.drum === selectedDrum && !c.deleted)
    : modelCells.filter(c => !c.deleted);

  const mergedColumns = new Map<number, { colStart: number; colEnd: number }>();
  displayModelCells.forEach(mc => {
    if (mc.colSpan > 1) {
      const colStart = mc.column;
      const colEnd = mc.column + mc.colSpan - 1;
      for (let c = colStart; c <= colEnd; c++) mergedColumns.set(c, { colStart, colEnd });
    }
  });

  const headerColumns: { label: string; key: number; originalCol: number }[] = [];
  for (let i = 1; i <= totalColumns; i++) {
    const merged = mergedColumns.get(i);
    if (merged) {
      if (i === merged.colStart) {
        headerColumns.push({ label: `${merged.colStart}-${merged.colEnd}`, key: merged.colStart, originalCol: i });
      }
    } else {
      headerColumns.push({ label: String(i), key: i, originalCol: i });
    }
  }

  const filteredKeys = useMemo(() => {
    if (filteredCells === null) return null;
    const keys = new Set<string>();
    filteredCells.forEach(c => {
      keys.add(`${c.drumNumber ?? 0}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`);
    });
    return keys;
  }, [filteredCells]);

  const filteredColumnsSet = useMemo(() => {
    if (filteredCells === null) return null;
    const set = new Set<number>();
    filteredCells.forEach(c => {
      if (c.columnNumber != null) set.add(c.columnNumber);
    });
    return set;
  }, [filteredCells]);

  const filteredDrumsSet = useMemo(() => {
    if (filteredCells === null) return null;
    const set = new Set<number>();
    filteredCells.forEach(c => {
      const d = c.drumNumber ?? 1;
      set.add(d);
    });
    return set;
  }, [filteredCells]);

  const isSearchActive = filteredCells !== null;

  const rows = useMemo(() => {
    const baseRows = displayModelCells
      .filter(mc => mc.column === selectedColumn)
      .map(mc => ({
        id: mc.row,
        name: `Ячейка ${mc.row}`,
        isMerged: mc.colSpan > 1 || mc.rowSpan > 1,
        mergeCount: mc.colSpan * mc.rowSpan,
        rowStart: mc.row,
        rowEnd: mc.row + mc.rowSpan - 1,
        colStart: mc.column,
        colEnd: mc.column + mc.colSpan - 1,
      }))
      .sort((a, b) => a.rowStart - b.rowStart);

    if (filteredKeys === null) return baseRows;

    return baseRows.filter(r => {
      const key = `${selectedDrum}-${selectedColumn}-${r.id}`;
      return filteredKeys.has(key);
    });
  }, [displayModelCells, selectedColumn, filteredKeys, selectedDrum]);

  const emptyRows = Math.max(0, VISIBLE_ROWS - rows.length);

  useEffect(() => { onSelectionChange(selectedCellIds); }, [selectedCellIds, onSelectionChange]);

  const scrollToCell = (id: number) => {
    const cellElement = cellRefsMap.current.get(id);
    const container = scrollContainerRef.current;
    if (!cellElement || !container) return;
    const containerRect = container.getBoundingClientRect();
    const cellRect = cellElement.getBoundingClientRect();
    if (cellRect.top < containerRect.top) container.scrollTop -= (containerRect.top - cellRect.top);
    else if (cellRect.bottom > containerRect.bottom) container.scrollTop += (cellRect.bottom - containerRect.bottom);
  };

  const handleRowClick = (id: number) => {
    setSelectedCellIds(prev => prev.has(id) && prev.size === 1 ? new Set() : new Set([id]));
  };

  const handleCheckboxClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCellIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visibleIds = useMemo(() => rows.map(r => r.id), [rows]);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedCellIds.has(id));

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllSelected) {
      setSelectedCellIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedCellIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleDoubleClick = (id: number) => {
    onCellDoubleClick(id, selectedColumn, selectedCellIds);
  };

  const setCellRef = (id: number, element: HTMLDivElement | null) => {
    if (element) cellRefsMap.current.set(id, element);
    else cellRefsMap.current.delete(id);
  };

  const handleExpandToggle = useCallback((id: number) => {
    setExpandedCellId(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCellIds(prev => {
          const currentId = prev.values().next().value || null;
          let newId: number;
          if (currentId === null) newId = rows[0]?.id || 1;
          else {
            const currentIndex = rows.findIndex(r => r.id === currentId);
            newId = e.key === 'ArrowUp' ? rows[Math.max(0, currentIndex - 1)]?.id || currentId : rows[Math.min(rows.length - 1, currentIndex + 1)]?.id || currentId;
          }
          setTimeout(() => scrollToCell(newId), 0);
          return new Set([newId]);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rows]);

  const handleColumnClick = useCallback((targetCol: number) => {
    if (targetCol !== selectedColumn) {
      setSelectedCellIds(new Set());
      setExpandedCellId(null);
    }
    if (isAnimating || targetCol === selectedColumn) { setSelectedColumn(targetCol); return; }
    setIsAnimating(true);
    const start = selectedColumn, end = targetCol, step = start < end ? 1 : -1;
    let current = start;
    const animate = () => {
      current += step;
      setAnimationHighlight(current);
      if (current === end) animationTimerRef.current = setTimeout(() => { setSelectedColumn(end); setAnimationHighlight(null); setIsAnimating(false); }, 50);
      else animationTimerRef.current = setTimeout(animate, 50);
    };
    animate();
  }, [isAnimating, selectedColumn]);

  useEffect(() => { return () => { if (animationTimerRef.current) clearTimeout(animationTimerRef.current); }; }, []);

  const trackHeight = TABLE_HEIGHT - HEADER_HEIGHT;

  const TEXT_HEIGHT = 17;
  const LINE_THICKNESS = 3;
  const COLUMN_BLOCK_SIZE = 35, COLUMN_LINE_WIDTH = 29, COLUMN_GAP = 14;

  const TEXT_TOP = 30;
  const TEXT_TO_LINE = 7;
  const LINE_TOP = TEXT_TOP + TEXT_HEIGHT + TEXT_TO_LINE;
  const LINE_BOTTOM = HEADER_HEIGHT - LINE_TOP - LINE_THICKNESS;

  const HEADER_CHECKBOX_LEFT = 20;
  const HEADER_CHECKBOX_SIZE = 18;

  const DRUM_LABEL_WIDTH = 128;
  const DRUM_LABEL_HEIGHT = 18;
  const DRUM_LABEL_TOP = 27;
  const DRUM_UNDERLINE_TOP = DRUM_LABEL_TOP + DRUM_LABEL_HEIGHT + 8;
  const DRUM_UNDERLINE_WIDTH = 128;
  const CHECKBOX_TO_FIRST_DRUM = 35;
  const DRUM_GAP_BETWEEN = 34;
  const DRUM_TO_COLUMNS_LABEL = 45;

  const getColumnColor = (col: number) => animationHighlight === col ? '#2D4059' : isAnimating ? 'rgba(45, 64, 89, 0.6)' : selectedColumn === col ? '#2D4059' : 'rgba(45, 64, 89, 0.6)';
  const getColumnLineColor = (col: number) => animationHighlight === col ? '#666EFE' : isAnimating ? 'rgba(45, 64, 89, 0.06)' : selectedColumn === col ? '#666EFE' : 'rgba(45, 64, 89, 0.06)';

  const handleDrumClick = (drum: number) => {
    if (drum === selectedDrum) return;
    onDrumChange(drum);
    setSelectedCellIds(new Set());
    setExpandedCellId(null);
  };

  const getCellDataForRow = (row: { id: number }): CellData | undefined => {
    return cellsData.find(cd =>
      cd.numberCell === row.id &&
      cd.columnNumber === selectedColumn &&
      (cd.drumNumber == null || cd.drumNumber === selectedDrum)
    );
  };

  const handleCellClear = useCallback((rowStart: number) => {
    if (selectedCellIds.size > 1) {
      selectedCellIds.forEach(id => onCellLocalClear(id, selectedColumn, selectedDrum));
      setSelectedCellIds(new Set());
      return;
    }
    onCellLocalClear(rowStart, selectedColumn, selectedDrum);
  }, [onCellLocalClear, selectedColumn, selectedDrum, selectedCellIds]);

  const headerBgColor = '#FFFFFF';

  const firstDrumLeft = HEADER_CHECKBOX_LEFT + HEADER_CHECKBOX_SIZE + CHECKBOX_TO_FIRST_DRUM;
  const secondDrumLeft = firstDrumLeft + DRUM_UNDERLINE_WIDTH + DRUM_GAP_BETWEEN;
  const columnsLabelLeft = secondDrumLeft + DRUM_UNDERLINE_WIDTH + DRUM_TO_COLUMNS_LABEL;

  const hasDrumSnake = (drum: number): boolean => {
    if (!isSearchActive) return false;
    if (totalDrums <= 1) return false;
    return filteredDrumsSet?.has(drum) ?? false;
  };

  const hasColumnSnake = (originalCol: number): boolean => {
    if (!isSearchActive) return false;
    const merged = mergedColumns.get(originalCol);
    if (merged) {
      for (let c = merged.colStart; c <= merged.colEnd; c++) {
        if (filteredColumnsSet?.has(c)) return true;
      }
      return false;
    }
    return filteredColumnsSet?.has(originalCol) ?? false;
  };

  const DRUM_SNAKE_W = DRUM_LABEL_WIDTH + 10;
  const DRUM_SNAKE_H = DRUM_LABEL_HEIGHT + 8;
  const COL_SNAKE_W = COLUMN_BLOCK_SIZE + 4;
  const COL_SNAKE_H = TEXT_HEIGHT + 8;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', height: `${TABLE_HEIGHT}px` }}>
      <div style={{ width: '1183px', height: `${TABLE_HEIGHT}px`, backgroundColor: '#F3F4F6', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', filter: isBlurred ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: isBlurred ? 'none' : 'auto' }}>
        <div style={{ height: `${HEADER_HEIGHT}px`, minHeight: `${HEADER_HEIGHT}px`, backgroundColor: headerBgColor, borderTopLeftRadius: '10px', borderTopRightRadius: '10px', borderBottom: '1px solid #E5E7EB', position: 'relative', display: 'flex', alignItems: 'stretch', transition: 'background-color 0.2s ease' }}>

          <div
            onClick={handleSelectAll}
            style={{
              position: 'absolute', left: HEADER_CHECKBOX_LEFT, top: '50%', transform: 'translateY(-50%)',
              width: HEADER_CHECKBOX_SIZE, height: HEADER_CHECKBOX_SIZE, cursor: 'pointer', zIndex: 5,
            }}
          >
            <img
              src={isAllSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack}
              alt=""
              style={{ width: HEADER_CHECKBOX_SIZE, height: HEADER_CHECKBOX_SIZE, display: 'block' }}
            />
          </div>

          {totalDrums > 1 && (
            <>
              <div style={{ position: 'absolute', left: firstDrumLeft, top: DRUM_LABEL_TOP, width: DRUM_LABEL_WIDTH, height: DRUM_LABEL_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasDrumSnake(1) && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: DRUM_SNAKE_W, height: DRUM_SNAKE_H, pointerEvents: 'none', zIndex: 4 }}>
                    <SnakeBorder width={DRUM_SNAKE_W} height={DRUM_SNAKE_H} radius={6} speed={45} dashLen={60} thickness={2} />
                  </div>
                )}
                <button
                  onClick={() => handleDrumClick(1)}
                  style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: selectedDrum === 1 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_LABEL_HEIGHT}px`, transition: 'color 0.3s ease' }}
                >
                  Левый барабан
                </button>
              </div>
              <div style={{ position: 'absolute', left: firstDrumLeft, top: DRUM_UNDERLINE_TOP, width: DRUM_UNDERLINE_WIDTH, height: LINE_THICKNESS, backgroundColor: selectedDrum === 1 ? '#666EFE' : 'rgba(45, 64, 89, 0.06)', borderRadius: '1.5px', transition: 'background-color 0.3s ease' }} />

              <div style={{ position: 'absolute', left: secondDrumLeft, top: DRUM_LABEL_TOP, width: DRUM_LABEL_WIDTH, height: DRUM_LABEL_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasDrumSnake(2) && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: DRUM_SNAKE_W, height: DRUM_SNAKE_H, pointerEvents: 'none', zIndex: 4 }}>
                    <SnakeBorder width={DRUM_SNAKE_W} height={DRUM_SNAKE_H} radius={6} speed={45} dashLen={60} thickness={2} />
                  </div>
                )}
                <button
                  onClick={() => handleDrumClick(2)}
                  style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: selectedDrum === 2 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_LABEL_HEIGHT}px`, transition: 'color 0.3s ease' }}
                >
                  Правый барабан
                </button>
              </div>
              <div style={{ position: 'absolute', left: secondDrumLeft, top: DRUM_UNDERLINE_TOP, width: DRUM_UNDERLINE_WIDTH, height: LINE_THICKNESS, backgroundColor: selectedDrum === 2 ? '#666EFE' : 'rgba(45, 64, 89, 0.06)', borderRadius: '1.5px', transition: 'background-color 0.3s ease' }} />
            </>
          )}

          <span style={{
            position: 'absolute',
            left: totalDrums > 1 ? columnsLabelLeft : HEADER_CHECKBOX_LEFT + HEADER_CHECKBOX_SIZE + 56,
            top: totalDrums > 1 ? 30 : '50%',
            transform: totalDrums > 1 ? 'none' : 'translateY(-50%)',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '1px',
            color: '#2D4059', whiteSpace: 'nowrap', height: totalDrums > 1 ? TEXT_HEIGHT : 'auto',
            lineHeight: `${TEXT_HEIGHT}px`,
          }}>
            Столбцы:
          </span>

          <div style={{ display: 'flex', gap: `${COLUMN_GAP}px`, height: '100%', position: 'relative', marginLeft: 'auto', marginRight: '30px' }}>
            {headerColumns.map((hc) => {
              const merged = mergedColumns.get(hc.originalCol);
              const blockWidth = merged && hc.originalCol === merged.colStart ? COLUMN_BLOCK_SIZE * (merged.colEnd - merged.colStart + 1) + COLUMN_GAP * (merged.colEnd - merged.colStart) : COLUMN_BLOCK_SIZE;
              const showSnake = hasColumnSnake(hc.originalCol);
              return (
                <div key={hc.key} style={{ width: `${blockWidth}px`, height: '100%', position: 'relative' }}>
                  {showSnake && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: COL_SNAKE_W, height: COL_SNAKE_H, pointerEvents: 'none', zIndex: 4 }}>
                      <SnakeBorder width={COL_SNAKE_W} height={COL_SNAKE_H} radius={5} speed={45} dashLen={22} thickness={1.5} />
                    </div>
                  )}
                  <button onClick={() => handleColumnClick(hc.originalCol)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: `${TEXT_HEIGHT}px`, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '1px', color: getColumnColor(hc.originalCol), lineHeight: `${TEXT_HEIGHT}px`, textAlign: 'center', transition: 'color 0.15s ease', zIndex: 5 }}>{hc.label}</button>
                  <div style={{ position: 'absolute', bottom: `${LINE_BOTTOM}px`, left: '50%', transform: 'translateX(-50%)', width: `${merged ? COLUMN_LINE_WIDTH * (merged.colEnd - merged.colStart + 1) + COLUMN_GAP * (merged.colEnd - merged.colStart) : COLUMN_LINE_WIDTH}px`, height: `${LINE_THICKNESS}px`, backgroundColor: getColumnLineColor(hc.originalCol), borderRadius: '1.5px', transition: 'background-color 0.15s ease' }} />
                </div>
              );
            })}
          </div>
        </div>
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {rows.map((row) => {
            const cellData = getCellDataForRow(row);
            return (
              <SchablonTableCell
                key={row.id}
                row={row}
                isSelected={selectedCellIds.has(row.id)}
                selectedColumn={selectedColumn}
                isMerged={row.isMerged}
                mergeCount={row.mergeCount}
                rowStart={row.rowStart}
                rowEnd={row.rowEnd}
                colStart={row.colStart}
                colEnd={row.colEnd}
                cellData={cellData}
                highlightText={highlightText}
                onRowClick={handleRowClick}
                onCheckboxClick={handleCheckboxClick}
                onDoubleClick={handleDoubleClick}
                onClear={() => handleCellClear(row.rowStart)}
                onOpenDetails={() => onOpenDetails(row.rowStart, selectedColumn, cellData)}
                onOpenView={() => onOpenView(row.rowStart, selectedColumn, cellData)}
                setRef={setCellRef}
                expandedCellId={expandedCellId}
                onExpandToggle={handleExpandToggle}
                multiSelectCount={selectedCellIds.size}
              />
            );
          })}
          {Array.from({ length: emptyRows }).map((_, i) => <div key={`empty-${i}`} style={{ height: `${ROW_HEIGHT}px`, backgroundColor: '#FFFFFF', boxSizing: 'border-box', borderTop: '0.5px solid #E5E7EB', borderBottom: '0.5px solid #E5E7EB' }} />)}
        </div>
      </div>
      <div style={{ marginLeft: '15px', marginTop: `${HEADER_HEIGHT}px` }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={trackHeight} /></div>
    </div>
  );
};

export default SchablonTable;