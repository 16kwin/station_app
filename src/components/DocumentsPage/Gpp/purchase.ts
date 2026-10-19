// purchase.ts — план закупок из ГПП: материалы, сгруппированные по коду и наименованию, суммарное количество
// и дата «нужно к» — самое раннее начало родительской детали; разбивка по месяцам и выгрузка в CSV для Excel.
import type { GppRowDTO } from './types';
import { monthIndex, monthLabel, parseDay, ruDay } from './dates';
import { buildIndex } from './tree';

export interface PurchaseItem {
  key: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  /** Номер дня; null — у родительской детали нет даты */
  needDay: number | null;
  /** Детали, для которых нужен материал (коды операций) */
  usedIn: string[];
}

export interface PurchaseMonth {
  /** Номер месяца (год × 12 + месяц); null — без даты */
  month: number | null;
  label: string;
  items: PurchaseItem[];
}

export const buildPurchasePlan = (rows: readonly GppRowDTO[]): PurchaseMonth[] => {
  const index = buildIndex(rows);
  const items = new Map<string, PurchaseItem>();
  rows
    .filter(r => r.kind === 'MATERIAL')
    .forEach(r => {
      const code = (r.code ?? '').trim();
      const name = r.name.trim();
      const unit = r.unit || 'шт';
      const key = `${code.toLowerCase()}|${name.toLowerCase()}|${unit}`;
      const parent = r.parentUid ? index.byUid.get(r.parentUid) : undefined;
      const need = parent ? parseDay(parent.start) : null;
      const usedIn = parent ? [parent.code ? `${parent.code}` : parent.name] : [];
      const known = items.get(key);
      if (known) {
        known.quantity = Math.round((known.quantity + r.quantity) * 1000) / 1000;
        if (need !== null && (known.needDay === null || need < known.needDay)) known.needDay = need;
        usedIn.forEach(u => {
          if (!known.usedIn.includes(u)) known.usedIn.push(u);
        });
      } else {
        items.set(key, { key, code, name, unit, quantity: r.quantity, needDay: need, usedIn });
      }
    });

  const months = new Map<number | null, PurchaseItem[]>();
  [...items.values()].forEach(item => {
    const m = item.needDay === null ? null : monthIndex(item.needDay);
    const list = months.get(m);
    if (list) list.push(item);
    else months.set(m, [item]);
  });

  return [...months.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([month, list]) => ({
      month,
      label: month === null ? 'Без даты' : monthLabel(month),
      items: list.sort((a, b) => (a.needDay ?? Infinity) - (b.needDay ?? Infinity) || a.name.localeCompare(b.name, 'ru')),
    }));
};

/** Количество по-русски: «140», «1,5» */
export const formatQty = (n: number): string => String(Math.round(n * 1000) / 1000).replace('.', ',');

/**
 * Ячейка CSV. Текст, который начинается с = + - @ (или табуляции, перевода строки), Excel считает формулой —
 * такой текст предваряется апострофом и берётся в кавычки (защита от CSV-инъекции, как советует OWASP).
 * Количество и даты с этих знаков не начинаются и не меняются.
 */
const csvCell = (value: string): string => {
  const text = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
  return text !== value || /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV для Excel: UTF-8 с BOM, разделитель «;», строки через CRLF */
export const purchaseCsv = (plan: readonly PurchaseMonth[]): string => {
  const lines = [['Месяц', 'Код', 'Наименование', 'Количество', 'Ед. изм.', 'Нужно к дате', 'Для деталей']];
  plan.forEach(m =>
    m.items.forEach(i =>
      lines.push([m.label, i.code, i.name, formatQty(i.quantity), i.unit, i.needDay === null ? '' : ruDay(i.needDay), i.usedIn.join(', ')]),
    ),
  );
  return '﻿' + lines.map(l => l.map(csvCell).join(';')).join('\r\n') + '\r\n';
};

/** Скачать текст файлом под понятным именем */
export const downloadText = (text: string, fileName: string, type = 'text/csv;charset=utf-8'): void => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
