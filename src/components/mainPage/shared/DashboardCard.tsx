// DashboardCard.tsx — рамка карточки панели: белый блок со скруглением 15, тенью, заголовком и кнопкой настроек
import React from 'react';
import { COLORS, FONT, SHADOWS } from './layout';
import type { CardRect } from './layout';

interface DashboardCardProps {
  rect: CardRect;
  title: string;
  /** Если передан — в правом верхнем углу рисуется кнопка настроек (36×36, иконка «ползунки») */
  onSettingsClick?: () => void;
  children?: React.ReactNode;
}

/** Иконка «ползунки» 16×14 (три линии с бегунками), обводка 1.8 */
const SettingsIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.2 1.5H15M1 1.5H2.7M2.7 1.5V3.2M2.7 1.5V-0.2M14.2 8H15M1 8H10.7M10.7 8V9.7M10.7 8V6.3M9.3 14.5H15M1 14.5H5.3M5.3 14.5V16.2M5.3 14.5V12.8"
      stroke={COLORS.text}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Карточка позиционируется абсолютно по `rect` внутри холста 1800×840.
 * Содержимое (`children`) кладётся в контейнер position:relative размером с карточку,
 * поэтому дочерние элементы позиционируются в локальных координатах карточки.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({ rect, title, onSettingsClick, children }) => {
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
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: 22,
          fontFamily: FONT,
          fontSize: 17,
          fontWeight: 500,
          lineHeight: '21px',
          color: COLORS.text,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          zIndex: 1,
        }}
      >
        {title}
      </div>

      {onSettingsClick && (
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Настройки карточки"
          style={{
            position: 'absolute',
            right: 20,
            top: 20,
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            padding: 0,
            backgroundColor: COLORS.white,
            boxShadow: SHADOWS.button,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          <SettingsIcon />
        </button>
      )}

      <div style={{ position: 'relative', width: rect.w, height: rect.h }}>{children}</div>
    </div>
  );
};

export default DashboardCard;
