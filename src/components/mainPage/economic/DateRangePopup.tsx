// DateRangePopup.tsx — попап выбора диапазона дат «с … по …» в стиле CalendarPopup: один календарь, выбор в два клика
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { COLORS, FONT } from './layout';
import { isoToRu, toIso } from './format';
import type { DateRange } from './types';

/** Положение якоря (пилюли дат) в координатах окна — из getBoundingClientRect */
export interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface DateRangePopupProps {
  isOpen: boolean;
  /** Якорь: попап рисуется под ним, правые края совпадают */
  anchorRect: AnchorRect | null;
  /** Текущий диапазон — начальное значение черновика */
  range: DateRange;
  /** Закрыть без применения (клик вне попапа) */
  onClose: () => void;
  /** «Подтвердить» — применить выбранный диапазон */
  onConfirm: (range: DateRange) => void;
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

// Визуальные константы — как в CalendarPopup
const POPUP_WIDTH = 387;
const BLOCK_WIDTH = 40;
const BLOCK_GAP = 11;
const GRID_LEFT_OFFSET = 21;
const ROW_HEIGHT = 38;
const ROWS = 6; // 42 ячейки — любой месяц помещается целиком
const HEADER_HEIGHT = 78; // месяц + подписи «С:» / «По:»
const WEEKDAYS_TOP = 24;
const GRID_TOP = 59;
const GRID_SECTION_HEIGHT = GRID_TOP + ROWS * ROW_HEIGHT + 12;
const FOOTER_HEIGHT = 101;
const POPUP_HEIGHT = HEADER_HEIGHT + GRID_SECTION_HEIGHT + FOOTER_HEIGHT;
const RANGE_FILL = 'rgba(102, 110, 254, 0.15)';
const OTHER_MONTH_TEXT = 'rgba(45, 64, 89, 0.6)';
const DIVIDER = '1px solid #D8D8D8';

const arrowButtonStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  backgroundColor: '#E7E9EE',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  outline: 'none',
  userSelect: 'none',
};

/** Слайд сетки при смене месяца — как в CalendarPopup */
const slideVariants: Variants = {
  enter: (direction: 'left' | 'right') => ({ x: direction === 'left' ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'left' | 'right') => ({ x: direction === 'left' ? -100 : 100, opacity: 0 }),
};

interface CalendarCell {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  iso: string;
}

/** 42 ячейки месяца: хвост предыдущего, дни текущего, начало следующего; неделя с понедельника */
const buildCells = (year: number, month: number): CalendarCell[] => {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells: CalendarCell[] = [];
  const push = (day: number, m: number, y: number, isCurrentMonth: boolean) => {
    cells.push({ day, month: m, year: y, isCurrentMonth, iso: toIso(new Date(y, m - 1, day)) });
  };
  for (let i = firstWeekday - 1; i >= 0; i--) push(daysInPrevMonth - i, prevMonth, prevYear, false);
  for (let d = 1; d <= daysInMonth; d++) push(d, month, year, true);
  for (let d = 1; cells.length < ROWS * 7; d++) push(d, nextMonth, nextYear, false);
  return cells;
};

interface RangeCalendarProps {
  anchorRect: AnchorRect;
  range: DateRange;
  onClose: () => void;
  onConfirm: (range: DateRange) => void;
}

/** Содержимое попапа; монтируется при каждом открытии, поэтому черновик всегда стартует с текущего диапазона */
const RangeCalendar: React.FC<RangeCalendarProps> = ({ anchorRect, range, onClose, onConfirm }) => {
  const [year, setYear] = useState(Number(range.from.slice(0, 4)));
  const [month, setMonth] = useState(Number(range.from.slice(5, 7)));
  const [draftFrom, setDraftFrom] = useState(range.from);
  const [draftTo, setDraftTo] = useState<string | null>(range.to);
  const [step, setStep] = useState<'from' | 'to'>('from');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const rootRef = useRef<HTMLDivElement>(null);

  // Клик вне попапа — закрыть без применения. Клик по якорю не считается: пилюля сама переключает попап
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      const insideAnchor =
        e.clientX >= anchorRect.left && e.clientX <= anchorRect.right &&
        e.clientY >= anchorRect.top && e.clientY <= anchorRect.bottom;
      if (insideAnchor) return;
      onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [anchorRect, onClose]);

  const goToMonth = (m: number, y: number, direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setMonth(m);
    setYear(y);
  };

  const handlePrevMonth = () => goToMonth(month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year, 'right');
  const handleNextMonth = () => goToMonth(month === 12 ? 1 : month + 1, month === 12 ? year + 1 : year, 'left');

  // Первый клик — начало (конец сбрасывается), второй — конец; если конец раньше начала — меняем местами
  const handleDayClick = (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) {
      const isBefore = cell.year * 12 + cell.month < year * 12 + month;
      goToMonth(cell.month, cell.year, isBefore ? 'right' : 'left');
    }
    if (step === 'from') {
      setDraftFrom(cell.iso);
      setDraftTo(null);
      setStep('to');
      return;
    }
    if (cell.iso < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(cell.iso);
    } else {
      setDraftTo(cell.iso);
    }
    setStep('from');
  };

  const canConfirm = draftTo !== null;

  const handleConfirm = () => {
    if (draftTo === null) return;
    onConfirm({ from: draftFrom, to: draftTo });
    onClose();
  };

  const cells = buildCells(year, month);

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '16px',
    color: active ? COLORS.accent : COLORS.textMuted,
    whiteSpace: 'nowrap',
    transition: 'color 0.15s ease',
  });

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: anchorRect.right - POPUP_WIDTH,
        width: POPUP_WIDTH,
        height: POPUP_HEIGHT,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Шапка: месяц, подписи выбранных границ и стрелки */}
      <div style={{ height: HEADER_HEIGHT, flexShrink: 0, position: 'relative', borderBottom: DIVIDER }}>
        <span
          style={{
            position: 'absolute',
            top: 18,
            left: 31,
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: '18px',
            whiteSpace: 'nowrap',
          }}
        >
          {MONTHS[month - 1]} {year}
        </span>

        <div style={{ position: 'absolute', top: 44, left: 31, display: 'flex', gap: 24 }}>
          <span style={labelStyle(step === 'from')}>С: {isoToRu(draftFrom)}</span>
          <span style={labelStyle(step === 'to')}>По: {draftTo ? isoToRu(draftTo) : '—'}</span>
        </div>

        <div style={{ position: 'absolute', top: (HEADER_HEIGHT - 22) / 2, right: 33, display: 'flex', gap: 12 }}>
          <button type="button" aria-label="Предыдущий месяц" onClick={handlePrevMonth} style={arrowButtonStyle}>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5L5 9" stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" aria-label="Следующий месяц" onClick={handleNextMonth} style={arrowButtonStyle}>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Дни недели и сетка месяца */}
      <div style={{ height: GRID_SECTION_HEIGHT, flexShrink: 0, position: 'relative', borderBottom: DIVIDER, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: WEEKDAYS_TOP, left: GRID_LEFT_OFFSET, display: 'flex', gap: BLOCK_GAP }}>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} style={{ width: BLOCK_WIDTH, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: COLORS.text, lineHeight: '18px' }}>{day}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', top: GRID_TOP, left: 0, right: 0, overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={`${year}-${month}`}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {Array.from({ length: ROWS }).map((_, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', gap: BLOCK_GAP, height: ROW_HEIGHT }}>
                  {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell) => {
                    const isEdge = cell.iso === draftFrom || cell.iso === draftTo;
                    const inRange = draftTo !== null && cell.iso > draftFrom && cell.iso < draftTo;
                    return (
                      <div
                        key={cell.iso}
                        onClick={() => handleDayClick(cell)}
                        style={{
                          width: BLOCK_WIDTH,
                          height: ROW_HEIGHT,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: isEdge ? COLORS.accent : inRange ? RANGE_FILL : 'transparent',
                          transition: 'background-color 0.2s ease',
                          userSelect: 'none',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 15,
                            fontWeight: 500,
                            color: isEdge ? COLORS.white : cell.isCurrentMonth ? COLORS.text : OTHER_MONTH_TEXT,
                            lineHeight: '18px',
                          }}
                        >
                          {cell.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Кнопка подтверждения — активна, когда выбраны обе даты */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            position: 'absolute',
            bottom: 30,
            width: 138,
            height: 39,
            borderRadius: 8,
            backgroundColor: COLORS.accent,
            border: 'none',
            cursor: canConfirm ? 'pointer' : 'default',
            opacity: canConfirm ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.white,
            outline: 'none',
            userSelect: 'none',
          }}
        >
          Подтвердить
        </button>
      </div>
    </motion.div>
  );
};

const DateRangePopup: React.FC<DateRangePopupProps> = ({ isOpen, anchorRect, range, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && anchorRect && (
        <RangeCalendar key="range-calendar" anchorRect={anchorRect} range={range} onClose={onClose} onConfirm={onConfirm} />
      )}
    </AnimatePresence>
  );
};

export default DateRangePopup;
