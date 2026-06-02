// NomenclatureCreatePage.tsx — исправленный (убраны fetchSuppliers, supplierUid)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
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

export interface Folder {
  id: number;
  name: string;
  isOpen: boolean;
  items: FolderItem[];
}

export interface FolderItem {
  id: number;
  characteristic?: string;
  designation?: string;
  unit?: string;
  value?: string;
  name?: string;
  status?: string;
  date?: string;
}

export interface TypeMaterialOption {
  uid: string;
  typeName: string;
}

export interface ImageItem {
  uid: string;
  url: string;
  originalName: string;
}

export interface PriceItem {
  uid: string;
  price: number;
  priceDate: string;
  supplierName: string;
  previousPrice: number | null;
  priceChange: number | null;
}

export interface SupplierOption {
  uid: string;
  name: string;
}

export interface CommonProps {
  uid?: string;
  code?: string;
  name: string;
  article: string;
  description: string;
  isEdit: boolean;
  isSaving: boolean;
  isUploading: boolean;
  isUploadingBlueprint: boolean;
  isUploadingBarcode: boolean;
  barcode: string;
  barcodeCode: string;
  barcodeImage: ImageItem | null;
  images: ImageItem[];
  blueprints: ImageItem[];
  prices: PriceItem[];
  suppliers: SupplierOption[];
  selectedImageIndex: number;
  selectedBlueprintIndex: number;
  selectedCatalog: string;
  selectedCatalogId: string;
  selectedAccountingGroup: string;
  selectedAccountingGroupId: string;
  accountingGroupOpen: boolean;
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
  nameFocused: boolean;
  articleFocused: boolean;
  descriptionFocused: boolean;
  showBarcodePopup: boolean;
  showAddPricePopup: boolean;
  newPrice: string;
  newPriceDate: string;
  newPriceSupplierUid: string;
  fullscreenImage: boolean;
  fullscreenBlueprint: boolean;
  isLoading: boolean;
  isLoadingPrices: boolean;
  typeMaterials: TypeMaterialOption[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  blueprintInputRef: React.RefObject<HTMLInputElement>;
  barcodeImageInputRef: React.RefObject<HTMLInputElement>;
  setName: (v: string) => void;
  setArticle: (v: string) => void;
  setDescription: (v: string) => void;
  setNameFocused: (v: boolean) => void;
  setArticleFocused: (v: boolean) => void;
  setDescriptionFocused: (v: boolean) => void;
  toggleUsage: () => void;
  toggleWasteMaterial: () => void;
  toggleRecycleMaterial: () => void;
  setSelectedCatalog: (v: string) => void;
  setSelectedCatalogId: (v: string) => void;
  setSelectedAccountingGroup: (v: string) => void;
  setSelectedAccountingGroupId: (v: string) => void;
  setAccountingGroupOpen: (v: boolean) => void;
  setSelectedNomenclatureGroup: (v: string) => void;
  setSelectedNomenclatureGroupId: (v: string) => void;
  setSelectedNomenclatureType: (v: string) => void;
  setSelectedNomenclatureTypeId: (v: string) => void;
  setSelectedUnit: (v: string) => void;
  setSelectedUnitId: (v: string) => void;
  setSelectedManufacturer: (v: string) => void;
  setSelectedManufacturerId: (v: string) => void;
  setSelectedBrand: (v: string) => void;
  setSelectedBrandId: (v: string) => void;
  setSelectedModel: (v: string) => void;
  setSelectedModelId: (v: string) => void;
  setSelectedCountry: (v: string) => void;
  setSelectedCountryId: (v: string) => void;
  setImages: (v: ImageItem[]) => void;
  setSelectedImageIndex: (v: number | ((p: number) => number)) => void;
  setIsUploading: (v: boolean) => void;
  setFullscreenImage: (v: boolean) => void;
  setBlueprints: (v: ImageItem[]) => void;
  setSelectedBlueprintIndex: (v: number | ((p: number) => number)) => void;
  setIsUploadingBlueprint: (v: boolean) => void;
  setFullscreenBlueprint: (v: boolean) => void;
  setBarcode: (v: string) => void;
  setShowBarcodePopup: (v: boolean) => void;
  setBarcodeImage: (v: ImageItem | null) => void;
  setBarcodeCode: (v: string) => void;
  setIsUploadingBarcode: (v: boolean) => void;
  setPrices: (v: PriceItem[]) => void;
  setShowAddPricePopup: (v: boolean) => void;
  setNewPrice: (v: string) => void;
  setNewPriceDate: (v: string) => void;
  setNewPriceSupplierUid: (v: string) => void;
  setSuppliers: (v: SupplierOption[]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteImage: (uid: string) => void;
  handleBlueprintUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteBlueprint: (uid: string) => void;
  fetchBarcodeData: () => void;
  handleBarcodeSave: () => void;
  handleBarcodeImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteBarcodeImage: () => void;
  fetchPrices: () => void;
  handleAddPrice: () => void;
  handleDeletePrice: (uid: string) => void;
  openPopup: (type: PopupType) => void;
  handleAccountingGroupSelect: (o: TypeMaterialOption) => void;
}

const NomenclatureCreatePage = () => {
  const { uid, code } = useParams<{ uid: string; code: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();

  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blueprintInputRef = useRef<HTMLInputElement>(null);
  const barcodeImageInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [article, setArticle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [articleFocused, setArticleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const [usage, setUsage] = useState(false);
  const [wasteMaterial, setWasteMaterial] = useState(false);
  const [recycleMaterial, setRecycleMaterial] = useState(false);

  const toggleUsage = useCallback(() => setUsage(prev => !prev), []);
  const toggleWasteMaterial = useCallback(() => setWasteMaterial(prev => !prev), []);
  const toggleRecycleMaterial = useCallback(() => setRecycleMaterial(prev => !prev), []);

  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const [typeMaterials, setTypeMaterials] = useState<TypeMaterialOption[]>([]);
  const [selectedAccountingGroup, setSelectedAccountingGroup] = useState('');
  const [selectedAccountingGroupId, setSelectedAccountingGroupId] = useState('');
  const [accountingGroupOpen, setAccountingGroupOpen] = useState(false);

  const [selectedNomenclatureGroup, setSelectedNomenclatureGroup] = useState('');
  const [selectedNomenclatureGroupId, setSelectedNomenclatureGroupId] = useState('');

  const [selectedNomenclatureType, setSelectedNomenclatureType] = useState('');
  const [selectedNomenclatureTypeId, setSelectedNomenclatureTypeId] = useState('');

  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState('');

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<PopupType>('catalog');
  const [popupFilterParam, setPopupFilterParam] = useState<string | undefined>(undefined);
  const [showClosePopup, setShowClosePopup] = useState(false);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  const [blueprints, setBlueprints] = useState<ImageItem[]>([]);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] = useState(0);
  const [isUploadingBlueprint, setIsUploadingBlueprint] = useState(false);
  const [fullscreenBlueprint, setFullscreenBlueprint] = useState(false);

  const [barcode, setBarcode] = useState('');
  const [showBarcodePopup, setShowBarcodePopup] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<ImageItem | null>(null);
  const [barcodeCode, setBarcodeCode] = useState('');
  const [isUploadingBarcode, setIsUploadingBarcode] = useState(false);

  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [showAddPricePopup, setShowAddPricePopup] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().slice(0, 16));
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const tabs_list = ['Основное', 'Характеристики', 'Документы', 'Поставщики', 'История цен', 'Аналоги', 'Рейтинг', 'Интеграция'];

  useEffect(() => {
    (async () => {
      try {
        const r = await AxiosService.get(ConstantInfo.restApiNomenclatureTypeMaterials);
        setTypeMaterials(r.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    const cp = window.location.pathname;
    setIsEdit(cp.includes('/edit/'));
    if (uid && cp.includes('/edit/')) loadMaterialData(uid);
    if (uid && cp.includes('/create/')) {
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
  }, [uid]);

  useEffect(() => {
    if (uid && isEdit) {
      fetchImages();
      fetchBlueprints();
      fetchBarcodeData();
      fetchPrices();
    }
  }, [uid, isEdit]);

  const fetchImages = async () => {
    if (!uid) return;
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid));
      setImages((r.data || []).map((img: any) => ({
        ...img,
        url: ConstantInfo.fileDir + img.url.replace(/^\//, ''),
      })));
    } catch (e) { console.error(e); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      await AxiosService.post(ConstantInfo.restApiNomenclatureImages(uid), fd);
      await fetchImages();
    } catch (er) { console.error(er); } finally { setIsUploading(false); }
  };

  const handleDeleteImage = async (imageUid: string) => {
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteImage(imageUid));
      await fetchImages();
    } catch (er) { console.error(er); }
  };

  const fetchBlueprints = async () => {
    if (!uid) return;
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureBlueprints(uid));
      setBlueprints((r.data || []).map((bp: any) => ({
        ...bp,
        url: ConstantInfo.fileDir + bp.url.replace(/^\//, ''),
      })));
    } catch (e) { console.error(e); }
  };

  const handleBlueprintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setIsUploadingBlueprint(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      await AxiosService.post(ConstantInfo.restApiNomenclatureBlueprints(uid), fd);
      await fetchBlueprints();
    } catch (er) { console.error(er); } finally { setIsUploadingBlueprint(false); }
  };

  const handleDeleteBlueprint = async (bpUid: string) => {
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteBlueprint(bpUid));
      await fetchBlueprints();
    } catch (er) { console.error(er); }
  };

  const fetchBarcodeData = async () => {
    if (!uid) return;
    try {
      const [qrRes, matRes] = await Promise.all([
        AxiosService.get(ConstantInfo.restApiNomenclatureQrcodes(uid)),
        AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid)),
      ]);
      const qrs = (qrRes.data || []).map((qr: any) => ({
        ...qr,
        url: ConstantInfo.fileDir + qr.url.replace(/^\//, ''),
      }));
      if (qrs.length > 0) setBarcodeImage(qrs[0]);
      if (matRes.data.barcode) {
        setBarcodeCode(matRes.data.barcode);
        setBarcode(matRes.data.barcode);
      }
    } catch (e) { console.error(e); }
  };

  const handleBarcodeSave = async () => {
    if (!uid) return;
    setIsUploadingBarcode(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureDraft, {
        uid, code: parseInt(code || '0'), name, article, description,
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
        barcode: barcodeCode,
      });
      setBarcode(barcodeCode);
      setShowBarcodePopup(false);
    } catch (e) { console.error(e); } finally { setIsUploadingBarcode(false); }
  };

  const handleBarcodeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    try {
      const fd = new FormData();
      fd.append('file', f);
      await AxiosService.post(ConstantInfo.restApiNomenclatureQrcodes(uid), fd);
      await fetchBarcodeData();
    } catch (er) { console.error(er); }
  };

  const handleDeleteBarcodeImage = async () => {
    if (!barcodeImage) return;
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteQrcode(barcodeImage.uid));
      setBarcodeImage(null);
    } catch (e) { console.error(e); }
  };

  const fetchPrices = async () => {
    if (!uid) return;
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclaturePrices(uid));
      setPrices(r.data || []);
    } catch (e) { console.error(e); }
  };

  const handleAddPrice = async () => {
    if (!uid || !newPrice) return;
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclaturePrices(uid), {
        price: parseFloat(newPrice),
        priceDate: newPriceDate,
      });
      await fetchPrices();
      setShowAddPricePopup(false);
      setNewPrice('');
    } catch (e) { console.error(e); }
  };

  const handleDeletePrice = async (priceUid: string) => {
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeletePrice(priceUid));
      await fetchPrices();
    } catch (e) { console.error(e); }
  };

  const loadMaterialData = async (muid: string) => {
    setIsLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(muid));
      const d = r.data;
      setName(d.name || ''); setArticle(d.article || ''); setDescription(d.description || '');
      setUsage(d.usage || false); setWasteMaterial(d.wasteMaterial || false); setRecycleMaterial(d.recycleMaterial || false);
      if (d.groupUid) { setSelectedCatalogId(d.groupUid); setSelectedCatalog(d.groupName || ''); }
      if (d.typeMainUid) { setSelectedAccountingGroupId(d.typeMainUid); setSelectedAccountingGroup(d.typeMainName || ''); }
      if (d.typePurposeUid) { setSelectedNomenclatureGroupId(d.typePurposeUid); setSelectedNomenclatureGroup(d.typePurposeName || ''); }
      if (d.typeProductUid) { setSelectedNomenclatureTypeId(d.typeProductUid); setSelectedNomenclatureType(d.typeProductName || ''); }
      if (d.measureUid) { setSelectedUnitId(d.measureUid); setSelectedUnit(d.measureName || ''); }
      if (d.manufacturerUid) { setSelectedManufacturerId(d.manufacturerUid); setSelectedManufacturer(d.manufacturerName || ''); }
      if (d.brandUid) { setSelectedBrandId(d.brandUid); setSelectedBrand(d.brandName || ''); }
      if (d.modelOfBrandUid) { setSelectedModelId(d.modelOfBrandUid); setSelectedModel(d.modelOfBrandName || ''); }
      if (d.countryUid) { setSelectedCountryId(d.countryUid); setSelectedCountry(d.countryName || ''); }
      if (d.barcode) { setBarcode(d.barcode); setBarcodeCode(d.barcode); }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
        barcode: barcodeCode,
      });
      return true;
    } catch (e) { console.error(e); return false; } finally { setIsSaving(false); }
  };

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); };
  const handleSaveAndClose = async () => { await handleSave(); handleClose(); };
  const handleCloseWithoutSaving = () => { handleClose(); };

  const handleAccountingGroupSelect = (o: TypeMaterialOption) => {
    setSelectedAccountingGroup(o.typeName);
    setSelectedAccountingGroupId(o.uid);
    setAccountingGroupOpen(false);
    setSelectedNomenclatureGroup('');
    setSelectedNomenclatureGroupId('');
    setSelectedNomenclatureType('');
    setSelectedNomenclatureTypeId('');
  };

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
  };

  const handlePopupSelect = (id: string, nm: string) => {
    switch (popupType) {
      case 'catalog': setSelectedCatalog(nm); setSelectedCatalogId(id); break;
      case 'nomenclatureGroup': setSelectedNomenclatureGroup(nm); setSelectedNomenclatureGroupId(id); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); break;
      case 'nomenclatureType': setSelectedNomenclatureType(nm); setSelectedNomenclatureTypeId(id); break;
      case 'unit': setSelectedUnit(nm); setSelectedUnitId(id); break;
      case 'manufacturer': setSelectedManufacturer(nm); setSelectedManufacturerId(id); setSelectedBrand(''); setSelectedBrandId(''); setSelectedModel(''); setSelectedModelId(''); break;
      case 'brand': setSelectedBrand(nm); setSelectedBrandId(id); setSelectedModel(''); setSelectedModelId(''); break;
      case 'model': setSelectedModel(nm); setSelectedModelId(id); break;
      case 'country': setSelectedCountry(nm); setSelectedCountryId(id); break;
    }
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 151, height: 40, borderRadius: 10,
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
    color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease',
  });

  const blockStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
  };

  const bottomButtonStyle: React.CSSProperties = {
    height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
  };

  const getProgressStep = useCallback((): number => {
    const hbf = !!(name && selectedCatalogId);
    const hag = !!selectedAccountingGroupId;
    const hng = !!selectedNomenclatureGroupId;
    const hnt = !!selectedNomenclatureTypeId;
    if (hbf && hag && hng && hnt) return 4;
    if (hbf && hag && hng) return 3;
    if (hbf && hag) return 2;
    if (hbf) return 1;
    return 0;
  }, [name, selectedCatalogId, selectedAccountingGroupId, selectedNomenclatureGroupId, selectedNomenclatureTypeId]);

  const currentStep = getProgressStep();

  const commonProps: CommonProps = {
    uid, code, name, article, description, isEdit, isSaving, isUploading, isUploadingBlueprint,
    isUploadingBarcode, barcode, barcodeCode, barcodeImage,
    images, blueprints, prices, suppliers,
    selectedImageIndex, selectedBlueprintIndex,
    selectedCatalog, selectedCatalogId,
    selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen,
    selectedNomenclatureGroup, selectedNomenclatureGroupId,
    selectedNomenclatureType, selectedNomenclatureTypeId,
    selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId,
    selectedBrand, selectedBrandId,
    selectedModel, selectedModelId,
    selectedCountry, selectedCountryId,
    usage, wasteMaterial, recycleMaterial,
    nameFocused, articleFocused, descriptionFocused,
    showBarcodePopup, showAddPricePopup,
    newPrice, newPriceDate, newPriceSupplierUid: '',
    fullscreenImage, fullscreenBlueprint,
    isLoading, isLoadingPrices: false,
    typeMaterials,
    fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
    blueprintInputRef: blueprintInputRef as React.RefObject<HTMLInputElement>,
    barcodeImageInputRef: barcodeImageInputRef as React.RefObject<HTMLInputElement>,
    setName, setArticle, setDescription,
    setNameFocused, setArticleFocused, setDescriptionFocused,
    toggleUsage, toggleWasteMaterial, toggleRecycleMaterial,
    setSelectedCatalog, setSelectedCatalogId,
    setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen,
    setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId,
    setSelectedNomenclatureType, setSelectedNomenclatureTypeId,
    setSelectedUnit, setSelectedUnitId,
    setSelectedManufacturer, setSelectedManufacturerId,
    setSelectedBrand, setSelectedBrandId,
    setSelectedModel, setSelectedModelId,
    setSelectedCountry, setSelectedCountryId,
    setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage,
    setBlueprints, setSelectedBlueprintIndex, setIsUploadingBlueprint, setFullscreenBlueprint,
    setBarcode, setShowBarcodePopup, setBarcodeImage, setBarcodeCode, setIsUploadingBarcode,
    setPrices, setShowAddPricePopup, setNewPrice, setNewPriceDate, setNewPriceSupplierUid: () => {}, setSuppliers,
    handleImageUpload, handleDeleteImage,
    handleBlueprintUpload, handleDeleteBlueprint,
    fetchBarcodeData, handleBarcodeSave, handleBarcodeImageUpload, handleDeleteBarcodeImage,
    fetchPrices, handleAddPrice, handleDeletePrice,
    openPopup, handleAccountingGroupSelect,
  };

  const renderContent = () => {
    const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

    switch (activeTab) {
      case 0: return <MainTab {...commonProps} />;
      case 1: return <CharacteristicsTab {...commonProps} />;
      case 2: return <DocumentsTab {...commonProps} />;
      case 3: return <SuppliersTab {...commonProps} />;
      case 4: return <PriceHistoryTab {...commonProps} />;
      case 5: return <AnalogsTab {...commonProps} />;
      case 6: return <RatingTab {...commonProps} />;
      case 7: return <IntegrationTab {...commonProps} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, right: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 30, fontWeight: 'bold', color: '#2D4059', margin: 0 }}>
          {isEdit ? name || 'Номенклатура' : 'Справочник: Номенклатура (Создание)'}
        </h1>
        <button onClick={() => setShowClosePopup(true)} style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <img src={Icon7} alt="Закрыть" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25 }}>
          {tabs_list.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={buttonStyle(activeTab === i)}>{tab}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }} />
        </div>
      </div>
      {renderContent()}
      <div style={{ position: 'absolute', bottom: 25, left: 45, display: 'flex', alignItems: 'flex-end' }}>
        <ProgressBar/>
      </div>
      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        <button style={{ ...bottomButtonStyle, width: 234 }}>Синхронизировать</button>
        <button style={{ ...bottomButtonStyle, width: 121, opacity: isSaving ? 0.6 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Сохранение...' : 'Записать'}
        </button>
        <button style={{ ...bottomButtonStyle, width: 116 }} onClick={() => setShowClosePopup(true)}>Закрыть</button>
      </div>

      <CatalogSelectPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSelect={handlePopupSelect}
        popupType={popupType}
        filterParam={popupFilterParam}
      />

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Сохранить изменения перед закрытием?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>
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