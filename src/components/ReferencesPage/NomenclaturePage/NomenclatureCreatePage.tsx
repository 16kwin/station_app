// NomenclatureCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (исправлены ключи localStorage/IndexedDB для раздельных вкладок)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from './CatalogSelectPopup';
import ProgressBar from './ProgressBar';
import type { PopupType } from './CatalogSelectPopup';
import MainTab from './MainTab';
import CharacteristicsTab from './CharacteristicsTab';
import DocumentsTab from './DocumentsTab';
import SuppliersTab from './SuppliersTab';
import PriceHistoryTab from './PriceHistoryTab';
import AnalogsTab from './AnalogsTab';
import RatingTab from './RatingTab';
import IntegrationTab from './IntegrationTab';
import EventLogTab from './EventLogTab';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import StatusIcon93Red from '../../../assets/Icons/StatusIcons/StatusIcon93Red.svg';
import StatusIcon104Blue from '../../../assets/Icons/StatusIcons/StatusIcon104Blue.svg';
import StatusIcon107Orange from '../../../assets/Icons/StatusIcons/StatusIcon107Orange.svg';

export interface Folder { id: number; name: string; isOpen: boolean; items: FolderItem[]; }
export interface FolderItem { id: number; characteristic?: string; designation?: string; unit?: string; value?: string; name?: string; status?: string; date?: string; }
export interface TypeMaterialOption { uid: string; typeName: string; }
export interface ImageItem { uid: string; url: string; originalName: string; }
export interface PriceItem { uid: string; price: number; priceDate: string; supplierName: string; previousPrice: number | null; priceChange: number | null; }
export interface SupplierOption { uid: string; name: string; }
export interface DocumentItem { uid: string; materialUid: string; documentName: string; filePath: string; originalName: string; url: string; createdAt: string; }
export interface LocalDocument { localId: string; documentName: string; file: File; }
export interface LocalSupply { localId: string; supplierUid: string; supplierName: string; supplyDate: string; documentName: string; file: File | null; }
export interface LocalCharacteristic { localId: string; uid: string | null; attributeTypeUid: string | null; attributeName: string | null; customName: string | null; value: string; measureUid: string | null; measureName: string | null; isCustom: boolean; isRequired: boolean; }
export interface LocalImageItem { file: File; url: string; }
export interface LocalCode { codeType: string; codeValue: string; codeKind: string; file: File | null; preview: string | null; }
export interface ServerCode { uid: string; codeType: string; codeValue: string; codeKind: string; fileUrl: string | null; originalName: string | null; }

export interface CommonProps {
  uid?: string; code?: string; name: string; article: string; description: string; isEdit: boolean; isSaving: boolean; isUploading: boolean; isUploadingBlueprint: boolean;
  images: ImageItem[]; blueprints: ImageItem[]; documents: DocumentItem[]; prices: PriceItem[]; suppliers: SupplierOption[];
  selectedImageIndex: number; selectedBlueprintIndex: number; selectedCatalog: string; selectedCatalogId: string;
  selectedAccountingGroup: string; selectedAccountingGroupId: string; accountingGroupOpen: boolean;
  selectedNomenclatureGroup: string; selectedNomenclatureGroupId: string; selectedNomenclatureType: string; selectedNomenclatureTypeId: string;
  selectedUnit: string; selectedUnitId: string; selectedManufacturer: string; selectedManufacturerId: string;
  selectedBrand: string; selectedBrandId: string; selectedModel: string; selectedModelId: string; selectedCountry: string; selectedCountryId: string;
  usage: boolean; wasteMaterial: boolean; recycleMaterial: boolean; nameFocused: boolean; articleFocused: boolean; descriptionFocused: boolean;
  showAddPricePopup: boolean; newPrice: string; newPriceDate: string; newPriceSupplierUid: string; fullscreenImage: boolean; fullscreenBlueprint: boolean;
  isLoading: boolean; isLoadingPrices: boolean; typeMaterials: TypeMaterialOption[];
  fileInputRef: React.RefObject<HTMLInputElement>; blueprintInputRef: React.RefObject<HTMLInputElement>; documentInputRef: React.RefObject<HTMLInputElement>;
  localCharacteristics: LocalCharacteristic[]; setLocalCharacteristics: React.Dispatch<React.SetStateAction<LocalCharacteristic[]>>;
  localDocuments: LocalDocument[]; setLocalDocuments: React.Dispatch<React.SetStateAction<LocalDocument[]>>;
  localSupplies: LocalSupply[]; setLocalSupplies: React.Dispatch<React.SetStateAction<LocalSupply[]>>;
  localImages: LocalImageItem[]; setLocalImages: React.Dispatch<React.SetStateAction<LocalImageItem[]>>;
  localBlueprints: LocalImageItem[]; setLocalBlueprints: React.Dispatch<React.SetStateAction<LocalImageItem[]>>;
  localBarcodes: LocalCode[]; setLocalBarcodes: React.Dispatch<React.SetStateAction<LocalCode[]>>;
  localSkus: LocalCode[]; setLocalSkus: React.Dispatch<React.SetStateAction<LocalCode[]>>;
  localQrCodes: LocalCode[]; setLocalQrCodes: React.Dispatch<React.SetStateAction<LocalCode[]>>;
  serverBarcodes: ServerCode[]; serverSkus: ServerCode[];
  setName: (v: string) => void; setArticle: (v: string) => void; setDescription: (v: string) => void;
  setNameFocused: (v: boolean) => void; setArticleFocused: (v: boolean) => void; setDescriptionFocused: (v: boolean) => void;
  toggleUsage: () => void; toggleWasteMaterial: () => void; toggleRecycleMaterial: () => void;
  setSelectedCatalog: (v: string) => void; setSelectedCatalogId: (v: string) => void;
  setSelectedAccountingGroup: (v: string) => void; setSelectedAccountingGroupId: (v: string) => void; setAccountingGroupOpen: (v: boolean) => void;
  setSelectedNomenclatureGroup: (v: string) => void; setSelectedNomenclatureGroupId: (v: string) => void;
  setSelectedNomenclatureType: (v: string) => void; setSelectedNomenclatureTypeId: (v: string) => void;
  setSelectedUnit: (v: string) => void; setSelectedUnitId: (v: string) => void;
  setSelectedManufacturer: (v: string) => void; setSelectedManufacturerId: (v: string) => void;
  setSelectedBrand: (v: string) => void; setSelectedBrandId: (v: string) => void;
  setSelectedModel: (v: string) => void; setSelectedModelId: (v: string) => void;
  setSelectedCountry: (v: string) => void; setSelectedCountryId: (v: string) => void;
  setImages: (v: ImageItem[]) => void; setSelectedImageIndex: (v: number | ((p: number) => number)) => void; setIsUploading: (v: boolean) => void; setFullscreenImage: (v: boolean) => void;
  setBlueprints: (v: ImageItem[]) => void; setSelectedBlueprintIndex: (v: number | ((p: number) => number)) => void; setIsUploadingBlueprint: (v: boolean) => void; setFullscreenBlueprint: (v: boolean) => void;
  setDocuments: (v: DocumentItem[]) => void; setPrices: (v: PriceItem[]) => void; setShowAddPricePopup: (v: boolean) => void; setNewPrice: (v: string) => void; setNewPriceDate: (v: string) => void; setNewPriceSupplierUid: (v: string) => void; setSuppliers: (v: SupplierOption[]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; handleDeleteImage: (uid: string) => void;
  handleBlueprintUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; handleDeleteBlueprint: (uid: string) => void;
  handleDocumentUpload: (documentName: string, file: File) => void; handleDeleteDocument: (uid: string) => void;
  fetchPrices: () => void; handleAddPrice: () => void; handleDeletePrice: (uid: string) => void; fetchSuppliers: () => void;
  openPopup: (type: PopupType) => void; handleAccountingGroupSelect: (o: TypeMaterialOption) => void;
  isDataSaved: boolean;
  validationErrors: Set<string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Set<string>>>;
  isFinishedProduct: boolean;
}

const REQUIRED_ATTRIBUTES = ['Длина', 'Ширина', 'Высота', 'Масса'];

// ==================== IndexedDB хелпер ====================

const DB_NAME = 'nomenclature_drafts_db';
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

const clearAllFilesForDraft = async (uid: string, tabInstanceId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if ((cursor.key as string).startsWith(`${uid}_${tabInstanceId}_`)) {
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

const getDraftKey = (uid: string, tabInstanceId: string) => `nomenclature_draft_${uid}_${tabInstanceId}`;

interface DraftData {
  uid: string;
  code: string;
  name: string;
  article: string;
  description: string;
  selectedCatalog: string;
  selectedCatalogId: string;
  selectedAccountingGroup: string;
  selectedAccountingGroupId: string;
  selectedNomenclatureGroup: string;
  selectedNomenclatureGroupId: string;
  selectedNomenclatureType: string;
  selectedNomenclatureTypeId: string;
  selectedUnit: string;
  selectedUnitId: string;
  selectedManufacturer: string;
  selectedManufacturerId: string;
  selectedBrand: string;
  selectedBrandId: string;
  selectedModel: string;
  selectedModelId: string;
  selectedCountry: string;
  selectedCountryId: string;
  usage: boolean;
  wasteMaterial: boolean;
  recycleMaterial: boolean;
  localCharacteristics: LocalCharacteristic[];
  localImagesMeta: { key: string; fileName: string }[];
  localBlueprintsMeta: { key: string; fileName: string }[];
  localBarcodesMeta: { key: string; codeType: string; codeValue: string; codeKind: string; fileName: string | null }[];
  localSkusMeta: { key: string; codeType: string; codeValue: string; codeKind: string; fileName: string | null }[];
  localQrCodesMeta: { key: string; codeType: string; codeValue: string; codeKind: string; fileName: string | null }[];
  localDocumentsMeta: { key: string; localId: string; documentName: string; fileName: string }[];
  localSuppliesMeta: { key: string; localId: string; supplierUid: string; supplierName: string; supplyDate: string; documentName: string; fileName: string | null }[];
  isEdit: boolean;
  timestamp: number;
}

const saveDraftToStorage = (uid: string, tabInstanceId: string, data: DraftData) => {
  try {
    localStorage.setItem(getDraftKey(uid, tabInstanceId), JSON.stringify(data));
  } catch (e) {
    console.error('Ошибка сохранения черновика:', e);
  }
};

const loadDraftFromStorage = (uid: string, tabInstanceId: string): DraftData | null => {
  try {
    const raw = localStorage.getItem(getDraftKey(uid, tabInstanceId));
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      clearDraftStorage(uid, tabInstanceId);
      return null;
    }
    return data;
  } catch (e) {
    clearDraftStorage(uid, tabInstanceId);
    return null;
  }
};

const clearDraftStorage = async (uid: string, tabInstanceId: string) => {
  localStorage.removeItem(getDraftKey(uid, tabInstanceId));
  await clearAllFilesForDraft(uid, tabInstanceId);
};

const NomenclatureCreatePage = () => {
  const { uid, code } = useParams<{ uid: string; code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeTabId, closeTab } = useTabs();

  // ==================== УНИКАЛЬНЫЙ ID ВКЛАДКИ ====================
  // Получаем уникальный ID вкладки из TabContext
  const fullPath = location.pathname + location.search;
  const currentTab = tabs.find(tab => tab.path === fullPath);
  const tabInstanceId = useRef(
    currentTab?.id || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ).current;

  const [activeTab, setActiveTab] = useState(0);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blueprintInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(''); const [article, setArticle] = useState(''); const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false); const [isLoading, setIsLoading] = useState(false); const [isEdit, setIsEdit] = useState(false);
  const [nameFocused, setNameFocused] = useState(false); const [articleFocused, setArticleFocused] = useState(false); const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [usage, setUsage] = useState(false); const [wasteMaterial, setWasteMaterial] = useState(false); const [recycleMaterial, setRecycleMaterial] = useState(false);
  const toggleUsage = useCallback(() => setUsage(prev => !prev), []); const toggleWasteMaterial = useCallback(() => setWasteMaterial(prev => !prev), []); const toggleRecycleMaterial = useCallback(() => setRecycleMaterial(prev => !prev), []);
  const [selectedCatalog, setSelectedCatalog] = useState(''); const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [typeMaterials, setTypeMaterials] = useState<TypeMaterialOption[]>([]);
  const [selectedAccountingGroup, setSelectedAccountingGroup] = useState(''); const [selectedAccountingGroupId, setSelectedAccountingGroupId] = useState(''); const [accountingGroupOpen, setAccountingGroupOpen] = useState(false);
  const [selectedNomenclatureGroup, setSelectedNomenclatureGroup] = useState(''); const [selectedNomenclatureGroupId, setSelectedNomenclatureGroupId] = useState('');
  const [selectedNomenclatureType, setSelectedNomenclatureType] = useState(''); const [selectedNomenclatureTypeId, setSelectedNomenclatureTypeId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(''); const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState(''); const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(''); const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModel, setSelectedModel] = useState(''); const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(''); const [selectedCountryId, setSelectedCountryId] = useState('');
  const [localCharacteristics, setLocalCharacteristics] = useState<LocalCharacteristic[]>([]);
  const [initialCharacteristics, setInitialCharacteristics] = useState<LocalCharacteristic[]>([]);
  const [typeAttributesMap, setTypeAttributesMap] = useState<Map<string, string>>(new Map());
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [localSupplies, setLocalSupplies] = useState<LocalSupply[]>([]);
  const [localImages, setLocalImages] = useState<LocalImageItem[]>([]);
  const [localBlueprints, setLocalBlueprints] = useState<LocalImageItem[]>([]);
  const [localBarcodes, setLocalBarcodes] = useState<LocalCode[]>([]);
  const [localQrCodes, setLocalQrCodes] = useState<LocalCode[]>([]);
  const [localSkus, setLocalSkus] = useState<LocalCode[]>([]);
  const [serverBarcodes, setServerBarcodes] = useState<ServerCode[]>([]);
  const [serverSkus, setServerSkus] = useState<ServerCode[]>([]);
  
  const getPopupOpenKey = () => `nomenclature_popup_open_${uid}_${tabInstanceId}`;
  const [popupOpen, setPopupOpen] = useState(() => {
    return sessionStorage.getItem(getPopupOpenKey()) === 'true';
  });
  const [popupType, setPopupType] = useState<PopupType>('catalog'); 
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]); const [selectedImageIndex, setSelectedImageIndex] = useState(0); const [isUploading, setIsUploading] = useState(false); const [fullscreenImage, setFullscreenImage] = useState(false);
  const [blueprints, setBlueprints] = useState<ImageItem[]>([]); const [selectedBlueprintIndex, setSelectedBlueprintIndex] = useState(0); const [isUploadingBlueprint, setIsUploadingBlueprint] = useState(false); const [fullscreenBlueprint, setFullscreenBlueprint] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]); const [showAddPricePopup, setShowAddPricePopup] = useState(false); const [newPrice, setNewPrice] = useState(''); const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().slice(0, 16)); const [newPriceSupplierUid, setNewPriceSupplierUid] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [showBlockedTabWarning, setShowBlockedTabWarning] = useState(false);
  
  const [initialState, setInitialState] = useState<{
    name: string; article: string; description: string;
    selectedCatalog: string; selectedCatalogId: string;
    selectedAccountingGroup: string; selectedAccountingGroupId: string;
    selectedNomenclatureGroup: string; selectedNomenclatureGroupId: string;
    selectedNomenclatureType: string; selectedNomenclatureTypeId: string;
    selectedUnit: string; selectedUnitId: string;
    selectedManufacturer: string; selectedManufacturerId: string;
    selectedBrand: string; selectedBrandId: string;
    selectedModel: string; selectedModelId: string;
    selectedCountry: string; selectedCountryId: string;
    usage: boolean; wasteMaterial: boolean; recycleMaterial: boolean;
  } | null>(null);
  const [initialImagesCount, setInitialImagesCount] = useState(0);
  
  const hasInitializedChars = useRef(false);

  const isFinishedProduct = selectedAccountingGroup === 'Готовая деталь';

  const allTabs = ['Основное', 'Характеристики', 'Документы', 'Остатки', 'Поставщики', 'История цен', 'Аналоги', 'Рейтинг', 'Интеграция'];
  
  const tabs_list = isFinishedProduct 
    ? ['Основное', 'Характеристики', 'Документы', 'На складе', 'Интеграция']
    : allTabs;

  const EVENT_LOG_TAB = tabs_list.length;

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saveDraftToLocalStorage = useCallback(async () => {
    if (!uid || !isDataLoaded) return;
    
    for (const img of localImages) {
      const key = `${uid}_${tabInstanceId}_img_${img.url}`;
      await saveFileToIndexedDB(key, img.file);
    }
    for (const bp of localBlueprints) {
      const key = `${uid}_${tabInstanceId}_bp_${bp.url}`;
      await saveFileToIndexedDB(key, bp.file);
    }
    for (const doc of localDocuments) {
      const key = `${uid}_${tabInstanceId}_doc_${doc.localId}`;
      await saveFileToIndexedDB(key, doc.file);
    }
    for (const sup of localSupplies) {
      if (sup.file) {
        const key = `${uid}_${tabInstanceId}_sup_${sup.localId}`;
        await saveFileToIndexedDB(key, sup.file);
      }
    }
    
    const draft: DraftData = {
      uid,
      code: code || '',
      name,
      article,
      description,
      selectedCatalog,
      selectedCatalogId,
      selectedAccountingGroup,
      selectedAccountingGroupId,
      selectedNomenclatureGroup,
      selectedNomenclatureGroupId,
      selectedNomenclatureType,
      selectedNomenclatureTypeId,
      selectedUnit,
      selectedUnitId,
      selectedManufacturer,
      selectedManufacturerId,
      selectedBrand,
      selectedBrandId,
      selectedModel,
      selectedModelId,
      selectedCountry,
      selectedCountryId,
      usage,
      wasteMaterial,
      recycleMaterial,
      localCharacteristics,
      localImagesMeta: localImages.map(img => ({ key: `${uid}_${tabInstanceId}_img_${img.url}`, fileName: img.file.name })),
      localBlueprintsMeta: localBlueprints.map(bp => ({ key: `${uid}_${tabInstanceId}_bp_${bp.url}`, fileName: bp.file.name })),
      localBarcodesMeta: localBarcodes.map(bc => ({ 
        key: '', 
        codeType: bc.codeType, codeValue: bc.codeValue, codeKind: bc.codeKind, 
        fileName: null 
      })),
      localSkusMeta: localSkus.map(sku => ({ 
        key: '', 
        codeType: sku.codeType, codeValue: sku.codeValue, codeKind: sku.codeKind, 
        fileName: null 
      })),
      localQrCodesMeta: localQrCodes.map(qr => ({ 
        key: '', 
        codeType: qr.codeType, codeValue: qr.codeValue, codeKind: qr.codeKind, 
        fileName: null 
      })),
      localDocumentsMeta: localDocuments.map(doc => ({ key: `${uid}_${tabInstanceId}_doc_${doc.localId}`, localId: doc.localId, documentName: doc.documentName, fileName: doc.file.name })),
      localSuppliesMeta: localSupplies.map(sup => ({ 
        key: sup.file ? `${uid}_${tabInstanceId}_sup_${sup.localId}` : '', 
        localId: sup.localId, supplierUid: sup.supplierUid, supplierName: sup.supplierName, 
        supplyDate: sup.supplyDate, documentName: sup.documentName, fileName: sup.file?.name || null 
      })),
      isEdit,
      timestamp: Date.now(),
    };
    saveDraftToStorage(uid, tabInstanceId, draft);
  }, [
    uid, code, name, article, description, isEdit, isDataLoaded,
    selectedCatalog, selectedCatalogId,
    selectedAccountingGroup, selectedAccountingGroupId,
    selectedNomenclatureGroup, selectedNomenclatureGroupId,
    selectedNomenclatureType, selectedNomenclatureTypeId,
    selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId,
    selectedBrand, selectedBrandId,
    selectedModel, selectedModelId,
    selectedCountry, selectedCountryId,
    usage, wasteMaterial, recycleMaterial,
    localCharacteristics,
    localImages, localBlueprints,
    localBarcodes, localSkus, localQrCodes,
    localDocuments, localSupplies,
    tabInstanceId,
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
    
    const restoredBlueprints: LocalImageItem[] = [];
    for (const bpMeta of (draft.localBlueprintsMeta || [])) {
      const file = await getFileFromIndexedDB(bpMeta.key);
      if (file) {
        restoredBlueprints.push({ file, url: URL.createObjectURL(file) });
      }
    }
    setLocalBlueprints(restoredBlueprints);
    
    const restoredBarcodes: LocalCode[] = (draft.localBarcodesMeta || []).map(bcMeta => ({
      codeType: bcMeta.codeType,
      codeValue: bcMeta.codeValue,
      codeKind: bcMeta.codeKind,
      file: null,
      preview: null,
    }));
    setLocalBarcodes(restoredBarcodes);
    
    const restoredSkus: LocalCode[] = (draft.localSkusMeta || []).map(skuMeta => ({
      codeType: skuMeta.codeType,
      codeValue: skuMeta.codeValue,
      codeKind: skuMeta.codeKind,
      file: null,
      preview: null,
    }));
    setLocalSkus(restoredSkus);
    
    const restoredQrCodes: LocalCode[] = (draft.localQrCodesMeta || []).map(qrMeta => ({
      codeType: qrMeta.codeType,
      codeValue: qrMeta.codeValue,
      codeKind: qrMeta.codeKind,
      file: null,
      preview: null,
    }));
    setLocalQrCodes(restoredQrCodes);
    
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
    
    const restoredSupplies: LocalSupply[] = [];
    for (const supMeta of (draft.localSuppliesMeta || [])) {
      let file: File | null = null;
      if (supMeta.key) {
        file = await getFileFromIndexedDB(supMeta.key);
      }
      restoredSupplies.push({
        localId: supMeta.localId,
        supplierUid: supMeta.supplierUid,
        supplierName: supMeta.supplierName,
        supplyDate: supMeta.supplyDate,
        documentName: supMeta.documentName,
        file,
      });
    }
    setLocalSupplies(restoredSupplies);
  }, [uid, tabInstanceId]);

  const fetchTypeAttributes = async () => { try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureTypeAttributes); const data = res.data || []; const map = new Map<string, string>(); data.forEach((item: any) => map.set(item.name, item.uid)); setTypeAttributesMap(map); return map; } catch (e) { console.error(e); return new Map(); } };

  const fetchCodes = useCallback(async () => { 
    if (!uid) return; 
    try { 
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid)); 
      const all: ServerCode[] = (res.data || []).map((c: any) => ({ ...c, fileUrl: c.fileUrl ? ConstantInfo.fileDir + c.fileUrl.replace(/^\//, '') : null })); 
      setServerBarcodes(all.filter(c => c.codeKind === 'BARCODE')); 
      setServerSkus(all.filter(c => c.codeKind === 'SKU')); 
    } catch (e) { console.error(e); } 
  }, [uid]);

  const fetchCharacteristics = async () => { 
    if (!uid) return; 
    try { 
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid));
      const serverChars = res.data || [];
      const mapped = serverChars.map((c: any) => ({
        localId: generateLocalId(), uid: c.uid, attributeTypeUid: c.attributeTypeUid, attributeName: c.attributeName,
        customName: c.customName, value: c.value || '', measureUid: c.measureUid, measureName: c.measureName,
        isCustom: c.isCustom, isRequired: c.attributeName && REQUIRED_ATTRIBUTES.includes(c.attributeName),
      }));
      setLocalCharacteristics(mapped);
      setInitialCharacteristics(JSON.parse(JSON.stringify(mapped)));
    } catch (e) { console.error(e); } 
  };

  useEffect(() => { const handler = (e: Event) => { if ((e as CustomEvent).detail?.tab !== undefined) setActiveTab((e as CustomEvent).detail.tab); }; window.addEventListener('navigateToTab', handler); return () => window.removeEventListener('navigateToTab', handler); }, []);
  useEffect(() => { (async () => { try { setTypeMaterials((await AxiosService.get(ConstantInfo.restApiNomenclatureTypeMaterials)).data || []); } catch (e) { console.error(e); } })(); }, []);

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isEditMode = cp.includes('/edit/');
    setIsEdit(isEditMode);
    
    const init = async () => {
      if (isEditMode) { 
        setIsDataSaved(true);
        await loadMaterialData(uid);
        await fetchCharacteristics();
        await fetchTypeAttributes(); 
        await fetchImages(); 
        await fetchBlueprints(); 
        await fetchDocuments(); 
        await fetchPrices(); 
        await fetchSuppliers(); 
        await fetchCodes();
        
        const draft = loadDraftFromStorage(uid, tabInstanceId);
        if (draft && draft.uid === uid && draft.isEdit) {
          setName(draft.name);
          setArticle(draft.article);
          setDescription(draft.description);
          setSelectedCatalog(draft.selectedCatalog);
          setSelectedCatalogId(draft.selectedCatalogId);
          setSelectedAccountingGroup(draft.selectedAccountingGroup);
          setSelectedAccountingGroupId(draft.selectedAccountingGroupId);
          setSelectedNomenclatureGroup(draft.selectedNomenclatureGroup);
          setSelectedNomenclatureGroupId(draft.selectedNomenclatureGroupId);
          setSelectedNomenclatureType(draft.selectedNomenclatureType);
          setSelectedNomenclatureTypeId(draft.selectedNomenclatureTypeId);
          setSelectedUnit(draft.selectedUnit);
          setSelectedUnitId(draft.selectedUnitId);
          setSelectedManufacturer(draft.selectedManufacturer);
          setSelectedManufacturerId(draft.selectedManufacturerId);
          setSelectedBrand(draft.selectedBrand);
          setSelectedBrandId(draft.selectedBrandId);
          setSelectedModel(draft.selectedModel);
          setSelectedModelId(draft.selectedModelId);
          setSelectedCountry(draft.selectedCountry);
          setSelectedCountryId(draft.selectedCountryId);
          setUsage(draft.usage);
          setWasteMaterial(draft.wasteMaterial);
          setRecycleMaterial(draft.recycleMaterial);
          setLocalCharacteristics(draft.localCharacteristics || []);
          await restoreLocalFiles(draft);
          setInitialState({
            name: draft.name, article: draft.article, description: draft.description,
            selectedCatalog: draft.selectedCatalog, selectedCatalogId: draft.selectedCatalogId,
            selectedAccountingGroup: draft.selectedAccountingGroup, selectedAccountingGroupId: draft.selectedAccountingGroupId,
            selectedNomenclatureGroup: draft.selectedNomenclatureGroup, selectedNomenclatureGroupId: draft.selectedNomenclatureGroupId,
            selectedNomenclatureType: draft.selectedNomenclatureType, selectedNomenclatureTypeId: draft.selectedNomenclatureTypeId,
            selectedUnit: draft.selectedUnit, selectedUnitId: draft.selectedUnitId,
            selectedManufacturer: draft.selectedManufacturer, selectedManufacturerId: draft.selectedManufacturerId,
            selectedBrand: draft.selectedBrand, selectedBrandId: draft.selectedBrandId,
            selectedModel: draft.selectedModel, selectedModelId: draft.selectedModelId,
            selectedCountry: draft.selectedCountry, selectedCountryId: draft.selectedCountryId,
            usage: draft.usage, wasteMaterial: draft.wasteMaterial, recycleMaterial: draft.recycleMaterial,
          });
        } else {
          setInitialState({
            name, article, description,
            selectedCatalog, selectedCatalogId,
            selectedAccountingGroup, selectedAccountingGroupId,
            selectedNomenclatureGroup, selectedNomenclatureGroupId,
            selectedNomenclatureType, selectedNomenclatureTypeId,
            selectedUnit, selectedUnitId,
            selectedManufacturer, selectedManufacturerId,
            selectedBrand, selectedBrandId,
            selectedModel, selectedModelId,
            selectedCountry, selectedCountryId,
            usage, wasteMaterial, recycleMaterial,
          });
        }
        setIsDataLoaded(true);
      } else { 
        await fetchTypeAttributes();
        
        const draft = loadDraftFromStorage(uid, tabInstanceId);
        if (draft && draft.uid === uid) {
          hasInitializedChars.current = true;
          setName(draft.name);
          setArticle(draft.article);
          setDescription(draft.description);
          setSelectedCatalog(draft.selectedCatalog);
          setSelectedCatalogId(draft.selectedCatalogId);
          setSelectedAccountingGroup(draft.selectedAccountingGroup);
          setSelectedAccountingGroupId(draft.selectedAccountingGroupId);
          setSelectedNomenclatureGroup(draft.selectedNomenclatureGroup);
          setSelectedNomenclatureGroupId(draft.selectedNomenclatureGroupId);
          setSelectedNomenclatureType(draft.selectedNomenclatureType);
          setSelectedNomenclatureTypeId(draft.selectedNomenclatureTypeId);
          setSelectedUnit(draft.selectedUnit);
          setSelectedUnitId(draft.selectedUnitId);
          setSelectedManufacturer(draft.selectedManufacturer);
          setSelectedManufacturerId(draft.selectedManufacturerId);
          setSelectedBrand(draft.selectedBrand);
          setSelectedBrandId(draft.selectedBrandId);
          setSelectedModel(draft.selectedModel);
          setSelectedModelId(draft.selectedModelId);
          setSelectedCountry(draft.selectedCountry);
          setSelectedCountryId(draft.selectedCountryId);
          setUsage(draft.usage);
          setWasteMaterial(draft.wasteMaterial);
          setRecycleMaterial(draft.recycleMaterial);
          setLocalCharacteristics(draft.localCharacteristics || []);
          await restoreLocalFiles(draft);
          setIsDataSaved(false);
          setIsDataLoaded(true);
        } else {
          setIsDataSaved(false);
          setIsDataLoaded(true);
          const s = sessionStorage.getItem('nomenclature_preselected_group'); 
          if (s) { 
            try { 
              const p = JSON.parse(s); 
              if (p.groupUid) { 
                setSelectedCatalogId(p.groupUid); 
                setSelectedCatalog(p.groupName || 'Выбрано из меню'); 
              } 
            } catch (e) {} 
            sessionStorage.removeItem('nomenclature_preselected_group'); 
          }
        }
      }
    };
    
    init();
  }, [uid, tabInstanceId]);

  useEffect(() => { 
    if (uid && !isEdit && localCharacteristics.length === 0 && !hasInitializedChars.current) { 
      hasInitializedChars.current = true;
      const initChars = async () => { 
        const attrMap = await fetchTypeAttributes(); 
        const defaultChars = REQUIRED_ATTRIBUTES.map(name => ({ 
          localId: generateLocalId(), 
          uid: null, 
          attributeTypeUid: attrMap.get(name) || null, 
          attributeName: name, 
          customName: null, 
          value: '', 
          measureUid: null, 
          measureName: null, 
          isCustom: false, 
          isRequired: true 
        }));
        setLocalCharacteristics(defaultChars); 
      }; 
      initChars(); 
    } 
  }, [uid, isEdit, localCharacteristics.length]);
  
  useEffect(() => { if (isFinishedProduct && activeTab >= tabs_list.length) { setActiveTab(0); } }, [isFinishedProduct]);

  const fetchSuppliers = async () => { try { setSuppliers((await AxiosService.get(ConstantInfo.restApiNomenclatureSuppliers)).data || []); } catch (e) { console.error(e); } };
  const fetchImages = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid)); const imgs = (res.data || []).map((img: any) => ({ uid: img.uid, url: img.url ? ConstantInfo.fileDir + img.url.replace(/^\//, '') : '', originalName: img.originalName || '' })); setImages(imgs); setInitialImagesCount(imgs.length); } catch (e) { console.error(e); } };
  const fetchBlueprints = async () => { if (!uid) return; try { setBlueprints(((await AxiosService.get(ConstantInfo.restApiNomenclatureBlueprints(uid))).data || []).map((bp: any) => ({ uid: bp.uid, url: bp.url ? ConstantInfo.fileDir + bp.url.replace(/^\//, '') : '', originalName: bp.originalName || '' }))); } catch (e) { console.error(e); } };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const handleDeleteImage = async (imageUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteImage(imageUid)); await fetchImages(); } catch (er) { console.error(er); } };
  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const handleDeleteBlueprint = async (bpUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteBlueprint(bpUid)); await fetchBlueprints(); } catch (er) { console.error(er); } };
  const fetchDocuments = async () => { if (!uid) return; try { setDocuments(((await AxiosService.get(ConstantInfo.restApiNomenclatureDocuments(uid))).data || []).map((doc: any) => ({ ...doc, url: doc.url ? ConstantInfo.fileDir + doc.url.replace(/^\//, '') : '' }))); } catch (e) { console.error(e); } };
  const handleDocumentUpload = (documentName: string, file: File) => { setLocalDocuments(prev => [...prev, { localId: generateLocalId(), documentName, file }]); };
  const handleDeleteDocument = (uid: string) => { setLocalDocuments(prev => prev.filter(d => d.localId !== uid)); if (uid && !uid.startsWith('local_')) { AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteDocument(uid)).then(() => fetchDocuments()).catch(e => console.error(e)); } };
  const fetchPrices = async () => { if (!uid) return; try { setPrices((await AxiosService.get(ConstantInfo.restApiNomenclaturePrices(uid))).data || []); } catch (e) { console.error(e); } };
  const handleAddPrice = async () => { if (!uid || !newPrice) return; try { await AxiosService.post(ConstantInfo.restApiNomenclaturePrices(uid), { price: parseFloat(newPrice), priceDate: newPriceDate, supplierUid: newPriceSupplierUid || null }); await fetchPrices(); setShowAddPricePopup(false); setNewPrice(''); setNewPriceSupplierUid(''); } catch (e) { console.error(e); } };
  const handleDeletePrice = async (priceUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeletePrice(priceUid)); await fetchPrices(); } catch (e) { console.error(e); } };
  
  const loadMaterialData = async (muid: string): Promise<void> => { 
    setIsLoading(true); 
    try { 
      const d = (await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(muid))).data; 
      setName(d.name || ''); 
      setArticle(d.article || ''); 
      setDescription(d.description || ''); 
      setUsage(d.usage || false); 
      setWasteMaterial(d.wasteMaterial || false); 
      setRecycleMaterial(d.recycleMaterial || false); 
      if (d.groupUid) { setSelectedCatalogId(d.groupUid); setSelectedCatalog(d.groupName || ''); } else { setSelectedCatalogId(''); setSelectedCatalog(''); }
      if (d.typeMainUid) { setSelectedAccountingGroupId(d.typeMainUid); setSelectedAccountingGroup(d.typeMainName || ''); } else { setSelectedAccountingGroupId(''); setSelectedAccountingGroup(''); }
      if (d.typePurposeUid) { setSelectedNomenclatureGroupId(d.typePurposeUid); setSelectedNomenclatureGroup(d.typePurposeName || ''); } else { setSelectedNomenclatureGroupId(''); setSelectedNomenclatureGroup(''); }
      if (d.typeProductUid) { setSelectedNomenclatureTypeId(d.typeProductUid); setSelectedNomenclatureType(d.typeProductName || ''); } else { setSelectedNomenclatureTypeId(''); setSelectedNomenclatureType(''); }
      if (d.measureUid) { setSelectedUnitId(d.measureUid); setSelectedUnit(d.measureName || ''); } else { setSelectedUnitId(''); setSelectedUnit(''); }
      if (d.manufacturerUid) { setSelectedManufacturerId(d.manufacturerUid); setSelectedManufacturer(d.manufacturerName || ''); } else { setSelectedManufacturerId(''); setSelectedManufacturer(''); }
      if (d.brandUid) { setSelectedBrandId(d.brandUid); setSelectedBrand(d.brandName || ''); } else { setSelectedBrandId(''); setSelectedBrand(''); }
      if (d.modelOfBrandUid) { setSelectedModelId(d.modelOfBrandUid); setSelectedModel(d.modelOfBrandName || ''); } else { setSelectedModelId(''); setSelectedModel(''); }
      if (d.countryUid) { setSelectedCountryId(d.countryUid); setSelectedCountry(d.countryName || ''); } else { setSelectedCountryId(''); setSelectedCountry(''); }
    } catch (e) { console.error(e); } finally { setIsLoading(false); } 
  };

  const saveCharacteristics = async () => {
    if (!uid) return;
    let existingChars: any[] = [];
    try { existingChars = (await AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid))).data || []; } catch (e) { console.error(e); }
    for (const char of localCharacteristics) {
      try {
        let existingChar = null;
        if (char.uid) existingChar = existingChars.find((c: any) => c.uid === char.uid);
        if (!existingChar && char.attributeTypeUid && !char.isCustom) existingChar = existingChars.find((c: any) => c.attributeTypeUid === char.attributeTypeUid);
        if (!existingChar && char.attributeName && !char.isCustom) existingChar = existingChars.find((c: any) => c.attributeName === char.attributeName);
        if (existingChar) {
          const serverValue = existingChar.value || '';
          const localValue = char.value || '';
          if (serverValue !== localValue) {
            await AxiosService.patch(ConstantInfo.restApiNomenclatureUpdateCharacteristic(existingChar.uid), { value: localValue, measureUid: char.measureUid || null });
          }
        } else {
          const createData: any = { value: char.value || '', measureUid: char.measureUid || null };
          if (char.isCustom) { createData.attributeTypeUid = null; createData.customName = char.customName || char.attributeName; }
          else if (char.attributeTypeUid) { createData.attributeTypeUid = char.attributeTypeUid; }
          await AxiosService.post(ConstantInfo.restApiNomenclatureAddCharacteristic(uid), createData);
        }
      } catch (e) { console.error(`Ошибка сохранения "${char.attributeName}":`, e); }
    }
  };

  const areRequiredAttrsFilled = useCallback(() => REQUIRED_ATTRIBUTES.every(name => { const char = localCharacteristics.find(c => c.attributeName === name); return char && char.value && char.value.trim() !== ''; }), [localCharacteristics]);
  const getTotalImagesCount = useCallback((): number => images.length + localImages.length, [images, localImages]);
  const getTotalDocumentsCount = useCallback((): number => documents.length + localDocuments.length, [documents, localDocuments]);
  const getTotalSuppliesCount = useCallback((): number => localSupplies.length, [localSupplies]);
  const getProgressStep = useCallback((): number => { const a = !!(name && article && selectedCatalogId); const b = a && !!(selectedAccountingGroupId && selectedNomenclatureGroupId && selectedNomenclatureTypeId && selectedUnitId && selectedManufacturerId && selectedBrandId && selectedModelId && selectedCountryId && areRequiredAttrsFilled()); if (!a) return 0; if (!b) return 1; if (getTotalImagesCount() > 0 && !!(description && description.trim()) && getTotalDocumentsCount() > 0 && getTotalSuppliesCount() > 0) return 3; return 2; }, [name, article, selectedCatalogId, selectedAccountingGroupId, selectedNomenclatureGroupId, selectedNomenclatureTypeId, selectedUnitId, selectedManufacturerId, selectedBrandId, selectedModelId, selectedCountryId, areRequiredAttrsFilled, description, getTotalImagesCount, getTotalDocumentsCount, getTotalSuppliesCount]);

  const getMissingFields = (): Set<string> => { const m = new Set<string>(); if (!name.trim()) m.add('name'); if (!article.trim()) m.add('article'); if (!selectedCatalogId) m.add('catalog'); if (!selectedAccountingGroupId) m.add('accountingGroup'); if (!selectedNomenclatureGroupId) m.add('nomenclatureGroup'); if (!selectedNomenclatureTypeId) m.add('nomenclatureType'); if (!selectedUnitId) m.add('unit'); if (!selectedManufacturerId) m.add('manufacturer'); if (!selectedBrandId) m.add('brand'); if (!selectedModelId) m.add('model'); if (!selectedCountryId) m.add('country'); REQUIRED_ATTRIBUTES.forEach(n => { const c = localCharacteristics.find(x => x.attributeName === n); if (!c || !c.value || c.value.trim() === '') m.add(`char_${n}`); }); return m; };
  const getMissingFieldLabels = (): string[] => { const l: string[] = []; if (!name.trim()) l.push('Наименование'); if (!article.trim()) l.push('Артикул'); if (!selectedCatalogId) l.push('Каталог'); if (!selectedAccountingGroupId) l.push('Группа учета'); if (!selectedNomenclatureGroupId) l.push('Группа номенклатуры'); if (!selectedNomenclatureTypeId) l.push('Вид номенклатуры'); if (!selectedUnitId) l.push('Единица измерения'); if (!selectedManufacturerId) l.push('Производитель'); if (!selectedBrandId) l.push('Бренд'); if (!selectedModelId) l.push('Модель'); if (!selectedCountryId) l.push('Страна происхождения'); REQUIRED_ATTRIBUTES.forEach(n => { const c = localCharacteristics.find(x => x.attributeName === n); if (!c || !c.value || c.value.trim() === '') l.push(n); }); return l; };

  const isDirty = React.useMemo(() => {
    if (!isEdit) return true;
    if (!initialState) return false;
    
    return (
      name !== initialState.name ||
      article !== initialState.article ||
      description !== initialState.description ||
      selectedCatalog !== initialState.selectedCatalog ||
      selectedCatalogId !== initialState.selectedCatalogId ||
      selectedAccountingGroup !== initialState.selectedAccountingGroup ||
      selectedAccountingGroupId !== initialState.selectedAccountingGroupId ||
      selectedNomenclatureGroup !== initialState.selectedNomenclatureGroup ||
      selectedNomenclatureGroupId !== initialState.selectedNomenclatureGroupId ||
      selectedNomenclatureType !== initialState.selectedNomenclatureType ||
      selectedNomenclatureTypeId !== initialState.selectedNomenclatureTypeId ||
      selectedUnit !== initialState.selectedUnit ||
      selectedUnitId !== initialState.selectedUnitId ||
      selectedManufacturer !== initialState.selectedManufacturer ||
      selectedManufacturerId !== initialState.selectedManufacturerId ||
      selectedBrand !== initialState.selectedBrand ||
      selectedBrandId !== initialState.selectedBrandId ||
      selectedModel !== initialState.selectedModel ||
      selectedModelId !== initialState.selectedModelId ||
      selectedCountry !== initialState.selectedCountry ||
      selectedCountryId !== initialState.selectedCountryId ||
      usage !== initialState.usage ||
      wasteMaterial !== initialState.wasteMaterial ||
      recycleMaterial !== initialState.recycleMaterial ||
      JSON.stringify(localCharacteristics) !== JSON.stringify(initialCharacteristics) ||
      localImages.length > 0 ||
      localBlueprints.length > 0 ||
      localDocuments.length > 0 ||
      localSupplies.length > 0 ||
      localBarcodes.length > 0 ||
      localSkus.length > 0 ||
      localQrCodes.length > 0 ||
      images.length !== initialImagesCount
    );
  }, [
    isEdit, initialState, name, article, description,
    selectedCatalog, selectedCatalogId,
    selectedAccountingGroup, selectedAccountingGroupId,
    selectedNomenclatureGroup, selectedNomenclatureGroupId,
    selectedNomenclatureType, selectedNomenclatureTypeId,
    selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId,
    selectedBrand, selectedBrandId,
    selectedModel, selectedModelId,
    selectedCountry, selectedCountryId,
    usage, wasteMaterial, recycleMaterial,
    localCharacteristics, initialCharacteristics,
    localImages, localBlueprints, localDocuments, localSupplies,
    localBarcodes, localSkus, localQrCodes,
    images.length, initialImagesCount
  ]);

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

  const handleSave = async () => { 
    if (!uid || !code) return; 
    setIsSaving(true); 
    try { 
      await AxiosService.post(ConstantInfo.restApiNomenclatureDraft, { 
        uid, code: parseInt(code), name, article, description, 
        groupUid: selectedCatalogId || null, 
        typeMainUid: selectedAccountingGroupId || null, 
        typePurposeUid: selectedNomenclatureGroupId || null, 
        typeProductUid: selectedNomenclatureTypeId || null, 
        usage, wasteMaterial, recycleMaterial, 
        measureUid: selectedUnitId || null, 
        manufacturerUid: selectedManufacturerId || null, 
        brandUid: selectedBrandId || null, 
        modelOfBrandUid: selectedModelId || null, 
        countryUid: selectedCountryId || null, 
        author: 'Оператор' 
      }); 
      await saveCharacteristics(); 
      for (const img of localImages) { const fd = new FormData(); fd.append('file', img.file); fd.append('author', 'Оператор'); await AxiosService.post(ConstantInfo.restApiNomenclatureImages(uid), fd); } 
      for (const bp of localBlueprints) { const fd = new FormData(); fd.append('file', bp.file); fd.append('author', 'Оператор'); await AxiosService.post(ConstantInfo.restApiNomenclatureBlueprints(uid), fd); } 
      for (const bc of localBarcodes) { 
        const fd = new FormData(); 
        fd.append('codeType', bc.codeType); 
        fd.append('codeValue', bc.codeValue); 
        fd.append('codeKind', 'BARCODE'); 
        fd.append('author', 'Оператор'); 
        await AxiosService.post(ConstantInfo.restApiNomenclatureCodes(uid), fd); 
      } 
      for (const qr of localQrCodes) { 
        const fd = new FormData(); 
        fd.append('codeType', qr.codeType); 
        fd.append('codeValue', qr.codeValue); 
        fd.append('codeKind', 'QR'); 
        fd.append('author', 'Оператор'); 
        await AxiosService.post(ConstantInfo.restApiNomenclatureCodes(uid), fd); 
      } 
      for (const sku of localSkus) { 
        const fd = new FormData(); 
        fd.append('codeType', sku.codeType); 
        fd.append('codeValue', sku.codeValue); 
        fd.append('codeKind', 'SKU'); 
        fd.append('author', 'Оператор'); 
        await AxiosService.post(ConstantInfo.restApiNomenclatureCodes(uid), fd); 
      } 
      for (const doc of localDocuments) { const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName); fd.append('author', 'Оператор'); await AxiosService.post(ConstantInfo.restApiNomenclatureDocuments(uid), fd); } 
      for (const supply of localSupplies) { const fd = new FormData(); fd.append('supplierUid', supply.supplierUid); if (supply.supplyDate) fd.append('supplyDate', supply.supplyDate + ':00'); if (supply.documentName.trim()) fd.append('documentName', supply.documentName.trim()); if (supply.file) fd.append('file', supply.file); fd.append('author', 'Оператор'); await AxiosService.post(ConstantInfo.restApiNomenclatureSupply(uid), fd); } 
      setLocalImages([]); 
      setLocalBlueprints([]); 
      setLocalBarcodes([]); 
      setLocalQrCodes([]); 
      setLocalSkus([]); 
      setLocalDocuments([]); 
      setLocalSupplies([]); 
      await fetchImages(); 
      await fetchBlueprints(); 
      await fetchDocuments(); 
      await fetchCharacteristics(); 
      await fetchCodes(); 
      
      await clearDraftStorage(uid, tabInstanceId);
      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      
      setIsDataSaved(true); 
      setValidationErrors(new Set()); 
      window.dispatchEvent(new CustomEvent('refreshEvents')); 
      
      setInitialState({
        name, article, description,
        selectedCatalog, selectedCatalogId,
        selectedAccountingGroup, selectedAccountingGroupId,
        selectedNomenclatureGroup, selectedNomenclatureGroupId,
        selectedNomenclatureType, selectedNomenclatureTypeId,
        selectedUnit, selectedUnitId,
        selectedManufacturer, selectedManufacturerId,
        selectedBrand, selectedBrandId,
        selectedModel, selectedModelId,
        selectedCountry, selectedCountryId,
        usage, wasteMaterial, recycleMaterial,
      });
      setInitialImagesCount(images.length);
      
      if (!isEdit) {
        setIsEdit(true);
        navigate(`/references/nomenclature/edit/${uid}/${code}`, { replace: true });
      }
      
      return true; 
    } catch (e) { console.error(e); return false; } finally { setIsSaving(false); } 
  };

  const handleClose = () => { 
    const t = tabs.find(tab => tab.id === activeTabId); 
    if (t) closeTab(t.id); 
    if (uid) sessionStorage.removeItem(getPopupOpenKey());
  };
  const handleSaveAndClose = async () => { if (await handleSave()) handleClose(); };
  const handleCloseWithoutSaving = async () => { 
    if (uid) {
      await clearDraftStorage(uid, tabInstanceId); 
      sessionStorage.removeItem(getPopupOpenKey());
    }
    handleClose(); 
  };
  const handleAccountingGroupSelect = (o: TypeMaterialOption) => { setSelectedAccountingGroup(o.typeName); setSelectedAccountingGroupId(o.uid); setAccountingGroupOpen(false); setSelectedNomenclatureGroup(''); setSelectedNomenclatureGroupId(''); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); setValidationErrors(prev => { const n = new Set(prev); n.delete('accountingGroup'); return n; }); };
  const handleTabChange = (index: number) => { if (!isDataSaved && index > 1) { const m = getMissingFields(); setValidationErrors(m); setShowBlockedTabWarning(true); return; } setActiveTab(index); if (!isFinishedProduct && (index === 4 || index === 5)) fetchSuppliers(); };
  const handleEventLogClick = () => { if (!isDataSaved) { const m = getMissingFields(); setValidationErrors(m); setShowBlockedTabWarning(true); return; } setActiveTab(EVENT_LOG_TAB); };
  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };
  const openPopup = (type: PopupType) => { 
    if (type === 'nomenclatureGroup' && !selectedAccountingGroupId) return; 
    if (type === 'nomenclatureType' && !selectedNomenclatureGroupId) return; 
    if (type === 'brand' && !selectedManufacturerId) return; 
    if (type === 'model' && !selectedBrandId) return; 
    setPopupType(type); 
    if (type === 'nomenclatureGroup') setPopupFilterParam(selectedAccountingGroupId); 
    else if (type === 'nomenclatureType') setPopupFilterParam(selectedNomenclatureGroupId); 
    else if (type === 'brand') setPopupFilterParam(selectedManufacturerId); 
    else if (type === 'model') setPopupFilterParam(selectedBrandId); 
    else setPopupFilterParam(undefined); 
    setPopupOpen(true); 
    if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true'); 
  };
  const handlePopupSelect = (id: string, nm: string) => { 
    switch (popupType) { 
      case 'catalog': setSelectedCatalog(nm); setSelectedCatalogId(id); setValidationErrors(p => { const n = new Set(p); n.delete('catalog'); return n; }); break; 
      case 'nomenclatureGroup': setSelectedNomenclatureGroup(nm); setSelectedNomenclatureGroupId(id); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); setValidationErrors(p => { const n = new Set(p); n.delete('nomenclatureGroup'); return n; }); break; 
      case 'nomenclatureType': setSelectedNomenclatureType(nm); setSelectedNomenclatureTypeId(id); setValidationErrors(p => { const n = new Set(p); n.delete('nomenclatureType'); return n; }); break; 
      case 'unit': setSelectedUnit(nm); setSelectedUnitId(id); setValidationErrors(p => { const n = new Set(p); n.delete('unit'); return n; }); break; 
      case 'manufacturer': setSelectedManufacturer(nm); setSelectedManufacturerId(id); setSelectedBrand(''); setSelectedBrandId(''); setSelectedModel(''); setSelectedModelId(''); setValidationErrors(p => { const n = new Set(p); n.delete('manufacturer'); return n; }); break; 
      case 'brand': setSelectedBrand(nm); setSelectedBrandId(id); setSelectedModel(''); setSelectedModelId(''); setValidationErrors(p => { const n = new Set(p); n.delete('brand'); return n; }); break; 
      case 'model': setSelectedModel(nm); setSelectedModelId(id); setValidationErrors(p => { const n = new Set(p); n.delete('model'); return n; }); break; 
      case 'country': setSelectedCountry(nm); setSelectedCountryId(id); setValidationErrors(p => { const n = new Set(p); n.delete('country'); return n; }); break; 
    } 
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    if (uid) sessionStorage.removeItem(getPopupOpenKey());
  };

  const canSave = getProgressStep() >= 2 && isDirty;
  const cef = ['unit', 'manufacturer', 'brand', 'model', 'country', 'char_Длина', 'char_Ширина', 'char_Высота', 'char_Масса'];
  const hasCharacteristicsErrors = cef.some(f => validationErrors.has(f));

  const buttonStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : isDisabled ? '#BCC8FF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden', opacity: isDisabled ? 0.5 : 1 });
  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const bottomButtonStyle: React.CSSProperties = { height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const rightButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  const commonProps: CommonProps = { uid, code, name, article, description, isEdit, isSaving, isUploading, isUploadingBlueprint, images, blueprints, documents, prices, suppliers, selectedImageIndex, selectedBlueprintIndex, selectedCatalog, selectedCatalogId, selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen, selectedNomenclatureGroup, selectedNomenclatureGroupId, selectedNomenclatureType, selectedNomenclatureTypeId, selectedUnit, selectedUnitId, selectedManufacturer, selectedManufacturerId, selectedBrand, selectedBrandId, selectedModel, selectedModelId, selectedCountry, selectedCountryId, usage, wasteMaterial, recycleMaterial, nameFocused, articleFocused, descriptionFocused, showAddPricePopup, newPrice, newPriceDate, newPriceSupplierUid, fullscreenImage, fullscreenBlueprint, isLoading, isLoadingPrices: false, typeMaterials, fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>, blueprintInputRef: blueprintInputRef as React.RefObject<HTMLInputElement>, documentInputRef: documentInputRef as React.RefObject<HTMLInputElement>, localCharacteristics, setLocalCharacteristics, localDocuments, setLocalDocuments, localSupplies, setLocalSupplies, localImages, setLocalImages, localBlueprints, setLocalBlueprints, localBarcodes, setLocalBarcodes, localSkus, setLocalSkus, localQrCodes, setLocalQrCodes, serverBarcodes, serverSkus, setName, setArticle, setDescription, setNameFocused, setArticleFocused, setDescriptionFocused, toggleUsage, toggleWasteMaterial, toggleRecycleMaterial, setSelectedCatalog, setSelectedCatalogId, setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen, setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId, setSelectedNomenclatureType, setSelectedNomenclatureTypeId, setSelectedUnit, setSelectedUnitId, setSelectedManufacturer, setSelectedManufacturerId, setSelectedBrand, setSelectedBrandId, setSelectedModel, setSelectedModelId, setSelectedCountry, setSelectedCountryId, setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage, setBlueprints, setSelectedBlueprintIndex, setIsUploadingBlueprint, setFullscreenBlueprint, setDocuments, setPrices, setShowAddPricePopup, setNewPrice, setNewPriceDate, setNewPriceSupplierUid, setSuppliers, handleImageUpload, handleDeleteImage, handleBlueprintUpload, handleDeleteBlueprint, handleDocumentUpload, handleDeleteDocument, fetchPrices, handleAddPrice, handleDeletePrice, fetchSuppliers, openPopup, handleAccountingGroupSelect, isDataSaved, validationErrors, setValidationErrors, isFinishedProduct };

  const isEventLogActive = activeTab === EVENT_LOG_TAB;

  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, display: 'flex', alignItems: 'center', gap: 25 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>{isEdit ? `Справочник: Номенклатура (${name || 'Номенклатура'})` : 'Справочник: Номенклатура (Создание)'}</h1>
        <img src={getStatusIcon()} alt="" style={{ width: getStatusIconWidth(), height: 29, flexShrink: 0 }} />
      </div>
      
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabChange(0)} style={mainButtonStyle(activeTab === 0 && !isEventLogActive)}>
            <span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3, ease: 'easeInOut' }} />
            </button>
          </button>
          <AnimatePresence>
            {!tabsCollapsed && tabs_list.slice(1).map((tab, i) => {
              const tabIndex = i + 1;
              const isBlocked = !isDataSaved && tabIndex > 1;
              const isCharacteristicsTab = tabIndex === 1;
              return (
                <motion.button key={tab} onClick={() => handleTabChange(tabIndex)} style={{ ...buttonStyle(activeTab === tabIndex && !isEventLogActive, isBlocked), outline: isCharacteristicsTab && hasCharacteristicsErrors && validationErrors.size > 0 ? '2px solid #FF3052' : 'none', outlineOffset: -2 }} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={rightButtonStyle}><img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={rightButtonStyle}><img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} /></button>
          <button onClick={handleEventLogClick} style={{ ...rightButtonStyle, backgroundColor: isEventLogActive ? '#666EFE' : '#FFFFFF' }}>
            <img src={HistoryIcon18Black} alt="" style={{ width: 18, height: 16, filter: isEventLogActive ? 'brightness(0) invert(1)' : 'none' }} />
          </button>
        </div>
      </div>

      {isEventLogActive ? <EventLogTab {...commonProps} /> : (
        <>
          {(() => {
            if (isFinishedProduct) { switch (activeTab) { case 0: return <MainTab {...commonProps} />; case 1: return <CharacteristicsTab {...commonProps} />; case 2: return <DocumentsTab {...commonProps} />; case 3: return <div style={{ position: 'absolute', top: 164, left: 30, right: 30, bottom: 111, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>На складе</span></div>; case 4: return <IntegrationTab {...commonProps} />; default: return null; } }
            switch (activeTab) { case 0: return <MainTab {...commonProps} />; case 1: return <CharacteristicsTab {...commonProps} />; case 2: return <DocumentsTab {...commonProps} />; case 3: return <div style={{ position: 'absolute', top: 164, left: 30, right: 30, bottom: 111, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Остатки</span></div>; case 4: return <SuppliersTab {...commonProps} />; case 5: return <PriceHistoryTab {...commonProps} />; case 6: return <AnalogsTab {...commonProps} />; case 7: return <RatingTab {...commonProps} />; case 8: return <IntegrationTab {...commonProps} />; default: return null; }
          })()}
          <div style={{ position: 'absolute', bottom: 25, left: 45, display: 'flex', alignItems: 'flex-end' }}><ProgressBar currentStep={getProgressStep()} /></div>
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
            <button style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }} onClick={() => setShowClosePopup(true)}>Закрыть</button>
          </div>
        </>
      )}

      <CatalogSelectPopup 
        isOpen={popupOpen} 
        onClose={handlePopupClose} 
        onSelect={handlePopupSelect} 
        popupType={popupType} 
        filterParam={popupFilterParam} 
      />

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
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Нет изменений для сохранения.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{canSave && <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>}<button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button><button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NomenclatureCreatePage;