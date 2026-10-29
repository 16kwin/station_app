// TransferCreatePage.tsx — форма документа «Перемещение»
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

import FormField from '../../elements/FormField';
import DataTable from '../../elements/DataTable';
import HistoryTable from '../../elements/HistoryTable';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import TransferAddLinePopup from './TransferAddLinePopup';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import type { TransferLineDraft } from './TransferAddLinePopup';

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import CancelIcon16BlackOne from '../../../assets/Icons/CancelIcons/CancelIcon16BlackOne.svg';
import DescriptionIcon18Black from '../../../assets/Icons/DescriptionIcons/DescriptionIcon18Black.svg';
import NomenclatureIcon16Black from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Black.svg';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import CleanIcon18Black from '../../../assets/Icons/CleanIcons/CleanIcon18Black.svg';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';

const USER_ID = 1;

const TITLE_TOP = 35;
const TITLE_LEFT = 60 + 25;
const TITLE_TO_STATUS_GAP = 25;

const MANAGE_BTN_W = 215;
const MANAGE_BTN_H = 46;
const MANAGE_BTN_RADIUS = 30;
const MANAGE_BTN_TOP = 28;
const MANAGE_BTN_RIGHT = 30;

const MANAGE_MENU_W = 260;
const MANAGE_MENU_ITEM_H = 44;
const MANAGE_MENU_PAD = 8;
const MANAGE_MENU_GAP = 8;
const MANAGE_MENU_RADIUS = 16;

const HEADER_TOP = 95;
const HEADER_LEFT = 30;
const HEADER_W = 1740;
const HEADER_H = 145;
const HEADER_RADIUS = 20;
const HEADER_FIELD_W = 385;
const HEADER_FIELD_H = 50;
const HEADER_FIELD_TOP = 35;
const HEADER_FIELD_LEFT_FIRST = 40;
const HEADER_FIELD_GAP = 40;

const BASE_INFO_BOTTOM = 22;
const BASE_INFO_LEFT = 57;
const BASE_ICON_SIZE = 16;
const BASE_ICON_TO_TEXT = 12;

const AGREED_INFO_RIGHT = 55;

const TRACK_TOP = TITLE_TOP + 34;
const TRACK_LEFT = TITLE_LEFT;
const TRACK_LINE_HEIGHT = 18;

const PANEL_TOP = HEADER_TOP + HEADER_H + 20 + 22;
const PANEL_LEFT = HEADER_LEFT + 20;
const PANEL_BTN_SIZE = 44;
const PANEL_BTN_RADIUS = 22;
const PANEL_BTN_GAP = 17;
const PANEL_H = 44;

const ADD_BTN_AFTER_PANEL = 57;
const ADD_BTN_W = 196;
const ADD_BTN_RADIUS = 22;
const CLEAN_BTN_SIZE = 44;
const CLEAN_BTN_GAP = 17;
const TOGGLE_W = 189;
const TOGGLE_GAP = 17;

const MOVE_ORDER_BLOCK_LEFT_OFFSET = 439;
const MOVE_ORDER_BLOCK_W = 876;
const MOVE_ORDER_BLOCK_H = 44;
const MOVE_ORDER_BLOCK_RADIUS = 22;

const RIGHT_BTN_SIZE = 44;
const RIGHT_BTN_RADIUS = 22;
const RIGHT_BTN_GAP = 17;
const RIGHT_INSET = 20;

const TABLE_TOP = PANEL_TOP + PANEL_H + 12;
const TABLE_LEFT = HEADER_LEFT;
const TABLE_W = 1740;
const TABLE_H = 418;
const TABLE_ROW_H = 58;
const TABLE_HEADER_H = 58;
const TABLE_VISIBLE_ROWS = 6;

const BOTTOM_BTN_H = 46;
const BOTTOM_BTN_RADIUS = 30;
const BOTTOM_BTN_BOTTOM = 30;
const BOTTOM_BTN_RIGHT = 30;
const BOTTOM_BTN_GAP = 20;
const BTN_CLOSE_W = 114;
const BTN_SAVE_W = 150;
const BTN_ACTION_W = 190;

const SWITCHER_LEFT = HEADER_LEFT + 20;
const SWITCHER_BOTTOM = 30;
const SWITCHER_W = 340;
const SWITCHER_H = 44;
const SWITCHER_GAP = 12;

const btnBaseStyle: React.CSSProperties = { outline: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' };

interface TransferLine {
  uid: string;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialCode?: number | null;
  quantity?: number | null;
  acceptedQuantity?: number | null;
  cellUid?: string | null;
  cellName?: string | null;
  available?: number | null;
  batchInfo?: string | null;
  cancelled?: boolean;
}

interface DocTransfer {
  uid: string;
  code: number | null;
  docDatetime: string;
  stockFromUid: string | null;
  stockFromName: string | null;
  stockToUid: string | null;
  stockToName: string | null;
  baseType: string;
  docBaseUid: string | null;
  docBaseLabel: string | null;
  priority: string | null;
  dueDate: string | null;
  operatorUid: string | null;
  operatorName: string | null;
  status: string;
  agreed: boolean | null;
  cancelled: boolean | null;
  lines: TransferLine[];
}

interface MaterialOption { uid: string; name: string; article: string; code: number | null; }

const PRIORITY_LABELS: Record<string, string> = { HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Записан',
  IN_PROGRESS: 'В работе',
  SHIPPED: 'В работе',
  RECEIVED: 'В работе',
  POSTED: 'Закрыт',
  CANCELLED: 'Отменён',
};

const TRACK_BY_STATUS: Record<string, string> = {
  DRAFT: 'Создан',
  IN_PROGRESS: 'Создан',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято',
  POSTED: 'Загружено',
  CANCELLED: 'Отменён',
};

const TECH_BY_STATUS: Record<string, string> = {
  DRAFT: 'Записан',
  IN_PROGRESS: 'В работе',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято',
  POSTED: 'Закрыт (проведён)',
  CANCELLED: 'Отменён',
};

const ALL_COLUMNS_FROM = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'quantity', label: 'К перемещению' },
  { key: 'available', label: 'Доступно' },
  { key: 'cellName', label: 'Адрес хранения' },
  { key: 'batchInfo', label: 'Партия' },
];
const ALL_COLUMNS_TO = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'quantity', label: 'К перемещению' },
  { key: 'cellName', label: 'Доступные ячейки' },
  { key: 'batchInfo', label: 'Партия' },
];

const convertDotToISO = (s: string | null | undefined): string | null => {
  if (!s) return null;
  if (s.includes('T')) return s;
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mIso) return `${mIso[1]}-${mIso[2]}-${mIso[3]}T00:00:00`;
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (mDot) return `${mDot[3]}-${mDot[2]}-${mDot[1]}T00:00:00`;
  try { const d = new Date(s); if (isNaN(d.getTime())) return null; const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0'); return `${yyyy}-${mm}-${dd}T00:00:00`; } catch { return null; }
};

const formatDateOnly = (s: string | null | undefined): string => {
  if (!s) return '—';
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) return `${mIso[3]}.${mIso[2]}.${mIso[1]}`;
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (mDot) return `${mDot[1]}.${mDot[2]}.${mDot[3]}`;
  try { const d = new Date(s); if (isNaN(d.getTime())) return '—'; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}.${mm}.${yyyy}`; } catch { return '—'; }
};

const formatDateWithSeconds = (s: string | null | undefined): string => {
  if (!s) return '';
  try { const d = new Date(s); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); const hh = String(d.getHours()).padStart(2, '0'); const mi = String(d.getMinutes()).padStart(2, '0'); const ss = String(d.getSeconds()).padStart(2, '0'); return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`; } catch { return ''; }
};

const formatDateTimeShort = (s: string | null | undefined): string => {
  if (!s) return '';
  try { const d = new Date(s); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); const hh = String(d.getHours()).padStart(2, '0'); const mi = String(d.getMinutes()).padStart(2, '0'); return `${dd}.${mm}.${yyyy} ${hh}:${mi}`; } catch { return ''; }
};

const extractCode = (data: any): number | null => {
  if (!data) return null;
  const raw = data.codeMaterial ?? data.code ?? data.materialCode ?? null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw != null) { const p = Number(raw); if (Number.isFinite(p)) return p; }
  return null;
};

const TransferCreatePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const baseTypeParam = (searchParams.get('baseType') || 'MANUAL') as string;
  const { tabs, activeTabId, closeTab, replaceTab, openTab } = useTabs();

  const isEdit = !!uid && location.pathname.startsWith(`/documents/transfers/edit/${uid}`);

  const [doc, setDoc] = useState<DocTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingToWork, setIsTakingToWork] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [shippedByName, setShippedByName] = useState<string | null>(null);
  const [loadedByName, setLoadedByName] = useState<string | null>(null);
  const [reassignedFlag, setReassignedFlag] = useState(false);

  const [isReservedLocal, setIsReservedLocal] = useState(false);

  const [viewTable, setViewTable] = useState<'from' | 'to'>('from');
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [stockFromUid, setStockFromUid] = useState('');
  const [stockFromName, setStockFromName] = useState('');
  const [stockToUid, setStockToUid] = useState('');
  const [stockToName, setStockToName] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [showFromSelect, setShowFromSelect] = useState(false);
  const [showToSelect, setShowToSelect] = useState(false);

  const [autoStockFrom, setAutoStockFrom] = useState(true);
  const [autoStockTo, setAutoStockTo] = useState(true);

  const [baseDocCode, setBaseDocCode] = useState<string | null>(null);
  const [baseDocDatetime, setBaseDocDatetime] = useState<string | null>(null);

  const [lines, setLines] = useState<TransferLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [editLineUid, setEditLineUid] = useState<string | null>(null);

  const [stationOptions, setStationOptions] = useState<{ uid: string; name: string }[]>([]);
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);

  const [panel, setPanel] = useState<'search' | 'sort' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const [manageOpen, setManageOpen] = useState(false);
  const manageWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!manageOpen) return;
    const handler = (e: MouseEvent) => {
      if (manageWrapRef.current && !manageWrapRef.current.contains(e.target as Node)) {
        setManageOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [manageOpen]);

  const fetchDoc = useCallback(async (docUid: string) => {
    setIsLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiTransfer(docUid));
      const d = r.data as DocTransfer;
      setDoc(d);
      setStockFromUid(d.stockFromUid || '');
      setStockFromName(d.stockFromName || '');
      setStockToUid(d.stockToUid || '');
      setStockToName(d.stockToName || '');
      setPriority(d.priority || 'MEDIUM');
      setDueDate(d.dueDate ? formatDateOnly(d.dueDate) : '');
      setLines((d.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));

      if (d.status === 'DRAFT') {
        setShippedByName((prev) => prev || 'Текущий пользователь');
        setIsReservedLocal(false);
      } else if (d.status === 'IN_PROGRESS') {
        setShippedByName((prev) => prev || 'Текущий пользователь');
        setIsReservedLocal(true);
      } else if (d.status === 'SHIPPED') {
        setShippedByName((prev) => prev || 'Текущий пользователь');
        setIsReservedLocal(true);
      } else if (d.status === 'RECEIVED') {
        setShippedByName((prev) => prev || 'Текущий пользователь');
        setLoadedByName((prev) => prev || 'Текущий пользователь');
        setIsReservedLocal(true);
      } else if (d.status === 'POSTED') {
        setShippedByName((prev) => prev || 'Текущий пользователь');
        setLoadedByName((prev) => prev || 'Текущий пользователь');
        setIsReservedLocal(true);
      } else if (d.cancelled) {
        setIsReservedLocal(false);
      }

      if (d.docBaseUid && d.baseType === 'MOVE_ORDER') {
        try {
          const br = await AxiosService.get(ConstantInfo.restApiMoveOrder(d.docBaseUid));
          const b = br.data as any;
          if (b?.code != null) setBaseDocCode(String(b.code).padStart(4, '0'));
          if (b?.docDatetime) setBaseDocDatetime(b.docDatetime);
        } catch { /* no-op */ }
      }

      if (d.operatorName) setShippedByName(d.operatorName);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, []);

  const fetchStations = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID));
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setStationOptions(items.map((s: any) => ({ uid: s.uid, name: s.name })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      const respData = r.data as any;
      const items: MaterialOption[] = [];
      const seen = new Set<string>();
      const pushMaterial = (m: any) => { if (!m || !m.uid || seen.has(m.uid)) return; seen.add(m.uid); items.push({ uid: m.uid, name: m.name || m.nameMaterial || 'Без названия', article: m.article || m.articleMaterial || '', code: extractCode(m) }); };
      const walk = (nodes: any[]) => { nodes.forEach((n: any) => { if (n.materials && Array.isArray(n.materials)) n.materials.forEach((m: any) => pushMaterial(m)); if (n.children && Array.isArray(n.children)) walk(n.children); }); };
      if (Array.isArray(respData)) walk(respData);
      else if (respData?.tree) walk(respData.tree);
      else if (respData?.data) walk(respData.data);
      setMaterialOptions(items);
    } catch (e) { console.error('Ошибка загрузки номенклатуры:', e); }
  }, []);

  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }
    if (isEdit) fetchDoc(uid);
    else {
      setDoc({
        uid,
        code: null,
        docDatetime: new Date().toISOString(),
        stockFromUid: null, stockFromName: null,
        stockToUid: null, stockToName: null,
        baseType: baseTypeParam,
        docBaseUid: null, docBaseLabel: null,
        priority: 'MEDIUM', dueDate: null,
        operatorUid: null, operatorName: null,
        status: 'DRAFT',
        agreed: baseTypeParam === 'MOVE_ORDER' ? false : null,
        cancelled: false,
        lines: [],
      });
      setShippedByName(null);
      setLoadedByName(null);
      setReassignedFlag(false);
      setIsReservedLocal(false);
      setIsLoading(false);
    }
  }, [uid, isEdit, fetchDoc, baseTypeParam]);

  useEffect(() => { fetchStations(); fetchMaterials(); }, [fetchStations, fetchMaterials]);

  useEffect(() => {
    if (!showHistory || !doc?.uid || !isEdit) return;
    setHistoryLoading(true);
    AxiosService.get(ConstantInfo.restApiTransferEventsByUid(doc.uid))
      .then(res => setHistoryEvents(res.data || []))
      .catch(e => console.error(e))
      .finally(() => setHistoryLoading(false));
  }, [showHistory, doc?.uid, isEdit]);

  // ==================== СТАТУСЫ ====================
  const isNew = !doc?.code;
  const isDraft = doc?.status === 'DRAFT';
  const isInProgress = doc?.status === 'IN_PROGRESS';
  const isShipped = doc?.status === 'SHIPPED';
  const isReceived = doc?.status === 'RECEIVED';
  const isPosted = doc?.status === 'POSTED';
  const isCancelled = !!doc?.cancelled || doc?.status === 'CANCELLED';
  const isAgreed = !!doc?.agreed;

  const isMoveOrder = doc?.baseType === 'MOVE_ORDER';
  const isManual = doc?.baseType === 'MANUAL';
  const isRefill = doc?.baseType === 'REFILL';

  // ==================== ДОСТУПНОСТЬ ====================
  const editableBaseType = isManual;

  const canEditTop = editableBaseType && !isCancelled && !isPosted && (isNew || isDraft);

  const canAddLine = editableBaseType && !isCancelled && !isPosted && (isNew || isDraft);
  const canDeleteLine = canAddLine;

  // Валидные строки: есть материал и количество > 0 (пустые игнорируем)
  const validLines = lines.filter(l =>
    !!l.materialUid && typeof l.quantity === 'number' && l.quantity > 0
  );

  const hasBothStocks = !!stockFromUid && !!stockToUid && stockFromUid !== stockToUid;

  const canSave =
    editableBaseType &&
    !isCancelled &&
    !isPosted &&
    (isNew || isDraft) &&
    hasBothStocks &&
    validLines.length > 0;

  const canTakeToWork = isDraft && !isNew && !isCancelled && (!isMoveOrder || isAgreed);
  const canShip = isInProgress && !isCancelled;
  const canReceive = isShipped && !isCancelled;
  const canLoad = (isShipped || isReceived) && !isCancelled;

  const canCancelDoc = !isMoveOrder && !isRefill && !isNew && !isCancelled && (isDraft || isInProgress);
  const canCreateBased = !isNew && !isCancelled && !(isMoveOrder && isDraft);
  const canEditDoc = editableBaseType && isDraft && !isNew && !isCancelled;

  const canReassign = !isCancelled && !isPosted && (isInProgress || isReceived);

  const titleText = (() => {
    const code = doc?.code != null ? String(doc.code).padStart(4, '0') : null;
    const dt = doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : '';
    if (doc?.code && code) return `Документ: Перемещение между складами №${code} от ${dt}`;
    return 'Документ: Перемещение между складами (Создание)';
  })();

  const statusLabel = (() => {
    if (isCancelled) return 'Отменён';
    if (isNew) return 'Новый';
    return doc?.status ? (STATUS_LABELS[doc.status] || doc.status) : '';
  })();

  const statusColor = (() => {
    if (isCancelled) return '#FF3052';
    if (isPosted) return '#00D664';
    if (isMoveOrder && isDraft && isAgreed) return '#00D664';
    return '#666EFE';
  })();

  const trackLabel = (() => {
    if (isCancelled) return 'Отменён';
    if (isNew) return '—';
    if (isMoveOrder && isDraft && isAgreed) return 'Не взят в работу';
    return TRACK_BY_STATUS[doc?.status || ''] || '—';
  })();

  const techState = (() => {
    if (isCancelled) return 'Отменён';
    if (isNew) return '—';
    return TECH_BY_STATUS[doc?.status || ''] || '—';
  })();

  const responsibleName = (() => {
    if (isReceived || isPosted) return loadedByName || null;
    if (isInProgress || isShipped) return shippedByName || null;
    if (isDraft) return shippedByName || null;
    return null;
  })();

  const responsibleLabel = (isReceived || isPosted) ? 'Ответственный за загрузку' : 'Ответственный за отгрузку';

  const reserveBadge = (() => {
    if (isCancelled) return null;
    if (isInProgress || isShipped || isReceived || isPosted) return 'reserved';
    return null;
  })();

  const baseLineText = (() => {
    if (!doc?.baseType || doc.baseType === 'MANUAL') return 'Документ создан вручную (внутреннее перемещение)';
    if (doc.baseType === 'MOVE_ORDER') {
      const code = baseDocCode || (doc.docBaseLabel ? doc.docBaseLabel.replace(/[^0-9]/g, '').padStart(4, '0').slice(-4) : '');
      const dt = baseDocDatetime ? formatDateTimeShort(baseDocDatetime) : '';
      return `Заказ на перемещение${code ? ` №${code}` : ''}${dt ? ` от ${dt}` : ''}`;
    }
    return `Пополнение${doc.docBaseLabel ? ` ${doc.docBaseLabel}` : ''}`;
  })();

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); };
  const handleToggleHistory = () => setShowHistory(v => !v);

  const applyUpdatedDoc = (updated: DocTransfer) => {
    setDoc(updated);
    setStockFromUid(updated.stockFromUid || '');
    setStockFromName(updated.stockFromName || '');
    setStockToUid(updated.stockToUid || '');
    setStockToName(updated.stockToName || '');
    setPriority(updated.priority || 'MEDIUM');
    setDueDate(updated.dueDate ? formatDateOnly(updated.dueDate) : '');
    setLines((updated.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));
    setSelectedIds(new Set());
  };

  const handleSave = async (): Promise<boolean> => {
    if (!canSave || isSaving) return false;
    if (!uid) return false;
    if (!stockFromUid) { alert('Выберите склад-отправитель'); return false; }
    if (!stockToUid) { alert('Выберите склад-получатель'); return false; }
    if (stockFromUid === stockToUid) { alert('Склад-отправитель и склад-получатель не должны совпадать'); return false; }
    if (validLines.length === 0) { alert('Добавьте хотя бы одну строку с номенклатурой и количеством больше 0'); return false; }

    setIsSaving(true);
    try {
      const payload = {
        uid,
        stockFromUid,
        stockToUid,
        baseType: doc?.baseType || 'MANUAL',
        docBaseUid: doc?.docBaseUid || null,
        priority,
        dueDate: convertDotToISO(dueDate),
        lines: validLines.map(l => ({
          uid: l.uid.startsWith('line_') ? null : l.uid,
          materialUid: l.materialUid,
          quantity: l.quantity,
          cellUid: l.cellUid,
          batchInfo: l.batchInfo ?? null,
        })),
      };

      let result: DocTransfer;
      if (isEdit) {
        const r = await AxiosService.patch(ConstantInfo.restApiTransfer(uid), payload);
        result = r.data as DocTransfer;
      } else {
        const r = await AxiosService.post(ConstantInfo.restApiTransferCrud(USER_ID).split('?')[0], payload);
        result = r.data as DocTransfer;
      }

      applyUpdatedDoc(result);

      setShippedByName(prev => prev || 'Текущий пользователь');

      if (!isEdit && result.uid && result.code != null && activeTabId) {
        const newPath = `/documents/transfers/edit/${result.uid}`;
        const newLabel = `Перемещение: ${String(result.code).padStart(4, '0')}`;
        replaceTab(activeTabId, newPath, newLabel, <TransferCreatePage />);
      }
      return true;
    } catch (e: any) {
      alert('Ошибка при сохранении: ' + (e?.response?.data?.message || e.message));
      return false;
    } finally { setIsSaving(false); }
  };

  const handleTakeToWork = async () => {
    if (!uid || isTakingToWork) return;
    setIsTakingToWork(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiTransferTakeToWork(uid));
      const updated = r.data as DocTransfer;
      applyUpdatedDoc(updated);
      setShippedByName(prev => prev || 'Текущий пользователь');
      setIsReservedLocal(true);
      setReassignedFlag(false);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsTakingToWork(false); }
  };

  const handleShip = async () => {
    if (!uid || isShipping) return;
    setIsShipping(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiTransferShip(uid));
      applyUpdatedDoc(r.data as DocTransfer);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsShipping(false); }
  };

  const handleReceive = async () => {
    if (!uid || isReceiving) return;
    setIsReceiving(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiTransferReceive(uid));
      const updated = r.data as DocTransfer;
      applyUpdatedDoc(updated);
      setLoadedByName(prev => prev || 'Текущий пользователь');
      setReassignedFlag(false);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsReceiving(false); }
  };

  const handlePost = async () => {
    if (!uid || isPosting) return;
    setIsPosting(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiTransferLoad(uid));
      applyUpdatedDoc(r.data as DocTransfer);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsPosting(false); }
  };

  const handleCancel = async () => {
    if (!uid || isCancelling) return;
    setIsCancelling(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiTransferCancel(uid));
      const updated = r.data as DocTransfer;
      applyUpdatedDoc(updated);
      setIsReservedLocal(false);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsCancelling(false); }
  };

  const handleReassign = () => {
    if (!canReassign) return;
    setManageOpen(false);
    setReassignedFlag(true);
  };

  const handleCleanSelected = () => {
    if (!canAddLine || selectedIds.size === 0) return;
    setLines(prev => prev.filter(l => !selectedIds.has(l.uid)));
    setSelectedIds(new Set());
  };

  const handleOpenDocBase = () => {
    if (!doc?.docBaseUid) return;
    if (doc.baseType === 'MOVE_ORDER') {
      openTab(`/documents/move-orders/edit/${doc.docBaseUid}`, 'Заказ на перемещение', null);
    } else if (doc.baseType === 'REFILL') {
      openTab(`/documents/refill/edit/${doc.docBaseUid}`, 'Пополнение', null);
    }
  };

  const renderCell = (key: string, item: TransferLine): string => {
    const v = (item as any)[key];
    if (key === 'batchInfo') return v || 'в разработке';
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  };

  const handleRowClick = (uidRow: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uidRow) ? n.delete(uidRow) : n.add(uidRow); return n; }); };
  const handleCheckboxClick = (uidRow: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uidRow) ? n.delete(uidRow) : n.add(uidRow); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = lines.length > 0 && lines.every(l => selectedIds.has(l.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(lines.map(l => l.uid))); };
  const handleDoubleClick = (uidRow: string) => {
    if (!canAddLine) return;
    const line = lines.find(l => l.uid === uidRow);
    if (!line) return;
    setEditLineUid(uidRow);
    setAddPopupOpen(true);
  };
  const openAddPopup = () => { if (!canAddLine) return; setEditLineUid(null); setAddPopupOpen(true); };

  const handleAddLineFromPopup = (line: TransferLineDraft) => {
    if (editLineUid) {
      setLines(prev => prev.map(l => l.uid === editLineUid ? {
        ...l,
        materialUid: line.materialUid,
        materialName: line.materialName,
        materialArticle: line.materialArticle,
        materialCode: line.materialCode,
        quantity: line.quantity,
        cellUid: line.cellUid,
        cellName: line.cellName,
        available: line.available ?? l.available ?? null,
      } : l));
      setEditLineUid(null);
      return;
    }
    setLines(prev => [...prev, {
      uid: line.uid,
      materialUid: line.materialUid,
      materialName: line.materialName,
      materialArticle: line.materialArticle,
      materialCode: line.materialCode,
      quantity: line.quantity,
      cellUid: line.cellUid,
      cellName: line.cellName,
      available: line.available ?? null,
      batchInfo: null,
    }]);
  };

  const editingLine = editLineUid ? lines.find(l => l.uid === editLineUid) : null;
  const rowContextMenuItems = useCallback((uidRow: string): ContextMenuItem[] => {
    return [
      { id: 'add', label: 'Добавить', icon: CreateIcon14Black, iconWidth: 14, iconHeight: 14, disabled: !canAddLine, onClick: () => openAddPopup() },
      { id: 'edit', label: 'Редактировать', icon: DescriptionIcon18Black, iconWidth: 16, iconHeight: 16, disabled: !canAddLine, onClick: () => { const l = lines.find(x => x.uid === uidRow); if (!l) return; setEditLineUid(uidRow); setAddPopupOpen(true); } },
      { id: 'clean', label: 'Очистить', icon: CleanIcon18Black, iconWidth: 18, iconHeight: 17, disabled: !canAddLine, onClick: () => { setLines(prev => prev.filter(l => l.uid !== uidRow)); setSelectedIds(prev => { const n = new Set(prev); n.delete(uidRow); return n; }); } },
      { id: 'cancel', label: 'Отменить', icon: CancelIcon16BlackOne, iconWidth: 16, iconHeight: 16, disabled: true, onClick: () => {} },
    ];
  }, [lines, canAddLine]);

  const viewLines = lines;
  const viewColumns = viewTable === 'from' ? ALL_COLUMNS_FROM : ALL_COLUMNS_TO;
  const showToggle = isManual;
  const showMoveOrderBlock = isMoveOrder;

  const manageItems: ContextMenuItem[] = [
    {
      id: 'cancel',
      label: 'Отменить',
      icon: CancelIcon16BlackOne,
      iconWidth: 16,
      iconHeight: 16,
      disabled: !canCancelDoc || isCancelling,
      onClick: () => { setManageOpen(false); handleCancel(); },
    },
    {
      id: 'edit',
      label: 'Редактировать',
      icon: DescriptionIcon18Black,
      iconWidth: 16,
      iconHeight: 16,
      disabled: !canEditDoc,
      onClick: () => { setManageOpen(false); },
    },
    {
      id: 'based',
      label: 'Создать на основании',
      icon: CreateIcon14Black,
      iconWidth: 14,
      iconHeight: 14,
      disabled: !canCreateBased,
      onClick: () => { setManageOpen(false); },
    },
    {
      id: 'reassign',
      label: 'Переназначить',
      icon: DescriptionIcon18Black,
      iconWidth: 16,
      iconHeight: 16,
      disabled: !canReassign,
      onClick: handleReassign,
    },
  ];

  const filterRightEdge = PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 2 + PANEL_BTN_SIZE;
  const moveOrderBlockLeft = filterRightEdge + MOVE_ORDER_BLOCK_LEFT_OFFSET;

  const bottomBtnStyle = (active: boolean): React.CSSProperties => ({
    height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
    cursor: active ? 'pointer' : 'not-allowed',
    opacity: active ? 1 : 0.5,
  });

  // Шаг 4: единая кнопка. Для MANUAL и MOVE_ORDER порядок одинаков:
  // IN_PROGRESS → Отгружено, SHIPPED → Принято, RECEIVED → Загружено, POSTED → disabled.
  const step4Label = (() => {
    if (isPosted) return 'Загружено';
    if (isReceived) return 'Загружено';
    if (isShipped) return 'Принято';
    if (isInProgress) return 'Отгружено';
    return 'Отгружено';
  })();

  const step4Active = (() => {
    if (isPosted) return false;
    if (isReceived) return true;
    if (isShipped) return true;
    if (isInProgress) return true;
    return false;
  })();

  const handleStep4 = () => {
    if (isPosted) return;
    if (isReceived) { handlePost(); return; }
    if (isShipped) { handleReceive(); return; }
    if (isInProgress) { handleShip(); return; }
  };

  const step3Label = isDraft ? 'Взять в работу' : 'Принято';
  const step3Active = isDraft ? canTakeToWork : false;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', top: TITLE_TOP, left: TITLE_LEFT, display: 'flex', alignItems: 'center', gap: TITLE_TO_STATUS_GAP, zIndex: 2 }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{titleText}</h1>
            {statusLabel && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: statusColor, lineHeight: '29px' }}>{statusLabel}</span>
            )}
          </div>

          <div style={{ position: 'absolute', top: TRACK_TOP, left: TRACK_LEFT, right: 60, display: 'flex', alignItems: 'center', gap: 20, zIndex: 2, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#5A607F', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
              Этап:
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#666EFE', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
              {trackLabel}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#5A607F', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
              Состояние (тех): <span style={{ color: '#2D4059', fontWeight: 600 }}>{techState}</span>
            </span>
            {responsibleName && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#2D4059', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
                {responsibleLabel}: <span style={{ color: '#666EFE', fontWeight: 600 }}>{responsibleName}</span>
                {reassignedFlag && (
                  <span style={{ marginLeft: 8, color: '#FE975B', fontWeight: 600 }}>(Переназначено)</span>
                )}
              </span>
            )}
            {reserveBadge === 'reserved' && (
              <span style={{ padding: '4px 10px', borderRadius: 10, backgroundColor: 'rgba(0, 214, 100, 0.1)', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#00A64F' }}>
                Номенклатура забронирована
              </span>
            )}
          </div>

          <div ref={manageWrapRef} style={{ position: 'absolute', top: MANAGE_BTN_TOP, right: MANAGE_BTN_RIGHT, zIndex: 20 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setManageOpen(v => !v); }}
              style={{ ...btnBaseStyle, width: MANAGE_BTN_W, height: MANAGE_BTN_H, borderRadius: MANAGE_BTN_RADIUS, border: 'none', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', padding: 0 }}
            >
              <img src={DescriptionIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Меню управления</span>
            </button>

            <AnimatePresence>
              {manageOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: MANAGE_BTN_H + MANAGE_MENU_GAP, right: 0, width: MANAGE_MENU_W, backgroundColor: '#FFFFFF', borderRadius: MANAGE_MENU_RADIUS, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', paddingTop: MANAGE_MENU_PAD, paddingBottom: MANAGE_MENU_PAD, zIndex: 30 }}
                >
                  {manageItems.map((item, idx) => (
                    <div key={item.id} onClick={() => { if (!item.disabled) item.onClick(); }}
                      style={{ height: MANAGE_MENU_ITEM_H, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1, borderBottom: idx < manageItems.length - 1 ? '1px solid rgba(45,64,89,0.06)' : 'none' }}
                      onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.backgroundColor = 'rgba(102,110,254,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {item.icon && <img src={item.icon} alt="" style={{ width: item.iconWidth ?? 16, height: item.iconHeight ?? 16, marginRight: 15 }} />}
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: 'absolute', top: HEADER_TOP, left: HEADER_LEFT, width: HEADER_W, height: HEADER_H, backgroundColor: '#FFFFFF', borderRadius: HEADER_RADIUS, boxSizing: 'border-box' }}>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP, left: HEADER_FIELD_LEFT_FIRST }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Номер:" labelPosition="inside" icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} value={doc?.code != null ? String(doc.code).padStart(4, '0') : ''} placeholder="" type="input" disabled iconWidth={20} iconHeight={14} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="От:" labelPosition="inside" icon={CalendarIcon16Gray} value={doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : ''} type="input" disabled iconWidth={16} iconHeight={18} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 2 }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Склад-отправитель:" labelPosition="inside" icon={StationIcon16Gray} iconActive={StationIcon16Blue} value={stockFromName} placeholder="Выберите склад" type="select" disabled={!canEditTop} searchOptions={stationOptions} onSelectOption={(id, name) => { setStockFromUid(id); setStockFromName(name); }} onOpenFullList={() => { if (canEditTop) setShowFromSelect(true); }} selectIconWidth={16} selectIconHeight={16} searchTitle="Найденный склад" searchNotFoundText="Склады не найдены" />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 3 }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Склад-получатель:" labelPosition="inside" icon={StationIcon16Gray} iconActive={StationIcon16Blue} value={stockToName} placeholder="Выберите склад" type="select" disabled={!canEditTop} searchOptions={stationOptions} onSelectOption={(id, name) => { setStockToUid(id); setStockToName(name); }} onOpenFullList={() => { if (canEditTop) setShowToSelect(true); }} selectIconWidth={16} selectIconHeight={16} searchTitle="Найденный склад" searchNotFoundText="Склады не найдены" />
            </div>

            <div style={{ position: 'absolute', bottom: BASE_INFO_BOTTOM, left: BASE_INFO_LEFT, display: 'flex', alignItems: 'center', gap: BASE_ICON_TO_TEXT }}>
              <img src={InfoIcon18Black} alt="" style={{ width: BASE_ICON_SIZE, height: BASE_ICON_SIZE, flexShrink: 0 }} />
              {isManual || !doc?.baseType ? (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>{baseLineText}</span>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
                  Документ создан автоматически на основании:{' '}
                  <span onClick={handleOpenDocBase} style={{ color: '#666EFE', textDecoration: 'underline', cursor: 'pointer' }}>{baseLineText}</span>
                </span>
              )}
            </div>

            {isMoveOrder && isAgreed && !isCancelled && (
              <div style={{ position: 'absolute', bottom: BASE_INFO_BOTTOM, right: AGREED_INFO_RIGHT, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Согласовано:</span>
                <span onClick={() => {}} style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#666EFE', textDecoration: 'underline', cursor: 'pointer' }}></span>
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', top: PANEL_TOP, left: 0, right: 0, height: PANEL_H, zIndex: 6 }}>
            <motion.div style={{ position: 'absolute', left: PANEL_LEFT, top: 0, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: panel === 'search' ? '#666EFE' : '#FFFFFF', border: panel === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden', zIndex: panel === 'search' ? 20 : 5 }}
              animate={{ width: panel === 'search' ? 280 : PANEL_BTN_SIZE }} transition={{ type: 'tween', duration: 0.2 }}>
              <div onClick={() => { if (panel === 'search') { setPanel(null); setSearchValue(''); } else { setPanel('search'); } }} style={{ width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <img src={panel === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              </div>
              <AnimatePresence>
                {panel === 'search' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}>
                    <input autoFocus type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div style={{ position: 'absolute', left: PANEL_LEFT + PANEL_BTN_SIZE + PANEL_BTN_GAP, top: 0, width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setPanel(prev => prev === 'sort' ? null : 'sort')}>
              <img src={SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />
            </div>

            <div style={{ position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 2, top: 0, width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setPanel(prev => prev === 'filter' ? null : 'filter')}>
              <img src={FilterIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </div>

            {showToggle && (
              <>
                <button onClick={openAddPopup} disabled={!canAddLine} style={{ ...btnBaseStyle, position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 3 + ADD_BTN_AFTER_PANEL - PANEL_BTN_GAP, top: 0, width: ADD_BTN_W, height: PANEL_H, borderRadius: ADD_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: 18, paddingRight: 18, boxSizing: 'border-box', gap: 12, cursor: canAddLine ? 'pointer' : 'not-allowed', opacity: canAddLine ? 1 : 0.5, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>
                  <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} /><span>Добавить</span>
                </button>
                <button onClick={handleCleanSelected} disabled={!canAddLine || selectedIds.size === 0} style={{ ...btnBaseStyle, position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 3 + ADD_BTN_AFTER_PANEL - PANEL_BTN_GAP + ADD_BTN_W + CLEAN_BTN_GAP, top: 0, width: CLEAN_BTN_SIZE, height: CLEAN_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (canAddLine && selectedIds.size > 0) ? 'pointer' : 'not-allowed', opacity: (canAddLine && selectedIds.size > 0) ? 1 : 0.5, padding: 0 }}>
                  <img src={CleanIcon18Black} alt="" style={{ width: 18, height: 17 }} />
                </button>
                <button onClick={() => setViewTable('from')} style={{ ...btnBaseStyle, position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 3 + ADD_BTN_AFTER_PANEL - PANEL_BTN_GAP + ADD_BTN_W + CLEAN_BTN_GAP + CLEAN_BTN_SIZE + TOGGLE_GAP, top: 0, width: TOGGLE_W, height: PANEL_H, borderRadius: ADD_BTN_RADIUS, backgroundColor: viewTable === 'from' ? '#666EFE' : '#FFFFFF', border: viewTable === 'from' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: viewTable === 'from' ? '#FFFFFF' : '#2D4059' }}>
                  Склад-отправитель
                </button>
                <button onClick={() => setViewTable('to')} style={{ ...btnBaseStyle, position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 3 + ADD_BTN_AFTER_PANEL - PANEL_BTN_GAP + ADD_BTN_W + CLEAN_BTN_GAP + CLEAN_BTN_SIZE + TOGGLE_GAP + TOGGLE_W + TOGGLE_GAP, top: 0, width: TOGGLE_W, height: PANEL_H, borderRadius: ADD_BTN_RADIUS, backgroundColor: viewTable === 'to' ? '#666EFE' : '#FFFFFF', border: viewTable === 'to' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: viewTable === 'to' ? '#FFFFFF' : '#2D4059' }}>
                  Склад-получатель
                </button>
              </>
            )}

            {showMoveOrderBlock && (
              <div style={{ position: 'absolute', left: moveOrderBlockLeft, top: 0, width: MOVE_ORDER_BLOCK_W, height: MOVE_ORDER_BLOCK_H, borderRadius: MOVE_ORDER_BLOCK_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: 24, paddingRight: 24, boxSizing: 'border-box', gap: 40 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Приоритет: <span style={{ color: '#666EFE' }}>{PRIORITY_LABELS[priority] || '—'}</span></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Срок: <span style={{ color: '#666EFE' }}>{dueDate || '—'}</span></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Состояние: <span style={{ color: '#666EFE' }}>—</span></span>
              </div>
            )}

            <div style={{ position: 'absolute', right: RIGHT_INSET, top: 0, display: 'flex', gap: RIGHT_BTN_GAP }}>
              <button style={{ ...btnBaseStyle, width: RIGHT_BTN_SIZE, height: RIGHT_BTN_SIZE, borderRadius: RIGHT_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Скачать" onClick={() => {}}><img src={DownloadIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
              <button style={{ ...btnBaseStyle, width: RIGHT_BTN_SIZE, height: RIGHT_BTN_SIZE, borderRadius: RIGHT_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Печать" onClick={() => {}}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
              <button style={{ ...btnBaseStyle, width: RIGHT_BTN_SIZE, height: RIGHT_BTN_SIZE, borderRadius: RIGHT_BTN_RADIUS, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF', border: showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="История" onClick={handleToggleHistory}><img src={showHistory ? HistoryIcon18White : HistoryIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
            </div>
          </div>

          <div style={{ position: 'absolute', top: TABLE_TOP, left: TABLE_LEFT, width: TABLE_W, height: TABLE_H }}>
            <AnimatePresence initial={false} mode="wait">
              {showHistory ? (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={TABLE_W} visibleRows={TABLE_VISIBLE_ROWS} />
                </motion.div>
              ) : (
                <motion.div key={viewTable} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <DataTable
                    columns={viewColumns}
                    visibleKeys={viewColumns.map(c => c.key)}
                    data={viewLines}
                    selectedIds={selectedIds}
                    onCheckboxClick={handleCheckboxClick}
                    onSelectAll={handleSelectAll}
                    onRowClick={handleRowClick}
                    onDoubleClick={handleDoubleClick}
                    renderCell={renderCell}
                    isGrayColumn={(key) => key !== 'materialName' && key !== 'materialArticle'}
                    tableWidth={TABLE_W}
                    rowHeight={TABLE_ROW_H}
                    headerHeight={TABLE_HEADER_H}
                    visibleRows={TABLE_VISIBLE_ROWS}
                    centerColumns={[]}
                    rowIcon={NomenclatureIcon16Black}
                    rowContextMenuItems={rowContextMenuItems}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: 'absolute', left: SWITCHER_LEFT, bottom: SWITCHER_BOTTOM, display: 'flex', flexDirection: 'column', gap: SWITCHER_GAP, zIndex: 10 }}>
            <div style={{ width: SWITCHER_W, height: SWITCHER_H, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Автоматический склад-отправитель</span>
              <div onClick={() => setAutoStockFrom(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: autoStockFrom ? '#666EFE' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: autoStockFrom ? 20 : 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', transition: 'left 0.2s' }} />
              </div>
            </div>
            <div style={{ width: SWITCHER_W, height: SWITCHER_H, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Автоматический склад-получатель</span>
              <div onClick={() => setAutoStockTo(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: autoStockTo ? '#666EFE' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: autoStockTo ? 20 : 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', transition: 'left 0.2s' }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: BOTTOM_BTN_BOTTOM, right: BOTTOM_BTN_RIGHT, display: 'flex', alignItems: 'center', gap: BOTTOM_BTN_GAP, zIndex: 10 }}>
            <div style={{ width: 220, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#A0A3BD' }}>
              Интерактивная форма
            </div>

            <button onClick={handleStep4} disabled={!step4Active} style={{ ...bottomBtnStyle(step4Active), width: BTN_ACTION_W }}>
              {step4Label}
            </button>

            <button onClick={handleTakeToWork} disabled={!step3Active || isTakingToWork} style={{ ...bottomBtnStyle(step3Active && !isTakingToWork), width: BTN_ACTION_W }}>
              {isTakingToWork ? 'Обработка...' : step3Label}
            </button>

            <button onClick={handleSave} disabled={!canSave || isSaving} style={{ ...bottomBtnStyle(canSave && !isSaving), width: BTN_SAVE_W, gap: 15 }}>
              <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21 }} /><span>{isSaving ? 'Сохранение...' : 'Записать'}</span>
            </button>

            <button onClick={handleClose} style={{ ...bottomBtnStyle(true), width: BTN_CLOSE_W }}>
              Закрыть
            </button>
          </div>

          <TransferAddLinePopup
            isOpen={addPopupOpen}
            onClose={() => { setAddPopupOpen(false); setEditLineUid(null); }}
            onAdd={handleAddLineFromPopup}
            materialOptions={materialOptions}
            stockFromUid={stockFromUid}
            initialMaterialUid={editingLine?.materialUid || ''}
            initialMaterialName={editingLine?.materialName || ''}
            initialMaterialArticle={editingLine?.materialArticle || ''}
            initialMaterialCode={editingLine?.materialCode ?? null}
            initialQuantity={editingLine?.quantity ?? null}
            initialCellUid={editingLine?.cellUid ?? null}
            initialCellName={editingLine?.cellName || ''}
            initialAvailable={editingLine?.available ?? null}
            editingUid={editLineUid}
            lockMaterial={false}
          />

          <CatalogSelectPopup isOpen={showFromSelect} onClose={() => setShowFromSelect(false)} onSelect={(id: string, name: string) => { setStockFromUid(id); setStockFromName(name); setShowFromSelect(false); }} popupType="station" />
          <CatalogSelectPopup isOpen={showToSelect} onClose={() => setShowToSelect(false)} onSelect={(id: string, name: string) => { setStockToUid(id); setStockToName(name); setShowToSelect(false); }} popupType="station" />
        </>
      )}
    </div>
  );
};

export default TransferCreatePage;