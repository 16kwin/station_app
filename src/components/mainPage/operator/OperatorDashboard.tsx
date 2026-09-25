// OperatorDashboard.tsx — панель «Оператор склада»: четыре показателя, критические и минимальные
// остатки по станциям, ленты заказов на поставку и событий.
import React, { useEffect, useMemo, useState } from 'react';
import { CANVAS, CARD_RECTS, COLORS, FONT, METRIC_COLORS, SHADOWS } from './layout';
import { DEFAULT_RANGE } from '../shared/layout';
import { fetchOperatorDashboard } from './api';
import type { OperatorDashboardData, OperatorEvent, OperatorMetric, Station } from './types';
import OperatorMetricCard from './OperatorMetricCard';
import StationBalanceCard from './StationBalanceCard';
import FeedCard from '../shared/FeedCard';
import type { FeedTab } from '../shared/FeedCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

const EMPTY_METRICS: OperatorMetric[] = [];
const EMPTY_STATIONS: Station[] = [];
const EMPTY_EVENTS: OperatorEvent[] = [];

const FEED_TABS: FeedTab[] = [
  { key: 'active', label: 'В работе' },
  { key: 'done', label: 'Завершено' },
];

const OperatorDashboard: React.FC = () => {
  const [data, setData] = useState<OperatorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [ordersTab, setOrdersTab] = useState('active');
  const [eventsTab, setEventsTab] = useState('active');

  // loading стартует с true, а эффект запускается один раз при монтировании — поэтому в теле эффекта
  // его не выставляем (react-hooks/set-state-in-effect), меняется он только в .then/.catch
  useEffect(() => {
    let cancelled = false;
    fetchOperatorDashboard()
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setAnimationKey(key => key + 1);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = data?.metrics ?? EMPTY_METRICS;
  const stations = data?.stations ?? EMPTY_STATIONS;
  const orders = data?.orders ?? EMPTY_EVENTS;
  const events = data?.events ?? EMPTY_EVENTS;

  const visibleOrders = useMemo(
    () => orders.filter(item => (ordersTab === 'done' ? item.done : !item.done)),
    [orders, ordersTab],
  );
  const visibleEvents = useMemo(
    () => events.filter(item => (eventsTab === 'done' ? item.done : !item.done)),
    [events, eventsTab],
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
      {metrics.slice(0, 4).map((metric, index) => (
        <OperatorMetricCard key={metric.key} metric={metric} index={index} animationKey={animationKey} />
      ))}

      <StationBalanceCard stations={stations} period={DEFAULT_RANGE} animationKey={animationKey} />

      <FeedCard
        rect={CARD_RECTS.orders}
        title="Заказы на поставку"
        items={visibleOrders.map(item => ({ id: item.id, title: item.title, at: item.at }))}
        accentColor={COLORS.crimson}
        tabs={FEED_TABS}
        activeTab={ordersTab}
        onTabChange={setOrdersTab}
      />
      <FeedCard
        rect={CARD_RECTS.events}
        title="Экран событий"
        items={visibleEvents.map(item => ({ id: item.id, title: item.title, at: item.at }))}
        accentColor={METRIC_COLORS[3]}
        tabs={FEED_TABS}
        activeTab={eventsTab}
        onTabChange={setEventsTab}
        onSecondScreen={() => window.open('/screen/events?source=operator', '_blank', 'noopener')}
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

export default OperatorDashboard;
