// PeriodPicker.tsx — «Период выборки»: месяцы «с» и «по» на сетке 3×4 с переключением года, без внешних библиотек.
// Выбранный диапазон подсвечивается в обеих сетках; «По плану» — от первого до последнего месяца с этапами.
// Годы — в пределах, которые принимает сервер (1900–2100): дальше кнопки «‹ ›» неактивны.
import React, { useState } from 'react';
import { COLORS, FONT } from './theme';
import { MONTHS_SHORT, monthLabel, monthYear } from './dates';
import { MAX_YEAR, MIN_YEAR } from './schedule';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { PillButton } from './ui';

interface PeriodPickerProps {
  /** Номера месяцев (год × 12 + месяц) */
  from: number;
  to: number;
  /** Месяцы с этапами — для кнопки «По плану» */
  plan: { from: number; to: number } | null;
  onApply: (from: number, to: number) => void;
  onCancel: () => void;
}

const MonthGrid: React.FC<{ title: string; year: number; onYear: (year: number) => void; from: number; to: number; selected: number; onPick: (m: number) => void }> = ({
  title,
  year,
  onYear,
  from,
  to,
  selected,
  onPick,
}) => (
  <div style={{ width: 222 }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.muted, marginBottom: 10 }}>{title}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 30, marginBottom: 8 }}>
      <button type="button" aria-label="Предыдущий год" disabled={year <= MIN_YEAR} onClick={() => onYear(Math.max(MIN_YEAR, year - 1))} style={navStyle(year > MIN_YEAR)}>
        <ChevronLeftIcon size={16} />
      </button>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{year}</span>
      <button type="button" aria-label="Следующий год" disabled={year >= MAX_YEAR} onClick={() => onYear(Math.min(MAX_YEAR, year + 1))} style={navStyle(year < MAX_YEAR)}>
        <ChevronRightIcon size={16} />
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {MONTHS_SHORT.map((label, m) => {
        const idx = year * 12 + m;
        const isSelected = idx === selected;
        const inRange = idx >= from && idx <= to;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onPick(idx)}
            style={{
              height: 34,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: isSelected ? 600 : 500,
              color: isSelected ? COLORS.white : inRange ? COLORS.accent : COLORS.text,
              backgroundColor: isSelected ? COLORS.accent : inRange ? COLORS.accentSoft : 'transparent',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

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

const PeriodPicker: React.FC<PeriodPickerProps> = ({ from, to, plan, onApply, onCancel }) => {
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);
  const [yearA, setYearA] = useState(monthYear(from).year);
  const [yearB, setYearB] = useState(monthYear(to).year);
  const wrong = b < a;

  return (
    <div style={{ padding: '22px 24px 20px', fontFamily: FONT, color: COLORS.text }}>
      <div style={{ display: 'flex', gap: 28 }}>
        <MonthGrid title="С месяца" year={yearA} onYear={setYearA} from={a} to={b} selected={a} onPick={setA} />
        <div style={{ width: 1, backgroundColor: COLORS.line }} />
        <MonthGrid title="По месяц" year={yearB} onYear={setYearB} from={a} to={b} selected={b} onPick={setB} />
      </div>
      <div style={{ marginTop: 16, minHeight: 18, fontSize: 13, color: wrong ? COLORS.danger : COLORS.muted }}>
        {wrong ? 'Месяц «по» раньше месяца «с»' : `${monthLabel(a)} — ${monthLabel(b)} · ${b - a + 1} мес.`}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        {plan && (
          <button
            type="button"
            onClick={() => {
              setA(plan.from);
              setB(plan.to);
              setYearA(monthYear(plan.from).year);
              setYearB(monthYear(plan.to).year);
            }}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 500, color: COLORS.accent }}
          >
            По плану
          </button>
        )}
        <div style={{ flex: 1 }} />
        <PillButton label="Отмена" onClick={onCancel} height={38} />
        <PillButton label="Применить" variant="primary" onClick={() => onApply(a, b)} disabled={wrong} height={38} />
      </div>
    </div>
  );
};

export default PeriodPicker;
