// DashboardHeader.tsx — шапка информационной панели: заголовок-кнопка выбора роли, переключатель блока,
// пилюля диапазона дат и кнопки «Фильтр» и «Куб». Общая для всех панелей главной страницы.
//
// Раскладка — flex-строка, а не абсолютные координаты: заголовки у ролей разной длины
// («Топ-менеджмент» против «Оператор склада: Цех №1, Участок №2»), и при фиксированных
// координатах длинный заголовок уезжал под переключатель блока.
import React from 'react';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import { COLORS, FONT, SHADOWS } from './layout';
import { isoToRu } from './format';
import type { AnchorRect } from './DateRangePopup';

export type { AnchorRect };

export interface DashboardHeaderProps {
  /** Заголовок панели; по клику открывается окно выбора роли */
  title: string;
  onTitleClick: () => void;
  /** Названия блоков роли; стрелки листают список по кругу. При одном блоке переключатель скрыт */
  blocks: string[];
  blockIndex: number;
  onBlockChange: (index: number) => void;
  /** Диапазон дат; если не передан — пилюля дат и кнопки-инструменты не рисуются */
  range?: { from: string; to: string };
  onDateClick?: (anchor: AnchorRect) => void;
  onDateReset?: () => void;
  /** Кнопки «Фильтр» и «Куб» рядом с пилюлей дат; у аудитора по макету их нет */
  showTools?: boolean;
}

// Геометрия шапки в координатах холста 1800×840
const HEADER_HEIGHT = 107;
const SIDE = 40;
const TITLE_HEIGHT = 54;
const TITLE_PADDING_X = 20;
const SWITCHER = { width: 294, height: 54 } as const;
const ARROW_BUTTON_SIZE = 40;
const DATE_PILL = { width: 266, height: 40 } as const;
const TOOL_SIZE = 40;

/** Иконка календаря 14×16 — контур CalendarIcon14 из assets, белая */
const CALENDAR_ICON_PATH =
  'M3.44932e-06 12.6398V4.96016C3.44932e-06 4.52531 -0.000829624 4.15076 0.0235494 3.84375C0.0486741 3.52753 0.104512 3.21284 0.254452 2.91016C0.47814 2.45867 0.834817 2.0918 1.27377 1.86172C1.56804 1.70749 1.87399 1.65006 2.18143 1.62422C2.44261 1.60228 2.75413 1.601 3.11111 1.60078V0.8C3.11111 0.358172 3.45934 0 3.88889 0C4.31844 0 4.66667 0.358172 4.66667 0.8V1.6H9.33333V0.8C9.33333 0.358172 9.68155 0 10.1111 0C10.5407 0 10.8889 0.358172 10.8889 0.8V1.60078C11.2459 1.601 11.5575 1.60226 11.8186 1.62422C12.1259 1.65008 12.4314 1.70758 12.7255 1.86172C13.1636 2.09134 13.5214 2.4578 13.7455 2.91016C13.8954 3.21265 13.9513 3.5271 13.9764 3.84297C14.0008 4.1496 14 4.52384 14 4.95781V12.643C14 13.0769 14.0008 13.4506 13.9764 13.757C13.9513 14.0729 13.8954 14.3874 13.7455 14.6898C13.5216 15.1416 13.1639 15.5085 12.7255 15.7383C12.4314 15.8924 12.1257 15.9499 11.8186 15.9758C11.5207 16.0008 11.1572 16 10.7355 16H3.26454C2.84262 16 2.47878 16.0008 2.18067 15.9758C1.87358 15.95 1.56786 15.8924 1.27377 15.7383C0.834475 15.508 0.477911 15.1408 0.254452 14.6898C0.104542 14.3872 0.0486826 14.0725 0.0235494 13.7562C-0.000833101 13.4494 3.44932e-06 13.0747 3.44932e-06 12.6398ZM3.89041 11.2C4.09984 11.2 4.30081 11.2865 4.44716 11.4406C4.5935 11.5947 4.67308 11.8034 4.66819 12.0187V12.0203C4.66336 12.2324 4.57666 12.434 4.42741 12.5805C4.27818 12.7269 4.07834 12.8065 3.87218 12.8016H3.87066C3.44848 12.7912 3.11111 12.4359 3.11111 12.0016V12C3.11111 11.5582 3.45934 11.2 3.88889 11.2H3.89041ZM7.00152 11.2C7.21095 11.2 7.41192 11.2865 7.55827 11.4406C7.70461 11.5947 7.78419 11.8034 7.7793 12.0187V12.0203C7.77447 12.2324 7.68777 12.434 7.53852 12.5805C7.38929 12.7269 7.18945 12.8065 6.98329 12.8016H6.98177C6.55959 12.7912 6.22222 12.4359 6.22222 12.0016V12C6.22222 11.5582 6.57045 11.2 7 11.2H7.00152ZM10.1126 11.2C10.3221 11.2 10.523 11.2865 10.6694 11.4406C10.8157 11.5947 10.8953 11.8034 10.8904 12.0187V12.0203C10.8856 12.2324 10.7989 12.434 10.6496 12.5805C10.5004 12.7269 10.3006 12.8065 10.0944 12.8016H10.0929C9.67069 12.7912 9.33333 12.4359 9.33333 12.0016V12C9.33333 11.5582 9.68155 11.2 10.1111 11.2H10.1126ZM3.89041 8C4.09984 8 4.30081 8.08653 4.44716 8.24062C4.5935 8.39471 4.67308 8.6034 4.66819 8.81875V8.82031C4.66336 9.03244 4.57666 9.23399 4.42741 9.38047C4.27818 9.52687 4.07834 9.60653 3.87218 9.60156H3.87066C3.44848 9.59117 3.11111 9.23593 3.11111 8.80156V8.8C3.11111 8.35817 3.45934 8 3.88889 8H3.89041ZM7.00152 8C7.21095 8 7.41192 8.08653 7.55827 8.24062C7.70461 8.39471 7.78419 8.6034 7.7793 8.81875V8.82031C7.77447 9.03244 7.68777 9.23399 7.53852 9.38047C7.38929 9.52687 7.18945 9.60653 6.98329 9.60156H6.98177C6.55959 9.59117 6.22222 9.23593 6.22222 8.80156V8.8C6.22222 8.35817 6.57045 8 7 8H7.00152ZM10.1126 8C10.5422 8 10.8904 8.35817 10.8904 8.8V8.80156C10.8904 9.01705 10.8056 9.22367 10.6557 9.37422C10.5059 9.52451 10.3036 9.6066 10.0944 9.60156H10.0929C9.67069 9.59117 9.33333 9.23593 9.33333 8.80156V8.8C9.33333 8.35817 9.68155 8 10.1111 8H10.1126ZM3.26682 3.2C2.8184 3.2 2.52874 3.20101 2.30827 3.21953C2.09687 3.23729 2.01855 3.26737 1.98015 3.2875C1.83384 3.36419 1.71519 3.48623 1.64063 3.63672C1.62106 3.67622 1.59182 3.75678 1.57455 3.97422C1.55871 4.17359 1.55666 4.42799 1.55632 4.8H12.4437C12.4433 4.42743 12.4421 4.17286 12.4262 3.97344C12.409 3.75675 12.3796 3.67616 12.3601 3.63672C12.286 3.48705 12.1663 3.36464 12.0191 3.2875C11.9805 3.26731 11.9025 3.23649 11.6917 3.21875C11.4715 3.20023 11.1816 3.2 10.7332 3.2H3.26682ZM1.55556 12.6398C1.55556 13.1011 1.55654 13.3992 1.57455 13.6258C1.59181 13.843 1.62102 13.9237 1.64063 13.9633C1.71543 14.1141 1.83432 14.2369 1.98015 14.3133C2.01849 14.3333 2.09685 14.3635 2.30751 14.3812C2.52758 14.3997 2.81697 14.4 3.26454 14.4H10.7355C11.1828 14.4 11.4719 14.3997 11.6917 14.3812C11.9019 14.3636 11.9806 14.3334 12.0191 14.3133C12.1658 14.2364 12.2858 14.1134 12.3601 13.9633C12.3797 13.9238 12.409 13.8433 12.4262 13.6266C12.4442 13.4004 12.4444 13.1033 12.4444 12.643V6.4H1.55556V12.6398Z';

/** Шеврон переключателя блока 7×12 */
const Chevron: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d={direction === 'left' ? 'M6 1L1 6L6 11' : 'M1 1L6 6L1 11'}
      stroke={COLORS.text}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Шеврон вниз 12×7 — подсказка, что заголовок открывает выбор роли */
const ChevronDown: React.FC = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M1 1L6 6L11 1" stroke={COLORS.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Иконка календаря 14×16, белая */
const CalendarIcon: React.FC = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d={CALENDAR_ICON_PATH} fill={COLORS.white} />
  </svg>
);

/** Крестик 8×8 — две линии, белые */
const CrossIcon: React.FC = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L7 7M7 1L1 7" stroke={COLORS.white} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Иконка «3D-куб» 18×18 — изометрический куб контуром */
const CubeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z" stroke={COLORS.text} strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M2.5 5.25L9 9L15.5 5.25M9 9V16.5" stroke={COLORS.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Прозрачная кнопка 40×40 со стрелкой переключателя блока */
const switcherArrowStyle: React.CSSProperties = {
  width: ARROW_BUTTON_SIZE,
  height: ARROW_BUTTON_SIZE,
  border: 'none',
  padding: 0,
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  userSelect: 'none',
  flexShrink: 0,
};

/** Белая кнопка-инструмент 40×40 справа в шапке («Фильтр», «Куб») */
const toolButtonStyle: React.CSSProperties = {
  width: TOOL_SIZE,
  height: TOOL_SIZE,
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
  flexShrink: 0,
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  onTitleClick,
  blocks,
  blockIndex,
  onBlockChange,
  range,
  onDateClick,
  onDateReset,
  showTools = true,
}) => {
  const handlePrevBlock = () => onBlockChange((blockIndex - 1 + blocks.length) % blocks.length);
  const handleNextBlock = () => onBlockChange((blockIndex + 1) % blocks.length);

  // Якорь попапа — положение пилюли в окне на момент клика
  const handleDateClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onDateClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onDateClick({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  };

  const handleDateReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDateReset?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: HEADER_HEIGHT,
        padding: `0 ${SIDE}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* Заголовок панели — кнопка выбора роли */}
      <button
        type="button"
        onClick={onTitleClick}
        aria-label="Выбрать информационную панель"
        style={{
          flex: '0 1 auto',
          minWidth: 0,
          height: TITLE_HEIGHT,
          padding: `0 ${TITLE_PADDING_X}px`,
          border: 'none',
          borderRadius: 15,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          outline: 'none',
          fontFamily: FONT,
          userSelect: 'none',
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: '29px',
            color: COLORS.text,
          }}
        >
          {title}
        </span>
        <ChevronDown />
      </button>

      <div style={{ flex: 1, minWidth: 12 }} />

      {/* Переключатель блока — только если блоков больше одного */}
      {blocks.length > 1 && (
        <div
          style={{
            flexShrink: 0,
            width: SWITCHER.width,
            height: SWITCHER.height,
            borderRadius: 15,
            backgroundColor: COLORS.white,
            boxShadow: SHADOWS.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 7px',
            boxSizing: 'border-box',
            userSelect: 'none',
          }}
        >
          <button type="button" aria-label="Предыдущий блок" onClick={handlePrevBlock} style={switcherArrowStyle}>
            <Chevron direction="left" />
          </button>
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '19px',
              color: COLORS.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {blocks[blockIndex]}
          </span>
          <button type="button" aria-label="Следующий блок" onClick={handleNextBlock} style={switcherArrowStyle}>
            <Chevron direction="right" />
          </button>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 12 }} />

      {/* Период и кнопки-инструменты */}
      {range && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            role="button"
            aria-label="Выбрать период"
            onClick={handleDateClick}
            style={{
              position: 'relative',
              width: DATE_PILL.width,
              height: DATE_PILL.height,
              borderRadius: 20,
              backgroundColor: COLORS.accent,
              boxShadow: SHADOWS.datePill,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              padding: '0 14px',
              boxSizing: 'border-box',
              userSelect: 'none',
            }}
          >
            <CalendarIcon />
            <span
              style={{
                flex: 1,
                fontFamily: FONT,
                fontSize: 16,
                fontWeight: 500,
                lineHeight: '19px',
                color: COLORS.white,
                whiteSpace: 'nowrap',
              }}
            >
              {isoToRu(range.from)} - {isoToRu(range.to)}
            </span>
            <button
              type="button"
              aria-label="Сбросить период"
              onClick={handleDateReset}
              style={{
                width: 24,
                height: 24,
                border: 'none',
                padding: 0,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                flexShrink: 0,
              }}
            >
              <CrossIcon />
            </button>
          </div>

          {showTools && (
            <>
              <button type="button" aria-label="Фильтр" style={toolButtonStyle}>
                <img src={FilterIcon18Black} alt="" draggable={false} style={{ width: 18, height: 18 }} />
              </button>
              <button type="button" aria-label="Куб" style={toolButtonStyle}>
                <CubeIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
