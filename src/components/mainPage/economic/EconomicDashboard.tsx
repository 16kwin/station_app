// EconomicDashboard.tsx — холст панели «Экономический блок» 1800×840: шапка, загрузка данных, попапы и пять карточек
import React, { useEffect, useState } from 'react';
import { CANVAS, COLORS, FONT, SHADOWS } from './layout';
import { fetchEconomicDashboard, saveDashboardSettings } from './api';
import { BAR_TYPES_MAX, BAR_TYPES_MIN, RADAR_TYPES_MAX, RADAR_TYPES_MIN } from './types';
import type {
  CostPoint,
  DashboardSettings,
  DateRange,
  EconomicDashboardData,
  NomenclatureTypeRef,
  TypeAmount,
  TypePercent,
} from './types';
import DashboardHeader from './DashboardHeader';
import DateRangePopup from './DateRangePopup';
import type { AnchorRect } from './DateRangePopup';
import DashboardSettingsPopup from './DashboardSettingsPopup';
import CostsChart from './CostsChart';
import CostsByTypeCard from './CostsByTypeCard';
import CostIndicatorsCard from './CostIndicatorsCard';
import BudgetExecutionCard from './BudgetExecutionCard';
import CostDistributionRadar from './CostDistributionRadar';

const DEFAULT_RANGE: DateRange = { from: '2025-01-01', to: '2025-11-30' };
const FETCH_ERROR_TEXT = 'Не удалось загрузить данные панели';
const SAVE_ERROR_TEXT = 'Не удалось сохранить настройки панели';

// Стабильные пустые значения для карточек, пока данных нет
const EMPTY_POINTS: CostPoint[] = [];
const EMPTY_AMOUNTS: TypeAmount[] = [];
const EMPTY_PERCENTS: TypePercent[] = [];
const EMPTY_TYPES: NomenclatureTypeRef[] = [];
const EMPTY_SELECTED: string[] = [];

/** Какой попап настроек открыт: карточка 2 (полоски) или карточка 4 (паутинка) */
type SettingsCard = 'bars' | 'radar' | null;

const sameList = (a: string[], b: string[]): boolean => a.length === b.length && a.every((key, i) => key === b[i]);

const EconomicDashboard: React.FC = () => {
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [requestSeq, setRequestSeq] = useState(0); // номер запроса: +1 при каждом (пере)запросе данных
  const [settledSeq, setSettledSeq] = useState(-1); // номер последнего завершённого запроса
  const [data, setData] = useState<EconomicDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<AnchorRect | null>(null);
  const [settingsCard, setSettingsCard] = useState<SettingsCard>(null);

  const loading = settledSeq !== requestSeq;

  // Загрузка данных при монтировании и при каждом новом запросе (смена диапазона, сброс, сохранение настроек).
  // Пока идёт запрос, старые данные остаются на экране; ответ устаревшего запроса игнорируется
  useEffect(() => {
    let cancelled = false;
    fetchEconomicDashboard(range)
      .then(result => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setAnimationKey(k => k + 1);
        setSettledSeq(requestSeq);
      })
      .catch(() => {
        if (cancelled) return;
        setError(FETCH_ERROR_TEXT);
        setSettledSeq(requestSeq);
      });
    return () => {
      cancelled = true;
    };
  }, [range, requestSeq]);

  const requestData = (nextRange: DateRange) => {
    setRange(nextRange);
    setRequestSeq(seq => seq + 1);
  };

  // Пилюля дат: клик открывает/закрывает попап, крестик сбрасывает диапазон
  const handleDateClick = (anchor: AnchorRect) => {
    setDateAnchor(anchor);
    setDateOpen(open => !open);
  };
  const handleDateClose = () => setDateOpen(false);
  const handleRangeConfirm = (nextRange: DateRange) => requestData(nextRange);
  const handleDateReset = () => {
    setDateOpen(false);
    requestData(DEFAULT_RANGE);
  };

  // Настройки карточек: сохранить оба списка (второй — из текущих данных), затем перезапросить данные.
  // При ошибке сохранения данные не трогаем, показываем текст ошибки
  const persistSettings = (settings: DashboardSettings) => {
    saveDashboardSettings(settings)
      .then(() => setRequestSeq(seq => seq + 1))
      .catch(() => setError(SAVE_ERROR_TEXT));
  };

  const handleBarTypesSave = (barTypes: string[]) => {
    if (!data || sameList(barTypes, data.costsByType.selected)) return;
    persistSettings({ barTypes, radarTypes: data.distribution.selected });
  };

  const handleRadarTypesSave = (radarTypes: string[]) => {
    if (!data || sameList(radarTypes, data.distribution.selected)) return;
    persistSettings({ barTypes: data.costsByType.selected, radarTypes });
  };

  const openSettings = (card: SettingsCard) => {
    if (data) setSettingsCard(card);
  };
  const closeSettings = () => setSettingsCard(null);

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
      <DashboardHeader range={range} onDateClick={handleDateClick} onDateReset={handleDateReset} />

      {/* Карточки позиционируются сами по CARD_RECTS; пока данных нет — пустые значения */}
      <CostsChart
        points={data?.costs.points ?? EMPTY_POINTS}
        from={data?.from ?? range.from}
        to={data?.to ?? range.to}
        animationKey={animationKey}
      />
      <CostsByTypeCard
        items={data?.costsByType.items ?? EMPTY_AMOUNTS}
        onSettingsClick={() => openSettings('bars')}
        animationKey={animationKey}
      />
      <CostIndicatorsCard
        purchases={data?.indicators.purchases ?? 0}
        issue={data?.indicators.issue ?? 0}
        animationKey={animationKey}
      />
      <BudgetExecutionCard percent={data?.budget.percent ?? 0} animationKey={animationKey} />
      <CostDistributionRadar
        items={data?.distribution.items ?? EMPTY_PERCENTS}
        onSettingsClick={() => openSettings('radar')}
        animationKey={animationKey}
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
            color: COLORS.fact,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          {error}
        </div>
      )}

      <DateRangePopup
        isOpen={dateOpen}
        anchorRect={dateAnchor}
        range={range}
        onClose={handleDateClose}
        onConfirm={handleRangeConfirm}
      />

      <DashboardSettingsPopup
        isOpen={settingsCard === 'bars'}
        onClose={closeSettings}
        title="Затраты по видам номенклатуры"
        types={data?.availableTypes ?? EMPTY_TYPES}
        selected={data?.costsByType.selected ?? EMPTY_SELECTED}
        min={BAR_TYPES_MIN}
        max={BAR_TYPES_MAX}
        onSave={handleBarTypesSave}
      />
      <DashboardSettingsPopup
        isOpen={settingsCard === 'radar'}
        onClose={closeSettings}
        title="Распределение объема затрат"
        types={data?.availableTypes ?? EMPTY_TYPES}
        selected={data?.distribution.selected ?? EMPTY_SELECTED}
        min={RADAR_TYPES_MIN}
        max={RADAR_TYPES_MAX}
        onSave={handleRadarTypesSave}
      />
    </div>
  );
};

export default EconomicDashboard;
