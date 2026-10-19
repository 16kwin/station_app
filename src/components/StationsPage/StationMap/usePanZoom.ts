// usePanZoom.ts — масштаб и панорама области карты без библиотек (по образцу движка графа закупок):
// колесо — к курсору, перетаскивание фона, щипок двумя пальцами, «+», «−», «по размеру».
// Сдвиг и масштаб пишутся прямо в style.transform через requestAnimationFrame — React на каждом кадре
// не перерисовывается. Обратный масштаб передаётся в CSS-переменную --inv-k: маркеры с ней не растут.
// Вкладка может быть скрыта (display: none) — размеры берутся из ResizeObserver, нулевые пропускаются.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

export interface ViewTransform {
  k: number;
  x: number;
  y: number;
}

/** Части области карты, закрытые панелями: «по размеру» вписывает план в остальное */
export interface ViewInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PlanRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanZoomApi {
  zoomBy: (factor: number) => void;
  fit: (animate?: boolean) => void;
  /** Точка плана (px плана) — в центр; масштаб не меньше relZoom × «по размеру» */
  centerOn: (px: number, py: number, relZoom?: number) => void;
  fitRect: (rect: PlanRect) => void;
  transform: () => ViewTransform;
}

interface PanZoomOptions {
  contentWidth: number;
  contentHeight: number;
  insets: ViewInsets;
  onTransform?: (t: ViewTransform, fitK: number) => void;
}

/** Множитель масштаба колесом: exp(−deltaY × 0.0015); щипок тачпада приходит как колесо с Ctrl */
const WHEEL_FACTOR = 0.0015;
const PINCH_WHEEL_FACTOR = 0.01;
/** Доля пути к целевому масштабу за кадр — колесо «доезжает» плавно */
const WHEEL_EASE = 0.28;
/** Сдвиг меньше 4 px — это клик, а не перетаскивание */
const CLICK_SLOP = 4;
const PADDING = 24;
/** Насколько план можно увести за край области, px */
const SLACK = 80;
const MAX_ZOOM = 4;
const ZOOM_DURATION = 220;
const FIT_DURATION = 380;
const FOCUS_DURATION = 460;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const easeOutCubic = (p: number): number => 1 - (1 - p) ** 3;

class PanZoomEngine {
  private readonly viewport: HTMLElement;
  private readonly content: HTMLElement;
  private readonly notify: (t: ViewTransform, fitK: number) => void;
  private t: ViewTransform = { k: 1, x: 0, y: 0 };
  private vw = 0;
  private vh = 0;
  private cw = 1;
  private ch = 1;
  private insets: ViewInsets = { left: 0, right: 0, top: 0, bottom: 0 };
  private fitK = 1;
  /** Пользователь двигал карту: при смене размеров области не возвращаем «по размеру» */
  private userMoved = false;
  private frame = 0;
  private idleTimer = 0;
  private anim: { from: ViewTransform; to: ViewTransform; start: number; duration: number } | null = null;
  private wheel: { targetK: number; sx: number; sy: number; gx: number; gy: number } | null = null;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pan: { id: number; clientX: number; clientY: number; tx: number; ty: number; active: boolean } | null = null;
  private pinch: { dist: number; k: number; gx: number; gy: number } | null = null;
  /** После перетаскивания фона клик не должен закрывать карточку */
  private suppressClick = false;
  private readonly resizeObserver: ResizeObserver | null;

  constructor(viewport: HTMLElement, content: HTMLElement, notify: (t: ViewTransform, fitK: number) => void) {
    this.viewport = viewport;
    this.content = content;
    this.notify = notify;
    content.style.transformOrigin = '0 0';
    viewport.addEventListener('wheel', this.onWheel, { passive: false });
    viewport.addEventListener('pointerdown', this.onPointerDown);
    viewport.addEventListener('pointermove', this.onPointerMove);
    viewport.addEventListener('pointerup', this.onPointerUp);
    viewport.addEventListener('pointercancel', this.onPointerUp);
    viewport.addEventListener('click', this.onClickCapture, true);
    viewport.addEventListener('dblclick', this.onDoubleClick);
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.measure()) : null;
    this.resizeObserver?.observe(viewport);
    this.measure();
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    window.clearTimeout(this.idleTimer);
    this.resizeObserver?.disconnect();
    this.viewport.removeEventListener('wheel', this.onWheel);
    this.viewport.removeEventListener('pointerdown', this.onPointerDown);
    this.viewport.removeEventListener('pointermove', this.onPointerMove);
    this.viewport.removeEventListener('pointerup', this.onPointerUp);
    this.viewport.removeEventListener('pointercancel', this.onPointerUp);
    this.viewport.removeEventListener('click', this.onClickCapture, true);
    this.viewport.removeEventListener('dblclick', this.onDoubleClick);
  }

  /* ---------- Публичное ---------- */

  get transform(): ViewTransform {
    return { ...this.t };
  }

  setContentSize(width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    if (w === this.cw && h === this.ch) return;
    this.cw = w;
    this.ch = h;
    this.userMoved = false;
    this.stopMotion();
    this.relayout();
  }

  setInsets(insets: ViewInsets): void {
    const same = insets.left === this.insets.left && insets.right === this.insets.right
      && insets.top === this.insets.top && insets.bottom === this.insets.bottom;
    if (same) return;
    this.insets = { ...insets };
    if (this.userMoved) {
      this.computeFit();
      this.t = this.clampT(this.t);
      this.apply();
    } else {
      this.animateTo(this.fitTransform(), FIT_DURATION);
    }
  }

  zoomBy(factor: number): void {
    const base = this.anim?.to ?? this.t;
    const { cx, cy } = this.regionCenter();
    const gx = (cx - base.x) / base.k;
    const gy = (cy - base.y) / base.k;
    const k = clamp(base.k * factor, this.minK(), this.maxK());
    this.userMoved = true;
    this.animateTo({ k, x: cx - gx * k, y: cy - gy * k }, ZOOM_DURATION);
  }

  fit(animate = true): void {
    this.userMoved = false;
    if (animate) this.animateTo(this.fitTransform(), FIT_DURATION);
    else {
      this.stopMotion();
      this.t = this.fitTransform();
      this.apply();
    }
  }

  centerOn(px: number, py: number, relZoom = 1.8): void {
    const k = clamp(Math.max(this.t.k, this.fitK * relZoom), this.minK(), this.maxK());
    const { cx, cy } = this.regionCenter();
    this.userMoved = true;
    this.animateTo({ k, x: cx - px * k, y: cy - py * k }, FOCUS_DURATION);
  }

  fitRect(rect: PlanRect): void {
    const { w: aw, h: ah } = this.region();
    const k = clamp(Math.min(aw / Math.max(1, rect.w), ah / Math.max(1, rect.h)) * 0.86, this.minK(), this.maxK());
    const { cx, cy } = this.regionCenter();
    this.userMoved = true;
    this.animateTo({ k, x: cx - (rect.x + rect.w / 2) * k, y: cy - (rect.y + rect.h / 2) * k }, FOCUS_DURATION);
  }

  /* ---------- Геометрия ---------- */

  private measure(): void {
    const w = this.viewport.clientWidth;
    const h = this.viewport.clientHeight;
    // Скрытая вкладка: размеров нет — ждём, пока покажут
    if (w <= 0 || h <= 0) return;
    if (w === this.vw && h === this.vh) return;
    this.vw = w;
    this.vh = h;
    this.relayout();
  }

  private relayout(): void {
    if (this.vw <= 0) return;
    this.computeFit();
    this.t = this.userMoved ? this.clampT(this.t) : this.fitTransform();
    this.apply();
  }

  private region(): { l: number; t: number; w: number; h: number } {
    const l = this.insets.left;
    const t = this.insets.top;
    return { l, t, w: Math.max(40, this.vw - l - this.insets.right), h: Math.max(40, this.vh - t - this.insets.bottom) };
  }

  private regionCenter(): { cx: number; cy: number } {
    const r = this.region();
    return { cx: r.l + r.w / 2, cy: r.t + r.h / 2 };
  }

  private computeFit(): void {
    const r = this.region();
    this.fitK = Math.max(0.01, Math.min((r.w - 2 * PADDING) / this.cw, (r.h - 2 * PADDING) / this.ch));
  }

  private minK(): number {
    return this.fitK;
  }

  private maxK(): number {
    return Math.max(this.fitK * MAX_ZOOM, 1);
  }

  private fitTransform(): ViewTransform {
    this.computeFit();
    const r = this.region();
    const k = this.fitK;
    return { k, x: r.l + (r.w - this.cw * k) / 2, y: r.t + (r.h - this.ch * k) / 2 };
  }

  /** Масштаб в пределах; план меньше области — по центру, больше — не уводится за край дальше SLACK */
  private clampT(t: ViewTransform): ViewTransform {
    const k = clamp(t.k, this.minK(), this.maxK());
    const r = this.region();
    const axis = (pos: number, start: number, size: number, content: number): number =>
      content <= size ? start + (size - content) / 2 : clamp(pos, start + size - content - SLACK, start + SLACK);
    return { k, x: axis(t.x, r.l, r.w, this.cw * k), y: axis(t.y, r.t, r.h, this.ch * k) };
  }

  private toLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.viewport.getBoundingClientRect();
    // Масштаб предков через CSS transform (обычно 1)
    const scale = this.viewport.clientWidth > 0 && rect.width > 0 ? rect.width / this.viewport.clientWidth : 1;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }

  /* ---------- Кадры ---------- */

  private apply(): void {
    const { k, x, y } = this.t;
    this.content.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    this.content.style.setProperty('--inv-k', String(1 / k));
    this.notify(this.transform, this.fitK);
  }

  private animateTo(target: ViewTransform, duration: number): void {
    this.wheel = null;
    this.anim = { from: { ...this.t }, to: this.clampT(target), start: performance.now(), duration };
    this.loop();
  }

  private stopMotion(): void {
    this.anim = null;
    this.wheel = null;
  }

  private loop(): void {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    this.markBusy();
  }

  /** will-change только на время движения: постоянный слой размывает план при увеличении */
  private markBusy(): void {
    this.content.style.willChange = 'transform';
    window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => {
      this.content.style.willChange = 'auto';
    }, 180);
  }

  private readonly tick = (now: number): void => {
    this.frame = 0;
    let running = false;
    if (this.anim) {
      const { from, to, start, duration } = this.anim;
      const p = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(p);
      this.t = { k: from.k + (to.k - from.k) * e, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      if (p < 1) running = true;
      else this.anim = null;
    } else if (this.wheel) {
      const { targetK, sx, sy, gx, gy } = this.wheel;
      let k = this.t.k + (targetK - this.t.k) * WHEEL_EASE;
      if (Math.abs(k - targetK) < targetK * 0.002) {
        k = targetK;
        this.wheel = null;
      } else {
        running = true;
      }
      this.t = this.clampT({ k, x: sx - gx * k, y: sy - gy * k });
    }
    this.apply();
    if (running) this.loop();
  };

  /* ---------- События ---------- */

  private readonly onWheel = (e: WheelEvent): void => {
    // Над карточкой и лотком колесо прокручивает их, а не карту
    if ((e.target as Element | null)?.closest?.('[data-no-wheel]')) return;
    e.preventDefault();
    if (this.vw <= 0) return;
    const local = this.toLocal(e.clientX, e.clientY);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? PINCH_WHEEL_FACTOR : WHEEL_FACTOR));
    const baseK = this.wheel ? this.wheel.targetK : this.t.k;
    const targetK = clamp(baseK * factor, this.minK(), this.maxK());
    this.anim = null;
    this.userMoved = true;
    this.wheel = {
      targetK,
      sx: local.x,
      sy: local.y,
      gx: (local.x - this.t.x) / this.t.k,
      gy: (local.y - this.t.y) / this.t.k,
    };
    this.loop();
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as Element | null)?.closest?.('[data-no-pan]')) return;
    this.suppressClick = false;
    this.pointers.set(e.pointerId, this.toLocal(e.clientX, e.clientY));
    if (this.pointers.size === 1) {
      this.pan = { id: e.pointerId, clientX: e.clientX, clientY: e.clientY, tx: this.t.x, ty: this.t.y, active: false };
    } else if (this.pointers.size === 2) {
      this.startPinch();
    }
  };

  private startPinch(): void {
    const [a, b] = [...this.pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    this.pinch = {
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      k: this.t.k,
      gx: (mid.x - this.t.x) / this.t.k,
      gy: (mid.y - this.t.y) / this.t.k,
    };
    this.pan = null;
    this.stopMotion();
    for (const id of this.pointers.keys()) {
      try {
        this.viewport.setPointerCapture(id);
      } catch {
        // указатель уже отпущен
      }
    }
  }

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, this.toLocal(e.clientX, e.clientY));
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const k = clamp((this.pinch.k * Math.hypot(a.x - b.x, a.y - b.y)) / this.pinch.dist, this.minK(), this.maxK());
      this.t = this.clampT({ k, x: mid.x - this.pinch.gx * k, y: mid.y - this.pinch.gy * k });
      this.userMoved = true;
      this.suppressClick = true;
      this.apply();
      this.markBusy();
      return;
    }
    const pan = this.pan;
    if (!pan || pan.id !== e.pointerId) return;
    const rect = this.viewport.getBoundingClientRect();
    const scale = this.viewport.clientWidth > 0 && rect.width > 0 ? rect.width / this.viewport.clientWidth : 1;
    const dx = (e.clientX - pan.clientX) / scale;
    const dy = (e.clientY - pan.clientY) / scale;
    if (!pan.active) {
      if (Math.hypot(dx, dy) < CLICK_SLOP) return;
      // Захват — только когда это точно перетаскивание: иначе клик по маркеру ушёл бы на фон
      pan.active = true;
      this.stopMotion();
      try {
        this.viewport.setPointerCapture(e.pointerId);
      } catch {
        // указатель уже отпущен
      }
      this.viewport.style.cursor = 'grabbing';
    }
    this.t = this.clampT({ k: this.t.k, x: pan.tx + dx, y: pan.ty + dy });
    this.userMoved = true;
    this.apply();
    this.markBusy();
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (!this.pointers.delete(e.pointerId)) return;
    if (this.pinch && this.pointers.size < 2) {
      this.pinch = null;
      // Один палец остался — продолжаем панораму с текущего места
      const rest = [...this.pointers.entries()][0];
      this.pan = null;
      if (rest) {
        const rect = this.viewport.getBoundingClientRect();
        const scale = this.viewport.clientWidth > 0 && rect.width > 0 ? rect.width / this.viewport.clientWidth : 1;
        this.pan = { id: rest[0], clientX: rect.left + rest[1].x * scale, clientY: rect.top + rest[1].y * scale, tx: this.t.x, ty: this.t.y, active: true };
      }
      return;
    }
    if (this.pan?.id === e.pointerId) {
      if (this.pan.active) this.suppressClick = true;
      this.pan = null;
      this.viewport.style.cursor = '';
    }
  };

  private readonly onClickCapture = (e: MouseEvent): void => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  };

  /** Двойной клик по фону — приблизить к точке */
  private readonly onDoubleClick = (e: MouseEvent): void => {
    if ((e.target as Element | null)?.closest?.('[data-no-pan]')) return;
    const local = this.toLocal(e.clientX, e.clientY);
    const gx = (local.x - this.t.x) / this.t.k;
    const gy = (local.y - this.t.y) / this.t.k;
    const k = clamp(this.t.k * 1.8, this.minK(), this.maxK());
    this.userMoved = true;
    this.animateTo({ k, x: local.x - gx * k, y: local.y - gy * k }, ZOOM_DURATION);
  };
}

/**
 * Подключает масштаб и панораму к области карты. viewportRef — область с событиями (touch-action: none),
 * contentRef — слой плана размером contentWidth × contentHeight, который сдвигается и масштабируется.
 */
export const usePanZoom = (
  viewportRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  { contentWidth, contentHeight, insets, onTransform }: PanZoomOptions,
): PanZoomApi => {
  const engineRef = useRef<PanZoomEngine | null>(null);
  const onTransformRef = useRef(onTransform);

  useEffect(() => {
    onTransformRef.current = onTransform;
  });

  // Слой плана ставится на место до отрисовки — без кадра с неверным масштабом
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const engine = new PanZoomEngine(viewport, content, (t, fitK) => onTransformRef.current?.(t, fitK));
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [viewportRef, contentRef]);

  useLayoutEffect(() => {
    engineRef.current?.setContentSize(contentWidth, contentHeight);
  }, [contentWidth, contentHeight]);

  const { left, right, top, bottom } = insets;
  useEffect(() => {
    engineRef.current?.setInsets({ left, right, top, bottom });
  }, [left, right, top, bottom]);

  return useMemo<PanZoomApi>(
    () => ({
      zoomBy: factor => engineRef.current?.zoomBy(factor),
      fit: animate => engineRef.current?.fit(animate),
      centerOn: (px, py, relZoom) => engineRef.current?.centerOn(px, py, relZoom),
      fitRect: rect => engineRef.current?.fitRect(rect),
      transform: () => engineRef.current?.transform ?? { k: 1, x: 0, y: 0 },
    }),
    [],
  );
};
