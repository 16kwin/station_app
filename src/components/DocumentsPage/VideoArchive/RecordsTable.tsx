// RecordsTable.tsx — таблица журнала видеоархива: дата и время, событие, станция, ссылка на видео,
// продолжительность. Идущая запись показывает таймер, неудачная — причину во всплывающей подсказке.
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CustomScrollbar from '../../elements/CustomScrollbar';
import type { VideoRecord } from './types';
import { COLORS, FONT, SHADOWS } from './theme';
import { formatShortDuration, formatTableDate, parseServerDate } from './format';
import { Spinner } from './ui';

/** Положение таблицы на холсте 1800×840 */
const TABLE = { left: 40, top: 384, width: 1720 } as const;
const HEADER_H = 58;
const ROW_H = 58;
const VISIBLE_ROWS = 4;

/** Ширины столбцов; текст первого столбца начинается с отступа 51, как на макете */
const COLUMNS = [
  { key: 'date', label: 'Дата Время', width: 368, padLeft: 51 },
  { key: 'event', label: 'Событие', width: 333, padLeft: 0 },
  { key: 'station', label: 'Станция', width: 379, padLeft: 0 },
  { key: 'video', label: 'Видео', width: 313, padLeft: 0 },
  { key: 'duration', label: 'Продолжительность видео', width: 327, padLeft: 0 },
] as const;

const GRID = COLUMNS.map(column => `${column.width}px`).join(' ');

interface RecordsTableProps {
  records: VideoRecord[];
  loading: boolean;
  onOpen: (record: VideoRecord) => void;
  /** Верх таблицы на холсте; без настроек камер (роль только с журналом) таблица выше */
  top?: number;
  /** Сколько строк видно без прокрутки */
  visibleRows?: number;
}

const cellStyle = (padLeft: number): React.CSSProperties => ({
  paddingLeft: padLeft,
  paddingRight: 16,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/** Секунды с начала идущей записи */
const elapsedSeconds = (record: VideoRecord, now: number): number =>
  Math.max(0, (now - parseServerDate(record.startedAt).getTime()) / 1000);

const RecordsTable: React.FC<RecordsTableProps> = ({ records, loading, onOpen, top, visibleRows = VISIBLE_ROWS }) => {
  const tableTop = top ?? TABLE.top;
  const bodyH = ROW_H * visibleRows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const hasRecording = records.some(record => record.status === 'recording');

  // Таймер идущих записей — раз в секунду, только пока такие записи есть
  useEffect(() => {
    if (!hasRecording) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasRecording]);

  const renderVideoCell = (record: VideoRecord) => {
    if (record.status === 'recording') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.rec, fontWeight: 500 }}>
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.rec }}
          />
          Идёт запись
        </span>
      );
    }
    if (record.status === 'failed') {
      return (
        <span title={record.errorMessage ?? undefined} style={{ color: COLORS.muted, cursor: 'help', borderBottom: `1px dashed ${COLORS.muted}` }}>
          Нет видео
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onOpen(record);
        }}
        title={record.errorMessage ? `Записалось не всё: ${record.errorMessage}` : undefined}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          fontFamily: FONT,
          fontSize: 15,
          color: COLORS.accent,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          cursor: 'pointer',
        }}
      >
        Ссылка на видео
      </button>
    );
  };

  const renderDuration = (record: VideoRecord) => {
    if (record.status === 'recording') {
      return <span style={{ color: COLORS.rec, fontVariantNumeric: 'tabular-nums' }}>{formatShortDuration(elapsedSeconds(record, now))}</span>;
    }
    if (record.status === 'failed') return <span style={{ color: COLORS.muted }}>—</span>;
    return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatShortDuration(record.durationSeconds)}</span>;
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        aria-label="Журнал видеозаписей"
        style={{
          position: 'absolute',
          left: TABLE.left,
          top: tableTop,
          width: TABLE.width,
          height: HEADER_H + bodyH,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
          fontFamily: FONT,
        }}
      >
        {/* Шапка таблицы */}
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            alignItems: 'center',
            height: HEADER_H,
            backgroundColor: COLORS.accent,
            color: COLORS.white,
            fontSize: 16,
            fontWeight: 600,
            userSelect: 'none',
          }}
        >
          {COLUMNS.map(column => (
            <div key={column.key} role="columnheader" style={cellStyle(column.padLeft)}>
              {column.label}
            </div>
          ))}
        </div>

        {/* Строки */}
        <div
          ref={scrollRef}
          role="rowgroup"
          style={{ height: bodyH, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading && records.length === 0 && (
            <div style={{ height: bodyH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: COLORS.muted, fontSize: 15 }}>
              <Spinner /> Загрузка журнала…
            </div>
          )}

          {!loading && records.length === 0 && (
            <div style={{ height: bodyH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>Записей пока нет</span>
              <span style={{ fontSize: 14, color: COLORS.muted }}>
                Нажмите «Login» или «Выдача начало» внизу страницы — камеры начнут запись события
              </span>
            </div>
          )}

          <AnimatePresence initial={false}>
            {records.map((record, index) => {
              const clickable = record.status === 'done';
              return (
                <motion.div
                  key={record.id}
                  role="row"
                  layout
                  initial={{ opacity: 0, backgroundColor: 'rgba(102, 110, 254, 0.12)' }}
                  animate={{ opacity: 1, backgroundColor: 'rgba(255, 255, 255, 1)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  whileHover={{ backgroundColor: COLORS.rowHover }}
                  onClick={clickable ? () => onOpen(record) : undefined}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID,
                    alignItems: 'center',
                    height: ROW_H,
                    boxSizing: 'border-box',
                    borderTop: index === 0 ? 'none' : `1px solid ${COLORS.rowBorder}`,
                    fontSize: 15,
                    color: COLORS.text,
                    cursor: clickable ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ ...cellStyle(COLUMNS[0].padLeft), fontVariantNumeric: 'tabular-nums' }}>{formatTableDate(record.startedAt)}</div>
                  <div style={cellStyle(0)}>{record.eventTitle}</div>
                  <div style={cellStyle(0)}>{record.stationName ?? '—'}</div>
                  <div style={cellStyle(0)}>{renderVideoCell(record)}</div>
                  <div style={cellStyle(0)}>{renderDuration(record)}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Полоса прокрутки справа от таблицы, как на макете */}
      <div style={{ position: 'absolute', left: TABLE.left + TABLE.width + 12, top: tableTop + HEADER_H, width: 10, height: bodyH }}>
        <CustomScrollbar scrollContainerRef={scrollRef} orientation="vertical" trackSize={bodyH} />
      </div>
    </>
  );
};

export default RecordsTable;
