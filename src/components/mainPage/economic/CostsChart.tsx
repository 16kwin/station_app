// CostsChart.tsx — карточка «Затраты на приобретение производственной номенклатуры»: план/факт по дням на собственном SVG
import React, { useId, useMemo, useState } from 'react';
import type { CostPoint, CostsChartProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { daysBetween, formatAxisMillions, formatMillions, formatMonthLabel, isoToRu, parseIso, toIso } from './format';
import { useProgress } from './animation';
import DashboardCard from './DashboardCard';

/* ---------- Геометрия карточки (локальные координаты, px) ---------- */
const CARD_W = CARD_RECTS.costs.w; // 970
const CARD_H = CARD_RECTS.costs.h; // 390
const PLOT_LEFT = 99.5; // левый край сетки
const PLOT_RIGHT = 936.5; // правый край сетки
const PLOT_TOP = 86.5; // верх сетки — максимум шкалы
const PLOT_BOTTOM = 302.5; // низ сетки — ноль
const PLOT_W = PLOT_RIGHT - PLOT_LEFT; // 837
const PLOT_H = PLOT_BOTTOM - PLOT_TOP; // 216
const X_MIN = 120; // первый день — отступ 20px внутри сетки
const X_MAX = 916; // последний день — отступ 20px внутри сетки
const Y_LABEL_RIGHT = 87; // правый край подписей оси Y
const MONTH_LABEL_CY = 325; // центр подписей месяцев по вертикали
const PILL_W = 64;
const PILL_H = 24;
const PILL_R = 5.5;
const TIP_W = 196;
const TIP_H = 84;
const TIP_GAP = 12; // зазор между тултипом и точкой
const LEGEND_CY = 366;
const MAX_INTERVALS = 4;
const AXIS_STEPS_MLN = [0.5, 1, 2, 3, 5, 10, 20, 50];

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/* ---------- Модель данных графика ---------- */
interface XY {
  x: number;
  y: number;
}

interface PreparedPoint {
  date: string;
  day: number; // индекс дня от `from`
  x: number;
  plan: number;
  fact: number;
  yPlan: number;
  yFact: number;
}

interface MonthTick {
  day: number;
  x: number;
  label: string;
}

interface ChartModel {
  step: number; // шаг шкалы, млн
  intervals: number; // число делений шкалы
  ticks: MonthTick[];
  prepared: PreparedPoint[];
  dots: PreparedPoint[]; // точки, на которых рисуются кружки (1-е числа месяцев и `from`)
  planLine: string;
  factLine: string;
  planArea: string;
  factArea: string;
}

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Шаг шкалы: первый из списка, при котором делений не больше 4; без данных — 0..4 с шагом 1 */
const pickScale = (maxMln: number): { step: number; intervals: number } => {
  if (!(maxMln > 0)) return { step: 1, intervals: MAX_INTERVALS };
  for (const step of AXIS_STEPS_MLN) {
    const intervals = Math.ceil(maxMln / step);
    if (intervals <= MAX_INTERVALS) return { step, intervals: Math.max(1, intervals) };
  }
  // Свыше 200 млн — шаг кратен 50 (за пределами списка из макета)
  const step = Math.ceil(maxMln / MAX_INTERVALS / 50) * 50;
  return { step, intervals: Math.max(1, Math.ceil(maxMln / step)) };
};

/** Даты подписей оси X: `from`, затем 1-е числа всех следующих месяцев в диапазоне */
const buildMonthDates = (from: string, to: string): string[] => {
  const start = parseIso(from);
  const end = parseIso(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) return [];
  const dates = [toIso(start)];
  let cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(toIso(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return dates;
};

/* ---------- Сглаживание: монотонная кубическая интерполяция (как type="monotone" в recharts) ---------- */
const slope3 = (p0: XY, p1: XY, p2: XY): number => {
  const h0 = p1.x - p0.x;
  const h1 = p2.x - p1.x;
  const s0 = (p1.y - p0.y) / (h0 || (h1 < 0 ? -0 : 0));
  const s1 = (p2.y - p1.y) / (h1 || (h0 < 0 ? -0 : 0));
  const p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
};

const slope2 = (p0: XY, p1: XY, t: number): number => {
  const h = p1.x - p0.x;
  return h ? ((3 * (p1.y - p0.y)) / h - t) / 2 : t;
};

/** Путь линии через все точки кубическими Безье без «перелётов» ниже нуля */
const monotonePath = (pts: XY[]): string => {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${round2(pts[0].x)} ${round2(pts[0].y)}`;
  if (n === 2) return `M${round2(pts[0].x)} ${round2(pts[0].y)} L${round2(pts[1].x)} ${round2(pts[1].y)}`;
  const tangents: number[] = new Array<number>(n);
  for (let i = 1; i < n - 1; i++) tangents[i] = slope3(pts[i - 1], pts[i], pts[i + 1]);
  tangents[0] = slope2(pts[0], pts[1], tangents[1]);
  tangents[n - 1] = slope2(pts[n - 2], pts[n - 1], tangents[n - 2]);
  let d = `M${round2(pts[0].x)} ${round2(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = (p1.x - p0.x) / 3;
    d += ` C${round2(p0.x + dx)} ${round2(p0.y + dx * tangents[i])} ${round2(p1.x - dx)} ${round2(p1.y - dx * tangents[i + 1])} ${round2(p1.x)} ${round2(p1.y)}`;
  }
  return d;
};

/** Замыкание линии на ось нуля для заливки */
const closeArea = (line: string, pts: XY[]): string => {
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${line} L${round2(last.x)} ${PLOT_BOTTOM} L${round2(first.x)} ${PLOT_BOTTOM} Z`;
};

/** Полная подготовка модели графика из точек и диапазона */
const prepareChart = (points: CostPoint[], from: string, to: string): ChartModel => {
  const rawDays = daysBetween(from, to);
  const totalDays = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 0;
  const xOfDay = (day: number): number => X_MIN + (totalDays > 0 ? day / totalDays : 0) * (X_MAX - X_MIN);

  // Точки внутри диапазона, по возрастанию даты
  const inRange: { point: CostPoint; day: number }[] = [];
  for (const point of points) {
    const day = daysBetween(from, point.date);
    if (Number.isFinite(day) && day >= 0 && day <= totalDays) inRange.push({ point, day });
  }
  inRange.sort((a, b) => a.day - b.day);

  // Шкала Y
  let maxRub = 0;
  for (const { point } of inRange) maxRub = Math.max(maxRub, safeNumber(point.plan), safeNumber(point.fact));
  const { step, intervals } = pickScale(maxRub / 1_000_000);
  const axisMaxRub = step * intervals * 1_000_000;
  const yOf = (rub: number): number => PLOT_BOTTOM - (safeNumber(rub) / axisMaxRub) * PLOT_H;

  const prepared: PreparedPoint[] = inRange.map(({ point, day }) => ({
    date: point.date,
    day,
    x: xOfDay(day),
    plan: safeNumber(point.plan),
    fact: safeNumber(point.fact),
    yPlan: yOf(point.plan),
    yFact: yOf(point.fact),
  }));

  // Подписи месяцев и точки-кружки на них
  const ticks: MonthTick[] = buildMonthDates(from, to).map((date) => {
    const day = daysBetween(from, date);
    return { day, x: xOfDay(day), label: formatMonthLabel(date) };
  });
  const byDay = new Map<number, PreparedPoint>();
  for (const point of prepared) byDay.set(point.day, point);
  const dots: PreparedPoint[] = [];
  for (const tick of ticks) {
    const point = byDay.get(tick.day);
    if (point) dots.push(point);
  }

  const planPts: XY[] = prepared.map((p) => ({ x: p.x, y: p.yPlan }));
  const factPts: XY[] = prepared.map((p) => ({ x: p.x, y: p.yFact }));
  const planLine = monotonePath(planPts);
  const factLine = monotonePath(factPts);

  return {
    step,
    intervals,
    ticks,
    prepared,
    dots,
    planLine,
    factLine,
    planArea: closeArea(planLine, planPts),
    factArea: closeArea(factLine, factPts),
  };
};

/** Индекс ближайшей по x точки (бинарный поиск по отсортированному массиву) */
const nearestIndex = (prepared: PreparedPoint[], mx: number): number => {
  let lo = 0;
  let hi = prepared.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (prepared[mid].x < mx) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(prepared[lo - 1].x - mx) <= Math.abs(prepared[lo].x - mx)) return lo - 1;
  return lo;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/* ---------- Компонент ---------- */
const CostsChart: React.FC<CostsChartProps> = ({ points, from, to, animationKey }) => {
  const progress = useProgress(animationKey, ANIM.line);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const model = useMemo(() => prepareChart(points, from, to), [points, from, to]);

  // Уникальные id градиентов и clipPath — на странице может быть несколько экземпляров
  const idBase = `eco-costs-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const planGradId = `${idBase}-plan`;
  const factGradId = `${idBase}-fact`;
  const clipId = `${idBase}-clip`;

  const { step, intervals, ticks, prepared, dots, planLine, factLine, planArea, factArea } = model;

  // Линии сетки и подписи оси Y: деления от нуля (низ) до максимума шкалы (верх)
  const gridLines = Array.from({ length: intervals + 1 }, (_, i) => ({
    y: PLOT_BOTTOM - (i / intervals) * PLOT_H,
    label: formatAxisMillions(i * step),
  }));

  const hovered = hoverIndex !== null && hoverIndex < prepared.length ? prepared[hoverIndex] : null;
  const hoveredTickIndex = hovered ? ticks.findLastIndex((tick) => tick.day <= hovered.day) : -1;

  // Положение тултипа: над верхней точкой, если не влезает — под нижней; по x прижимается к краям карточки
  const hoverTopY = hovered ? Math.min(hovered.yPlan, hovered.yFact) : 0;
  const hoverBottomY = hovered ? Math.max(hovered.yPlan, hovered.yFact) : 0;
  const tipAbove = hoverTopY - TIP_GAP - TIP_H;
  const tipTop = tipAbove >= 0 ? tipAbove : hoverBottomY + TIP_GAP;
  const tipLeft = hovered ? clamp(hovered.x - TIP_W / 2, 0, CARD_W - TIP_W) : 0;
  const dashX = hovered ? Math.round(hovered.x - 0.5) + 0.5 : 0; // на полупиксель — чтобы пунктир 1px был чётким

  const tooltipRows = hovered
    ? [
        { key: 'plan', label: 'План', color: COLORS.plan, value: hovered.plan, cy: 46 },
        { key: 'fact', label: 'Факт', color: COLORS.fact, value: hovered.fact, cy: 71 },
      ]
    : [];

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (prepared.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    // Пересчёт в локальные координаты SVG с учётом возможного CSS-масштаба холста
    const mx = PLOT_LEFT + ((event.clientX - bounds.left) / bounds.width) * PLOT_W;
    setHoverIndex(nearestIndex(prepared, mx));
  };

  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <DashboardCard rect={CARD_RECTS.costs} title="Затраты на приобретение производственной номенклатуры (по предприятию)">
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={planGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.plan} stopOpacity={0.17} />
            <stop offset="1" stopColor={COLORS.plan} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={factGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.fact} stopOpacity={0.18} />
            <stop offset="1" stopColor={COLORS.fact} stopOpacity={0} />
          </linearGradient>
          {/* Окно отрисовки растёт слева направо вместе с прогрессом анимации */}
          <clipPath id={clipId}>
            <rect x={PLOT_LEFT} y={0} width={PLOT_W * progress} height={CARD_H} />
          </clipPath>
        </defs>

        {/* Сетка и подписи оси Y */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={PLOT_LEFT}
              x2={PLOT_RIGHT}
              y1={line.y}
              y2={line.y}
              stroke={COLORS.grid}
              strokeWidth={1}
              strokeLinecap="round"
            />
            <text
              x={Y_LABEL_RIGHT}
              y={line.y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={500}
              fill={COLORS.textMuted}
              style={TEXT_STYLE}
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Подписи месяцев; месяц наведённого дня — «пилюля» */}
        {ticks.map((tick, i) =>
          i === hoveredTickIndex ? (
            <g key={tick.day}>
              <rect
                x={tick.x - PILL_W / 2}
                y={MONTH_LABEL_CY - PILL_H / 2}
                width={PILL_W}
                height={PILL_H}
                rx={PILL_R}
                ry={PILL_R}
                fill={COLORS.accent}
                stroke={COLORS.accentBorder}
                strokeWidth={1}
              />
              <text
                x={tick.x}
                y={MONTH_LABEL_CY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={500}
                fill={COLORS.white}
                style={TEXT_STYLE}
              >
                {tick.label}
              </text>
            </g>
          ) : (
            <text
              key={tick.day}
              x={tick.x}
              y={MONTH_LABEL_CY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={500}
              fill={COLORS.textMuted}
              style={TEXT_STYLE}
            >
              {tick.label}
            </text>
          ),
        )}

        {/* Заливки, линии и кружки — рисуются слева направо при загрузке */}
        <g clipPath={`url(#${clipId})`}>
          {planArea && <path d={planArea} fill={`url(#${planGradId})`} />}
          {factArea && <path d={factArea} fill={`url(#${factGradId})`} />}
          {planLine && (
            <path d={planLine} fill="none" stroke={COLORS.plan} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {factLine && (
            <path d={factLine} fill="none" stroke={COLORS.fact} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {dots.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.yPlan} r={4} fill={COLORS.plan} />
              <circle cx={point.x} cy={point.yFact} r={4} fill={COLORS.fact} />
            </g>
          ))}
        </g>

        {/* Наведение: пунктир от верхней точки до нуля и фиолетовые кружки с белым кольцом */}
        {hovered && (
          <g>
            <line
              x1={dashX}
              x2={dashX}
              y1={hoverTopY}
              y2={PLOT_BOTTOM}
              stroke={COLORS.dashedLine}
              strokeWidth={1}
              strokeDasharray="4.4 4.4"
              strokeLinecap="square"
            />
            <circle cx={hovered.x} cy={hovered.yPlan} r={6} fill={COLORS.accent} stroke={COLORS.white} strokeWidth={4} />
            <circle cx={hovered.x} cy={hovered.yFact} r={6} fill={COLORS.accent} stroke={COLORS.white} strokeWidth={4} />
          </g>
        )}

        {/* Прозрачная область сетки для отслеживания мыши */}
        <rect
          x={PLOT_LEFT}
          y={PLOT_TOP}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          pointerEvents="all"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </svg>

      {/* Всплывающая карточка дня */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: tipLeft,
            top: tipTop,
            width: TIP_W,
            height: TIP_H,
            backgroundColor: COLORS.white,
            borderRadius: 12,
            boxShadow: SHADOWS.tooltip,
            pointerEvents: 'none',
            zIndex: 2,
            fontFamily: FONT,
            userSelect: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 15,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 500,
              lineHeight: '16px',
              color: COLORS.textMuted,
              whiteSpace: 'nowrap',
            }}
          >
            {isoToRu(hovered.date)}
          </div>
          {tooltipRows.map((row) => (
            <React.Fragment key={row.key}>
              <div
                style={{
                  position: 'absolute',
                  left: 21,
                  top: row.cy - 8,
                  width: 2,
                  height: 16,
                  borderRadius: 1,
                  backgroundColor: row.color,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 32,
                  top: row.cy - 8,
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: '16px',
                  color: row.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 90,
                  top: row.cy - 8,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: '16px',
                  color: COLORS.text,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatMillions(row.value)}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Легенда по центру карточки */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: LEGEND_CY - 10,
          width: CARD_W,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: '16px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.fact, flexShrink: 0 }} />
        <span style={{ marginLeft: 9 }}>Факт затрат</span>
        <span style={{ width: 1, height: 20, margin: '0 16px', backgroundColor: 'rgba(45, 64, 89, 0.31)', flexShrink: 0 }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.plan, flexShrink: 0 }} />
        <span style={{ marginLeft: 9 }}>План затрат</span>
      </div>
    </DashboardCard>
  );
};

export default CostsChart;
