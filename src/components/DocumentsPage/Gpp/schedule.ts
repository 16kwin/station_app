// schedule.ts — расчёт плана ГПП (чистые функции, без React).
// «Общий по предприятию»: детали начинаются от даты старта изделия и ждут предшественников (окончание → начало),
// полоса изделия — сводная от начала до окончания деталей. «Последовательный»: собственная операция изделия (000),
// затем детали цепочкой в порядке дерева. Дата окончания — последний день этапа включительно.
import type { BarEditMode, GanttLink, GppRowDTO, GppType } from './types';
import { isoDay, monthEnd, monthStart, parseDay } from './dates';
import { buildIndex, descendants } from './tree';
import type { TreeIndex } from './tree';

export const MAX_DURATION = 3650;

/** Пределы сервера (GppService): количество — NUMERIC(15,3), даты графика и периода — 1900–2100 годы */
export const MAX_QUANTITY = 999_999_999_999.999;
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
/** Первый и последний допустимый день графика */
export const MIN_DAY = monthStart(MIN_YEAR * 12);
export const MAX_DAY = monthEnd(MAX_YEAR * 12 + 11);

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export const hasBar = (row: GppRowDTO): boolean => row.kind !== 'MATERIAL';

/** Длительность этапа: из поля, иначе из дат, иначе 1 день */
export const durationOf = (row: GppRowDTO): number => {
  if (row.durationDays !== null && Number.isFinite(row.durationDays)) return clamp(Math.round(row.durationDays), 1, MAX_DURATION);
  const s = parseDay(row.start);
  const f = parseDay(row.finish);
  return s !== null && f !== null ? clamp(f - s + 1, 1, MAX_DURATION) : 1;
};

/** Длина полосы в днях — как она нарисована (у сводной полосы изделия может отличаться от его длительности) */
export const barLength = (row: GppRowDTO): number => {
  const s = parseDay(row.start);
  const f = parseDay(row.finish);
  return s !== null && f !== null && f >= s ? f - s + 1 : durationOf(row);
};

/** Детали изделия в порядке дерева (прямой обход) */
export const partsOf = (index: TreeIndex, productUid: string): GppRowDTO[] =>
  descendants(index, productUid)
    .map(u => index.byUid.get(u)!)
    .filter(r => r.kind === 'PART');

/** Учитываемые предшественники детали: другие детали того же изделия */
export const validDeps = (index: TreeIndex, part: GppRowDTO): string[] =>
  part.dependsOn.filter(
    d => d !== part.uid && index.byUid.get(d)?.kind === 'PART' && index.productOf.get(d) === index.productOf.get(part.uid),
  );

/**
 * Зависимости в том виде, в каком их понимает экран: у детали — только детали того же изделия (без повторов),
 * у изделия и материала — нет. Остальные (например, записанные в обход экрана) не видны, не влияют на даты
 * и не снимаются в окне «Этап» — при записи они отбрасываются, чтобы не храниться молча.
 */
export const visibleDeps = (rows: readonly GppRowDTO[]): GppRowDTO[] => {
  const index = buildIndex(rows);
  return rows.map(r => {
    const deps = r.kind === 'PART' ? [...new Set(validDeps(index, r))] : [];
    return deps.length === r.dependsOn.length && deps.every((d, i) => d === r.dependsOn[i]) ? r : { ...r, dependsOn: deps };
  });
};

/** Детали, которые прямо или через цепочку ждут указанную — их нельзя делать её предшественниками (будет петля) */
export const dependentsOf = (index: TreeIndex, uid: string): Set<string> => {
  const product = index.productOf.get(uid);
  const parts = product ? partsOf(index, product) : [];
  const out = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    parts.forEach(p => {
      if (out.has(p.uid) || p.uid === uid) return;
      if (validDeps(index, p).some(d => d === uid || out.has(d))) {
        out.add(p.uid);
        grew = true;
      }
    });
  }
  return out;
};

interface Span {
  start: number;
  finish: number;
}

/** Даты всех изделий и деталей по типу графика. Строки без изменений возвращаются теми же объектами */
export const computePlan = (rows: readonly GppRowDTO[], type: GppType, fallbackStart: number): GppRowDTO[] => {
  const index = buildIndex(rows);
  const spans = new Map<string, Span>();

  (index.children.get(null) ?? [])
    .filter(r => r.kind === 'PRODUCT')
    .forEach(product => {
      const root = parseDay(product.start) ?? fallbackStart;
      const own = durationOf(product);
      const parts = partsOf(index, product.uid);

      if (type === 'SEQUENTIAL') {
        spans.set(product.uid, { start: root, finish: root + own - 1 });
        let cursor = root + own;
        parts.forEach(p => {
          const d = durationOf(p);
          spans.set(p.uid, { start: cursor, finish: cursor + d - 1 });
          cursor += d;
        });
        return;
      }

      // Общий: самое раннее начало с учётом предшественников; ребро, замыкающее петлю, не учитывается
      const visiting = new Set<string>();
      const calc = (part: GppRowDTO): Span | null => {
        const known = spans.get(part.uid);
        if (known) return known;
        if (visiting.has(part.uid)) return null;
        visiting.add(part.uid);
        let start = root;
        validDeps(index, part).forEach(d => {
          const dep = calc(index.byUid.get(d)!);
          if (dep) start = Math.max(start, dep.finish + 1);
        });
        visiting.delete(part.uid);
        const span = { start, finish: start + durationOf(part) - 1 };
        spans.set(part.uid, span);
        return span;
      };
      parts.forEach(calc);
      const finish = parts.length > 0 ? Math.max(...parts.map(p => spans.get(p.uid)!.finish)) : root + own - 1;
      spans.set(product.uid, { start: root, finish });
    });

  return rows.map(r => {
    if (r.kind === 'MATERIAL') {
      return r.start === null && r.finish === null && r.durationDays === null && r.dependsOn.length === 0
        ? r
        : { ...r, start: null, finish: null, durationDays: null, dependsOn: [] };
    }
    const span = spans.get(r.uid);
    if (!span) return r;
    const start = isoDay(span.start);
    const finish = isoDay(span.finish);
    // У изделия длительность — его собственная операция; у детали — длина этапа
    const durationDays = r.kind === 'PRODUCT' ? durationOf(r) : span.finish - span.start + 1;
    return r.start === start && r.finish === finish && r.durationDays === durationDays ? r : { ...r, start, finish, durationDays };
  });
};

/** Связи для стрелок и проверка их соблюдения */
export const buildLinks = (rows: readonly GppRowDTO[], type: GppType): GanttLink[] => {
  const index = buildIndex(rows);
  const links: GanttLink[] = [];
  const startOf = (r: GppRowDTO) => parseDay(r.start);
  const finishOf = (r: GppRowDTO) => parseDay(r.finish);
  // Последующий этап должен начаться не раньше следующего дня после окончания предшественника
  const late = (from: GppRowDTO, to: GppRowDTO, anchor: 'start' | 'finish'): boolean => {
    const s = startOf(to);
    const a = anchor === 'start' ? startOf(from) : finishOf(from);
    if (s === null || a === null) return false;
    return anchor === 'start' ? s < a : s <= a;
  };

  (index.children.get(null) ?? [])
    .filter(r => r.kind === 'PRODUCT')
    .forEach(product => {
      const parts = partsOf(index, product.uid);
      if (type === 'SEQUENTIAL') {
        const chain = [product, ...parts];
        for (let i = 1; i < chain.length; i++) {
          const from = chain[i - 1];
          const to = chain[i];
          links.push({ id: `s:${from.uid}:${to.uid}`, from: from.uid, to: to.uid, style: 'step', anchor: 'finish', violated: late(from, to, 'finish') });
        }
        return;
      }
      parts.forEach(part => {
        const deps = validDeps(index, part);
        if (deps.length === 0) {
          links.push({ id: `g:${product.uid}:${part.uid}`, from: product.uid, to: part.uid, style: 'drop', anchor: 'start', violated: late(product, part, 'start') });
          return;
        }
        deps.forEach(d => {
          const dep = index.byUid.get(d)!;
          links.push({ id: `d:${d}:${part.uid}`, from: d, to: part.uid, style: 'drop', anchor: 'finish', violated: late(dep, part, 'finish') });
        });
      });
    });
  return links;
};

export interface PlanOptions {
  autoCalc: boolean;
  type: GppType;
  /** Дата старта для изделия без даты — начало периода выборки */
  fallbackStart: number;
}

/** Можно ли тащить полосу целиком: с автоРасчётом — только изделие (сдвигается весь его план) */
export const canMoveBar = (row: GppRowDTO, autoCalc: boolean): boolean => hasBar(row) && (!autoCalc || row.kind === 'PRODUCT');

/**
 * Можно ли тянуть правый край. У изделия в общем графике полоса сводная (по деталям), а его длительность — собственная
 * операция 000: край сводной полосы не тянется ни с автоРасчётом, ни без, длительность 000 меняется в окне «Этап»
 */
export const canResizeBar = (row: GppRowDTO, type: GppType): boolean =>
  hasBar(row) && (row.kind === 'PART' || type === 'SEQUENTIAL');

/**
 * Длина, от которой считается растягивание: у изделия — всегда его операция 000 (в ручном режиме после смены типа
 * графика на месте полосы изделия может остаться сводная), у детали без автоРасчёта — полоса как нарисована
 */
const resizeBase = (row: GppRowDTO, autoCalc: boolean): number => (autoCalc || row.kind === 'PRODUCT' ? durationOf(row) : barLength(row));

/**
 * Пределы сдвига при перетаскивании, в днях: полоса не уходит за период выборки — за его краями её не видно
 * и не достать. Полоса, которая уже выходит за край, дальше в ту сторону не двигается; полоса шире периода
 * двигается, пока закрывает его целиком. С автоРасчётом изделие тянет за собой весь план — считается весь план.
 */
export const dragLimits = (
  rows: readonly GppRowDTO[],
  uid: string,
  mode: BarEditMode,
  options: PlanOptions,
  period: { from: number; to: number },
): { min: number; max: number } => {
  const row = rows.find(r => r.uid === uid);
  if (!row || !hasBar(row)) return { min: 0, max: 0 };
  const start = parseDay(row.start) ?? options.fallbackStart;

  if (mode === 'resize') {
    // Двигается только правый край; короче 1 дня полоса не станет (это ограничивает applyBarEdit)
    const finish = start + resizeBase(row, options.autoCalc) - 1;
    return { min: Math.min(0, period.from - finish), max: Math.max(0, period.to - finish) };
  }

  let from = start;
  let to = start + barLength(row) - 1;
  if (options.autoCalc && row.kind === 'PRODUCT') {
    const index = buildIndex(rows);
    descendants(index, uid).forEach(u => {
      const r = index.byUid.get(u)!;
      const s = parseDay(r.start);
      const f = parseDay(r.finish);
      if (r.kind === 'MATERIAL' || s === null || f === null) return;
      from = Math.min(from, s);
      to = Math.max(to, f);
    });
  }
  if (to - from <= period.to - period.from) return { min: Math.min(0, period.from - from), max: Math.max(0, period.to - to) };
  return { min: Math.min(0, period.to - to), max: Math.max(0, period.from - from) };
};

/** Результат перетаскивания полосы на deltaDays дней */
export const applyBarEdit = (
  rows: readonly GppRowDTO[],
  uid: string,
  mode: BarEditMode,
  deltaDays: number,
  options: PlanOptions,
): GppRowDTO[] => {
  const row = rows.find(r => r.uid === uid);
  if (!row || !hasBar(row) || deltaDays === 0) return [...rows];
  const start = parseDay(row.start) ?? options.fallbackStart;

  if (mode === 'move') {
    if (!canMoveBar(row, options.autoCalc)) return [...rows];
    const length = barLength(row);
    const moved = rows.map(r =>
      r.uid === uid
        ? { ...r, start: isoDay(start + deltaDays), finish: options.autoCalc ? r.finish : isoDay(start + deltaDays + length - 1) }
        : r,
    );
    return options.autoCalc ? computePlan(moved, options.type, options.fallbackStart) : moved;
  }

  if (!canResizeBar(row, options.type)) return [...rows];
  const base = resizeBase(row, options.autoCalc);
  const duration = clamp(base + deltaDays, 1, MAX_DURATION);
  const resized = rows.map(r =>
    r.uid === uid ? { ...r, durationDays: duration, start: isoDay(start), finish: isoDay(start + duration - 1) } : r,
  );
  return options.autoCalc ? computePlan(resized, options.type, options.fallbackStart) : resized;
};

export interface StagePatch {
  /** Номер дня начала; с автоРасчётом учитывается только у изделия (корень плана) */
  start: number;
  durationDays: number;
  color: string;
  dependsOn: string[];
}

/** У изделия в общем графике полоса сводная по деталям — её длина не равна длительности операции 000 */
export const isSummaryBar = (rows: readonly GppRowDTO[], row: GppRowDTO, type: GppType): boolean =>
  row.kind === 'PRODUCT' && type === 'GENERAL' && partsOf(buildIndex(rows), row.uid).length > 0;

/**
 * Окончание полосы после правки в окне «Этап». Сводная полоса изделия сдвигается вместе с началом и сохраняет длину:
 * длительность меняет только собственную операцию 000 (она видна в последовательном графике)
 */
export const stageFinish = (rows: readonly GppRowDTO[], row: GppRowDTO, start: number, duration: number, type: GppType): number =>
  isSummaryBar(rows, row, type) ? start + barLength(row) - 1 : start + duration - 1;

/** Правка этапа из окна «Этап» */
export const applyStage = (rows: readonly GppRowDTO[], uid: string, patch: StagePatch, options: PlanOptions): GppRowDTO[] => {
  const duration = clamp(Math.round(patch.durationDays), 1, MAX_DURATION);
  const next = rows.map(r => {
    if (r.uid !== uid) return r;
    const keepStart = options.autoCalc && r.kind === 'PART';
    const start = keepStart ? parseDay(r.start) ?? patch.start : patch.start;
    return {
      ...r,
      start: isoDay(start),
      finish: isoDay(stageFinish(rows, r, start, duration, options.type)),
      durationDays: duration,
      color: patch.color,
      dependsOn: r.kind === 'PART' ? patch.dependsOn : r.dependsOn,
    };
  });
  return options.autoCalc ? computePlan(next, options.type, options.fallbackStart) : next;
};

/** Границы плана: самое раннее начало и самое позднее окончание среди полос */
export const planBounds = (rows: readonly GppRowDTO[]): { from: number; to: number } | null => {
  let from = Infinity;
  let to = -Infinity;
  rows.forEach(r => {
    const s = parseDay(r.start);
    const f = parseDay(r.finish);
    if (s !== null) from = Math.min(from, s);
    if (f !== null) to = Math.max(to, f);
  });
  return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
};
