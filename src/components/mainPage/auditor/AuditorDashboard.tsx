// AuditorDashboard.tsx — панель «Аудитор» (8.png): затраты на приобретение и расход объема по цеху, инциденты
// и выдачи сверх нормы, средний уровень брака, мини-граф закупок и лента закупок с завышенной ценой.
// Всё — за период из пилюли дат главной страницы (проп range); три эндпоинта запрашиваются параллельно.
import React, { useEffect, useMemo, useState } from 'react';
import { CANVAS, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { fetchAuditorDashboard } from './api';
import type { AuditorDashboardData, OverpricedPurchase } from './types';
import type { DateRange } from '../shared/types';
import type { CostPoint } from '../economic/types';
import type { ProductionPoint } from '../quality/types';
import CostsChart from '../economic/CostsChart';
import ProductionChart from '../quality/ProductionChart';
import AverageDefectCard from '../quality/AverageDefectCard';
import DualMetricCard from '../shared/DualMetricCard';
import type { DualMetric } from '../shared/DualMetricCard';
import FeedCard from '../shared/FeedCard';
import type { FeedItem } from '../shared/FeedCard';
import PurchaseGraphCard from '../purchaseGraph/PurchaseGraphCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

const COSTS_TITLE = 'Затраты на приобретение производственной номенклатуры (по цеху)';
const PRODUCTION_TITLE = 'Расход объема производственной номенклатуры по цеху';
const OVERPRICED_TITLE = 'Закупка с завышенной ценой';

/** Расход объема — как у службы закупа: факт акцентный, план зелёный, плашка месяца розовая */
const PRODUCTION_PALETTE = { fact: COLORS.accent, plan: COLORS.green, pill: COLORS.rose };

// Стабильные пустые значения, пока данных нет
const EMPTY_COSTS: CostPoint[] = [];
const EMPTY_PRODUCTION: ProductionPoint[] = [];
const EMPTY_OVERPRICED: OverpricedPurchase[] = [];

/** Ключ периода: по нему видно, пришёл ли уже ответ на запрос за текущий период */
const periodKey = (from: string, to: string): string => `${from}|${to}`;

/** «Второй экран»: экран событий текущего дня по закупкам с завышенной ценой в новой вкладке */
const openEventsScreen = () => window.open('/screen/events?source=overpriced', '_blank', 'noopener');

interface AuditorDashboardProps {
  range: DateRange;
}

const AuditorDashboard: React.FC<AuditorDashboardProps> = ({ range }) => {
  const { from, to } = range;
  const [data, setData] = useState<AuditorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Ключ периода последнего завершённого запроса: «загрузка» выводится из него, в теле эффекта состояние не меняется
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const loading = settledKey !== periodKey(from, to);

  // Период для мини-графа: новый объект только при смене дат, иначе карточка перезапрашивала бы граф
  const period = useMemo<DateRange>(() => ({ from, to }), [from, to]);

  // Запрос при монтировании и при каждой смене периода. Пока он идёт, старые данные остаются на экране;
  // ответ устаревшего запроса игнорируется
  useEffect(() => {
    let cancelled = false;
    const key = periodKey(from, to);
    fetchAuditorDashboard({ from, to })
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setAnimationKey(value => value + 1);
        setSettledKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setSettledKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const audit = data?.audit ?? null;
  const overpriced = audit?.overpriced ?? EMPTY_OVERPRICED;
  const overpricedItems = useMemo<FeedItem[]>(
    () => overpriced.map(item => ({ id: item.id, title: item.nomName, at: item.at, link: `Заказ № ${item.orderNo}` })),
    [overpriced],
  );

  // Строка ленты открывает полную страницу графа закупок с фокусом на номенклатуре заказа — за период,
  // за который получена лента (он совпадает с range, пока не идёт новый запрос)
  const openPurchaseGraph = (id: number | string) => {
    const item = overpriced.find(row => row.id === id);
    if (!item) return;
    const params = new URLSearchParams({ focus: item.nomKey, from: audit?.from ?? from, to: audit?.to ?? to });
    window.open(`/screen/purchase-graph?${params.toString()}`, '_blank', 'noopener');
  };

  const incidents: DualMetric = {
    name: 'Инциденты',
    value: audit?.incidents.value ?? 0,
    percent: audit?.incidents.percent ?? 0,
    color: COLORS.salmon,
    icon: 'incidents',
  };
  const overNorm: DualMetric = {
    name: 'Выдано сверхнормы',
    value: audit?.overNorm.value ?? 0,
    percent: audit?.overNorm.percent ?? 0,
    color: COLORS.rose,
    icon: 'overNorm',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: CANVAS.width,
        height: CANVAS.height,
        overflow: 'hidden',
        fontFamily: FONT,
        cursor: loading ? 'progress' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Карточки позиционируются по CARD_RECTS; пока данных нет — пустые значения */}
      <CostsChart
        rect={CARD_RECTS.costs}
        title={COSTS_TITLE}
        legend="header"
        points={data?.economic.costs.points ?? EMPTY_COSTS}
        from={data?.economic.from ?? from}
        to={data?.economic.to ?? to}
        animationKey={animationKey}
      />
      <DualMetricCard rect={CARD_RECTS.metrics} left={incidents} right={overNorm} animationKey={animationKey} />
      <AverageDefectCard
        rect={CARD_RECTS.average}
        variant="pill"
        percent={data?.quality.quality.defectPercent ?? 0}
        animationKey={animationKey}
      />
      <ProductionChart
        rect={CARD_RECTS.production}
        title={PRODUCTION_TITLE}
        legend="header"
        palette={PRODUCTION_PALETTE}
        points={data?.quality.production ?? EMPTY_PRODUCTION}
        from={data?.quality.from ?? from}
        to={data?.quality.to ?? to}
        animationKey={animationKey}
      />
      {/* Мини-граф запрашивает свои данные сам — ему нужен только период */}
      <PurchaseGraphCard rect={CARD_RECTS.graph} range={period} />
      <FeedCard
        rect={CARD_RECTS.overpriced}
        title={OVERPRICED_TITLE}
        header="title"
        items={overpricedItems}
        icon="cube"
        accentColor={COLORS.accent}
        onItemClick={openPurchaseGraph}
        onSecondScreen={openEventsScreen}
      />

      {error && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '10px 18px',
            borderRadius: 10,
            backgroundColor: COLORS.white,
            boxShadow: SHADOWS.card,
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: '18px',
            color: COLORS.crimson,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default AuditorDashboard;
