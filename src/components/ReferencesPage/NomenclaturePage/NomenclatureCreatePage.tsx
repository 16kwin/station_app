// NomenclatureCreatePage.tsx — ПОЛНЫЙ ФАЙЛ (localImages/locabarcodes/localSkus подняты сюда)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import Icon7 from '../../../assets/References/NomenclatureCreatePage/Icon7.svg';
import IconArrow from '../../../assets/References/NomenclatureCreatePage/IconArrow.svg';
import IconArrow2 from '../../../assets/References/NomenclatureCreatePage/IconArrow2.svg';

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
  localBarcodes: LocalCode[]; setLocalBarcodes: React.Dispatch<React.SetStateAction<LocalCode[]>>;
  localSkus: LocalCode[]; setLocalSkus: React.Dispatch<React.SetStateAction<LocalCode[]>>;
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
}

const REQUIRED_ATTRIBUTES = ['Длина', 'Ширина', 'Высота', 'Масса'];

const NomenclatureCreatePage = () => {
  const { uid, code } = useParams<{ uid: string; code: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();

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
  const [typeAttributesMap, setTypeAttributesMap] = useState<Map<string, string>>(new Map());
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [localSupplies, setLocalSupplies] = useState<LocalSupply[]>([]);
  
  // Поднимаем сюда из MainTab
  const [localImages, setLocalImages] = useState<LocalImageItem[]>([]);
  const [localBarcodes, setLocalBarcodes] = useState<LocalCode[]>([]);
  const [localSkus, setLocalSkus] = useState<LocalCode[]>([]);
  
  const [popupOpen, setPopupOpen] = useState(false); const [popupType, setPopupType] = useState<PopupType>('catalog'); const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]); const [selectedImageIndex, setSelectedImageIndex] = useState(0); const [isUploading, setIsUploading] = useState(false); const [fullscreenImage, setFullscreenImage] = useState(false);
  const [blueprints, setBlueprints] = useState<ImageItem[]>([]); const [selectedBlueprintIndex, setSelectedBlueprintIndex] = useState(0); const [isUploadingBlueprint, setIsUploadingBlueprint] = useState(false); const [fullscreenBlueprint, setFullscreenBlueprint] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]); const [showAddPricePopup, setShowAddPricePopup] = useState(false); const [newPrice, setNewPrice] = useState(''); const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().slice(0, 16)); const [newPriceSupplierUid, setNewPriceSupplierUid] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const tabs_list = ['Основное', 'Характеристики', 'Документы', 'Остатки', 'Поставщики', 'История цен', 'Аналоги', 'Рейтинг', 'Интеграция'];
  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fetchTypeAttributes = async () => { try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureTypeAttributes); const data = res.data || []; const map = new Map<string, string>(); data.forEach((item: any) => map.set(item.name, item.uid)); setTypeAttributesMap(map); return map; } catch (e) { console.error(e); return new Map(); } };

  useEffect(() => { if (uid && !isEdit && localCharacteristics.length === 0) { const initChars = async () => { const attrMap = await fetchTypeAttributes(); setLocalCharacteristics(REQUIRED_ATTRIBUTES.map(name => ({ localId: generateLocalId(), uid: null, attributeTypeUid: attrMap.get(name) || null, attributeName: name, customName: null, value: '', measureUid: null, measureName: null, isCustom: false, isRequired: true }))); }; initChars(); } }, [uid, isEdit]);

  const fetchCharacteristics = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid)); setLocalCharacteristics((res.data || []).map((c: any) => ({ localId: generateLocalId(), uid: c.uid, attributeTypeUid: c.attributeTypeUid, attributeName: c.attributeName, customName: c.customName, value: c.value || '', measureUid: c.measureUid, measureName: c.measureName, isCustom: c.isCustom, isRequired: c.attributeName && REQUIRED_ATTRIBUTES.includes(c.attributeName) }))); } catch (e) { console.error(e); } };

  useEffect(() => { const handler = (e: Event) => { if ((e as CustomEvent).detail?.tab !== undefined) setActiveTab((e as CustomEvent).detail.tab); }; window.addEventListener('navigateToTab', handler); return () => window.removeEventListener('navigateToTab', handler); }, []);
  useEffect(() => { (async () => { try { setTypeMaterials((await AxiosService.get(ConstantInfo.restApiNomenclatureTypeMaterials)).data || []); } catch (e) { console.error(e); } })(); }, []);
  useEffect(() => { const cp = window.location.pathname; setIsEdit(cp.includes('/edit/')); if (uid && cp.includes('/edit/')) { loadMaterialData(uid); fetchCharacteristics(); fetchTypeAttributes(); } if (uid && cp.includes('/create/')) { fetchTypeAttributes(); const s = sessionStorage.getItem('nomenclature_preselected_group'); if (s) { try { const p = JSON.parse(s); if (p.groupUid) { setSelectedCatalogId(p.groupUid); setSelectedCatalog(p.groupName || 'Выбрано из меню'); } } catch (e) {} sessionStorage.removeItem('nomenclature_preselected_group'); } } }, [uid]);
  useEffect(() => { if (uid && isEdit) { fetchImages(); fetchBlueprints(); fetchDocuments(); fetchPrices(); fetchSuppliers(); } }, [uid, isEdit]);

  const fetchSuppliers = async () => { try { setSuppliers((await AxiosService.get(ConstantInfo.restApiNomenclatureSuppliers)).data || []); } catch (e) { console.error(e); } };
  const fetchImages = async () => { if (!uid) return; try { setImages(((await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid))).data || []).map((img: any) => ({ ...img, url: ConstantInfo.fileDir + img.url.replace(/^\//, '') }))); } catch (e) { console.error(e); } };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !uid) return; setIsUploading(true); try { const fd = new FormData(); fd.append('file', f); await AxiosService.post(ConstantInfo.restApiNomenclatureImages(uid), fd); await fetchImages(); } catch (er) { console.error(er); } finally { setIsUploading(false); } };
  const handleDeleteImage = async (imageUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteImage(imageUid)); await fetchImages(); } catch (er) { console.error(er); } };
  const fetchBlueprints = async () => { if (!uid) return; try { setBlueprints(((await AxiosService.get(ConstantInfo.restApiNomenclatureBlueprints(uid))).data || []).map((bp: any) => ({ ...bp, url: ConstantInfo.fileDir + bp.url.replace(/^\//, '') }))); } catch (e) { console.error(e); } };
  const handleBlueprintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !uid) return; setIsUploadingBlueprint(true); try { const fd = new FormData(); fd.append('file', f); await AxiosService.post(ConstantInfo.restApiNomenclatureBlueprints(uid), fd); await fetchBlueprints(); } catch (er) { console.error(er); } finally { setIsUploadingBlueprint(false); } };
  const handleDeleteBlueprint = async (bpUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteBlueprint(bpUid)); await fetchBlueprints(); } catch (er) { console.error(er); } };
  const fetchDocuments = async () => { if (!uid) return; try { setDocuments(((await AxiosService.get(ConstantInfo.restApiNomenclatureDocuments(uid))).data || []).map((doc: any) => ({ ...doc, url: ConstantInfo.fileDir + doc.url.replace(/^\//, '') }))); } catch (e) { console.error(e); } };
  const handleDocumentUpload = (documentName: string, file: File) => { setLocalDocuments(prev => [...prev, { localId: generateLocalId(), documentName, file }]); };
  const handleDeleteDocument = (uid: string) => { setLocalDocuments(prev => prev.filter(d => d.localId !== uid)); if (uid && !uid.startsWith('local_')) { AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteDocument(uid)).then(() => fetchDocuments()).catch(e => console.error(e)); } };
  const fetchPrices = async () => { if (!uid) return; try { setPrices((await AxiosService.get(ConstantInfo.restApiNomenclaturePrices(uid))).data || []); } catch (e) { console.error(e); } };
  const handleAddPrice = async () => { if (!uid || !newPrice) return; try { await AxiosService.post(ConstantInfo.restApiNomenclaturePrices(uid), { price: parseFloat(newPrice), priceDate: newPriceDate, supplierUid: newPriceSupplierUid || null }); await fetchPrices(); setShowAddPricePopup(false); setNewPrice(''); setNewPriceSupplierUid(''); } catch (e) { console.error(e); } };
  const handleDeletePrice = async (priceUid: string) => { try { await AxiosService.delete(ConstantInfo.restApiNomenclatureDeletePrice(priceUid)); await fetchPrices(); } catch (e) { console.error(e); } };
  const loadMaterialData = async (muid: string) => { setIsLoading(true); try { const d = (await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(muid))).data; setName(d.name || ''); setArticle(d.article || ''); setDescription(d.description || ''); setUsage(d.usage || false); setWasteMaterial(d.wasteMaterial || false); setRecycleMaterial(d.recycleMaterial || false); if (d.groupUid) { setSelectedCatalogId(d.groupUid); setSelectedCatalog(d.groupName || ''); } if (d.typeMainUid) { setSelectedAccountingGroupId(d.typeMainUid); setSelectedAccountingGroup(d.typeMainName || ''); } if (d.typePurposeUid) { setSelectedNomenclatureGroupId(d.typePurposeUid); setSelectedNomenclatureGroup(d.typePurposeName || ''); } if (d.typeProductUid) { setSelectedNomenclatureTypeId(d.typeProductUid); setSelectedNomenclatureType(d.typeProductName || ''); } if (d.measureUid) { setSelectedUnitId(d.measureUid); setSelectedUnit(d.measureName || ''); } if (d.manufacturerUid) { setSelectedManufacturerId(d.manufacturerUid); setSelectedManufacturer(d.manufacturerName || ''); } if (d.brandUid) { setSelectedBrandId(d.brandUid); setSelectedBrand(d.brandName || ''); } if (d.modelOfBrandUid) { setSelectedModelId(d.modelOfBrandUid); setSelectedModel(d.modelOfBrandName || ''); } if (d.countryUid) { setSelectedCountryId(d.countryUid); setSelectedCountry(d.countryName || ''); } } catch (e) { console.error(e); } finally { setIsLoading(false); } };

  const saveCharacteristics = async () => {
    if (!uid) return;
    let existingChars: any[] = [];
    try { existingChars = (await AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid))).data || []; } catch (e) { console.error(e); }
    for (const char of localCharacteristics) {
      try {
        let existingChar = char.uid ? existingChars.find((c: any) => c.uid === char.uid) : null;
        if (!existingChar && char.attributeName) existingChar = existingChars.find((c: any) => c.attributeName === char.attributeName);
        if (existingChar) {
          await AxiosService.patch(ConstantInfo.restApiNomenclatureUpdateCharacteristic(existingChar.uid), { value: char.value || '', measureUid: char.measureUid || null });
        } else {
          const createData: any = { value: char.value || '', measureUid: char.measureUid || null };
          if (char.isCustom) { createData.attributeTypeUid = null; createData.customName = char.customName || char.attributeName; }
          else if (char.attributeTypeUid) { createData.attributeTypeUid = char.attributeTypeUid; }
          await AxiosService.post(ConstantInfo.restApiNomenclatureAddCharacteristic(uid), createData);
        }
      } catch (e) { console.error(`Ошибка сохранения "${char.attributeName}":`, e); }
    }
  };

  const handleSave = async () => {
    if (!uid || !code) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureDraft, { uid, code: parseInt(code), name, article, description, groupUid: selectedCatalogId || null, typeMainUid: selectedAccountingGroupId || null, typePurposeUid: selectedNomenclatureGroupId || null, typeProductUid: selectedNomenclatureTypeId || null, usage, wasteMaterial, recycleMaterial, measureUid: selectedUnitId || null, manufacturerUid: selectedManufacturerId || null, brandUid: selectedBrandId || null, modelOfBrandUid: selectedModelId || null, countryUid: selectedCountryId || null });
      await saveCharacteristics();
      
      // Отправляем все локальные данные
      for (const img of localImages) { const fd = new FormData(); fd.append('file', img.file); await AxiosService.post(ConstantInfo.restApiNomenclatureImages(uid), fd); }
      for (const bc of localBarcodes) { const fd = new FormData(); fd.append('codeType', bc.codeType); fd.append('codeValue', bc.codeValue); fd.append('codeKind', bc.codeKind); if (bc.file) fd.append('file', bc.file); await AxiosService.post(ConstantInfo.restApiNomenclatureCodes(uid), fd); }
      for (const sku of localSkus) { const fd = new FormData(); fd.append('codeType', sku.codeType); fd.append('codeValue', sku.codeValue); fd.append('codeKind', sku.codeKind); if (sku.file) fd.append('file', sku.file); await AxiosService.post(ConstantInfo.restApiNomenclatureCodes(uid), fd); }
      for (const doc of localDocuments) { const fd = new FormData(); fd.append('file', doc.file); fd.append('documentName', doc.documentName); await AxiosService.post(ConstantInfo.restApiNomenclatureDocuments(uid), fd); }
      for (const supply of localSupplies) { const fd = new FormData(); fd.append('supplierUid', supply.supplierUid); if (supply.supplyDate) fd.append('supplyDate', supply.supplyDate + ':00'); if (supply.documentName.trim()) fd.append('documentName', supply.documentName.trim()); if (supply.file) fd.append('file', supply.file); await AxiosService.post(ConstantInfo.restApiNomenclatureSupply(uid), fd); }
      
      setLocalImages([]); setLocalBarcodes([]); setLocalSkus([]); setLocalDocuments([]); setLocalSupplies([]);
      await fetchImages(); await fetchDocuments(); await fetchCharacteristics();
      return true;
    } catch (e) { console.error(e); return false; } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); };
  const handleSaveAndClose = async () => { if (await handleSave()) handleClose(); };
  const handleCloseWithoutSaving = () => { handleClose(); };
  const handleAccountingGroupSelect = (o: TypeMaterialOption) => { setSelectedAccountingGroup(o.typeName); setSelectedAccountingGroupId(o.uid); setAccountingGroupOpen(false); setSelectedNomenclatureGroup(''); setSelectedNomenclatureGroupId(''); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); };
  const handleTabChange = (index: number) => { setActiveTab(index); if (index === 4 || index === 5) fetchSuppliers(); };
  const handleToggleCollapse = () => { if (!tabsCollapsed) setActiveTab(0); setTabsCollapsed(prev => !prev); };
  const openPopup = (type: PopupType) => { if (type === 'nomenclatureGroup' && !selectedAccountingGroupId) return; if (type === 'nomenclatureType' && !selectedNomenclatureGroupId) return; if (type === 'brand' && !selectedManufacturerId) return; if (type === 'model' && !selectedBrandId) return; setPopupType(type); if (type === 'nomenclatureGroup') setPopupFilterParam(selectedAccountingGroupId); else if (type === 'nomenclatureType') setPopupFilterParam(selectedNomenclatureGroupId); else if (type === 'brand') setPopupFilterParam(selectedManufacturerId); else if (type === 'model') setPopupFilterParam(selectedBrandId); else setPopupFilterParam(undefined); setPopupOpen(true); };
  const handlePopupSelect = (id: string, nm: string) => { switch (popupType) { case 'catalog': setSelectedCatalog(nm); setSelectedCatalogId(id); break; case 'nomenclatureGroup': setSelectedNomenclatureGroup(nm); setSelectedNomenclatureGroupId(id); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); break; case 'nomenclatureType': setSelectedNomenclatureType(nm); setSelectedNomenclatureTypeId(id); break; case 'unit': setSelectedUnit(nm); setSelectedUnitId(id); break; case 'manufacturer': setSelectedManufacturer(nm); setSelectedManufacturerId(id); setSelectedBrand(''); setSelectedBrandId(''); setSelectedModel(''); setSelectedModelId(''); break; case 'brand': setSelectedBrand(nm); setSelectedBrandId(id); setSelectedModel(''); setSelectedModelId(''); break; case 'model': setSelectedModel(nm); setSelectedModelId(id); break; case 'country': setSelectedCountry(nm); setSelectedCountryId(id); break; } };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', overflow: 'hidden' });
  const mainButtonStyle = (isActive: boolean): React.CSSProperties => ({ width: 151, height: 40, borderRadius: 10, backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease', position: 'relative', paddingLeft: 21 });
  const bottomButtonStyle: React.CSSProperties = { height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const rightButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  const areRequiredFilled = () => REQUIRED_ATTRIBUTES.every(name => { const char = localCharacteristics.find(c => c.attributeName === name); return char && char.value && char.value.trim() !== ''; });
  const getTotalImagesCount = (): number => images.length + localImages.length;
  const getTotalDocumentsCount = (): number => documents.length + localDocuments.length;
  const getTotalSuppliesCount = (): number => localSupplies.length;

  const getProgressStep = useCallback((): number => {
    const hasBasic = !!(name && article && selectedCatalogId);
    const hasGroups = !!(selectedAccountingGroupId && selectedNomenclatureGroupId && selectedNomenclatureTypeId);
    if (!hasBasic || !hasGroups || !areRequiredFilled()) return hasBasic ? 1 : 0;
    if (getTotalImagesCount() > 0 && !!(description && description.trim()) && getTotalDocumentsCount() > 0 && getTotalSuppliesCount() > 0) return 3;
    return 2;
  }, [name, article, selectedCatalogId, selectedAccountingGroupId, selectedNomenclatureGroupId, selectedNomenclatureTypeId, localCharacteristics, description, images, localImages, localDocuments, localSupplies, documents]);

  const currentStep = getProgressStep();
  const canSave = currentStep >= 2;

  const commonProps: CommonProps = {
    uid, code, name, article, description, isEdit, isSaving, isUploading, isUploadingBlueprint, images, blueprints, documents, prices, suppliers,
    selectedImageIndex, selectedBlueprintIndex, selectedCatalog, selectedCatalogId, selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen,
    selectedNomenclatureGroup, selectedNomenclatureGroupId, selectedNomenclatureType, selectedNomenclatureTypeId, selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId, selectedBrand, selectedBrandId, selectedModel, selectedModelId, selectedCountry, selectedCountryId,
    usage, wasteMaterial, recycleMaterial, nameFocused, articleFocused, descriptionFocused, showAddPricePopup, newPrice, newPriceDate, newPriceSupplierUid,
    fullscreenImage, fullscreenBlueprint, isLoading, isLoadingPrices: false, typeMaterials,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>, blueprintInputRef: blueprintInputRef as React.RefObject<HTMLInputElement>, documentInputRef: documentInputRef as React.RefObject<HTMLInputElement>,
    localCharacteristics, setLocalCharacteristics, localDocuments, setLocalDocuments, localSupplies, setLocalSupplies,
    localImages, setLocalImages, localBarcodes, setLocalBarcodes, localSkus, setLocalSkus,
    setName, setArticle, setDescription, setNameFocused, setArticleFocused, setDescriptionFocused, toggleUsage, toggleWasteMaterial, toggleRecycleMaterial,
    setSelectedCatalog, setSelectedCatalogId, setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen,
    setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId, setSelectedNomenclatureType, setSelectedNomenclatureTypeId,
    setSelectedUnit, setSelectedUnitId, setSelectedManufacturer, setSelectedManufacturerId, setSelectedBrand, setSelectedBrandId, setSelectedModel, setSelectedModelId, setSelectedCountry, setSelectedCountryId,
    setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage, setBlueprints, setSelectedBlueprintIndex, setIsUploadingBlueprint, setFullscreenBlueprint,
    setDocuments, setPrices, setShowAddPricePopup, setNewPrice, setNewPriceDate, setNewPriceSupplierUid, setSuppliers,
    handleImageUpload, handleDeleteImage, handleBlueprintUpload, handleDeleteBlueprint, handleDocumentUpload, handleDeleteDocument,
    fetchPrices, handleAddPrice, handleDeletePrice, fetchSuppliers, openPopup, handleAccountingGroupSelect,
  };

  const renderContent = () => { switch (activeTab) { case 0: return <MainTab {...commonProps} />; case 1: return <CharacteristicsTab {...commonProps} />; case 2: return <DocumentsTab {...commonProps} />; case 3: return <div style={{ position: 'absolute', top: 164, left: 30, right: 30, bottom: 111, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Остатки</span></div>; case 4: return <SuppliersTab {...commonProps} />; case 5: return <PriceHistoryTab {...commonProps} />; case 6: return <AnalogsTab {...commonProps} />; case 7: return <RatingTab {...commonProps} />; case 8: return <IntegrationTab {...commonProps} />; default: return null; } };
  if (isLoading) return (<div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>{isEdit ? name || 'Номенклатура' : 'Справочник: Номенклатура (Создание)'}</h1>
      <button onClick={() => setShowClosePopup(true)} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} /></button>
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center' }}>
          <button onClick={() => handleTabChange(0)} style={mainButtonStyle(activeTab === 0)}><span>Основное</span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleCollapse(); }} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', width: 6, height: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img src={activeTab === 0 ? IconArrow : IconArrow2} alt="" style={{ width: 6, height: 10 }} animate={{ rotate: tabsCollapsed ? 0 : 180 }} transition={{ duration: 0.3, ease: 'easeInOut' }} />
            </button>
          </button>
          <AnimatePresence>{!tabsCollapsed && tabs_list.slice(1).map((tab, i) => (<motion.button key={i + 1} onClick={() => handleTabChange(i + 1)} style={buttonStyle(activeTab === i + 1)} initial={{ width: 0, opacity: 0, marginRight: -25 }} animate={{ width: 151, opacity: 1, marginRight: 0 }} exit={{ width: 0, opacity: 0, marginRight: -25 }} transition={{ duration: 0.3, ease: 'easeInOut' }}><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab}</motion.span></motion.button>))}</AnimatePresence>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}><button style={rightButtonStyle} /><button style={rightButtonStyle} /></div>
      </div>
      {renderContent()}
      <div style={{ position: 'absolute', bottom: 25, left: 45, display: 'flex', alignItems: 'flex-end' }}><ProgressBar currentStep={currentStep} /></div>
      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        <button style={{ ...bottomButtonStyle, width: 234, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#2D4059' }}>Синхронизировать</button>
        <button style={{ ...bottomButtonStyle, width: 121, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#FFFFFF', backgroundColor: canSave ? '#666EFE' : '#BCC8FF', border: 'none', opacity: isSaving ? 0.6 : 1, cursor: canSave && !isSaving ? 'pointer' : 'not-allowed' }} onClick={canSave ? handleSave : undefined} disabled={!canSave || isSaving}>{isSaving ? 'Сохранение...' : 'Записать'}</button>
        <button style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }} onClick={() => setShowClosePopup(true)}>Закрыть</button>
      </div>
      <CatalogSelectPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} onSelect={handlePopupSelect} popupType={popupType} filterParam={popupFilterParam} />
      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>{canSave ? 'Сохранить изменения перед закрытием?' : 'Не все обязательные поля заполнены. Сохранение недоступно.'}</p>
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

export default NomenclatureCreatePage;