// ui.tsx — общие элементы страницы видеоархива: кнопка в стиле приложения, каркас модального окна,
// отметка записи REC.
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from './theme';
import { CloseIcon } from './icons';

interface ActionButtonProps {
  label: React.ReactNode;
  onClick?: () => void;
  width?: number;
  height?: number;
  /** Нажатое состояние — заливка акцентом, как «Login» на макете во время записи */
  active?: boolean;
  disabled?: boolean;
  /** Подсказка при наведении */
  title?: string;
  busy?: boolean;
  ariaLabel?: string;
}

/** Белая кнопка с тенью — основная кнопка страниц приложения; в нажатом состоянии залита акцентом */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  width,
  height = 50,
  active = false,
  disabled = false,
  title,
  busy = false,
  ariaLabel,
}) => (
  <motion.button
    type="button"
    onClick={disabled || busy ? undefined : onClick}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel}
    aria-pressed={active}
    whileHover={disabled ? undefined : { y: -1, boxShadow: active ? '0 6px 18px rgba(102, 110, 254, 0.35)' : SHADOWS.buttonHover }}
    whileTap={disabled ? undefined : { scale: 0.97 }}
    animate={{ backgroundColor: active ? COLORS.accent : COLORS.white, color: active ? COLORS.white : COLORS.text }}
    transition={{ duration: 0.18 }}
    style={{
      width,
      height,
      padding: width ? 0 : '0 22px',
      border: 'none',
      borderRadius: 10,
      boxShadow: active ? '0 4px 14px rgba(102, 110, 254, 0.3)' : SHADOWS.button,
      fontFamily: FONT,
      fontSize: 15,
      fontWeight: 500,
      lineHeight: '18px',
      cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      whiteSpace: 'nowrap',
      outline: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      userSelect: 'none',
    }}
  >
    {busy && <Spinner color={active ? COLORS.white : COLORS.accent} />}
    {label}
  </motion.button>
);

/** Маленький индикатор загрузки 14×14 */
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

/** Отметка «● REC» — пульсирующая точка и надпись, как на превью камер в макете */
export const RecBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: compact ? '1px 5px' : '2px 7px',
      borderRadius: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      fontFamily: FONT,
      fontSize: compact ? 10 : 12,
      fontWeight: 700,
      letterSpacing: '0.04em',
      color: COLORS.rec,
      lineHeight: 1.3,
    }}
  >
    <motion.span
      animate={{ opacity: [1, 0.25, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: compact ? 6 : 8, height: compact ? 6 : 8, borderRadius: '50%', backgroundColor: COLORS.rec }}
    />
    REC
  </motion.span>
);

interface RecordButtonProps {
  recording: boolean;
  /** Секунд с начала записи */
  elapsed: number;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  width?: number;
  height?: number;
}

/** Кнопка «Записать»: красная точка; во время записи — «Стоп» с таймером, точка пульсирует */
export const RecordButton: React.FC<RecordButtonProps> = ({ recording, elapsed, busy, disabled = false, onClick, width = 190, height = 44 }) => {
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');
  const blocked = disabled || busy;
  return (
    <motion.button
      type="button"
      onClick={blocked ? undefined : onClick}
      disabled={disabled}
      aria-pressed={recording}
      title={recording ? 'Остановить запись и сохранить файл на этот компьютер' : 'Записать живое видео на этот компьютер'}
      whileHover={blocked ? undefined : { y: -1, boxShadow: recording ? '0 6px 18px rgba(255, 48, 82, 0.25)' : SHADOWS.buttonHover }}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      animate={{ backgroundColor: recording ? COLORS.errorSoft : COLORS.white, color: recording ? COLORS.rec : COLORS.text }}
      transition={{ duration: 0.18 }}
      style={{
        width,
        height,
        border: 'none',
        borderRadius: 10,
        boxShadow: SHADOWS.button,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        outline: 'none',
        userSelect: 'none',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {busy ? (
        <Spinner color={recording ? COLORS.rec : COLORS.accent} />
      ) : (
        <motion.span
          animate={recording ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
          transition={recording ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          style={{ width: 10, height: 10, borderRadius: recording ? 2 : '50%', backgroundColor: COLORS.rec, flexShrink: 0 }}
        />
      )}
      {recording ? `Стоп · ${minutes}:${seconds}` : 'Записать'}
    </motion.button>
  );
};

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  height?: number;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Плавная смена ширины, например при переключении одной и двух камер */
  animateSize?: boolean;
}

/** Модальное окно приложения: затемнение с размытием, белое окно с масштабированием, крестик справа */
export const ModalShell: React.FC<ModalShellProps> = ({ isOpen, onClose, width, height, title, children, animateSize }) => {
  // Esc закрывает окно
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: COLORS.overlay,
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, width }}
            animate={{ scale: 1, opacity: 1, width }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.22, width: animateSize ? { duration: 0.32, ease: [0.4, 0, 0.2, 1] } : { duration: 0 } }}
            onClick={event => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'relative',
              height,
              maxHeight: 'calc(100vh - 40px)',
              backgroundColor: COLORS.white,
              borderRadius: 20,
              boxShadow: SHADOWS.modal,
              fontFamily: FONT,
              color: COLORS.text,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '36px 64px 0',
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 500,
                lineHeight: '22px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 28,
                right: 28,
                width: 32,
                height: 32,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <CloseIcon />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
