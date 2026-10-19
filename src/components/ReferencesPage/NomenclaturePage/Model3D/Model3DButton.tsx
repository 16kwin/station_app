// Model3DButton.tsx — кнопка «3D» в левом верхнем углу блока «Изображение»: белая «таблетка» с синей рамкой
// и счётчиком моделей. Пока номенклатура не записана, моделей у неё быть не может — кнопка неактивна с подсказкой.
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from './theme';

interface Model3DButtonProps {
  count: number;
  disabled: boolean;
  onClick: () => void;
}

const DISABLED_HINT = 'Сначала запишите номенклатуру';

const Model3DButton: React.FC<Model3DButtonProps> = ({ count, disabled, onClick }) => {
  const [hover, setHover] = useState(false);
  const label = disabled ? DISABLED_HINT : count > 0 ? `3D-модели: ${count}` : 'Добавить 3D-модель';
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <motion.button
        type="button"
        aria-label={label}
        aria-disabled={disabled}
        onClick={event => {
          event.stopPropagation();
          if (!disabled) onClick();
        }}
        whileHover={disabled ? undefined : { y: -1, boxShadow: SHADOWS.buttonHover }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ duration: 0.18 }}
        style={{
          height: 36,
          minWidth: 58,
          padding: count > 0 ? '0 8px 0 14px' : '0 14px',
          borderRadius: 10,
          border: `1px solid ${disabled ? COLORS.placeholder : COLORS.accent}`,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.button,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: disabled ? COLORS.placeholder : COLORS.text,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          userSelect: 'none',
        }}
      >
        3D
        {count > 0 && !disabled && (
          <span
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 10,
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '20px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {count}
          </span>
        )}
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
              top: 44,
              left: 0,
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: COLORS.hintBg,
              color: COLORS.white,
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 4,
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

export default Model3DButton;
