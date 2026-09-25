// QualityDashboard.tsx — панель «Показатели» (топ-менеджмент): расход объема номенклатуры,
// уровень брака, показатели качества, производство и лента выпуска продукции.
import React, { useEffect, useState } from 'react';
import { CANVAS, CARD_RECTS, COLORS, FONT, SHADOWS } from './layout';
import { fetchQualityDashboard } from './api';
import type { DateRange, DefectView, ProductionPoint, QcData, QualityDashboardData, ReleaseEvent } from './types';
import ProductionChart from './ProductionChart';
import DefectRateCard from './DefectRateCard';
import QualityIndicatorsCard from './QualityIndicatorsCard';
import AverageDefectCard from './AverageDefectCard';
import ProductionQcCard from './ProductionQcCard';
import FeedCard from '../shared/FeedCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

// Стабильные пустые значения, пока данных нет
const EMPTY_POINTS: ProductionPoint[] = [];
const EMPTY_VIEW: DefectView = { released: 0, defect: 0, averagePercent: 0, subjects: [] };
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

interface QualityDashboardProps {
  range: DateRange;
}

const QualityDashboard: React.FC<QualityDashboardProps> = ({ range }) => {
  const [data, setData] = useState<QualityDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Период последнего завершённого запроса (успех или ошибка). Пока он не совпадает с текущим `range` —
  // идёт загрузка: каждый новый период от главной страницы — новый объект, поэтому хватает сравнения ссылок
  const [settledRange, setSettledRange] = useState<DateRange | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const loading = settledRange !== range;

  // Пока идёт запрос, старые данные остаются на экране; ответ устаревшего запроса игнорируется
  useEffect(() => {
    let cancelled = false;
    fetchQualityDashboard(range)
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setAnimationKey(key => key + 1);
        setSettledRange(range);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setSettledRange(range);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const releases = data?.releases ?? EMPTY_RELEASES;

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
      <ProductionChart
        points={data?.production ?? EMPTY_POINTS}
        from={data?.from ?? range.from}
        to={data?.to ?? range.to}
        animationKey={animationKey}
      />
      <DefectRateCard
        parts={data?.parts ?? EMPTY_VIEW}
        workshops={data?.workshops ?? EMPTY_VIEW}
        from={data?.from ?? range.from}
        to={data?.to ?? range.to}
        animationKey={animationKey}
      />
      <QualityIndicatorsCard
        released={data?.quality.released ?? 0}
        defect={data?.quality.defect ?? 0}
        total={data?.quality.total ?? 0}
        animationKey={animationKey}
      />
      <AverageDefectCard percent={data?.quality.defectPercent ?? 0} animationKey={animationKey} />
      <ProductionQcCard qc={data?.qc ?? EMPTY_QC} animationKey={animationKey} />
      <FeedCard
        rect={CARD_RECTS.releases}
        title="Выпуск продукции"
        items={releases.map(item => ({ id: item.id, title: item.name, at: item.at }))}
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

export default QualityDashboard;
