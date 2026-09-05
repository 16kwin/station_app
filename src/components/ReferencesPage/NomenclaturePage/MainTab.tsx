// MainTab.tsx — ПОЛНЫЙ ФАЙЛ (центральный блок переработан)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';
import FormField from '../../elements/FormField';
import LogoUploader from '../../elements/LogoUploader';
import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import Icon8 from '../../../assets/References/NomenclatureCreatePage/Icon8.svg';
import Icon9 from '../../../assets/References/NomenclatureCreatePage/Icon9.svg';
import Icon11 from '../../../assets/References/NomenclatureCreatePage/Icon11.svg';
import Icon12 from '../../../assets/References/NomenclatureCreatePage/Icon12.svg';
import Icon21 from '../../../assets/References/NomenclatureCreatePage/Icon21.svg';
import Icon22 from '../../../assets/References/NomenclatureCreatePage/Icon22.svg';
import Icon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
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
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps, LocalImageItem, LocalCode, ServerCode } from './NomenclatureCreatePage';

// ==================== Генерация кода ====================

const validateAndGenerate = async (format: string, text: string): Promise<{ image: string | null; error: string | null }> => {
  const trimmed = text.trim();
  
  let error: string | null = null;
  
  switch (format) {
    case 'code32':
      if (!/^\d+$/.test(trimmed)) error = 'Code 32: только цифры';
      else if (trimmed.length > 8) error = 'Code 32: максимум 8 цифр';
      break;
    case 'code39':
      if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(trimmed)) error = 'Code 39: только заглавные буквы, цифры и спецсимволы';
      break;
    case 'ean8':
      if (!/^\d{7}$/.test(trimmed)) error = 'EAN-8: ровно 7 цифр';
      break;
    case 'ean13':
      if (!/^\d{12,13}$/.test(trimmed)) error = 'EAN-13: ровно 12-13 цифр';
      break;
    case 'jan8':
      if (!/^\d{7}$/.test(trimmed)) error = 'JAN-8: ровно 7 цифр';
      break;
    case 'jan13':
      if (!/^\d{12,13}$/.test(trimmed)) error = 'JAN-13: ровно 12-13 цифр';
      break;
    case 'upca':
      if (!/^\d{11,12}$/.test(trimmed)) error = 'UPC-A: ровно 11-12 цифр';
      break;
    case 'upce':
      if (!/^\d{6,8}$/.test(trimmed)) error = 'UPC-E: 6-8 цифр';
      break;
    case 'aztec':
      if (trimmed.length < 1) error = 'Aztec: введите текст';
      break;
    case 'datamatrix':
      if (trimmed.length < 1) error = 'DataMatrix: введите текст';
      break;
    case 'pdf417':
      if (trimmed.length < 1) error = 'PDF417: введите текст';
      break;
    case 'qr':
      if (trimmed.length < 1) error = 'QR: введите текст';
      break;
  }
  
  if (error) return { image: null, error };
  
  try {
    const canvas = document.createElement('canvas');
    
    const is1D = ['code32', 'code39', 'ean8', 'ean13', 'jan8', 'jan13', 'upca', 'upce'].includes(format);
    
    if (is1D) {
      const jsbarcodeFormat = 
        format === 'code32' || format === 'code39' ? 'CODE39' :
        format === 'ean8' || format === 'jan8' ? 'EAN8' :
        format === 'ean13' || format === 'jan13' ? 'EAN13' :
        format === 'upca' ? 'UPC' :
        format === 'upce' ? 'UPC' : 'CODE39';
      
      const finalText = format === 'code32' ? 'A' + trimmed : trimmed;
      
      // @ts-ignore
      JsBarcode(canvas, finalText, {
        format: jsbarcodeFormat,
        lineColor: '#000000',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        font: 'Inter',
        textMargin: 5,
        margin: 10,
        background: '#FFFFFF',
      });
      
      return { image: canvas.toDataURL('image/png'), error: null };
    }
    
    const bwipjsOptions: any = {
      bcid: format,
      text: trimmed,
      scale: 3,
      includetext: false,
    };
    
    if (format === 'aztec') {
      bwipjsOptions.bcid = 'azteccode';
      bwipjsOptions.width = 20;
      bwipjsOptions.height = 20;
    }
    if (format === 'datamatrix') {
      bwipjsOptions.bcid = 'datamatrix';
      bwipjsOptions.width = 20;
      bwipjsOptions.height = 20;
      bwipjsOptions.encoding = 'ascii';
    }
    if (format === 'pdf417') {
      bwipjsOptions.bcid = 'pdf417';
      bwipjsOptions.scale = 2;
      bwipjsOptions.height = 15;
      bwipjsOptions.columns = 5;
    }
    if (format === 'qr') {
      bwipjsOptions.bcid = 'qrcode';
      bwipjsOptions.width = 20;
      bwipjsOptions.height = 20;
    }
    
    // @ts-ignore
    await bwipjs.toCanvas(canvas, bwipjsOptions);
    
    return { image: canvas.toDataURL('image/png'), error: null };
  } catch (e: any) {
    console.error('Ошибка генерации кода:', e);
    return { image: null, error: `Не удалось сгенерировать: ${e?.message || 'неизвестная ошибка'}` };
  }
};

const CODE_TYPES = [
  { value: 'code32', label: 'CODE_32', kind: 'BARCODE' },
  { value: 'code39', label: 'CODE_39', kind: 'BARCODE' },
  { value: 'ean8', label: 'EAN_8', kind: 'BARCODE' },
  { value: 'ean13', label: 'EAN_13', kind: 'BARCODE' },
  { value: 'jan8', label: 'JAN_8', kind: 'BARCODE' },
  { value: 'jan13', label: 'JAN_13', kind: 'BARCODE' },
  { value: 'upca', label: 'UPC_A', kind: 'BARCODE' },
  { value: 'upce', label: 'UPC_E', kind: 'BARCODE' },
  { value: 'aztec', label: 'AZTEC', kind: '2D' },
  { value: 'datamatrix', label: 'DATAMATRIX', kind: '2D' },
  { value: 'pdf417', label: 'PDF417', kind: '2D' },
  { value: 'qr', label: 'QR_CODE', kind: '2D' },
];

const getCodeHint = (type: string): string => {
  switch (type) {
    case 'code32': return 'Пример: 123456789';
    case 'code39': return 'Пример: ABC123456';
    case 'ean8': return 'Пример: 1234567';
    case 'ean13': return 'Пример: 5901234123457';
    case 'jan8': return 'Пример: 4901234';
    case 'jan13': return 'Пример: 4901234123457';
    case 'upca': return 'Пример: 042100005264';
    case 'upce': return 'Пример: 123456';
    case 'aztec': return 'Пример: AZTEC123';
    case 'datamatrix': return 'Пример: DM123456';
    case 'pdf417': return 'Пример: PDF417123';
    case 'qr': return 'Пример: QR123456';
    default: return 'Введите код';
  }
};

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
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);

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
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeType, setBarcodeType] = useState('qr');
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeTypeOpen, setBarcodeTypeOpen] = useState(false);

  const [showSkuPopup, setShowSkuPopup] = useState(false);
  const [skuValue, setSkuValue] = useState('');
  const [skuType, setSkuType] = useState('qr');
  const [skuPreview, setSkuPreview] = useState<string | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [skuTypeOpen, setSkuTypeOpen] = useState(false);

  const fetchAverageRating = async () => { if (!uid || isFinishedProduct) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)); setAverageRating(Math.round((res.data || 0) * 10) / 10); } catch (e) { console.error(e); } };

  useEffect(() => { if (uid && isEdit) { fetchAverageRating(); } }, [uid, isEdit]);

  useEffect(() => {
    if (!barcodeValue.trim() || !showBarcodePopup) { setBarcodePreview(null); setBarcodeError(null); return; }
    const t = setTimeout(async () => {
      const result = await validateAndGenerate(barcodeType, barcodeValue);
      setBarcodePreview(result.image);
      setBarcodeError(result.error);
    }, 150);
    return () => clearTimeout(t);
  }, [barcodeValue, barcodeType, showBarcodePopup]);

  useEffect(() => {
    if (!skuValue.trim() || !showSkuPopup) { setSkuPreview(null); setSkuError(null); return; }
    const t = setTimeout(async () => {
      const result = await validateAndGenerate(skuType, skuValue);
      setSkuPreview(result.image);
      setSkuError(result.error);
    }, 150);
    return () => clearTimeout(t);
  }, [skuValue, skuType, showSkuPopup]);

  const handleDeleteBarcode = () => {
    setLocalBarcodes([]);
  };

  const handleDeleteSku = () => {
    setLocalSkus([]);
  };

  const handleBarcodeSave = () => {
    if (!barcodeValue.trim() || !barcodePreview) return;
    const newCode: any = {
      codeType: barcodeType,
      codeValue: barcodeValue.trim(),
      codeKind: 'BARCODE',
      isGenerated: true
    };
    setLocalBarcodes([newCode]);
    if (uid) {
      const flags = loadCodeFlags(uid);
      flags[barcodeValue.trim()] = { isGenerated: true, codeKind: 'BARCODE' };
      saveCodeFlags(uid, flags);
    }
    setShowBarcodePopup(false);
  };

  const handleSkuSave = () => {
    if (!skuValue.trim() || !skuPreview) return;
    const newCode: any = {
      codeType: skuType,
      codeValue: skuValue.trim(),
      codeKind: 'SKU',
      isGenerated: true
    };
    setLocalSkus([newCode]);
    if (uid) {
      const flags = loadCodeFlags(uid);
      flags[skuValue.trim()] = { isGenerated: true, codeKind: 'SKU' };
      saveCodeFlags(uid, flags);
    }
    setShowSkuPopup(false);
  };

  const openBarcodePopup = () => {
    if (currentBarcode) {
      setBarcodeValue(currentBarcode.codeValue);
      setBarcodeType(currentBarcode.codeType || 'qr');
    } else {
      setBarcodeValue('');
      setBarcodeType('qr');
    }
    setBarcodePreview(null);
    setBarcodeError(null);
    setBarcodeTypeOpen(false);
    setShowBarcodePopup(true);
  };

  const openSkuPopup = () => {
    if (currentSku) {
      setSkuValue(currentSku.codeValue);
      setSkuType(currentSku.codeType || 'qr');
    } else {
      setSkuValue('');
      setSkuType('qr');
    }
    setSkuPreview(null);
    setSkuError(null);
    setSkuTypeOpen(false);
    setShowSkuPopup(true);
  };

  const handleBarcodeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openBarcodePopup();
  };

  const handleSkuIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSkuPopup();
  };

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const arrowIconStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease' };

  const displayImages = [
    ...images.map(img => ({ uid: img.uid, url: img.url, originalName: img.originalName, isLocal: false })),
    ...(localImages || []).map(img => ({ uid: img.url, url: img.url, originalName: img.file.name, isLocal: true })),
  ];
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const getRatingStatus = (): string => {
    if (averageRating === 0) return 'Рейтинг отсутствует';
    if (averageRating <= 2) return 'Низкое качество';
    if (averageRating <= 4) return 'Среднее качество';
    return 'Высокое качество';
  };

  const grayBorder = '1px solid rgba(102, 110, 254, 0.15)';
  const activeBorder = '1px solid #666EFE';

  const POPUP_WIDTH = 413;
  const POPUP_HEIGHT = 532;

  const popupTitleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 47,
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 500,
    color: '#2D4059',
    lineHeight: '18px',
  };

  const popupLabelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    color: '#2D4059',
    display: 'block',
    marginBottom: 11,
    lineHeight: '17px',
  };

  const popupInputStyle: React.CSSProperties = {
    width: 353,
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    paddingLeft: 12,
    paddingRight: 12,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: '#666EFE',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
  };

  const popupPreviewStyle: React.CSSProperties = {
    width: 353,
    height: 140,
    borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#F5F6FA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '10px',
  };

  const popupButtonStyle = (disabled: boolean): React.CSSProperties => ({
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 400,
    color: '#2D4059',
    opacity: disabled ? 0.5 : 1,
    padding: 0,
  });

  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const SELECT_WIDTH = 340;

  return (
    <div style={{ ...cs, display: 'flex', gap: 30, overflow: 'auto' }}>
      {/* ЛЕВЫЙ БЛОК 790×565 */}
      <div style={{ ...blockStyle, width: 790, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Код:"
            value={code ? String(code).padStart(4, '0') : ''}
            type="input"
            disabled
            icon={CodeIcon20LightBlue}
            iconWidth={20}
            iconHeight={14}
            labelMarginBottom={11}
          />
        </div>
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30, left: 30 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Артикул:"
            icon={IconArt1} iconActive={IconArt2}
            value={article}
            placeholder="Артикул"
            type="input"
            onChange={e => { setArticle(e.target.value); clearFieldError('article'); }}
            onClear={() => setArticle('')}
            labelMarginBottom={11}
          />
        </div>
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30, left: 30, width: 730 }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 11, lineHeight: '17px' }}>Описание:</span>
          <div style={{ width: 730, height: 273, borderRadius: 10, border: (description || descriptionFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', position: 'relative' }}>
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

        <div style={{ position: 'absolute', top: 30, left: 30 + FIELD_WIDTH + 50 }}>
          <FormField
            width={FIELD_WIDTH} height={FIELD_HEIGHT}
            label="Наименование:"
            icon={Icon21} iconActive={Icon22}
            value={name}
            placeholder="Введите название"
            type="input"
            onChange={e => { setName(e.target.value); clearFieldError('name'); }}
            onClear={() => setName('')}
            labelMarginBottom={11}
          />
        </div>
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30, left: 30 + FIELD_WIDTH + 50 }}>
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
            labelMarginBottom={11}
          />
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК 420×565 */}
      <div style={{ ...blockStyle, width: 420, height: 565, flexShrink: 0, position: 'relative' }}>
        {/* Группа учета */}
        <div style={{ position: 'absolute', top: 30, left: 40, right: 40 }}>
          <span style={{ ...labelStyle, display: 'block', lineHeight: '17px' }}>Группа учета:</span>
          <div className="accounting-group-dropdown" style={{ position: 'relative', marginTop: 11 }}>
            <div onClick={() => { clearFieldError('accountingGroup'); setAccountingGroupOpen(!accountingGroupOpen); }} style={{ width: 340, height: 44, borderRadius: 10, border: selectedAccountingGroupId ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF', cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <img src={selectedAccountingGroup ? Icon62 : Icon61} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF' }}>{selectedAccountingGroup || 'Выбрать группу учета'}</span>
              <motion.img src={Icon9} alt="" style={{ ...arrowIconStyle, transform: accountingGroupOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
            </div>
            <AnimatePresence>
              {accountingGroupOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 340, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
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

        {/* Группа номенклатуры */}
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30, left: 40, right: 40 }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Группа номенклатуры:"
            icon={Icon31} iconActive={Icon32}
            value={selectedNomenclatureGroup}
            placeholder={selectedAccountingGroupId ? 'Выбрать группу' : 'Сначала выберите группу учета'}
            type="select"
            disabled={!selectedAccountingGroupId}
            searchOptions={nomenclatureGroupOptions}
            onSelectOption={(uid, name) => { setSelectedNomenclatureGroupId(uid); setSelectedNomenclatureGroup(name); setSelectedNomenclatureType(''); setSelectedNomenclatureTypeId(''); clearFieldError('nomenclatureGroup'); }}
            onOpenFullList={() => { clearFieldError('nomenclatureGroup'); openPopup('nomenclatureGroup'); }}
            searchTitle="Найденная группа"
            searchNotFoundText="Группы не найдены"
          />
        </div>

        {/* Вид номенклатуры */}
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30, left: 40, right: 40 }}>
          <FormField
            width={SELECT_WIDTH} height={FIELD_HEIGHT}
            label="Вид номенклатуры:"
            icon={Icon71} iconActive={Icon72}
            value={selectedNomenclatureType}
            placeholder={selectedNomenclatureGroupId ? 'Выбрать вид' : 'Сначала выберите группу номенклатуры'}
            type="select"
            disabled={!selectedNomenclatureGroupId}
            searchOptions={nomenclatureTypeOptions}
            onSelectOption={(uid, name) => { setSelectedNomenclatureTypeId(uid); setSelectedNomenclatureType(name); clearFieldError('nomenclatureType'); }}
            onOpenFullList={() => { clearFieldError('nomenclatureType'); openPopup('nomenclatureType'); }}
            searchTitle="Найденный вид"
            searchNotFoundText="Виды не найдены"
          />
        </div>

        {/* Переключатели */}
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30, left: 40, right: 40, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div onClick={toggleUsage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 18 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span>
              <ToggleSwitch value={usage} onChange={toggleUsage} />
            </div>
            <div onClick={toggleWasteMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 18 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span>
              <ToggleSwitch value={wasteMaterial} onChange={toggleWasteMaterial} />
            </div>
            <div onClick={toggleRecycleMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 18 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span>
              <ToggleSwitch value={recycleMaterial} onChange={toggleRecycleMaterial} />
            </div>
          </div>
        )}

        {/* Рейтинг номенклатуры */}
        {!isFinishedProduct && (
          <div style={{ position: 'absolute', top: 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30 + 17 + 11 + 44 + 30 + 18 + 15 + 18 + 15 + 18 + 30, left: 40, right: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#2D4059', marginLeft: 9 }}>Рейтинг номенклатуры:</span>
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 7 } }))} style={{ marginLeft: 9, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={IconRating} alt="Рейтинг" style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 17, marginLeft: 27 }}>
              <StarRatingSmall value={averageRating} size={18} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 10 }}>Средний рейтинг: {averageRating}</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 17 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE' }}>{getRatingStatus()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ПРАВЫЙ БЛОК 470×565 */}
      <div style={{ ...blockStyle, width: 470, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30 }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 11, lineHeight: '17px' }}>Изображение</span>
          <LogoUploader
            images={displayImages}
            selectedIndex={localSelectedIndex}
            onSelectImage={(idx) => setLocalSelectedIndex(idx)}
            onUpload={(files) => {
              const imgs: LocalImageItem[] = [];
              for (let i = 0; i < files.length; i++) {
                imgs.push({ file: files[i], url: URL.createObjectURL(files[i]) });
              }
              setLocalImages((p: LocalImageItem[]) => {
                const newLocalImages = [...p, ...imgs];
                const newTotalCount = images.length + newLocalImages.length;
                setLocalSelectedIndex(newTotalCount - 1);
                return newLocalImages;
              });
            }}
            onDelete={(uid, index) => {
              const targetImage = displayImages[index];
              if (targetImage?.isLocal) {
                const localIndex = index - images.length;
                setLocalImages((p: LocalImageItem[]) => {
                  const n = [...p];
                  if (n[localIndex]) URL.revokeObjectURL(n[localIndex].url);
                  n.splice(localIndex, 1);
                  return n;
                });
                if (localSelectedIndex >= displayImages.length - 1) {
                  setLocalSelectedIndex(Math.max(0, displayImages.length - 2));
                }
              } else if (targetImage) {
                handleDeleteImage(uid);
                if (localSelectedIndex >= displayImages.length - 1) {
                  setLocalSelectedIndex(Math.max(0, displayImages.length - 2));
                }
              }
            }}
            width={410}
            height={283}
          />
        </div>

        {/* Штрихкод */}
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 283 + 30, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Штрихкод:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div onClick={currentBarcode ? handleBarcodeIconClick : openBarcodePopup} style={{ width: 76, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
              {currentBarcode && <img src={IconCODE} alt="" style={{ width: 57, height: 25 }} />}
            </div>
            <div onClick={openBarcodePopup} style={{ flex: 1, height: 44, borderRadius: 10, border: currentBarcode ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentBarcode ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBarcode?.codeValue || 'Добавить штрихкод'}</span>
              <div style={{ width: 29, height: 22, flexShrink: 0, position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentBarcode ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* SKU */}
        <div style={{ position: 'absolute', top: 30 + 17 + 11 + 283 + 30 + 17 + 12 + 44 + 20, left: 30, right: 30 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>SKU:</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div onClick={currentSku ? handleSkuIconClick : openSkuPopup} style={{ width: 76, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
              {currentSku && <img src={IconCODE2} alt="" style={{ width: 31, height: 31 }} />}
            </div>
            <div onClick={openSkuPopup} style={{ flex: 1, height: 44, borderRadius: 10, border: currentSku ? activeBorder : grayBorder, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', position: 'relative', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: currentSku ? '#666EFE' : '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSku?.codeValue || 'Добавить SKU'}</span>
              <div style={{ width: 29, height: 22, flexShrink: 0, position: 'absolute', right: 13 }}>
                <img src={IconCODE1} alt="" style={{ width: 29, height: 22, opacity: currentSku ? 1 : 0.4 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Попап штрихкода */}
      {showBarcodePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 20, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <span style={popupTitleStyle}>Создание штрихкода (QR-кода)</span>
            
            <div style={{ position: 'absolute', top: 64, left: 30 }}>
              <span style={popupLabelStyle}>Данные кода:</span>
              <input 
                type="text" 
                value={barcodeValue} 
                onChange={e => setBarcodeValue(e.target.value)} 
                placeholder="Введите код вручную или отсканируйте" 
                style={popupInputStyle} 
              />
            </div>
            
            <div style={{ position: 'absolute', top: 64 + 17 + 11 + 44 + 30, left: 30 }}>
              <div style={popupPreviewStyle}>
                {barcodeError ? (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#FF3052', textAlign: 'center' }}>{barcodeError}</span>
                ) : barcodePreview ? (
                  <img src={barcodePreview} alt="Штрихкод/QR" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>Штрихкод/QR-код</span>
                )}
              </div>
            </div>
            
            <div style={{ position: 'absolute', top: 64 + 17 + 11 + 44 + 30 + 140 + 30, left: 30 }}>
              <span style={{ ...popupLabelStyle, cursor: 'pointer' }} onClick={() => setBarcodeTypeOpen(!barcodeTypeOpen)}>
                Поменять тип кода:
              </span>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setBarcodeTypeOpen(!barcodeTypeOpen)} style={{ width: 353, height: 44, borderRadius: 10, border: '1px solid #666EFE', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', flex: 1 }}>{CODE_TYPES.find(t => t.value === barcodeType)?.label || 'Выберите тип'}</span>
                  <motion.img src={Icon9} alt="" style={{ width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease', transform: barcodeTypeOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
                </div>
                <AnimatePresence>
                  {barcodeTypeOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 353, maxHeight: 200, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {CODE_TYPES.map(t => (
                        <div key={t.value} onClick={() => { setBarcodeType(t.value); setBarcodeTypeOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: barcodeType === t.value ? '#F0F1FF' : '#FFFFFF', flexShrink: 0 }} onMouseEnter={(e) => { if (barcodeType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }} onMouseLeave={(e) => { if (barcodeType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                          {t.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', gap: 30, alignItems: 'center' }}>
              <button 
                onClick={handleBarcodeSave} 
                disabled={!barcodeValue.trim() || !barcodePreview || !!barcodeError}
                style={{ ...popupButtonStyle(!barcodeValue.trim() || !barcodePreview || !!barcodeError), width: 131 }}
              >
                Сохранить
              </button>
              <button 
                onClick={() => setShowBarcodePopup(false)} 
                style={{ ...popupButtonStyle(false), width: 116 }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Попап SKU */}
      {showSkuPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 20, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <span style={popupTitleStyle}>Создание QR-кода</span>
            
            <div style={{ position: 'absolute', top: 64, left: 30 }}>
              <span style={popupLabelStyle}>Данные кода:</span>
              <input 
                type="text" 
                value={skuValue} 
                onChange={e => setSkuValue(e.target.value)} 
                placeholder="Введите код вручную или отсканируйте" 
                style={popupInputStyle} 
              />
            </div>
            
            <div style={{ position: 'absolute', top: 64 + 17 + 11 + 44 + 30, left: 30 }}>
              <div style={popupPreviewStyle}>
                {skuError ? (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#FF3052', textAlign: 'center' }}>{skuError}</span>
                ) : skuPreview ? (
                  <img src={skuPreview} alt="Штрихкод/QR" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>Штрихкод/QR-код</span>
                )}
              </div>
            </div>
            
            <div style={{ position: 'absolute', top: 64 + 17 + 11 + 44 + 30 + 140 + 30, left: 30 }}>
              <span style={{ ...popupLabelStyle, cursor: 'pointer' }} onClick={() => setSkuTypeOpen(!skuTypeOpen)}>
                Поменять тип кода:
              </span>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setSkuTypeOpen(!skuTypeOpen)} style={{ width: 353, height: 44, borderRadius: 10, border: '1px solid #666EFE', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', flex: 1 }}>{CODE_TYPES.find(t => t.value === skuType)?.label || 'Выберите тип'}</span>
                  <motion.img src={Icon9} alt="" style={{ width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease', transform: skuTypeOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
                </div>
                <AnimatePresence>
                  {skuTypeOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 353, maxHeight: 200, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {CODE_TYPES.map(t => (
                        <div key={t.value} onClick={() => { setSkuType(t.value); setSkuTypeOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: skuType === t.value ? '#F0F1FF' : '#FFFFFF', flexShrink: 0 }} onMouseEnter={(e) => { if (skuType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }} onMouseLeave={(e) => { if (skuType !== t.value) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                          {t.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', gap: 30, alignItems: 'center' }}>
              <button 
                onClick={handleSkuSave} 
                disabled={!skuValue.trim() || !skuPreview || !!skuError}
                style={{ ...popupButtonStyle(!skuValue.trim() || !skuPreview || !!skuError), width: 131 }}
              >
                Сохранить
              </button>
              <button 
                onClick={() => setShowSkuPopup(false)} 
                style={{ ...popupButtonStyle(false), width: 116 }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainTab;