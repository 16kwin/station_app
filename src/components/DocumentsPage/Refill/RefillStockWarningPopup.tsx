// RefillStockWarningPopup.tsx — попап предупреждения по остаткам склада
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import AlertIcon24Red from '../../../assets/Icons/ControlIcons/ControlIcon17Red.svg';

export interface StockWarningReservation {
  uid: string;
  docRefillUid: string | null;
  docRefillCode: number | null;
  reservedQuantity: number | null;
}

interface RefillStockWarningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  kind: 'critical' | 'insufficient';
  materialName: string;
  cellAddress: string;         // "колонка-ячейка"
  requestQty: number;          // сколько хотят загрузить
  stockAvailable: number;      // сколько сейчас чисто на складе
  minStock: number | null;
  criticalStock: number | null;
  reservations: StockWarningReservation[];
  onOpenDoc?: (docUid: string) => void;
}

const pluralizeUnits = (n: number): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'единиц';
  if (last === 1) return 'единица';
  if (last >= 2 && last <= 4) return 'единицы';
  return 'единиц';
};

const WARNING_TITLE_CRITICAL = 'Критический остаток номенклатуры на основном складе';
const WARNING_TITLE_INSUFFICIENT = 'Недостаток номенклатуры на основном складе';

const RefillStockWarningPopup: React.FC<RefillStockWarningPopupProps> = ({
  isOpen, onClose, onConfirm,
  kind, materialName, cellAddress,
  requestQty, stockAvailable,
  minStock, criticalStock,
  reservations, onOpenDoc,
}) => {
  if (!isOpen) return null;

  const isCritical = kind === 'critical';

  const title = isCritical ? WARNING_TITLE_CRITICAL : WARNING_TITLE_INSUFFICIENT;
  const cleanAfter = stockAvailable - requestQty;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  const popupStyle: React.CSSProperties = {
    width: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '28px 32px 24px',
    boxSizing: 'border-box',
    position: 'relative',
    fontFamily: 'Inter, sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  };

  const titleTextStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#2D4059',
    lineHeight: '19px',
  };

  const materialStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
    textAlign: 'center',
    lineHeight: '20px',
    marginBottom: 8,
  };

  const subStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 400,
    color: 'rgba(45, 64, 89, 0.6)',
    textAlign: 'center',
    lineHeight: '18px',
    marginBottom: 16,
  };

  const redTextStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#FF3052',
    textAlign: 'center',
    lineHeight: '20px',
    marginTop: 12,
    marginBottom: 12,
  };

  const questionStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
    textAlign: 'center',
    lineHeight: '20px',
    marginTop: 18,
    marginBottom: 16,
  };

  const btnRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  };

  const btnConfirmStyle: React.CSSProperties = {
    width: 122,
    height: 44,
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#666EFE',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    color: '#FFFFFF',
  };

  const btnCloseStyle: React.CSSProperties = {
    width: 90,
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    color: '#2D4059',
  };

  const totalReserved = reservations.reduce((s, r) => s + (r.reservedQuantity ?? 0), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={overlayStyle}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          style={popupStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div style={titleStyle}>
            <img src={AlertIcon24Red} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span style={titleTextStyle}>{title}</span>
          </div>

          {/* Название номенклатуры */}
          <div style={materialStyle}>{materialName}</div>

          {/* Подпись под номенклатурой */}
          {isCritical ? (
            <div style={subStyle}>
              На основном складе: {cleanAfter} {pluralizeUnits(cleanAfter)}
            </div>
          ) : (
            <div style={subStyle}>
              На основном складе доступно: {stockAvailable} {pluralizeUnits(stockAvailable)}
            </div>
          )}

          {/* Брони по другим документам — показываем всегда, если есть */}
          {reservations.length > 0 && (
            <div style={subStyle}>
              {totalReserved}{' '}
              {pluralizeUnits(totalReserved)}{' '}
              забронировано документами:
            </div>
          )}

          {reservations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {reservations.map((r) => (
                <div key={r.uid} style={{ textAlign: 'center', fontSize: 13, color: 'rgba(45, 64, 89, 0.6)', lineHeight: '18px' }}>
                  Пополнение №{' '}
                  <span
                    onClick={() => r.docRefillUid && onOpenDoc?.(r.docRefillUid)}
                    style={{ color: '#666EFE', fontWeight: 500, cursor: r.docRefillUid ? 'pointer' : 'default', textDecoration: 'underline' }}
                  >
                    {r.docRefillCode != null ? String(r.docRefillCode).padStart(4, '0') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Красный текст */}
          {isCritical ? (
            <div style={redTextStyle}>
              При загрузке {requestQty} {pluralizeUnits(requestQty)} в станцию на основном складе наступит критический остаток
            </div>
          ) : (
            <>
              <div style={redTextStyle}>
                На основном складе отсутствует загружаемое количество номенклатуры ({requestQty} {pluralizeUnits(requestQty)})
              </div>
              <div style={redTextStyle}>
                Пополнить ячейку {cellAddress} невозможно
              </div>
            </>
          )}

          {/* Вопрос и кнопки */}
          {isCritical ? (
            <>
              <div style={questionStyle}>Подтвердить перемещение с основного склада?</div>
              <div style={btnRowStyle}>
                <button style={btnConfirmStyle} onClick={onConfirm}>Да</button>
                <button style={btnCloseStyle} onClick={onClose}>Нет</button>
              </div>
            </>
          ) : (
            <div style={btnRowStyle}>
              <button style={btnConfirmStyle} onClick={onClose}>Закрыть</button>
            </div>
          )}

          {/* «Информация» внизу слева */}
          <div style={{ position: 'absolute', bottom: 18, left: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={InfoIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Информация</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RefillStockWarningPopup;