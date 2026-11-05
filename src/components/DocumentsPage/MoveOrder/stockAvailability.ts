// MoveOrder/stockAvailability.ts — локальный хелпер по регистрам склада
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

export type StockDocType = 'REFILL' | 'MOVE_ORDER' | 'TRANSFER';

export interface StockBalanceRow {
  materialUid: string;
  stockUid: string;
  cleanQuantity: number | null;
  reservedQuantity: number | null;
  minStock: number | null;
  criticalStock: number | null;
}

export interface StockLevelReg {
  uid?: string;
  stationUid: string | null;
  materialUid: string | null;
  minStock: number | null;
  criticalStock: number | null;
}

export interface StockReservationRow {
  uid: string;
  docUid: string | null;
  docType: StockDocType | string | null;
  docRefillUid: string | null;
  docRefillCode: number | null;
  reservedQuantity: number | null;
  blocked: boolean | null;
  cancelled?: boolean | null;
  author: string | null;
  authorFullName: string | null;
  docStationUid?: string | null;
  docStationName?: string | null;
  docSectionName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StockAvailability {
  materialUid: string;
  stockUid: string;
  free: number | null;         // clean
  reserved: number;            // active reserved
  available: number | null;    // clean - reserved
  minStock: number | null;
  criticalStock: number | null;
  kuoExists: boolean;
  toMoveMax: number | null;    // available - critical (или available без КУО)
  reservations: StockReservationRow[];
}

export async function fetchActiveReservations(
  materialUid: string,
  stockUid?: string | null,
  excludeDocUid?: string | null,
): Promise<StockReservationRow[]> {
  if (!materialUid) return [];
  try {
    const res = await AxiosService.get(
      ConstantInfo.restApiRefillStockReservationsByMaterial(materialUid, stockUid || undefined)
    );
    const list = (res.data || []) as StockReservationRow[];
    return list.filter(r => {
      if (r.blocked === true) return false;
      if (r.cancelled === true) return false;
      if (excludeDocUid && r.docUid && r.docUid === excludeDocUid) return false;
      return true;
    });
  } catch {
    return [];
  }
}

export async function fetchStockAvailability(
  materialUid: string,
  stockUid?: string | null,
  excludeDocUid?: string | null,
): Promise<StockAvailability | null> {
  if (!materialUid) return null;

  const effectiveStock = (stockUid && stockUid.trim()) ? stockUid : 'MAIN';

  const [balanceRes, kuoRes, reservations] = await Promise.all([
    AxiosService.get(ConstantInfo.restApiRefillStockBalances(effectiveStock)).catch(() => null),
    AxiosService.get(ConstantInfo.restApiStockLevelControlReg(effectiveStock, materialUid)).catch(() => null),
    fetchActiveReservations(materialUid, effectiveStock, excludeDocUid || null),
  ]);

  let free: number | null = null;
  let reservedFromBalance: number | null = null;
  if (balanceRes) {
    const list = ((balanceRes as any).data || []) as StockBalanceRow[];
    // бэк отдаёт по одной актуальной строке на пару; берём нужную
    const row = list.find(b => b.materialUid === materialUid);
    free = row?.cleanQuantity ?? null;
    reservedFromBalance = row?.reservedQuantity ?? null;
  }

  let minStock: number | null = null;
  let criticalStock: number | null = null;
  if (kuoRes) {
    const kuo = (kuoRes as any).data as StockLevelReg | null;
    if (kuo) {
      minStock = kuo.minStock ?? null;
      criticalStock = kuo.criticalStock ?? null;
    }
  }

  const kuoExists = minStock != null || criticalStock != null;

  const reserved = reservations.reduce(
    (s, r) => s + (r.reservedQuantity != null ? Number(r.reservedQuantity) : 0),
    0,
  );

  const effectiveReserved = reserved > 0 ? reserved : (reservedFromBalance ?? 0);
  const available = free != null ? Math.max(0, free - effectiveReserved) : null;

  let toMoveMax: number | null = null;
  if (available != null) {
    toMoveMax = kuoExists && criticalStock != null
      ? Math.max(0, available - criticalStock)
      : available;
  }

  return {
    materialUid,
    stockUid: effectiveStock,
    free,
    reserved: effectiveReserved,
    available,
    minStock,
    criticalStock,
    kuoExists,
    toMoveMax,
    reservations,
  };
}

export function pluralizeUnits(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'единиц';
  if (last === 1) return 'единица';
  if (last >= 2 && last <= 4) return 'единицы';
  return 'единиц';
}

export function describeDocHolder(r: StockReservationRow): string {
  const docType = r.docType || (r.docRefillUid ? 'REFILL' : '');
  const codeNum = r.docRefillCode;
  const code = codeNum != null ? String(codeNum).padStart(4, '0') : '';
  switch (docType) {
    case 'REFILL':     return code ? `Пополнение №${code}` : 'Пополнение';
    case 'MOVE_ORDER': return code ? `Заказ на перемещение №${code}` : 'Заказ на перемещение';
    case 'TRANSFER':   return code ? `Перемещение №${code}` : 'Перемещение';
    default:           return 'Документ';
  }
}