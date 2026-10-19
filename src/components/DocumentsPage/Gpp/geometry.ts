// geometry.ts — геометрия диаграммы Ганта без React: шкала периода, положения полос, маршруты пунктирных стрелок
// и линии начала/конца плана. Общая для экрана (GppGantt) и печатной версии (print.ts).
import type { GanttLink, GppRowDTO, ScaleMode } from './types';
import { monthEnd, monthIndex, monthStart, parseDay, weekStart } from './dates';
import { SCALE_PX } from './theme';

export interface Timeline {
  /** Первый и последний день периода выборки */
  from: number;
  to: number;
  /** Пикселей на день */
  ppd: number;
  width: number;
}

export const makeTimeline = (from: number, to: number, scale: ScaleMode, viewport: number): Timeline => {
  const days = Math.max(1, to - from + 1);
  const ppd = scale === 'months' ? Math.max(SCALE_PX.months, viewport / days) : SCALE_PX[scale];
  return { from, to, ppd, width: Math.round(days * ppd) };
};

export const dayX = (t: Timeline, day: number): number => (day - t.from) * t.ppd;

export interface Tick {
  key: string;
  x0: number;
  x1: number;
  /** Месяц (год × 12 + месяц) или номер дня начала */
  value: number;
}

export const monthTicks = (t: Timeline): Tick[] => {
  const out: Tick[] = [];
  for (let m = monthIndex(t.from); m <= monthIndex(t.to); m++) {
    const s = Math.max(monthStart(m), t.from);
    const e = Math.min(monthEnd(m), t.to);
    out.push({ key: `m${m}`, x0: dayX(t, s), x1: dayX(t, e + 1), value: m });
  }
  return out;
};

export const weekTicks = (t: Timeline): Tick[] => {
  const out: Tick[] = [];
  for (let w = weekStart(t.from); w <= t.to; w += 7) {
    const s = Math.max(w, t.from);
    const e = Math.min(w + 6, t.to);
    out.push({ key: `w${w}`, x0: dayX(t, s), x1: dayX(t, e + 1), value: s });
  }
  return out;
};

export const dayTicks = (t: Timeline): Tick[] => {
  const out: Tick[] = [];
  for (let d = t.from; d <= t.to; d++) out.push({ key: `d${d}`, x0: dayX(t, d), x1: dayX(t, d + 1), value: d });
  return out;
};

export interface BarGeom {
  x0: number;
  x1: number;
}

export type Geometry = ReadonlyMap<string, BarGeom>;

/** Полосы изделий и деталей: от начала первого дня до конца последнего */
export const barGeometry = (rows: readonly GppRowDTO[], t: Timeline): Map<string, BarGeom> => {
  const out = new Map<string, BarGeom>();
  rows.forEach(r => {
    if (r.kind === 'MATERIAL') return;
    const s = parseDay(r.start);
    const f = parseDay(r.finish);
    if (s === null || f === null) return;
    out.set(r.uid, { x0: dayX(t, s), x1: dayX(t, Math.max(f, s) + 1) });
  });
  return out;
};

/** Промежуточное положение полос при плавном пересчёте плана */
export const lerpGeometry = (a: Geometry, b: Geometry, k: number): Map<string, BarGeom> => {
  const out = new Map<string, BarGeom>();
  b.forEach((to, uid) => {
    const from = a.get(uid);
    out.set(uid, from ? { x0: from.x0 + (to.x0 - from.x0) * k, x1: from.x1 + (to.x1 - from.x1) * k } : to);
  });
  return out;
};

export interface RowMetrics {
  rowHeight: number;
  barHeight: number;
}

const barTop = (m: RowMetrics, i: number): number => i * m.rowHeight + (m.rowHeight - m.barHeight) / 2;
const barBottom = (m: RowMetrics, i: number): number => barTop(m, i) + m.barHeight;
const rowMiddle = (m: RowMetrics, i: number): number => i * m.rowHeight + m.rowHeight / 2;

export interface LinkPath {
  id: string;
  d: string;
  /** Острие стрелки и направление последнего отрезка */
  tip: { x: number; y: number };
  down: boolean;
  violated: boolean;
  link: GanttLink;
}

const r1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Маршрут стрелки. «drop» — вертикально к началу полосы-получателя (общий график), при сдвиге — уголком
 * над ней; «step» — «ступенькой»: от конца полосы вправо и вниз к началу следующей (последовательный).
 */
export const routeLink = (link: GanttLink, from: BarGeom, to: BarGeom, fromRow: number, toRow: number, m: RowMetrics): LinkPath | null => {
  if (fromRow === toRow) return null;
  const down = toRow > fromRow;
  // Край полосы-получателя, в который входит стрелка, и «полка» над ним для уголка
  const enterY = down ? barTop(m, toRow) : barBottom(m, toRow);
  const shelfY = down ? enterY - 9 : enterY + 9;
  const xb = to.x0 + 4;
  let points: [number, number][];

  if (link.style === 'step') {
    const xe = from.x1;
    const ym = rowMiddle(m, fromRow);
    const xt = to.x0 + 6;
    points = xt >= xe + 4 ? [[xe, ym], [xt, ym], [xt, enterY]] : [[xe, ym], [xe + 8, ym], [xe + 8, shelfY], [xt, shelfY], [xt, enterY]];
  } else {
    const leaveY = down ? barBottom(m, fromRow) : barTop(m, fromRow);
    if (link.anchor === 'start') {
      const xa = from.x0 + 4;
      points = Math.abs(xa - xb) < 2 ? [[xb, leaveY], [xb, enterY]] : [[xa, leaveY], [xa, shelfY], [xb, shelfY], [xb, enterY]];
    } else {
      const straight = xb >= from.x0 + 4 && xb <= from.x1 + 8;
      const xa = Math.max(from.x0 + 4, from.x1 - 4);
      points = straight ? [[xb, leaveY], [xb, enterY]] : [[xa, leaveY], [xa, shelfY], [xb, shelfY], [xb, enterY]];
    }
  }

  // Последний отрезок укорачивается под наконечник
  const [tx, ty] = points[points.length - 1];
  const last = points.length - 1;
  const trimmed = points.map(([x, y], i) => (i === last ? [x, down ? y - 5 : y + 5] : [x, y]));
  const d = trimmed.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`).join(' ');
  return { id: link.id, d, tip: { x: tx, y: ty }, down, violated: link.violated, link };
};

/** Наконечник стрелки — маленький треугольник */
export const arrowHead = (tip: { x: number; y: number }, down: boolean): string => {
  const s = down ? -1 : 1;
  return `M${r1(tip.x)} ${r1(tip.y)} L${r1(tip.x - 3.5)} ${r1(tip.y + 6 * s)} L${r1(tip.x + 3.5)} ${r1(tip.y + 6 * s)} Z`;
};

export interface PlanLine {
  key: string;
  x: number;
  y0: number;
  y1: number;
}

/**
 * Тонкие вертикальные линии начала и конца плана изделия: от полосы изделия до последней видимой полосы его деталей.
 * rowOf — номер видимой строки по uid; productOf — изделие строки.
 */
export const planLines = (
  geom: Geometry,
  rowOf: ReadonlyMap<string, number>,
  productOf: ReadonlyMap<string, string>,
  m: RowMetrics,
): PlanLine[] => {
  const groups = new Map<string, { x0: number; x1: number; top: number; bottom: number; count: number }>();
  geom.forEach((g, uid) => {
    const row = rowOf.get(uid);
    const product = productOf.get(uid);
    if (row === undefined || product === undefined) return;
    const known = groups.get(product);
    if (known) {
      known.x0 = Math.min(known.x0, g.x0);
      known.x1 = Math.max(known.x1, g.x1);
      known.top = Math.min(known.top, row);
      known.bottom = Math.max(known.bottom, row);
      known.count += 1;
    } else {
      groups.set(product, { x0: g.x0, x1: g.x1, top: row, bottom: row, count: 1 });
    }
  });
  const out: PlanLine[] = [];
  groups.forEach((g, product) => {
    if (g.count < 2) return;
    const y0 = barTop(m, g.top) - 2;
    const y1 = barBottom(m, g.bottom) + 6;
    out.push({ key: `${product}:s`, x: g.x0 - 3, y0, y1 }, { key: `${product}:f`, x: g.x1 + 3, y0, y1 });
  });
  return out;
};
