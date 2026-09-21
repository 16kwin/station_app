// AverageDefectCard.tsx — узкая карточка «Средний уровень брака»: число нарастает от 0 до значения.
// Карточка собрана flex-строкой, а не через DashboardCard: подпись и значение должны стоять
// на одной линии по центру карточки высотой 76px.
import React from 'react';
import type { AverageDefectCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { formatPercentInt } from '../shared/format';
import { useCountUp } from '../shared/animation';

const RECT = CARD_RECTS.average;

const AverageDefectCard: React.FC<AverageDefectCardProps> = ({ percent, animationKey }) => {
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  const animated = useCountUp(safePercent, animationKey, ANIM.countUp);

  return (
    <div
      style={{
        position: 'absolute',
        left: RECT.x,
        top: RECT.y,
        width: RECT.w,
        height: RECT.h,
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
        Средний уровень брака
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, lineHeight: '29px', color: COLORS.text, whiteSpace: 'nowrap' }}>
        {formatPercentInt(animated)}
      </span>
    </div>
  );
};

export default AverageDefectCard;
