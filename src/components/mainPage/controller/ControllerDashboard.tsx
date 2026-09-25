// ControllerDashboard.tsx — панели «Контролер: Цех №1, Участок №2» (scope 'section', макет 1.png) и
// «Главный контролер: Предприятие» (scope 'enterprise', макет 2.png): уровень брака, средний уровень брака,
// показатели качества, производство и лента событий контроля по вкладкам статуса.
// Показатели качества — за период по умолчанию (у ролей нет выбора периода), лента — по участку или предприятию.
import React, { useEffect, useMemo, useState } from 'react';
import {
  CANVAS,
  CARD_RECTS,
  COLORS,
  DEFAULT_RANGE,
  DEFECT_PALETTE,
  FONT,
  QC_FOOTNOTE,
  QC_PALETTE,
  QUALITY_COLUMNS,
  SHADOWS,
} from './layout';
import { fetchControlEvents } from './api';
import { isControlEventStatus } from './types';
import type { ControlEvent, ControlEventStatus, ControlEventsData, ControlScope } from './types';
import { fetchQualityDashboard } from '../quality/api';
import type { DefectView, QcData, QualityDashboardData } from '../quality/types';
import DefectRateCard from '../quality/DefectRateCard';
import AverageDefectCard from '../quality/AverageDefectCard';
import QualityIndicatorsCard from '../quality/QualityIndicatorsCard';
import ProductionQcCard from '../quality/ProductionQcCard';
import FeedCard from '../shared/FeedCard';
import type { FeedItem, FeedTab } from '../shared/FeedCard';

const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';

// Стабильные пустые значения, пока данных нет
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
const EMPTY_EVENTS: ControlEvent[] = [];

/** Вкладки ленты — статусы контроля; открыта «Контроль пройден», как на макетах */
const EVENT_TABS: FeedTab[] = [
  { key: 'pending', label: 'На контроль' },
  { key: 'passed', label: 'Контроль пройден' },
  { key: 'failed', label: 'Контроль не пройден' },
];
const DEFAULT_TAB: ControlEventStatus = 'passed';

/** Строка ленты: подразделение справа от названия, исполнитель и контролер — строками под датой */
const toFeedItem = (event: ControlEvent): FeedItem => ({
  id: event.id,
  title: event.title,
  at: event.at,
  meta: `Подразделение: ${event.department}`,
  lines: [`Исполнитель: ${event.executor}`, `Контролер: ${event.controller}`],
});

/** Ответы обоих запросов панели */
interface ControllerData {
  quality: QualityDashboardData;
  events: ControlEventsData;
}

interface ControllerDashboardProps {
  /** 'section' — контролер участка «Цех 1, Участок 2»; 'enterprise' — главный контролер, всё предприятие */
  scope: ControlScope;
}

const ControllerDashboard: React.FC<ControllerDashboardProps> = ({ scope }) => {
  const [data, setData] = useState<ControllerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Для какого scope последний запрос завершился (успехом или ошибкой): пока он не совпадает с пропом — идёт загрузка
  const [settledScope, setSettledScope] = useState<ControlScope | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [activeTab, setActiveTab] = useState<ControlEventStatus>(DEFAULT_TAB);

  const loading = settledScope !== scope;

  // Показатели качества и лента запрашиваются параллельно; анимация перезапускается, когда пришли оба ответа.
  // Пока идёт запрос, старые данные остаются на экране; ответ устаревшего запроса игнорируется
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchQualityDashboard(DEFAULT_RANGE), fetchControlEvents(scope)])
      .then(([quality, events]) => {
        if (cancelled) return;
        setData({ quality, events });
        setError(null);
        setAnimationKey(key => key + 1);
        setSettledScope(scope);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setSettledScope(scope);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const quality = data?.quality ?? null;
  const events = data?.events.items ?? EMPTY_EVENTS;

  // Лента показывает события статуса открытой вкладки
  const feedItems = useMemo(
    () => events.filter(event => event.status === activeTab).map(toFeedItem),
    [events, activeTab],
  );

  const handleTabChange = (key: string) => {
    if (isControlEventStatus(key)) setActiveTab(key);
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
      <DefectRateCard
        rect={CARD_RECTS.defects}
        parts={quality?.parts ?? EMPTY_VIEW}
        workshops={quality?.workshops ?? EMPTY_VIEW}
        from={quality?.from ?? DEFAULT_RANGE.from}
        to={quality?.to ?? DEFAULT_RANGE.to}
        palette={DEFECT_PALETTE}
        animationKey={animationKey}
      />
      <AverageDefectCard
        rect={CARD_RECTS.average}
        variant="ring"
        color={COLORS.purple}
        percent={quality?.quality.defectPercent ?? 0}
        animationKey={animationKey}
      />
      <QualityIndicatorsCard
        rect={CARD_RECTS.quality}
        released={quality?.quality.released ?? 0}
        defect={quality?.quality.defect ?? 0}
        total={quality?.quality.total ?? 0}
        columns={QUALITY_COLUMNS}
        showTotal={false}
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
        rect={CARD_RECTS.events}
        title="Экран событий"
        items={feedItems}
        icon="part"
        accentColor={COLORS.purple}
        tabs={EVENT_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabAccent={COLORS.purple}
        onSecondScreen={() => window.open('/screen/events?source=control', '_blank', 'noopener')}
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

export default ControllerDashboard;
