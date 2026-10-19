// ui.tsx — элементы окна «3D-модель»: кнопки в стиле приложения, кнопка-кружок 54×54 с подсказкой,
// индикаторы загрузки. Индикаторы крутятся на CSS-анимации — она идёт и когда основной поток занят разбором.
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from './theme';

/** Ключевые кадры для индикаторов; вставляется один раз в корень окна */
export const Model3DKeyframes: React.FC = () => (
  <style>{`
@keyframes model3d-spin { to { transform: rotate(360deg); } }
@keyframes model3d-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
`}</style>
);

export const Spinner: React.FC<{ size?: number; color?: string; width?: number }> = ({ size = 16, color = COLORS.accent, width = 2 }) => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `${width}px solid ${color}`,
      borderTopColor: 'transparent',
      display: 'inline-block',
      flexShrink: 0,
      animation: 'model3d-spin 0.8s linear infinite',
    }}
  />
);

/** Полоса прогресса; ratio === null — бегущая полоска (сколько осталось, неизвестно) */
export const ProgressBar: React.FC<{ ratio: number | null; height?: number }> = ({ ratio, height = 4 }) => (
  <div style={{ height, borderRadius: height, backgroundColor: COLORS.track, overflow: 'hidden', position: 'relative' }}>
    {ratio === null ? (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '40%',
          borderRadius: height,
          backgroundColor: COLORS.accent,
          animation: 'model3d-indeterminate 1.2s ease-in-out infinite',
        }}
      />
    ) : (
      <div
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: COLORS.accent,
          transition: 'width 0.2s ease',
        }}
      />
    )}
  </div>
);

interface ActionButtonProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  title?: string;
  fullWidth?: boolean;
  height?: number;
}

/** Кнопка приложения: основная — заливка акцентом, вторичная — белая с тенью, «опасная» — белая с красным текстом */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onClick,
  variant = 'secondary',
  disabled = false,
  busy = false,
  title,
  fullWidth = false,
  height = 44,
}) => {
  const primary = variant === 'primary';
  const color = primary ? COLORS.white : variant === 'danger' ? COLORS.danger : COLORS.text;
  const blocked = disabled || busy;
  return (
    <motion.button
      type="button"
      onClick={blocked ? undefined : onClick}
      disabled={disabled}
      title={title}
      whileHover={blocked ? undefined : { y: -1, boxShadow: primary ? '0 6px 18px rgba(102, 110, 254, 0.35)' : SHADOWS.buttonHover }}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        width: fullWidth ? '100%' : undefined,
        height,
        padding: '0 20px',
        border: 'none',
        borderRadius: 10,
        backgroundColor: primary ? COLORS.accent : COLORS.white,
        boxShadow: primary ? '0 4px 14px rgba(102, 110, 254, 0.3)' : SHADOWS.button,
        color,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        whiteSpace: 'nowrap',
        outline: 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {busy ? <Spinner color={primary ? COLORS.white : COLORS.accent} /> : icon}
      {label}
    </motion.button>
  );
};

interface RoundButtonProps {
  /** Подсказка при наведении и подпись для экранного диктора */
  label: string;
  onClick: () => void;
  active?: boolean;
  busy?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  size?: number;
}

/** Кнопка-кружок 54×54 как на панели станций: белая, активная — акцентная; подсказка снизу */
export const RoundButton: React.FC<RoundButtonProps> = ({ label, onClick, active = false, busy = false, disabled = false, children, size = 54 }) => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <motion.button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={disabled || busy ? undefined : onClick}
        disabled={disabled}
        whileHover={disabled ? undefined : { y: -1 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        animate={{ backgroundColor: active ? COLORS.accent : COLORS.white, color: active ? COLORS.white : COLORS.text }}
        transition={{ duration: 0.18 }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: 'none',
          boxShadow: active ? SHADOWS.roundActive : SHADOWS.button,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          outline: 'none',
          padding: 0,
          fontFamily: FONT,
        }}
      >
        {busy ? <Spinner size={20} color={active ? COLORS.white : COLORS.accent} /> : children}
      </motion.button>
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: size + 8,
              right: 0,
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: COLORS.hintBg,
              color: COLORS.white,
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 5,
              boxShadow: SHADOWS.tooltip,
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StatusOverlayProps {
  title: string;
  subtitle?: string;
  ratio?: number | null;
  showProgress?: boolean;
}

/** Состояние поверх области просмотра: индикатор, этап и прогресс */
export const StatusOverlay: React.FC<StatusOverlayProps> = ({ title, subtitle, ratio = null, showProgress = false }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      backgroundColor: 'rgba(251, 252, 255, 0.72)',
      backdropFilter: 'blur(2px)',
      fontFamily: FONT,
      zIndex: 3,
    }}
  >
    <Spinner size={34} width={3} />
    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: COLORS.muted, maxWidth: 420, textAlign: 'center', lineHeight: '18px' }}>{subtitle}</div>}
    {showProgress && (
      <div style={{ width: 260 }}>
        <ProgressBar ratio={ratio} />
      </div>
    )}
  </motion.div>
);
