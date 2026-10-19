// theme.ts — цвета, тени и размеры окна «3D-модель». Основа — палитра приложения (mainPage/shared/layout.ts)
// и видеоархива: текст #2D4059, приглушённый #7B91B0, акцент #666EFE, белые карточки с мягкой тенью.
import { COLORS as APP_COLORS, FONT, SHADOWS as APP_SHADOWS } from '../../../mainPage/shared/layout';

export { FONT };

export const COLORS = {
  text: APP_COLORS.text,
  muted: APP_COLORS.textMuted,
  placeholder: '#A0A3BD',
  accent: APP_COLORS.accent,
  accentHover: '#5A61F0',
  accentSoft: 'rgba(102, 110, 254, 0.08)',
  accentLine: 'rgba(102, 110, 254, 0.15)',
  accentDash: 'rgba(102, 110, 254, 0.45)',
  border: '#E5ECF5',
  white: APP_COLORS.white,
  danger: '#FF3052',
  dangerSoft: '#FFECEF',
  overlay: 'rgba(0, 0, 0, 0.3)',
  hintBg: APP_COLORS.hintBg,
  track: '#E7EAF2',
  /** Фон области просмотра: светлый, чуть темнее к низу — модель «стоит» */
  viewerTop: '#FBFCFF',
  viewerBottom: '#E8ECF5',
} as const;

export const SHADOWS = {
  card: APP_SHADOWS.card,
  button: '0 2px 8px rgba(0, 0, 0, 0.08)',
  buttonHover: '0 4px 14px rgba(102, 110, 254, 0.18)',
  /** Кнопки-кружки как на панели станций */
  round: '0 2px 4px rgba(0, 0, 0, 0.05)',
  roundActive: '0 4px 12px rgba(102, 110, 254, 0.3)',
  modal: APP_SHADOWS.modal,
  tooltip: APP_SHADOWS.tooltip,
} as const;

/** Окно: ~1100×700, но всегда вписывается в экран с полями по 20 */
export const POPUP = { width: 1100, height: 700, margin: 20, sideWidth: 300 } as const;
