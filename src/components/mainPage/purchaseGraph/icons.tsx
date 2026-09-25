// icons.tsx — иконки графа закупок: белые глифы в узлах («куб», «магазин») и контурные иконки панелей
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/* ---------- Глифы в узлах: квадрат 18×18, белый контур, масштабируются вместе с кругом ---------- */

/** Номенклатура — изометрический куб контуром */
export const CubeGlyph: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => (
  <g fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1.8L15.2 5.4V12.6L9 16.2L2.8 12.6V5.4L9 1.8Z" />
    <path d="M2.8 5.4L9 9L15.2 5.4M9 9V16.2" />
  </g>
);

/** Поставщик — магазин: навес с фестонами и витрина с дверью */
export const ShopGlyph: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => (
  <g fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.8 7L3.7 2.6H14.3L16.2 7A2.4 2.4 0 0 1 11.4 7A2.4 2.4 0 0 1 6.6 7A2.4 2.4 0 0 1 1.8 7Z" />
    <path d="M3.2 9.6V15.6H14.8V9.6" />
    <path d="M7.4 15.6V12.2H10.6V15.6" />
  </g>
);

/* ---------- Иконки интерфейса: 16×16, контур currentColor ---------- */

const Svg: React.FC<IconProps & { children: React.ReactNode; fill?: string }> = ({
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.6,
  fill = 'none',
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={fill}
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
    <circle cx="7" cy="7" r="4.6" />
    <path d="M10.4 10.4L13.8 13.8" />
  </Svg>
);

/** Звезда «Избранное»; filled — закрашенная */
export const StarIcon: React.FC<IconProps & { filled?: boolean; fillColor?: string }> = ({ filled = false, fillColor, ...props }) => (
  <Svg {...props} fill={filled ? (fillColor ?? props.color ?? 'currentColor') : 'none'}>
    <path d="M8 1.9L9.85 5.65L13.95 6.25L11 9.15L11.7 13.25L8 11.3L4.3 13.25L5 9.15L2.05 6.25L6.15 5.65L8 1.9Z" />
  </Svg>
);

/** Группа — стопка слоёв */
export const LayersIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M8 2L14 5.2L8 8.4L2 5.2L8 2Z" />
    <path d="M2 8.1L8 11.3L14 8.1" />
    <path d="M2 11L8 14.2L14 11" />
  </Svg>
);

/** Позиция справочника — документ со строками */
export const DocIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="2.8" y="1.8" width="10.4" height="12.4" rx="2" />
    <path d="M5.6 5.6H10.4M5.6 8H10.4M5.6 10.4H8.6" />
  </Svg>
);

/** «Все позиции» — плитка 2×2 */
export const GridIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="2.2" y="2.2" width="4.6" height="4.6" rx="1.2" />
    <rect x="9.2" y="2.2" width="4.6" height="4.6" rx="1.2" />
    <rect x="2.2" y="9.2" width="4.6" height="4.6" rx="1.2" />
    <rect x="9.2" y="9.2" width="4.6" height="4.6" rx="1.2" />
  </Svg>
);

/** Контур шестерёнки с 8 зубцами (строится один раз при загрузке модуля) */
const GEAR_PATH = (() => {
  const teeth = 8;
  const outer = 7.1;
  const inner = 5.4;
  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const base = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    [
      [base - step * 0.34, inner],
      [base - step * 0.2, outer],
      [base + step * 0.2, outer],
      [base + step * 0.34, inner],
    ].forEach(([angle, r]) => points.push(`${(8 + Math.cos(angle) * r).toFixed(2)} ${(8 + Math.sin(angle) * r).toFixed(2)}`));
  }
  return `M${points.join('L')}Z`;
})();

export const GearIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d={GEAR_PATH} />
    <circle cx="8" cy="8" r="2.2" />
  </Svg>
);

/** «Сбросить» ⟲ — дуга со стрелкой */
export const ResetIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M3.1 9.2A5 5 0 1 0 4.6 4.3" />
    <path d="M4.3 1.6V4.5H7.2" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4 4L12 12M12 4L4 12" />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4 6.2L8 10.2L12 6.2" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M6.2 4L10.2 8L6.2 12" />
  </Svg>
);

/** «Развернуть» — две диагональные стрелки */
export const ExpandIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M9.6 2.4H13.6V6.4M13.6 2.4L9.2 6.8" />
    <path d="M6.4 13.6H2.4V9.6M2.4 13.6L6.8 9.2" />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M8 3V13M3 8H13" />
  </Svg>
);

export const MinusIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M3 8H13" />
  </Svg>
);

/** «По размеру» — четыре угла рамки */
export const FitIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M2.4 6V2.4H6M10 2.4H13.6V6M13.6 10V13.6H10M6 13.6H2.4V10" />
  </Svg>
);

/** «Печатная форма» — принтер */
export const PrintIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M4.4 5.6V1.9H11.6V5.6" />
    <path d="M4.4 11.4H2.9A1.3 1.3 0 0 1 1.6 10.1V7A1.4 1.4 0 0 1 3 5.6H13A1.4 1.4 0 0 1 14.4 7V10.1A1.3 1.3 0 0 1 13.1 11.4H11.6" />
    <path d="M4.4 9H11.6V14.1H4.4Z" />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <rect x="1.9" y="2.9" width="12.2" height="11.3" rx="2.2" />
    <path d="M1.9 6.6H14.1M5.2 1.6V4.1M10.8 1.6V4.1" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <path d="M3.6 8.3L6.6 11.2L12.4 5" />
  </Svg>
);

/** «Запустить анимацию» — искра разлёта */
export const BurstIcon: React.FC<IconProps> = props => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="1.6" />
    <path d="M8 1.8V4.2M8 11.8V14.2M1.8 8H4.2M11.8 8H14.2M3.6 3.6L5.3 5.3M10.7 10.7L12.4 12.4M12.4 3.6L10.7 5.3M5.3 10.7L3.6 12.4" />
  </Svg>
);
