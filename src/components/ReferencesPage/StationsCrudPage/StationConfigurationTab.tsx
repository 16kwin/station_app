// StationConfigurationTab.tsx — ПОЛНЫЙ ФАЙЛ (убран modelImageUrl, всегда "Нет изображения")
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import FormField from '../../elements/FormField';
import StructureIcon18Black from '../../../assets/Icons/StructureIcons/StructureIcon18Black.svg';
import UnificationIcon12White from '../../../assets/Icons/UnificationIcons/UnificationIcon12White.svg';
import NetworkIcon18Black from '../../../assets/Icons/NetworkIcons/NetworkIcon18Black.svg';
import ArrowIcon6Black from '../../../assets/Icons/ArrowIcons/ArrowIcon6Black.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';

interface CellData {
  id: string;
  column?: number;
  row?: number;
  drum?: number;
  colSpan?: number;
  rowSpan?: number;
  deleted?: boolean;
}

interface StationConfigurationTabProps {
  configurationUid: string;
  configurationName: string;
  modelId: string;
  modelName: string;
  ipAddress: string;
  networkPort: number | '';
  setConfigurationUid: (v: string) => void;
  setConfigurationName: (v: string) => void;
  setIpAddress: (v: string) => void;
  setNetworkPort: (v: number | '') => void;
  openPopup: (type: PopupType, filter?: string) => void;
}

const CELL_WIDTH_MAX = 160;
const CELL_HEIGHT_MAX = 65;
const CELL_GAP_V = 5;
const CELL_GAP_H = 8;
const MERGED_MIN_WIDTH = 46;

const StationConfigurationTab: React.FC<StationConfigurationTabProps> = ({ configurationUid, configurationName, modelId, modelName, ipAddress, networkPort, setConfigurationUid, setConfigurationName, setIpAddress, setNetworkPort, openPopup }) => {
  const [cells, setCells] = useState<CellData[]>([]);
  const [gridType, setGridType] = useState<'postamat' | 'drum' | null>(null);
  const [columnsCount, setColumnsCount] = useState(0);
  const [rowsCount, setRowsCount] = useState(0);
  const [drums, setDrums] = useState(0);
  const [selectedDrum, setSelectedDrum] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [connectionCheck, setConnectionCheck] = useState('');

  const totalActiveCells = cells.filter(c => !c.deleted).length;

  const LEFT_WIDTH = expanded ? 682 : 1626;
  const RIGHT_WIDTH = expanded ? 1028 : 84;
  const GAP = 30;

  const LEFT_COLUMN_WIDTH = 365;
  const CELLS_AREA_WIDTH = 944;
  const CELLS_AREA_HEIGHT = 481;
  const IMAGE_AREA_WIDTH = 227;

  useEffect(() => {
    if (configurationUid) loadConfiguration();
    else { setCells([]); setGridType(null); setColumnsCount(0); setRowsCount(0); setDrums(0); }
  }, [configurationUid, modelId]);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const configRes = await AxiosService.get(ConstantInfo.restApiStationConfiguration(configurationUid));
      const configData = configRes.data;

      if (configData.cellsStructure) {
        try {
          const parsed = JSON.parse(configData.cellsStructure);
          if (parsed.cells?.length > 0) setCells(parsed.cells.map((c: any) => ({ ...c, colSpan: c.colSpan || 1, rowSpan: c.rowSpan || 1, deleted: c.deleted || false })));
          if (parsed.type) setGridType(parsed.type);
          if (parsed.columns || parsed.columnsPerDrum) setColumnsCount(parsed.columns || parsed.columnsPerDrum || 0);
          if (parsed.cellsPerColumn || parsed.rowsPerColumn) setRowsCount(parsed.cellsPerColumn || parsed.rowsPerColumn || 0);
          if (parsed.drums) setDrums(parsed.drums);
        } catch {}
      }

      if (configData.modelId) {
        try {
          const modelRes = await AxiosService.get(ConstantInfo.restApiStationModel(configData.modelId));
          const modelData = modelRes.data;
          if (modelData.cellsStructure) {
            const modelStruct = JSON.parse(modelData.cellsStructure);
            if (!gridType) setGridType(modelStruct.type);
            if (!columnsCount) setColumnsCount(modelStruct.columns || modelStruct.columnsPerDrum || 0);
            if (!rowsCount) setRowsCount(modelStruct.cellsPerColumn || modelStruct.rowsPerColumn || 0);
            if (!drums) setDrums(modelStruct.drums || 0);
          }
        } catch {}
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const cellW = (() => {
    const cols = columnsCount || 1;
    const calculated = (CELLS_AREA_WIDTH - (cols - 1) * CELL_GAP_H) / cols;
    return Math.min(calculated, CELL_WIDTH_MAX);
  })();

  const cellH = (() => {
    const rows = rowsCount || 1;
    const calculated = (CELLS_AREA_HEIGHT - (rows - 1) * CELL_GAP_V) / rows;
    return Math.min(calculated, CELL_HEIGHT_MAX);
  })();

  const renderCells = () => {
    if (!gridType) return null;
    const cols = columnsCount || 0;
    const rows = rowsCount || 0;
    if (!cols || !rows) return null;

    const rendered = new Set<string>();
    const elements: React.ReactNode[] = [];

    cells.filter(c => !c.deleted && (gridType === 'drum' ? c.drum === selectedDrum : true)).forEach(cell => {
      const key = `${cell.column}-${cell.row}`;
      if (rendered.has(key)) return;
      const isMerged = (cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1;
      const left = ((cell.column || 1) - 1) * (cellW + CELL_GAP_H);
      const top = ((cell.row || 1) - 1) * (cellH + CELL_GAP_V);
      const w = cellW * (cell.colSpan || 1) + CELL_GAP_H * ((cell.colSpan || 1) - 1);
      const h = cellH * (cell.rowSpan || 1) + CELL_GAP_V * ((cell.rowSpan || 1) - 1);

      for (let c = 0; c < (cell.colSpan || 1); c++)
        for (let r = 0; r < (cell.rowSpan || 1); r++)
          rendered.add(`${(cell.column || 1) + c}-${(cell.row || 1) + r}`);

      const colStart = cell.column || 1;
      const rowStart = cell.row || 1;
      const colEnd = colStart + (cell.colSpan || 1) - 1;
      const rowEnd = rowStart + (cell.rowSpan || 1) - 1;
      const fitsInOneRow = w >= MERGED_MIN_WIDTH;

      elements.push(
        <div key={cell.id} style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: 3, backgroundColor: 'rgba(45, 64, 89, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', overflow: 'hidden' }}>
          {isMerged ? (
            fitsInOneRow ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
                <img src={UnificationIcon12White} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colEnd}-{rowEnd}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
                <img src={UnificationIcon12White} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colEnd}-{rowEnd}</span>
              </div>
            )
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{colStart}-{rowStart}</span>
          )}
        </div>
      );
    });

    cells.filter(c => c.deleted && (gridType === 'drum' ? c.drum === selectedDrum : true)).forEach(cell => {
      const key = `${cell.column}-${cell.row}`;
      if (rendered.has(key)) return;
      const left = ((cell.column || 1) - 1) * (cellW + CELL_GAP_H);
      const top = ((cell.row || 1) - 1) * (cellH + CELL_GAP_V);
      rendered.add(key);
      elements.push(
        <div key={cell.id} style={{ position: 'absolute', left, top, width: cellW, height: cellH, borderRadius: 3, border: '1px dashed rgba(45, 64, 89, 0.25)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>+</span>
        </div>
      );
    });

    const containerW = cols * cellW + (cols - 1) * CELL_GAP_H;
    const containerH = rows * cellH + (rows - 1) * CELL_GAP_V;
    return <div style={{ position: 'relative', width: containerW, height: containerH }}>{elements}</div>;
  };

  const CONTENT_LEFT = 30;
  const FIELD_LEFT = 58;
  const FIELD_WIDTH = 249;
  const FIELD_HEIGHT = 56;

  const DRUM_SWITCHER_LEFT = 40;
  const DRUM_SWITCHER_RIGHT = 40;
  const DRUM_TEXT_HEIGHT = 17;
  const DRUM_TEXT_TO_LINE = 7;
  const LINE_HEIGHT = 3;
  const LINE_GAP = 30;
  const DRUM_SWITCHER_TOTAL_HEIGHT = DRUM_TEXT_HEIGHT + DRUM_TEXT_TO_LINE + LINE_HEIGHT;

  const getDrumLabel = (drumNum: number, totalDrums: number): string => {
    if (totalDrums === 2) return drumNum === 1 ? 'Левый барабан' : 'Правый барабан';
    return `${drumNum}`;
  };

  const getDrumNameForText = (drumNum: number, totalDrums: number): string => {
    if (totalDrums === 2) return drumNum === 1 ? 'левом барабане' : 'правом барабане';
    const ordinals = ['первом', 'втором', 'третьем', 'четвертом'];
    return ordinals[drumNum - 1] || `${drumNum}-м`;
  };

  const getDrumLayout = (totalDrums: number) => {
    const availableWidth = LEFT_COLUMN_WIDTH - DRUM_SWITCHER_LEFT - DRUM_SWITCHER_RIGHT;
    const lineWidth = (availableWidth - (totalDrums - 1) * LINE_GAP) / totalDrums;
    const positions: number[] = [];
    for (let i = 0; i < totalDrums; i++) positions.push(DRUM_SWITCHER_LEFT + i * (lineWidth + LINE_GAP));
    return { lineWidth, positions };
  };

  const getFieldsetStyle = (hasValue: boolean): React.CSSProperties => ({
    width: '100%', height: FIELD_HEIGHT,
    border: `1px solid ${hasValue ? '#666EFE' : 'rgba(45, 64, 89, 0.5)'}`,
    borderRadius: 10, padding: 0, margin: 0,
    display: 'flex', alignItems: 'center', boxSizing: 'border-box', position: 'relative',
  });

  const getLegendStyle = (hasValue: boolean): React.CSSProperties => ({
    fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
    color: hasValue ? '#666EFE' : 'rgba(45, 64, 89, 0.5)',
    padding: '0 4px', marginLeft: 8,
    position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)',
    backgroundColor: '#FFFFFF', lineHeight: '14px', height: 14,
  });

  const infoTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
    opacity: 0.6,
  };

  const infoNumberStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#2D4059',
  };

  const screenLabelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D4059',
    lineHeight: '17px',
    display: 'block',
  };

  const headerTop = 30;
  const drumSwitcherTop = headerTop + 18 + 30;
  const configFieldTop = drumSwitcherTop + DRUM_SWITCHER_TOTAL_HEIGHT + 49;
  const modelTextTop = configFieldTop + FIELD_HEIGHT + 45;
  const typeTextTop = modelTextTop + 17 + 15;
  const infoBlockTop = typeTextTop + 17 + 35;

  const getCellsCountForDrum = (drumNum: number): number => {
    return cells.filter(c => !c.deleted && c.drum === drumNum).length;
  };

  const NETWORK_PANEL_PADDING_LEFT = 40;
  const NETWORK_PANEL_PADDING_TOP = 30;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <div style={{ 
        width: LEFT_WIDTH, 
        height: '100%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 15, 
        border: '1px solid rgba(102, 110, 254, 0.15)', 
        flexShrink: 0, 
        transition: 'width 0.3s ease', 
        overflow: 'hidden', 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
      }}>
        {/* ЛЕВАЯ КОЛОНКА */}
        <div style={{ width: LEFT_COLUMN_WIDTH, flexShrink: 0, position: 'relative', height: '100%' }}>
          <div style={{ position: 'absolute', top: 30, left: CONTENT_LEFT, display: 'flex', alignItems: 'center', height: 18 }}>
            <img src={StructureIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', marginLeft: 12 }}>Конфигурация ячеек</span>
          </div>

          {gridType === 'drum' && (
            <div style={{ position: 'absolute', top: drumSwitcherTop, left: 0, right: 0, height: DRUM_SWITCHER_TOTAL_HEIGHT }}>
              {drums > 1 && (() => {
                const totalDrums = drums;
                const { lineWidth, positions } = getDrumLayout(totalDrums);
                return Array.from({ length: totalDrums }).map((_, i) => {
                  const drumNum = i + 1;
                  const isSelected = selectedDrum === drumNum;
                  const left = positions[i];
                  const label = getDrumLabel(drumNum, totalDrums);
                  return (
                    <React.Fragment key={drumNum}>
                      <button onClick={() => setSelectedDrum(drumNum)}
                        style={{ position: 'absolute', left, top: 0, width: lineWidth, height: DRUM_TEXT_HEIGHT, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.6)', textAlign: 'center', lineHeight: `${DRUM_TEXT_HEIGHT}px`, transition: 'color 0.3s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</button>
                      <div style={{ position: 'absolute', top: DRUM_TEXT_HEIGHT + DRUM_TEXT_TO_LINE, left, width: lineWidth, height: LINE_HEIGHT, backgroundColor: isSelected ? '#666EFE' : 'rgba(45, 64, 89, 0.06)', borderRadius: '1.5px', transition: 'background-color 0.3s ease' }} />
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          )}

          <div style={{ position: 'absolute', top: configFieldTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
            <fieldset style={getFieldsetStyle(!!configurationUid)}>
              <legend style={getLegendStyle(!!configurationUid)}>Выбор конфигурации</legend>
              <div onClick={() => modelId ? openPopup('stationConfiguration', modelId) : undefined} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', cursor: modelId ? 'pointer' : 'not-allowed', paddingLeft: 12, paddingRight: 12, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: configurationUid ? '#666EFE' : '#A0A3BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {modelId ? (configurationName || 'Выберите конфигурацию') : 'Сначала выберите модель'}
                </span>
              </div>
            </fieldset>
          </div>

          <div style={{ position: 'absolute', top: modelTextTop, left: FIELD_LEFT }}>
            <span style={infoTextStyle}>Модель станции:&nbsp;</span>
            <span style={infoNumberStyle}>{modelName || '—'}</span>
          </div>

          <div style={{ position: 'absolute', top: typeTextTop, left: FIELD_LEFT }}>
            <span style={infoTextStyle}>Тип станции:&nbsp;</span>
            <span style={infoNumberStyle}>{gridType === 'postamat' ? 'Постамат' : gridType === 'drum' ? 'Барабанный' : '—'}</span>
          </div>

          {gridType && (
            <div style={{ position: 'absolute', top: infoBlockTop, left: FIELD_LEFT, width: FIELD_WIDTH }}>
              {gridType === 'drum' && drums > 0 ? (
                Array.from({ length: drums }).map((_, i) => {
                  const drumNum = i + 1;
                  return (
                    <div key={drumNum} style={{ height: 17, display: 'flex', alignItems: 'center', marginTop: i > 0 ? 14 : 0 }}>
                      <span style={infoTextStyle}>Ячеек в {getDrumNameForText(drumNum, drums)}&nbsp;</span>
                      <span style={infoNumberStyle}>{getCellsCountForDrum(drumNum)}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ height: 17, display: 'flex', alignItems: 'center' }}>
                  <span style={infoTextStyle}>Общее количество ячеек&nbsp;</span>
                  <span style={infoNumberStyle}>{totalActiveCells}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ЗАЗОР 30 */}
        <div style={{ width: 30, flexShrink: 0 }} />

        {/* ЯЧЕЙКИ с анимацией */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              key="cells-area"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, type: 'tween' }}
              style={{ width: CELLS_AREA_WIDTH, height: CELLS_AREA_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 42 }}
            >
              {!configurationUid ? (
                <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF' }}>Конфигурация не выбрана</span>
              ) : isLoading ? (
                <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
              ) : totalActiveCells > 0 ? (
                renderCells()
              ) : (
                <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF' }}>Нет данных</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ЗАЗОР 30 */}
        {!expanded && <div style={{ width: 30, flexShrink: 0 }} />}

        {/* ИЗОБРАЖЕНИЕ */}
        <div style={{ width: IMAGE_AREA_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: expanded ? 22 : 42, paddingRight: 30 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF' }}>Нет изображения</span>
        </div>
      </div>

      <div style={{ width: GAP, flexShrink: 0 }} />

      {/* ПРАВАЯ ПАНЕЛЬ */}
      <div
        onClick={() => !expanded && setExpanded(true)}
        style={{
          width: RIGHT_WIDTH, 
          height: '100%', 
          backgroundColor: '#FFFFFF', 
          borderRadius: 15, 
          border: '1px solid rgba(102, 110, 254, 0.15)',
          flexShrink: 0, 
          transition: 'width 0.3s ease', 
          cursor: expanded ? 'default' : 'pointer',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {expanded ? (
          <div style={{ paddingLeft: NETWORK_PANEL_PADDING_LEFT, paddingTop: NETWORK_PANEL_PADDING_TOP, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Заголовок */}
            <div style={{ display: 'flex', alignItems: 'center', height: 18 }}>
              <img src={NetworkIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ ...screenLabelStyle, marginLeft: 10 }}>Сетевые настройки</span>
              <button onClick={() => setExpanded(false)} style={{ marginLeft: 10, width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={ArrowIcon6Black} alt="" style={{ width: 6, height: 9 }} />
              </button>
            </div>

            <div style={{ marginTop: 30 }}>
              <span style={screenLabelStyle}>IP-адрес:</span>
              <div style={{ marginTop: 11 }}>
                <FormField
                  width={301} height={44}
                  icon={CodeIcon20Gray}
                  iconActive={CodeIcon20Blue}
                  value={ipAddress}
                  placeholder="Введите IP-адрес"
                  type="input"
                  onChange={e => setIpAddress(e.target.value)}
                  onClear={() => setIpAddress('')}
                  iconWidth={20}
                  iconHeight={20}
                />
              </div>
            </div>

            <div style={{ marginTop: 25 }}>
              <span style={screenLabelStyle}>Сетевой порт:</span>
              <div style={{ marginTop: 11 }}>
                <FormField
                  width={301} height={44}
                  icon={CodeIcon20Gray}
                  iconActive={CodeIcon20Blue}
                  value={String(networkPort)}
                  placeholder="Введите порт"
                  type="input"
                  inputType="number"
                  onChange={e => setNetworkPort(e.target.value ? Number(e.target.value) : '')}
                  onClear={() => setNetworkPort('')}
                  iconWidth={20}
                  iconHeight={20}
                />
              </div>
            </div>

            <div style={{ marginTop: 25 }}>
              <span style={screenLabelStyle}>Проверить подключение к серверу системы:</span>
              <div style={{ marginTop: 11, display: 'flex', alignItems: 'center' }}>
                <FormField
                  width={301} height={44}
                  icon={CodeIcon20Gray}
                  iconActive={CodeIcon20Blue}
                  value={connectionCheck}
                  placeholder="Введите адрес"
                  type="input"
                  onChange={e => setConnectionCheck(e.target.value)}
                  onClear={() => setConnectionCheck('')}
                  iconWidth={20}
                  iconHeight={20}
                />
                <button style={{ marginLeft: 15, width: 95, height: 38, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
                  Тест
                </button>
              </div>
            </div>

            <div style={{ marginTop: 25 }}>
              <span style={screenLabelStyle}>Проверить доступность внешней сети Интернет</span>
              <div style={{ marginTop: 11 }}>
                <button style={{ width: 95, height: 38, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
                  Тест
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 30, left: 25, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={NetworkIcon18Black} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <img src={ArrowIcon6Black} alt="" style={{ width: 6, height: 9, flexShrink: 0, transform: 'scaleX(-1)' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StationConfigurationTab;