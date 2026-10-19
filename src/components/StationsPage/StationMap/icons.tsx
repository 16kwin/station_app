// icons.tsx — линейные иконки режима «Карта» в манере иконок панели станций: контур #2D4059, скругления.
import React from 'react';
import { COLORS } from './theme';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 20, color = COLORS.text, strokeWidth = 2, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
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

export const SearchIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L20.5 20.5" />
  </Svg>
);

/** Шеврон вправо — раскрытие ветки дерева (поворачивается на 90°) */
export const ChevronIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M9.5 6.5L15 12l-5.5 5.5" />
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

/** «По размеру» — четыре угла рамки */
export const FitIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
  </Svg>
);

/** Загрузить план — картинка со стрелкой вверх */
export const UploadPlanIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
    <path d="M4.5 17l4.2-4.4a1.2 1.2 0 0 1 1.7 0L14 16.2" />
    <path d="M13 14.8l1.6-1.6a1.2 1.2 0 0 1 1.7 0L19.5 16.5" />
    <path d="M18 9.5v-6M15.2 6.2L18 3.4l2.8 2.8" />
  </Svg>
);

/** Редактировать расстановку — карандаш */
export const EditIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M14.5 5.5l4 4M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19 4 20z" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.9 11.6A1.6 1.6 0 0 0 9 20h6a1.6 1.6 0 0 0 1.6-1.4L17.5 7M10.2 11v5M13.8 11v5" />
  </Svg>
);

/** Шаблоны загрузки — стопка листов */
export const TemplatesIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="6.5" y="3.5" width="12" height="15" rx="2" />
    <path d="M4.5 7v11.5a2 2 0 0 0 2 2H15M9.5 8h6M9.5 11.5h6M9.5 15h3.5" />
  </Svg>
);

/** Видео — камера */
export const VideoIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
    <path d="M15.5 10.5l5-3v9l-5-3" />
  </Svg>
);

/** Сбросить расстановку — круговая стрелка */
export const ResetIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5v4h4" />
  </Svg>
);

export const WarningIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M10.3 4.6L3.2 17.2A2 2 0 0 0 5 20h14a2 2 0 0 0 1.8-2.8L13.7 4.6a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 16.8v.1" />
  </Svg>
);

/** Картинка — пустая область загрузки плана */
export const ImageIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M4 17l4.6-4.6a1.4 1.4 0 0 1 2 0L15 16.8M13.5 15.3l1.8-1.8a1.4 1.4 0 0 1 2 0L20 16.2" />
  </Svg>
);

/** Перетаскивание — «ручка» из шести точек */
export const GripIcon: React.FC<IconProps> = ({ size = 14, color = COLORS.faint }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
    {[3.5, 7, 10.5].map(y => (
      <React.Fragment key={y}>
        <circle cx="5" cy={y} r="1.2" fill={color} />
        <circle cx="9" cy={y} r="1.2" fill={color} />
      </React.Fragment>
    ))}
  </svg>
);
