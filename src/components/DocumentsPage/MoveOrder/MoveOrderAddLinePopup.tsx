// MoveOrderAddLinePopup.tsx — попап добавления номенклатуры (с режимом accepted и lockMaterial)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import FormField from '../../elements/FormField';
import CalendarPopup from '../../elements/CalendarPopup';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import MoveOrderStockPickerPopup from './MoveOrderStockPickerPopup';
import type { MoveOrderStockPickResult } from './MoveOrderStockPickerPopup';

import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import PriorityIcon18Gray from '../../../assets/Icons/PriorityIcons/PriorityIcon18Gray.svg';
import PriorityIcon18Blue from '../../../assets/Icons/PriorityIcons/PriorityIcon18Blue.svg';
import ExecutionIcon16Gray from '../../../assets/Icons/ExecutionIcons/ExecutionIcon16Gray.svg';
import ExecutionIcon16Blue from '../../../assets/Icons/ExecutionIcons/ExecutionIcon16Blue.svg';
import ArticleIcon18Gray from '../../../assets/Icons/ArticleIcons/ArticleIcon18Gray.svg';
import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import LinkIcons14Blue from '../../../assets/Icons/LinkIcons/LinkIcons14Blue.svg';

export interface MoveOrderLineDraft {
  uid: string;
  materialUid: string | null;
  materialName: string | null;
  materialArticle: string | null;
  materialCode: number | null;
  quantity: number | null;
  stockFromUid: string | null;
  stockFromName: string | null;
  priority: string | null;
  dueDate: string | null;
  comment: string | null;
  status: string | null;
  cancelled: boolean;
  available?: number | null;
}

interface MaterialOption {
  uid: string;
  name: string;
  article: string;
  code: number | null;
}

interface StationOption {
  uid: string;
  name: string;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
  codeMaterial: number | null;
  imageUrl: string | null;
}

interface StockBalanceRow {
  materialUid: string;
  cleanQuantity: number | null;
}

interface StockLevelReg {
  minStock: number | null;
  criticalStock: number | null;
}

interface MoveOrderAddLinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (line: MoveOrderLineDraft) => void;
  stationOptions: StationOption[];
  materialOptions: MaterialOption[];
  initialStockFromUid?: string;
  initialStockFromName?: string;
  initialMaterialUid?: string;
  initialMaterialName?: string;
  initialMaterialArticle?: string;
  initialMaterialCode?: number | null;
  initialQuantity?: number | null;
  initialPriority?: string | null;
  initialDueDate?: string | null;
  initialComment?: string | null;
  initialAvailable?: number | null;
  editingUid?: string | null;
  mode?: 'default' | 'accepted';
  maxQuantity?: number | null;
  lockMaterial?: boolean;
}

const extractCode = (data: any): number | null => {
  if (!data) return null;
  const raw = data.codeMaterial ?? data.code ?? data.materialCode ?? null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw != null) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

// Возвращает строго ДД.ММ.ГГГГ из любого входа: ДД.ММ.ГГГГ, YYYY-MM-DD, ISO с T
const formatDateDot = (s: string | null | undefined): string => {
  if (!s) return '';
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) {
    return `${mIso[3]}.${mIso[2]}.${mIso[1]}`;
  }
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (mDot) return `${mDot[1]}.${mDot[2]}.${mDot[3]}`;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return ''; }
};

const PRIORITY_OPTIONS = [
  { uid: 'LOW', name: 'Низкий' },
  { uid: 'MEDIUM', name: 'Средний' },
  { uid: 'HIGH', name: 'Высокий' },
];

const POPUP_W = 1080;
const POPUP_H = 751;

const TITLE_TOP = 30;
const TITLE_H = 21;

const DIVIDER_TOP = 131;
const DIVIDER_HEIGHT = 550;

const LEFT_OFFSET = 40;
const LEFT_TOP = 90;
const LEFT_FIELD_W = 470;
const LEFT_FIELD_H = 50;
const LEFT_FIELD_GAP = 45;
const COMMENT_FIELD_H = 155;

const RIGHT_FIELD_W = 470;
const RIGHT_FIELD_H = 50;
const RIGHT_TOP = 90;
const RIGHT_FIELD_GAP = 45;
const RIGHT_OFFSET_FROM_RIGHT = 40;
const RIGHT_LEFT = POPUP_W - RIGHT_OFFSET_FROM_RIGHT - RIGHT_FIELD_W;

const IMAGE_BOX_W = 200;
const IMAGE_BOX_H = 180;
const IMAGE_RADIUS = 30;

const CARD_BTN_W = 261;
const CARD_BTN_H = 44;
const CARD_BTN_TOP_OFFSET = 40;
const CARD_BTN_RADIUS = 30;

const BOTTOM_BTN_BOTTOM = 30;
const BOTTOM_BTN_RIGHT = 40;
const BTN_GAP = 30;
const CANCEL_BTN_W = 108;
const CANCEL_BTN_H = 44;
const ADD_BTN_W = 122;
const ADD_BTN_H = 44;
const BTN_RADIUS = 30;

const INSIDE_LEGEND_LEFT = 24;
const INSIDE_LEGEND_PAD_X = 2;

const MoveOrderAddLinePopup: React.FC<MoveOrderAddLinePopupProps> = ({
  isOpen,
  onClose,
  onAdd,
  stationOptions,
  materialOptions,
  initialStockFromUid = '',
  initialStockFromName = '',
  initialMaterialUid = '',
  initialMaterialName = '',
  initialMaterialArticle = '',
  initialMaterialCode = null,
  initialQuantity = null,
  initialPriority = 'MEDIUM',
  initialDueDate = null,
  initialComment = null,
  initialAvailable = null,
  editingUid = null,
  mode = 'default',
  maxQuantity = null,
  lockMaterial = false,
}) => {
  const isAcceptedMode = mode === 'accepted';

  const [stockFromUid, setStockFromUid] = useState('');
  const [stockFromName, setStockFromName] = useState('');
  const [stockPickerOpen, setStockPickerOpen] = useState(false);

  const [materialUid, setMaterialUid] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [materialArticle, setMaterialArticle] = useState('');
  const [materialCode, setMaterialCode] = useState<number | null>(null);
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [fullListOpen, setFullListOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  const [quantity, setQuantity] = useState<number | ''>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [dueDate, setDueDate] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  const [availableOnStock, setAvailableOnStock] = useState<number | null>(null);
  const [availableLoading, setAvailableLoading] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const dueDateAnchorRef = useRef<HTMLDivElement>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    setStockFromUid(initialStockFromUid || '');
    setStockFromName(initialStockFromName || '');
    setMaterialUid(initialMaterialUid || '');
    setMaterialName(initialMaterialName || '');
    setMaterialArticle(initialMaterialArticle || '');
    setMaterialCode(initialMaterialCode ?? null);
    setQuantity(typeof initialQuantity === 'number' ? initialQuantity : '');
    setPriority(initialPriority || 'MEDIUM');
    setDueDate(initialDueDate ? formatDateDot(initialDueDate) : '');
    setComment(initialComment || '');
    setFullListOpen(false);
    setFullscreenImage(false);
    setStockPickerOpen(false);
    setAvailableOnStock(typeof initialAvailable === 'number' ? initialAvailable : null);
    setCalendarOpen(false);

    if (initialMaterialUid) {
      loadMaterialDetail(initialMaterialUid);
    } else {
      setMaterialDetail(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

      let codeValue: number | null = extractCode(data);
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = (codesRes.data || []) as Array<{ codeKind: string; codeValue: string }>;
        const codeEntry = codes.find(c => c.codeKind === 'CODE');
        if (codeEntry && codeEntry.codeValue) {
          const parsed = Number(codeEntry.codeValue);
          if (!Number.isNaN(parsed)) codeValue = parsed;
        }
      } catch {}

      const detail: MaterialDetail = {
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
        codeMaterial: codeValue,
        imageUrl,
      };
      setMaterialDetail(detail);
      if (detail.article) setMaterialArticle(detail.article);
      if (detail.codeMaterial != null) setMaterialCode(detail.codeMaterial);
    } catch (e) {
      console.error('Ошибка загрузки материала:', e);
      setMaterialDetail(null);
    }
  }, []);

  // Считаем «Доступно» = freeQuantity - criticalStock (как в попапе доступности)
  useEffect(() => {
    if (!isOpen) return;
    if (!materialUid || !stockFromUid) {
      setAvailableOnStock(null);
      return;
    }

    let cancelled = false;
    setAvailableLoading(true);
    (async () => {
      try {
        const [balanceRes, kuoRes] = await Promise.allSettled([
          AxiosService.get(ConstantInfo.restApiRefillStockBalances(stockFromUid)),
          AxiosService.get(ConstantInfo.restApiStockLevelControlReg(stockFromUid, materialUid)),
        ]);

        let free: number | null = null;
        if (balanceRes.status === 'fulfilled') {
          const list = (balanceRes.value.data || []) as StockBalanceRow[];
          const found = list.find(b => b.materialUid === materialUid);
          free = found?.cleanQuantity ?? null;
        }

        let critical: number | null = null;
        let kuoExists = false;
        if (kuoRes.status === 'fulfilled') {
          const kuo = kuoRes.value.data as StockLevelReg | null;
          if (kuo) {
            critical = kuo.criticalStock ?? null;
            kuoExists = kuo.minStock != null || kuo.criticalStock != null;
          }
        }

        if (free == null) {
          if (!cancelled) setAvailableOnStock(null);
          return;
        }

        const toMoveMax = kuoExists && critical != null
          ? Math.max(0, free - critical)
          : free;

        if (!cancelled) setAvailableOnStock(toMoveMax);
      } catch {
        if (!cancelled) setAvailableOnStock(null);
      } finally {
        if (!cancelled) setAvailableLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, materialUid, stockFromUid]);

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dueDateAnchorRef.current && !dueDateAnchorRef.current.contains(target)) {
        const calendarEl = document.querySelector('[data-calendar-popup="true"]');
        if (calendarEl && calendarEl.contains(target)) return;
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calendarOpen]);

  const handleOpenStockPicker = () => {
    if (isAcceptedMode) return;
    if (!materialUid) {
      alert('Сначала выберите номенклатуру');
      return;
    }
    setStockPickerOpen(true);
  };

  const handleStockPickApply = (result: MoveOrderStockPickResult | null) => {
    if (!result) return;
    setStockFromUid(result.stationUid);
    setStockFromName(result.stationName);
    if (result.toMoveMax != null) {
      setAvailableOnStock(result.toMoveMax);
    }
  };

  const handleMaterialSelect = async (uid: string, name: string) => {
    if (isAcceptedMode || lockMaterial) return;
    setMaterialUid(uid);
    setMaterialName(name);
    const found = materialOptions.find(m => m.uid === uid);
    if (found) {
      setMaterialArticle(found.article || '');
      setMaterialCode(found.code ?? null);
    }
    await loadMaterialDetail(uid);
  };

  const handleFullListSelect = async (uid: string, name: string, item?: any) => {
    if (isAcceptedMode || lockMaterial) return;
    setFullListOpen(false);
    setMaterialUid(uid);
    setMaterialName(name);
    setMaterialArticle(item?.article || '');
    setMaterialCode(extractCode(item));
    await loadMaterialDetail(uid);
  };

  const handlePrioritySelect = (uid: string) => {
    if (isAcceptedMode) return;
    setPriority(uid);
  };

  const materialSelectOptions = useMemo(
    () => materialOptions.map(m => ({ uid: m.uid, name: m.name })),
    [materialOptions]
  );

  const quantityIsNumber = typeof quantity === 'number';
  const quantityPositive = quantityIsNumber && (quantity as number) > 0;
  const isAllFilled = !!materialUid && quantityPositive && !!stockFromUid;
  const isValid = isAllFilled;

  const handleSave = () => {
    if (!isValid) return;
    const newLine: MoveOrderLineDraft = {
      uid: editingUid || `line_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      materialUid: materialUid || null,
      materialName: materialName || null,
      materialArticle: materialArticle || null,
      materialCode: materialCode ?? null,
      quantity: quantityIsNumber ? (quantity as number) : null,
      stockFromUid: stockFromUid || null,
      stockFromName: stockFromName || null,
      priority: priority || 'MEDIUM',
      dueDate: dueDate || null,
      comment: comment || null,
      status: 'NOT_STARTED',
      cancelled: false,
      available: availableOnStock,
    };
    onAdd(newLine);
    onClose();
  };

  const handleCancel = () => onClose();

  const handleOpenNomenclatureCard = () => {
    if (!materialUid) return;
    const code = materialDetail?.codeMaterial ?? materialCode ?? 0;
    window.open(`/references/nomenclature/edit/${materialUid}/${code}`, '_blank');
  };

  if (!isOpen) return null;

  const posMaterialTop = LEFT_TOP;
  const posQuantityTop = posMaterialTop + LEFT_FIELD_H + LEFT_FIELD_GAP;
  const posStockTop = posQuantityTop + LEFT_FIELD_H + LEFT_FIELD_GAP;
  const posPriorityTop = posStockTop + LEFT_FIELD_H + LEFT_FIELD_GAP;
  const posDueTop = posPriorityTop + LEFT_FIELD_H + LEFT_FIELD_GAP;
  const posCommentTop = posDueTop + LEFT_FIELD_H + LEFT_FIELD_GAP;

  const posImageTop = RIGHT_TOP;
  const posArticleTop = posImageTop + IMAGE_BOX_H + RIGHT_FIELD_GAP;
  const posAvailableTop = posArticleTop + RIGHT_FIELD_H + RIGHT_FIELD_GAP;
  const posCardTop = posAvailableTop + RIGHT_FIELD_H + CARD_BTN_TOP_OFFSET;

  const articleValue = materialDetail?.article || materialArticle || '';
  const commentActive = comment.length > 0;

  const renderImageBlock = () => {
    const hasImage = !!materialDetail?.imageUrl;
    const borderColor = hasImage ? '#666EFE' : '#A0A3BD';

    const legendStyle: React.CSSProperties = {
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fontWeight: 400,
      color: borderColor,
      lineHeight: '20px',
      height: 20,
      padding: `0 ${INSIDE_LEGEND_PAD_X}px`,
      marginLeft: INSIDE_LEGEND_LEFT,
      backgroundColor: '#FFFFFF',
      position: 'absolute',
      top: 0,
      left: 0,
      transform: 'translateY(-50%)',
      transition: 'color 0.15s ease',
    };

    return (
      <div
        onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}
        style={{
          width: IMAGE_BOX_W,
          height: IMAGE_BOX_H,
          borderRadius: IMAGE_RADIUS,
          border: `1px solid ${borderColor}`,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          flexShrink: 0,
          cursor: hasImage ? 'pointer' : 'default',
          position: 'relative',
        }}
      >
        <span style={legendStyle}>Изображение</span>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: IMAGE_RADIUS,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {hasImage ? (
            <img
              src={materialDetail!.imageUrl!}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>
              Нет изображения
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div
          style={{ width: `${POPUP_W}px`, height: `${POPUP_H}px`, backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ position: 'absolute', top: TITLE_TOP, left: 0, right: 0, height: TITLE_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 17, color: '#2D4059', lineHeight: `${TITLE_H}px` }}>
              {editingUid
                ? (isAcceptedMode ? 'Изменение номенклатуры (акцептованный заказ)' : 'Изменение номенклатуры к заказу на перемещение')
                : 'Добавление номенклатуры к заказу на перемещение'}
            </span>
          </div>

          <div style={{
            position: 'absolute',
            top: DIVIDER_TOP,
            height: DIVIDER_HEIGHT,
            left: POPUP_W / 2,
            width: 1,
            backgroundColor: 'rgba(160, 163, 189, 0.2)',
          }} />

          {/* ЛЕВАЯ ЧАСТЬ */}
          <div style={{ position: 'absolute', top: posMaterialTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={LEFT_FIELD_H}
              label="Номенклатура:"
              labelPosition="inside"
              value={materialName}
              placeholder="Выберите номенклатуру"
              type="select"
              disabled={isAcceptedMode || lockMaterial}
              icon={NomenclatureIcon16Gray}
              iconActive={NomenclatureIcon16Blue}
              selectIconWidth={16}
              selectIconHeight={18}
              searchOptions={materialSelectOptions}
              onSelectOption={handleMaterialSelect}
              onOpenFullList={() => { if (!isAcceptedMode && !lockMaterial) setFullListOpen(true); }}
              searchTitle="Найденная номенклатура"
              searchNotFoundText="Номенклатура не найдена"
            />
          </div>

          <div style={{ position: 'absolute', top: posQuantityTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={LEFT_FIELD_H}
              label={isAcceptedMode && maxQuantity != null ? `Количество: (макс. ${maxQuantity})` : 'Количество:'}
              labelPosition="inside"
              value={quantityIsNumber ? String(quantity) : ''}
              placeholder="0"
              type="input"
              inputType="text"
              icon={CodeIcon20Gray}
              iconActive={CodeIcon20Blue}
              iconWidth={20}
              iconHeight={14}
              onChange={e => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                let next: number | '' = digits === '' ? '' : Number(digits);
                if (isAcceptedMode && maxQuantity != null && typeof next === 'number' && next > maxQuantity) {
                  next = maxQuantity;
                }
                setQuantity(next);
              }}
            />
          </div>

          <div style={{ position: 'absolute', top: posStockTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={LEFT_FIELD_H}
              label="Склад-отправитель:"
              labelPosition="inside"
              value={stockFromName}
              placeholder="Выберите склад"
              type="select"
              disabled={isAcceptedMode}
              icon={StationIcon16Gray}
              iconActive={StationIcon16Blue}
              selectIconWidth={16}
              selectIconHeight={16}
              searchOptions={[]}
              onSelectOption={() => {}}
              onOpenFullList={handleOpenStockPicker}
              searchTitle="Найденный склад"
              searchNotFoundText="Склады не найдены"
            />
          </div>

          <div style={{ position: 'absolute', top: posPriorityTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={LEFT_FIELD_H}
              label="Приоритет перемещения:"
              labelPosition="inside"
              value={PRIORITY_OPTIONS.find(p => p.uid === priority)?.name || ''}
              placeholder="Выберите приоритет"
              type="select"
              disabled={isAcceptedMode}
              selectIconWidth={18}
              selectIconHeight={12}
              icon={PriorityIcon18Gray}
              iconActive={PriorityIcon18Blue}
              searchOptions={PRIORITY_OPTIONS}
              onSelectOption={handlePrioritySelect}
              searchTitle="Приоритет"
              searchNotFoundText="Не найдено"
            />
          </div>

          <div ref={dueDateAnchorRef} style={{ position: 'absolute', top: posDueTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={LEFT_FIELD_H}
              label="Срок исполнения:"
              labelPosition="inside"
              value={dueDate}
              placeholder="__.__.____"
              type="calendar"
              disabled={isAcceptedMode}
              icon={ExecutionIcon16Gray}
              iconActive={ExecutionIcon16Blue}
              iconWidth={16}
              iconHeight={16}
              onChange={e => { if (!isAcceptedMode) setDueDate(e.target.value); }}
              onCalendarClick={() => { if (!isAcceptedMode) setCalendarOpen(v => !v); }}
            />
          </div>

          <div style={{ position: 'absolute', top: posCommentTop, left: LEFT_OFFSET }}>
            <FormField
              width={LEFT_FIELD_W}
              height={COMMENT_FIELD_H}
              label="Комментарий:"
              labelPosition="inside"
              value={comment}
              placeholder="Комментарий"
              type="input"
              icon={commentActive ? DescriptionIcon16Blue : DescriptionIcon16Gray}
              iconWidth={18}
              iconHeight={18}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div style={{ position: 'absolute', top: posImageTop, left: RIGHT_LEFT }}>
            {renderImageBlock()}
          </div>

          <div style={{ position: 'absolute', top: posArticleTop, left: RIGHT_LEFT }}>
            <FormField
              width={RIGHT_FIELD_W}
              height={RIGHT_FIELD_H}
              label="Артикул:"
              labelPosition="inside"
              value={articleValue}
              type="input"
              disabled
              icon={articleValue ? ArticleIcon18Blue : ArticleIcon18Gray}
              iconWidth={18}
              iconHeight={10}
            />
          </div>

          <div style={{ position: 'absolute', top: posAvailableTop, left: RIGHT_LEFT }}>
            <FormField
              width={RIGHT_FIELD_W}
              height={RIGHT_FIELD_H}
              label="Доступность на складе-отправителе:"
              labelPosition="inside"
              value={availableLoading ? 'Загрузка...' : (availableOnStock != null ? String(availableOnStock) : '')}
              type="input"
              disabled
              icon={CodeIcon20Gray}
              iconActive={CodeIcon20Blue}
              iconWidth={20}
              iconHeight={14}
            />
          </div>

          {materialUid && (
            <div
              onClick={handleOpenNomenclatureCard}
              style={{
                position: 'absolute',
                top: posCardTop,
                left: RIGHT_LEFT,
                width: CARD_BTN_W,
                height: CARD_BTN_H,
                borderRadius: CARD_BTN_RADIUS,
                border: '1px solid #666EFE',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                paddingLeft: 20,
                boxSizing: 'border-box',
              }}
            >
              <img src={LinkIcons14Blue} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{
                marginLeft: 15,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 15,
                color: '#2D4059',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Карточка номенклатуры
              </span>
            </div>
          )}

          {/* КНОПКИ ВНИЗУ СПРАВА */}
          <div style={{ position: 'absolute', bottom: BOTTOM_BTN_BOTTOM, right: BOTTOM_BTN_RIGHT, display: 'flex', alignItems: 'center', gap: BTN_GAP }}>
            <button
              onClick={handleSave}
              disabled={!isValid}
              style={{
                width: ADD_BTN_W,
                height: ADD_BTN_H,
                borderRadius: BTN_RADIUS,
                border: 'none',
                backgroundColor: '#666EFE',
                color: '#FFFFFF',
                cursor: isValid ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                opacity: isValid ? 1 : 0.5,
              }}
            >
              {editingUid ? 'Сохранить' : 'Добавить'}
            </button>

            <button
              onClick={handleCancel}
              style={{
                width: CANCEL_BTN_W,
                height: CANCEL_BTN_H,
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
              Отмена
            </button>
          </div>
        </div>
      </div>

      <div data-calendar-popup="true">
        <CalendarPopup
          isOpen={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          onConfirm={(dateStr) => {
            setDueDate(dateStr);
            setCalendarOpen(false);
          }}
          selectedDate={dueDate || undefined}
          anchorRef={dueDateAnchorRef}
        />
      </div>

      {fullscreenImage && materialDetail?.imageUrl && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setFullscreenImage(false)}
        >
          <img src={materialDetail.imageUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}

      <CatalogSelectPopup
        isOpen={fullListOpen}
        onClose={() => setFullListOpen(false)}
        onSelect={handleFullListSelect}
        popupType="analogSelect"
      />

      <MoveOrderStockPickerPopup
        isOpen={stockPickerOpen}
        onClose={() => setStockPickerOpen(false)}
        onApply={handleStockPickApply}
        materialUid={materialUid}
        materialName={materialDetail?.nameMaterial || materialName}
        materialArticle={materialDetail?.article || materialArticle}
        stationOptions={stationOptions}
      />
    </>
  );
};

export default MoveOrderAddLinePopup;