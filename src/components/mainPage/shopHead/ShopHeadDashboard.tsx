// ShopHeadDashboard.tsx — панель «Начальник цеха: Цех №1» (макет 6.png): три показателя ТМЦ, показатели качества,
// критические остатки и заказы в работе, расход объема номенклатуры по цеху, средний уровень брака, производство
// и лента выпуска продукции. Период — по умолчанию (у роли нет выбора периода).
import React, { useEffect, useState } from 'react';
import {
  CANVAS,
  CARD_RECTS,
  COLORS,
  DEFAULT_RANGE,
  FONT,
  METRIC_CARDS,
  PRODUCTION_PALETTE,
  QC_FOOTNOTE,
  QC_PALETTE,
  QUALITY_COLUMNS,
  SHADOWS,
  STOCK_COLUMNS,
} from './layout';
import type { MetricCardSpec } from './layout';
import { fetchOperatorDashboard } from '../operator/api';
import type { OperatorDashboardData, OperatorEvent, OperatorMetric, Station } from '../operator/types';
import { fetchQualityDashboard } from '../quality/api';
import type { ProductionPoint, QcData, QualityDashboardData, ReleaseEvent } from '../quality/types';
import OperatorMetricCard from '../operator/OperatorMetricCard';
import QualityIndicatorsCard from '../quality/QualityIndicatorsCard';
import ProductionChart from '../quality/ProductionChart';
import AverageDefectCard from '../quality/AverageDefectCard';
import ProductionQcCard from '../quality/ProductionQcCard';
import FeedCard from '../shared/FeedCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

// Стабильные пустые значения, пока данных нет
const EMPTY_METRICS: OperatorMetric[] = [];
const EMPTY_STATIONS: Station[] = [];
const EMPTY_ORDERS: OperatorEvent[] = [];
const EMPTY_POINTS: ProductionPoint[] = [];
const EMPTY_QC: QcData = {
  passed: 0,
  waiting: 0,
  failed: 0,
  total: 0,
  passedPercent: 0,
  waitingPercent: 0,
  failedPercent: 0,
};
const EMPTY_RELEASES: ReleaseEvent[] = [];

/** Показатель карточки по ключу; пока ответа нет (или показателя в нём нет) — нули с подписью из раскладки */
const findMetric = (metrics: OperatorMetric[], spec: MetricCardSpec): OperatorMetric =>
  metrics.find(metric => metric.key === spec.key) ?? { key: spec.key, name: spec.name, value: 0, base: 0, percent: 0 };

/** Позиции с критическим остатком — по всем станциям */
const countCritical = (stations: Station[]): number =>
  stations.reduce((sum, station) => sum + (station.items ?? []).filter(item => item.status === 'critical').length, 0);

/** Заказы на поставку, которые ещё в работе */
const countOpenOrders = (orders: OperatorEvent[]): number => orders.filter(order => !order.done).length;

/** Ответы обоих запросов панели */
interface ShopHeadData {
  operator: OperatorDashboardData;
  quality: QualityDashboardData;
}

const ShopHeadDashboard: React.FC = () => {
  const [data, setData] = useState<ShopHeadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Запрос завершился (успехом или ошибкой); до этого — загрузка
  const [settled, setSettled] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const loading = !settled;

  // Показатели ТМЦ и показатели качества запрашиваются параллельно; анимация стартует, когда пришли оба ответа
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOperatorDashboard(), fetchQualityDashboard(DEFAULT_RANGE)])
      .then(([operator, quality]) => {
        if (cancelled) return;
        setData({ operator, quality });
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

  const metrics = data?.operator.metrics ?? EMPTY_METRICS;
  const quality = data?.quality ?? null;
  const releases = quality?.releases ?? EMPTY_RELEASES;

  // «Крит. остатки / В заказ»: слева — критические позиции станций, справа — заказы в работе
  const critical = countCritical(data?.operator.stations ?? EMPTY_STATIONS);
  const openOrders = countOpenOrders(data?.operator.orders ?? EMPTY_ORDERS);

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
      {METRIC_CARDS.map((spec, index) => (
        <OperatorMetricCard
          key={spec.key}
          metric={findMetric(metrics, spec)}
          index={index}
          rect={spec.rect}
          color={spec.color}
          icon={spec.icon}
          animationKey={animationKey}
        />
      ))}
      <QualityIndicatorsCard
        rect={CARD_RECTS.quality}
        released={quality?.quality.released ?? 0}
        defect={quality?.quality.defect ?? 0}
        total={quality?.quality.total ?? 0}
        columns={QUALITY_COLUMNS}
        showTotal={false}
        animationKey={animationKey}
      />
      <QualityIndicatorsCard
        rect={CARD_RECTS.stock}
        title="Крит. остатки / В заказ"
        released={openOrders}
        defect={critical}
        total={critical + openOrders}
        columns={STOCK_COLUMNS}
        showTotal={false}
        animationKey={animationKey}
      />
      <ProductionChart
        rect={CARD_RECTS.production}
        title="Расход объема производственной номенклатуры по цеху"
        points={quality?.production ?? EMPTY_POINTS}
        from={quality?.from ?? DEFAULT_RANGE.from}
        to={quality?.to ?? DEFAULT_RANGE.to}
        legend="bottom"
        palette={PRODUCTION_PALETTE}
        animationKey={animationKey}
      />
      <AverageDefectCard
        rect={CARD_RECTS.average}
        variant="pill"
        percent={quality?.quality.defectPercent ?? 0}
        animationKey={animationKey}
      />
      <ProductionQcCard
        rect={CARD_RECTS.qc}
        qc={quality?.qc ?? EMPTY_QC}
        palette={QC_PALETTE}
        footnote={QC_FOOTNOTE}
        animationKey={animationKey}
      />
      <FeedCard
        rect={CARD_RECTS.releases}
        title="Выпуск продукции"
        items={releases.map(item => ({ id: item.id, title: item.name, at: item.at }))}
        icon="check"
        accentColor={COLORS.peach}
        onSecondScreen={() => window.open('/screen/events?source=release', '_blank', 'noopener')}
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

export default ShopHeadDashboard;
