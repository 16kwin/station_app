// SupplierMainTab.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useRef } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonSupplierProps, LocalImageItem } from './SupplierCreatePage';

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

const SupplierMainTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid, code, name, isEdit, nameFocused, selectedCountry, selectedCountryId, address, selectedShortDescription, selectedShortDescriptionId, description, email, website, phone, selectedBrand, selectedBrandId, averageRating, countries, brands, shortDescriptions, images, localImages, setLocalImages, isDataSaved, validationErrors, setValidationErrors, setName, setNameFocused, setSelectedCountry, setSelectedCountryId, setAddress, setSelectedShortDescription, setSelectedShortDescriptionId, setDescription, setEmail, setWebsite, setPhone, setSelectedBrand, setSelectedBrandId, setImages, handleDeleteImage, fetchAverageRating } = props;

  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [shortDescOpen, setShortDescOpen] = useState(false);

  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const imgs: LocalImageItem[] = []; for (let i = 0; i < files.length; i++) { const f = files[i]; imgs.push({ file: f, url: URL.createObjectURL(f) }); } setLocalImages((p: LocalImageItem[]) => [...p, ...imgs]); if (localFileInputRef.current) localFileInputRef.current.value = ''; };
  const handleLocalDeleteImage = (index: number) => { setLocalImages((p: LocalImageItem[]) => { const n = [...p]; URL.revokeObjectURL(n[index].url); n.splice(index, 1); return n; }); if (localSelectedIndex >= (localImages || []).length - 1) setLocalSelectedIndex(Math.max(0, (localImages || []).length - 2)); };
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

  const fieldBaseStyle: React.CSSProperties = { width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box' };

  const selectBaseStyle: React.CSSProperties = { width: 388, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', position: 'relative' as const, boxSizing: 'border-box', backgroundColor: '#FFFFFF' };

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}>
          <span style={labelStyle}>Код:</span>
          <div style={{ ...fieldBaseStyle, backgroundColor: '#F5F6FA', border: '1px solid rgba(102, 110, 254, 0.5)', cursor: 'not-allowed' }}>
            <span style={{ marginLeft: 12, color: '#666EFE', opacity: 0.5 }}>{code || 'Код'}</span>
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Наименование:</span>
            <div style={{ ...fieldBaseStyle, border: getFieldBorderStyle('name', !!name.trim(), nameFocused) }}>
              <input style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: name ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={name} onChange={e => { setName(e.target.value); clearFieldError('name'); }} onFocus={() => { setNameFocused(true); clearFieldError('name'); }} onBlur={() => setNameFocused(false)} placeholder="Введите название" />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}>
          <span style={labelStyle}>Страна:</span>
          <div style={{ position: 'relative' }}>
            <div onClick={() => setCountryOpen(!countryOpen)} style={{ ...selectBaseStyle, border: getSelectBorderStyle('country', !!selectedCountryId) }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedCountry ? '#666EFE' : '#9CA3AF' }}>{selectedCountry || 'Выберите страну'}</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: countryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {countryOpen && (
              <div style={{ position: 'absolute', top: 48, left: 0, width: 388, maxHeight: 200, overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                {countries.map(c => (
                  <div key={c.uid} onClick={() => { setSelectedCountry(c.name); setSelectedCountryId(c.uid); setCountryOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedCountryId === c.uid ? '#F0F1FF' : '#FFFFFF' }}>{c.name}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Бренд:</span>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setBrandOpen(!brandOpen)} style={{ ...selectBaseStyle, border: getSelectBorderStyle('brand', !!selectedBrandId) }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedBrand ? '#666EFE' : '#9CA3AF' }}>{selectedBrand || 'Выберите бренд'}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: brandOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {brandOpen && (
                <div style={{ position: 'absolute', top: 48, left: 0, width: 388, maxHeight: 200, overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                  {brands.map(b => (
                    <div key={b.uid} onClick={() => { setSelectedBrand(b.name); setSelectedBrandId(b.uid); setBrandOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedBrandId === b.uid ? '#F0F1FF' : '#FFFFFF' }}>{b.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 238, left: 30, right: 30 }}>
          <span style={labelStyle}>Адрес:</span>
          <div style={{ ...fieldBaseStyle, width: 732, border: getFieldBorderStyle('address', !!address.trim(), false) }}>
            <input style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: address ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Введите адрес" />
          </div>
          <div style={{ marginTop: 15 }}>
            <span style={labelStyle}>Краткое описание:</span>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShortDescOpen(!shortDescOpen)} style={{ ...selectBaseStyle, width: 732, border: getSelectBorderStyle('shortDescription', !!selectedShortDescriptionId) }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedShortDescription ? '#666EFE' : '#9CA3AF' }}>{selectedShortDescription || 'Выберите тип'}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: shortDescOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {shortDescOpen && (
                <div style={{ position: 'absolute', top: 48, left: 0, width: 732, maxHeight: 200, overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                  {shortDescriptions.map(d => (
                    <div key={d.uid} onClick={() => { setSelectedShortDescription(d.name); setSelectedShortDescriptionId(d.uid); setShortDescOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedShortDescriptionId === d.uid ? '#F0F1FF' : '#FFFFFF' }}>{d.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 15 }}>
            <span style={labelStyle}>Описание:</span>
            <div style={{ width: 732, height: 100, borderRadius: 10, border: (description || false) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
              <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 12, paddingLeft: 14, paddingRight: 14, paddingBottom: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
            </div>
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}>
          <span style={labelStyle}>Email:</span>
          <div style={{ ...fieldBaseStyle, width: 415, border: email ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}>
            <input style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: email ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={email} onChange={e => setEmail(e.target.value)} placeholder="Введите email" />
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Сайт:</span>
            <div style={{ ...fieldBaseStyle, width: 415, border: website ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}>
              <input style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: website ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={website} onChange={e => setWebsite(e.target.value)} placeholder="Введите сайт" />
            </div>
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Телефон:</span>
            <div style={{ ...fieldBaseStyle, width: 415, border: phone ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}>
              <input style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: phone ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Введите телефон" />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 448, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Рейтинг:</span>
            <button onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 5 } }))} style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L11.39 6.53L17.18 7.27L12.92 11.37L14.09 17.23L9 14.25L3.91 17.23L5.08 11.37L0.82 7.27L6.61 6.53L9 1Z" fill="#666EFE" stroke="#666EFE" strokeWidth="1"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <StarRatingSmall value={averageRating || 0} size={18} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>{averageRating || 0}</span>
          </div>
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК — изображения */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Изображение</span></div>
        <div style={{ position: 'absolute', top: 49, left: 51, width: 311, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}>
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none"><line x1="10.5" y1="4" x2="10.5" y2="17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="10.5" x2="17" y2="10.5" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none" style={{ transform: 'scaleX(-1)' }}><path d="M11 2L3 9.5L11 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
            {displayImages.length > 0 ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет изображений</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none"><path d="M2 2L10 9.5L2 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          </div>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (<div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}><img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button>
        </div>
      )}
    </div>
  );
};

export default SupplierMainTab;