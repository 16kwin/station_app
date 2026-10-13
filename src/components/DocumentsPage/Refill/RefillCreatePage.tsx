// RefillCreatePage.tsx — форма документа пополнения (savedCells/localCells, isDirty только по refillQuantity, обновление снимковых полей при перезагрузке)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { motion, AnimatePresence } from 'framer-motion';

import StationFull from '../../../assets/StationAnimation/StationFull.svg';

import frame1 from '../../../assets/StationAnimation/01.png';
import frame2 from '../../../assets/StationAnimation/02.png';
import frame3 from '../../../assets/StationAnimation/03.png';
import frame4 from '../../../assets/StationAnimation/04.png';
import frame5 from '../../../assets/StationAnimation/05.png';
import frame6 from '../../../assets/StationAnimation/06.png';
import frame7 from '../../../assets/StationAnimation/07.png';
import frame8 from '../../../assets/StationAnimation/08.png';
import frame9 from '../../../assets/StationAnimation/09.png';
import frame10 from '../../../assets/StationAnimation/10.png';
import frame11 from '../../../assets/StationAnimation/11.png';
import frame12 from '../../../assets/StationAnimation/12.png';
import frame13 from '../../../assets/StationAnimation/13.png';
import frame14 from '../../../assets/StationAnimation/14.png';
import frame15 from '../../../assets/StationAnimation/15.png';
import frame16 from '../../../assets/StationAnimation/16.png';
import frame17 from '../../../assets/StationAnimation/17.png';
import frame18 from '../../../assets/StationAnimation/18.png';
import frame19 from '../../../assets/StationAnimation/19.png';
import frame20 from '../../../assets/StationAnimation/20.png';
import frame21 from '../../../assets/StationAnimation/21.png';
import frame22 from '../../../assets/StationAnimation/22.png';
import frame23 from '../../../assets/StationAnimation/23.png';
import frame24 from '../../../assets/StationAnimation/24.png';
import frame25 from '../../../assets/StationAnimation/25.png';
import frame26 from '../../../assets/StationAnimation/26.png';
import frame27 from '../../../assets/StationAnimation/27.png';
import frame28 from '../../../assets/StationAnimation/28.png';
import frame29 from '../../../assets/StationAnimation/29.png';
import frame30 from '../../../assets/StationAnimation/30.png';
import frame31 from '../../../assets/StationAnimation/31.png';

import frame2_1 from '../../../assets/StationAnimation2/01.png';
import frame2_2 from '../../../assets/StationAnimation2/02.png';
import frame2_3 from '../../../assets/StationAnimation2/03.png';
import frame2_4 from '../../../assets/StationAnimation2/04.png';
import frame2_5 from '../../../assets/StationAnimation2/05.png';
import frame2_6 from '../../../assets/StationAnimation2/06.png';
import frame2_7 from '../../../assets/StationAnimation2/07.png';
import frame2_8 from '../../../assets/StationAnimation2/08.png';
import frame2_9 from '../../../assets/StationAnimation2/09.png';
import frame2_10 from '../../../assets/StationAnimation2/10.png';
import frame2_11 from '../../../assets/StationAnimation2/11.png';
import frame2_12 from '../../../assets/StationAnimation2/12.png';
import frame2_13 from '../../../assets/StationAnimation2/13.png';
import frame2_14 from '../../../assets/StationAnimation2/14.png';
import frame2_15 from '../../../assets/StationAnimation2/15.png';
import frame2_16 from '../../../assets/StationAnimation2/16.png';
import frame2_17 from '../../../assets/StationAnimation2/17.png';
import frame2_18 from '../../../assets/StationAnimation2/18.png';
import frame2_19 from '../../../assets/StationAnimation2/19.png';
import frame2_20 from '../../../assets/StationAnimation2/20.png';
import frame2_21 from '../../../assets/StationAnimation2/21.png';
import frame2_22 from '../../../assets/StationAnimation2/22.png';
import frame2_23 from '../../../assets/StationAnimation2/23.png';
import frame2_24 from '../../../assets/StationAnimation2/24.png';
import frame2_25 from '../../../assets/StationAnimation2/25.png';
import frame2_26 from '../../../assets/StationAnimation2/26.png';
import frame2_27 from '../../../assets/StationAnimation2/27.png';
import frame2_28 from '../../../assets/StationAnimation2/28.png';
import frame2_29 from '../../../assets/StationAnimation2/29.png';
import frame2_30 from '../../../assets/StationAnimation2/30.png';
import frame2_31 from '../../../assets/StationAnimation2/31.png';

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

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';

import SearchIcon24Black from '../../../assets/Icons/SearchIcons/SearchIcon24Black.svg';
import SearchIcon24White from '../../../assets/Icons/SearchIcons/SearchIcon24White.svg';
import FilterIcon24Black from '../../../assets/Icons/FilterIcons/FilterIcon24Black.svg';
import FilterIcon24White from '../../../assets/Icons/FilterIcons/FilterIcon24White.svg';
import PrintIcon24Black from '../../../assets/Icons/PrintIcons/PrintIcon24Black.svg';
import DownloadIcon24Black from '../../../assets/Icons/DownloadIcons/DownloadIcon24Black.svg';
import CleanIcon26Black from '../../../assets/Icons/CleanIcons/CleanIcon26Black.svg';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';

import CellIcon16Black from '../../../assets/Icons/CellIcons/CellIcon16Black.svg';
import CleanIcon16Black from '../../../assets/Icons/CleanIcons/CleanIcon16Black.svg';
import WatchIcon16Black from '../../../assets/Icons/WatchIcons/WatchIcon16Black.svg';

import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

import SchablonProgressBar from '../Schablon/SchablonProgressBar';
import RefillTable from './RefillTable';
import RefillCellPopup from './RefillCellPopup';
import ClearPopup from '../Schablon/ClearPopup';
import DataTable from '../../elements/DataTable';
import FormField from '../../elements/FormField';
import HistoryTable from '../../elements/HistoryTable';

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
  quantity?: number | null;
  templateQuantity?: number | null;
  factQuantity?: number | null;
  minStockSnapshot?: number | null;
  criticalStockSnapshot?: number | null;
  stockControlExists?: boolean | null;
  stockAvailable?: number | null;
  stockMinStock?: number | null;
  stockCriticalStock?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
  refillQuantity?: number | null;
}

interface StockReg { minStock: number | null; criticalStock: number | null; exists: boolean; }

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
  cells: RefillCell[];
}

interface RefillEvent { uid: string; createdAt: string; author: string; eventDescription: string; }
interface ModelCell { id: string; drum?: number; column: number; row: number; colSpan: number; rowSpan: number; deleted: boolean; }
interface DocumentRow {
  uid: string;
  numberCell: string;
  cellAssignmentName: string;
  materialName: string;
  materialArticle: string;
  schemeQuantity: string;
  factQuantity: string;
  refillQuantity: string;
  _cell: RefillCell | null;
}

const DOC_COLUMNS = [
  { key: 'numberCell', label: 'Номер ячейки' },
  { key: 'cellAssignmentName', label: 'Назначение ячейки' },
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'schemeQuantity', label: 'По схеме' },
  { key: 'factQuantity', label: 'В ячейке' },
  { key: 'refillQuantity', label: 'К загрузке' },
];

const FRAMES = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9, frame10, frame11, frame12, frame13, frame14, frame15, frame16, frame17, frame18, frame19, frame20, frame21, frame22, frame23, frame24, frame25, frame26, frame27, frame28, frame29, frame30, frame31];
const FRAMES2 = [frame2_1, frame2_2, frame2_3, frame2_4, frame2_5, frame2_6, frame2_7, frame2_8, frame2_9, frame2_10, frame2_11, frame2_12, frame2_13, frame2_14, frame2_15, frame2_16, frame2_17, frame2_18, frame2_19, frame2_20, frame2_21, frame2_22, frame2_23, frame2_24, frame2_25, frame2_26, frame2_27, frame2_28, frame2_29, frame2_30, frame2_31];
const ANIMATION_DURATION = 1000; const FRAMES_COUNT = 31; const FRAME_INTERVAL = ANIMATION_DURATION / FRAMES_COUNT;
const WING_WIDTH = 77; const WING_HEIGHT = 21; const WING_HEIGHT_DOUBLE = 42; const WING_TOP_START = 40; const WING_LEFT = 25;
const TOGGLES_COUNT = 18; const MAX_DRUMS = 2;

const POPUP_BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  zIndex: 9999,
};

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

const isActiveTmcCell = (c: RefillCell | null | undefined): boolean => {
  if (!c) return false;
  const isTmc = c.cellAssignmentName === 'ТМЦ';
  const hasAssignment = !!c.cellAssignmentUid;
  const hasMaterial = !!c.materialUid;
  return isTmc && (hasAssignment || hasMaterial);
};

// Нормализация набора ячеек для сравнения (ТОЛЬКО редактируемые поля).
// Снимковые поля (templateQuantity, factQuantity, min/critical, stockControlExists)
// намеренно НЕ участвуют в сравнении — они живые и меняются на бэке.
const normalizeEditableCells = (list: RefillCell[]) =>
  [...list]
    .map(c => ({
      drumNumber: c.drumNumber ?? null,
      columnNumber: c.columnNumber ?? null,
      numberCell: c.numberCell ?? null,
      cellAssignmentUid: c.cellAssignmentUid ?? null,
      materialUid: c.materialUid ?? null,
      refillQuantity: c.refillQuantity ?? null,
      returnToThisCell: c.returnToThisCell ?? false,
      isIndividual: c.isIndividual ?? false,
    }))
    .sort((a, b) => {
      const ak = `${a.drumNumber ?? 0}-${a.columnNumber ?? 0}-${a.numberCell ?? 0}`;
      const bk = `${b.drumNumber ?? 0}-${b.columnNumber ?? 0}-${b.numberCell ?? 0}`;
      return ak.localeCompare(bk);
    });

const RefillCreatePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stationUidParam = searchParams.get('stationUid') || '';
  const stationNameParam = searchParams.get('stationName') || '';
  const {
    tabs, activeTabId, closeTab, replaceTab,
    setTabLocked,
  } = useTabs();

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
  const [docSelectedIds, setDocSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
  const [shakeTick, setShakeTick] = useState(0);

  const [viewMode, setViewMode] = useState<'graphic' | 'document'>('graphic');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const [totalRows, setTotalRows] = useState(18);
  const [totalColumns, setTotalColumns] = useState(14);
  const [totalDrums, setTotalDrums] = useState(1);
  const [selectedDrum, setSelectedDrum] = useState(1);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [modelCells, setModelCells] = useState<ModelCell[]>([]);

  const [isTmc, setIsTmc] = useState(false);
  const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false);
  const [parentUid, setParentUid] = useState<string | null>(null);

  const [stockRegs, setStockRegs] = useState<Record<string, StockReg>>({});
  const stockRegsLoadedRef = useRef<string>('');

  const [currentFrameArr, setCurrentFrameArr] = useState<number[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(0));
  const [isWingOpenArr, setIsWingOpenArr] = useState<boolean[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(false));
  const isAnimatingRef = useRef<boolean[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(false));
  const currentFrameRef = useRef<number[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(0));
  const animationFrameRef = useRef<(number | null)[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(null));
  const lastFrameTimeRef = useRef<(number | null)[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill(null));
  const directionRef = useRef<('open' | 'close')[]>(Array(MAX_DRUMS * TOGGLES_COUNT).fill('open'));
  const LAST_FRAME_INDEX = FRAMES_COUNT - 1;
  const getWingIndex = useCallback((drumIndex: number, cellIndex: number) => drumIndex * TOGGLES_COUNT + cellIndex, []);

  const prevSelectedIdsRef = useRef<Set<string>>(new Set());
  const prevContextRef = useRef<{ drum: number; column: number }>({ drum: 1, column: 1 });
  const currentDrumRef = useRef<number>(1);
  const currentColumnRef = useRef<number>(1);
  useEffect(() => { currentDrumRef.current = selectedDrum; }, [selectedDrum]);

  const startWingAnimation = useCallback((wingIndex: number, opening: boolean) => {
    if (isAnimatingRef.current[wingIndex]) {
      directionRef.current[wingIndex] = opening ? 'open' : 'close';
      return;
    }
    isAnimatingRef.current[wingIndex] = true;
    directionRef.current[wingIndex] = opening ? 'open' : 'close';
    lastFrameTimeRef.current[wingIndex] = null;
    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current[wingIndex] === null) lastFrameTimeRef.current[wingIndex] = timestamp;
      const elapsed = timestamp - lastFrameTimeRef.current[wingIndex]!;
      const dir = directionRef.current[wingIndex];
      if (elapsed >= FRAME_INTERVAL) {
        lastFrameTimeRef.current[wingIndex] = timestamp;
        if (dir === 'open') {
          const nextFrame = Math.min(currentFrameRef.current[wingIndex] + 1, LAST_FRAME_INDEX);
          currentFrameRef.current[wingIndex] = nextFrame;
          setCurrentFrameArr(prev => { const copy = [...prev]; copy[wingIndex] = nextFrame; return copy; });
        } else {
          const nextFrame = Math.max(currentFrameRef.current[wingIndex] - 1, 0);
          currentFrameRef.current[wingIndex] = nextFrame;
          setCurrentFrameArr(prev => { const copy = [...prev]; copy[wingIndex] = nextFrame; return copy; });
        }
      }
      const currentFrame = currentFrameRef.current[wingIndex];
      const isComplete = (dir === 'open' && currentFrame >= LAST_FRAME_INDEX) || (dir === 'close' && currentFrame <= 0);
      if (!isComplete || elapsed < FRAME_INTERVAL) {
        animationFrameRef.current[wingIndex] = requestAnimationFrame(animate);
      } else {
        if ((dir === 'open' && currentFrame >= LAST_FRAME_INDEX && directionRef.current[wingIndex] === 'open') ||
            (dir === 'close' && currentFrame <= 0 && directionRef.current[wingIndex] === 'close')) {
          isAnimatingRef.current[wingIndex] = false;
          animationFrameRef.current[wingIndex] = null;
          lastFrameTimeRef.current[wingIndex] = null;
        } else {
          animationFrameRef.current[wingIndex] = requestAnimationFrame(animate);
        }
      }
    };
    animationFrameRef.current[wingIndex] = requestAnimationFrame(animate);
  }, [LAST_FRAME_INDEX]);

  const handleWingClick = useCallback((wingIndex: number) => {
    const isOpen = isWingOpenArr[wingIndex];
    setIsWingOpenArr(prev => { const copy = [...prev]; copy[wingIndex] = !copy[wingIndex]; return copy; });
    startWingAnimation(wingIndex, !isOpen);
  }, [isWingOpenArr, startWingAnimation]);

  useEffect(() => { return () => { animationFrameRef.current.forEach(frame => { if (frame !== null) cancelAnimationFrame(frame); }); }; }, []);

  const closeWingsForIds = useCallback((ids: Set<string>, drum: number) => {
    if (ids.size === 0) return;
    ids.forEach(cellUid => {
      const cell = localCells.find(c => c.uid === cellUid);
      if (!cell) return;
      if (cell.drumNumber != null && cell.drumNumber !== drum) return;
      const rowNum = cell.numberCell;
      if (rowNum == null || rowNum < 1) return;
      const drumIndex = drum - 1;
      const rowIndex = rowNum - 1;
      if (drumIndex < 0 || drumIndex >= MAX_DRUMS) return;
      if (rowIndex < 0 || rowIndex >= TOGGLES_COUNT) return;
      const wingIndex = getWingIndex(drumIndex, rowIndex);
      setIsWingOpenArr(prev => {
        if (!prev[wingIndex]) return prev;
        const copy = [...prev];
        copy[wingIndex] = false;
        return copy;
      });
      startWingAnimation(wingIndex, false);
    });
  }, [localCells, getWingIndex, startWingAnimation]);

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setDocSelectedIds(ids);
    const prevIds = prevSelectedIdsRef.current;
    const prevCtx = prevContextRef.current;

    const closedIds = new Set<string>();
    prevIds.forEach(id => { if (!ids.has(id)) closedIds.add(id); });
    closeWingsForIds(closedIds, prevCtx.drum);

    const openedIds = new Set<string>();
    ids.forEach(id => { if (!prevIds.has(id)) openedIds.add(id); });
    if (openedIds.size > 0) {
      const drum = currentDrumRef.current;
      openedIds.forEach(cellUid => {
        const cell = localCells.find(c => c.uid === cellUid);
        if (!cell) return;
        if (cell.drumNumber != null && cell.drumNumber !== drum) return;
        const rowNum = cell.numberCell;
        if (rowNum == null || rowNum < 1) return;
        const drumIndex = drum - 1;
        const rowIndex = rowNum - 1;
        if (drumIndex < 0 || drumIndex >= MAX_DRUMS) return;
        if (rowIndex < 0 || rowIndex >= TOGGLES_COUNT) return;
        const wingIndex = getWingIndex(drumIndex, rowIndex);
        setIsWingOpenArr(prev => {
          if (prev[wingIndex]) return prev;
          const copy = [...prev];
          copy[wingIndex] = true;
          return copy;
        });
        startWingAnimation(wingIndex, true);
      });
    }

    prevSelectedIdsRef.current = new Set(ids);
    prevContextRef.current = { drum: currentDrumRef.current, column: currentColumnRef.current };
  }, [localCells, closeWingsForIds, startWingAnimation, getWingIndex]);

  const handleContextChange = useCallback((col: number, drum: number) => {
    if (col !== currentColumnRef.current && prevSelectedIdsRef.current.size > 0) {
      closeWingsForIds(prevSelectedIdsRef.current, prevContextRef.current.drum);
      prevSelectedIdsRef.current = new Set();
      setDocSelectedIds(new Set());
    }
    currentColumnRef.current = col;
    currentDrumRef.current = drum;
  }, [closeWingsForIds]);

  const handleDrumChange = useCallback((drum: number) => {
    if (drum === selectedDrum) return;
    if (prevSelectedIdsRef.current.size > 0) {
      closeWingsForIds(prevSelectedIdsRef.current, prevContextRef.current.drum);
    }
    prevSelectedIdsRef.current = new Set();
    setDocSelectedIds(new Set());
    setSelectedDrum(drum);
  }, [selectedDrum, closeWingsForIds]);

  const [expanded, setExpanded] = useState<'search' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, Set<string>>>({
    filled: new Set(),
    assignment: new Set(),
    usage: new Set(),
  });

  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<RefillEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClearPopupOpen, setIsClearPopupOpen] = useState(false);
  const [countersExpanded, setCountersExpanded] = useState(false);

  const [cellContextMenu, setCellContextMenu] = useState<{ x: number; y: number; uid: string } | null>(null);
  const [isCellPopupOpen, setIsCellPopupOpen] = useState(false);
  const [cellPopupUid, setCellPopupUid] = useState<string | null>(null);
  const [cellPopupReadOnly, setCellPopupReadOnly] = useState(false);

  // ============ isDirty — только редактируемые поля ============
  const isDirty = useMemo(() => {
    return JSON.stringify(normalizeEditableCells(localCells)) !== JSON.stringify(normalizeEditableCells(savedCells));
  }, [localCells, savedCells]);

  useEffect(() => {
    if (!cellContextMenu) return;
    const handler = () => setCellContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [cellContextMenu]);

  useEffect(() => {
    if (!activeTabId) return;
    const hasInvalid = invalidCells.size > 0;
    setTabLocked(activeTabId, hasInvalid);
    return () => { setTabLocked(activeTabId, false); };
  }, [activeTabId, invalidCells, setTabLocked]);

  const handleCellValidationChange = useCallback((cellUid: string, hasError: boolean) => {
    setInvalidCells(prev => {
      const has = prev.has(cellUid);
      if (hasError && !has) {
        const next = new Set(prev); next.add(cellUid); return next;
      }
      if (!hasError && has) {
        const next = new Set(prev); next.delete(cellUid); return next;
      }
      return prev;
    });
  }, []);

  // ============ Слияние: живые снимковые поля из бэка + локальный refillQuantity ===
  // Для каждого адреса: берём свежую ячейку с бэка (fresh) и накладываем локальный refillQuantity,
  // если пользователь его вводил (в localCells он не null).
  const mergeLiveFieldsWithLocalRefill = useCallback(
    (freshFromServer: RefillCell[], localDraft: RefillCell[]): RefillCell[] => {
      const localByAddr = new Map<string, RefillCell>();
      localDraft.forEach(c => {
        const key = `${c.drumNumber ?? 0}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`;
        localByAddr.set(key, c);
      });

      return freshFromServer.map(fresh => {
        const key = `${fresh.drumNumber ?? 0}-${fresh.columnNumber ?? 0}-${fresh.numberCell ?? 0}`;
        const local = localByAddr.get(key);
        if (!local) return fresh;

        // Берём все снимковые/справочные поля из fresh, refillQuantity/returnToThisCell/isIndividual — локальные
        return {
          ...fresh,
          refillQuantity: local.refillQuantity ?? null,
          returnToThisCell: local.returnToThisCell ?? fresh.returnToThisCell ?? false,
          isIndividual: local.isIndividual ?? fresh.isIndividual ?? false,
        };
      });
    },
    []
  );

  // ============ ЗАГРУЗКА ДАННЫХ ============
  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }

    if (!isEdit) {
      setIsLoading(true);
      (async () => {
        try {
          if (stationUidParam) {
            try {
              const snapRes = await AxiosService.get(
                ConstantInfo.restApiRefillSnapshot(stationUidParam)
              );
              const snap = snapRes.data as DocRefill;
              setDoc(snap);

              const cells: RefillCell[] = (snap.cells || []).map((c: RefillCell) => ({
                ...c,
                uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
              }));

              const savedSnapshot = cells.map(c => ({ ...c, refillQuantity: null }));
              setSavedCells(savedSnapshot);

              let hasDraft = false;
              try {
                const raw = sessionStorage.getItem(draftKey);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    hasDraft = true;
                    // Уже при первом открытии: свежие снимковые поля + локальный refillQuantity
                    setLocalCells(mergeLiveFieldsWithLocalRefill(cells, parsed as RefillCell[]));
                  }
                }
              } catch {}
              if (!hasDraft) setLocalCells(savedSnapshot);
            } catch (e) {
              console.error('Ошибка загрузки снимка:', e);
            }

            try {
              const stationRes = await AxiosService.get(`/api/stations/static/${stationUidParam}`);
              const station = stationRes.data;
              setIsTmc(station?.isTmc || false);
              setIsSgd(station?.isSgd || false);
              setIsOk(station?.isOk || false);
              setParentUid(station?.parentUid || null);
              const configUid = station?.configurationUid;
              if (configUid) {
                const configRes = await AxiosService.get(ConstantInfo.restApiStationConfiguration(configUid));
                const configData = configRes.data;
                if (configData.cellsStructure) {
                  const structure = JSON.parse(configData.cellsStructure);
                  if (structure.type === 'drum') {
                    setTotalColumns(structure.columnsPerDrum || 14);
                    setTotalRows(structure.rowsPerColumn || 18);
                    setTotalDrums(structure.drums || 1);
                  } else {
                    setTotalColumns(structure.columns || 14);
                    setTotalRows(structure.cellsPerColumn || 18);
                    setTotalDrums(1);
                  }
                  if (Array.isArray(structure.cells)) {
                    setModelCells(structure.cells.map((c: any) => ({
                      id: c.id, drum: c.drum, column: c.column ?? 1, row: c.row ?? 1,
                      colSpan: c.colSpan ?? 1, rowSpan: c.rowSpan ?? 1, deleted: !!c.deleted,
                    })));
                  }
                }
              }
            } catch (e) { console.error('Ошибка загрузки конфигурации:', e); }
          }
          setConfigLoaded(true);
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    // === EDIT: GET документа, обновляем снимковые поля, сохраняем локальный refillQuantity ===
    setIsLoading(true);
    AxiosService.get(ConstantInfo.restApiRefill(uid))
      .then(r => {
        const d = r.data as DocRefill;
        setDoc(d);
        const cells: RefillCell[] = (d.cells || []).map((c: RefillCell) => ({
          ...c,
          uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
        }));
        setSavedCells(cells);

        let hasDraft = false;
        try {
          const raw = sessionStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hasDraft = true;
              setLocalCells(mergeLiveFieldsWithLocalRefill(cells, parsed as RefillCell[]));
            }
          }
        } catch {}
        if (!hasDraft) setLocalCells(cells);
      })
      .catch(e => console.error(e))
      .finally(() => setIsLoading(false));
  }, [uid, isEdit, stationUidParam, draftKey, mergeLiveFieldsWithLocalRefill]);

  useEffect(() => {
    if (!doc?.stationUid) return;
    if (configLoaded) return;

    AxiosService.get(`/api/stations/static/${doc.stationUid}`)
      .then(res => {
        const stationData = res.data;
        setIsTmc(stationData?.isTmc || false);
        setIsSgd(stationData?.isSgd || false);
        setIsOk(stationData?.isOk || false);
        setParentUid(stationData?.parentUid || null);
        const configUid = stationData?.configurationUid;
        if (!configUid) { setConfigLoaded(true); return; }
        return AxiosService.get(ConstantInfo.restApiStationConfiguration(configUid)).then(cr => {
          const configData = cr.data;
          if (configData.cellsStructure) {
            try {
              const structure = JSON.parse(configData.cellsStructure);
              if (structure.type === 'drum') {
                setTotalColumns(structure.columnsPerDrum || 14);
                setTotalRows(structure.rowsPerColumn || 18);
                setTotalDrums(structure.drums || 1);
              } else {
                setTotalColumns(structure.columns || 14);
                setTotalRows(structure.cellsPerColumn || 18);
                setTotalDrums(1);
              }
              if (Array.isArray(structure.cells)) {
                setModelCells(structure.cells.map((c: any) => ({
                  id: c.id, drum: c.drum, column: c.column ?? 1, row: c.row ?? 1,
                  colSpan: c.colSpan ?? 1, rowSpan: c.rowSpan ?? 1, deleted: !!c.deleted,
                })));
              }
            } catch (e) { console.error('Ошибка парсинга структуры:', e); }
          }
          setConfigLoaded(true);
        });
      })
      .catch(e => { console.error(e); setConfigLoaded(true); });
  }, [doc?.stationUid, configLoaded]);

  // ============ СОХРАНЕНИЕ ЧЕРНОВИКА В sessionStorage ============
  useEffect(() => {
    if (isLoading) return;
    if (localCells.length === 0) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(localCells));
    } catch (e) {
      console.error('Не удалось сохранить черновик пополнения:', e);
    }
  }, [localCells, draftKey, isLoading]);

  useEffect(() => {
    const stationUid = doc?.stationUid || stationUidParam;
    if (!stationUid) { setStockRegs({}); stockRegsLoadedRef.current = ''; return; }

    const materialUids = Array.from(new Set(
      localCells.map(c => c.materialUid).filter((x): x is string => !!x)
    ));
    if (materialUids.length === 0) { setStockRegs({}); stockRegsLoadedRef.current = ''; return; }

    const key = `${stationUid}|${materialUids.slice().sort().join(',')}`;
    if (stockRegsLoadedRef.current === key) return;
    stockRegsLoadedRef.current = key;

    let cancelled = false;
    (async () => {
      const regs: Record<string, StockReg> = {};
      await Promise.all(materialUids.map(async (mUid) => {
        try {
          const res = await AxiosService.get(ConstantInfo.restApiStockLevelControlReg(stationUid, mUid));
          const data = res.data;
          if (data) {
            regs[mUid] = {
              minStock: data.minStock ?? null,
              criticalStock: data.criticalStock ?? null,
              exists: true,
            };
          } else {
            regs[mUid] = { minStock: null, criticalStock: null, exists: false };
          }
        } catch (e) {
          regs[mUid] = { minStock: null, criticalStock: null, exists: false };
        }
      }));
      if (!cancelled) setStockRegs(regs);
    })();

    return () => { cancelled = true; };
  }, [doc?.stationUid, stationUidParam, localCells]);

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

  const hasActiveFilter = filterValues.filled.size > 0 || filterValues.assignment.size > 0 || filterValues.usage.size > 0;

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
      if (filterValues.filled.size > 0) {
        const isFilled = !!(c.materialUid || c.cellAssignmentUid);
        const ok = (filterValues.filled.has('defined') && isFilled) || (filterValues.filled.has('undefined') && !isFilled);
        if (!ok) return false;
      }
      return true;
    });
  }, [localCells, searchValue, filterValues, hasActiveFilter]);

  const documentRows: DocumentRow[] = useMemo(() => {
    return filteredCells.map(c => ({
      uid: c.uid,
      numberCell: `${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
      cellAssignmentName: c.cellAssignmentName || '—',
      materialName: c.materialName || '—',
      materialArticle: c.materialArticle || '—',
      schemeQuantity: formatQty(c.templateQuantity),
      factQuantity: formatQty(c.factQuantity),
      refillQuantity: formatQty(c.refillQuantity),
      _cell: c,
    }));
  }, [filteredCells]);

  const docVisibleColumns = ['numberCell', 'cellAssignmentName', 'materialName', 'materialArticle', 'schemeQuantity', 'factQuantity', 'refillQuantity'];

  const documentRenderCell = (key: string, item: DocumentRow): string => {
    const val = (item as any)[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const wingLayout = useMemo((): { heights: Map<number, number>; hidden: Set<number> } => {
    const heights = new Map<number, number>(); const hidden = new Set<number>();
    const displayDrums = Math.min(totalDrums, MAX_DRUMS);
    for (let d = 0; d < displayDrums; d++) for (let c = 0; c < TOGGLES_COUNT; c++) heights.set(getWingIndex(d, c), WING_HEIGHT);
    modelCells.forEach(mc => {
      if (mc.deleted || mc.drum == null) return;
      const drumIndex = mc.drum - 1; if (drumIndex >= displayDrums) return;
      if (mc.rowSpan >= 2 && mc.row >= 1) {
        heights.set(getWingIndex(drumIndex, mc.row - 1), WING_HEIGHT_DOUBLE);
        if (mc.row < TOGGLES_COUNT) hidden.add(getWingIndex(drumIndex, mc.row));
      }
    });
    return { heights, hidden };
  }, [modelCells, totalDrums, getWingIndex]);

  const updateRefillQuantity = useCallback((cellUid: string, value: string) => {
    const num = value === '' ? null : Number(value);
    setLocalCells(prev => prev.map(c => {
      if (c.uid !== cellUid) return c;
      let safe = num;
      if (safe != null && c.templateQuantity != null && safe > c.templateQuantity) {
        safe = c.templateQuantity;
      }
      return { ...c, refillQuantity: safe };
    }));
  }, []);

  const selectedCellsCount = useMemo(
    () => localCells.filter(c => (Number(c.refillQuantity) || 0) > 0).length,
    [localCells]
  );

  const positionsCount = useMemo(
    () => localCells.reduce((s, c) => s + (Number(c.refillQuantity) || 0), 0),
    [localCells]
  );

  const totalCellsInStation = useMemo(() => {
    const active = modelCells.filter(c => !c.deleted).length;
    return active > 0 ? active : localCells.length;
  }, [modelCells, localCells]);

  const cellsToLoadCount = selectedCellsCount;
  const cellsToLoadPercent = totalCellsInStation > 0
    ? Math.round((cellsToLoadCount / totalCellsInStation) * 100)
    : 0;

  const clearDraft = useCallback(() => {
    try { sessionStorage.removeItem(draftKey); } catch {}
  }, [draftKey]);

  // ============ SAVE ============
  const handleSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    if (!uid) return false;

    if (invalidCells.size > 0) {
      setShakeTick(t => t + 1);
      return false;
    }

    setIsSaving(true);
    try {
      const cells = localCells.map(c => ({
        drumNumber: c.drumNumber,
        columnNumber: c.columnNumber,
        numberCell: c.numberCell,
        cellAssignmentUid: c.cellAssignmentUid ?? null,
        cellAssignmentName: c.cellAssignmentName ?? null,
        cellAssignmentTypeUid: c.cellAssignmentTypeUid ?? null,
        cellAssignmentTypeName: c.cellAssignmentTypeName ?? null,
        materialUid: c.materialUid ?? null,
        materialName: c.materialName ?? null,
        materialArticle: c.materialArticle ?? null,
        materialCode: c.materialCode ?? null,
        materialGroupName: c.materialGroupName ?? null,
        materialMeasureName: c.materialMeasureName ?? null,
        materialUsage: c.materialUsage ?? null,
        materialTypeName: c.materialTypeName ?? null,
        materialPurposeName: c.materialPurposeName ?? null,
        materialProductName: c.materialProductName ?? null,
        materialManufacturerName: c.materialManufacturerName ?? null,
        materialCountryName: c.materialCountryName ?? null,
        materialBrandName: c.materialBrandName ?? null,
        materialModelName: c.materialModelName ?? null,
        templateQuantity: c.templateQuantity ?? null,
        factQuantity: c.factQuantity ?? null,
        refillQuantity: c.refillQuantity != null ? Number(c.refillQuantity) : null,
        minStockSnapshot: c.minStockSnapshot ?? null,
        criticalStockSnapshot: c.criticalStockSnapshot ?? null,
        stockControlExists: c.stockControlExists ?? false,
        returnToThisCell: c.returnToThisCell ?? false,
        isIndividual: c.isIndividual ?? false,
      }));

      if (!isEdit) {
        const payload = {
          uid,
          stationUid: stationUidParam || null,
          templateUid: doc?.templateUid || null,
          createdByUserId: 1,
          status: 'SAVED',
          cells,
        };
        const res = await AxiosService.post(ConstantInfo.restApiRefillCrud(1), payload);
        const d = res.data as DocRefill;
        setDoc(d);
        const fresh: RefillCell[] = (d.cells || []).map((c: RefillCell) => ({
          ...c,
          uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
        }));
        setSavedCells(fresh);
        setLocalCells(fresh);
        clearDraft();
        setEditMode(false);
        if (activeTabId && d.uid && d.code != null) {
          replaceTab(
            activeTabId,
            `/documents/refill/edit/${d.uid}`,
            `Пополнение: ${String(d.code).padStart(4, '0')}`,
            <RefillCreatePage />
          );
        }
        return true;
      }

      const res = await AxiosService.patch(ConstantInfo.restApiRefill(doc!.uid), { status: 'SAVED', cells });
      const d = res.data as DocRefill;
      setDoc(d);
      const fresh: RefillCell[] = (d.cells || []).map((c: RefillCell) => ({
        ...c,
        uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
      }));
      setSavedCells(fresh);
      setLocalCells(fresh);
      clearDraft();
      setEditMode(false);
      return true;
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ============ LOAD (как было) ============
  const handleLoad = () => {
    if (!isLoaded) setIsLoaded(true);
  };

  // ============ POST ============
  const handlePost = async () => {
    if (!doc?.uid || !isEdit) return;
    if (invalidCells.size > 0) {
      setShakeTick(t => t + 1);
      return;
    }
    try {
      const res = await AxiosService.post(ConstantInfo.restApiRefillPost(doc.uid));
      const d = res.data as DocRefill;
      setDoc(d);
      const fresh: RefillCell[] = (d.cells || []).map((c: RefillCell) => ({
        ...c,
        uid: c.uid || `${c.drumNumber ?? 1}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`,
      }));
      setSavedCells(fresh);
      setLocalCells(fresh);
      clearDraft();
      setEditMode(false);
    } catch (e) { console.error(e); }
  };

  const handleClose = () => {
    if (invalidCells.size > 0) {
      setShakeTick(t => t + 1);
      return;
    }
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
    setSlideDirection(viewMode === 'graphic' ? 'left' : 'right');
    if (viewMode === 'document') setShowHistory(false);
    setViewMode(prev => prev === 'graphic' ? 'document' : 'graphic');
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      if (prevSelectedIdsRef.current.size > 0) {
        closeWingsForIds(prevSelectedIdsRef.current, prevContextRef.current.drum);
      }
      prevSelectedIdsRef.current = new Set();
      setDocSelectedIds(new Set());
    }
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

  const isOptionChecked = (key: string, uid: string): boolean => filterValues[key]?.has(uid);

  const clearFilters = () => {
    setFilterValues({ filled: new Set(), assignment: new Set(), usage: new Set() });
    setSubmenuOpen(null);
  };

  const handleClearAll = () => {
    if (prevSelectedIdsRef.current.size > 0) {
      closeWingsForIds(prevSelectedIdsRef.current, prevContextRef.current.drum);
    }
    prevSelectedIdsRef.current = new Set();
    setLocalCells(prev => prev.map(c => ({ ...c, refillQuantity: null })));
    setDocSelectedIds(new Set());
    setIsClearPopupOpen(false);
  };

  const handleClearSelected = () => {
    if (prevSelectedIdsRef.current.size > 0) {
      closeWingsForIds(prevSelectedIdsRef.current, prevContextRef.current.drum);
    }
    prevSelectedIdsRef.current = new Set();
    setLocalCells(prev => prev.map(c => docSelectedIds.has(c.uid) ? { ...c, refillQuantity: null } : c));
    setDocSelectedIds(new Set());
    setIsClearPopupOpen(false);
  };

  const handleDocCheckboxClick = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleDocSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const all = documentRows.length > 0 && documentRows.every(r => docSelectedIds.has(r.uid));
    if (all) setDocSelectedIds(new Set());
    else setDocSelectedIds(new Set(documentRows.map(r => r.uid)));
  };

  const handleDocRowClick = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleDocumentRowDoubleClick = (_uid: string) => {};

  const handleCellContextMenu = useCallback((cellUid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCellContextMenu({ x: e.clientX, y: e.clientY, uid: cellUid });
  }, []);

  const handleOpenCellPopup = useCallback((cellUid: string) => {
    setCellPopupUid(cellUid);
    setIsCellPopupOpen(true);
    setCellContextMenu(null);
  }, []);

  const handleCellDoubleClick = useCallback((cellUid: string) => {
    setCellPopupUid(cellUid);
    setIsCellPopupOpen(true);
  }, []);

  const getCellByUid = useCallback((cellUid: string): RefillCell | null => {
    return localCells.find(c => c.uid === cellUid) || null;
  }, [localCells]);

  if (isLoading) return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
    </div>
  );

  if (isEdit && !doc) return <div style={{ padding: 60 }}>Загрузка...</div>;

  const docStatus = doc?.status || 'NEW';
  const docCode = doc?.code ?? null;
  const docDatetime = doc?.docDatetime ?? '';
  const docStationName = doc?.stationName || stationNameParam || '';
  const docTemplateName = doc?.templateName || '';

  const isPosted = docStatus === 'POSTED';
  const isSavedOnce = isEdit || (docCode != null && docStatus !== 'NEW');

  const isEditable = !isPosted && !isLoaded && (!isSavedOnce || editMode);

  const cellContextIsActive = (() => {
    if (!cellContextMenu) return false;
    const c = localCells.find(x => x.uid === cellContextMenu.uid);
    return isActiveTmcCell(c);
  })();

  const cellContextHasSelection = (() => {
    if (!cellContextMenu) return false;
    return docSelectedIds.has(cellContextMenu.uid);
  })();

  const addQtyEnabled = isEditable && !!cellContextMenu && cellContextIsActive && !cellContextHasSelection;
  const clearEnabled = isEditable && !!cellContextMenu && cellContextIsActive;
  const viewEnabled = !!cellContextMenu && cellContextIsActive && !cellContextHasSelection;

  const statusIcon = isPosted
    ? StatusIcon114Green
    : (isLoaded
        ? StatusIcon108LightBlue
        : (!isSavedOnce
            ? StatusIcon93Red
            : (isDirty ? StatusIcon107Orange : StatusIcon104Blue)));

  const statusWidth = isPosted
    ? 114
    : (isLoaded
        ? 108
        : (!isSavedOnce ? 93 : (isDirty ? 107 : 104)));

  const titleText = isSavedOnce
    ? `Документ: Пополнение станции (${docStationName}) N${String(docCode || 0).padStart(4, '0')} от ${formatDateWithSeconds(docDatetime)}`
    : `Документ: Пополнение станции (${docStationName})`;

  const bottomButtonStyle: React.CSSProperties = { height: '50px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700 };

  const hasFilledRefill = selectedCellsCount > 0;

  const canSave = !isPosted && !isLoaded && !isSaving && hasFilledRefill && isDirty && invalidCells.size === 0;
  const canLoad = !isPosted && !isLoaded && isSavedOnce && !isDirty && hasFilledRefill && invalidCells.size === 0;
  const canPost = !isPosted && isLoaded && isSavedOnce && !isDirty && invalidCells.size === 0;
  const canEdit = !isPosted && !isLoaded && isSavedOnce && !editMode;

  const BTN_SIZE = 54;
  const BTN_GAP = 20;
  const SIDE_OFFSET = 25;
  const WIDE_W = 411;
  const BLOCK_TOP = 106;
  const TABLE_TOP_GAP = 10;
  const TABLE_LEFT = 577;
  const TABLE_WIDTH = 1183;
  const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;

  const BTN_HEADER = 40;
  const BTN_CLEAR = 44;
  const TOP_PAD = 20;
  const BOTTOM_PAD = 20;
  const TEXT_HEIGHT = 18;
  const ITEM_GAP = 20;
  const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
  const LEFT_OFFSET = 30;
  const SUBMENU_WIDTH = 360;
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
  const DOC_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
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
  const wideMargin = expanded !== null ? 40 : 159;
  const btnWideLeft = btnClearLeft + BTN_SIZE + wideMargin;

  const TOP_BTN_SIZE = 56;
  const TOP_BTN_GAP = 20;
  const TOP_BTNS_RIGHT_OFFSET = 25;
  const btnDownloadLeft = TABLE_RIGHT - TOP_BTNS_RIGHT_OFFSET - TOP_BTN_SIZE;
  const btnPrintLeft = btnDownloadLeft - TOP_BTN_GAP - TOP_BTN_SIZE;

  const tableTop = BLOCK_TOP + BTN_SIZE + TABLE_TOP_GAP;

  const FILTER_FIELDS: { key: string; label: string }[] = [
    { key: 'filled', label: 'Заполненные ячейки' },
    { key: 'assignment', label: 'Назначение ячейки' },
    { key: 'usage', label: 'Использование' },
  ];

  const FILLED_OPTIONS: { uid: string; name: string }[] = [
    { uid: 'defined', name: 'Ячейка определена' },
    { uid: 'undefined', name: 'Ячейка не определена' },
  ];

  const getSubmenuOptions = (key: string): { uid: string; name: string }[] => {
    if (key === 'filled') return FILLED_OPTIONS;
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

  const clearButtonDisabled = docSelectedIds.size < 1;

  const topBtnStyle: React.CSSProperties = {
    position: 'absolute', top: 0,
    width: TOP_BTN_SIZE, height: TOP_BTN_SIZE, borderRadius: 15,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const editBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 28,
    right: 40,
    width: 191,
    height: 44,
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 17,
    paddingRight: 17,
    boxSizing: 'border-box',
    gap: 17,
    cursor: canEdit ? 'pointer' : 'not-allowed',
    opacity: canEdit ? 1 : 0.35,
    pointerEvents: canEdit ? 'auto' : 'none',
    zIndex: 5,
  };

  const docBtnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const docSearchWidth = expanded === 'search' ? DOC_SEARCH_EXPANDED : DOC_BTN_SIZE;
  const docFilterWidth = expanded === 'filter' ? DOC_FILTER_EXPANDED : DOC_BTN_SIZE;
  const docBtnSearchLeft = 15;
  const docBtnFilterLeft = docBtnSearchLeft + docSearchWidth + DOC_BTN_GAP;
  const docBtnClearLeft = docBtnFilterLeft + docFilterWidth + DOC_BTN_GAP;

  const DOC_TABLE_FULL_W = 1720;
  const DOC_TABLE_TOP = 100 + 142 + 30 + 40 + 12;
  const DOC_TABLE_HEIGHT = 406;

  const statusIcons: string[] = [];
  if (isTmc) statusIcons.push(TMC);
  if (isSgd) statusIcons.push(SGD);
  if (isOk) statusIcons.push(OK);
  if (parentUid) statusIcons.push(CHAIN);

  const renderWing = (drumIndex: number, cellIndex: number) => {
    const wingIndex = getWingIndex(drumIndex, cellIndex);
    if (wingLayout.hidden.has(wingIndex)) return null;
    const frameIdx = currentFrameArr[wingIndex];
    const isDouble = wingLayout.heights.get(wingIndex) === WING_HEIGHT_DOUBLE;
    const frames = isDouble ? FRAMES2 : FRAMES;
    const imageSrc = frames[frameIdx];
    const isLeft = drumIndex === 0;
    const wingHeight = wingLayout.heights.get(wingIndex) || WING_HEIGHT;
    return (
      <div key={`wing-d${drumIndex}-c${cellIndex}`} onClick={(e) => { e.stopPropagation(); handleWingClick(wingIndex); }}
        style={{ position: 'absolute', ...(isLeft ? { left: `${WING_LEFT}px` } : { right: `${WING_LEFT}px`, transform: 'scaleX(-1)' }),
          top: `${WING_TOP_START + cellIndex * WING_HEIGHT}px`, width: `${WING_WIDTH}px`, height: `${wingHeight}px`, cursor: 'pointer', zIndex: 10 }}>
        <img src={imageSrc} alt="" draggable={false}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', userSelect: 'none', objectFit: 'fill' }} />
      </div>
    );
  };

  const BLOCK_WIDTH = 507;
  const BLOCK_HEIGHT = 560;
  const IMAGE_WIDTH = 287;
  const IMAGE_HEIGHT = 438;
  const imageLeft = (BLOCK_WIDTH - IMAGE_WIDTH) / 2;
  const imageTop = 101;
  const displayDrums = Math.min(totalDrums, MAX_DRUMS);

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

  const popupCell = cellPopupUid ? getCellByUid(cellPopupUid) : null;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, display: 'flex', alignItems: 'center', gap: 25, zIndex: 2 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{titleText}</h1>
        <img src={statusIcon} alt="" style={{ width: statusWidth, height: 29, flexShrink: 0 }} />
      </div>

      <button
        onClick={canEdit ? () => setEditMode(true) : undefined}
        disabled={!canEdit}
        style={editBtnStyle}
        title="Редактировать"
      >
        <img src={DescriptionIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          color: '#2D4059',
          lineHeight: '18px',
        }}>
          Редактировать
        </span>
      </button>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={viewMode}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {viewMode === 'graphic' && (
              <>
                <div style={{ position: 'absolute', top: '84px', left: '40px', width: '507px' }}>
                  <div style={{ width: '477px', height: '71px', marginLeft: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SchablonProgressBar currentStep={isEdit ? 2 : 1} />
                  </div>
                  <div style={{ width: `${BLOCK_WIDTH}px`, height: `${BLOCK_HEIGHT}px`, marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                    {docStationName && (
                      <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '19px', lineHeight: '23px', color: '#2D4059', textAlign: 'center', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docStationName}
                      </div>
                    )}
                    {statusIcons.length > 0 && (
                      <div style={{ position: 'absolute', top: docStationName ? '66px' : '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                        {statusIcons.map((icon, index) => (
                          <img key={index} src={icon} alt="" style={{ width: '35px', height: '20px' }} />
                        ))}
                      </div>
                    )}
                    {configLoaded && (
                      <div style={{ position: 'absolute', left: `${imageLeft}px`, top: `${imageTop}px`, width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}>
                        <img src={StationFull} alt="Station" draggable={false} style={{ width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }} />
                        {Array.from({ length: displayDrums }).map((_, drumIndex) => Array.from({ length: TOGGLES_COUNT }).map((_, cellIndex) => renderWing(drumIndex, cellIndex)))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ position: 'absolute', top: `${BLOCK_TOP}px`, left: 0, right: 0, height: `${TOP_BTN_SIZE}px` }}>
                  <motion.div
                    style={{
                      position: 'absolute', top: 0, height: BTN_SIZE, borderRadius: 15,
                      backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF',
                      border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                      display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', zIndex: expanded === 'search' ? 20 : 5,
                    }}
                    animate={{ left: btnSearchLeft, width: searchWidth }}
                    transition={{ left: SPRING, width: TWEEN }}
                  >
                    <div onClick={() => { if (expanded === 'search') { setExpanded(null); setSearchValue(''); } else { setExpanded('search'); setSubmenuOpen(null); } }}
                      style={{ width: BTN_SIZE, height: BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                      <img src={expanded === 'search' ? SearchIcon24White : SearchIcon24Black} alt="" style={{ width: 24, height: 24 }} />
                    </div>
                    <AnimatePresence>
                      {expanded === 'search' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 16 }}>
                          <input type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск"
                            style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    style={{
                      position: 'absolute', top: 0, borderRadius: 15,
                      backgroundColor: '#FFFFFF',
                      border: expanded === 'filter' || hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                      boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                      overflow: 'visible', zIndex: expanded === 'filter' ? 25 : 5,
                    }}
                    animate={{ left: btnFilterLeft, width: filterWidth, height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : BTN_SIZE }}
                    transition={{ left: SPRING, width: TWEEN, height: TWEEN }}
                  >
                    <div onClick={() => { if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); } else { setExpanded('filter'); setSearchValue(''); } }}
                      style={{ height: expanded === 'filter' ? BTN_HEADER : BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent', borderRadius: expanded === 'filter' ? '15px 15px 0 0' : 15, transition: 'height 0.2s ease' }}>
                      {expanded === 'filter'
                        ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                        : <img src={hasActiveFilter ? FilterIcon24White : FilterIcon24Black} alt="" style={{ width: 24, height: 24, display: 'block' }} />
                      }
                    </div>
                    <AnimatePresence>
                      {expanded === 'filter' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }} exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                          style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}>
                          {FILTER_FIELDS.map(field => {
                            if (filterValues[field.key].size === 0) return null;
                            return (
                              <motion.div key={`ind-${field.key}`} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} transition={{ duration: 0.15 }}
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
                                style={{ position: 'absolute', left: filterWidth + SUBMENU_OFFSET, top: getSubmenuTop(submenuOpen), width: SUBMENU_WIDTH, height: getSubmenuHeight(submenuOpen), backgroundColor: '#FFFFFF', borderRadius: '0 15px 15px 15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)', zIndex: 30, overflow: 'hidden' }}>
                                <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 400 }}>
                                  {getSubmenuOptions(submenuOpen).length === 0 ? (
                                    <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Нет данных</span>
                                    </div>
                                  ) : getSubmenuOptions(submenuOpen).map((option, i, arr) => {
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
                            style={{ width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px', borderRadius: '0 0 15px 15px' }}>
                            Очистить фильтр
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.button
                    onClick={() => { if (!clearButtonDisabled) setIsClearPopupOpen(true); }}
                    disabled={clearButtonDisabled}
                    style={{
                      position: 'absolute', top: 0, width: BTN_SIZE, height: BTN_SIZE, borderRadius: 15,
                      backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
                      cursor: clearButtonDisabled ? 'not-allowed' : 'pointer',
                      opacity: clearButtonDisabled ? 0.4 : 1,
                      pointerEvents: clearButtonDisabled ? 'none' : 'auto',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', zIndex: 5,
                    }}
                    animate={{ left: btnClearLeft }}
                    transition={SPRING}
                  >
                    <img src={CleanIcon26Black} alt="Очистка" style={{ width: 26, height: 24 }} />
                  </motion.button>

                  <motion.div
                    style={{ position: 'absolute', top: 0, width: WIDE_W, height: BTN_SIZE, borderRadius: 15, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px', boxSizing: 'border-box', zIndex: 5 }}
                    animate={{ left: btnWideLeft }}
                    transition={SPRING}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Шаблон: {docTemplateName || '—'}
                    </span>
                  </motion.div>

                  <button style={{ ...topBtnStyle, left: btnPrintLeft }} title="Печать">
                    <img src={PrintIcon24Black} alt="Печать" style={{ width: 24, height: 24 }} />
                  </button>

                  <button style={{ ...topBtnStyle, left: btnDownloadLeft }} title="Скачать">
                    <img src={DownloadIcon24Black} alt="Скачать" style={{ width: 24, height: 24 }} />
                  </button>
                </div>

                <div style={{ position: 'absolute', top: `${tableTop}px`, left: `${TABLE_LEFT}px` }}>
                  {configLoaded && (
                    <RefillTable
                      cells={localCells}
                      selectedIds={docSelectedIds}
                      onSelectionChange={handleSelectionChange}
                      onRefillQuantityChange={updateRefillQuantity}
                      onCellContextMenu={handleCellContextMenu}
                      onOpenDetails={handleOpenCellPopup}
                      onCellDoubleClick={handleCellDoubleClick}
                      disabled={!isEditable}
                      searchValue={searchValue}
                      filteredCells={hasActiveFilter || searchValue.trim() ? filteredCells : null}
                      totalDrums={totalDrums}
                      selectedDrum={selectedDrum}
                      onDrumChange={handleDrumChange}
                      stockRegs={stockRegs}
                      onContextChange={handleContextChange}
                      externalShakeTick={shakeTick}
                      onCellValidationChange={handleCellValidationChange}
                      docRefillUid={doc?.uid ?? null}
                    />
                  )}
                </div>
              </>
            )}

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
                                    {getSubmenuOptions(submenuOpen).length === 0 ? (
                                      <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Нет данных</span>
                                      </div>
                                    ) : getSubmenuOptions(submenuOpen).map((option, i, arr) => {
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
                      onClick={() => { if (!clearButtonDisabled) setIsClearPopupOpen(true); }}
                      disabled={clearButtonDisabled}
                      style={{ position: 'relative', width: DOC_BTN_SIZE, height: DOC_BTN_SIZE, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: clearButtonDisabled ? 'not-allowed' : 'pointer', opacity: clearButtonDisabled ? 0.4 : 1, pointerEvents: clearButtonDisabled ? 'none' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                      animate={{ x: 0 }}
                      transition={DOC_SPRING}
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
                    <motion.div key="doc-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: DOC_TABLE_TOP, left: 40, width: DOC_TABLE_FULL_W, height: DOC_TABLE_HEIGHT }}>
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
                        isGrayColumn={(key) => key !== 'numberCell' && key !== 'cellAssignmentName' && key !== 'materialName'}
                        tableWidth={DOC_TABLE_FULL_W}
                        rowHeight={58}
                        headerHeight={58}
                        visibleRows={6}
                        fitToWidth
                        highlightText={searchValue.trim() || undefined}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="doc-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: DOC_TABLE_TOP, left: 40, width: DOC_TABLE_FULL_W, height: DOC_TABLE_HEIGHT }}>
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
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 60 }}
                >
                  <img src={InfoIcon18Blue} alt="" style={{ position: 'absolute', top: 14, left: 14, width: 18, height: 18 }} />
                  <div style={{ position: 'absolute', top: 14, left: 42, height: 18, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE', lineHeight: '18px' }}>
                    Информация
                  </div>

                  <div style={{ position: 'absolute', top: SECTION_1_TOP, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
                    Всего ячеек в станции
                  </div>
                  <div style={{ position: 'absolute', top: SECTION_1_VALUE_TOP, left: 30 + 156 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>
                    {totalCellsInStation}
                  </div>

                  <div style={{ position: 'absolute', top: SECTION_2_TOP, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
                    Ячеек к загрузке
                  </div>
                  <div style={{ position: 'absolute', top: SECTION_2_BAR_TOP, left: 30 + 128 + 42, width: 211, height: 4, borderRadius: 2, backgroundColor: 'rgba(232, 233, 255, 0.8)' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, cellsToLoadPercent))}%`, height: '100%', borderRadius: 2, backgroundColor: '#666EFE' }} />
                  </div>
                  <div style={{ position: 'absolute', top: SECTION_2_BAR_TOP + 4 + 2, left: 30 + 128 + 42 + 105, transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.5)' }}>
                    {cellsToLoadCount}
                  </div>
                  <div style={{ position: 'absolute', top: SECTION_2_PERCENT_TOP, left: 30 + 128 + 42 + 211 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>
                    {cellsToLoadPercent}%
                  </div>

                  <div style={{ position: 'absolute', top: SECTION_3_TOP, left: 0, right: 0, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
                    Количество загружаемой номенклатуры по выбранным ячейкам
                  </div>

                  <div style={{ position: 'absolute', top: SECTION_4_TOP, left: '50%', transform: 'translateX(-50%)', width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(102, 110, 254, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#FFFFFF', lineHeight: '16px' }}>
                      {positionsCount}
                    </span>
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
          <button
            onClick={canLoad ? handleLoad : undefined}
            disabled={!canLoad}
            style={{
              ...bottomButtonStyle,
              width: 153,
              backgroundColor: isLoaded ? '#E8E9FF' : '#FFFFFF',
              color: '#2D4059',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              opacity: canLoad ? 1 : 0.35,
              cursor: canLoad ? 'pointer' : 'not-allowed',
            }}
          >
            Загрузка
          </button>

          <button onClick={canPost ? handlePost : undefined} disabled={!canPost} style={{ ...bottomButtonStyle, width: 153, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canPost ? 1 : 0.35, cursor: canPost ? 'pointer' : 'not-allowed' }}>
            <img src={InstallationIcon20Black} alt="" style={{ width: 20, height: 11, flexShrink: 0 }} />
            <span style={{ marginLeft: '15px' }}>Провести</span>
          </button>

          <button onClick={handleToggleViewMode} style={{ ...bottomButtonStyle, width: viewMode === 'graphic' ? 222 : 254, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', justifyContent: 'flex-start', paddingLeft: 19, transition: 'width 0.2s ease', overflow: 'hidden' }}>
            <img src={ShapeIcon24Black} alt="" style={{ width: 24, height: 20, flexShrink: 0 }} />
            <span style={{ marginLeft: 17, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {viewMode === 'graphic' ? 'Форма документа' : 'Интерактивная форма'}
            </span>
          </button>

          <button onClick={canSave ? handleSave : undefined} disabled={!canSave} style={{ ...bottomButtonStyle, width: 153, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canSave ? 1 : 0.35, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
          </button>

          <button onClick={handleClose} style={{ ...bottomButtonStyle, width: 116, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>Закрыть</button>
        </div>
      </div>

      {cellContextMenu && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }}
            onClick={() => setCellContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setCellContextMenu(null); }} />
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'fixed', left: cellContextMenu.x, top: cellContextMenu.y,
            width: 247, height: 134, backgroundColor: '#FFFFFF', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', zIndex: 2000, boxSizing: 'border-box',
          }}>
            <div onClick={addQtyEnabled ? () => handleOpenCellPopup(cellContextMenu.uid) : undefined} style={{
              position: 'absolute', top: 20, left: 20, right: 20, height: 18,
              display: 'flex', alignItems: 'center',
              cursor: addQtyEnabled ? 'pointer' : 'not-allowed',
              opacity: addQtyEnabled ? 1 : 0.35,
              pointerEvents: addQtyEnabled ? 'auto' : 'none',
            }}>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={CellIcon16Black} alt="" style={{ width: 16, height: 16 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Добавить количество</span>
            </div>

            <div onClick={clearEnabled ? () => {
              setLocalCells(prev => prev.map(c => c.uid === cellContextMenu.uid ? { ...c, refillQuantity: null } : c));
              setCellContextMenu(null);
            } : undefined} style={{
              position: 'absolute', top: 58, left: 20, right: 20, height: 18,
              display: 'flex', alignItems: 'center',
              cursor: clearEnabled ? 'pointer' : 'not-allowed',
              opacity: clearEnabled ? 1 : 0.35,
              pointerEvents: clearEnabled ? 'auto' : 'none',
            }}>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={CleanIcon16Black} alt="" style={{ width: 16, height: 15 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Очистить</span>
            </div>

            <div onClick={viewEnabled ? () => handleOpenCellPopup(cellContextMenu.uid) : undefined} style={{
              position: 'absolute', top: 96, left: 20, right: 20, height: 18,
              display: 'flex', alignItems: 'center',
              cursor: viewEnabled ? 'pointer' : 'not-allowed',
              opacity: viewEnabled ? 1 : 0.35,
              pointerEvents: viewEnabled ? 'auto' : 'none',
            }}>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                <img src={WatchIcon16Black} alt="" style={{ width: 16, height: 10 }} />
              </div>
              <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Посмотреть</span>
            </div>
          </div>
        </>
      )}

      {isCellPopupOpen && popupCell && (
        <>
          <div style={POPUP_BACKDROP_STYLE} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 10000 }}>
            <RefillCellPopup
              isOpen={isCellPopupOpen}
              onClose={() => { setIsCellPopupOpen(false); setCellPopupUid(null); }}
              cell={popupCell}
              onSave={(cellUid, value) => updateRefillQuantity(cellUid, value == null ? '' : String(value))}
              readOnly={!isEditable}
              docRefillUid={doc?.uid ?? null}
            />
          </div>
        </>
      )}

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
    </div>
  );
};

export default RefillCreatePage;