// MoveOrderCreatePage.tsx — форма документа «Заказ на перемещение»
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

import FormField from '../../elements/FormField';
import DataTable from '../../elements/DataTable';
import HistoryTable from '../../elements/HistoryTable';
import ConfigurationPopup from '../../elements/ConfigurationPopup';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import MoveOrderAddLinePopup from './MoveOrderAddLinePopup';
import DocumentCommentPopup from '../../elements/DocumentCommentPopup';
import type { ContextMenuItem } from '../../elements/ContextMenu';
import type { MoveOrderLineDraft } from './MoveOrderAddLinePopup';

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import CancelIcon16Black from '../../../assets/Icons/CancelIcons/CancelIcon16Black.svg';
import CancelIcon16BlackOne from '../../../assets/Icons/CancelIcons/CancelIcon16BlackOne.svg';
import ExecutionIcon16Gray from '../../../assets/Icons/ExecutionIcons/ExecutionIcon16Gray.svg';
import ExecutionIcon16Blue from '../../../assets/Icons/ExecutionIcons/ExecutionIcon16Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import DescriptionIcon18Black from '../../../assets/Icons/DescriptionIcons/DescriptionIcon18Black.svg';
import NomenclatureIcon16Black from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Black.svg';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import SortingIcon20White from '../../../assets/Icons/SortingIcons/SortingIcon20White.svg';
import SortingIcon19BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon19BlueDown.svg';
import SortingIcon19BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon19BlueUp.svg';
import SortingIcon20BlueDown from '../../../assets/Icons/SortingIcons/SortingIcon20BlueDown.svg';
import SortingIcon20BlueUp from '../../../assets/Icons/SortingIcons/SortingIcon20BlueUp.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';
import ConfigurationIcon18Black from '../../../assets/Icons/ConfigurationIcons/ConfigurationIcon18Black.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import CleanIcon18Black from '../../../assets/Icons/CleanIcons/CleanIcon18Black.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import PopupIcon14Blue from '../../../assets/Icons/PopupIcons/PopupIcon14Blue.svg';
import PopupIcon14Gray from '../../../assets/Icons/PopupIcons/PopupIcon14Gray.svg';

const USER_ID = 1;

const TITLE_TOP = 35;
const TITLE_LEFT = 60;
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

const HEADER_TOP = TITLE_TOP + 60 + 24;
const HEADER_LEFT = 30;
const HEADER_W = 1740;
const HEADER_H = 125;
const HEADER_RADIUS = 20;

const HEADER_FIELD_W = 300;
const HEADER_FIELD_H = 50;
const HEADER_FIELD_BOTTOM = 36;
const HEADER_FIELD_LEFT_FIRST = 40;
const HEADER_FIELD_GAP = 40;

const TRACK_TOP = TITLE_TOP + 40;
const TRACK_LEFT = 60;
const TRACK_LABEL_GAP = 10;
const TRACK_LINE_HEIGHT = 18;

const TOOLBAR_TOP = HEADER_TOP + HEADER_H + 24;
const TOOLBAR_LEFT = HEADER_LEFT;
const TOOLBAR_H = 44;

const TABLE_LEFT_MARGIN_INSIDE = 20;

const ROUND_BTN_SIZE = 44;
const ROUND_BTN_RADIUS = 22;
const ROUND_BTN_GAP = 17;

const TOOLBAR_BTN_H = 44;
const TOOLBAR_BTN_RADIUS = 30;

const BTN_ADD_W = 140;
const BTN_ADD_GAP_BEFORE = 57;
const BTN_STUB_GAP_AFTER = 17;
const BTN_MAIN_W = 123;
const BTN_MAIN_GAP_BEFORE = 57;
const BTN_STATUS_W = 154;
const BTN_STATUS_GAP_BEFORE = 17;

const RIGHT_ROUND_BTN_SIZE = 44;
const RIGHT_ROUND_BTN_RADIUS = 22;
const RIGHT_ROUND_BTN_GAP = 17;
const RIGHT_GROUP_RIGHT_INSET = 20;

const SEARCH_EXPANDED_W = 280;

const PANEL_HEADER_H = 40;
const PANEL_TOP_PAD = 20;
const PANEL_BOTTOM_PAD = 20;
const PANEL_TEXT_H = 18;
const PANEL_ITEM_GAP = 20;
const PANEL_ROW_STEP = PANEL_TEXT_H + PANEL_ITEM_GAP;
const PANEL_LEFT_OFFSET = 30;
const PANEL_INDICATOR_LEFT = 15;
const PANEL_INDICATOR_W = 2;
const PANEL_INDICATOR_H = 22;
const PANEL_SUBMENU_OFFSET = 3;
const PANEL_SUBMENU_LEFT_PAD = 30;
const PANEL_SUBMENU_RIGHT_PAD = 20;
const PANEL_SUBMENU_CB = 20;
const PANEL_SUBMENU_TEXT_TO_CHECKBOX_GAP = 20;
const PANEL_SUBMENU_WIDTH_EXTRA = 5;
const PANEL_CLEAR_H = 44;

const SORT_FILTER_MIN_WIDTH = 200;
const SORT_FILTER_MAX_WIDTH = 1000;
const SUBMENU_MIN_WIDTH = 200;
const SUBMENU_MAX_WIDTH = 700;
const FILTER_ARROW_WIDTH = 18;
const FILTER_TEXT_TO_ARROW_GAP = 8;
const SORT_RIGHT_PAD = 20;
const FILTER_RIGHT_PAD = 20;

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
const TWEEN = { type: 'tween' as const, duration: 0.2 };

const TABLE_TOP = TOOLBAR_TOP + TOOLBAR_H + 12;
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
const BOTTOM_BTN_GAP = 30;

const BTN_CLOSE_W = 114;
const BTN_SAVE_W = 150;
const BTN_SUBMIT_W = 190;
const BTN_TAKE_TO_WORK_W = 200;
const BTN_APPROVE_W = 160;
const BTN_REJECT_W = 160;
const BTN_GROUP_CANCEL_W = 216;

const COLOR_STATUS_CLOSED = '#00D664';
const COLOR_STATUS_LOADING_OR_SHIPPED = '#FE975B';
const COLOR_STATUS_SHIPPING = '#FF3052';
const COLOR_STATUS_NOT_STARTED = '#2D4059';

const btnBaseStyle: React.CSSProperties = {
  outline: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
};

const getTextWidth = (text: string, fontSize: number, fontWeight: number): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * (fontSize * 0.6);
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  return ctx.measureText(text).width;
};

interface MoveOrderLine {
  uid: string;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialCode?: number | null;
  quantity?: number | null;
  acceptedQuantity?: number | null;
  stockFromUid?: string | null;
  stockFromName?: string | null;
  available?: number | null;
  priority?: string | null;
  dueDate?: string | null;
  comment?: string | null;
  status?: string | null;
  shippingAt?: string | null;
  shippedAt?: string | null;
  loadingAt?: string | null;
  closedAt?: string | null;
  cancelled?: boolean;
  transferUid?: string | null;
  transferCode?: number | null;
  responsibleName?: string | null;
  _fromBased?: boolean;
}

interface DocMoveOrder {
  uid: string;
  code: number | null;
  docDatetime: string;
  stockToUid: string | null;
  stockToName: string | null;
  deadline: string | null;
  comment: string | null;
  useApproval: boolean | null;
  status: string;
  lines: MoveOrderLine[];
}

interface MaterialOption {
  uid: string;
  name: string;
  article: string;
  code: number | null;
}

type ToolbarPanel = 'search' | 'filter' | 'sort' | null;
type FilterKey = 'status' | 'cancelled' | 'priority' | 'dueDate' | 'comment';

const ALL_COLUMNS = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'quantity', label: 'Кол-во' },
  { key: 'stockFromName', label: 'Склад-отправитель' },
  { key: 'available', label: 'Доступно' },
  { key: 'priority', label: 'Приоритет' },
  { key: 'dueDate', label: 'Срок исполнения' },
  { key: 'status', label: 'Статус' },
  { key: 'cancelled', label: 'Отменено' },
  { key: 'comment', label: 'Комментарий' },
];

const REQUIRED_DOC_KEYS = [
  'materialName', 'materialArticle', 'quantity', 'stockFromName',
  'available', 'priority', 'dueDate', 'status', 'cancelled',
];
const OPTIONAL_DOC_KEYS = ['comment'];

const STATUS_COLUMNS = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'quantity', label: 'Кол-во' },
  { key: 'stockFromName', label: 'Склад-отправитель' },
  { key: 'responsibleName', label: 'Ответственный' },
  { key: 'shippingAt', label: 'Отгружается' },
  { key: 'shippedAt', label: 'Отгружено' },
  { key: 'loadingAt', label: 'Загружается' },
  { key: 'closedAt', label: 'Закрыт' },
  { key: 'overallStatus', label: 'Общий статус' },
];
const STATUS_VISIBLE = ['materialName', 'quantity', 'stockFromName', 'responsibleName', 'shippingAt', 'shippedAt', 'loadingAt', 'closedAt', 'overallStatus'];

// Трек по позиции (маппинг статуса строки)
const LINE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Не взят в работу',
  IN_PROGRESS: 'Взят в работу',
  SHIPPING: 'Отгружается',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято',
  CLOSED: 'Загружено',
  CANCELLED: 'Отменено',
};

// Статус заказа (верхний уровень)
const DOC_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  DRAFT: 'Записан',
  ON_APPROVAL: 'На согласовании',
  APPROVED: 'Согласован',
  REJECTED: 'Отклонён',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Заказ закрыт',
  CANCELLED: 'Отменён',
};

// Трек заказа (по статусу заказа; для IN_PROGRESS считается по строкам в trackLines)
const TRACK_LABELS_BY_STATUS: Record<string, string> = {
  NEW: '—',
  DRAFT: 'Создан',
  ON_APPROVAL: 'На согласовании',
  APPROVED: 'Передан в работу',
  REJECTED: 'Отклонён',
  IN_PROGRESS: 'Взят в работу',
  CLOSED: 'Заказ закрыт (загружено)',
  CANCELLED: 'Отменён',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
};

const PRIORITY_ORDER: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const SORT_FIELDS: { key: string; label: string; iconType?: '19' | '20' | null }[] = [
  { key: 'materialName', label: 'Наименование', iconType: '20' },
  { key: 'quantity', label: 'Количество', iconType: '19' },
  { key: 'status', label: 'Статус', iconType: '20' },
  { key: 'available', label: 'Доступность', iconType: '19' },
  { key: 'priority', label: 'Приоритет', iconType: '19' },
  { key: 'dueDate', label: 'Срок исполнения', iconType: '19' },
  { key: 'materialArticle', label: 'Артикул', iconType: '20' },
];

const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: 'status', label: 'Статус' },
  { key: 'cancelled', label: 'Отменено' },
  { key: 'priority', label: 'Приоритет' },
  { key: 'dueDate', label: 'Срок исполнения' },
  { key: 'comment', label: 'Комментарий' },
];

const STATUS_FILTER_OPTIONS = [
  { uid: 'CLOSED', name: 'Загружено' },
  { uid: 'RECEIVED', name: 'Принято' },
  { uid: 'SHIPPED', name: 'Отгружено' },
  { uid: 'IN_PROGRESS', name: 'Взят в работу' },
  { uid: 'NOT_STARTED', name: 'Не взят в работу' },
];

const CANCELLED_FILTER_OPTIONS = [
  { uid: 'yes', name: 'Позиция отменена' },
  { uid: 'no', name: 'Позиция не отменена' },
];

const PRIORITY_FILTER_OPTIONS = [
  { uid: 'HIGH', name: 'Высокий' },
  { uid: 'MEDIUM', name: 'Средний' },
  { uid: 'LOW', name: 'Низкий' },
  { uid: 'none', name: 'Без приоритета' },
];

const DUE_DATE_FILTER_OPTIONS = [
  { uid: 'yes', name: 'Есть срок исполнения' },
  { uid: 'no', name: 'Нет срока исполнения' },
];

const COMMENT_FILTER_OPTIONS = [
  { uid: 'yes', name: 'Есть комментарий' },
  { uid: 'no', name: 'Нет комментария' },
];

const convertDotToISO = (s: string | null | undefined): string | null => {
  if (!s) return null;
  if (s.includes('T')) return s;
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mIso) return `${mIso[1]}-${mIso[2]}-${mIso[3]}T00:00:00`;
  const mIsoTime = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIsoTime) return s;
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (mDot) return `${mDot[3]}-${mDot[2]}-${mDot[1]}T00:00:00`;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T00:00:00`;
  } catch { return null; }
};

const formatDateOnly = (s: string | null | undefined): string => {
  if (!s) return '—';
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) return `${mIso[3]}.${mIso[2]}.${mIso[1]}`;
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (mDot) return `${mDot[1]}.${mDot[2]}.${mDot[3]}`;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return '—'; }
};

const formatDateTime = (s: string | null | undefined): string => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  } catch { return s; }
};

const formatDateWithSeconds = (s: string | null | undefined): string => {
  if (!s) return '';
  try {
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
  } catch { return ''; }
};

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

const normalizeLines = (list: MoveOrderLine[]) =>
  [...list]
    .map(l => ({
      materialUid: l.materialUid ?? null,
      quantity: l.quantity ?? null,
      stockFromUid: l.stockFromUid ?? null,
      priority: l.priority ?? null,
      dueDate: l.dueDate ?? null,
      comment: l.comment ?? null,
      cancelled: !!l.cancelled,
    }))
    .sort((a, b) => {
      const ak = `${a.materialUid ?? ''}-${a.stockFromUid ?? ''}-${a.quantity ?? 0}`;
      const bk = `${b.materialUid ?? ''}-${b.stockFromUid ?? ''}-${b.quantity ?? 0}`;
      return ak.localeCompare(bk);
    });

const snapshotOf = (stockToUid: string, comment: string, useApproval: boolean, lines: MoveOrderLine[]) =>
  JSON.stringify({ stockToUid, comment, useApproval, lines: normalizeLines(lines) });

const getStatusTextColor = (status: string | null | undefined): string => {
  const s = String(status || '');
  if (s === 'CLOSED') return COLOR_STATUS_CLOSED;
  if (s === 'RECEIVED') return '#00A64F';
  if (s === 'SHIPPED') return COLOR_STATUS_LOADING_OR_SHIPPED;
  return COLOR_STATUS_NOT_STARTED;
};

const getOverallStatus = (item: MoveOrderLine): { label: string; color: string; ratio: number } => {
  const s = String(item.status || '');
  if (s === 'CLOSED') return { label: 'Загружено', color: COLOR_STATUS_CLOSED, ratio: 1 };
  if (s === 'RECEIVED') return { label: 'Принято', color: '#00A64F', ratio: 0.75 };
  if (s === 'SHIPPED') return { label: 'Отгружено', color: COLOR_STATUS_LOADING_OR_SHIPPED, ratio: 0.5 };
  if (s === 'IN_PROGRESS') return { label: 'Взят в работу', color: '#666EFE', ratio: 0.25 };
  return { label: 'Не взят в работу', color: COLOR_STATUS_NOT_STARTED, ratio: 0.125 };
};

// Общий трек заказа при IN_PROGRESS — по статусам активных строк
const calcMoveOrderTrack = (docStatus: string, lines: MoveOrderLine[]): string => {
  if (docStatus !== 'IN_PROGRESS' && docStatus !== 'CLOSED') {
    return TRACK_LABELS_BY_STATUS[docStatus] || '—';
  }
  const active = lines.filter(l => !l.cancelled && l.status !== 'CANCELLED');
  if (active.length === 0) return TRACK_LABELS_BY_STATUS[docStatus] || '—';

  const allClosed = active.every(l => l.status === 'CLOSED');
  if (allClosed) return 'Заказ закрыт (загружено)';

  const allReceivedOrClosed = active.every(l => l.status === 'RECEIVED' || l.status === 'CLOSED');
  if (allReceivedOrClosed) return 'Принято';

  const allShippedOrFurther = active.every(l =>
    l.status === 'SHIPPED' || l.status === 'RECEIVED' || l.status === 'CLOSED'
  );
  if (allShippedOrFurther) return 'Отгружено';

  return 'Взят в работу';
};

const MoveOrderCreatePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stockToUidParam = searchParams.get('stockToUid') || '';
  const stockToNameParam = searchParams.get('stockToName') || '';
  const basedOnParam = searchParams.get('basedOn') || '';
  const { tabs, activeTabId, closeTab, replaceTab, openTab } = useTabs();

  const isEdit = !!uid && location.pathname.startsWith(`/documents/move-orders/edit/${uid}`);
  const isBasedOn = !!basedOnParam;

  const [doc, setDoc] = useState<DocMoveOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isTakingToWork, setIsTakingToWork] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [viewMode, setViewMode] = useState<'document' | 'status'>('document');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [stockToUid, setStockToUid] = useState(stockToUidParam);
  const [stockToName, setStockToName] = useState(stockToNameParam);
  const [comment, setComment] = useState('');
  const [useApproval, setUseApproval] = useState(true);
  const [showStockToSelect, setShowStockToSelect] = useState(false);

  const [commentPopupOpen, setCommentPopupOpen] = useState(false);

  const [lines, setLines] = useState<MoveOrderLine[]>([]);
  const [savedLines, setSavedLines] = useState<MoveOrderLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);

  const [panel, setPanel] = useState<ToolbarPanel>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<FilterKey, Set<string>>>({
    status: new Set(),
    cancelled: new Set(),
    priority: new Set(),
    dueDate: new Set(),
    comment: new Set(),
  });
  const [submenuOpen, setSubmenuOpen] = useState<FilterKey | null>(null);

  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [editLineUid, setEditLineUid] = useState<string | null>(null);
  const [editLineMode, setEditLineMode] = useState<'default' | 'accepted'>('default');
  const [configOpen, setConfigOpen] = useState(false);
  const [visibleOptional, setVisibleOptional] = useState<Set<string>>(new Set());

  const [stationOptions, setStationOptions] = useState<{ uid: string; name: string }[]>([]);
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);

  const [sortIndicatorY, setSortIndicatorY] = useState(0);

  const [showGroupCancelTooltip, setShowGroupCancelTooltip] = useState(false);
  const groupCancelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [manageOpen, setManageOpen] = useState(false);
  const manageWrapRef = useRef<HTMLDivElement | null>(null);

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const draftKey = `moveOrder_localDraft_${activeTabId || 'no-tab'}_${uid}`;

  useEffect(() => {
    return () => {
      try { sessionStorage.removeItem(draftKey); } catch {}
    };
  }, [draftKey]);

  const [showBasedPopup, setShowBasedPopup] = useState(false);
  const [basedStockToUid, setBasedStockToUid] = useState('');
  const [basedStockToName, setBasedStockToName] = useState('');
  const [showBasedStationSelect, setShowBasedStationSelect] = useState(false);
  const [isCreatingBased, setIsCreatingBased] = useState(false);

  const handleGroupCancelMouseEnter = () => {
    if (groupCancelTimeoutRef.current) clearTimeout(groupCancelTimeoutRef.current);
    groupCancelTimeoutRef.current = setTimeout(() => setShowGroupCancelTooltip(true), 300);
  };
  const handleGroupCancelMouseLeave = () => {
    if (groupCancelTimeoutRef.current) clearTimeout(groupCancelTimeoutRef.current);
    setShowGroupCancelTooltip(false);
  };

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
      const r = await AxiosService.get(ConstantInfo.restApiMoveOrder(docUid));
      const d = r.data as DocMoveOrder;
      setDoc(d);
      setStockToUid(d.stockToUid || '');
      setStockToName(d.stockToName || '');
      setComment(d.comment || '');
      setUseApproval(d.useApproval !== false);
      const loadedLines = (d.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` }));
      setLines(loadedLines);
      setSavedLines(loadedLines);

      setSavedSnapshot(snapshotOf(d.stockToUid || '', d.comment || '', d.useApproval !== false, loadedLines));
      setIsDataSaved(true);

      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw) as { stockToUid: string; comment: string; useApproval?: boolean; lines: MoveOrderLine[] };
          if (draft) {
            setStockToUid(draft.stockToUid ?? d.stockToUid ?? '');
            setComment(draft.comment ?? d.comment ?? '');
            if (typeof draft.useApproval === 'boolean') setUseApproval(draft.useApproval);
            setLines((draft.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));
          }
        }
      } catch (e) {
        console.error('Не удалось восстановить черновик:', e);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [draftKey]);

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

      const pushMaterial = (m: any) => {
        if (!m || !m.uid) return;
        if (seen.has(m.uid)) return;
        seen.add(m.uid);
        items.push({
          uid: m.uid,
          name: m.name || m.nameMaterial || 'Без названия',
          article: m.article || m.articleMaterial || '',
          code: extractCode(m),
        });
      };

      const walk = (nodes: any[]) => {
        nodes.forEach((n: any) => {
          if (n.materials && Array.isArray(n.materials)) {
            n.materials.forEach((m: any) => pushMaterial(m));
          }
          if (n.children && Array.isArray(n.children)) walk(n.children);
        });
      };

      if (Array.isArray(respData)) walk(respData);
      else if (respData?.tree) walk(respData.tree);
      else if (respData?.data) walk(respData.data);

      setMaterialOptions(items);
    } catch (e) { console.error('Ошибка загрузки номенклатуры:', e); }
  }, []);

  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }
    if (isEdit) {
      fetchDoc(uid);
    } else if (isBasedOn) {
      setIsLoading(true);
      AxiosService.get(ConstantInfo.restApiMoveOrder(basedOnParam))
        .then(r => {
          const source = r.data as DocMoveOrder;
          const newDoc: DocMoveOrder = {
            uid,
            code: null,
            docDatetime: new Date().toISOString(),
            stockToUid: stockToUidParam || null,
            stockToName: stockToNameParam || null,
            deadline: null,
            comment: null,
            useApproval: true,
            status: 'NEW',
            lines: [],
          };
          setDoc(newDoc);
          const sourceLines = source.lines || [];
          const prepopulated: MoveOrderLine[] = sourceLines.map((l, i) => ({
            uid: `line_${Date.now()}_${i}`,
            materialUid: l.materialUid || null,
            materialName: l.materialName || null,
            materialArticle: l.materialArticle || null,
            materialCode: l.materialCode ?? null,
            quantity: null,
            stockFromUid: null,
            stockFromName: null,
            available: null,
            priority: null,
            dueDate: null,
            comment: null,
            status: 'NOT_STARTED',
            cancelled: false,
            _fromBased: true,
          }));
          setLines(prepopulated);
          setSavedLines([]);
          setSavedSnapshot(null);
          setIsDataSaved(false);
        })
        .catch(e => {
          console.error('Не удалось загрузить документ-основание:', e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      const newDoc: DocMoveOrder = {
        uid,
        code: null,
        docDatetime: new Date().toISOString(),
        stockToUid: stockToUidParam || null,
        stockToName: stockToNameParam || null,
        deadline: null,
        comment: null,
        useApproval: true,
        status: 'NEW',
        lines: [],
      };
      setDoc(newDoc);
      setIsDataSaved(false);
      setSavedSnapshot(null);

      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw) as { stockToUid: string; comment: string; useApproval?: boolean; lines: MoveOrderLine[] };
          if (draft) {
            if (draft.stockToUid) { setStockToUid(draft.stockToUid); }
            if (draft.comment != null) { setComment(draft.comment); }
            if (typeof draft.useApproval === 'boolean') setUseApproval(draft.useApproval);
            if (draft.lines) setLines(draft.lines.map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));
          }
        }
      } catch (e) {
        console.error('Не удалось восстановить черновик:', e);
      }

      setIsLoading(false);
    }
  }, [uid, isEdit, isBasedOn, basedOnParam, stockToUidParam, stockToNameParam, fetchDoc, draftKey]);

  useEffect(() => { fetchStations(); fetchMaterials(); }, [fetchStations, fetchMaterials]);

  useEffect(() => {
    if (!uid) return;
    if (!isDataSaved && lines.length === 0 && !comment) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ stockToUid, comment, useApproval, lines })
      );
    } catch (e) {
      console.error('Не удалось сохранить черновик:', e);
    }
  }, [draftKey, stockToUid, comment, useApproval, lines, isDataSaved, uid]);

  useEffect(() => {
    if (!showHistory || !doc?.uid || !isEdit) return;
    setHistoryLoading(true);
    AxiosService.get(ConstantInfo.restApiMoveOrderEventsByUid(doc.uid))
      .then(res => setHistoryEvents(res.data || []))
      .catch(e => console.error(e))
      .finally(() => setHistoryLoading(false));
  }, [showHistory, doc?.uid, isEdit]);

  useEffect(() => {
    if (panel === 'sort') {
      const idx = SORT_FIELDS.findIndex(f => f.key === sortColumn);
      if (idx >= 0) {
        setSortIndicatorY(PANEL_TOP_PAD + idx * PANEL_ROW_STEP + (PANEL_TEXT_H - PANEL_INDICATOR_H) / 2);
      }
    }
  }, [panel, sortColumn]);

  // ==================== СТАТУСЫ ====================
  const isNewDoc = !isDataSaved && !isEdit;
  const docStatus = isNewDoc ? 'NEW' : (doc?.status || 'DRAFT');
  const isDraft = docStatus === 'DRAFT';
  const isOnApproval = docStatus === 'ON_APPROVAL';
  const isApproved = docStatus === 'APPROVED';
  const isRejected = docStatus === 'REJECTED';
  const isInProgress = docStatus === 'IN_PROGRESS';
  const isClosed = docStatus === 'CLOSED';
  const isCancelled = docStatus === 'CANCELLED';

  const isSavedOnce = isDataSaved || isEdit;

  const isDirty = useMemo(() => {
    if (savedSnapshot === null) {
      return lines.length > 0 || comment.length > 0;
    }
    return snapshotOf(stockToUid, comment, useApproval, lines) !== savedSnapshot;
  }, [savedSnapshot, stockToUid, comment, useApproval, lines]);

  const isChanged = isDirty && (isDraft || isApproved) && editMode;

  const titleText = (() => {
    const code = doc?.code != null ? String(doc.code).padStart(4, '0') : null;
    const dt = doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : '';
    if (isSavedOnce && code) return `Документ: Заказ на перемещение №${code} от ${dt}`;
    return 'Документ: Заказ на перемещение';
  })();

  const statusLabel = (() => {
    if (isCancelled) return DOC_STATUS_LABELS.CANCELLED;
    if (isChanged) return 'Изменён';
    return DOC_STATUS_LABELS[docStatus] || '';
  })();

  const statusColor = (() => {
    if (isCancelled || isRejected) return '#FF3052';
    if (isClosed) return COLOR_STATUS_CLOSED;
    if (isApproved || isInProgress) return '#00D664';
    if (isChanged) return '#FE975B';
    return '#666EFE';
  })();

  // Трек заказа: при APPROVED — 2 строки; при IN_PROGRESS/CLOSED — по строкам; иначе — по статусу
  const trackLines: string[] = useMemo(() => {
    if (isChanged) return ['Изменён'];
    if (isApproved) {
      return [
        'Документ перемещения: создан',
        'Документ заказ на перемещение: Передан в работу',
      ];
    }
    if (isInProgress || isClosed) {
      return [calcMoveOrderTrack(docStatus, lines)];
    }
    return [TRACK_LABELS_BY_STATUS[docStatus] || '—'];
  }, [isChanged, isApproved, isInProgress, isClosed, docStatus, lines]);

  const reservedState = (() => {
    if (isOnApproval || isApproved || isInProgress) return 'reserved';
    if (isRejected || isCancelled) return 'cancelled';
    return null;
  })();

  const handleToggleHistory = () => { setShowHistory(v => !v); };

  const handleClose = () => {
    const shouldConfirm = isSavedOnce && isDirty && !isCancelled && !isInProgress && !isOnApproval && !isRejected && !isClosed;
    if (shouldConfirm) {
      setShowCloseConfirm(true);
      return;
    }
    const t = tabs.find(tab => tab.id === activeTabId);
    if (t) closeTab(t.id);
  };

  const handleConfirmClose = (save: boolean) => {
    setShowCloseConfirm(false);
    if (save) {
      handleSave().then(ok => {
        if (ok) {
          const t = tabs.find(tab => tab.id === activeTabId);
          if (t) closeTab(t.id);
        }
      });
    } else {
      const t = tabs.find(tab => tab.id === activeTabId);
      if (t) closeTab(t.id);
    }
  };

  const allActiveLinesHaveStockFrom = useMemo(() => {
    const active = lines.filter(l => !l.cancelled);
    return active.length > 0 && active.every(l => !!l.stockFromUid);
  }, [lines]);

  const handleSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    if (!uid) return false;
    if (!stockToUid) { alert('Укажите склад-получатель'); return false; }
    if (lines.length === 0) { alert('Добавьте хотя бы одну строку'); return false; }
    if (!allActiveLinesHaveStockFrom) { alert('Укажите склад-отправитель для всех активных строк'); return false; }

    setIsSaving(true);
    try {
      const payload = {
        uid,
        stockToUid,
        comment,
        useApproval,
        lines: lines.map(l => ({
          uid: l.uid.startsWith('line_') ? null : l.uid,
          materialUid: l.materialUid,
          quantity: l.quantity,
          stockFromUid: l.stockFromUid,
          priority: l.priority,
          dueDate: convertDotToISO(l.dueDate),
          comment: l.comment ?? null,
          cancelled: !!l.cancelled,
        })),
      };

      let result: DocMoveOrder;
      if (isEdit) {
        const r = await AxiosService.patch(ConstantInfo.restApiMoveOrder(uid), payload);
        result = r.data as DocMoveOrder;
      } else {
        const r = await AxiosService.post(
          ConstantInfo.restApiMoveOrderCrud(USER_ID).split('?')[0],
          payload
        );
        result = r.data as DocMoveOrder;
      }

      const newLines = (result.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` }));

      setDoc(result);
      setStockToUid(result.stockToUid || '');
      setStockToName(result.stockToName || '');
      setComment(result.comment || '');
      setUseApproval(result.useApproval !== false);
      setLines(newLines);
      setSavedLines(newLines);
      setSelectedIds(new Set());
      setEditMode(false);
      setIsDataSaved(true);
      setSavedSnapshot(snapshotOf(result.stockToUid || '', result.comment || '', result.useApproval !== false, newLines));

      try { sessionStorage.removeItem(draftKey); } catch {}

      if (!isEdit && result.uid && result.code != null && activeTabId) {
        const newPath = `/documents/move-orders/edit/${result.uid}`;
        const newLabel = `Заказ на перемещение: ${String(result.code).padStart(4, '0')}`;
        replaceTab(activeTabId, newPath, newLabel, <MoveOrderCreatePage />);
      }

      return true;
    } catch (e: any) {
      console.error('Ошибка сохранения:', e);
      alert('Ошибка при сохранении: ' + (e?.response?.data?.message || e.message));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!uid || isSubmitting) return;
    if (isDirty) { alert('Сначала сохраните изменения'); return; }
    if (!allActiveLinesHaveStockFrom) { alert('Укажите склад-отправитель для всех активных строк'); return; }
    setIsSubmitting(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiMoveOrderSubmitApproval(uid));
      const updated = r.data as DocMoveOrder;
      setDoc(updated);
      const newLines = (updated.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` }));
      setLines(newLines);
      setSavedLines(newLines);
      setSavedSnapshot(snapshotOf(updated.stockToUid || '', updated.comment || '', updated.useApproval !== false, newLines));
      setIsDataSaved(true);
    } catch (e: any) {
      console.error('Ошибка отправки на согласование:', e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!uid || isApproving) return;
    setIsApproving(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiMoveOrderApprove(uid));
      const updated = r.data as DocMoveOrder;
      setDoc(updated);
      const newLines = (updated.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` }));
      setLines(newLines);
      setSavedLines(newLines);
      setSavedSnapshot(snapshotOf(updated.stockToUid || '', updated.comment || '', updated.useApproval !== false, newLines));
      setIsDataSaved(true);
    } catch (e: any) {
      console.error('Ошибка согласования:', e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!uid || isRejecting) return;
    setIsRejecting(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiMoveOrderReject(uid));
      setDoc(r.data as DocMoveOrder);
    } catch (e: any) {
      console.error('Ошибка отклонения:', e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleTakeToWork = async () => {
    if (!uid || isTakingToWork) return;
    if (isDirty) { alert('Сначала сохраните изменения'); return; }
    setIsTakingToWork(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiMoveOrderTakeToWork(uid));
      const updated = r.data as DocMoveOrder;
      setDoc(updated);
      const newLines = (updated.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` }));
      setLines(newLines);
      setSavedLines(newLines);
      setSavedSnapshot(snapshotOf(updated.stockToUid || '', updated.comment || '', updated.useApproval !== false, newLines));
      setIsDataSaved(true);
    } catch (e: any) {
      console.error('Ошибка передачи в работу:', e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsTakingToWork(false);
    }
  };

  const handleCancel = async () => {
    if (!uid) return;
    try {
      const r = await AxiosService.post(ConstantInfo.restApiMoveOrderCancel(uid));
      setDoc(r.data as DocMoveOrder);
    } catch (e: any) {
      console.error('Ошибка отмены:', e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    }
  };

  const handleGroupCancel = () => {
    if (!canGroupCancel) return;

    setLines(prev => {
      const notStarted = prev.filter(l => l.status === 'NOT_STARTED');
      if (notStarted.length === 0) return prev;

      const hasUncancelled = notStarted.some(l => !l.cancelled);
      const targetCancelled = hasUncancelled;

      return prev.map(l => {
        if (l.status !== 'NOT_STARTED') return l;
        return { ...l, cancelled: targetCancelled };
      });
    });
  };

  const handleCleanSelected = () => {
    if (!canClean) return;
    if (selectedIds.size === 0) return;
    setLines(prev => prev.filter(l => !selectedIds.has(l.uid)));
    setSelectedIds(new Set());
  };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({ x: direction === 'left' ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'left' | 'right') => ({ x: direction === 'left' ? -200 : 200, opacity: 0 }),
  };

  const renderDocCell = (key: string, item: MoveOrderLine): string => {
    const v = (item as any)[key];
    switch (key) {
      case 'quantity': return v != null ? String(v) : '—';
      case 'available': return v != null ? String(v) : '—';
      case 'priority': return v ? (PRIORITY_LABELS[v] || v) : '—';
      case 'dueDate': return formatDateOnly(v);
      case 'status': return v ? (LINE_STATUS_LABELS[v] || v) : '—';
      case 'cancelled': return v ? 'Да' : 'Нет';
      case 'comment':
        if (v === null || v === undefined || v === '') return '—';
        return String(v);
      default:
        if (v === null || v === undefined || v === '') return '—';
        return String(v);
    }
  };

  const handleToggleCancelled = (lineUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canToggleLineCancel) return;
    setLines(prev => prev.map(l => l.uid === lineUid ? { ...l, cancelled: !l.cancelled } : l));
  };

  const isLineCancelledSaved = (lineUid: string, currentCancelled: boolean): boolean => {
    if (!currentCancelled) return false;
    const saved = savedLines.find(sl => sl.uid === lineUid);
    return saved ? !!saved.cancelled : false;
  };

  const isLineFilled = (item: MoveOrderLine): boolean => {
    if (!item._fromBased) return true;
    const q = item.quantity != null && item.quantity > 0;
    const s = !!item.stockFromUid;
    const p = !!item.priority;
    const d = !!item.dueDate;
    return q && s && p && d;
  };

  const renderDocCellNode = (key: string, item: MoveOrderLine): React.ReactNode | null => {
    const isStruck = isLineCancelledSaved(item.uid, !!item.cancelled);
    const isClosedLine = String(item.status || '') === 'CLOSED';
    const statusColorText = getStatusTextColor(item.status);

    if (key === 'materialName') {
      return (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
            fontWeight: 400,
            color: isClosedLine ? COLOR_STATUS_CLOSED : '#2D4059',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            lineHeight: '18px',
            maxWidth: '100%',
            width: '100%',
            textDecoration: isStruck ? 'line-through' : 'none',
          }}
        >
          {item.materialName || '—'}
        </span>
      );
    }
    if (key === 'cancelled') {
      const checked = !!item.cancelled;
      const canToggle = canToggleLineCancel;
      return (
        <div
          onClick={canToggle ? (e) => handleToggleCancelled(item.uid, e) : undefined}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', cursor: canToggle ? 'pointer' : 'default' }}
        >
          <div style={{ width: 18, height: 18, position: 'relative' }}>
            <img
              src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack}
              alt=""
              style={{ width: 18, height: 18, opacity: canToggle ? 1 : 0.7 }}
            />
          </div>
        </div>
      );
    }
    if (key === 'status') {
      const text = renderDocCell(key, item);
      return (
        <span
          style={{
            textDecoration: isStruck ? 'line-through' : 'none',
            color: statusColorText,
            width: '100%',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      );
    }
    if (isStruck) {
      const text = renderDocCell(key, item);
      return (
        <span style={{ textDecoration: 'line-through', color: isClosedLine ? COLOR_STATUS_CLOSED : undefined, width: '100%', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      );
    }
    if (isClosedLine) {
      const text = renderDocCell(key, item);
      return (
        <span style={{ color: COLOR_STATUS_CLOSED, width: '100%', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      );
    }
    return null;
  };

  const renderStatusCell = (key: string, item: MoveOrderLine): string => {
    if (key === 'overallStatus') {
      return getOverallStatus(item).label;
    }
    const v = (item as any)[key];
    switch (key) {
      case 'quantity': return v != null ? String(v) : '—';
      case 'shippingAt':
      case 'shippedAt':
      case 'loadingAt':
      case 'closedAt':
        return formatDateTime(v);
      default:
        if (v === null || v === undefined || v === '') return '—';
        return String(v);
    }
  };

  const renderStatusCellNode = (key: string, item: MoveOrderLine): React.ReactNode | null => {
    const isStruck = isLineCancelledSaved(item.uid, !!item.cancelled);

    if (key === 'materialName') {
      return (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
            fontWeight: 400,
            color: '#2D4059',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            lineHeight: '18px',
            maxWidth: '100%',
            width: '100%',
            textDecoration: isStruck ? 'line-through' : 'none',
          }}
        >
          {item.materialName || '—'}
        </span>
      );
    }
    if (key === 'overallStatus') {
      const { color, ratio } = getOverallStatus(item);
      return (
        <div
          style={{
            width: '100%',
            height: 12,
            borderRadius: 999,
            backgroundColor: 'rgba(45, 64, 89, 0.12)',
            position: 'relative',
            overflow: 'hidden',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: color,
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      );
    }
    if (isStruck) {
      const text = renderStatusCell(key, item);
      return (
        <span style={{ textDecoration: 'line-through', width: '100%', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      );
    }
    return null;
  };

  const handleRowClick = (uidRow: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(uidRow)) n.delete(uidRow); else n.add(uidRow);
      return n;
    });
  };
  const handleCheckboxClick = (uidRow: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(uidRow)) n.delete(uidRow); else n.add(uidRow);
      return n;
    });
  };
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const all = lines.length > 0 && lines.every(l => selectedIds.has(l.uid));
    all ? setSelectedIds(new Set()) : setSelectedIds(new Set(lines.map(l => l.uid)));
  };

  const handleDoubleClick = (uidRow: string, _name: string) => {
    const line = lines.find(l => l.uid === uidRow);
    if (!line) return;

    if (canEditLine) {
      if (isLineCancelledSaved(line.uid, !!line.cancelled)) return;
      setEditLineUid(uidRow);
      setEditLineMode('default');
      setAddPopupOpen(true);
      return;
    }

    if (canEditLinePartial) {
      setEditLineUid(uidRow);
      setEditLineMode('accepted');
      setAddPopupOpen(true);
    }
  };

  const openAddPopup = () => {
    if (!canAdd) return;
    setEditLineUid(null);
    setEditLineMode('default');
    setAddPopupOpen(true);
  };

  const handleAddLineFromPopup = (line: MoveOrderLineDraft) => {
    if (editLineUid) {
      if (editLineMode === 'accepted') {
        setLines(prev => prev.map(l => l.uid === editLineUid ? {
          ...l,
          quantity: line.quantity,
        } : l));
      } else {
        setLines(prev => prev.map(l => l.uid === editLineUid ? {
          ...l,
          quantity: line.quantity,
          stockFromUid: line.stockFromUid,
          stockFromName: line.stockFromName,
          priority: line.priority,
          dueDate: line.dueDate,
          comment: line.comment,
          available: line.available ?? l.available ?? null,
        } : l));
      }
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
      stockFromUid: line.stockFromUid,
      stockFromName: line.stockFromName,
      available: line.available ?? null,
      priority: line.priority ?? 'MEDIUM',
      dueDate: line.dueDate,
      comment: line.comment ?? null,
      status: line.status ?? 'NOT_STARTED',
      cancelled: line.cancelled ?? false,
    }]);
  };

  const handleStockToSelect = (id: string, name: string) => {
    setStockToUid(id);
    setStockToName(name);
    setShowStockToSelect(false);
  };

  const filteredSortedLines = useMemo(() => {
    let result = [...lines];

    const q = searchValue.trim().toLowerCase();
    if (q) {
      result = result.filter(l =>
        (l.materialName || '').toLowerCase().includes(q) ||
        (l.materialArticle || '').toLowerCase().includes(q) ||
        (l.stockFromName || '').toLowerCase().includes(q)
      );
    }

    if (filterValues.status.size > 0) {
      result = result.filter(l => {
        const s = String(l.status || '');
        if (filterValues.status.has('CLOSED') && s === 'CLOSED') return true;
        if (filterValues.status.has('RECEIVED') && s === 'RECEIVED') return true;
        if (filterValues.status.has('SHIPPED') && s === 'SHIPPED') return true;
        if (filterValues.status.has('IN_PROGRESS') && s === 'IN_PROGRESS') return true;
        if (filterValues.status.has('NOT_STARTED') && s === 'NOT_STARTED') return true;
        return false;
      });
    }

    if (filterValues.cancelled.size > 0) {
      result = result.filter(l => {
        const isCancelledLine = !!l.cancelled;
        const wantCancelled = filterValues.cancelled.has('yes');
        const wantNotCancelled = filterValues.cancelled.has('no');
        if (wantCancelled && wantNotCancelled) return true;
        if (wantCancelled) return isCancelledLine;
        if (wantNotCancelled) return !isCancelledLine;
        return true;
      });
    }

    if (filterValues.priority.size > 0) {
      result = result.filter(l => {
        const p = l.priority ? String(l.priority) : 'none';
        return filterValues.priority.has(p);
      });
    }

    if (filterValues.dueDate.size > 0) {
      const has = filterValues.dueDate.has('yes');
      const not = filterValues.dueDate.has('no');
      result = result.filter(l => {
        const isSet = !!l.dueDate;
        if (has && not) return true;
        if (has) return isSet;
        if (not) return !isSet;
        return true;
      });
    }

    if (filterValues.comment.size > 0) {
      const has = filterValues.comment.has('yes');
      const not = filterValues.comment.has('no');
      result = result.filter(l => {
        const isSet = !!(l.comment && l.comment.trim());
        if (has && not) return true;
        if (has) return isSet;
        if (not) return !isSet;
        return true;
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        let cmp = 0;

        if (sortColumn === 'materialName') {
          cmp = String(a.materialName || '').localeCompare(String(b.materialName || ''));
        } else if (sortColumn === 'materialArticle') {
          cmp = String(a.materialArticle || '').localeCompare(String(b.materialArticle || ''));
        } else if (sortColumn === 'quantity') {
          cmp = Number(a.quantity ?? 0) - Number(b.quantity ?? 0);
        } else if (sortColumn === 'available') {
          cmp = Number(a.available ?? 0) - Number(b.available ?? 0);
        } else if (sortColumn === 'status') {
          const av = LINE_STATUS_LABELS[String(a.status || '')] || '';
          const bv = LINE_STATUS_LABELS[String(b.status || '')] || '';
          cmp = av.localeCompare(bv);
        } else if (sortColumn === 'priority') {
          const ao = PRIORITY_ORDER[String(a.priority || '')] ?? 99;
          const bo = PRIORITY_ORDER[String(b.priority || '')] ?? 99;
          cmp = ao - bo;
        } else if (sortColumn === 'dueDate') {
          const at = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bt = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          cmp = at - bt;
        } else {
          cmp = String((a as any)[sortColumn] ?? '').localeCompare(String((b as any)[sortColumn] ?? ''));
        }

        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [lines, searchValue, filterValues, sortColumn, sortDirection]);

  const visibleColumnsArray = useMemo(() => {
    const allVisible = new Set<string>([...REQUIRED_DOC_KEYS, ...Array.from(visibleOptional)]);
    return ALL_COLUMNS.filter(c => allVisible.has(c.key)).map(c => c.key);
  }, [visibleOptional]);

  const handleSaveColumns = (cols: Set<string>) => {
    const optional = new Set<string>();
    cols.forEach(k => { if (OPTIONAL_DOC_KEYS.includes(k)) optional.add(k); });
    setVisibleOptional(optional);
    setConfigOpen(false);
  };

  const hasActiveFilter =
    filterValues.status.size > 0 ||
    filterValues.cancelled.size > 0 ||
    filterValues.priority.size > 0 ||
    filterValues.dueDate.size > 0 ||
    filterValues.comment.size > 0;

  const toggleFilterValue = (key: FilterKey, value: string) => {
    setFilterValues(prev => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(value)) next[key].delete(value); else next[key].add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterValues({
      status: new Set(),
      cancelled: new Set(),
      priority: new Set(),
      dueDate: new Set(),
      comment: new Set(),
    });
    setSubmenuOpen(null);
  };

  const getSubmenuOptions = (key: FilterKey): { uid: string; name: string }[] => {
    if (key === 'status') return STATUS_FILTER_OPTIONS;
    if (key === 'cancelled') return CANCELLED_FILTER_OPTIONS;
    if (key === 'priority') return PRIORITY_FILTER_OPTIONS;
    if (key === 'dueDate') return DUE_DATE_FILTER_OPTIONS;
    if (key === 'comment') return COMMENT_FILTER_OPTIONS;
    return [];
  };

  const handleSortFieldClick = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof SORT_FIELDS[number]): string | null => {
    if (!field.iconType || sortColumn !== field.key) return null;
    if (field.iconType === '19') return sortDirection === 'asc' ? SortingIcon19BlueUp : SortingIcon19BlueDown;
    if (field.iconType === '20') return sortDirection === 'asc' ? SortingIcon20BlueUp : SortingIcon20BlueDown;
    return null;
  };

  const getSortListWidth = useMemo(() => {
    let maxWidth = 0;
    SORT_FIELDS.forEach(field => {
      const textWidth = getTextWidth(field.label, 15, 500);
      const iconWidth = field.iconType === '19' ? 19 : field.iconType === '20' ? 20 : 0;
      const total = PANEL_LEFT_OFFSET + textWidth + (iconWidth > 0 ? 8 + iconWidth : 0) + SORT_RIGHT_PAD;
      if (total > maxWidth) maxWidth = total;
    });
    return Math.min(Math.max(maxWidth, SORT_FILTER_MIN_WIDTH), SORT_FILTER_MAX_WIDTH);
  }, []);

  const getFilterListWidth = useMemo(() => {
    let maxWidth = 0;
    FILTER_FIELDS.forEach(field => {
      const textWidth = getTextWidth(field.label, 15, 500);
      const total = PANEL_LEFT_OFFSET + textWidth + FILTER_TEXT_TO_ARROW_GAP + FILTER_ARROW_WIDTH + FILTER_RIGHT_PAD;
      if (total > maxWidth) maxWidth = total;
    });
    return Math.min(Math.max(maxWidth, SORT_FILTER_MIN_WIDTH), SORT_FILTER_MAX_WIDTH);
  }, []);

  const getSubmenuWidth = (key: FilterKey): number => {
    const opts = getSubmenuOptions(key);
    const longestName = opts.reduce((max, o) => {
      const textWidth = getTextWidth(o.name, 15, 500);
      return textWidth > max ? textWidth : max;
    }, 0);
    const calculated = PANEL_SUBMENU_LEFT_PAD + longestName + PANEL_SUBMENU_TEXT_TO_CHECKBOX_GAP + PANEL_SUBMENU_CB + PANEL_SUBMENU_RIGHT_PAD + PANEL_SUBMENU_WIDTH_EXTRA;
    return Math.min(Math.max(calculated, SUBMENU_MIN_WIDTH), SUBMENU_MAX_WIDTH);
  };

  const getSubmenuHeight = (key: FilterKey): number => {
    const opts = getSubmenuOptions(key);
    if (opts.length === 0) return PANEL_TOP_PAD + PANEL_TEXT_H + PANEL_BOTTOM_PAD;
    return PANEL_TOP_PAD + opts.length * PANEL_TEXT_H + (opts.length - 1) * PANEL_ITEM_GAP + PANEL_BOTTOM_PAD;
  };

  const getSubmenuTop = (key: FilterKey): number => {
    const idx = FILTER_FIELDS.findIndex(f => f.key === key);
    return idx * PANEL_ROW_STEP;
  };

  const sortListHeight =
    PANEL_TOP_PAD +
    SORT_FIELDS.length * PANEL_TEXT_H +
    (SORT_FIELDS.length - 1) * PANEL_ITEM_GAP +
    PANEL_BOTTOM_PAD;

  const filterListHeight =
    PANEL_TOP_PAD +
    FILTER_FIELDS.length * PANEL_TEXT_H +
    (FILTER_FIELDS.length - 1) * PANEL_ITEM_GAP +
    PANEL_BOTTOM_PAD;

  const searchWidth = panel === 'search' ? SEARCH_EXPANDED_W : ROUND_BTN_SIZE;
  const filterWidth = panel === 'filter' ? getFilterListWidth : ROUND_BTN_SIZE;
  const sortWidth = panel === 'sort' ? getSortListWidth : ROUND_BTN_SIZE;

  const searchX = TOOLBAR_LEFT + TABLE_LEFT_MARGIN_INSIDE;
  const sortX = searchX + searchWidth + ROUND_BTN_GAP;
  const filterX = sortX + sortWidth + ROUND_BTN_GAP;
  const addX = filterX + filterWidth + BTN_ADD_GAP_BEFORE;
  const cleanX = addX + BTN_ADD_W + BTN_STUB_GAP_AFTER;
  const mainX = cleanX + ROUND_BTN_SIZE + BTN_MAIN_GAP_BEFORE;
  const statusX = mainX + BTN_MAIN_W + BTN_STATUS_GAP_BEFORE;

  const rightGroupRight = TOOLBAR_LEFT + TABLE_W - RIGHT_GROUP_RIGHT_INSET;
  const rightBtn4Left = rightGroupRight - RIGHT_ROUND_BTN_SIZE;
  const rightBtn3Left = rightBtn4Left - RIGHT_ROUND_BTN_SIZE - RIGHT_ROUND_BTN_GAP;
  const rightBtn2Left = rightBtn3Left - RIGHT_ROUND_BTN_SIZE - RIGHT_ROUND_BTN_GAP;
  const rightBtn1Left = rightBtn2Left - RIGHT_ROUND_BTN_SIZE - RIGHT_ROUND_BTN_GAP;

  const togglePanel = (next: ToolbarPanel) => {
    setPanel(prev => prev === next ? null : next);
    if (next !== 'filter') setSubmenuOpen(null);
  };

  // ==================== ДОСТУПНОСТЬ ====================

  const canModifyLines =
    isNewDoc ||
    (isDraft && editMode) ||
    (isDraft && !isSavedOnce);

  const canAdd = !isCancelled && !isRejected && !isApproved && !isInProgress && !isClosed && !isOnApproval && canModifyLines;
  const canEditLine = canAdd;
  const canDeleteLine = canAdd;

  const canEditLinePartial = isApproved && editMode && !isCancelled && !isRejected;
  const canToggleLineCancel = isApproved && editMode && !isCancelled && !isRejected;

  const canClean = canDeleteLine && selectedIds.size > 0;

  const canSave = useMemo(() => {
    if (isCancelled || isRejected || isInProgress || isClosed || isOnApproval) return false;
    if (isNewDoc) return lines.length > 0 && !!stockToUid && allActiveLinesHaveStockFrom;
    if (isDraft) return isDirty && allActiveLinesHaveStockFrom && !!stockToUid;
    if (isApproved) return editMode && isDirty;
    return false;
  }, [isNewDoc, isDraft, isApproved, isDirty, lines.length, stockToUid, isCancelled, isRejected, isInProgress, isClosed, isOnApproval, editMode, allActiveLinesHaveStockFrom]);

  const canSubmitForApproval = isDraft && !!useApproval && !isDirty && isSavedOnce && lines.length > 0 && allActiveLinesHaveStockFrom && !!stockToUid;
  const canTakeToWork = isDraft && !useApproval && !isDirty && isSavedOnce && lines.length > 0 && allActiveLinesHaveStockFrom && !!stockToUid;
  const canApprove = isOnApproval;
  const canReject = isOnApproval;

  const canCancelDoc = (isDraft || isOnApproval || isApproved) && !isCancelled && !isRejected && !isInProgress && !isClosed;
  const canEditDoc = !isCancelled && !isRejected && !isInProgress && !isClosed && !isOnApproval && !isDirty && !editMode && (isDraft || isApproved);
  const canCreateBased = isSavedOnce && !isDirty && !isCancelled && !isRejected;

  const canGroupCancel = (isDraft || isOnApproval || isApproved) && !isCancelled && !isRejected && lines.length > 1;

  const headerEditable = (isNewDoc || (isDraft && editMode)) && !isCancelled && !isRejected && !isApproved && !isInProgress && !isClosed && !isOnApproval;
  const stockToEditable = headerEditable;

  const useApprovalEditable = !isCancelled && !isRejected && !isOnApproval && !isApproved && !isInProgress && !isClosed && (isNewDoc || isDraft);

  const showSubmitOrTakeToWork = isNewDoc || isDraft;
  const showApproveReject = isOnApproval || isApproved;
  const showSaveButton = !isOnApproval && !isRejected && !isCancelled && !isClosed;
  const showGroupCancel = !isOnApproval && !isRejected && !isCancelled && !isClosed;

  const submitOrTakeLabel = useApproval ? 'На согласование' : 'Передать в работу';
  const submitOrTakeActive = useApproval ? canSubmitForApproval : canTakeToWork;
  const submitOrTakeLoading = useApproval ? isSubmitting : isTakingToWork;
  const submitOrTakeWidth = useApproval ? BTN_SUBMIT_W : BTN_TAKE_TO_WORK_W;

  const approveActive = isOnApproval && canApprove && !isApproving;
  const rejectActive = isOnApproval && canReject && !isRejecting;

  const handleSubmitOrTake = () => {
    if (useApproval) handleSubmitForApproval();
    else handleTakeToWork();
  };

  const manageItems: ContextMenuItem[] = [
    {
      id: 'cancel',
      label: 'Отменить',
      icon: CancelIcon16BlackOne,
      iconWidth: 16,
      iconHeight: 16,
      disabled: !canCancelDoc,
      onClick: () => { setManageOpen(false); handleCancel(); },
    },
    {
      id: 'edit',
      label: 'Редактировать',
      icon: DescriptionIcon18Black,
      iconWidth: 16,
      iconHeight: 16,
      disabled: !canEditDoc,
      onClick: () => { setManageOpen(false); setEditMode(true); },
    },
    {
      id: 'based',
      label: 'Создать на основании',
      icon: CreateIcon14Black,
      iconWidth: 14,
      iconHeight: 14,
      disabled: !canCreateBased,
      onClick: () => { setManageOpen(false); setShowBasedPopup(true); },
    },
  ];

  const editingLine = editLineUid ? lines.find(l => l.uid === editLineUid) : null;
  const editingMaxQuantity = editingLine?.acceptedQuantity != null ? editingLine.acceptedQuantity : editingLine?.quantity ?? null;

  const handleBasedSubmit = () => {
    if (!basedStockToUid || isCreatingBased) return;
    setIsCreatingBased(true);
    try {
      const newUid = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('stockToUid', basedStockToUid);
      if (basedStockToName) params.set('stockToName', basedStockToName);
      params.set('basedOn', uid || '');
      openTab(
        `/documents/move-orders/create/${newUid}?${params.toString()}`,
        `Заказ на перемещение`,
        null
      );
      setShowBasedPopup(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingBased(false);
    }
  };

  const rowContextMenuItems = useCallback((uidRow: string): ContextMenuItem[] => {
    const line = lines.find(l => l.uid === uidRow);
    const lineCancelledSaved = line ? isLineCancelledSaved(line.uid, !!line.cancelled) : false;

    return [
      { id: 'add', label: 'Добавить', icon: CreateIcon14Black, iconWidth: 14, iconHeight: 14, disabled: !canAdd, onClick: () => { openAddPopup(); } },
      { id: 'edit', label: 'Редактировать', icon: DescriptionIcon18Black, iconWidth: 16, iconHeight: 16, disabled: !canEditLine && !canEditLinePartial, onClick: () => {
        const l = lines.find(x => x.uid === uidRow);
        if (!l) return;
        if (canEditLinePartial) {
          setEditLineUid(uidRow);
          setEditLineMode('accepted');
          setAddPopupOpen(true);
          return;
        }
        if (lineCancelledSaved) return;
        setEditLineUid(uidRow);
        setEditLineMode('default');
        setAddPopupOpen(true);
      } },
      { id: 'clean', label: 'Очистить', icon: CleanIcon18Black, iconWidth: 18, iconHeight: 17, disabled: !canDeleteLine, onClick: () => { setLines(prev => prev.filter(l => l.uid !== uidRow)); setSelectedIds(prev => { const n = new Set(prev); n.delete(uidRow); return n; }); } },
      { id: 'cancel', label: 'Отменить', icon: CancelIcon16BlackOne, iconWidth: 16, iconHeight: 16, disabled: !canToggleLineCancel, onClick: () => { setLines(prev => prev.map(l => l.uid === uidRow ? { ...l, cancelled: !l.cancelled } : l)); } },
    ];
  }, [lines, canAdd, canEditLine, canEditLinePartial, canDeleteLine, canToggleLineCancel, isLineCancelledSaved]);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', top: TITLE_TOP, left: TITLE_LEFT, display: 'flex', alignItems: 'center', gap: TITLE_TO_STATUS_GAP, zIndex: 2 }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>
              {titleText}
            </h1>
            {statusLabel && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: statusColor, lineHeight: '29px' }}>
                {statusLabel}
              </span>
            )}
          </div>

          <div style={{ position: 'absolute', top: TRACK_TOP, left: TRACK_LEFT, right: 60, display: 'flex', alignItems: 'flex-start', gap: TRACK_LABEL_GAP, zIndex: 2 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#5A607F', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
              Этап:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {trackLines.map((ln, i) => (
                <span key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#666EFE', lineHeight: `${TRACK_LINE_HEIGHT}px` }}>
                  {ln}
                </span>
              ))}
            </div>
            {reservedState === 'reserved' && (
              <span
                style={{
                  marginLeft: 20,
                  padding: '4px 10px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 214, 100, 0.1)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#00A64F',
                }}
              >
                Номенклатура забронирована
              </span>
            )}
            {reservedState === 'cancelled' && (
              <span
                style={{
                  marginLeft: 20,
                  padding: '4px 10px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 48, 82, 0.1)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#FF3052',
                }}
              >
                Бронь отменена
              </span>
            )}
          </div>

          <div ref={manageWrapRef} style={{ position: 'absolute', top: MANAGE_BTN_TOP, right: MANAGE_BTN_RIGHT, zIndex: 20 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setManageOpen(v => !v); }}
              style={{
                ...btnBaseStyle,
                width: MANAGE_BTN_W, height: MANAGE_BTN_H, borderRadius: MANAGE_BTN_RADIUS,
                border: 'none', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: 'pointer', padding: 0,
              }}
            >
              <img src={DescriptionIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Меню управления</span>
            </button>

            <AnimatePresence>
              {manageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: MANAGE_BTN_H + MANAGE_MENU_GAP,
                    right: 0,
                    width: MANAGE_MENU_W,
                    backgroundColor: '#FFFFFF',
                    borderRadius: MANAGE_MENU_RADIUS,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                    paddingTop: MANAGE_MENU_PAD,
                    paddingBottom: MANAGE_MENU_PAD,
                    zIndex: 30,
                  }}
                >
                  {manageItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => { if (!item.disabled) item.onClick(); }}
                      style={{
                        height: MANAGE_MENU_ITEM_H,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 20,
                        paddingRight: 20,
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        opacity: item.disabled ? 0.4 : 1,
                        borderBottom: idx < manageItems.length - 1 ? '1px solid rgba(45,64,89,0.06)' : 'none',
                      }}
                      onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.backgroundColor = 'rgba(102,110,254,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {item.icon && (
                        <img src={item.icon} alt="" style={{ width: item.iconWidth ?? 16, height: item.iconHeight ?? 16, marginRight: 15 }} />
                      )}
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{
            position: 'absolute',
            top: HEADER_TOP,
            left: HEADER_LEFT,
            width: HEADER_W,
            height: HEADER_H,
            backgroundColor: '#FFFFFF',
            borderRadius: HEADER_RADIUS,
            boxSizing: 'border-box',
          }}>
            <div style={{ position: 'absolute', bottom: HEADER_FIELD_BOTTOM, left: HEADER_FIELD_LEFT_FIRST }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="Номер:"
                labelPosition="inside"
                icon={CodeIcon20Gray}
                iconActive={CodeIcon20Blue}
                value={doc?.code != null ? String(doc.code).padStart(4, '0') : ''}
                placeholder=""
                type="input"
                disabled
                iconWidth={20} iconHeight={14}
              />
            </div>

            <div style={{ position: 'absolute', bottom: HEADER_FIELD_BOTTOM, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="От:"
                labelPosition="inside"
                icon={CalendarIcon16Gray}
                value={isSavedOnce && doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : ''}
                type="input"
                disabled
                iconWidth={16} iconHeight={18}
              />
            </div>

            <div style={{ position: 'absolute', bottom: HEADER_FIELD_BOTTOM, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 2 }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="Склад-получатель:"
                labelPosition="inside"
                icon={StationIcon16Gray}
                iconActive={StationIcon16Blue}
                value={stockToName}
                placeholder="Выберите склад"
                type="select"
                disabled={!stockToEditable}
                searchOptions={stationOptions}
                onSelectOption={(id, name) => { setStockToUid(id); setStockToName(name); }}
                onOpenFullList={() => { if (stockToEditable) setShowStockToSelect(true); }}
                selectIconWidth={16} selectIconHeight={16}
                searchTitle="Найденный склад"
                searchNotFoundText="Склады не найдены"
              />
            </div>

            <div style={{ position: 'absolute', bottom: HEADER_FIELD_BOTTOM, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 3 }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="Крайний срок по заказу:"
                labelPosition="inside"
                icon={ExecutionIcon16Gray}
                iconActive={ExecutionIcon16Blue}
                value={doc?.deadline ? formatDateTime(doc.deadline) : ''}
                type="input"
                disabled
                iconWidth={16} iconHeight={16}
              />
            </div>

            <div style={{ position: 'absolute', bottom: HEADER_FIELD_BOTTOM, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 4 }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="Комментарий:"
                labelPosition="inside"
                icon={comment.length > 0 ? DescriptionIcon16Blue : DescriptionIcon16Gray}
                value={comment}
                placeholder="Комментарий по заказу"
                type="comment"
                disabled={!headerEditable}
                iconWidth={18} iconHeight={18}
                commentIcon={comment.length > 0 ? PopupIcon14Blue : PopupIcon14Gray}
                commentIconActive={PopupIcon14Blue}
                onClick={() => { if (headerEditable) setCommentPopupOpen(true); }}
              />
            </div>

            <div style={{ position: 'absolute', top: 8, left: HEADER_FIELD_LEFT_FIRST, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#2D4059' }}>
                Использовать режим согласования
              </span>
              <div
                onClick={() => { if (useApprovalEditable) setUseApproval(v => !v); }}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  backgroundColor: useApproval ? '#666EFE' : '#D1D5DB',
                  cursor: useApprovalEditable ? 'pointer' : 'not-allowed',
                  position: 'relative', transition: 'background-color 0.2s',
                  opacity: useApprovalEditable ? 1 : 0.5,
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: useApproval ? 20 : 2,
                  width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', top: TOOLBAR_TOP, left: 0, right: 0, height: TOOLBAR_H, zIndex: 6 }}>
            <motion.div
              style={{
                position: 'absolute', top: 0, left: 0, height: ROUND_BTN_SIZE, borderRadius: ROUND_BTN_RADIUS,
                backgroundColor: panel === 'search' ? '#666EFE' : '#FFFFFF',
                border: panel === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
                zIndex: panel === 'search' ? 20 : 5,
              }}
              animate={{ x: searchX, width: searchWidth }}
              transition={{ x: SPRING, width: TWEEN }}
            >
              <div
                onClick={() => { if (panel === 'search') { setPanel(null); setSearchValue(''); } else { setPanel('search'); setSubmenuOpen(null); } }}
                style={{ width: ROUND_BTN_SIZE, height: ROUND_BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
              >
                <img src={panel === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              </div>
              <AnimatePresence>
                {panel === 'search' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}
                  >
                    <input
                      autoFocus
                      type="text"
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      placeholder="Поиск"
                      style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              style={{
                position: 'absolute', top: 0, left: 0, borderRadius: ROUND_BTN_RADIUS,
                backgroundColor: '#FFFFFF',
                border: panel === 'sort' || sortColumn ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                boxShadow: panel === 'sort' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
                overflow: 'hidden',
                zIndex: panel === 'sort' ? 25 : 5,
              }}
              animate={{
                x: sortX,
                width: sortWidth,
                height: panel === 'sort' ? PANEL_HEADER_H + sortListHeight + PANEL_CLEAR_H : ROUND_BTN_SIZE,
              }}
              transition={{ x: SPRING, width: TWEEN, height: TWEEN }}
            >
              <div
                onClick={() => togglePanel('sort')}
                style={{
                  height: panel === 'sort' ? PANEL_HEADER_H : ROUND_BTN_SIZE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  backgroundColor: panel === 'sort' || sortColumn ? '#666EFE' : 'transparent',
                  borderRadius: panel === 'sort' ? `${ROUND_BTN_RADIUS}px ${ROUND_BTN_RADIUS}px 0 0` : ROUND_BTN_RADIUS,
                  transition: 'height 0.2s ease',
                }}
              >
                {panel === 'sort'
                  ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Сортировка</span>
                  : <img src={sortColumn ? SortingIcon20White : SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />}
              </div>

              <AnimatePresence>
                {panel === 'sort' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                    style={{ position: 'relative', height: sortListHeight, overflow: 'hidden' }}
                  >
                    {sortColumn && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: sortIndicatorY }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        style={{
                          position: 'absolute',
                          left: PANEL_INDICATOR_LEFT,
                          top: 0,
                          width: PANEL_INDICATOR_W,
                          height: PANEL_INDICATOR_H,
                          backgroundColor: '#666EFE',
                          borderRadius: 999,
                          zIndex: 1,
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    <div style={{ paddingTop: PANEL_TOP_PAD, paddingBottom: PANEL_BOTTOM_PAD }}>
                      {SORT_FIELDS.map((field, idx) => {
                        const isSelected = sortColumn === field.key;
                        const sortIcon = getSortIcon(field);
                        const iconW = field.iconType === '19' ? 19 : field.iconType === '20' ? 20 : 0;
                        return (
                          <div
                            key={field.key}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSortFieldClick(field.key)}
                            style={{
                              height: PANEL_TEXT_H, display: 'flex', alignItems: 'center', cursor: 'pointer',
                              marginBottom: idx < SORT_FIELDS.length - 1 ? PANEL_ITEM_GAP : 0,
                              paddingLeft: PANEL_LEFT_OFFSET,
                              paddingRight: SORT_RIGHT_PAD,
                              position: 'relative',
                            }}
                          >
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                              color: isSelected ? '#666EFE' : '#2D4059', lineHeight: `${PANEL_TEXT_H}px`,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                            }}>
                              {field.label}
                            </span>
                            {sortIcon && <img src={sortIcon} alt="" style={{ width: iconW, height: field.iconType === '19' ? 12 : 10, marginLeft: 8, flexShrink: 0 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {panel === 'sort' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                  >
                    <div style={{ height: 3, borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSortColumn(null); setSortDirection('asc'); }}
                      style={{
                        width: '100%', height: PANEL_CLEAR_H, border: 'none', backgroundColor: 'transparent',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13,
                        borderRadius: `0 0 ${ROUND_BTN_RADIUS}px ${ROUND_BTN_RADIUS}px`,
                      }}
                    >
                      Очистить сортировку
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              style={{
                position: 'absolute', top: 0, left: 0, borderRadius: ROUND_BTN_RADIUS,
                backgroundColor: '#FFFFFF',
                border: panel === 'filter' || hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                boxShadow: panel === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
                overflow: 'visible',
                zIndex: panel === 'filter' ? 25 : 5,
              }}
              animate={{
                x: filterX,
                width: filterWidth,
                height: panel === 'filter' ? PANEL_HEADER_H + filterListHeight + PANEL_CLEAR_H : ROUND_BTN_SIZE,
              }}
              transition={{ x: SPRING, width: TWEEN, height: TWEEN }}
            >
              <div
                onClick={() => togglePanel('filter')}
                style={{
                  height: panel === 'filter' ? PANEL_HEADER_H : ROUND_BTN_SIZE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  backgroundColor: panel === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent',
                  borderRadius: panel === 'filter' ? `${ROUND_BTN_RADIUS}px ${ROUND_BTN_RADIUS}px 0 0` : ROUND_BTN_RADIUS,
                  transition: 'height 0.2s ease',
                }}
              >
                {panel === 'filter'
                  ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                  : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="" style={{ width: 18, height: 18 }} />}
              </div>

              <AnimatePresence>
                {panel === 'filter' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                    style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}
                  >
                    {FILTER_FIELDS.map(field => {
                      if (filterValues[field.key].size === 0) return null;
                      const idx = FILTER_FIELDS.findIndex(f => f.key === field.key);
                      return (
                        <motion.div
                          key={`ind-${field.key}`}
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute',
                            left: PANEL_INDICATOR_LEFT,
                            top: PANEL_TOP_PAD + idx * PANEL_ROW_STEP + (PANEL_TEXT_H - PANEL_INDICATOR_H) / 2,
                            width: PANEL_INDICATOR_W,
                            height: PANEL_INDICATOR_H,
                            backgroundColor: '#666EFE',
                            borderRadius: 999,
                            zIndex: 1,
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    })}

                    <div style={{ paddingTop: PANEL_TOP_PAD, paddingBottom: PANEL_BOTTOM_PAD }}>
                      {FILTER_FIELDS.map((field, fieldIdx) => {
                        const isActive = filterValues[field.key].size > 0;
                        return (
                          <div
                            key={field.key}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setSubmenuOpen(prev => prev === field.key ? null : field.key)}
                            style={{
                              height: PANEL_TEXT_H, display: 'flex', alignItems: 'center', cursor: 'pointer',
                              marginBottom: fieldIdx < FILTER_FIELDS.length - 1 ? PANEL_ITEM_GAP : 0,
                              paddingLeft: PANEL_LEFT_OFFSET, position: 'relative',
                            }}
                          >
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                              color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${PANEL_TEXT_H}px`,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                            }}>
                              {field.label}
                            </span>
                            <div style={{ position: 'absolute', right: 20, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <img src={isActive ? ArrowIcon6Blue : ArrowIcon6Black} alt="" style={{ width: 6, height: 10 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {submenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: 'absolute',
                            left: filterWidth + PANEL_SUBMENU_OFFSET,
                            top: getSubmenuTop(submenuOpen),
                            width: getSubmenuWidth(submenuOpen),
                            height: getSubmenuHeight(submenuOpen),
                            backgroundColor: '#FFFFFF',
                            borderRadius: '0 15px 15px 15px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            border: '1px solid rgba(102, 110, 254, 0.15)',
                            zIndex: 30,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ paddingTop: PANEL_TOP_PAD, paddingBottom: PANEL_BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', maxHeight: 400 }}>
                            {getSubmenuOptions(submenuOpen).map((option, i, arr) => {
                              const checked = filterValues[submenuOpen].has(option.uid);
                              const textMaxWidth = getSubmenuWidth(submenuOpen) - PANEL_SUBMENU_LEFT_PAD - PANEL_SUBMENU_TEXT_TO_CHECKBOX_GAP - PANEL_SUBMENU_CB - PANEL_SUBMENU_RIGHT_PAD;
                              return (
                                <div
                                  key={option.uid}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => toggleFilterValue(submenuOpen, option.uid)}
                                  style={{
                                    height: PANEL_TEXT_H, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                    marginBottom: i < arr.length - 1 ? PANEL_ITEM_GAP : 0,
                                    paddingLeft: PANEL_SUBMENU_LEFT_PAD, position: 'relative',
                                  }}
                                >
                                  {checked && (
                                    <motion.div
                                      initial={{ opacity: 0, scaleY: 0 }}
                                      animate={{ opacity: 1, scaleY: 1 }}
                                      exit={{ opacity: 0, scaleY: 0 }}
                                      transition={{ duration: 0.15 }}
                                      style={{
                                        position: 'absolute', left: PANEL_INDICATOR_LEFT, top: (PANEL_TEXT_H - PANEL_INDICATOR_H) / 2,
                                        width: PANEL_INDICATOR_W, height: PANEL_INDICATOR_H,
                                        backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                                      }}
                                    />
                                  )}
                                  <span style={{
                                    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                    color: checked ? '#666EFE' : '#2D4059', lineHeight: `${PANEL_TEXT_H}px`,
                                    maxWidth: textMaxWidth,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {option.name}
                                  </span>
                                  <div style={{ position: 'absolute', right: PANEL_SUBMENU_RIGHT_PAD, width: PANEL_SUBMENU_CB, height: PANEL_SUBMENU_CB }}>
                                    <img src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: PANEL_SUBMENU_CB, height: PANEL_SUBMENU_CB }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {panel === 'filter' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                  >
                    <div style={{ height: 3, borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearFilters}
                      style={{
                        width: '100%', height: PANEL_CLEAR_H, border: 'none', backgroundColor: 'transparent',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13,
                        borderRadius: `0 0 ${ROUND_BTN_RADIUS}px ${ROUND_BTN_RADIUS}px`,
                      }}
                    >
                      Очистить фильтр
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button
              onClick={openAddPopup}
              disabled={!canAdd}
              style={{
                ...btnBaseStyle,
                position: 'absolute', left: 0, top: 0,
                width: BTN_ADD_W, height: TOOLBAR_BTN_H, borderRadius: TOOLBAR_BTN_RADIUS,
                backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
                display: 'flex', alignItems: 'center', paddingLeft: 18, paddingRight: 18,
                boxSizing: 'border-box', gap: 12,
                cursor: canAdd ? 'pointer' : 'not-allowed',
                opacity: canAdd ? 1 : 0.5,
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                zIndex: 5,
              }}
              animate={{ x: addX }}
              transition={SPRING}
            >
              <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} />
              <span>Добавить</span>
            </motion.button>

            <motion.button
              onClick={handleCleanSelected}
              disabled={!canClean}
              style={{
                ...btnBaseStyle,
                position: 'absolute', left: 0, top: 0,
                width: ROUND_BTN_SIZE, height: ROUND_BTN_SIZE, borderRadius: ROUND_BTN_RADIUS,
                backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canClean ? 'pointer' : 'not-allowed',
                opacity: canClean ? 1 : 0.5,
                padding: 0,
                zIndex: 5,
              }}
              animate={{ x: cleanX }}
              transition={SPRING}
              title="Очистить"
            >
              <img src={CleanIcon18Black} alt="" style={{ width: 18, height: 17 }} />
            </motion.button>

            <motion.button
              style={{
                ...btnBaseStyle,
                position: 'absolute', left: 0, top: 0,
                width: BTN_MAIN_W, height: TOOLBAR_BTN_H, borderRadius: TOOLBAR_BTN_RADIUS,
                backgroundColor: viewMode === 'document' && !showHistory ? '#666EFE' : '#FFFFFF',
                border: viewMode === 'document' && !showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                color: viewMode === 'document' && !showHistory ? '#FFFFFF' : '#2D4059',
                zIndex: 5,
              }}
              animate={{ x: mainX }}
              transition={SPRING}
              onClick={() => { setSlideDirection('right'); setViewMode('document'); setShowHistory(false); }}
            >
              Основное
            </motion.button>

            <motion.button
              style={{
                ...btnBaseStyle,
                position: 'absolute', left: 0, top: 0,
                width: BTN_STATUS_W, height: TOOLBAR_BTN_H, borderRadius: TOOLBAR_BTN_RADIUS,
                backgroundColor: viewMode === 'status' && !showHistory ? '#666EFE' : '#FFFFFF',
                border: viewMode === 'status' && !showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                color: viewMode === 'status' && !showHistory ? '#FFFFFF' : '#2D4059',
                zIndex: 5,
              }}
              animate={{ x: statusX }}
              transition={SPRING}
              onClick={() => { setSlideDirection('left'); setViewMode('status'); setShowHistory(false); }}
            >
              Статус заказа
            </motion.button>

            <button
              style={{ ...btnBaseStyle, position: 'absolute', left: rightBtn1Left, top: 0, width: RIGHT_ROUND_BTN_SIZE, height: RIGHT_ROUND_BTN_SIZE, borderRadius: RIGHT_ROUND_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              title="Скачать"
              onClick={() => {}}
            >
              <img src={DownloadIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </button>

            <button
              style={{ ...btnBaseStyle, position: 'absolute', left: rightBtn2Left, top: 0, width: RIGHT_ROUND_BTN_SIZE, height: RIGHT_ROUND_BTN_SIZE, borderRadius: RIGHT_ROUND_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              title="Печать"
              onClick={() => {}}
            >
              <img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </button>

            <button
              style={{ ...btnBaseStyle, position: 'absolute', left: rightBtn3Left, top: 0, width: RIGHT_ROUND_BTN_SIZE, height: RIGHT_ROUND_BTN_SIZE, borderRadius: RIGHT_ROUND_BTN_RADIUS, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF', border: showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              title="История"
              onClick={handleToggleHistory}
            >
              <img src={showHistory ? HistoryIcon18White : HistoryIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </button>

            <button
              style={{ ...btnBaseStyle, position: 'absolute', left: rightBtn4Left, top: 0, width: RIGHT_ROUND_BTN_SIZE, height: RIGHT_ROUND_BTN_SIZE, borderRadius: RIGHT_ROUND_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              title="Настройки колонок"
              onClick={() => setConfigOpen(true)}
            >
              <img src={ConfigurationIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ position: 'absolute', top: TABLE_TOP, left: TABLE_LEFT, width: TABLE_W, height: TABLE_H }}>
            <AnimatePresence initial={false} mode="wait">
              {showHistory ? (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={TABLE_W} visibleRows={TABLE_VISIBLE_ROWS} />
                </motion.div>
              ) : (
                <motion.div
                  key={viewMode}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  {viewMode === 'document' && (
                    <DataTable
                      columns={ALL_COLUMNS}
                      visibleKeys={visibleColumnsArray}
                      data={filteredSortedLines}
                      selectedIds={selectedIds}
                      onCheckboxClick={handleCheckboxClick}
                      onSelectAll={handleSelectAll}
                      onRowClick={handleRowClick}
                      onDoubleClick={handleDoubleClick}
                      renderCell={renderDocCell}
                      renderCellNode={renderDocCellNode}
                      isGrayColumn={(key) => key !== 'materialName' && key !== 'materialArticle'}
                      tableWidth={TABLE_W}
                      rowHeight={TABLE_ROW_H}
                      headerHeight={TABLE_HEADER_H}
                      visibleRows={TABLE_VISIBLE_ROWS}
                      highlightText={searchValue.trim() || undefined}
                      centerColumns={['cancelled']}
                      rowIcon={NomenclatureIcon16Black}
                      rowContextMenuItems={rowContextMenuItems}
                      rowBackground={(item) => {
                        if (item._fromBased && !isLineFilled(item)) return 'rgba(255, 48, 82, 0.08)';
                        return null;
                      }}
                    />
                  )}
                  {viewMode === 'status' && (
                    <DataTable
                      columns={STATUS_COLUMNS}
                      visibleKeys={STATUS_VISIBLE}
                      data={filteredSortedLines}
                      selectedIds={selectedIds}
                      onCheckboxClick={handleCheckboxClick}
                      onSelectAll={handleSelectAll}
                      onRowClick={handleRowClick}
                      onDoubleClick={handleDoubleClick}
                      renderCell={renderStatusCell}
                      renderCellNode={renderStatusCellNode}
                      isGrayColumn={(key) => key !== 'materialName' && key !== 'overallStatus'}
                      tableWidth={TABLE_W}
                      rowHeight={TABLE_ROW_H}
                      headerHeight={TABLE_HEADER_H}
                      visibleRows={TABLE_VISIBLE_ROWS}
                      highlightText={searchValue.trim() || undefined}
                      rowIcon={NomenclatureIcon16Black}
                      rowContextMenuItems={rowContextMenuItems}
                      rowBackground={(item) => {
                        if (item._fromBased && !isLineFilled(item)) return 'rgba(255, 48, 82, 0.08)';
                        return null;
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: 'absolute', bottom: BOTTOM_BTN_BOTTOM, right: BOTTOM_BTN_RIGHT, display: 'flex', alignItems: 'center', gap: BOTTOM_BTN_GAP, zIndex: 10 }}>
            {showGroupCancel && (
              <div
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={handleGroupCancelMouseEnter}
                onMouseLeave={handleGroupCancelMouseLeave}
              >
                <button
                  disabled={!canGroupCancel}
                  onClick={handleGroupCancel}
                  style={{
                    width: BTN_GROUP_CANCEL_W, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                    cursor: canGroupCancel ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', paddingLeft: 22, boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                    opacity: canGroupCancel ? 1 : 0.5,
                  }}
                >
                  <img src={CancelIcon16Black} alt="" style={{ width: 16, height: 18, flexShrink: 0 }} />
                  <span style={{ marginLeft: 17 }}>Групповая отмена</span>
                </button>

                <AnimatePresence>
                  {showGroupCancelTooltip && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, zIndex: 10000, pointerEvents: 'none' }}>
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'relative', backgroundColor: '#2D4059', color: '#FFFFFF',
                          padding: '8px 16px', borderRadius: 10, fontSize: 14,
                          fontFamily: 'Inter, sans-serif', fontWeight: 400, whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                      >
                        Отменяет все позиции со статусом «Не взят в работу»
                        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #2D4059' }} />
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {showApproveReject && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={!approveActive}
                  style={{
                    width: BTN_APPROVE_W, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                    cursor: approveActive ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                    opacity: approveActive ? 1 : 0.5,
                  }}
                >
                  {isApproving ? 'Согласование...' : 'Согласовать'}
                </button>

                <button
                  onClick={handleReject}
                  disabled={!rejectActive}
                  style={{
                    width: BTN_REJECT_W, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                    cursor: rejectActive ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FF3052',
                    opacity: rejectActive ? 1 : 0.5,
                  }}
                >
                  {isRejecting ? 'Отклонение...' : 'Отклонить'}
                </button>
              </>
            )}

            {showSubmitOrTakeToWork && (
              <button
                onClick={handleSubmitOrTake}
                disabled={!submitOrTakeActive || submitOrTakeLoading}
                style={{
                  width: submitOrTakeWidth, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                  border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                  cursor: (!submitOrTakeActive || submitOrTakeLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                  opacity: (!submitOrTakeActive || submitOrTakeLoading) ? 0.5 : 1,
                }}
              >
                {submitOrTakeLoading ? 'Отправка...' : submitOrTakeLabel}
              </button>
            )}

            {showSaveButton && (
              <button
                disabled={!canSave || isSaving}
                onClick={handleSave}
                style={{
                  width: BTN_SAVE_W, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                  border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                  cursor: canSave && !isSaving ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15,
                  fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                  opacity: canSave && !isSaving ? 1 : 0.5,
                }}
              >
                <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21 }} />
                <span>{isSaving ? 'Сохранение...' : 'Записать'}</span>
              </button>
            )}

            <button
              onClick={handleClose}
              style={{
                width: BTN_CLOSE_W, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
              }}
            >
              Закрыть
            </button>
          </div>

          <MoveOrderAddLinePopup
            isOpen={addPopupOpen}
            onClose={() => { setAddPopupOpen(false); setEditLineUid(null); }}
            onAdd={handleAddLineFromPopup}
            stationOptions={stationOptions}
            materialOptions={materialOptions}
            initialStockFromUid={editingLine?.stockFromUid || ''}
            initialStockFromName={editingLine?.stockFromName || ''}
            initialMaterialUid={editingLine?.materialUid || ''}
            initialMaterialName={editingLine?.materialName || ''}
            initialMaterialArticle={editingLine?.materialArticle || ''}
            initialMaterialCode={editingLine?.materialCode ?? null}
            initialQuantity={editingLine?.quantity ?? null}
            initialPriority={editingLine?.priority ?? 'MEDIUM'}
            initialDueDate={editingLine?.dueDate ?? null}
            initialComment={editingLine?.comment ?? null}
            initialAvailable={editingLine?.available ?? null}
            editingUid={editLineUid}
            mode={editLineMode}
            maxQuantity={editingMaxQuantity}
            lockMaterial={!!editingLine?._fromBased || editLineMode === 'accepted'}
          />

          <ConfigurationPopup
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            title="Заказ на перемещение (Настройки колонок)"
            columns={ALL_COLUMNS}
            visibleColumns={new Set([...REQUIRED_DOC_KEYS, ...Array.from(visibleOptional)])}
            requiredColumns={new Set(REQUIRED_DOC_KEYS)}
            onSave={handleSaveColumns}
          />

          <CatalogSelectPopup isOpen={showStockToSelect} onClose={() => setShowStockToSelect(false)} onSelect={handleStockToSelect} popupType="station" />
          <DocumentCommentPopup isOpen={commentPopupOpen} onClose={() => setCommentPopupOpen(false)} onSave={(v) => setComment(v)} initialValue={comment} title="Комментарий к заказу" placeholder="Введите комментарий..." />

          {showBasedPopup && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBasedPopup(false)}>
              <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Создание на основании</h3>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Склад-получатель</label>
                  <div onClick={() => setShowBasedStationSelect(true)} style={{ width: '100%', height: 44, borderRadius: 10, border: basedStockToUid ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, cursor: 'pointer', boxSizing: 'border-box' }}>
                    <img src={basedStockToUid ? StationIcon16Blue : StationIcon16Gray} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ marginLeft: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: basedStockToUid ? '#666EFE' : '#A0A3BD' }}>
                      {basedStockToName || 'Выберите склад-получатель'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setShowBasedPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
                  <button onClick={handleBasedSubmit} disabled={isCreatingBased || !basedStockToUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: basedStockToUid && !isCreatingBased ? '#666EFE' : '#BCC8FF', cursor: basedStockToUid && !isCreatingBased ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>
                    {isCreatingBased ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <CatalogSelectPopup isOpen={showBasedStationSelect} onClose={() => setShowBasedStationSelect(false)} onSelect={(id: string, name: string) => { setBasedStockToUid(id); setBasedStockToName(name); setShowBasedStationSelect(false); }} popupType="station" />

          {showCloseConfirm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCloseConfirm(false)}>
              <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Сохранить изменения?</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>В документе есть несохранённые изменения.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setShowCloseConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
                  <button onClick={() => handleConfirmClose(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Не сохранять</button>
                  <button onClick={() => handleConfirmClose(true)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MoveOrderCreatePage;