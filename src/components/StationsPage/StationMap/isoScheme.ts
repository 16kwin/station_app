// isoScheme.ts — автоматическая изометрическая схема цеха, когда план не загружен: пол со стенами,
// зоны участков пастельными «полами» с подписями на полу, разметка проходов и места станций в зонах.
// Схема строится по полному составу цеха (все участки и станции без фильтров страницы, не по числу станций),
// поэтому не «плывёт» от фильтров и сохранённые на ней позиции остаются на своих местах.
import type { PlanPoint } from './types';
import type { SectionNode } from './model';
import { ZONE_TONES } from './theme';

/* ---------- Проекция ---------- */

/** Пикселей плана на метр схемы */
const UNIT = 10;
/** Поворот цеха относительно зрителя и сжатие пола по глубине — вид «три четверти», как на макете */
const ANGLE = (16 * Math.PI) / 180;
const DEPTH = 0.6;
/** Сжатие высоты стен */
const RISE = 0.85;
const COS = Math.cos(ANGLE);
const SIN = Math.sin(ANGLE);

/* ---------- Размеры цеха, м ---------- */

const MARGIN = 3;
const ROW_DEPTH = 30;
const AISLE = 10;
const ZONE_GAP = 2;
const MIN_ZONE_WIDTH = 24;
const WALL_HEIGHT = 6;
const CURB_HEIGHT = 1.2;
const WALL_THICKNESS = 0.8;
/** Полоса под подписью у переднего края зоны */
const LABEL_BAND = 8;
/** Отступ мест от задней кромки зоны: маркер станции «стоит» и закрывает пол позади себя */
const BACK_BAND = 7.5;
/** Отступ плана от рисунка, px (тень здания рисуется и за ним) */
const PAD = 16;
/** Соотношение сторон под область карты (≈ 1284×558) */
const TARGET_RATIO = 2.3;

type Vec = [number, number];

interface FloorRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SchemeZone {
  key: string;
  sectionId: number | null;
  name: string;
  tone: (typeof ZONE_TONES)[number];
  /** Пол зоны — точки многоугольника для SVG */
  points: string;
  /** Рамка зоны на плане, px — для «показать участок» */
  bounds: { x: number; y: number; w: number; h: number };
  /** Подпись на полу: матрица плоскости пола и текст */
  label: { transform: string; fontSize: number; text: string };
}

export interface SchemeFace {
  points: string;
  fill: string;
}

export interface IsoScheme {
  width: number;
  height: number;
  floor: string;
  shadow: string;
  backWalls: SchemeFace[];
  frontWalls: SchemeFace[];
  zones: SchemeZone[];
  /** Осевые линии проходов между рядами зон */
  aisles: { x1: number; y1: number; x2: number; y2: number }[];
  /** Места станций без сохранённой позиции, доли плана */
  spots: Map<string, PlanPoint>;
}

/** Детерминированный «шум» 0..1 по ключу: ширины зон разные, но одинаковые при каждом построении */
const hash01 = (key: string): number => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

const r1 = (v: number): number => Math.round(v * 10) / 10;

/** Ряды зон: примерно квадратная сетка, вытянутая по ширине цеха */
const rowCounts = (n: number): number[] => {
  const rows = Math.min(4, Math.max(1, Math.round(Math.sqrt(n / 1.6))));
  const base = Math.floor(n / rows);
  const extra = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
};

/**
 * sections — участки цеха без фильтров страницы: по ним зоны, ряды и места станций.
 * shown — сколько станций участка видно с учётом фильтров (число в подписи зоны); без него — все станции участка.
 */
export const buildIsoScheme = (sections: readonly SectionNode[], shown?: ReadonlyMap<string, number>): IsoScheme => {
  const zonesIn = sections.length > 0 ? sections : [];
  const n = Math.max(1, zonesIn.length);
  const rows = rowCounts(n);
  const maxCols = Math.max(...rows);

  // Глубина — по рядам; ширина — под соотношение сторон области карты, но не уже минимальных зон
  const depth = 2 * MARGIN + rows.length * ROW_DEPTH + (rows.length - 1) * AISLE;
  const heightAdd = WALL_HEIGHT * RISE;
  const byRatio = (TARGET_RATIO * (depth * COS * DEPTH + heightAdd) - depth * SIN) / (COS - TARGET_RATIO * SIN * DEPTH);
  const byZones = 2 * MARGIN + maxCols * MIN_ZONE_WIDTH + (maxCols - 1) * ZONE_GAP;
  const width = Math.max(byRatio, byZones, 60);

  const project = (x: number, y: number, z = 0): Vec => [(x * COS - y * SIN) * UNIT, ((x * SIN + y * COS) * DEPTH - z * RISE) * UNIT];

  // Рамка рисунка: углы пола, верх задних стен и толщина стен
  const t = WALL_THICKNESS;
  const corners: Vec[] = [
    project(-t, -t, WALL_HEIGHT),
    project(width + t, -t, WALL_HEIGHT),
    project(-t, depth + t, WALL_HEIGHT),
    project(width + t, depth + t, 0),
    project(-t, depth + t, 0),
    project(width + t, -t, 0),
  ];
  const minX = Math.min(...corners.map(c => c[0])) - PAD;
  const minY = Math.min(...corners.map(c => c[1])) - PAD;
  const maxX = Math.max(...corners.map(c => c[0])) + PAD;
  const maxY = Math.max(...corners.map(c => c[1])) + PAD + 12;
  const planW = Math.ceil(maxX - minX);
  const planH = Math.ceil(maxY - minY);

  const at = (x: number, y: number, z = 0): Vec => {
    const [px, py] = project(x, y, z);
    return [px - minX, py - minY];
  };
  const poly = (pts: Vec[]): string => pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
  const quad = (a: Vec, b: Vec, c: Vec, d: Vec): string => poly([a, b, c, d]);

  // Пол и тень под зданием
  const floor = quad(at(0, 0), at(width, 0), at(width, depth), at(0, depth));
  const shadow = quad(at(-t - 1, -t - 1), at(width + t + 2, -t - 1), at(width + t + 2, depth + t + 2.5), at(-t - 1, depth + t + 2.5));

  // Задние стены (дальняя и левая): видна внутренняя грань и торец сверху
  const H = WALL_HEIGHT;
  const backWalls: SchemeFace[] = [
    { points: quad(at(0, 0), at(width, 0), at(width, 0, H), at(0, 0, H)), fill: '#E7ECF3' },
    { points: quad(at(-t, -t, H), at(width + t, -t, H), at(width, 0, H), at(0, 0, H)), fill: '#CCD5E2' },
    { points: quad(at(0, 0), at(0, depth), at(0, depth, H), at(0, 0, H)), fill: '#DCE3EC' },
    { points: quad(at(-t, -t, H), at(0, 0, H), at(0, depth, H), at(-t, depth + t, H)), fill: '#C6D0DE' },
  ];

  // Передние стены — низкий бортик, чтобы не закрывать пол: внешняя грань и верх
  const C = CURB_HEIGHT;
  const frontWalls: SchemeFace[] = [
    { points: quad(at(width + t, -t), at(width + t, depth + t), at(width + t, depth + t, C), at(width + t, -t, C)), fill: '#CBD3DF' },
    { points: quad(at(-t, depth + t), at(width + t, depth + t), at(width + t, depth + t, C), at(-t, depth + t, C)), fill: '#D9DFE8' },
    { points: quad(at(width, 0, C), at(width + t, -t, C), at(width + t, depth + t, C), at(width, depth, C)), fill: '#EEF1F6' },
    { points: quad(at(0, depth, C), at(width, depth, C), at(width + t, depth + t, C), at(-t, depth + t, C)), fill: '#F3F5F9' },
    // Опоры стен в левом ближнем углу
    { points: quad(at(-t, depth, 0), at(0, depth, 0), at(0, depth, H), at(-t, depth, H)), fill: '#D4DBE6' },
  ];

  // Зоны участков по рядам; ширины — по «шуму» ключа участка
  const zones: SchemeZone[] = [];
  const aisles: IsoScheme['aisles'] = [];
  const zoneRects: { section: SectionNode | null; rect: FloorRect }[] = [];
  let index = 0;
  rows.forEach((count, row) => {
    const y0 = MARGIN + row * (ROW_DEPTH + AISLE);
    const y1 = y0 + ROW_DEPTH;
    const rowSections = zonesIn.slice(index, index + count);
    const weights = rowSections.length > 0 ? rowSections.map(s => 1 + 0.45 * hash01(s.key)) : [1];
    const total = weights.reduce((a, b) => a + b, 0);
    const free = width - 2 * MARGIN - (weights.length - 1) * ZONE_GAP;
    let x = MARGIN;
    weights.forEach((w, i) => {
      const zoneWidth = (free * w) / total;
      zoneRects.push({ section: rowSections[i] ?? null, rect: { x0: x, y0, x1: x + zoneWidth, y1 } });
      x += zoneWidth + ZONE_GAP;
    });
    index += count;
    if (row < rows.length - 1) {
      const yc = y1 + AISLE / 2;
      const [x1, ya] = at(MARGIN, yc);
      const [x2, yb] = at(width - MARGIN, yc);
      aisles.push({ x1: r1(x1), y1: r1(ya), x2: r1(x2), y2: r1(yb) });
    }
  });

  const spots = new Map<string, PlanPoint>();
  zoneRects.forEach(({ section, rect }, i) => {
    const tone = ZONE_TONES[i % ZONE_TONES.length];
    const cornersPx = [at(rect.x0, rect.y0), at(rect.x1, rect.y0), at(rect.x1, rect.y1), at(rect.x0, rect.y1)];
    const xs = cornersPx.map(c => c[0]);
    const ys = cornersPx.map(c => c[1]);
    const bounds = {
      x: Math.min(...xs),
      y: Math.min(...ys) - 40,
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys) + 40,
    };

    // Подпись на полу у переднего края: текст лежит в плоскости пола
    const name = section ? section.name : 'Цех';
    const count = section ? (shown ? shown.get(section.key) ?? 0 : section.stations.length) : 0;
    const zoneWidth = rect.x1 - rect.x0;
    const fontSize = Math.max(2.2, Math.min(3.4, zoneWidth / 11));
    const maxChars = Math.max(4, Math.floor((zoneWidth - 3.5) / (fontSize * 0.68)));
    let text = `${name.toUpperCase()} · ${count}`;
    if (text.length > maxChars) {
      const upper = name.toUpperCase();
      text = upper.length > maxChars ? `${upper.slice(0, maxChars - 1).trimEnd()}…` : upper;
    }
    const [ox, oy] = at(rect.x0 + 1.6, rect.y1 - 1.6);
    const ex: Vec = [COS * UNIT, SIN * DEPTH * UNIT];
    const ey: Vec = [-SIN * UNIT, COS * DEPTH * UNIT];
    const transform = `matrix(${ex[0].toFixed(3)} ${ex[1].toFixed(3)} ${ey[0].toFixed(3)} ${ey[1].toFixed(3)} ${r1(ox)} ${r1(oy)})`;

    zones.push({
      key: section?.key ?? 'zone:all',
      sectionId: section?.id ?? null,
      name,
      tone,
      points: poly(cornersPx),
      bounds,
      label: { transform, fontSize: r1(fontSize), text },
    });

    // Места станций: сетка в зоне за полосой подписи, по порядку имён
    if (!section || section.stations.length === 0) return;
    const inner: FloorRect = { x0: rect.x0 + 3, y0: rect.y0 + BACK_BAND, x1: rect.x1 - 3, y1: rect.y1 - LABEL_BAND };
    const w = Math.max(1, inner.x1 - inner.x0);
    const d = Math.max(1, inner.y1 - inner.y0);
    const k = section.stations.length;
    const cols = Math.min(k, Math.max(1, Math.round(Math.sqrt((k * w) / d))));
    const rowsCount = Math.ceil(k / cols);
    section.stations.forEach((station, j) => {
      const col = j % cols;
      const r = Math.floor(j / cols);
      // Последний неполный ряд — по центру
      const inRow = r === rowsCount - 1 ? k - r * cols : cols;
      const x = inner.x0 + ((col + 0.5 + (cols - inRow) / 2) * w) / cols;
      const y = inner.y0 + ((r + 0.5) * d) / rowsCount;
      const [px, py] = at(x, y);
      spots.set(station.uid, { x: px / planW, y: py / planH });
    });
  });

  return { width: planW, height: planH, floor, shadow, backWalls, frontWalls, zones, aisles, spots };
};
