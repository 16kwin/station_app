// AverageDefectCard.tsx — карточка «Средний уровень брака»: число нарастает от 0 до значения.
// Вид 'pill' (по умолчанию) — узкая строка: подпись слева, значение справа; собрана flex-строкой,
// а не через DashboardCard: подпись и значение стоят на одной линии по центру карточки высотой 76px.
// Вид 'ring' (контролер) — подпись по центру, под ней число в тонком кольце, которое прорисовывается
// от 12 часов по часовой стрелке.
import React from 'react';
import type { AverageDefectCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import type { CardRect } from './layout';
import { formatPercentInt } from '../shared/format';
import { useCountUp, useProgress } from '../shared/animation';

const LABEL = 'Средний уровень брака';

/* ---------- Вид 'ring' (локальные координаты карточки, px) ----------
 * Содержимое центрировано по высоте: при высоте 313 центр подписи на y=107, центр кольца на y=175. */
const RING_LABEL_OFFSET = -49.5; // центр подписи относительно середины высоты
const RING_CENTER_OFFSET = 18.5; // центр кольца относительно середины высоты
const RING_R = 37;
const RING_STROKE = 2;
const RING_LENGTH = 2 * Math.PI * RING_R;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/** Белая карточка на холсте без заголовка */
const cardStyle = (rect: CardRect): React.CSSProperties => ({
  position: 'absolute',
  left: rect.x,
  top: rect.y,
  width: rect.w,
  height: rect.h,
});

interface VariantProps {
  percent: number;
  animationKey: number;
  rect: CardRect;
}

/** Строка «Средний уровень брака … 14%» — прежний вид панели «Показатели» */
const AverageDefectPill: React.FC<VariantProps> = ({ percent, animationKey, rect }) => {
  const animated = useCountUp(percent, animationKey, ANIM.countUp);

  return (
    <div
      style={{
        ...cardStyle(rect),
        padding: '0 28px',
        boxSizing: 'border-box',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.card,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        fontFamily: FONT,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 500, lineHeight: '21px', color: COLORS.text, whiteSpace: 'nowrap' }}>
        {LABEL}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, lineHeight: '29px', color: COLORS.text, whiteSpace: 'nowrap' }}>
        {formatPercentInt(animated)}
      </span>
    </div>
  );
};

/** Подпись по центру и число в кольце — карточка контролера (1.png) */
const AverageDefectRing: React.FC<VariantProps & { color: string }> = ({ percent, animationKey, rect, color }) => {
  const animated = useCountUp(percent, animationKey, ANIM.countUp);
  const drawn = useProgress(animationKey, ANIM.ring);

  const cx = rect.w / 2;
  const labelCy = rect.h / 2 + RING_LABEL_OFFSET;
  const ringCy = rect.h / 2 + RING_CENTER_OFFSET;

  return (
    <div
      style={{
        ...cardStyle(rect),
        boxSizing: 'border-box',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.card,
        fontFamily: FONT,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: labelCy - 10,
          height: 20,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 500,
          lineHeight: '20px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
        }}
      >
        {LABEL}
      </div>

      <svg
        width={rect.w}
        height={rect.h}
        viewBox={`0 0 ${rect.w} ${rect.h}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        {/* Окружность прорисовывается от 12 часов по часовой стрелке: старт штриха повёрнут на −90° */}
        <circle
          cx={cx}
          cy={ringCy}
          r={RING_R}
          fill={COLORS.white}
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - drawn)}
          transform={`rotate(-90 ${cx} ${ringCy})`}
        />
        <text
          x={cx}
          y={ringCy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight={600}
          fill={COLORS.text}
          style={TEXT_STYLE}
        >
          {formatPercentInt(animated)}
        </text>
      </svg>
    </div>
  );
};

const AverageDefectCard: React.FC<AverageDefectCardProps> = ({
  percent,
  animationKey,
  rect = CARD_RECTS.average,
  variant = 'pill',
  color = COLORS.purple,
}) => {
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0;

  return variant === 'ring' ? (
    <AverageDefectRing percent={safePercent} animationKey={animationKey} rect={rect} color={color} />
  ) : (
    <AverageDefectPill percent={safePercent} animationKey={animationKey} rect={rect} />
  );
};

export default AverageDefectCard;
