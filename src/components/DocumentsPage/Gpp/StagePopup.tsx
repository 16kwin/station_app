// StagePopup.tsx — окно «Этап» (двойной щелчок по полосе): начало, длительность, цвет из пастельной палитры
// и предшественники — детали того же изделия. Детали, которые сами ждут этот этап, недоступны: получилась бы петля.
// У изделия в общем графике полоса сводная: длительность здесь — его собственная операция 000, окончание — плана.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { GppRowDTO, GppType } from './types';
import { BAR_PALETTE, COLORS, FONT, KIND_LABEL, barColor, darken } from './theme';
import { daysWord, parseDay, ruDay } from './dates';
import { MAX_DAY, MAX_DURATION, MAX_YEAR, MIN_DAY, MIN_YEAR, dependentsOf, durationOf, isSummaryBar, partsOf, stageFinish } from './schedule';
import type { StagePatch } from './schedule';
import { buildIndex, rowLabel } from './tree';
import { CheckIcon, MinusIcon, PlusIcon, SquareCheck } from './icons';
import { Modal, PillButton } from './ui';
import DayPicker from './DayPicker';
import type { DayPickerPlace } from './DayPicker';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';

interface StagePopupProps {
  row: GppRowDTO | null;
  rows: readonly GppRowDTO[];
  type: GppType;
  autoCalc: boolean;
  editable: boolean;
  fallbackStart: number;
  onApply: (uid: string, patch: StagePatch) => void;
  onClose: () => void;
}

const label: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: COLORS.muted, marginBottom: 8 };

const fieldBox = (disabled: boolean): React.CSSProperties => ({
  height: 44,
  borderRadius: 10,
  border: `1px solid ${disabled ? COLORS.border : '#B3B6FF'}`,
  backgroundColor: disabled ? '#F7F8FB' : COLORS.white,
  display: 'flex',
  alignItems: 'center',
  fontFamily: FONT,
  fontSize: 15,
  fontWeight: 500,
  color: disabled ? COLORS.muted : COLORS.text,
  boxSizing: 'border-box',
});

const StageForm: React.FC<Omit<StagePopupProps, 'row'> & { row: GppRowDTO }> = ({ row, rows, type, autoCalc, editable, fallbackStart, onApply, onClose }) => {
  const [start, setStart] = useState(parseDay(row.start) ?? fallbackStart);
  const [duration, setDuration] = useState(String(durationOf(row)));
  const [color, setColor] = useState(barColor(row.color, row.kind).toUpperCase());
  const [deps, setDeps] = useState<string[]>(row.dependsOn);
  const [pickerAt, setPickerAt] = useState<DayPickerPlace | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const closePicker = useCallback(() => setPickerAt(null), []);

  const index = useMemo(() => buildIndex(rows), [rows]);
  const candidates = useMemo(() => {
    const product = index.productOf.get(row.uid);
    return product && row.kind === 'PART' ? partsOf(index, product).filter(p => p.uid !== row.uid) : [];
  }, [index, row]);
  const blocked = useMemo(() => dependentsOf(index, row.uid), [index, row.uid]);

  const startLocked = !editable || (autoCalc && row.kind === 'PART');
  const days = Number.parseInt(duration, 10);
  const durationOk = Number.isFinite(days) && days >= 1 && days <= MAX_DURATION && /^\d+$/.test(duration.trim());
  const summary = isSummaryBar(rows, row, type);
  const finish = durationOk ? stageFinish(rows, row, start, days, type) : null;
  // Пределы сервера: даты графика — с 1900 по 2100 год
  const datesOk = start >= MIN_DAY && (finish === null || finish <= MAX_DAY);
  const op = row.opNumber || '000';
  const message = !durationOk
    ? `Длительность — от 1 до ${MAX_DURATION} дней`
    : !datesOk
      ? `Даты этапа — с ${MIN_YEAR} по ${MAX_YEAR} год`
      : summary && finish !== null
        ? `Операция ${op} — ${daysWord(days)}; полоса изделия сводная по деталям: ${daysWord(finish - start + 1)}`
        : `Этап длится ${daysWord(days)}, окончание включительно`;
  const palette = BAR_PALETTE.map(c => c.toUpperCase());
  if (!palette.includes(color)) palette.push(color);

  const step = (d: number) => {
    const n = Number.isFinite(days) ? days : 1;
    setDuration(String(Math.min(MAX_DURATION, Math.max(1, n + d))));
  };

  const apply = () => {
    if (!durationOk || !datesOk) return;
    // Только видимые здесь предшественники: детали того же изделия без петель
    const allowed = new Set(candidates.map(p => p.uid));
    onApply(row.uid, { start, durationDays: days, color, dependsOn: deps.filter(d => allowed.has(d) && !blocked.has(d)) });
  };

  const note =
    row.kind === 'PRODUCT'
      ? type === 'GENERAL'
        ? 'У изделия — длительность его собственной операции 000: она идёт первой в последовательном графике. В общем графике полоса изделия — сводная по деталям: длительность 000 её не меняет, новое начало сдвигает её целиком.'
        : 'Собственная операция изделия 000 — первая в цепочке последовательного графика.'
      : startLocked && editable
        ? 'Начало рассчитывается автоматически — от старта изделия и окончания предшественников. Выключите «Автоматический расчет», чтобы задать дату вручную.'
        : type === 'SEQUENTIAL'
          ? 'В последовательном графике этапы идут друг за другом в порядке дерева; предшественники учитываются в общем графике.'
          : null;

  return (
    <div style={{ padding: '22px 36px 30px', fontFamily: FONT, color: COLORS.text, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '176px minmax(0, 1fr) 156px', gap: 14 }}>
        <div ref={anchorRef} style={{ minWidth: 0 }}>
          <div style={label}>Начало</div>
          <button
            type="button"
            disabled={startLocked}
            aria-haspopup="dialog"
            aria-expanded={pickerAt !== null}
            onClick={event => {
              const r = event.currentTarget.getBoundingClientRect();
              setPickerAt(prev => (prev ? null : { left: r.left, top: r.bottom + 6 }));
            }}
            style={{ ...fieldBox(startLocked), width: '100%', padding: '0 14px', gap: 10, cursor: startLocked ? 'default' : 'pointer' }}
          >
            <img src={CalendarIcon16Gray} alt="" style={{ width: 16, height: 18, opacity: startLocked ? 0.5 : 1 }} />
            <span>{ruDay(start)}</span>
          </button>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={label}>{summary ? `Операция ${op}, дн.` : 'Длительность, дн.'}</div>
          <div style={{ ...fieldBox(!editable), borderColor: durationOk ? (editable ? '#B3B6FF' : COLORS.border) : COLORS.danger }}>
            <button type="button" aria-label="Меньше" disabled={!editable} onClick={() => step(-1)} style={stepBtn(editable)}>
              <MinusIcon size={14} />
            </button>
            <input
              value={duration}
              disabled={!editable}
              inputMode="numeric"
              aria-label="Длительность в днях"
              onChange={e => setDuration(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              onKeyDown={e => {
                if (e.key === 'Enter') apply();
              }}
              style={{ flex: 1, minWidth: 0, height: 40, border: 'none', outline: 'none', textAlign: 'center', background: 'transparent', fontFamily: FONT, fontSize: 15, fontWeight: 600, color: COLORS.text }}
            />
            <button type="button" aria-label="Больше" disabled={!editable} onClick={() => step(1)} style={stepBtn(editable)}>
              <PlusIcon size={14} />
            </button>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={label}>{summary ? 'Окончание плана' : 'Окончание'}</div>
          <div style={{ ...fieldBox(true), padding: '0 14px', color: COLORS.text }}>{finish === null ? '—' : ruDay(finish)}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: durationOk && datesOk ? COLORS.muted : COLORS.danger, minHeight: 16 }}>{message}</div>

      <div style={{ ...label, marginTop: 18 }}>Цвет полосы</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {palette.map(c => {
          const on = c === color;
          return (
            <button
              key={c}
              type="button"
              aria-label={`Цвет ${c}`}
              aria-pressed={on}
              disabled={!editable}
              onClick={() => setColor(c)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: `2px solid ${on ? darken(c, 0.3) : 'transparent'}`,
                backgroundColor: c,
                cursor: editable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                boxShadow: on ? '0 0 0 3px rgba(102, 110, 254, 0.12)' : 'none',
              }}
            >
              {on && <CheckIcon size={16} color={darken(c, 0.55)} strokeWidth={2.4} />}
            </button>
          );
        })}
      </div>

      {row.kind === 'PART' && (
        <>
          <div style={{ ...label, marginTop: 20 }}>Предшественники — детали того же изделия</div>
          {candidates.length === 0 ? (
            <div style={{ fontSize: 14, color: COLORS.muted }}>В изделии нет других деталей</div>
          ) : (
            <div style={{ maxHeight: 176, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
              {candidates.map((p, i) => {
                const on = deps.includes(p.uid);
                const cycle = blocked.has(p.uid);
                const disabled = !editable || cycle;
                return (
                  <button
                    key={p.uid}
                    type="button"
                    disabled={disabled}
                    title={cycle ? 'Эта деталь сама ждёт текущий этап — получилась бы петля' : undefined}
                    onClick={() => setDeps(prev => (on ? prev.filter(d => d !== p.uid) : [...prev, p.uid]))}
                    style={{
                      width: '100%',
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0 14px',
                      border: 'none',
                      borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none',
                      background: on ? COLORS.rowChecked : 'transparent',
                      cursor: disabled ? 'default' : 'pointer',
                      opacity: cycle ? 0.45 : 1,
                      fontFamily: FONT,
                      fontSize: 14,
                      color: COLORS.text,
                      textAlign: 'left',
                    }}
                  >
                    <SquareCheck checked={on && !cycle} />
                    <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: barColor(p.color, p.kind), flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, width: 34 }}>{p.opNumber}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rowLabel(p)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {note && <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, backgroundColor: COLORS.accentSoft, fontSize: 13, lineHeight: '18px', color: COLORS.text }}>{note}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
        {editable ? (
          <>
            <PillButton label="Отмена" onClick={onClose} />
            <PillButton label="Применить" variant="primary" onClick={apply} disabled={!durationOk || !datesOk} minWidth={140} />
          </>
        ) : (
          <PillButton label="Закрыть" onClick={onClose} minWidth={120} />
        )}
      </div>

      {/* Свой выбор дня: шесть недель в сетке (общий календарь приложения теряет последние дни длинных месяцев)
          и границы годов сервера; поверх окна, щелчок мимо и Esc закрывают только его */}
      <DayPicker at={pickerAt} value={start} min={MIN_DAY} max={MAX_DAY} onPick={setStart} onClose={closePicker} anchorRef={anchorRef} />
    </div>
  );
};

const stepBtn = (enabled: boolean): React.CSSProperties => ({
  width: 38,
  height: 40,
  border: 'none',
  background: 'transparent',
  cursor: enabled ? 'pointer' : 'default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: enabled ? 1 : 0.4,
  flexShrink: 0,
});

const StagePopup: React.FC<StagePopupProps> = props => {
  const { row } = props;
  const title = row ? `Этап${row.opNumber ? ` ${row.opNumber}` : ''}` : 'Этап';
  const subtitle = row ? `${KIND_LABEL[row.kind]} · ${rowLabel(row)}` : '';
  return (
    <Modal isOpen={row !== null} onClose={props.onClose} width={620} title={title} subtitle={subtitle}>
      {row && <StageForm key={row.uid} {...props} row={row} />}
    </Modal>
  );
};

export default StagePopup;
