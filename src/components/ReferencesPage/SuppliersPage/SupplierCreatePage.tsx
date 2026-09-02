// SupplierCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (без обёртки, как было раньше)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from '../NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import SupplierMainTab from './SupplierMainTab';
import SupplierRequisitesTab from './SupplierRequisitesTab';
import SupplierDocumentsTab from './SupplierDocumentsTab';
import SupplierBrandsTab from './SupplierBrandsTab';
import SupplierDeliveriesTab from './SupplierDeliveriesTab';
import SupplierAssortmentTab from './SupplierAssortmentTab';
import SupplierRatingTab from './SupplierRatingTab';
import SupplierIntegrationTab from './SupplierIntegrationTab';
import SupplierEventLogTab from './SupplierEventLogTab';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';

export interface ImageItem { uid: string; url: string; originalName: string; }
export interface DocumentItem { uid: string; supplierUid: string; documentName: string; filePath: string; originalName: string; url: string; createdAt: string; }
export interface LocalDocument { localId: string; documentName: string; file: File; }
export interface LocalImageItem { file: File; url: string; }

export interface CommonSupplierProps {
  uid?: string; name: string; isEdit: boolean; isSaving: boolean;
  images: ImageItem[]; documents: DocumentItem[];
  nameFocused: boolean; code?: number;
  isLoading: boolean;
  selectedCountry: string; selectedCountryId: string;
  address: string; selectedShortDescription: string; selectedShortDescriptionId: string;
  description: string; email: string; website: string; phone: string;
  inn: string; ogrn: string; kpp: string;
  contactPerson: string; contactPosition: string; contactPhone: string;
  director: string; directorPosition: string;
  bankName: string; bik: string; correspondentAccount: string; settlementAccount: string;
  fileInputRef: React.RefObject<HTMLInputElement>; documentInputRef: React.RefObject<HTMLInputElement>;
  localDocuments: LocalDocument[]; setLocalDocuments: React.Dispatch<React.SetStateAction<LocalDocument[]>>;
  localImages: LocalImageItem[]; setLocalImages: React.Dispatch<React.SetStateAction<LocalImageItem[]>>;
  setName: (v: string) => void; setNameFocused: (v: boolean) => void;
  setSelectedCountry: (v: string) => void; setSelectedCountryId: (v: string) => void;
  setAddress: (v: string) => void; setSelectedShortDescription: (v: string) => void; setSelectedShortDescriptionId: (v: string) => void;
  setDescription: (v: string) => void; setEmail: (v: string) => void; setWebsite: (v: string) => void; setPhone: (v: string) => void;
  setInn: (v: string) => void; setOgrn: (v: string) => void; setKpp: (v: string) => void;
  setContactPerson: (v: string) => void; setContactPosition: (v: string) => void; setContactPhone: (v: string) => void;
  setDirector: (v: string) => void; setDirectorPosition: (v: string) => void;
  setBankName: (v: string) => void; setBik: (v: string) => void; setCorrespondentAccount: (v: string) => void; setSettlementAccount: (v: string) => void;
  setImages: (v: ImageItem[]) => void; setDocuments: (v: DocumentItem[]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; handleDeleteImage: (uid: string) => void;
  handleDocumentUpload: (documentName: string, file: File) => void; handleDeleteDocument: (uid: string) => void;
  openPopup: (type: string) => void;
  isDataSaved: boolean;
  validationErrors: Set<string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Set<string>>>;
  fetchAverageRating?: () => void;
  averageRating?: number;
}

// ==================== IndexedDB хелпер ====================

const DB_NAME = 'supplier_drafts_db';
const DB_VERSION = 1;
const STORE_NAME = 'draft_files';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFileToIndexedDB = async (key: string, file: File): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFileFromIndexedDB = async (key: string): Promise<File | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const clearAllFilesForDraft = async (uid: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if ((cursor.key as string).startsWith(`${uid}_`)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// ==================== localStorage для метаданных ====================

const getDraftKey = (uid: string) => `supplier_draft_${uid}`;

interface DraftData {
  uid: string;
  code: number | undefined;
  name: string;
  selectedCountry: string;
  selectedCountryId: string;
  address: string;
  selectedShortDescription: string;
  selectedShortDescriptionId: string;
  description: string;
  email: string;
  website: string;
  phone: string;
  inn: string;
  ogrn: string;
  kpp: string;
  contactPerson: string;
  contactPosition: string;
  contactPhone: string;
  director: string;
  directorPosition: string;
  bankName: string;
  bik: string;
  correspondentAccount: string;
  settlementAccount: string;
  localImagesMeta: { key: string; fileName: string }[];
  localDocumentsMeta: { key: string; localId: string; documentName: string; fileName: string }[];
  isEdit: boolean;
  timestamp: number;
}

const saveDraftToStorage = (uid: string, data: DraftData) => {
  try { localStorage.setItem(getDraftKey(uid), JSON.stringify(data)); }
  catch (e) { console.error('Ошибка сохранения черновика поставщика:', e); }
};

const loadDraftFromStorage = (uid: string): DraftData | null => {
  try {
    const raw = localStorage.getItem(getDraftKey(uid));
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(getDraftKey(uid));
      clearAllFilesForDraft(uid);
      return null;
    }
    return data;
  } catch (e) {
    localStorage.removeItem(getDraftKey(uid));
    clearAllFilesForDraft(uid);
    return null;
  }
};

const clearDraftStorage = async (uid: string) => {
  localStorage.removeItem(getDraftKey(uid));
  await clearAllFilesForDraft(uid);
};

const SupplierCreatePage = () => {
  const { uid, code: codeParam } = useParams<{ uid: string; code: string }>();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(''); const [code, setCode] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false); const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false); const [nameFocused, setNameFocused] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(''); const [selectedCountryId, setSelectedCountryId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedShortDescription, setSelectedShortDescription] = useState(''); const [selectedShortDescriptionId, setSelectedShortDescriptionId] = useState('');
  const [description, setDescription] = useState(''); const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); const [phone, setPhone] = useState('');

  const [inn, setInn] = useState(''); const [ogrn, setOgrn] = useState(''); const [kpp, setKpp] = useState('');
  const [contactPerson, setContactPerson] = useState(''); const [contactPosition, setContactPosition] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [director, setDirector] = useState(''); const [directorPosition, setDirectorPosition] = useState('');
  const [bankName, setBankName] = useState(''); const [bik, setBik] = useState('');
  const [correspondentAccount, setCorrespondentAccount] = useState(''); const [settlementAccount, setSettlementAccount] = useState('');

  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [localImages, setLocalImages] = useState<LocalImageItem[]>([]);

  const [popupOpen, setPopupOpen] = useState(false); const [popupType, setPopupType] = useState<string>('country');
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);

  const [showClosePopup, setShowClosePopup] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  const [isDataSaved, setIsDataSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [showBlockedTabWarning, setShowBlockedTabWarning] = useState(false);

  const tabs_list = ['Основное', 'Реквизиты', 'Документы', 'Бренды', 'Поставки', 'Ассортимент', 'Рейтинг', 'Интеграции'];
  const EVENT_LOG_TAB = tabs_list.length;

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saveDraftToLocalStorage = useCallback(async () => {
    if (!uid || !isDataLoaded) return;
    
    for (const img of localImages) {
      const key = `${uid}_img_${img.url}`;
      await saveFileToIndexedDB(key, img.file);
    }
    for (const doc of localDocuments) {
      const key = `${uid}_doc_${doc.localId}`;
      await saveFileToIndexedDB(key, doc.file);
    }
    
    const draft: DraftData = {
      uid,
      code,
      name,
      selectedCountry,
      selectedCountryId,
      address,
      selectedShortDescription,
      selectedShortDescriptionId,
      description,
      email,
      website,
      phone,
      inn,
      ogrn,
      kpp,
      contactPerson,
      contactPosition,
      contactPhone,
      director,
      directorPosition,
      bankName,
      bik,
      correspondentAccount,
      settlementAccount,
      localImagesMeta: localImages.map(img => ({ key: `${uid}_img_${img.url}`, fileName: img.file.name })),
      localDocumentsMeta: localDocuments.map(doc => ({ key: `${uid}_doc_${doc.localId}`, localId: doc.localId, documentName: doc.documentName, fileName: doc.file.name })),
      isEdit,
      timestamp: Date.now(),
    };
    saveDraftToStorage(uid, draft);
  }, [
    uid, code, name, isEdit, isDataLoaded,
    selectedCountry, selectedCountryId, address,
    selectedShortDescription, selectedShortDescriptionId,
    description, email, website, phone,
    inn, ogrn, kpp,
    contactPerson, contactPosition, contactPhone,
    director, directorPosition,
    bankName, bik, correspondentAccount, settlementAccount,
    localImages, localDocuments,
  ]);

  useEffect(() => {
    if (!uid || !isDataLoaded) return;
    const timer = setTimeout(() => {
      saveDraftToLocalStorage();
    }, 500);
    return () => clearTimeout(timer);
  }, [saveDraftToLocalStorage, uid, isDataLoaded]);

  const restoreLocalFiles = useCallback(async (draft: DraftData) => {
    if (!uid) return;
    
    const restoredImages: LocalImageItem[] = [];
    for (const imgMeta of (draft.localImagesMeta || [])) {
      const file = await getFileFromIndexedDB(imgMeta.key);
      if (file) {
        restoredImages.push({ file, url: URL.createObjectURL(file) });
      }
    }
    setLocalImages(restoredImages);
    
    const restoredDocuments: LocalDocument[] = [];
    for (const docMeta of (draft.localDocumentsMeta || [])) {
      const file = await getFileFromIndexedDB(docMeta.key);
      if (file) {
        restoredDocuments.push({
          localId: docMeta.localId,
          documentName: docMeta.documentName,
          file,
        });
      }
    }
    setLocalDocuments(restoredDocuments);
  }, [uid]);

  useEffect(() => { const handler = (e: Event) => { if ((e as CustomEvent).detail?.tab !== undefined) setActiveTab((e as CustomEvent).detail.tab); }; window.addEventListener('navigateToTab', handler); return () => window.removeEventListener('navigateToTab', handler); }, []);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    
    if (isEditMode) {
      setIsDataSaved(true);
      loadSupplierData(uid).then(async () => {
        const draft = loadDraftFromStorage(uid);
        if (draft && draft.uid === uid && draft.isEdit) {
          setName(draft.name);
          setCode(draft.code);
          setSelectedCountry(draft.selectedCountry);
          setSelectedCountryId(draft.selectedCountryId);
          setAddress(draft.address);
          setSelectedShortDescription(draft.selectedShortDescription);
          setSelectedShortDescriptionId(draft.selectedShortDescriptionId);
          setDescription(draft.description);
          setEmail(draft.email);
          setWebsite(draft.website);
          setPhone(draft.phone);
          setInn(draft.inn);
          setOgrn(draft.ogrn);
          setKpp(draft.kpp);
          setContactPerson(draft.contactPerson);
          setContactPosition(draft.contactPosition);
          setContactPhone(draft.contactPhone);
          setDirector(draft.director);
          setDirectorPosition(draft.directorPosition);
          setBankName(draft.bankName);
          setBik(draft.bik);
          setCorrespondentAccount(draft.correspondentAccount);
          setSettlementAccount(draft.settlementAccount);
          await restoreLocalFiles(draft);
        }
        setIsDataLoaded(true);
      });
      fetchImages(); fetchDocuments(); fetchAverageRating();
    } else {
      const draft = loadDraftFromStorage(uid);
      if (draft && draft.uid === uid) {
        setName(draft.name);
        setCode(draft.code);
        setSelectedCountry(draft.selectedCountry);
        setSelectedCountryId(draft.selectedCountryId);
        setAddress(draft.address);
        setSelectedShortDescription(draft.selectedShortDescription);
        setSelectedShortDescriptionId(draft.selectedShortDescriptionId);
        setDescription(draft.description);
        setEmail(draft.email);
        setWebsite(draft.website);
        setPhone(draft.phone);
        setInn(draft.inn);
        setOgrn(draft.ogrn);
        setKpp(draft.kpp);
        setContactPerson(draft.contactPerson);
        setContactPosition(draft.contactPosition);
        setContactPhone(draft.contactPhone);
        setDirector(draft.director);
        setDirectorPosition(draft.directorPosition);
        setBankName(draft.bankName);
        setBik(draft.bik);
        setCorrespondentAccount(draft.correspondentAccount);
        setSettlementAccount(draft.settlementAccount);
        restoreLocalFiles(draft);
        setIsDataSaved(false);
        setIsDataLoaded(true);
      } else {
        setIsDataSaved(false);
        setIsDataLoaded(true);
        if (codeParam) setCode(parseInt(codeParam));
      }
    }
  }, [uid]);

  const fetchAverageRating = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiSupplierRatingsAverage(uid)); setAverageRating(Math.round((res.data || 0) * 10) / 10); } catch (e) { console.error(e); } };
  const fetchImages = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiSupplierImages(uid)); setImages((res.data || []).map((img: any) => ({ uid: img.uid, url: img.fileUrl ? ConstantInfo.fileDir + img.fileUrl.replace(/^\//, '') : '', originalName: img.originalName || '' }))); } catch (e) { console.error(e); } };
  const fetchDocuments = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiSupplierDocuments(uid)); setDocuments((res.data || []).map((doc: any) => ({ ...doc, url: doc.fileUrl ? ConstantInfo.fileDir + doc.fileUrl.replace(/^\//, '') : '' }))); } catch (e) { console.error(e); } };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const handleDeleteImage = async (imageUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiSupplierDeleteImage(imageUid)); await fetchImages(); } catch (er) { console.error(er); } };
  const handleDocumentUpload = (documentName: string, file: File) => { setLocalDocuments(prev => [...prev, { localId: generateLocalId(), documentName, file }]); };
  const handleDeleteDocument = (uid: string) => { setLocalDocuments(prev => prev.filter(d => d.localId !== uid)); if (uid && !uid.startsWith('local_')) { AxiosService.delete(ConstantInfo.restApiSupplierDeleteDocument(uid)).then(() => fetchDocuments()).catch(e => console.error(e)); } };

  const loadSupplierData = async (suid: string): Promise<void> => { 
    setIsLoading(true); 
    try { 
      const d = (await AxiosService.get(ConstantInfo.restApiSupplierGet(suid))).data; 
      setName(d.name || ''); setCode(d.code); 
      if (d.countryUid) { setSelectedCountryId(d.countryUid); setSelectedCountry(d.countryName || ''); } else { setSelectedCountryId(''); setSelectedCountry(''); }
      setAddress(d.address || ''); 
      if (d.shortDescriptionUid) { setSelectedShortDescriptionId(d.shortDescriptionUid); setSelectedShortDescription(d.shortDescriptionName || ''); } else { setSelectedShortDescriptionId(''); setSelectedShortDescription(''); }
      setDescription(d.description || ''); setEmail(d.email || ''); setWebsite(d.website || ''); setPhone(d.phone || ''); 
      setInn(d.inn || ''); setOgrn(d.ogrn || ''); setKpp(d.kpp || ''); 
      setContactPerson(d.contactPerson || ''); setContactPosition(d.contactPosition || ''); setContactPhone(d.contactPhone || ''); 
      setDirector(d.director || ''); setDirectorPosition(d.directorPosition || ''); 
      setBankName(d.bankName || ''); setBik(d.bik || ''); setCorrespondentAccount(d.correspondentAccount || ''); setSettlementAccount(d.settlementAccount || ''); 
    } catch (e) { console.error(e); } finally { setIsLoading(false); } 
  };

  const getMissingFields = (): Set<string> => {
    const m = new Set<string>();
    if (!name.trim()) m.add('name'); if (!selectedCountryId) m.add('country'); if (!address.trim()) m.add('address');
    if (!selectedShortDescriptionId) m.add('shortDescription'); if (!email.trim()) m.add('email'); if (!website.trim()) m.add('website');
    if (!phone.trim()) m.add('phone');
    if (!inn.trim()) m.add('inn'); if (!ogrn.trim()) m.add('ogrn'); if (!kpp.trim()) m.add('kpp');
    if (!contactPerson.trim()) m.add('contactPerson'); if (!director.trim()) m.add('director');
    if (!bankName.trim()) m.add('bankName'); if (!bik.trim()) m.add('bik');
    if (!correspondentAccount.trim()) m.add('correspondentAccount'); if (!settlementAccount.trim()) m.add('settlementAccount');
    return m;
  };

  const getMissingFieldLabels = (): string[] => {
    const l: string[] = [];
    if (!name.trim()) l.push('Наименование'); if (!selectedCountryId) l.push('Страна'); if (!address.trim()) l.push('Адрес');
    if (!selectedShortDescriptionId) l.push('Краткое описание'); if (!email.trim()) l.push('Email'); if (!website.trim()) l.push('Сайт');
    if (!phone.trim()) l.push('Телефон');
    if (!inn.trim()) l.push('ИНН'); if (!ogrn.trim()) l.push('ОГРН'); if (!kpp.trim()) l.push('КПП');
    if (!contactPerson.trim()) l.push('Контактное лицо'); if (!director.trim()) l.push('Руководитель');
    if (!bankName.trim()) l.push('Банк'); if (!bik.trim()) l.push('БИК');
    if (!correspondentAccount.trim()) l.push('Корр. счет'); if (!settlementAccount.trim()) l.push('Расч. счет');
    return l;
  };

  const handleSave = async () => {
    if (!uid) return; setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiSupplierDraft, { uid, code, name, countryUid: selectedCountryId || null, address: address || null, shortDescriptionUid: selectedShortDescriptionId || null, description: description || null, email: email || null, website: website || null, phone: phone || null, inn: inn || null, ogrn: ogrn || null, kpp: kpp || null, contactPerson: contactPerson || null, contactPosition: contactPosition || null, contactPhone: contactPhone || null, director: director || null, directorPosition: directorPosition || null, bankName: bankName || null, bik: bik || null, correspondentAccount: correspondentAccount || null, settlementAccount: settlementAccount || null, author: 'Оператор' });
      for (const img of localImages) { const fd = new FormData(); fd.append('file', img.file); await AxiosService.post(ConstantInfo.restApiSupplierImages(uid), fd); }
      for (const doc of localDocuments) { const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName); await AxiosService.post(ConstantInfo.restApiSupplierDocuments(uid), fd); }
      setLocalImages([]); setLocalDocuments([]); await fetchImages(); await fetchDocuments();
      await clearDraftStorage(uid);
      setIsDataSaved(true); setValidationErrors(new Set()); window.dispatchEvent(new CustomEvent('refreshSupplierEvents'));
      
      const wasCreate = !isEdit;
      if (wasCreate && activeTabId) {
        setIsEdit(true);
        const newPath = `/references/suppliers/edit/${uid}`;
        const newLabel = name.trim() || 'Поставщик';
        replaceTab(activeTabId, newPath, newLabel, <SupplierCreatePage />);
      }
      return true;
    } catch (e) { console.error(e); return false; } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); if (uid) clearDraftStorage(uid); };
  const handleSaveAndClose = async () => { if (await handleSave()) handleClose(); };
  const handleCloseWithoutSaving = async () => { if (uid) await clearDraftStorage(uid); handleClose(); };

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

  const openPopup = (type: string) => { setPopupType(type); setPopupFilterParam(undefined); setPopupOpen(true); };
  const handlePopupSelect = (id: string, nm: string) => { 
    switch (popupType) { 
      case 'country': setSelectedCountry(nm); setSelectedCountryId(id); setValidationErrors(p => { const n = new Set(p); n.delete('country'); return n; }); break; 
      case 'shortDescription': setSelectedShortDescription(nm); setSelectedShortDescriptionId(id); setValidationErrors(p => { const n = new Set(p); n.delete('shortDescription'); return n; }); break; 
    } 
  };

  const buttonStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : isDisabled ? '#BCC8FF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden', opacity: isDisabled ? 0.5 : 1 });
  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  const cef = ['inn', 'ogrn', 'kpp', 'contactPerson', 'director', 'bankName', 'bik', 'correspondentAccount', 'settlementAccount'];
  const hasRequisitesErrors = cef.some(f => validationErrors.has(f));
  const isEventLogActive = activeTab === EVENT_LOG_TAB;

  const commonProps: CommonSupplierProps = { uid, name, isEdit, isSaving, images, documents, nameFocused, code, isLoading, selectedCountry, selectedCountryId, address, selectedShortDescription, selectedShortDescriptionId, description, email, website, phone, inn, ogrn, kpp, contactPerson, contactPosition, contactPhone, director, directorPosition, bankName, bik, correspondentAccount, settlementAccount, fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>, documentInputRef: documentInputRef as React.RefObject<HTMLInputElement>, localDocuments, setLocalDocuments, localImages, setLocalImages, setName, setNameFocused, setSelectedCountry, setSelectedCountryId, setAddress, setSelectedShortDescription, setSelectedShortDescriptionId, setDescription, setEmail, setWebsite, setPhone, setInn, setOgrn, setKpp, setContactPerson, setContactPosition, setContactPhone, setDirector, setDirectorPosition, setBankName, setBik, setCorrespondentAccount, setSettlementAccount, setImages, setDocuments, handleImageUpload, handleDeleteImage, handleDocumentUpload, handleDeleteDocument, openPopup, isDataSaved, validationErrors, setValidationErrors, fetchAverageRating, averageRating };

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>{isEdit ? name || 'Поставщик' : 'Справочник: Поставщики (Создание)'}</h1>
      
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabChange(0)} style={mainButtonStyle(activeTab === 0 && !isEventLogActive)}>
            <span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }} />
            </button>
          </button>
          <AnimatePresence>
            {!tabsCollapsed && tabs_list.slice(1).map((tab, i) => {
              const tabIndex = i + 1;
              const isBlocked = !isDataSaved && tabIndex > 1;
              const isRequisitesTab = tabIndex === 1;
              return (
                <motion.button key={tab} onClick={() => handleTabChange(tabIndex)} style={{ ...buttonStyle(activeTab === tabIndex && !isEventLogActive, isBlocked), outline: isRequisitesTab && hasRequisitesErrors && validationErrors.size > 0 ? '2px solid #FF3052' : 'none', outlineOffset: -2 }} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3 }}>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
          <button onClick={handleEventLogClick} style={{ ...smallButtonStyle, backgroundColor: isEventLogActive ? '#666EFE' : '#FFFFFF' }}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: isEventLogActive ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      {isEventLogActive ? (
        <SupplierEventLogTab {...commonProps} />
      ) : (
        <>
          {(() => { switch (activeTab) { case 0: return <SupplierMainTab {...commonProps} />; case 1: return <SupplierRequisitesTab {...commonProps} />; case 2: return <SupplierDocumentsTab {...commonProps} />; case 3: return <SupplierBrandsTab {...commonProps} />; case 4: return <SupplierDeliveriesTab {...commonProps} />; case 5: return <SupplierAssortmentTab {...commonProps} />; case 6: return <SupplierRatingTab {...commonProps} />; case 7: return <SupplierIntegrationTab {...commonProps} />; default: return null; } })()}
          <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 15 }}>
            <button 
              onClick={canSave ? handleSave : undefined} 
              disabled={!canSave || isSaving} 
              style={{ 
                width: 154, 
                height: 51, 
                borderRadius: 10, 
                border: '1px solid rgba(102, 110, 254, 0.15)', 
                backgroundColor: '#FFFFFF', 
                cursor: canSave && !isSaving ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                paddingLeft: 20,
                paddingRight: 20,
                fontFamily: 'Inter, sans-serif', 
                fontSize: 15, 
                fontWeight: 600, 
                color: '#2D4059', 
                opacity: canSave ? 1 : 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21, flexShrink: 0 }} />
              <span style={{ marginLeft: 17, flexShrink: 0 }}>Записать</span>
            </button>
            <button onClick={() => setShowClosePopup(true)} style={{ width: 116, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Закрыть</button>
          </div>
        </>
      )}

      <CatalogSelectPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} onSelect={handlePopupSelect} popupType={popupType as PopupType} filterParam={popupFilterParam} />

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
    </div>
  );
};

export default SupplierCreatePage;