// CostDistributionRadar.tsx — карточка «Распределение объема затрат по видам номенклатуры»: паутинка на 5..9 осей
import React from 'react';
import DashboardCard from './DashboardCard';
import { ANIM, CARD_RECTS, COLORS, FONT, RADAR_PALETTE } from './layout';
import { useProgress } from './animation';
import type { CostDistributionRadarProps, TypePercent } from './types';

const RECT = CARD_RECTS.distribution;

/** Центр паутинки в локальных координатах карточки и радиус шкалы 100% */
const CX = 360;
const CY = 227;
const R = 128;

/** Число спиц пустой сетки (когда items пуст) */
const EMPTY_AXES = 7;

/** Уровни сетки в процентах: 5 концентрических n-угольников */
const GRID_LEVELS = [20, 40, 60, 80, 100] as const;

/** Подписи шкалы вдоль верхней спицы */
const SCALE_LABELS = [0, 20, 40, 60, 80, 100] as const;

/** Подписи осей: якорь на радиусе R + 15, чип 16×7, текст 13px с переносом на две строки при ширине > 100 */
const ANCHOR_R = R + 15;
const CHIP_W = 16;
const CHIP_H = 7;
const CHIP_GAP_X = 6;
const CHIP_GAP_Y = 4;
const LABEL_FONT_SIZE = 13;
const LABEL_LINE_HEIGHT = 13;
const LABEL_MAX_WIDTH = 100;
/** Порог |cos| для «верхней»/«нижней» оси; остальные — правая (cos > 0) и левая (cos < 0) половины */
const VERTICAL_COS = 0.2;

/** Угол оси k из n: по часовой стрелке от 12 часов (в SVG ось Y направлена вниз) */
const axisAngle = (k: number, n: number): number => -Math.PI / 2 + (k * 2 * Math.PI) / n;

const polar = (radius: number, angle: number): { x: number; y: number } => ({
  x: CX + radius * Math.cos(angle),
  y: CY + radius * Math.sin(angle),
});

const toPoints = (points: { x: number; y: number }[]): string => points.map((p) => `${p.x},${p.y}`).join(' ');

/** Вершины правильного n-угольника радиуса radius по осям паутинки */
const ringPoints = (n: number, radius: number): string =>
  toPoints(Array.from({ length: n }, (_, k) => polar(radius, axisAngle(k, n))));

/** Y подписи шкалы: «0» в центре, «20…80» на 12px ниже вершины своего кольца, «100» — на 14px */
const scaleLabelY = (value: number): number => {
  if (value === 0) return CY;
  const radius = (R * value) / 100;
  return CY - (radius - (value === 100 ? 14 : 12));
};

/** Контекст canvas для измерения ширины текста подписей (без DOM — запасная оценка по числу символов) */
const measureContext: CanvasRenderingContext2D | null =
  typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');

const measureTextWidth = (text: string): number => {
  if (measureContext) {
    measureContext.font = `500 ${LABEL_FONT_SIZE}px ${FONT}`;
    return measureContext.measureText(text).width;
  }
  return text.length * LABEL_FONT_SIZE * 0.55;
};

/** Название оси в одну строку, либо в две — по пробелам, если ширина больше LABEL_MAX_WIDTH (жадно набираем первую строку) */
const wrapLabel = (name: string): string[] => {
  const text = name.trim();
  if (measureTextWidth(text) <= LABEL_MAX_WIDTH) return [text];
  const words = text.split(/\s+/);
  if (words.length < 2) return [text];
  let first = words[0];
  let next = 1;
  while (next < words.length && measureTextWidth(`${first} ${words[next]}`) <= LABEL_MAX_WIDTH) {
    first = `${first} ${words[next]}`;
    next += 1;
  }
  const rest = words.slice(next).join(' ');
  return rest ? [first, rest] : [first];
};

/** Раскладка подписи оси: чип (левый верхний угол), строки текста (центр по вертикали) и выравнивание */
interface AxisLabelLayout {
  chip: { x: number; y: number };
  lines: { text: string; y: number }[];
  textX: number;
  anchor: 'start' | 'middle' | 'end';
}

const layoutAxisLabel = (name: string, k: number, n: number): AxisLabelLayout => {
  const angle = axisAngle(k, n);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const anchor = polar(ANCHOR_R, angle);
  const lines = wrapLabel(name);
  const blockHeight = lines.length * LABEL_LINE_HEIGHT;
  const lineY = (top: number) => lines.map((text, i) => ({ text, y: top + (i + 0.5) * LABEL_LINE_HEIGHT }));

  if (Math.abs(cos) <= VERTICAL_COS) {
    // Верхняя и нижняя оси: чип по центру якоря, текст по центру над чипом (низ текста на 4px выше чипа) или под ним
    const chip = { x: anchor.x - CHIP_W / 2, y: anchor.y - CHIP_H / 2 };
    const top = sin < 0 ? chip.y - CHIP_GAP_Y - blockHeight : chip.y + CHIP_H + CHIP_GAP_Y;
    return { chip, lines: lineY(top), textX: anchor.x, anchor: 'middle' };
  }
  if (cos > 0) {
    // Правая половина: левый край чипа в якоре, текст слева направо от чипа + 6px, по вертикали центр = y якоря
    const chip = { x: anchor.x, y: anchor.y - CHIP_H / 2 };
    return { chip, lines: lineY(anchor.y - blockHeight / 2), textX: anchor.x + CHIP_W + CHIP_GAP_X, anchor: 'start' };
  }
  // Левая половина: правый край чипа в якоре, текст по правому краю, заканчивается за 6px до чипа
  const chip = { x: anchor.x - CHIP_W, y: anchor.y - CHIP_H / 2 };
  return { chip, lines: lineY(anchor.y - blockHeight / 2), textX: anchor.x - CHIP_W - CHIP_GAP_X, anchor: 'end' };
};

/** Доля вершины 0..∞ без NaN (контракт: максимум ≈ 90.9) */
const safePercent = (item: TypePercent): number => (Number.isFinite(item.percent) ? Math.max(0, item.percent) : 0);

/**
 * Полигон данных растёт из центра одной общей величиной прогресса: все вершины = центр + t·(вершина − центр),
 * поэтому все оси доходят до своих значений одновременно. Перезапуск по animationKey.
 */
const CostDistributionRadar: React.FC<CostDistributionRadarProps> = ({ items, onSettingsClick, animationKey }) => {
  const progress = useProgress(animationKey, ANIM.radar);

  const hasData = items.length > 0;
  const n = hasData ? items.length : EMPTY_AXES;

  const dataPoints = items.map((item, k) => polar(((R * safePercent(item)) / 100) * progress, axisAngle(k, n)));

  return (
    <DashboardCard rect={RECT} title="Распределение объема затрат по видам номенклатуры" onSettingsClick={onSettingsClick}>
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
        {/* Сетка: концентрические n-угольники и спицы */}
        {GRID_LEVELS.map((level) => (
          <polygon
            key={level}
            points={ringPoints(n, (R * level) / 100)}
            fill="none"
            stroke={COLORS.textMuted}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: n }, (_, k) => {
          const tip = polar(R, axisAngle(k, n));
          return (
            <line
              key={k}
              x1={CX}
              y1={CY}
              x2={tip.x}
              y2={tip.y}
              stroke={COLORS.textMuted}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          );
        })}

        {hasData && (
          <>
            {/* Подписи шкалы вдоль верхней спицы */}
            {SCALE_LABELS.map((value) => (
              <text
                key={value}
                x={CX}
                y={scaleLabelY(value)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={500}
                fill={COLORS.text}
              >
                {value}
              </text>
            ))}

            {/* Полигон данных */}
            <polygon
              points={toPoints(dataPoints)}
              fill={COLORS.accent}
              fillOpacity={0.4}
              stroke={COLORS.accent}
              strokeWidth={1.5}
            />

            {/* Подписи осей: цветной чип и название вида номенклатуры */}
            {items.map((item, k) => {
              const label = layoutAxisLabel(item.name, k, n);
              return (
                <g key={`${k}-${item.key}`}>
                  <rect
                    x={label.chip.x}
                    y={label.chip.y}
                    width={CHIP_W}
                    height={CHIP_H}
                    rx={2}
                    fill={RADAR_PALETTE[k % RADAR_PALETTE.length]}
                  />
                  {label.lines.map((line, i) => (
                    <text
                      key={i}
                      x={label.textX}
                      y={line.y}
                      textAnchor={label.anchor}
                      dominantBaseline="central"
                      fontSize={LABEL_FONT_SIZE}
                      fontWeight={500}
                      fill={COLORS.text}
                    >
                      {line.text}
                    </text>
                  ))}
                </g>
              );
            })}
          </>
        )}
      </svg>
    </DashboardCard>
  );
};

export default CostDistributionRadar;
