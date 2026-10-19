// InteractiveMap.tsx — интерактивная карта цеха: загруженный план или автоматическая схема, маркеры станций
// цвета статуса (не растут с масштабом, нижние поверх верхних), карточка станции при наведении и по клику,
// масштаб и панорама. Руководитель в режиме правки перетаскивает маркеры, достаёт станции из лотка
// «Не размещены» и двигает выбранную станцию стрелками.
import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MapStation, MapStationDynamic, PlanPoint, StationActions } from './types';
import type { SectionNode, WorkshopNode } from './model';
import { stationsWord } from './model';
import type { PlanEditor } from './usePlanEditor';
import { buildIsoScheme } from './isoScheme';
import { usePanZoom } from './usePanZoom';
import type { ViewInsets, ViewTransform } from './usePanZoom';
import { COLORS, FONT, SHADOWS, statusGradient, statusOf } from './theme';
import StationCabinet from './StationCabinet';
import StationCard, { CARD_WIDTH } from './StationCard';
import IsoSchemeSvg from './IsoSchemeSvg';
import { GripIcon, WarningIcon } from './icons';
import { PillButton, Spinner } from './ui';

export interface MapViewHandle {
  zoomBy: (factor: number) => void;
  fit: () => void;
}

interface InteractiveMapProps {
  /** Цех с учётом фильтров страницы: его станции показываются маркерами */
  workshop: WorkshopNode;
  /** Участки цеха без фильтров страницы — по ним строится схема; null — полный состав цеха ещё грузится */
  layoutSections: readonly SectionNode[] | null;
  dynamics: ReadonlyMap<string, MapStationDynamic>;
  editor: PlanEditor;
  isManager: boolean;
  /** Подсвеченный участок (ключ узла дерева) */
  highlightKey: string | null;
  /** «Показать участок» — меняется nonce при каждом выборе в дереве */
  sectionFocus: { key: string; nonce: number } | null;
  /** «Показать станцию» — центрировать и открыть карточку */
  stationFocus: { uid: string; nonce: number } | null;
  actions: StationActions;
  handleRef: React.Ref<MapViewHandle>;
  onStartEdit: () => void;
}

/** Шаг стрелок в режиме правки — 0,2 % плана, с Shift — 1 % */
const NUDGE = 0.002;
const NUDGE_FAST = 0.01;
const DRAG_SLOP = 4;
const TRAY_WIDTH = 236;
/** Подписи станций не должны наезжать друг на друга: ширина и высота подписи на экране, px */
const LABEL_BOX = { w: 84, h: 44 };

const MAP_CSS = `
.sm-marker { position: absolute; width: 0; height: 0; outline: none; cursor: pointer; }
.sm-marker:hover, .sm-marker[data-active="true"], .sm-marker[data-dragging="true"] { z-index: 100000 !important; }
.sm-marker[data-editing="true"] { cursor: grab; }
.sm-marker[data-dragging="true"] { cursor: grabbing; }
.sm-scale { position: absolute; left: 0; top: 0; transform: scale(var(--inv-k, 1)); transform-origin: 0 0; }
.sm-hit { position: absolute; left: -22px; top: -46px; width: 44px; height: 54px; }
.sm-body { position: absolute; left: -13px; top: -33px; transition: transform 0.18s ease, opacity 0.2s ease; }
.sm-marker:hover .sm-body, .sm-marker[data-active="true"] .sm-body, .sm-marker[data-dragging="true"] .sm-body { transform: translateY(-3px); }
.sm-ring { position: absolute; left: -17px; top: -7px; width: 34px; height: 13px; border-radius: 50%; border: 2px solid ${COLORS.accent}; opacity: 0; transition: opacity 0.15s ease; pointer-events: none; }
.sm-marker[data-active="true"] .sm-ring, .sm-marker:focus-visible .sm-ring { opacity: 1; }
.sm-marker[data-editing="true"] .sm-ring { opacity: 0.6; border-style: dashed; }
.sm-marker[data-selected="true"] .sm-ring { opacity: 1; border-style: solid; }
.sm-label { position: absolute; left: 0; top: 5px; transform: translateX(-50%); max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font: 600 10.5px/14px ${FONT}; color: ${COLORS.text}; background: rgba(255, 255, 255, 0.94); padding: 1px 6px; border-radius: 8px;
  box-shadow: 0 1px 4px rgba(45, 64, 89, 0.15); transition: opacity 0.2s ease; pointer-events: none; }
.sm-plan[data-labels="off"] .sm-label { opacity: 0; }
.sm-plan[data-labels="off"] .sm-marker:hover .sm-label,
.sm-plan[data-labels="off"] .sm-marker[data-active="true"] .sm-label,
.sm-plan[data-labels="off"] .sm-marker[data-selected="true"] .sm-label,
.sm-plan[data-labels="off"] .sm-marker[data-alert="true"] .sm-label { opacity: 1; }
.sm-marker[data-dimmed="true"] .sm-scale { opacity: 0.32; }
@keyframes sm-pulse { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(1.7); opacity: 0; } }
.sm-pulse { position: absolute; left: -16px; top: -8px; width: 32px; height: 16px; border-radius: 50%; background: rgba(255, 48, 82, 0.45);
  animation: sm-pulse 1.6s ease-out infinite; pointer-events: none; }
.sm-tray-list::-webkit-scrollbar { width: 6px; }
.sm-tray-list::-webkit-scrollbar-thumb { background: #C9D2E0; border-radius: 3px; }
.sm-tray-item:hover { background-color: ${COLORS.rowHover}; }
`;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const zIndexFor = (y: number): number => 10 + Math.round(y * 10000);

/** Указатель над элементом */
const isOver = (el: HTMLElement | null, clientX: number, clientY: number): boolean => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
};

interface MarkerProps {
  station: MapStation;
  pos: PlanPoint;
  editing: boolean;
  active: boolean;
  selected: boolean;
  dimmed: boolean;
  onHover: (uid: string | null, pointerType: string) => void;
  onActivate: (uid: string) => void;
  onDragStart: (uid: string, event: React.PointerEvent<HTMLDivElement>) => void;
  onDragMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDragEnd: (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => void;
  onKey: (uid: string, event: React.KeyboardEvent<HTMLDivElement>) => void;
}

/** Маркер станции: точка привязки — «пол» станции; размер постоянный при любом масштабе */
const MarkerView = ({ station, pos, editing, active, selected, dimmed, onHover, onActivate, onDragStart, onDragMove, onDragEnd, onKey }: MarkerProps) => {
  const status = statusOf(station.status);
  return (
    <div
      className="sm-marker"
      role="button"
      tabIndex={0}
      aria-label={`Станция ${station.name}`}
      data-uid={station.uid}
      data-editing={editing}
      data-active={active}
      data-selected={selected}
      data-dimmed={dimmed}
      data-alert={status !== 'WORKING' || !!station.hasError}
      data-no-pan={editing ? '' : undefined}
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, zIndex: zIndexFor(pos.y) }}
      onPointerEnter={e => onHover(station.uid, e.pointerType)}
      onPointerLeave={e => onHover(null, e.pointerType)}
      onClick={e => {
        e.stopPropagation();
        if (!editing) onActivate(station.uid);
      }}
      onPointerDown={editing ? e => onDragStart(station.uid, e) : undefined}
      onPointerMove={editing ? onDragMove : undefined}
      onPointerUp={editing ? e => onDragEnd(e, false) : undefined}
      onPointerCancel={editing ? e => onDragEnd(e, true) : undefined}
      onKeyDown={e => onKey(station.uid, e)}
    >
      <div className="sm-scale">
        {status === 'CRITICAL_STOCK' && !editing && <span className="sm-pulse" />}
        <span className="sm-ring" />
        <span className="sm-hit" />
        <div className="sm-body">
          <StationCabinet status={status} hasError={!!station.hasError} />
        </div>
        <div className="sm-label">{station.name}</div>
      </div>
    </div>
  );
};

const Marker = React.memo(MarkerView);

interface TrayProps {
  stations: MapStation[];
  hot: boolean;
  trayRef: React.Ref<HTMLDivElement>;
  onPointerDown: (uid: string, event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => void;
}

/** Лоток «Не размещены»: станции цеха без места на плане; сюда же можно вернуть станцию с плана */
const UnplacedTray: React.FC<TrayProps> = ({ stations, hot, trayRef, onPointerDown, onPointerMove, onPointerUp }) => (
  <motion.div
    ref={trayRef}
    data-no-pan
    data-no-wheel
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 24 }}
    transition={{ duration: 0.22 }}
    style={{
      position: 'absolute',
      top: 12,
      right: 12,
      bottom: 12,
      width: TRAY_WIDTH - 24,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.white,
      borderRadius: 14,
      boxShadow: SHADOWS.tooltip,
      border: hot ? `2px dashed ${COLORS.accent}` : `1px solid ${COLORS.border}`,
      fontFamily: FONT,
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 4px' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Не размещены</span>
      <span
        style={{
          minWidth: 22,
          height: 22,
          padding: '0 7px',
          borderRadius: 11,
          backgroundColor: stations.length ? COLORS.accentSoft : COLORS.pill,
          color: stations.length ? COLORS.accent : COLORS.muted,
          fontSize: 12,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {stations.length}
      </span>
    </div>
    <div style={{ padding: '0 14px 10px', fontSize: 12, lineHeight: '16px', color: hot ? COLORS.accent : COLORS.muted }}>
      {hot ? 'Отпустите — станция уйдёт с плана' : 'Перетащите станцию на план'}
    </div>
    <div className="sm-tray-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 6px 8px' }}>
      {stations.map(station => (
        <div
          key={station.uid}
          className="sm-tray-item"
          title={station.name}
          onPointerDown={e => onPointerDown(station.uid, e)}
          onPointerMove={onPointerMove}
          onPointerUp={e => onPointerUp(e, false)}
          onPointerCancel={e => onPointerUp(e, true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 38,
            padding: '0 8px',
            borderRadius: 9,
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
            transition: 'background-color 0.15s ease',
          }}
        >
          <GripIcon />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: statusGradient(station.status), flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: COLORS.text }}>
            {station.name}
          </span>
        </div>
      ))}
      {stations.length === 0 && !hot && (
        <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: 12, lineHeight: '17px', color: COLORS.muted }}>Все станции цеха на плане</div>
      )}
    </div>
  </motion.div>
);

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  workshop,
  layoutSections,
  dynamics,
  editor,
  isManager,
  highlightKey,
  sectionFocus,
  stationFocus,
  actions,
  handleRef,
  onStartEdit,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cardBoxRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastTRef = useRef<ViewTransform>({ k: 1, x: 0, y: 0 });
  const labelKRef = useRef(0);
  const cardAnchorRef = useRef<{ px: number; py: number } | null>(null);

  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [pinnedUid, setPinnedUid] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [trayHot, setTrayHot] = useState(false);
  const [trayDragUid, setTrayDragUid] = useState<string | null>(null);

  const { plan, editing, positions } = editor;
  const image = plan?.image ?? null;
  const hasImage = image !== null;
  // Схеме нужен полный состав цеха: без него зоны перестроились бы после загрузки
  const ready = !editor.loading && (hasImage || layoutSections !== null);

  // Схема строится и для плана без картинки, и пока план грузится — по всем участкам цеха без фильтров страницы,
  // чтобы зоны и места станций не перестраивались от фильтров; фильтр только скрывает станции
  const shownCounts = useMemo(() => new Map(workshop.sections.map(s => [s.key, s.stations.length] as const)), [workshop.sections]);
  const scheme = useMemo(
    () => (hasImage ? null : buildIsoScheme(layoutSections ?? workshop.sections, shownCounts)),
    [hasImage, layoutSections, workshop.sections, shownCounts],
  );
  const planW = image ? image.width : scheme?.width ?? 1;
  const planH = image ? image.height : scheme?.height ?? 1;

  // Где стоит каждая станция цеха: сохранённая позиция или место на схеме; без места — в лоток
  const { placed, unplaced, posIndex } = useMemo(() => {
    const placedList: { station: MapStation; pos: PlanPoint }[] = [];
    const unplacedList: MapStation[] = [];
    const index = new Map<string, PlanPoint>();
    for (const station of workshop.stations) {
      const pos = positions.get(station.uid) ?? scheme?.spots.get(station.uid);
      if (pos) {
        placedList.push({ station, pos });
        index.set(station.uid, pos);
      } else {
        unplacedList.push(station);
      }
    }
    return { placed: placedList, unplaced: unplacedList, posIndex: index };
  }, [workshop.stations, positions, scheme]);

  const sectionKeyOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of workshop.sections) for (const station of section.stations) map.set(station.uid, section.key);
    return map;
  }, [workshop.sections]);

  // Масштаб, с которого подписи соседних станций не наезжают друг на друга
  const labelK = useMemo(() => {
    let need = 0;
    for (let i = 0; i < placed.length; i++) {
      const a = placed[i].pos;
      for (let j = i + 1; j < placed.length; j++) {
        const b = placed[j].pos;
        const dx = Math.abs(a.x - b.x) * planW;
        const dy = Math.abs(a.y - b.y) * planH;
        const pair = Math.min(dx > 0 ? LABEL_BOX.w / dx : Infinity, dy > 0 ? LABEL_BOX.h / dy : Infinity);
        if (pair > need) need = pair;
      }
    }
    return need;
  }, [placed, planW, planH]);

  const insets = useMemo<ViewInsets>(
    () => ({ left: 0, top: 0, bottom: 0, right: editing && hasImage ? TRAY_WIDTH : 0 }),
    [editing, hasImage],
  );

  /* ---------- Карточка станции ---------- */

  const placeCard = useCallback(() => {
    const box = cardBoxRef.current;
    const anchor = cardAnchorRef.current;
    const viewport = viewportRef.current;
    if (!box || !anchor || !viewport) return;
    const t = lastTRef.current;
    const sx = t.x + anchor.px * t.k;
    const sy = t.y + anchor.py * t.k;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const h = box.offsetHeight || 300;
    let left = sx + 26;
    if (left + CARD_WIDTH > vw - 12) left = sx - 26 - CARD_WIDTH;
    left = Math.max(12, Math.min(vw - CARD_WIDTH - 12, left));
    const top = Math.max(12, Math.min(vh - h - 12, sy - 18 - h / 2));
    box.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }, []);

  const applyLabels = useCallback((t: ViewTransform) => {
    const content = contentRef.current;
    if (content) content.dataset.labels = t.k >= labelKRef.current ? 'on' : 'off';
  }, []);

  const onTransform = useCallback(
    (t: ViewTransform) => {
      lastTRef.current = t;
      applyLabels(t);
      placeCard();
    },
    [applyLabels, placeCard],
  );

  const panZoom = usePanZoom(viewportRef, contentRef, { contentWidth: planW, contentHeight: planH, insets, onTransform });

  useImperativeHandle(handleRef, () => ({ zoomBy: f => panZoom.zoomBy(f), fit: () => panZoom.fit(true) }), [panZoom]);

  useEffect(() => {
    labelKRef.current = labelK;
    applyLabels(lastTRef.current);
  }, [labelK, applyLabels]);

  // Карточка: закреплённая важнее наведённой; в режиме правки карточек нет
  const cardUid = editing ? null : pinnedUid ?? hoveredUid;
  const cardPos = cardUid ? posIndex.get(cardUid) ?? null : null;
  const cardStation = cardUid && cardPos ? workshop.stations.find(s => s.uid === cardUid) ?? null : null;
  const cardPx = cardPos ? cardPos.x * planW : null;
  const cardPy = cardPos ? cardPos.y * planH : null;
  useLayoutEffect(() => {
    cardAnchorRef.current = cardPx !== null && cardPy !== null ? { px: cardPx, py: cardPy } : null;
    placeCard();
  }, [cardUid, cardPx, cardPy, placeCard]);

  // Выбор станции в дереве — открыть её карточку (центрирование — в эффекте ниже)
  const [seenStationFocus, setSeenStationFocus] = useState<number | null>(null);
  if (stationFocus && stationFocus.nonce !== seenStationFocus) {
    setSeenStationFocus(stationFocus.nonce);
    setPinnedUid(stationFocus.uid);
    setSelectedUid(stationFocus.uid);
  }

  const handledStationFocus = useRef<number | null>(null);
  useEffect(() => {
    if (!stationFocus || !ready || handledStationFocus.current === stationFocus.nonce) return;
    const pos = posIndex.get(stationFocus.uid);
    handledStationFocus.current = stationFocus.nonce;
    if (pos) panZoom.centerOn(pos.x * planW, pos.y * planH, 2);
  }, [stationFocus, ready, posIndex, panZoom, planW, planH]);

  // Выбор участка — показать его зону (на схеме) или его станции (на плане)
  const handledSectionFocus = useRef<number | null>(null);
  useEffect(() => {
    if (!sectionFocus || !ready || handledSectionFocus.current === sectionFocus.nonce) return;
    handledSectionFocus.current = sectionFocus.nonce;
    const zone = scheme?.zones.find(z => z.key === sectionFocus.key);
    if (zone) {
      panZoom.fitRect(zone.bounds);
      return;
    }
    const points = placed.filter(p => sectionKeyOf.get(p.station.uid) === sectionFocus.key).map(p => p.pos);
    if (points.length === 0) return;
    const xs = points.map(p => p.x * planW);
    const ys = points.map(p => p.y * planH);
    const pad = 120;
    panZoom.fitRect({
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + 2 * pad,
      h: Math.max(...ys) - Math.min(...ys) + 2 * pad,
    });
  }, [sectionFocus, ready, scheme, placed, sectionKeyOf, panZoom, planW, planH]);

  /* ---------- Наведение и клик ---------- */

  const onHover = useCallback((uid: string | null, pointerType: string) => {
    if (pointerType !== 'mouse') return;
    if (uid) setHoveredUid(uid);
    else setHoveredUid(null);
  }, []);

  const onActivate = useCallback((uid: string) => {
    setPinnedUid(prev => (prev === uid ? null : uid));
  }, []);

  /* ---------- Перетаскивание маркеров (режим правки) ---------- */

  const dragRef = useRef<{
    uid: string;
    pointerId: number;
    startX: number;
    startY: number;
    start: PlanPoint;
    last: PlanPoint;
    moved: boolean;
    overTray: boolean;
    el: HTMLDivElement;
  } | null>(null);

  const onDragStart = useCallback(
    (uid: string, event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const pos = posIndex.get(uid);
      if (!pos) return;
      event.stopPropagation();
      const el = event.currentTarget;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // указатель уже отпущен
      }
      el.focus({ preventScroll: true });
      dragRef.current = { uid, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, start: pos, last: pos, moved: false, overTray: false, el };
      setSelectedUid(uid);
    },
    [posIndex],
  );

  const onDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const content = contentRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !content) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    drag.moved = true;
    // Доли — по экранной рамке самого плана: верно при любом масштабе
    const rect = content.getBoundingClientRect();
    const x = clamp01(drag.start.x + dx / rect.width);
    const y = clamp01(drag.start.y + dy / rect.height);
    drag.last = { x, y };
    drag.el.dataset.dragging = 'true';
    drag.el.style.left = `${x * 100}%`;
    drag.el.style.top = `${y * 100}%`;
    const over = isOver(trayRef.current, event.clientX, event.clientY);
    if (over !== drag.overTray) {
      drag.overTray = over;
      setTrayHot(over);
    }
  }, []);

  const { setPosition } = editor;
  const onDragEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      drag.el.dataset.dragging = 'false';
      setTrayHot(false);
      if (!drag.moved) return;
      if (cancelled) {
        drag.el.style.left = `${drag.start.x * 100}%`;
        drag.el.style.top = `${drag.start.y * 100}%`;
        return;
      }
      drag.el.style.zIndex = String(zIndexFor(drag.last.y));
      setPosition(drag.uid, drag.overTray && hasImage ? null : drag.last);
    },
    [hasImage, setPosition],
  );

  const onKey = useCallback(
    (uid: string, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editing) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setPinnedUid(prev => (prev === uid ? null : uid));
        } else if (event.key === 'Escape') {
          setPinnedUid(null);
        }
        return;
      }
      const pos = posIndex.get(uid);
      if (!pos) return;
      const step = event.shiftKey ? NUDGE_FAST : NUDGE;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        setSelectedUid(uid);
        setPosition(uid, { x: pos.x + move[0], y: pos.y + move[1] });
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        setPosition(uid, null);
      } else if (event.key === 'Escape') {
        setSelectedUid(null);
        (event.currentTarget as HTMLElement).blur();
      }
    },
    [editing, posIndex, setPosition],
  );

  /* ---------- Перетаскивание из лотка на план ---------- */

  const trayDragRef = useRef<{ uid: string; pointerId: number; startX: number; startY: number; moved: boolean; lastX: number; lastY: number } | null>(null);

  const placeGhost = (clientX: number, clientY: number): void => {
    const ghost = ghostRef.current;
    const viewport = viewportRef.current;
    if (!ghost || !viewport) return;
    const rect = viewport.getBoundingClientRect();
    const scale = viewport.clientWidth > 0 ? rect.width / viewport.clientWidth : 1;
    ghost.style.transform = `translate(${(clientX - rect.left) / scale}px, ${(clientY - rect.top) / scale}px)`;
  };

  const onTrayDown = (uid: string, event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // указатель уже отпущен
    }
    trayDragRef.current = { uid, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, lastX: event.clientX, lastY: event.clientY };
  };

  const onTrayMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = trayDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_SLOP) return;
      drag.moved = true;
      setTrayDragUid(drag.uid);
    }
    placeGhost(event.clientX, event.clientY);
  };

  const onTrayUp = (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean): void => {
    const drag = trayDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    trayDragRef.current = null;
    setTrayDragUid(null);
    const content = contentRef.current;
    const viewport = viewportRef.current;
    if (!drag.moved || cancelled || !content || !viewport) return;
    if (isOver(trayRef.current, event.clientX, event.clientY)) return;
    const view = viewport.getBoundingClientRect();
    if (event.clientX < view.left || event.clientX > view.right || event.clientY < view.top || event.clientY > view.bottom) return;
    const rect = content.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPosition(drag.uid, { x, y });
    setSelectedUid(drag.uid);
  };

  // Призрак только что появился — сразу под указатель
  useLayoutEffect(() => {
    const drag = trayDragRef.current;
    if (trayDragUid && drag) placeGhost(drag.lastX, drag.lastY);
  }, [trayDragUid]);

  /* ---------- Разметка ---------- */

  const ghostStation = trayDragUid ? unplaced.find(s => s.uid === trayDragUid) ?? null : null;
  const showTray = editing && hasImage;
  const hiddenCount = !editing && hasImage ? unplaced.length : 0;

  return (
    <div
      ref={viewportRef}
      onClick={() => {
        setPinnedUid(null);
        setSelectedUid(null);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 14,
        backgroundColor: COLORS.canvas,
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        fontFamily: FONT,
      }}
    >
      <style>{MAP_CSS}</style>
      <div
        ref={contentRef}
        className="sm-plan"
        data-labels="on"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: planW,
          height: planH,
          opacity: ready && !(hasImage && !editor.imageSrc) ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        {hasImage
          ? editor.imageSrc && (
              <img
                src={editor.imageSrc}
                alt={`План: ${workshop.name}`}
                draggable={false}
                width={planW}
                height={planH}
                style={{ position: 'absolute', left: 0, top: 0, display: 'block', pointerEvents: 'none', borderRadius: 4, boxShadow: '0 6px 30px rgba(45, 64, 89, 0.12)' }}
              />
            )
          : scheme && <IsoSchemeSvg scheme={scheme} highlightKey={highlightKey} />}
        {ready &&
          placed.map(({ station, pos }) => (
            <Marker
              key={station.uid}
              station={station}
              pos={pos}
              editing={editing}
              active={cardUid === station.uid}
              selected={editing && selectedUid === station.uid}
              dimmed={highlightKey !== null && sectionKeyOf.get(station.uid) !== highlightKey}
              onHover={onHover}
              onActivate={onActivate}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onKey={onKey}
            />
          ))}
      </div>

      {/* Карточка станции — в немасштабируемом слое, следует за маркером */}
      <div
        ref={cardBoxRef}
        data-no-wheel
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 40, pointerEvents: pinnedUid && cardUid === pinnedUid ? 'auto' : 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence>
          {cardStation && (
            <StationCard
              key={cardStation.uid}
              station={cardStation}
              dynamic={dynamics.get(cardStation.uid)}
              pinned={pinnedUid === cardStation.uid}
              actions={actions}
              onClose={() => setPinnedUid(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showTray && (
          <UnplacedTray
            stations={unplaced}
            hot={trayHot}
            trayRef={trayRef}
            onPointerDown={onTrayDown}
            onPointerMove={onTrayMove}
            onPointerUp={onTrayUp}
          />
        )}
      </AnimatePresence>

      {ghostStation && (
        <div ref={ghostRef} style={{ position: 'absolute', left: 0, top: 0, zIndex: 50, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: -13, top: -33, filter: 'drop-shadow(0 6px 10px rgba(45, 64, 89, 0.25))' }}>
            <StationCabinet status={statusOf(ghostStation.status)} hasError={!!ghostStation.hasError} />
          </div>
          <div className="sm-label" style={{ opacity: 1 }}>
            {ghostStation.name}
          </div>
        </div>
      )}

      {/* Подсказки внизу слева */}
      <div style={{ position: 'absolute', left: 14, bottom: 14, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, pointerEvents: 'none' }}>
        {editing && (
          <div style={{ padding: '7px 12px', borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.92)', boxShadow: SHADOWS.button, fontSize: 12, lineHeight: '16px', color: COLORS.muted }}>
            Перетаскивайте станции мышью · стрелки — точнее, с Shift — быстрее · Delete — {hasImage ? 'убрать с плана' : 'вернуть на авто-место'}
          </div>
        )}
        {hiddenCount > 0 && isManager && (
          <div
            data-no-pan
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 6px 6px 12px',
              borderRadius: 12,
              backgroundColor: COLORS.white,
              boxShadow: SHADOWS.tooltip,
              border: `1px solid ${COLORS.border}`,
              fontSize: 13,
              color: COLORS.text,
              pointerEvents: 'auto',
            }}
          >
            <WarningIcon size={16} color={COLORS.warn} />
            {stationsWord(hiddenCount)} не {hiddenCount === 1 ? 'размещена' : 'размещены'} на плане
            <PillButton label="Разместить" height={30} onClick={onStartEdit} />
          </div>
        )}
      </div>

      {(!ready || (hasImage && editor.imageLoading)) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: COLORS.muted, fontSize: 13, pointerEvents: 'none' }}>
          <Spinner size={16} />
          {!ready ? 'Загрузка плана цеха…' : 'Загрузка картинки плана…'}
        </div>
      )}

      {hasImage && editor.imageError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: COLORS.muted, fontSize: 13 }}>
          {editor.imageError}
          <PillButton label="Повторить" onClick={editor.reload} />
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
