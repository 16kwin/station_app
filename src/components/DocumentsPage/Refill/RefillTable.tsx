// RefillTable.tsx — таблица ячеек документа пополнения
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import CustomScrollbar from '../../elements/CustomScrollbar';
import RefillTableCell from './RefillTableCell';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
  refillQuantity?: number | null;
  stockAvailable?: number | null;
  stockMinStock?: number | null;
  stockCriticalStock?: number | null;
}

interface StockReg { minStock: number | null; criticalStock: number | null; exists: boolean; }

interface RefillTableProps {
  cells: RefillCell[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRefillQuantityChange: (cellUid: string, value: string) => void;
  onCellContextMenu?: (uid: string, e: React.MouseEvent) => void;
  onOpenDetails?: (uid: string) => void;
  onCellDoubleClick?: (uid: string) => void;
  disabled?: boolean;
  searchValue?: string;
  filteredCells?: RefillCell[] | null;
  totalRows?: number;
  totalColumns?: number;
  totalDrums?: number;
  selectedDrum?: number;
  onDrumChange?: (drum: number) => void;
  stockRegs?: Record<string, StockReg>;
  onContextChange?: (column: number, drum: number) => void;
  externalShakeTick?: number;
  onCellValidationChange?: (uid: string, hasError: boolean) => void;
  docRefillUid?: string | null;
}

const snakeClock = {
  start: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  subscribers: new Set<() => void>(),
};

const SnakeBorder: React.FC<{
  width: number;
  height: number;
  radius?: number;
  speed?: number;
  dashLen?: number;
  thickness?: number;
  phase?: number;
}> = ({ width, height, radius = 8, speed = 45, dashLen = 22, thickness = 1.5, phase = 0 }) => {
  const r = Math.min(radius, width / 2, height / 2);
  const wStraight = width - 2 * r;
  const hStraight = height - 2 * r;
  const arc = (Math.PI * r) / 2;
  const perim = 2 * wStraight + 2 * hStraight + 4 * arc;
  const sideLens = [wStraight + arc, hStraight + arc, wStraight + arc, hStraight + arc];

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
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', background: 'transparent' }}>
      <polyline points={points} fill="none" stroke="rgba(102, 110, 254, 0.75)" strokeWidth={thickness} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const RefillTable: React.FC<RefillTableProps> = ({
  cells, selectedIds, onSelectionChange, onRefillQuantityChange,
  onCellContextMenu, onOpenDetails, onCellDoubleClick,
  disabled = false, searchValue, filteredCells = null,
  totalRows = 18, totalColumns = 14, totalDrums = 1, selectedDrum = 1, onDrumChange,
  stockRegs = {},
  onContextChange,
  externalShakeTick = 0,
  onCellValidationChange,
  docRefillUid,
}) => {
  const [selectedColumn, setSelectedColumn] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationHighlight, setAnimationHighlight] = useState<number | null>(null);
  const [expandedCellId, setExpandedCellId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cellRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const TABLE_HEIGHT = 560;
  const HEADER_HEIGHT = 80;
  const ROW_HEIGHT = 80;
  const VISIBLE_ROWS = 6;

  useEffect(() => {
    onContextChange?.(selectedColumn, selectedDrum);
  }, [selectedColumn, selectedDrum, onContextChange]);

  const rows = useMemo(() => {
    const byAddress = new Map<string, RefillCell>();
    const effectiveDrum = totalDrums > 1 ? selectedDrum : (cells[0]?.drumNumber ?? 1);
    cells.forEach(c => {
      const d = c.drumNumber ?? 1;
      if (totalDrums > 1 && d !== selectedDrum) return;
      const col = c.columnNumber ?? 0;
      const row = c.numberCell ?? 0;
      if (col === 0 || row === 0) return;
      byAddress.set(`${d}-${col}-${row}`, c);
    });

    const result: RefillCell[] = [];
    for (let r = 1; r <= totalRows; r++) {
      const key = `${effectiveDrum}-${selectedColumn}-${r}`;
      const existing = byAddress.get(key);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          uid: `empty-${effectiveDrum}-${selectedColumn}-${r}`,
          drumNumber: effectiveDrum,
          columnNumber: selectedColumn,
          numberCell: r,
          cellAssignmentUid: null,
          cellAssignmentName: null,
          cellAssignmentTypeName: null,
          materialUid: null, materialName: null, materialArticle: null,
          templateQuantity: null, factQuantity: null,
          returnToThisCell: false, isIndividual: false,
          refillQuantity: null,
          stockAvailable: null,
          stockMinStock: null,
          stockCriticalStock: null,
        });
      }
    }
    return result;
  }, [cells, selectedColumn, selectedDrum, totalDrums, totalRows]);

  const emptyRows = Math.max(0, VISIBLE_ROWS - rows.length);

  const visibleIds = useMemo(() => rows.map(r => r.uid), [rows]);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllSelected) {
      const next = new Set(selectedIds);
      visibleIds.forEach(id => next.delete(id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      visibleIds.forEach(id => next.add(id));
      onSelectionChange(next);
    }
  };

  const handleRowClick = (uid: string) => {
    const next = new Set(selectedIds);
    if (next.has(uid) && next.size === 1) next.clear();
    else { next.clear(); next.add(uid); }
    onSelectionChange(next);
  };

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    onSelectionChange(next);
  };

  const handleExpandToggle = useCallback((uid: string) => {
    setExpandedCellId(prev => prev === uid ? null : uid);
  }, []);

  const setCellRef = useCallback((uid: string, element: HTMLDivElement | null) => {
    if (element) cellRefsMap.current.set(uid, element);
    else cellRefsMap.current.delete(uid);
  }, []);

  const handleColumnClick = useCallback((targetCol: number) => {
    if (targetCol !== selectedColumn) setExpandedCellId(null);
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

  const firstDrumLeft = HEADER_CHECKBOX_LEFT + HEADER_CHECKBOX_SIZE + CHECKBOX_TO_FIRST_DRUM;
  const secondDrumLeft = firstDrumLeft + DRUM_UNDERLINE_WIDTH + DRUM_GAP_BETWEEN;
  const columnsLabelLeft = secondDrumLeft + DRUM_UNDERLINE_WIDTH + DRUM_TO_COLUMNS_LABEL;

  const headerColumns: { label: string; key: number; originalCol: number }[] = [];
  for (let i = 1; i <= totalColumns; i++) {
    headerColumns.push({ label: String(i), key: i, originalCol: i });
  }

  const isSearchActive = filteredCells !== null;

  const filteredColumnsSet = useMemo(() => {
    if (filteredCells === null) return null;
    const set = new Set<number>();
    filteredCells.forEach(c => { if (c.columnNumber != null) set.add(c.columnNumber); });
    return set;
  }, [filteredCells]);

  const filteredDrumsSet = useMemo(() => {
    if (filteredCells === null) return null;
    const set = new Set<number>();
    filteredCells.forEach(c => { const d = c.drumNumber ?? 1; set.add(d); });
    return set;
  }, [filteredCells]);

  const hasDrumSnake = (drum: number): boolean => {
    if (!isSearchActive) return false;
    if (totalDrums <= 1) return false;
    return filteredDrumsSet?.has(drum) ?? false;
  };

  const hasColumnSnake = (originalCol: number): boolean => {
    if (!isSearchActive) return false;
    return filteredColumnsSet?.has(originalCol) ?? false;
  };

  const DRUM_SNAKE_W = DRUM_LABEL_WIDTH + 10;
  const DRUM_SNAKE_H = DRUM_LABEL_HEIGHT + 8;
  const COL_SNAKE_W = COLUMN_BLOCK_SIZE + 4;
  const COL_SNAKE_H = TEXT_HEIGHT + 8;

  const handleDrumClick = (drum: number) => {
    if (drum === selectedDrum) return;
    onDrumChange?.(drum);
    setExpandedCellId(null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', height: `${TABLE_HEIGHT}px` }}>
      <div style={{ width: '1183px', height: `${TABLE_HEIGHT}px`, backgroundColor: '#F3F4F6', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
        <div style={{ height: `${HEADER_HEIGHT}px`, minHeight: `${HEADER_HEIGHT}px`, backgroundColor: '#FFFFFF', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', borderBottom: '1px solid #E5E7EB', position: 'relative', display: 'flex', alignItems: 'stretch', transition: 'background-color 0.2s ease' }}>

          <div onClick={handleSelectAll}
            style={{ position: 'absolute', left: HEADER_CHECKBOX_LEFT, top: '50%', transform: 'translateY(-50%)', width: HEADER_CHECKBOX_SIZE, height: HEADER_CHECKBOX_SIZE, cursor: 'pointer', zIndex: 5 }}>
            <img src={isAllSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: HEADER_CHECKBOX_SIZE, height: HEADER_CHECKBOX_SIZE, display: 'block' }} />
          </div>

          {totalDrums > 1 && (
            <>
              <div style={{ position: 'absolute', left: firstDrumLeft, top: DRUM_LABEL_TOP, width: DRUM_LABEL_WIDTH, height: DRUM_LABEL_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasDrumSnake(1) && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: DRUM_SNAKE_W, height: DRUM_SNAKE_H, pointerEvents: 'none', zIndex: 4 }}>
                    <SnakeBorder width={DRUM_SNAKE_W} height={DRUM_SNAKE_H} radius={6} speed={45} dashLen={60} thickness={2} />
                  </div>
                )}
                <button onClick={() => handleDrumClick(1)}
                  style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: selectedDrum === 1 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_LABEL_HEIGHT}px`, transition: 'color 0.3s ease' }}>
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
                <button onClick={() => handleDrumClick(2)}
                  style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: selectedDrum === 2 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_LABEL_HEIGHT}px`, transition: 'color 0.3s ease' }}>
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
              const showSnake = hasColumnSnake(hc.originalCol);
              return (
                <div key={hc.key} style={{ width: `${COLUMN_BLOCK_SIZE}px`, height: '100%', position: 'relative' }}>
                  {showSnake && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: COL_SNAKE_W, height: COL_SNAKE_H, pointerEvents: 'none', zIndex: 4 }}>
                      <SnakeBorder width={COL_SNAKE_W} height={COL_SNAKE_H} radius={5} speed={45} dashLen={22} thickness={1.5} />
                    </div>
                  )}
                  <button onClick={() => handleColumnClick(hc.originalCol)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: `${TEXT_HEIGHT}px`, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '1px', color: getColumnColor(hc.originalCol), lineHeight: `${TEXT_HEIGHT}px`, textAlign: 'center', transition: 'color 0.15s ease', zIndex: 5 }}>{hc.label}</button>
                  <div style={{ position: 'absolute', bottom: `${LINE_BOTTOM}px`, left: '50%', transform: 'translateX(-50%)', width: `${COLUMN_LINE_WIDTH}px`, height: `${LINE_THICKNESS}px`, backgroundColor: getColumnLineColor(hc.originalCol), borderRadius: '1.5px', transition: 'background-color 0.15s ease' }} />
                </div>
              );
            })}
          </div>
        </div>
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {rows.map((cell) => {
            const reg = cell.materialUid ? stockRegs[cell.materialUid] : undefined;
            return (
              <RefillTableCell
                key={cell.uid}
                cell={cell}
                isSelected={selectedIds.has(cell.uid)}
                isExpanded={expandedCellId === cell.uid}
                selectedColumn={selectedColumn}
                onRowClick={handleRowClick}
                onCheckboxClick={handleCheckboxClick}
                onExpandToggle={handleExpandToggle}
                onRefillQuantityChange={onRefillQuantityChange}
                onContextMenu={onCellContextMenu}
                onOpenDetails={onOpenDetails}
                onDoubleClick={onCellDoubleClick}
                disabled={disabled}
                searchValue={searchValue}
                setRef={setCellRef}
                stockReg={reg}
                externalShakeTick={externalShakeTick}
                onValidationChange={onCellValidationChange}
                docRefillUid={docRefillUid ?? null}
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

export default RefillTable;