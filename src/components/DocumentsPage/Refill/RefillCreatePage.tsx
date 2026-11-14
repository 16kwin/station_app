// RefillCreatePage.tsx — форма документа пополнения (документная форма, распределители)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { motion, AnimatePresence } from 'framer-motion';

import StationFull from '../../../assets/StationAnimation/StationFull.svg';

import TMC from '../../../assets/Station/TMC.svg';
import SGD from '../../../assets/Station/SGD.svg';
import OK from '../../../assets/Station/OK.svg';
import CHAIN from '../../../assets/Station/CHAIN.svg';

import IconW from '../../../assets/Schablon/IconW.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';
import StatusIcon108LightBlue from '../../../assets/Icons/StatusIcons/StatusIcon108LightBlue.svg';
import StatusIcon114Green from '../../../assets/Icons/StatusIcons/StatusIcon114Green.svg';
import InstallationIcon20Black from '../../../assets/Icons/InstallationIcons/InstallationIcon20Black.svg';
import ShapeIcon24Black from '../../../assets/Icons/ShapeIcons/ShapeIcon24Black.svg';
import InfoIcon18Blue from '../../../assets/Icons/InfoIcons/InfoIcon18Blue.svg';
import DescriptionIcon18Black from '../../../assets/Icons/DescriptionIcons/DescriptionIcon18Black.svg';
import CancelIcon16Black from '../../../assets/Icons/CancelIcons/CancelIcon16Black.svg';

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';
import CleanIcon26Black from '../../../assets/Icons/CleanIcons/CleanIcon26Black.svg';

import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

import RefillLinePopup from './RefillLinePopup';
import ClearPopup from '../Schablon/ClearPopup';
import DataTable from '../../elements/DataTable';
import FormField from '../../elements/FormField';
import HistoryTable from '../../elements/HistoryTable';

interface RefillCellSource {
  uid: string;
  stockFromUid: string;
  stockFromName: string | null;
  quantity: number | null;
  acceptedQuantity?: number | null;
  availableSnapshot?: number | null;
  transferUid?: string | null;
  transferCode?: number | null;
  transferLineUid?: string | null;
  transferStatus?: string | null;
  transferCancelled?: boolean | null;
}

interface RefillCell {
  uid: string;
  drumNumber?: number | null;
  columnNumber?: number | null;
  numberCell?: number | null;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeUid?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialCode?: number | null;
  materialGroupName?: string | null;
  materialMeasureName?: string | null;
  materialUsage?: boolean | null;
  materialTypeName?: string | null;
  materialPurposeName?: string | null;
  materialProductName?: string | null;
  materialManufacturerName?: string | null;
  materialCountryName?: string | null;
  materialBrandName?: string | null;
  materialModelName?: string | null;
  materialNameSnapshot?: string | null;
  materialArticleSnapshot?: string | null;
  materialCodeSnapshot?: number | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  refillQuantity?: number | null;
  acceptedQuantity?: number | null;
  minStockSnapshot?: number | null;
  criticalStockSnapshot?: number | null;
  stockControlExists?: boolean | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
  status?: string | null;
  cancelled?: boolean | null;
  closedAt?: string | null;
  sources?: RefillCellSource[];
}

interface DocRefill {
  uid: string;
  code: number | null;
  docDatetime: string;
  stationUid: string | null;
  stationName: string | null;
  templateUid: string | null;
  templateName: string | null;
  createdByUserId: number | null;
  createdByName: string | null;
  totalCells: number;
  cellsToLoad: number;
  totalQuantity: number;
  status: string;
  deadline?: string | null;
  comment?: string | null;
  closedAt?: string | null;
  cancelled?: boolean | null;
  cells: RefillCell[];
}

interface RefillEvent { uid: string; createdAt: string; author: string; eventDescription: string; }

const formatQty = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '—';
  return String(v);
};

const formatDateWithSeconds = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`;
  } catch { return dateStr; }
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  DRAFT: 'Записан',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменён',
};

// Лейблы состояния строки пополнения — как у строки заказа на перемещение.
// RECEIVED — legacy, новый поток REFILL его не порождает.
const LINE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Не взят в работу',
  TRANSFERRED: 'Передан в работу',
  IN_PROGRESS: 'Взят в работу',
  SHIPPED: 'Отгружено',
  RECEIVED: 'Принято', // legacy
  CLOSED: 'Загружено',
  CANCELLED: 'Отменено',
};

const COLOR_STATUS_CLOSED = '#00D664';
const COLOR_STATUS_LOADING_OR_SHIPPED = '#FE975B';
const COLOR_STATUS_TRANSFERRED = '#666EFE';
const COLOR_STATUS_IN_PROGRESS = '#666EFE';
const COLOR_STATUS_NOT_STARTED = '#2D4059';
const COLOR_STATUS_CANCELLED = '#FF3052';

// Как getOverallStatus в заказе на перемещение, но с «Передан в работу» между
// «Не взят» и «Взят». RECEIVED — legacy, AGREED нет вовсе.
const getRefillOverallStatus = (status: string | null | undefined, cancelled?: boolean | null): { label: string; color: string; ratio: number } => {
  if (cancelled) return { label: 'Отменено', color: COLOR_STATUS_CANCELLED, ratio: 0 };
  const s = String(status || '');
  if (s === 'CANCELLED') return { label: 'Отменено', color: COLOR_STATUS_CANCELLED, ratio: 0 };
  if (s === 'CLOSED') return { label: 'Загружено', color: COLOR_STATUS_CLOSED, ratio: 1 };
  if (s === 'RECEIVED') return { label: 'Принято', color: '#00A64F', ratio: 0.8 }; // legacy
  if (s === 'SHIPPED') return { label: 'Отгружено', color: COLOR_STATUS_LOADING_OR_SHIPPED, ratio: 0.6 };
  if (s === 'IN_PROGRESS') return { label: 'Взят в работу', color: COLOR_STATUS_IN_PROGRESS, ratio: 0.4 };
  if (s === 'TRANSFERRED') return { label: 'Передан в работу', color: COLOR_STATUS_TRANSFERRED, ratio: 0.2 };
  return { label: 'Не взят в работу', color: COLOR_STATUS_NOT_STARTED, ratio: 0.125 };
};

const POPUP_BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  zIndex: 9999,
};

const normalizeEditableCells = (list: RefillCell[]) =>
  [...list]
    .map(c => ({
      drumNumber: c.drumNumber ?? null,
      columnNumber: c.columnNumber ?? null,
      numberCell: c.numberCell ?? null,
      materialUid: c.materialUid ?? null,
      refillQuantity: c.refillQuantity ?? null,
      cancelled: c.cancelled ?? false,
      sources: (c.sources || []).map(s => ({
        stockFromUid: s.stockFromUid,
        quantity: s.quantity ?? 0,
      })).sort((a, b) => a.stockFromUid.localeCompare(b.stockFromUid)),
    }))
    .sort((a, b) => {
      const ak = `${a.drumNumber ?? 0}-${a.columnNumber ?? 0}-${a.numberCell ?? 0}`;
      const bk = `${b.drumNumber ?? 0}-${b.columnNumber ?? 0}-${b.numberCell ?? 0}`;
      return ak.localeCompare(bk);
    });

const isMeaningfulDraft = (cells: any): boolean => {
  if (!Array.isArray(cells) || cells.length === 0) return false;
  return cells.some((c: any) =>
    (Number(c.refillQuantity) || 0) > 0 ||
    (Array.isArray(c.sources) && c.sources.some((s: any) => (Number(s.quantity) || 0) > 0))
  );
};

const stripTransfers = (cells: RefillCell[]): RefillCell[] =>
  cells.map(c => ({
    ...c,
    sources: (c.sources || []).map(s => ({
      ...s,
      transferUid: null,
      transferCode: null,
      transferLineUid: null,
      transferStatus: null,
      transferCancelled: null,
    })),
  }));

interface DocumentRow {
  uid: string;
  numberCell: string;
  cellAssignmentName: string;
  materialName: string;
  materialArticle: string;
  stockFromNames: string;
  schemeQuantity: string;
  factQuantity: string;
  refillQuantity: string;
  overallStatusLabel: string;
  overallStatusColor: string;
  overallStatusRatio: number;
  cancelledLabel: string;
  transferLabel: string;
  _cell: RefillCell;
  _transferUid: string | null;
}

const DOC_COLUMNS = [
  { key: 'numberCell', label: 'Номер ячейки' },
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'stockFromNames', label: 'Склад-отправитель' },
  { key: 'schemeQuantity', label: 'По схеме' },
  { key: 'factQuantity', label: 'В ячейке' },
  { key: 'refillQuantity', label: 'К загрузке' },
  { key: 'overallStatusLabel', label: 'Состояние' },
  { key: 'cancelledLabel', label: 'Отменено' },
  { key: 'transferLabel', label: 'Перемещение' },
];

const RefillCreatePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stationUidParam = searchParams.get('stationUid') || '';
  const stationNameParam = searchParams.get('stationName') || '';
  const { tabs, activeTabId, closeTab, replaceTab, setTabLocked, openTab } = useTabs();

  const isEdit = !!uid && location.pathname.startsWith(`/documents/refill/edit/${uid}`);

  const draftKey = useMemo(() => {
    if (isEdit && uid) return `refill_localCells_${uid}`;
    if (stationUidParam) return `refill_localCells_new_${stationUidParam}`;
    return 'refill_localCells_new';
  }, [isEdit, uid, stationUidParam]);

  const [doc, setDoc] = useState<DocRefill | null>(null);
  const [savedCells, setSavedCells] = useState<RefillCell[]>([]);
  const [localCells, setLocalCells] = useState<RefillCell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingToWork, setIsTakingToWork] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [docSelectedIds, setDocSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
  const [shakeTick, setShakeTick] = useState(0);

  const [viewMode, setViewMode] = useState<'graphic' | 'document'>('document');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const [isTmc, setIsTmc] = useState(false);
  const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false);
  const [parentUid, setParentUid] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<'search' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({
    status: new Set(),
    cancelled: new Set(),
  });

  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<RefillEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClearPopupOpen, setIsClearPopupOpen] = useState(false);
  const [countersExpanded, setCountersExpanded] = useState(false);

  const [linePopupOpen, setLinePopupOpen] = useState(false);
  const [linePopupUid, setLinePopupUid] = useState<string | null>(null);

  const [commentPopupOpen, setCommentPopupOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const isDirty = useMemo(() => {
    return JSON.stringify(normalizeEditableCells(localCells)) !== JSON.stringify(normalizeEditableCells(savedCells));
  }, [localCells, savedCells]);

  useEffect(() => {
    if (!activeTabId) return;
    const hasInvalid = invalidCells.size > 0;
    setTabLocked(activeTabId, hasInvalid);
    return () => { setTabLocked(activeTabId, false); };
  }, [activeTabId, invalidCells, setTabLocked]);

  const handleCellValidationChange = useCallback((cellUid: string, hasError: boolean) => {
    setInvalidCells(prev => {
      const has = prev.has(cellUid);
      if (hasError && !has) { const n = new Set(prev); n.add(cellUid); return n; }
      if (!hasError && has) { const n = new Set(prev); n.delete(cellUid); return n; }
      return prev;
    });
  }, []);

  // ============ ЗАГРУЗКА ============
  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }

    if (!isEdit) {
      setIsLoading(true);
      (async () => {
        try {
          if (stationUidParam) {
            try {
              const snapRes = await AxiosService.get(ConstantInfo.restApiRefillSnapshot(stationUidParam));
              const snap = snapRes.data as DocRefill;
              setDoc(snap);
              const cells: RefillCell[] = (snap.cells || []).map(c => ({
                ...c,
                uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
                sources: c.sources || [],
              }));
              const savedSnapshot = cells.map(c => ({ ...c, refillQuantity: null, sources: [] }));
              setSavedCells(savedSnapshot);

              let hasDraft = false;
              try {
                const raw = sessionStorage.getItem(draftKey);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (isMeaningfulDraft(parsed)) {
                    hasDraft = true;
                    setLocalCells(stripTransfers(parsed as RefillCell[]));
                  } else {
                    try { sessionStorage.removeItem(draftKey); } catch {}
                  }
                }
              } catch {}
              if (!hasDraft) setLocalCells(savedSnapshot);
            } catch (e) { console.error('Ошибка загрузки снимка:', e); }

            try {
              const stationRes = await AxiosService.get(`/api/stations/static/${stationUidParam}`);
              const st = stationRes.data;
              setIsTmc(!!st?.isTmc);
              setIsSgd(!!st?.isSgd);
              setIsOk(!!st?.isOk);
              setParentUid(st?.parentUid || null);
            } catch (e) { console.error('Ошибка загрузки станции:', e); }
          }
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    setIsLoading(true);
    AxiosService.get(ConstantInfo.restApiRefill(uid))
      .then(r => {
        const d = r.data as DocRefill;
        setDoc(d);
        const cells: RefillCell[] = (d.cells || []).map(c => ({
          ...c,
          uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
          sources: c.sources || [],
        }));
        setSavedCells(cells);
        setCommentDraft(d.comment || '');

        let hasDraft = false;
        try {
          const raw = sessionStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (isMeaningfulDraft(parsed)) {
              hasDraft = true;
              const restored = parsed as RefillCell[];
              setLocalCells(d.status === 'DRAFT' ? stripTransfers(restored) : restored);
            } else {
              try { sessionStorage.removeItem(draftKey); } catch {}
            }
          }
        } catch {}
        if (!hasDraft) setLocalCells(cells);
      })
      .catch(e => console.error(e))
      .finally(() => setIsLoading(false));
  }, [uid, isEdit, stationUidParam, draftKey]);

  useEffect(() => {
    if (!doc?.stationUid) return;
    AxiosService.get(`/api/stations/static/${doc.stationUid}`)
      .then(res => {
        const st = res.data;
        setIsTmc(!!st?.isTmc);
        setIsSgd(!!st?.isSgd);
        setIsOk(!!st?.isOk);
        setParentUid(st?.parentUid || null);
      })
      .catch(e => console.error(e));
  }, [doc?.stationUid]);

  useEffect(() => {
    if (isLoading) return;
    if (localCells.length === 0) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(localCells)); } catch {}
  }, [localCells, draftKey, isLoading]);

  useEffect(() => {
    if (!showHistory || !doc?.uid || !isEdit) return;
    let cancelled = false;
    setHistoryLoading(true);
    AxiosService.get(ConstantInfo.restApiRefillEventsByUid(doc.uid))
      .then(res => { if (!cancelled) setHistoryEvents(res.data || []); })
      .catch(e => console.error(e))
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [showHistory, doc?.uid, isEdit]);

  const hasActiveFilter = filterValues.status.size > 0 || filterValues.cancelled.size > 0;

  const accountingLabel = useMemo(() => {
    const parts: string[] = [];
    if (isTmc) parts.push('ТМЦ');
    if (isSgd) parts.push('СГД');
    if (isOk) parts.push('ОК');
    return parts.length > 0 ? parts.join(' - ') : '';
  }, [isTmc, isSgd, isOk]);

  const filteredCells = useMemo(() => {
    if (!hasActiveFilter && !searchValue.trim()) return localCells;
    const q = searchValue.trim().toLowerCase();
    return localCells.filter(c => {
      if (q) {
        const m = (c.materialName || '').toLowerCase().includes(q) || (c.materialArticle || '').toLowerCase().includes(q);
        if (!m) return false;
      }
      if (filterValues.status.size > 0) {
        const s = String(c.status || 'NOT_STARTED');
        if (!filterValues.status.has(s)) return false;
      }
      if (filterValues.cancelled.size > 0) {
        const isC = !!c.cancelled;
        const wantYes = filterValues.cancelled.has('yes');
        const wantNo = filterValues.cancelled.has('no');
        if (!(wantYes && isC) && !(wantNo && !isC)) return false;
      }
      return true;
    });
  }, [localCells, searchValue, filterValues, hasActiveFilter]);

  const transfersVisible = !!doc && doc.status !== 'DRAFT' && !(doc.code == null && !isEdit);

  const documentRows: DocumentRow[] = useMemo(() => {
    return filteredCells.map(c => {
      const sourceNames = (c.sources || []).map(s => s.stockFromName || s.stockFromUid).filter(Boolean).join(', ');
      const sourceWithTransfer = transfersVisible
        ? (c.sources || []).find(s => s.transferUid != null || s.transferStatus != null || s.transferCancelled != null)
        : undefined;
      const transferCode = sourceWithTransfer?.transferCode ?? null;
      const transferUid = sourceWithTransfer?.transferUid ?? null;
      // Состояние строки на бэке (reg_refill_cells.status) — как overallStatus в заказе
      const overall = getRefillOverallStatus(c.status, c.cancelled);
      return {
        uid: c.uid,
        numberCell: `${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
        cellAssignmentName: c.cellAssignmentName || '—',
        materialName: c.materialName || c.materialNameSnapshot || '—',
        materialArticle: c.materialArticle || c.materialArticleSnapshot || '—',
        stockFromNames: sourceNames || '—',
        schemeQuantity: formatQty(c.templateQuantity),
        factQuantity: formatQty(c.factQuantity),
        refillQuantity: formatQty(c.refillQuantity),
        overallStatusLabel: overall.label,
        overallStatusColor: overall.color,
        overallStatusRatio: overall.ratio,
        cancelledLabel: c.cancelled ? 'Да' : 'Нет',
        transferLabel: transferCode != null ? `№${String(transferCode).padStart(4, '0')}` : '—',
        _cell: c,
        _transferUid: transferUid,
      };
    });
  }, [filteredCells, transfersVisible]);

  const docVisibleColumns = DOC_COLUMNS.map(c => c.key);

  const documentRenderCell = (key: string, item: DocumentRow): string => {
    const val = (item as any)[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const documentRenderCellNode = (key: string, item: DocumentRow): React.ReactNode | null => {
    if (key === 'overallStatusLabel') {
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              width: '100%',
              height: 12,
              borderRadius: 999,
              backgroundColor: 'rgba(45, 64, 89, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${item.overallStatusRatio * 100}%`,
                height: '100%',
                borderRadius: 999,
                backgroundColor: item.overallStatusColor,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <span style={{ color: item.overallStatusColor, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500 }}>
            {item.overallStatusLabel}
          </span>
        </div>
      );
    }
    if (key === 'transferLabel' && item._transferUid) {
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            openTab(
              `/documents/transfers/edit/${item._transferUid}`,
              `Перемещение: ${item.transferLabel.replace('№', '')}`,
              null
            );
          }}
          style={{
            color: '#666EFE',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
          }}
        >
          {item.transferLabel}
        </span>
      );
    }
    return null;
  };

  const selectedCellsCount = useMemo(
    () => localCells.filter(c => (Number(c.refillQuantity) || 0) > 0).length,
    [localCells]
  );
  const positionsCount = useMemo(
    () => localCells.reduce((s, c) => s + (Number(c.refillQuantity) || 0), 0),
    [localCells]
  );
  const cellsToLoadCount = selectedCellsCount;
  const cellsToLoadPercent = localCells.length > 0
    ? Math.round((cellsToLoadCount / localCells.length) * 100) : 0;

  const clearDraft = useCallback(() => {
    try { sessionStorage.removeItem(draftKey); } catch {}
  }, [draftKey]);

  const buildCellsPayload = useCallback(() => localCells.map(c => ({
    drumNumber: c.drumNumber,
    columnNumber: c.columnNumber,
    numberCell: c.numberCell,
    cellAssignmentUid: c.cellAssignmentUid ?? null,
    materialUid: c.materialUid ?? null,
    templateQuantity: c.templateQuantity ?? null,
    factQuantity: c.factQuantity ?? null,
    refillQuantity: c.refillQuantity != null ? Number(c.refillQuantity) : null,
    minStockSnapshot: c.minStockSnapshot ?? null,
    criticalStockSnapshot: c.criticalStockSnapshot ?? null,
    stockControlExists: c.stockControlExists ?? false,
    returnToThisCell: c.returnToThisCell ?? false,
    isIndividual: c.isIndividual ?? false,
    cancelled: c.cancelled ?? false,
    sources: (c.sources || []).map(s => ({
      stockFromUid: s.stockFromUid,
      quantity: s.quantity ?? 0,
    })),
  })), [localCells]);

  const getRowsWithoutSources = useCallback(() => {
    return localCells.filter(c =>
      !c.cancelled &&
      (Number(c.refillQuantity) || 0) > 0 &&
      (!c.sources || c.sources.length === 0)
    );
  }, [localCells]);

  const handleSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    if (!uid) return false;
    if (invalidCells.size > 0) { setShakeTick(t => t + 1); return false; }

    const rowsWithoutSources = getRowsWithoutSources();
    if (rowsWithoutSources.length > 0) {
      alert('Заполните распределение по складам-отправителям для всех строк с количеством');
      return false;
    }

    setIsSaving(true);
    try {
      const cells = buildCellsPayload();

      if (!isEdit) {
        const payload = {
          uid,
          stationUid: stationUidParam || null,
          templateUid: doc?.templateUid || null,
          createdByUserId: 1,
          status: 'DRAFT',
          comment: doc?.comment ?? null,
          deadline: doc?.deadline ?? null,
          cells,
        };
        const res = await AxiosService.post(ConstantInfo.restApiRefillCrud(1), payload);
        const d = res.data as DocRefill;
        setDoc(d);
        const fresh = stripTransfers((d.cells || []).map(c => ({ ...c, uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`, sources: c.sources || [] })));
        setSavedCells(fresh); setLocalCells(fresh);
        clearDraft(); setEditMode(false);
        if (activeTabId && d.uid && d.code != null) {
          replaceTab(activeTabId, `/documents/refill/edit/${d.uid}`, `Пополнение: ${String(d.code).padStart(4, '0')}`, <RefillCreatePage />);
        }
        return true;
      }

      const res = await AxiosService.patch(ConstantInfo.restApiRefill(uid), {
        status: doc?.status,
        comment: doc?.comment ?? null,
        deadline: doc?.deadline ?? null,
        cells,
      });
      const d = res.data as DocRefill;
      setDoc(d);
      const fresh = stripTransfers((d.cells || []).map(c => ({ ...c, uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`, sources: c.sources || [] })));
      setSavedCells(fresh); setLocalCells(fresh);
      clearDraft(); setEditMode(false);
      return true;
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleTakeToWork = async () => {
    if (!doc?.uid || isTakingToWork) return;
    if (isDirty) { alert('Сначала сохраните изменения'); return; }
    if (invalidCells.size > 0) { setShakeTick(t => t + 1); return; }

    const rowsWithoutSources = getRowsWithoutSources();
    if (rowsWithoutSources.length > 0) {
      alert('Нельзя передать в работу: у строк не заполнены склады-отправители');
      return;
    }

    setIsTakingToWork(true);
    try {
      const res = await AxiosService.post(ConstantInfo.restApiRefillTakeToWork(doc.uid));
      const d = res.data as DocRefill;
      setDoc(d);
      const fresh = (d.cells || []).map(c => ({ ...c, uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`, sources: c.sources || [] }));
      setSavedCells(fresh); setLocalCells(fresh); clearDraft(); setEditMode(false);
    } catch (e: any) {
      console.error(e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsTakingToWork(false);
    }
  };

  const handleCancel = async () => {
    if (!doc?.uid || isCancelling) return;
    setIsCancelling(true);
    try {
      const res = await AxiosService.post(ConstantInfo.restApiRefillCancel(doc.uid));
      const d = res.data as DocRefill;
      setDoc(d);
      const fresh = (d.cells || []).map(c => ({ ...c, uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`, sources: c.sources || [] }));
      setSavedCells(fresh); setLocalCells(fresh); clearDraft(); setEditMode(false);
    } catch (e: any) {
      console.error(e);
      alert('Ошибка: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (invalidCells.size > 0) { setShakeTick(t => t + 1); return; }
    if (isDirty) { setShowCloseConfirm(true); return; }
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) closeTab(currentTab.id);
  };

  const handleCloseWithoutSaving = () => {
    setShowCloseConfirm(false);
    clearDraft();
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) closeTab(currentTab.id);
  };

  const handleToggleViewMode = () => {
    setSlideDirection(viewMode === 'document' ? 'right' : 'left');
    if (viewMode === 'document') setShowHistory(false);
    setViewMode(prev => prev === 'document' ? 'graphic' : 'document');
  };

  const handleToggleHistory = () => {
    setShowHistory(v => !v);
  };

  const handleCheckOption = (filterKey: string, optionUid: string) => {
    setFilterValues(prev => {
      const next = { ...prev, [filterKey]: new Set(prev[filterKey]) };
      if (next[filterKey].has(optionUid)) next[filterKey].delete(optionUid);
      else next[filterKey].add(optionUid);
      return next;
    });
  };

  const isOptionChecked = (key: string, u: string): boolean => filterValues[key]?.has(u) ?? false;

  const clearFilters = () => {
    setFilterValues({ status: new Set(), cancelled: new Set() });
    setSubmenuOpen(null);
  };

  const handleClearAll = () => {
    setLocalCells(prev => prev.map(c => ({ ...c, refillQuantity: null, sources: [] })));
    setDocSelectedIds(new Set());
    setIsClearPopupOpen(false);
  };

  const handleClearSelected = () => {
    setLocalCells(prev => prev.map(c => docSelectedIds.has(c.uid) ? { ...c, refillQuantity: null, sources: [] } : c));
    setDocSelectedIds(new Set());
    setIsClearPopupOpen(false);
  };

  const handleDocCheckboxClick = (u: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocSelectedIds(prev => { const n = new Set(prev); n.has(u) ? n.delete(u) : n.add(u); return n; });
  };

  const handleDocSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const all = documentRows.length > 0 && documentRows.every(r => docSelectedIds.has(r.uid));
    setDocSelectedIds(all ? new Set() : new Set(documentRows.map(r => r.uid)));
  };

  const handleDocRowClick = (u: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocSelectedIds(prev => { const n = new Set(prev); n.has(u) ? n.delete(u) : n.add(u); return n; });
  };

  const handleDocumentRowDoubleClick = (rowUid: string) => {
    const cell = localCells.find(c => c.uid === rowUid);
    if (!cell) return;
    setLinePopupUid(rowUid);
    setLinePopupOpen(true);
  };

  const handleLinePopupSave = (patch: Partial<RefillCell>) => {
    if (!linePopupUid) return;
    setLocalCells(prev => prev.map(c => c.uid === linePopupUid ? { ...c, ...patch } : c));
    setLinePopupOpen(false);
    setLinePopupUid(null);
  };

  if (isLoading) return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
    </div>
  );

  if (isEdit && !doc) return <div style={{ padding: 60 }}>Загрузка...</div>;

  const docStatus = doc?.status || 'DRAFT';
  const docCode = doc?.code ?? null;
  const docDatetime = doc?.docDatetime ?? '';
  const docStationName = doc?.stationName || stationNameParam || '';
  const docTemplateName = doc?.templateName || '';

  const isDraft = docStatus === 'DRAFT';
  const isInProgress = docStatus === 'IN_PROGRESS';
  const isClosed = docStatus === 'CLOSED';
  const isCancelled = docStatus === 'CANCELLED';

  const isNewDoc = !isEdit && docCode == null;
  const isSavedOnce = !isNewDoc;
  const isEditable = isDraft && (editMode || isNewDoc);

  const showDirty = isDirty && isSavedOnce;

  const displayStatus = isNewDoc ? 'NEW' : docStatus;

  const statusIcon = isNewDoc
    ? StatusIcon104Blue
    : (isClosed ? StatusIcon114Green
    : (isCancelled ? StatusIcon93Red
    : (isInProgress ? StatusIcon108LightBlue
    : (showDirty ? StatusIcon107Orange : StatusIcon104Blue))));
  const statusWidth = isNewDoc
    ? 104
    : (isClosed ? 114
    : (isCancelled ? 93
    : (isInProgress ? 108
    : (showDirty ? 107 : 104))));

  const statusTextColor = isNewDoc
    ? '#666EFE'
    : (isCancelled ? '#FF3052'
    : (isClosed ? '#00D664'
    : (showDirty ? '#FE975B' : '#666EFE')));

  const titleText = isSavedOnce
    ? `Документ: Пополнение станции (${docStationName}) N${String(docCode || 0).padStart(4, '0')} от ${formatDateWithSeconds(docDatetime)}`
    : `Документ: Пополнение станции (${docStationName})`;

  const bottomButtonStyle: React.CSSProperties = { height: '50px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700 };

  const hasFilledRefill = selectedCellsCount > 0;
  const canSave = isDraft && !isSaving && hasFilledRefill && isDirty && invalidCells.size === 0;
  const canTakeToWork = isDraft && !isNewDoc && !isDirty && hasFilledRefill && invalidCells.size === 0 && !isTakingToWork;
  const canCancel = isDraft && !isNewDoc && !isDirty && !isCancelling;
  const canEdit = isDraft && !isNewDoc && !editMode;

  const BTN_SIZE = 54;
  const BTN_GAP = 20;
  const SIDE_OFFSET = 25;
  const BLOCK_TOP = 106;
  const TABLE_TOP_GAP = 10;
  const TABLE_LEFT = 40;
  const TABLE_WIDTH = 1720;

  const BTN_HEADER = 40;
  const BTN_CLEAR = 44;
  const TOP_PAD = 20;
  const BOTTOM_PAD = 20;
  const TEXT_HEIGHT = 18;
  const ITEM_GAP = 20;
  const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
  const LEFT_OFFSET = 30;
  const SUBMENU_WIDTH = 300;
  const SUBMENU_OFFSET = 3;
  const INDICATOR_LEFT = 15;
  const INDICATOR_WIDTH = 2;
  const INDICATOR_HEIGHT = 22;
  const SUBMENU_LEFT_PAD = 30;
  const SUBMENU_CHECKBOX_WIDTH = 20;
  const SUBMENU_RIGHT_PAD = 20;

  const DOC_BTN_SIZE = 40;
  const DOC_BTN_GAP = 15;
  const DOC_SEARCH_EXPANDED = 280;
  const DOC_FILTER_EXPANDED = 260;
  const DOC_TWEEN = { type: 'tween' as const, duration: 0.2 };

  const SEARCH_EXPANDED = 360;
  const FILTER_EXPANDED = 260;
  const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
  const TWEEN = { type: 'tween' as const, duration: 0.2 };

  const searchWidth = expanded === 'search' ? SEARCH_EXPANDED : BTN_SIZE;
  const filterWidth = expanded === 'filter' ? FILTER_EXPANDED : BTN_SIZE;

  const btnSearchLeft = TABLE_LEFT + SIDE_OFFSET;
  const btnFilterLeft = btnSearchLeft + searchWidth + BTN_GAP;
  const btnClearLeft = btnFilterLeft + filterWidth + BTN_GAP;

  const TOP_BTN_SIZE = 56;
  const TOP_BTN_GAP = 20;
  const TOP_BTNS_RIGHT_OFFSET = 25;
  const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;
  const btnDownloadLeft = TABLE_RIGHT - TOP_BTNS_RIGHT_OFFSET - TOP_BTN_SIZE;
  const btnPrintLeft = btnDownloadLeft - TOP_BTN_GAP - TOP_BTN_SIZE;

  const tableTop = BLOCK_TOP + BTN_SIZE + TABLE_TOP_GAP;

  const FILTER_FIELDS: { key: string; label: string }[] = [
    { key: 'status', label: 'Состояние' },
    { key: 'cancelled', label: 'Отменено' },
  ];

  const STATUS_FILTER_OPTIONS = [
    { uid: 'NOT_STARTED', name: 'Не взят в работу' },
    { uid: 'TRANSFERRED', name: 'Передан в работу' },
    { uid: 'IN_PROGRESS', name: 'Взят в работу' },
    { uid: 'SHIPPED', name: 'Отгружено' },
    { uid: 'RECEIVED', name: 'Принято' },
    { uid: 'CLOSED', name: 'Загружено' },
    { uid: 'CANCELLED', name: 'Отменено' },
  ];

  const CANCELLED_OPTIONS = [
    { uid: 'yes', name: 'Строка отменена' },
    { uid: 'no', name: 'Строка не отменена' },
  ];

  const getSubmenuOptions = (key: string): { uid: string; name: string }[] => {
    if (key === 'status') return STATUS_FILTER_OPTIONS;
    if (key === 'cancelled') return CANCELLED_OPTIONS;
    return [];
  };

  const filterListHeight = TOP_PAD + FILTER_FIELDS.length * TEXT_HEIGHT + (FILTER_FIELDS.length - 1) * ITEM_GAP + BOTTOM_PAD;

  const getSubmenuHeight = (key: string): number => {
    const opts = getSubmenuOptions(key);
    if (opts.length === 0) return TOP_PAD + TEXT_HEIGHT + BOTTOM_PAD;
    const h = TOP_PAD + opts.length * TEXT_HEIGHT + (opts.length - 1) * ITEM_GAP + BOTTOM_PAD;
    return Math.min(h, 400);
  };

  const getSubmenuTop = (key: string): number => {
    const idx = FILTER_FIELDS.findIndex(f => f.key === key);
    return idx * ROW_STEP;
  };

  const getFilterMenuIndicatorTop = (key: string): number => {
    const idx = FILTER_FIELDS.findIndex(f => f.key === key);
    return TOP_PAD + idx * ROW_STEP + (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2;
  };

  const docBtnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const docSearchWidth = expanded === 'search' ? DOC_SEARCH_EXPANDED : DOC_BTN_SIZE;
  const docFilterWidth = expanded === 'filter' ? DOC_FILTER_EXPANDED : DOC_BTN_SIZE;

  const DOC_TABLE_FULL_W = 1720;
  const DOC_TABLE_TOP = 100 + 142 + 30 + 40 + 12;
  const DOC_TABLE_HEIGHT = 418;

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({ x: direction === 'left' ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'left' | 'right') => ({ x: direction === 'left' ? -200 : 200, opacity: 0 }),
  };

  const SECTION_1_TOP = 14 + 18 + 24;
  const SECTION_1_VALUE_TOP = SECTION_1_TOP - 4;
  const SECTION_2_TOP = SECTION_1_TOP + 17 + 22;
  const SECTION_2_BAR_TOP = SECTION_2_TOP + 6;
  const SECTION_2_PERCENT_TOP = SECTION_2_TOP - 4;
  const SECTION_3_TOP = SECTION_2_TOP + 43;
  const SECTION_4_TOP = SECTION_3_TOP + 17 + 16;

  const linePopupCell = linePopupUid ? localCells.find(c => c.uid === linePopupUid) : null;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, display: 'flex', alignItems: 'center', gap: 25, zIndex: 2 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{titleText}</h1>
        <img src={statusIcon} alt="" style={{ width: statusWidth, height: 29, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: statusTextColor }}>
          {STATUS_LABELS[displayStatus] || displayStatus}
        </span>
      </div>

      <button
        onClick={canEdit ? () => setEditMode(true) : undefined}
        disabled={!canEdit}
        style={{
          position: 'absolute', top: 28, right: 40, width: 191, height: 44, borderRadius: 10, border: 'none',
          backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', paddingLeft: 17, paddingRight: 17, boxSizing: 'border-box', gap: 17,
          cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.35, pointerEvents: canEdit ? 'auto' : 'none', zIndex: 5,
        }}
        title="Редактировать"
      >
        <img src={DescriptionIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px' }}>Редактировать</span>
      </button>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={viewMode}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {viewMode === 'document' && (
              <>
                <div style={{ position: 'absolute', top: 100, left: 40, width: 1720, height: 142, backgroundColor: '#FFFFFF', borderRadius: 15 }}>
                  <div style={{ position: 'absolute', top: 30, left: 40 }}>
                    <FormField width={340} height={44} label="Код:" value={docCode != null ? String(docCode).padStart(4, '0') : ''} type="input" disabled icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + 340 + 50 }}>
                    <FormField width={340} height={44} label="Наименование шаблона:" value={docTemplateName || ''} type="input" disabled icon={NameIcon18Gray} iconActive={NameIcon18Blue} iconWidth={18} iconHeight={18} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + (340 + 50) * 2 }}>
                    <FormField width={340} height={44} label="Станция:" value={docStationName || ''} type="input" disabled icon={StationIcon16Gray} iconActive={StationIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + (340 + 50) * 3 }}>
                    <FormField width={340} height={44} label="Вид учёта станции:" value={accountingLabel} type="input" disabled icon={AccountingIcon16Gray} iconActive={AccountingIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, right: 180, width: 340 }}>
                    <FormField
                      width={340} height={44} label="Комментарий:"
                      value={doc?.comment || ''}
                      type="comment"
                      disabled={!isEditable}
                      icon={doc?.comment ? DescriptionIcon16Blue : DescriptionIcon16Gray}
                      iconWidth={18} iconHeight={18}
                      labelMarginBottom={11}
                      onClick={() => setCommentPopupOpen(true)}
                    />
                  </div>
                  <div style={{ position: 'absolute', top: 10, right: 40, width: 80, height: 122, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={StationFull} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }} />
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 100 + 142 + 30, left: 40, width: 1720, height: 40 }}>
                  <div style={{ position: 'absolute', left: 15, top: 0, display: 'flex', gap: 15 }}>
                    <motion.div style={{ position: 'relative', height: 40, borderRadius: 10, backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF', border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden', zIndex: expanded === 'search' ? 20 : 5 }} animate={{ width: docSearchWidth }} transition={DOC_TWEEN}>
                      <div onClick={() => { if (expanded === 'search') { setExpanded(null); setSearchValue(''); } else { setExpanded('search'); setSubmenuOpen(null); } }}
                        style={{ width: DOC_BTN_SIZE, height: DOC_BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                        <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
                      </div>
                      <AnimatePresence>
                        {expanded === 'search' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}>
                            <input type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск"
                              style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div style={{ position: 'relative', borderRadius: 10, backgroundColor: '#FFFFFF', border: expanded === 'filter' || hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', overflow: 'visible', zIndex: expanded === 'filter' ? 25 : 5 }} animate={{ width: docFilterWidth, height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : 40 }} transition={DOC_TWEEN}>
                      <div onClick={() => { if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); } else { setExpanded('filter'); setSearchValue(''); } }}
                        style={{ height: expanded === 'filter' ? BTN_HEADER : 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent', borderRadius: expanded === 'filter' ? '10px 10px 0 0' : 10, transition: 'height 0.2s ease' }}>
                        {expanded === 'filter'
                          ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                          : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="" style={{ width: 18, height: 18, display: 'block' }} />
                        }
                      </div>

                      <AnimatePresence>
                        {expanded === 'filter' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                            style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}>
                            {FILTER_FIELDS.map(field => {
                              if (filterValues[field.key].size === 0) return null;
                              return (
                                <motion.div key={`ind-doc-${field.key}`} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }}
                                  style={{ position: 'absolute', left: INDICATOR_LEFT, top: getFilterMenuIndicatorTop(field.key), width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />
                              );
                            })}
                            <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                              {FILTER_FIELDS.map((field, fieldIdx) => {
                                const isActive = filterValues[field.key].size > 0;
                                return (
                                  <div key={field.key} onMouseDown={e => e.preventDefault()} onClick={() => setSubmenuOpen(prev => prev === field.key ? null : field.key)}
                                    style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: fieldIdx < FILTER_FIELDS.length - 1 ? ITEM_GAP : 0, paddingLeft: LEFT_OFFSET, position: 'relative' }}>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{field.label}</span>
                                    <div style={{ position: 'absolute', right: 20, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <img src={isActive ? ArrowIcon6Blue : ArrowIcon6Black} alt="" style={{ width: 6, height: 10 }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <AnimatePresence>
                              {submenuOpen && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                                  style={{ position: 'absolute', left: docFilterWidth + SUBMENU_OFFSET, top: getSubmenuTop(submenuOpen), width: SUBMENU_WIDTH, height: getSubmenuHeight(submenuOpen), backgroundColor: '#FFFFFF', borderRadius: '0 15px 15px 15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 30, overflow: 'hidden' }}>
                                  <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 400 }}>
                                    {getSubmenuOptions(submenuOpen).map((option, i, arr) => {
                                      const checked = isOptionChecked(submenuOpen, option.uid);
                                      return (
                                        <div key={option.uid} onMouseDown={e => e.preventDefault()} onClick={() => handleCheckOption(submenuOpen, option.uid)}
                                          style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: i < arr.length - 1 ? ITEM_GAP : 0, paddingLeft: SUBMENU_LEFT_PAD, position: 'relative' }}>
                                          {checked && <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }}
                                            style={{ position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none' }} />}
                                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`, maxWidth: SUBMENU_WIDTH - SUBMENU_LEFT_PAD - 20 - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.name}</span>
                                          <div style={{ position: 'absolute', right: SUBMENU_RIGHT_PAD, width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }}>
                                            <img src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack} alt="" style={{ width: SUBMENU_CHECKBOX_WIDTH, height: SUBMENU_CHECKBOX_WIDTH }} />
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
                        {expanded === 'filter' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}>
                            <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                            <button onMouseDown={e => e.preventDefault()} onClick={clearFilters}
                              style={{ width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px', borderRadius: '0 0 10px 10px' }}>
                              Очистить фильтр
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.button
                      onClick={() => { if (docSelectedIds.size > 0) setIsClearPopupOpen(true); }}
                      disabled={docSelectedIds.size < 1}
                      style={{ position: 'relative', width: DOC_BTN_SIZE, height: DOC_BTN_SIZE, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: docSelectedIds.size > 0 ? 'pointer' : 'not-allowed', opacity: docSelectedIds.size > 0 ? 1 : 0.4, pointerEvents: docSelectedIds.size > 0 ? 'auto' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                    >
                      <img src={CleanIcon26Black} alt="Очистка" style={{ width: 20, height: 18 }} />
                    </motion.button>
                  </div>

                  <div style={{ position: 'absolute', right: 15, top: 0, display: 'flex', gap: 15, height: 40 }}>
                    <button style={docBtnStyle} title="Скачать"><img src={DownloadIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
                    <button style={docBtnStyle} title="Печать"><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
                    <button style={{ ...docBtnStyle, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF', border: showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)' }} onClick={handleToggleHistory}>
                      <img src={showHistory ? HistoryIcon18White : HistoryIcon18Black} alt="" style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!showHistory ? (
                    <motion.div key="doc-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: DOC_TABLE_TOP, left: 40, width: DOC_TABLE_FULL_W, height: DOC_TABLE_HEIGHT, overflow: 'hidden' }}>
                      <DataTable
                        columns={DOC_COLUMNS}
                        visibleKeys={docVisibleColumns}
                        data={documentRows}
                        selectedIds={docSelectedIds}
                        onCheckboxClick={handleDocCheckboxClick}
                        onSelectAll={handleDocSelectAll}
                        onRowClick={handleDocRowClick}
                        onDoubleClick={handleDocumentRowDoubleClick}
                        renderCell={documentRenderCell}
                        renderCellNode={documentRenderCellNode}
                        isGrayColumn={(key) => key !== 'numberCell' && key !== 'materialName'}
                        tableWidth={DOC_TABLE_FULL_W}
                        rowHeight={58}
                        headerHeight={58}
                        visibleRows={6}
                        fitToWidth
                        highlightText={searchValue.trim() || undefined}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="doc-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: DOC_TABLE_TOP, left: 40, width: DOC_TABLE_FULL_W, height: DOC_TABLE_HEIGHT, overflow: 'hidden' }}>
                      <HistoryTable
                        events={historyEvents}
                        isLoading={historyLoading}
                        tableWidth={DOC_TABLE_FULL_W}
                        rowHeight={58}
                        headerHeight={58}
                        visibleRows={6}
                        scrollOffset={15}
                        headerColor="#666EFE"
                        borderColor="#E5ECF5"
                        dateLabel="Дата и время"
                        authorLabel="Автор"
                        eventLabel="Событие"
                        searchValue={searchValue}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {viewMode === 'graphic' && (
              <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#5A607F' }}>
                Интерактивная форма недоступна для документа пополнения с распределителями. Работаем в документной форме.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 40, right: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: 507 }}>
          <motion.div
            onClick={() => setCountersExpanded(v => !v)}
            animate={{ height: countersExpanded ? 251 : 60 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 15, boxShadow: countersExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
          >
            <AnimatePresence>
              {countersExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 60 }}>
                  <img src={InfoIcon18Blue} alt="" style={{ position: 'absolute', top: 14, left: 14, width: 18, height: 18 }} />
                  <div style={{ position: 'absolute', top: 14, left: 42, height: 18, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE', lineHeight: '18px' }}>Информация</div>
                  <div style={{ position: 'absolute', top: SECTION_1_TOP, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>Всего ячеек в документе</div>
                  <div style={{ position: 'absolute', top: SECTION_1_VALUE_TOP, left: 30 + 176 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>{localCells.length}</div>
                  <div style={{ position: 'absolute', top: SECTION_2_TOP, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>Ячеек к загрузке</div>
                  <div style={{ position: 'absolute', top: SECTION_2_BAR_TOP, left: 30 + 128 + 42, width: 211, height: 4, borderRadius: 2, backgroundColor: 'rgba(232, 233, 255, 0.8)' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, cellsToLoadPercent))}%`, height: '100%', borderRadius: 2, backgroundColor: '#666EFE' }} />
                  </div>
                  <div style={{ position: 'absolute', top: SECTION_2_BAR_TOP + 4 + 2, left: 30 + 128 + 42 + 105, transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.5)' }}>{cellsToLoadCount}</div>
                  <div style={{ position: 'absolute', top: SECTION_2_PERCENT_TOP, left: 30 + 128 + 42 + 211 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>{cellsToLoadPercent}%</div>
                  <div style={{ position: 'absolute', top: SECTION_3_TOP, left: 0, right: 0, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>Количество загружаемой номенклатуры по выбранным ячейкам</div>
                  <div style={{ position: 'absolute', top: SECTION_4_TOP, left: '50%', transform: 'translateX(-50%)', width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(102, 110, 254, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#FFFFFF', lineHeight: '16px' }}>{positionsCount}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!countersExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 25, paddingRight: 25 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px' }}>Выбрано ячеек к загрузке</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px', marginTop: 2 }}>{selectedCellsCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px' }}>Количество позиций к загрузке</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px', marginTop: 2 }}>{positionsCount}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 30 }}>
          {isDraft && (
            <button onClick={canTakeToWork ? handleTakeToWork : undefined} disabled={!canTakeToWork} style={{ ...bottomButtonStyle, width: 200, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canTakeToWork ? 1 : 0.35, cursor: canTakeToWork ? 'pointer' : 'not-allowed' }}>
              <img src={InstallationIcon20Black} alt="" style={{ width: 20, height: 11, flexShrink: 0 }} />
              <span style={{ marginLeft: '15px' }}>{isTakingToWork ? 'Передача...' : 'Передать в работу'}</span>
            </button>
          )}

          {isDraft && !isNewDoc && (
            <button onClick={canCancel ? handleCancel : undefined} disabled={!canCancel} style={{ ...bottomButtonStyle, width: 160, backgroundColor: '#FFFFFF', color: '#FF3052', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canCancel ? 1 : 0.35, cursor: canCancel ? 'pointer' : 'not-allowed' }}>
              <img src={CancelIcon16Black} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ marginLeft: '15px' }}>{isCancelling ? 'Отмена...' : 'Отменить'}</span>
            </button>
          )}

          <button onClick={handleToggleViewMode} style={{ ...bottomButtonStyle, width: viewMode === 'document' ? 254 : 222, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', justifyContent: 'flex-start', paddingLeft: 19, transition: 'width 0.2s ease', overflow: 'hidden' }}>
            <img src={ShapeIcon24Black} alt="" style={{ width: 24, height: 20, flexShrink: 0 }} />
            <span style={{ marginLeft: 17, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {viewMode === 'document' ? 'Интерактивная форма' : 'Форма документа'}
            </span>
          </button>

          <button onClick={canSave ? handleSave : undefined} disabled={!canSave} style={{ ...bottomButtonStyle, width: 153, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canSave ? 1 : 0.35, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
          </button>

          <button onClick={handleClose} style={{ ...bottomButtonStyle, width: 116, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>Закрыть</button>
        </div>
      </div>

      {isClearPopupOpen && (
        <>
          <div style={POPUP_BACKDROP_STYLE} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 10000 }}>
            <ClearPopup
              isOpen={isClearPopupOpen}
              onClose={() => setIsClearPopupOpen(false)}
              onClearAll={handleClearAll}
              onClearSelected={handleClearSelected}
              hasSelection={docSelectedIds.size > 0}
              templateName={docTemplateName}
            />
          </div>
        </>
      )}

      {linePopupOpen && linePopupCell && (
        <RefillLinePopup
          isOpen={linePopupOpen}
          onClose={() => { setLinePopupOpen(false); setLinePopupUid(null); }}
          cell={linePopupCell}
          stationUid={doc?.stationUid || stationUidParam}
          stationName={doc?.stationName || stationNameParam}
          onSave={handleLinePopupSave}
          readOnly={!isEditable}
        />
      )}

      {showCloseConfirm && (
        <>
          <div style={POPUP_BACKDROP_STYLE} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCloseConfirm(false)}>
            <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Есть несохранённые изменения. Что сделать?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={async () => { const ok = await handleSave(); if (ok) handleCloseWithoutSaving(); }} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>
                <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
                <button onClick={() => setShowCloseConfirm(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              </div>
            </div>
          </div>
        </>
      )}

      {commentPopupOpen && (
        <>
          <div style={POPUP_BACKDROP_STYLE} onClick={() => setCommentPopupOpen(false)} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCommentPopupOpen(false)}>
            <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Комментарий к пополнению</h3>
              <textarea value={commentDraft} onChange={e => setCommentDraft(e.target.value)} rows={5}
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                placeholder="Введите комментарий..." />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setCommentPopupOpen(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
                <button onClick={() => { setCommentDraft(commentDraft); setDoc(prev => prev ? { ...prev, comment: commentDraft } : prev); setCommentPopupOpen(false); }} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RefillCreatePage;