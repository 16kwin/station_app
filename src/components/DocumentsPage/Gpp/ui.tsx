// ui.tsx — общие элементы документа ГПП в стиле приложения: кнопки тулбара 40×40, кнопки с подписью, переключатель,
// выпадающие панели, модальное окно, подтверждение, всплывающее сообщение, подсказка и индикатор загрузки.
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, LAYOUT, SHADOWS } from './theme';
import { CloseIcon } from './icons';

interface ToolButtonProps {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  width?: number;
  buttonRef?: React.Ref<HTMLButtonElement>;
  style?: React.CSSProperties;
}

/** Кнопка тулбара документа: белая 40×40 со скруглением 10, нажатая — акцентная */
export const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, children, active = false, disabled = false, width, buttonRef, style }) => (
  <motion.button
    ref={buttonRef}
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    whileHover={disabled ? undefined : { y: -1, boxShadow: active ? SHADOWS.active : SHADOWS.buttonHover }}
    whileTap={disabled ? undefined : { scale: 0.95 }}
    style={{
      height: LAYOUT.toolButton,
      width: width ?? LAYOUT.toolButton,
      minWidth: LAYOUT.toolButton,
      padding: width ? '0 16px' : 0,
      borderRadius: 10,
      border: 'none',
      backgroundColor: active ? COLORS.accent : COLORS.white,
      boxShadow: active ? SHADOWS.active : SHADOWS.button,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      fontFamily: FONT,
      fontSize: 14,
      fontWeight: 500,
      color: active ? COLORS.white : COLORS.text,
      whiteSpace: 'nowrap',
      outline: 'none',
      flexShrink: 0,
      ...style,
    }}
  >
    {children}
  </motion.button>
);

interface BottomButtonProps {
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  busy?: boolean;
  width?: number;
  title?: string;
}

/** Нижняя кнопка документа: белая 50 px с мягкой тенью, как «Записать» и «Закрыть» в «Пополнении» */
export const BottomButton: React.FC<BottomButtonProps> = ({ label, onClick, icon, disabled = false, busy = false, width, title }) => {
  const blocked = disabled || busy;
  return (
    <motion.button
      type="button"
      title={title}
      disabled={disabled}
      onClick={blocked ? undefined : onClick}
      whileHover={blocked ? undefined : { y: -1, boxShadow: SHADOWS.buttonHover }}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      style={{
        height: LAYOUT.bottomButtonHeight,
        width,
        padding: width ? 0 : '0 24px',
        border: 'none',
        borderRadius: 10,
        backgroundColor: COLORS.white,
        boxShadow: SHADOWS.button,
        color: COLORS.text,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        whiteSpace: 'nowrap',
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {busy ? <Spinner /> : icon}
      {label}
    </motion.button>
  );
};

interface PillButtonProps {
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  height?: number;
  minWidth?: number;
}

/** Кнопка в окнах: основная — акцентная, вторичная — белая с тенью, опасная — с красным текстом */
export const PillButton: React.FC<PillButtonProps> = ({ label, onClick, icon, variant = 'secondary', disabled = false, busy = false, height = 44, minWidth }) => {
  const primary = variant === 'primary';
  const blocked = disabled || busy;
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={blocked ? undefined : onClick}
      whileHover={blocked ? undefined : { y: -1, boxShadow: primary ? '0 6px 18px rgba(102, 110, 254, 0.35)' : SHADOWS.buttonHover }}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      style={{
        height,
        minWidth,
        padding: '0 20px',
        border: 'none',
        borderRadius: 10,
        backgroundColor: primary ? COLORS.accent : COLORS.white,
        color: primary ? COLORS.white : variant === 'danger' ? COLORS.danger : COLORS.text,
        boxShadow: primary ? SHADOWS.active : SHADOWS.button,
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : busy ? 'progress' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        outline: 'none',
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
    style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, borderTopColor: 'transparent', display: 'inline-block', flexShrink: 0 }}
  />
);

/** Переключатель «вкл/выкл» */
export const Toggle: React.FC<{ on: boolean; onChange?: (on: boolean) => void; disabled?: boolean; label: string }> = ({ on, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={disabled ? undefined : () => onChange?.(!on)}
    style={{
      width: 34,
      height: 19,
      padding: 0,
      border: 'none',
      borderRadius: 999,
      backgroundColor: on ? COLORS.accent : '#C9D1DE',
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background-color 0.2s ease',
      flexShrink: 0,
      outline: 'none',
    }}
  >
    <motion.span
      animate={{ x: on ? 17 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      style={{ position: 'absolute', top: 2, left: 0, width: 15, height: 15, borderRadius: '50%', backgroundColor: COLORS.white, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' }}
    />
  </button>
);

interface PopoverProps {
  open: boolean;
  /** Положение панели относительно страницы документа */
  style: React.CSSProperties;
  width: number;
  panelRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

/** Выпадающая панель под кнопкой тулбара */
export const Popover: React.FC<PopoverProps> = ({ open, style, width, panelRef, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.16 }}
        style={{
          position: 'absolute',
          zIndex: 40,
          width,
          backgroundColor: COLORS.white,
          borderRadius: 15,
          boxShadow: SHADOWS.menu,
          border: `1px solid ${COLORS.accentLine}`,
          fontFamily: FONT,
          color: COLORS.text,
          transformOrigin: 'top center',
          ...style,
        }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/** Пункт выпадающего списка с акцентной чертой слева у выбранного */
export const MenuItem: React.FC<{ label: React.ReactNode; selected?: boolean; onClick: () => void; icon?: React.ReactNode; trailing?: React.ReactNode }> = ({
  label,
  selected = false,
  onClick,
  icon,
  trailing,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 20px 0 30px',
        cursor: 'pointer',
        backgroundColor: hover ? COLORS.rowHover : 'transparent',
        fontSize: 15,
        fontWeight: 500,
        color: selected ? COLORS.accent : COLORS.text,
        whiteSpace: 'nowrap',
      }}
    >
      {selected && <span style={{ position: 'absolute', left: 15, top: 9, width: 2, height: 22, borderRadius: 999, backgroundColor: COLORS.accent }} />}
      {icon}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {trailing}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

/** Модальное окно приложения: затемнение с размытием, белое окно с масштабированием, крестик справа */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, width, title, subtitle, children }) => {
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
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: COLORS.overlay,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'relative',
              width,
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: COLORS.white,
              borderRadius: 20,
              boxShadow: SHADOWS.modal,
              fontFamily: FONT,
              color: COLORS.text,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '30px 64px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: '22px' }}>{title}</div>
              {subtitle && <div style={{ marginTop: 6, fontSize: 13, lineHeight: '18px', color: COLORS.muted }}>{subtitle}</div>}
            </div>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={onClose}
              style={{ position: 'absolute', top: 24, right: 24, width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
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

export interface DialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  busy?: boolean;
}

/** Вопрос в стиле приложения вместо window.confirm: текст и кнопки в ряд */
export const Dialog: React.FC<{ isOpen: boolean; onClose: () => void; title: string; text: React.ReactNode; actions: DialogAction[]; width?: number }> = ({
  isOpen,
  onClose,
  title,
  text,
  actions,
  width = 460,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} width={width} title={title}>
    <div style={{ padding: '14px 40px 0', textAlign: 'center', fontSize: 14, lineHeight: '21px', color: COLORS.muted }}>{text}</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '26px 30px 30px' }}>
      {actions.map(a => (
        <PillButton key={a.label} label={a.label} onClick={a.onClick} variant={a.variant} busy={a.busy} />
      ))}
    </div>
  </Modal>
);

export interface NoticeMessage {
  id: number;
  text: string;
  tone: 'info' | 'error' | 'success';
}

/** Всплывающее сообщение над документом */
export const Notice: React.FC<{ notice: NoticeMessage | null }> = ({ notice }) => (
  <AnimatePresence>
    {notice && (
      <motion.div
        key={notice.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.22 }}
        role="status"
        style={{
          position: 'absolute',
          bottom: LAYOUT.bottomButtonsBottom + 6,
          left: LAYOUT.left,
          zIndex: 60,
          maxWidth: 860,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 20px',
          borderRadius: 12,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.tooltip,
          border: `1px solid ${COLORS.border}`,
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '19px',
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
            backgroundColor: notice.tone === 'error' ? COLORS.danger : notice.tone === 'success' ? COLORS.ok : COLORS.accent,
          }}
        />
        {notice.text}
      </motion.div>
    )}
  </AnimatePresence>
);

/** Тёмная подсказка при наведении — как пояснения на панелях главной */
export const HoverHint: React.FC<{ text: React.ReactNode; children: React.ReactNode; width?: number; align?: 'left' | 'center' }> = ({ text, children, width = 280, align = 'center' }) => {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: align === 'center' ? '50%' : -8,
              marginLeft: align === 'center' ? -width / 2 : 0,
              width,
              zIndex: 50,
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: COLORS.hintBg,
              color: COLORS.white,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 400,
              lineHeight: '18px',
              boxShadow: SHADOWS.tooltip,
              pointerEvents: 'none',
              whiteSpace: 'normal',
            }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
