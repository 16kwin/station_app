// icons.tsx — линейные иконки окна «3D-модель» в манере иконок приложения: обводка #2D4059, скругления.
import React from 'react';
import { COLORS } from './theme';

interface IconProps {
  size?: number;
  color?: string;
}

/** Куб в изометрии — пустое окно и зона перетаскивания */
export const CubeIcon: React.FC<IconProps> = ({ size = 56, color = COLORS.accent }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <path d="M28 6 48 17v22L28 50 8 39V17L28 6Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M8 17l20 11 20-11M28 28v22" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 11.5 38 22.5" stroke={color} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Загрузить: стрелка вверх над лотком */
export const UploadIcon: React.FC<IconProps> = ({ size = 18, color = COLORS.white }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 12V3M5.5 6.2 9 2.7l3.5 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 11.5v2.2c0 .9.7 1.6 1.6 1.6h9.8c.9 0 1.6-.7 1.6-1.6v-2.2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Скачать: стрелка вниз над лотком */
export const DownloadIcon: React.FC<IconProps> = ({ size = 18, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 2.5v9M5.5 8 9 11.5 12.5 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 11.5v2.2c0 .9.7 1.6 1.6 1.6h9.8c.9 0 1.6-.7 1.6-1.6v-2.2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Корзина */
export const TrashIcon: React.FC<IconProps> = ({ size = 18, color = COLORS.danger }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M2.5 4.5h13M7 4.5V3c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M4 4.5l.8 10.2c.1.8.7 1.3 1.5 1.3h5.4c.8 0 1.4-.5 1.5-1.3L14 4.5M7.3 7.8v5M10.7 7.8v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** «По размеру»: уголки рамки вокруг точки */
export const FitIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.5 8.5V5.5c0-1.1.9-2 2-2h3M15.5 3.5h3c1.1 0 2 .9 2 2v3M20.5 15.5v3c0 1.1-.9 2-2 2h-3M8.5 20.5h-3c-1.1 0-2-.9-2-2v-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 8.2 15.3 10v4L12 15.8 8.7 14v-4L12 8.2Z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
  </svg>
);

/** «Рёбра»: каркас куба */
export const EdgesIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="3" r="1.6" fill={color} />
    <circle cx="20" cy="7.5" r="1.6" fill={color} />
    <circle cx="4" cy="7.5" r="1.6" fill={color} />
    <circle cx="12" cy="12" r="1.6" fill={color} />
  </svg>
);

/** Крестик 14×14 */
export const CloseIcon: React.FC<IconProps> = ({ size = 14, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Предупреждение: восклицательный знак в круге */
export const AlertIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.danger }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.2" stroke={color} strokeWidth="2" />
    <path d="M10 5.8v5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="10" cy="14.2" r="1.25" fill={color} />
  </svg>
);
