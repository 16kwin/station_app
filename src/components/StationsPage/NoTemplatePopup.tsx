// NoTemplatePopup.tsx — попап "Шаблон не установлен"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NoTemplatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: () => void;
  stationName: string;
}

const POPUP_BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 9999,
};

const NoTemplatePopup: React.FC<NoTemplatePopupProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  stationName,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div style={POPUP_BACKDROP_STYLE} onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 30,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <h3
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: 20,
                fontWeight: 500,
                color: '#2D4059',
                margin: 0,
                textAlign: 'center',
              }}
            >
              Шаблон не установлен
            </h3>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                color: '#6B7280',
                margin: 0,
                textAlign: 'center',
                lineHeight: '20px',
              }}
            >
              На станции «{stationName || '—'}» не установлен шаблон загрузки.
              Установите шаблон, чтобы создать документ пополнения.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={onSelectTemplate}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#666EFE',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                Выбрать шаблон
              </button>

              <button
                onClick={onClose}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(102,110,254,0.15)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 400,
                  color: '#2D4059',
                }}
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default NoTemplatePopup;