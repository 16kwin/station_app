// icons.tsx — иконки страницы видеоархива: купольная и цилиндрическая камеры, кнопки плеера.
// В наборе иконок приложения таких нет, поэтому они нарисованы здесь в той же манере.
import React from 'react';
import { COLORS } from './theme';

/** Купольная камера станции, 64×64 */
export const DomeCameraIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="va-dome-base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E9EDF4" />
        <stop offset="1" stopColor="#C3CBD8" />
      </linearGradient>
      <radialGradient id="va-dome-glass" cx="0.42" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#A9B4C6" />
        <stop offset="0.6" stopColor="#6E788C" />
        <stop offset="1" stopColor="#4A5262" />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="17" rx="24" ry="7" fill="url(#va-dome-base)" />
    <rect x="8" y="17" width="48" height="7" fill="#B7C0CE" />
    <ellipse cx="32" cy="24" rx="24" ry="2.5" fill="#A5AEBD" />
    <path d="M10 24h44a22 22 0 0 1-44 0z" fill="url(#va-dome-glass)" />
    <circle cx="32" cy="35" r="9" fill="#2A303C" />
    <circle cx="32" cy="35" r="5" fill="#0F131A" />
    <circle cx="29.5" cy="32.5" r="1.8" fill="#FFFFFF" opacity="0.75" />
    <path d="M17 28a16 16 0 0 1 8-3" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Цилиндрическая обзорная камера на кронштейне, 64×64 */
export const BulletCameraIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="va-bullet-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9FA3FF" />
        <stop offset="1" stopColor="#5C61E6" />
      </linearGradient>
    </defs>
    <rect x="9" y="38" width="7" height="18" rx="2.5" fill="#3E40A8" />
    <path d="M16 47h7l7-9" stroke="#3E40A8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <g transform="rotate(-16 36 26)">
      <rect x="17" y="18" width="36" height="17" rx="6" fill="url(#va-bullet-body)" />
      <rect x="15" y="14" width="41" height="7" rx="3.5" fill="#7C80FF" />
      <rect x="51" y="20.5" width="6" height="12" rx="2.5" fill="#2C2E85" />
      <circle cx="54" cy="26.5" r="2.4" fill="#C9CBFF" />
      <rect x="22" y="23" width="18" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.35" />
    </g>
  </svg>
);

interface StrokeIconProps {
  size?: number;
  color?: string;
}

/** Воспроизведение: треугольник в скруглённом квадрате */
export const PlayIcon: React.FC<StrokeIconProps> = ({ size = 22, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="19" rx="4.5" stroke={color} strokeWidth="1.6" />
    <path d="M8.5 6.8v8.4l6.6-4.2-6.6-4.2z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

/** Пауза: две полосы в скруглённом квадрате */
export const PauseIcon: React.FC<StrokeIconProps> = ({ size = 22, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="19" rx="4.5" stroke={color} strokeWidth="1.6" />
    <path d="M8.6 7v8M13.4 7v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Стоп: скруглённый квадрат */
export const StopIcon: React.FC<StrokeIconProps> = ({ size = 22, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="2.5" y="2.5" width="17" height="17" rx="4" stroke={color} strokeWidth="1.6" />
  </svg>
);

/** Скачать: стрелка вниз над лотком в скруглённом квадрате */
export const DownloadIcon: React.FC<StrokeIconProps> = ({ size = 22, color = COLORS.text }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="19" rx="4.5" stroke={color} strokeWidth="1.6" />
    <path d="M11 6v7.2M7.8 10.2 11 13.4l3.2-3.2M7 16h8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Шеврон вниз 12×7 */
export const ChevronDownIcon: React.FC<{ color?: string }> = ({ color = COLORS.text }) => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M1 1l5 5 5-5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Крестик 14×14 */
export const CloseIcon: React.FC<{ color?: string }> = ({ color = COLORS.text }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Перечёркнутая камера — нет сигнала, 28×28 */
export const NoSignalIcon: React.FC<{ color?: string }> = ({ color = COLORS.muted }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="3" y="8" width="15" height="12" rx="3" stroke={color} strokeWidth="1.7" />
    <path d="M18 12.5l6-3.5v10l-6-3.5" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M3 4l22 20" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
