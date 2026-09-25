// types.ts — контракт GET /api/dashboard/audit и данные панели «Аудитор»
import type { EconomicDashboardData } from '../economic/types';
import type { QualityDashboardData } from '../quality/types';

/** Показатель аудита за период: value случаев на base операций, percent = value / base × 100 (1 знак; base = 0 → 0) */
export interface AuditMetric {
  value: number;
  base: number;
  percent: number;
}

/** Отдельный заказ с ценой выше ориентира больше чем на limitPercent (сервер отдаёт не больше 50, по `at` убыванию) */
export interface OverpricedPurchase {
  id: number;
  orderNo: string;
  /** Дата и время заказа 'YYYY-MM-DDTHH:mm:ss' */
  at: string;
  /** Ключ номенклатуры — фокус полной страницы графа закупок */
  nomKey: string;
  nomName: string;
  supplierKey: string;
  supplierName: string;
  /** Цена заказа, руб. */
  price: number;
  /** Ориентировочная цена номенклатуры, руб. */
  refPrice: number;
  /** (price / refPrice − 1) × 100, 1 знак */
  overPercent: number;
  qty: number;
  amount: number;
}

/** Ответ GET /api/dashboard/audit?from&to */
export interface AuditDashboardData {
  from: string;
  to: string;
  incidents: AuditMetric;
  overNorm: AuditMetric;
  /** Лимит превышения цены, % (по умолчанию 20) */
  limitPercent: number;
  overpriced: OverpricedPurchase[];
}

/** Всё, что нужно панели: три ответа за один и тот же период */
export interface AuditorDashboardData {
  /** GET /api/dashboard/economic — затраты на приобретение */
  economic: EconomicDashboardData;
  /** GET /api/dashboard/quality — расход объема и средний уровень брака */
  quality: QualityDashboardData;
  /** GET /api/dashboard/audit — инциденты, выдачи сверх нормы, закупки с завышенной ценой */
  audit: AuditDashboardData;
}
