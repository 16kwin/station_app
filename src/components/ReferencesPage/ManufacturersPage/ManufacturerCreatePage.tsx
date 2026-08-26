import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import ManufacturerMainTab from './ManufacturerMainTab';
import ManufacturerDocumentsTab from './ManufacturerDocumentsTab';
import ManufacturerBrandsTab from './ManufacturerBrandsTab';
import ManufacturerAssortmentTab from './ManufacturerAssortmentTab';
import ManufacturerSuppliersTab from './ManufacturerSuppliersTab';
import ManufacturerIntegrationTab from './ManufacturerIntegrationTab';
import ManufacturerEventLogTab from './ManufacturerEventLogTab';
import Icon7 from '../../../assets/References/NomenclatureCreatePage/Icon7.svg';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';
import IconOne from '../../../assets/References/NomenclatureCreatePage/IconOne.svg';
import IconOne1 from '../../../assets/References/NomenclatureCreatePage/IconOne1.svg';
import IconTwo from '../../../assets/References/NomenclatureCreatePage/IconTwo.svg';

export interface ManufacturerDocumentItem { uid: string; manufacturerUid: string; documentName: string; filePath: string; originalName: string; url: string; createdAt: string; }
export interface LocalManufacturerDocument { localId: string; documentName: string; file: File; }
export interface ManufacturerImageItem { uid: string; url: string; originalName: string; }
export interface LocalManufacturerImage { file: File; url: string; }

export interface CommonManufacturerProps {
  uid?: string; name: string; isEdit: boolean; isSaving: boolean;
  documents: ManufacturerDocumentItem[];
  nameFocused: boolean; code?: number;
  isLoading: boolean;
  selectedCountry: string; selectedCountryId: string;
  address: string; selectedDirection: string; selectedDirectionId: string;
  description: string; email: string; website: string; phone: string;
  documentInputRef: React.RefObject<HTMLInputElement>;
  localDocuments: LocalManufacturerDocument[]; setLocalDocuments: React.Dispatch<React.SetStateAction<LocalManufacturerDocument[]>>;
  images: ManufacturerImageItem[]; setImages: React.Dispatch<React.SetStateAction<ManufacturerImageItem[]>>;
  localImages: LocalManufacturerImage[]; setLocalImages: React.Dispatch<React.SetStateAction<LocalManufacturerImage[]>>;
  setName: (v: string) => void; setNameFocused: (v: boolean) => void;
  setSelectedCountry: (v: string) => void; setSelectedCountryId: (v: string) => void;
  setAddress: (v: string) => void; setSelectedDirection: (v: string) => void; setSelectedDirectionId: (v: string) => void;
  setDescription: (v: string) => void; setEmail: (v: string) => void; setWebsite: (v: string) => void; setPhone: (v: string) => void;
  setDocuments: (v: ManufacturerDocumentItem[]) => void;
  handleDocumentUpload: (documentName: string, file: File) => void; handleDeleteDocument: (uid: string) => void;
  openPopup: (type: string) => void;
  isDataSaved: boolean;
  validationErrors: Set<string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const getDraftKey = (uid: string) => `manufacturer_draft_${uid}`;

interface DraftData {
  uid: string;
  code: number | undefined;
  name: string;
  selectedCountry: string;
  selectedCountryId: string;
  address: string;
  selectedDirection: string;
  selectedDirectionId: string;
  description: string;
  email: string;
  website: string;
  phone: string;
  isEdit: boolean;
  timestamp: number;
}

const saveDraftToStorage = (uid: string, data: DraftData) => {
  try { localStorage.setItem(getDraftKey(uid), JSON.stringify(data)); }
  catch (e) { console.error('Ошибка сохранения черновика производителя:', e); }
};

const loadDraftFromStorage = (uid: string): DraftData | null => {
  try {
    const raw = localStorage.getItem(getDraftKey(uid));
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) { localStorage.removeItem(getDraftKey(uid)); return null; }
    return data;
  } catch (e) { localStorage.removeItem(getDraftKey(uid)); return null; }
};

const clearDraftStorage = (uid: string) => { localStorage.removeItem(getDraftKey(uid)); };

const ManufacturerCreatePage = () => {
  const { uid, code: codeParam } = useParams<{ uid: string; code: string }>();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(''); const [code, setCode] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false); const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false); const [nameFocused, setNameFocused] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(''); const [selectedCountryId, setSelectedCountryId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedDirection, setSelectedDirection] = useState(''); const [selectedDirectionId, setSelectedDirectionId] = useState('');
  const [description, setDescription] = useState(''); const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); const [phone, setPhone] = useState('');

  const [localDocuments, setLocalDocuments] = useState<LocalManufacturerDocument[]>([]);
  const [images, setImages] = useState<ManufacturerImageItem[]>([]);
  const [localImages, setLocalImages] = useState<LocalManufacturerImage[]>([]);

  const [popupOpen, setPopupOpen] = useState(false); const [popupType, setPopupType] = useState<string>('country');

  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showDevPopup, setShowDevPopup] = useState(false);
  const [documents, setDocuments] = useState<ManufacturerDocumentItem[]>([]);

  const [isDataSaved, setIsDataSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [showBlockedTabWarning, setShowBlockedTabWarning] = useState(false);

  const tabs_list = ['Основное', 'Документы', 'Бренды', 'Ассортимент', 'Поставщики', 'Интеграции'];
  const EVENT_LOG_TAB = tabs_list.length;

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saveDraftToLocalStorage = useCallback(() => {
    if (!uid || !isDataLoaded) return;
    const draft: DraftData = { uid, code, name, selectedCountry, selectedCountryId, address, selectedDirection, selectedDirectionId, description, email, website, phone, isEdit, timestamp: Date.now() };
    saveDraftToStorage(uid, draft);
  }, [uid, code, name, isEdit, isDataLoaded, selectedCountry, selectedCountryId, address, selectedDirection, selectedDirectionId, description, email, website, phone]);

  useEffect(() => { if (!uid || !isDataLoaded) return; const t = setTimeout(() => saveDraftToLocalStorage(), 500); return () => clearTimeout(t); }, [saveDraftToLocalStorage, uid, isDataLoaded]);

  useEffect(() => { const handler = (e: Event) => { if ((e as CustomEvent).detail?.tab !== undefined) setActiveTab((e as CustomEvent).detail.tab); }; window.addEventListener('navigateToTab', handler); return () => window.removeEventListener('navigateToTab', handler); }, []);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    if (isEditMode) {
      setIsDataSaved(true);
      loadManufacturerData(uid).then(() => { 
        const draft = loadDraftFromStorage(uid); 
        if (draft && draft.uid === uid && draft.isEdit) { 
          setName(draft.name || ''); setCode(draft.code); 
          setSelectedCountry(draft.selectedCountry || ''); setSelectedCountryId(draft.selectedCountryId || ''); 
          setAddress(draft.address || ''); setSelectedDirection(draft.selectedDirection || ''); 
          setSelectedDirectionId(draft.selectedDirectionId || ''); setDescription(draft.description || ''); 
          setEmail(draft.email || ''); setWebsite(draft.website || ''); setPhone(draft.phone || ''); 
        }
        setIsDataLoaded(true); 
      });
      fetchDocuments(); fetchImages();
    } else {
      const draft = loadDraftFromStorage(uid);
      if (draft && draft.uid === uid) { 
        setName(draft.name || ''); setCode(draft.code); 
        setSelectedCountry(draft.selectedCountry || ''); setSelectedCountryId(draft.selectedCountryId || ''); 
        setAddress(draft.address || ''); setSelectedDirection(draft.selectedDirection || ''); 
        setSelectedDirectionId(draft.selectedDirectionId || ''); setDescription(draft.description || ''); 
        setEmail(draft.email || ''); setWebsite(draft.website || ''); setPhone(draft.phone || ''); 
        setIsDataLoaded(true); 
      }
      else { setIsDataSaved(false); setIsDataLoaded(true); if (codeParam) setCode(parseInt(codeParam)); }
    }
  }, [uid]);

  const fetchDocuments = async () => { if (!uid) return; try { const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${uid}/documents`); setDocuments((res.data || []).map((doc: any) => ({ ...doc, url: doc.url ? ConstantInfo.fileDir + doc.url.replace(/^\//, '') : '' }))); } catch (e) { console.error(e); } };
  const fetchImages = async () => { if (!uid) return; try { const res = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${uid}/images`); setImages((res.data || []).map((img: any) => ({ uid: img.uid, url: img.fileUrl ? ConstantInfo.fileDir + img.fileUrl.replace(/^\//, '') : '', originalName: img.originalName || '' }))); } catch (e) { console.error(e); } };
  const handleDocumentUpload = (documentName: string, file: File) => { setLocalDocuments(prev => [...prev, { localId: generateLocalId(), documentName, file }]); };
  const handleDeleteDocument = (docUid: string) => { setLocalDocuments(prev => prev.filter(d => d.localId !== docUid)); if (docUid && !docUid.startsWith('local_')) { AxiosService.delete(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/documents/${docUid}`).then(() => fetchDocuments()).catch(e => console.error(e)); } };

  const loadManufacturerData = async (muid: string): Promise<void> => { 
    setIsLoading(true); 
    try { 
      const d = (await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${muid}`)).data; 
      setName(d.name || ''); setCode(d.code); 
      if (d.countryUid) { setSelectedCountryId(d.countryUid); setSelectedCountry(d.countryName || ''); } else { setSelectedCountryId(''); setSelectedCountry(''); }
      setAddress(d.address || ''); 
      if (d.directionUid) { setSelectedDirectionId(d.directionUid); setSelectedDirection(d.directionName || ''); } else { setSelectedDirectionId(''); setSelectedDirection(''); }
      setDescription(d.description || ''); setEmail(d.email || ''); setWebsite(d.website || ''); setPhone(d.phone || ''); 
    } catch (e) { console.error(e); } finally { setIsLoading(false); } 
  };

  const getMissingFields = (): Set<string> => {
    const m = new Set<string>();
    if (!name.trim()) m.add('name'); if (!selectedCountryId) m.add('country'); if (!address.trim()) m.add('address');
    if (!selectedDirectionId) m.add('direction'); if (!email.trim()) m.add('email'); if (!website.trim()) m.add('website');
    if (!phone.trim()) m.add('phone');
    return m;
  };

  const getMissingFieldLabels = (): string[] => {
    const l: string[] = [];
    if (!name.trim()) l.push('Наименование'); if (!selectedCountryId) l.push('Страна'); if (!address.trim()) l.push('Адрес');
    if (!selectedDirectionId) l.push('Направление производства'); if (!email.trim()) l.push('Email'); if (!website.trim()) l.push('Сайт');
    if (!phone.trim()) l.push('Телефон');
    return l;
  };

  const handleSave = async () => {
    if (!uid) return; setIsSaving(true);
    try {
      await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud`, { uid, name, countryUid: selectedCountryId || null, address: address || null, directionUid: selectedDirectionId || null, description: description || null, email: email || null, website: website || null, phone: phone || null });
      for (const doc of localDocuments) { const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName); await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${uid}/documents`, fd); }
      for (const img of localImages) { const fd = new FormData(); fd.append('file', img.file); await AxiosService.post(`${ConstantInfo.apiBaseUrl}/api/manufacturers-crud/${uid}/images`, fd); }
      setLocalDocuments([]); setLocalImages([]); await fetchDocuments(); await fetchImages();
      clearDraftStorage(uid);
      setIsDataSaved(true); setValidationErrors(new Set()); window.dispatchEvent(new CustomEvent('refreshManufacturerEvents'));
      
      const wasCreate = !isEdit;
      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/references/manufacturers/edit/${uid}/${code}`;
        const newLabel = name.trim() || 'Производитель';
        replaceTab(activeTabId, newPath, newLabel, <ManufacturerCreatePage />);
      }
      return true;
    } catch (e) { console.error(e); return false; } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) clearDraftStorage(uid); };
  const handleSaveAndClose = async () => { if (await handleSave()) handleClose(); };
  const handleCloseWithoutSaving = () => { if (uid) clearDraftStorage(uid); handleClose(); };

  const handleTabChange = (index: number) => {
    if (!isDataSaved && index > 1) { const m = getMissingFields(); setValidationErrors(m); setShowBlockedTabWarning(true); return; }
    setActiveTab(index);
  };

  const handleEventLogClick = () => {
    if (!isDataSaved) { const m = getMissingFields(); setValidationErrors(m); setShowBlockedTabWarning(true); return; }
    setActiveTab(EVENT_LOG_TAB);
  };

  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };
  const canSave = !!name.trim();

  const openPopup = (type: string) => { setPopupType(type); setPopupOpen(true); };
  const handlePopupSelect = (id: string, nm: string) => { 
    switch (popupType) { 
      case 'country': setSelectedCountry(nm); setSelectedCountryId(id); setValidationErrors(p => { const n = new Set(p); n.delete('country'); return n; }); break; 
      case 'direction': setSelectedDirection(nm); setSelectedDirectionId(id); setValidationErrors(p => { const n = new Set(p); n.delete('direction'); return n; }); break; 
    } 
  };

  const buttonStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : isDisabled ? '#BCC8FF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden', opacity: isDisabled ? 0.5 : 1 });
  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const bottomButtonStyle: React.CSSProperties = { height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const rightButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  const isEventLogActive = activeTab === EVENT_LOG_TAB;

  const commonProps: CommonManufacturerProps = { uid, name, isEdit, isSaving, documents, nameFocused, code, isLoading, selectedCountry, selectedCountryId, address, selectedDirection, selectedDirectionId, description, email, website, phone, documentInputRef: documentInputRef as React.RefObject<HTMLInputElement>, localDocuments, setLocalDocuments, images, setImages, localImages, setLocalImages, setName, setNameFocused, setSelectedCountry, setSelectedCountryId, setAddress, setSelectedDirection, setSelectedDirectionId, setDescription, setEmail, setWebsite, setPhone, setDocuments, handleDocumentUpload, handleDeleteDocument, openPopup, isDataSaved, validationErrors, setValidationErrors };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>{isEdit ? name || 'Производитель' : 'Справочник: Производители (Создание)'}</h1>
      <button onClick={() => setShowClosePopup(true)} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} /></button>
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabChange(0)} style={mainButtonStyle(activeTab === 0)}>
            <span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3, ease: 'easeInOut' }} />
            </button>
          </button>
          <AnimatePresence>
            {!tabsCollapsed && tabs_list.slice(1).map((tab, i) => {
              const tabIndex = i + 1;
              const isBlocked = !isDataSaved && tabIndex > 1;
              return (
                <motion.button key={tab} onClick={() => handleTabChange(tabIndex)} style={buttonStyle(activeTab === tabIndex, isBlocked)} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <button onClick={handleEventLogClick} style={{ ...rightButtonStyle, backgroundColor: isEventLogActive ? '#666EFE' : '#FFFFFF' }}>
            <img src={isEventLogActive ? IconOne1 : IconOne} alt="" style={{ width: 20, height: 20 }} />
          </button>
          <button onClick={() => setShowDevPopup(true)} style={{ ...rightButtonStyle, backgroundColor: showDevPopup ? '#666EFE' : '#FFFFFF' }}>
            <img src={IconTwo} alt="" style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </div>

      {isEventLogActive ? <ManufacturerEventLogTab {...commonProps} /> : (
        <>
          {(() => { switch (activeTab) { case 0: return <ManufacturerMainTab {...commonProps} />; case 1: return <ManufacturerDocumentsTab {...commonProps} />; case 2: return <ManufacturerBrandsTab {...commonProps} />; case 3: return <ManufacturerAssortmentTab {...commonProps} />; case 4: return <ManufacturerSuppliersTab {...commonProps} />; case 5: return <ManufacturerIntegrationTab {...commonProps} />; default: return null; } })()}
          <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
            <button style={{ ...bottomButtonStyle, width: 234, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Синхронизировать</button>
            <button style={{ ...bottomButtonStyle, width: 121, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: canSave ? '#666EFE' : '#BCC8FF', border: 'none', opacity: isSaving ? 0.6 : 1, cursor: canSave && !isSaving ? 'pointer' : 'not-allowed' }} onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving}>{isSaving ? 'Сохранение...' : 'Записать'}</button>
            <button style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }} onClick={() => setShowClosePopup(true)}>Закрыть</button>
          </div>
        </>
      )}

      <CatalogSelectPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} onSelect={handlePopupSelect} popupType={popupType as PopupType} />

      {showBlockedTabWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBlockedTabWarning(false)}>
          <div style={{ width: 500, maxHeight: '80vh', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Основные данные еще не записаны</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Для доступа к остальным вкладкам необходимо заполнить все обязательные поля и сохранить данные.</p>
            <div><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FF3052' }}>Незаполненные поля:</span><div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>{getMissingFieldLabels().map((f, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF3052', flexShrink: 0 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{f}</span></div>))}</div></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => { setShowBlockedTabWarning(false); setActiveTab(0); }} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Перейти к основному</button><button onClick={() => setShowBlockedTabWarning(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button></div>
          </div>
        </div>
      )}

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены. Сохранение недоступно.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{canSave && <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}<button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button><button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button></div>
          </div>
        </div>
      )}

      {showDevPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDevPopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>В разработке</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Этот функционал находится в разработке</p>
            <button onClick={() => setShowDevPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerCreatePage;