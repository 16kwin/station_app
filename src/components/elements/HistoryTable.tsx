// HistoryTable.tsx — ПОЛНЫЙ ФАЙЛ (без поиска)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../components/CustomScrollbar';
import HistoryIcon18Black from '../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';

interface HistoryEvent {
  uid: string;
  createdAt: string;
  author: string;
  eventDescription: string;
}

interface HistoryTableProps {
  events: HistoryEvent[];
  isLoading: boolean;
  tableWidth?: number;
  rowHeight?: number;
  headerHeight?: number;
  visibleRows?: number;
  scrollOffset?: number;
  headerColor?: string;
  borderColor?: string;
  dateLabel?: string;
  authorLabel?: string;
  eventLabel?: string;
  searchValue?: string;
}

const RESIZER_WIDTH = 60;
const LAST_COLUMN_RIGHT_PADDING = 30;
const FIRST_COL_LEFT = 70;
const ICON_LEFT = 40;
const ICON_SIZE = 18;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch { return dateStr; }
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

const HistoryTable: React.FC<HistoryTableProps> = ({
  events,
  isLoading,
  tableWidth = 1720,
  rowHeight = 58,
  headerHeight = 58,
  visibleRows = 10,
  scrollOffset = 15,
  headerColor = '#666EFE',
  borderColor = '#E5ECF5',
  dateLabel = 'Дата и время',
  authorLabel = 'Автор',
  eventLabel = 'Событие',
  searchValue = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tableHeight = rowHeight * visibleRows + headerHeight;

  const availableForColumns = tableWidth - FIRST_COL_LEFT - LAST_COLUMN_RIGHT_PADDING - 2 * RESIZER_WIDTH;
  const colWidth = availableForColumns / 3;

  const colDateLeft = FIRST_COL_LEFT;
  const colAuthorLeft = FIRST_COL_LEFT + colWidth + RESIZER_WIDTH;
  const colEventLeft = FIRST_COL_LEFT + 2 * colWidth + 2 * RESIZER_WIDTH;
  
  const contentWidth = tableWidth;

  const filteredEvents = React.useMemo(() => {
    if (!searchValue.trim()) return events;
    const q = searchValue.toLowerCase();
    return events.filter(event => {
      const dateText = formatDate(event.createdAt);
      const authorText = event.author || '';
      const eventText = event.eventDescription || '';
      return [dateText, authorText, eventText].some(v => v && String(v).toLowerCase().includes(q));
    });
  }, [events, searchValue]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight + 1);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 50);
    return () => clearTimeout(timer);
  }, [filteredEvents, checkScroll]);

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

  const emptyRows = Math.max(0, visibleRows - filteredEvents.length);

  return (
    <div style={{ width: tableWidth, height: tableHeight, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'visible', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', borderRadius: 10 }}>
        <div style={{ height: headerHeight, backgroundColor: headerColor, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2, minWidth: contentWidth, borderRadius: '10px 10px 0 0' }}>
          <span style={{ position: 'absolute', left: colDateLeft, top: 0, height: headerHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
            </span>
          </span>
          <span style={{ position: 'absolute', left: colAuthorLeft, top: 0, height: headerHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {authorLabel.charAt(0).toUpperCase() + authorLabel.slice(1)}
            </span>
          </span>
          <span style={{ position: 'absolute', left: colEventLeft, top: 0, height: headerHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {eventLabel.charAt(0).toUpperCase() + eventLabel.slice(1)}
            </span>
          </span>
        </div>

        {isLoading ? (
          <div style={{ height: rowHeight * visibleRows, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: contentWidth }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
          </div>
        ) : (
          <>
            {filteredEvents.map((event, idx) => {
              const isFirst = idx === 0;
              const dateText = formatDate(event.createdAt);
              const authorText = event.author || '-';
              const eventText = event.eventDescription || '-';
              return (
                <div key={event.uid} style={{ height: rowHeight, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', cursor: 'default', position: 'relative', borderTop: isFirst ? 'none' : `1px solid ${borderColor}`, minWidth: contentWidth, boxSizing: 'border-box', userSelect: 'none' }}>
                  <div style={{ position: 'absolute', left: ICON_LEFT, display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE, height: '100%' }}>
                    <img src={HistoryIcon18Black} alt="" style={{ width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }} />
                  </div>
                  
                  <span style={{ position: 'absolute', left: colDateLeft, top: 0, height: rowHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
                    <span 
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}
                      onMouseEnter={(e) => handleMouseEnter(e, dateText)} 
                      onMouseLeave={handleMouseLeave}
                    >
                      {searchValue.trim() ? <HighlightedText text={dateText} highlight={searchValue.trim()} /> : dateText}
                    </span>
                  </span>
                  
                  <span style={{ position: 'absolute', left: colAuthorLeft, top: 0, height: rowHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
                    <span 
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}
                      onMouseEnter={(e) => handleMouseEnter(e, authorText)} 
                      onMouseLeave={handleMouseLeave}
                    >
                      {searchValue.trim() ? <HighlightedText text={authorText} highlight={searchValue.trim()} /> : authorText}
                    </span>
                  </span>
                  
                  <span style={{ position: 'absolute', left: colEventLeft, top: 0, height: rowHeight, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', overflow: 'hidden', whiteSpace: 'nowrap', width: colWidth, boxSizing: 'border-box', margin: 0, cursor: 'default' }}>
                    <span 
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', width: '100%' }}
                      onMouseEnter={(e) => handleMouseEnter(e, eventText)} 
                      onMouseLeave={handleMouseLeave}
                    >
                      {searchValue.trim() ? <HighlightedText text={eventText} highlight={searchValue.trim()} /> : eventText}
                    </span>
                  </span>
                </div>
              );
            })}

            {Array.from({ length: emptyRows }).map((_, i) => {
              const isFirstEmpty = filteredEvents.length === 0 && i === 0;
              return (
                <div key={`empty-${i}`} style={{ height: rowHeight, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', position: 'relative', borderTop: isFirstEmpty ? 'none' : `1px solid ${borderColor}`, minWidth: contentWidth }} />
              );
            })}
          </>
        )}
      </div>

      {hasVerticalScroll && <div style={{ position: 'absolute', left: tableWidth + scrollOffset, top: headerHeight, height: tableHeight - headerHeight, width: 10, zIndex: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={tableHeight - headerHeight} /></div>}
      {hasHorizontalScroll && <div style={{ position: 'absolute', top: tableHeight + scrollOffset, left: scrollOffset, width: tableWidth - scrollOffset * 2, height: 10, zIndex: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={tableWidth - scrollOffset * 2} /></div>}

      {createPortal(
        <AnimatePresence>
          {tooltip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)', backgroundColor: '#2D4059', color: '#FFFFFF', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', whiteSpace: 'normal', maxWidth: 500, zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', wordBreak: 'break-word' }}>
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default HistoryTable;