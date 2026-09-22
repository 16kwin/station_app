// SchablonPage.tsx — ПОЛНЫЙ ФАЙЛ (иконки 18 внутри кнопок 40, анимации как в TableToolbar)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import InstallationIcon145Red from '../../../assets/Icons/InstallationIcons/InstallationIcon145Red.svg';
import InstallationIcon124Green from '../../../assets/Icons/InstallationIcons/InstallationIcon124Green.svg';
import InstallationIcon20Black from '../../../assets/Icons/InstallationIcons/InstallationIcon20Black.svg';
import ShapeIcon24Black from '../../../assets/Icons/ShapeIcons/ShapeIcon24Black.svg';
import InfoIcon18Blue from '../../../assets/Icons/InfoIcons/InfoIcon18Blue.svg';

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';

// Большие иконки (24) — интерактивная форма
import SearchIcon24Black from '../../../assets/Icons/SearchIcons/SearchIcon24Black.svg';
import SearchIcon24White from '../../../assets/Icons/SearchIcons/SearchIcon24White.svg';
import FilterIcon24Black from '../../../assets/Icons/FilterIcons/FilterIcon24Black.svg';
import FilterIcon24White from '../../../assets/Icons/FilterIcons/FilterIcon24White.svg';
import PrintIcon24Black from '../../../assets/Icons/PrintIcons/PrintIcon24Black.svg';
import DownloadIcon24Black from '../../../assets/Icons/DownloadIcons/DownloadIcon24Black.svg';
import CleanIcon26Black from '../../../assets/Icons/CleanIcons/CleanIcon26Black.svg';

// Маленькие иконки (18) — документальная форма: поиск, фильтр, печать, скачать, история
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import DownloadIcon18Black from '../../../assets/Icons/DownloadIcons/DownloadIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';

import CellIcon16Black from '../../../assets/Icons/CellIcons/CellIcon16Black.svg';
import CleanIcon16Black from '../../../assets/Icons/CleanIcons/CleanIcon16Black.svg';
import WatchIcon16Black from '../../../assets/Icons/WatchIcons/WatchIcon16Black.svg';

import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import ArrowIcon6Blue from '../../../assets/Icons/ArrowIcons/ArrowIcon6Blue.svg';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';

import SchablonTable from './SchablonTable';
import SchablonProgressBar from './SchablonProgressBar';
import ClearPopup from './ClearPopup';
import CellDetailsPopup from './CellDetailsPopup';
import SchablonSaveAsPopup from './SchablonSaveAsPopup';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import DataTable from '../../elements/DataTable';
import FormField from '../../elements/FormField';

interface ModelCell {
  id: string;
  drum?: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
}

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeUid?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
}

interface DocumentRow {
  uid: string;
  numberCell: string;
  cellAssignmentName: string;
  materialName: string;
  materialArticle: string;
  quantity: string;
  usage: string;
  _cellData: CellData | null;
  _target: { numberCell: number; columnNumber: number; drumNumber: number } | null;
}

interface CellTarget {
  numberCell: number;
  columnNumber: number;
  drumNumber: number;
}

const FRAMES = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9, frame10, frame11, frame12, frame13, frame14, frame15, frame16, frame17, frame18, frame19, frame20, frame21, frame22, frame23, frame24, frame25, frame26, frame27, frame28, frame29, frame30, frame31];
const FRAMES2 = [frame2_1, frame2_2, frame2_3, frame2_4, frame2_5, frame2_6, frame2_7, frame2_8, frame2_9, frame2_10, frame2_11, frame2_12, frame2_13, frame2_14, frame2_15, frame2_16, frame2_17, frame2_18, frame2_19, frame2_20, frame2_21, frame2_22, frame2_23, frame2_24, frame2_25, frame2_26, frame2_27, frame2_28, frame2_29, frame2_30, frame2_31];
const ANIMATION_DURATION = 1000; const FRAMES_COUNT = 31; const FRAME_INTERVAL = ANIMATION_DURATION / FRAMES_COUNT;
const WING_WIDTH = 77; const WING_HEIGHT = 21; const WING_HEIGHT_DOUBLE = 42; const WING_TOP_START = 40; const WING_LEFT = 25;
const TOGGLES_COUNT = 18; const MAX_DRUMS = 2;
const SUPPORTED_CELL_TYPE = 'drum'; const SUPPORTED_TOTAL_DRUMS = 2; const SUPPORTED_TOTAL_ROWS = 18;

const DOC_COLUMNS = [
  { key: 'numberCell', label: 'Номер ячейки' },
  { key: 'cellAssignmentName', label: 'Назначение ячейки' },
  { key: 'materialName', label: 'Номенклатура в ячейке' },
  { key: 'materialArticle', label: 'Артикул' },
  { key: 'quantity', label: 'Количество' },
  { key: 'usage', label: 'Использование' },
];

const DISTRIBUTION_WIDTH = 447;
const DISTRIBUTION_ITEMS_MATERIAL: { key: string; label: string; labelLine2?: string; color: string }[] = [
  { key: 'ТМЦ', label: 'ТМЦ', color: '#0095FF' },
  { key: 'Возврат брака ТМЦ', label: 'Брак ТМЦ', color: '#FF1F4F' },
  { key: 'Инструмент на переточку', label: 'Переточка', color: '#AA69DB' },
  { key: 'Лом', label: 'Лом', color: '#272727' },
];
const DISTRIBUTION_ITEMS_SGD: { key: string; label: string; labelLine2?: string; color: string }[] = [
  { key: 'Готовая деталь (контроль качества пройден)', label: 'Готовая деталь', labelLine2: '(пройден)', color: '#07E098' },
  { key: 'Готовая деталь (с производства)', label: 'Готовая деталь', labelLine2: '(с производства)', color: '#FBC923' },
  { key: 'Готовая деталь (контроль качества не пройден)', label: 'Готовая деталь', labelLine2: '(не пройден)', color: '#F66363' },
];

const normalizeCells = (list: CellData[]) =>
  [...list]
    .map(c => ({
      numberCell: c.numberCell ?? null,
      columnNumber: c.columnNumber ?? null,
      drumNumber: c.drumNumber ?? null,
      cellAssignmentUid: c.cellAssignmentUid ?? null,
      materialUid: c.materialUid ?? null,
      quantity: c.quantity ?? null,
      returnToThisCell: c.returnToThisCell ?? false,
      isIndividual: c.isIndividual ?? false,
    }))
    .sort((a, b) => {
      const ak = `${a.drumNumber ?? 0}-${a.columnNumber ?? 0}-${a.numberCell ?? 0}`;
      const bk = `${b.drumNumber ?? 0}-${b.columnNumber ?? 0}-${b.numberCell ?? 0}`;
      return ak.localeCompare(bk);
    });

const SchablonPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const [stationUid, setStationUid] = useState(() => searchParams.get('stationUid') || '');
  const [stationNameParam, setStationNameParam] = useState(() => searchParams.get('stationName') || '');
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);

  const myTabId = useMemo(() => {
    const found = tabs.find(t => {
      const pathOnly = t.path.split('?')[0];
      return pathOnly === `/documents/schablon/${uid}`;
    });
    return found?.id ?? null;
  }, [tabs, uid]);

  const isMyTabActive = myTabId !== null && activeTabId === myTabId;

  const [viewMode, setViewMode] = useState<'graphic' | 'document'>('graphic');
  const [viewModeFading, setViewModeFading] = useState(false);
  const [installFading, setInstallFading] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [countersExpanded, setCountersExpanded] = useState(false);

  const [templateName, setTemplateName] = useState<string>('');
  const [templateNumber, setTemplateNumber] = useState<number | null>(null);
  const [templateDate, setTemplateDate] = useState<string>('');
  const [templateConfigName, setTemplateConfigName] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isStatusLoaded, setIsStatusLoaded] = useState(false);
  const [stationName, setStationName] = useState<string>(stationNameParam || '');
  const [isTmc, setIsTmc] = useState(false); const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false); const [parentUid, setParentUid] = useState<string | null>(null);
  const [activeButtons, setActiveButtons] = useState<number[]>([]);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [totalRows, setTotalRows] = useState(18); const [totalColumns, setTotalColumns] = useState(14);
  const [totalDrums, setTotalDrums] = useState(1); const [selectedDrum, setSelectedDrum] = useState<number>(1);
  const [cellType, setCellType] = useState<'postamat' | 'drum'>('drum');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [modelCells, setModelCells] = useState<ModelCell[]>([]);

  const [savedCells, setSavedCells] = useState<CellData[]>([]);
  const [localCells, setLocalCells] = useState<CellData[]>([]);

  const [currentColumn, setCurrentColumn] = useState<number>(1);
  const [currentDrum, setCurrentDrum] = useState<number>(1);
  const [selectedCellIds, setSelectedCellIds] = useState<Set<number>>(new Set());
  const [clearSelectionSignal, setClearSelectionSignal] = useState<number>(0);

  const [isClearPopupOpen, setIsClearPopupOpen] = useState(false);
  const [isCellPopupOpen, setIsCellPopupOpen] = useState(false);
  const [cellPopupReadOnly, setCellPopupReadOnly] = useState(false);
  const [cellPopupData, setCellPopupData] = useState<{
    id: number;
    column: number;
    drum: number;
    cellData: CellData | null;
    targetCells: CellTarget[];
  }>({ id: 0, column: 1, drum: 1, cellData: null, targetCells: [] });
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAs, setIsSavingAs] = useState(false);
  const [isStationSelectOpen, setIsStationSelectOpen] = useState(false);

  const [expanded, setExpanded] = useState<'search' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [typeFilterSet, setTypeFilterSet] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [docSelectedIds, setDocSelectedIds] = useState<Set<string>>(new Set());
  const [docContextMenu, setDocContextMenu] = useState<{ x: number; y: number; uid: string; target: CellTarget | null; cellData: CellData | null } | null>(null);

  const isAnyPopupOpen = isClearPopupOpen || isCellPopupOpen || isSaveAsOpen || showCloseConfirm || isStationSelectOpen;
  const prevSelectedIdsRef = useRef<Set<number>>(new Set());
  const isVisualizationSupported = configLoaded && cellType === SUPPORTED_CELL_TYPE && totalDrums === SUPPORTED_TOTAL_DRUMS && totalRows === SUPPORTED_TOTAL_ROWS;
  const totalWings = MAX_DRUMS * TOGGLES_COUNT;

  const stationFilter = useMemo(() => {
    const needTmc = localCells.some(c => c.cellAssignmentTypeName === 'ТМЦ');
    const needSgd = localCells.some(c => c.cellAssignmentTypeName === 'Готовая деталь');
    return { needTmc, needSgd };
  }, [localCells]);

  const isDirty = React.useMemo(() => {
    return JSON.stringify(normalizeCells(localCells)) !== JSON.stringify(normalizeCells(savedCells));
  }, [localCells, savedCells]);

  const statusType: 'new' | 'changed' | 'saved' = React.useMemo(() => {
    if (savedCells.length === 0) return 'new';
    if (isDirty) return 'changed';
    return 'saved';
  }, [savedCells, isDirty]);

  const statusIcon = statusType === 'new' ? StatusIcon93Red : statusType === 'changed' ? StatusIcon107Orange : StatusIcon104Blue;
  const statusWidth = statusType === 'new' ? 93 : statusType === 'changed' ? 107 : 104;

  useEffect(() => {
    setProgressStep(savedCells.length === 0 ? 0 : 1);
  }, [savedCells]);

  const [currentFrameArr, setCurrentFrameArr] = useState<number[]>(Array(totalWings).fill(0));
  const [isWingOpenArr, setIsWingOpenArr] = useState<boolean[]>(Array(totalWings).fill(false));
  const isAnimatingRef = useRef<boolean[]>(Array(totalWings).fill(false));
  const currentFrameRef = useRef<number[]>(Array(totalWings).fill(0));
  const animationFrameRef = useRef<(number | null)[]>(Array(totalWings).fill(null));
  const lastFrameTimeRef = useRef<(number | null)[]>(Array(totalWings).fill(null));
  const directionRef = useRef<('open' | 'close')[]>(Array(totalWings).fill('open'));
  const LAST_FRAME_INDEX = FRAMES_COUNT - 1;
  const getWingIndex = (drumIndex: number, cellIndex: number) => drumIndex * TOGGLES_COUNT + cellIndex;

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

  const handleSelectionChange = useCallback((ids: Set<number>) => {
    setSelectedCellIds(ids);
    const prevIds = prevSelectedIdsRef.current;
    const findCell = (rowId: number) => modelCells.find(mc => mc.row === rowId && mc.drum === selectedDrum && !mc.deleted);
    prevIds.forEach(id => {
      if (!ids.has(id)) {
        const mc = findCell(id);
        if (mc && mc.drum != null) {
          const wingIndex = getWingIndex(mc.drum - 1, mc.row - 1);
          if (mc.drum - 1 < MAX_DRUMS && mc.row - 1 < TOGGLES_COUNT) {
            setIsWingOpenArr(prev => { const copy = [...prev]; copy[wingIndex] = false; return copy; });
            startWingAnimation(wingIndex, false);
          }
        }
      }
    });
    ids.forEach(id => {
      if (!prevIds.has(id)) {
        const mc = findCell(id);
        if (mc && mc.drum != null) {
          const wingIndex = getWingIndex(mc.drum - 1, mc.row - 1);
          if (mc.drum - 1 < MAX_DRUMS && mc.row - 1 < TOGGLES_COUNT) {
            setIsWingOpenArr(prev => { const copy = [...prev]; copy[wingIndex] = true; return copy; });
            startWingAnimation(wingIndex, true);
          }
        }
      }
    });
    prevSelectedIdsRef.current = new Set(ids);
  }, [modelCells, selectedDrum, startWingAnimation]);

  const handleContextChange = useCallback((col: number, drum: number) => {
    setCurrentColumn(col);
    setCurrentDrum(drum);
  }, []);

  const handleWingClick = useCallback((wingIndex: number) => {
    const isOpen = isWingOpenArr[wingIndex];
    setIsWingOpenArr(prev => { const copy = [...prev]; copy[wingIndex] = !copy[wingIndex]; return copy; });
    startWingAnimation(wingIndex, !isOpen);
  }, [isWingOpenArr, startWingAnimation]);

  useEffect(() => { return () => { animationFrameRef.current.forEach(frame => { if (frame !== null) cancelAnimationFrame(frame); }); }; }, []);

  const IMAGE_WIDTH = 287; const IMAGE_HEIGHT = 438; const BLOCK_WIDTH = 507; const BLOCK_HEIGHT = 560;
  const imageLeft = (BLOCK_WIDTH - IMAGE_WIDTH) / 2; const imageTop = 101;

  const fetchData = useCallback(async () => {
    if (!uid) return;
    try {
      const templateRes = await AxiosService.get(ConstantInfo.restApiTemplate(uid));
      const templateData = templateRes.data;
      setTemplateName(templateData.name || '');
      setTemplateNumber(templateData.number);
      setTemplateDate(templateData.createdAt || '');
      setTemplateConfigName(templateData.configurationName || '');

      let loadedCells: CellData[] = [];
      try {
        const cellsRes = await AxiosService.get(ConstantInfo.restApiTemplateCells(uid));
        loadedCells = cellsRes.data || [];
        setSavedCells(loadedCells);
        setLocalCells(loadedCells);
      } catch (e) { console.error('Ошибка загрузки ячеек:', e); }

      if (templateData.configurationUid) {
        try {
          const configRes = await AxiosService.get(ConstantInfo.restApiStationConfiguration(templateData.configurationUid));
          const configData = configRes.data;
          if (configData.cellsStructure) {
            const structure = JSON.parse(configData.cellsStructure);
            setCellType(structure.type || 'drum');
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
          setConfigLoaded(true);
        } catch (e) { console.error('Ошибка загрузки конфигурации:', e); setConfigLoaded(true); }
      } else setConfigLoaded(true);

      if (stationUid) {
        const stationRes = await AxiosService.get(`/api/stations/static/${stationUid}`);
        const stationData = stationRes.data;
        if (!stationNameParam) {
          setStationName(stationData?.name || stationUid);
          setStationNameParam(stationData?.name || stationUid);
        }
        setIsTmc(stationData?.isTmc || false); setIsSgd(stationData?.isSgd || false); setIsOk(stationData?.isOk || false); setParentUid(stationData?.parentUid || null);
        setIsActive(!!(stationData?.activeTemplateUid && String(stationData.activeTemplateUid) === String(uid)));
      } else {
        const stationsRes = await AxiosService.get(ConstantInfo.restApiTemplateStations(uid));
        setIsActive((stationsRes.data || []).length > 0);
      }
      setIsStatusLoaded(true);
    } catch (error) { console.error('Ошибка загрузки данных:', error); setIsStatusLoaded(true); setConfigLoaded(true); }
  }, [uid, stationUid, stationNameParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (expanded === 'search' && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [expanded]);

  useEffect(() => {
    if (!docContextMenu) return;
    const handler = () => setDocContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [docContextMenu]);

  const handleToggleActive = async () => {
    if (!uid) return;
    if (isDirty) return;
    if (installFading) return;

    if (!stationUid) {
      setIsStationSelectOpen(true);
      return;
    }

    setInstallFading(true);
    await new Promise(r => setTimeout(r, 120));

    try {
      const wasActive = isActive;
      await AxiosService.put(`/api/stations/${stationUid}`, { activeTemplateUid: isActive ? null : uid });

      if (wasActive) {
        setStationUid('');
        setStationName('');
        setStationNameParam('');
        setIsActive(false);
        setIsTmc(false);
        setIsSgd(false);
        setIsOk(false);
        setParentUid(null);

        if (activeTabId) {
          replaceTab(activeTabId, `/documents/schablon/${uid}`, `Шаблон - ${templateName}`, <SchablonPage />);
        }
      } else {
        await fetchData();
      }
    } catch (error) { console.error('Ошибка переключения шаблона:', error); }

    await new Promise(r => setTimeout(r, 220));
    setInstallFading(false);
  };

  const handleStationSelect = async (selectedStationUid: string, selectedStationName: string) => {
    if (!uid) return;
    if (isDirty) return;
    if (installFading) return;

    setIsStationSelectOpen(false);
    setInstallFading(true);
    await new Promise(r => setTimeout(r, 120));

    try {
      await AxiosService.put(`/api/stations/${selectedStationUid}`, { activeTemplateUid: uid });
      setStationUid(selectedStationUid);
      setStationNameParam(selectedStationName);
      setStationName(selectedStationName);
      setIsActive(true);

      if (activeTabId) {
        const newPath = `/documents/schablon/${uid}?stationUid=${selectedStationUid}&stationName=${encodeURIComponent(selectedStationName)}`;
        replaceTab(activeTabId, newPath, `Шаблон - ${templateName}`, <SchablonPage />);
      }
    } catch (error) {
      console.error('Ошибка установки шаблона:', error);
    }

    await new Promise(r => setTimeout(r, 220));
    setInstallFading(false);
  };

  const formatDate = (dateStr: string): string => { if (!dateStr) return ''; try { const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`; } catch { return dateStr; } };

  const title = `Документ: Шаблон (${stationName || templateConfigName || '...'}) №${templateNumber || '—'} от ${formatDate(templateDate)}`;

  const leftBlockTitle = stationUid ? (stationName || 'Станция') : (templateConfigName || 'Без конфигурации');

  const handleCloseClearPopup = useCallback(() => {
    setIsClearPopupOpen(false);
    setActiveButtons(prev => prev.filter(i => i !== 2));
  }, []);

  const handleClearAll = useCallback(() => {
    setLocalCells([]);
    setSelectedCellIds(new Set());
    setClearSelectionSignal(prev => prev + 1);
    setIsClearPopupOpen(false);
    setActiveButtons(prev => prev.filter(i => i !== 2));
  }, []);

  const handleClearSelected = useCallback(() => {
    if (selectedCellIds.size === 0) return;
    setLocalCells(prev => prev.filter(c =>
      !(selectedCellIds.has(c.numberCell ?? -1)
        && c.columnNumber === currentColumn
        && (c.drumNumber ?? 0) === currentDrum)
    ));
    setSelectedCellIds(new Set());
    setClearSelectionSignal(prev => prev + 1);
    setIsClearPopupOpen(false);
    setActiveButtons(prev => prev.filter(i => i !== 2));
  }, [selectedCellIds, currentColumn, currentDrum]);

  const handleClose = () => {
    if (isDirty) { setShowCloseConfirm(true); return; }
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) closeTab(currentTab.id);
  };

  const handleCloseWithoutSaving = () => {
    setShowCloseConfirm(false);
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) closeTab(currentTab.id);
  };

  const handleButtonClick = (index: number) => {
    if (index === 2) { isClearPopupOpen ? handleCloseClearPopup() : (setIsClearPopupOpen(true), setActiveButtons(prev => prev.includes(index) ? prev : [...prev, index])); return; }
    setActiveButtons(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const handleDrumChange = useCallback((drum: number) => { if (drum === selectedDrum) return; setSelectedDrum(drum); setDocSelectedIds(new Set()); }, [selectedDrum]);

  const buildTargets = useCallback((fallbackRowId: number, column: number, drum: number): CellTarget[] => {
    if (selectedCellIds.size > 1) {
      return Array.from(selectedCellIds).map(rowId => ({
        numberCell: rowId,
        columnNumber: column,
        drumNumber: drum,
      }));
    }
    return [{ numberCell: fallbackRowId, columnNumber: column, drumNumber: drum }];
  }, [selectedCellIds]);

  const handleCellDoubleClick = useCallback((id: number, column: number, _selectedIds: Set<number>) => {
    const cd = localCells.find(c => c.numberCell === id && c.columnNumber === column && (c.drumNumber == null || c.drumNumber === selectedDrum));
    setCellPopupReadOnly(false);
    setCellPopupData({
      id, column, drum: selectedDrum,
      cellData: cd || null,
      targetCells: buildTargets(id, column, selectedDrum),
    });
    setIsCellPopupOpen(true);
  }, [localCells, selectedDrum, buildTargets]);

  const handleOpenDetails = useCallback((rowId: number, column: number, cellData?: CellData) => {
    setCellPopupReadOnly(false);
    setCellPopupData({
      id: rowId, column, drum: selectedDrum,
      cellData: cellData || null,
      targetCells: buildTargets(rowId, column, selectedDrum),
    });
    setIsCellPopupOpen(true);
  }, [selectedDrum, buildTargets]);

  const handleOpenView = useCallback((rowId: number, column: number, cellData?: CellData) => {
    const cd = cellData || localCells.find(c =>
      c.numberCell === rowId &&
      c.columnNumber === column &&
      (c.drumNumber == null || c.drumNumber === selectedDrum)
    ) || null;
    if (!cd) return;
    setCellPopupReadOnly(true);
    setCellPopupData({
      id: rowId, column, drum: selectedDrum,
      cellData: cd,
      targetCells: [],
    });
    setIsCellPopupOpen(true);
  }, [localCells, selectedDrum]);

  const handleCellUpdate = useCallback((updated: CellData | null, key: { numberCell: number; columnNumber: number; drumNumber: number }) => {
    setLocalCells(prev => {
      const idx = prev.findIndex(c => c.numberCell === key.numberCell && c.columnNumber === key.columnNumber && (c.drumNumber ?? 0) === (key.drumNumber ?? 0));
      const next = [...prev];
      if (updated === null) {
        if (idx >= 0) next.splice(idx, 1);
      } else {
        if (idx >= 0) next[idx] = { ...next[idx], ...updated, numberCell: key.numberCell, columnNumber: key.columnNumber, drumNumber: key.drumNumber };
        else next.push({ ...updated, numberCell: key.numberCell, columnNumber: key.columnNumber, drumNumber: key.drumNumber });
      }
      return next;
    });
  }, []);

  const handleLocalClear = useCallback((rowId: number, column: number, drum: number) => {
    setLocalCells(prev => prev.filter(c =>
      !(c.numberCell === rowId && c.columnNumber === column && (c.drumNumber ?? 0) === drum)
    ));
    setSelectedCellIds(new Set());
    setClearSelectionSignal(prev => prev + 1);
  }, []);

  const buildBatchPayload = () => ({
    cells: localCells
      .filter(c => c.cellAssignmentUid || c.materialUid)
      .map(c => ({
        numberCell: c.numberCell ?? null,
        columnNumber: c.columnNumber ?? null,
        drumNumber: c.drumNumber ?? null,
        cellAssignmentUid: c.cellAssignmentUid ?? null,
        materialUid: c.materialUid ?? null,
        quantity: c.quantity ?? null,
        returnToThisCell: c.returnToThisCell ?? false,
        isIndividual: c.isIndividual ?? false,
      })),
  });

  const handleSave = async (): Promise<boolean> => {
    if (!uid || isSaving) return false;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiTemplateCellsBatchSave(uid), buildBatchPayload());
      const cellsRes = await AxiosService.get(ConstantInfo.restApiTemplateCells(uid));
      const fresh = cellsRes.data || [];
      setSavedCells(fresh);
      setLocalCells(fresh);
      return true;
    } catch (e) {
      console.error('Ошибка сохранения ячеек:', e);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async (name: string, categoryId: number | null): Promise<boolean> => {
    if (!uid || isSavingAs) return false;
    setIsSavingAs(true);
    try {
      const res = await AxiosService.post(ConstantInfo.restApiTemplateCopy, {
        sourceTemplateUid: uid,
        targetCategoryId: categoryId,
        name: name,
      });
      const newUid = res.data.uid;
      await AxiosService.post(ConstantInfo.restApiTemplateCellsBatchSave(newUid), buildBatchPayload());
      if (activeTabId) {
        const newPath = `/documents/schablon/${newUid}${stationUid ? `?stationUid=${stationUid}&stationName=${encodeURIComponent(stationName)}` : ''}`;
        replaceTab(activeTabId, newPath, `Шаблон - ${name}`, <SchablonPage />);
      }
      setIsSaveAsOpen(false);
      return true;
    } catch (e) {
      console.error('Ошибка создания копии:', e);
      return false;
    } finally {
      setIsSavingAs(false);
    }
  };

  const statusIcons: string[] = [];
  if (isTmc) statusIcons.push(TMC); if (isSgd) statusIcons.push(SGD); if (isOk) statusIcons.push(OK); if (parentUid) statusIcons.push(CHAIN);

  const bottomButtonStyle: React.CSSProperties = { height: '50px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700 };
  const activeCells = modelCells.filter(c => !c.deleted);
  const totalActiveCells = activeCells.length;
  const displayDrums = Math.min(totalDrums, MAX_DRUMS);

  const filledCellsCount = useMemo(() => localCells.filter(c => c.materialUid).length, [localCells]);
  const freeCellsCount = Math.max(0, totalActiveCells - filledCellsCount);
  const filledPercent = totalActiveCells > 0 ? Math.round((filledCellsCount / totalActiveCells) * 100) : 0;

  const buildDistribution = (items: typeof DISTRIBUTION_ITEMS_MATERIAL) => {
    const counts = items.map(item => ({
      ...item,
      count: localCells.filter(c => c.cellAssignmentName === item.key).length,
    }));
    const total = counts.reduce((s, i) => s + i.count, 0);
    const visible = counts.filter(i => i.count > 0);
    let accWidth = 0;
    const segsWithWidth = visible.map((s, idx) => {
      let w;
      if (idx === visible.length - 1) {
        w = DISTRIBUTION_WIDTH - accWidth;
      } else {
        w = Math.round((s.count / total) * DISTRIBUTION_WIDTH);
        accWidth += w;
      }
      return { ...s, width: w };
    });
    const barWidth = total > 0 ? segsWithWidth.reduce((sum, s) => sum + s.width, 0) : 0;
    return { segsWithWidth, barWidth, total };
  };

  const distributionMaterial = useMemo(() => buildDistribution(DISTRIBUTION_ITEMS_MATERIAL), [localCells]);
  const distributionSgd = useMemo(() => buildDistribution(DISTRIBUTION_ITEMS_SGD), [localCells]);

  const getWingLayout = useCallback((): { heights: Map<number, number>; hidden: Set<number> } => {
    const heights = new Map<number, number>(); const hidden = new Set<number>();
    if (!isVisualizationSupported) return { heights, hidden };
    for (let d = 0; d < displayDrums; d++) for (let c = 0; c < TOGGLES_COUNT; c++) heights.set(getWingIndex(d, c), WING_HEIGHT);
    activeCells.forEach(mc => {
      if (mc.drum == null) return;
      const drumIndex = mc.drum - 1; if (drumIndex >= displayDrums) return;
      if (mc.rowSpan >= 2 && mc.row >= 1) {
        heights.set(getWingIndex(drumIndex, mc.row - 1), WING_HEIGHT_DOUBLE);
        if (mc.row < TOGGLES_COUNT) hidden.add(getWingIndex(drumIndex, mc.row));
      }
    });
    return { heights, hidden };
  }, [isVisualizationSupported, activeCells, displayDrums]);

  const wingLayout = getWingLayout();

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
        <img src={imageSrc} alt={`wing d${drumIndex} c${cellIndex}`} draggable={false}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', userSelect: 'none', objectFit: 'fill' }} />
      </div>
    );
  };

  const canSave = isDirty && !isSaving && !isSavingAs;
  const canSaveAs = isDirty && !isSaving && !isSavingAs;
  const canToggleActive = !isDirty && !isSaving && !isSavingAs;

  const getOtherQuantityForMaterial = useCallback((materialUid: string, excludeKey?: { numberCell: number; columnNumber: number; drumNumber: number }) => {
    if (!materialUid) return 0;
    return localCells.reduce((sum, c) => {
      if (c.materialUid !== materialUid) return sum;
      if (excludeKey
        && c.numberCell === excludeKey.numberCell
        && c.columnNumber === excludeKey.columnNumber
        && (c.drumNumber ?? 0) === (excludeKey.drumNumber ?? 0)
      ) return sum;
      return sum + (Number(c.quantity) || 0);
    }, 0);
  }, [localCells]);

  const filteredCells = React.useMemo(() => {
    if (!searchValue.trim() && typeFilterSet.size === 0) return null;
    const q = searchValue.trim().toLowerCase();
    return localCells.filter(c => {
      if (q) {
        const nameMatch = (c.materialName || '').toLowerCase().includes(q);
        const artMatch = (c.materialArticle || '').toLowerCase().includes(q);
        if (!nameMatch && !artMatch) return false;
      }
      if (typeFilterSet.size > 0) {
        const isTmcCell = c.cellAssignmentTypeName === 'ТМЦ';
        const isSgdCell = c.cellAssignmentTypeName === 'Готовая деталь';
        const isNone = !c.cellAssignmentTypeName;
        const matched = (typeFilterSet.has('ТМЦ') && isTmcCell)
          || (typeFilterSet.has('СГД') && isSgdCell)
          || (typeFilterSet.has('НЕ_ЗАДАНО') && isNone);
        if (!matched) return false;
      }
      return true;
    });
  }, [localCells, searchValue, typeFilterSet]);

  const hasActiveFilter = typeFilterSet.size > 0;

  const toggleTypeFilter = (type: string) => {
    setTypeFilterSet(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const clearFilters = () => {
    setTypeFilterSet(new Set());
    setSubmenuOpen(null);
  };

  const TABLE_LEFT = 577;
  const TABLE_WIDTH = 1183;
  const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;

  const BTN_SIZE = 54;
  const BTN_GAP = 20;
  const SIDE_OFFSET = 25;
  const WIDE_W = 411;
  const BLOCK_TOP = 106;
  const TABLE_TOP_GAP = 10;

  const BTN_HEADER = 40;
  const BTN_CLEAR = 44;
  const TOP_PAD = 20;
  const BOTTOM_PAD = 20;
  const TEXT_HEIGHT = 18;
  const ITEM_GAP = 20;
  const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
  const LEFT_OFFSET = 30;
  const SUBMENU_WIDTH = 260;
  const SUBMENU_OFFSET = 3;
  const INDICATOR_LEFT = 15;
  const INDICATOR_WIDTH = 2;
  const INDICATOR_HEIGHT = 22;
  const SUBMENU_LEFT_PAD = 30;
  const SUBMENU_CHECKBOX_WIDTH = 20;
  const SUBMENU_RIGHT_PAD = 20;

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
  const btnPrintRight = TABLE_RIGHT - SIDE_OFFSET;
  const btnDownloadLeft = btnPrintRight - BTN_SIZE;
  const btnPrintLeft = btnDownloadLeft - BTN_GAP - BTN_SIZE;

  const tableTop = BLOCK_TOP + BTN_SIZE + TABLE_TOP_GAP;

  const filterFields = [
    { key: 'type', label: 'По типу' },
    { key: 'kuo', label: 'КУО' },
  ];

  const filterListHeight = TOP_PAD + filterFields.length * TEXT_HEIGHT + (filterFields.length - 1) * ITEM_GAP + BOTTOM_PAD;

  const getSubmenuOptions = (key: string): { uid: string; name: string }[] => {
    if (key === 'type') return [
      { uid: 'ТМЦ', name: 'ТМЦ' },
      { uid: 'СГД', name: 'СГД' },
      { uid: 'НЕ_ЗАДАНО', name: 'Не задано' },
    ];
    if (key === 'kuo') return [];
    return [];
  };

  const getSubmenuHeight = (key: string): number => {
    const opts = getSubmenuOptions(key);
    if (opts.length === 0) return TOP_PAD + TEXT_HEIGHT + BOTTOM_PAD;
    const h = TOP_PAD + opts.length * TEXT_HEIGHT + (opts.length - 1) * ITEM_GAP + BOTTOM_PAD;
    return Math.min(h, 400);
  };

  const getSubmenuTop = (key: string): number => {
    const idx = filterFields.findIndex(f => f.key === key);
    return idx * ROW_STEP;
  };

  const isOptionChecked = (filterKey: string, optionUid: string): boolean => {
    if (filterKey === 'type') return typeFilterSet.has(optionUid);
    return false;
  };

  const handleCheckOption = (filterKey: string, optionUid: string) => {
    if (filterKey === 'type') toggleTypeFilter(optionUid);
  };

  const documentRows: DocumentRow[] = useMemo(() => {
    const rows: DocumentRow[] = [];
    const d = selectedDrum;
    for (let col = 1; col <= totalColumns; col++) {
      const cellsInCol = modelCells
        .filter(mc => !mc.deleted && mc.column === col && (mc.drum == null || mc.drum === d))
        .sort((a, b) => a.row - b.row);

      const rowsToUse = cellsInCol.length > 0
        ? cellsInCol.map(mc => mc.row)
        : Array.from({ length: totalRows }, (_, i) => i + 1);

      rowsToUse.forEach(rowNum => {
        const cd = localCells.find(c =>
          c.numberCell === rowNum &&
          c.columnNumber === col &&
          (c.drumNumber == null || c.drumNumber === d)
        ) || null;

        const numberCell = `${col}-${rowNum}`;
        const hasMaterial = !!cd?.materialUid;
        const usage = hasMaterial
          ? (cd?.cellAssignmentTypeName === 'Готовая деталь' ? 'Готовая деталь'
            : (cd?.returnToThisCell ? 'Многоразовое' : 'Одноразовое'))
          : '—';

        rows.push({
          uid: cd?.uid || `${d}-${col}-${rowNum}`,
          numberCell,
          cellAssignmentName: cd?.cellAssignmentName || '—',
          materialName: cd?.materialName || '—',
          materialArticle: hasMaterial ? (cd?.materialArticle || '—') : '—',
          quantity: hasMaterial && cd?.quantity != null ? String(cd.quantity) : '—',
          usage,
          _cellData: cd,
          _target: { numberCell: rowNum, columnNumber: col, drumNumber: d },
        });
      });
    }
    return rows;
  }, [modelCells, localCells, totalColumns, totalRows, selectedDrum]);

  const accountingLabel = useMemo(() => {
    const parts: string[] = [];
    if (isTmc) parts.push('ТМЦ');
    if (isSgd) parts.push('СГД');
    if (isOk) parts.push('ОК');
    return parts.length > 0 ? parts.join(' - ') : '';
  }, [isTmc, isSgd, isOk]);

  const handleDocumentRowDoubleClick = (uid: string) => {
    const row = documentRows.find(r => r.uid === uid);
    if (!row || !row._target) return;
    handleOpenDetails(row._target.numberCell, row._target.columnNumber, row._cellData || undefined);
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
    const allSelected = documentRows.length > 0 && documentRows.every(r => docSelectedIds.has(r.uid));
    if (allSelected) setDocSelectedIds(new Set());
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

  const handleDocContextMenu = (e: React.MouseEvent, uid: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    const row = documentRows.find(r => r.uid === uid);
    if (!row || !row._target) return;
    setDocContextMenu({ x: e.clientX, y: e.clientY, uid, target: row._target, cellData: row._cellData });
  };

  const handleDocContextOpenDetails = () => {
    if (!docContextMenu) return;

    if (docSelectedIds.size > 1) {
      const targets: CellTarget[] = [];
      documentRows.forEach(r => {
        if (docSelectedIds.has(r.uid) && r._target) targets.push(r._target);
      });
      if (targets.length === 0) { setDocContextMenu(null); return; }
      setCellPopupReadOnly(false);
      setCellPopupData({
        id: targets[0].numberCell,
        column: targets[0].columnNumber,
        drum: targets[0].drumNumber,
        cellData: docContextMenu.cellData,
        targetCells: targets,
      });
      setIsCellPopupOpen(true);
      setDocContextMenu(null);
      return;
    }

    if (!docContextMenu.target) return;
    const t = docContextMenu.target;
    const cd = docContextMenu.cellData || localCells.find(c =>
      c.numberCell === t.numberCell && c.columnNumber === t.columnNumber && (c.drumNumber ?? 0) === t.drumNumber
    ) || null;
    setCellPopupReadOnly(false);
    setCellPopupData({
      id: t.numberCell,
      column: t.columnNumber,
      drum: t.drumNumber,
      cellData: cd,
      targetCells: [{ numberCell: t.numberCell, columnNumber: t.columnNumber, drumNumber: t.drumNumber }],
    });
    setIsCellPopupOpen(true);
    setDocContextMenu(null);
  };

  const handleDocContextClear = () => {
    if (!docContextMenu) return;

    if (docSelectedIds.size > 1) {
      setLocalCells(prev => prev.filter(c => {
        const uid = `${c.drumNumber ?? 0}-${c.columnNumber ?? 0}-${c.numberCell ?? 0}`;
        return !docSelectedIds.has(uid);
      }));
      setDocSelectedIds(new Set());
    } else if (docContextMenu.target) {
      const t = docContextMenu.target;
      handleLocalClear(t.numberCell, t.columnNumber, t.drumNumber);
    }
    setDocContextMenu(null);
  };

  const handleDocContextView = () => {
    if (!docContextMenu || !docContextMenu.target) return;
    if (docSelectedIds.size > 1) { setDocContextMenu(null); return; }
    const t = docContextMenu.target;
    const cd = docContextMenu.cellData || localCells.find(c =>
      c.numberCell === t.numberCell && c.columnNumber === t.columnNumber && (c.drumNumber ?? 0) === t.drumNumber
    ) || null;
    if (!cd) { setDocContextMenu(null); return; }
    setCellPopupReadOnly(true);
    setCellPopupData({
      id: t.numberCell,
      column: t.columnNumber,
      drum: t.drumNumber,
      cellData: cd,
      targetCells: [],
    });
    setIsCellPopupOpen(true);
    setDocContextMenu(null);
  };

  const documentRenderCell = (key: string, item: DocumentRow): string => {
    const val = (item as any)[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const docVisibleColumns = ['numberCell', 'cellAssignmentName', 'materialName', 'materialArticle', 'quantity', 'usage'];

  const renderDistributionBlock = (
    top: number,
    title: string,
    data: { segsWithWidth: any[]; barWidth: number; total: number },
    items: typeof DISTRIBUTION_ITEMS_MATERIAL,
  ) => {
    const isEmpty = data.total === 0;
    const displayBarWidth = isEmpty ? DISTRIBUTION_WIDTH : data.barWidth;
    const barCenterLeft = (507 - displayBarWidth) / 2;
    const barTop = top + 17 + 36;
    const legendTop = barTop + 4 + 17;
    const LEGEND_HEIGHT = 20;

    return (
      <>
        <div style={{ position: 'absolute', top, left: 0, right: 0, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
          {title}
        </div>

        {isEmpty ? (
          <>
            <div style={{ position: 'absolute', top: barTop, left: barCenterLeft, width: displayBarWidth, height: 4, borderRadius: 2, backgroundColor: '#E6E8F8' }} />
            <div style={{ position: 'absolute', top: barTop - 1 - 17, left: barCenterLeft + displayBarWidth / 2, transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.5)', lineHeight: '17px' }}>
              0
            </div>
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', top: barTop, left: barCenterLeft, width: displayBarWidth, height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
              {data.segsWithWidth.map((s: any) => (
                <div key={s.key} style={{ width: s.width, height: '100%', backgroundColor: s.color }} />
              ))}
            </div>

            {(() => {
              let xAcc = barCenterLeft;
              return data.segsWithWidth.map((s: any) => {
                const centerX = xAcc + s.width / 2;
                xAcc += s.width;
                return (
                  <div
                    key={`num-${s.key}`}
                    style={{
                      position: 'absolute',
                      top: barTop - 1 - 17,
                      left: centerX,
                      transform: 'translateX(-50%)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: 400,
                      color: 'rgba(45, 64, 89, 0.5)',
                      lineHeight: '17px',
                    }}
                  >
                    {s.count}
                  </div>
                );
              });
            })()}
          </>
        )}

        <div style={{ position: 'absolute', top: legendTop, left: 0, right: 0, height: LEGEND_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: LEGEND_HEIGHT }}>
            {items.map((item, idx) => (
              <React.Fragment key={item.key}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                <div style={{ marginLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#96A5B8', lineHeight: '12px', textAlign: 'center' }}>
                  <span>{item.label}</span>
                  {item.labelLine2 ? <span>{item.labelLine2}</span> : null}
                </div>
                {idx < items.length - 1 && (
                  <div style={{ width: 1, height: LEGEND_HEIGHT, backgroundColor: 'rgba(45, 64, 89, 0.31)', marginLeft: 15, marginRight: 15, flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </>
    );
  };

  const SECTION_4_TOP = 14 + 18 + 24 + 17 + 22 + 17 + 43;
  const SECTION_4_LEGEND_TOP = SECTION_4_TOP + 17 + 36 + 4 + 17;
  const SECTION_5_TOP = SECTION_4_LEGEND_TOP + 20 + 30;

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -200 : 200,
      opacity: 0,
    }),
  };

  const handleToggleViewMode = () => {
    if (viewModeFading) return;
    setViewModeFading(true);
    setTimeout(() => {
      setSlideDirection(viewMode === 'graphic' ? 'left' : 'right');
      setViewMode(prev => prev === 'graphic' ? 'document' : 'graphic');
      setTimeout(() => setViewModeFading(false), 220);
    }, 120);
  };

  const clearButtonDisabled = selectedCellIds.size < 1;

  const docBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  };

  const docViewDisabled = docSelectedIds.size > 1;

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, display: 'flex', alignItems: 'center', gap: 25, zIndex: 2 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{title}</h1>
        <img src={statusIcon} alt="" style={{ width: statusWidth, height: 29, flexShrink: 0 }} />
        {isStatusLoaded && (
          <img
            src={isActive ? InstallationIcon124Green : InstallationIcon145Red}
            alt=""
            style={{ width: isActive ? 124 : 145, height: 29, flexShrink: 0 }}
          />
        )}
      </div>

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
                  <div style={{ width: '477px', height: '71px', marginLeft: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SchablonProgressBar currentStep={progressStep} /></div>
                  <div style={{ width: `${BLOCK_WIDTH}px`, height: `${BLOCK_HEIGHT}px`, marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                    {leftBlockTitle && <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '19px', lineHeight: '23px', color: '#2D4059', textAlign: 'center', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leftBlockTitle}</div>}
                    {statusIcons.length > 0 && <div style={{ position: 'absolute', top: leftBlockTitle ? '66px' : '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>{statusIcons.map((icon, index) => <img key={index} src={icon} alt="" style={{ width: '35px', height: '20px' }} />)}</div>}
                    {isVisualizationSupported ? <div style={{ position: 'absolute', left: `${imageLeft}px`, top: `${imageTop}px`, width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}><img src={StationFull} alt="Station" draggable={false} style={{ width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }} />{Array.from({ length: displayDrums }).map((_, drumIndex) => Array.from({ length: TOGGLES_COUNT }).map((_, cellIndex) => renderWing(drumIndex, cellIndex)))}</div> : configLoaded ? <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: '#9CA3AF', textAlign: 'center', padding: '0 40px' }}>Элементы шаблона не найдены</span></div> : null}
                  </div>
                </div>

                <div style={{ position: 'absolute', top: `${BLOCK_TOP}px`, left: 0, right: 0, height: `${BTN_SIZE}px`, filter: isAnyPopupOpen ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: isAnyPopupOpen ? 'none' : 'auto' }}>

                  <motion.div
                    style={{
                      position: 'absolute', top: 0, height: BTN_SIZE, borderRadius: 15,
                      backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF',
                      border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                      display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      zIndex: expanded === 'search' ? 20 : 5,
                    }}
                    animate={{ left: btnSearchLeft, width: searchWidth }}
                    transition={{ left: SPRING, width: TWEEN }}
                  >
                    <div
                      onClick={() => {
                        if (expanded === 'search') { setExpanded(null); setSearchValue(''); }
                        else { setExpanded('search'); setSubmenuOpen(null); }
                      }}
                      style={{ width: BTN_SIZE, height: BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                    >
                      <img src={expanded === 'search' ? SearchIcon24White : SearchIcon24Black} alt="Поиск" style={{ width: 24, height: 24 }} />
                    </div>
                    <AnimatePresence>
                      {expanded === 'search' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }}
                          exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 16 }}
                        >
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            placeholder="Поиск"
                            style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }}
                          />
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
                      overflow: 'visible',
                      zIndex: expanded === 'filter' ? 25 : 5,
                    }}
                    animate={{
                      left: btnFilterLeft,
                      width: filterWidth,
                      height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : BTN_SIZE,
                    }}
                    transition={{ left: SPRING, width: TWEEN, height: TWEEN }}
                  >
                    <div
                      onClick={() => {
                        if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); }
                        else { setExpanded('filter'); setSearchValue(''); }
                      }}
                      style={{
                        height: expanded === 'filter' ? BTN_HEADER : BTN_SIZE,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent',
                        borderRadius: expanded === 'filter' ? '15px 15px 0 0' : 15,
                        transition: 'height 0.2s ease',
                      }}
                    >
                      {expanded === 'filter'
                        ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                        : <img
                            src={hasActiveFilter ? FilterIcon24White : FilterIcon24Black}
                            alt="Фильтр"
                            style={{ width: 24, height: 24, display: 'block' }}
                          />
                      }
                    </div>

                    <AnimatePresence>
                      {expanded === 'filter' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                          exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                          style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}
                        >
                          <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                            {filterFields.map((field, fieldIdx) => {
                              const isActive = field.key === 'type' ? typeFilterSet.size > 0 : false;
                              return (
                                <div
                                  key={field.key}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setSubmenuOpen(prev => prev === field.key ? null : field.key)}
                                  style={{
                                    height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                    marginBottom: fieldIdx < filterFields.length - 1 ? ITEM_GAP : 0,
                                    paddingLeft: LEFT_OFFSET, position: 'relative',
                                  }}
                                >
                                  <span style={{
                                    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                    color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`,
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
                                  left: filterWidth + SUBMENU_OFFSET,
                                  top: getSubmenuTop(submenuOpen),
                                  width: SUBMENU_WIDTH,
                                  height: getSubmenuHeight(submenuOpen),
                                  backgroundColor: '#FFFFFF',
                                  borderRadius: '0 15px 15px 15px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                  border: '1px solid rgba(102, 110, 254, 0.15)',
                                  zIndex: 30,
                                  overflow: 'hidden',
                                }}
                              >
                                <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 400 }}>
                                  {getSubmenuOptions(submenuOpen).length === 0 ? (
                                    <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Нет данных</span>
                                    </div>
                                  ) : getSubmenuOptions(submenuOpen).map((option, i, arr) => {
                                    const checked = isOptionChecked(submenuOpen, option.uid);
                                    return (
                                      <div
                                        key={option.uid}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleCheckOption(submenuOpen, option.uid)}
                                        style={{
                                          height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                          marginBottom: i < arr.length - 1 ? ITEM_GAP : 0,
                                          paddingLeft: SUBMENU_LEFT_PAD, position: 'relative',
                                        }}
                                      >
                                        {checked && (
                                          <motion.div
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            exit={{ opacity: 0, scaleY: 0 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                              position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2,
                                              width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT,
                                              backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                                            }}
                                          />
                                        )}
                                        <span style={{
                                          fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                          color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`,
                                          maxWidth: SUBMENU_WIDTH - SUBMENU_LEFT_PAD - 20 - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD,
                                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                          {option.name}
                                        </span>
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                          exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                        >
                          <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={clearFilters}
                            style={{
                              width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent',
                              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px',
                              borderRadius: '0 0 15px 15px',
                            }}
                          >
                            Очистить фильтр
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.button
                    onClick={() => { if (!clearButtonDisabled) handleButtonClick(2); }}
                    disabled={clearButtonDisabled}
                    style={{
                      position: 'absolute', top: 0, width: BTN_SIZE, height: BTN_SIZE, borderRadius: 15,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(102, 110, 254, 0.15)',
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
                    style={{
                      position: 'absolute', top: 0, width: WIDE_W, height: BTN_SIZE,
                      borderRadius: 15, backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 15px', boxSizing: 'border-box', zIndex: 5,
                    }}
                    animate={{ left: btnWideLeft }}
                    transition={SPRING}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Шаблон: {templateName || '—'}
                    </span>
                  </motion.div>

                  <button
                    style={{ position: 'absolute', left: btnPrintLeft, top: 0, width: BTN_SIZE, height: BTN_SIZE, borderRadius: 15, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', zIndex: 5 }}
                  >
                    <img src={PrintIcon24Black} alt="Печать" style={{ width: 24, height: 24 }} />
                  </button>

                  <button
                    style={{ position: 'absolute', left: btnDownloadLeft, top: 0, width: BTN_SIZE, height: BTN_SIZE, borderRadius: 15, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', zIndex: 5 }}
                  >
                    <img src={DownloadIcon24Black} alt="Скачать" style={{ width: 24, height: 24 }} />
                  </button>
                </div>

                <div style={{ position: 'absolute', top: `${tableTop}px`, left: `${TABLE_LEFT}px` }}>
                  {configLoaded && (
                    <SchablonTable
                      onSelectionChange={handleSelectionChange}
                      onContextChange={handleContextChange}
                      clearSelectionSignal={clearSelectionSignal}
                      totalRows={totalRows}
                      totalColumns={totalColumns}
                      totalDrums={totalDrums}
                      cellType={cellType}
                      selectedDrum={selectedDrum}
                      onDrumChange={handleDrumChange}
                      onCellDoubleClick={handleCellDoubleClick}
                      isBlurred={isAnyPopupOpen}
                      modelCells={modelCells}
                      cellsData={localCells}
                      filteredCells={filteredCells}
                      highlightText={searchValue}
                      onCellCleared={() => {}}
                      onOpenDetails={handleOpenDetails}
                      onOpenView={handleOpenView}
                      onCellLocalClear={handleLocalClear}
                    />
                  )}
                </div>
              </>
            )}

            {viewMode === 'document' && (
              <>
                <div style={{ position: 'absolute', top: 100, left: 40, width: 1720, height: 142, backgroundColor: '#FFFFFF', borderRadius: 15 }}>
                  <div style={{ position: 'absolute', top: 30, left: 40 }}>
                    <FormField width={340} height={44} label="Код:" value={templateNumber != null ? `${String(templateNumber).padStart(4, '0')}` : ''} type="input" disabled icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + 340 + 50 }}>
                    <FormField width={340} height={44} label="Наименование шаблона:" value={templateName || ''} type="input" disabled icon={NameIcon18Gray} iconActive={NameIcon18Blue} iconWidth={18} iconHeight={18} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + (340 + 50) * 2 }}>
                    <FormField width={340} height={44} label="Станция:" value={stationUid ? (stationName || '') : ''} type="input" disabled icon={StationIcon16Gray} iconActive={StationIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 30, left: 40 + (340 + 50) * 3 }}>
                    <FormField width={340} height={44} label="Вид учёта станции:" value={stationUid ? accountingLabel : ''} type="input" disabled icon={AccountingIcon16Gray} iconActive={AccountingIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
                  </div>
                  <div style={{ position: 'absolute', top: 10, right: 40, width: 80, height: 122, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={StationFull} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }} />
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 100 + 142 + 30, left: 40, width: 1720, height: 40 }}>
                  <div style={{ position: 'absolute', left: 15, top: 0, display: 'flex', gap: 15 }}>
                    <motion.div
                      style={{
                        position: 'relative',
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF',
                        border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        overflow: 'hidden',
                        zIndex: expanded === 'search' ? 20 : 5,
                      }}
                      animate={{ width: searchWidth }}
                      transition={TWEEN}
                    >
                      <div
                        onClick={() => {
                          if (expanded === 'search') { setExpanded(null); setSearchValue(''); }
                          else { setExpanded('search'); setSubmenuOpen(null); }
                        }}
                        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                      >
                        <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="Поиск" style={{ width: 18, height: 18 }} />
                      </div>
                      <AnimatePresence>
                        {expanded === 'search' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.1 } }}
                            exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}
                          >
                            <input
                              ref={searchInputRef}
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
                        position: 'relative',
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        border: expanded === 'filter' || hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
                        boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
                        overflow: 'visible',
                        zIndex: expanded === 'filter' ? 25 : 5,
                      }}
                      animate={{
                        width: filterWidth,
                        height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : 40,
                      }}
                      transition={TWEEN}
                    >
                      <div
                        onClick={() => {
                          if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); }
                          else { setExpanded('filter'); setSearchValue(''); }
                        }}
                        style={{
                          height: expanded === 'filter' ? BTN_HEADER : 40,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent',
                          borderRadius: expanded === 'filter' ? '10px 10px 0 0' : 10,
                          transition: 'height 0.2s ease',
                        }}
                      >
                        {expanded === 'filter'
                          ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                          : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="Фильтр" style={{ width: 18, height: 18, display: 'block' }} />
                        }
                      </div>

                      <AnimatePresence>
                        {expanded === 'filter' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                            exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                            style={{ position: 'relative', height: filterListHeight, overflow: 'visible' }}
                          >
                            <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}>
                              {filterFields.map((field, fieldIdx) => {
                                const isActive = field.key === 'type' ? typeFilterSet.size > 0 : false;
                                return (
                                  <div
                                    key={field.key}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setSubmenuOpen(prev => prev === field.key ? null : field.key)}
                                    style={{
                                      height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                      marginBottom: fieldIdx < filterFields.length - 1 ? ITEM_GAP : 0,
                                      paddingLeft: LEFT_OFFSET, position: 'relative',
                                    }}
                                  >
                                    <span style={{
                                      fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                      color: isActive ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`,
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
                                    left: filterWidth + SUBMENU_OFFSET,
                                    top: getSubmenuTop(submenuOpen),
                                    width: SUBMENU_WIDTH,
                                    height: getSubmenuHeight(submenuOpen),
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '0 15px 15px 15px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    border: '1px solid rgba(102, 110, 254, 0.15)',
                                    zIndex: 30,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 400 }}>
                                    {getSubmenuOptions(submenuOpen).length === 0 ? (
                                      <div style={{ height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: LEFT_OFFSET, paddingRight: 20 }}>
                                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Нет данных</span>
                                      </div>
                                    ) : getSubmenuOptions(submenuOpen).map((option, i, arr) => {
                                      const checked = isOptionChecked(submenuOpen, option.uid);
                                      return (
                                        <div
                                          key={option.uid}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => handleCheckOption(submenuOpen, option.uid)}
                                          style={{
                                            height: TEXT_HEIGHT, display: 'flex', alignItems: 'center', cursor: 'pointer',
                                            marginBottom: i < arr.length - 1 ? ITEM_GAP : 0,
                                            paddingLeft: SUBMENU_LEFT_PAD, position: 'relative',
                                          }}
                                        >
                                          {checked && (
                                            <motion.div
                                              initial={{ opacity: 0, scaleY: 0 }}
                                              animate={{ opacity: 1, scaleY: 1 }}
                                              exit={{ opacity: 0, scaleY: 0 }}
                                              transition={{ duration: 0.15 }}
                                              style={{
                                                position: 'absolute', left: INDICATOR_LEFT, top: (TEXT_HEIGHT - INDICATOR_HEIGHT) / 2,
                                                width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT,
                                                backgroundColor: '#666EFE', borderRadius: 999, zIndex: 1, pointerEvents: 'none',
                                              }}
                                            />
                                          )}
                                          <span style={{
                                            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500,
                                            color: checked ? '#666EFE' : '#2D4059', lineHeight: `${TEXT_HEIGHT}px`,
                                            maxWidth: SUBMENU_WIDTH - SUBMENU_LEFT_PAD - 20 - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                          }}>
                                            {option.name}
                                          </span>
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
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
                            exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
                          >
                            <div style={{ height: 3, backgroundColor: 'transparent', borderTop: '1px solid rgba(45, 64, 89, 0.1)' }} />
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={clearFilters}
                              style={{
                                width: '100%', height: BTN_CLEAR, border: 'none', backgroundColor: 'transparent',
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 13, lineHeight: '18px',
                                borderRadius: '0 0 10px 10px',
                              }}
                            >
                              Очистить фильтр
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {totalDrums > 1 && (
                    <div style={{ position: 'absolute', left: 15 + searchWidth + 15 + filterWidth + 30, top: 0, display: 'flex', gap: 34, height: 40, alignItems: 'center' }}>
                      <div
                        onClick={() => handleDrumChange(1)}
                        style={{
                          cursor: selectedDrum === 1 ? 'default' : 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 15,
                          color: selectedDrum === 1 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                          lineHeight: '18px',
                          position: 'relative',
                          paddingBottom: 8,
                          userSelect: 'none',
                        }}
                      >
                        Левый барабан
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: selectedDrum === 1 ? '#666EFE' : 'rgba(45, 64, 89, 0.06)',
                          transition: 'background-color 0.3s ease',
                        }} />
                      </div>
                      <div
                        onClick={() => handleDrumChange(2)}
                        style={{
                          cursor: selectedDrum === 2 ? 'default' : 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 15,
                          color: selectedDrum === 2 ? '#666EFE' : 'rgba(45, 64, 89, 0.6)',
                          lineHeight: '18px',
                          position: 'relative',
                          paddingBottom: 8,
                          userSelect: 'none',
                        }}
                      >
                        Правый барабан
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: selectedDrum === 2 ? '#666EFE' : 'rgba(45, 64, 89, 0.06)',
                          transition: 'background-color 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ position: 'absolute', right: 15, top: 0, display: 'flex', gap: 15, height: 40 }}>
                    <button style={docBtnStyle} title="Скачать">
                      <img src={DownloadIcon18Black} alt="" style={{ width: 18, height: 18 }} />
                    </button>
                    <button style={docBtnStyle} title="Печать">
                      <img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} />
                    </button>
                    <button style={docBtnStyle} title="История изменений">
                      <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 100 + 142 + 30 + 40 + 12, left: 40, width: 1720, height: 406 }}>
                  <DataTable
                    columns={DOC_COLUMNS}
                    visibleKeys={docVisibleColumns}
                    data={documentRows}
                    selectedIds={docSelectedIds}
                    onCheckboxClick={handleDocCheckboxClick}
                    onSelectAll={handleDocSelectAll}
                    onRowClick={handleDocRowClick}
                    onContextMenu={handleDocContextMenu}
                    onDoubleClick={handleDocumentRowDoubleClick}
                    renderCell={documentRenderCell}
                    isGrayColumn={(key) => key !== 'numberCell' && key !== 'cellAssignmentName' && key !== 'materialName'}
                    tableWidth={1720}
                    rowHeight={58}
                    headerHeight={58}
                    visibleRows={6}
                    fitToWidth
                  />
                </div>

                {docContextMenu && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={() => setDocContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setDocContextMenu(null); }} />
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        left: docContextMenu.x,
                        top: docContextMenu.y,
                        width: 247,
                        height: 134,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 10,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                        zIndex: 2000,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        onClick={handleDocContextOpenDetails}
                        style={{
                          position: 'absolute',
                          top: 20,
                          left: 20,
                          right: 20,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                          <img src={CellIcon16Black} alt="" style={{ width: 16, height: 16 }} />
                        </div>
                        <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
                          Выбрать номенклатуру
                        </span>
                      </div>

                      <div
                        onClick={handleDocContextClear}
                        style={{
                          position: 'absolute',
                          top: 58,
                          left: 20,
                          right: 20,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'transparent' }}>
                          <img src={CleanIcon16Black} alt="" style={{ width: 16, height: 15 }} />
                        </div>
                        <span style={{ marginLeft: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>
                          Очистить
                        </span>
                      </div>

                      <div
                        onClick={docViewDisabled ? undefined : handleDocContextView}
                        style={{
                          position: 'absolute',
                          top: 96,
                          left: 20,
                          right: 20,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: docViewDisabled ? 'not-allowed' : 'pointer',
                          opacity: docViewDisabled ? 0.4 : 1,
                          pointerEvents: docViewDisabled ? 'none' : 'auto',
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
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 40, right: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: 507 }}>
          <motion.div
            onClick={() => setCountersExpanded(v => !v)}
            animate={{ height: countersExpanded ? 398 : 60 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 15, boxShadow: countersExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : 'none', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
          >
            <AnimatePresence>
              {countersExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 60 }}
                >
                  <img src={InfoIcon18Blue} alt="" style={{ position: 'absolute', top: 14, left: 14, width: 18, height: 18 }} />
                  <div style={{ position: 'absolute', top: 14, left: 42, height: 18, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE', lineHeight: '18px' }}>
                    Информация
                  </div>

                  <div style={{ position: 'absolute', top: 14 + 18 + 24, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
                    Всего ячеек в станции
                  </div>
                  <div style={{ position: 'absolute', top: 14 + 18 + 24 - 4, left: 30 + 156 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>
                    {totalActiveCells}
                  </div>

                  <div style={{ position: 'absolute', top: 14 + 18 + 24 + 17 + 22, left: 30, height: 17, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', lineHeight: '17px' }}>
                    Определено ячеек
                  </div>
                  <div style={{ position: 'absolute', top: 14 + 18 + 24 + 17 + 22 + 6, left: 30 + 128 + 42, width: 211, height: 4, borderRadius: 2, backgroundColor: 'rgba(232, 233, 255, 0.8)' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, filledPercent))}%`, height: '100%', borderRadius: 2, backgroundColor: '#666EFE' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 14 + 18 + 24 + 17 + 22 + 6 + 4 + 2, left: 30 + 128 + 42 + 105, transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: 'rgba(45, 64, 89, 0.5)' }}>
                    {filledCellsCount}
                  </div>
                  <div style={{ position: 'absolute', top: 14 + 18 + 24 + 17 + 22 - 4, left: 30 + 128 + 42 + 211 + 15, width: 50, height: 24, borderRadius: 8, border: '1px solid #666EFE', backgroundColor: 'rgba(232, 233, 255, 0.37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#666EFE' }}>
                    {filledPercent}%
                  </div>

                  {renderDistributionBlock(SECTION_4_TOP, 'Распределение по назначениям ячеек (Материал)', distributionMaterial, DISTRIBUTION_ITEMS_MATERIAL)}
                  {renderDistributionBlock(SECTION_5_TOP, 'Распределение по назначениям ячеек (СГД)', distributionSgd, DISTRIBUTION_ITEMS_SGD)}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!countersExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Всего ячеек</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px', marginTop: 2 }}>{totalActiveCells}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Определено ячеек</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px', marginTop: 2 }}>{filledCellsCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', lineHeight: '18px' }}>Свободных ячеек</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', lineHeight: '18px', marginTop: 2 }}>{freeCellsCount}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 30 }}>
          <button
            onClick={handleToggleViewMode}
            style={{ ...bottomButtonStyle, width: viewMode === 'graphic' ? 222 : 254, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', justifyContent: 'flex-start', paddingLeft: 19, transition: 'width 0.2s ease', overflow: 'hidden' }}
          >
            <img src={ShapeIcon24Black} alt="" style={{ width: 24, height: 20, flexShrink: 0, opacity: viewModeFading ? 0 : 1, transition: 'opacity 0.15s ease' }} />
            <span style={{ marginLeft: 17, opacity: viewModeFading ? 0 : 1, transition: 'opacity 0.15s ease', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {viewMode === 'graphic' ? 'Форма документа' : 'Интерактивная форма'}
            </span>
          </button>

          <button
            onClick={canToggleActive ? handleToggleActive : undefined}
            disabled={!canToggleActive}
            style={{ ...bottomButtonStyle, width: isActive && stationUid ? 127 : 168, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canToggleActive ? 1 : 0.35, cursor: canToggleActive ? 'pointer' : 'not-allowed', justifyContent: 'flex-start', paddingLeft: 22, transition: 'width 0.2s ease, opacity 0.2s ease', overflow: 'hidden' }}
          >
            <img src={InstallationIcon20Black} alt="" style={{ width: 20, height: 11, flexShrink: 0, opacity: installFading ? 0 : 1, transition: 'opacity 0.15s ease' }} />
            <span style={{ marginLeft: 15, opacity: installFading ? 0 : 1, transition: 'opacity 0.15s ease', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {stationUid && isActive ? 'Снять' : 'Установить'}
            </span>
          </button>

          <button
            onClick={canSaveAs ? () => setIsSaveAsOpen(true) : undefined}
            disabled={!canSaveAs}
            style={{ ...bottomButtonStyle, width: 182, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canSaveAs ? 1 : 0.35, cursor: canSaveAs ? 'pointer' : 'not-allowed' }}
          >
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSavingAs ? 'Создание...' : 'Записать как'}</span>
          </button>

          <button
            onClick={canSave ? handleSave : undefined}
            disabled={!canSave}
            style={{ ...bottomButtonStyle, width: 153, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', opacity: canSave ? 1 : 0.35, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
          </button>

          <button
            onClick={handleClose}
            style={{ ...bottomButtonStyle, width: 116, backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
          >
            Закрыть
          </button>
        </div>
      </div>

      {isClearPopupOpen && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <ClearPopup
            isOpen={isClearPopupOpen}
            onClose={handleCloseClearPopup}
            onClearAll={handleClearAll}
            onClearSelected={handleClearSelected}
            hasSelection={selectedCellIds.size > 0}
            templateName={templateName}
          />
        </div>
      )}

      {isCellPopupOpen && isMyTabActive && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <CellDetailsPopup
            isOpen={isCellPopupOpen}
            onClose={() => { setIsCellPopupOpen(false); setCellPopupReadOnly(false); }}
            cellId={cellPopupData.id}
            cellName={`Ячейка ${cellPopupData.id}`}
            selectedColumn={cellPopupData.column}
            selectedDrum={cellPopupData.drum}
            cellData={cellPopupData.cellData}
            onSaved={handleCellUpdate}
            stationUid={stationUid || null}
            stationName={stationName || null}
            isTmc={isTmc}
            isSgd={isSgd}
            getOtherQuantityForMaterial={getOtherQuantityForMaterial}
            readOnly={cellPopupReadOnly}
            targetCells={cellPopupData.targetCells}
          />
        </div>
      )}

      <SchablonSaveAsPopup
        isOpen={isSaveAsOpen}
        onClose={() => setIsSaveAsOpen(false)}
        defaultName={`${templateName} (копия)`}
        configurationName={templateConfigName}
        onConfirm={handleSaveAs}
      />

      <CatalogSelectPopup
        isOpen={isStationSelectOpen}
        onClose={() => setIsStationSelectOpen(false)}
        onSelect={(id: string, name: string) => handleStationSelect(id, name)}
        popupType="station"
        filterParam={templateConfigName || undefined}
        stationFilter={stationFilter}
      />

      {showCloseConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCloseConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Есть несохранённые изменения. Что сделать?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canSave && <button onClick={async () => { const ok = await handleSave(); if (ok) handleCloseWithoutSaving(); }} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}
              <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
              <button onClick={() => setShowCloseConfirm(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchablonPage;