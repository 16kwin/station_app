// PurchaseGraphCard.tsx — мини-карточка «Граф закупок» на панели аудитора (9.png): самая
// подозрительная позиция периода, её поставщики и их аффилированность; кнопка «развернуть»
// открывает полную страницу графа в новой вкладке.
import React, { useEffect, useMemo, useState } from 'react';
import DashboardCard from '../shared/DashboardCard';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import type { CardRect } from '../shared/layout';
import type { DateRange } from '../shared/types';
import { fetchPurchaseGraph } from './api';
import GraphView from './GraphView';
import { ExpandIcon } from './icons';
import { CARD_GRAPH_PADDING, CARD_GRAPH_TOP } from './layout';
import { buildGraph, nomNodeId, pickFocusKey } from './model';
import { DEFAULT_DISPLAY, DEFAULT_FILTERS, DEFAULT_FORCES } from './settings';
import type { GraphDisplay, GraphInsets, PurchaseGraphData } from './types';

interface PurchaseGraphCardProps {
  rect: CardRect;
  range: DateRange;
  /** Начальные данные (проверки); запрос за период всё равно выполняется */
  initialData?: PurchaseGraphData | null;
}

/** Как в 9.png: подписи и цены всегда видны, без стрелок */
const COMPACT_DISPLAY: GraphDisplay = { ...DEFAULT_DISPLAY, arrows: false, prices: true };
const COMPACT_INSETS: GraphInsets = {
  left: CARD_GRAPH_PADDING,
  right: CARD_GRAPH_PADDING,
  top: CARD_GRAPH_PADDING,
  bottom: CARD_GRAPH_PADDING,
};

const PurchaseGraphCard: React.FC<PurchaseGraphCardProps> = ({ rect, range, initialData = null }) => {
  const [data, setData] = useState<PurchaseGraphData | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  // «Разлёт» графа — по своим данным, а не по ключу панели: иначе граф, пришедший раньше
  // остальных запросов аудитора, разлетался бы второй раз
  const [loadCount, setLoadCount] = useState(0);
  const requestKey = `${range.from}|${range.to}`;
  const loading = settledKey !== requestKey;

  // Свой запрос за период: панель аудитора передаёт только диапазон
  useEffect(() => {
    let cancelled = false;
    fetchPurchaseGraph(range)
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setSettledKey(requestKey);
        setLoadCount(count => count + 1);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Не удалось загрузить граф');
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [range, requestKey]);

  // Фокус — позиция с наибольшим «счётом подозрительности» за период
  const focusKey = useMemo(() => (data ? pickFocusKey(data) : null), [data]);
  const model = useMemo(
    () =>
      data && focusKey
        ? buildGraph(data, {
            limitPercent: data.limitPercent,
            filters: DEFAULT_FILTERS,
            groups: [],
            nomSelection: null,
            supplierSelection: null,
            focusKey,
            showVolumes: false,
          })
        : null,
    [data, focusKey],
  );

  const openFullGraph = () => {
    const params = new URLSearchParams();
    if (focusKey) params.set('focus', focusKey);
    params.set('from', range.from);
    params.set('to', range.to);
    window.open(`/screen/purchase-graph?${params.toString()}`, '_blank', 'noopener');
  };

  const message = error && !data ? error : !data ? (loading ? 'Загрузка…' : null) : !model ? 'Нет закупок за период' : null;

  return (
    <DashboardCard rect={rect} title="Граф закупок">
      <div style={{ position: 'absolute', left: 0, right: 0, top: CARD_GRAPH_TOP, bottom: 0, borderRadius: '0 0 15px 15px' }}>
        {model && model.nodes.length > 0 && (
          <GraphView
            model={model}
            mode="compact"
            display={COMPACT_DISPLAY}
            forces={DEFAULT_FORCES}
            explodeKey={loadCount}
            fitKey={focusKey ?? ''}
            insets={COMPACT_INSETS}
            hubId={focusKey ? nomNodeId(focusKey) : null}
          />
        )}
      </div>

      {message && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: CARD_GRAPH_TOP,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: error && !data ? COLORS.roseDark : COLORS.textMuted,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        aria-label="Открыть граф закупок"
        title="Открыть граф закупок в новой вкладке"
        onClick={openFullGraph}
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
          width: 36,
          height: 36,
          padding: 0,
          border: 'none',
          borderRadius: 10,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.button,
          color: COLORS.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
          zIndex: 2,
        }}
      >
        <ExpandIcon size={16} strokeWidth={1.8} />
      </button>
    </DashboardCard>
  );
};

export default PurchaseGraphCard;
