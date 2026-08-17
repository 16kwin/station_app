// DataTable.tsx — ПОЛНЫЙ ФАЙЛ (скроллбар под шапкой)
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../components/CustomScrollbar';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import CheckboxIcon18OffBlack from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OffWhite from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffWhite.svg';
import CheckboxIcon18OffGray from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffGray.svg';
import CheckboxIcon18OnBlue from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CheckboxIcon18OnWhite from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OnWhite.svg';
import ContextMenuOpenIcon16 from '../../assets/Icons/OpenIcons/OpenIcon16Black.svg';
import ContextMenuCopyIcon16 from '../../assets/Icons/CopyIcons/CopyIcon16Black.svg';
import ContextMenuDeleteIcon16 from '../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';

interface ColumnItem { key: string; label: string; }
interface ColumnLayout { key: string; label: string; left: number; width: number; }

interface DataTableProps {
  columns: ColumnItem[];
  visibleKeys: string[];
  data: Array<{ [key: string]: any }>;
  selectedIds: Set<string>;
  onCheckboxClick: (uid: string, e: React.MouseEvent) => void;
  onSelectAll: (e: React.MouseEvent) => void;
  onRowClick: (uid: string, e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, uid: string, name: string) => void;
  onDoubleClick: (uid: string, name: string) => void;
  renderCell: (key: string, item: any) => string;
  isGrayColumn?: (key: string) => boolean;
  tableWidth?: number; rowHeight?: number; headerHeight?: number; visibleRows?: number;
  checkboxLeft?: number; firstColLeft?: number; minGap?: number; colPadding?: number;
  scrollOffset?: number; headerColor?: string; selectedColor?: string; borderColor?: string;
  rowIcon?: string; rowIconSize?: number; noWrapColumns?: string[];
  highlightText?: string;
  initialWidths?: Record<string, number>;
  onWidthsChange?: (widths: Record<string, number>) => void;
  rowContextMenuItems?: (uid: string, name: string) => ContextMenuItem[];
  requiredColumns?: Set<string>;
  onResetToBase?: () => void;
}

const MAX_COLUMN_WIDTH = 1000;
const RESIZER_WIDTH = 60;
const LAST_COLUMN_RIGHT_PADDING = 30;
const CHECKBOX_BLOCK_WIDTH = 24;
const ROW_ICON_BLOCK_WIDTH = 20;
const CHECKBOX_TO_ICON_GAP = 17;
const ICON_TO_FIRST_TEXT = 17;
const CHECKBOX_LEFT = 17;

const getTextWidth = (text: string, fontSize: number, fontWeight: number): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * (fontSize * 0.6);
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  return ctx.measureText(text).width;
};

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

const DataTable: React.FC<DataTableProps> = ({
  columns, visibleKeys, data, selectedIds,
  onCheckboxClick, onSelectAll, onRowClick, onContextMenu, onDoubleClick,
  renderCell, isGrayColumn,
  tableWidth = 1720, rowHeight = 58, headerHeight = 58, visibleRows = 10,
  checkboxLeft = CHECKBOX_LEFT, firstColLeft = 47, minGap = 0, colPadding = 0,
  scrollOffset = 15, headerColor = '#666EFE', selectedColor = '#DEEEFF', borderColor = '#E5ECF5',
  rowIcon, rowIconSize = 20, noWrapColumns = [],
  highlightText,
  initialWidths,
  onWidthsChange,
  rowContextMenuItems,
  requiredColumns = new Set(),
  onResetToBase,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [customWidths, setCustomWidths] = useState<Record<string, number>>(initialWidths || {});
  const prevColumnCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const [resizing, setResizing] = useState<{ 
    columnKey: string; 
    startX: number; 
    startWidth: number; 
    allWidths: Record<string, number>;
    visibleColumns: ColumnItem[];
  } | null>(null);
  
  const [headerContextMenu, setHeaderContextMenu] = useState<{ x: number; y: number; columnKey: string } | null>(null);
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; uid: string; name: string; items: ContextMenuItem[] } | null>(null);

  const tableHeight = rowHeight * visibleRows + headerHeight;
  
  const effectiveFirstColLeft = CHECKBOX_LEFT + CHECKBOX_BLOCK_WIDTH + CHECKBOX_TO_ICON_GAP + ROW_ICON_BLOCK_WIDTH + ICON_TO_FIRST_TEXT;
  
  const baseAvailableWidth = tableWidth - effectiveFirstColLeft - LAST_COLUMN_RIGHT_PADDING;

  const getMinWidth = useCallback((col: ColumnItem): number => {
    return getTextWidth(col.label.charAt(0).toUpperCase() + col.label.slice(1), 16, 600) + 1;
  }, []);

  const getContentWidth = useCallback((col: ColumnItem): number => {
    let maxWidth = getMinWidth(col);
    
    data.forEach(item => {
      const cellText = renderCell(col.key, item);
      const textWidth = getTextWidth(cellText, 15, 400);
      if (textWidth + 1 > maxWidth) {
        maxWidth = textWidth + 1;
      }
    });
    
    return Math.min(maxWidth, MAX_COLUMN_WIDTH);
  }, [data, renderCell, getMinWidth]);

  const handleColumnFitContent = useCallback((columnKey: string) => {
    const col = columns.find(c => c.key === columnKey);
    if (!col) return;
    
    const newWidth = getContentWidth(col);
    setCustomWidths(prev => {
      const next = { ...prev, [columnKey]: newWidth };
      if (onWidthsChange) onWidthsChange(next);
      return next;
    });
  }, [columns, getContentWidth, onWidthsChange]);

  const handleAllColumnsFitContent = useCallback(() => {
    const visibleColumns = columns.filter(c => visibleKeys.includes(c.key));
    const newWidths: Record<string, number> = { ...customWidths };
    
    visibleColumns.forEach(col => {
      newWidths[col.key] = getContentWidth(col);
    });
    
    setCustomWidths(newWidths);
    if (onWidthsChange) onWidthsChange(newWidths);
  }, [columns, visibleKeys, customWidths, getContentWidth, onWidthsChange]);

  const handleResetToBase = useCallback(() => {
    setHeaderContextMenu(null);
    if (onResetToBase) {
      onResetToBase();
    }
  }, [onResetToBase]);

  const headerContextMenuItems: ContextMenuItem[] = [
    { id: 'fit-column', label: 'Столбец по размеру содержимого', icon: ContextMenuOpenIcon16, onClick: () => { 
      if (headerContextMenu) handleColumnFitContent(headerContextMenu.columnKey);
      setHeaderContextMenu(null);
    } },
    { id: 'fit-all', label: 'Все столбцы по размеру содержимого', icon: ContextMenuCopyIcon16, onClick: () => { 
      handleAllColumnsFitContent();
      setHeaderContextMenu(null);
    } },
    { id: 'reset', label: 'Вид по умолчанию', icon: ContextMenuDeleteIcon16, onClick: () => { 
      handleResetToBase();
    } },
  ];

  const handleHeaderContextMenu = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderContextMenu({ x: e.clientX, y: e.clientY, columnKey });
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, uid: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (rowContextMenuItems) {
      const items = rowContextMenuItems(uid, name);
      setRowContextMenu({ x: e.clientX, y: e.clientY, uid, name, items });
    } else if (onContextMenu) {
      onContextMenu(e, uid, name);
    }
  }, [rowContextMenuItems, onContextMenu]);

  useEffect(() => {
    if (!headerContextMenu) return;
    const h = () => setHeaderContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [headerContextMenu]);

  useEffect(() => {
    if (!rowContextMenu) return;
    const h = () => setRowContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [rowContextMenu]);

  const columnLayout = useMemo(() => {
    const visibleColumns = columns.filter(c => visibleKeys.includes(c.key));
    if (visibleColumns.length === 0) return { layout: [] as ColumnLayout[], contentWidth: tableWidth, widths: {} as Record<string, number> };

    const widths: Record<string, number> = {};
    
    const minWidths: Record<string, number> = {};
    visibleColumns.forEach(col => {
      minWidths[col.key] = getMinWidth(col);
    });
    
    visibleColumns.forEach(col => {
      if (customWidths[col.key]) {
        widths[col.key] = customWidths[col.key];
      } else {
        widths[col.key] = minWidths[col.key];
      }
    });

    const layout: ColumnLayout[] = [];
    let currentLeft = effectiveFirstColLeft;
    visibleColumns.forEach((col) => {
      layout.push({ key: col.key, label: col.label.charAt(0).toUpperCase() + col.label.slice(1), left: currentLeft, width: widths[col.key] });
      currentLeft += widths[col.key] + RESIZER_WIDTH;
    });
    
    const realContentWidth = currentLeft - RESIZER_WIDTH + LAST_COLUMN_RIGHT_PADDING;
    const contentWidth = Math.max(tableWidth, realContentWidth);
    
    return { layout, contentWidth, widths, minWidths };
  }, [columns, visibleKeys, tableWidth, effectiveFirstColLeft, customWidths, baseAvailableWidth, getMinWidth]);

  useEffect(() => {
    const visibleColumns = columns.filter(c => visibleKeys.includes(c.key));
    const currentCount = visibleColumns.length;
    
    if (currentCount === 0) return;
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      prevColumnCountRef.current = currentCount;
      
      if (!initialWidths || Object.keys(initialWidths).length === 0) {
        const minWidths: Record<string, number> = {};
        visibleColumns.forEach(col => {
          minWidths[col.key] = getMinWidth(col);
        });
        
        const totalResizerWidth = RESIZER_WIDTH * (visibleColumns.length - 1);
        const totalMinWidth = visibleColumns.reduce((sum, col) => sum + minWidths[col.key], 0);
        const availableForColumns = baseAvailableWidth - totalResizerWidth;
        
        if (totalMinWidth <= availableForColumns) {
          const remaining = availableForColumns - totalMinWidth;
          const extraPerColumn = remaining / visibleColumns.length;
          const newWidths: Record<string, number> = {};
          visibleColumns.forEach(col => {
            newWidths[col.key] = minWidths[col.key] + extraPerColumn;
          });
          setCustomWidths(newWidths);
          if (onWidthsChange) onWidthsChange(newWidths);
        } else {
          const newWidths: Record<string, number> = {};
          visibleColumns.forEach(col => {
            newWidths[col.key] = minWidths[col.key];
          });
          setCustomWidths(newWidths);
          if (onWidthsChange) onWidthsChange(newWidths);
        }
      }
      return;
    }
    
    if (prevColumnCountRef.current !== currentCount) {
      prevColumnCountRef.current = currentCount;
      
      const minWidths: Record<string, number> = {};
      visibleColumns.forEach(col => {
        minWidths[col.key] = getMinWidth(col);
      });
      
      const totalResizerWidth = RESIZER_WIDTH * (visibleColumns.length - 1);
      const totalMinWidth = visibleColumns.reduce((sum, col) => sum + minWidths[col.key], 0);
      const availableForColumns = baseAvailableWidth - totalResizerWidth;
      
      const allFit = totalMinWidth <= availableForColumns;
      
      const newWidths: Record<string, number> = {};
      
      if (allFit) {
        const remaining = availableForColumns - totalMinWidth;
        const extraPerColumn = remaining / visibleColumns.length;
        visibleColumns.forEach(col => {
          newWidths[col.key] = minWidths[col.key] + extraPerColumn;
        });
      } else {
        visibleColumns.forEach(col => {
          if (customWidths[col.key] && customWidths[col.key] > 0) {
            newWidths[col.key] = customWidths[col.key];
          } else {
            newWidths[col.key] = minWidths[col.key];
          }
        });
      }
      
      setCustomWidths(newWidths);
      if (onWidthsChange) onWidthsChange(newWidths);
    }
  }, [columns, visibleKeys, baseAvailableWidth, getMinWidth, initialWidths, customWidths, onWidthsChange]);

  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const visibleColumns = columns.filter(c => visibleKeys.includes(c.key));
    const widths: Record<string, number> = {};
    visibleColumns.forEach(col => {
      widths[col.key] = columnLayout.widths[col.key] || getMinWidth(col);
    });
    
    setResizing({ 
      columnKey, 
      startX: e.clientX, 
      startWidth: widths[columnKey] || getMinWidth(visibleColumns.find(c => c.key === columnKey)!),
      allWidths: widths,
      visibleColumns,
    });
  }, [columns, visibleKeys, columnLayout, getMinWidth]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setHasVerticalScroll(container.scrollHeight > container.clientHeight + 1);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const { columnKey, startWidth, allWidths, visibleColumns } = resizing;
      
      const colIndex = visibleColumns.findIndex(c => c.key === columnKey);
      if (colIndex === -1) return;
      
      const newWidths: Record<string, number> = { ...allWidths };
      
      const minWidth = getMinWidth(visibleColumns[colIndex]);
      
      if (delta > 0) {
        const maxGrow = MAX_COLUMN_WIDTH - startWidth;
        if (maxGrow <= 0) return;
        
        const actualGrow = Math.min(delta, maxGrow);
        
        let remainingToShrink = actualGrow;
        for (let i = colIndex + 1; i < visibleColumns.length && remainingToShrink > 0; i++) {
          const key = visibleColumns[i].key;
          const rightMin = getMinWidth(visibleColumns[i]);
          const shrinkable = newWidths[key] - rightMin;
          const shrink = Math.min(shrinkable, remainingToShrink);
          newWidths[key] -= shrink;
          remainingToShrink -= shrink;
        }
        
        newWidths[columnKey] = startWidth + actualGrow;
        
      } else if (delta < 0) {
        const absDelta = Math.abs(delta);
        
        let remainingDelta = absDelta;
        let leftNewWidth = startWidth;
        
        const maxShrink = startWidth - minWidth;
        const actualShrink = Math.min(remainingDelta, maxShrink);
        leftNewWidth = startWidth - actualShrink;
        remainingDelta -= actualShrink;
        
        for (let i = colIndex - 1; i >= 0 && remainingDelta > 0; i--) {
          const key = visibleColumns[i].key;
          const leftMin = getMinWidth(visibleColumns[i]);
          const shrinkable = newWidths[key] - leftMin;
          const shrink = Math.min(shrinkable, remainingDelta);
          newWidths[key] -= shrink;
          remainingDelta -= shrink;
        }
        
        const totalShrink = absDelta - remainingDelta;
        const rightKey = visibleColumns[colIndex + 1]?.key;
        if (rightKey && totalShrink > 0) {
          const maxGrowRight = MAX_COLUMN_WIDTH - newWidths[rightKey];
          const growRight = Math.min(totalShrink, maxGrowRight);
          newWidths[rightKey] += growRight;
        }
        
        newWidths[columnKey] = leftNewWidth;
      }
      
      setCustomWidths(newWidths);
      if (onWidthsChange) onWidthsChange(newWidths);
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, getMinWidth, onWidthsChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 50);
    return () => clearTimeout(timer);
  }, [data, columnLayout, customWidths, checkScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(container);
    
    return () => {
      container.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  const handleMouseEnter = useCallback((e: React.MouseEvent, text: string) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollWidth > target.clientWidth) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
      }, 400);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setTooltip(null);
  }, []);

  const isAllSelected = data.length > 0 && data.every(item => selectedIds.has(item.uid));
  const emptyRows = Math.max(0, visibleRows - data.length);
  const rowIconLeft = CHECKBOX_LEFT + CHECKBOX_BLOCK_WIDTH + CHECKBOX_TO_ICON_GAP;

  return (
    <div style={{ width: tableWidth, height: tableHeight, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'visible', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', borderRadius: 10 }}>
        <div style={{ height: headerHeight, backgroundColor: headerColor, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2, minWidth: columnLayout.contentWidth, borderRadius: '10px 10px 0 0' }}>
          <div style={{ position: 'absolute', left: CHECKBOX_LEFT, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, width: CHECKBOX_BLOCK_WIDTH, height: '100%' }}>
            <motion.div onClick={onSelectAll} style={{ width: 18, height: 18, cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              whileTap={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
              <img src={isAllSelected ? CheckboxIcon18OnWhite : CheckboxIcon18OffWhite} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }} />
            </motion.div>
          </div>
          
          {columnLayout.layout.map(col => (
            <div key={col.key} 
              onContextMenu={(e) => handleHeaderContextMenu(e, col.key)}
              style={{ 
                position: 'absolute', 
                left: col.left, 
                top: 0, 
                height: headerHeight, 
                display: 'flex', 
                alignItems: 'center', 
                fontFamily: 'Inter, sans-serif', 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#FFFFFF', 
                overflow: 'hidden', 
                whiteSpace: 'nowrap', 
                width: col.width, 
                boxSizing: 'border-box', 
                margin: 0, 
                cursor: 'context-menu'
              }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {col.label}
              </span>
            </div>
          ))}
          
          {columnLayout.layout.map((col, idx) => {
            if (idx === columnLayout.layout.length - 1) return null;
            const resizerLeft = col.left + col.width;
            return (
              <div
                key={`resizer-header-${col.key}`}
                onMouseDown={(e) => handleResizeStart(e, col.key)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  position: 'absolute',
                  left: resizerLeft,
                  top: 0,
                  width: RESIZER_WIDTH,
                  height: headerHeight,
                  cursor: 'col-resize',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <div style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
              </div>
            );
          })}
        </div>

        {data.map((item, idx) => {
          const isSelected = selectedIds.has(item.uid);
          const isFirst = idx === 0;
          return (
            <div key={item.uid} style={{ height: rowHeight, display: 'flex', alignItems: 'center', backgroundColor: isSelected ? selectedColor : '#FFFFFF', cursor: 'pointer', position: 'relative', borderTop: isFirst ? 'none' : `1px solid ${borderColor}`, minWidth: columnLayout.contentWidth, boxSizing: 'border-box', userSelect: 'none' }}
              onContextMenu={(e) => handleRowContextMenu(e, item.uid, item.name)} onDoubleClick={() => onDoubleClick(item.uid, item.name)} onClick={(e) => onRowClick(item.uid, e)}>
              <div style={{ position: 'absolute', left: CHECKBOX_LEFT, display: 'flex', alignItems: 'center', justifyContent: 'center', width: CHECKBOX_BLOCK_WIDTH, height: '100%' }}>
                <motion.div onClick={(e) => onCheckboxClick(item.uid, e)} style={{ width: 18, height: 18, cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                  whileTap={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                  <img src={isSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }} />
                </motion.div>
              </div>
              
              {rowIcon && (
                <div style={{ position: 'absolute', left: rowIconLeft, display: 'flex', alignItems: 'center', justifyContent: 'center', width: ROW_ICON_BLOCK_WIDTH, height: '100%' }}>
                  <img src={rowIcon} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
                </div>
              )}
              
              {columnLayout.layout.map(col => {
                const cellText = renderCell(col.key, item);
                const noWrap = noWrapColumns.includes(col.key);
                return (
                  <span key={col.key} style={{ position: 'absolute', left: col.left, top: 0, height: rowHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: (isGrayColumn ? isGrayColumn(col.key) : false) ? '#6B7280' : '#2D4059', overflow: 'hidden', whiteSpace: 'nowrap', width: col.width, boxSizing: 'border-box', margin: 0 }}>
                    <span 
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}
                      onMouseEnter={(e) => handleMouseEnter(e, cellText)} 
                      onMouseLeave={handleMouseLeave}
                    >
                      {highlightText ? <HighlightedText text={cellText} highlight={highlightText} /> : cellText}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}

        {Array.from({ length: emptyRows }).map((_, i) => {
          const isFirstEmpty = data.length === 0 && i === 0;
          return (
            <div key={`empty-${i}`} style={{ height: rowHeight, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', paddingLeft: CHECKBOX_LEFT, borderTop: isFirstEmpty ? 'none' : `1px solid ${borderColor}`, minWidth: columnLayout.contentWidth }}>
              <div style={{ width: CHECKBOX_BLOCK_WIDTH, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, position: 'relative', flexShrink: 0 }}><img src={CheckboxIcon18OffGray} alt="" style={{ width: 18, height: 18 }} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {hasVerticalScroll && <div style={{ position: 'absolute', left: tableWidth + scrollOffset, top: headerHeight, height: tableHeight - headerHeight, width: 10, zIndex: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={tableHeight - headerHeight} /></div>}
      {hasHorizontalScroll && <div style={{ position: 'absolute', top: tableHeight + scrollOffset, left: scrollOffset, width: tableWidth - scrollOffset * 2, height: 10, zIndex: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={tableWidth - scrollOffset * 2} /></div>}

      {createPortal(
        <AnimatePresence>
          {tooltip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)', backgroundColor: '#2D4059', color: '#FFFFFF', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {headerContextMenu && (
        <ContextMenu 
          x={headerContextMenu.x} 
          y={headerContextMenu.y} 
          items={headerContextMenuItems}
          width={280}
          itemHeight={22}
          gapBetween={18}
        />
      )}

      {rowContextMenu && (
        <ContextMenu 
          x={rowContextMenu.x} 
          y={rowContextMenu.y} 
          items={rowContextMenu.items}
        />
      )}
    </div>
  );
};

export default DataTable;