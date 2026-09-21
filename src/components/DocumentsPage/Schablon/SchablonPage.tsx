// SchablonPage.tsx — ПОЛНЫЙ ФАЙЛ (canSaveAs зависит от isDirty)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { motion, AnimatePresence } from 'framer-motion';

import Schablon1 from '../../../assets/Schablon/Schablon1.svg';
import Schablon3 from '../../../assets/Schablon/Schablon3.svg';
import Schablon4 from '../../../assets/Schablon/Schablon4.svg';
import Schablon5 from '../../../assets/Schablon/Schablon5.svg';
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
import Iconn3 from '../../../assets/Station/Iconn3.svg';
import Iconkrest from '../../../assets/Schablon/Iconkrest.svg';
import IconW from '../../../assets/Schablon/IconW.svg';
import IconD from '../../../assets/Schablon/IconD.svg';
import IconJ1 from '../../../assets/Schablon/IconJ1.svg';
import IconJ2 from '../../../assets/Schablon/IconJ2.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
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
  uid?: string; numberCell?: number; columnNumber?: number; drumNumber?: number;
  materialUid?: string | null; materialName?: string | null; materialArticle?: string | null;
  quantity?: number | null; typeMainUid?: string | null; typeMainName?: string | null;
  purposeMaterial?: string | null; purposeSgd?: string | null; maxQuantity?: number | null; dimensions?: string | null;
}

const FRAMES = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9, frame10, frame11, frame12, frame13, frame14, frame15, frame16, frame17, frame18, frame19, frame20, frame21, frame22, frame23, frame24, frame25, frame26, frame27, frame28, frame29, frame30, frame31];
const FRAMES2 = [frame2_1, frame2_2, frame2_3, frame2_4, frame2_5, frame2_6, frame2_7, frame2_8, frame2_9, frame2_10, frame2_11, frame2_12, frame2_13, frame2_14, frame2_15, frame2_16, frame2_17, frame2_18, frame2_19, frame2_20, frame2_21, frame2_22, frame2_23, frame2_24, frame2_25, frame2_26, frame2_27, frame2_28, frame2_29, frame2_30, frame2_31];
const ANIMATION_DURATION = 1000; const FRAMES_COUNT = 31; const FRAME_INTERVAL = ANIMATION_DURATION / FRAMES_COUNT;
const WING_WIDTH = 77; const WING_HEIGHT = 21; const WING_HEIGHT_DOUBLE = 42; const WING_TOP_START = 40; const WING_LEFT = 25;
const TOGGLES_COUNT = 18; const MAX_DRUMS = 2;
const SUPPORTED_CELL_TYPE = 'drum'; const SUPPORTED_TOTAL_DRUMS = 2; const SUPPORTED_TOTAL_ROWS = 18;

const normalizeCells = (list: CellData[]) =>
  [...list]
    .map(c => ({
      numberCell: c.numberCell ?? null,
      columnNumber: c.columnNumber ?? null,
      drumNumber: c.drumNumber ?? null,
      materialUid: c.materialUid ?? null,
      quantity: c.quantity ?? null,
      typeMainUid: c.typeMainUid ?? null,
      purposeMaterial: c.purposeMaterial ?? null,
      purposeSgd: c.purposeSgd ?? null,
      maxQuantity: c.maxQuantity ?? null,
      dimensions: c.dimensions ?? null,
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

  const [templateName, setTemplateName] = useState<string>('');
  const [templateNumber, setTemplateNumber] = useState<number | null>(null);
  const [templateDate, setTemplateDate] = useState<string>('');
  const [templateConfigName, setTemplateConfigName] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isStatusLoaded, setIsStatusLoaded] = useState(false);
  const [stationName, setStationName] = useState<string>(stationNameParam || '');
  const [isTmc, setIsTmc] = useState(false); const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false); const [parentUid, setParentUid] = useState<string | null>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [activeButtons, setActiveButtons] = useState<number[]>([]);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [totalRows, setTotalRows] = useState(18); const [totalColumns, setTotalColumns] = useState(14);
  const [totalDrums, setTotalDrums] = useState(1); const [selectedDrum, setSelectedDrum] = useState<number>(1);
  const [cellType, setCellType] = useState<'postamat' | 'drum'>('drum');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [modelCells, setModelCells] = useState<ModelCell[]>([]);

  const [savedCells, setSavedCells] = useState<CellData[]>([]);
  const [localCells, setLocalCells] = useState<CellData[]>([]);

  const [isClearPopupOpen, setIsClearPopupOpen] = useState(false);
  const [isCellPopupOpen, setIsCellPopupOpen] = useState(false);
  const [cellPopupData, setCellPopupData] = useState<{ id: number; column: number; drum: number; cellData: CellData | null }>({ id: 0, column: 1, drum: 1, cellData: null });
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAs, setIsSavingAs] = useState(false);
  const [isStationSelectOpen, setIsStationSelectOpen] = useState(false);

  // Тулбар
  const [expanded, setExpanded] = useState<'search' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [typeFilterSet, setTypeFilterSet] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAnyPopupOpen = isClearPopupOpen || isCellPopupOpen || isSaveAsOpen || showCloseConfirm || isStationSelectOpen;
  const prevSelectedIdsRef = useRef<Set<number>>(new Set());
  const isVisualizationSupported = configLoaded && cellType === SUPPORTED_CELL_TYPE && totalDrums === SUPPORTED_TOTAL_DRUMS && totalRows === SUPPORTED_TOTAL_ROWS;
  const totalWings = MAX_DRUMS * TOGGLES_COUNT;

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

  const handleSelectionChange = useCallback((selectedIds: Set<number>) => {
    const prevIds = prevSelectedIdsRef.current;
    const findCell = (rowId: number) => modelCells.find(mc => mc.row === rowId && mc.drum === selectedDrum && !mc.deleted);

    prevIds.forEach(id => {
      if (!selectedIds.has(id)) {
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
    selectedIds.forEach(id => {
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
    prevSelectedIdsRef.current = new Set(selectedIds);
  }, [modelCells, selectedDrum, startWingAnimation]);

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

  const handleToggleActive = async () => {
    if (!uid) return;
    if (stationUid) {
      try {
        await AxiosService.put(`/api/stations/${stationUid}`, { activeTemplateUid: isActive ? null : uid });
        await fetchData();
      } catch (error) { console.error('Ошибка переключения шаблона:', error); }
    } else {
      setIsStationSelectOpen(true);
    }
  };

  const handleStationSelect = async (selectedStationUid: string, selectedStationName: string) => {
    if (!uid) return;
    try {
      await AxiosService.put(`/api/stations/${selectedStationUid}`, { activeTemplateUid: uid });
      setIsStationSelectOpen(false);
      setStationUid(selectedStationUid);
      setStationNameParam(selectedStationName);
      setStationName(selectedStationName);
      if (activeTabId) {
        const newPath = `/documents/schablon/${uid}?stationUid=${selectedStationUid}&stationName=${encodeURIComponent(selectedStationName)}`;
        replaceTab(activeTabId, newPath, `Шаблон - ${templateName}`, <SchablonPage />);
      }
    } catch (error) {
      console.error('Ошибка установки шаблона:', error);
    }
  };

  const formatDate = (dateStr: string): string => { if (!dateStr) return ''; try { const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch { return dateStr; } };
  const title = `Документ: Схема загрузки станции (${templateName || '...'}) №${templateNumber || '—'} от ${formatDate(templateDate)}`;

  const leftBlockTitle = stationUid ? (stationName || 'Станция') : (templateConfigName || 'Без конфигурации');

  const handleCloseClearPopup = useCallback(() => { setIsClearPopupOpen(false); setActiveButtons(prev => prev.filter(i => i !== 2)); }, []);

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
    if (index === 1) { setIsMultiSelect(prev => !prev); setActiveButtons(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]); }
    else setActiveButtons(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };
  const handleEnableMultiSelect = () => { if (!isMultiSelect) { setIsMultiSelect(true); setActiveButtons(prev => prev.includes(1) ? prev : [...prev, 1]); } };
  const handleDrumChange = useCallback((drum: number) => { if (drum === selectedDrum) return; setSelectedDrum(drum); }, [selectedDrum]);

  const handleCellDoubleClick = useCallback((id: number, column: number, _selectedIds: Set<number>) => {
    const cd = localCells.find(c => c.numberCell === id && c.columnNumber === column && (c.drumNumber == null || c.drumNumber === selectedDrum));
    setCellPopupData({ id, column, drum: selectedDrum, cellData: cd || null });
    setIsCellPopupOpen(true);
  }, [localCells, selectedDrum]);

  const handleOpenDetails = useCallback((rowId: number, column: number, cellData?: CellData) => {
    setCellPopupData({ id: rowId, column, drum: selectedDrum, cellData: cellData || null });
    setIsCellPopupOpen(true);
  }, [selectedDrum]);

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
  }, []);

  const buildBatchPayload = () => ({
    cells: localCells
      .filter(c => c.materialUid || c.quantity != null || c.purposeMaterial || c.purposeSgd)
      .map(c => ({
        numberCell: c.numberCell ?? null,
        columnNumber: c.columnNumber ?? null,
        drumNumber: c.drumNumber ?? null,
        materialUid: c.materialUid ?? null,
        quantity: c.quantity ?? null,
        typeMainUid: c.typeMainUid ?? null,
        purposeMaterial: c.purposeMaterial ?? null,
        purposeSgd: c.purposeSgd ?? null,
        maxQuantity: c.maxQuantity ?? null,
        dimensions: c.dimensions ?? null,
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

  const bottomButtonStyle: React.CSSProperties = { height: '51px', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700 };
  const activeCells = modelCells.filter(c => !c.deleted);
  const totalActiveCells = activeCells.length;
  const getDrumCellCount = (drum: number): number => activeCells.filter(c => c.drum === drum).length;
  const displayDrums = Math.min(totalDrums, MAX_DRUMS);

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
        const isTmcCell = c.purposeMaterial === 'ТМЦ';
        const isSgdCell = c.purposeSgd === 'СГД';
        const isNone = !isTmcCell && !isSgdCell;
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

  // Тулбар
  const BTN_COLLAPSED = 54;
  const BTN_SEARCH_EXPANDED = 360;
  const BTN_GAP = 15;
  const FILTER_WIDTH = 260;
  const TOP_PAD = 20;
  const BOTTOM_PAD = 20;
  const TEXT_HEIGHT = 18;
  const ITEM_GAP = 20;
  const ROW_STEP = TEXT_HEIGHT + ITEM_GAP;
  const LEFT_OFFSET = 30;
  const SUBMENU_WIDTH = 260;
  const SUBMENU_OFFSET = 3;
  const BTN_HEADER = 40;
  const BTN_CLEAR = 44;
  const INDICATOR_LEFT = 15;
  const INDICATOR_WIDTH = 2;
  const INDICATOR_HEIGHT = 22;
  const SUBMENU_LEFT_PAD = 30;
  const SUBMENU_TEXT_TO_CHECKBOX_GAP = 20;
  const SUBMENU_CHECKBOX_WIDTH = 20;
  const SUBMENU_RIGHT_PAD = 20;

  const searchWidth = expanded === 'search' ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const filterWidth = expanded === 'filter' ? FILTER_WIDTH : BTN_COLLAPSED;

  const filterX = searchWidth + BTN_GAP;
  const clearX = searchWidth + filterWidth + BTN_GAP * 2;
  const centerX = clearX + BTN_COLLAPSED + 40;

  const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };
  const tween = { type: 'tween' as const, duration: 0.2 };

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

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, right: 60, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{title}</h1>
        <img src={statusIcon} alt="" style={{ width: statusWidth, height: 29, flexShrink: 0 }} />
      </div>

      <div style={{ position: 'absolute', top: '84px', left: '40px', width: '507px' }}>
        <div style={{ width: '477px', height: '71px', marginLeft: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SchablonProgressBar currentStep={progressStep} onClick={() => setProgressStep(prev => (prev + 1) % 4)} /></div>
        <div style={{ width: `${BLOCK_WIDTH}px`, height: `${BLOCK_HEIGHT}px`, marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
          {leftBlockTitle && <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '19px', lineHeight: '23px', color: '#2D4059', textAlign: 'center', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leftBlockTitle}</div>}
          {statusIcons.length > 0 && <div style={{ position: 'absolute', top: leftBlockTitle ? '66px' : '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>{statusIcons.map((icon, index) => <img key={index} src={icon} alt="" style={{ width: '35px', height: '20px' }} />)}</div>}
          {isVisualizationSupported ? <div style={{ position: 'absolute', left: `${imageLeft}px`, top: `${imageTop}px`, width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}><img src={StationFull} alt="Station" draggable={false} style={{ width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }} />{Array.from({ length: displayDrums }).map((_, drumIndex) => Array.from({ length: TOGGLES_COUNT }).map((_, cellIndex) => renderWing(drumIndex, cellIndex)))}</div> : configLoaded ? <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: '#9CA3AF', textAlign: 'center', padding: '0 40px' }}>Элементы шаблона не найдены</span></div> : null}
        </div>
        <div style={{ width: '507px', height: '60px', marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 20px', boxSizing: 'border-box' }}><div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>Всего ячеек: <strong>{totalActiveCells}</strong></span>{totalDrums > 1 && Array.from({ length: totalDrums }, (_, i) => i + 1).map(drum => <span key={drum} style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>Барабан {drum}: <strong>{getDrumCellCount(drum)}</strong></span>)}</div></div>
      </div>

      <div style={{ position: 'absolute', top: '106px', left: '577px', right: '40px', bottom: '40px' }}>
        {/* ТУЛБАР */}
        <div style={{ position: 'relative', width: '100%', height: BTN_COLLAPSED, marginBottom: '10px', filter: isAnyPopupOpen ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: isAnyPopupOpen ? 'none' : 'auto' }}>

          {/* Поиск */}
          <motion.div
            style={{
              position: 'absolute', left: 0, top: 0, height: BTN_COLLAPSED, borderRadius: 15,
              backgroundColor: expanded === 'search' ? '#666EFE' : '#FFFFFF',
              border: expanded === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)',
              cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            animate={{ width: searchWidth }}
            transition={tween}
          >
            <div
              onClick={() => {
                if (expanded === 'search') { setExpanded(null); setSearchValue(''); }
                else { setExpanded('search'); setSubmenuOpen(null); }
              }}
              style={{ width: BTN_COLLAPSED, height: BTN_COLLAPSED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
            >
              <img src={expanded === 'search' ? SearchIcon18White : SearchIcon18Black} alt="Поиск" style={{ width: 18, height: 18 }} />
            </div>
            {expanded === 'search' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 16 }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Поиск"
                  style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }}
                />
              </div>
            )}
          </motion.div>

          {/* Фильтр */}
          <motion.div
            style={{
              position: 'absolute', left: 0, top: 0, borderRadius: 15,
              backgroundColor: '#FFFFFF',
              border: expanded === 'filter' ? 'none' : (hasActiveFilter ? 'none' : '1px solid rgba(102, 110, 254, 0.15)'),
              boxShadow: expanded === 'filter' ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
              overflow: 'visible',
              zIndex: expanded === 'filter' ? 30 : 5,
            }}
            animate={{ x: filterX, width: filterWidth, height: expanded === 'filter' ? BTN_HEADER + filterListHeight + BTN_CLEAR : BTN_COLLAPSED }}
            transition={{ x: spring, width: tween, height: tween }}
          >
            <div
              onClick={() => {
                if (expanded === 'filter') { setExpanded(null); setSubmenuOpen(null); }
                else { setExpanded('filter'); setSearchValue(''); }
              }}
              style={{
                height: BTN_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: expanded === 'filter' || hasActiveFilter ? '#666EFE' : 'transparent',
                borderRadius: expanded === 'filter' ? '15px 15px 0 0' : 15,
                paddingTop: expanded === 'filter' ? 0 : 7,
                paddingBottom: expanded === 'filter' ? 0 : 7,
              }}
            >
              {expanded === 'filter'
                ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Фильтр</span>
                : <img src={hasActiveFilter ? FilterIcon18White : FilterIcon18Black} alt="Фильтр" style={{ width: 18, height: 18 }} />
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
                          zIndex: 25,
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
                                  maxWidth: SUBMENU_WIDTH - SUBMENU_LEFT_PAD - SUBMENU_TEXT_TO_CHECKBOX_GAP - SUBMENU_CHECKBOX_WIDTH - SUBMENU_RIGHT_PAD,
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

          {/* Очистка */}
          <motion.div
            style={{
              position: 'absolute', left: 0, top: 0, width: BTN_COLLAPSED, height: BTN_COLLAPSED,
              borderRadius: 15, backgroundColor: '#FFFFFF',
              border: '1px solid rgba(102, 110, 254, 0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            animate={{ x: clearX }}
            transition={spring}
          >
            <img src={Schablon5} alt="Очистка" style={{ width: 24, height: 24 }} />
          </motion.div>

          {/* Центральная кнопка */}
          <motion.div
            style={{
              position: 'absolute', left: 0, top: 0, width: 411, height: BTN_COLLAPSED,
              borderRadius: 15, backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 15px', boxSizing: 'border-box',
            }}
            animate={{ x: centerX }}
            transition={spring}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {templateName || 'Шаблон'}
            </span>
          </motion.div>

          {/* Правые 2 кнопки */}
          <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: BTN_GAP }}>
            <button style={{ width: BTN_COLLAPSED, height: BTN_COLLAPSED, borderRadius: 15, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <img src={Schablon1} alt="Печать" style={{ width: 24, height: 24 }} />
            </button>
            <button style={{ width: BTN_COLLAPSED, height: BTN_COLLAPSED, borderRadius: 15, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <img src={Schablon3} alt="" style={{ width: 24, height: 24 }} />
            </button>
          </div>
        </div>

        {/* ТАБЛИЦА */}
        <div style={{ height: '560px' }}>
          {configLoaded && (
            <SchablonTable
              isMultiSelect={isMultiSelect}
              onEnableMultiSelect={handleEnableMultiSelect}
              onSelectionChange={handleSelectionChange}
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
              onCellLocalClear={handleLocalClear}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '30px', marginTop: '30px' }}>
          <button style={{ ...bottomButtonStyle, width: '215px', backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}><img src={IconD} alt="" style={{ width: '17px', height: '21px', flexShrink: 0 }} /><span style={{ marginLeft: '17px' }}>Форма документа</span></button>
          <button
            onClick={handleToggleActive}
            style={{
              ...bottomButtonStyle,
              width: '175px',
              backgroundColor: isActive && stationUid ? '#666EFE' : '#FFFFFF',
              color: isActive && stationUid ? '#FFFFFF' : '#2D4059',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <img src={isActive && stationUid ? IconJ2 : IconJ1} alt="" style={{ width: '24px', height: '14px', filter: isActive && stationUid ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} />
            <span style={{ marginLeft: '15px' }}>{stationUid && isActive ? 'Установлено' : 'Установить'}</span>
          </button>
          <button
            onClick={canSaveAs ? () => setIsSaveAsOpen(true) : undefined}
            disabled={!canSaveAs}
            style={{
              ...bottomButtonStyle, width: '175px',
              backgroundColor: '#FFFFFF', color: '#2D4059',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              opacity: canSaveAs ? 1 : 0.35,
              cursor: canSaveAs ? 'pointer' : 'not-allowed',
            }}
          >
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSavingAs ? 'Создание...' : 'Записать как'}</span>
          </button>
          <button
            onClick={canSave ? handleSave : undefined}
            disabled={!canSave}
            style={{
              ...bottomButtonStyle, width: '154px',
              backgroundColor: '#FFFFFF', color: '#2D4059',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              opacity: canSave ? 1 : 0.35,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            <img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
            <span style={{ marginLeft: '17px' }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
          </button>
          <button onClick={handleClose} style={{ ...bottomButtonStyle, width: '116px', backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>Закрыть</button>
        </div>

        {isClearPopupOpen && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}><ClearPopup isOpen={isClearPopupOpen} onClose={handleCloseClearPopup} /></div>}
        {isCellPopupOpen && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}><CellDetailsPopup isOpen={isCellPopupOpen} onClose={() => setIsCellPopupOpen(false)} cellId={cellPopupData.id} cellName={`Ячейка ${cellPopupData.id}`} selectedColumn={cellPopupData.column} selectedDrum={cellPopupData.drum} cellData={cellPopupData.cellData} onSaved={handleCellUpdate} /></div>}
      </div>

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