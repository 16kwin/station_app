// QualityIndicatorsCard.tsx — карточка «Показатели качества»: два столбика-«градусника» Брак/Выпуск.
// Столбики, бейджи со значениями и сами числа растут одной анимацией.
// Панели ролей переиспользуют карточку со своим местом, заголовком и подписями/цветами столбиков
// (например, «Крит. остатки / В заказ» у начальника цеха).
import React, { useId } from 'react';
import type { IndicatorColumn, QualityIndicatorsCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import type { CardRect } from './layout';
import { formatCount } from '../shared/format';
import { useProgress } from '../shared/animation';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const COLUMN_STROKE = 2.5;
const MIN_SHARE = 0.45; // h = BASE_H × (0.45 + 0.55 × value / max)
const GLOW_W = 50;
const GLOW_R = 25;
const BADGE_W = 88;
const BADGE_H = 24;
const BADGE_GAP = 7;
const CIRCLE_R = 13;

/** Раскладка столбиков: центры по x, низ линии, высота самого высокого столбика, кружок, подпись */
interface ColumnsLayout {
  cx: [number, number];
  columnBottom: number;
  baseH: number;
  glowBottom: number;
  circleCy: number;
  labelCy: number;
}

/** Прежняя раскладка панели «Показатели» (карточка 400×250) */
const HOME_LAYOUT: ColumnsLayout = {
  cx: [140, 260],
  columnBottom: 168,
  baseH: 82,
  glowBottom: 210,
  circleCy: 190,
  labelCy: 226,
};

/* Раскладка панелей ролей (1.png, 6.png): столбики на ≈31% и ≈70% ширины, кружок с буквой на h − 71,
 * подпись на h − 30. Линия столбика кончается на 9px выше кружка — как в прежней раскладке и на макетах;
 * верх самого высокого столбика — на 97, чтобы бейдж над ним не наезжал на заголовок. */
const ROLE_LEFT_SHARE = 0.31;
const ROLE_RIGHT_SHARE = 0.7;
const ROLE_CIRCLE_INSET = 71;
const ROLE_LABEL_INSET = 30;
const ROLE_COLUMN_CIRCLE_GAP = 9;
const ROLE_TALLEST_TOP = 97;
/** Низ свечения — ниже центра кружка, как в прежней раскладке (190 → 210) */
const GLOW_BELOW_CIRCLE = 20;

const roleLayout = (rect: CardRect): ColumnsLayout => {
  const circleCy = rect.h - ROLE_CIRCLE_INSET;
  const columnBottom = circleCy - CIRCLE_R - ROLE_COLUMN_CIRCLE_GAP;
  return {
    cx: [Math.round(rect.w * ROLE_LEFT_SHARE), Math.round(rect.w * ROLE_RIGHT_SHARE)],
    columnBottom,
    baseH: Math.max(0, columnBottom - ROLE_TALLEST_TOP),
    glowBottom: circleCy + GLOW_BELOW_CIRCLE,
    circleCy,
    labelCy: rect.h - ROLE_LABEL_INSET,
  };
};

const DEFAULT_COLUMNS: { left: IndicatorColumn; right: IndicatorColumn } = {
  left: { label: 'Брак', letter: 'Б', color: COLORS.crimson, circleColor: COLORS.crimsonDark },
  right: { label: 'Выпуск', letter: 'В', color: COLORS.green, circleColor: COLORS.greenDark },
};

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

const safeValue = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

const QualityIndicatorsCard: React.FC<QualityIndicatorsCardProps> = ({
  released,
  defect,
  total,
  animationKey,
  rect,
  title = 'Показатели качества',
  columns = DEFAULT_COLUMNS,
  showTotal = true,
}) => {
  const progress = useProgress(animationKey, ANIM.indicators);
  const rawId = useId();
  const idBase = `qlt-indicators-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Без rect — прежнее место и раскладка «Показателей»; с rect — раскладка панелей ролей от размера карточки
  const cardRect = rect ?? CARD_RECTS.quality;
  const layout = rect ? roleLayout(rect) : HOME_LAYOUT;

  const specs = [
    { key: 'defect', cx: layout.cx[0], ...columns.left },
    { key: 'released', cx: layout.cx[1], ...columns.right },
  ];

  const values = [safeValue(defect), safeValue(released)];
  const maxValue = Math.max(values[0], values[1]);

  return (
    <DashboardCard rect={cardRect} title={title}>
      <svg
        width={cardRect.w}
        height={cardRect.h}
        viewBox={`0 0 ${cardRect.w} ${cardRect.h}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          {specs.map(spec => (
            <linearGradient key={spec.key} id={`${idBase}-${spec.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={spec.color} stopOpacity={0} />
              <stop offset="1" stopColor={spec.color} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>

        {specs.map((spec, index) => {
          const value = values[index];
          const fullHeight = maxValue > 0 ? layout.baseH * (MIN_SHARE + (1 - MIN_SHARE) * (value / maxValue)) : 0;
          const height = fullHeight * progress;
          const top = layout.columnBottom - height;
          const badgeTop = top - BADGE_GAP - BADGE_H;
          const animatedValue = value * progress;

          return (
            <g key={spec.key}>
              {/* Свечение за столбиком: верх едет вместе со столбиком, низ фиксирован */}
              <rect
                x={spec.cx - GLOW_W / 2}
                y={top}
                width={GLOW_W}
                height={layout.glowBottom - top}
                rx={GLOW_R}
                ry={GLOW_R}
                fill={`url(#${idBase}-${spec.key})`}
                opacity={0.5}
              />

              {height > 0 && (
                <line
                  x1={spec.cx}
                  y1={layout.columnBottom}
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

              <circle cx={spec.cx} cy={layout.circleCy} r={CIRCLE_R} fill={spec.circleColor} />
              <text
                x={spec.cx}
                y={layout.circleCy}
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
                y={layout.labelCy}
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
      {showTotal && (
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
      )}
    </DashboardCard>
  );
};

export default QualityIndicatorsCard;
