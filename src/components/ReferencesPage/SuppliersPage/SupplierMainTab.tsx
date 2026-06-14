// SupplierMainTab.tsx — ПОЛНЫЙ ФАЙЛ (новая раскладка)
import React, { useState, useEffect, useRef } from 'react';
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
  const { uid, code, name, isEdit, nameFocused, selectedCountry, selectedCountryId, address, selectedShortDescription, selectedShortDescriptionId, description, email, website, phone, selectedBrand, selectedBrandId, averageRating, images, localImages, setLocalImages, validationErrors, setValidationErrors, setName, setNameFocused, setAddress, setDescription, setEmail, setWebsite, setPhone, handleDeleteImage, openPopup } = props;

  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const imgs: LocalImageItem[] = []; for (let i = 0; i < files.length; i++) { const f = files[i]; imgs.push({ file: f, url: URL.createObjectURL(f) }); } setLocalImages((p: LocalImageItem[]) => [...p, ...imgs]); if (localFileInputRef.current) localFileInputRef.current.value = ''; };
  const handleLocalDeleteImage = (index: number) => { setLocalImages((p: LocalImageItem[]) => { const n = [...p]; URL.revokeObjectURL(n[index].url); n.splice(index, 1); return n; }); if (localSelectedIndex >= (localImages || []).length - 1) setLocalSelectedIndex(Math.max(0, (localImages || []).length - 2)); };
  const handleImageContextMenu = (e: React.MouseEvent, index: number) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, index }); };

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const fieldBaseStyle: React.CSSProperties = { width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', border: '1px solid rgba(102, 110, 254, 0.15)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', backgroundColor: 'transparent' };
  const selectStyle = (isFilled: boolean): React.CSSProperties => ({ width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', position: 'relative', boxSizing: 'border-box', backgroundColor: '#FFFFFF', border: isFilled ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', color: isFilled ? '#666EFE' : '#9CA3AF' });

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        {/* Верхний ряд: Код + Наименование */}
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30, display: 'flex', gap: 52 }}>
          <div>
            <span style={labelStyle}>Код:</span>
            <div style={{ ...fieldBaseStyle, backgroundColor: '#F5F6FA', border: '1px solid rgba(102, 110, 254, 0.5)', cursor: 'not-allowed' }}>
              <span style={{ marginLeft: 0, color: '#666EFE', opacity: 0.5 }}>{code || 'Код'}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Наименование:</span>
            <div style={{ ...fieldBaseStyle, width: '100%' }}>
              <input style={inputStyle} value={name} onChange={e => { setName(e.target.value); clearFieldError('name'); }} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Введите название" />
            </div>
          </div>
        </div>

        {/* Второй ряд: Страна (слева) + Адрес (справа) */}
        <div style={{ position: 'absolute', top: 155, left: 30, right: 30, display: 'flex', gap: 52 }}>
          <div>
            <span style={labelStyle}>Страна:</span>
            <div onClick={() => openPopup('country')} style={selectStyle(!!selectedCountryId)}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCountry || 'Выберите страну'}</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Адрес:</span>
            <div style={{ ...fieldBaseStyle, width: '100%' }}>
              <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Введите адрес" />
            </div>
          </div>
        </div>

        {/* Третий ряд: Краткое описание (слева) */}
        <div style={{ position: 'absolute', top: 230, left: 30 }}>
          <span style={labelStyle}>Краткое описание:</span>
          <div onClick={() => openPopup('shortDescription')} style={selectStyle(!!selectedShortDescriptionId)}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedShortDescription || 'Выберите тип'}</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* Описание — под всеми полями */}
        <div style={{ position: 'absolute', top: 320, left: 30, right: 30 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: '100%', height: 200, borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}>
          <span style={labelStyle}>Email:</span>
          <div style={{ ...fieldBaseStyle, width: '100%' }}>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Введите email" />
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Сайт:</span>
            <div style={{ ...fieldBaseStyle, width: '100%' }}>
              <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} placeholder="Введите сайт" />
            </div>
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Телефон:</span>
            <div style={{ ...fieldBaseStyle, width: '100%' }}>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Введите телефон" />
            </div>
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Бренд:</span>
            <div onClick={() => openPopup('brand')} style={{ ...selectStyle(!!selectedBrandId), width: '100%' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedBrand || 'Выберите бренд'}</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7L9 12L14 7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

      {/* ПРАВЫЙ БЛОК — логотип */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Логотип</span></div>
        <div style={{ position: 'absolute', top: 49, left: 51, width: 311, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}>
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none"><line x1="10.5" y1="4" x2="10.5" y2="17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="10.5" x2="17" y2="10.5" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none" style={{ transform: 'scaleX(-1)' }}><path d="M11 2L3 9.5L11 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
            {displayImages.length > 0 && displayImages[localSelectedIndex]?.url ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}>
                <img src={displayImages[localSelectedIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет логотипа</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none"><path d="M2 2L10 9.5L2 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          </div>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (
              <div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                {img.url ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
            ))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button>
        </div>
      )}

      {fullscreenImage && displayImages[localSelectedIndex]?.url && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onContextMenu={(e) => { e.preventDefault(); handleImageContextMenu(e, localSelectedIndex); }} onClick={() => setFullscreenImage(false)}>
          <img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default SupplierMainTab;