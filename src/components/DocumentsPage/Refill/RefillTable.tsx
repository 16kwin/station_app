// RefillTable.tsx — таблица строк документа пополнения
import React, { useState } from 'react';
import CustomScrollbar from '../../elements/CustomScrollbar';
import RefillTableCell from './RefillTableCell';

export interface RefillCellSource {
  uid: string;
  stockFromUid: string;
  stockFromName: string | null;
  quantity: number | null;
  acceptedQuantity?: number | null;
  availableSnapshot?: number | null;
  transferUid?: string | null;
  transferCode?: number | null;
  transferLineUid?: string | null;
  transferStatus?: string | null;
  transferCancelled?: boolean | null;
}

export interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  cellAssignmentName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialNameSnapshot?: string | null;
  materialArticleSnapshot?: string | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  refillQuantity?: number | null;
  acceptedQuantity?: number | null;
  status?: string | null;
  cancelled?: boolean | null;
  closedAt?: string | null;
  sources?: RefillCellSource[];
}

interface RefillTableProps {
  cells: RefillCell[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onOpenDetails?: (uid: string) => void;
  onDoubleClick?: (uid: string) => void;
  disabled?: boolean;
  searchValue?: string;
}

const TABLE_HEIGHT = 560;
const HEADER_HEIGHT = 58;
const ROW_HEIGHT = 58;
const VISIBLE_ROWS = 8;

const LINE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Не взят в работу',
  IN_PROGRESS: 'Взят в работу',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято',
  CLOSED: 'Загружено',
  CANCELLED: 'Отменено',
};

const formatQty = (v: number | null | undefined): string => (v == null ? '—' : String(v));

const RefillTable: React.FC<RefillTableProps> = ({
  cells, selectedIds, onSelectionChange, onOpenDetails, onDoubleClick,
  disabled = false, searchValue,
}) => {
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!searchValue || !searchValue.trim()) return cells;
    const q = searchValue.trim().toLowerCase();
    return cells.filter(c =>
      (c.materialName || c.materialNameSnapshot || '').toLowerCase().includes(q) ||
      (c.materialArticle || c.materialArticleSnapshot || '').toLowerCase().includes(q)
    );
  }, [cells, searchValue]);

  const visibleIds = filtered.map(c => c.uid);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      const n = new Set(selectedIds);
      visibleIds.forEach(id => n.delete(id));
      onSelectionChange(n);
    } else {
      const n = new Set(selectedIds);
      visibleIds.forEach(id => n.add(id));
      onSelectionChange(n);
    }
  };

  const toggleOne = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const n = new Set(selectedIds);
    n.has(uid) ? n.delete(uid) : n.add(uid);
    onSelectionChange(n);
  };

  const toggleExpand = (uid: string) => {
    setExpandedUid(prev => prev === uid ? null : uid);
  };

  const totalRows = Math.max(VISIBLE_ROWS, filtered.length);
  const trackHeight = TABLE_HEIGHT - HEADER_HEIGHT;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', height: `${TABLE_HEIGHT}px` }}>
      <div style={{ width: '1183px', height: `${TABLE_HEIGHT}px`, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#FFFFFF', borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottom: '1px solid #E5E7EB', position: 'relative' }}>
          <div onClick={toggleAll} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, cursor: 'pointer' }}>
            <img src={allSelected ? require('../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg').default : require('../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg').default} alt="" style={{ width: 18, height: 18 }} />
          </div>
          <span style={{ position: 'absolute', left: 60, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>Номер ячейки</span>
          <span style={{ position: 'absolute', left: 220, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>Номенклатура</span>
          <span style={{ position: 'absolute', left: 620, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>Склад-отправитель</span>
          <span style={{ position: 'absolute', left: 830, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>По схеме / В ячейке</span>
          <span style={{ position: 'absolute', left: 990, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>К загрузке</span>
          <span style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#2D4059', letterSpacing: '0.5px' }}>Статус</span>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет строк</div>
          )}
          {filtered.map(cell => (
            <RefillTableCell
              key={cell.uid}
              cell={cell}
              isSelected={selectedIds.has(cell.uid)}
              isExpanded={expandedUid === cell.uid}
              disabled={disabled}
              searchValue={searchValue}
              onCheckboxClick={toggleOne}
              onRowClick={(uid) => {
                const n = new Set(selectedIds);
                if (n.has(uid) && n.size === 1) n.clear();
                else { n.clear(); n.add(uid); }
                onSelectionChange(n);
              }}
              onExpandToggle={toggleExpand}
              onOpenDetails={onOpenDetails}
              onDoubleClick={onDoubleClick}
            />
          ))}
          {Array.from({ length: Math.max(0, totalRows - filtered.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', borderTop: '0.5px solid #E5E7EB', borderBottom: '0.5px solid #E5E7EB' }} />
          ))}
        </div>
      </div>
      <div style={{ marginLeft: 15, marginTop: HEADER_HEIGHT }}>
        <CustomScrollbar scrollContainerRef={scrollRef} orientation="vertical" trackSize={trackHeight} />
      </div>
    </div>
  );
};

export default RefillTable;