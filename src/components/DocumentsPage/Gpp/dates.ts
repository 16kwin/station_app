// dates.ts — календарные даты ГПП как номера дней (сутки от 01.01.1970 по UTC): без часовых поясов и
// перехода на летнее время, сложение дней — обычное сложение чисел.

const DAY_MS = 86_400_000;

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
] as const;

export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const RU_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** Номер дня из 'YYYY-MM-DD'; null — пусто или не дата */
export const parseDay = (value: string | null | undefined): number | null => {
  const m = value ? ISO_DATE.exec(value) : null;
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(ms) ? Math.round(ms / DAY_MS) : null;
};

/** Номер дня из «ДД.ММ.ГГГГ» (так отдаёт выбор даты в календаре приложения) */
export const parseRuDay = (value: string | null | undefined): number | null => {
  const m = value ? RU_DATE.exec(value.trim()) : null;
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDate() === day ? Math.round(date.getTime() / DAY_MS) : null;
};

const parts = (day: number): { y: number; m: number; d: number; wd: number } => {
  const date = new Date(day * DAY_MS);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate(), wd: date.getUTCDay() };
};

const pad = (n: number): string => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' */
export const isoDay = (day: number): string => {
  const p = parts(day);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
};

/** «04.01.2027» */
export const ruDay = (day: number): string => {
  const p = parts(day);
  return `${pad(p.d)}.${pad(p.m + 1)}.${p.y}`;
};

/** «04.01» — подпись недели на шкале */
export const ruDayShort = (day: number): string => {
  const p = parts(day);
  return `${pad(p.d)}.${pad(p.m + 1)}`;
};

export const dayOfMonth = (day: number): number => parts(day).d;

/** Выходной (суббота или воскресенье) */
export const isWeekend = (day: number): boolean => {
  const wd = parts(day).wd;
  return wd === 0 || wd === 6;
};

/** Понедельник недели, в которую попадает день */
export const weekStart = (day: number): number => day - ((parts(day).wd + 6) % 7);

/** Сегодняшний день по местному календарю пользователя */
export const today = (): number => {
  const now = new Date();
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
};

/** Месяц как число «год × 12 + месяц» — удобно сравнивать и перебирать */
export const monthIndex = (day: number): number => {
  const p = parts(day);
  return p.y * 12 + p.m;
};

export const monthYear = (index: number): { year: number; month: number } => ({ year: Math.floor(index / 12), month: index % 12 });

/** Первый день месяца */
export const monthStart = (index: number): number => {
  const { year, month } = monthYear(index);
  return Math.round(Date.UTC(year, month, 1) / DAY_MS);
};

/** Последний день месяца */
export const monthEnd = (index: number): number => monthStart(index + 1) - 1;

/** «Январь 2027» */
export const monthLabel = (index: number): string => {
  const { year, month } = monthYear(index);
  return `${MONTHS[month]} ${year}`;
};

/** Период выборки словами: «январь — июль 2027» или «ноябрь 2026 — март 2027» */
export const periodLabel = (from: number, to: number): string => {
  const a = monthYear(monthIndex(from));
  const b = monthYear(monthIndex(to));
  const name = (m: number) => MONTHS[m].toLowerCase();
  if (a.year === b.year && a.month === b.month) return `${name(a.month)} ${a.year}`;
  if (a.year === b.year) return `${name(a.month)} — ${name(b.month)} ${b.year}`;
  return `${name(a.month)} ${a.year} — ${name(b.month)} ${b.year}`;
};

/** Число дней словами: «1 день», «3 дня», «30 дней» */
export const daysWord = (n: number): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n} дней`;
  if (last === 1) return `${n} день`;
  if (last >= 2 && last <= 4) return `${n} дня`;
  return `${n} дней`;
};

/** Дата и время сохранения: «13.10.2026 в 22:30» */
export const ruDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} в ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
