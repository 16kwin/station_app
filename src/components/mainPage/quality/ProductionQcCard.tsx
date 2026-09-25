// ProductionQcCard.tsx — карточка «Производство»: кольцо прохождения контроля качества
// с подписями-выносками. Кольцо формируется против часовой стрелки от отметки около часа:
// первым идёт зелёный сектор «Прошли КК», за ним «Не прошли КК» и «Ожидают КК».
// Между секторами остаётся зазор, концы секторов скруглены.
// Панели ролей задают место карточки (rect), палитру и текст сноски. На их местах подписи
// дополнительно уводятся с силуэта кольца и со сноски, а на узкой карточке кольцо становится меньше.
import React from 'react';
import type { ProductionQcCardProps } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT } from './layout';
import { formatCount, formatPercentInt } from '../shared/format';
import { useProgress } from '../shared/animation';
import { clamp } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';

/* ---------- Геометрия (локальные координаты карточки, px) ----------
 * Центр кольца — по центру ширины и на 147 выше низа карточки: для «домашних» 400×327 это (200, 180). */
const CENTER_BOTTOM_INSET = 147;
/** Радиус по центру линии кольца и её толщина */
const RING_R = 75;
const RING_STROKE = 22;
/** Точка касания выноски и точка её излома — на столько дальше внешнего края кольца */
const ANCHOR_OFFSET = 4;
const ELBOW_OFFSET = 18;
const SIDE = 24;
const SHELF_MIN_Y = 66;
/** Нижняя полка: h − 46 */
const SHELF_BOTTOM_INSET = 46;
const SHELF_MIN_GAP = 46;
/** Начало кольца — чуть правее 12 часов, дальше против часовой стрелки */
const START_DEG = 20;
/** Видимый зазор между секторами, градусов */
const GAP_DEG = 4;
const SWEEP_DURATION = ANIM.ring * 2;
const DEFAULT_FOOTNOTE = '*единицы продукции с производства';

/* ---------- Раскладка на местах панелей ролей ---------- */
/** Нижняя полка слева — над сноской: строка значения (полка + 25) кончается выше её верха (h − 31) */
const FITTED_LEFT_SHELF_BOTTOM_INSET = 58;
/** Горизонтальный зазор между текстом подписи и силуэтом кольца — в нём проходит выноска */
const TEXT_RING_GAP = 12;
/** Самая широкая подпись («Не прошли КК», 13px) — по ней считается, помещается ли кольцо */
const WIDEST_LABEL_W = 94;
/** Насколько по вертикали строка подписи может заходить в силуэт кольца у нижней левой полки */
const FIT_REACH = 65;
/** Кольцо не меньше этого внешнего радиуса — иначе число в центре не помещается */
const MIN_RING_OUTER = 52;
/** Верх кольца — не выше 53px от центра до заголовка */
const TITLE_CLEARANCE = 53;
/** Строка подписи занимает по вертикали [полка − 20, полка − 4], строка значения — [полка + 7, полка + 25] */
const LABEL_LINE_TOP = 20;
const LABEL_LINE_BOTTOM = 4;
const VALUE_LINE_TOP = 7;
const VALUE_LINE_BOTTOM = 25;
/** Выноска не касается скруглённых концов сектора ближе этого угла */
const LEADER_END_MARGIN = 3;
/** Излом выноски не подходит к тексту ближе этого расстояния */
const LEADER_TEXT_GAP = 4;
/** Верхняя и нижняя полки одной стороны — не ближе чем на половину SHELF_MIN_GAP от центра кольца */
const HALF_SHELF_GAP = SHELF_MIN_GAP / 2;
/** Штраф угловой «цены» за подпись не на своей стороне кольца */
const SIDE_SWITCH_COST = 10;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

interface RingGeometry {
  w: number;
  cx: number;
  cy: number;
  ringR: number;
  ringStroke: number;
  ringOuter: number;
  anchorR: number;
  elbowR: number;
  /** Насколько скруглённый конец линии выступает за конец дуги, в градусах */
  capDeg: number;
  /** Нижняя полка справа (и слева на прежней раскладке) */
  shelfMaxY: number;
  /** Нижняя полка слева — на местах ролей выше, над сноской */
  shelfMaxLeftY: number;
  /** Место панели ролей: подписи обходят кольцо и сноску, выноска идёт к ближайшей точке сектора */
  fitted: boolean;
}

const ringGeometry = (w: number, h: number, fitted: boolean): RingGeometry => {
  const cy = h - CENTER_BOTTOM_INSET;
  let ringOuter = RING_R + RING_STROKE / 2;
  if (fitted) {
    // Узкая карточка: кольцо уменьшается ровно настолько, чтобы самая широкая подпись
    // помещалась у нижней левой полки над сноской
    const room = Math.max(0, w / 2 - SIDE - WIDEST_LABEL_W - TEXT_RING_GAP);
    const fit = Math.floor(Math.sqrt(FIT_REACH * FIT_REACH + room * room));
    ringOuter = clamp(Math.min(ringOuter, fit, cy - TITLE_CLEARANCE), MIN_RING_OUTER, ringOuter);
  }
  const ringR = ringOuter - RING_STROKE / 2;
  const shelfMaxY = h - SHELF_BOTTOM_INSET;
  return {
    w,
    cx: w / 2,
    cy,
    ringR,
    ringStroke: RING_STROKE,
    ringOuter,
    anchorR: ringOuter + ANCHOR_OFFSET,
    elbowR: ringOuter + ELBOW_OFFSET,
    capDeg: ((RING_STROKE / 2) / ringR) * (180 / Math.PI),
    shelfMaxY,
    shelfMaxLeftY: fitted ? h - FITTED_LEFT_SHELF_BOTTOM_INSET : shelfMaxY,
    fitted,
  };
};

const shelfMaxFor = (g: RingGeometry, side: 'left' | 'right'): number => (side === 'left' ? g.shelfMaxLeftY : g.shelfMaxY);

/** Точка на окружности: угол в градусах от 12 часов по часовой стрелке */
const pointAt = (g: RingGeometry, r: number, deg: number): { x: number; y: number } => {
  const a = (deg * Math.PI) / 180;
  return { x: g.cx + r * Math.sin(a), y: g.cy - r * Math.cos(a) };
};

/** Дуга против часовой стрелки от `fromDeg` к `toDeg` (toDeg меньше fromDeg) */
const arcCounterClockwise = (g: RingGeometry, r: number, fromDeg: number, toDeg: number): string => {
  const span = fromDeg - toDeg;
  if (span <= 0.05) return '';
  const start = pointAt(g, r, fromDeg);
  const end = pointAt(g, r, toDeg);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
};

const safePercent = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

/** Примерная ширина строки Inter: по классам символов, в долях кегля (с небольшим запасом) */
const estimateTextWidth = (text: string, fontSize: number): number => {
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.28;
    else if (/[0-9]/.test(ch)) em += 0.64;
    else if (ch === '%') em += 0.88;
    else if (/[.,:;*]/.test(ch)) em += 0.32;
    else if (/[ШЩЖЮМWшщжюмw]/.test(ch)) em += 0.9;
    else if (ch !== ch.toLowerCase()) em += 0.72;
    else em += 0.6;
  }
  return em * fontSize;
};

interface SegmentSpec {
  key: string;
  label: string;
  color: string;
  percent: number;
  value: number;
}

interface Segment extends SegmentSpec {
  /** Границы дуги с учётом зазора, в градусах от 12 часов по часовой стрелке */
  pathFrom: number;
  pathTo: number;
  /** Сколько градусов от начала кольца нужно пройти, чтобы дойти до начала дуги */
  offset: number;
  midDeg: number;
  /** Угол точки касания выноски: середина сектора (или ближайшая к полке точка на местах ролей) */
  leaderDeg: number;
  /** Высота середины сектора на радиусе излома — «естественное» место полки */
  anchorY: number;
  side: 'left' | 'right';
  shelfY: number;
  labelW: number;
  valueW: number;
  /** Места ролей: участок дуги, откуда выноска идёт к угловой подписи (развёрнутые градусы) */
  leaderRange?: [number, number];
}

/** Угловые места подписей вокруг кольца: сверху/снизу, слева/справа */
type Slot = 'tl' | 'tr' | 'bl' | 'br';
const SLOTS: Slot[] = ['tl', 'tr', 'bl', 'br'];
/** Четверть кольца каждого места, градусы от 12 часов по часовой стрелке */
const SLOT_QUADRANT: Record<Slot, [number, number]> = { tr: [0, 90], br: [90, 180], bl: [-180, -90], tl: [-90, 0] };
/** Диагональ четверти — предпочтительная точка касания выноски */
const SLOT_DIAGONAL: Record<Slot, number> = { tr: 45, br: 135, bl: -135, tl: -45 };
const slotSide = (slot: Slot): 'left' | 'right' => (slot === 'tl' || slot === 'bl' ? 'left' : 'right');
const slotIsTop = (slot: Slot): boolean => slot === 'tl' || slot === 'tr';

/** Прежняя разводка подписей одной стороны по вертикали */
const spreadShelves = (segments: Segment[], g: RingGeometry): void => {
  for (const side of ['left', 'right'] as const) {
    const column = segments.filter(item => item.side === side).sort((a, b) => a.shelfY - b.shelfY);
    for (let i = 1; i < column.length; i++) {
      const gap = column[i].shelfY - column[i - 1].shelfY;
      if (gap < SHELF_MIN_GAP) column[i].shelfY = column[i - 1].shelfY + SHELF_MIN_GAP;
    }
    const overflow = column.length > 0 ? column[column.length - 1].shelfY - g.shelfMaxY : 0;
    if (overflow > 0) for (const item of column) item.shelfY = Math.max(SHELF_MIN_Y, item.shelfY - overflow);
  }
};

/** Край текста подписи, ближний к кольцу (по более широкой из строк подписи и значения) */
const textInnerX = (g: RingGeometry, segment: Segment): number => {
  const width = Math.max(segment.labelW, segment.valueW);
  return segment.side === 'right' ? g.w - SIDE - width : SIDE + width;
};

/**
 * Интервал высот полки, при которых строка подписи или строка значения подходит к силуэту кольца
 * ближе TEXT_RING_GAP (в этом зазоре идёт выноска). null — подпись проходит мимо кольца на любой высоте.
 */
const blockedBand = (g: RingGeometry, segment: Segment): [number, number] | null => {
  const reach = (textW: number): number => {
    const room = segment.side === 'right' ? g.w - SIDE - textW - TEXT_RING_GAP - g.cx : g.cx - SIDE - textW - TEXT_RING_GAP;
    if (room >= g.ringOuter) return 0;
    if (room <= 0) return g.ringOuter;
    return Math.sqrt(g.ringOuter * g.ringOuter - room * room);
  };
  const labelReach = reach(segment.labelW);
  const valueReach = reach(segment.valueW);
  let low = Infinity;
  let high = -Infinity;
  if (labelReach > 0) {
    low = Math.min(low, g.cy - labelReach + LABEL_LINE_BOTTOM);
    high = Math.max(high, g.cy + labelReach + LABEL_LINE_TOP);
  }
  if (valueReach > 0) {
    low = Math.min(low, g.cy - valueReach - VALUE_LINE_BOTTOM);
    high = Math.max(high, g.cy + valueReach - VALUE_LINE_TOP);
  }
  return low < high ? [low, high] : null;
};

const insideBand = (y: number, band: [number, number]): boolean => y > band[0] && y < band[1];

/** Разводка на местах панелей ролей: подписи вне силуэта кольца, слева — над сноской, с прежним шагом */
const fitShelves = (segments: Segment[], g: RingGeometry): void => {
  for (const side of ['left', 'right'] as const) {
    const column = segments.filter(item => item.side === side);
    const maxY = shelfMaxFor(g, side);

    // Из запретной полосы — к ближайшему допустимому краю: вверх, если середина сектора выше центра
    for (const item of column) {
      const band = blockedBand(g, item);
      if (band === null || !insideBand(item.shelfY, band)) continue;
      const canUp = band[0] >= SHELF_MIN_Y;
      const canDown = band[1] <= maxY;
      item.shelfY = (item.anchorY < g.cy && canUp) || !canDown ? band[0] : band[1];
    }

    // Соседние подписи — не ближе SHELF_MIN_GAP, сдвигая вниз и перескакивая запретную полосу
    column.sort((a, b) => a.shelfY - b.shelfY);
    for (let i = 1; i < column.length; i++) {
      if (column[i].shelfY - column[i - 1].shelfY >= SHELF_MIN_GAP) continue;
      column[i].shelfY = column[i - 1].shelfY + SHELF_MIN_GAP;
      const band = blockedBand(g, column[i]);
      if (band && insideBand(column[i].shelfY, band)) column[i].shelfY = band[1];
    }

    // Нижняя вылезла ниже допустимого — поднимаем столбец снизу вверх
    const last = column[column.length - 1];
    if (last && last.shelfY > maxY) {
      last.shelfY = maxY;
      for (let i = column.length - 2; i >= 0; i--) {
        if (column[i + 1].shelfY - column[i].shelfY >= SHELF_MIN_GAP) continue;
        column[i].shelfY = column[i + 1].shelfY - SHELF_MIN_GAP;
        const band = blockedBand(g, column[i]);
        if (band && insideBand(column[i].shelfY, band)) column[i].shelfY = band[0];
      }
    }
    for (const item of column) item.shelfY = clamp(item.shelfY, SHELF_MIN_Y, maxY);
  }
};

/** Дуга сектора в развёрнутых градусах с отступом от скруглённых концов */
const leaderArc = (segment: Segment): [number, number] => {
  const margin = Math.min(LEADER_END_MARGIN, (segment.pathFrom - segment.pathTo) / 2);
  return [segment.pathTo + margin, segment.pathFrom - margin];
};

/** Представление угла `deg`, ближайшее к `near` (с точностью до оборота) */
const unwrapNear = (deg: number, near: number): number => deg + 360 * Math.round((near - deg) / 360);

/** Пересечение дуги сектора с диапазоном углов из −180..180 (с учётом оборотов); null — не пересекаются */
const arcOverlap = (segment: Segment, range: [number, number]): [number, number] | null => {
  const [low, high] = leaderArc(segment);
  let best: [number, number] | null = null;
  for (let turn = -2; turn <= 1; turn++) {
    const a = Math.max(low, range[0] + 360 * turn);
    const b = Math.min(high, range[1] + 360 * turn);
    if (a <= b && (best === null || b - a > best[1] - best[0])) best = [a, b];
  }
  return best;
};

/**
 * Участок четверти места, из которого выноска доходит до полки, не пересекая текст:
 * точка касания лежит ближе к центру, чем ближний край текста (с зазором LEADER_TEXT_GAP).
 * К верхней полке выноска подходит снизу — мешает строка значения под полкой;
 * к нижней — сверху, мешает строка подписи над полкой.
 */
const cleanQuadrant = (g: RingGeometry, segment: Segment, slot: Slot): [number, number] => {
  const width = slotIsTop(slot) ? segment.valueW : segment.labelW;
  const edge = slotSide(slot) === 'right' ? g.w - SIDE - width : SIDE + width;
  const share = clamp((Math.abs(edge - g.cx) - LEADER_TEXT_GAP) / g.anchorR, 0, 1);
  const reach = (Math.asin(share) * 180) / Math.PI;
  switch (slot) {
    case 'tr':
      return [0, reach];
    case 'br':
      return [180 - reach, 180];
    case 'bl':
      return [-180, -180 + reach];
    default:
      return [-reach, 0];
  }
};

interface SlotOption {
  slot: Slot;
  range: [number, number];
  cost: number;
}

/** Места, до которых дотягивается выноска сектора: strict — не пересекая текст, иначе — хотя бы из своей четверти */
const slotOptions = (g: RingGeometry, segment: Segment, strict: boolean): SlotOption[] =>
  SLOTS.flatMap(slot => {
    const range = arcOverlap(segment, strict ? cleanQuadrant(g, segment, slot) : SLOT_QUADRANT[slot]);
    if (range === null) return [];
    const mid = segment.midDeg;
    const distance = mid < range[0] ? range[0] - mid : mid > range[1] ? mid - range[1] : 0;
    const naturalSide = pointAt(g, g.elbowR, mid).x >= g.cx ? 'right' : 'left';
    return [{ slot, range, cost: distance + (slotSide(slot) === naturalSide ? 0 : SIDE_SWITCH_COST) }];
  });

/**
 * Угловая раскладка мест ролей (как на макетах 1.png и 6.png): каждой подписи — свой угол вокруг кольца,
 * выбор по наименьшей угловой «цене». false — разложить так нельзя (тогда работает fitShelves).
 */
const assignCorners = (segments: Segment[], g: RingGeometry): boolean => {
  for (const strict of [true, false]) {
    const options = segments.map(segment => slotOptions(g, segment, strict));
    const found: { cost: number; picks: SlotOption[] }[] = [];
    const walk = (index: number, picks: SlotOption[], cost: number) => {
      if (index === segments.length) {
        found.push({ cost, picks: [...picks] });
        return;
      }
      for (const option of options[index]) {
        if (picks.some(pick => pick.slot === option.slot)) continue;
        picks.push(option);
        walk(index + 1, picks, cost + option.cost);
        picks.pop();
      }
    };
    walk(0, [], 0);
    if (found.length === 0) continue;
    const best = found.reduce((a, b) => (b.cost < a.cost ? b : a));

    best.picks.forEach((pick, index) => {
      const segment = segments[index];
      const side = slotSide(pick.slot);
      segment.side = side;
      segment.leaderRange = pick.range;
      // Полка — на высоте излома в точке, ближайшей к диагонали четверти, но вне силуэта кольца
      const rangeMid = (pick.range[0] + pick.range[1]) / 2;
      const corner = clamp(unwrapNear(SLOT_DIAGONAL[pick.slot], rangeMid), pick.range[0], pick.range[1]);
      const naturalY = g.cy - g.elbowR * Math.cos((corner * Math.PI) / 180);
      const band = blockedBand(g, segment);
      const maxY = shelfMaxFor(g, side);
      if (slotIsTop(pick.slot)) {
        const topMax = Math.max(SHELF_MIN_Y, Math.min(band ? band[0] : Infinity, g.cy - HALF_SHELF_GAP));
        segment.shelfY = clamp(naturalY, SHELF_MIN_Y, topMax);
      } else {
        const bottomMin = Math.min(maxY, Math.max(band ? band[1] : -Infinity, g.cy + HALF_SHELF_GAP));
        segment.shelfY = clamp(naturalY, bottomMin, maxY);
      }
    });
    return true;
  }
  return false;
};

/** Угол касания выноски на местах ролей: точка сектора, чей излом лежит на высоте полки */
const fittedLeaderDeg = (g: RingGeometry, segment: Segment): number => {
  const cos = clamp((g.cy - segment.shelfY) / g.elbowR, -1, 1);
  const base = (Math.acos(cos) * 180) / Math.PI; // 0..180 — правая половина
  const target = segment.side === 'right' ? base : -base;
  // Ближайшее к участку дуги представление угла; ограничиваем этим участком
  const [low, high] = segment.leaderRange ?? leaderArc(segment);
  return clamp(unwrapNear(target, (low + high) / 2), low, high);
};

/**
 * Выноска на местах ролей: от кольца к излому и к началу полки, не заходя под текст подписи —
 * излом и начало полки остаются между кольцом и ближним к нему краем текста.
 */
const fittedLeaderPath = (g: RingGeometry, segment: Segment): string => {
  const right = segment.side === 'right';
  const anchor = pointAt(g, g.anchorR, segment.leaderDeg);
  const elbow = pointAt(g, g.elbowR, segment.leaderDeg);
  const textEdge = textInnerX(g, segment);
  const elbowX = right
    ? Math.max(anchor.x, Math.min(elbow.x, textEdge - LEADER_TEXT_GAP))
    : Math.min(anchor.x, Math.max(elbow.x, textEdge + LEADER_TEXT_GAP));
  const dy = Math.abs(segment.shelfY - g.cy);
  const halfWidth = dy < g.ringOuter ? Math.sqrt(g.ringOuter * g.ringOuter - dy * dy) : 0;
  const shelfStart = right
    ? Math.max(g.cx + halfWidth + 6, Math.min(elbowX + 6, textEdge - 2))
    : Math.min(g.cx - halfWidth - 6, Math.max(elbowX - 6, textEdge + 2));
  const outer = right ? g.w - SIDE : SIDE;
  return [
    `M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`,
    `L ${elbowX.toFixed(1)} ${elbow.y.toFixed(1)}`,
    `L ${shelfStart.toFixed(1)} ${segment.shelfY.toFixed(1)}`,
    `L ${outer} ${segment.shelfY.toFixed(1)}`,
  ].join(' ');
};

/**
 * Секторы идут против часовой стрелки от START_DEG. Каждая дуга укорачивается так, чтобы
 * после скруглённых концов между соседями оставался зазор GAP_DEG.
 */
const buildSegments = (specs: SegmentSpec[], g: RingGeometry): Segment[] => {
  let cursor = START_DEG;
  const segments: Segment[] = [];

  for (const spec of specs) {
    const size = (spec.percent / 100) * 360;
    if (size <= 0) continue;
    const segStart = cursor;
    const segEnd = cursor - size;
    cursor = segEnd;

    // Длина самой дуги: скруглённые концы добавят по capDeg с каждой стороны
    const arcLength = Math.max(0.2, size - GAP_DEG - 2 * g.capDeg);
    const trim = (size - arcLength) / 2;
    const midDeg = (segStart + segEnd) / 2;
    const anchor = pointAt(g, g.elbowR, midDeg);
    const side = anchor.x >= g.cx ? 'right' : 'left';

    segments.push({
      ...spec,
      pathFrom: segStart - trim,
      pathTo: segEnd + trim,
      offset: START_DEG - segStart + trim,
      midDeg,
      leaderDeg: midDeg,
      anchorY: anchor.y,
      side,
      shelfY: clamp(anchor.y, SHELF_MIN_Y, shelfMaxFor(g, side)),
      labelW: g.fitted ? estimateTextWidth(spec.label, 13) : 0,
      valueW: g.fitted ? estimateTextWidth(`${formatCount(spec.value)} ${formatPercentInt(spec.percent)}`, 14) : 0,
    });
  }

  if (g.fitted) {
    if (!assignCorners(segments, g)) fitShelves(segments, g);
    for (const segment of segments) segment.leaderDeg = fittedLeaderDeg(g, segment);
  } else {
    // Подписи одной стороны разводим по вертикали
    spreadShelves(segments, g);
  }

  return segments;
};

/** Горизонтальная полка выноски начинается за силуэтом кольца на своей высоте */
const shelfInnerX = (g: RingGeometry, segment: Segment): number => {
  const dy = Math.abs(segment.shelfY - g.cy);
  const halfWidth = dy < g.ringOuter ? Math.sqrt(g.ringOuter * g.ringOuter - dy * dy) : 0;
  const elbow = pointAt(g, g.elbowR, segment.leaderDeg);
  return segment.side === 'right'
    ? Math.max(g.cx + halfWidth + 10, elbow.x + 6)
    : Math.min(g.cx - halfWidth - 10, elbow.x - 6);
};

/** Путь выноски: от кольца к излому, затем горизонтальная полка под подписью */
const leaderPath = (g: RingGeometry, segment: Segment): string => {
  if (g.fitted) return fittedLeaderPath(g, segment);
  const anchor = pointAt(g, g.anchorR, segment.leaderDeg);
  const elbow = pointAt(g, g.elbowR, segment.leaderDeg);
  const inner = shelfInnerX(g, segment);
  const outer = segment.side === 'right' ? g.w - SIDE : SIDE;
  return [
    `M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`,
    `L ${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)}`,
    `L ${inner.toFixed(1)} ${segment.shelfY.toFixed(1)}`,
    `L ${outer} ${segment.shelfY.toFixed(1)}`,
  ].join(' ');
};

const ProductionQcCard: React.FC<ProductionQcCardProps> = ({ qc, animationKey, rect, palette, footnote = DEFAULT_FOOTNOTE }) => {
  const progress = useProgress(animationKey, SWEEP_DURATION);

  // Без rect — прежнее место и раскладка «Показателей»; с rect — раскладка панелей ролей
  const cardRect = rect ?? CARD_RECTS.qc;
  const g = ringGeometry(cardRect.w, cardRect.h, rect !== undefined);

  // Порядок против часовой стрелки: зелёный, розовый, серый — как на макете
  const segments = buildSegments(
    [
      { key: 'passed', label: 'Прошли КК', color: palette?.passed ?? COLORS.green, percent: safePercent(qc.passedPercent), value: qc.passed },
      { key: 'failed', label: 'Не прошли КК', color: palette?.failed ?? COLORS.pink, percent: safePercent(qc.failedPercent), value: qc.failed },
      { key: 'waiting', label: 'Ожидают КК', color: palette?.waiting ?? COLORS.neutral, percent: safePercent(qc.waitingPercent), value: qc.waiting },
    ],
    g,
  );

  // Пройденная часть кольца, градусов от начала против часовой стрелки
  const drawnDeg = 360 * progress;

  return (
    <DashboardCard rect={cardRect} title="Производство">
      <svg
        width={cardRect.w}
        height={cardRect.h}
        viewBox={`0 0 ${cardRect.w} ${cardRect.h}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        {/* Секторы */}
        {segments.map(segment => {
          const full = segment.pathFrom - segment.pathTo;
          const drawn = clamp(drawnDeg - segment.offset, 0, full);
          const path = arcCounterClockwise(g, g.ringR, segment.pathFrom, segment.pathFrom - drawn);
          if (!path) return null;
          return (
            <path key={segment.key} d={path} fill="none" stroke={segment.color} strokeWidth={g.ringStroke} strokeLinecap="round" />
          );
        })}

        {/* Выноски и подписи */}
        {segments.map(segment => {
          const outer = segment.side === 'right' ? cardRect.w - SIDE : SIDE;
          const anchorSide = segment.side === 'right' ? 'end' : 'start';
          const value = formatCount(segment.value);
          const percent = formatPercentInt(segment.percent);

          return (
            <g key={`leader-${segment.key}`} opacity={clamp(progress * 1.8 - 0.8, 0, 1)}>
              <path d={leaderPath(g, segment)} fill="none" stroke={segment.color} strokeWidth={1.5} strokeLinejoin="round" />
              <text
                x={outer}
                y={segment.shelfY - 12}
                textAnchor={anchorSide}
                dominantBaseline="central"
                fontSize={13}
                fontWeight={500}
                fill={COLORS.text}
                style={TEXT_STYLE}
              >
                {segment.label}
              </text>
              <text x={outer} y={segment.shelfY + 16} textAnchor={anchorSide} dominantBaseline="central" fontSize={14} style={TEXT_STYLE}>
                {/* Значение ближе к краю карточки, доля — ближе к кольцу */}
                {segment.side === 'right' ? (
                  <>
                    <tspan fontWeight={500} fill={COLORS.textMuted}>
                      {percent}
                    </tspan>
                    <tspan fontWeight={600} fill={COLORS.valueText}>
                      {`  ${value}`}
                    </tspan>
                  </>
                ) : (
                  <>
                    <tspan fontWeight={600} fill={COLORS.valueText}>
                      {value}
                    </tspan>
                    <tspan fontWeight={500} fill={COLORS.textMuted}>
                      {`  ${percent}`}
                    </tspan>
                  </>
                )}
              </text>
            </g>
          );
        })}

        {/* Всего выпуск с производства */}
        <text x={g.cx} y={g.cy} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={700} fill={COLORS.text} style={TEXT_STYLE}>
          {`${formatCount(qc.total * progress)}*`}
        </text>
      </svg>

      {/* Сноска к числу в центре */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 16,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '15px',
          color: COLORS.textMuted,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {footnote}
      </div>
    </DashboardCard>
  );
};

export default ProductionQcCard;
