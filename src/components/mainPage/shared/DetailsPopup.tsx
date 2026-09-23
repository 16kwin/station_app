// DetailsPopup.tsx — окно «Подробнее» с таблицей: уровень брака по детали и по подразделению,
// уровень остатка номенклатуры на станции.
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../elements/CustomScrollbar';
import CloseIcon24Black from '../../../assets/Icons/CloseIcons/CloseIcon24Black.svg';
import { COLORS, FONT, SHADOWS } from './layout';

export interface DetailsColumn {
  key: string;
  /** Заголовок столбца; массив — многострочный заголовок */
  label: string | string[];
  width: number;
  align?: 'left' | 'center';
}

export interface DetailsRow {
  key: string;
  cells: Record<string, React.ReactNode>;
}

interface DetailsPopupProps {
  isOpen: boolean;
  title: string;
  /** Строки пояснения под заголовком, например «Общее количество брака по детали: 203» */
  subtitles?: string[];
  /** Текст подсказки у значка рядом с последней строкой пояснения */
  hint?: string;
  columns: DetailsColumn[];
  rows: DetailsRow[];
  onClose: () => void;
}

const WINDOW_WIDTH = 726;
const WINDOW_HEIGHT = 585;
const TABLE_LEFT = 40;
const TABLE_WIDTH = 646;
const HEADER_HEIGHT = 58;
const ROW_HEIGHT = 52;
const VISIBLE_ROWS = 7;
const TABLE_HEIGHT = HEADER_HEIGHT + ROW_HEIGHT * VISIBLE_ROWS;
const SCROLL_OFFSET = 15;
const CELL_PADDING = 24;
const ROW_BORDER = '1px solid #E5ECF5';
const SUBTITLE_TOP = 74;
const SUBTITLE_LINE = 22;

/** Значок пояснения 16×16 — красный кружок с восклицательным знаком */
const HintIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke={COLORS.crimson} strokeWidth="1.4" />
    <path d="M8 4.4V8.8" stroke={COLORS.crimson} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="11.3" r="0.95" fill={COLORS.crimson} />
  </svg>
);

const DetailsBody: React.FC<Omit<DetailsPopupProps, 'isOpen'>> = ({ title, subtitles, hint, columns, rows, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const lines = subtitles ?? [];
  const tableTop = SUBTITLE_TOP + Math.max(1, lines.length) * SUBTITLE_LINE + 16;
  const hasScroll = rows.length > VISIBLE_ROWS;
  const emptyRows = Math.max(0, VISIBLE_ROWS - rows.length);
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);

  const cellStyle = (column: DetailsColumn): React.CSSProperties => ({
    width: column.width,
    flexShrink: 0,
    paddingLeft: column.align === 'center' ? 0 : CELL_PADDING,
    paddingRight: column.align === 'center' ? 0 : CELL_PADDING,
    textAlign: column.align ?? 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          width: WINDOW_WIDTH,
          height: WINDOW_HEIGHT,
          backgroundColor: COLORS.white,
          borderRadius: 15,
          boxShadow: SHADOWS.modal,
          position: 'relative',
          fontFamily: FONT,
          userSelect: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 28,
            right: 28,
            width: 24,
            height: 24,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            zIndex: 2,
          }}
        >
          <img src={CloseIcon24Black} alt="" draggable={false} style={{ width: 24, height: 24 }} />
        </button>

        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 64,
            top: 34,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 600,
            lineHeight: '22px',
            color: COLORS.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>

        {lines.map((line, index) => {
          const withHint = Boolean(hint) && index === lines.length - 1;
          return (
            <div
              key={line}
              style={{
                position: 'absolute',
                left: 40,
                right: 40,
                top: SUBTITLE_TOP + index * SUBTITLE_LINE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: '17px',
                color: COLORS.accent,
              }}
            >
              <span>{line}</span>
              {withHint && (
                <span
                  onMouseEnter={() => setHintOpen(true)}
                  onMouseLeave={() => setHintOpen(false)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}
                >
                  <HintIcon />
                  {hintOpen && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: 'calc(100% + 10px)',
                        transform: 'translateX(-50%)',
                        padding: '9px 14px',
                        borderRadius: 8,
                        backgroundColor: COLORS.hintBg,
                        color: COLORS.white,
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: '16px',
                        whiteSpace: 'nowrap',
                        zIndex: 3,
                      }}
                    >
                      {hint}
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}

        {/* Таблица */}
        <div
          style={{
            position: 'absolute',
            left: TABLE_LEFT,
            top: tableTop,
            width: TABLE_WIDTH,
            height: TABLE_HEIGHT,
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: HEADER_HEIGHT,
              minHeight: HEADER_HEIGHT,
              width: Math.max(TABLE_WIDTH, totalWidth),
              backgroundColor: COLORS.accent,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {columns.map(column => (
              <div key={column.key} style={{ ...cellStyle(column), whiteSpace: 'normal' }}>
                {(Array.isArray(column.label) ? column.label : [column.label]).map(line => (
                  <div key={line} style={{ fontSize: 14, fontWeight: 600, lineHeight: '17px', color: COLORS.white }}>
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            ref={scrollContainerRef}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {rows.map((row, index) => (
              <div
                key={row.key}
                style={{
                  height: ROW_HEIGHT,
                  width: Math.max(TABLE_WIDTH, totalWidth),
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: COLORS.white,
                  borderTop: index === 0 ? 'none' : ROW_BORDER,
                  boxSizing: 'border-box',
                }}
              >
                {columns.map(column => (
                  <div
                    key={column.key}
                    style={{ ...cellStyle(column), fontSize: 14, fontWeight: 500, lineHeight: '17px', color: COLORS.text }}
                  >
                    {row.cells[column.key]}
                  </div>
                ))}
              </div>
            ))}

            {Array.from({ length: emptyRows }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  height: ROW_HEIGHT,
                  backgroundColor: COLORS.white,
                  boxSizing: 'border-box',
                  borderTop: rows.length === 0 && i === 0 ? 'none' : ROW_BORDER,
                }}
              />
            ))}
          </div>
        </div>

        {hasScroll && (
          <div
            style={{
              position: 'absolute',
              left: TABLE_LEFT + TABLE_WIDTH + SCROLL_OFFSET,
              top: tableTop + HEADER_HEIGHT,
              height: TABLE_HEIGHT - HEADER_HEIGHT,
              width: 10,
            }}
          >
            <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const DetailsPopup: React.FC<DetailsPopupProps> = ({ isOpen, ...rest }) => (
  <AnimatePresence>{isOpen && <DetailsBody {...rest} />}</AnimatePresence>
);

export default DetailsPopup;
