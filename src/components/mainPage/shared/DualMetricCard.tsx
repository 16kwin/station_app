// DualMetricCard.tsx — карточка «два показателя» (аудитор, 8.png): две половины с названием, числом и кольцом доли,
// между ними вертикальный разделитель. Без заголовка карточки. Числа нарастают, дуги растут при загрузке.
import React from 'react';
import type { CardRect } from './layout';
import { ANIM, COLORS, FONT, SHADOWS } from './layout';
import { formatCount } from './format';
import { useProgress } from './animation';
import type { MetricIconKind } from '../operator/types';
import MetricGauge from './MetricGauge';

export interface DualMetric {
  name: string;
  value: number;
  /** Доля 0..100 — насколько заполнено кольцо */
  percent: number;
  color: string;
  icon: MetricIconKind;
}

export interface DualMetricCardProps {
  rect: CardRect;
  left: DualMetric;
  right: DualMetric;
  animationKey: number;
}

/* ---------- Геометрия по 8.png (карточка 344×236, локальные координаты) ---------- */
const DIVIDER_INSET = 30; // разделитель от верха и низа карточки
const DIVIDER_COLOR = '#E5ECF5';
const NAME_CY = 52; // центр блока названия; длинное название переносится на две строки вокруг этой линии
const NAME_LINE = 20;
const NAME_BOX_H = NAME_LINE * 2 + 4;
const NAME_SIDE = 20; // поля названия внутри половины: «Выдано сверхнормы» переносится, как на макете
const VALUE_CY = 86;
const GAUGE_CY = 155;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

const finite = (value: number): number => (Number.isFinite(value) ? value : 0);

const DualMetricCard: React.FC<DualMetricCardProps> = ({ rect, left, right, animationKey }) => {
  const progress = useProgress(animationKey, ANIM.gauge);
  const half = rect.w / 2;
  // Разделитель на целом пикселе + 0.5 — линия 1px остаётся чёткой
  const dividerX = Math.floor(half) + 0.5;

  const halves = [left, right].map((metric, i) => ({
    key: i === 0 ? 'left' : 'right',
    metric,
    x0: i * half,
    cx: i * half + half / 2,
  }));

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
        <line
          x1={dividerX}
          x2={dividerX}
          y1={DIVIDER_INSET}
          y2={rect.h - DIVIDER_INSET}
          stroke={DIVIDER_COLOR}
          strokeWidth={1}
        />

        {halves.map(({ key, metric, cx }) => (
          <g key={key}>
            <text
              x={cx}
              y={VALUE_CY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={20}
              fontWeight={700}
              fill={COLORS.text}
              style={TEXT_STYLE}
            >
              {formatCount(finite(metric.value) * progress)}
            </text>
            <MetricGauge
              cx={cx}
              cy={GAUGE_CY}
              percent={finite(metric.percent) * progress}
              color={metric.color}
              icon={metric.icon}
            />
          </g>
        ))}
      </svg>

      {/* Названия — HTML, чтобы длинное переносилось на вторую строку */}
      {halves.map(({ key, metric, x0 }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: x0 + NAME_SIDE,
            top: NAME_CY - NAME_BOX_H / 2,
            width: half - NAME_SIDE * 2,
            height: NAME_BOX_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: `${NAME_LINE}px`,
            color: COLORS.text,
            userSelect: 'none',
          }}
        >
          {metric.name}
        </div>
      ))}
    </div>
  );
};

export default DualMetricCard;
