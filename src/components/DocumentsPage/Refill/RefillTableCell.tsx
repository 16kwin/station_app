// RefillTableCell.tsx — строка документа пополнения
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowIcon14Down from '../../../assets/Icons/ArrowIcons/ArrowIcon14Down.svg';
import ArrowIcon14Up from '../../../assets/Icons/ArrowIcons/ArrowIcon14Up.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';

export interface RefillCellSource {
  uid: string;
  stockFromUid: string;
  stockFromName: string | null;
  quantity: number | null;
  transferCode?: number | null;
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

interface RefillTableCellProps {
  cell: RefillCell;
  isSelected: boolean;
  isExpanded: boolean;
  disabled: boolean;
  searchValue?: string;
  onCheckboxClick: (uid: string, e: React.MouseEvent) => void;
  onRowClick: (uid: string) => void;
  onExpandToggle: (uid: string) => void;
  onOpenDetails?: (uid: string) => void;
  onDoubleClick?: (uid: string) => void;
}

const LINE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Не взят в работу',
  IN_PROGRESS: 'Взят в работу',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято',
  CLOSED: 'Загружено',
  CANCELLED: 'Отменено',
};

const formatQty = (v: number | null | undefined): string => (v == null ? '—' : String(v));

const COLLAPSED_HEIGHT = 58;
const EXPANDED_HEIGHT = 260;

const COL_NUM_CELL = 60;
const COL_MATERIAL = 220;
const COL_SOURCE = 620;
const COL_SCHEME = 830;
const COL_REFILL = 990;
const COL_STATUS = 1120;
const COL_CHECKBOX = 20;

const RefillTableCell: React.FC<RefillTableCellProps> = ({
  cell, isSelected, isExpanded, disabled, searchValue,
  onCheckboxClick, onRowClick, onExpandToggle, onOpenDetails, onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasSources = (cell.sources?.length ?? 0) > 0;
  const canExpand = hasSources;
  const cellNumber = `${cell.columnNumber ?? 0}-${cell.numberCell ?? 0}`;
  const nomenclature = cell.materialName || cell.materialNameSnapshot || '—';
  const article = cell.materialArticle || cell.materialArticleSnapshot || '';

  const sourceSummary = hasSources
    ? (cell.sources || []).map(s => `${s.stockFromName || s.stockFromUid}: ${s.quantity ?? 0}`).join('; ')
    : '—';

  const statusLabel = LINE_STATUS_LABELS[String(cell.status || 'NOT_STARTED')] || String(cell.status || '—');
  const statusColor = cell.cancelled ? '#FF3052'
    : (String(cell.status) === 'CLOSED' ? '#00D664'
    : (String(cell.status) === 'RECEIVED' ? '#00A64F'
    : (String(cell.status) === 'SHIPPED' ? '#FE975B' : '#2D4059')));

  const bg = isSelected ? '#DEEEFF' : (isHovered ? '#F5FAFF' : '#FFFFFF');

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
    color: 'rgba(45, 64, 89, 0.5)', lineHeight: '14px',
  };
  const valueStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14,
    color: '#2D4059', lineHeight: '18px', marginTop: 4,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onDoubleClick?.(cell.uid);
  };

  return (
    <>
      <motion.div
        onClick={() => onRowClick(cell.uid)}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
        style={{
          backgroundColor: bg,
          cursor: 'pointer',
          position: 'relative',
          borderLeft: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          borderRight: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: '#E5E7EB' }} />

        <div onClick={(e) => onCheckboxClick(cell.uid, e)}
          style={{ position: 'absolute', left: COL_CHECKBOX, top: 20, width: 18, height: 18, cursor: 'pointer', zIndex: 2 }}>
          <img src={isSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: 18, height: 18 }} />
        </div>

        <div style={{ paddingTop: 10, height: COLLAPSED_HEIGHT, position: 'relative' }}>
          <div style={{ position: 'absolute', left: COL_NUM_CELL, top: 10, width: 150 }}>
            <div style={labelStyle}>Номер ячейки</div>
            <div style={valueStyle}>{cellNumber}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_MATERIAL, top: 10, width: 380 }}>
            <div style={labelStyle}>Номенклатура</div>
            <div style={{ ...valueStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {article ? `${nomenclature} (${article})` : nomenclature}
            </div>
          </div>

          <div style={{ position: 'absolute', left: COL_SOURCE, top: 10, width: 200 }}>
            <div style={labelStyle}>Склад-отправитель</div>
            <div style={{ ...valueStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sourceSummary}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_SCHEME, top: 10, width: 150 }}>
            <div style={labelStyle}>По схеме / В ячейке</div>
            <div style={valueStyle}>{formatQty(cell.templateQuantity)} / {formatQty(cell.factQuantity)}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_REFILL, top: 10, width: 120 }}>
            <div style={labelStyle}>К загрузке</div>
            <div style={{ ...valueStyle, color: cell.cancelled ? '#FF3052' : '#666EFE' }}>
              {formatQty(cell.refillQuantity)}
            </div>
          </div>

          <div style={{ position: 'absolute', left: COL_STATUS, top: 10, width: 180 }}>
            <div style={labelStyle}>Статус</div>
            <div style={{ ...valueStyle, color: statusColor }}>{statusLabel}</div>
          </div>

          {canExpand && (
            <div
              onClick={(e) => { e.stopPropagation(); onExpandToggle(cell.uid); }}
              style={{
                position: 'absolute', right: 20, top: 20, width: 20, height: 20,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
              }}
            >
              <img src={isExpanded ? ArrowIcon14Up : ArrowIcon14Down} alt="" style={{ width: 14, height: 14 }} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && canExpand && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ position: 'absolute', top: COLLAPSED_HEIGHT, left: 0, right: 0, height: EXPANDED_HEIGHT - COLLAPSED_HEIGHT, boxSizing: 'border-box' }}
            >
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1123, height: 2, backgroundColor: '#BCD8FF' }} />

              <div style={{ padding: '20px 60px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', marginBottom: 10 }}>
                  Раскладка по складам-отправителям
                </div>
                {(cell.sources || []).map(s => (
                  <div key={s.uid} style={{ display: 'flex', alignItems: 'center', gap: 20, height: 28, fontSize: 14, color: '#2D4059' }}>
                    <span style={{ minWidth: 260, fontWeight: 600 }}>{s.stockFromName || s.stockFromUid}</span>
                    <span>Количество: <b>{s.quantity ?? 0}</b></span>
                    {s.transferCode != null && (
                      <span>Перемещение: <b>№{String(s.transferCode).padStart(4, '0')}</b></span>
                    )}
                    {s.transferStatus && (
                      <span style={{ color: s.transferCancelled ? '#FF3052' : '#666EFE' }}>
                        {s.transferStatus}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default RefillTableCell;