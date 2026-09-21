// ProductionQcCard.tsx — карточка «Производство»: кольцо прохождения контроля качества
// с подписями-выносками. Кольцо формируется против часовой стрелки от отметки около часа:
// первым идёт зелёный сектор «Прошли КК», за ним «Не прошли КК» и «Ожидают КК».
// Между секторами остаётся зазор, концы секторов скруглены.
import React from 'react';
import type { ProductionQcCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatCount, formatPercentInt } from '../shared/format';
import { useProgress } from '../shared/animation';
import { clamp } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const CARD_W = CARD_RECTS.qc.w; // 400
const CARD_H = CARD_RECTS.qc.h; // 327
const CX = 200;
const CY = 180;
/** Радиус по центру линии кольца и её толщина */
const RING_R = 75;
const RING_STROKE = 22;
const RING_OUTER = RING_R + RING_STROKE / 2;
/** Точка касания выноски и точка её излома */
const ANCHOR_R = RING_OUTER + 4;
const ELBOW_R = RING_OUTER + 18;
const SIDE = 24;
const SHELF_MIN_Y = 66;
const SHELF_MAX_Y = CARD_H - 46;
const SHELF_MIN_GAP = 46;
/** Начало кольца — чуть правее 12 часов, дальше против часовой стрелки */
const START_DEG = 20;
/** Видимый зазор между секторами, градусов */
const GAP_DEG = 4;
/** Насколько скруглённый конец линии выступает за конец дуги, в градусах */
const CAP_DEG = ((RING_STROKE / 2) / RING_R) * (180 / Math.PI);
const SWEEP_DURATION = ANIM.ring * 2;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/** Точка на окружности: угол в градусах от 12 часов по часовой стрелке */
const pointAt = (r: number, deg: number): { x: number; y: number } => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
};

/** Дуга против часовой стрелки от `fromDeg` к `toDeg` (toDeg меньше fromDeg) */
const arcCounterClockwise = (r: number, fromDeg: number, toDeg: number): string => {
  const span = fromDeg - toDeg;
  if (span <= 0.05) return '';
  const start = pointAt(r, fromDeg);
  const end = pointAt(r, toDeg);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
};

const safePercent = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

interface SegmentSpec {
  key: string;
  label: string;
  color: string;
  percent: number;
  value: number;
}

interface Segment extends SegmentSpec {
  /** Границы дуги с учётом зазора, в градусах от 12 часов по часовой стрелке */
  pathFrom: number;
  pathTo: number;
  /** Сколько градусов от начала кольца нужно пройти, чтобы дойти до начала дуги */
  offset: number;
  midDeg: number;
  side: 'left' | 'right';
  shelfY: number;
}

/**
 * Секторы идут против часовой стрелки от START_DEG. Каждая дуга укорачивается так, чтобы
 * после скруглённых концов между соседями оставался зазор GAP_DEG.
 */
const buildSegments = (specs: SegmentSpec[]): Segment[] => {
  let cursor = START_DEG;
  const segments: Segment[] = [];

  for (const spec of specs) {
    const size = (spec.percent / 100) * 360;
    if (size <= 0) continue;
    const segStart = cursor;
    const segEnd = cursor - size;
    cursor = segEnd;

    // Длина самой дуги: скруглённые концы добавят по CAP_DEG с каждой стороны
    const arcLength = Math.max(0.2, size - GAP_DEG - 2 * CAP_DEG);
    const trim = (size - arcLength) / 2;
    const anchor = pointAt(ELBOW_R, (segStart + segEnd) / 2);

    segments.push({
      ...spec,
      pathFrom: segStart - trim,
      pathTo: segEnd + trim,
      offset: START_DEG - segStart + trim,
      midDeg: (segStart + segEnd) / 2,
      side: anchor.x >= CX ? 'right' : 'left',
      shelfY: clamp(anchor.y, SHELF_MIN_Y, SHELF_MAX_Y),
    });
  }

  // Подписи одной стороны разводим по вертикали
  for (const side of ['left', 'right'] as const) {
    const column = segments.filter(item => item.side === side).sort((a, b) => a.shelfY - b.shelfY);
    for (let i = 1; i < column.length; i++) {
      const gap = column[i].shelfY - column[i - 1].shelfY;
      if (gap < SHELF_MIN_GAP) column[i].shelfY = column[i - 1].shelfY + SHELF_MIN_GAP;
    }
    const overflow = column.length > 0 ? column[column.length - 1].shelfY - SHELF_MAX_Y : 0;
    if (overflow > 0) for (const item of column) item.shelfY = Math.max(SHELF_MIN_Y, item.shelfY - overflow);
  }

  return segments;
};

/** Горизонтальная полка выноски начинается за силуэтом кольца на своей высоте */
const shelfInnerX = (segment: Segment): number => {
  const dy = Math.abs(segment.shelfY - CY);
  const halfWidth = dy < RING_OUTER ? Math.sqrt(RING_OUTER * RING_OUTER - dy * dy) : 0;
  const elbow = pointAt(ELBOW_R, segment.midDeg);
  return segment.side === 'right'
    ? Math.max(CX + halfWidth + 10, elbow.x + 6)
    : Math.min(CX - halfWidth - 10, elbow.x - 6);
};

/** Путь выноски: от кольца к излому, затем горизонтальная полка под подписью */
const leaderPath = (segment: Segment): string => {
  const anchor = pointAt(ANCHOR_R, segment.midDeg);
  const elbow = pointAt(ELBOW_R, segment.midDeg);
  const inner = shelfInnerX(segment);
  const outer = segment.side === 'right' ? CARD_W - SIDE : SIDE;
  return [
    `M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`,
    `L ${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)}`,
    `L ${inner.toFixed(1)} ${segment.shelfY.toFixed(1)}`,
    `L ${outer} ${segment.shelfY.toFixed(1)}`,
  ].join(' ');
};

const ProductionQcCard: React.FC<ProductionQcCardProps> = ({ qc, animationKey }) => {
  const progress = useProgress(animationKey, SWEEP_DURATION);

  // Порядок против часовой стрелки: зелёный, розовый, серый — как на макете
  const segments = buildSegments([
    { key: 'passed', label: 'Прошли КК', color: COLORS.green, percent: safePercent(qc.passedPercent), value: qc.passed },
    { key: 'failed', label: 'Не прошли КК', color: COLORS.pink, percent: safePercent(qc.failedPercent), value: qc.failed },
    { key: 'waiting', label: 'Ожидают КК', color: COLORS.neutral, percent: safePercent(qc.waitingPercent), value: qc.waiting },
  ]);

  // Пройденная часть кольца, градусов от начала против часовой стрелки
  const drawnDeg = 360 * progress;

  return (
    <DashboardCard rect={CARD_RECTS.qc} title="Производство">
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        {/* Секторы */}
        {segments.map(segment => {
          const full = segment.pathFrom - segment.pathTo;
          const drawn = clamp(drawnDeg - segment.offset, 0, full);
          const path = arcCounterClockwise(RING_R, segment.pathFrom, segment.pathFrom - drawn);
          if (!path) return null;
          return (
            <path key={segment.key} d={path} fill="none" stroke={segment.color} strokeWidth={RING_STROKE} strokeLinecap="round" />
          );
        })}

        {/* Выноски и подписи */}
        {segments.map(segment => {
          const outer = segment.side === 'right' ? CARD_W - SIDE : SIDE;
          const anchorSide = segment.side === 'right' ? 'end' : 'start';
          const value = formatCount(segment.value);
          const percent = formatPercentInt(segment.percent);

          return (
            <g key={`leader-${segment.key}`} opacity={clamp(progress * 1.8 - 0.8, 0, 1)}>
              <path d={leaderPath(segment)} fill="none" stroke={segment.color} strokeWidth={1.5} strokeLinejoin="round" />
              <text
                x={outer}
                y={segment.shelfY - 12}
                textAnchor={anchorSide}
                dominantBaseline="central"
                fontSize={13}
                fontWeight={500}
                fill={COLORS.text}
                style={TEXT_STYLE}
              >
                {segment.label}
              </text>
              <text x={outer} y={segment.shelfY + 16} textAnchor={anchorSide} dominantBaseline="central" fontSize={14} style={TEXT_STYLE}>
                {/* Значение ближе к краю карточки, доля — ближе к кольцу */}
                {segment.side === 'right' ? (
                  <>
                    <tspan fontWeight={500} fill={COLORS.textMuted}>
                      {percent}
                    </tspan>
                    <tspan fontWeight={600} fill={COLORS.valueText}>
                      {`  ${value}`}
                    </tspan>
                  </>
                ) : (
                  <>
                    <tspan fontWeight={600} fill={COLORS.valueText}>
                      {value}
                    </tspan>
                    <tspan fontWeight={500} fill={COLORS.textMuted}>
                      {`  ${percent}`}
                    </tspan>
                  </>
                )}
              </text>
            </g>
          );
        })}

        {/* Всего выпуск с производства */}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={700} fill={COLORS.text} style={TEXT_STYLE}>
          {`${formatCount(qc.total * progress)}*`}
        </text>
      </svg>

      {/* Сноска к числу в центре */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 16,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '15px',
          color: COLORS.textMuted,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        *единицы продукции с производства
      </div>
    </DashboardCard>
  );
};

export default ProductionQcCard;
