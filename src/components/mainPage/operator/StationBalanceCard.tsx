// StationBalanceCard.tsx — карточка «Критические и минимальные остатки по станциям».
// На графике — номенклатура станции с наименьшим остатком; цвет столбика показывает статус
// (красный — критический остаток, оранжевый — минимальный). Полный список открывается по «Подробнее».
// Вариант 'compact' (служба закупа, 7.png) — «трубки» на три видимые станции с горизонтальной прокруткой.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Station, StationBalanceCardProps, StockStatus } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS, STOCK_COLORS, STOCK_LABELS } from './layout';
import { formatCount, isoToRu } from '../shared/format';
import { useProgress } from '../shared/animation';
import { clamp } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';
import DetailsPopup from '../shared/DetailsPopup';
import type { DetailsColumn, DetailsRow } from '../shared/DetailsPopup';

const DEFAULT_TITLE = 'Критические и минимальные остатки по станциям';

/* ---------- Полный вариант: геометрия от «домашней» карточки 1020×443 (локальные координаты, px) ---------- */
const PLOT_LEFT = 60;
const PLOT_RIGHT_INSET = 36; // правый край области столбиков от правого края карточки (984 при ширине 1020)
const PLOT_TOP = 120;
const PLOT_BOTTOM_INSET = 71; // низ столбиков от низа карточки (372 при высоте 443)
const X_LABEL_BOTTOM = 45; // центр подписей станций от низа карточки (398 при высоте 443)
const VALUE_CY = 100;
const BAR_W = 26;
const BAR_R = 8;
const TOOLTIP_W = 274;
const TOOLTIP_H = 146;
const TOOLTIP_GAP = 14;
const TOOLTIP_TAIL = 9;
const TOOLTIP_CLOSE_DELAY = 140;

/* ---------- Компактный вариант (7.png, карточка 410×380) ---------- */
const COMPACT_VISIBLE = 3; // станций в окне прокрутки
const VIEW_SIDE = 6; // поля окна прокрутки слева и справа
const VIEW_TOP = 60; // верх окна прокрутки — под заголовком
const VIEW_BOTTOM_INSET = 30; // низ окна прокрутки от низа карточки — над полосой прокрутки
const TUBE_W = 14;
const TUBE_TOP = 102; // верх трубки
const TUBE_BOTTOM_INSET = 68; // низ трубки от низа карточки (312 при высоте 380)
const TUBE_TRACK = '#F3F5FA';
const TUBE_VALUE_GAP = 15; // центр числа выше верха трубки
const TUBE_LABEL_GAP = 16; // центр подписи станции ниже низа трубки
const SCROLL_SIDE = 30; // полоса прокрутки от левого и правого краёв карточки
const SCROLL_BOTTOM = 22; // верх полосы прокрутки от низа карточки
const SCROLL_H = 4;
const SCROLL_HIT = 6; // невидимый запас по высоте, чтобы по тонкой полосе было легко попасть
const SCROLL_THUMB_MIN = 24;
const SORT_BUTTON = 36;
const SORT_RIGHT = 18; // кнопка сортировки: центр иконки на одной линии с заголовком
const SORT_TOP = 15;
const DRAG_THRESHOLD = 3; // сдвиг мыши, после которого нажатие считается перетаскиванием

/** Цвета заливки трубок компактного варианта */
const COMPACT_COLORS: Record<StockStatus, string> = {
  critical: COLORS.rose,
  minimal: COLORS.apricot,
  normal: COLORS.green,
};

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

type SortKey = 'station' | 'quantity';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'quantity', label: 'По уровню остатка' },
  { key: 'station', label: 'По станции' },
];

/** Ширина всплывающей панели сортировки */
const SORT_PANEL_W = 214;

/** Сокращение статуса, как в подсказке на прототипе */
const STATUS_SHORT: Record<StockStatus, string> = {
  critical: 'КО',
  minimal: 'МО',
  normal: 'Остаток',
};

const statusColor = (status: StockStatus): string => STOCK_COLORS[status] ?? STOCK_COLORS.normal;
const statusLabel = (status: StockStatus): string => STOCK_LABELS[status] ?? STOCK_LABELS.normal;
const compactColor = (status: StockStatus): string => COMPACT_COLORS[status] ?? COMPACT_COLORS.normal;

const DETAILS_COLUMNS: DetailsColumn[] = [
  { key: 'name', label: 'Наименование поля списка', width: 306 },
  { key: 'critical', label: 'Критический остаток', width: 170, align: 'center' },
  { key: 'minimal', label: 'Минимальный остаток', width: 170, align: 'center' },
];

/** Иконка сортировки компактного варианта: три линии убывающей длины */
const SortLinesIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1.5H17M1 7.5H13M1 13.5H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StationBalanceCard: React.FC<StationBalanceCardProps> = ({
  stations,
  period,
  animationKey,
  rect = CARD_RECTS.stations,
  title = DEFAULT_TITLE,
  variant = 'full',
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('station');
  const [sortOpen, setSortOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [detailsKey, setDetailsKey] = useState<string | null>(null);
  // Компактный вариант: положение прокрутки окна и идёт ли перетаскивание
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragging, setDragging] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dragStop = useRef<(() => void) | null>(null);
  const draggingRef = useRef(false);

  const progress = useProgress(animationKey, ANIM.defectBars);
  const compact = variant === 'compact';
  const cardW = rect.w;
  const cardH = rect.h;

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    dragStop.current?.();
  }, []);

  const openTooltip = (key: string) => {
    if (draggingRef.current) return;
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHoverKey(key);
  };

  const scheduleCloseTooltip = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHoverKey(null), TOOLTIP_CLOSE_DELAY);
  };

  const sorted = useMemo<Station[]>(() => {
    const list = [...stations];
    if (sortKey === 'quantity') list.sort((a, b) => a.quantity - b.quantity);
    return list;
  }, [stations, sortKey]);

  const maxQuantity = useMemo(() => sorted.reduce((max, station) => Math.max(max, station.quantity), 0), [sorted]);

  /* Полный вариант: столбики по всей ширине области (у слишком маленькой карточки размеры не уходят в минус) */
  const plotRight = Math.max(PLOT_LEFT, cardW - PLOT_RIGHT_INSET);
  const plotBottom = Math.max(PLOT_TOP, cardH - PLOT_BOTTOM_INSET);
  const plotH = plotBottom - PLOT_TOP;
  const xLabelCy = cardH - X_LABEL_BOTTOM;
  const slotW = sorted.length > 0 ? (plotRight - PLOT_LEFT) / sorted.length : 0;
  const xOf = (index: number): number => PLOT_LEFT + slotW * (index + 0.5);
  const heightOf = (quantity: number): number => (maxQuantity > 0 ? (quantity / maxQuantity) * plotH : 0);

  /* Компактный вариант: окно прокрутки на три станции, координаты внутри окна — от его левого верхнего угла */
  const viewW = Math.max(COMPACT_VISIBLE, cardW - VIEW_SIDE * 2);
  const viewH = Math.max(0, cardH - VIEW_BOTTOM_INSET - VIEW_TOP);
  const slot = viewW / COMPACT_VISIBLE;
  const contentW = Math.max(viewW, sorted.length * slot);
  // Меньше трёх станций — группа по центру окна
  const groupLeft = (contentW - sorted.length * slot) / 2;
  const maxScroll = contentW - viewW;
  const canScroll = maxScroll > 0.5;
  const scroll = clamp(scrollLeft, 0, maxScroll);
  const tubeBottom = Math.max(TUBE_TOP, cardH - TUBE_BOTTOM_INSET);
  const tubeH = tubeBottom - TUBE_TOP;
  const tubeCenterOf = (index: number): number => groupLeft + slot * (index + 0.5);
  const tubeFillOf = (quantity: number): number => (maxQuantity > 0 ? Math.max(0, quantity / maxQuantity) * tubeH : 0);
  const trackW = Math.max(SCROLL_THUMB_MIN, cardW - SCROLL_SIDE * 2);
  const thumbW = canScroll ? Math.min(trackW, Math.max(SCROLL_THUMB_MIN, (trackW * viewW) / contentW)) : trackW;
  const thumbX = canScroll ? ((trackW - thumbW) * scroll) / maxScroll : 0;

  const hoveredIndex = sorted.findIndex(station => station.key === hoverKey);
  const hovered = hoveredIndex >= 0 ? sorted[hoveredIndex] : null;
  const details = detailsKey ? sorted.find(station => station.key === detailsKey) ?? null : null;
  const colorOf = compact ? compactColor : statusColor;

  // Подсказка встаёт над столбиком, хвостик указывает на его середину
  const hoveredCx = hovered
    ? compact
      ? VIEW_SIDE + tubeCenterOf(hoveredIndex) - scroll
      : xOf(hoveredIndex)
    : 0;
  const hoveredTop = hovered
    ? compact
      ? tubeBottom - tubeFillOf(hovered.quantity) * progress
      : plotBottom - heightOf(hovered.quantity) * progress
    : 0;
  // В компактном варианте станция могла уехать из окна прокрутки — тогда подсказку не показываем
  const tooltipShown = hovered !== null && (!compact || (hoveredCx >= VIEW_SIDE && hoveredCx <= VIEW_SIDE + viewW));
  const tooltipAbove = hoveredTop - TOOLTIP_GAP - TOOLTIP_H;
  const tooltipBelow = tooltipAbove < 0;
  const tooltipTop = tooltipBelow ? Math.min(hoveredTop + TOOLTIP_GAP, cardH - TOOLTIP_H) : tooltipAbove;
  const tooltipLeft = clamp(hoveredCx - TOOLTIP_W / 2, 8, cardW - TOOLTIP_W - 8);
  const tailLeft = clamp(hoveredCx - tooltipLeft, 22, TOOLTIP_W - 22);

  const criticalCount = details ? details.items.filter(item => item.status === 'critical').length : 0;
  const minimalCount = details ? details.items.filter(item => item.status === 'minimal').length : 0;

  const detailsRows: DetailsRow[] = (details?.items ?? []).map(item => ({
    key: String(item.id),
    cells: {
      name: item.name,
      critical: item.status === 'critical' ? formatCount(item.quantity) : '',
      minimal: item.status === 'minimal' ? formatCount(item.quantity) : '',
    },
  }));

  /* ---------- Компактный вариант: сортировка и прокрутка ---------- */

  // Кнопка сортировки переключает «по возрастанию остатка» ↔ «как в данных» и возвращает окно к началу
  const toggleCompactSort = () => {
    setSortKey(key => (key === 'quantity' ? 'station' : 'quantity'));
    setHoverKey(null);
    if (viewRef.current) viewRef.current.scrollLeft = 0;
  };

  const handleViewScroll = (event: React.UIEvent<HTMLDivElement>) => setScrollLeft(event.currentTarget.scrollLeft);

  /**
   * Перетаскивание мышью: сдвиг по x (в координатах холста, с учётом CSS-масштаба) переводится в прокрутку окна.
   * Слушатели висят на document до отпускания кнопки; при размонтировании снимаются в эффекте выше.
   */
  const startDrag = (event: React.MouseEvent<HTMLElement>, apply: (view: HTMLDivElement, dx: number, startScroll: number) => void) => {
    const view = viewRef.current;
    if (event.button !== 0 || !view) return;
    event.preventDefault();
    dragStop.current?.();
    const scale = view.offsetWidth > 0 ? view.getBoundingClientRect().width / view.offsetWidth : 1;
    const startX = event.clientX;
    const startScroll = view.scrollLeft;

    const handleMove = (move: MouseEvent) => {
      const dx = (move.clientX - startX) / (scale || 1);
      if (!draggingRef.current) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        draggingRef.current = true;
        setDragging(true);
        setHoverKey(null);
      }
      apply(view, dx, startScroll);
    };
    const stop = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', stop);
      dragStop.current = null;
      if (draggingRef.current) {
        draggingRef.current = false;
        setDragging(false);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', stop);
    dragStop.current = stop;
  };

  // Окно тянется за мышью, как лист
  const handleViewMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canScroll) return;
    startDrag(event, (view, dx, startScroll) => {
      view.scrollLeft = startScroll - dx;
    });
  };

  // Бегунок: его сдвиг пересчитывается в прокрутку пропорционально
  const handleThumbMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const ratio = trackW - thumbW > 0 ? maxScroll / (trackW - thumbW) : 0;
    startDrag(event, (view, dx, startScroll) => {
      view.scrollLeft = startScroll + dx * ratio;
    });
  };

  // Клик по полосе: бегунок встаёт серединой в точку клика
  const handleTrackMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const view = viewRef.current;
    if (event.button !== 0 || !view) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || trackW - thumbW <= 0) return;
    const localX = ((event.clientX - bounds.left) / bounds.width) * trackW;
    view.scrollLeft = clamp((localX - thumbW / 2) / (trackW - thumbW), 0, 1) * maxScroll;
  };

  const sortActive = sortKey === 'quantity';

  return (
    <DashboardCard rect={rect} title={title}>
      {compact ? (
        /* Сортировка компактного варианта: кнопка-иконка переключает порядок станций */
        <button
          type="button"
          onClick={toggleCompactSort}
          aria-label="Сортировка по остатку"
          aria-pressed={sortActive}
          title={sortActive ? 'Показать станции в исходном порядке' : 'Упорядочить станции по остатку'}
          style={{
            position: 'absolute',
            right: SORT_RIGHT,
            top: SORT_TOP,
            width: SORT_BUTTON,
            height: SORT_BUTTON,
            borderRadius: 10,
            border: 'none',
            padding: 0,
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}
        >
          <SortLinesIcon color={sortActive ? COLORS.accent : COLORS.text} />
        </button>
      ) : (
        /* Сортировка столбиков: иконка в шапке карточки и всплывающая панель со списком */
        <div style={{ position: 'absolute', right: 26, top: 22, zIndex: 3, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Стрелка показывается только при открытой панели сортировки */}
          {sortOpen && (
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 1L6 6L1 11" stroke={COLORS.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <button
            type="button"
            onClick={() => setSortOpen(open => !open)}
            aria-label="Сортировка"
            style={{
              width: 24,
              height: 18,
              border: 'none',
              padding: 0,
              background: 'transparent',
              cursor: 'pointer',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5H21M1 7H14M1 12.5H8" stroke={COLORS.accent} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          {sortOpen && (
            <div
              style={{
                // Панель раскрывается влево от иконки, а не под ней
                position: 'absolute',
                right: 'calc(100% + 14px)',
                top: -6,
                width: SORT_PANEL_W,
                padding: '18px 0 12px',
                backgroundColor: COLORS.white,
                borderRadius: 16,
                boxShadow: SHADOWS.tooltip,
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: '18px',
                  color: COLORS.text,
                  paddingBottom: 14,
                }}
              >
                Сортировка
              </div>
              <div style={{ height: 1, margin: '0 22px 6px', backgroundColor: '#E5ECF5' }} />

              {SORT_OPTIONS.map(option => {
                const active = option.key === sortKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setSortKey(option.key);
                      setSortOpen(false);
                      setHoverKey(null);
                    }}
                    style={{
                      position: 'relative',
                      display: 'block',
                      width: '100%',
                      height: 42,
                      textAlign: 'left',
                      padding: '0 22px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: FONT,
                      fontSize: 15,
                      fontWeight: 500,
                      lineHeight: '42px',
                      color: active ? COLORS.accent : '#A8B4C6',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: 11,
                          width: 3,
                          height: 20,
                          borderRadius: 2,
                          backgroundColor: COLORS.accent,
                        }}
                      />
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Легенда статусов (только полный вариант) */}
      {!compact && (
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: 56,
            display: 'flex',
            gap: 22,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: COLORS.textMuted,
            userSelect: 'none',
          }}
        >
          {(['critical', 'minimal'] as StockStatus[]).map(status => (
            <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: statusColor(status) }} />
              {`${statusLabel(status)} остаток`}
            </span>
          ))}
        </div>
      )}

      {compact ? (
        <>
          {/* Окно прокрутки: трубки, числа и подписи. Листается колесом с Shift, перетаскиванием и полосой внизу */}
          <div
            ref={viewRef}
            onScroll={handleViewScroll}
            onMouseDown={handleViewMouseDown}
            style={{
              position: 'absolute',
              left: VIEW_SIDE,
              top: VIEW_TOP,
              width: viewW,
              height: viewH,
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              cursor: canScroll ? (dragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            <svg width={contentW} height={viewH} viewBox={`0 0 ${contentW} ${viewH}`} style={{ display: 'block' }}>
              {sorted.map((station, index) => {
                const cx = tubeCenterOf(index);
                const x = cx - TUBE_W / 2;
                const top = TUBE_TOP - VIEW_TOP;
                const bottom = tubeBottom - VIEW_TOP;
                const fill = tubeFillOf(station.quantity) * progress;
                const dimmed = hoverKey !== null && hoverKey !== station.key;

                return (
                  <g key={station.key} opacity={dimmed ? 0.55 : 1}>
                    {/* Трубка на всю высоту и заливка снизу вверх цветом статуса */}
                    <rect x={x} y={top} width={TUBE_W} height={tubeH} rx={TUBE_W / 2} ry={TUBE_W / 2} fill={TUBE_TRACK} />
                    {fill > 0 && (
                      <rect
                        x={x}
                        y={bottom - fill}
                        width={TUBE_W}
                        height={fill}
                        rx={TUBE_W / 2}
                        ry={TUBE_W / 2}
                        fill={compactColor(station.status)}
                      />
                    )}

                    <text
                      x={cx}
                      y={top - TUBE_VALUE_GAP}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={14}
                      fontWeight={500}
                      fill={COLORS.text}
                      style={TEXT_STYLE}
                    >
                      {formatCount(station.quantity * progress)}
                    </text>

                    <text
                      x={cx}
                      y={bottom + TUBE_LABEL_GAP}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={500}
                      fill={COLORS.textMuted}
                      style={TEXT_STYLE}
                    >
                      {station.name}
                    </text>
                  </g>
                );
              })}

              {/* Прозрачные области наведения — на всю высоту окна */}
              {sorted.map((station, index) => (
                <rect
                  key={`hit-${station.key}`}
                  x={tubeCenterOf(index) - slot / 2}
                  y={0}
                  width={slot}
                  height={viewH}
                  fill="transparent"
                  pointerEvents="all"
                  onMouseEnter={() => openTooltip(station.key)}
                  onMouseLeave={scheduleCloseTooltip}
                />
              ))}
            </svg>
          </div>

          {/* Тонкая полоса прокрутки: клик по полосе переносит бегунок, бегунок тянется мышью */}
          {canScroll && (
            <div
              onMouseDown={handleTrackMouseDown}
              style={{
                position: 'absolute',
                left: SCROLL_SIDE,
                top: cardH - SCROLL_BOTTOM - SCROLL_HIT,
                width: trackW,
                height: SCROLL_H + SCROLL_HIT * 2,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: SCROLL_HIT,
                  width: trackW,
                  height: SCROLL_H,
                  borderRadius: SCROLL_H / 2,
                  backgroundColor: COLORS.track,
                }}
              />
              <div
                onMouseDown={handleThumbMouseDown}
                style={{
                  position: 'absolute',
                  left: thumbX,
                  top: 0,
                  width: thumbW,
                  height: SCROLL_H + SCROLL_HIT * 2,
                  cursor: dragging ? 'grabbing' : 'grab',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: SCROLL_HIT,
                    width: thumbW,
                    height: SCROLL_H,
                    borderRadius: SCROLL_H / 2,
                    backgroundColor: COLORS.text,
                  }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <svg
          width={cardW}
          height={cardH}
          viewBox={`0 0 ${cardW} ${cardH}`}
          style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
        >
          {sorted.map((station, index) => {
            const cx = xOf(index);
            const x = cx - BAR_W / 2;
            const fullHeight = heightOf(station.quantity);
            const height = fullHeight * progress;
            const top = plotBottom - height;
            const dimmed = hoverKey !== null && hoverKey !== station.key;

            return (
              <g key={station.key} opacity={dimmed ? 0.55 : 1}>
                {/* Дорожка на всю высоту и заполнение снизу вверх */}
                <rect x={x} y={PLOT_TOP} width={BAR_W} height={plotH} rx={BAR_R} ry={BAR_R} fill={COLORS.track} opacity={0.65} />
                {height > 0 && <rect x={x} y={top} width={BAR_W} height={height} rx={BAR_R} ry={BAR_R} fill={statusColor(station.status)} />}

                <text
                  x={cx}
                  y={VALUE_CY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={15}
                  fontWeight={600}
                  fill={COLORS.valueText}
                  style={TEXT_STYLE}
                >
                  {formatCount(station.quantity * progress)}
                </text>

                <text
                  x={cx}
                  y={xLabelCy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={500}
                  fill={COLORS.textMuted}
                  style={TEXT_STYLE}
                >
                  {station.name}
                </text>
              </g>
            );
          })}

          {/* Прозрачные области наведения */}
          {sorted.map((station, index) => (
            <rect
              key={`hit-${station.key}`}
              x={xOf(index) - slotW / 2}
              y={PLOT_TOP}
              width={slotW}
              height={plotH}
              fill="transparent"
              pointerEvents="all"
              onMouseEnter={() => openTooltip(station.key)}
              onMouseLeave={scheduleCloseTooltip}
            />
          ))}
        </svg>
      )}

      {/* Подсказка по станции с кнопкой «Подробнее» */}
      {hovered && tooltipShown && (
        <div
          onMouseEnter={() => openTooltip(hovered.key)}
          onMouseLeave={scheduleCloseTooltip}
          style={{
            position: 'absolute',
            left: tooltipLeft,
            top: tooltipTop,
            width: TOOLTIP_W,
            height: TOOLTIP_H,
            padding: '14px 20px',
            boxSizing: 'border-box',
            backgroundColor: COLORS.white,
            borderRadius: 12,
            boxShadow: SHADOWS.tooltip,
            zIndex: 4,
            fontFamily: FONT,
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 500, lineHeight: '15px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
            {`Период: ${isoToRu(period.from)} - ${isoToRu(period.to)}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '16px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
            {hovered.name}
          </div>

          {/* Номенклатура с наименьшим остатком и её статус */}
          <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                lineHeight: '16px',
                color: COLORS.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 152,
              }}
            >
              {hovered.nomName ?? 'Нет номенклатуры'}
            </span>
            <span style={{ flex: 1, borderBottom: '1px dashed #C3CEDC', transform: 'translateY(-3px)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: '16px', color: colorOf(hovered.status), whiteSpace: 'nowrap' }}>
              {`${STATUS_SHORT[hovered.status]}: ${formatCount(hovered.quantity)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDetailsKey(hovered.key)}
            style={{
              marginTop: 'auto',
              height: 32,
              padding: '0 22px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Подробнее
          </button>

          {/* Хвостик, указывающий на столбик */}
          <span
            style={{
              position: 'absolute',
              left: tailLeft - TOOLTIP_TAIL,
              [tooltipBelow ? 'bottom' : 'top']: '100%',
              width: 0,
              height: 0,
              borderLeft: `${TOOLTIP_TAIL}px solid transparent`,
              borderRight: `${TOOLTIP_TAIL}px solid transparent`,
              ...(tooltipBelow
                ? { borderBottom: `${TOOLTIP_TAIL}px solid ${COLORS.white}` }
                : { borderTop: `${TOOLTIP_TAIL}px solid ${COLORS.white}` }),
            }}
          />
        </div>
      )}

      <DetailsPopup
        isOpen={details !== null}
        title={details ? `Уровень остатка номенклатуры на станции: ${details.name}` : ''}
        subtitles={
          details
            ? [
                `Количество позиций критического остатка номенклатуры на станции: ${criticalCount}`,
                `Количество позиций минимального остатка номенклатуры на станции: ${minimalCount}`,
              ]
            : undefined
        }
        columns={DETAILS_COLUMNS}
        rows={detailsRows}
        onClose={() => setDetailsKey(null)}
      />
    </DashboardCard>
  );
};

export default StationBalanceCard;
