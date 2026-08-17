// StationModelCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (с историей-затычкой и тремя кнопками)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import StationModelMainTab from './StationModelMainTab';
import StationModelGridTab from './StationModelGridTab';
import StationModelFilesTab from './StationModelFilesTab';
import HistoryTable from '../../elements/HistoryTable';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';

interface CellData {
  id: string;
  drum?: number;
  column: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
}

interface LocalImageItem {
  file: File;
  url: string;
}

interface LocalDocumentItem {
  localId: string;
  documentName: string;
  file: File;
}

const StationModelCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { tabs, activeTabId, closeTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);

  const [name, setName] = useState('');
  const [article, setArticle] = useState('');
  const [revision, setRevision] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [manufacturerName, setManufacturerName] = useState('');
  const [modelCode, setModelCode] = useState<number>(0);
  const [modelImageUrl, setModelImageUrl] = useState('');
  const [localImage, setLocalImage] = useState<LocalImageItem | null>(null);
  const [localDocuments, setLocalDocuments] = useState<LocalDocumentItem[]>([]);

  const [gridType, setGridType] = useState<'postamat' | 'drum' | null>(null);
  const [columns, setColumns] = useState<number | null>(null);
  const [cellsPerColumn, setCellsPerColumn] = useState<number | null>(null);
  const [drums, setDrums] = useState<number | null>(null);
  const [columnsPerDrum, setColumnsPerDrum] = useState<number | null>(null);
  const [rowsPerColumn, setRowsPerColumn] = useState<number | null>(null);
  const [selectedDrum, setSelectedDrum] = useState<number>(1);
  const [cells, setCells] = useState<CellData[]>([]);

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const cellsLoadedRef = useRef(false);

  const getPopupOpenKey = () => `station_model_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('stationType');
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);

  const tabs_list = ['Основное', 'Структура', 'Файлы'];

  const generateCells = useCallback(() => {
    if (cellsLoadedRef.current) return;
    if (!gridType) return;
    const newCells: CellData[] = [];
    if (gridType === 'postamat' && columns && cellsPerColumn) {
      for (let col = 1; col <= columns; col++) for (let row = 1; row <= cellsPerColumn; row++) newCells.push({ id: crypto.randomUUID(), column: col, row, colSpan: 1, rowSpan: 1, deleted: false });
    } else if (gridType === 'drum' && drums && columnsPerDrum && rowsPerColumn) {
      for (let drum = 1; drum <= drums; drum++) for (let col = 1; col <= columnsPerDrum; col++) for (let row = 1; row <= rowsPerColumn; row++) newCells.push({ id: crypto.randomUUID(), drum, column: col, row, colSpan: 1, rowSpan: 1, deleted: false });
    }
    setCells(newCells);
  }, [gridType, columns, cellsPerColumn, drums, columnsPerDrum, rowsPerColumn]);

  useEffect(() => { generateCells(); }, [generateCells]);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    setIsEdit(cp.includes('/edit/'));
    if (cp.includes('/edit/')) loadModelData(uid);
  }, [uid]);

  const loadModelData = async (modelUid: string) => {
    setIsLoading(true);
    cellsLoadedRef.current = false;
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationModel(modelUid))).data;
      setName(d.name || ''); setArticle(d.article || ''); setRevision(d.revision || '');
      setDescription(d.purpose || ''); setModelCode(d.code || 0);
      if (d.typeId) { setTypeId(d.typeId); setTypeName(d.typeName || ''); }
      if (d.manufacturerId) { setManufacturerId(d.manufacturerId); setManufacturerName(d.manufacturerName || ''); }
      if (d.cellsStructure) {
        try {
          const cs = JSON.parse(d.cellsStructure);
          setGridType(cs.type);
          if (cs.type === 'postamat') {
            setColumns(cs.columns ?? null); setCellsPerColumn(cs.cellsPerColumn ?? null);
            setDrums(null); setColumnsPerDrum(null); setRowsPerColumn(null);
          } else if (cs.type === 'drum') {
            setDrums(cs.drums ?? null); setColumnsPerDrum(cs.columnsPerDrum ?? null); setRowsPerColumn(cs.rowsPerColumn ?? null);
            setColumns(null); setCellsPerColumn(null);
          }
          if (cs.cells?.length > 0) {
            setCells(cs.cells);
            cellsLoadedRef.current = true;
          }
        } catch (e) {}
      }
      try {
        const imgRes = await AxiosService.get(ConstantInfo.restApiStationModelImages(modelUid));
        if (imgRes.data?.length > 0) setModelImageUrl(imgRes.data[0].url ? ConstantInfo.fileDir + imgRes.data[0].url.replace(/^\//, '') : '');
      } catch (e) {}
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      setHistoryEvents([]);
    } catch (e) { console.error(e); } finally { setHistoryLoading(false); }
  };

  const handleHistoryClick = () => {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      cellsLoadedRef.current = false;
      const cellsStructure = JSON.stringify({
        type: gridType,
        columns: gridType === 'postamat' ? columns : undefined,
        cellsPerColumn: gridType === 'postamat' ? cellsPerColumn : undefined,
        drums: gridType === 'drum' ? drums : undefined,
        columnsPerDrum: gridType === 'drum' ? columnsPerDrum : undefined,
        rowsPerColumn: gridType === 'drum' ? rowsPerColumn : undefined,
        cells,
      });

      const body: any = { uid, name: name.trim(), article: article.trim(), revision: revision.trim(), purpose: description.trim(), typeId: typeId || null, manufacturerId: manufacturerId || null, cellsStructure };

      const wasCreate = !isEdit;
      if (isEdit) await AxiosService.patch(`${ConstantInfo.restApiStationModels}/${uid}`, body);
      else await AxiosService.post(ConstantInfo.restApiStationModels, body);

      if (localImage) {
        const fd = new FormData(); fd.append('file', localImage.file);
        await AxiosService.post(ConstantInfo.restApiStationModelImages(uid), fd);
        setLocalImage(null);
      }
      for (const doc of localDocuments) {
        const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName);
        await AxiosService.post(ConstantInfo.restApiStationModelDocuments(uid), fd);
      }
      setLocalDocuments([]);

      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      if (wasCreate) { setIsEdit(true); navigate(`/references/station-models/edit/${uid}`, { replace: true }); }

      if (wasCreate || localImage) {
        try {
          const imgRes = await AxiosService.get(ConstantInfo.restApiStationModelImages(uid));
          if (imgRes.data?.length > 0) setModelImageUrl(imgRes.data[0].url ? ConstantInfo.fileDir + imgRes.data[0].url.replace(/^\//, '') : '');
        } catch (e) {}
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) { sessionStorage.removeItem(getPopupOpenKey()); if (localImage) URL.revokeObjectURL(localImage.url); } };
  const handleCloseWithoutSaving = () => { if (uid) { sessionStorage.removeItem(getPopupOpenKey()); if (localImage) URL.revokeObjectURL(localImage.url); } handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };
  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };
  const openPopup = (type: PopupType, filter?: string) => { setPopupType(type); setPopupFilterParam(filter || undefined); setPopupOpen(true); if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true'); };

  const handlePopupSelect = (id: string, nm: string) => {
    cellsLoadedRef.current = false;
    switch (popupType) {
      case 'stationType': setTypeId(id); setTypeName(nm); if (nm === 'ADDITIONAL_MODULE' || nm === 'POSTAMAT_TYPE' || nm === 'Дополнительный модуль' || nm === 'Постамат') { setGridType('postamat'); setDrums(null); setColumnsPerDrum(null); setRowsPerColumn(null); } else { setGridType('drum'); setColumns(null); setCellsPerColumn(null); } break;
      case 'stationManufacturer': setManufacturerId(id); setManufacturerName(nm); break;
    }
  };

  const handlePopupClose = () => { setPopupOpen(false); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };
  const canSave = name.trim().length > 0;

  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const buttonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden' });
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {isEdit ? `Модель станции: ${name}` : 'Справочник: Модель станции (Создание)'}
        </h1>
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => { setShowHistory(false); setActiveTab(0); }} style={mainButtonStyle(activeTab === 0 && !showHistory)}>
            <span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }} />
            </button>
          </button>
          <AnimatePresence>
            {!tabsCollapsed && tabs_list.slice(1).map((tab, i) => (
              <motion.button key={tab} onClick={() => { setShowHistory(false); setActiveTab(i + 1); }} style={buttonStyle(activeTab === i + 1 && !showHistory)} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3 }}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={{ ...smallButtonStyle, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF' }} onClick={handleHistoryClick}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: showHistory ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden', padding: 20 }}>
          <HistoryTable
            events={historyEvents}
            isLoading={historyLoading}
            tableWidth={window.innerWidth - 60 - 60 - 40}
            visibleRows={12}
            rowHeight={58}
            headerHeight={58}
            dateLabel="Дата и время"
            authorLabel="Автор"
            eventLabel="Событие"
          />
        </div>
      ) : activeTab === 2 ? (
        <StationModelFilesTab modelUid={uid || ''} isEdit={isEdit} localDocuments={localDocuments} setLocalDocuments={setLocalDocuments} />
      ) : (
        <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden' }}>
          {activeTab === 0 && (
            <StationModelMainTab
              uid={uid} code={modelCode} name={name} article={article} revision={revision} description={description}
              typeId={typeId} typeName={typeName} manufacturerId={manufacturerId} manufacturerName={manufacturerName}
              modelImageUrl={modelImageUrl} localImage={localImage} setLocalImage={setLocalImage}
              setModelImageUrl={setModelImageUrl}
              setName={setName} setArticle={setArticle} setRevision={setRevision} setDescription={setDescription}
              openPopup={openPopup} isEdit={isEdit}
            />
          )}
          {activeTab === 1 && (
            <StationModelGridTab
              gridType={gridType} setGridType={setGridType}
              columns={columns} setColumns={setColumns} cellsPerColumn={cellsPerColumn} setCellsPerColumn={setCellsPerColumn}
              drums={drums} setDrums={setDrums} columnsPerDrum={columnsPerDrum} setColumnsPerDrum={setColumnsPerDrum}
              rowsPerColumn={rowsPerColumn} setRowsPerColumn={setRowsPerColumn}
              selectedDrum={selectedDrum} setSelectedDrum={setSelectedDrum}
              typeId={typeId} cells={cells} setCells={setCells}
            />
          )}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        <button onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving} style={{ width: 154, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', opacity: canSave ? 1 : 0.5 }}>
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17 }}>{isSaving ? 'Сохранение...' : 'Записать'}</span>
        </button>
        <button onClick={() => setShowClosePopup(true)} style={{ width: 116, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Закрыть</button>
      </div>

      <CatalogSelectPopup isOpen={popupOpen} onClose={handlePopupClose} onSelect={handlePopupSelect} popupType={popupType} filterParam={popupFilterParam} />

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canSave && <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}
              <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
              <button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationModelCreatePage;