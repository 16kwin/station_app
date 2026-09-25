// graphEngine.ts — императивная часть графа закупок: тики физики → атрибуты SVG, камера
// (масштаб колесом вокруг курсора, панорама, «вписать»), перетаскивание узлов, подсветка
// при наведении, затухание подписей, печать. React строит разметку только при смене данных,
// фильтров и настроек; движок находит её элементы по data-атрибутам и двигает их сам —
// без перерисовки React на каждом кадре.

import { easeOutCubic } from '../shared/animation';
import { arrowLength, nodeExtent, nodeRadius } from './model';
import { FULL_TUNING, GraphSimulation, SPEC_TUNING } from './simulation';
import type { HubAnchor, Point, SimNode } from './simulation';
import type { GraphDisplay, GraphForces, GraphInsets, GraphMode, GraphModel, HoverTarget } from './types';

/* ---------- Константы поведения ---------- */

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 4;
/** Множитель масштаба колесом: exp(−deltaY × 0.0015) */
const WHEEL_FACTOR = 0.0015;
/** Доля пути к целевому масштабу за кадр — колесо «доезжает» плавно */
const WHEEL_EASE = 0.28;
/** Сдвиг меньше 4 px — это клик, а не перетаскивание */
const CLICK_SLOP = 4;
const DOUBLE_CLICK_MS = 350;
/** Градиент «Фикс. длина»: 28 px цвета поставщика от центра узла, затем переход за 40 px */
export const FIXED_GRADIENT_SOLID = 28;
export const FIXED_GRADIENT_LENGTH = 68;
const FIT_PADDING_FULL = 40;
const FIT_MAX_ZOOM_FULL = 1.3;
const FIT_MAX_ZOOM_COMPACT = 1.05;
export const FIT_DURATION = 400;
const FOCUS_FIT_DURATION = 700;
const EXPLODE_FIT_DURATION = 650;
const ZOOM_BUTTON_DURATION = 220;
/** Композиция мини-карточки подобрана на области 312×255 (карточка 344×330 без заголовка и полей) */
const HUB_BASE = { w: 312, h: 255, x: -40, y: -80, strength: 0.4, othersX: 20, othersY: 40 } as const;

const ZERO_INSETS: GraphInsets = { left: 0, right: 0, top: 0, bottom: 0 };

interface Camera {
  k: number;
  x: number;
  y: number;
}

interface EdgeEls {
  group: SVGGElement;
  line: SVGLineElement | null;
  hit: SVGLineElement | null;
  arrow: SVGPathElement | null;
  gradient: SVGLinearGradientElement | null;
  label: SVGGElement | null;
}

type PointerState =
  | {
      kind: 'node';
      pointerId: number;
      id: string;
      startX: number;
      startY: number;
      grabDx: number;
      grabDy: number;
      dragging: boolean;
    }
  | {
      kind: 'background';
      pointerId: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      panning: boolean;
    };

interface ZoomAnim {
  targetK: number;
  /** Точка экрана под курсором и точка графа, которая должна остаться под ней */
  sx: number;
  sy: number;
  gx: number;
  gy: number;
}

interface CameraAnim {
  from: Camera;
  to: Camera;
  start: number;
  duration: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface EngineCallbacks {
  onHover: (target: HoverTarget | null) => void;
  onNodeClick: (id: string) => void;
}

export interface EngineOptions {
  mode: GraphMode;
  container: HTMLElement;
  svg: SVGSVGElement;
  viewport: SVGGElement;
  getTooltip: () => HTMLElement | null;
  forces: GraphForces;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const r1 = (value: number): string => (Math.round(value * 10) / 10).toString();
const r3 = (value: number): string => (Math.round(value * 1000) / 1000).toString();

/** Прозрачность подписи: 1 при масштабе ≥ z, линейно до 0 к 0.7·z */
const fadeOpacity = (k: number, z: number): number => clamp((k - 0.7 * z) / (0.3 * z), 0, 1);

/** Угол подписи вдоль линии в (−90°, 90°] — текст всегда читается слева направо */
const readableAngle = (ux: number, uy: number): number => {
  let angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  else if (angle <= -90) angle += 180;
  return angle;
};

const setLine = (el: SVGLineElement | null, x1: number, y1: number, x2: number, y2: number): void => {
  if (!el) return;
  el.setAttribute('x1', r1(x1));
  el.setAttribute('y1', r1(y1));
  el.setAttribute('x2', r1(x2));
  el.setAttribute('y2', r1(y2));
};

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class GraphEngine {
  private readonly mode: GraphMode;
  private readonly container: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly viewport: SVGGElement;
  private readonly getTooltip: () => HTMLElement | null;
  private readonly sim: GraphSimulation;
  private readonly resizeObserver: ResizeObserver | null = null;
  private callbacks: EngineCallbacks = { onHover: () => undefined, onNodeClick: () => undefined };
  private model: GraphModel | null = null;
  private display: GraphDisplay | null = null;
  private hubId: string | null = null;
  private insets: GraphInsets = ZERO_INSETS;
  private size = { w: 0, h: 0 };
  private camera: Camera = { k: 1, x: 0, y: 0 };
  private fade = { node: -1, edge: -1 };
  private readonly nodeEls = new Map<string, SVGGElement>();
  private readonly edgeEls = new Map<string, EdgeEls>();
  private readonly adjacency = new Map<string, { nodes: string[]; edges: string[] }>();
  private readonly edgeEnds = new Map<string, [string, string]>();
  private hover: HoverTarget | null = null;
  private pinnedId: string | null = null;
  private pointer: PointerState | null = null;
  private lastClient: { x: number; y: number } | null = null;
  private lastNodeClick: { id: string; time: number } | null = null;
  private lastBackgroundClick: { time: number; x: number; y: number } | null = null;
  private zoomAnim: ZoomAnim | null = null;
  private cameraAnim: CameraAnim | null = null;
  private frame = 0;
  private printing = false;
  private destroyed = false;

  constructor(options: EngineOptions) {
    this.mode = options.mode;
    this.container = options.container;
    this.svg = options.svg;
    this.viewport = options.viewport;
    this.getTooltip = options.getTooltip;
    this.sim = new GraphSimulation(options.forces, this.handleTick, this.handleEnd, {
      tuning: options.mode === 'full' ? FULL_TUNING : SPEC_TUNING,
    });

    const rect = this.container.getBoundingClientRect();
    this.size = { w: rect.width, h: rect.height };
    this.camera = { k: 1, x: rect.width / 2, y: rect.height / 2 };

    this.svg.addEventListener('pointerdown', this.onPointerDown);
    this.svg.addEventListener('pointermove', this.onPointerMove);
    this.svg.addEventListener('pointerup', this.onPointerUp);
    this.svg.addEventListener('pointercancel', this.onPointerCancel);
    this.svg.addEventListener('lostpointercapture', this.onLostCapture);
    this.svg.addEventListener('pointerleave', this.onPointerLeave);
    if (this.mode === 'full') {
      // Колесо — только на полной странице: в мини-карточке оно прокручивает панель
      this.svg.addEventListener('wheel', this.onWheel, { passive: false });
      window.addEventListener('beforeprint', this.onBeforePrint);
      window.addEventListener('afterprint', this.onAfterPrint);
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        const box = entries[entries.length - 1]?.contentRect;
        if (box) this.onResize(box.width, box.height);
      });
      this.resizeObserver.observe(this.container);
    }
    this.applyCamera(true);
  }

  /* ---------- Публичный интерфейс для GraphView ---------- */

  setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  /** Ползунки «Силы» — сразу пересобрать силы и разогреть (alpha 0.5) */
  setForces(forces: GraphForces): void {
    this.sim.setForces(forces);
  }

  /** Области, закрытые панелями: «вписать граф» учитывает только свободную часть */
  setInsets(insets: GraphInsets): void {
    this.insets = insets;
    if (this.mode === 'compact') this.updateHub();
  }

  /**
   * Вызывается после каждого коммита React с новой разметкой: связать элементы, обновить
   * состав симуляции (узлы переиспользуются по ключу), поставить всё на места до отрисовки.
   */
  sync(model: GraphModel, display: GraphDisplay, hubId: string | null): void {
    const prevModel = this.model;
    const prevDisplay = this.display;
    this.model = model;
    this.display = display;
    this.hubId = hubId;
    if (this.mode === 'compact') this.updateHub();

    const radiusOf = new Map(model.nodes.map(node => [node.id, nodeRadius(node, display.nodeSize)] as const));
    if (model !== prevModel) {
      this.rebuildAdjacency(model);
      if (!prevModel || !sameShape(prevModel, model)) {
        const exploded = this.sim.setGraph(
          model.nodes.map(node => ({ id: node.id, radius: radiusOf.get(node.id) ?? node.baseRadius })),
          model.edges.map(edge => ({ id: edge.id, kind: edge.kind, source: edge.source, target: edge.target })),
        );
        // Первая раскладка: камера сразу там, куда граф «разлетится»
        if (exploded) this.fitNow(true);
      } else {
        this.sim.setRadii(id => radiusOf.get(id));
      }
      this.forgetMissing(model);
    } else if (prevDisplay && prevDisplay.nodeSize !== display.nodeSize) {
      this.sim.setRadii(id => radiusOf.get(id));
    }

    this.bindElements();
    this.renderFrame();
    this.applyCamera(true);
    this.applyHighlight();
  }

  /** «По размеру» и двойной клик по фону: плавно вписать граф (400 мс, easeOutCubic) */
  fit(duration = FIT_DURATION): void {
    this.fitAnimated(duration, this.sim.alpha > 0.05);
  }

  /** Смена фокуса или выбора: камера едет туда, где граф окажется после перестройки */
  focusFit(): void {
    if (this.mode === 'compact') this.fitNow(true);
    else this.fitAnimated(FOCUS_FIT_DURATION, true);
  }

  /** Кнопки «+» / «−»: масштаб вокруг центра свободной области */
  zoomBy(factor: number): void {
    const base = this.cameraAnim?.to ?? this.camera;
    const k = clamp(base.k * factor, ZOOM_MIN, ZOOM_MAX);
    const { x: rx, y: ry } = this.referencePoint();
    const gx = (rx - base.x) / base.k;
    const gy = (ry - base.y) / base.k;
    this.animateCamera({ k, x: rx - gx * k, y: ry - gy * k }, ZOOM_BUTTON_DURATION);
  }

  /** «Запустить анимацию»: узлы в круг радиуса 40 у центра и alpha 1 — граф разлетается и собирается */
  explode(): void {
    if (!this.sim.nodes.length) return;
    this.sim.explode();
    // Собранное в центре состояние видно сразу, разлёт — со следующего тика
    this.renderFrame();
    const target = this.targetCamera(this.sim.predict());
    if (!target) return;
    if (this.mode === 'compact') {
      this.stopCameraAnimations();
      this.camera = target;
      this.applyCamera();
    } else {
      this.animateCamera(target, EXPLODE_FIT_DURATION);
    }
  }

  /** Подсказка у курсора: справа снизу, у края окна — с другой стороны */
  positionTooltip(): void {
    const tip = this.getTooltip();
    if (!tip || !this.lastClient || !this.hover) return;
    const rect = this.container.getBoundingClientRect();
    const scale = this.containerScale(rect);
    const width = tip.offsetWidth * scale;
    const height = tip.offsetHeight * scale;
    const viewW = typeof window !== 'undefined' ? window.innerWidth : rect.right;
    const viewH = typeof window !== 'undefined' ? window.innerHeight : rect.bottom;
    let cx = this.lastClient.x + 16;
    let cy = this.lastClient.y + 18;
    if (cx + width > viewW - 8) cx = this.lastClient.x - 16 - width;
    if (cy + height > viewH - 8) cy = this.lastClient.y - 16 - height;
    cx = Math.max(8, cx);
    cy = Math.max(8, cy);
    tip.style.transform = `translate(${Math.round((cx - rect.left) / scale)}px, ${Math.round((cy - rect.top) / scale)}px)`;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sim.destroy();
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.svg.removeEventListener('pointerdown', this.onPointerDown);
    this.svg.removeEventListener('pointermove', this.onPointerMove);
    this.svg.removeEventListener('pointerup', this.onPointerUp);
    this.svg.removeEventListener('pointercancel', this.onPointerCancel);
    this.svg.removeEventListener('lostpointercapture', this.onLostCapture);
    this.svg.removeEventListener('pointerleave', this.onPointerLeave);
    this.svg.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('beforeprint', this.onBeforePrint);
    window.removeEventListener('afterprint', this.onAfterPrint);
  }

  /* ---------- Состав графа и элементы разметки ---------- */

  private rebuildAdjacency(model: GraphModel): void {
    this.adjacency.clear();
    this.edgeEnds.clear();
    const entry = (id: string) => {
      let value = this.adjacency.get(id);
      if (!value) {
        value = { nodes: [], edges: [] };
        this.adjacency.set(id, value);
      }
      return value;
    };
    model.edges.forEach(edge => {
      this.edgeEnds.set(edge.id, [edge.source, edge.target]);
      const a = entry(edge.source);
      const b = entry(edge.target);
      a.nodes.push(edge.target);
      a.edges.push(edge.id);
      b.nodes.push(edge.source);
      b.edges.push(edge.id);
    });
  }

  /** Наведение и закреплённая подсветка на исчезнувший объект сбрасываются */
  private forgetMissing(model: GraphModel): void {
    const nodes = new Set(model.nodes.map(node => node.id));
    if (this.pinnedId && !nodes.has(this.pinnedId)) this.pinnedId = null;
    const hover = this.hover;
    if (!hover) return;
    const alive = hover.kind === 'node' ? nodes.has(hover.id) : this.edgeEnds.has(hover.id);
    if (alive) return;
    this.hover = null;
    // Вызов из эффекта React: состояние меняем после коммита
    queueMicrotask(() => {
      if (!this.destroyed) this.callbacks.onHover(null);
    });
  }

  /** Карты «ключ → элемент» по data-атрибутам свежей разметки */
  private bindElements(): void {
    this.nodeEls.clear();
    this.edgeEls.clear();
    this.viewport.querySelectorAll<SVGGElement>('[data-node-id]').forEach(el => {
      const id = el.getAttribute('data-node-id');
      if (id) this.nodeEls.set(id, el);
    });
    this.viewport.querySelectorAll<SVGGElement>('[data-edge-id]').forEach(el => {
      const id = el.getAttribute('data-edge-id');
      if (!id) return;
      this.edgeEls.set(id, {
        group: el,
        line: el.querySelector<SVGLineElement>('.pgv-line'),
        hit: el.querySelector<SVGLineElement>('.pgv-hit'),
        arrow: el.querySelector<SVGPathElement>('.pgv-arrow'),
        gradient: null,
        label: null,
      });
    });
    this.svg.querySelectorAll<SVGLinearGradientElement>('[data-grad-for]').forEach(el => {
      const edge = this.edgeEls.get(el.getAttribute('data-grad-for') ?? '');
      if (edge) edge.gradient = el;
    });
    this.viewport.querySelectorAll<SVGGElement>('[data-label-for]').forEach(el => {
      const edge = this.edgeEls.get(el.getAttribute('data-label-for') ?? '');
      if (edge) edge.label = el;
    });
  }

  /* ---------- Кадр: позиции из физики → атрибуты ---------- */

  private readonly handleTick = (): void => {
    if (!this.destroyed) this.renderFrame();
  };

  /** Мини-карточка после остывания: если граф «уехал» (тянули узел), мягко вписать заново */
  private readonly handleEnd = (): void => {
    if (this.destroyed || this.mode !== 'compact' || this.pointer) return;
    const target = this.targetCamera(this.sim.positions());
    if (!target) return;
    const drift =
      Math.abs(target.k / this.camera.k - 1) > 0.06 ||
      Math.abs(target.x - this.camera.x) > 12 ||
      Math.abs(target.y - this.camera.y) > 12;
    if (drift) this.animateCamera(target, 450);
  };

  private renderFrame(): void {
    const display = this.display;
    if (!display) return;
    this.sim.nodes.forEach(node => {
      const el = this.nodeEls.get(node.id);
      if (el) el.setAttribute('transform', `translate(${r1(node.x ?? 0)},${r1(node.y ?? 0)})`);
    });

    const arrowLen = arrowLength(display.lineWidth);
    const fixed = display.gradient === 'fixed';
    this.sim.links.forEach(link => {
      const els = this.edgeEls.get(link.id);
      if (!els) return;
      const s = link.source as SimNode;
      const t = link.target as SimNode;
      const sx = s.x ?? 0;
      const sy = s.y ?? 0;
      const tx = t.x ?? 0;
      const ty = t.y ?? 0;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy);
      const ux = len > 1e-6 ? dx / len : 1;
      const uy = len > 1e-6 ? dy / len : 0;
      const gap = len - s.radius - t.radius;
      // Линия — от края круга поставщика до края круга номенклатуры
      const x1 = sx + ux * s.radius;
      const y1 = sy + uy * s.radius;
      const tipX = tx - ux * t.radius;
      const tipY = ty - uy * t.radius;
      const withArrow = els.arrow !== null && gap > arrowLen + 4;
      const endX = withArrow ? tipX - ux * (arrowLen - 1) : tipX;
      const endY = withArrow ? tipY - uy * (arrowLen - 1) : tipY;
      if (gap > 1) {
        setLine(els.line, x1, y1, endX, endY);
        setLine(els.hit, x1, y1, tipX, tipY);
      } else {
        setLine(els.line, x1, y1, x1, y1);
        setLine(els.hit, x1, y1, x1, y1);
      }
      if (els.arrow) {
        els.arrow.setAttribute(
          'transform',
          withArrow ? `translate(${r1(tipX)},${r1(tipY)}) rotate(${r1((Math.atan2(uy, ux) * 180) / Math.PI)})` : 'scale(0)',
        );
      }
      if (els.gradient) {
        // «Фикс. длина» — вектор 68 px от центра поставщика (дальше цвет номенклатуры),
        // «10:90» — от центра до центра, цвет поставщика на первых 10 %
        const gx2 = fixed ? sx + ux * FIXED_GRADIENT_LENGTH : tx;
        const gy2 = fixed ? sy + uy * FIXED_GRADIENT_LENGTH : ty;
        els.gradient.setAttribute('x1', r1(sx));
        els.gradient.setAttribute('y1', r1(sy));
        els.gradient.setAttribute('x2', r1(gx2));
        els.gradient.setAttribute('y2', r1(gy2));
      }
      if (els.label) {
        const mx = (x1 + tipX) / 2;
        const my = (y1 + tipY) / 2;
        els.label.setAttribute('transform', `translate(${r1(mx)},${r1(my)}) rotate(${r1(readableAngle(ux, uy))})`);
      }
    });
  }

  /* ---------- Камера ---------- */

  private applyCamera(forceFade = false): void {
    if (this.printing) return;
    const { k, x, y } = this.camera;
    this.viewport.setAttribute('transform', `translate(${r1(x)},${r1(y)}) scale(${r3(k)})`);
    this.applyFade(forceFade);
  }

  /** Порог исчезания текста: подписи узлов видны при k ≥ z0 = 0.8·1.5^t, цены — при k ≥ 1.15·z0 */
  private applyFade(force: boolean): void {
    let node = 1;
    let edge = 1;
    if (this.mode === 'full' && this.display) {
      const z0 = 0.8 * Math.pow(1.5, this.display.textFade);
      node = fadeOpacity(this.camera.k, z0);
      edge = fadeOpacity(this.camera.k, 1.15 * z0);
    }
    node = Math.round(node * 100) / 100;
    edge = Math.round(edge * 100) / 100;
    if (!force && node === this.fade.node && edge === this.fade.edge) return;
    this.fade = { node, edge };
    this.viewport.style.setProperty('--pg-node-label', String(node));
    this.viewport.style.setProperty('--pg-edge-label', String(edge));
  }

  private referencePoint(): Point {
    const { w, h } = this.size;
    return {
      x: this.insets.left + (w - this.insets.left - this.insets.right) / 2,
      y: this.insets.top + (h - this.insets.top - this.insets.bottom) / 2,
    };
  }

  /** Габариты графа с подписями в координатах графа */
  private graphBounds(positions: Map<string, Point>): Bounds | null {
    const model = this.model;
    const display = this.display;
    if (!model || !display || !model.nodes.length) return null;
    const box: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    model.nodes.forEach(node => {
      const p = positions.get(node.id);
      if (!p) return;
      const ext = nodeExtent(node, nodeRadius(node, display.nodeSize));
      box.minX = Math.min(box.minX, p.x - ext.left);
      box.maxX = Math.max(box.maxX, p.x + ext.right);
      box.minY = Math.min(box.minY, p.y - ext.top);
      box.maxY = Math.max(box.maxY, p.y + ext.bottom);
    });
    return Number.isFinite(box.minX) ? box : null;
  }

  /** Камера, при которой граф целиком в свободной области */
  private targetCamera(positions: Map<string, Point>): Camera | null {
    const box = this.graphBounds(positions);
    const { w, h } = this.size;
    if (!box || w <= 0 || h <= 0) return null;
    const pad = this.mode === 'full' ? FIT_PADDING_FULL : 0;
    const availW = Math.max(40, w - this.insets.left - this.insets.right - 2 * pad);
    const availH = Math.max(40, h - this.insets.top - this.insets.bottom - 2 * pad);
    const boxW = Math.max(1, box.maxX - box.minX);
    const boxH = Math.max(1, box.maxY - box.minY);
    const maxK = this.mode === 'full' ? FIT_MAX_ZOOM_FULL : FIT_MAX_ZOOM_COMPACT;
    const k = clamp(Math.min(availW / boxW, availH / boxH), ZOOM_MIN, maxK);
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const sx = this.insets.left + pad + availW / 2;
    const sy = this.insets.top + pad + availH / 2;
    return { k, x: sx - cx * k, y: sy - cy * k };
  }

  private fitNow(predicted: boolean): void {
    const target = this.targetCamera(predicted ? this.sim.predict() : this.sim.positions());
    if (!target) return;
    this.stopCameraAnimations();
    this.camera = target;
    this.applyCamera();
  }

  private fitAnimated(duration: number, predicted: boolean): void {
    const target = this.targetCamera(predicted ? this.sim.predict() : this.sim.positions());
    if (target) this.animateCamera(target, duration);
  }

  private stopCameraAnimations(): void {
    this.zoomAnim = null;
    this.cameraAnim = null;
  }

  private animateCamera(target: Camera, duration: number): void {
    this.zoomAnim = null;
    if (duration <= 0) {
      this.cameraAnim = null;
      this.camera = target;
      this.applyCamera();
      return;
    }
    this.cameraAnim = { from: { ...this.camera }, to: target, start: now(), duration };
    this.ensureLoop();
  }

  private ensureLoop(): void {
    if (this.frame || this.destroyed) return;
    this.frame = requestAnimationFrame(this.loop);
  }

  private readonly loop = (): void => {
    this.frame = 0;
    if (this.destroyed) return;
    const zooming = this.stepZoom();
    // Время — из того же источника, что и старт анимации (метка rAF может идти по другим часам)
    const moving = this.stepCameraAnim(now());
    if (zooming || moving) this.ensureLoop();
  };

  /** Колесо: масштаб догоняет цель за несколько кадров, точка под курсором стоит на месте */
  private stepZoom(): boolean {
    const anim = this.zoomAnim;
    if (!anim) return false;
    const k = lerp(this.camera.k, anim.targetK, WHEEL_EASE);
    const done = Math.abs(anim.targetK - k) < anim.targetK * 0.002;
    const nextK = done ? anim.targetK : k;
    this.camera = { k: nextK, x: anim.sx - anim.gx * nextK, y: anim.sy - anim.gy * nextK };
    this.applyCamera();
    if (done) this.zoomAnim = null;
    return !done;
  }

  /** Плавный переход камеры: масштаб — в логарифме, центр области — по прямой */
  private stepCameraAnim(time: number): boolean {
    const anim = this.cameraAnim;
    if (!anim) return false;
    const t = clamp((time - anim.start) / anim.duration, 0, 1);
    const e = easeOutCubic(t);
    const { x: rx, y: ry } = this.referencePoint();
    const k = Math.exp(lerp(Math.log(anim.from.k), Math.log(anim.to.k), e));
    const gx = lerp((rx - anim.from.x) / anim.from.k, (rx - anim.to.x) / anim.to.k, e);
    const gy = lerp((ry - anim.from.y) / anim.from.k, (ry - anim.to.y) / anim.to.k, e);
    this.camera = t >= 1 ? anim.to : { k, x: rx - gx * k, y: ry - gy * k };
    this.applyCamera();
    if (t >= 1) {
      this.cameraAnim = null;
      return false;
    }
    return true;
  }

  private onResize(width: number, height: number): void {
    const prev = this.size;
    if (Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5) return;
    this.size = { w: width, h: height };
    if (width <= 0 || height <= 0 || this.printing) return;
    if (prev.w <= 0 || prev.h <= 0 || this.mode === 'compact') {
      // Первый настоящий размер (вкладка была скрыта) или карточка: вписать сразу.
      // Сдвинулась точка хаба — граф мягко перестраивается, камера едет к итогу
      if (this.mode === 'compact' && this.updateHub()) this.sim.reheat(0.3);
      this.fitNow(this.sim.alpha > 0.05);
      return;
    }
    // Страница: центр остаётся в центре
    this.camera = { ...this.camera, x: this.camera.x + (width - prev.w) / 2, y: this.camera.y + (height - prev.h) / 2 };
    if (this.cameraAnim) {
      const to = this.cameraAnim.to;
      this.cameraAnim.to = { ...to, x: to.x + (width - prev.w) / 2, y: to.y + (height - prev.h) / 2 };
    }
    this.applyCamera();
  }

  /** Мини-карточка: хаб слева сверху, остальные веером — масштаб точек от размера области. true — точка сменилась */
  private updateHub(): boolean {
    if (this.mode !== 'compact') return false;
    let hub: HubAnchor | null = null;
    if (this.hubId) {
      const availW = Math.max(160, this.size.w - this.insets.left - this.insets.right);
      const availH = Math.max(140, this.size.h - this.insets.top - this.insets.bottom);
      const sx = availW / HUB_BASE.w;
      const sy = availH / HUB_BASE.h;
      hub = {
        id: this.hubId,
        x: HUB_BASE.x * sx,
        y: HUB_BASE.y * sy,
        strength: HUB_BASE.strength,
        othersX: HUB_BASE.othersX * sx,
        othersY: HUB_BASE.othersY * sy,
      };
    }
    return this.sim.setHub(hub);
  }

  /* ---------- Подсветка ---------- */

  private setPinned(id: string | null): void {
    if (this.pinnedId === id) return;
    this.pinnedId = id;
    this.applyHighlight();
  }

  private setHover(next: HoverTarget | null): void {
    const same = next === this.hover || (next !== null && this.hover !== null && next.kind === this.hover.kind && next.id === this.hover.id);
    if (same) return;
    this.hover = next;
    this.applyHighlight();
    this.callbacks.onHover(next);
  }

  /** Узел под курсором (или закреплённый поставщик), его связи и соседи — яркие, остальное 0.12 */
  private applyHighlight(): void {
    const nodes = new Set<string>();
    const edges = new Set<string>();
    const hover = this.hover;
    const nodeId = hover ? (hover.kind === 'node' ? hover.id : null) : this.pinnedId;
    if (nodeId && this.nodeEls.has(nodeId)) {
      nodes.add(nodeId);
      const adjacent = this.adjacency.get(nodeId);
      adjacent?.edges.forEach(id => edges.add(id));
      adjacent?.nodes.forEach(id => nodes.add(id));
    } else if (hover?.kind === 'edge') {
      const ends = this.edgeEnds.get(hover.id);
      if (ends) {
        edges.add(hover.id);
        nodes.add(ends[0]);
        nodes.add(ends[1]);
      }
    }
    const active = nodes.size > 0;
    this.viewport.toggleAttribute('data-hl-on', active);
    this.nodeEls.forEach((el, id) => el.toggleAttribute('data-hl', active && nodes.has(id)));
    this.edgeEls.forEach((els, id) => {
      const on = active && edges.has(id);
      els.group.toggleAttribute('data-hl', on);
      els.label?.toggleAttribute('data-hl', on);
    });
  }

  /* ---------- Указатель: перетаскивание, панорама, клики, наведение ---------- */

  /** Точка события в координатах области графа (px) */
  private toLocal(e: { clientX: number; clientY: number }): Point {
    const rect = this.svg.getBoundingClientRect();
    const scale = this.containerScale(rect);
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  }

  /** Масштаб предка через CSS transform (обычно 1) */
  private containerScale(rect: DOMRect): number {
    const width = this.container.clientWidth;
    return width > 0 && rect.width > 0 ? rect.width / width : 1;
  }

  private toGraph(local: Point): Point {
    return { x: (local.x - this.camera.x) / this.camera.k, y: (local.y - this.camera.y) / this.camera.k };
  }

  private targetOf(target: EventTarget | null): HoverTarget | null {
    if (!(target instanceof Element)) return null;
    const nodeEl = target.closest('[data-node-id]');
    const nodeId = nodeEl?.getAttribute('data-node-id');
    if (nodeId) return { kind: 'node', id: nodeId };
    const edgeEl = target.closest('[data-edge-id]');
    const edgeId = edgeEl?.getAttribute('data-edge-id');
    return edgeId ? { kind: 'edge', id: edgeId } : null;
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (this.pointer || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const local = this.toLocal(e);
    this.lastClient = { x: e.clientX, y: e.clientY };
    const target = this.targetOf(e.target);
    if (target?.kind === 'node') {
      const node = this.sim.node(target.id);
      if (!node) return;
      const g = this.toGraph(local);
      this.pointer = {
        kind: 'node',
        pointerId: e.pointerId,
        id: target.id,
        startX: local.x,
        startY: local.y,
        grabDx: g.x - (node.x ?? 0),
        grabDy: g.y - (node.y ?? 0),
        dragging: false,
      };
      // Узел держится под курсором с первого касания
      this.sim.pin(target.id, node.x ?? 0, node.y ?? 0);
    } else {
      this.pointer = { kind: 'background', pointerId: e.pointerId, startX: local.x, startY: local.y, lastX: local.x, lastY: local.y, panning: false };
    }
    try {
      this.svg.setPointerCapture(e.pointerId);
    } catch {
      // указатель уже не активен — просто работаем без захвата
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    this.lastClient = { x: e.clientX, y: e.clientY };
    const p = this.pointer;
    if (!p || p.pointerId !== e.pointerId) {
      this.setHover(this.targetOf(e.target));
      this.positionTooltip();
      return;
    }
    const local = this.toLocal(e);
    if (p.kind === 'node') {
      if (!p.dragging) {
        if (Math.hypot(local.x - p.startX, local.y - p.startY) < CLICK_SLOP) return;
        p.dragging = true;
        this.stopCameraAnimations();
        this.svg.setAttribute('data-dragging', '');
        const tip = this.getTooltip();
        if (tip) tip.style.opacity = '0';
        this.sim.setDragging(true);
      }
      const g = this.toGraph(local);
      let x = g.x - p.grabDx;
      let y = g.y - p.grabDy;
      if (this.mode === 'compact') {
        // В карточке узел не утащить за её край
        const r = this.sim.node(p.id)?.radius ?? 20;
        const { k, x: cx, y: cy } = this.camera;
        x = clamp(x, (r * k - cx) / k, (this.size.w - r * k - cx) / k);
        y = clamp(y, (r * k - cy) / k, (this.size.h - r * k - cy) / k);
      }
      this.sim.pin(p.id, x, y);
      return;
    }
    if (!p.panning) {
      if (this.mode !== 'full' || Math.hypot(local.x - p.startX, local.y - p.startY) < CLICK_SLOP) return;
      p.panning = true;
      this.stopCameraAnimations();
      this.svg.setAttribute('data-panning', '');
    }
    this.camera = { ...this.camera, x: this.camera.x + local.x - p.lastX, y: this.camera.y + local.y - p.lastY };
    p.lastX = local.x;
    p.lastY = local.y;
    this.applyCamera();
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const p = this.pointer;
    if (!p || p.pointerId !== e.pointerId) return;
    const local = this.toLocal(e);
    this.finishPointer(p, true, local);
    // После захвата цель события — сам svg: наведение пересчитываем по точке
    const under = typeof document !== 'undefined' && document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null;
    this.setHover(this.svg.contains(under) ? this.targetOf(under) : null);
    this.positionTooltip();
  };

  private readonly onPointerCancel = (e: PointerEvent): void => {
    const p = this.pointer;
    if (p && p.pointerId === e.pointerId) this.finishPointer(p, false, null);
  };

  private readonly onLostCapture = (e: PointerEvent): void => {
    const p = this.pointer;
    if (p && p.pointerId === e.pointerId) this.finishPointer(p, false, null);
  };

  private readonly onPointerLeave = (): void => {
    if (!this.pointer) this.setHover(null);
  };

  /** Конец жеста: отпустить узел (как в Obsidian — он снова свободен) или завершить панораму */
  private finishPointer(p: PointerState, asClick: boolean, local: Point | null): void {
    this.pointer = null;
    try {
      if (this.svg.hasPointerCapture(p.pointerId)) this.svg.releasePointerCapture(p.pointerId);
    } catch {
      // захват уже снят
    }
    if (p.kind === 'node') {
      this.sim.release(p.id);
      if (p.dragging) {
        this.sim.setDragging(false);
        this.svg.removeAttribute('data-dragging');
        const tip = this.getTooltip();
        if (tip) tip.style.opacity = '';
      } else if (asClick) {
        this.handleNodeClick(p.id);
      }
      return;
    }
    if (p.panning) this.svg.removeAttribute('data-panning');
    else if (asClick && local) this.handleBackgroundClick(local);
  }

  private handleNodeClick(id: string): void {
    const time = now();
    const last = this.lastNodeClick;
    this.lastNodeClick = { id, time };
    // Второй клик двойного щелчка не переключает фокус обратно
    if (last && last.id === id && time - last.time < DOUBLE_CLICK_MS) return;
    if (id.startsWith('s:')) this.setPinned(this.pinnedId === id ? null : id);
    this.callbacks.onNodeClick(id);
  }

  private handleBackgroundClick(local: Point): void {
    const time = now();
    const last = this.lastBackgroundClick;
    if (last && time - last.time < DOUBLE_CLICK_MS && Math.hypot(local.x - last.x, local.y - last.y) < 8) {
      this.lastBackgroundClick = null;
      if (this.mode === 'full') this.fit();
      return;
    }
    this.lastBackgroundClick = { time, x: local.x, y: local.y };
    this.setPinned(null);
  }

  /** Колесо: масштаб вокруг курсора, множитель exp(−deltaY·0.0015), пределы 0.15…4 */
  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const local = this.toLocal(e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const factor = Math.exp(-e.deltaY * unit * WHEEL_FACTOR);
    const baseK = this.zoomAnim ? this.zoomAnim.targetK : this.camera.k;
    const targetK = clamp(baseK * factor, ZOOM_MIN, ZOOM_MAX);
    this.cameraAnim = null;
    const g = this.toGraph(local);
    this.zoomAnim = { targetK, sx: local.x, sy: local.y, gx: g.x, gy: g.y };
    this.ensureLoop();
  };

  /* ---------- Печать: граф целиком через viewBox, без текущего масштаба ---------- */

  private readonly onBeforePrint = (): void => {
    const box = this.graphBounds(this.sim.positions());
    if (!box) return;
    this.printing = true;
    const pad = 24;
    this.svg.setAttribute('viewBox', `${r1(box.minX - pad)} ${r1(box.minY - pad)} ${r1(box.maxX - box.minX + 2 * pad)} ${r1(box.maxY - box.minY + 2 * pad)}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.viewport.removeAttribute('transform');
  };

  private readonly onAfterPrint = (): void => {
    if (!this.printing) return;
    this.printing = false;
    this.svg.removeAttribute('viewBox');
    this.svg.removeAttribute('preserveAspectRatio');
    const rect = this.container.getBoundingClientRect();
    this.size = { w: rect.width, h: rect.height };
    this.applyCamera(true);
  };
}

/** Тот же состав узлов и связей — физику не трогаем (например, сдвинули лимит цены) */
const sameShape = (a: GraphModel, b: GraphModel): boolean =>
  a.nodes.length === b.nodes.length &&
  a.edges.length === b.edges.length &&
  a.nodes.every((node, i) => node.id === b.nodes[i].id && node.degree === b.nodes[i].degree) &&
  a.edges.every((edge, i) => edge.id === b.edges[i].id);
