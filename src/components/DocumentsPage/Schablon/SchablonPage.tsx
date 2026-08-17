// SchablonPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

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

import SchablonTable from './SchablonTable';
import SchablonProgressBar from './SchablonProgressBar';
import ClearPopup from './ClearPopup';
import CellDetailsPopup from './CellDetailsPopup';

interface ModelCell { id: string; column?: number; row?: number; drum?: number; }
interface ConfigCell { id: string; modelCellIds: string[]; deleted?: boolean; }
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

const SchablonPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [searchParams] = useSearchParams();
  const [stationUid] = useState(() => searchParams.get('stationUid') || '');
  const [stationNameParam] = useState(() => searchParams.get('stationName') || '');
  const { tabs, activeTabId, closeTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);

  const [templateName, setTemplateName] = useState<string>('');
  const [templateNumber, setTemplateNumber] = useState<number | null>(null);
  const [templateDate, setTemplateDate] = useState<string>('');
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
  const [configCells, setConfigCells] = useState<ConfigCell[]>([]);
  const [cellsData, setCellsData] = useState<CellData[]>([]);
  const [isClearPopupOpen, setIsClearPopupOpen] = useState(false);
  const [isCellPopupOpen, setIsCellPopupOpen] = useState(false);
  const [cellPopupData, setCellPopupData] = useState<{ id: number; name: string; column: number; cellData?: CellData | null }>({ id: 0, name: '', column: 1, cellData: null });
  const isAnyPopupOpen = isClearPopupOpen || isCellPopupOpen;
  const prevSelectedIdsRef = useRef<Set<number>>(new Set());
  const isVisualizationSupported = configLoaded && cellType === SUPPORTED_CELL_TYPE && totalDrums === SUPPORTED_TOTAL_DRUMS && totalRows === SUPPORTED_TOTAL_ROWS;
  const totalWings = MAX_DRUMS * TOGGLES_COUNT;

  const [currentFrameArr, setCurrentFrameArr] = useState<number[]>(Array(totalWings).fill(0));
  const [isAnimatingArr, setIsAnimatingArr] = useState<boolean[]>(Array(totalWings).fill(false));
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
    setIsAnimatingArr(prev => { const copy = [...prev]; copy[wingIndex] = true; return copy; });
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
          setIsAnimatingArr(prev => { const copy = [...prev]; copy[wingIndex] = false; return copy; });
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
    
    prevIds.forEach(id => {
      if (!selectedIds.has(id)) {
        const modelCell = modelCells.find(mc => mc.row === id && mc.drum === selectedDrum);
        if (modelCell && modelCell.drum != null) {
          const drumIndex = modelCell.drum - 1;
          const cellIndex = (modelCell.row || 1) - 1;
          if (drumIndex < MAX_DRUMS && cellIndex < TOGGLES_COUNT) {
            const wingIndex = getWingIndex(drumIndex, cellIndex);
            setIsWingOpenArr(prev => { const copy = [...prev]; copy[wingIndex] = false; return copy; });
            startWingAnimation(wingIndex, false);
          }
        }
      }
    });
    
    selectedIds.forEach(id => {
      if (!prevIds.has(id)) {
        const modelCell = modelCells.find(mc => mc.row === id && mc.drum === selectedDrum);
        if (modelCell && modelCell.drum != null) {
          const drumIndex = modelCell.drum - 1;
          const cellIndex = (modelCell.row || 1) - 1;
          if (drumIndex < MAX_DRUMS && cellIndex < TOGGLES_COUNT) {
            const wingIndex = getWingIndex(drumIndex, cellIndex);
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
      setTemplateName(templateData.name || ''); setTemplateNumber(templateData.number); setTemplateDate(templateData.createdAt || '');
      try { const cellsRes = await AxiosService.get(ConstantInfo.restApiTemplateCells(uid)); setCellsData(cellsRes.data || []); } catch (e) { console.error('Ошибка загрузки ячеек:', e); }
      if (templateData.configurationUid) {
        try {
          const configRes = await AxiosService.get(ConstantInfo.restApiStationConfiguration(templateData.configurationUid));
          const configData = configRes.data;
          if (configData.modelId) {
            const modelRes = await AxiosService.get(ConstantInfo.restApiStationModel(configData.modelId));
            const modelData = modelRes.data;
            if (modelData.cellsStructure) {
              const structure = JSON.parse(modelData.cellsStructure);
              setCellType(structure.type || 'drum');
              if (structure.type === 'drum') { setTotalColumns(structure.columnsPerDrum || 14); setTotalRows(structure.rowsPerColumn || 18); setTotalDrums(structure.drums || 1); }
              else { setTotalColumns(structure.columns || 14); setTotalRows(structure.cellsPerColumn || 18); setTotalDrums(1); }
              if (structure.cells) setModelCells(structure.cells);
            }
          }
          if (configData.cellsStructure) { const configStructure = JSON.parse(configData.cellsStructure); if (configStructure.cells) setConfigCells(configStructure.cells.filter((c: ConfigCell) => !c.deleted)); }
          setConfigLoaded(true);
        } catch (e) { console.error('Ошибка загрузки конфигурации:', e); setConfigLoaded(true); }
      } else setConfigLoaded(true);
      if (stationUid) {
        const stationRes = await AxiosService.get(`/api/stations/static/${stationUid}`);
        const stationData = stationRes.data;
        if (!stationNameParam) setStationName(stationData?.name || stationUid);
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

  const handleToggleActive = async () => { if (!stationUid || !uid) return; try { await AxiosService.put(`/api/stations/${stationUid}`, { activeTemplateUid: isActive ? null : uid }); await fetchData(); } catch (error) { console.error('Ошибка переключения шаблона:', error); } };
  const formatDate = (dateStr: string): string => { if (!dateStr) return ''; try { const d = new Date(dateStr); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch { return dateStr; } };
  const title = `Документ: Шаблон загрузки станции (${templateName || '...'}) №${templateNumber || '—'} от ${formatDate(templateDate)}`;
  const handleCloseClearPopup = useCallback(() => { setIsClearPopupOpen(false); setActiveButtons(prev => prev.filter(i => i !== 2)); }, []);
  const handleCloseCellPopup = useCallback(() => { setIsCellPopupOpen(false); fetchData(); }, [fetchData]);
  const handleClose = () => { const currentTab = tabs.find(tab => tab.id === activeTabId); if (currentTab) closeTab(currentTab.id); };
  const handleButtonClick = (index: number) => {
    if (index === 2) { isClearPopupOpen ? handleCloseClearPopup() : (setIsClearPopupOpen(true), setActiveButtons(prev => prev.includes(index) ? prev : [...prev, index])); return; }
    if (index === 1) { setIsMultiSelect(prev => !prev); setActiveButtons(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]); }
    else setActiveButtons(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };
  const handleEnableMultiSelect = () => { if (!isMultiSelect) { setIsMultiSelect(true); setActiveButtons(prev => prev.includes(1) ? prev : [...prev, 1]); } };
  const handleDrumChange = useCallback((drum: number) => { if (drum === selectedDrum) return; setSelectedDrum(drum); }, [selectedDrum]);
  const handleCellDoubleClick = useCallback((id: number, column: number, _selectedIds: Set<number>) => {
    const cd = cellsData.find(c => c.numberCell === id && c.columnNumber === column && (c.drumNumber == null || c.drumNumber === selectedDrum));
    setCellPopupData({ id, name: `Ячейка ${id}`, column, cellData: cd || null }); setIsCellPopupOpen(true);
  }, [cellsData, selectedDrum]);
  const handleCellCleared = useCallback(() => { fetchData(); }, [fetchData]);
  const handleOpenDetails = useCallback((rowId: number, column: number, cellData?: CellData) => {
    setCellPopupData({ id: rowId, name: `Ячейка ${rowId}`, column, cellData: cellData || null }); setIsCellPopupOpen(true);
  }, []);

  const statusIcons: string[] = [];
  if (isTmc) statusIcons.push(TMC); if (isSgd) statusIcons.push(SGD); if (isOk) statusIcons.push(OK); if (parentUid) statusIcons.push(CHAIN);

  const getRoundButtonStyle = (isActiveBtn: boolean): React.CSSProperties => ({ width: '54px', height: '54px', borderRadius: '15px', backgroundColor: isActiveBtn ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: isActiveBtn ? '0 4px 12px rgba(102, 110, 254, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)', flexShrink: 0, transition: 'all 0.3s ease' });
  const bottomButtonStyle: React.CSSProperties = { height: '51px', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700 };
  const showJButton = !!stationUid;
  const totalActiveCells = configCells.length;
  const getDrumCellCount = (drum: number): number => configCells.filter(c => c.modelCellIds.some(mid => modelCells.find(cell => cell.id === mid)?.drum === drum)).length;
  const displayDrums = Math.min(totalDrums, MAX_DRUMS);

  const getWingLayout = useCallback((): { heights: Map<number, number>; hidden: Set<number> } => {
    const heights = new Map<number, number>(); const hidden = new Set<number>(); const processedPairs = new Set<string>();
    if (!isVisualizationSupported) return { heights, hidden };
    for (let d = 0; d < displayDrums; d++) for (let c = 0; c < TOGGLES_COUNT; c++) heights.set(getWingIndex(d, c), WING_HEIGHT);
    configCells.forEach(cc => {
      if (cc.modelCellIds.length !== 2) return;
      const mc1 = modelCells.find(c => c.id === cc.modelCellIds[0]); const mc2 = modelCells.find(c => c.id === cc.modelCellIds[1]);
      if (!mc1 || !mc2 || mc1.drum == null || mc2.drum == null || mc1.row == null || mc2.row == null || mc1.drum !== mc2.drum || Math.abs(mc1.row - mc2.row) !== 1) return;
      const drumIndex = mc1.drum - 1; if (drumIndex >= displayDrums) return;
      const topRow = Math.min(mc1.row, mc2.row); const pairKey = `${drumIndex}-${topRow}`; if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);
      heights.set(getWingIndex(drumIndex, topRow - 1), WING_HEIGHT_DOUBLE); hidden.add(getWingIndex(drumIndex, topRow));
    });
    return { heights, hidden };
  }, [isVisualizationSupported, configCells, modelCells, displayDrums]);

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

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <div style={{ position: 'absolute', top: '35px', left: '60px', right: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}><h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: '29px', whiteSpace: 'nowrap' }}>{title}</h1>{isStatusLoaded && isActive && <img src={Iconn3} alt="Активный" style={{ width: 84, height: 24, flexShrink: 0 }} />}</div>
        <button onClick={handleClose} style={{ width: '22px', height: '22px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}><img src={Iconkrest} alt="Закрыть" style={{ width: '22px', height: '22px' }} /></button>
      </div>
      <div style={{ position: 'absolute', top: '84px', left: '40px', width: '507px' }}>
        <div style={{ width: '477px', height: '71px', marginLeft: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SchablonProgressBar currentStep={progressStep} onClick={() => setProgressStep(prev => (prev + 1) % 4)} /></div>
        <div style={{ width: `${BLOCK_WIDTH}px`, height: `${BLOCK_HEIGHT}px`, marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
          {showJButton && stationName && <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '19px', lineHeight: '23px', color: '#2D4059', textAlign: 'center', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stationName}</div>}
          {statusIcons.length > 0 && <div style={{ position: 'absolute', top: showJButton && stationName ? '66px' : '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>{statusIcons.map((icon, index) => <img key={index} src={icon} alt="" style={{ width: '35px', height: '20px' }} />)}</div>}
          {isVisualizationSupported ? <div style={{ position: 'absolute', left: `${imageLeft}px`, top: `${imageTop}px`, width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}><img src={StationFull} alt="Station" draggable={false} style={{ width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }} />{Array.from({ length: displayDrums }).map((_, drumIndex) => Array.from({ length: TOGGLES_COUNT }).map((_, cellIndex) => renderWing(drumIndex, cellIndex)))}</div> : configLoaded ? <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: '#9CA3AF', textAlign: 'center', padding: '0 40px' }}>Элементы шаблона не найдены</span></div> : null}
        </div>
        <div style={{ width: '507px', height: '60px', marginTop: '15px', backgroundColor: '#FFFFFF', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 20px', boxSizing: 'border-box' }}><div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>Всего ячеек: <strong>{totalActiveCells}</strong></span>{totalDrums > 1 && Array.from({ length: totalDrums }, (_, i) => i + 1).map(drum => <span key={drum} style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>Барабан {drum}: <strong>{getDrumCellCount(drum)}</strong></span>)}</div></div>
      </div>
      <div style={{ position: 'absolute', top: '106px', left: '577px', right: '40px', bottom: '40px' }}>
        <div style={{ width: '100%', height: '54px', marginBottom: '10px', display: 'flex', alignItems: 'center', filter: isAnyPopupOpen ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: isAnyPopupOpen ? 'none' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}><button onClick={() => handleButtonClick(0)} style={getRoundButtonStyle(activeButtons.includes(0))}><img src={Schablon1} alt="" style={{ width: '24px', height: '24px', filter: activeButtons.includes(0) ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} /></button><button onClick={() => handleButtonClick(2)} style={getRoundButtonStyle(activeButtons.includes(2))}><img src={Schablon3} alt="" style={{ width: '24px', height: '24px', filter: activeButtons.includes(2) ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} /></button></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '145px' }}><div style={{ width: '411px', height: '54px', borderRadius: '15px', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px', boxSizing: 'border-box' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 600, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{templateName || 'Шаблон'}</span></div>{showJButton && <button onClick={handleToggleActive} style={getRoundButtonStyle(isActive)}><img src={isActive ? IconJ2 : IconJ1} alt="" style={{ width: '24px', height: '14px', filter: isActive ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} /></button>}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}><button onClick={() => handleButtonClick(3)} style={getRoundButtonStyle(activeButtons.includes(3))}><img src={Schablon4} alt="" style={{ width: '24px', height: '24px', filter: activeButtons.includes(3) ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} /></button><button onClick={() => handleButtonClick(4)} style={getRoundButtonStyle(activeButtons.includes(4))}><img src={Schablon5} alt="" style={{ width: '24px', height: '24px', filter: activeButtons.includes(4) ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }} /></button></div>
        </div>
        <div style={{ height: '560px' }}>{configLoaded && <SchablonTable isMultiSelect={isMultiSelect} onEnableMultiSelect={handleEnableMultiSelect} onSelectionChange={handleSelectionChange} totalRows={totalRows} totalColumns={totalColumns} totalDrums={totalDrums} cellType={cellType} selectedDrum={selectedDrum} onDrumChange={handleDrumChange} onCellDoubleClick={handleCellDoubleClick} isBlurred={isAnyPopupOpen} modelCells={modelCells} configCells={configCells} cellsData={cellsData} onCellCleared={handleCellCleared} onOpenDetails={handleOpenDetails} />}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '30px', marginTop: '30px' }}><button style={{ ...bottomButtonStyle, width: '215px', backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}><img src={IconD} alt="" style={{ width: '17px', height: '21px', flexShrink: 0 }} /><span style={{ marginLeft: '17px' }}>Форма документа</span></button><button style={{ ...bottomButtonStyle, width: '154px', backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}><img src={IconW} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} /><span style={{ marginLeft: '17px' }}>Записать</span></button><button onClick={handleClose} style={{ ...bottomButtonStyle, width: '116px', backgroundColor: '#FFFFFF', color: '#2D4059', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>Закрыть</button></div>
        {isClearPopupOpen && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}><ClearPopup isOpen={isClearPopupOpen} onClose={handleCloseClearPopup} /></div>}
        {isCellPopupOpen && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}><CellDetailsPopup isOpen={isCellPopupOpen} onClose={handleCloseCellPopup} cellId={cellPopupData.id} cellName={cellPopupData.name} selectedColumn={cellPopupData.column} selectedDrum={selectedDrum} cellData={cellPopupData.cellData || null} onSaved={handleCellCleared} /></div>}
      </div>
    </div>
  );
};

export default SchablonPage;