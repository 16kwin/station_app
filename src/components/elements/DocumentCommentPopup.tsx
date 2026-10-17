// DocumentCommentPopup.tsx — попап комментария к документу
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import CloseIcon18Blue from '../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';
import DescriptionIcon16Blue from '../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';

export interface DocumentCommentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue?: string;
  title?: string;
  placeholder?: string;
  maxLength?: number;
}

const POPUP_W = 680;
const POPUP_H = 580;
const POPUP_RADIUS = 20;

const TITLE_TOP = 30;
const TITLE_H = 21;
const TITLE_LEFT = 30;
const TITLE_RIGHT = 30;

const FIELD_TOP = TITLE_TOP + TITLE_H + 30; // 30 ниже заголовка
const FIELD_W = 600;
const FIELD_H = 375;
const FIELD_RADIUS = 15;
const FIELD_LEFT = (POPUP_W - FIELD_W) / 2;

const FIELD_ICON_LEFT = 15;
const FIELD_ICON_TOP = 15;
const FIELD_ICON_SIZE = 18;

const FIELD_CLOSE_RIGHT = 15;
const FIELD_CLOSE_TOP = 15;
const FIELD_CLOSE_SIZE = 18;

const TEXT_LEFT = FIELD_ICON_LEFT + FIELD_ICON_SIZE + 12; // 45
const TEXT_RIGHT = FIELD_CLOSE_RIGHT + FIELD_CLOSE_SIZE + 12; // 45
const TEXT_TOP = 15;
const TEXT_BOTTOM = 15;

const BTN_W = 114;
const BTN_H = 44;
const BTN_RADIUS = 30;
const BTN_RIGHT = 30;
const BTN_BOTTOM = 30;

const DocumentCommentPopup: React.FC<DocumentCommentPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue = '',
  title = 'Комментарий к документу',
  placeholder = 'Введите комментарий...',
  maxLength,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleFieldClose = () => {
    setValue('');
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleSave}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'relative',
              width: POPUP_W,
              height: POPUP_H,
              backgroundColor: '#FFFFFF',
              borderRadius: POPUP_RADIUS,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: TITLE_TOP,
                left: TITLE_LEFT,
                right: TITLE_RIGHT,
                height: TITLE_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontSize: 17,
                fontWeight: 500,
                color: '#2D4059',
                lineHeight: `${TITLE_H}px`,
              }}
            >
              {title}
            </div>

            <div
              style={{
                position: 'absolute',
                top: FIELD_TOP,
                left: FIELD_LEFT,
                width: FIELD_W,
                height: FIELD_H,
                borderRadius: FIELD_RADIUS,
                border: '1px solid #666EFE',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: FIELD_ICON_TOP,
                  left: FIELD_ICON_LEFT,
                  width: FIELD_ICON_SIZE,
                  height: FIELD_ICON_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <img
                  src={DescriptionIcon16Blue}
                  alt=""
                  style={{ width: FIELD_ICON_SIZE, height: FIELD_ICON_SIZE }}
                />
              </div>

              <div
                onClick={handleFieldClose}
                style={{
                  position: 'absolute',
                  top: FIELD_CLOSE_TOP,
                  right: FIELD_CLOSE_RIGHT,
                  width: FIELD_CLOSE_SIZE,
                  height: FIELD_CLOSE_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <img
                  src={CloseIcon18Blue}
                  alt="Очистить"
                  style={{ width: FIELD_CLOSE_SIZE, height: FIELD_CLOSE_SIZE }}
                />
              </div>

              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                style={{
                  position: 'absolute',
                  top: TEXT_TOP,
                  left: TEXT_LEFT,
                  right: TEXT_RIGHT,
                  bottom: TEXT_BOTTOM,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: '21px',
                  color: '#2D4059',
                  boxSizing: 'border-box',
                  padding: 0,
                }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                position: 'absolute',
                right: BTN_RIGHT,
                bottom: BTN_BOTTOM,
                width: BTN_W,
                height: BTN_H,
                borderRadius: BTN_RADIUS,
                border: '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                color: '#2D4059',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Закрыть
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DocumentCommentPopup;