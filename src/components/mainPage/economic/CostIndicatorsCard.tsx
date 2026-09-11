// CostIndicatorsCard.tsx — карточка «Показатели затрат (руб.)»: два столбика-«градусника» Закупки/Выдача
import React, { useId } from 'react';
import type { CostIndicatorsCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatRubSpaces } from './format';
import { useProgress } from './animation';
import DashboardCard from './DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const CARD_W = CARD_RECTS.indicators.w; // 278
const CARD_H = CARD_RECTS.indicators.h; // 273
const COLUMN_BOTTOM = 184; // низ столбика
const COLUMN_STROKE = 2.5;
const BASE_H = 90; // h = 90 × (0.45 + 0.55 × value / max)
const MIN_SHARE = 0.45;
const GLOW_W = 50;
const GLOW_R = 25;
const GLOW_BOTTOM = 231; // низ свечения фиксирован
const BADGE_W = 80;
const BADGE_H = 24;
const BADGE_GAP = 7; // низ бейджа на 7px выше верха столбика
const CIRCLE_CY = 206;
const CIRCLE_R = 13;
const LABEL_CY = 246;

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
  { key: 'purchases', cx: 85, color: COLORS.fact, circleColor: COLORS.pinkDark, letter: 'З', label: 'Закупки' },
  { key: 'issue', cx: 193, color: COLORS.plan, circleColor: COLORS.tealDark, letter: 'В', label: 'Выдача' },
];

const safeValue = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

const CostIndicatorsCard: React.FC<CostIndicatorsCardProps> = ({ purchases, issue, animationKey }) => {
  // Одна анимация на оба столбика: высота, положение бейджа, свечение и число растут вместе
  const progress = useProgress(animationKey, ANIM.indicators);
  const rawId = useId();
  const idBase = `eco-indicators-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const values = [safeValue(purchases), safeValue(issue)];
  const maxValue = Math.max(values[0], values[1]);

  return (
    <DashboardCard rect={CARD_RECTS.indicators} title="Показатели затрат (руб.)">
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          {COLUMN_SPECS.map((spec) => (
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

              {/* Столбик */}
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

              {/* Бейдж со значением над столбиком */}
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
                {formatRubSpaces(animatedValue)}
              </text>

              {/* Кружок с буквой */}
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

              {/* Подпись */}
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
    </DashboardCard>
  );
};

export default CostIndicatorsCard;
