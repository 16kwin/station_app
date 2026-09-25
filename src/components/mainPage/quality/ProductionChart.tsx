// ProductionChart.tsx — карточка «Расход объема производственной номенклатуры по предприятию»:
// план и факт расхода ТМЦ по дням, плавная линия как в «Экономическом блоке».
// Панели ролей задают место, заголовок, положение легенды и палитру; без них — прежний вид «Показателей».
import React, { useId, useMemo, useState } from 'react';
import type { ProductionChartLegend, ProductionPoint, ProductionChartProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { daysBetween, formatAxisCount, formatCount, formatMonthLabel, isoToRu } from '../shared/format';
import { useProgress } from '../shared/animation';
import { buildMonthDates, clamp, closeArea, monotonePath, nearestIndex, pickScale, rangeDays } from '../shared/chart';
import type { XY } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия карточки (локальные координаты, px) ----------
 * Горизонталь — от ширины карточки, вертикаль — от высоты: низ сетки и подписи месяцев привязаны
 * к низу карточки. При «домашнем» размере 1000×330 получаются прежние числа: сетка 99.5..966.5 × 80.5..262.5,
 * первый/последний день на 120/946, подписи месяцев на 288. */
const PLOT_LEFT = 99.5;
/** Правый край сетки: w − 33.5 */
const PLOT_RIGHT_INSET = 33.5;
const PLOT_TOP = 80.5;
/** Низ сетки: h − 67.5; с легендой внизу — h − 91.5 (под легенду остаётся полоса) */
const PLOT_BOTTOM_INSET = 67.5;
const PLOT_BOTTOM_INSET_LEGEND_BOTTOM = 91.5;
/** Первый и последний день — на 20.5px внутри сетки (120 и 946 у «домашней» карточки) */
const X_PAD = 20.5;
const Y_LABEL_RIGHT = 87;
/** Центр подписей месяцев — на 25.5 ниже низа сетки */
const MONTH_LABEL_OFFSET = 25.5;
/** Центр нижней легенды: h − 25 */
const LEGEND_BOTTOM_INSET = 25;
const PILL_W = 64;
const PILL_H = 24;
const PILL_R = 5.5;
const TIP_W = 196;
const TIP_H = 84;
const TIP_GAP = 12;
const MAX_INTERVALS = 4;
const AXIS_STEPS = [500, 1000, 2000, 2500, 5000, 10_000, 20_000, 50_000];
const DEFAULT_TITLE = 'Расход объема производственной номенклатуры по предприятию';
/** Разделитель пунктов легенды — как в нижней легенде «Затрат на приобретение» */
const LEGEND_DIVIDER = 'rgba(45, 64, 89, 0.31)';

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

interface ChartGeometry {
  w: number;
  h: number;
  plotRight: number;
  plotBottom: number;
  plotW: number;
  plotH: number;
  xMin: number;
  xMax: number;
  monthLabelCy: number;
}

/** Геометрия от размера карточки; легенда внизу отнимает полосу у области графика */
const chartGeometry = (w: number, h: number, legend: ProductionChartLegend | undefined): ChartGeometry => {
  const plotRight = w - PLOT_RIGHT_INSET;
  const plotBottom = h - (legend === 'bottom' ? PLOT_BOTTOM_INSET_LEGEND_BOTTOM : PLOT_BOTTOM_INSET);
  return {
    w,
    h,
    plotRight,
    plotBottom,
    plotW: plotRight - PLOT_LEFT,
    plotH: plotBottom - PLOT_TOP,
    xMin: PLOT_LEFT + X_PAD,
    xMax: plotRight - X_PAD,
    monthLabelCy: plotBottom + MONTH_LABEL_OFFSET,
  };
};

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

const prepareChart = (points: ProductionPoint[], from: string, to: string, geo: ChartGeometry): ChartModel => {
  const totalDays = rangeDays(from, to);
  const xOfDay = (day: number): number => geo.xMin + (totalDays > 0 ? day / totalDays : 0) * (geo.xMax - geo.xMin);

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
  const yOf = (value: number): number => geo.plotBottom - (safeNumber(value) / axisMax) * geo.plotH;

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
    planArea: closeArea(planLine, planPts, geo.plotBottom),
    factArea: closeArea(factLine, factPts, geo.plotBottom),
  };
};

/** Пункт легенды: кружок цвета серии и подпись */
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <>
    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
    <span style={{ marginLeft: 9 }}>{label}</span>
  </>
);

const LegendDivider: React.FC = () => (
  <span style={{ width: 1, height: 20, margin: '0 16px', backgroundColor: LEGEND_DIVIDER, flexShrink: 0 }} />
);

const ProductionChart: React.FC<ProductionChartProps> = ({
  points,
  from,
  to,
  animationKey,
  rect = CARD_RECTS.production,
  title = DEFAULT_TITLE,
  legend,
  palette,
}) => {
  const progress = useProgress(animationKey, ANIM.line);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const cardW = rect.w;
  const cardH = rect.h;
  const model = useMemo(
    () => prepareChart(points, from, to, chartGeometry(cardW, cardH, legend)),
    [points, from, to, cardW, cardH, legend],
  );
  const geo = chartGeometry(cardW, cardH, legend);

  // Цвета серий; плашка месяца и кружки наведения — цветом плашки, если он задан
  const planColor = palette?.plan ?? COLORS.accent;
  const factColor = palette?.fact ?? COLORS.green;
  const pillFill = palette?.pill ?? COLORS.accent;
  const pillStroke = palette?.pill ?? COLORS.accentBorder;
  const hoverPlanColor = palette?.pill ?? planColor;
  const hoverFactColor = palette?.pill ?? factColor;

  const idBase = `qlt-production-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const planGradId = `${idBase}-plan`;
  const factGradId = `${idBase}-fact`;
  const clipId = `${idBase}-clip`;

  const { step, intervals, ticks, prepared, dots, planLine, factLine, planArea, factArea } = model;

  const gridLines = Array.from({ length: intervals + 1 }, (_, i) => ({
    y: geo.plotBottom - (i / intervals) * geo.plotH,
    label: formatAxisCount(i * step),
  }));

  const hovered = hoverIndex !== null && hoverIndex < prepared.length ? prepared[hoverIndex] : null;
  const hoveredTickIndex = hovered ? ticks.findLastIndex(tick => tick.day <= hovered.day) : -1;

  const hoverTopY = hovered ? Math.min(hovered.yPlan, hovered.yFact) : 0;
  const hoverBottomY = hovered ? Math.max(hovered.yPlan, hovered.yFact) : 0;
  const tipAbove = hoverTopY - TIP_GAP - TIP_H;
  const tipTop = tipAbove >= 0 ? tipAbove : hoverBottomY + TIP_GAP;
  const tipLeft = hovered ? clamp(hovered.x - TIP_W / 2, 0, cardW - TIP_W) : 0;
  const dashX = hovered ? Math.round(hovered.x - 0.5) + 0.5 : 0;

  const tooltipRows = hovered
    ? [
        { key: 'plan', label: 'План', color: planColor, value: hovered.plan, cy: 46 },
        { key: 'fact', label: 'Факт', color: factColor, value: hovered.fact, cy: 71 },
      ]
    : [];

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (prepared.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const mx = PLOT_LEFT + ((event.clientX - bounds.left) / bounds.width) * geo.plotW;
    setHoverIndex(nearestIndex(prepared, mx));
  };

  const handleMouseLeave = () => setHoverIndex(null);

  const legendTextStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '16px',
    color: COLORS.text,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  return (
    <DashboardCard rect={rect} title={title}>
      {/* Легенда — справа в шапке карточки (прежний вид; 'header' — с разделителем между пунктами) */}
      {legend !== 'bottom' && (
        <div
          style={{
            position: 'absolute',
            right: 28,
            top: 22,
            height: 21,
            ...legendTextStyle,
            zIndex: 1,
          }}
        >
          {legend === 'header' ? (
            <>
              <LegendItem color={factColor} label="Факт расхода ТМЦ" />
              <LegendDivider />
              <LegendItem color={planColor} label="План расхода ТМЦ" />
            </>
          ) : (
            <>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: factColor, flexShrink: 0 }} />
              <span style={{ marginLeft: 9 }}>Факт расхода ТМЦ</span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: planColor, flexShrink: 0, marginLeft: 22 }} />
              <span style={{ marginLeft: 9 }}>План расхода ТМЦ</span>
            </>
          )}
        </div>
      )}

      <svg
        width={cardW}
        height={cardH}
        viewBox={`0 0 ${cardW} ${cardH}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={planGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={planColor} stopOpacity={0.17} />
            <stop offset="1" stopColor={planColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={factGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={factColor} stopOpacity={0.18} />
            <stop offset="1" stopColor={factColor} stopOpacity={0} />
          </linearGradient>
          {/* Окно отрисовки растёт слева направо вместе с прогрессом анимации */}
          <clipPath id={clipId}>
            <rect x={PLOT_LEFT} y={0} width={geo.plotW * progress} height={cardH} />
          </clipPath>
        </defs>

        {/* Сетка и подписи оси Y */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line x1={PLOT_LEFT} x2={geo.plotRight} y1={line.y} y2={line.y} stroke={COLORS.grid} strokeWidth={1} strokeLinecap="round" />
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
                fill={pillFill}
                stroke={pillStroke}
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
          {planLine && <path d={planLine} fill="none" stroke={planColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          {factLine && <path d={factLine} fill="none" stroke={factColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          {dots.map(point => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.yPlan} r={4} fill={planColor} />
              <circle cx={point.x} cy={point.yFact} r={4} fill={factColor} />
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
              y2={geo.plotBottom}
              stroke={COLORS.dashedLine}
              strokeWidth={1}
              strokeDasharray="4.4 4.4"
              strokeLinecap="square"
            />
            <circle cx={hovered.x} cy={hovered.yPlan} r={6} fill={hoverPlanColor} stroke={COLORS.white} strokeWidth={4} />
            <circle cx={hovered.x} cy={hovered.yFact} r={6} fill={hoverFactColor} stroke={COLORS.white} strokeWidth={4} />
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

      {/* Легенда внизу по центру карточки */}
      {legend === 'bottom' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: cardH - LEGEND_BOTTOM_INSET - 10,
            width: cardW,
            height: 20,
            justifyContent: 'center',
            ...legendTextStyle,
          }}
        >
          <LegendItem color={factColor} label="Факт расхода ТМЦ" />
          <LegendDivider />
          <LegendItem color={planColor} label="План расхода ТМЦ" />
        </div>
      )}

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
