// QualityIndicatorsCard.tsx — карточка «Показатели качества»: два столбика-«градусника» Брак/Выпуск.
// Столбики, бейджи со значениями и сами числа растут одной анимацией.
import React, { useId } from 'react';
import type { QualityIndicatorsCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatCount } from '../shared/format';
import { useProgress } from '../shared/animation';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const CARD_W = CARD_RECTS.quality.w; // 340
const CARD_H = CARD_RECTS.quality.h; // 250
const COLUMN_BOTTOM = 168;
const COLUMN_STROKE = 2.5;
const BASE_H = 82; // h = 82 × (0.45 + 0.55 × value / max)
const MIN_SHARE = 0.45;
const GLOW_W = 50;
const GLOW_R = 25;
const GLOW_BOTTOM = 210;
const BADGE_W = 88;
const BADGE_H = 24;
const BADGE_GAP = 7;
const CIRCLE_CY = 190;
const CIRCLE_R = 13;
const LABEL_CY = 226;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

interface ColumnSpec {
  key: string;
  cx: number;
  color: string;
  circleColor: string;
  letter: string;
  label: string;
}

const COLUMN_SPECS: ColumnSpec[] = [
  { key: 'defect', cx: 140, color: COLORS.crimson, circleColor: COLORS.crimsonDark, letter: 'Б', label: 'Брак' },
  { key: 'released', cx: 260, color: COLORS.green, circleColor: COLORS.greenDark, letter: 'В', label: 'Выпуск' },
];

const safeValue = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

const QualityIndicatorsCard: React.FC<QualityIndicatorsCardProps> = ({ released, defect, total, animationKey }) => {
  const progress = useProgress(animationKey, ANIM.indicators);
  const rawId = useId();
  const idBase = `qlt-indicators-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const values = [safeValue(defect), safeValue(released)];
  const maxValue = Math.max(values[0], values[1]);

  return (
    <DashboardCard rect={CARD_RECTS.quality} title="Показатели качества">
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          {COLUMN_SPECS.map(spec => (
            <linearGradient key={spec.key} id={`${idBase}-${spec.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={spec.color} stopOpacity={0} />
              <stop offset="1" stopColor={spec.color} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>

        {COLUMN_SPECS.map((spec, index) => {
          const value = values[index];
          const fullHeight = maxValue > 0 ? BASE_H * (MIN_SHARE + (1 - MIN_SHARE) * (value / maxValue)) : 0;
          const height = fullHeight * progress;
          const top = COLUMN_BOTTOM - height;
          const badgeTop = top - BADGE_GAP - BADGE_H;
          const animatedValue = value * progress;

          return (
            <g key={spec.key}>
              {/* Свечение за столбиком: верх едет вместе со столбиком, низ фиксирован */}
              <rect
                x={spec.cx - GLOW_W / 2}
                y={top}
                width={GLOW_W}
                height={GLOW_BOTTOM - top}
                rx={GLOW_R}
                ry={GLOW_R}
                fill={`url(#${idBase}-${spec.key})`}
                opacity={0.5}
              />

              {height > 0 && (
                <line
                  x1={spec.cx}
                  y1={COLUMN_BOTTOM}
                  x2={spec.cx}
                  y2={top}
                  stroke={spec.color}
                  strokeWidth={COLUMN_STROKE}
                  strokeLinecap="round"
                />
              )}

              <rect x={spec.cx - BADGE_W / 2} y={badgeTop} width={BADGE_W} height={BADGE_H} rx={BADGE_H / 2} ry={BADGE_H / 2} fill={spec.color} />
              <text
                x={spec.cx}
                y={badgeTop + BADGE_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
                fill={COLORS.white}
                style={TEXT_STYLE}
              >
                {formatCount(animatedValue)}
              </text>

              <circle cx={spec.cx} cy={CIRCLE_CY} r={CIRCLE_R} fill={spec.circleColor} />
              <text
                x={spec.cx}
                y={CIRCLE_CY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
                fill={COLORS.white}
                style={TEXT_STYLE}
              >
                {spec.letter}
              </text>

              <text
                x={spec.cx}
                y={LABEL_CY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={500}
                fill={COLORS.textMuted}
                style={TEXT_STYLE}
              >
                {spec.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Всего выпуск с производства — база, от которой считается уровень брака */}
      <div
        style={{
          position: 'absolute',
          right: 28,
          top: 24,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: '17px',
          color: COLORS.textMuted,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {`Всего ${formatCount(safeValue(total))}`}
      </div>
    </DashboardCard>
  );
};

export default QualityIndicatorsCard;
