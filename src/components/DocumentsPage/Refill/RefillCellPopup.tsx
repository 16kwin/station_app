// RefillCellPopup.tsx — попап редактирования количества на пополнение
import React, { useEffect, useState, useCallback, useRef } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import FormField from '../../elements/FormField';
import ShipmentIcon18Blue from '../../../assets/Icons/ShipmentIcons/ShipmentIcon18Blue.svg';
import ShipmentIcon18Gray from '../../../assets/Icons/ShipmentIcons/ShipmentIcon18Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import ArticleIcon18Gray from '../../../assets/Icons/ArticleIcons/ArticleIcon18Gray.svg';
import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';
import ManyUsageIcon16Blue from '../../../assets/Icons/UsageIcons/ManyUsageIcon16Blue.svg';
import OneUsageIcon16Gray from '../../../assets/Icons/UsageIcons/OneUsageIcon16Gray.svg';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import LinkIcons14Blue from '../../../assets/Icons/LinkIcons/LinkIcons14Blue.svg';
import WriteIcon20White from '../../../assets/Icons/WriteIcons/WriteIcon20White.svg';

import RefillStockWarningPopup from './RefillStockWarningPopup';
import type { StockWarningReservation } from './RefillStockWarningPopup';

interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  cellAssignmentName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  refillQuantity?: number | null;
  minStockSnapshot?: number | null;
  criticalStockSnapshot?: number | null;
  stockControlExists?: boolean | null;
  stockAvailable?: number | null;
  stockMinStock?: number | null;
  stockCriticalStock?: number | null;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
  codeMaterial: number | null;
  usage: boolean | null;
  imageUrl: string | null;
}

interface ReservationDto {
  uid: string;
  docRefillUid: string | null;
  docRefillCode: number | null;
  materialUid: string | null;
  materialName: string | null;
  materialArticle: string | null;
  materialCode: number | null;
  stockUid: string | null;
  reservedQuantity: number | null;
  blocked: boolean | null;
  author: string | null;
  authorFullName: string | null;
  docStationUid: string | null;
  docStationName: string | null;
  docSectionName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RefillCellPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cell: RefillCell | null;
  onSave: (uid: string, value: number | null) => void;
  readOnly?: boolean;
  onOpenNomenclatureCard?: (materialUid: string) => void;
  docRefillUid?: string | null;
}

const pluralizeUnits = (n: number): string => {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return 'единиц';
  if (lastDigit === 1) return 'единица';
  if (lastDigit >= 2 && lastDigit <= 4) return 'единицы';
  return 'единиц';
};

const RefillCellPopup: React.FC<RefillCellPopupProps> = ({
  isOpen, onClose, cell, onSave, readOnly = false, onOpenNomenclatureCard, docRefillUid,
}) => {
  const { openTab } = useTabs();
  const [value, setValue] = useState<string>('');
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  const [infoTooltipOpen, setInfoTooltipOpen] = useState(false);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);

  const [stockWarning, setStockWarning] = useState<null | 'critical' | 'insufficient'>(null);

  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && cell) {
      const rq = cell.refillQuantity;
      setValue(rq != null && Number(rq) > 0 ? String(rq) : '-');
      setFullscreenImage(false);
      setMaterialDetail(null);
      setInfoTooltipOpen(false);
      setReservations([]);
      setReservationsLoaded(false);
      setStockWarning(null);
      if (cell.materialUid) {
        loadMaterialDetail(cell.materialUid);
      }
    }
  }, [isOpen, cell]);

  useEffect(() => {
    if (!infoTooltipOpen) return;
    const handler = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoTooltipOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [infoTooltipOpen]);

  const loadMaterialDetail = useCallback(async (uid: string) => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid));
      const data = res.data;

      let imageUrl: string | null = null;
      try {
        const imagesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid));
        const images = imagesRes.data || [];
        if (images.length > 0) {
          imageUrl = `${ConstantInfo.fileDir}uploads/nomenclature/${uid}/${images[0].filePath}`;
        }
      } catch {}

      let codeValue: number | null = data.codeMaterial ?? data.code ?? null;
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = (codesRes.data || []) as Array<{ codeKind: string; codeValue: string }>;
        const codeEntry = codes.find(c => c.codeKind === 'CODE');
        if (codeEntry && codeEntry.codeValue) {
          const parsed = Number(codeEntry.codeValue);
          if (!Number.isNaN(parsed)) codeValue = parsed;
        }
      } catch {}

      setMaterialDetail({
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
        codeMaterial: codeValue,
        usage: typeof data.usage === 'boolean' ? data.usage : null,
        imageUrl,
      });
    } catch (e) {
      console.error('Ошибка загрузки деталей номенклатуры:', e);
      setMaterialDetail(null);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    if (!cell?.materialUid) {
      setReservations([]);
      setReservationsLoaded(true);
      return;
    }
    try {
      const res = await AxiosService.get(
        ConstantInfo.restApiRefillStockReservationsByMaterial(cell.materialUid)
      );
      const list = (res.data || []) as ReservationDto[];
      const filtered = list.filter(r => r.blocked === false && r.docRefillUid !== docRefillUid);
      setReservations(filtered);
    } catch (e) {
      console.error('Ошибка загрузки броней:', e);
      setReservations([]);
    } finally {
      setReservationsLoaded(true);
    }
  }, [cell?.materialUid, docRefillUid]);

  const handleInfoClick = () => {
    const next = !infoTooltipOpen;
    setInfoTooltipOpen(next);
    if (next && !reservationsLoaded) {
      loadReservations();
    }
  };

  if (!isOpen || !cell) return null;

  const requestQty = (() => {
    const v = value === '' || value === '-' ? 0 : Number(value);
    return Number.isFinite(v) ? v : 0;
  })();

  const stockAvailable = cell.stockAvailable ?? null;
  const stockMin = cell.stockMinStock ?? null;
  const stockCritical = cell.stockCriticalStock ?? null;

  const checkStock = (): null | 'critical' | 'insufficient' => {
    if (stockAvailable == null) return null;
    if (requestQty <= 0) return null;
    const after = stockAvailable - requestQty;
    if (after < 0) return 'insufficient';
    if (stockCritical != null && after < stockCritical) return 'critical';
    return null;
  };

  const performSave = () => {
    if (readOnly) return;
    const num = value === '' || value === '-' ? null : Number(value);
    onSave(cell.uid, num);
    onClose();
  };

  const handleSave = () => {
    if (readOnly) return;
    const kind = checkStock();
    if (kind) {
      if (!reservationsLoaded) loadReservations();
      setStockWarning(kind);
      return;
    }
    performSave();
  };

  const handleConfirmStock = () => {
    setStockWarning(null);
    performSave();
  };

  const handleCloseStockWarning = () => {
    setStockWarning(null);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (digits === '') {
      setValue('-');
      return;
    }
    const maxRefill = cell.templateQuantity != null
      ? Math.max(0, Number(cell.templateQuantity) - Number(cell.factQuantity ?? 0))
      : null;
    if (maxRefill != null && Number(digits) > maxRefill) {
      setValue(String(maxRefill));
      return;
    }
    setValue(digits);
  };

  const materialUidForCard = materialDetail?.uid || cell.materialUid || null;

  const handleOpenCard = () => {
    if (!materialUidForCard) return;
    if (onOpenNomenclatureCard) {
      onOpenNomenclatureCard(materialUidForCard);
      return;
    }
    const code = materialDetail?.codeMaterial ?? 0;
    const name = materialDetail?.nameMaterial || cell.materialName || materialUidForCard;
    openTab(
      `/references/nomenclature/edit/${materialUidForCard}/${code}`,
      `Номенклатура: ${name}`,
      null
    );
  };

  const POPUP_W = 1052;
  const POPUP_H = 602;

  const LEFT_OFFSET = 40;
  const LEFT_TOP = 89;
  const FIELD_WIDTH = 446;
  const FIELD_HEIGHT = 44;
  const LABEL_HEIGHT = 17;
  const LABEL_TO_FIELD = 11;
  const FIELD_TO_FIELD = 25;

  const pos1Label = LEFT_TOP;
  const pos1Field = pos1Label + LABEL_HEIGHT + LABEL_TO_FIELD;
  const pos2Label = pos1Field + FIELD_HEIGHT + FIELD_TO_FIELD;
  const pos2Field = pos2Label + LABEL_HEIGHT + LABEL_TO_FIELD;
  const pos3Label = pos2Field + FIELD_HEIGHT + FIELD_TO_FIELD;
  const pos3Field = pos3Label + LABEL_HEIGHT + LABEL_TO_FIELD;
  const pos4Label = pos3Field + FIELD_HEIGHT + FIELD_TO_FIELD;
  const pos4Field = pos4Label + LABEL_HEIGHT + LABEL_TO_FIELD;
  const pos5Label = pos4Field + FIELD_HEIGHT + FIELD_TO_FIELD;
  const pos5Field = pos5Label + LABEL_HEIGHT + LABEL_TO_FIELD;

  const RIGHT_TOP = 89;
  const RIGHT_LEFT = POPUP_W / 2 + 40;
  const RIGHT_FIELD_W = 216;
  const RIGHT_FIELD_H = 44;

  const posArticleLabel = RIGHT_TOP;
  const posArticleField = posArticleLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posUsageLabel = posArticleField + RIGHT_FIELD_H + FIELD_TO_FIELD;
  const posUsageField = posUsageLabel + LABEL_HEIGHT + LABEL_TO_FIELD;

  const IMAGE_COL_LEFT = RIGHT_LEFT + RIGHT_FIELD_W + 30;
  const posImageLabel = RIGHT_TOP;
  const posImageField = posImageLabel + LABEL_HEIGHT + 11;
  const IMAGE_FIELD_H = 200;

  const CARD_BTN_W = 200;
  const CARD_BTN_H = 38;
  const posCardButton = posImageField + IMAGE_FIELD_H + 30;

  const INFO_BOTTOM = 43;
  const INFO_LINE_TO_ICON = 40;
  const INFO_ICON_SIZE = 18;
  const INFO_ICON_TO_TEXT = 8;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#2D4059',
    lineHeight: `${LABEL_HEIGHT}px`,
    display: 'block',
  };

  const hasImage = !!materialDetail?.imageUrl;
  const usageValue = materialDetail?.usage === true ? 'Многоразовое' : materialDetail?.usage === false ? 'Одноразовое' : '';
  const usageIcon = materialDetail?.usage === true ? ManyUsageIcon16Blue : OneUsageIcon16Gray;

  const qtyActive = true;

  const minStock = cell.minStockSnapshot ?? null;
  const factQty = cell.factQuantity ?? 0;
  const needToLoad = minStock != null ? Math.max(0, minStock - factQty) : null;

  const openDocByCode = (docUid: string | null | undefined, code: number | null | undefined) => {
    if (!docUid) return;
    openTab(
      `/documents/refill/edit/${docUid}`,
      `Пополнение: ${code != null ? String(code).padStart(4, '0') : ''}`.trim(),
      null
    );
  };

  const tipText: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: 13,
    lineHeight: '18px',
    color: '#FFFFFF',
  };
  const tipAccent: React.CSSProperties = {
    fontWeight: 500,
    color: '#666EFE',
  };

  const renderInfoLines = () => {
    const lines: React.ReactNode[] = [];

    if (minStock != null) {
      lines.push(
        <div key="min" style={tipText}>
          Минимальный уровень остатка выбранной номенклатуры для этой станции:{' '}
          <span style={tipAccent}>{minStock}</span>{' '}
          <span style={tipAccent}>{pluralizeUnits(minStock)}</span>
        </div>
      );
    }

    if (needToLoad != null && needToLoad > 0) {
      lines.push(
        <div key="need" style={tipText}>
          Для достижения минимального уровня остатка необходимо загрузить:{' '}
          <span style={tipAccent}>{needToLoad}</span>{' '}
          <span style={tipAccent}>{pluralizeUnits(needToLoad)}</span>
        </div>
      );
    }

    if (stockAvailable != null) {
      lines.push(
        <div key="avail" style={tipText}>
          Доступный остаток на основном складе:{' '}
          <span style={tipAccent}>{stockAvailable}</span>{' '}
          <span style={tipAccent}>{pluralizeUnits(stockAvailable)}</span>
        </div>
      );
    }

    if (reservationsLoaded && reservations.length > 0) {
      reservations.forEach((r) => {
        const who = r.authorFullName || r.author || '';
        const station = r.docStationName || '';
        const section = r.docSectionName || '';
        const where = station
          ? (section ? `в станции участка ${section}` : `в станции ${station}`)
          : '';
        const prefix = who
          ? `Заблокировано оператором склада ${who}`
          : 'Заблокировано';
        const suffix = where ? ` для размещения ${where}` : '';
        const qty = r.reservedQuantity ?? 0;
        lines.push(
          <div key={r.uid} style={tipText}>
            {prefix}{suffix}:{' '}
            <span style={tipAccent}>{qty}</span>{' '}
            <span style={tipAccent}>{pluralizeUnits(qty)}</span>
            {r.docRefillUid && (
              <>
                {' '}
                <span
                  onClick={(e) => { e.stopPropagation(); openDocByCode(r.docRefillUid, r.docRefillCode); }}
                  style={{
                    color: '#666EFE',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  №{r.docRefillCode != null ? String(r.docRefillCode).padStart(4, '0') : ''}
                </span>
              </>
            )}
          </div>
        );
      });
    }

    return lines;
  };

  const INFO_TOOLTIP_W = 463;
  const INFO_PADDING = 25;
  const INFO_GAP = 18;
  const ARROW_LEFT = 22;

  const cellAddress = `${cell.columnNumber ?? 0}-${cell.numberCell ?? 0}`;

  const reservationsForWarning: StockWarningReservation[] = reservations.map(r => ({
    uid: r.uid,
    docRefillUid: r.docRefillUid,
    docRefillCode: r.docRefillCode,
    reservedQuantity: r.reservedQuantity,
  }));

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}>
        <div style={{ width: POPUP_W, height: POPUP_H, backgroundColor: '#FFFFFF', borderRadius: 15, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}>

          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: '#2D4059', lineHeight: '19px' }}>
              Выбранная ячейка: {cell.columnNumber ?? 0} - {cell.numberCell ?? 0}
            </span>
          </div>

          <div style={{ position: 'absolute', top: 79, left: '50%', transform: 'translateX(-50%)', width: '1px', height: '493px', backgroundColor: 'rgba(160, 163, 189, 0.2)' }} />

          <div
            ref={infoRef}
            style={{
              position: 'absolute',
              bottom: INFO_BOTTOM,
              left: `calc(50% + ${INFO_LINE_TO_ICON}px)`,
            }}
          >
            <div
              onClick={handleInfoClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: INFO_ICON_TO_TEXT,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <img src={InfoIcon18Black} alt="" style={{ width: INFO_ICON_SIZE, height: INFO_ICON_SIZE, display: 'block' }} />
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 14,
                color: '#2D4059',
                lineHeight: `${INFO_ICON_SIZE}px`,
              }}>
                Информация
              </span>
            </div>

            {infoTooltipOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 14px)',
                  left: 0,
                  width: INFO_TOOLTIP_W,
                  padding: INFO_PADDING,
                  boxSizing: 'border-box',
                  backgroundColor: '#2D4059',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  zIndex: 10010,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: INFO_GAP,
                }}
              >
                {renderInfoLines()}

                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: ARROW_LEFT,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #2D4059',
                }} />
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%' }}>
            <div style={{ position: 'absolute', top: pos1Label, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Количество к загрузке:</span>
            </div>
            <div style={{ position: 'absolute', top: pos1Field, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={value}
                placeholder="-"
                type="input"
                inputType="text"
                disabled={readOnly}
                active={qtyActive}
                icon={readOnly ? ShipmentIcon18Gray : ShipmentIcon18Blue}
                iconActive={ShipmentIcon18Blue}
                iconWidth={18}
                iconHeight={12}
                onChange={handleValueChange}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>

            <div style={{ position: 'absolute', top: pos2Label, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Номенклатура:</span>
            </div>
            <div style={{ position: 'absolute', top: pos2Field, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={cell.materialName || ''}
                type="input"
                disabled
                icon={NomenclatureIcon16Gray}
                iconActive={NomenclatureIcon16Blue}
                iconWidth={16}
                iconHeight={18}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>

            <div style={{ position: 'absolute', top: pos3Label, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Назначение ячейки:</span>
            </div>
            <div style={{ position: 'absolute', top: pos3Field, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={cell.cellAssignmentName || ''}
                type="input"
                disabled
                icon={AccountingIcon16Gray}
                iconActive={AccountingIcon16Blue}
                iconWidth={16}
                iconHeight={16}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>

            <div style={{ position: 'absolute', top: pos4Label, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Остаток в ячейке:</span>
            </div>
            <div style={{ position: 'absolute', top: pos4Field, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={cell.factQuantity != null ? String(cell.factQuantity) : ''}
                type="input"
                disabled
                icon={CodeIcon20Gray}
                iconActive={CodeIcon20Blue}
                iconWidth={20}
                iconHeight={14}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>

            <div style={{ position: 'absolute', top: pos5Label, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Количество по схеме (максимум):</span>
            </div>
            <div style={{ position: 'absolute', top: pos5Field, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={cell.templateQuantity != null ? String(cell.templateQuantity) : ''}
                type="input"
                disabled
                icon={CodeIcon20Gray}
                iconActive={CodeIcon20Blue}
                iconWidth={20}
                iconHeight={14}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>
          </div>

          <div style={{ position: 'absolute', top: posArticleLabel, left: RIGHT_LEFT }}>
            <FormField
              width={RIGHT_FIELD_W}
              height={RIGHT_FIELD_H}
              label="Артикул:"
              value={cell.materialArticle || materialDetail?.article || ''}
              type="input"
              disabled
              icon={ArticleIcon18Gray}
              iconActive={ArticleIcon18Blue}
              iconWidth={16}
              iconHeight={9}
              labelMarginBottom={LABEL_TO_FIELD}
            />
          </div>

          <div style={{ position: 'absolute', top: posUsageLabel, left: RIGHT_LEFT }}>
            <FormField
              width={RIGHT_FIELD_W}
              height={RIGHT_FIELD_H}
              label="Использование:"
              value={usageValue}
              type="input"
              disabled
              icon={usageIcon}
              iconWidth={16}
              iconHeight={16}
              labelMarginBottom={LABEL_TO_FIELD}
            />
          </div>

          <div style={{ position: 'absolute', top: posImageLabel, left: IMAGE_COL_LEFT }}>
            <span style={labelStyle}>Изображение</span>
          </div>
          <div style={{ position: 'absolute', top: posImageField, left: IMAGE_COL_LEFT }}>
            <div
              onClick={() => { if (hasImage) setFullscreenImage(true); }}
              style={{
                width: 200, height: 200, borderRadius: 14,
                border: hasImage ? '1px solid #666EFE' : '1px solid #E6E8F8',
                backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
                cursor: hasImage ? 'pointer' : 'default',
              }}
            >
              {hasImage ? (
                <img src={materialDetail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>
                  Нет изображения
                </span>
              )}
            </div>
          </div>

          {materialUidForCard && (
            <div
              onClick={handleOpenCard}
              style={{
                position: 'absolute',
                top: posCardButton,
                left: IMAGE_COL_LEFT,
                width: CARD_BTN_W,
                height: CARD_BTN_H,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center',
                cursor: 'pointer',
                paddingLeft: 16, paddingRight: 13,
                boxSizing: 'border-box', gap: 8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12, color: '#2D4059', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Карточка номенклатуры
              </span>
              <img src={LinkIcons14Blue} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
            {!readOnly && (
              <button
                onClick={handleSave}
                style={{
                  width: 156,
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#666EFE',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 18,
                  paddingRight: 18,
                  boxSizing: 'border-box',
                  gap: 17,
                }}
              >
                <img src={WriteIcon20White} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
                  Сохранить
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                width: 111,
                height: 44,
                borderRadius: 10,
                border: '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#2D4059',
                padding: 0,
              }}
            >
              Закрыть
            </button>
          </div>
        </div>

        {fullscreenImage && materialDetail?.imageUrl && (
          <div
            onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img src={materialDetail.imageUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      {stockWarning && (
        <RefillStockWarningPopup
          isOpen={true}
          kind={stockWarning}
          onClose={handleCloseStockWarning}
          onConfirm={handleConfirmStock}
          materialName={cell.materialName || ''}
          cellAddress={cellAddress}
          requestQty={requestQty}
          stockAvailable={stockAvailable ?? 0}
          minStock={stockMin}
          criticalStock={stockCritical}
          reservations={reservationsForWarning}
          onOpenDoc={(uid) => openDocByCode(uid, reservations.find(r => r.docRefillUid === uid)?.docRefillCode ?? null)}
        />
      )}
    </>
  );
};

export default RefillCellPopup;