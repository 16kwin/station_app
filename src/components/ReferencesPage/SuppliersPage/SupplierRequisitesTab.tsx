// SupplierRequisitesTab.tsx — ПОЛНЫЙ ФАЙЛ (с красной обводкой валидации)
import React, { useState, useRef, useEffect } from 'react';
import type { CommonSupplierProps, LocalImageItem } from './SupplierCreatePage';

const SupplierRequisitesTab: React.FC<CommonSupplierProps> = (props) => {
  const {
    inn = '', ogrn = '', kpp = '', contactPerson = '', contactPosition = '', contactPhone = '',
    director = '', directorPosition = '', bankName = '', bik = '', correspondentAccount = '', settlementAccount = '',
    description = '', images = [], localImages = [], setLocalImages = () => {},
    validationErrors = new Set(), setValidationErrors = () => {},
    setInn = () => {}, setOgrn = () => {}, setKpp = () => {}, setContactPerson = () => {},
    setContactPosition = () => {}, setContactPhone = () => {}, setDirector = () => {}, setDirectorPosition = () => {},
    setBankName = () => {}, setBik = () => {}, setCorrespondentAccount = () => {}, setSettlementAccount = () => {},
    setDescription = () => {}, handleDeleteImage = () => {},
  } = props;

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
  const inputStyle: React.CSSProperties = { width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', backgroundColor: 'transparent' };

  const getFieldBorderStyle = (fieldKey: string, isFilled: boolean): string => {
    if (validationErrors.has(fieldKey)) return '2px solid #FF3052';
    if (isFilled) return '1px solid #666EFE';
    return '1px solid rgba(102, 110, 254, 0.15)';
  };

  const fieldH = 40; const TOP = 30; const ROW_GAP = 12; const COL_GAP = 52;
  const fieldBase = (fieldKey: string, value: string): React.CSSProperties => ({ height: fieldH, borderRadius: 10, marginTop: 8, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, boxSizing: 'border-box', backgroundColor: '#FFFFFF', border: getFieldBorderStyle(fieldKey, !!value.trim()) });
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const BLOCK_H = 565;

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };

  const Row = ({ leftKey, leftLabel, leftValue, leftOnChange, leftPlaceholder, rightKey, rightLabel, rightValue, rightOnChange, rightPlaceholder }: any) => (
    <div style={{ display: 'flex', gap: COL_GAP }}>
      <div style={{ flex: 1 }}><span style={labelStyle}>{leftLabel}</span><div style={fieldBase(leftKey, leftValue)}><input style={inputStyle} value={leftValue} onChange={e => { leftOnChange(e.target.value); clearFieldError(leftKey); }} placeholder={leftPlaceholder} /></div></div>
      <div style={{ flex: 1 }}><span style={labelStyle}>{rightLabel}</span><div style={fieldBase(rightKey, rightValue)}><input style={inputStyle} value={rightValue} onChange={e => { rightOnChange(e.target.value); clearFieldError(rightKey); }} placeholder={rightPlaceholder} /></div></div>
    </div>
  );

  const rowsHeight = (fieldH + 8 + 20) * 4 + ROW_GAP * 3;

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      <div style={{ ...blockStyle, width: 792, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, right: 30, bottom: 30 }}>
          <div>
            <Row leftKey="inn" leftLabel="ИНН" leftValue={inn} leftOnChange={setInn} leftPlaceholder="ИНН" rightKey="kpp" rightLabel="КПП" rightValue={kpp} rightOnChange={setKpp} rightPlaceholder="КПП" />
            <div style={{ marginTop: ROW_GAP }}><Row leftKey="ogrn" leftLabel="ОГРН" leftValue={ogrn} leftOnChange={setOgrn} leftPlaceholder="ОГРН" rightKey="contactPerson" rightLabel="Контактное лицо" rightValue={contactPerson} rightOnChange={setContactPerson} rightPlaceholder="ФИО" /></div>
            <div style={{ marginTop: ROW_GAP }}><Row leftKey="director" leftLabel="Руководитель" leftValue={director} leftOnChange={setDirector} leftPlaceholder="ФИО" rightKey="contactPosition" rightLabel="Должность конт. лица" rightValue={contactPosition} rightOnChange={setContactPosition} rightPlaceholder="Должность" /></div>
            <div style={{ marginTop: ROW_GAP }}><Row leftKey="directorPosition" leftLabel="Должность руководителя" leftValue={directorPosition} leftOnChange={setDirectorPosition} leftPlaceholder="Должность" rightKey="contactPhone" rightLabel="Телефон конт. лица" rightValue={contactPhone} rightOnChange={setContactPhone} rightPlaceholder="Телефон" /></div>
          </div>
          <div style={{ position: 'absolute', top: rowsHeight + 10, left: 0, right: 0, bottom: 0 }}>
            <span style={labelStyle}>Описание</span>
            <div style={{ width: '100%', borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 8, position: 'relative', height: 'calc(100% - 25px)' }}>
              <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 475, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, right: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div><span style={labelStyle}>Банк</span><div style={fieldBase('bankName', bankName)}><input style={inputStyle} value={bankName} onChange={e => { setBankName(e.target.value); clearFieldError('bankName'); }} placeholder="Наименование банка" /></div></div>
          <div><span style={labelStyle}>БИК</span><div style={fieldBase('bik', bik)}><input style={inputStyle} value={bik} onChange={e => { setBik(e.target.value); clearFieldError('bik'); }} placeholder="БИК" /></div></div>
          <div><span style={labelStyle}>Корреспондентский счет</span><div style={fieldBase('correspondentAccount', correspondentAccount)}><input style={inputStyle} value={correspondentAccount} onChange={e => { setCorrespondentAccount(e.target.value); clearFieldError('correspondentAccount'); }} placeholder="Корр. счет" /></div></div>
          <div><span style={labelStyle}>Расчетный счет</span><div style={fieldBase('settlementAccount', settlementAccount)}><input style={inputStyle} value={settlementAccount} onChange={e => { setSettlementAccount(e.target.value); clearFieldError('settlementAccount'); }} placeholder="Расч. счет" /></div></div>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 413, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Логотип</span></div>
        <div style={{ position: 'absolute', top: 49, left: 51, width: 311, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}><svg width="21" height="21" viewBox="0 0 21 21" fill="none"><line x1="10.5" y1="4" x2="10.5" y2="17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="10.5" x2="17" y2="10.5" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none" style={{ transform: 'scaleX(-1)' }}><path d="M11 2L3 9.5L11 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
            {displayImages.length > 0 && displayImages[localSelectedIndex]?.url ? (<div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}><img src={displayImages[localSelectedIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет логотипа</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><svg width="13" height="19" viewBox="0 0 13 19" fill="none"><path d="M2 2L10 9.5L2 17" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          </div>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>{displayImages.map((img, idx) => (<div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>{img.url ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</div>))}</div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />
      </div>

      {contextMenu && (<div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}><button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button></div>)}
      {fullscreenImage && displayImages[localSelectedIndex]?.url && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onContextMenu={(e) => { e.preventDefault(); handleImageContextMenu(e, localSelectedIndex); }} onClick={() => setFullscreenImage(false)}><img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} /></div>)}
    </div>
  );
};

export default SupplierRequisitesTab;