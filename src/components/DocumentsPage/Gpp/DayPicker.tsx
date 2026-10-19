// DayPicker.tsx — выбор дня в окне «Этап»: месяц сеткой 6×7 (всегда 42 клетки — последние дни месяца не теряются),
// листание месяцев «‹ ›», дни соседних месяцев приглушены, но выбираются. Границы — годы, которые принимает сервер.
// Панель выводится поверх окна (портал в body) под полем «Начало»; щелчок мимо и Esc закрывают только её, не окно.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from './theme';
import { MONTHS, isWeekend, monthIndex, monthStart, monthYear, dayOfMonth, today, weekStart } from './dates';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const WIDTH = 300;

export interface DayPickerPlace {
  /** Левый верхний угол панели в координатах окна браузера */
  left: number;
  top: number;
}

interface DayPickerProps {
  /** Где открыть; null — закрыто */
  at: DayPickerPlace | null;
  /** Выбранный день (номер дня) */
  value: number;
  /** Первый и последний день, который можно выбрать */
  min: number;
  max: number;
  onPick: (day: number) => void;
  onClose: () => void;
  /** Поле, которое открывает панель: щелчок по нему — не «мимо» (поле само открывает и закрывает) */
  anchorRef: React.RefObject<HTMLElement | null>;
}

const navStyle = (enabled: boolean): React.CSSProperties => ({
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  cursor: enabled ? 'pointer' : 'default',
  opacity: enabled ? 1 : 0.3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const Panel: React.FC<Omit<DayPickerProps, 'at'> & { at: DayPickerPlace }> = ({ at, value, min, max, onPick, onClose, anchorRef }) => {
  const [month, setMonth] = useState(() => monthIndex(Math.min(max, Math.max(min, value))));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (panelRef.current?.contains(target) || anchorRef.current?.contains(target))) return;
      onClose();
    };
    // Esc ловится раньше окна «Этап» (захват на window) — закрывается только календарь
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [anchorRef, onClose]);

  const { year, month: m } = monthYear(month);
  const first = weekStart(monthStart(month));
  const days = Array.from({ length: 42 }, (_, i) => first + i);
  const now = today();
  const canPrev = month > monthIndex(min);
  const canNext = month < monthIndex(max);
  const pick = (day: number) => {
    onPick(day);
    onClose();
  };

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Выбор даты"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      style={{
        position: 'fixed',
        left: Math.max(8, Math.min(at.left, window.innerWidth - WIDTH - 8)),
        top: at.top,
        zIndex: 10001,
        width: WIDTH,
        padding: '14px 16px 12px',
        boxSizing: 'border-box',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.menu,
        border: `1px solid ${COLORS.accentLine}`,
        fontFamily: FONT,
        color: COLORS.text,
        transformOrigin: 'top left',
      }}
    >
      <style>{'.gpp-day:not(:disabled):not([aria-pressed="true"]):hover { background-color: rgba(102, 110, 254, 0.08); }'}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 30, marginBottom: 8 }}>
        <button type="button" aria-label="Предыдущий месяц" disabled={!canPrev} onClick={() => setMonth(month - 1)} style={navStyle(canPrev)}>
          <ChevronLeftIcon size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          {MONTHS[m]} {year}
        </span>
        <button type="button" aria-label="Следующий месяц" disabled={!canNext} onClick={() => setMonth(month + 1)} style={navStyle(canNext)}>
          <ChevronRightIcon size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: i >= 5 ? COLORS.faint : COLORS.muted }}>
            {w}
          </div>
        ))}
        {days.map(day => {
          const inMonth = monthIndex(day) === month;
          const selected = day === value;
          const disabled = day < min || day > max;
          return (
            <button
              key={day}
              type="button"
              className="gpp-day"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => pick(day)}
              style={{
                height: 32,
                border: 'none',
                borderRadius: 8,
                padding: 0,
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: selected ? 600 : 500,
                color: selected ? COLORS.white : disabled ? COLORS.line : !inMonth ? COLORS.faint : day === now ? COLORS.accent : isWeekend(day) ? COLORS.muted : COLORS.text,
                backgroundColor: selected ? COLORS.accent : 'transparent',
                boxShadow: day === now && !selected ? `inset 0 0 0 1px ${COLORS.accentLine}` : 'none',
                transition: 'background-color 0.12s ease',
              }}
            >
              {dayOfMonth(day)}
            </button>
          );
        })}
      </div>
      {now >= min && now <= max && (
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => pick(now)}
            style={{ border: 'none', background: 'transparent', padding: '4px 2px', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 500, color: COLORS.accent }}
          >
            Сегодня
          </button>
        </div>
      )}
    </motion.div>
  );
};

const DayPicker: React.FC<DayPickerProps> = ({ at, ...rest }) =>
  createPortal(<AnimatePresence>{at && <Panel key="day-picker" at={at} {...rest} />}</AnimatePresence>, document.body);

export default DayPicker;
