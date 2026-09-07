// StationCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (исправлена конвертация даты при сохранении)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import StationMainTab from './StationMainTab';
import StationConfigurationTab from './StationConfigurationTab';
import StationFilesTab from './StationFilesTab';
import type { StationLocalDocumentItem, StationDocumentChange } from './StationFilesTab';
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

const USER_ID = 1;

const BTN_COLLAPSED = 40;
const BTN_SEARCH_EXPANDED = 280;

interface InitialState {
  name: string;
  description: string;
  serialNumber: string;
  productionDate: string;
  status: string;
  ipAddress: string;
  networkPort: number | '';
  parentUid: string;
  hasError: boolean;
  isTmc: boolean;
  isSgd: boolean;
  isOk: boolean;
  isAdditionalModule: boolean;
  hasAdditionalModule: boolean;
  modelId: string;
  configurationUid: string;
  holdingId: number | null;
  enterpriseId: number | null;
  workshopId: number | null;
  sectionId: number | null;
}

const StationCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const [name, setName] = useState('');
  const [code, setCode] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [status, setStatus] = useState('WORKING');
  const [ipAddress, setIpAddress] = useState('');
  const [networkPort, setNetworkPort] = useState<number | ''>('');
  const [parentUid, setParentUid] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isTmc, setIsTmc] = useState(false);
  const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false);
  const [isAdditionalModule, setIsAdditionalModule] = useState(false);
  const [hasAdditionalModule, setHasAdditionalModule] = useState(false);
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');
  const [article, setArticle] = useState('');
  const [typeName, setTypeName] = useState('');
  const [revision, setRevision] = useState('');
  const [modelImageUrl, setModelImageUrl] = useState('');
  const [configurationUid, setConfigurationUid] = useState('');
  const [configurationName, setConfigurationName] = useState('');
  const [holdingId, setHoldingId] = useState<number | null>(null);
  const [holdingName, setHoldingName] = useState('');
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
  const [enterpriseName, setEnterpriseName] = useState('');
  const [workshopId, setWorkshopId] = useState<number | null>(null);
  const [workshopName, setWorkshopName] = useState('');
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [sectionName, setSectionName] = useState('');

  const [localDocuments, setLocalDocuments] = useState<StationLocalDocumentItem[]>([]);
  const [documentChanges, setDocumentChanges] = useState<StationDocumentChange[]>([]);

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

  const getPopupOpenKey = () => `station_create_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('stationModel');
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);

  const tabs_list = ['Основное', 'Конфигурация', 'Файлы'];

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    if (isEditMode) {
      setIsDataSaved(true);
      loadStationData(uid);
    } else {
      const copyKey = `station_copy_${uid}`;
      const copyDataStr = sessionStorage.getItem(copyKey);
      if (copyDataStr) {
        try {
          const copyData = JSON.parse(copyDataStr);
          applyCopyData(copyData);
          sessionStorage.removeItem(copyKey);
        } catch (e) {
          console.error('Ошибка чтения данных копирования:', e);
        }
      } else {
        fetchGenerateCode();
      }
    }
  }, [uid]);

  useEffect(() => { if (historySearchExpanded && historySearchInputRef.current) setTimeout(() => historySearchInputRef.current?.focus(), 100); }, [historySearchExpanded]);

  // Функция конвертации даты для API
  const convertDateForAPI = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Если дата уже в ISO формате (YYYY-MM-DD)
    if (dateStr.includes('-') && dateStr.length === 10) return dateStr;
    // Конвертируем из DD.MM.YYYY в YYYY-MM-DD
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  // Функция конвертации даты из API для отображения
  const convertDateFromAPI = (dateStr: string): string => {
    if (!dateStr) return '';
    // Если дата уже в формате DD.MM.YYYY
    if (dateStr.includes('.')) return dateStr;
    // Конвертируем из YYYY-MM-DD в DD.MM.YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const fetchGenerateCode = async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrudGenerateCode);
      setCode(r.data || 0);
    } catch (e) {
      console.error(e);
      setCode(0);
    }
  };

  const downloadFile = async (url: string): Promise<File | null> => {
    try {
      const fullUrl = url.startsWith('http') ? url : ConstantInfo.fileDir + url.replace(/^\//, '');
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      return new File([blob], '', { type: blob.type });
    } catch (e) {
      console.error('Ошибка скачивания файла:', e);
      return null;
    }
  };

  const applyCopyData = async (d: any) => {
    setName(d.name || '');
    setCode(d.code || 0);
    setDescription(d.description || '');
    setSerialNumber(d.serialNumber || '');
    setProductionDate(convertDateFromAPI(d.productionDate || ''));
    setStatus(d.status || 'WORKING');
    setIpAddress(d.ipAddress || '');
    setNetworkPort(d.networkPort || '');
    setParentUid(d.parentUid || '');
    setHasError(d.hasError || false);
    setIsTmc(d.isTmc || false);
    setIsSgd(d.isSgd || false);
    setIsOk(d.isOk || false);
    setIsAdditionalModule(d.isAdditionalModule || false);
    setHasAdditionalModule(d.hasAdditionalModule || false);

    if (d.modelId) {
      setModelId(d.modelId);
      setModelName(d.modelName || '');
      setArticle(d.article || '');
      setTypeName(d.stationType || '');
      setRevision(d.revision || '');
      loadModelInfo(d.modelId);
    }

    if (d.configurationUid) {
      setConfigurationUid(d.configurationUid);
      setConfigurationName(d.configurationName || '');
    }

    if (d.holdingId) { setHoldingId(d.holdingId); setHoldingName(d.holdingName || ''); }
    if (d.enterpriseId) { setEnterpriseId(d.enterpriseId); setEnterpriseName(d.enterpriseName || ''); }
    if (d.workshopId) { setWorkshopId(d.workshopId); setWorkshopName(d.workshopName || ''); }
    if (d.sectionId) { setSectionId(d.sectionId); setSectionName(d.sectionName || ''); }

    if (d.documents && Array.isArray(d.documents)) {
      const newLocalDocs: StationLocalDocumentItem[] = [];
      for (const doc of d.documents) {
        const fileUrl = doc.url || doc.filePath || doc.fileUrl;
        if (fileUrl) {
          const file = await downloadFile(fileUrl);
          if (file) {
            newLocalDocs.push({
              localId: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              documentName: doc.documentName || doc.originalName || 'Документ',
              file: new File([file], doc.originalName || doc.documentName || 'document', { type: file.type }),
              isNew: true,
            });
          }
        }
      }
      setLocalDocuments(newLocalDocs);
    }

    setInitialState({
      name: d.name || '',
      description: d.description || '',
      serialNumber: d.serialNumber || '',
      productionDate: convertDateFromAPI(d.productionDate || ''),
      status: d.status || 'WORKING',
      ipAddress: d.ipAddress || '',
      networkPort: d.networkPort || '',
      parentUid: d.parentUid || '',
      hasError: d.hasError || false,
      isTmc: d.isTmc || false,
      isSgd: d.isSgd || false,
      isOk: d.isOk || false,
      isAdditionalModule: d.isAdditionalModule || false,
      hasAdditionalModule: d.hasAdditionalModule || false,
      modelId: d.modelId || '',
      configurationUid: d.configurationUid || '',
      holdingId: d.holdingId || null,
      enterpriseId: d.enterpriseId || null,
      workshopId: d.workshopId || null,
      sectionId: d.sectionId || null,
    });
  };

  const loadStationData = async (stationUid: string) => {
    setIsLoading(true);
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationCrud(stationUid))).data;
      setName(d.name || ''); setCode(d.code || 0); setDescription(d.description || '');
      setSerialNumber(d.serialNumber || ''); 
      setProductionDate(convertDateFromAPI(d.productionDate || ''));
      setStatus(d.status || 'WORKING'); setIpAddress(d.ipAddress || ''); setNetworkPort(d.networkPort || '');
      setParentUid(d.parentUid || '');
      setHasError(d.hasError || false); setIsTmc(d.isTmc || false); setIsSgd(d.isSgd || false);
      setIsOk(d.isOk || false); setIsAdditionalModule(d.isAdditionalModule || false);
      setHasAdditionalModule(d.hasAdditionalModule || false);
      if (d.modelId) {
        setModelId(d.modelId); setModelName(d.modelName || '');
        setArticle(d.article || ''); setTypeName(d.stationType || ''); setRevision(d.revision || '');
        await loadModelInfo(d.modelId);
      }
      if (d.configurationUid) { setConfigurationUid(d.configurationUid); setConfigurationName(d.configurationName || ''); }
      if (d.holdingId) { setHoldingId(d.holdingId); setHoldingName(d.holdingName || ''); }
      if (d.enterpriseId) { setEnterpriseId(d.enterpriseId); setEnterpriseName(d.enterpriseName || ''); }
      if (d.workshopId) { setWorkshopId(d.workshopId); setWorkshopName(d.workshopName || ''); }
      if (d.sectionId) { setSectionId(d.sectionId); setSectionName(d.sectionName || ''); }

      setInitialState({
        name: d.name || '',
        description: d.description || '',
        serialNumber: d.serialNumber || '',
        productionDate: convertDateFromAPI(d.productionDate || ''),
        status: d.status || 'WORKING',
        ipAddress: d.ipAddress || '',
        networkPort: d.networkPort || '',
        parentUid: d.parentUid || '',
        hasError: d.hasError || false,
        isTmc: d.isTmc || false,
        isSgd: d.isSgd || false,
        isOk: d.isOk || false,
        isAdditionalModule: d.isAdditionalModule || false,
        hasAdditionalModule: d.hasAdditionalModule || false,
        modelId: d.modelId || '',
        configurationUid: d.configurationUid || '',
        holdingId: d.holdingId || null,
        enterpriseId: d.enterpriseId || null,
        workshopId: d.workshopId || null,
        sectionId: d.sectionId || null,
      });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const loadModelInfo = async (modelUid: string) => {
    try {
      const d = (await AxiosService.get(ConstantInfo.restApiStationModel(modelUid))).data;
      setArticle(d.article || '');
      setRevision(d.revision || '');
      if (d.typeName) setTypeName(d.typeName);
      if (d.name) setModelName(d.name);
      
      const imgRes = await AxiosService.get(ConstantInfo.restApiStationModelImages(modelUid));
      if (imgRes.data && imgRes.data.length > 0) {
        setModelImageUrl(imgRes.data[0].url ? ConstantInfo.fileDir + imgRes.data[0].url.replace(/^\//, '') : '');
      } else {
        setModelImageUrl('');
      }
      
      const configsRes = await AxiosService.get(`${ConstantInfo.restApiStationConfigurations}?modelId=${modelUid}`);
      const configsList = Array.isArray(configsRes.data) ? configsRes.data : (configsRes.data?.data || []);
      
      if (configsList.length > 0) {
        const defaultConfig = configsList.find((c: any) => 
          c.name && (c.name.toLowerCase().includes('типовая') || c.name.toLowerCase().includes('типовая конфигурация') || c.name.toLowerCase().includes('default') || c.name.toLowerCase().includes('по умолчанию'))
        ) || configsList[0];
        
        setConfigurationUid(defaultConfig.uid || defaultConfig.id);
        setConfigurationName(defaultConfig.name);
      } else {
        setConfigurationUid('');
        setConfigurationName('');
      }
    } catch (e) { console.error(e); }
  };

  const fetchEnterpriseHolding = async (entId: number) => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiEnterprise(entId));
      const ent = res.data;
      if (ent.holdingId) { setHoldingId(ent.holdingId); setHoldingName(ent.holdingName || ''); }
      else { setHoldingId(null); setHoldingName(''); }
    } catch (e) { console.error(e); }
  };

  const isDirty = useMemo(() => {
    if (!isEdit || !initialState) return name.trim().length > 0 || localDocuments.length > 0 || documentChanges.length > 0;
    
    return (
      name !== initialState.name ||
      description !== initialState.description ||
      serialNumber !== initialState.serialNumber ||
      productionDate !== initialState.productionDate ||
      status !== initialState.status ||
      ipAddress !== initialState.ipAddress ||
      networkPort !== initialState.networkPort ||
      parentUid !== initialState.parentUid ||
      hasError !== initialState.hasError ||
      isTmc !== initialState.isTmc ||
      isSgd !== initialState.isSgd ||
      isOk !== initialState.isOk ||
      isAdditionalModule !== initialState.isAdditionalModule ||
      hasAdditionalModule !== initialState.hasAdditionalModule ||
      modelId !== initialState.modelId ||
      configurationUid !== initialState.configurationUid ||
      holdingId !== initialState.holdingId ||
      enterpriseId !== initialState.enterpriseId ||
      workshopId !== initialState.workshopId ||
      sectionId !== initialState.sectionId ||
      localDocuments.length > 0 ||
      documentChanges.length > 0
    );
  }, [isEdit, initialState, name, description, serialNumber, productionDate, status, ipAddress, networkPort, parentUid, hasError, isTmc, isSgd, isOk, isAdditionalModule, hasAdditionalModule, modelId, configurationUid, holdingId, enterpriseId, workshopId, sectionId, localDocuments, documentChanges]);

  const canSave = isDirty && name.trim().length > 0;

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
      const r = await AxiosService.get(ConstantInfo.restApiStationEventsByUid(uid || ''));
      setHistoryEvents((r.data || []).map((e: any) => ({ uid: e.uid, createdAt: e.createdAt, author: e.author, eventDescription: e.eventDescription })));
    } catch (e) { console.error(e); } finally { setHistoryLoading(false); }
  };

  const handleHistoryClick = () => {
    if (!showHistory) {
      fetchHistory();
      setSlideDirection('left');
    } else {
      setSlideDirection('right');
    }
    setShowHistory(!showHistory);
  };

  const handleTabClick = (index: number) => {
    if (showHistory) {
      setSlideDirection('right');
      setShowHistory(false);
      setActiveTab(index);
      return;
    }
    if (index === activeTab) return;
    setSlideDirection(index > activeTab ? 'left' : 'right');
    setActiveTab(index);
  };

  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const body: any = {
        uid, name: name.trim(), description: description.trim(),
        serialNumber: serialNumber.trim(), 
        productionDate: convertDateForAPI(productionDate), // Конвертируем дату для API
        status, ipAddress: ipAddress.trim(), networkPort: networkPort || null,
        parentUid: parentUid || null,
        hasError, isTmc, isSgd, isOk, isAdditionalModule, hasAdditionalModule,
        modelId: modelId || null, configurationUid: configurationUid || null,
        holdingId: holdingId || null,
        enterpriseId: enterpriseId || null, workshopId: workshopId || null, sectionId: sectionId || null,
      };
      
      console.log('Отправляемые данные:', body); // Для отладки
      
      const wasCreate = !isEdit;
      if (isEdit) {
        await AxiosService.patch(ConstantInfo.restApiStationCrud(uid), body);
      } else {
        await AxiosService.post(ConstantInfo.restApiStationsCrud(USER_ID).split('?')[0], body);
      }

      for (const doc of localDocuments) {
        if (doc.isNew) {
          const fd = new FormData();
          fd.append('file', doc.file);
          fd.append('documentName', doc.documentName);
          await AxiosService.post(ConstantInfo.restApiStationDocuments(uid), fd);
        }
      }
      setLocalDocuments([]);

      for (const change of documentChanges.filter(c => c.action === 'rename' && c.serverUid)) {
        await AxiosService.patch(`${ConstantInfo.restApiStationDocuments(uid)}/${change.serverUid}/rename?documentName=${encodeURIComponent(change.documentName || '')}`);
      }

      for (const change of documentChanges.filter(c => c.action === 'delete' && c.serverUid)) {
        await AxiosService.delete(ConstantInfo.restApiStationDeleteDocument(uid, change.serverUid!));
      }
      setDocumentChanges([]);
      
      setInitialState({
        name: name.trim(),
        description: description.trim(),
        serialNumber: serialNumber.trim(),
        productionDate: productionDate,
        status: status,
        ipAddress: ipAddress.trim(),
        networkPort: networkPort,
        parentUid: parentUid,
        hasError: hasError,
        isTmc: isTmc,
        isSgd: isSgd,
        isOk: isOk,
        isAdditionalModule: isAdditionalModule,
        hasAdditionalModule: hasAdditionalModule,
        modelId: modelId,
        configurationUid: configurationUid,
        holdingId: holdingId,
        enterpriseId: enterpriseId,
        workshopId: workshopId,
        sectionId: sectionId,
      });
      
      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      setIsDataSaved(true);
      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/references/stations/edit/${uid}`;
        const newLabel = `Станция: ${name.trim()}`;
        replaceTab(activeTabId, newPath, newLabel, <StationCreatePage />);
      }
    } catch (e) { 
      console.error('Ошибка сохранения:', e); 
      alert('Ошибка при сохранении: ' + (e as any).message);
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };
  const handleCloseWithoutSaving = () => { if (uid) sessionStorage.removeItem(getPopupOpenKey()); handleClose(); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };
  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };

  const openPopup = (type: PopupType, filter?: string) => {
    setPopupType(type); setPopupFilterParam(filter || undefined);
    setPopupOpen(true); if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true');
  };

  const handlePopupSelect = (id: string, nm: string) => {
    switch (popupType) {
      case 'stationModel': 
        setModelId(id); 
        setModelName(nm); 
        loadModelInfo(id); 
        break;
      case 'stationConfiguration': setConfigurationUid(id); setConfigurationName(nm); break;
      case 'enterprise':
        const entId = Number(id); setEnterpriseId(entId); setEnterpriseName(nm);
        setWorkshopId(null); setWorkshopName(''); setSectionId(null); setSectionName('');
        fetchEnterpriseHolding(entId); break;
      case 'workshop': setWorkshopId(Number(id)); setWorkshopName(nm); setSectionId(null); setSectionName(''); break;
      case 'section': setSectionId(Number(id)); setSectionName(nm); break;
    }
  };

  const handlePopupClose = () => { setPopupOpen(false); if (uid) sessionStorage.removeItem(getPopupOpenKey()); };

  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 151, height: 40, borderRadius: 10,
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
    color: isActive ? '#FFFFFF' : '#2D4059',
    transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21,
  });

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 151, height: 40, borderRadius: 10,
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
    color: isActive ? '#FFFFFF' : '#2D4059',
    transition: 'all 0.3s ease', overflow: 'hidden',
  });

  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  const historySearchWidth = historySearchExpanded ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const tween = { type: 'tween' as const, duration: 0.2 };

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

  const currentView = showHistory ? 'history' : `tab-${activeTab}`;

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

    return (
      <div style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0 }}>
        {activeTab === 0 && (
          <StationMainTab
            uid={uid} code={code} name={name}
            modelId={modelId} modelName={modelName}
            article={article} typeName={typeName} revision={revision}
            modelImageUrl={modelImageUrl}
            serialNumber={serialNumber} productionDate={productionDate}
            holdingId={holdingId} holdingName={holdingName}
            enterpriseId={enterpriseId} enterpriseName={enterpriseName}
            workshopId={workshopId} workshopName={workshopName}
            sectionId={sectionId} sectionName={sectionName}
            setHoldingId={setHoldingId} setHoldingName={setHoldingName}
            setEnterpriseId={setEnterpriseId} setEnterpriseName={setEnterpriseName}
            setWorkshopId={setWorkshopId} setWorkshopName={setWorkshopName}
            setSectionId={setSectionId} setSectionName={setSectionName}
            setModelId={setModelId} setModelName={setModelName}
            hasError={hasError} setHasError={setHasError}
            isTmc={isTmc} setIsTmc={setIsTmc}
            isSgd={isSgd} setIsSgd={setIsSgd}
            isOk={isOk} setIsOk={setIsOk}
            isAdditionalModule={isAdditionalModule} setIsAdditionalModule={setIsAdditionalModule}
            hasAdditionalModule={hasAdditionalModule} setHasAdditionalModule={setHasAdditionalModule}
            status={status} setStatus={setStatus}
            description={description} setDescription={setDescription}
            ipAddress={ipAddress} setIpAddress={setIpAddress}
            networkPort={networkPort} setNetworkPort={setNetworkPort}
            parentUid={parentUid} setParentUid={setParentUid}
            setName={setName} setSerialNumber={setSerialNumber}
            setProductionDate={setProductionDate}
            openPopup={openPopup} isEdit={isEdit}
          />
        )}
        {activeTab === 1 && (
          <StationConfigurationTab
            configurationUid={configurationUid}
            configurationName={configurationName}
            modelId={modelId}
            modelName={modelName}
            ipAddress={ipAddress}
            networkPort={networkPort}
            setConfigurationUid={setConfigurationUid}
            setConfigurationName={setConfigurationName}
            setIpAddress={setIpAddress}
            setNetworkPort={setNetworkPort}
            openPopup={openPopup}
          />
        )}
        {activeTab === 2 && (
          <StationFilesTab
            stationUid={uid || ''}
            isEdit={isEdit}
            localDocuments={localDocuments}
            setLocalDocuments={setLocalDocuments}
            documentChanges={documentChanges}
            setDocumentChanges={setDocumentChanges}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, zIndex: 10, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
          {showHistory 
            ? `Станция: ${initialState?.name || 'Станция'} (История изменений)` 
            : isEdit 
              ? `Справочник: Станции (${initialState?.name || 'Станция'})` 
              : 'Справочник: Станции (Создание)'}
        </h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>

      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabClick(0)} style={mainButtonStyle(activeTab === 0 && !showHistory)}>
            <span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }} />
            </button>
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
          <button style={smallButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={{ ...smallButtonStyle, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF' }} onClick={handleHistoryClick}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: showHistory ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 155, left: 30, right: 30, bottom: 96, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentView}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 10 }}>
        <button onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving} style={{ width: 154, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059', opacity: canSave ? 1 : 0.5 }}>
          <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
          <span style={{ marginLeft: 17 }}>Записать</span>
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

export default StationCreatePage;