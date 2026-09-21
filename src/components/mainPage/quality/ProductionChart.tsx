// ProductionChart.tsx — карточка «Расход объема производственной номенклатуры по предприятию»:
// план и факт расхода ТМЦ по дням, плавная линия как в «Экономическом блоке».
import React, { useId, useMemo, useState } from 'react';
import type { ProductionPoint, ProductionChartProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { daysBetween, formatAxisCount, formatCount, formatMonthLabel, isoToRu } from '../shared/format';
import { useProgress } from '../shared/animation';
import { buildMonthDates, clamp, closeArea, monotonePath, nearestIndex, pickScale, rangeDays } from '../shared/chart';
import type { XY } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия карточки (локальные координаты, px) ---------- */
const CARD_W = CARD_RECTS.production.w; // 1000
const CARD_H = CARD_RECTS.production.h; // 330
const PLOT_LEFT = 99.5;
const PLOT_RIGHT = 966.5;
const PLOT_TOP = 80.5;
const PLOT_BOTTOM = 262.5;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;
const X_MIN = 120; // первый день — отступ 20px внутри сетки
const X_MAX = 946; // последний день — отступ 20px внутри сетки
const Y_LABEL_RIGHT = 87;
const MONTH_LABEL_CY = 288;
const PILL_W = 64;
const PILL_H = 24;
const PILL_R = 5.5;
const TIP_W = 196;
const TIP_H = 84;
const TIP_GAP = 12;
const MAX_INTERVALS = 4;
const AXIS_STEPS = [500, 1000, 2000, 2500, 5000, 10_000, 20_000, 50_000];

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

interface PreparedPoint {
  date: string;
  day: number;
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
  step: number;
  intervals: number;
  ticks: MonthTick[];
  prepared: PreparedPoint[];
  dots: PreparedPoint[];
  planLine: string;
  factLine: string;
  planArea: string;
  factArea: string;
}

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const prepareChart = (points: ProductionPoint[], from: string, to: string): ChartModel => {
  const totalDays = rangeDays(from, to);
  const xOfDay = (day: number): number => X_MIN + (totalDays > 0 ? day / totalDays : 0) * (X_MAX - X_MIN);

  const inRange: { point: ProductionPoint; day: number }[] = [];
  for (const point of points) {
    const day = daysBetween(from, point.date);
    if (Number.isFinite(day) && day >= 0 && day <= totalDays) inRange.push({ point, day });
  }
  inRange.sort((a, b) => a.day - b.day);

  let maxValue = 0;
  for (const { point } of inRange) maxValue = Math.max(maxValue, safeNumber(point.plan), safeNumber(point.fact));
  const { step, intervals } = pickScale(maxValue, AXIS_STEPS, MAX_INTERVALS);
  const axisMax = step * intervals;
  const yOf = (value: number): number => PLOT_BOTTOM - (safeNumber(value) / axisMax) * PLOT_H;

  const prepared: PreparedPoint[] = inRange.map(({ point, day }) => ({
    date: point.date,
    day,
    x: xOfDay(day),
    plan: safeNumber(point.plan),
    fact: safeNumber(point.fact),
    yPlan: yOf(point.plan),
    yFact: yOf(point.fact),
  }));

  const ticks: MonthTick[] = buildMonthDates(from, to).map(date => {
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

  const planPts: XY[] = prepared.map(p => ({ x: p.x, y: p.yPlan }));
  const factPts: XY[] = prepared.map(p => ({ x: p.x, y: p.yFact }));
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
    planArea: closeArea(planLine, planPts, PLOT_BOTTOM),
    factArea: closeArea(factLine, factPts, PLOT_BOTTOM),
  };
};

const ProductionChart: React.FC<ProductionChartProps> = ({ points, from, to, animationKey }) => {
  const progress = useProgress(animationKey, ANIM.line);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const model = useMemo(() => prepareChart(points, from, to), [points, from, to]);

  const idBase = `qlt-production-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const planGradId = `${idBase}-plan`;
  const factGradId = `${idBase}-fact`;
  const clipId = `${idBase}-clip`;

  const { step, intervals, ticks, prepared, dots, planLine, factLine, planArea, factArea } = model;

  const gridLines = Array.from({ length: intervals + 1 }, (_, i) => ({
    y: PLOT_BOTTOM - (i / intervals) * PLOT_H,
    label: formatAxisCount(i * step),
  }));

  const hovered = hoverIndex !== null && hoverIndex < prepared.length ? prepared[hoverIndex] : null;
  const hoveredTickIndex = hovered ? ticks.findLastIndex(tick => tick.day <= hovered.day) : -1;

  const hoverTopY = hovered ? Math.min(hovered.yPlan, hovered.yFact) : 0;
  const hoverBottomY = hovered ? Math.max(hovered.yPlan, hovered.yFact) : 0;
  const tipAbove = hoverTopY - TIP_GAP - TIP_H;
  const tipTop = tipAbove >= 0 ? tipAbove : hoverBottomY + TIP_GAP;
  const tipLeft = hovered ? clamp(hovered.x - TIP_W / 2, 0, CARD_W - TIP_W) : 0;
  const dashX = hovered ? Math.round(hovered.x - 0.5) + 0.5 : 0;

  const tooltipRows = hovered
    ? [
        { key: 'plan', label: 'План', color: COLORS.accent, value: hovered.plan, cy: 46 },
        { key: 'fact', label: 'Факт', color: COLORS.green, value: hovered.fact, cy: 71 },
      ]
    : [];

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (prepared.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const mx = PLOT_LEFT + ((event.clientX - bounds.left) / bounds.width) * PLOT_W;
    setHoverIndex(nearestIndex(prepared, mx));
  };

  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <DashboardCard rect={CARD_RECTS.production} title="Расход объема производственной номенклатуры по предприятию">
      {/* Легенда — справа в шапке карточки */}
      <div
        style={{
          position: 'absolute',
          right: 28,
          top: 22,
          height: 21,
          display: 'flex',
          alignItems: 'center',
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: '16px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          zIndex: 1,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.green, flexShrink: 0 }} />
        <span style={{ marginLeft: 9 }}>Факт расхода ТМЦ</span>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.accent, flexShrink: 0, marginLeft: 22 }} />
        <span style={{ marginLeft: 9 }}>План расхода ТМЦ</span>
      </div>

      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={planGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.accent} stopOpacity={0.17} />
            <stop offset="1" stopColor={COLORS.accent} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={factGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.green} stopOpacity={0.18} />
            <stop offset="1" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
          {/* Окно отрисовки растёт слева направо вместе с прогрессом анимации */}
          <clipPath id={clipId}>
            <rect x={PLOT_LEFT} y={0} width={PLOT_W * progress} height={CARD_H} />
          </clipPath>
        </defs>

        {/* Сетка и подписи оси Y */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={line.y} y2={line.y} stroke={COLORS.grid} strokeWidth={1} strokeLinecap="round" />
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
          {planLine && <path d={planLine} fill="none" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          {factLine && <path d={factLine} fill="none" stroke={COLORS.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          {dots.map(point => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.yPlan} r={4} fill={COLORS.accent} />
              <circle cx={point.x} cy={point.yFact} r={4} fill={COLORS.green} />
            </g>
          ))}
        </g>

        {/* Наведение: пунктир от верхней точки до нуля и кружки с белым кольцом */}
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
            <circle cx={hovered.x} cy={hovered.yFact} r={6} fill={COLORS.green} stroke={COLORS.white} strokeWidth={4} />
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
          {tooltipRows.map(row => (
            <React.Fragment key={row.key}>
              <div style={{ position: 'absolute', left: 21, top: row.cy - 8, width: 2, height: 16, borderRadius: 1, backgroundColor: row.color }} />
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
                {formatCount(row.value)}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};

export default ProductionChart;
