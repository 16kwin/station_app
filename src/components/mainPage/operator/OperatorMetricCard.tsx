// OperatorMetricCard.tsx — карточка-показатель: декоративные волны, подпись, значение и кольцо доли.
// Кольцо заполняется от 6 часов по часовой стрелке, число нарастает с нуля.
// Два вида: панель оператора склада (по `index`, как было) и карточка начальника цеха (6.png) — если задан `icon`.
import React, { useId } from 'react';
import type { OperatorMetricCardProps } from './types';
import { ANIM, COLORS, FONT, METRIC_COLORS, METRIC_RECTS, SHADOWS } from './layout';
import { formatCount } from '../shared/format';
import { useProgress } from '../shared/animation';
import MetricGauge from '../shared/MetricGauge';

/* Кольцо вида «оператор склада»: радиус, толщина и кружок с контурной иконкой */
const GAUGE_R = 32;
const GAUGE_STROKE = 6;
const ICON_R = 21;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/** Вид карточки: полоса волн, подпись и число (центры строк от верха), центр кольца — от низа карточки */
interface CardLook {
  sparkTop: number;
  sparkHeight: number;
  /** Поля волн слева и справа */
  sparkSide: number;
  sparkSteps: number;
  /** Форма волны: основная синусоида (1.5 периода) и гармоника (2.5 периода) с этими весами */
  waveMain: number;
  waveHarmonic: number;
  /** Размах волн: base + номер линии × step */
  amplitudeBase: number;
  amplitudeStep: number;
  /** Прозрачность волн: base − номер линии × step */
  opacityBase: number;
  opacityStep: number;
  nameCy: number;
  nameSize: number;
  nameColor: string;
  valueCy: number;
  valueSize: number;
  /** Центр кольца = h − gaugeBottom */
  gaugeBottom: number;
}

/** Оператор склада (240×230): волны с полями 18, подпись 14px серым, число 26px, кольцо r 32 и подпись доли под ним */
const OPERATOR_LOOK: CardLook = {
  sparkTop: 18,
  sparkHeight: 38,
  sparkSide: 18,
  sparkSteps: 26,
  waveMain: 0.6,
  waveHarmonic: 0.4,
  amplitudeBase: 7,
  amplitudeStep: 3,
  opacityBase: 0.5,
  opacityStep: 0.13,
  nameCy: 88,
  nameSize: 14,
  nameColor: COLORS.textMuted,
  valueCy: 120,
  valueSize: 26,
  gaugeBottom: 58, // 172 при высоте 230
};

/** Начальник цеха (6.png, 220×272): волны во всю ширину в полосе 10..75, подпись 16px тёмным, число 20px, кольцо MetricGauge */
const ICON_LOOK: CardLook = {
  sparkTop: 10,
  sparkHeight: 65,
  sparkSide: 0,
  sparkSteps: 44,
  waveMain: 0.8,
  waveHarmonic: 0.2,
  amplitudeBase: 14,
  amplitudeStep: 3,
  opacityBase: 0.45,
  opacityStep: 0.07,
  nameCy: 91,
  nameSize: 16,
  nameColor: COLORS.text,
  valueCy: 128,
  valueSize: 20,
  gaugeBottom: 74,
};

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
const sparkPath = (look: CardLook, width: number, phase: number, amplitude: number): string => {
  const steps = look.sparkSteps;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = look.sparkSide + t * width;
    const wave = Math.sin(t * Math.PI * 3 + phase) * look.waveMain + Math.sin(t * Math.PI * 5 + phase * 1.7) * look.waveHarmonic;
    const y = look.sparkTop + look.sparkHeight / 2 - wave * amplitude;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
};

const safePercent = (value: number): number => (Number.isFinite(value) && value > 0 ? Math.min(value, 100) : 0);

const OperatorMetricCard: React.FC<OperatorMetricCardProps> = ({
  metric,
  index,
  animationKey,
  rect: rectProp,
  color: colorProp,
  icon,
}) => {
  const rect = rectProp ?? METRIC_RECTS[index] ?? METRIC_RECTS[0];
  const color = colorProp ?? METRIC_COLORS[index % METRIC_COLORS.length];
  const look = icon ? ICON_LOOK : OPERATOR_LOOK;
  const progress = useProgress(animationKey, ANIM.gauge);
  // Кривые в шапке прорисовываются слева направо своей, более медленной анимацией
  const sparkProgress = useProgress(animationKey, ANIM.line);
  const rawId = useId();
  const sparkClipId = `op-spark-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const percent = safePercent(metric.percent);
  const cx = rect.w / 2;
  const gaugeCy = rect.h - look.gaugeBottom;
  const sparkWidth = rect.w - look.sparkSide * 2;
  // В новом виде битое значение показывается нулём; вид оператора оставлен как был
  const value = icon && !Number.isFinite(metric.value) ? 0 : metric.value;

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
            <rect
              x={0}
              y={0}
              width={look.sparkSide + sparkWidth * sparkProgress}
              height={look.sparkTop + look.sparkHeight + 8}
            />
          </clipPath>
        </defs>

        {/* Декоративные кривые в шапке карточки */}
        <g clipPath={`url(#${sparkClipId})`}>
          {[0, 1, 2].map(line => (
            <path
              key={line}
              d={sparkPath(look, sparkWidth, index * 0.8 + line * 0.5, look.amplitudeBase + line * look.amplitudeStep)}
              fill="none"
              stroke={color}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={look.opacityBase - line * look.opacityStep}
            />
          ))}
        </g>

        <text
          x={cx}
          y={look.nameCy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={look.nameSize}
          fontWeight={500}
          fill={look.nameColor}
          style={TEXT_STYLE}
        >
          {metric.name}
        </text>

        <text
          x={cx}
          y={look.valueCy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={look.valueSize}
          fontWeight={700}
          fill={COLORS.text}
          style={TEXT_STYLE}
        >
          {formatCount(value * progress)}
        </text>

        {icon ? (
          /* Кольцо по 6.png: светлая дорожка, дуга, белый круг и цветной кружок с белой иконкой */
          <MetricGauge cx={cx} cy={gaugeCy} percent={percent * progress} color={color} icon={icon} />
        ) : (
          <>
            {/* Кольцо доли: дорожка и дуга от 6 часов */}
            <circle cx={cx} cy={gaugeCy} r={GAUGE_R} fill="none" stroke={COLORS.track} strokeWidth={GAUGE_STROKE} />
            {percent * progress > 0 && (
              <path
                d={gaugeArc(cx, gaugeCy, GAUGE_R, percent * progress)}
                fill="none"
                stroke={color}
                strokeWidth={GAUGE_STROKE}
                strokeLinecap="round"
              />
            )}

            {/* Кружок с иконкой в центре кольца */}
            <circle cx={cx} cy={gaugeCy} r={ICON_R} fill={color} opacity={0.16} />
            <g transform={`translate(${cx - 9}, ${gaugeCy - 9})`}>
              <path d="M9 1.2L16 4.9V12.1L9 15.8L2 12.1V4.9L9 1.2Z" stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
              <path d="M2 4.9L9 8.6L16 4.9M9 8.6V15.8" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        )}
      </svg>

      {/* Доля от базы — под кольцом (только вид оператора склада) */}
      {!icon && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: gaugeCy + GAUGE_R + 10,
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
      )}
    </div>
  );
};

export default OperatorMetricCard;
