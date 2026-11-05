// MoveOrder/StockAvailabilityWarning.tsx — обобщённое предупреждение по остаткам
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import AlertIcon24Red from '../../../assets/Icons/ControlIcons/ControlIcon17Red.svg';
import type { StockReservationRow } from './stockAvailability';
import { describeDocHolder, pluralizeUnits } from './stockAvailability';

interface StockAvailabilityWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  kind: 'critical' | 'insufficient';
  materialName: string;
  cellAddress: string;
  requestQty: number;
  stockAvailable: number;
  minStock: number | null;
  criticalStock: number | null;
  reservations: StockReservationRow[];
  onOpenDoc?: (r: StockReservationRow) => void;
}

const WARNING_TITLE_CRITICAL = 'Критический остаток номенклатуры на складе-отправителе';
const WARNING_TITLE_INSUFFICIENT = 'Недостаток номенклатуры на складе-отправителе';

const StockAvailabilityWarning: React.FC<StockAvailabilityWarningProps> = ({
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
    position: 'fixed', inset: 0, zIndex: 10050,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  };
  const popupStyle: React.CSSProperties = {
    width: 520, backgroundColor: '#FFFFFF', borderRadius: 15,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '28px 32px 24px', boxSizing: 'border-box',
    position: 'relative', fontFamily: 'Inter, sans-serif',
  };

  const totalReserved = reservations.reduce(
    (s, r) => s + (r.reservedQuantity != null ? Number(r.reservedQuantity) : 0),
    0,
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }} style={overlayStyle}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }} style={popupStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={AlertIcon24Red} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#2D4059', lineHeight: '19px' }}>{title}</span>
          </div>

          <div style={{ fontSize: 14, fontWeight: 500, color: '#2D4059', textAlign: 'center', lineHeight: '20px', marginBottom: 8 }}>
            {materialName}
          </div>

          <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: '18px', marginBottom: 16 }}>
            {isCritical
              ? `На складе-отправителе после перемещения: ${cleanAfter} ${pluralizeUnits(cleanAfter)}`
              : `На складе-отправителе доступно: ${stockAvailable} ${pluralizeUnits(stockAvailable)}`}
          </div>

          {reservations.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: '18px', marginBottom: 8 }}>
              {totalReserved} {pluralizeUnits(totalReserved)} забронировано документами:
            </div>
          )}
          {reservations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {reservations.map((r) => {
                const canOpen = !!onOpenDoc;
                return (
                  <div key={r.uid} style={{ textAlign: 'center', fontSize: 13, color: 'rgba(45, 64, 89, 0.6)', lineHeight: '18px' }}>
                    <span
                      onClick={() => { if (canOpen) onOpenDoc?.(r); }}
                      style={{
                        color: canOpen ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                        fontWeight: 500,
                        cursor: canOpen ? 'pointer' : 'default',
                        textDecoration: canOpen ? 'underline' : 'none',
                      }}
                    >
                      {describeDocHolder(r)}
                    </span>
                    {r.reservedQuantity != null && (
                      <span> — {r.reservedQuantity} {pluralizeUnits(r.reservedQuantity)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isCritical ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FF3052', textAlign: 'center', lineHeight: '20px', marginTop: 12, marginBottom: 12 }}>
                При перемещении {requestQty} {pluralizeUnits(requestQty)} на складе-отправителе наступит критический остаток
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2D4059', textAlign: 'center', lineHeight: '20px', marginTop: 18, marginBottom: 16 }}>
                Подтвердить перемещение?
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                <button
                  onClick={onConfirm}
                  style={{ width: 122, height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}
                >Да</button>
                <button
                  onClick={onClose}
                  style={{ width: 90, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#2D4059' }}
                >Нет</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FF3052', textAlign: 'center', lineHeight: '20px', marginTop: 12, marginBottom: 12 }}>
                На складе-отправителе отсутствует требуемое количество номенклатуры ({requestQty} {pluralizeUnits(requestQty)})
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FF3052', textAlign: 'center', lineHeight: '20px', marginBottom: 16 }}>
                Переместить из ячейки {cellAddress} невозможно
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                <button
                  onClick={onClose}
                  style={{ width: 122, height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}
                >Закрыть</button>
              </div>
            </>
          )}

          <div style={{ position: 'absolute', bottom: 18, left: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={InfoIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Информация</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockAvailabilityWarning;