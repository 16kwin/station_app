// MainTab.tsx — ПОЛНЫЙ ФАЙЛ (исправлены ошибки типов)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
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
import Icon6 from '../../../assets/References/NomenclatureCreatePage/Icon6.svg';
import IconArt1 from '../../../assets/References/NomenclatureCreatePage/IconArt1.svg';
import IconArt2 from '../../../assets/References/NomenclatureCreatePage/IconArt2.svg';
import IconRating from '../../../assets/References/NomenclatureCreatePage/IconRating.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps, LocalImageItem, LocalCode } from './NomenclatureCreatePage';

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

const BARCODE_TYPES = ['CODE_128', 'EAN_13', 'UPC_A'];
const SKU_TYPES = ['QR_CODE'];
const getBarcodeHint = (type: string): string => { switch (type) { case 'CODE_128': return 'Пример: ABC123456'; case 'EAN_13': return 'Пример: 5901234123457'; case 'UPC_A': return 'Пример: 042100005264'; default: return 'Введите код'; } };
const getSkuHint = (): string => 'Пример: SKU-001-A';

interface ServerCode { uid: string; codeType: string; codeValue: string; codeKind: string; fileUrl: string | null; originalName: string | null; }

const MainTab: React.FC<CommonProps> = (props) => {
  const { uid, code, name, article, description, isEdit, isUploading, images, selectedImageIndex, selectedCatalog, selectedCatalogId, selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen, selectedNomenclatureGroup, selectedNomenclatureGroupId, selectedNomenclatureType, selectedNomenclatureTypeId, usage, wasteMaterial, recycleMaterial, nameFocused, articleFocused, descriptionFocused, fullscreenImage, typeMaterials, setName, setArticle, setDescription, setNameFocused, setArticleFocused, setDescriptionFocused, toggleUsage, toggleWasteMaterial, toggleRecycleMaterial, setSelectedCatalog, setSelectedCatalogId, setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen, setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId, setSelectedNomenclatureType, setSelectedNomenclatureTypeId, setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage, handleImageUpload, handleDeleteImage, openPopup, handleAccountingGroupSelect, localImages, setLocalImages, localBarcodes, setLocalBarcodes, localSkus, setLocalSkus } = props;

  const [averageRating, setAverageRating] = useState(0);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [serverBarcodes, setServerBarcodes] = useState<ServerCode[]>([]);
  const [serverSkus, setServerSkus] = useState<ServerCode[]>([]);

  const currentBarcode = (localBarcodes && localBarcodes[0]) || serverBarcodes[0] || null;
  const currentSku = (localSkus && localSkus[0]) || serverSkus[0] || null;

  const [showBarcodePopup, setShowBarcodePopup] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(''); const [barcodeType, setBarcodeType] = useState('CODE_128');
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null); const [barcodeUploadedFile, setBarcodeUploadedFile] = useState<File | null>(null);
  const [barcodeUploadedPreview, setBarcodeUploadedPreview] = useState<string | null>(null); const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showSkuPopup, setShowSkuPopup] = useState(false);
  const [skuValue, setSkuValue] = useState(''); const [skuType, setSkuType] = useState('QR_CODE');
  const [skuPreview, setSkuPreview] = useState<string | null>(null); const [skuUploadedFile, setSkuUploadedFile] = useState<File | null>(null);
  const [skuUploadedPreview, setSkuUploadedPreview] = useState<string | null>(null); const skuCanvasRef = useRef<HTMLCanvasElement>(null);

  const fetchAverageRating = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)); setAverageRating(Math.round((res.data || 0) * 10) / 10); } catch (e) { console.error(e); } };
  const fetchCodes = async () => { if (!uid) return; try { const res = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid)); const all: ServerCode[] = (res.data || []).map((c: any) => ({ ...c, fileUrl: c.fileUrl ? ConstantInfo.fileDir + c.fileUrl.replace(/^\//, '') : null })); setServerBarcodes(all.filter(c => c.codeKind === 'BARCODE')); setServerSkus(all.filter(c => c.codeKind === 'SKU')); } catch (e) { console.error(e); } };

  useEffect(() => { if (uid && isEdit) { fetchAverageRating(); fetchCodes(); } }, [uid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const imgs: LocalImageItem[] = []; for (let i = 0; i < files.length; i++) { const f = files[i]; imgs.push({ file: f, url: URL.createObjectURL(f) }); } setLocalImages((p: LocalImageItem[]) => [...p, ...imgs]); if (localFileInputRef.current) localFileInputRef.current.value = ''; };
  const handleLocalDeleteImage = (index: number) => { setLocalImages((p: LocalImageItem[]) => { const n = [...p]; URL.revokeObjectURL(n[index].url); n.splice(index, 1); return n; }); if (localSelectedIndex >= (localImages || []).length - 1) setLocalSelectedIndex(Math.max(0, (localImages || []).length - 2)); };
  const handleImageContextMenu = (e: React.MouseEvent, index: number) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, index }); };

  useEffect(() => { if (!barcodeValue.trim() || barcodeUploadedFile) { setBarcodePreview(null); return; } const t = setTimeout(() => { const c = barcodeCanvasRef.current; if (!c) return; try { JsBarcode(c, barcodeValue, { format: barcodeType as any, width: 2, height: 80, displayValue: true, fontSize: 12 }); setBarcodePreview(c.toDataURL('image/png')); } catch { setBarcodePreview(null); } }, 50); return () => clearTimeout(t); }, [barcodeValue, barcodeType, barcodeUploadedFile]);
  useEffect(() => { if (!skuValue.trim() || skuUploadedFile) { setSkuPreview(null); return; } const t = setTimeout(() => { const c = skuCanvasRef.current; if (!c) return; QRCode.toCanvas(c, skuValue, { width: 200, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }).then(() => setSkuPreview(c.toDataURL('image/png'))).catch(() => setSkuPreview(null)); }, 50); return () => clearTimeout(t); }, [skuValue, skuUploadedFile]);

  const handleBarcodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setBarcodeUploadedFile(f); setBarcodeUploadedPreview(URL.createObjectURL(f)); setBarcodePreview(null); };
  const handleSkuFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setSkuUploadedFile(f); setSkuUploadedPreview(URL.createObjectURL(f)); setSkuPreview(null); };
  const clearBarcodeUpload = () => { if (barcodeUploadedPreview) URL.revokeObjectURL(barcodeUploadedPreview); setBarcodeUploadedFile(null); setBarcodeUploadedPreview(null); };
  const clearSkuUpload = () => { if (skuUploadedPreview) URL.revokeObjectURL(skuUploadedPreview); setSkuUploadedFile(null); setSkuUploadedPreview(null); };
  const dataUrlToFile = (dataUrl: string, filename: string): File => { const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)![1]; const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n); while (n--) u8arr[n] = bstr.charCodeAt(n); return new File([u8arr], filename, { type: mime }); };

  const handleBarcodeAdd = () => { if (!barcodeValue.trim()) return; let file: File | null = null; if (barcodeUploadedFile) file = barcodeUploadedFile; else if (barcodePreview) file = dataUrlToFile(barcodePreview, `barcode_${Date.now()}.png`); setLocalBarcodes([{ codeType: barcodeType, codeValue: barcodeValue, codeKind: 'BARCODE', file, preview: barcodeUploadedPreview || barcodePreview }]); setShowBarcodePopup(false); setBarcodeValue(''); setBarcodePreview(null); clearBarcodeUpload(); };
  const handleSkuAdd = () => { if (!skuValue.trim()) return; let file: File | null = null; if (skuUploadedFile) file = skuUploadedFile; else if (skuPreview) file = dataUrlToFile(skuPreview, `sku_${Date.now()}.png`); setLocalSkus([{ codeType: skuType, codeValue: skuValue, codeKind: 'SKU', file, preview: skuUploadedPreview || skuPreview }]); setShowSkuPopup(false); setSkuValue(''); setSkuPreview(null); clearSkuUpload(); };

  const openBarcodePopup = () => { if (currentBarcode) { setBarcodeValue(currentBarcode.codeValue); setBarcodeType(currentBarcode.codeType); } else { setBarcodeValue(''); setBarcodeType('CODE_128'); } setBarcodePreview(null); setBarcodeUploadedFile(null); setBarcodeUploadedPreview(null); setShowBarcodePopup(true); };
  const openSkuPopup = () => { if (currentSku) { setSkuValue(currentSku.codeValue); setSkuType(currentSku.codeType); } else { setSkuValue(''); setSkuType('QR_CODE'); } setSkuPreview(null); setSkuUploadedFile(null); setSkuUploadedPreview(null); setShowSkuPopup(true); };

  const getCurrentBarcodeUrl = () => {
    if (!currentBarcode) return '';
    return (currentBarcode as any).fileUrl || currentBarcode.preview || '';
  };

  const getCurrentSkuUrl = () => {
    if (!currentSku) return '';
    return (currentSku as any).fileUrl || currentSku.preview || '';
  };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const fieldBaseStyle: React.CSSProperties = { width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', position: 'relative' };
  const selectFieldStyle = (hv: boolean): React.CSSProperties => ({ width: 388, height: 44, borderRadius: 10, border: hv ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: hv ? '#666EFE' : '#9CA3AF', cursor: 'pointer', position: 'relative' as const, boxSizing: 'border-box' });
  const arrowIconStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease' };

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}><span style={labelStyle}>Код:</span><div style={{ ...fieldBaseStyle, backgroundColor: '#F5F6FA', border: '1px solid rgba(102, 110, 254, 0.5)', cursor: 'not-allowed' }}><img src={code ? Icon12 : Icon11} alt="" style={{ width: 20, height: 40, position: 'absolute', left: 12 }} /><span style={{ marginLeft: 44, color: '#666EFE', opacity: 0.5 }}>{code || 'Код'}</span></div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Артикул:</span><div style={{ ...fieldBaseStyle, border: (article || articleFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}><img src={article ? IconArt2 : IconArt1} alt="" style={{ width: 20, height: 20, position: 'absolute', left: 13 }} /><input style={{ width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none', marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: article ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={article} onChange={e => setArticle(e.target.value)} onFocus={() => setArticleFocused(true)} onBlur={() => setArticleFocused(false)} placeholder="Артикул" />{article && <button onClick={() => setArticle('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}</div></div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}><span style={labelStyle}>Наименование:</span><div style={{ ...fieldBaseStyle, border: (name || nameFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}><img src={name ? Icon22 : Icon21} alt="" style={{ width: 16, height: 16, position: 'absolute', left: 14 }} /><input style={{ width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none', marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: name ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={name} onChange={e => setName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Введите название" />{name && <button onClick={() => setName('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}</div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Каталог:</span><div style={{ ...fieldBaseStyle, cursor: 'pointer', border: selectedCatalog ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }} onClick={() => openPopup('catalog')}><img src={selectedCatalog ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, position: 'absolute', left: 15 }} /><span style={{ marginLeft: 44, color: selectedCatalog ? '#666EFE' : '#A0A3BD' }}>{selectedCatalog || 'Выберите группу'}</span><button onClick={(e) => { e.stopPropagation(); openPopup('catalog'); }} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={selectedCatalog ? Icon42 : Icon41} alt="Открыть" style={{ width: 18, height: 18 }} /></button></div></div>
        </div>
        <div style={{ position: 'absolute', top: 238, left: 30, right: 30 }}><span style={labelStyle}>Описание:</span><div style={{ width: 732, height: 263, borderRadius: 10, border: (description || descriptionFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}><img src={description ? Icon52 : Icon51} alt="" style={{ width: 16, height: 16, position: 'absolute', top: 15, left: 15 }} /><textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 15, paddingLeft: 44, paddingRight: 40, paddingBottom: 15, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} onFocus={() => setDescriptionFocused(true)} onBlur={() => setDescriptionFocused(false)} placeholder="Введите описание" />{description && <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 15, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}</div></div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}><div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Группа учета:</span></div><div className="accounting-group-dropdown" style={{ position: 'relative' }}><div onClick={() => setAccountingGroupOpen(!accountingGroupOpen)} style={selectFieldStyle(!!selectedAccountingGroup)}><img src={selectedAccountingGroup ? Icon62 : Icon61} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} /><span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF' }}>{selectedAccountingGroup || 'Выбрать группу учета'}</span><motion.img src={Icon9} alt="" style={{ ...arrowIconStyle, transform: accountingGroupOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} /></div><AnimatePresence>{accountingGroupOpen && (<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 388, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>{typeMaterials.map(o => (<div key={o.uid} onClick={() => handleAccountingGroupSelect(o)} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedAccountingGroupId === o.uid ? '#F0F1FF' : '#FFFFFF' }} onMouseEnter={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }} onMouseLeave={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>{o.typeName}</div>))}</motion.div>)}</AnimatePresence></div></div>
        <div style={{ position: 'absolute', top: 145, left: 30, right: 30 }}><div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Группа номенклатуры:</span></div><div onClick={() => openPopup('nomenclatureGroup')} style={{ ...selectFieldStyle(!!selectedNomenclatureGroup), opacity: selectedAccountingGroupId ? 1 : 0.5, cursor: selectedAccountingGroupId ? 'pointer' : 'not-allowed' }}><img src={selectedNomenclatureGroup ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} /><span style={{ marginLeft: 15.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedNomenclatureGroup ? '#666EFE' : '#9CA3AF' }}>{selectedNomenclatureGroup || (selectedAccountingGroupId ? 'Выбрать группу' : 'Сначала выберите группу учета')}</span><img src={selectedNomenclatureGroup ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /></div></div>
        <div style={{ position: 'absolute', top: 250, left: 30, right: 30 }}><div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Вид номенклатуры:</span></div><div onClick={() => openPopup('nomenclatureType')} style={{ ...selectFieldStyle(!!selectedNomenclatureType), opacity: selectedNomenclatureGroupId ? 1 : 0.5, cursor: selectedNomenclatureGroupId ? 'pointer' : 'not-allowed' }}><img src={selectedNomenclatureType ? Icon72 : Icon71} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} /><span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedNomenclatureType ? '#666EFE' : '#9CA3AF' }}>{selectedNomenclatureType || (selectedNomenclatureGroupId ? 'Выбрать вид' : 'Сначала выберите группу номенклатуры')}</span><img src={selectedNomenclatureType ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /></div></div>
        <div style={{ position: 'absolute', top: 345, left: 30 }}><div onClick={toggleUsage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span><ToggleSwitch value={usage} onChange={toggleUsage} /></div><div onClick={toggleWasteMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span><ToggleSwitch value={wasteMaterial} onChange={toggleWasteMaterial} /></div><div onClick={toggleRecycleMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span><ToggleSwitch value={recycleMaterial} onChange={toggleRecycleMaterial} /></div></div>
        <div style={{ position: 'absolute', top: 448, left: 30, right: 30 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Рейтинг номенклатуры:</span><button onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 7 } }))} style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={IconRating} alt="Рейтинг" style={{ width: 18, height: 18 }} /></button></div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><StarRatingSmall value={averageRating} size={18} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>{averageRating}</span></div></div>
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Изображение</span></div>
        <div style={{ position: 'absolute', top: 49, left: 51, width: 311, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}><img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
            {displayImages.length > 0 ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}><img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>{isUploading ? 'Загрузка...' : 'Нет изображений'}</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
          </div>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (<div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}><img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />

        <div style={{ position: 'absolute', top: 380, left: 51, right: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Штрихкод:</span>
          <div onClick={openBarcodePopup} style={{ width: 311, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10, overflow: 'hidden' }}>
            {currentBarcode ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>{currentBarcode.codeValue}</span> : <><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#666EFE" strokeWidth="2"/><line x1="5" y1="6" x2="5" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="5" x2="9" y2="13" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="6" x2="13" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>Добавить штрихкод</span></>}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 465, left: 51, right: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>SKU:</span>
          <div onClick={openSkuPopup} style={{ width: 311, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10, overflow: 'hidden' }}>
            {currentSku ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>{currentSku.codeValue}</span> : <><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#666EFE" strokeWidth="2"/><line x1="5" y1="6" x2="5" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="5" x2="9" y2="13" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="6" x2="13" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>Добавить SKU</span></>}
          </div>
        </div>
      </div>

      <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} /><canvas ref={skuCanvasRef} style={{ display: 'none' }} />

      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button>
        </div>
      )}

      {showBarcodePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowBarcodePopup(false); clearBarcodeUpload(); }}>
          <div style={{ width: 500, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Штрихкод</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип штрихкода</label><select value={barcodeType} onChange={e => setBarcodeType(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>{BARCODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Код</label><input type="text" value={barcodeValue} onChange={e => setBarcodeValue(e.target.value)} placeholder={getBarcodeHint(barcodeType)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>{getBarcodeHint(barcodeType)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#F5F6FA', borderRadius: 10, minHeight: 100 }}>
              {barcodeUploadedPreview ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}><img src={barcodeUploadedPreview} alt="" style={{ maxWidth: '100%', maxHeight: 80 }} /><button onClick={clearBarcodeUpload} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF3052', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></button></div>)
              : currentBarcode && !barcodePreview ? (<img src={getCurrentBarcodeUrl()} alt="Штрихкод" style={{ maxWidth: '100%', maxHeight: 80 }} />)
              : barcodePreview ? (<img src={barcodePreview} alt="Штрихкод" style={{ maxWidth: '100%', maxHeight: 80 }} />)
              : (<span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Введите код или загрузите изображение</span>)}
            </div>
            <div style={{ display: 'flex', gap: 10 }}><label style={{ height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Загрузить изображение<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBarcodeFileUpload} /></label></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => { setShowBarcodePopup(false); clearBarcodeUpload(); }} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button><button onClick={handleBarcodeAdd} disabled={!barcodeValue.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: barcodeValue.trim() ? '#666EFE' : '#BCC8FF', cursor: barcodeValue.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{currentBarcode ? 'Обновить' : 'Добавить'}</button></div>
          </div>
        </div>
      )}

      {showSkuPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowSkuPopup(false); clearSkuUpload(); }}>
          <div style={{ width: 500, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>SKU</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Тип кода</label><select value={skuType} onChange={e => setSkuType(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>{SKU_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Код</label><input type="text" value={skuValue} onChange={e => setSkuValue(e.target.value)} placeholder={getSkuHint()} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>{getSkuHint()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#F5F6FA', borderRadius: 10, minHeight: 120 }}>
              {skuUploadedPreview ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}><img src={skuUploadedPreview} alt="" style={{ maxWidth: 120, maxHeight: 120 }} /><button onClick={clearSkuUpload} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF3052', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></button></div>)
              : currentSku && !skuPreview ? (<img src={getCurrentSkuUrl()} alt="QR-код" style={{ width: 120, height: 120 }} />)
              : skuPreview ? (<img src={skuPreview} alt="QR-код" style={{ width: 120, height: 120 }} />)
              : (<span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Введите код или загрузите изображение</span>)}
            </div>
            <div style={{ display: 'flex', gap: 10 }}><label style={{ height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>Загрузить изображение<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSkuFileUpload} /></label></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => { setShowSkuPopup(false); clearSkuUpload(); }} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button><button onClick={handleSkuAdd} disabled={!skuValue.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: skuValue.trim() ? '#666EFE' : '#BCC8FF', cursor: skuValue.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{currentSku ? 'Обновить' : 'Добавить'}</button></div>
          </div>
        </div>
      )}

      {fullscreenImage && displayImages[localSelectedIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onContextMenu={(e) => { e.preventDefault(); handleImageContextMenu(e, localSelectedIndex); }} onClick={() => setFullscreenImage(false)}>
          <img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default MainTab;