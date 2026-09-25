// MetricGauge.tsx — кольцо доли с иконкой (макеты 6.png, 8.png): светлая дорожка, дуга от 6 часов по часовой,
// внутри белый круг и цветной кружок с белой иконкой. Рисуется внутри чужого <svg> в его координатах.
import React from 'react';
import type { MetricIconKind } from '../operator/types';
import { COLORS } from './layout';

/** Размеры по макетам: радиус по центру линии 42, толщина 7, цветной кружок r = 20, иконка 20×20 */
const DEFAULT_R = 42;
const DEFAULT_STROKE = 7;
const DEFAULT_ICON_R = 20;
const ICON_BOX = 20;
/** Цвет дорожки кольца на макетах */
const GAUGE_TRACK = '#F3F5FA';

interface MetricGaugeProps {
  /** Центр кольца в координатах родительского svg */
  cx: number;
  cy: number;
  /** Нарисованная доля 0..100 (уже с учётом анимации); вне диапазона — обрезается */
  percent: number;
  /** Цвет дуги и кружка с иконкой */
  color: string;
  icon: MetricIconKind;
  /** Радиус кольца по центру линии */
  r?: number;
  /** Толщина кольца */
  stroke?: number;
  /** Радиус цветного кружка с иконкой */
  iconR?: number;
}

/** Точка кольца: отсчёт от 6 часов по часовой стрелке, share — доля окружности в процентах */
const pointOnGauge = (cx: number, cy: number, r: number, share: number): { x: number; y: number } => {
  const angle = Math.PI + (share / 100) * 2 * Math.PI; // 6 часов = π от 12 часов
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
};

/** Дуга от 6 часов по часовой стрелке на долю share (0 < share ≤ 100) */
const gaugeArc = (cx: number, cy: number, r: number, share: number): string => {
  const start = pointOnGauge(cx, cy, r, 0);
  const end = pointOnGauge(cx, cy, r, Math.min(share, 99.99));
  const largeArc = share > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

/** Белые контурные иконки в квадрате 20×20 (обводка 1.6) */
const ICON_STROKE = {
  stroke: COLORS.white,
  strokeWidth: 1.6,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const GaugeIcon: React.FC<{ kind: MetricIconKind }> = ({ kind }) => {
  switch (kind) {
    case 'stations':
      // Коробка (изометрический куб) с лентой на крышке и галочкой справа внизу
      return (
        <>
          <path d="M9 1.8L15.4 5.2V11.4L9 14.8L2.6 11.4V5.2L9 1.8Z" {...ICON_STROKE} />
          <path d="M2.6 5.2L9 8.6L15.4 5.2M9 8.6V14.8M5.8 3.5L12.2 6.9" {...ICON_STROKE} />
          <path d="M12.6 16L14.4 17.8L18 14.2" {...ICON_STROKE} />
        </>
      );
    case 'issued':
      // Лоток со стрелкой вверх — выдача
      return (
        <>
          <rect x={2.6} y={2.6} width={14.8} height={14.8} rx={3.2} {...ICON_STROKE} />
          <path d="M2.6 11.6H6.4L7.9 13.6H12.1L13.6 11.6H17.4" {...ICON_STROKE} />
          <path d="M10 9.2V5M7.9 7L10 4.9L12.1 7" {...ICON_STROKE} />
        </>
      );
    case 'overNorm':
      // Стопка из трёх слоёв и стрелка вверх справа — сверх нормы
      return (
        <>
          <path d="M8.2 3.4L14.4 6.5L8.2 9.6L2 6.5L8.2 3.4Z" {...ICON_STROKE} />
          <path d="M2 9.8L8.2 12.9L14.4 9.8M2 13.1L8.2 16.2L14.4 13.1" {...ICON_STROKE} />
          <path d="M17.6 9.4V3M15.8 4.8L17.6 3L19.4 4.8" {...ICON_STROKE} />
        </>
      );
    case 'sgd':
      // Склад: крыша, стены, ворота с полкой — СГД
      return (
        <>
          <path d="M2.4 8L10 3L17.6 8V17.2H2.4V8Z" {...ICON_STROKE} />
          <path d="M6.4 17.2V11.4H13.6V17.2M6.4 14.3H13.6" {...ICON_STROKE} />
        </>
      );
    case 'incidents':
      // Треугольник с восклицательным знаком — инцидент
      return (
        <>
          <path d="M10 2.8L18.2 16.8H1.8L10 2.8Z" {...ICON_STROKE} />
          <path d="M10 7.8V11.6" {...ICON_STROKE} />
          <circle cx={10} cy={14.1} r={1} fill={COLORS.white} />
        </>
      );
    default:
      return null;
  }
};

const MetricGauge: React.FC<MetricGaugeProps> = ({
  cx,
  cy,
  percent,
  color,
  icon,
  r = DEFAULT_R,
  stroke = DEFAULT_STROKE,
  iconR = DEFAULT_ICON_R,
}) => {
  const share = Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 100) : 0;
  return (
    <>
      {/* Дорожка и дуга доли от 6 часов */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GAUGE_TRACK} strokeWidth={stroke} />
      {share > 0 && (
        <path d={gaugeArc(cx, cy, r, share)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      )}

      {/* Белый круг внутри кольца и цветной кружок с белой иконкой */}
      <circle cx={cx} cy={cy} r={r - stroke / 2} fill={COLORS.white} />
      <circle cx={cx} cy={cy} r={iconR} fill={color} />
      <g transform={`translate(${cx - ICON_BOX / 2}, ${cy - ICON_BOX / 2})`}>
        <GaugeIcon kind={icon} />
      </g>
    </>
  );
};

export default MetricGauge;
