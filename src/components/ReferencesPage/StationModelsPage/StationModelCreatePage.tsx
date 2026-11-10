// StationModelCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (новые поля isAutomatic/isAddress, fallback имени ячейки, безопасный focus)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { canUploadNow, useCanExport } from '../../../services/features/fileAccess';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import StationModelMainTab from './StationModelMainTab';
import StationModelGridTab from './StationModelGridTab';
import type { LocalDocumentItem, DocumentChange } from './StationModelFilesTab';
import StationModelFilesTab from './StationModelFilesTab';
import HistoryTable from '../../elements/HistoryTable';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';

export interface CellData {
  id: string;
  drum?: number;
  column: number;
  row: number;       // на фронте row; на бэк уходит как number
  colSpan: number;
  rowSpan: number;
  deleted: boolean;
  name: string;
}

interface LocalImageItem {
  file: File;
  url: string;
  serverImageUid?: string;
  isNew?: boolean;
}

interface InitialState {
  name: string;
  article: string;
  revision: string;
  description: string;
  typeId: string;
  manufacturerId: string;
  isAutomatic: boolean;
  isAddress: boolean;
  cells: CellData[];
  modelImageUrl: string;
}

const BTN_COLLAPSED = 40;
const BTN_SEARCH_EXPANDED = 280;

const StationModelCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

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
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [isAddress, setIsAddress] = useState(false);

  const [localImage, setLocalImage] = useState<LocalImageItem | null>(null);
  const [localDocuments, setLocalDocuments] = useState<LocalDocumentItem[]>([]);
  const [documentChanges, setDocumentChanges] = useState<DocumentChange[]>([]);
  const [deletedImageUid, setDeletedImageUid] = useState<string | null>(null);

  const [selectedDrum, setSelectedDrum] = useState<number>(1);
  const [cells, setCells] = useState<CellData[]>([]);

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchValue, setHistorySearchValue] = useState('');
  const [historySearchExpanded, setHistorySearchExpanded] = useState(false);
  const historySearchInputRef = useRef<HTMLInputElement>(null);

  const [initialState, setInitialState] = useState<InitialState | null>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const canExport = useCanExport();

  const getPopupOpenKey = () => `station_model_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('stationType');
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);

  const tabs_list = ['Основное', 'Структура', 'Файлы'];

  // Инвариант: автоматический ⇒ адресный
  useEffect(() => {
    if (isAutomatic && !isAddress) setIsAddress(true);
  }, [isAutomatic, isAddress]);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    if (isEditMode) {
      setIsDataSaved(true);
      loadModelData(uid);
    }
  }, [uid]);

  useEffect(() => {
    if (!historySearchExpanded) return;
    const t = setTimeout(() => {
      historySearchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [historySearchExpanded]);

  const loadModelData = async (modelUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationModel(modelUid))).data;
      setName(d.name || ''); setArticle(d.article || ''); setRevision(d.revision || '');
      setDescription(d.purpose || ''); setModelCode(d.code || 0);
      setIsAutomatic(!!d.isAutomatic);
      setIsAddress(!!d.isAddress);
      if (d.typeId) { setTypeId(d.typeId); setTypeName(d.typeName || ''); }
      if (d.manufacturerId) { setManufacturerId(d.manufacturerId); setManufacturerName(d.manufacturerName || ''); }

      let loadedCells: CellData[] = [];
      let loadedImageUrl = '';

      if (d.cellsStructure) {
        try {
          const cs = typeof d.cellsStructure === 'string' ? JSON.parse(d.cellsStructure) : d.cellsStructure;
          if (Array.isArray(cs?.cells)) {
            loadedCells = cs.cells.map((c: any) => {
              const col = c.column;
              const row = c.number ?? c.row ?? 1;
              return {
                id: c.id || crypto.randomUUID(),
                drum: c.drum,
                column: col,
                row,
                colSpan: c.colSpan ?? 1,
                rowSpan: c.rowSpan ?? 1,
                deleted: !!c.deleted,
                name: c.name && String(c.name).trim() ? c.name : `${col}-${row}`,
              };
            });
            setCells(loadedCells);
          }
        } catch (e) { console.error(e); }
      }

      try {
        const imgRes = await AxiosService.get(ConstantInfo.restApiStationModelImages(modelUid));
        if (imgRes.data?.length > 0) {
          loadedImageUrl = imgRes.data[0].url ? ConstantInfo.fileDir + imgRes.data[0].url.replace(/^\//, '') : '';
          setModelImageUrl(loadedImageUrl);
        }
      } catch (e) {}

      setInitialState({
        name: d.name || '',
        article: d.article || '',
        revision: d.revision || '',
        description: d.purpose || '',
        typeId: d.typeId || '',
        manufacturerId: d.manufacturerId || '',
        isAutomatic: !!d.isAutomatic,
        isAddress: !!d.isAddress,
        cells: JSON.parse(JSON.stringify(loadedCells)),
        modelImageUrl: loadedImageUrl,
      });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const normalizeCells = useCallback((list: CellData[]) => {
    return list.map(c => ({
      drum: c.drum,
      column: c.column,
      row: c.row,
      colSpan: c.colSpan,
      rowSpan: c.rowSpan,
      deleted: c.deleted,
      name: c.name,
    })).sort((a, b) => a.column - b.column || a.row - b.row || (a.drum || 0) - (b.drum || 0));
  }, []);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialState) return name.trim().length > 0 || localImage !== null || localDocuments.length > 0 || documentChanges.length > 0 || deletedImageUid !== null;

    const cellsChanged = JSON.stringify(normalizeCells(cells)) !== JSON.stringify(normalizeCells(initialState.cells));
    const imageChanged = localImage !== null || deletedImageUid !== null;
    const documentsChanged = localDocuments.length > 0 || documentChanges.length > 0;

    return (
      name !== initialState.name ||
      article !== initialState.article ||
      revision !== initialState.revision ||
      description !== initialState.description ||
      typeId !== initialState.typeId ||
      manufacturerId !== initialState.manufacturerId ||
      isAutomatic !== initialState.isAutomatic ||
      isAddress !== initialState.isAddress ||
      cellsChanged ||
      imageChanged ||
      documentsChanged
    );
  }, [isEdit, initialState, name, article, revision, description, typeId, manufacturerId, isAutomatic, isAddress, cells, localImage, localDocuments, documentChanges, deletedImageUid, normalizeCells]);

  const canSave = isDirty && name.trim().length > 0 && (!isAutomatic || (isAutomatic && isAddress));

  const getStatusIcon = (): string => {
    if (!isDataSaved) return StatusIcon93Red;
    if (isDirty) return StatusIcon107Orange;
    return StatusIcon104Blue;
  };

  const getStatusIconWidth = (): number => {
    if (!isDataSaved) return 93;
    if (isDirty) return 107;
    return 104;
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationModelEventsByUid(uid || ''));
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription })));
    } catch (e) { console.error(e); } finally { setHistoryLoading(false); }
  };

  const handleHistoryClick = () => {
    if (!showHistory) { fetchHistory(); setSlideDirection('left'); }
    else { setSlideDirection('right'); }
    setShowHistory(!showHistory);
  };

  const handleTabClick = (index: number) => {
    if (showHistory) { setSlideDirection('right'); setShowHistory(false); setActiveTab(index); return; }
    if (index === activeTab) return;
    setSlideDirection(index > activeTab ? 'left' : 'right');
    setActiveTab(index);
  };

  // Преобразование фронтовой CellData → бэк-формат (row → number)
  const serializeCells = (list: CellData[]) => {
    return list.map(c => ({
      id: c.id,
      drum: c.drum,
      column: c.column,
      number: c.row,          // маппинг row → number
      colSpan: c.colSpan,
      rowSpan: c.rowSpan,
      deleted: c.deleted,
      name: c.name,
    }));
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const cellsStructure = JSON.stringify({ cells: serializeCells(cells) });

      const body: any = {
        uid,
        name: name.trim(),
        article: isAutomatic ? article.trim() : null,
        revision: isAutomatic ? revision.trim() : null,
        purpose: description.trim(),
        typeId: isAutomatic ? (typeId || null) : null,
        manufacturerId: isAutomatic ? (manufacturerId || null) : null,
        isAutomatic,
        isAddress,
        cellsStructure,
      };

      const wasCreate = !isEdit;
      if (isEdit) await AxiosService.patch(`${ConstantInfo.restApiStationModels}/${uid}`, body);
      else await AxiosService.post(ConstantInfo.restApiStationModels, body);

      const uploadsOn = canUploadNow();
      if (uploadsOn) {
        for (const doc of localDocuments) {
          if (doc.isNew) {
            const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName);
            await AxiosService.post(ConstantInfo.restApiStationModelDocuments(uid), fd);
          }
        }
        setLocalDocuments([]);
      }

      for (const change of documentChanges.filter(c => c.action === 'rename' && c.serverUid)) {
        await AxiosService.patch(`${ConstantInfo.restApiStationModels}/documents/${change.serverUid}/rename?documentName=${encodeURIComponent(change.documentName || '')}`);
      }

      for (const change of documentChanges.filter(c => c.action === 'delete' && c.serverUid)) {
        await AxiosService.delete(ConstantInfo.restApiStationModelDeleteDocument(change.serverUid!));
      }
      setDocumentChanges([]);

      if (uploadsOn && localImage?.isNew) {
        const fd = new FormData(); fd.append('file', localImage.file);
        await AxiosService.post(ConstantInfo.restApiStationModelImages(uid), fd);

        try {
          const imgRes = await AxiosService.get(ConstantInfo.restApiStationModelImages(uid));
          if (imgRes.data?.length > 0) {
            const newUrl = imgRes.data[0].url
              ? (imgRes.data[0].url.startsWith('http') ? imgRes.data[0].url : ConstantInfo.fileDir + imgRes.data[0].url.replace(/^\//, ''))
              : '';
            setModelImageUrl(newUrl);
          }
        } catch (e) {}
      }

      if (deletedImageUid) {
        await AxiosService.delete(ConstantInfo.restApiStationModelDeleteImage(deletedImageUid));
        setDeletedImageUid(null);
        setModelImageUrl('');
      }
      if (uploadsOn) setLocalImage(null);

      setInitialState({
        name: name.trim(),
        article: isAutomatic ? article.trim() : '',
        revision: isAutomatic ? revision.trim() : '',
        description: description.trim(),
        typeId: isAutomatic ? typeId : '',
        manufacturerId: isAutomatic ? manufacturerId : '',
        isAutomatic,
        isAddress,
        cells: JSON.parse(JSON.stringify(cells)),
        modelImageUrl: modelImageUrl,
      });

      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      setIsDataSaved(true);
      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/references/station-models/edit/${uid}`;
        const newLabel = `Модель станции: ${name.trim()}`;
        replaceTab(activeTabId, newPath, newLabel, <StationModelCreatePage />);
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) { sessionStorage.removeItem(getPopupOpenKey()); if (localImage) URL.revokeObjectURL(localImage.url); } };
  const handleCloseWithoutSaving = () => { if (uid) { sessionStorage.removeItem(getPopupOpenKey()); if (localImage) URL.revokeObjectURL(localImage.url); } handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };
  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };
  const openPopup = (type: PopupType, filter?: string) => { setPopupType(type); setPopupFilterParam(filter || undefined); setPopupOpen(true); if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true'); };

  const handleTypeSelect = (id: string, nm: string) => {
    setTypeId(id);
    setTypeName(nm);
  };

  const handlePopupSelect = (id: string, nm: string) => {
    switch (popupType) {
      case 'stationType': handleTypeSelect(id, nm); break;
      case 'stationManufacturer': setManufacturerId(id); setManufacturerName(nm); break;
    }
  };

  const handlePopupClose = () => { setPopupOpen(false); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };

  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const buttonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden' });
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const historySearchWidth = historySearchExpanded ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const tween = { type: 'tween' as const, duration: 0.2 };

  const renderContent = () => {
    if (showHistory) {
      return (
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 15, zIndex: 10, height: 40 }}>
            <motion.div
              style={{ position: 'absolute', left: 0, top: 0, height: 40, borderRadius: 10, backgroundColor: historySearchExpanded ? '#666EFE' : '#FFFFFF', border: historySearchExpanded ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }}
              animate={{ width: historySearchWidth }}
              transition={tween}
            >
              <div onClick={historySearchExpanded ? () => { setHistorySearchExpanded(false); setHistorySearchValue(''); } : () => setHistorySearchExpanded(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <img src={historySearchExpanded ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              </div>
              {historySearchExpanded && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
                  <input ref={historySearchInputRef} type="text" value={historySearchValue} onChange={e => setHistorySearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', maxWidth: 211, height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                </div>
              )}
            </motion.div>
          </div>
          <div style={{ position: 'absolute', top: 52, left: 0 }}>
            <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={1740} visibleRows={8} rowHeight={58} headerHeight={58} dateLabel="Дата и время" authorLabel="Автор" eventLabel="Событие" searchValue={historySearchValue} />
          </div>
        </div>
      );
    }

    if (activeTab === 2) {
      return (
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0 }}>
          <StationModelFilesTab modelUid={uid || ''} isEdit={isEdit} localDocuments={localDocuments} setLocalDocuments={setLocalDocuments} documentChanges={documentChanges} setDocumentChanges={setDocumentChanges} />
        </div>
      );
    }

    return (
      <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', borderRadius: 15, border: '1px solid rgba(102, 110, 254, 0.15)', overflow: 'hidden' }}>
        {activeTab === 0 && (
          <StationModelMainTab
            uid={uid} code={modelCode} name={name} article={article} revision={revision} description={description}
            typeId={typeId} typeName={typeName} manufacturerId={manufacturerId} manufacturerName={manufacturerName}
            modelImageUrl={modelImageUrl} localImage={localImage} setLocalImage={setLocalImage}
            setModelImageUrl={setModelImageUrl}
            deletedImageUid={deletedImageUid} setDeletedImageUid={setDeletedImageUid}
            setName={setName} setArticle={setArticle} setRevision={setRevision} setDescription={setDescription}
            setTypeId={setTypeId} setTypeName={setTypeName} setManufacturerId={setManufacturerId} setManufacturerName={setManufacturerName}
            handleTypeSelect={handleTypeSelect}
            openPopup={openPopup} isEdit={isEdit}
            isAutomatic={isAutomatic} setIsAutomatic={setIsAutomatic}
            isAddress={isAddress} setIsAddress={setIsAddress}
          />
        )}
        {activeTab === 1 && (
          <StationModelGridTab
            isAddress={isAddress}
            selectedDrum={selectedDrum} setSelectedDrum={setSelectedDrum}
            cells={cells} setCells={setCells}
          />
        )}
      </div>
    );
  };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({ x: direction === 'left' ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'left' | 'right') => ({ x: direction === 'left' ? -200 : 200, opacity: 0 }),
  };

  const currentView = showHistory ? 'history' : `tab-${activeTab}`;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, zIndex: 10, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory
            ? `Модель станции: ${initialState?.name || 'Модель'} (История изменений)`
            : isEdit
              ? `Справочник: Модель станции (${initialState?.name || 'Модель'})`
              : 'Справочник: Модель станции (Создание)'}
        </h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabClick(0)} style={mainButtonStyle(activeTab === 0 && !showHistory)}>
            <span>Основное</span>
            <span role="button" tabIndex={0} aria-label="Свернуть или развернуть вкладки" onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleToggleCollapse(); } }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }} />
            </span>
          </button>
          <AnimatePresence>
            {!tabsCollapsed && tabs_list.slice(1).map((tab, i) => (
              <motion.button key={tab} onClick={() => handleTabClick(i + 1)} style={buttonStyle(activeTab === i + 1 && !showHistory)} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3 }}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 15 }}>
          {canExport && (
            <>
              <button style={smallButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
              <button style={smallButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
            </>
          )}
          <button style={{ ...smallButtonStyle, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF' }} onClick={handleHistoryClick}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: showHistory ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 155, left: 30, right: 30, bottom: 96, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div key={currentView} custom={slideDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
        <button onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving} style={{ width: 154, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', opacity: canSave ? 1 : 0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17, flexShrink: 0 }}>Записать</span>
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