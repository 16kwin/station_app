// MainTab.tsx — ПОЛНЫЙ ФАЙЛ (с textsize: 8 для штрихкода)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import FormField from '../../elements/FormField';
import Icon8 from '../../../assets/References/NomenclatureCreatePage/Icon8.svg';
import Icon9 from '../../../assets/References/NomenclatureCreatePage/Icon9.svg';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import Icon11 from '../../../assets/References/NomenclatureCreatePage/Icon11.svg';
import Icon12 from '../../../assets/References/NomenclatureCreatePage/Icon12.svg';
import Icon21 from '../../../assets/References/NomenclatureCreatePage/Icon21.svg';
import Icon22 from '../../../assets/References/NomenclatureCreatePage/Icon22.svg';
import Icon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';
import Icon51 from '../../../assets/References/NomenclatureCreatePage/Icon51.svg';
import Icon52 from '../../../assets/References/NomenclatureCreatePage/Icon52.svg';
import Icon61 from '../../../assets/References/NomenclatureCreatePage/Icon61.svg';
import Icon62 from '../../../assets/References/NomenclatureCreatePage/Icon62.svg';
import Icon71 from '../../../assets/References/NomenclatureCreatePage/Icon71.svg';
import Icon72 from '../../../assets/References/NomenclatureCreatePage/Icon72.svg';
import IconArt1 from '../../../assets/References/NomenclatureCreatePage/IconArt1.svg';
import IconArt2 from '../../../assets/References/NomenclatureCreatePage/IconArt2.svg';
import IconRating from '../../../assets/References/NomenclatureCreatePage/IconRating.svg';
import IconCODE from '../../../assets/References/NomenclatureCreatePage/CODE.svg';
import IconCODE1 from '../../../assets/References/NomenclatureCreatePage/CODE2.svg';
import IconCODE2 from '../../../assets/References/NomenclatureCreatePage/CODE3.svg';
import IconInfo from '../../../assets/References/NomenclatureCreatePage/Info.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps, LocalImageItem, LocalCode, ServerCode } from './NomenclatureCreatePage';

const ToggleSwitch = React.memo(({ value, onChange }: { value: boolean; onChange: () => void }) => {
  const trackWidth = 26; const trackHeight = 13; const knobSize = 11; const padding = (trackHeight - knobSize) / 2;
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} style={{ width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: value ? '#666EFE' : 'rgba(45, 64, 89, 0.44)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background-color 0.3s ease' }}>
      <motion.div initial={false} animate={{ x: value ? trackWidth - knobSize - padding * 2 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }} style={{ width: knobSize, height: knobSize, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: padding, left: padding }} />
    </div>
  );
});

const StarRatingSmall = ({ value, size = 18 }: { value: number; size?: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fillPercent = Math.min(100, Math.max(0, (value - i + 1) * 100));
    stars.push(
      <div key={i} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#DBDBDB" stroke="#DBDBDB" strokeWidth="1"/></svg>
        {fillPercent > 0 && (<svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}><path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/></svg>)}
      </div>
    );
  }
  return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
};

const BARCODE_TYPES = [
  { value: 'code128', label: 'CODE_128' },
  { value: 'ean13', label: 'EAN_13' },
  { value: 'upca', label: 'UPC_A' },
];
const getBarcodeHint = (type: string): string => { switch (type) { case 'code128': return 'Пример: ABC123456'; case 'ean13': return 'Пример: 5901234123457'; case 'upca': return 'Пример: 042100005264'; default: return 'Введите код'; } };
const getSkuHint = (): string => 'Пример: SKU-001-A';

const getCodeFlagsKey = (materialUid: string) => `nomenclature_code_flags_${materialUid}`;

interface CodeFlags {
  [codeValue: string]: { isGenerated: boolean; codeKind: string };
}

const loadCodeFlags = (materialUid: string): CodeFlags => {
  try {
    const raw = localStorage.getItem(getCodeFlagsKey(materialUid));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveCodeFlags = (materialUid: string, flags: CodeFlags) => {
  try {
    localStorage.setItem(getCodeFlagsKey(materialUid), JSON.stringify(flags));
  } catch {}
};

const MainTab: React.FC<CommonProps> = (props) => {
  const { uid, code, name, article, description, isEdit, isUploading, images, selectedImageIndex, selectedCatalog, selectedCatalogId, selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen, selectedNomenclatureGroup, selectedNomenclatureGroupId, selectedNomenclatureType, selectedNomenclatureTypeId, usage, wasteMaterial, recycleMaterial, nameFocused, articleFocused, descriptionFocused, fullscreenImage, typeMaterials, setName, setArticle, setDescription, setNameFocused, setArticleFocused, setDescriptionFocused, toggleUsage, toggleWasteMaterial, toggleRecycleMaterial, setSelectedCatalog, setSelectedCatalogId, setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen, setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId, setSelectedNomenclatureType, setSelectedNomenclatureTypeId, setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage, handleImageUpload, handleDeleteImage, openPopup, handleAccountingGroupSelect, localImages, setLocalImages, localBarcodes, setLocalBarcodes, localSkus, setLocalSkus, serverBarcodes, serverSkus, validationErrors, setValidationErrors, isFinishedProduct } = props;

  const [averageRating, setAverageRating] = useState(0);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [fullscreenCode, setFullscreenCode] = useState<string | null>(null);
  const [fullscreenCodeContextMenu, setFullscreenCodeContextMenu] = useState<{ x: number; y: number } | null>(null);

  const [catalogOptions, setCatalogOptions] = useState<{ uid: string; name: string }[]>([]);
  const [nomenclatureGroupOptions, setNomenclatureGroupOptions] = useState<{ uid: string; name: string }[]>([]);
  const [nomenclatureTypeOptions, setNomenclatureTypeOptions] = useState<{ uid: string; name: string }[]>([]);

  const fetchCatalogOptions = async () => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      const allGroups: { uid: string; name: string }[] = [];
      const flatten = (nodes: any[]) => {
        nodes.forEach((node: any) => {
          allGroups.push({ uid: node.uid, name: node.name });
          if (node.children) flatten(node.children);
        });
      };
      flatten(res.data || []);
      setCatalogOptions(allGroups);
    } catch (e) { console.error(e); }
  };

  const fetchNomenclatureGroupOptions = async () => {
    if (!selectedAccountingGroupId) { setNomenclatureGroupOptions([]); return; }
    try {
      const res = await AxiosService.get(`${ConstantInfo.restApiNomenclatureTypePurposes}?typeMaterialUid=${selectedAccountingGroupId}`);
      setNomenclatureGroupOptions((res.data || []).map((p: any) => ({ uid: p.uid, name: p.typeName })));
    } catch (e) { console.error(e); }
  };

  const fetchNomenclatureTypeOptions = async () => {
    if (!selectedNomenclatureGroupId) { setNomenclatureTypeOptions([]); return; }
    try {
      const res = await AxiosService.get(`${ConstantInfo.restApiNomenclatureTypeProducts}?typePurposeUid=${selectedNomenclatureGroupId}`);
      setNomenclatureTypeOptions((res.data || []).map((p: any) => ({ uid: p.uid, name: p.typeName })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchCatalogOptions(); }, []);
  useEffect(() => { fetchNomenclatureGroupOptions(); }, [selectedAccountingGroupId]);
  useEffect(() => { fetchNomenclatureTypeOptions(); }, [selectedNomenclatureGroupId]);

  const enrichedServerBarcodes: any[] = useMemo(() => {
    if (!uid) return serverBarcodes;
    const flags = loadCodeFlags(uid);
    return serverBarcodes.map((bc: any) => ({
      ...bc,
      isGenerated: flags[bc.codeValue]?.isGenerated,
    }));
  }, [serverBarcodes, uid, localBarcodes]);

  const enrichedServerSkus: any[] = useMemo(() => {
    if (!uid) return serverSkus;
    const flags = loadCodeFlags(uid);
    return serverSkus.map((sku: any) => ({
      ...sku,
      isGenerated: flags[sku.codeValue]?.isGenerated,
    }));
  }, [serverSkus, uid, localSkus]);

  const currentBarcode = (localBarcodes && localBarcodes[0]) || enrichedServerBarcodes[0] || null;
  const currentSku = (localSkus && localSkus[0]) || enrichedServerSkus[0] || null;

  const [showBarcodePopup, setShowBarcodePopup] = useState(false);
  const [barcodeGenerationMode, setBarcodeGenerationMode] = useState(true);
  const [barcodeValue, setBarcodeValue] = useState(''); 
  const [barcodeType, setBarcodeType] = useState('code128');
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [barcodeUploadedFile, setBarcodeUploadedFile] = useState<File | null>(null);
  const [barcodeUploadedPreview, setBarcodeUploadedPreview] = useState<string | null>(null);
  const [barcodeTypeOpen, setBarcodeTypeOpen] = useState(false);
  const [barcodeUploadContextMenu, setBarcodeUploadContextMenu] = useState<{ x: number; y: number } | null>(null);
  const barcodeFileInputRef = useRef<HTMLInputElement>(null);

  const [showSkuPopup, setShowSkuPopup] = useState(false);
  const [skuGenerationMode, setSkuGenerationMode] = useState(true);
  const [skuValue, setSkuValue] = useState(''); 
  const [skuPreview, setSkuPreview] = useState<string | null>(null);
  const [skuUploadedFile, setSkuUploadedFile] = useState<File | null>(null);
  const [skuUploadedPreview, setSkuUploadedPreview] = useState<string | null>(null);
  const [skuUploadContextMenu, setSkuUploadContextMenu] = useState<{ x: number; y: number } | null>(null);
  const skuFileInputRef = useRef<HTMLInputElement>(null);

  const fetchAverageRating = async () => { if (!uid || isFinishedProduct) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)); setAverageRating(Math.round((res.data || 0) * 10) / 10); } catch (e) { console.error(e); } };

  useEffect(() => { if (uid && isEdit) { fetchAverageRating(); } }, [uid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);
  useEffect(() => { if (!fullscreenCodeContextMenu) return; const h = () => setFullscreenCodeContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [fullscreenCodeContextMenu]);
  useEffect(() => { if (!barcodeUploadContextMenu) return; const h = () => setBarcodeUploadContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [barcodeUploadContextMenu]);
  useEffect(() => { if (!skuUploadContextMenu) return; const h = () => setSkuUploadContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [skuUploadContextMenu]);
  useEffect(() => { if (fullscreenCode) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; } return () => { document.body.style.overflow = ''; }; }, [fullscreenCode]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const imgs: LocalImageItem[] = []; for (let i = 0; i < files.length; i++) { const f = files[i]; imgs.push({ file: f, url: URL.createObjectURL(f) }); } setLocalImages((p: LocalImageItem[]) => [...p, ...imgs]); if (localFileInputRef.current) localFileInputRef.current.value = ''; };
  const handleLocalDeleteImage = (index: number) => { setLocalImages((p: LocalImageItem[]) => { const n = [...p]; URL.revokeObjectURL(n[index].url); n.splice(index, 1); return n; }); if (localSelectedIndex >= (localImages || []).length - 1) setLocalSelectedIndex(Math.max(0, (localImages || []).length - 2)); };
  const handleImageContextMenu = (e: React.MouseEvent, index: number) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, index }); };

  useEffect(() => { 
    if (!barcodeValue.trim() || !barcodeGenerationMode || !showBarcodePopup) { setBarcodePreview(null); return; } 
    const t = setTimeout(() => { 
      try { 
        const canvas = document.createElement('canvas'); 
        /* @ts-ignore */ 
        bwipjs.toCanvas(canvas, { 
          bcid: barcodeType, 
          text: barcodeValue, 
          scale: 3, 
          height: 10, 
          includetext: true, 
          textxalign: 'center',
          textsize: 8  // ← ИСПРАВЛЕНИЕ: уменьшенный шрифт цифр на штрихкоде
        }); 
        setBarcodePreview(canvas.toDataURL('image/png')); 
      } catch { setBarcodePreview(null); } 
    }, 150); 
    return () => clearTimeout(t); 
  }, [barcodeValue, barcodeType, barcodeGenerationMode, showBarcodePopup]);
  
  useEffect(() => { 
    if (!skuValue.trim() || !skuGenerationMode || !showSkuPopup) { setSkuPreview(null); return; } 
    const t = setTimeout(async () => { 
      try { 
        const canvas = document.createElement('canvas'); 
        await QRCode.toCanvas(canvas, skuValue, { width: 200, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }); 
        setSkuPreview(canvas.toDataURL('image/png')); 
      } catch { setSkuPreview(null); } 
    }, 150); 
    return () => clearTimeout(t); 
  }, [skuValue, skuGenerationMode, showSkuPopup]);

  const handleBarcodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const f = e.target.files?.[0]; 
    if (!f) return; 
    if (barcodeUploadedPreview) URL.revokeObjectURL(barcodeUploadedPreview); 
    setBarcodeUploadedFile(f); 
    setBarcodeUploadedPreview(URL.createObjectURL(f)); 
    setBarcodePreview(null); 
  };
  
  const handleSkuFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const f = e.target.files?.[0]; 
    if (!f) return; 
    if (skuUploadedPreview) URL.revokeObjectURL(skuUploadedPreview); 
    setSkuUploadedFile(f); 
    setSkuUploadedPreview(URL.createObjectURL(f)); 
    setSkuPreview(null); 
  };
  
  const clearBarcodeUpload = () => { 
    if (barcodeUploadedPreview) URL.revokeObjectURL(barcodeUploadedPreview); 
    setBarcodeUploadedFile(null); 
    setBarcodeUploadedPreview(null); 
  };
  
  const clearSkuUpload = () => { 
    if (skuUploadedPreview) URL.revokeObjectURL(skuUploadedPreview); 
    setSkuUploadedFile(null); 
    setSkuUploadedPreview(null); 
  };
  
  const dataUrlToFile = (dataUrl: string, filename: string): File => { 
    if (!dataUrl) return new File([], filename); 
    const arr = dataUrl.split(','); 
    const mime = arr[0].match(/:(.*?);/)![1]; 
    const bstr = atob(arr[1]); 
    let n = bstr.length; 
    const u8arr = new Uint8Array(n); 
    while (n--) u8arr[n] = bstr.charCodeAt(n); 
    return new File([u8arr], filename, { type: mime }); 
  };

  const handleDeleteBarcode = () => {
    setLocalBarcodes([]);
    clearBarcodeUpload();
    setBarcodeUploadContextMenu(null);
  };

  const handleDeleteSku = () => {
    setLocalSkus([]);
    clearSkuUpload();
    setSkuUploadContextMenu(null);
  };

  const handleBarcodeSave = () => {
    if (!barcodeValue.trim()) return;
    let file: File | null = null;
    let preview: string | null = null;
    if (barcodeGenerationMode) {
      if (barcodePreview) {
        file = dataUrlToFile(barcodePreview, `barcode_${Date.now()}.png`);
        preview = barcodePreview;
      }
    } else {
      if (barcodeUploadedFile) {
        file = barcodeUploadedFile;
        preview = barcodeUploadedPreview;
      }
    }
    const newCode: any = { 
      codeType: barcodeType, 
      codeValue: barcodeValue, 
      codeKind: 'BARCODE', 
      file, 
      preview,
      isGenerated: barcodeGenerationMode 
    };
    setLocalBarcodes([newCode]);
    
    if (uid) {
      const flags = loadCodeFlags(uid);
      flags[barcodeValue] = { isGenerated: barcodeGenerationMode, codeKind: 'BARCODE' };
      saveCodeFlags(uid, flags);
    }
    
    setShowBarcodePopup(false);
  };

  const handleSkuSave = () => {
    if (!skuValue.trim()) return;
    let file: File | null = null;
    let preview: string | null = null;
    if (skuGenerationMode) {
      if (skuPreview) {
        file = dataUrlToFile(skuPreview, `sku_${Date.now()}.png`);
        preview = skuPreview;
      }
    } else {
      if (skuUploadedFile) {
        file = skuUploadedFile;
        preview = skuUploadedPreview;
      }
    }
    const newCode: any = { 
      codeType: 'QR_CODE', 
      codeValue: skuValue, 
      codeKind: 'SKU', 
      file, 
      preview,
      isGenerated: skuGenerationMode 
    };
    setLocalSkus([newCode]);
    
    if (uid) {
      const flags = loadCodeFlags(uid);
      flags[skuValue] = { isGenerated: skuGenerationMode, codeKind: 'SKU' };
      saveCodeFlags(uid, flags);
    }
    
    setShowSkuPopup(false);
  };

  const openBarcodePopup = () => { 
    if (currentBarcode) { 
      setBarcodeValue(currentBarcode.codeValue); 
      setBarcodeType(currentBarcode.codeType || 'code128');
      const code = currentBarcode as any;
      if (code.isGenerated === true) {
        setBarcodeGenerationMode(true);
        setBarcodeUploadedFile(null);
        setBarcodeUploadedPreview(null);
      } else if (code.isGenerated === false) {
        setBarcodeGenerationMode(false);
        setBarcodeUploadedFile(code.file || null);
        setBarcodeUploadedPreview(code.preview || code.fileUrl || null);
      } else {
        if (uid) {
          const flags = loadCodeFlags(uid);
          const flag = flags[code.codeValue];
          if (flag) {
            setBarcodeGenerationMode(flag.isGenerated);
            if (!flag.isGenerated) {
              setBarcodeUploadedFile(code.file || null);
              setBarcodeUploadedPreview(code.preview || code.fileUrl || null);
            } else {
              setBarcodeUploadedFile(null);
              setBarcodeUploadedPreview(null);
            }
            setBarcodePreview(null);
            setBarcodeTypeOpen(false);
            setShowBarcodePopup(true);
            return;
          }
        }
        const hasFile = !!code.fileUrl;
        setBarcodeGenerationMode(!hasFile);
        if (hasFile) {
          setBarcodeUploadedFile(null);
          setBarcodeUploadedPreview(code.fileUrl || null);
        } else {
          setBarcodeUploadedFile(null);
          setBarcodeUploadedPreview(null);
        }
      }
    } else { 
      setBarcodeValue(''); 
      setBarcodeType('code128');
      setBarcodeGenerationMode(true);
      setBarcodeUploadedFile(null);
      setBarcodeUploadedPreview(null);
    } 
    setBarcodePreview(null); 
    setBarcodeTypeOpen(false);
    setShowBarcodePopup(true); 
  };

  const openSkuPopup = () => { 
    if (currentSku) { 
      setSkuValue(currentSku.codeValue); 
      const code = currentSku as any;
      if (code.isGenerated === true) {
        setSkuGenerationMode(true);
        setSkuUploadedFile(null);
        setSkuUploadedPreview(null);
      } else if (code.isGenerated === false) {
        setSkuGenerationMode(false);
        setSkuUploadedFile(code.file || null);
        setSkuUploadedPreview(code.preview || code.fileUrl || null);
      } else {
        if (uid) {
          const flags = loadCodeFlags(uid);
          const flag = flags[code.codeValue];
          if (flag) {
            setSkuGenerationMode(flag.isGenerated);
            if (!flag.isGenerated) {
              setSkuUploadedFile(code.file || null);
              setSkuUploadedPreview(code.preview || code.fileUrl || null);
            } else {
              setSkuUploadedFile(null);
              setSkuUploadedPreview(null);
            }
            setSkuPreview(null);
            setShowSkuPopup(true);
            return;
          }
        }
        const hasFile = !!code.fileUrl;
        setSkuGenerationMode(!hasFile);
        if (hasFile) {
          setSkuUploadedFile(null);
          setSkuUploadedPreview(code.fileUrl || null);
        } else {
          setSkuUploadedFile(null);
          setSkuUploadedPreview(null);
        }
      }
    } else { 
      setSkuValue(''); 
      setSkuGenerationMode(true);
      setSkuUploadedFile(null);
      setSkuUploadedPreview(null);
    } 
    setSkuPreview(null); 
    setShowSkuPopup(true); 
  };

  const getCurrentBarcodeUrl = (): string => { 
    if (!currentBarcode) return ''; 
    const code = currentBarcode as any; 
    return code.preview || code.fileUrl || ''; 
  };
  
  const getCurrentSkuUrl = (): string => { 
    if (!currentSku) return ''; 
    const code = currentSku as any; 
    return code.preview || code.fileUrl || ''; 
  };

  const handleBarcodeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getCurrentBarcodeUrl();
    if (url) setFullscreenCode(url);
  };

  const handleSkuIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getCurrentSkuUrl();
    if (url) setFullscreenCode(url);
  };

  const handleFullscreenCodeContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFullscreenCodeContextMenu({ x: e.clientX, y: e.clientY });
  };

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const arrowIconStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease' };

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const getRatingStatus = (): string => {
    if (averageRating === 0) return 'Рейтинг отсутствует';
    if (averageRating <= 2) return 'Низкое качество';
    if (averageRating <= 4) return 'Среднее качество';
    return 'Высокое качество';
  };

  const grayBorder = '1px solid rgba(102, 110, 254, 0.15)';
  const activeBorder = '1px solid #666EFE';

  const popupInputStyle = (hasValue: boolean): React.CSSProperties => ({
    width: 353,
    height: 44,
    borderRadius: 10,
    border: hasValue ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
    paddingLeft: 12,
    paddingRight: 12,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#666EFE',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
  });

  const contextMenuButtonStyle: React.CSSProperties = {
    width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', paddingLeft: 20,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
  };

  const POPUP_WIDTH = 413;
  const POPUP_HEIGHT = 580;

  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const SELECT_WIDTH = 388;

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Код:"
            icon={Icon11} iconActive={Icon12}
            value={code ? String(code) : ''}
            type="display"
            locked
            selectIconWidth={20}
            selectIconHeight={40}
          />
          <div style={{ marginTop: 25 }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Артикул:"
              icon={IconArt1} iconActive={IconArt2}
              value={article}
              placeholder="Артикул"
              type="input"
              onChange={e => { setArticle(e.target.value); clearFieldError('article'); }}
              onClear={() => setArticle('')}
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Наименование:"
            icon={Icon21} iconActive={Icon22}
            value={name}
            placeholder="Введите название"
            type="input"
            onChange={e => { setName(e.target.value); clearFieldError('name'); }}
            onClear={() => setName('')}
          />
          <div style={{ marginTop: 25 }}>
            <FormField
              width={FIELD_WIDTH} height={FIELD_HEIGHT}
              label="Каталог:"
              icon={Icon31} iconActive={Icon32}
              value={selectedCatalog}
              placeholder="Выберите группу"
              type="select"
              searchOptions={catalogOptions}
              onSelectOption={(uid, name) => { setSelectedCatalogId(uid); setSelectedCatalog(name); clearFieldError('catalog'); }}
              onOpenFullList={() => { clearFieldError('catalog'); openPopup('catalog'); }}
              searchTitle="Найденный каталог"
              searchNotFoundText="Каталоги не найдены"
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 238, left: 30, right: 30 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: 732, height: 263, borderRadius: 10, border: (description || descriptionFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
            <img src={description ? Icon52 : Icon51} alt="" style={{ width: 16, height: 16, position: 'absolute', top: 15, left: 15 }} />
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 15, paddingLeft: 44, paddingRight: 40, paddingBottom: 15, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} onFocus={() => setDescriptionFocused(true)} onBlur={() => setDescriptionFocused(false)} placeholder="Введите описание" />
            {description && (
              <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 15, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="#666EFE" fillOpacity="0.15" />
                  <path d="M6 6L12 12M12 6L6 12" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Группа учета:</span>
          </div>
          <div className="accounting-group-dropdown" style={{ position: 'relative' }}>
            <div onClick={() => { clearFieldError('accountingGroup'); setAccountingGroupOpen(!accountingGroupOpen); }} style={{ width: 388, height: 44, borderRadius: 10, border: selectedAccountingGroupId ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF', cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <img src={selectedAccountingGroup ? Icon62 : Icon61} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF' }}>{selectedAccountingGroup || 'Выбрать группу учета'}</span>
              <motion.img src={Icon9} alt="" style={{ ...arrowIconStyle, transform: accountingGroupOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
            </div>
            <AnimatePresence>
              {accountingGroupOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 388, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                  {typeMaterials.map(o => (
                    <div key={o.uid} onClick={() => handleAccountingGroupSelect(o)} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedAccountingGroupId === o.uid ? '#F0F1FF' : '#FFFFFF' }} onMouseEnter={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }} onMouseLeave={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                      {o.typeName}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 145, left: 30, right: 30 }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Группа номенклатуры:"
            icon={Icon31} iconActive={Icon32}
            value={selectedNomenclatureGroup}
            placeholder={selectedAccountingGroupId ? 'Выбрать группу' : 'Сначала выберите группу учета'}
            type="select"
            locked={!selectedAccountingGroupId}
            searchOptions={nomenclatureGroupOptions}
            onSelectOption={(uid, name) => { setSelectedNomenclatureGroupId(uid); setSelectedNomenclatureGroup(name); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); clearFieldError('nomenclatureGroup'); }}
            onOpenFullList={() => { clearFieldError('nomenclatureGroup'); openPopup('nomenclatureGroup'); }}
            searchTitle="Найденная группа"
            searchNotFoundText="Группы не найдены"
          />
        </div>
        <div style={{ position: 'absolute', top: 250, left: 30, right: 30 }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Вид номенклатуры:"
            icon={Icon71} iconActive={Icon72}
            value={selectedNomenclatureType}
            placeholder={selectedNomenclatureGroupId ? 'Выбрать вид' : 'Сначала выберите группу номенклатуры'}
            type="select"
            locked={!selectedNomenclatureGroupId}
            searchOptions={nomenclatureTypeOptions}
            onSelectOption={(uid, name) => { setSelectedNomenclatureTypeId(uid); setSelectedNomenclatureType(name); clearFieldError('nomenclatureType'); }}
            onOpenFullList={() => { clearFieldError('nomenclatureType'); openPopup('nomenclatureType'); }}
            searchTitle="Найденный вид"
            searchNotFoundText="Виды не найдены"
          />
        </div>
        
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 345, left: 70, right: 70, height: 85, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div onClick={toggleUsage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span><ToggleSwitch value={usage} onChange={toggleUsage} /></div>
            <div onClick={toggleWasteMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span><ToggleSwitch value={wasteMaterial} onChange={toggleWasteMaterial} /></div>
            <div onClick={toggleRecycleMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span><ToggleSwitch value={recycleMaterial} onChange={toggleRecycleMaterial} /></div>
          </div>
        )}

        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 460, left: 30, right: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#2D4059', marginLeft: 9 }}>Рейтинг номенклатуры:</span>
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 7 } }))} style={{ marginLeft: 9, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={IconRating} alt="Рейтинг" style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 17, marginLeft: 27 }}>
              <StarRatingSmall value={averageRating} size={18} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 10 }}>Средний рейтинг: {averageRating}</span>
            </div>
          </div>
        )}
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', bottom: 23, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE' }}>{getRatingStatus()}</span>
          </div>
        )}
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 30 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Изображение</span></div>
        <div style={{ position: 'absolute', top: 49, left: 30, width: 353, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}><img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
            {displayImages.length > 0 ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}><img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>{isUploading ? 'Загрузка...' : 'Нет изображений'}</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
          </div>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (<div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}><img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />

        {/* Штрихкод */}
        <div style={{ position: 'absolute', top: 379, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Штрихкод:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div onClick={currentBarcode ? handleBarcodeIconClick : undefined} style={{ width: 76, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: currentBarcode ? 'pointer' : 'default' }}>
              {currentBarcode && <img src={IconCODE} alt="" style={{ width: 57, height: 25 }} />}
            </div>
            <div onClick={openBarcodePopup} style={{ flex: 1, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentBarcode ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBarcode?.codeValue || 'Добавить штрихкод'}</span>
              <div onClick={(e) => { e.stopPropagation(); openBarcodePopup(); }} style={{ width: 29, height: 22, flexShrink: 0, cursor: 'pointer', position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentBarcode ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* SKU */}
        <div style={{ position: 'absolute', top: 465, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>SKU:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div onClick={currentSku ? handleSkuIconClick : undefined} style={{ width: 76, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: currentSku ? 'pointer' : 'default' }}>
              {currentSku && <img src={IconCODE2} alt="" style={{ width: 31, height: 31 }} />}
            </div>
            <div onClick={openSkuPopup} style={{ flex: 1, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentSku ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSku?.codeValue || 'Добавить SKU'}</span>
              <div onClick={(e) => { e.stopPropagation(); openSkuPopup(); }} style={{ width: 29, height: 22, flexShrink: 0, cursor: 'pointer', position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentSku ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={barcodeFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBarcodeFileUpload} />
      <input ref={skuFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSkuFileUpload} />

      {contextMenu && (<div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}><button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button></div>)}
      
      {fullscreenImage && displayImages[localSelectedIndex] && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onContextMenu={(e) => { e.preventDefault(); handleImageContextMenu(e, localSelectedIndex); }} onClick={() => setFullscreenImage(false)}><img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} /></div>)}

      {fullscreenCode && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} 
          onContextMenu={handleFullscreenCodeContextMenu} 
          onClick={() => { setFullscreenCode(null); setFullscreenCodeContextMenu(null); }}
        >
          <img src={fullscreenCode} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', backgroundColor: '#FFFFFF', padding: 40, borderRadius: 16 }} />
          {fullscreenCodeContextMenu && (
            <div style={{ position: 'fixed', top: fullscreenCodeContextMenu.y, left: fullscreenCodeContextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10002, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { handleDeleteBarcode(); handleDeleteSku(); setFullscreenCode(null); setFullscreenCodeContextMenu(null); }} style={contextMenuButtonStyle}>Удалить</button>
            </div>
          )}
        </div>
      )}

      {/* Попап штрихкода */}
      {showBarcodePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBarcodePopup(false)}>
          <div style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 20, padding: '30px 30px 30px 30px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={IconInfo} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', marginLeft: 9 }}>
                  {barcodeGenerationMode ? 'Создание штрихкода' : 'Прикрепление изображения штрихкода'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, marginTop: 16 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Генерация кода</span>
                <ToggleSwitch value={barcodeGenerationMode} onChange={() => setBarcodeGenerationMode(!barcodeGenerationMode)} />
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {!barcodeGenerationMode ? (
                <div 
                  style={{ marginTop: 35, width: 353, height: 249, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'center', flexShrink: 0 }}
                  onContextMenu={barcodeUploadedPreview ? (e) => { e.preventDefault(); e.stopPropagation(); setBarcodeUploadContextMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                >
                  <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => barcodeFileInputRef.current?.click()}>
                    <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFC', overflow: 'hidden' }}>
                    {barcodeUploadedPreview ? (
                      <img src={barcodeUploadedPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображения</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 35, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип кода</span>
                  <div style={{ position: 'relative' }}>
                    <div onClick={() => setBarcodeTypeOpen(!barcodeTypeOpen)} style={{ width: 353, height: 44, borderRadius: 10, border: barcodeType ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', flex: 1 }}>{BARCODE_TYPES.find(t => t.value === barcodeType)?.label || 'Выберите тип'}</span>
                      <motion.img src={Icon9} alt="" style={{ width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease', transform: barcodeTypeOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
                    </div>
                    <AnimatePresence>
                      {barcodeTypeOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 353, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                          {BARCODE_TYPES.map(t => (
                            <div key={t.value} onClick={() => { setBarcodeType(t.value); setBarcodeTypeOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: barcodeType === t.value ? '#F0F1FF' : '#FFFFFF' }} onMouseEnter={(e) => { if (barcodeType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }} onMouseLeave={(e) => { if (barcodeType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                              {t.label}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Данные кода</span>
                <input type="text" value={barcodeValue} onChange={e => setBarcodeValue(e.target.value)} placeholder={getBarcodeHint(barcodeType)} style={popupInputStyle(!!barcodeValue.trim())} />
              </div>

              {barcodeGenerationMode && (
                <div style={{ marginTop: 20, width: 353, minHeight: 80, backgroundColor: '#F5F6FA', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, boxSizing: 'border-box', flexShrink: 0 }}>
                  {barcodePreview ? (
                    <img src={barcodePreview} alt="Штрихкод" style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Введите код для генерации</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexShrink: 0 }}>
              <button onClick={handleBarcodeSave} disabled={!barcodeValue.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: barcodeValue.trim() ? '#666EFE' : '#BCC8FF', cursor: barcodeValue.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
              <button onClick={() => setShowBarcodePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button>
            </div>

            {barcodeUploadContextMenu && (
              <div style={{ position: 'fixed', top: barcodeUploadContextMenu.y, left: barcodeUploadContextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10002, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => { clearBarcodeUpload(); setBarcodeUploadContextMenu(null); }} style={contextMenuButtonStyle}>Удалить</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Попап SKU */}
      {showSkuPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSkuPopup(false)}>
          <div style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 20, padding: '30px 30px 30px 30px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={IconInfo} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', marginLeft: 9 }}>
                  {skuGenerationMode ? 'Создание QR-кода' : 'Прикрепление изображения QR-кода'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, marginTop: 16 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Генерация кода</span>
                <ToggleSwitch value={skuGenerationMode} onChange={() => setSkuGenerationMode(!skuGenerationMode)} />
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {!skuGenerationMode ? (
                <div 
                  style={{ marginTop: 35, width: 353, height: 249, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'center', flexShrink: 0 }}
                  onContextMenu={skuUploadedPreview ? (e) => { e.preventDefault(); e.stopPropagation(); setSkuUploadContextMenu({ x: e.clientX, y: e.clientY }); } : undefined}
                >
                  <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => skuFileInputRef.current?.click()}>
                    <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFC', overflow: 'hidden' }}>
                    {skuUploadedPreview ? (
                      <img src={skuUploadedPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображения</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 35, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип кода</span>
                  <div style={{ width: 353, height: 44, borderRadius: 10, border: '1px solid #666EFE', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, boxSizing: 'border-box' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE' }}>QR_CODE</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Данные кода</span>
                <input type="text" value={skuValue} onChange={e => setSkuValue(e.target.value)} placeholder={getSkuHint()} style={popupInputStyle(!!skuValue.trim())} />
              </div>

              {skuGenerationMode && (
                <div style={{ marginTop: 20, width: 353, minHeight: 120, backgroundColor: '#F5F6FA', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, boxSizing: 'border-box', flexShrink: 0 }}>
                  {skuPreview ? (
                    <img src={skuPreview} alt="QR-код" style={{ width: 100, height: 100, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Введите код для генерации</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexShrink: 0 }}>
              <button onClick={handleSkuSave} disabled={!skuValue.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: skuValue.trim() ? '#666EFE' : '#BCC8FF', cursor: skuValue.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button>
              <button onClick={() => setShowSkuPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть</button>
            </div>

            {skuUploadContextMenu && (
              <div style={{ position: 'fixed', top: skuUploadContextMenu.y, left: skuUploadContextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10002, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => { clearSkuUpload(); setSkuUploadContextMenu(null); }} style={contextMenuButtonStyle}>Удалить</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainTab;