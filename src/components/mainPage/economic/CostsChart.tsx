// CostsChart.tsx — карточка «Затраты на приобретение производственной номенклатуры»: план/факт по дням на собственном SVG
import React, { useId, useMemo, useState } from 'react';
import type { CostPoint, CostsChartProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { daysBetween, formatAxisMillions, formatMillions, formatMonthLabel, isoToRu } from './format';
import { useProgress } from './animation';
import { buildMonthDates, clamp, closeArea, monotonePath, nearestIndex, pickScale, rangeDays } from '../shared/chart';
import type { XY } from '../shared/chart';
import DashboardCard from './DashboardCard';

/* ---------- Геометрия карточки (локальные координаты, px) ----------
 * Числа сняты с «домашней» карточки 970×390 (CARD_RECTS.costs). На другом размере левый край и верх сетки
 * остаются на месте, правый край и низ сетки, подписи месяцев и нижняя легенда считаются от ширины и высоты.
 */
const DEFAULT_TITLE = 'Затраты на приобретение производственной номенклатуры (по предприятию)';
const PLOT_LEFT = 99.5; // левый край сетки
const PLOT_RIGHT_INSET = 33.5; // правый край сетки от правого края карточки (936.5 при ширине 970)
const PLOT_TOP = 86.5; // верх сетки — максимум шкалы
const PLOT_BOTTOM_INSET = 87.5; // низ сетки (ноль) от низа карточки при легенде снизу (302.5 при высоте 390)
const PLOT_BOTTOM_INSET_HEADER = 64.5; // то же при легенде в заголовке: место нижней легенды отдаётся графику (7.png)
const X_PAD = 20.5; // первый и последний день — отступ внутри сетки (120 и 916 при ширине 970)
const Y_LABEL_RIGHT = 87; // правый край подписей оси Y
const MONTH_LABEL_GAP = 22.5; // центр подписей месяцев ниже нуля сетки (325 при высоте 390)
const PILL_W = 64;
const PILL_H = 24;
const PILL_R = 5.5;
const TIP_W = 196;
const TIP_H = 84;
const TIP_GAP = 12; // зазор между тултипом и точкой
const LEGEND_BOTTOM_INSET = 24; // центр нижней легенды от низа карточки (366 при высоте 390)
const LEGEND_HEADER_RIGHT = 30; // правый край легенды в строке заголовка
const LEGEND_HEADER_CY = 32.5; // центр строки заголовка DashboardCard (top 22 + 21 / 2)
const MAX_INTERVALS = 4;
const AXIS_STEPS_MLN = [0.5, 1, 2, 3, 5, 10, 20, 50];

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

type LegendPlacement = NonNullable<CostsChartProps['legend']>;

/** Размеры сетки и подписей для карточки w×h */
interface Geometry {
  w: number;
  h: number;
  plotRight: number;
  plotBottom: number;
  plotW: number;
  plotH: number;
  xMin: number;
  xMax: number;
  monthLabelCy: number;
  legendCy: number;
}

const chartGeometry = (w: number, h: number, legend: LegendPlacement): Geometry => {
  // Не меньше пикселя на сетку — у слишком маленькой карточки размеры не уходят в минус
  const plotRight = Math.max(PLOT_LEFT + 2 * X_PAD + 1, w - PLOT_RIGHT_INSET);
  const plotBottom = Math.max(PLOT_TOP + 1, h - (legend === 'header' ? PLOT_BOTTOM_INSET_HEADER : PLOT_BOTTOM_INSET));
  return {
    w,
    h,
    plotRight,
    plotBottom,
    plotW: plotRight - PLOT_LEFT,
    plotH: plotBottom - PLOT_TOP,
    xMin: PLOT_LEFT + X_PAD,
    xMax: plotRight - X_PAD,
    monthLabelCy: plotBottom + MONTH_LABEL_GAP,
    legendCy: h - LEGEND_BOTTOM_INSET,
  };
};

/** Пункты легенды «● Факт затрат | ● План затрат» — одинаковые внизу и в строке заголовка */
const LegendItems: React.FC = () => (
  <>
    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.fact, flexShrink: 0 }} />
    <span style={{ marginLeft: 9 }}>Факт затрат</span>
    <span style={{ width: 1, height: 20, margin: '0 16px', backgroundColor: 'rgba(45, 64, 89, 0.31)', flexShrink: 0 }} />
    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.plan, flexShrink: 0 }} />
    <span style={{ marginLeft: 9 }}>План затрат</span>
  </>
);

/* ---------- Модель данных графика ---------- */
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

/** Полная подготовка модели графика из точек и диапазона */
const prepareChart = (points: CostPoint[], from: string, to: string, geo: Geometry): ChartModel => {
  const totalDays = rangeDays(from, to);
  const xOfDay = (day: number): number => geo.xMin + (totalDays > 0 ? day / totalDays : 0) * (geo.xMax - geo.xMin);

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
  const { step, intervals } = pickScale(maxRub / 1_000_000, AXIS_STEPS_MLN, MAX_INTERVALS);
  const axisMaxRub = step * intervals * 1_000_000;
  const yOf = (rub: number): number => geo.plotBottom - (safeNumber(rub) / axisMaxRub) * geo.plotH;

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
    planArea: closeArea(planLine, planPts, geo.plotBottom),
    factArea: closeArea(factLine, factPts, geo.plotBottom),
  };
};

/* ---------- Компонент ---------- */
const CostsChart: React.FC<CostsChartProps> = ({
  points,
  from,
  to,
  animationKey,
  rect = CARD_RECTS.costs,
  title = DEFAULT_TITLE,
  legend = 'bottom',
}) => {
  const progress = useProgress(animationKey, ANIM.line);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const geo = useMemo(() => chartGeometry(rect.w, rect.h, legend), [rect.w, rect.h, legend]);
  const model = useMemo(() => prepareChart(points, from, to, geo), [points, from, to, geo]);

  // Уникальные id градиентов и clipPath — на странице может быть несколько экземпляров
  const idBase = `eco-costs-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const planGradId = `${idBase}-plan`;
  const factGradId = `${idBase}-fact`;
  const clipId = `${idBase}-clip`;

  const { step, intervals, ticks, prepared, dots, planLine, factLine, planArea, factArea } = model;

  // Линии сетки и подписи оси Y: деления от нуля (низ) до максимума шкалы (верх)
  const gridLines = Array.from({ length: intervals + 1 }, (_, i) => ({
    y: geo.plotBottom - (i / intervals) * geo.plotH,
    label: formatAxisMillions(i * step),
  }));

  const hovered = hoverIndex !== null && hoverIndex < prepared.length ? prepared[hoverIndex] : null;
  const hoveredTickIndex = hovered ? ticks.findLastIndex((tick) => tick.day <= hovered.day) : -1;

  // Положение тултипа: над верхней точкой, если не влезает — под нижней; по x прижимается к краям карточки
  const hoverTopY = hovered ? Math.min(hovered.yPlan, hovered.yFact) : 0;
  const hoverBottomY = hovered ? Math.max(hovered.yPlan, hovered.yFact) : 0;
  const tipAbove = hoverTopY - TIP_GAP - TIP_H;
  const tipTop = tipAbove >= 0 ? tipAbove : hoverBottomY + TIP_GAP;
  const tipLeft = hovered ? clamp(hovered.x - TIP_W / 2, 0, geo.w - TIP_W) : 0;
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
    const mx = PLOT_LEFT + ((event.clientX - bounds.left) / bounds.width) * geo.plotW;
    setHoverIndex(nearestIndex(prepared, mx));
  };

  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <DashboardCard rect={rect} title={title}>
      <svg
        width={geo.w}
        height={geo.h}
        viewBox={`0 0 ${geo.w} ${geo.h}`}
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
            <rect x={PLOT_LEFT} y={0} width={geo.plotW * progress} height={geo.h} />
          </clipPath>
        </defs>

        {/* Сетка и подписи оси Y */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={PLOT_LEFT}
              x2={geo.plotRight}
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
                y={geo.monthLabelCy - PILL_H / 2}
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
                y={geo.monthLabelCy}
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
              y={geo.monthLabelCy}
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
              y2={geo.plotBottom}
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
          width={geo.plotW}
          height={geo.plotH}
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

      {legend === 'header' ? (
        /* Легенда справа в строке заголовка (7.png, 8.png) */
        <div
          style={{
            position: 'absolute',
            right: LEGEND_HEADER_RIGHT,
            top: LEGEND_HEADER_CY - 10,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: '16px',
            color: COLORS.text,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          <LegendItems />
        </div>
      ) : (
        /* Легенда по центру карточки */
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: geo.legendCy - 10,
            width: geo.w,
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
          <LegendItems />
        </div>
      )}
    </DashboardCard>
  );
};

export default CostsChart;
