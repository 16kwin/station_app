// StationBalanceCard.tsx — карточка «Критические и минимальные остатки по станциям».
// На графике — номенклатура станции с наименьшим остатком; цвет столбика показывает статус
// (красный — критический остаток, оранжевый — минимальный). Полный список открывается по «Подробнее».
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Station, StationBalanceCardProps, StockStatus } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS, STOCK_COLORS, STOCK_LABELS } from './layout';
import { formatCount, isoToRu } from '../shared/format';
import { useProgress } from '../shared/animation';
import { clamp } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';
import DetailsPopup from '../shared/DetailsPopup';
import type { DetailsColumn, DetailsRow } from '../shared/DetailsPopup';

/* ---------- Геометрия (локальные координаты карточки, px) ---------- */
const CARD_W = CARD_RECTS.stations.w; // 1020
const CARD_H = CARD_RECTS.stations.h; // 443
const PLOT_LEFT = 60;
const PLOT_RIGHT = 984;
const PLOT_TOP = 120;
const PLOT_BOTTOM = 372;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;
const X_LABEL_CY = 398;
const VALUE_CY = 100;
const BAR_W = 26;
const BAR_R = 8;
const TOOLTIP_W = 274;
const TOOLTIP_H = 146;
const TOOLTIP_GAP = 14;
const TOOLTIP_TAIL = 9;
const TOOLTIP_CLOSE_DELAY = 140;

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

const DETAILS_COLUMNS: DetailsColumn[] = [
  { key: 'name', label: 'Наименование поля списка', width: 306 },
  { key: 'critical', label: 'Критический остаток', width: 170, align: 'center' },
  { key: 'minimal', label: 'Минимальный остаток', width: 170, align: 'center' },
];

const StationBalanceCard: React.FC<StationBalanceCardProps> = ({ stations, period, animationKey }) => {
  const [sortKey, setSortKey] = useState<SortKey>('station');
  const [sortOpen, setSortOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [detailsKey, setDetailsKey] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  const progress = useProgress(animationKey, ANIM.defectBars);

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  const openTooltip = (key: string) => {
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

  const slotW = sorted.length > 0 ? (PLOT_RIGHT - PLOT_LEFT) / sorted.length : 0;
  const xOf = (index: number): number => PLOT_LEFT + slotW * (index + 0.5);
  const heightOf = (quantity: number): number => (maxQuantity > 0 ? (quantity / maxQuantity) * PLOT_H : 0);

  const hoveredIndex = sorted.findIndex(station => station.key === hoverKey);
  const hovered = hoveredIndex >= 0 ? sorted[hoveredIndex] : null;
  const details = detailsKey ? sorted.find(station => station.key === detailsKey) ?? null : null;

  // Подсказка встаёт над столбиком, хвостик указывает на его середину
  const hoveredCx = hovered ? xOf(hoveredIndex) : 0;
  const hoveredTop = hovered ? PLOT_BOTTOM - heightOf(hovered.quantity) * progress : 0;
  const tooltipAbove = hoveredTop - TOOLTIP_GAP - TOOLTIP_H;
  const tooltipBelow = tooltipAbove < 0;
  const tooltipTop = tooltipBelow ? Math.min(hoveredTop + TOOLTIP_GAP, CARD_H - TOOLTIP_H) : tooltipAbove;
  const tooltipLeft = clamp(hoveredCx - TOOLTIP_W / 2, 8, CARD_W - TOOLTIP_W - 8);
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

  return (
    <DashboardCard rect={CARD_RECTS.stations} title="Критические и минимальные остатки по станциям">
      {/* Сортировка столбиков: иконка в шапке карточки и всплывающая панель со списком */}
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

      {/* Легенда статусов */}
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

      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        {sorted.map((station, index) => {
          const cx = xOf(index);
          const x = cx - BAR_W / 2;
          const fullHeight = heightOf(station.quantity);
          const height = fullHeight * progress;
          const top = PLOT_BOTTOM - height;
          const dimmed = hoverKey !== null && hoverKey !== station.key;

          return (
            <g key={station.key} opacity={dimmed ? 0.55 : 1}>
              {/* Дорожка на всю высоту и заполнение снизу вверх */}
              <rect x={x} y={PLOT_TOP} width={BAR_W} height={PLOT_H} rx={BAR_R} ry={BAR_R} fill={COLORS.track} opacity={0.65} />
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
                y={X_LABEL_CY}
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
            height={PLOT_H}
            fill="transparent"
            pointerEvents="all"
            onMouseEnter={() => openTooltip(station.key)}
            onMouseLeave={scheduleCloseTooltip}
          />
        ))}
      </svg>

      {/* Подсказка по станции с кнопкой «Подробнее» */}
      {hovered && (
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
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: '16px', color: statusColor(hovered.status), whiteSpace: 'nowrap' }}>
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
