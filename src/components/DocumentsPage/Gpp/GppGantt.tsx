// GppGantt.tsx — диаграмма Ганта документа ГПП на SVG: шкала времени (шапка), пастельные полосы этапов,
// пунктирные стрелки зависимостей с наконечниками, линии начала/конца плана изделия, линия «сегодня».
// Полосы тянутся мышью с привязкой к дням (сдвиг целиком и правый край — длительность), во время
// перетаскивания показываются даты, Esc отменяет; двойной щелчок по полосе открывает окно «Этап».
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BarEditMode, GppRowDTO, GppType, ScaleMode, VisibleRow } from './types';
import { BAR, COLORS, FONT, LAYOUT, SHADOWS, barColor, darken } from './theme';
import { MONTHS, MONTHS_SHORT, dayOfMonth, daysWord, isWeekend, monthYear, parseDay, ruDay, ruDayShort, today } from './dates';
import { arrowHead, barGeometry, dayTicks, dayX, monthTicks, planLines, routeLink, weekTicks } from './geometry';
import type { BarGeom, LinkPath, Timeline } from './geometry';
import { applyBarEdit, buildLinks, canMoveBar, canResizeBar, dragLimits } from './schedule';
import { buildIndex, rowLabel } from './tree';
import { useTweenedGeometry } from './useTween';

const METRICS = { rowHeight: LAYOUT.rowHeight, barHeight: BAR.height };

interface HeaderProps {
  timeline: Timeline;
  scale: ScaleMode;
  showToday: boolean;
}

/** Шапка шкалы: месяцы в две строки «Январь / 2027», для недель и дней — месяц сверху и деления снизу */
export const GanttHeader: React.FC<HeaderProps> = ({ timeline, scale, showToday }) => {
  const months = useMemo(() => monthTicks(timeline), [timeline]);
  const minor = useMemo(() => (scale === 'weeks' ? weekTicks(timeline) : scale === 'days' ? dayTicks(timeline) : []), [timeline, scale]);
  const now = today();
  const todayX = showToday && now >= timeline.from && now <= timeline.to ? dayX(timeline, now) + timeline.ppd / 2 : null;
  const text: React.CSSProperties = { fontFamily: FONT, color: COLORS.white, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center', overflow: 'hidden' };

  return (
    <div style={{ position: 'relative', width: timeline.width, height: LAYOUT.headerHeight }}>
      {months.map((m, i) => {
        const { year, month } = monthYear(m.value);
        const width = m.x1 - m.x0;
        return (
          <div key={m.key} style={{ position: 'absolute', left: m.x0, width, top: 0, height: scale === 'months' ? LAYOUT.headerHeight : 29 }}>
            {i > 0 && <span style={{ position: 'absolute', left: 0, top: scale === 'months' ? 16 : 8, bottom: scale === 'months' ? 16 : 0, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.28)' }} />}
            {scale === 'months' ? (
              <div style={{ ...text, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 14, lineHeight: '17px' }}>
                <span>{width >= 64 ? MONTHS[month] : MONTHS_SHORT[month]}</span>
                <span>{year}</span>
              </div>
            ) : (
              <div style={{ ...text, position: 'absolute', inset: 0, paddingTop: 9, fontSize: 13, lineHeight: '16px' }}>
                {width >= 110 ? `${MONTHS[month]} ${year}` : MONTHS_SHORT[month]}
              </div>
            )}
          </div>
        );
      })}
      {minor.map(t => {
        const weekend = scale === 'days' && isWeekend(t.value);
        return (
          <div
            key={t.key}
            style={{
              ...text,
              position: 'absolute',
              left: t.x0,
              width: t.x1 - t.x0,
              top: 29,
              height: 29,
              lineHeight: '29px',
              fontSize: 12,
              fontWeight: 500,
              color: weekend ? 'rgba(255, 255, 255, 0.6)' : COLORS.white,
              borderLeft: '1px solid rgba(255, 255, 255, 0.16)',
            }}
          >
            {scale === 'days' ? dayOfMonth(t.value) : ruDayShort(t.value)}
          </div>
        );
      })}
      {todayX !== null && (
        <span title="Сегодня" style={{ position: 'absolute', left: todayX - 4, bottom: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.white, boxShadow: '0 0 0 2px rgba(255,255,255,0.35)' }} />
      )}
    </div>
  );
};

interface DragState {
  uid: string;
  mode: BarEditMode;
  originX: number;
  delta: number;
  /** Мышь ушла от точки нажатия дальше порога — это перетаскивание, а не дрожание руки при щелчке */
  moved: boolean;
  /** Пределы сдвига в днях: полоса не уходит за период выборки */
  min: number;
  max: number;
}

/** Порог начала перетаскивания, px: в «Месяцах» день — около 3 px, и дрожание при двойном щелчке сдвигало бы план */
const DRAG_THRESHOLD = 5;

interface GanttProps {
  rows: readonly GppRowDTO[];
  visible: readonly VisibleRow[];
  timeline: Timeline;
  scale: ScaleMode;
  type: GppType;
  autoCalc: boolean;
  editable: boolean;
  showLinks: boolean;
  showToday: boolean;
  fallbackStart: number;
  checked: ReadonlySet<string>;
  hovered: string | null;
  onHover: (uid: string | null) => void;
  onBarEdit: (uid: string, mode: BarEditMode, delta: number) => void;
  onOpenStage: (uid: string) => void;
  onContextMenu: (event: React.MouseEvent, uid: string | null) => void;
}

const HINT_WIDTH = 260;
/** Высота подсказки о нарушенной связи (заголовок и три строки текста) — чтобы решить, влезет ли она над строкой */
const LINK_HINT_HEIGHT = 96;

interface Hint {
  x: number;
  y: number;
  /** Где подсказка относительно точки y: над ней, под ней или по центру */
  side: 'above' | 'below' | 'middle';
  title: string;
  text: string;
  danger?: boolean;
}

const GppGantt: React.FC<GanttProps> = ({
  rows,
  visible,
  timeline,
  scale,
  type,
  autoCalc,
  editable,
  showLinks,
  showToday,
  fallbackStart,
  checked,
  hovered,
  onHover,
  onBarEdit,
  onOpenStage,
  onContextMenu,
}) => {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverBar, setHoverBar] = useState<string | null>(null);
  const [hoverLink, setHoverLink] = useState<string | null>(null);

  const options = useMemo(() => ({ autoCalc, type, fallbackStart }), [autoCalc, type, fallbackStart]);

  // Во время перетаскивания план показывается уже пересчитанным — после отпускания он не «прыгнет»
  const shownRows = useMemo(
    () => (drag && drag.delta !== 0 ? applyBarEdit(rows, drag.uid, drag.mode, drag.delta, options) : rows),
    [rows, drag, options],
  );
  const byUid = useMemo(() => new Map(shownRows.map(r => [r.uid, r])), [shownRows]);
  const index = useMemo(() => buildIndex(shownRows), [shownRows]);
  const rowOf = useMemo(() => new Map(visible.map((v, i) => [v.row.uid, i])), [visible]);

  // Геометрия только видимых полос
  const target = useMemo(() => {
    const all = barGeometry(shownRows, timeline);
    const out = new Map<string, BarGeom>();
    all.forEach((g, uid) => {
      if (rowOf.has(uid)) out.set(uid, g);
    });
    return out;
  }, [shownRows, timeline, rowOf]);
  const geom = useTweenedGeometry(target, drag !== null, `${scale}:${timeline.from}:${timeline.ppd.toFixed(4)}`);

  const links = useMemo(() => (showLinks ? buildLinks(shownRows, type) : []), [showLinks, shownRows, type]);
  const paths = useMemo(() => {
    const out: LinkPath[] = [];
    links.forEach(link => {
      const a = geom.get(link.from);
      const b = geom.get(link.to);
      const ra = rowOf.get(link.from);
      const rb = rowOf.get(link.to);
      if (!a || !b || ra === undefined || rb === undefined) return;
      const p = routeLink(link, a, b, ra, rb, METRICS);
      if (p) out.push({ ...p, violated: p.violated && !autoCalc });
    });
    // Нарушенные — поверх обычных
    return out.sort((x, y) => Number(x.violated) - Number(y.violated));
  }, [links, geom, rowOf, autoCalc]);
  const lines = useMemo(() => planLines(geom, rowOf, index.productOf, METRICS), [geom, rowOf, index]);

  // Свёрнутое изделие: под его полосой — бледная «тень» всего плана, чтобы срок был виден и без раскрытия
  const summaries = useMemo(() => {
    const out: { uid: string; x0: number; x1: number; row: number; color: string }[] = [];
    visible.forEach((v, i) => {
      if (v.row.kind !== 'PRODUCT' || v.expanded) return;
      const own = geom.get(v.row.uid);
      if (!own) return;
      let x0 = own.x0;
      let x1 = own.x1;
      barGeometry(shownRows.filter(r => index.productOf.get(r.uid) === v.row.uid), timeline).forEach(g => {
        x0 = Math.min(x0, g.x0);
        x1 = Math.max(x1, g.x1);
      });
      if (x1 - x0 > own.x1 - own.x0 + 1) out.push({ uid: v.row.uid, x0, x1, row: i, color: barColor(v.row.color, v.row.kind, i) });
    });
    return out;
  }, [visible, geom, shownRows, index, timeline]);

  const months = useMemo(() => monthTicks(timeline), [timeline]);
  const weeks = useMemo(() => (scale === 'weeks' ? weekTicks(timeline) : []), [timeline, scale]);
  const weekendDays = useMemo(() => (scale === 'days' ? dayTicks(timeline).filter(t => isWeekend(t.value)) : []), [timeline, scale]);

  const height = visible.length * LAYOUT.rowHeight;
  const now = today();
  const todayX = showToday && now >= timeline.from && now <= timeline.to ? dayX(timeline, now) + timeline.ppd / 2 : null;

  /** Строка под курсором по координате внутри диаграммы */
  const rowAt = (event: React.MouseEvent<SVGSVGElement>): string | null => {
    const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    return visible[Math.floor(y / LAYOUT.rowHeight)]?.row.uid ?? null;
  };

  const startDrag = (event: React.PointerEvent, row: GppRowDTO, mode: BarEditMode) => {
    // Второе нажатие двойного щелчка — это открытие окна «Этап», а не перетаскивание
    if (event.button !== 0 || !editable || event.detail > 1) return;
    const allowed = mode === 'move' ? canMoveBar(row, autoCalc) : canResizeBar(row, type);
    if (!allowed) return;
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    const limits = dragLimits(rows, row.uid, mode, options, timeline);
    setDrag({ uid: row.uid, mode, originX: event.clientX, delta: 0, moved: false, ...limits });
  };

  const moveDrag = (event: React.PointerEvent) => {
    if (!drag) return;
    const dx = event.clientX - drag.originX;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    const delta = Math.min(drag.max, Math.max(drag.min, Math.round(dx / timeline.ppd)));
    if (!drag.moved || delta !== drag.delta) setDrag({ ...drag, moved: true, delta });
  };

  // Esc во время перетаскивания — отмена: полоса возвращается на место, отпускание кнопки уже ничего не меняет
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setDrag(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [dragging]);

  const endDrag = () => {
    if (!drag) return;
    if (drag.delta !== 0) onBarEdit(drag.uid, drag.mode, drag.delta);
    setDrag(null);
  };

  // Подсказка: даты перетаскиваемой полосы, полосы под курсором или нарушенной связи
  const hint = useMemo((): Hint | null => {
    const barUid = drag?.uid ?? hoverBar;
    if (barUid) {
      const row = byUid.get(barUid);
      const g = geom.get(barUid);
      const i = rowOf.get(barUid);
      const s = parseDay(row?.start);
      const f = parseDay(row?.finish);
      if (!row || !g || i === undefined || s === null || f === null) return null;
      const op = row.opNumber ? `${row.opNumber} · ` : '';
      const title = `${op}${rowLabel(row)}`;
      const text = `${ruDay(s)} — ${ruDay(f)} · ${daysWord(f - s + 1)}`;
      // Подсказка сбоку от полосы на её уровне — не закрывает соседние строки; если места нет — над полосой
      const middle = i * LAYOUT.rowHeight + LAYOUT.rowHeight / 2;
      if (g.x1 + 12 + HINT_WIDTH <= timeline.width) return { x: g.x1 + 12, y: middle, side: 'middle', title, text };
      if (g.x0 - 12 - HINT_WIDTH >= 0) return { x: g.x0 - 12 - HINT_WIDTH, y: middle, side: 'middle', title, text };
      return { x: Math.min(Math.max(g.x0, 8), Math.max(8, timeline.width - HINT_WIDTH - 8)), y: i === 0 ? (i + 1) * LAYOUT.rowHeight - 6 : i * LAYOUT.rowHeight + 6, side: i === 0 ? 'below' : 'above', title, text };
    }
    if (hoverLink) {
      const p = paths.find(x => x.id === hoverLink);
      if (!p || !p.violated) return null;
      const from = byUid.get(p.link.from);
      const to = byUid.get(p.link.to);
      if (!from || !to) return null;
      const i = rowOf.get(p.link.to) ?? 0;
      // От изделия связь идёт от его начала, от предшественника — от окончания
      const fromStart = p.link.anchor === 'start';
      const what = fromStart ? 'начаться раньше изделия' : 'начаться до окончания предшественника';
      const anchorDay = parseDay(fromStart ? from.start : from.finish);
      // Над строкой, если там хватает места; у верхних строк — под ней, иначе заголовок уходит под шапку таблицы
      const above = i * LAYOUT.rowHeight + 6 >= LINK_HINT_HEIGHT;
      return {
        x: Math.min(Math.max(p.tip.x - HINT_WIDTH / 2, 8), Math.max(8, timeline.width - HINT_WIDTH - 8)),
        y: above ? i * LAYOUT.rowHeight + 6 : (i + 1) * LAYOUT.rowHeight - 6,
        side: above ? 'above' : 'below',
        danger: true,
        title: 'Нарушена зависимость',
        text: `«${to.opNumber ?? ''} ${to.name}» не может ${what} «${from.opNumber ?? ''} ${from.name}» (${fromStart ? 'начало' : 'окончание'} ${anchorDay !== null ? ruDay(anchorDay) : '—'}).`,
      };
    }
    return null;
  }, [drag, hoverBar, hoverLink, byUid, geom, rowOf, paths, timeline.width]);

  return (
    <div style={{ position: 'relative', width: timeline.width, height }}>
      <svg
        width={timeline.width}
        height={height}
        style={{ display: 'block', cursor: drag ? (drag.mode === 'resize' ? 'ew-resize' : 'grabbing') : 'default' }}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
        onMouseLeave={() => onHover(null)}
        onMouseMove={event => {
          if (drag) return;
          const uid = rowAt(event);
          if (uid !== hovered) onHover(uid);
        }}
        onContextMenu={event => {
          event.preventDefault();
          onContextMenu(event, rowAt(event));
        }}
      >
        <defs>
          <pattern id="gpp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Подсветка строки под курсором и отмеченных — как в таблице слева */}
        {visible.map((v, i) =>
          v.row.uid === hovered || checked.has(v.row.uid) ? (
            <rect key={`bg-${v.row.uid}`} x={0} y={i * LAYOUT.rowHeight} width={timeline.width} height={LAYOUT.rowHeight} fill={checked.has(v.row.uid) ? COLORS.rowChecked : COLORS.rowHover} />
          ) : null,
        )}

        {weekendDays.map(t => (
          <rect key={t.key} x={t.x0} y={0} width={t.x1 - t.x0} height={height} fill={COLORS.weekend} />
        ))}
        {weeks.map(t => (
          <line key={t.key} x1={t.x0} x2={t.x0} y1={0} y2={height} stroke={COLORS.grid} strokeWidth={1} />
        ))}
        {months.slice(1).map(t => (
          <line key={t.key} x1={t.x0} x2={t.x0} y1={0} y2={height} stroke={scale === 'months' ? COLORS.grid : '#E6EAF2'} strokeWidth={1} />
        ))}

        {visible.map((v, i) => (
          <line key={`ln-${v.row.uid}`} x1={0} x2={timeline.width} y1={(i + 1) * LAYOUT.rowHeight - 0.5} y2={(i + 1) * LAYOUT.rowHeight - 0.5} stroke={COLORS.line} strokeWidth={1} />
        ))}

        {todayX !== null && <line x1={todayX} x2={todayX} y1={0} y2={height} stroke={COLORS.today} strokeWidth={1.5} strokeDasharray="4 4" />}

        {lines.map(l => (
          <line key={l.key} x1={l.x} x2={l.x} y1={l.y0} y2={l.y1} stroke={COLORS.planLine} strokeWidth={1} />
        ))}

        {summaries.map(sm => (
          <rect
            key={`sum-${sm.uid}`}
            x={sm.x0}
            y={sm.row * LAYOUT.rowHeight + (LAYOUT.rowHeight - BAR.height) / 2}
            width={sm.x1 - sm.x0}
            height={BAR.height}
            rx={BAR.radius}
            fill={sm.color}
            fillOpacity={0.35}
            stroke={darken(sm.color, 0.12)}
            strokeOpacity={0.6}
            strokeDasharray="4 3"
          >
            <title>Весь план изделия</title>
          </rect>
        ))}

        {paths.map(p => {
          const color = p.violated ? COLORS.danger : COLORS.link;
          return (
            <g key={p.id}>
              <path d={p.d} fill="none" stroke={color} strokeWidth={p.violated ? 1.4 : 1.1} strokeDasharray="3 3" />
              <path d={arrowHead(p.tip, p.down)} fill={color} />
              {p.violated && (
                <path
                  d={p.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ pointerEvents: 'stroke', cursor: 'help' }}
                  onMouseEnter={() => setHoverLink(p.id)}
                  onMouseLeave={() => setHoverLink(null)}
                />
              )}
            </g>
          );
        })}

        {visible.map((v, i) => {
          const g = geom.get(v.row.uid);
          const row = byUid.get(v.row.uid);
          if (!g || !row) return null;
          const width = Math.max(4, g.x1 - g.x0);
          const y = i * LAYOUT.rowHeight + (LAYOUT.rowHeight - BAR.height) / 2;
          const fill = barColor(row.color, row.kind, i);
          const movable = editable && canMoveBar(row, autoCalc);
          const resizable = editable && canResizeBar(row, type);
          const active = drag?.uid === row.uid || hoverBar === row.uid;
          return (
            <g
              key={`bar-${row.uid}`}
              data-bar={row.uid}
              opacity={v.context ? 0.4 : 1}
              onMouseEnter={() => setHoverBar(row.uid)}
              onMouseLeave={() => setHoverBar(null)}
              onDoubleClick={() => onOpenStage(row.uid)}
            >
              <rect
                x={g.x0}
                y={y}
                width={width}
                height={BAR.height}
                rx={BAR.radius}
                fill={fill}
                stroke={active ? darken(fill, 0.22) : 'none'}
                strokeWidth={1}
                style={{ cursor: drag ? undefined : movable ? 'grab' : 'pointer' }}
                onPointerDown={event => startDrag(event, row, 'move')}
              />
              {resizable && (
                <rect
                  x={g.x0 + width - BAR.handle}
                  y={y}
                  width={BAR.handle}
                  height={BAR.height}
                  rx={BAR.radius}
                  fill={active ? darken(fill, 0.1) : 'transparent'}
                  style={{ cursor: 'ew-resize' }}
                  onPointerDown={event => startDrag(event, row, 'resize')}
                />
              )}
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: hint.x,
              ...(hint.side === 'below' ? { top: hint.y } : hint.side === 'above' ? { bottom: height - hint.y } : { top: hint.y - 25 }),
              width: HINT_WIDTH,
              padding: '8px 12px',
              borderRadius: 10,
              backgroundColor: hint.danger ? COLORS.danger : COLORS.hintBg,
              color: COLORS.white,
              fontFamily: FONT,
              boxShadow: SHADOWS.tooltip,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hint.title}</div>
            <div style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', marginTop: 2, opacity: 0.92 }}>{hint.text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GppGantt;
