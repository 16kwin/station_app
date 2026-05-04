// SchablonTable.tsx — меняю expandedCells на expandedCellId
import React, { useState, useRef, useCallback, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import SchablonTableCell from './SchablonTableCell';

interface TableRow {
  id: number;
  name: string;
}

interface SchablonTableProps {
  isMultiSelect: boolean;
  onEnableMultiSelect: () => void;
}

const SchablonTable: React.FC<SchablonTableProps> = ({ isMultiSelect, onEnableMultiSelect }) => {
  const [selectedDrum, setSelectedDrum] = useState<'left' | 'right'>('left');
  const [selectedColumn, setSelectedColumn] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationHighlight, setAnimationHighlight] = useState<number | null>(null);
  const [selectedCellIds, setSelectedCellIds] = useState<Set<number>>(new Set());
  const [expandedCellId, setExpandedCellId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cellRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

  const rows: TableRow[] = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: `Ячейка ${i + 1}`,
  }));

  const prevMultiSelect = useRef(isMultiSelect);
  useEffect(() => {
    if (prevMultiSelect.current && !isMultiSelect) {
      setSelectedCellIds(new Set());
    }
    prevMultiSelect.current = isMultiSelect;
  }, [isMultiSelect]);

  const scrollToCell = (id: number) => {
    const cellElement = cellRefsMap.current.get(id);
    const container = scrollContainerRef.current;
    if (!cellElement || !container) return;

    const containerRect = container.getBoundingClientRect();
    const cellRect = cellElement.getBoundingClientRect();

    if (cellRect.top < containerRect.top) {
      container.scrollTop -= (containerRect.top - cellRect.top);
    } else if (cellRect.bottom > containerRect.bottom) {
      container.scrollTop += (cellRect.bottom - containerRect.bottom);
    }
  };

  const handleSelect = (id: number, ctrlKey: boolean) => {
    if (ctrlKey || isMultiSelect) {
      if (ctrlKey && !isMultiSelect) {
        onEnableMultiSelect();
      }
      setSelectedCellIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedCellIds(new Set([id]));
    }
  };

  const handleToggleExpand = (id: number) => {
    setExpandedCellId(prev => prev === id ? null : id);
  };

  const setCellRef = (id: number, element: HTMLDivElement | null) => {
    if (element) {
      cellRefsMap.current.set(id, element);
    } else {
      cellRefsMap.current.delete(id);
    }
  };

  useEffect(() => {
    if (isMultiSelect) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCellIds(prev => {
          const currentId = prev.values().next().value || null;
          let newId: number;
          if (currentId === null) {
            newId = rows[0]?.id;
          } else {
            const currentIndex = rows.findIndex(r => r.id === currentId);
            if (e.key === 'ArrowUp') {
              const newIndex = Math.max(0, currentIndex - 1);
              newId = rows[newIndex]?.id || currentId;
            } else {
              const newIndex = Math.min(rows.length - 1, currentIndex + 1);
              newId = rows[newIndex]?.id || currentId;
            }
          }
          setTimeout(() => scrollToCell(newId), 0);
          return new Set([newId]);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMultiSelect, rows]);

  const handleColumnClick = useCallback((targetCol: number) => {
    if (isAnimating || targetCol === selectedColumn) {
      setSelectedColumn(targetCol);
      return;
    }

    setIsAnimating(true);
    const start = selectedColumn;
    const end = targetCol;
    const step = start < end ? 1 : -1;
    let current = start;

    const animate = () => {
      current += step;
      setAnimationHighlight(current);

      if (current === end) {
        animationTimerRef.current = setTimeout(() => {
          setSelectedColumn(end);
          setAnimationHighlight(null);
          setIsAnimating(false);
        }, 50);
      } else {
        animationTimerRef.current = setTimeout(animate, 50);
      }
    };

    animate();

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isAnimating, selectedColumn]);

  const trackHeight = 640 - 80;
  const columns = Array.from({ length: 14 }, (_, i) => i + 1);

  const DRUM_BUTTON_WIDTH = 144;
  const DRUM_GAP = 40;
  const DRUM_LEFT_OFFSET = 30;
  const TEXT_HEIGHT = 17;
  const TEXT_TO_LINE = 7;
  const LINE_THICKNESS = 3;
  const HEADER_HEIGHT = 80;
  const TEXT_TOP = 30;

  const COLUMN_BLOCK_SIZE = 35;
  const COLUMN_LINE_WIDTH = 29;
  const COLUMN_GAP = 14;
  const COLUMN_RIGHT_MARGIN = 30;

  const LINE_TOP = TEXT_TOP + TEXT_HEIGHT + TEXT_TO_LINE;
  const LINE_BOTTOM = HEADER_HEIGHT - LINE_TOP - LINE_THICKNESS;

  const getColumnColor = (col: number) => {
    if (animationHighlight === col) return '#2D4059';
    if (isAnimating) return 'rgba(45, 64, 89, 0.6)';
    return selectedColumn === col ? '#2D4059' : 'rgba(45, 64, 89, 0.6)';
  };

  const getColumnLineColor = (col: number) => {
    if (animationHighlight === col) return '#666EFE';
    if (isAnimating) return 'rgba(45, 64, 89, 0.06)';
    return selectedColumn === col ? '#666EFE' : 'rgba(45, 64, 89, 0.06)';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', height: '640px' }}>
      <div
        style={{
          width: '1183px',
          height: '640px',
          backgroundColor: '#F3F4F6',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Шапка */}
        <div
          style={{
            height: `${HEADER_HEIGHT}px`,
            minHeight: `${HEADER_HEIGHT}px`,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            borderBottom: '1px solid #E5E7EB',
            position: 'relative',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {/* Левая часть — выбор барабана */}
          <div style={{ position: 'relative', width: `${DRUM_LEFT_OFFSET + DRUM_BUTTON_WIDTH + DRUM_GAP + DRUM_BUTTON_WIDTH}px`, height: '100%', flexShrink: 0 }}>
            <button
              onClick={() => setSelectedDrum('left')}
              style={{
                position: 'absolute',
                left: `${DRUM_LEFT_OFFSET}px`,
                top: `${TEXT_TOP}px`,
                width: `${DRUM_BUTTON_WIDTH}px`,
                height: `${TEXT_HEIGHT}px`,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '1px',
                color: selectedDrum === 'left' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                textAlign: 'center',
                lineHeight: `${TEXT_HEIGHT}px`,
                transition: 'color 0.3s ease',
              }}
            >
              Левый барабан
            </button>

            <button
              onClick={() => setSelectedDrum('right')}
              style={{
                position: 'absolute',
                left: `${DRUM_LEFT_OFFSET + DRUM_BUTTON_WIDTH + DRUM_GAP}px`,
                top: `${TEXT_TOP}px`,
                width: `${DRUM_BUTTON_WIDTH}px`,
                height: `${TEXT_HEIGHT}px`,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '1px',
                color: selectedDrum === 'right' ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                textAlign: 'center',
                lineHeight: `${TEXT_HEIGHT}px`,
                transition: 'color 0.3s ease',
              }}
            >
              Правый барабан
            </button>

            <div
              style={{
                position: 'absolute',
                top: `${LINE_TOP}px`,
                left: `${DRUM_LEFT_OFFSET}px`,
                width: `${DRUM_BUTTON_WIDTH}px`,
                height: `${LINE_THICKNESS}px`,
                backgroundColor: selectedDrum === 'left' ? '#666EFE' : 'rgba(45, 64, 89, 0.06)',
                borderRadius: '1.5px',
                transition: 'background-color 0.3s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: `${LINE_TOP}px`,
                left: `${DRUM_LEFT_OFFSET + DRUM_BUTTON_WIDTH + DRUM_GAP}px`,
                width: `${DRUM_BUTTON_WIDTH}px`,
                height: `${LINE_THICKNESS}px`,
                backgroundColor: selectedDrum === 'right' ? '#666EFE' : 'rgba(45, 64, 89, 0.06)',
                borderRadius: '1.5px',
                transition: 'background-color 0.3s ease',
              }}
            />
          </div>

          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '1px',
              color: '#2D4059',
              marginLeft: '87px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            Столбцы:
          </span>

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: `${COLUMN_GAP}px`, marginRight: `${COLUMN_RIGHT_MARGIN}px`, height: '100%', position: 'relative' }}>
            {columns.map((col) => (
              <div key={col} style={{ width: `${COLUMN_BLOCK_SIZE}px`, height: '100%', position: 'relative' }}>
                <button
                  onClick={() => handleColumnClick(col)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: `${TEXT_HEIGHT}px`,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '1px',
                    color: getColumnColor(col),
                    lineHeight: `${TEXT_HEIGHT}px`,
                    textAlign: 'center',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {col}
                </button>

                <div
                  style={{
                    position: 'absolute',
                    bottom: `${LINE_BOTTOM}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${COLUMN_LINE_WIDTH}px`,
                    height: `${LINE_THICKNESS}px`,
                    backgroundColor: getColumnLineColor(col),
                    borderRadius: '1.5px',
                    transition: 'background-color 0.15s ease',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Скроллируемые ячейки */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {rows.map((row) => (
            <SchablonTableCell
              key={row.id}
              row={row}
              isSelected={selectedCellIds.has(row.id)}
              isExpanded={expandedCellId === row.id}
              isMultiSelect={isMultiSelect}
              onSelect={handleSelect}
              onToggleExpand={handleToggleExpand}
              setRef={setCellRef}
            />
          ))}
        </div>
      </div>

      <div style={{ marginLeft: '15px', marginTop: '80px' }}>
        <CustomScrollbar
          scrollContainerRef={scrollContainerRef}
          orientation="vertical"
          trackSize={trackHeight}
        />
      </div>
    </div>
  );
};

export default SchablonTable;