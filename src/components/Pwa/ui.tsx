// ui.tsx — элементы карточек PWA: кнопки, крестик, индикатор загрузки.
import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT, PWA_COLORS } from './theme';
import { CloseIcon } from './icons';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  /** Основная кнопка — заливка акцентом; иначе — тихая текстовая */
  primary?: boolean;
  busy?: boolean;
  height?: number;
  /** Во всю ширину родителя — на узких экранах */
  fullWidth?: boolean;
}

export const PwaButton: React.FC<ButtonProps> = ({ children, onClick, primary = false, busy = false, height = 44, fullWidth = false }) => (
  <motion.button
    type="button"
    onClick={busy ? undefined : onClick}
    aria-busy={busy}
    whileHover={busy ? undefined : primary ? { backgroundColor: PWA_COLORS.accentHover, y: -1 } : { color: COLORS.text }}
    whileTap={busy ? undefined : { scale: 0.97 }}
    transition={{ duration: 0.18 }}
    style={{
      height,
      width: fullWidth ? '100%' : undefined,
      padding: primary ? '0 18px' : '0 12px',
      border: 'none',
      borderRadius: 10,
      backgroundColor: primary ? COLORS.accent : 'transparent',
      color: primary ? COLORS.white : COLORS.textMuted,
      boxShadow: primary ? '0 4px 14px rgba(102, 110, 254, 0.3)' : 'none',
      fontFamily: FONT,
      fontSize: 15,
      fontWeight: primary ? 600 : 500,
      cursor: busy ? 'progress' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
      outline: 'none',
      userSelect: 'none',
      flexShrink: 0,
    }}
  >
    {busy && <Spinner color={primary ? COLORS.white : COLORS.accent} />}
    {children}
  </motion.button>
);

export const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label="Закрыть"
    title="Закрыть"
    whileHover={{ backgroundColor: '#F2F4F8' }}
    whileTap={{ scale: 0.92 }}
    transition={{ duration: 0.15 }}
    style={{
      width: 32,
      height: 32,
      border: 'none',
      borderRadius: '50%',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      outline: 'none',
      flexShrink: 0,
      padding: 0,
    }}
  >
    <CloseIcon size={12} color={COLORS.textMuted} />
  </motion.button>
);

export const Spinner: React.FC<{ color?: string; size?: number }> = ({ color = COLORS.accent, size = 14 }) => (
  <motion.span
    aria-hidden="true"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      borderTopColor: 'transparent',
      display: 'inline-block',
      flexShrink: 0,
    }}
  />
);

/** Круглая подложка значка 44×44 */
export const IconBadge: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 44 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: PWA_COLORS.accentSoft,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);
