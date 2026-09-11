// CostsByTypeCard.tsx — карточка «Затраты по видам номенклатуры»: сетка 3×3 полосок с названием и суммой
import React from 'react';
import type { CostsByTypeCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatRubDots } from './format';
import { useProgress } from './animation';
import DashboardCard from './DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const COLUMN_X = [40, 350, 660]; // левый край полоски по колонкам
const ROW_Y = [100, 167, 234]; // верх полоски по строкам
const COLUMNS = COLUMN_X.length;
const MAX_ITEMS = COLUMN_X.length * ROW_Y.length; // 9
const BAR_W = 260;
const BAR_H = 5;
const NAME_MAX_W = 190; // шире — обрезаем с многоточием
const TEXT_LINE_H = 16;
const TEXT_OFFSET = 16; // центр текста на 16px выше верха полоски
const FULL_SCALE = 1.1; // максимальная полоска ≈ 91% дорожки

const safeAmount = (value: number): number => (Number.isFinite(value) ? value : 0);

const CostsByTypeCard: React.FC<CostsByTypeCardProps> = ({ items, onSettingsClick, animationKey }) => {
  // Полоски растут за ANIM.bars, числа нарастают за ANIM.countUp (то же, что useCountUp: amount × прогресс)
  const barProgress = useProgress(animationKey, ANIM.bars);
  const countProgress = useProgress(animationKey, ANIM.countUp);

  const visible = items.slice(0, MAX_ITEMS);
  const amounts = visible.map((item) => safeAmount(item.amount));
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
  // Розовой подсвечивается полоска с минимальной суммой (первая из равных); единственный элемент — бирюзовый
  const minIndex = visible.length > 1 ? amounts.indexOf(minAmount) : -1;
  const scaleMax = maxAmount * FULL_SCALE;

  return (
    <DashboardCard rect={CARD_RECTS.costsByType} title="Затраты по видам номенклатуры" onSettingsClick={onSettingsClick}>
      {visible.map((item, index) => {
        const barLeft = COLUMN_X[index % COLUMNS];
        const barTop = ROW_Y[Math.floor(index / COLUMNS)];
        const textTop = barTop - TEXT_OFFSET - TEXT_LINE_H / 2;
        const ratio = scaleMax > 0 ? Math.min(1, Math.max(0, amounts[index] / scaleMax)) : 0;
        const fillWidth = BAR_W * ratio * barProgress;
        const fillColor = index === minIndex ? COLORS.fact : COLORS.teal;

        return (
          <React.Fragment key={`${index}:${item.key}`}>
            {/* Название вида */}
            <div
              style={{
                position: 'absolute',
                left: barLeft,
                top: textTop,
                maxWidth: NAME_MAX_W,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: `${TEXT_LINE_H}px`,
                color: COLORS.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {item.name}
            </div>

            {/* Сумма — по правому краю полоски */}
            <div
              style={{
                position: 'absolute',
                left: barLeft,
                top: textTop,
                width: BAR_W,
                textAlign: 'right',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: `${TEXT_LINE_H}px`,
                color: COLORS.valueText,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {formatRubDots(amounts[index] * countProgress)}
            </div>

            {/* Дорожка */}
            <div
              style={{
                position: 'absolute',
                left: barLeft,
                top: barTop,
                width: BAR_W,
                height: BAR_H,
                borderRadius: BAR_H / 2,
                backgroundColor: COLORS.track,
              }}
            />

            {/* Заполнение — растёт слева направо */}
            <div
              style={{
                position: 'absolute',
                left: barLeft,
                top: barTop,
                width: fillWidth,
                height: BAR_H,
                borderRadius: BAR_H / 2,
                backgroundColor: fillColor,
              }}
            />
          </React.Fragment>
        );
      })}
    </DashboardCard>
  );
};

export default CostsByTypeCard;
