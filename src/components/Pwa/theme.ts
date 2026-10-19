// theme.ts — оформление слоя PWA: общая палитра приложения и несколько своих значений.
export { COLORS, SHADOWS, FONT } from '../mainPage/shared/layout';

export const PWA_COLORS = {
  accentHover: '#5A61F0',
  /** Светлая подложка значков — оттенок акцента */
  accentSoft: '#F0F1FF',
} as const;

/** Поверх модальных окон приложения (у них до 99999): уведомления не блокируют работу */
export const PWA_Z_INDEX = 100000;

/** Появление карточек — как у модальных окон приложения */
export const APPEAR = {
  initial: { opacity: 0, scale: 0.92, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 12 },
  transition: { duration: 0.25, ease: 'easeOut' },
} as const;
