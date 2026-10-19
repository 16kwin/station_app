// PurchasePlanPopup.tsx — «Рассчитать план закупок»: материалы по месяцам, когда они нужны (самое раннее начало
// родительской детали), с суммарным количеством; «Скачать CSV» — файл для Excel.
import React, { useMemo } from 'react';
import type { GppRowDTO } from './types';
import { COLORS, FONT } from './theme';
import { ruDay } from './dates';
import { buildPurchasePlan, downloadText, formatQty, purchaseCsv } from './purchase';
import { DownloadIcon } from './icons';
import { Modal, PillButton } from './ui';

interface PurchasePlanPopupProps {
  open: boolean;
  rows: readonly GppRowDTO[];
  periodText: string;
  onClose: () => void;
}

const GRID = '210px minmax(0, 1fr) 100px 56px 124px';

const PurchasePlanPopup: React.FC<PurchasePlanPopupProps> = ({ open, rows, periodText, onClose }) => {
  const plan = useMemo(() => (open ? buildPurchasePlan(rows) : []), [open, rows]);
  const total = plan.reduce((n, m) => n + m.items.length, 0);

  const download = () => downloadText(purchaseCsv(plan), `План закупок ГПП — ${periodText}.csv`);

  return (
    <Modal isOpen={open} onClose={onClose} width={900} title="План закупок" subtitle={`Материалы к дате начала деталей · период ГПП: ${periodText}`}>
      <div style={{ padding: '20px 36px 0', fontFamily: FONT, color: COLORS.text, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {total === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>В документе нет материалов</div>
        ) : (
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 15, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', height: 44, padding: '0 18px', backgroundColor: COLORS.accent, color: COLORS.white, fontSize: 13, fontWeight: 600 }}>
              <span>Код</span>
              <span>Наименование</span>
              <span style={{ textAlign: 'right' }}>Количество</span>
              <span style={{ textAlign: 'center' }}>Ед.</span>
              <span style={{ textAlign: 'center' }}>Нужно к дате</span>
            </div>
            <div style={{ maxHeight: 430, overflowY: 'auto' }}>
              {plan.map(month => (
                <div key={month.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 18px', backgroundColor: '#F4F5FF', fontSize: 13, fontWeight: 600, color: COLORS.accent }}>
                    {month.label}
                    <span style={{ fontWeight: 500, color: COLORS.muted }}>· позиций: {month.items.length}</span>
                  </div>
                  {month.items.map(item => (
                    <div
                      key={item.key}
                      title={item.usedIn.length ? `Для деталей: ${item.usedIn.join(', ')}` : undefined}
                      style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', minHeight: 44, padding: '6px 18px', borderTop: `1px solid ${COLORS.line}`, fontSize: 14, boxSizing: 'border-box' }}
                    >
                      <span title={item.code} style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{item.code || '—'}</span>
                      <span style={{ lineHeight: '18px', paddingRight: 10 }}>{item.name}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatQty(item.quantity)}</span>
                      <span style={{ textAlign: 'center', color: COLORS.muted }}>{item.unit}</span>
                      <span style={{ textAlign: 'center' }}>{item.needDay === null ? '—' : ruDay(item.needDay)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 36px 30px', fontFamily: FONT }}>
        <span style={{ fontSize: 13, color: COLORS.muted }}>Всего позиций: {total}</span>
        <div style={{ flex: 1 }} />
        <PillButton label="Закрыть" onClick={onClose} />
        <PillButton label="Скачать CSV" variant="primary" icon={<DownloadIcon size={16} color={COLORS.white} />} disabled={total === 0} onClick={download} />
      </div>
    </Modal>
  );
};

export default PurchasePlanPopup;
