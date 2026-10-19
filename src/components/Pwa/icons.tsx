// icons.tsx — линейные иконки слоя PWA в манере приложения: обводка, скруглённые концы.
import React from 'react';
import { COLORS } from './theme';

interface IconProps {
  size?: number;
  color?: string;
}

/** Обновление: круговая стрелка */
export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20 4.5v4.2h-4.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Установка: стрелка вниз в лоток */
export const InstallIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.white }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 15.5v1.5a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-1.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** «Поделиться» iOS: квадрат без верха и стрелка вверх */
export const ShareIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v12M12 3 8 7M12 3l4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** «На экран „Домой“»: плюс в скруглённом квадрате */
export const AddToHomeIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke={color} strokeWidth="2" />
    <path d="M12 8.5v7M8.5 12h7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** «Добавить»: галочка */
export const CheckIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 14, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
