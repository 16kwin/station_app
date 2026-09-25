// icons.tsx — белые контурные иконки плашки источника на «Экране событий текущего дня» (сетка 24×24)
import React from 'react';
import { COLORS } from '../shared/layout';

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.8;

/** Изометрический куб с лентой — склад и закупки */
export const CubeIcon: React.FC<IconProps> = ({ size = 22, color = COLORS.white }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2.8L20 7.2V16.8L12 21.2L4 16.8V7.2L12 2.8Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    <path d="M4 7.2L12 11.6L20 7.2M12 11.6V21.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5L16 9.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </svg>
);

/** Деталь (поршень с шатуном, как в ленте контролера) — события контроля */
export const PartIcon: React.FC<IconProps> = ({ size = 22, color = COLORS.white }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="7" y="3" width="10" height="7" rx="2" stroke={color} strokeWidth={STROKE} />
    <path d="M10 6.5H14M12 10V15" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <circle cx="12" cy="17.8" r="2.8" stroke={color} strokeWidth={STROKE} />
  </svg>
);

/** Галочка в круге — выпуск продукции */
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 22, color = COLORS.white }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={STROKE} />
    <path d="M8.3 12.2L10.8 14.7L15.8 9.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
