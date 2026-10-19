// DocumentProgressBar.tsx — прогресс-бар этапов документа
import React from 'react';

import BarIcon18White0 from '../../assets/Icons/BarIcons/BarIcon18White0.svg';
import BarIcon18White1 from '../../assets/Icons/BarIcons/BarIcon18White1.svg';
import BarIcon18White2 from '../../assets/Icons/BarIcons/BarIcon18White2.svg';
import BarIcon18White3 from '../../assets/Icons/BarIcons/BarIcon18White3.svg';
import BarIcon18White4 from '../../assets/Icons/BarIcons/BarIcon18White4.svg';
import BarIcon18White5 from '../../assets/Icons/BarIcons/BarIcon18White5.svg';

export interface DocumentProgressBarProps {
  /** Индекс активного этапа: -1 = ничего не активно, 0..5 = этап активен/пройден */
  activeStep: number;
  /** Подписи этапов (по умолчанию — стандартные) */
  labels?: string[];
  /** Смещение от левого края контейнера */
  left?: number;
  /** Смещение от нижнего края контейнера */
  bottom?: number;
}

const CIRCLE_SIZE = 36;
const LINE_W = 120;
const LINE_H = 4;
const LINE_RADIUS = 2;
const GAP = 6;
const TEXT_GAP = 6;
const TEXT_H = 16;
const TEXT_FONT_SIZE = 13;

const COLOR_ACTIVE = '#666EFE';
const COLOR_INACTIVE = 'rgba(45, 64, 89, 0.3)';
const ICON_SIZE = 18;

const DEFAULT_LABELS = [
  'Не взят в работу',
  'Отгружается',
  'Отгружено',
  'Частично закрыт',
  'Загружается',
  'Заказ закрыт',
];

const ICONS = [
  BarIcon18White0,
  BarIcon18White1,
  BarIcon18White2,
  BarIcon18White3,
  BarIcon18White4,
  BarIcon18White5,
];

const DocumentProgressBar: React.FC<DocumentProgressBarProps> = ({
  activeStep,
  labels = DEFAULT_LABELS,
  left = 66,
  bottom = 43,
}) => {
  const totalWidth =
    labels.length * CIRCLE_SIZE +
    (labels.length - 1) * (GAP + LINE_W + GAP);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom,
        width: totalWidth,
        height: CIRCLE_SIZE + TEXT_GAP + TEXT_H,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {labels.map((label, idx) => {
        const isReached = activeStep >= 0 && idx <= activeStep;
        const circleColor = isReached ? COLOR_ACTIVE : COLOR_INACTIVE;
        const textColor = isReached ? COLOR_ACTIVE : COLOR_INACTIVE;

        const circleLeft = idx * (CIRCLE_SIZE + GAP + LINE_W + GAP);

        return (
          <React.Fragment key={idx}>
            {/* Круг */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: circleLeft,
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: '50%',
                backgroundColor: circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={ICONS[idx]}
                alt=""
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  opacity: isReached ? 1 : 0.3,
                }}
              />
            </div>

            {/* Текст под кругом */}
            <div
              style={{
                position: 'absolute',
                top: CIRCLE_SIZE + TEXT_GAP,
                left: circleLeft,
                width: CIRCLE_SIZE,
                height: TEXT_H,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontSize: TEXT_FONT_SIZE,
                fontWeight: 400,
                color: textColor,
                lineHeight: `${TEXT_H}px`,
                whiteSpace: 'nowrap',
                transform: 'translateX(-50%)',
                marginLeft: CIRCLE_SIZE / 2,
              }}
            >
              {label}
            </div>

            {/* Линия после круга (кроме последнего) */}
            {idx < labels.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: (CIRCLE_SIZE - LINE_H) / 2,
                  left: circleLeft + CIRCLE_SIZE + GAP,
                  width: LINE_W,
                  height: LINE_H,
                  borderRadius: LINE_RADIUS,
                  background:
                    isReached && idx < activeStep
                      ? COLOR_ACTIVE
                      : isReached && idx === activeStep
                      ? `linear-gradient(to right, ${COLOR_ACTIVE}, ${COLOR_INACTIVE})`
                      : COLOR_INACTIVE,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DocumentProgressBar;