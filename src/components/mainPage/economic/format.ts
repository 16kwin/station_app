// format.ts — форматирование чисел и дат в стиле макета панели

/** 872400 → "872.400" (целые рубли, разделитель тысяч — точка, как в карточке «Затраты по видам номенклатуры») */
export const formatRubDots = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** 2859579 → "2 859 579" (разделитель тысяч — пробел, как в «Показатели затрат») */
export const formatRubSpaces = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** 1400000 → "1,4 млн.руб." (один знак после запятой) */
export const formatMillions = (value: number): string => {
  const mln = value / 1_000_000;
  return `${mln.toFixed(1).replace('.', ',')} млн.руб.`;
};

/** Подпись оси Y: 9 → "9 млн.руб.", 0.5 → "0,5 млн.руб.", 0 → "0" */
export const formatAxisMillions = (mln: number): string => {
  if (mln === 0) return '0';
  const text = Number.isInteger(mln) ? String(mln) : mln.toFixed(1).replace('.', ',');
  return `${text} млн.руб.`;
};

/** 125.27 → "+125%", 87.2 → "87%" */
export const formatBudgetPercent = (percent: number): string => {
  const rounded = Math.round(percent);
  return rounded > 100 ? `+${rounded}%` : `${rounded}%`;
};

/** 'YYYY-MM-DD' → 'DD.MM.YYYY' */
export const isoToRu = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

/** 'DD.MM.YYYY' → 'YYYY-MM-DD' */
export const ruToIso = (ru: string): string => {
  const [d, m, y] = ru.split('.');
  return `${y}-${m}-${d}`;
};

/** Подписи месяцев на оси X, как на макете: Янв'25, Фев'25, Март'25 … */
export const MONTHS_SHORT = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Нояб', 'Дек'] as const;

/** '2025-08-01' → "Авг'25" */
export const formatMonthLabel = (iso: string): string => {
  const [y, m] = iso.split('-');
  return `${MONTHS_SHORT[Number(m) - 1]}'${y.slice(2)}`;
};

/** Разбор ISO-даты без сдвига часового пояса */
export const parseIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Количество дней между двумя ISO-датами (to - from) */
export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((parseIso(toIso).getTime() - parseIso(fromIso).getTime()) / 86_400_000);
