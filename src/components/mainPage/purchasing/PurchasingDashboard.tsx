// PurchasingDashboard.tsx — панель «Служба закупа: Инструментальный отдел» (7.png): затраты на приобретение
// и расход объема по цеху, исполнение бюджета, критические и минимальные остатки станций, лента заказов на поставку.
// Периода у роли нет — данные за DEFAULT_RANGE; три эндпоинта запрашиваются параллельно.
import React, { useEffect, useMemo, useState } from 'react';
import { CANVAS, CARD_RECTS, COLORS, DEFAULT_RANGE, FONT, SHADOWS } from './layout';
import { fetchPurchasingDashboard } from './api';
import type { PurchasingDashboardData } from './types';
import type { CostPoint } from '../economic/types';
import type { ProductionPoint } from '../quality/types';
import type { OperatorEvent, Station } from '../operator/types';
import CostsChart from '../economic/CostsChart';
import BudgetExecutionCard from '../economic/BudgetExecutionCard';
import ProductionChart from '../quality/ProductionChart';
import StationBalanceCard from '../operator/StationBalanceCard';
import FeedCard from '../shared/FeedCard';
import type { FeedItem, FeedTab } from '../shared/FeedCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

const COSTS_TITLE = 'Затраты на приобретение производственной номенклатуры (по цеху)';
const PRODUCTION_TITLE = 'Расход объема производственной номенклатуры по цеху';
const STATIONS_TITLE = 'Крит./Мин. остатки';
const ORDERS_TITLE = 'Заказы на поставку';

/** Расход объема: факт — акцентный, план — зелёный, плашка месяца при наведении — розовая (7.png) */
const PRODUCTION_PALETTE = { fact: COLORS.accent, plan: COLORS.green, pill: COLORS.rose };

const ORDER_TABS: FeedTab[] = [
  { key: 'active', label: 'В работе' },
  { key: 'done', label: 'Завершено' },
];

// Стабильные пустые значения, пока данных нет
const EMPTY_COSTS: CostPoint[] = [];
const EMPTY_PRODUCTION: ProductionPoint[] = [];
const EMPTY_STATIONS: Station[] = [];
const EMPTY_ORDERS: OperatorEvent[] = [];

const PurchasingDashboard: React.FC = () => {
  const [data, setData] = useState<PurchasingDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Пришёл ли ответ (успешный или с ошибкой): «загрузка» выводится из него, в теле эффекта состояние не меняется
  const [settled, setSettled] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [ordersTab, setOrdersTab] = useState('active');

  const loading = !settled;

  // Период роли фиксирован — данные запрашиваются один раз при монтировании; ответ после размонтирования игнорируется
  useEffect(() => {
    let cancelled = false;
    fetchPurchasingDashboard()
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setAnimationKey(key => key + 1);
        setSettled(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const orders = data?.operator.orders ?? EMPTY_ORDERS;
  const orderItems = useMemo<FeedItem[]>(
    () =>
      orders
        .filter(item => (ordersTab === 'done' ? item.done : !item.done))
        .map(item => ({ id: item.id, title: item.title, at: item.at })),
    [orders, ordersTab],
  );

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
        from={data?.economic.from ?? DEFAULT_RANGE.from}
        to={data?.economic.to ?? DEFAULT_RANGE.to}
        animationKey={animationKey}
      />
      <BudgetExecutionCard rect={CARD_RECTS.budget} percent={data?.economic.budget.percent ?? 0} animationKey={animationKey} />
      <ProductionChart
        rect={CARD_RECTS.production}
        title={PRODUCTION_TITLE}
        legend="header"
        palette={PRODUCTION_PALETTE}
        points={data?.quality.production ?? EMPTY_PRODUCTION}
        from={data?.quality.from ?? DEFAULT_RANGE.from}
        to={data?.quality.to ?? DEFAULT_RANGE.to}
        animationKey={animationKey}
      />
      <StationBalanceCard
        rect={CARD_RECTS.stations}
        variant="compact"
        title={STATIONS_TITLE}
        stations={data?.operator.stations ?? EMPTY_STATIONS}
        period={DEFAULT_RANGE}
        animationKey={animationKey}
      />
      <FeedCard
        rect={CARD_RECTS.orders}
        title={ORDERS_TITLE}
        items={orderItems}
        icon="cube"
        accentColor={COLORS.rose}
        tabAccent={COLORS.rose}
        tabs={ORDER_TABS}
        activeTab={ordersTab}
        onTabChange={setOrdersTab}
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

export default PurchasingDashboard;
