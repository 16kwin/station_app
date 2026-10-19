// StationCabinet.tsx — изометрическая миниатюра станции (шкаф с экраном и ячейками) цвета статуса.
// Точка «пола» станции — середина основания: в SVG 30×42 это (15, 38).
import React from 'react';
import type { StationStatusCode } from './types';

/** Грани шкафа: фасад, верх, бок */
const FACES: Record<StationStatusCode, [string, string, string]> = {
  WORKING: ['#5E88E9', '#8EC3EF', '#4B55D6'],
  OFFLINE: ['#9C9C9C', '#C9C9C9', '#7A7A7A'],
  MINIMAL_STOCK: ['#FFAE84', '#FFD3BA', '#EE9268'],
  CRITICAL_STOCK: ['#FF4D6A', '#FF8FA0', '#D9284A'],
};

/** Мнемосхема: «В работе» приглушённо, цвет только у отклонений */
const MNEMO_FACES: Record<StationStatusCode, [string, string, string]> = {
  WORKING: ['#A9B6D3', '#D3DBEB', '#8C9ABB'],
  OFFLINE: ['#CDD2DA', '#E6E9EE', '#B3BAC5'],
  MINIMAL_STOCK: ['#FFAE84', '#FFD3BA', '#EE9268'],
  CRITICAL_STOCK: ['#FF4D6A', '#FF8FA0', '#D9284A'],
};

/** Точка на фасаде: u — вдоль фасада, v — снизу вверх */
const onFront = (u: number, v: number): string => `${(3.8 + 17.3 * u).toFixed(1)} ${(37 + 3 * u - 26 * v).toFixed(1)}`;
const SCREEN = `M${onFront(0.16, 0.86)}L${onFront(0.84, 0.86)}L${onFront(0.84, 0.66)}L${onFront(0.16, 0.66)}Z`;
const CELLS = [0.18, 0.33, 0.48].map(v => `M${onFront(0.1, v)}L${onFront(0.9, v)}`).join('') + `M${onFront(0.5, 0.08)}L${onFront(0.5, 0.56)}`;

interface StationCabinetProps {
  status: StationStatusCode;
  hasError?: boolean;
  /** Приглушённая палитра мнемосхемы */
  muted?: boolean;
  width?: number;
  /** Тень основания; на мнемосхеме не нужна */
  shadow?: boolean;
}

const StationCabinet: React.FC<StationCabinetProps> = ({ status, hasError = false, muted = false, width = 26, shadow = true }) => {
  const [front, top, side] = (muted ? MNEMO_FACES : FACES)[status];
  return (
    <svg width={width} height={(width * 42) / 30} viewBox="0 0 30 42" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {shadow && <ellipse cx="15" cy="38.5" rx="13" ry="4" fill="rgba(45, 64, 89, 0.2)" />}
      <polygon points="3.8,37 21.1,40 21.1,14 3.8,11" fill={front} />
      <polygon points="21.1,40 26.1,36 26.1,10 21.1,14" fill={side} />
      <polygon points="3.8,11 21.1,14 26.1,10 8.8,7" fill={top} />
      <path d={SCREEN} fill="rgba(255, 255, 255, 0.92)" />
      <path d={CELLS} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" fill="none" />
      {hasError && (
        <g>
          <circle cx="25" cy="8" r="5" fill="#FF3052" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M25 5.6v2.8M25 10.4v.1" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

export default StationCabinet;
