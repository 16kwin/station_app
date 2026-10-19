// ui.tsx — общие элементы режима «Карта»: кнопки в стиле приложения, модальное окно, подтверждение,
// всплывающее сообщение и индикатор загрузки.
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from './theme';
import { CloseIcon } from './icons';

interface CircleButtonProps {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  size?: number;
}

/** Кнопка-кружок, как на панели станций: белая с мягкой тенью, нажатая — акцентная */
export const CircleButton: React.FC<CircleButtonProps> = ({ title, onClick, children, active = false, disabled = false, size = 44 }) => (
  <motion.button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    whileHover={disabled ? undefined : { y: -1, boxShadow: active ? SHADOWS.active : SHADOWS.buttonHover }}
    whileTap={disabled ? undefined : { scale: 0.94 }}
    animate={{ backgroundColor: active ? COLORS.accent : COLORS.white }}
    transition={{ duration: 0.18 }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: 'none',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: active ? SHADOWS.active : SHADOWS.button,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      outline: 'none',
      flexShrink: 0,
    }}
  >
    {children}
  </motion.button>
);

interface PillButtonProps {
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  height?: number;
  title?: string;
}

/** Кнопка с подписью: основная — акцентная, вторичная — белая с тенью */
export const PillButton: React.FC<PillButtonProps> = ({ label, onClick, icon, variant = 'secondary', disabled = false, busy = false, height = 40, title }) => {
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const blocked = disabled || busy;
  return (
    <motion.button
      type="button"
      title={title}
      disabled={disabled}
      onClick={blocked ? undefined : onClick}
      whileHover={blocked ? undefined : { y: -1, boxShadow: primary ? '0 6px 18px rgba(102, 110, 254, 0.35)' : SHADOWS.buttonHover }}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      style={{
        height,
        padding: '0 18px',
        border: 'none',
        borderRadius: 10,
        backgroundColor: primary ? COLORS.accent : COLORS.white,
        color: primary ? COLORS.white : danger ? COLORS.error : COLORS.text,
        boxShadow: primary ? SHADOWS.active : SHADOWS.button,
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
        opacity: disabled ? 0.45 : 1,
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

/** Индикатор загрузки */
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

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  title: React.ReactNode;
  children: React.ReactNode;
}

/** Модальное окно приложения: затемнение с размытием, белое окно с масштабированием, крестик справа */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, width, title, children }) => {
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
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={event => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'relative',
              width,
              maxHeight: 'calc(100vh - 40px)',
              backgroundColor: COLORS.white,
              borderRadius: 20,
              boxShadow: SHADOWS.modal,
              fontFamily: FONT,
              color: COLORS.text,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '30px 64px 0', textAlign: 'center', fontSize: 18, fontWeight: 600, lineHeight: '22px' }}>{title}</div>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
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
              <CloseIcon size={18} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface ConfirmRequest {
  title: string;
  text: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Третья кнопка между «Отмена» и основной — отдельный ответ 'alt' */
  altLabel?: string;
  danger?: boolean;
}

/** Ответ на вопрос; закрытие окна крестиком, Esc или кликом мимо — 'cancel' */
export type ConfirmAnswer = 'confirm' | 'alt' | 'cancel';

interface ConfirmDialogProps {
  open: boolean;
  /** Остаётся заданным после закрытия — для анимации исчезновения */
  request: ConfirmRequest | null;
  onAnswer: (answer: ConfirmAnswer) => void;
}

/** Подтверждение в стиле приложения вместо window.confirm */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, request, onAnswer }) => (
  <Modal isOpen={open && request !== null} onClose={() => onAnswer('cancel')} width={request?.altLabel ? 660 : 440} title={request?.title ?? ''}>
    <div style={{ padding: '14px 40px 0', textAlign: 'center', fontSize: 14, lineHeight: '21px', color: COLORS.muted }}>{request?.text}</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '26px 40px 30px' }}>
      <PillButton label={request?.cancelLabel ?? 'Отмена'} onClick={() => onAnswer('cancel')} height={44} />
      {request?.altLabel && <PillButton label={request.altLabel} onClick={() => onAnswer('alt')} height={44} />}
      <PillButton label={request?.confirmLabel ?? 'OK'} onClick={() => onAnswer('confirm')} variant={request?.danger ? 'danger' : 'primary'} height={44} />
    </div>
  </Modal>
);

export interface NoticeMessage {
  id: number;
  text: string;
  tone: 'info' | 'error' | 'success';
}

/** Всплывающее сообщение над картой */
export const Notice: React.FC<{ notice: NoticeMessage | null }> = ({ notice }) => (
  <AnimatePresence>
    {notice && (
      <motion.div
        key={notice.id}
        initial={{ opacity: 0, y: -12, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: -12, x: '-50%' }}
        transition={{ duration: 0.22 }}
        role="status"
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          zIndex: 60,
          maxWidth: 640,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px',
          borderRadius: 12,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.tooltip,
          border: `1px solid ${COLORS.border}`,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: '18px',
          color: COLORS.text,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: notice.tone === 'error' ? COLORS.error : notice.tone === 'success' ? COLORS.ok : COLORS.accent,
          }}
        />
        {notice.text}
      </motion.div>
    )}
  </AnimatePresence>
);
