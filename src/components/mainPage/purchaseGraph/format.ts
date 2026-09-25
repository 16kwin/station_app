// format.ts — форматирование цен, объёмов, количеств и подписей графа закупок

import { formatDateTimeRu, isoToRu } from '../shared/format';

export { formatDateTimeRu, isoToRu };

const groupThousands = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const finite = (value: number): number => (Number.isFinite(value) ? value : 0);

/** 12300.4 → "12 300" — целое с пробелами между тысячами */
export const formatInt = (value: number): string => {
  const rounded = Math.round(finite(value));
  const sign = rounded < 0 ? '−' : '';
  return sign + groupThousands(String(Math.abs(rounded)));
};

/** Число с одним знаком после запятой, «,0» не пишется: 2.5 → "2,5", 10 → "10" */
const formatOneDecimal = (value: number): string =>
  Number.isInteger(value) ? groupThousands(String(value)) : value.toFixed(1).replace('.', ',');

/** Цена на связи: 180 → "₽180", 12300 → "₽12 300" (без копеек) */
export const formatPriceTag = (value: number): string => `₽${formatInt(value)}`;

/** Денежная сумма для подсказок и таблицы: 54000 → "54 000 ₽", 100.5 → "100,50 ₽" */
export const formatMoney = (value: number): string => {
  const v = finite(value);
  const cents = Math.round(Math.abs(v) * 100);
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  const sign = v < 0 && cents > 0 ? '−' : '';
  const text = groupThousands(String(whole)) + (fraction ? `,${String(fraction).padStart(2, '0')}` : '');
  return `${sign}${text} ₽`;
};

/**
 * Объём закупок под узлом поставщика: 100154 → "100 тыс.", 2503840 → "2,5 млн", 950 → "950 ₽".
 * Меньше 10 тыс. и меньше 100 млн — один знак после запятой, дальше целые.
 */
export const formatVolume = (value: number): string => {
  const v = Math.max(0, finite(value));
  if (v < 999.5) return `${formatInt(v)} ₽`;
  const thousands = v / 1e3;
  const t = thousands < 9.95 ? Math.round(thousands * 10) / 10 : Math.round(thousands);
  if (t < 1000) return `${formatOneDecimal(t)} тыс.`;
  const millions = v / 1e6;
  const m = millions < 99.95 ? Math.round(millions * 10) / 10 : Math.round(millions);
  if (m < 1000) return `${formatOneDecimal(m)} млн`;
  return `${formatOneDecimal(Math.round(v / 1e8) / 10)} млрд`;
};

/** Форма слова по числу: 1 единица, 2 единицы, 5 единиц */
export const pluralRu = (count: number, forms: readonly [string, string, string]): string => {
  const n = Math.abs(Math.trunc(count)) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
};

const UNIT_FORMS = ['единица', 'единицы', 'единиц'] as const;

/** Количество под якорным поставщиком: 1457 → "1457 единиц", 21 → "21 единица", 12.5 → "12,5 единицы" */
export const formatUnits = (qty: number): string => {
  const rounded = Math.round(finite(qty) * 100) / 100;
  if (!Number.isInteger(rounded)) return `${String(rounded).replace('.', ',')} ${UNIT_FORMS[1]}`;
  const digits = Math.abs(rounded) >= 10000 ? groupThousands(String(rounded)) : String(rounded);
  return `${digits} ${pluralRu(rounded, UNIT_FORMS)}`;
};

/** Количество с единицей измерения: (540, "шт") → "540 шт", (12.5, "кг") → "12,5 кг" */
export const formatQty = (qty: number, unit: string): string => {
  const rounded = Math.round(finite(qty) * 100) / 100;
  const text = Number.isInteger(rounded) ? groupThousands(String(rounded)) : String(rounded).replace('.', ',');
  return unit ? `${text} ${unit}` : text;
};

/** Превышение цены над ориентиром в процентах: (200, 160) → 25 */
export const overPercent = (price: number, refPrice: number): number =>
  refPrice > 0 ? (finite(price) / refPrice - 1) * 100 : 0;

/** 25 → "+25,0%", -37.5 → "−37,5%", 0 → "0%" */
export const formatSignedPercent = (percent: number): string => {
  const rounded = Math.round(finite(percent) * 10) / 10;
  if (rounded === 0) return '0%';
  const text = Math.abs(rounded).toFixed(1).replace('.', ',');
  return rounded > 0 ? `+${text}%` : `−${text}%`;
};

/** Значение ползунка настроек: как в Obsidian — «0.00», «10.00», «250» */
export const formatSliderValue = (value: number, decimals: number): string => value.toFixed(decimals);

/**
 * Перенос подписи узла на две строки, если она длиннее `maxLine` символов:
 * разрез по пробелу так, чтобы самая длинная строка была как можно короче.
 * «Фреза монолитная CMZ N4676» → ["Фреза монолитная", "CMZ N4676"].
 */
export const wrapLabel = (text: string, maxLine: number): string[] => {
  const trimmed = text.trim();
  if (trimmed.length <= maxLine) return [trimmed];
  const words = trimmed.split(/\s+/);
  if (words.length < 2) return [trimmed];
  let best: string[] = [trimmed];
  let bestLongest = Infinity;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(' ');
    const second = words.slice(i).join(' ');
    const longest = Math.max(first.length, second.length);
    if (longest < bestLongest) {
      bestLongest = longest;
      best = [first, second];
    }
  }
  return best;
};

/** Приблизительная ширина строки Inter в px — для «вписать граф» с учётом подписей */
export const estimateTextWidth = (text: string, fontSize: number, weight = 500): number =>
  text.length * fontSize * (weight >= 600 ? 0.58 : 0.55);
