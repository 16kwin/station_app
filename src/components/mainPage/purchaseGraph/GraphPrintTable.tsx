// GraphPrintTable.tsx — печатная форма: шапка с периодом и фильтрами и таблица видимых закупок
// (Номенклатура, Поставщик, Цена, Ориентир, Превышение %, Кол-во, Сумма, Последний заказ).
// На экране скрыта, видна только при печати (классы pg-print-only в стилях страницы).
import React from 'react';
import { COLORS, FONT } from '../shared/layout';
import type { DateRange } from '../shared/types';
import { formatDateTimeRu, formatMoney, formatQty, formatSignedPercent, isoToRu } from './format';
import { buildPrintRows } from './model';
import type { GraphModel } from './types';

interface GraphPrintHeaderProps {
  range: DateRange;
  limitPercent: number;
  /** Строка о фильтрах: фокус, выбор, скрытые категории */
  filtersNote: string;
}

/** Шапка печатной формы — над графом */
export const GraphPrintHeader: React.FC<GraphPrintHeaderProps> = ({ range, limitPercent, filtersNote }) => (
  <div className="pg-print-only" style={{ fontFamily: FONT, color: COLORS.text, marginBottom: '4mm' }}>
    <div style={{ fontSize: '16pt', fontWeight: 600 }}>Граф закупок</div>
    <div style={{ fontSize: '10pt', marginTop: '1mm' }}>
      Период: {isoToRu(range.from)} – {isoToRu(range.to)} · лимит превышения цены {Math.round(limitPercent)}%
    </div>
    {filtersNote && <div style={{ fontSize: '9pt', marginTop: '1mm', color: COLORS.textMuted }}>{filtersNote}</div>}
  </div>
);

const cell: React.CSSProperties = {
  padding: '1.6mm 2mm',
  borderBottom: '0.3mm solid #D9DEE8',
  fontSize: '9pt',
  lineHeight: 1.25,
  verticalAlign: 'top',
};

const numeric: React.CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };

const headCell: React.CSSProperties = {
  ...cell,
  fontWeight: 600,
  backgroundColor: '#F2F4F8',
  borderBottom: '0.4mm solid #B9C3D3',
  textAlign: 'left',
};

interface GraphPrintTableProps {
  model: GraphModel;
}

/** Таблица видимых закупок */
const GraphPrintTable: React.FC<GraphPrintTableProps> = ({ model }) => {
  const rows = buildPrintRows(model);
  const total = rows.reduce((acc, row) => acc + row.amount, 0);
  return (
    <div className="pg-print-only pg-print-table" style={{ fontFamily: FONT, color: COLORS.text, marginTop: '5mm' }}>
      <div style={{ fontSize: '11pt', fontWeight: 600, marginBottom: '2mm' }}>Закупки на графе: {rows.length}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            <th style={headCell}>Номенклатура</th>
            <th style={headCell}>Поставщик</th>
            <th style={{ ...headCell, textAlign: 'right' }}>Цена</th>
            <th style={{ ...headCell, textAlign: 'right' }}>Ориентир</th>
            <th style={{ ...headCell, textAlign: 'right' }}>Превышение, %</th>
            <th style={{ ...headCell, textAlign: 'right' }}>Кол-во</th>
            <th style={{ ...headCell, textAlign: 'right' }}>Сумма</th>
            <th style={headCell}>Последний заказ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ breakInside: 'avoid' }}>
              <td style={cell}>{row.nomName}</td>
              <td style={cell}>{row.supplierName}</td>
              <td style={numeric}>{formatMoney(row.price)}</td>
              <td style={numeric}>{row.refPrice > 0 ? formatMoney(row.refPrice) : '—'}</td>
              <td style={{ ...numeric, fontWeight: row.over ? 600 : 400, color: row.over ? COLORS.roseDark : COLORS.text }}>
                {row.refPrice > 0 ? formatSignedPercent(row.overPercent) : '—'}
              </td>
              <td style={numeric}>{formatQty(row.qty, row.unit)}</td>
              <td style={numeric}>{formatMoney(row.amount)}</td>
              <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                {row.lastOrderNo ? `№${row.lastOrderNo}` : ''}
                {row.lastAt ? ` от ${formatDateTimeRu(row.lastAt)}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...cell, fontWeight: 600 }} colSpan={6}>
              Итого
            </td>
            <td style={{ ...numeric, fontWeight: 600 }}>{formatMoney(total)}</td>
            <td style={cell} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default GraphPrintTable;
