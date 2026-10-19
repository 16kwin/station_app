// icons.tsx — линейные иконки документа ГПП, которых нет среди SVG в assets: шеврон, звезда, «свернуть/развернуть
// все», тип графика, квадратный флажок строки, «−/+» дерева. Манера — как у иконок приложения: контур, скругления.
import React from 'react';
import { COLORS } from './theme';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode; viewBox?: string }> = ({
  size = 18,
  color = COLORS.text,
  strokeWidth = 2,
  viewBox = '0 0 24 24',
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'block' }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M6.5 9.5L12 15l5.5-5.5" />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M14.5 6.5L9 12l5.5 5.5" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M9.5 6.5L15 12l-5.5 5.5" />
  </Svg>
);

/** Звезда «избранное»: залитая — документ в избранном */
export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ filled = false, color = COLORS.accent, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path
      d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

/** «Свернуть все»: стрелки сверху и снизу сходятся к черте */
export const CollapseAllIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M12 2.5v6.5M8.8 6l3.2 3.2L15.2 6M12 21.5V15M8.8 18l3.2-3.2 3.2 3.2M4 12h16" />
  </Svg>
);

/** «Развернуть все»: стрелки расходятся от черты */
export const ExpandAllIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M12 9V2.5M8.8 5.7L12 2.5l3.2 3.2M12 15v6.5M8.8 18.3l3.2 3.2 3.2-3.2M4 12h16" />
  </Svg>
);

/** Общий по предприятию — дерево из трёх узлов */
export const TreeTypeIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <circle cx="12" cy="5" r="2.4" />
    <circle cx="5.5" cy="18.5" r="2.4" />
    <circle cx="18.5" cy="18.5" r="2.4" />
    <path d="M12 7.4v3.6M5.5 16.1V13.5a2.5 2.5 0 0 1 2.5-2.5h8a2.5 2.5 0 0 1 2.5 2.5v2.6" />
  </Svg>
);

/** Последовательный — этапы «ступенькой» */
export const SequenceIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="2.5" y="3.5" width="7" height="4" rx="1.5" />
    <rect x="8.5" y="10" width="7" height="4" rx="1.5" />
    <rect x="14.5" y="16.5" width="7" height="4" rx="1.5" />
    <path d="M9.5 5.5h2v4.3M15.5 12h2v4.3" strokeWidth={1.5} />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
);

export const MinusIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M5.5 12h13" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M5.5 12.5l4.2 4.2 8.8-9.2" />
  </Svg>
);

export const WarningIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M12 3.5l9.5 16.5h-19z" />
    <path d="M12 10v4.5M12 17.2v.3" />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const DownloadIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M12 3.5v11.5M7.5 10.5L12 15l4.5-4.5M4 19.5h16" />
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M20 11.5A8 8 0 1 0 17.7 17M20 5v6.5h-6.5" />
  </Svg>
);

/** Квадратный флажок строки, как на макете ГПП; white — для шапки на акцентном фоне */
export const SquareCheck: React.FC<{ checked: boolean; white?: boolean; partial?: boolean; size?: number }> = ({
  checked,
  white = false,
  partial = false,
  size = 18,
}) => {
  const stroke = white ? COLORS.white : COLORS.text;
  const fill = white ? COLORS.white : COLORS.accent;
  const mark = white ? COLORS.accent : COLORS.white;
  const on = checked || partial;
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="1" y="1" width="16" height="16" rx="3.5" fill={on ? fill : 'none'} stroke={on ? fill : stroke} strokeWidth="1.6" />
      {checked && <path d="M5 9.2l2.7 2.7L13 6.5" fill="none" stroke={mark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {!checked && partial && <path d="M5.5 9h7" stroke={mark} strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
};
