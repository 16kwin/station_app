// FeedIcons.tsx — иконки ленты: белые иконки в цветной плашке строки, «второй экран» и «закрыть поиск»
import React from 'react';
import { COLORS } from './layout';

/** Иконка в плашке строки ленты: 'default' — прежняя коробка 16×16, остальные — 18×18 */
export type FeedIconKind = 'default' | 'cube' | 'check' | 'part';

/** Толщина контура новых иконок 18×18 */
const STROKE = 1.7;

/** Прежняя иконка строки 16×16 — коробка */
const BoxIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.6L14 4.8V11.2L8 14.4L2 11.2V4.8L8 1.6Z" stroke={COLORS.white} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M2 4.8L8 8L14 4.8M8 8V14.4" stroke={COLORS.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Изометрический куб с лентой по верхней грани — заказы и закупки */
const CubeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1.8L15.4 5.3V12.7L9 16.2L2.6 12.7V5.3L9 1.8Z" stroke={COLORS.white} strokeWidth={STROKE} strokeLinejoin="round" />
    <path d="M2.6 5.3L9 8.8L15.4 5.3M9 8.8V16.2" stroke={COLORS.white} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.8 3.55L12.2 7.05" stroke={COLORS.white} strokeWidth={STROKE} strokeLinecap="round" />
  </svg>
);

/** Галочка в розетке-«печати» — выпуск продукции */
const CheckIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.65 3.32Q9 -0.1 11.35 3.32Q15.43 2.57 14.68 6.65Q18.1 9 14.68 11.35Q15.43 15.43 11.35 14.68Q9 18.1 6.65 14.68Q2.57 15.43 3.32 11.35Q-0.1 9 3.32 6.65Q2.57 2.57 6.65 3.32Z"
      stroke={COLORS.white}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <path d="M6.3 9.1L8.2 11L11.8 7.2" stroke={COLORS.white} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Деталь (шатун: головка с прорезью, стержень, проушина) — события контроля */
const PartIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5.2" y="1.9" width="7.6" height="5.4" rx="1.5" stroke={COLORS.white} strokeWidth={STROKE} />
    <path d="M7.7 4.6H10.3M9 7.3V11.7" stroke={COLORS.white} strokeWidth={STROKE} strokeLinecap="round" />
    <circle cx="9" cy="14.1" r="2.3" stroke={COLORS.white} strokeWidth={STROKE} />
  </svg>
);

/** Белая иконка строки ленты по её виду */
export const FeedIcon: React.FC<{ kind: FeedIconKind }> = ({ kind }) => {
  switch (kind) {
    case 'cube':
      return <CubeIcon />;
    case 'check':
      return <CheckIcon />;
    case 'part':
      return <PartIcon />;
    default:
      return <BoxIcon />;
  }
};

/** «Второй экран» 18×18: два перекрывающихся монитора, контур #2D4059 */
export const SecondScreenIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6.6" y="2.4" width="9.6" height="7.6" rx="1.6" stroke={COLORS.text} strokeWidth="1.6" />
    {/* Передний монитор залит белым и закрывает задний */}
    <rect x="1.8" y="6.6" width="9.6" height="7" rx="1.6" fill={COLORS.white} stroke={COLORS.text} strokeWidth="1.6" />
    <path d="M4.6 16.3H8.6" stroke={COLORS.text} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Крестик 12×12 — закрыть поле поиска */
export const CloseSearchIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
