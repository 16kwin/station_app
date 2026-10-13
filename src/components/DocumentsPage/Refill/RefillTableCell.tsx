// RefillTableCell.tsx — ячейка документа пополнения
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import ArrowIcon14Down from '../../../assets/Icons/ArrowIcons/ArrowIcon14Down.svg';
import ArrowIcon14Up from '../../../assets/Icons/ArrowIcons/ArrowIcon14Up.svg';
import ControlIcon31Red from '../../../assets/Icons/ControlIcons/ControlIcon31Red.svg';
import ControlIcon17Red from '../../../assets/Icons/ControlIcons/ControlIcon17Red.svg';
import ControlIcon17Orange from '../../../assets/Icons/ControlIcons/ControlIcon17Orange.svg';
import CodeIcon20Black from '../../../assets/Icons/CodeIcons/CodeIcon20Black.svg';
import RefillStockWarningPopup from './RefillStockWarningPopup';
import type { StockWarningReservation } from './RefillStockWarningPopup';

interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialCode?: number | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
  refillQuantity?: number | null;
  stockAvailable?: number | null;
  stockMinStock?: number | null;
  stockCriticalStock?: number | null;
}

interface StockReg { minStock: number | null; criticalStock: number | null; exists: boolean; }

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
  reservedQuantity: number | null;
  blocked: boolean | null;
}

interface RefillTableCellProps {
  cell: RefillCell;
  isSelected: boolean;
  isExpanded: boolean;
  selectedColumn: number;
  onRowClick: (uid: string) => void;
  onCheckboxClick: (uid: string, e: React.MouseEvent) => void;
  onExpandToggle: (uid: string) => void;
  onRefillQuantityChange: (uid: string, value: string) => void;
  onContextMenu?: (uid: string, e: React.MouseEvent) => void;
  onOpenDetails?: (uid: string) => void;
  onDoubleClick?: (uid: string) => void;
  disabled: boolean;
  searchValue?: string;
  setRef: (uid: string, el: HTMLDivElement | null) => void;
  stockReg?: StockReg;
  externalShakeTick?: number;
  onValidationChange?: (uid: string, hasError: boolean) => void;
  docRefillUid?: string | null;
}

const formatAssignmentName = (name: string): string => {
  if (!name) return name;
  if (name === 'Готовая деталь (с производства)') return 'ГД (с производства)';
  if (name === 'Готовая деталь (контроль качества пройден)') return 'ГД (КК пройден)';
  if (name === 'Готовая деталь (контроль качества не пройден)') return 'ГД (КК не пройден)';
  if (name === 'Инструмент на переточку') return 'На переточку';
  if (name === 'На инструмент на переточку') return 'На переточку';
  return name;
};

const formatQty = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '-';
  return String(v);
};

const pluralizeUnits = (n: number): string => {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'единиц';
  if (mod10 === 1) return 'единица';
  if (mod10 >= 2 && mod10 <= 4) return 'единицы';
  return 'единиц';
};

const TOOLTIP_WIDTH = 454;
const TOOLTIP_HEIGHT = 36;
const TOOLTIP_TAIL = 8;

const RefillTableCell: React.FC<RefillTableCellProps> = ({
  cell, isSelected, isExpanded, selectedColumn, onRowClick, onCheckboxClick,
  onExpandToggle, onRefillQuantityChange, onContextMenu, onOpenDetails, onDoubleClick,
  disabled, searchValue, setRef, stockReg,
  externalShakeTick = 0,
  onValidationChange,
  docRefillUid,
}) => {
  const { openTab } = useTabs();

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [invalidTooltipOpen, setInvalidTooltipOpen] = useState(false);
  const [detail, setDetail] = useState<MaterialDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; direction: 'up' | 'down' } | null>(null);

  const [stockWarning, setStockWarning] = useState<null | 'critical' | 'insufficient'>(null);
  const [stockReservations, setStockReservations] = useState<StockWarningReservation[]>([]);
  const [pendingCommit, setPendingCommit] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTickRef = useRef<number>(externalShakeTick);
  const qtyBlockRef = useRef<HTMLDivElement>(null);

  const cellNumber = `${cell.columnNumber ?? 0}-${cell.numberCell ?? 0}`;

  const hasData = !!cell.materialUid;
  const hasAssignment = !!cell.cellAssignmentUid;
  const materialName = cell.materialName || '';
  const materialArticle = cell.materialArticle || '';
  const purposesText = cell.cellAssignmentName || '-';
  const assignmentDisplay = formatAssignmentName(purposesText);

  const isTmcAssignment = cell.cellAssignmentName === 'ТМЦ';
  const isEmptyByTemplate = !hasData && !hasAssignment;
  const isLikeEmpty = isEmptyByTemplate || !isTmcAssignment;

  const notEditable = disabled || isLikeEmpty;

  const canExpand = isTmcAssignment && !isEmptyByTemplate;

  const hasKuo = !!(stockReg && stockReg.exists);

  let controlIcon: string | null = null;
  let controlIconWidth = 0;
  let controlIconHeight = 0;
  if (hasData) {
    if (!stockReg || !stockReg.exists) {
      controlIcon = ControlIcon31Red;
      controlIconWidth = 31;
      controlIconHeight = 18;
    } else {
      const fact = Number(cell.factQuantity ?? 0);
      const minS = stockReg.minStock;
      const critS = stockReg.criticalStock;
      if (critS != null && fact < critS) {
        controlIcon = ControlIcon17Red;
        controlIconWidth = 17;
        controlIconHeight = 17;
      } else if (minS != null && fact < minS) {
        controlIcon = ControlIcon17Orange;
        controlIconWidth = 17;
        controlIconHeight = 17;
      } else {
        controlIcon = null;
      }
    }
  }

  const backgroundColor = isSelected ? '#DEEEFF' : (isHovered ? '#F5FAFF' : '#FFFFFF');
  const COLLAPSED_HEIGHT = 80;
  const EXPANDED_HEIGHT = 240;

  const CHECKBOX_LEFT = 20;
  const CHECKBOX_SIZE = 18;

  const COL_NUMBER_CELL = 60;
  const COL_CONTROL_ICON_LEFT = 173;
  const COL_NOMENCLATURE = 223;
  const COL_REFILL_QTY = 639;
  const COL_FACT_QTY = 769;
  const COL_SCHEME_QTY = 887;
  const COL_ASSIGNMENT = 1008;

  const TOP_PADDING = 11;

  const expandedBoxBg = isSelected ? '#CDE4FF' : (isExpanded ? 'rgba(225, 236, 253, 0.46)' : '#FFFFFF');
  const expandedBoxShadow = isSelected ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)';

  const nomenclatureDisplay = hasData
    ? (materialArticle ? `${materialName} (${materialArticle})` : materialName)
    : (hasAssignment ? assignmentDisplay : '-');

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const loadDetail = useCallback(async (uid: string): Promise<MaterialDetail | null> => {
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

      const d: MaterialDetail = {
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
        codeMaterial: codeValue,
        usage: typeof data.usage === 'boolean' ? data.usage : null,
        imageUrl,
      };
      setDetail(d);
      return d;
    } catch (e) {
      console.error('Ошибка загрузки деталей ячейки:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      setDetail(null);
      setFullscreenImage(false);
      return;
    }
    if (!canExpand) return;
    if (detail) return;
    if (!cell.materialUid) return;
    setDetailLoading(true);
    loadDetail(cell.materialUid).finally(() => setDetailLoading(false));
  }, [isExpanded, canExpand, cell.materialUid, detail, loadDetail]);

  const getMaxRefill = useCallback((): number | null => {
    if (cell.templateQuantity == null) return null;
    const fact = Number(cell.factQuantity ?? 0);
    return Math.max(0, Number(cell.templateQuantity) - fact);
  }, [cell.templateQuantity, cell.factQuantity]);

  const isCurrentInvalid = useCallback((): boolean => {
    const maxRefill = getMaxRefill();
    const cur = cell.refillQuantity != null ? Number(cell.refillQuantity) : null;
    if (maxRefill == null || cur == null) return false;
    return cur > maxRefill;
  }, [getMaxRefill, cell.refillQuantity]);

  const invalid = isCurrentInvalid();

  useEffect(() => {
    if (!onValidationChange) return;
    onValidationChange(cell.uid, invalid);
  }, [cell.uid, cell.refillQuantity, cell.factQuantity, cell.templateQuantity, invalid, onValidationChange]);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setShowWarning(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setIsShaking(false), 500);
  }, []);

  useEffect(() => {
    if (externalShakeTick !== prevTickRef.current) {
      prevTickRef.current = externalShakeTick;
      if (isCurrentInvalid()) {
        triggerShake();
      }
    }
  }, [externalShakeTick, isCurrentInvalid, triggerShake]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!invalidTooltipOpen) return;
    const handler = () => setInvalidTooltipOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [invalidTooltipOpen]);

  const updateTooltipPosition = useCallback(() => {
    const el = qtyBlockRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    const spaceAbove = rect.top;
    const placeDown = spaceAbove < TOOLTIP_HEIGHT + TOOLTIP_TAIL + 8;

    let left = centerX - TOOLTIP_WIDTH / 2;
    const margin = 8;
    if (left < margin) left = margin;
    if (left + TOOLTIP_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - margin - TOOLTIP_WIDTH;
    }

    let top: number;
    if (placeDown) {
      top = rect.top + TOOLTIP_TAIL;
    } else {
      top = rect.top - TOOLTIP_TAIL - TOOLTIP_HEIGHT;
    }

    setTooltipPos({ left, top, direction: placeDown ? 'down' : 'up' });
  }, []);

  useEffect(() => {
    if (!invalidTooltipOpen) return;
    updateTooltipPosition();
    const onResize = () => updateTooltipPosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [invalidTooltipOpen, updateTooltipPosition]);

  useEffect(() => {
    if (!invalidTooltipOpen) return;
    const onScroll = () => setInvalidTooltipOpen(false);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [invalidTooltipOpen]);

  const handleQtyClick = (e: React.MouseEvent) => {
    if (notEditable) return;
    e.stopPropagation();
    setEditValue(cell.refillQuantity == null ? '' : String(cell.refillQuantity));
    setShowWarning(false);
    setInvalidTooltipOpen(false);
    setIsEditing(true);
  };

  const checkOverflow = useCallback((raw: string): boolean => {
    const trimmed = raw.replace(/[^0-9]/g, '');
    if (trimmed === '') return false;
    const num = Number(trimmed);
    const maxRefill = getMaxRefill();
    if (maxRefill == null) return false;
    return num > maxRefill;
  }, [getMaxRefill]);

  const handleChangeValue = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits === '' || digits === '0') {
      setEditValue('');
      setShowWarning(false);
      setInvalidTooltipOpen(false);
      return;
    }
    const normalized = String(Number(digits));
    if (normalized === '0') {
      setEditValue('');
      setShowWarning(false);
      setInvalidTooltipOpen(false);
      return;
    }
    const isOverflow = checkOverflow(normalized);
    if (isOverflow) {
      triggerShake();
      setInvalidTooltipOpen(true);
      setTimeout(() => updateTooltipPosition(), 0);
    } else {
      setShowWarning(false);
      setInvalidTooltipOpen(false);
    }
    setEditValue(normalized);
  };

  const checkStockWarning = (qty: number): null | 'critical' | 'insufficient' => {
    if (qty <= 0) return null;
    const stockAvailable = cell.stockAvailable;
    if (stockAvailable == null) return null;
    const after = stockAvailable - qty;
    const crit = cell.stockCriticalStock ?? null;
    if (after < 0) return 'insufficient';
    if (crit != null && after < crit) return 'critical';
    return null;
  };

  const loadStockReservations = useCallback(async () => {
    if (!cell.materialUid) {
      setStockReservations([]);
      return;
    }
    try {
      const res = await AxiosService.get(
        ConstantInfo.restApiRefillStockReservationsByMaterial(cell.materialUid)
      );
      const list = (res.data || []) as ReservationDto[];
      const filtered = list
        .filter(r => r.blocked === false && r.docRefillUid !== docRefillUid)
        .map(r => ({
          uid: r.uid,
          docRefillUid: r.docRefillUid,
          docRefillCode: r.docRefillCode,
          reservedQuantity: r.reservedQuantity,
        }));
      setStockReservations(filtered);
    } catch (e) {
      console.error('[RefillTableCell][loadStockReservations] error:', e);
      setStockReservations([]);
    }
  }, [cell.materialUid, docRefillUid]);

  const commitValue = useCallback((trimmed: string) => {
    setIsEditing(false);
    setShowWarning(false);
    setInvalidTooltipOpen(false);
    onRefillQuantityChange(cell.uid, trimmed);
  }, [cell.uid, onRefillQuantityChange]);

  const handleQtyBlur = () => {
    const trimmed = editValue.replace(/[^0-9]/g, '');
    const isOverflow = checkOverflow(trimmed);
    if (isOverflow) {
      setEditValue(cell.refillQuantity == null ? '' : String(cell.refillQuantity));
      setIsEditing(false);
      setShowWarning(false);
      setInvalidTooltipOpen(false);
      return;
    }
    const num = trimmed === '' ? 0 : Number(trimmed);
    const kind = checkStockWarning(num);
    if (kind) {
      setPendingCommit(trimmed);
      setStockWarning(kind);
      if (!cell.stockAvailable) setStockReservations([]);
      loadStockReservations();
      return;
    }
    commitValue(trimmed);
  };

  const handleConfirmStockWarning = () => {
    const trimmed = pendingCommit ?? '';
    setStockWarning(null);
    setPendingCommit(null);
    commitValue(trimmed);
  };

  const handleCloseStockWarning = () => {
    setStockWarning(null);
    setPendingCommit(null);
    setEditValue(cell.refillQuantity == null ? '' : String(cell.refillQuantity));
    setIsEditing(false);
    setShowWarning(false);
    setInvalidTooltipOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setEditValue(cell.refillQuantity == null ? '' : String(cell.refillQuantity));
      setIsEditing(false);
      setShowWarning(false);
      setInvalidTooltipOpen(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onContextMenu) return;
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(cell.uid, e);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canExpand) return;
    onExpandToggle(cell.uid);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!canExpand) return;
    e.stopPropagation();
    onDoubleClick?.(cell.uid);
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
    color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px',
  };
  const valueStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15,
    height: 18, lineHeight: '18px', marginTop: 4, color: 'rgba(45, 64, 89, 0.5)',
  };
  const valueStyleFull: React.CSSProperties = { ...valueStyle, color: '#2D4059' };

  const refillDisplay = cell.refillQuantity == null || Number(cell.refillQuantity) === 0
    ? '-'
    : String(cell.refillQuantity);

  const fieldInvalid = showWarning || invalid;

  const refillColor = notEditable
    ? 'rgba(45, 64, 89, 0.5)'
    : (fieldInvalid ? '#FF3052' : '#666EFE');
  const refillLabelColor = notEditable
    ? 'rgba(45, 64, 89, 0.5)'
    : (fieldInvalid ? '#FF3052' : '#666EFE');

  const schemeValueColor = (isEditing && showWarning) ? '#FF3052' : 'rgba(45, 64, 89, 0.5)';
  const schemeLabelColor = (isEditing && showWarning) ? '#FF3052' : 'rgba(45, 64, 89, 0.5)';

  const hasImage = !!detail?.imageUrl;

  const showTooltip = invalidTooltipOpen && isEditing && showWarning;

  const tooltipTailOffsetFromLeft = (() => {
    if (!tooltipPos || !qtyBlockRef.current) return TOOLTIP_WIDTH / 2;
    const rect = qtyBlockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const offset = centerX - tooltipPos.left;
    return Math.max(TOOLTIP_TAIL, Math.min(TOOLTIP_WIDTH - TOOLTIP_TAIL, offset));
  })();

  const tooltip = showTooltip && tooltipPos
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="invalid-tooltip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: tooltipPos.left,
              top: tooltipPos.top,
              width: TOOLTIP_WIDTH,
              height: TOOLTIP_HEIGHT,
              padding: '0 17px',
              backgroundColor: '#2D4059',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              zIndex: 99999,
              color: '#FFFFFF',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: '#FFFFFF',
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              display: 'block',
              textAlign: 'center',
            }}>
              Введите меньшее или равное значение согласно схеме загрузки
            </span>

            {tooltipPos.direction === 'up' && (
              <div style={{
                position: 'absolute',
                bottom: -TOOLTIP_TAIL,
                left: tooltipTailOffsetFromLeft,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: `${TOOLTIP_TAIL}px solid transparent`,
                borderRight: `${TOOLTIP_TAIL}px solid transparent`,
                borderTop: `${TOOLTIP_TAIL}px solid #2D4059`,
              }} />
            )}

            {tooltipPos.direction === 'down' && (
              <div style={{
                position: 'absolute',
                top: -TOOLTIP_TAIL,
                left: tooltipTailOffsetFromLeft,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: `${TOOLTIP_TAIL}px solid transparent`,
                borderRight: `${TOOLTIP_TAIL}px solid transparent`,
                borderBottom: `${TOOLTIP_TAIL}px solid #2D4059`,
              }} />
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  const minStockNum = stockReg?.minStock ?? null;
  const critStockNum = stockReg?.criticalStock ?? null;

  const minStockText = minStockNum != null ? `${minStockNum} ${pluralizeUnits(minStockNum)}` : '';
  const critStockText = critStockNum != null ? `${critStockNum} ${pluralizeUnits(critStockNum)}` : '';

  const requestQtyForWarning = pendingCommit == null || pendingCommit === '' ? 0 : Number(pendingCommit);

  // Код номенклатуры для раскрытого блока
  const materialCodeDisplay = detail?.codeMaterial != null
    ? String(detail.codeMaterial).padStart(4, '0')
    : '—';

  return (
    <>
      <motion.div
        ref={(el) => { setRef(cell.uid, el); }}
        onClick={() => onRowClick(cell.uid)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={
          isShaking
            ? { height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, x: [0, -6, 6, -4, 4, -2, 2, 0] }
            : { height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, x: 0 }
        }
        transition={
          isShaking
            ? { x: { duration: 0.5, ease: 'easeInOut' }, height: { type: 'tween', duration: 0.25, ease: 'easeInOut' } }
            : { type: 'tween', duration: 0.25, ease: 'easeInOut' }
        }
        style={{
          backgroundColor, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          position: 'relative', transition: 'background-color 0.2s ease',
          borderLeft: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          borderRight: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: '#E5E7EB' }} />

        <div onClick={(e) => onCheckboxClick(cell.uid, e)}
          style={{ position: 'absolute', left: CHECKBOX_LEFT, top: 40, transform: 'translateY(-50%)', width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, cursor: 'pointer', zIndex: 2 }}>
          <img src={isSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, display: 'block' }} />
        </div>

        <div style={{ paddingTop: TOP_PADDING, height: COLLAPSED_HEIGHT, width: '100%', position: 'relative' }}>

          <div style={{ position: 'absolute', left: COL_NUMBER_CELL, top: TOP_PADDING }}>
            <div style={labelStyle}>Номер ячейки</div>
            <div style={{ ...valueStyleFull, height: 18 }}>{cellNumber}</div>
          </div>

          {controlIcon && (
            <div style={{
              position: 'absolute',
              left: COL_CONTROL_ICON_LEFT,
              top: 40,
              transform: 'translateY(-50%)',
              width: controlIconWidth,
              height: controlIconHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <img src={controlIcon} alt="" style={{ width: controlIconWidth, height: controlIconHeight, display: 'block' }} />
            </div>
          )}

          <div style={{ position: 'absolute', left: COL_NOMENCLATURE, top: TOP_PADDING, width: COL_REFILL_QTY - COL_NOMENCLATURE - 20 }}>
            <div style={labelStyle}>Номенклатура</div>
            <div style={{
              ...valueStyle, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis', height: 36, maxHeight: 36,
            }}>
              {nomenclatureDisplay}
            </div>
          </div>

          <div ref={qtyBlockRef} style={{ position: 'absolute', left: COL_REFILL_QTY, top: TOP_PADDING, width: 110 }} onClick={handleQtyClick}>
            <div style={{ ...labelStyle, color: refillLabelColor, transition: 'color 0.15s ease' }}>К загрузке</div>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={editValue}
                onChange={(e) => handleChangeValue(e.target.value)}
                onBlur={handleQtyBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                disabled={notEditable}
                style={{
                  width: 110, height: 22, border: 'none', outline: 'none', padding: 0,
                  background: 'transparent', fontFamily: 'Inter, sans-serif',
                  fontSize: 15, fontWeight: 500, color: refillColor, marginTop: 4,
                  boxSizing: 'border-box', caretColor: refillColor,
                  appearance: 'none', MozAppearance: 'textfield',
                  transition: 'color 0.15s ease',
                }}
              />
            ) : (
              <div style={{
                ...valueStyle, color: refillColor, height: 22, marginTop: 4,
                cursor: notEditable ? 'default' : 'text',
                transition: 'color 0.15s ease',
              }}>
                {refillDisplay}
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', left: COL_FACT_QTY, top: TOP_PADDING }}>
            <div style={labelStyle}>В ячейке</div>
            <div style={{ ...valueStyle, height: 18 }}>{formatQty(cell.factQuantity)}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_SCHEME_QTY, top: TOP_PADDING }}>
            <div style={{ ...labelStyle, color: schemeLabelColor, transition: 'color 0.15s ease' }}>По схеме</div>
            <div style={{ ...valueStyle, height: 18, color: schemeValueColor, transition: 'color 0.15s ease' }}>
              {formatQty(cell.templateQuantity)}
            </div>
          </div>

          <div style={{ position: 'absolute', left: COL_ASSIGNMENT, top: TOP_PADDING, right: 80 }}>
            <div style={labelStyle}>Назначение</div>
            <div style={{ ...valueStyle, height: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasData || hasAssignment ? assignmentDisplay : '-'}
            </div>
          </div>

          <div
            onClick={handleExpandClick}
            style={{
              position: 'absolute',
              right: 35,
              top: 40,
              transform: 'translateY(-50%)',
              width: 20,
              height: 20,
              cursor: canExpand ? 'pointer' : 'default',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canExpand ? 1 : 0.6,
              pointerEvents: canExpand ? 'auto' : 'none',
            }}
          >
            <img src={isExpanded ? ArrowIcon14Up : ArrowIcon14Down} alt="" style={{ width: 14, height: 14, display: 'block' }} />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && canExpand && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ position: 'absolute', top: COLLAPSED_HEIGHT, left: 0, right: 0, height: EXPANDED_HEIGHT - COLLAPSED_HEIGHT, boxSizing: 'border-box' }}
            >
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1123, height: 2, backgroundColor: '#BCD8FF' }} />

              {/* Изображение */}
              <div style={{ position: 'absolute', top: 20, left: 60 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Изображение</div>
                <div
                  onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}
                  style={{
                    marginTop: 4, width: 100, height: 100, borderRadius: 8,
                    backgroundColor: expandedBoxBg, boxShadow: expandedBoxShadow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: hasImage ? 'pointer' : 'default',
                  }}
                >
                  {detailLoading ? (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>...</span>
                  ) : hasImage ? (
                    <img src={detail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6C7A8B' }}>Нет фото</span>
                  )}
                </div>
              </div>

              {/* Код номенклатуры */}
              <div style={{ position: 'absolute', top: 20, left: 225, width: 220 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Код номенклатуры</div>
                <div style={{
                  marginTop: 4,
                  width: 220,
                  height: 49,
                  borderRadius: 8,
                  backgroundColor: expandedBoxBg,
                  boxShadow: expandedBoxShadow,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 15,
                  boxSizing: 'border-box',
                }}>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={CodeIcon20Black} alt="" style={{ width: 20, height: 14 }} />
                  </div>
                  <span style={{
                    marginLeft: 15,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#2D4059',
                  }}>
                    {materialCodeDisplay}
                  </span>
                </div>
              </div>

              {/* Партия */}
              <div style={{ position: 'absolute', top: 20, left: 225 + 220 + 40, width: 220 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Партия</div>
                <div style={{
                  marginTop: 4, width: 220, height: 49, borderRadius: 8,
                  backgroundColor: expandedBoxBg, boxShadow: expandedBoxShadow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px', boxSizing: 'border-box',
                }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#FF3052' }}>В разработке</span>
                </div>
              </div>

              {/* Контроль остатков (КУО) — только если есть */}
              {hasKuo && (
                <div style={{ position: 'absolute', top: 20, left: 225 + 220 + 40 + 220 + 40, width: 220 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Контроль остатков</div>
                  <div style={{
                    marginTop: 4,
                    width: 220,
                    height: 49,
                    borderRadius: 8,
                    backgroundColor: expandedBoxBg,
                    boxShadow: expandedBoxShadow,
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}>
                    {minStockNum != null && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 15,
                        right: 15,
                        height: 17,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#FDA373',
                        lineHeight: '17px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        Мин.: {minStockNum} {pluralizeUnits(minStockNum)}
                      </div>
                    )}
                    {critStockNum != null && (
                      <div style={{
                        position: 'absolute',
                        top: 8 + 17 + 4,
                        left: 15,
                        right: 15,
                        height: 17,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#FF3052',
                        lineHeight: '17px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        Крит.: {critStockNum} {pluralizeUnits(critStockNum)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onOpenDetails?.(cell.uid); }}
                style={{
                  position: 'absolute', right: 50, top: 57, width: 117, height: 46,
                  borderRadius: 10, border: 'none', backgroundColor: '#666EFE',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontSize: 15, fontWeight: 700, color: '#FFFFFF',
                }}
              >
                Открыть
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {tooltip}

      {stockWarning && (
        <RefillStockWarningPopup
          isOpen={true}
          kind={stockWarning}
          onClose={handleCloseStockWarning}
          onConfirm={handleConfirmStockWarning}
          materialName={cell.materialName || ''}
          cellAddress={cellNumber}
          requestQty={requestQtyForWarning}
          stockAvailable={cell.stockAvailable ?? 0}
          minStock={cell.stockMinStock ?? null}
          criticalStock={cell.stockCriticalStock ?? null}
          reservations={stockReservations}
          onOpenDoc={(uid) => {
            const r = stockReservations.find(x => x.docRefillUid === uid);
            openTab(
              `/documents/refill/edit/${uid}`,
              `Пополнение: ${r?.docRefillCode != null ? String(r.docRefillCode).padStart(4, '0') : ''}`.trim(),
              null
            );
          }}
        />
      )}

      {fullscreenImage && detail?.imageUrl && (
        <div
          onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={detail.imageUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}
    </>
  );
};

export default RefillTableCell;