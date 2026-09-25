// SchablonTableCell.tsx — ПОЛНЫЙ ФАЙЛ (фон E1ECFD 46% при раскрытии, контекстное меню по правилам без блюра, умное позиционирование меню)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import ArrowIcon14Down from '../../../assets/Icons/ArrowIcons/ArrowIcon14Down.svg';
import ArrowIcon14Up from '../../../assets/Icons/ArrowIcons/ArrowIcon14Up.svg';
import OneUsageIcon16Black from '../../../assets/Icons/UsageIcons/OneUsageIcon16Black.svg';
import ManyUsageIcon16Black from '../../../assets/Icons/UsageIcons/ManyUsageIcon16Black.svg';
import LinkIcons14Gray from '../../../assets/Icons/LinkIcons/LinkIcons14Gray.svg';
import CodeIcon20Black from '../../../assets/Icons/CodeIcons/CodeIcon20Black.svg';
import CellIcon16Black from '../../../assets/Icons/CellIcons/CellIcon16Black.svg';
import CleanIcon16Black from '../../../assets/Icons/CleanIcons/CleanIcon16Black.svg';
import WatchIcon16Black from '../../../assets/Icons/WatchIcons/WatchIcon16Black.svg';

interface TableRow {
  id: number;
  name: string;
}

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
  codeMaterial: number | null;
  usage: boolean | null;
  imageUrl: string | null;
  barcodeType: string | null;
  barcodeValue: string | null;
}

interface SchablonTableCellProps {
  row: TableRow;
  isSelected: boolean;
  selectedColumn: number;
  isMerged: boolean;
  mergeCount: number;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  cellData?: CellData;
  highlightText?: string;
  onRowClick: (id: number) => void;
  onCheckboxClick: (id: number, e: React.MouseEvent) => void;
  onDoubleClick: (id: number) => void;
  onClear?: () => void;
  onOpenDetails?: () => void;
  onOpenView?: () => void;
  setRef: (id: number, element: HTMLDivElement | null) => void;
  expandedCellId: number | null;
  onExpandToggle: (id: number) => void;
  multiSelectCount: number;
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ backgroundColor: 'rgba(102, 110, 254, 0.2)', color: '#2D4059' }}>{text.slice(idx, idx + highlight.length)}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
};

const validateAndGenerate = async (format: string, text: string): Promise<string | null> => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const canvas = document.createElement('canvas');
    const is1D = ['code32', 'code39', 'ean8', 'ean13', 'jan8', 'jan13', 'upca', 'upce'].includes(format);

    if (is1D) {
      const jsbarcodeFormat =
        format === 'code32' || format === 'code39' ? 'CODE39' :
        format === 'ean8' || format === 'jan8' ? 'EAN8' :
        format === 'ean13' || format === 'jan13' ? 'EAN13' :
        format === 'upca' ? 'UPC' :
        format === 'upce' ? 'UPC' : 'CODE39';
      const finalText = format === 'code32' ? 'A' + trimmed : trimmed;
      // @ts-ignore
      JsBarcode(canvas, finalText, {
        format: jsbarcodeFormat,
        lineColor: '#000000',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        font: 'Inter',
        textMargin: 5,
        margin: 10,
        background: '#FFFFFF',
      });
      return canvas.toDataURL('image/png');
    }

    const bwipjsOptions: any = { bcid: format, text: trimmed, scale: 3, includetext: false };
    if (format === 'aztec') { bwipjsOptions.bcid = 'azteccode'; bwipjsOptions.width = 20; bwipjsOptions.height = 20; }
    if (format === 'datamatrix') { bwipjsOptions.bcid = 'datamatrix'; bwipjsOptions.width = 20; bwipjsOptions.height = 20; bwipjsOptions.encoding = 'ascii'; }
    if (format === 'pdf417') { bwipjsOptions.bcid = 'pdf417'; bwipjsOptions.scale = 2; bwipjsOptions.height = 15; bwipjsOptions.columns = 5; }
    if (format === 'qr') { bwipjsOptions.bcid = 'qrcode'; bwipjsOptions.width = 20; bwipjsOptions.height = 20; }
    // @ts-ignore
    await bwipjs.toCanvas(canvas, bwipjsOptions);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Ошибка генерации кода:', e);
    return null;
  }
};

const formatAssignmentName = (name: string): string => {
  if (!name) return name;
  if (name === 'Готовая деталь (с производства)') return 'ГД (с производства)';
  if (name === 'Готовая деталь (контроль качества пройден)') return 'ГД (КК пройден)';
  if (name === 'Готовая деталь (контроль качества не пройден)') return 'ГД (КК не пройден)';
  if (name === 'Инструмент на переточку') return 'На переточку';
  if (name === 'На инструмент на переточку') return 'На переточку';
  return name;
};

// === Размеры контекстного меню ===
const CONTEXT_MENU_WIDTH = 247;
const CONTEXT_MENU_HEIGHT = 134;
// Отступ от курсора при открытии
const CONTEXT_MENU_OFFSET_X = 2;
const CONTEXT_MENU_OFFSET_Y = 2;
// Отступ от края окна
const CONTEXT_MENU_MARGIN = 8;

const SchablonTableCell: React.FC<SchablonTableCellProps> = ({
  row, isSelected, selectedColumn, isMerged,
  rowStart, rowEnd, colStart, colEnd, cellData, highlightText,
  onRowClick, onCheckboxClick, onDoubleClick, onClear, onOpenDetails, onOpenView, setRef,
  expandedCellId, onExpandToggle, multiSelectCount,
}) => {
  const { openTab } = useTabs();

  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [detail, setDetail] = useState<MaterialDetail | null>(null);
  const [barcodeImg, setBarcodeImg] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [codeViewPopup, setCodeViewPopup] = useState<{ open: boolean; image: string | null }>({ open: false, image: null });

  const isExpanded = expandedCellId === row.id;

  let cellNumber: string;
  if (colStart !== colEnd && rowStart !== rowEnd) cellNumber = `${colStart}-${colEnd}-${rowStart}-${rowEnd}`;
  else if (colStart !== colEnd) cellNumber = `${colStart}-${colEnd}-${rowStart}`;
  else if (rowStart !== rowEnd) cellNumber = `${colStart}-${rowStart}-${rowEnd}`;
  else cellNumber = `${colStart}-${rowStart}`;

  const hasData = !!cellData?.materialUid;
  const hasAssignment = !!cellData?.cellAssignmentUid;
  const materialName = cellData?.materialName || '';
  const materialArticle = cellData?.materialArticle || '';
  const quantity = cellData?.quantity ?? 0;
  const purposesText = cellData?.cellAssignmentName || '—';
  const assignmentName = cellData?.cellAssignmentName || '';

  const isLom = assignmentName === 'Лом';
  const isBrak = assignmentName === 'Возврат брака ТМЦ';
  const isPeretochka = assignmentName === 'Инструмент на переточку' || assignmentName === 'На инструмент на переточку' || assignmentName === 'На переточку';
  const isIndividual = cellData?.isIndividual === true;
  const isIndividualOnlyType = isLom || isBrak || isPeretochka;

  const canExpand = hasData && (!isIndividualOnlyType || (isIndividualOnlyType && isIndividual));
  const expandAvailable = canExpand;

  const assignmentDisplay = formatAssignmentName(purposesText);

  const nomenclatureDisplay = hasData
    ? (materialArticle ? `${materialName} (${materialArticle})` : materialName)
    : (hasAssignment ? assignmentDisplay : '—');

  // === Правила контекстного меню ===
  const cellIsEmpty = !hasData && !hasAssignment;
  const isMultiSelect = multiSelectCount > 1;
  const isEmptyMultiple = isMultiSelect && cellIsEmpty;

  const selectNomenclatureEnabled = !isMultiSelect || isEmptyMultiple;
  const clearEnabled = isMultiSelect ? true : !cellIsEmpty;
  const viewEnabled = !isMultiSelect && !cellIsEmpty;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // По умолчанию — справа и снизу от курсора
    let x = e.clientX + CONTEXT_MENU_OFFSET_X;
    let y = e.clientY + CONTEXT_MENU_OFFSET_Y;

    // Если не помещается справа — открываем слева от курсора
    if (x + CONTEXT_MENU_WIDTH + CONTEXT_MENU_MARGIN > viewportWidth) {
      x = e.clientX - CONTEXT_MENU_WIDTH - CONTEXT_MENU_OFFSET_X;
    }
    // Если и слева не помещается (очень узкий экран) — прижимаем к правому краю
    if (x < CONTEXT_MENU_MARGIN) {
      x = Math.max(CONTEXT_MENU_MARGIN, viewportWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN);
    }

    // Если не помещается снизу — открываем сверху от курсора
    if (y + CONTEXT_MENU_HEIGHT + CONTEXT_MENU_MARGIN > viewportHeight) {
      y = e.clientY - CONTEXT_MENU_HEIGHT - CONTEXT_MENU_OFFSET_Y;
    }
    // Если и сверху не помещается (очень низкий экран) — прижимаем к нижнему краю
    if (y < CONTEXT_MENU_MARGIN) {
      y = Math.max(CONTEXT_MENU_MARGIN, viewportHeight - CONTEXT_MENU_HEIGHT - CONTEXT_MENU_MARGIN);
    }

    setContextMenu({ x, y });
  };
  const closeContextMenu = () => setContextMenu(null);

  const handleSelectNomenclature = () => {
    if (!selectNomenclatureEnabled) return;
    closeContextMenu();
    onOpenDetails?.();
  };
  const handleClearClick = () => {
    if (!clearEnabled) return;
    closeContextMenu();
    onClear?.();
  };
  const handleView = () => {
    if (!viewEnabled) return;
    closeContextMenu();
    onOpenView?.();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expandAvailable) return;
    if (!isExpanded && !detail && cellData?.materialUid) {
      setDetailLoading(true);
      loadDetail(cellData.materialUid).finally(() => setDetailLoading(false));
    }
    onExpandToggle(row.id);
  };

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

      let barcodeType: string | null = null;
      let barcodeValue: string | null = null;
      let codeValue: number | null = data.codeMaterial ?? data.code ?? null;
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = (codesRes.data || []) as Array<{ codeKind: string; codeType: string; codeValue: string }>;
        const barcodeEntry = codes.find(c => c.codeKind === 'BARCODE');
        if (barcodeEntry) {
          barcodeType = barcodeEntry.codeType || 'qr';
          barcodeValue = barcodeEntry.codeValue || null;
        }
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
        barcodeType,
        barcodeValue,
      };
      setDetail(d);
      return d;
    } catch (e) {
      console.error('Ошибка загрузки деталей ячейки:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    if (!detail?.barcodeValue || !detail?.barcodeType) {
      setBarcodeImg(null);
      return;
    }
    let cancelled = false;
    validateAndGenerate(detail.barcodeType, detail.barcodeValue).then(img => {
      if (!cancelled) setBarcodeImg(img);
    });
    return () => { cancelled = true; };
  }, [isExpanded, detail]);

  useEffect(() => {
    if (!isExpanded) {
      setBarcodeImg(null);
      setFullscreenImage(false);
      setCodeViewPopup({ open: false, image: null });
    }
  }, [isExpanded]);

  const handleDownloadCode = () => {
    if (!codeViewPopup.image) return;
    const link = document.createElement('a');
    link.href = codeViewPopup.image;
    link.download = `barcode_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenTab = (startTab: 'documents' | 'characteristics') => {
    const uid = cellData?.materialUid;
    if (!uid) return;
    try {
      sessionStorage.setItem(`nomenclature_start_tab_${uid}`, startTab);
    } catch {}
    const tabIndex = startTab === 'characteristics' ? 1 : 2;
    const code = detail?.codeMaterial ?? 0;
    openTab(`/references/nomenclature/edit/${uid}/${code}`, `Номенклатура: ${detail?.nameMaterial || uid}`, null);
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: tabIndex, uid } }));
      } catch {}
    }, 0);
  };

  const backgroundColor = isSelected ? '#DEEEFF' : (isHovered || contextMenu ? '#F5FAFF' : '#FFFFFF');
  const hl = (highlightText || '').trim();
  const showData = hasData || hasAssignment;

  const COLLAPSED_HEIGHT = 80;
  const EXPANDED_HEIGHT = 240;

  const CHECKBOX_LEFT = 17;
  const CHECKBOX_SIZE = 18;
  const TEXT_START = CHECKBOX_LEFT + CHECKBOX_SIZE + 22;
  const COL_NOMENCLATURE = 223;
  const COL_QUANTITY = 734;
  const COL_ASSIGNMENT = 939;
  const TOP_PADDING = 11;

  // === Фон блоков внутри раскрытой ячейки ===
  // - выделена — #CDE4FF (как было)
  // - раскрыта, но не выделена — rgba(225, 236, 253, 0.46)
  // - не раскрыта — #FFFFFF
  const expandedBoxBg = isSelected
    ? '#CDE4FF'
    : (isExpanded ? 'rgba(225, 236, 253, 0.46)' : '#FFFFFF');
  const expandedBoxShadow = isSelected ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)';

  return (
    <>
      <motion.div
        ref={(el) => setRef(row.id, el)}
        onClick={() => onRowClick(row.id)}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(row.id); }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
        transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
        style={{
          backgroundColor,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          overflow: 'hidden',
          borderLeft: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          borderRight: isExpanded ? '3px solid #BCD8FF' : '3px solid transparent',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: '#E5E7EB' }} />

        <div
          onClick={(e) => onCheckboxClick(row.id, e)}
          style={{ position: 'absolute', left: CHECKBOX_LEFT, top: 40, transform: 'translateY(-50%)', width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, cursor: 'pointer', zIndex: 2 }}
        >
          <img src={isSelected ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, display: 'block' }} />
        </div>

        <div style={{ paddingTop: TOP_PADDING, height: COLLAPSED_HEIGHT, width: '100%', position: 'relative' }}>

          <div style={{ position: 'absolute', left: TEXT_START, top: TOP_PADDING, width: COL_NOMENCLATURE - TEXT_START - 20 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Номер ячейки</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: '#2D4059', height: 18, lineHeight: '18px', marginTop: 4 }}>{cellNumber}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_NOMENCLATURE, top: TOP_PADDING, width: COL_QUANTITY - COL_NOMENCLATURE - 20 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Номенклатура</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: '#2D4059',
              lineHeight: '18px', marginTop: 4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis',
              height: 36, maxHeight: 36,
            }}>
              {hl && hasData
                ? <HighlightedText text={nomenclatureDisplay} highlight={hl} />
                : nomenclatureDisplay}
            </div>
          </div>

          <div style={{ position: 'absolute', left: COL_QUANTITY, top: TOP_PADDING, width: COL_ASSIGNMENT - COL_QUANTITY - 20 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Количество</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: '#2D4059', height: 18, lineHeight: '18px', marginTop: 4 }}>{hasData ? quantity : '—'}</div>
          </div>

          <div style={{ position: 'absolute', left: COL_ASSIGNMENT, top: TOP_PADDING, right: 80 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Назначение</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, color: '#2D4059', height: 18, lineHeight: '18px', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{showData ? assignmentDisplay : '—'}</div>
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
              cursor: expandAvailable ? 'pointer' : 'default',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: expandAvailable ? 1 : 0.6,
              pointerEvents: expandAvailable ? 'auto' : 'none',
            }}
          >
            <img
              src={isExpanded ? ArrowIcon14Up : ArrowIcon14Down}
              alt=""
              style={{ width: 14, height: 14, display: 'block' }}
            />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: COLLAPSED_HEIGHT,
                left: 0,
                right: 0,
                height: EXPANDED_HEIGHT - COLLAPSED_HEIGHT,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1123, height: 2, backgroundColor: '#BCD8FF' }} />

              <div style={{ position: 'absolute', top: 20, left: 60 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Изображение</div>
                <div
                  onClick={(e) => { e.stopPropagation(); if (detail?.imageUrl) setFullscreenImage(true); }}
                  style={{
                    marginTop: 4,
                    width: 100, height: 100, borderRadius: 8,
                    backgroundColor: expandedBoxBg,
                    boxShadow: expandedBoxShadow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: detail?.imageUrl ? 'pointer' : 'default',
                  }}
                >
                  {detailLoading ? (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>...</span>
                  ) : detail?.imageUrl ? (
                    <img src={detail.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6C7A8B' }}>Нет фото</span>
                  )}
                </div>
              </div>

              <div style={{ position: 'absolute', top: 20, left: 225 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Код номенклатуры</div>
                <div style={{
                  marginTop: 4,
                  width: 220, height: 49, borderRadius: 8,
                  backgroundColor: expandedBoxBg,
                  boxShadow: expandedBoxShadow,
                  display: 'flex', alignItems: 'center',
                  paddingLeft: 15, boxSizing: 'border-box',
                }}>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={CodeIcon20Black} alt="" style={{ width: 20, height: 14 }} />
                  </div>
                  <span style={{ marginLeft: 15, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#2D4059' }}>
                    {detail?.codeMaterial != null ? String(detail.codeMaterial).padStart(4, '0') : '—'}
                  </span>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: 'rgba(45, 64, 89, 0.5)', height: 15, lineHeight: '15px' }}>Ссылки:</div>
                  <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 30 }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); handleOpenTab('characteristics'); }}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: '#2D4059', height: 15, lineHeight: '15px' }}>Характеристики</span>
                      <img src={LinkIcons14Gray} alt="" style={{ width: 14, height: 14, marginLeft: 5 }} />
                    </div>
                    <div
                      onClick={(e) => { e.stopPropagation(); handleOpenTab('documents'); }}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: '#2D4059', height: 15, lineHeight: '15px' }}>Документы</span>
                      <img src={LinkIcons14Gray} alt="" style={{ width: 14, height: 14, marginLeft: 5 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ position: 'absolute', top: 20, left: 485 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Использование</div>
                <div style={{
                  marginTop: 4,
                  width: 220, height: 49, borderRadius: 8,
                  backgroundColor: expandedBoxBg,
                  boxShadow: expandedBoxShadow,
                  display: 'flex', alignItems: 'center',
                  paddingLeft: 15, boxSizing: 'border-box',
                }}>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {detail?.usage === true && <img src={ManyUsageIcon16Black} alt="" style={{ width: 16, height: 16 }} />}
                    {detail?.usage === false && <img src={OneUsageIcon16Black} alt="" style={{ width: 16, height: 16 }} />}
                  </div>
                  <span style={{ marginLeft: 15, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#2D4059' }}>
                    {detail?.usage === true ? 'Многоразовое' : detail?.usage === false ? 'Одноразовое' : ''}
                  </span>
                </div>
              </div>

              <div style={{ position: 'absolute', top: 20, left: 745 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(45, 64, 89, 0.5)', height: 16, lineHeight: '16px' }}>Штрихкод</div>
                <div
                  onClick={(e) => { e.stopPropagation(); if (barcodeImg) setCodeViewPopup({ open: true, image: barcodeImg }); }}
                  style={{
                    marginTop: 4,
                    width: 220, height: 100, borderRadius: 8,
                    backgroundColor: expandedBoxBg,
                    boxShadow: expandedBoxShadow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    padding: 8, boxSizing: 'border-box',
                    cursor: barcodeImg ? 'pointer' : 'default',
                  }}
                >
                  {barcodeImg ? (
                    <img src={barcodeImg} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>—</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onOpenDetails?.(); }}
                style={{
                  position: 'absolute',
                  right: 50,
                  top: 57,
                  width: 117, height: 46,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#666EFE',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15, fontWeight: 700, color: '#FFFFFF',
                }}
              >
                Открыть
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {contextMenu && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              width: CONTEXT_MENU_WIDTH,
              height: CONTEXT_MENU_HEIGHT,
              backgroundColor: '#FFFFFF',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              zIndex: 2000,
              boxSizing: 'border-box',
            }}
          >
            {/* Выбрать номенклатуру */}
            <div
              onClick={selectNomenclatureEnabled ? handleSelectNomenclature : undefined}
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                right: 20,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                cursor: selectNomenclatureEnabled ? 'pointer' : 'not-allowed',
                opacity: selectNomenclatureEnabled ? 1 : 0.35,
                pointerEvents: selectNomenclatureEnabled ? 'auto' : 'none',
              }}
            >
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={CellIcon16Black} alt="" style={{ width: 16, height: 16 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
                Выбрать номенклатуру
              </span>
            </div>

            {/* Очистить */}
            <div
              onClick={clearEnabled ? handleClearClick : undefined}
              style={{
                position: 'absolute',
                top: 58,
                left: 20,
                right: 20,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                cursor: clearEnabled ? 'pointer' : 'not-allowed',
                opacity: clearEnabled ? 1 : 0.35,
                pointerEvents: clearEnabled ? 'auto' : 'none',
              }}
            >
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={CleanIcon16Black} alt="" style={{ width: 16, height: 15 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
                Очистить
              </span>
            </div>

            {/* Посмотреть */}
            <div
              onClick={viewEnabled ? handleView : undefined}
              style={{
                position: 'absolute',
                top: 96,
                left: 20,
                right: 20,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                cursor: viewEnabled ? 'pointer' : 'not-allowed',
                opacity: viewEnabled ? 1 : 0.35,
                pointerEvents: viewEnabled ? 'auto' : 'none',
              }}
            >
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={WatchIcon16Black} alt="" style={{ width: 16, height: 10 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
                Посмотреть
              </span>
            </div>
          </div>
        </>
      )}

      {fullscreenImage && detail?.imageUrl && (
        <div
          onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={detail.imageUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}

      {codeViewPopup.open && codeViewPopup.image && (
        <div
          onClick={(e) => { e.stopPropagation(); setCodeViewPopup({ open: false, image: null }); }}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ width: 500, height: 376, backgroundColor: '#FFFFFF', borderRadius: 15, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 30, left: 0, right: 0, height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: '#2D4059', lineHeight: '21px' }}>Код</span>
            </div>

            <div style={{ position: 'absolute', top: 81, left: '50%', transform: 'translateX(-50%)', width: 430, height: 190, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 10, boxSizing: 'border-box' }}>
              <img src={codeViewPopup.image} alt="Код" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
            </div>

            <div style={{ position: 'absolute', top: 301, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 17 }}>
              <button onClick={handleDownloadCode} style={{ width: 116, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Скачать
              </button>
              <button style={{ width: 116, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Печать
              </button>
              <button onClick={() => setCodeViewPopup({ open: false, image: null })} style={{ width: 116, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchablonTableCell;