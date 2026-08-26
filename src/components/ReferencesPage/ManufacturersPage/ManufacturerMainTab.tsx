import React, { useState, useRef, useEffect } from 'react';
import type { CommonManufacturerProps, LocalManufacturerImage } from './ManufacturerCreatePage';
import Icon8 from '../../../assets/References/NomenclatureCreatePage/Icon8.svg';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';
import Icon11 from '../../../assets/References/NomenclatureCreatePage/Icon11.svg';
import Icon12 from '../../../assets/References/NomenclatureCreatePage/Icon12.svg';
import Icon51 from '../../../assets/References/NomenclatureCreatePage/Icon51.svg';
import Icon52 from '../../../assets/References/NomenclatureCreatePage/Icon52.svg';
import Sup11 from '../../../assets/References/SupplierCreatePage/Sup11.svg';
import Sup12 from '../../../assets/References/SupplierCreatePage/Sup12.svg';
import Sup21 from '../../../assets/References/SupplierCreatePage/Sup21.svg';
import Sup22 from '../../../assets/References/SupplierCreatePage/Sup22.svg';
import Sup31 from '../../../assets/References/SupplierCreatePage/Sup31.svg';
import Sup32 from '../../../assets/References/SupplierCreatePage/Sup32.svg';
import Sup41 from '../../../assets/References/SupplierCreatePage/Sup41.svg';
import Sup42 from '../../../assets/References/SupplierCreatePage/Sup42.svg';
import Sup61 from '../../../assets/References/SupplierCreatePage/Sup61.svg';
import Sup62 from '../../../assets/References/SupplierCreatePage/Sup62.svg';
import Sup71 from '../../../assets/References/SupplierCreatePage/Sup71.svg';
import Sup72 from '../../../assets/References/SupplierCreatePage/Sup72.svg';
import Sup81 from '../../../assets/References/SupplierCreatePage/Sup81.svg';
import Sup82 from '../../../assets/References/SupplierCreatePage/Sup82.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

const ManufacturerMainTab: React.FC<CommonManufacturerProps> = (props) => {
  const {
    code,
    name = '',
    nameFocused = false,
    selectedCountry = '',
    selectedCountryId = '',
    address = '',
    selectedDirection = '',
    selectedDirectionId = '',
    description = '',
    email = '',
    website = '',
    phone = '',
    validationErrors = new Set(),
    setValidationErrors = () => {},
    setName = () => {},
    setNameFocused = () => {},
    setAddress = () => {},
    setDescription = () => {},
    setEmail = () => {},
    setWebsite = () => {},
    setPhone = () => {},
    openPopup = () => {},
    uid,
    isEdit,
    images = [],
    setImages = () => {},
    localImages = [],
    setLocalImages = () => {},
  } = props;

  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const fetchImages = async () => {
    if (!uid) return;
    try {
      const res = await AxiosService.get(ConstantInfo.restApiManufacturerImages(uid));
      setImages((res.data || []).map((img: any) => ({ uid: img.uid, url: img.fileUrl ? ConstantInfo.fileDir + img.fileUrl.replace(/^\//, '') : '', originalName: img.originalName || '' })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (uid && isEdit) fetchImages(); }, [uid, isEdit]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = e.target.files; 
    if (!files) return; 
    const imgs: LocalManufacturerImage[] = []; 
    for (let i = 0; i < files.length; i++) { 
      const f = files[i]; 
      imgs.push({ file: f, url: URL.createObjectURL(f) }); 
    } 
    setLocalImages((p: LocalManufacturerImage[]) => [...p, ...imgs]); 
    if (localFileInputRef.current) localFileInputRef.current.value = ''; 
  };

  const handleLocalDeleteImage = (index: number) => { 
    setLocalImages((p: LocalManufacturerImage[]) => { 
      const n = [...p]; 
      URL.revokeObjectURL(n[index].url); 
      n.splice(index, 1); 
      return n; 
    }); 
    if (localSelectedIndex >= (localImages || []).length - 1) setLocalSelectedIndex(Math.max(0, (localImages || []).length - 2)); 
  };

  const handleDeleteServerImage = async (imageUid: string) => {
    try {
      await AxiosService.delete(ConstantInfo.restApiManufacturerDeleteImage(imageUid));
      await fetchImages();
    } catch (e) { console.error(e); }
  };

  const handleImageContextMenu = (e: React.MouseEvent, index: number) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, index }); };

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };

  const getFieldBorderStyle = (fieldKey: string, isFilled: boolean, isFocused: boolean): string => {
    if (validationErrors.has(fieldKey) && !isFocused) return '2px solid #FF3052';
    if (isFilled || isFocused) return '1px solid #666EFE';
    return '1px solid rgba(102, 110, 254, 0.15)';
  };

  const getSelectBorderStyle = (fieldKey: string, isFilled: boolean): string => {
    if (validationErrors.has(fieldKey)) return '2px solid #FF3052';
    if (isFilled) return '1px solid #666EFE';
    return '1px solid rgba(102, 110, 254, 0.15)';
  };

  const fieldH = 44; const GAP = 12; const TOP = 28; const COL_W = 340;
  
  const fieldBase = (w: number | string): React.CSSProperties => ({ 
    width: w, height: fieldH, borderRadius: 10, marginTop: 8, 
    display: 'flex', alignItems: 'center', paddingLeft: 13, paddingRight: 12, 
    boxSizing: 'border-box', backgroundColor: '#FFFFFF', position: 'relative' 
  });
  
  const selectBase = (w: number | string): React.CSSProperties => ({
    width: w, height: fieldH, borderRadius: 10, marginTop: 8,
    display: 'flex', alignItems: 'center', paddingLeft: 13, paddingRight: 13,
    boxSizing: 'border-box', backgroundColor: '#FFFFFF', cursor: 'pointer',
    position: 'relative'
  });

  const inputStyle: React.CSSProperties = { 
    width: '100%', height: '100%', border: 'none', outline: 'none', 
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, 
    color: '#666EFE', backgroundColor: 'transparent', marginLeft: 10 
  };

  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const BLOCK_H = 565;

  const displayImages = (localImages && localImages.length > 0) 
    ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) 
    : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: BLOCK_H, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, width: COL_W }}>
          <span style={labelStyle}>Код</span>
          <div style={{ ...fieldBase(COL_W), backgroundColor: '#F5F6FA', border: '1px solid rgba(102, 110, 254, 0.5)', cursor: 'not-allowed' }}>
            <img src={Icon11} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ marginLeft: 10, color: '#666EFE', opacity: 0.5, fontSize: 14 }}>{code || '—'}</span>
          </div>
          <div style={{ marginTop: GAP }}>
            <span style={labelStyle}>Страна</span>
            <div onClick={() => { clearFieldError('country'); openPopup('country'); }} style={{ ...selectBase(COL_W), border: getSelectBorderStyle('country', !!selectedCountryId) }}>
              <img src={selectedCountryId ? Sup22 : Sup21} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedCountryId ? '#666EFE' : '#9CA3AF' }}>{selectedCountry || 'Выберите страну'}</span>
              <img src={selectedCountryId ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            </div>
          </div>
          <div style={{ marginTop: GAP }}>
            <span style={labelStyle}>Направление производства</span>
            <div onClick={() => { clearFieldError('direction'); openPopup('direction'); }} style={{ ...selectBase(COL_W), border: getSelectBorderStyle('direction', !!selectedDirectionId) }}>
              <img src={selectedDirectionId ? Sup32 : Sup31} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedDirectionId ? '#666EFE' : '#9CA3AF' }}>{selectedDirection || 'Выберите направление'}</span>
              <img src={selectedDirectionId ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: TOP, right: 52, width: COL_W }}>
          <span style={labelStyle}>Наименование</span>
          <div style={{ ...fieldBase(COL_W), border: getFieldBorderStyle('name', !!name.trim(), nameFocused) }}>
            <img src={name.trim() ? Sup12 : Sup11} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <input style={inputStyle} value={name} onChange={e => { setName(e.target.value); clearFieldError('name'); }} onFocus={() => { setNameFocused(true); clearFieldError('name'); }} onBlur={() => setNameFocused(false)} placeholder="Введите название" />
          </div>
          <div style={{ marginTop: GAP }}>
            <span style={labelStyle}>Адрес</span>
            <div style={{ ...fieldBase(COL_W), height: 100, alignItems: 'flex-start', paddingTop: 10, border: getFieldBorderStyle('address', !!address.trim(), false) }}>
              <img src={address.trim() ? Sup42 : Sup41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: address ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', marginLeft: 10 }} value={address} onChange={e => { setAddress(e.target.value); clearFieldError('address'); }} placeholder="Введите адрес" />
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 278, left: 30, right: 30, bottom: 30 }}>
          <span style={labelStyle}>Описание</span>
          <div style={{ width: '100%', borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 8, height: 'calc(100% - 25px)', position: 'relative', paddingLeft: 13, paddingTop: 12, boxSizing: 'border-box' }}>
            <img src={description.trim() ? Icon52 : Icon51} alt="" style={{ position: 'absolute', top: 12, left: 13, width: 18, height: 18 }} />
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingLeft: 28, paddingRight: 12, paddingTop: 0, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Email</span>
          </div>
          <div style={{ ...fieldBase('100%'), border: getFieldBorderStyle('email', !!email.trim(), false) }}>
            <img src={email.trim() ? Sup62 : Sup61} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <input style={inputStyle} value={email} onChange={e => { setEmail(e.target.value); clearFieldError('email'); }} placeholder="Введите email" />
          </div>
          
          <div style={{ marginTop: 25, display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Сайт</span>
          </div>
          <div style={{ ...fieldBase('100%'), border: getFieldBorderStyle('website', !!website.trim(), false) }}>
            <img src={website.trim() ? Sup72 : Sup71} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <input style={inputStyle} value={website} onChange={e => { setWebsite(e.target.value); clearFieldError('website'); }} placeholder="Введите сайт" />
          </div>
          
          <div style={{ marginTop: 25, display: 'flex', alignItems: 'center' }}>
            <img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ ...labelStyle, marginLeft: 9 }}>Телефон</span>
          </div>
          <div style={{ ...fieldBase('100%'), border: getFieldBorderStyle('phone', !!phone.trim(), false) }}>
            <img src={phone.trim() ? Sup82 : Sup81} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
            <input style={inputStyle} value={phone} onChange={e => { setPhone(e.target.value); clearFieldError('phone'); }} placeholder="Введите телефон" />
          </div>
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК — ЛОГОТИП */}
      <div style={{ ...blockStyle, width: 413, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 30 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Логотип</span></div>
        <div style={{ position: 'absolute', top: 49, left: 30, width: 353, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}>
            <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
            {displayImages.length > 0 ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}>
                <img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет логотипа</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
          </div>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (
              <div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteServerImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button>
        </div>
      )}
      
      {fullscreenImage && displayImages[localSelectedIndex]?.url && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenImage(false)}>
          <img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default ManufacturerMainTab;