// DefectRateCard.tsx — карточка «Уровень брака»: два вида (по деталям / по подразделениям),
// столбики растут снизу вверх, часть выше среднего уровня брака по предприятию окрашивается в красный.
// По наведению — всплывающая подсказка с кнопкой «Подробнее», по кнопке — окно со списком.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DefectItem, DefectRateCardProps, DefectSubject, DefectView, DefectViewKind } from './types';
import { ANIM, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { formatCount, formatPercentInt, isoToRu } from '../shared/format';
import { useProgress } from '../shared/animation';
import { clamp } from '../shared/chart';
import DashboardCard from '../shared/DashboardCard';
import DetailsPopup from '../shared/DetailsPopup';
import type { DetailsColumn, DetailsRow } from '../shared/DetailsPopup';

/* ---------- Геометрия карточки (локальные координаты, px) ---------- */
const CARD_W = CARD_RECTS.defects.w; // 1000
const CARD_H = CARD_RECTS.defects.h; // 343
const PLOT_LEFT = 78;
const PLOT_RIGHT = 972;
const PLOT_TOP = 82;
const PLOT_BOTTOM = 272;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;
const Y_LABEL_RIGHT = 66;
const X_LABEL_CY = 298;
const BAR_W = 38;
/** Скругление столбика — мягкий прямоугольник, а не «пилюля» */
const BAR_R = 8;
const AXIS_STEPS = [0, 20, 40, 60, 80, 100];
const TOOLTIP_GAP = 12;
const TOOLTIP_CLOSE_DELAY = 140; // мс — чтобы успеть довести курсор до кнопки «Подробнее»
const MAX_TOOLTIP_ROWS = 4;

const TEXT_STYLE: React.CSSProperties = { fontFamily: FONT, userSelect: 'none' };

/** Текст подсказки у столбика, превысившего средний уровень брака по предприятию */
const OVER_AVERAGE_HINT = 'Превышает средний уровень брака по предприятию';

interface ViewMeta {
  title: string;
  tab: string;
  filterLabel: string;
  detailsTitle: string;
  /** Столбик до линии среднего уровня */
  bar: string;
  /** Часть столбика выше линии среднего уровня */
  barOver: string;
  /** Сама линия среднего уровня */
  line: string;
}

/** Подписи и палитра вида графика: у видов разные пары цветов, смысл тот же */
const VIEW_META: Record<DefectViewKind, ViewMeta> = {
  parts: {
    title: 'Уровень брака по деталям',
    tab: 'По деталям',
    filterLabel: 'подразделение',
    detailsTitle: 'Уровень брака по детали',
    bar: COLORS.defectBar,
    barOver: COLORS.defectBarOver,
    line: COLORS.defectAvgLine,
  },
  workshops: {
    title: 'Уровень брака по подразделениям',
    tab: 'По подразделениям',
    filterLabel: 'номенклатуру',
    detailsTitle: 'Уровень брака по подразделению',
    bar: COLORS.defectBarAlt,
    barOver: COLORS.defectBarAltOver,
    line: COLORS.defectAvgLineAlt,
  },
};

const safePercent = (value: number): number => (Number.isFinite(value) ? clamp(value, 0, 100) : 0);

/** Столбик после применения фильтра: показываем либо весь субъект, либо один элемент раскрытия */
interface Bar {
  key: string;
  name: string;
  released: number;
  defect: number;
  percent: number;
  items: DefectItem[];
}

/** Данные вида с учётом выбранного элемента раскрытия: пересчитываются выпуск, брак и средний уровень */
const applyFilter = (view: DefectView, itemKey: string | null): { bars: Bar[]; average: number } => {
  const subjects: DefectSubject[] = view.subjects ?? [];

  if (!itemKey) {
    const bars = subjects.map(subject => ({
      key: subject.key,
      name: subject.name,
      released: subject.released,
      defect: subject.defect,
      percent: safePercent(subject.percent),
      items: subject.items ?? [],
    }));
    return { bars, average: safePercent(view.averagePercent) };
  }

  let released = 0;
  let defect = 0;
  const bars = subjects.map(subject => {
    const item = (subject.items ?? []).find(row => row.key === itemKey);
    released += item?.released ?? 0;
    defect += item?.defect ?? 0;
    return {
      key: subject.key,
      name: subject.name,
      released: item?.released ?? 0,
      defect: item?.defect ?? 0,
      percent: safePercent(item?.percent ?? 0),
      items: item ? [item] : [],
    };
  });
  return { bars, average: released > 0 ? safePercent((defect / released) * 100) : 0 };
};

/** Все элементы раскрытия вида в порядке первого появления — список для фильтра */
const collectItems = (view: DefectView): { key: string; name: string }[] => {
  const seen = new Map<string, string>();
  for (const subject of view.subjects ?? []) {
    for (const item of subject.items ?? []) {
      if (!seen.has(item.key)) seen.set(item.key, item.name);
    }
  }
  return Array.from(seen, ([key, name]) => ({ key, name }));
};

const DefectRateCard: React.FC<DefectRateCardProps> = ({ parts, workshops, from, to, animationKey }) => {
  const [viewKind, setViewKind] = useState<DefectViewKind>('parts');
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [detailsKey, setDetailsKey] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const rawId = useId();
  const clipId = `qlt-defect-clip-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const progress = useProgress(animationKey, ANIM.defectBars);

  const view = viewKind === 'parts' ? parts : workshops;
  const meta = VIEW_META[viewKind];
  const filterItems = useMemo(() => collectItems(view), [view]);
  const { bars, average } = useMemo(() => applyFilter(view, filterKey), [view, filterKey]);

  // Смена вида сбрасывает фильтр и подсказку: списки элементов у видов разные
  useEffect(() => {
    setFilterKey(null);
    setFilterOpen(false);
    setHoverKey(null);
  }, [viewKind]);

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

  const yOf = (percent: number): number => PLOT_BOTTOM - (safePercent(percent) / 100) * PLOT_H;
  const slotW = bars.length > 0 ? (PLOT_RIGHT - PLOT_LEFT) / bars.length : 0;
  const xOf = (index: number): number => PLOT_LEFT + slotW * (index + 0.5);
  const averageY = yOf(average);

  const hoveredIndex = bars.findIndex(bar => bar.key === hoverKey);
  const hovered = hoveredIndex >= 0 ? bars[hoveredIndex] : null;
  const details = detailsKey ? bars.find(bar => bar.key === detailsKey) ?? null : null;

  const filterName = filterKey ? filterItems.find(item => item.key === filterKey)?.name ?? 'Все' : 'Все';

  /* ---------- Всплывающая подсказка ---------- */
  const tooltipRows = hovered ? hovered.items.slice(0, MAX_TOOLTIP_ROWS) : [];
  const tooltipWidth = viewKind === 'parts' ? 276 : 300;
  const tooltipHeight = viewKind === 'parts' ? 116 : 62 + Math.max(1, tooltipRows.length) * 22 + 46;
  const hoveredTop = hovered ? yOf(hovered.percent * progress) : 0;
  const tooltipAbove = hoveredTop - TOOLTIP_GAP - tooltipHeight;
  const tooltipTop = tooltipAbove >= 0 ? tooltipAbove : Math.min(hoveredTop + TOOLTIP_GAP, CARD_H - tooltipHeight);
  const tooltipLeft = hovered ? clamp(xOf(hoveredIndex) - tooltipWidth / 2, 8, CARD_W - tooltipWidth - 8) : 0;

  /* ---------- Окно «Подробнее» ---------- */
  const detailsColumns: DetailsColumn[] =
    viewKind === 'parts'
      ? [
          { key: 'name', label: 'Наименование поля списка', width: 446 },
          { key: 'defect', label: 'Количество брака', width: 200, align: 'center' },
        ]
      : [
          { key: 'name', label: 'Наименование поля списка', width: 306 },
          { key: 'percent', label: 'Доля брака', width: 140, align: 'center' },
          { key: 'defect', label: ['Количество брака', 'Выпуск всего'], width: 200, align: 'center' },
        ];

  const detailsRows: DetailsRow[] = (details?.items ?? []).map(item => ({
    key: item.key,
    cells:
      viewKind === 'parts'
        ? { name: item.name, defect: formatCount(item.defect) }
        : {
            name: item.name,
            percent: formatPercentInt(item.percent),
            defect: `${formatCount(item.defect)}/${formatCount(item.released)}`,
          },
  }));

  const detailsSubtitles = details
    ? viewKind === 'parts'
      ? [`Общее количество брака по детали: ${formatCount(details.defect)}`]
      : [`Средний уровень брака по подразделению: ${formatPercentInt(details.percent)}`]
    : undefined;

  // Значок с пояснением показываем только у столбика, перешагнувшего средний уровень по предприятию
  const detailsHint = details && details.percent > average ? OVER_AVERAGE_HINT : undefined;

  return (
    <DashboardCard rect={CARD_RECTS.defects} title={meta.title}>
      {/* Вкладки вида графика */}
      <div style={{ position: 'absolute', left: 430, top: 20, display: 'flex', gap: 24, zIndex: 2 }}>
        {(['parts', 'workshops'] as DefectViewKind[]).map(kind => {
          const active = kind === viewKind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setViewKind(kind)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0 0 6px',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                lineHeight: '17px',
                color: active ? COLORS.accent : COLORS.textMuted,
                borderBottom: `2px solid ${active ? COLORS.accent : 'transparent'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {VIEW_META[kind].tab}
            </button>
          );
        })}
      </div>

      {/* Фильтр по элементу раскрытия */}
      <div style={{ position: 'absolute', right: 28, top: 16, zIndex: 3 }}>
        <button
          type="button"
          onClick={() => setFilterOpen(open => !open)}
          aria-label={`Выбрать ${meta.filterLabel}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 32,
            maxWidth: 220,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid #E5ECF5',
            backgroundColor: COLORS.white,
            cursor: 'pointer',
            outline: 'none',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: COLORS.text,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{filterName}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 1L5 5L9 1" stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {filterOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 38,
              width: 260,
              maxHeight: 240,
              overflowY: 'auto',
              backgroundColor: COLORS.white,
              borderRadius: 10,
              boxShadow: SHADOWS.tooltip,
              border: '1px solid #E5ECF5',
              padding: 6,
            }}
          >
            {[{ key: null as string | null, name: 'Все' }, ...filterItems].map(item => {
              const active = item.key === filterKey;
              return (
                <button
                  key={item.key ?? 'all'}
                  type="button"
                  onClick={() => {
                    setFilterKey(item.key);
                    setFilterOpen(false);
                    setHoverKey(null);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 10px',
                    border: 'none',
                    borderRadius: 8,
                    backgroundColor: active ? 'rgba(102, 110, 254, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: FONT,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? COLORS.accent : COLORS.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Красной рисуется только часть столбика выше среднего уровня брака */}
          <clipPath id={clipId}>
            <rect x={0} y={0} width={CARD_W} height={Math.max(0, averageY)} />
          </clipPath>
        </defs>

        {/* Сетка и подписи оси Y */}
        {AXIS_STEPS.map(step => {
          const y = yOf(step);
          return (
            <g key={step}>
              <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={y} y2={y} stroke={COLORS.grid} strokeWidth={1} strokeLinecap="round" />
              <text
                x={Y_LABEL_RIGHT}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={500}
                fill={COLORS.textMuted}
                style={TEXT_STYLE}
              >
                {step === 0 ? '0' : `${step}%`}
              </text>
            </g>
          );
        })}

        {/* Столбики: оранжевые до линии среднего, красные выше неё */}
        {bars.map((bar, index) => {
          const cx = xOf(index);
          const top = yOf(bar.percent * progress);
          const height = Math.max(0, PLOT_BOTTOM - top);
          const x = cx - BAR_W / 2;
          const dimmed = hoverKey !== null && hoverKey !== bar.key;

          return (
            <g key={bar.key} opacity={dimmed ? 0.55 : 1}>
              {height > 0 && (
                <>
                  <rect x={x} y={top} width={BAR_W} height={height} rx={BAR_R} ry={BAR_R} fill={meta.bar} />
                  <g clipPath={`url(#${clipId})`}>
                    <rect x={x} y={top} width={BAR_W} height={height} rx={BAR_R} ry={BAR_R} fill={meta.barOver} />
                  </g>
                </>
              )}
              {/* Обводка наведённого столбика */}
              {hoverKey === bar.key && height > 0 && (
                <rect
                  x={x - 3}
                  y={top - 3}
                  width={BAR_W + 6}
                  height={height + 6}
                  rx={BAR_R + 3}
                  ry={BAR_R + 3}
                  fill="none"
                  stroke={meta.line}
                  strokeWidth={1.5}
                />
              )}
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
                {bar.name}
              </text>
            </g>
          );
        })}

        {/* Линия среднего уровня брака по предприятию */}
        <line
          x1={PLOT_LEFT}
          x2={PLOT_RIGHT}
          y1={averageY}
          y2={averageY}
          stroke={COLORS.defectAvgLine}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <text
          x={PLOT_LEFT + 6}
          y={averageY - 8}
          textAnchor="start"
          fontSize={11}
          fontWeight={500}
          fill={COLORS.textMuted}
          style={TEXT_STYLE}
        >
          {`Средний уровень брака по предприятию ${formatPercentInt(average)}`}
        </text>

        {/* Прозрачные области наведения по столбикам */}
        {bars.map((bar, index) => (
          <rect
            key={`hit-${bar.key}`}
            x={xOf(index) - slotW / 2}
            y={PLOT_TOP}
            width={slotW}
            height={PLOT_BOTTOM - PLOT_TOP}
            fill="transparent"
            pointerEvents="all"
            onMouseEnter={() => openTooltip(bar.key)}
            onMouseLeave={scheduleCloseTooltip}
          />
        ))}
      </svg>

      {/* Подсказка по столбику с кнопкой «Подробнее» */}
      {hovered && (
        <div
          onMouseEnter={() => openTooltip(hovered.key)}
          onMouseLeave={scheduleCloseTooltip}
          style={{
            position: 'absolute',
            left: tooltipLeft,
            top: tooltipTop,
            width: tooltipWidth,
            height: tooltipHeight,
            padding: '14px 18px',
            boxSizing: 'border-box',
            backgroundColor: COLORS.white,
            borderRadius: 12,
            boxShadow: SHADOWS.tooltip,
            zIndex: 4,
            fontFamily: FONT,
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {viewKind === 'parts' ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: '15px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                {`Период: ${isoToRu(from)} - ${isoToRu(to)}`}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '17px', color: COLORS.text, whiteSpace: 'nowrap' }}>
                  {hovered.name}
                </span>
                <span style={{ flex: 1, height: 1, backgroundColor: '#E5ECF5' }} />
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '17px', color: meta.barOver, whiteSpace: 'nowrap' }}>
                  {formatCount(hovered.defect)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {tooltipRows.length === 0 && (
                <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '17px', color: COLORS.textMuted }}>Брака нет</div>
              )}
              {tooltipRows.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: '17px',
                      color: COLORS.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: '17px', color: COLORS.text, whiteSpace: 'nowrap' }}>
                    {formatPercentInt(item.percent)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: '17px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                    {`${formatCount(item.defect)}/${formatCount(item.released)}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setDetailsKey(hovered.key)}
            style={{
              alignSelf: 'center',
              marginTop: 'auto',
              height: 30,
              padding: '0 18px',
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
        </div>
      )}

      <DetailsPopup
        isOpen={details !== null}
        title={details ? `${meta.detailsTitle}: ${details.name}` : ''}
        subtitles={detailsSubtitles}
        hint={detailsHint}
        columns={detailsColumns}
        rows={detailsRows}
        onClose={() => setDetailsKey(null)}
      />
    </DashboardCard>
  );
};

export default DefectRateCard;
