// BudgetExecutionCard.tsx — карточка «Исполнение бюджета»: кольцо бюджета, до трёх колец-грейдов, число в центре и легенда
import React from 'react';
import DashboardCard from './DashboardCard';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatBudgetPercent } from './format';
import { easeOutCubic, useProgress } from './animation';
import type { BudgetExecutionCardProps } from './types';

const RECT = CARD_RECTS.budget;

/** Центр колец в локальных координатах карточки */
const CX = 137;
const CY = 156;

/** Кольцо «Бюджет»: радиус по центру линии и толщина */
const BUDGET_R = 93.5;
const BUDGET_STROKE = 7;

/** Толщина колец-грейдов и радиус точек на концах дуги */
const GRADE_STROKE = 6;
const DOT_R = 5.6;

/** Кольцо-грейд: радиус по центру линии, цвет и процент, с которого начинается грейд */
interface GradeRing {
  r: number;
  color: string;
  from: number;
}

/** Порядок — снаружи внутрь: «Исполнение», «Превышение свыше 100%», «Превышение свыше 200%» */
const GRADE_RINGS: readonly GradeRing[] = [
  { r: 82.5, color: COLORS.yellow, from: 0 },
  { r: 71.5, color: COLORS.orange, from: 100 },
  { r: 60.5, color: COLORS.red, from: 200 },
];

/** Легенда: кружок r=5 на x=282, текст на left 296; у двухстрочных пунктов кружок между строками */
interface LegendEntry {
  color: string;
  dotY: number;
  lines: { text: string; y: number }[];
}

const LEGEND: readonly LegendEntry[] = [
  { color: COLORS.purple, dotY: 108, lines: [{ text: 'Бюджет', y: 108 }] },
  { color: COLORS.yellow, dotY: 137, lines: [{ text: 'Исполнение', y: 137 }] },
  {
    color: COLORS.orange,
    dotY: 172,
    lines: [
      { text: 'Превышение', y: 164 },
      { text: 'свыше 100%', y: 180 },
    ],
  },
  {
    color: COLORS.red,
    dotY: 213,
    lines: [
      { text: 'Превышение', y: 205 },
      { text: 'свыше 200%', y: 221 },
    ],
  },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Линейный прогресс. Объявлен на уровне модуля: ссылка стабильна, иначе эффект useProgress перезапускался бы на каждом рендере */
const linear = (t: number): number => t;

/** Точка на окружности радиуса r: угол отсчитывается от 12 часов по часовой стрелке, share — доля окружности в процентах */
const pointOnRing = (r: number, share: number): { x: number; y: number } => {
  const angle = (share / 100) * 2 * Math.PI;
  return { x: CX + r * Math.sin(angle), y: CY - r * Math.cos(angle) };
};

/** Путь дуги от 12 часов по часовой стрелке на долю share (0 < share < 100) окружности; sweep-flag 1 = по часовой */
const arcPath = (r: number, share: number): string => {
  const end = pointOnRing(r, share);
  const largeArc = share > 50 ? 1 : 0;
  return `M ${CX} ${CY - r} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

/**
 * Кольца рисуются последовательно: жёлтое, затем оранжевое, затем красное — только те, чья доля > 0,
 * по ANIM.ring на каждое. Общий прогресс один (линейный по суммарному времени), а прогресс каждого кольца
 * выводится из него на своём отрезке и смягчается easeOutCubic — так всё стартует и перезапускается вместе.
 * Число в центре растёт синхронно с дугами: percent × (нарисовано / всего). Свыше 300% все три кольца
 * полные, меняется только число.
 */
const BudgetExecutionCard: React.FC<BudgetExecutionCardProps> = ({ percent, animationKey }) => {
  // Защита от NaN/Infinity/отрицательных значений (например, План = 0)
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0;

  // Доли грейдов, 0..100 каждая: p1 = clamp(percent), p2 = clamp(percent − 100), p3 = clamp(percent − 200)
  const shares = GRADE_RINGS.map((ring) => clamp(safePercent - ring.from, 0, 100));

  // Номер кольца в очереди анимации (−1 — кольцо не рисуется)
  const order: number[] = [];
  let activeCount = 0;
  for (const share of shares) {
    order.push(share > 0 ? activeCount : -1);
    if (share > 0) activeCount += 1;
  }

  // Суммарное время — по ANIM.ring на каждое ненулевое кольцо, но не менее ANIM.ring
  const totalDuration = Math.max(1, activeCount) * ANIM.ring;
  const progress = useProgress(animationKey, totalDuration, 0, linear);

  // Нарисованная доля каждого кольца: кольцо с номером i занимает отрезок [i, i + 1] шкалы progress × activeCount
  const drawn = shares.map((share, i) => {
    if (share <= 0) return 0;
    const local = clamp(progress * activeCount - order[i], 0, 1);
    return share * easeOutCubic(local);
  });

  const totalShare = shares.reduce((sum, share) => sum + share, 0);
  const drawnShare = drawn.reduce((sum, share) => sum + share, 0);
  const animatedPercent = totalShare > 0 ? (safePercent * drawnShare) / totalShare : 0;

  const captionLines = safePercent > 100 ? ['Превышение', 'бюджета'] : ['Затраты в рамках', 'бюджета'];

  return (
    <DashboardCard rect={RECT} title="Исполнение бюджета">
      <svg
        width={RECT.w}
        height={RECT.h}
        viewBox={`0 0 ${RECT.w} ${RECT.h}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'block',
          overflow: 'visible',
          fontFamily: FONT,
          userSelect: 'none',
        }}
      >
        {/* Кольцо «Бюджет» — всегда полное, без точки */}
        <circle cx={CX} cy={CY} r={BUDGET_R} fill="none" stroke={COLORS.purple} strokeWidth={BUDGET_STROKE} />

        {/* Кольца-грейды: дуга от 12 часов по часовой, точки в начале и в конце; при полной дуге — одна точка */}
        {GRADE_RINGS.map((ring, i) => {
          const share = drawn[i];
          if (share <= 0) return null;
          const full = share >= 100;
          const end = pointOnRing(ring.r, share);
          return (
            <g key={ring.from}>
              {full ? (
                <circle cx={CX} cy={CY} r={ring.r} fill="none" stroke={ring.color} strokeWidth={GRADE_STROKE} />
              ) : (
                <path d={arcPath(ring.r, share)} fill="none" stroke={ring.color} strokeWidth={GRADE_STROKE} />
              )}
              <circle cx={CX} cy={CY - ring.r} r={DOT_R} fill={ring.color} />
              {!full && <circle cx={end.x} cy={end.y} r={DOT_R} fill={ring.color} />}
            </g>
          );
        })}

        {/* Число в центре и подпись под ним */}
        <text
          x={CX}
          y={149}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={24}
          fontWeight={700}
          fill={COLORS.text}
        >
          {formatBudgetPercent(animatedPercent)}
        </text>
        {captionLines.map((line, i) => (
          <text
            key={line}
            x={CX}
            y={i === 0 ? 172 : 186}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={500}
            fill={COLORS.textMuted}
          >
            {line}
          </text>
        ))}

        {/* Разделитель между кольцами и легендой */}
        <line
          x1={256}
          y1={100}
          x2={256}
          y2={200}
          stroke={COLORS.textMuted}
          strokeOpacity={0.48}
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Легенда — всегда все четыре пункта */}
        {LEGEND.map((entry) => (
          <g key={entry.color}>
            <circle cx={282} cy={entry.dotY} r={5} fill={entry.color} />
            {entry.lines.map((line) => (
              <text
                key={line.text}
                x={296}
                y={line.y}
                textAnchor="start"
                dominantBaseline="central"
                fontSize={14}
                fontWeight={500}
                fill={COLORS.text}
              >
                {line.text}
              </text>
            ))}
          </g>
        ))}
      </svg>
    </DashboardCard>
  );
};

export default BudgetExecutionCard;
