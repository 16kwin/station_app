// OperatorMetricCard.tsx — карточка-показатель панели оператора: подпись, значение и кольцо доли.
// Кольцо заполняется от 6 часов по часовой стрелке, число нарастает с нуля.
import React, { useId } from 'react';
import type { OperatorMetricCardProps } from './types';
import { ANIM, COLORS, FONT, METRIC_COLORS, METRIC_RECTS, SHADOWS } from './layout';
import { formatCount } from '../shared/format';
import { useProgress } from '../shared/animation';

const SPARK_TOP = 18;
const SPARK_HEIGHT = 38;
const SPARK_SIDE = 18;
const NAME_CY = 88;
const VALUE_CY = 120;
const GAUGE_CY = 172;
const GAUGE_R = 32;
const GAUGE_STROKE = 6;
const ICON_R = 21;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/** Точка кольца: отсчёт от 6 часов по часовой стрелке, share — доля окружности в процентах */
const pointOnGauge = (cx: number, cy: number, r: number, share: number): { x: number; y: number } => {
  const angle = Math.PI + (share / 100) * 2 * Math.PI; // 6 часов = π от 12 часов
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
};

/** Дуга кольца от 6 часов по часовой стрелке на долю share */
const gaugeArc = (cx: number, cy: number, r: number, share: number): string => {
  if (share <= 0) return '';
  const start = pointOnGauge(cx, cy, r, 0);
  const end = pointOnGauge(cx, cy, r, Math.min(share, 99.99));
  const largeArc = share > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

/** Декоративная кривая в шапке карточки: детерминированная синусоида со сдвигом по индексу */
const sparkPath = (width: number, height: number, phase: number, amplitude: number): string => {
  const steps = 26;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = SPARK_SIDE + t * width;
    const wave = Math.sin(t * Math.PI * 3 + phase) * 0.6 + Math.sin(t * Math.PI * 5 + phase * 1.7) * 0.4;
    const y = SPARK_TOP + height / 2 - wave * amplitude;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
};

const safePercent = (value: number): number => (Number.isFinite(value) && value > 0 ? Math.min(value, 100) : 0);

const OperatorMetricCard: React.FC<OperatorMetricCardProps> = ({ metric, index, animationKey }) => {
  const rect = METRIC_RECTS[index] ?? METRIC_RECTS[0];
  const color = METRIC_COLORS[index % METRIC_COLORS.length];
  const progress = useProgress(animationKey, ANIM.gauge);
  // Кривые в шапке прорисовываются слева направо своей, более медленной анимацией
  const sparkProgress = useProgress(animationKey, ANIM.line);
  const rawId = useId();
  const sparkClipId = `op-spark-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const percent = safePercent(metric.percent);
  const cx = rect.w / 2;
  const sparkWidth = rect.w - SPARK_SIDE * 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.card,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <svg
        width={rect.w}
        height={rect.h}
        viewBox={`0 0 ${rect.w} ${rect.h}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block' }}
      >
        <defs>
          {/* Окно отрисовки кривых растёт слева направо */}
          <clipPath id={sparkClipId}>
            <rect x={0} y={0} width={SPARK_SIDE + sparkWidth * sparkProgress} height={SPARK_TOP + SPARK_HEIGHT + 8} />
          </clipPath>
        </defs>

        {/* Декоративные кривые в шапке карточки */}
        <g clipPath={`url(#${sparkClipId})`}>
          {[0, 1, 2].map(line => (
            <path
              key={line}
              d={sparkPath(sparkWidth, SPARK_HEIGHT, index * 0.8 + line * 0.5, 7 + line * 3)}
              fill="none"
              stroke={color}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.5 - line * 0.13}
            />
          ))}
        </g>

        <text
          x={cx}
          y={NAME_CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={500}
          fill={COLORS.textMuted}
          style={TEXT_STYLE}
        >
          {metric.name}
        </text>

        <text
          x={cx}
          y={VALUE_CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={26}
          fontWeight={700}
          fill={COLORS.text}
          style={TEXT_STYLE}
        >
          {formatCount(metric.value * progress)}
        </text>

        {/* Кольцо доли: дорожка и дуга от 6 часов */}
        <circle cx={cx} cy={GAUGE_CY} r={GAUGE_R} fill="none" stroke={COLORS.track} strokeWidth={GAUGE_STROKE} />
        {percent * progress > 0 && (
          <path
            d={gaugeArc(cx, GAUGE_CY, GAUGE_R, percent * progress)}
            fill="none"
            stroke={color}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
          />
        )}

        {/* Кружок с иконкой в центре кольца */}
        <circle cx={cx} cy={GAUGE_CY} r={ICON_R} fill={color} opacity={0.16} />
        <g transform={`translate(${cx - 9}, ${GAUGE_CY - 9})`}>
          <path d="M9 1.2L16 4.9V12.1L9 15.8L2 12.1V4.9L9 1.2Z" stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
          <path d="M2 4.9L9 8.6L16 4.9M9 8.6V15.8" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Доля от базы — под кольцом */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: GAUGE_CY + GAUGE_R + 10,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '15px',
          color: COLORS.textMuted,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {`${percent.toFixed(1).replace('.', ',')}% от ${formatCount(metric.base)}`}
      </div>
    </div>
  );
};

export default OperatorMetricCard;
