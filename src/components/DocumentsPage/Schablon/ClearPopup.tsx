// ClearPopup.tsx — ПОЛНЫЙ ФАЙЛ
import React from 'react';

interface ClearPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onClearSelected: () => void;
  hasSelection: boolean;
  templateName?: string;
}

const ClearPopup: React.FC<ClearPopupProps> = ({
  isOpen,
  onClose,
  onClearAll,
  onClearSelected,
  hasSelection,
  templateName,
}) => {
  if (!isOpen) return null;

  const btnStyle: React.CSSProperties = {
    width: '241px',
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2D4059',
    padding: 0,
  };

  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        style={{
          width: '481px',
          height: '323px',
          backgroundColor: '#FFFFFF',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '17px',
              color: '#2D4059',
              textAlign: 'center',
            }}
          >
            Очистить?
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
          }}
        >
          <button
            onClick={onClearAll}
            style={btnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F1FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Всю схему
          </button>

          <button
            onClick={hasSelection ? onClearSelected : undefined}
            disabled={!hasSelection}
            style={{
              ...btnStyle,
              cursor: hasSelection ? 'pointer' : 'not-allowed',
              opacity: hasSelection ? 1 : 0.4,
            }}
            onMouseEnter={(e) => { if (hasSelection) e.currentTarget.style.backgroundColor = '#F0F1FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Выбранные ячейки
          </button>

          <button
            onClick={onClose}
            style={btnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F1FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearPopup;