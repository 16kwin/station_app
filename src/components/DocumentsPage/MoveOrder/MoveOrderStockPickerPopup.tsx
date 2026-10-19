// MoveOrderStockPickerPopup.tsx — попап «Доступность номенклатуры»
import React, { useState, useEffect, useMemo } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

import StationIcon18White from '../../../assets/Icons/StationIcons/StationIcon18White.svg';

interface StationOption {
  uid: string;
  name: string;
}

interface StockBalanceRow {
  materialUid: string;
  stockUid: string;
  cleanQuantity: number | null;
  reservedQuantity: number | null;
  minStock: number | null;
  criticalStock: number | null;
}

interface StockLevelReg {
  uid: string;
  stationUid: string | null;
  materialUid: string | null;
  minStock: number | null;
  criticalStock: number | null;
}

interface AvailabilityRow {
  stationUid: string;
  stationName: string;
  materialUid: string;
  materialName: string;
  materialArticle: string;
  freeQuantity: number | null;
  minStock: number | null;
  criticalStock: number | null;
  kuoExists: boolean;
  toMoveMax: number | null;
}

export interface MoveOrderStockPickResult {
  stationUid: string;
  stationName: string;
  toMoveMax?: number | null;
  freeQuantity?: number | null;
}

interface MoveOrderStockPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: MoveOrderStockPickResult | null) => void;
  materialUid: string;
  materialName: string;
  materialArticle: string;
  stationOptions: StationOption[];
}

const POPUP_W = 1315;
const POPUP_H = 549;

const TITLE_TOP = 30;
const TITLE_H = 21;

const INFO_TOP = 42;
const INFO_RIGHT = 146;

const DIVIDER_TOP = 107;
const DIVIDER_LEFT = 14;
const DIVIDER_W = 1268;
const DIVIDER_THICKNESS = 2;
const DIVIDER_COLOR = '#E6E9F4';

const TABLE_LEFT = 14;
const TABLE_W = 1268;

const HEADER_BOTTOM = DIVIDER_TOP - 6;

const ROW_H = 78;
const MAX_ROWS = 4;

const COL_ICON_LEFT = 9;
const ICON_SIZE = 48;
const ICON_RADIUS = 8;

const COL_STATION_LEFT = 114;
const COL_MATERIAL_LEFT = 350;
const COL_MOVE_LEFT = 592;
const COL_AVAIL_LEFT = 791;
const COL_MIN_LEFT = 985;
const COL_CRIT_LEFT = 1132;

const VERTICAL_DIVIDER_LEFT = 960;

const COL_STATION_W = COL_MATERIAL_LEFT - COL_STATION_LEFT - 20;
const COL_MATERIAL_W = 210;
const COL_MOVE_W = COL_AVAIL_LEFT - COL_MOVE_LEFT - 20;
const COL_AVAIL_W = VERTICAL_DIVIDER_LEFT - COL_AVAIL_LEFT - 20;
const COL_MIN_W = COL_CRIT_LEFT - COL_MIN_LEFT - 20;
const COL_CRIT_W = TABLE_W - COL_CRIT_LEFT - 20;

const BOTTOM_OFFSET = 30;
const CLOSE_RIGHT = 40;
const CLOSE_W = 111;
const CLOSE_H = 44;
const MOVE_W = 150;
const MOVE_H = 38;
const BTN_GAP = 30;
const BTN_RADIUS = 20;

const ROW_HOVER_BG = 'rgba(102, 110, 254, 0.03)';
const ROW_SELECTED_BG = 'rgba(102, 110, 254, 0.05)';

const MoveOrderStockPickerPopup: React.FC<MoveOrderStockPickerPopupProps> = ({
  isOpen,
  onClose,
  onApply,
  materialUid,
  materialName,
  materialArticle,
  stationOptions,
}) => {
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedStationUid, setSelectedStationUid] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!materialUid) { setRows([]); return; }

    let cancelled = false;
    setIsLoading(true);
    setRows([]);
    setSelectedStationUid(null);

    const loadAll = async () => {
      const collected: AvailabilityRow[] = [];

      for (const st of stationOptions) {
        if (cancelled) return;

        let kuo: StockLevelReg | null = null;
        try {
          const r = await AxiosService.get(
            ConstantInfo.restApiStockLevelControlReg(st.uid, materialUid)
          );
          kuo = (r.data as StockLevelReg) || null;
        } catch { kuo = null; }

        if (cancelled) return;

        let balance: StockBalanceRow | null = null;
        try {
          const r = await AxiosService.get(ConstantInfo.restApiRefillStockBalances(st.uid));
          const list = (r.data || []) as StockBalanceRow[];
          balance = list.find(b => b.materialUid === materialUid) || null;
        } catch { balance = null; }

        if (cancelled) return;

        const free = balance?.cleanQuantity ?? null;
        if (free == null || free <= 0) continue;

        const kuoExists = !!(kuo && (kuo.minStock != null || kuo.criticalStock != null));
        const critical = kuo?.criticalStock ?? null;
        const min = kuo?.minStock ?? null;

        const toMoveMax = kuoExists && critical != null
          ? Math.max(0, free - critical)
          : free;

        collected.push({
          stationUid: st.uid,
          stationName: st.name,
          materialUid,
          materialName,
          materialArticle,
          freeQuantity: free,
          minStock: min,
          criticalStock: critical,
          kuoExists,
          toMoveMax,
        });
      }

      if (cancelled) return;
      setRows(collected);
      setIsLoading(false);
    };

    loadAll();

    return () => { cancelled = true; };
  }, [isOpen, materialUid, materialName, materialArticle, stationOptions]);

  const handleRowClick = (stationUid: string) => {
    setSelectedStationUid(prev => prev === stationUid ? null : stationUid);
  };

  const handleRowDoubleClick = (stationUid: string) => {
    const row = rows.find(r => r.stationUid === stationUid);
    if (!row) return;
    setSelectedStationUid(stationUid);
    onApply({
      stationUid: row.stationUid,
      stationName: row.stationName,
      toMoveMax: row.toMoveMax,
      freeQuantity: row.freeQuantity,
    });
    onClose();
  };

  const selectedRow = useMemo(
    () => rows.find(r => r.stationUid === selectedStationUid) || null,
    [rows, selectedStationUid]
  );

  const handleMove = () => {
    if (!selectedRow) return;
    onApply({
      stationUid: selectedRow.stationUid,
      stationName: selectedRow.stationName,
      toMoveMax: selectedRow.toMoveMax,
      freeQuantity: selectedRow.freeQuantity,
    });
    onClose();
  };

  const handleClose = () => onClose();

  if (!isOpen) return null;

  const headerLabelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: 15,
    color: '#5A607F',
    lineHeight: '18px',
  };

  const cellTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: 14,
    color: '#2D4059',
    lineHeight: '18px',
  };

  const emptyRowsCount = Math.max(0, MAX_ROWS - rows.length);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div
        style={{ width: `${POPUP_W}px`, height: `${POPUP_H}px`, backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: TITLE_TOP, left: 0, right: 0, height: TITLE_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 17, color: '#2D4059', lineHeight: `${TITLE_H}px` }}>
            Доступность номенклатуры
          </span>
        </div>

        <div style={{ position: 'absolute', top: INFO_TOP, right: INFO_RIGHT, height: 18, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 15, color: '#5A607F', lineHeight: '18px' }}>
            Сведения
          </span>
        </div>

        <div style={{ position: 'absolute', top: 0, left: TABLE_LEFT, width: TABLE_W, height: HEADER_BOTTOM }}>
          <div style={{ position: 'absolute', left: COL_STATION_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>Склад</span>
          </div>
          <div style={{ position: 'absolute', left: COL_MATERIAL_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>Номенклатура</span>
          </div>
          <div style={{ position: 'absolute', left: COL_MOVE_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>К перемещению</span>
          </div>
          <div style={{ position: 'absolute', left: COL_AVAIL_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>Доступный остаток</span>
          </div>
          <div style={{ position: 'absolute', left: COL_MIN_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>Мин. остаток</span>
          </div>
          <div style={{ position: 'absolute', left: COL_CRIT_LEFT, bottom: 0, height: 18, display: 'flex', alignItems: 'center' }}>
            <span style={headerLabelStyle}>Крит. остаток</span>
          </div>

          <div style={{
            position: 'absolute',
            left: VERTICAL_DIVIDER_LEFT,
            bottom: 1,
            width: 1,
            height: 16,
            backgroundColor: DIVIDER_COLOR,
          }} />
        </div>

        <div style={{
          position: 'absolute',
          top: DIVIDER_TOP,
          left: DIVIDER_LEFT,
          width: DIVIDER_W,
          height: DIVIDER_THICKNESS,
          backgroundColor: DIVIDER_COLOR,
        }} />

        <div style={{
          position: 'absolute',
          top: DIVIDER_TOP + DIVIDER_THICKNESS,
          left: TABLE_LEFT,
          width: TABLE_W,
          bottom: BOTTOM_OFFSET + CLOSE_H + 20,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {isLoading && (
            <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#A0A3BD' }}>
              Загрузка...
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#A0A3BD' }}>
              Номенклатура не найдена ни на одной станции
            </div>
          )}

          {!isLoading && rows.map((r) => {
            const isHovered = hoveredRow === r.stationUid;
            const isSelected = selectedStationUid === r.stationUid;
            return (
              <div
                key={r.stationUid}
                onMouseEnter={() => setHoveredRow(r.stationUid)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handleRowClick(r.stationUid)}
                onDoubleClick={() => handleRowDoubleClick(r.stationUid)}
                style={{
                  position: 'relative',
                  height: ROW_H,
                  borderBottom: `1px solid ${DIVIDER_COLOR}`,
                  backgroundColor: isSelected ? ROW_SELECTED_BG : (isHovered ? ROW_HOVER_BG : 'transparent'),
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: COL_ICON_LEFT,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    borderRadius: ICON_RADIUS,
                    backgroundColor: '#666EFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img src={StationIcon18White} alt="" style={{ width: 18, height: 18 }} />
                </div>

                <div style={{ position: 'absolute', left: COL_STATION_LEFT, top: 0, height: ROW_H, width: COL_STATION_W, display: 'flex', alignItems: 'center' }}>
                  <span style={cellTextStyle}>{r.stationName}</span>
                </div>

                <div style={{ position: 'absolute', left: COL_MATERIAL_LEFT, top: 0, height: ROW_H, width: COL_MATERIAL_W, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 14,
                    color: '#2D4059',
                    lineHeight: '18px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}>
                    {r.materialName}
                  </span>
                </div>

                <div style={{ position: 'absolute', left: COL_MOVE_LEFT, top: 0, height: ROW_H, width: COL_MOVE_W, display: 'flex', alignItems: 'center' }}>
                  <span style={{ ...cellTextStyle, color: '#666EFE' }}>
                    {r.toMoveMax != null ? r.toMoveMax : '—'}
                  </span>
                </div>

                <div style={{ position: 'absolute', left: COL_AVAIL_LEFT, top: 0, height: ROW_H, width: COL_AVAIL_W, display: 'flex', alignItems: 'center' }}>
                  <span style={cellTextStyle}>{r.freeQuantity != null ? r.freeQuantity : '—'}</span>
                </div>

                <div style={{ position: 'absolute', left: COL_MIN_LEFT, top: 0, height: ROW_H, width: COL_MIN_W, display: 'flex', alignItems: 'center' }}>
                  <span style={cellTextStyle}>{r.minStock != null ? r.minStock : '-'}</span>
                </div>

                <div style={{ position: 'absolute', left: COL_CRIT_LEFT, top: 0, height: ROW_H, width: COL_CRIT_W, display: 'flex', alignItems: 'center' }}>
                  <span style={{ ...cellTextStyle, color: r.kuoExists ? '#2D4059' : '#A0A3BD' }}>
                    {r.kuoExists
                      ? (r.criticalStock != null ? r.criticalStock : '-')
                      : 'КУО не задано'}
                  </span>
                </div>

                <div style={{
                  position: 'absolute',
                  left: VERTICAL_DIVIDER_LEFT,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 1,
                  height: 16,
                  backgroundColor: DIVIDER_COLOR,
                }} />
              </div>
            );
          })}

          {!isLoading && rows.length > 0 && Array.from({ length: emptyRowsCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                position: 'relative',
                height: ROW_H,
                borderBottom: `1px solid ${DIVIDER_COLOR}`,
              }}
            />
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: BOTTOM_OFFSET,
          right: CLOSE_RIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: BTN_GAP,
        }}>
          <button
            onClick={handleMove}
            disabled={!selectedRow}
            style={{
              width: MOVE_W,
              height: MOVE_H,
              borderRadius: BTN_RADIUS,
              border: 'none',
              backgroundColor: '#FFFFFF',
              color: '#2D4059',
              cursor: !selectedRow ? 'not-allowed' : 'pointer',
              opacity: !selectedRow ? 0.5 : 1,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Переместить
          </button>
          <button
            onClick={handleClose}
            style={{
              width: CLOSE_W,
              height: CLOSE_H,
              borderRadius: BTN_RADIUS,
              border: 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 400,
              color: '#2D4059',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveOrderStockPickerPopup;