// chart.ts — математика линейных графиков панелей: сглаживание, шкала оси Y, подписи месяцев.
// Используется графиками «Затраты на приобретение» и «Расход объема производственной номенклатуры».
import { daysBetween, parseIso, toIso } from './format';

export interface XY {
  x: number;
  y: number;
}

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/* ---------- Сглаживание: монотонная кубическая интерполяция (как type="monotone" в recharts) ---------- */
const slope3 = (p0: XY, p1: XY, p2: XY): number => {
  const h0 = p1.x - p0.x;
  const h1 = p2.x - p1.x;
  const s0 = (p1.y - p0.y) / (h0 || (h1 < 0 ? -0 : 0));
  const s1 = (p2.y - p1.y) / (h1 || (h0 < 0 ? -0 : 0));
  const p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
};

const slope2 = (p0: XY, p1: XY, t: number): number => {
  const h = p1.x - p0.x;
  return h ? ((3 * (p1.y - p0.y)) / h - t) / 2 : t;
};

/** Путь линии через все точки кубическими Безье без «перелётов» ниже нуля */
export const monotonePath = (pts: XY[]): string => {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${round2(pts[0].x)} ${round2(pts[0].y)}`;
  if (n === 2) return `M${round2(pts[0].x)} ${round2(pts[0].y)} L${round2(pts[1].x)} ${round2(pts[1].y)}`;
  const tangents: number[] = new Array<number>(n);
  for (let i = 1; i < n - 1; i++) tangents[i] = slope3(pts[i - 1], pts[i], pts[i + 1]);
  tangents[0] = slope2(pts[0], pts[1], tangents[1]);
  tangents[n - 1] = slope2(pts[n - 2], pts[n - 1], tangents[n - 2]);
  let d = `M${round2(pts[0].x)} ${round2(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = (p1.x - p0.x) / 3;
    d += ` C${round2(p0.x + dx)} ${round2(p0.y + dx * tangents[i])} ${round2(p1.x - dx)} ${round2(p1.y - dx * tangents[i + 1])} ${round2(p1.x)} ${round2(p1.y)}`;
  }
  return d;
};

/** Замыкание линии на ось нуля для заливки */
export const closeArea = (line: string, pts: XY[], baselineY: number): string => {
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${line} L${round2(last.x)} ${baselineY} L${round2(first.x)} ${baselineY} Z`;
};

/** Индекс ближайшей по x точки (бинарный поиск по отсортированному массиву) */
export const nearestIndex = (points: readonly XY[] | readonly { x: number }[], mx: number): number => {
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x < mx) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].x - mx) <= Math.abs(points[lo].x - mx)) return lo - 1;
  return lo;
};

/**
 * Шаг шкалы: первый из `steps`, при котором делений не больше `maxIntervals`.
 * Если значение выходит за список, шаг округляется вверх до кратного последнему шагу.
 */
export const pickScale = (
  max: number,
  steps: readonly number[],
  maxIntervals: number,
): { step: number; intervals: number } => {
  const fallback = steps[steps.length - 1] ?? 1;
  if (!(max > 0)) return { step: steps[0] ?? 1, intervals: maxIntervals };
  for (const step of steps) {
    const intervals = Math.ceil(max / step);
    if (intervals <= maxIntervals) return { step, intervals: Math.max(1, intervals) };
  }
  const step = Math.ceil(max / maxIntervals / fallback) * fallback;
  return { step, intervals: Math.max(1, Math.ceil(max / step)) };
};

/** Даты подписей оси X: `from`, затем 1-е числа всех следующих месяцев в диапазоне */
export const buildMonthDates = (from: string, to: string): string[] => {
  const start = parseIso(from);
  const end = parseIso(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) return [];
  const dates = [toIso(start)];
  let cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(toIso(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return dates;
};

/** Количество дней в диапазоне, но не меньше нуля (защита от некорректных дат) */
export const rangeDays = (from: string, to: string): number => {
  const days = daysBetween(from, to);
  return Number.isFinite(days) && days > 0 ? days : 0;
};
