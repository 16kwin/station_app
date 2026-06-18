// SupplierRequisitesTab.tsx — ПОЛНЫЙ ФАЙЛ (все иконки)
import React, { useState, useRef, useEffect } from 'react';
import type { CommonSupplierProps, LocalImageItem } from './SupplierCreatePage';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import Icon11 from '../../../assets/References/NomenclatureCreatePage/Icon11.svg';
import Icon12 from '../../../assets/References/NomenclatureCreatePage/Icon12.svg';
import Icon51 from '../../../assets/References/NomenclatureCreatePage/Icon51.svg';
import Icon52 from '../../../assets/References/NomenclatureCreatePage/Icon52.svg';
import Sup81 from '../../../assets/References/SupplierCreatePage/Sup81.svg';
import Sup82 from '../../../assets/References/SupplierCreatePage/Sup82.svg';
import Sup111 from '../../../assets/References/SupplierCreatePage/Sup111.svg';
import Sup112 from '../../../assets/References/SupplierCreatePage/Sup112.svg';
import Sup211 from '../../../assets/References/SupplierCreatePage/Sup121.svg';
import Sup212 from '../../../assets/References/SupplierCreatePage/Sup122.svg';
import Sup311 from '../../../assets/References/SupplierCreatePage/Sup131.svg';
import Sup312 from '../../../assets/References/SupplierCreatePage/Sup132.svg';
import Sup411 from '../../../assets/References/SupplierCreatePage/Sup141.svg';
import Sup412 from '../../../assets/References/SupplierCreatePage/Sup142.svg';
import Sup511 from '../../../assets/References/SupplierCreatePage/Sup151.svg';
import Sup512 from '../../../assets/References/SupplierCreatePage/Sup152.svg';

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

  const getFieldBorderStyle = (fieldKey: string, isFilled: boolean): string => {
    if (validationErrors.has(fieldKey)) return '2px solid #FF3052';
    if (isFilled) return '1px solid #666EFE';
    return '1px solid rgba(102, 110, 254, 0.15)';
  };

  const fieldH = 44; const TOP = 30; const ROW_GAP = 12; const COL_GAP = 52;
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const BLOCK_H = 565;

  const inputBaseStyle: React.CSSProperties = { 
    height: fieldH, borderRadius: 10, marginTop: 8, 
    display: 'flex', alignItems: 'center', paddingLeft: 13, paddingRight: 12, 
    boxSizing: 'border-box', backgroundColor: '#FFFFFF' 
  };
  const inputStyle: React.CSSProperties = { width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', backgroundColor: 'transparent', marginLeft: 10 };

  const FieldRow = ({ 
    leftKey, leftLabel, leftValue, leftOnChange, leftPlaceholder, leftIconEmpty, leftIconFilled,
    rightKey, rightLabel, rightValue, rightOnChange, rightPlaceholder, rightIconEmpty, rightIconFilled 
  }: any) => (
    <div style={{ display: 'flex', gap: COL_GAP }}>
      <div style={{ flex: 1 }}>
        <span style={labelStyle}>{leftLabel}</span>
        <div style={{ ...inputBaseStyle, border: getFieldBorderStyle(leftKey, !!leftValue.trim()) }}>
          <img src={leftValue.trim() ? leftIconFilled : leftIconEmpty} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          <input style={inputStyle} value={leftValue} onChange={e => { leftOnChange(e.target.value); clearFieldError(leftKey); }} placeholder={leftPlaceholder} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <span style={labelStyle}>{rightLabel}</span>
        <div style={{ ...inputBaseStyle, border: getFieldBorderStyle(rightKey, !!rightValue.trim()) }}>
          <img src={rightValue.trim() ? rightIconFilled : rightIconEmpty} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          <input style={inputStyle} value={rightValue} onChange={e => { rightOnChange(e.target.value); clearFieldError(rightKey); }} placeholder={rightPlaceholder} />
        </div>
      </div>
    </div>
  );

  const rowsHeight = (fieldH + 8 + 20) * 4 + ROW_GAP * 3;

  const displayImages = (localImages && localImages.length > 0) ? localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name })) : images;
  const isLocal = localImages && localImages.length > 0;
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p > 0 ? p - 1 : displayImages.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setLocalSelectedIndex((p: number) => p < displayImages.length - 1 ? p + 1 : 0); };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      <div style={{ ...blockStyle, width: 792, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, right: 30, bottom: 30 }}>
          <div>
            {/* ИНН | КПП */}
            <FieldRow 
              leftKey="inn" leftLabel="ИНН" leftValue={inn} leftOnChange={setInn} leftPlaceholder="ИНН"
              leftIconEmpty={Icon11} leftIconFilled={Icon12}
              rightKey="kpp" rightLabel="КПП" rightValue={kpp} rightOnChange={setKpp} rightPlaceholder="КПП"
              rightIconEmpty={Icon11} rightIconFilled={Icon12}
            />
            {/* ОГРН | Контактное лицо */}
            <div style={{ marginTop: ROW_GAP }}>
              <FieldRow 
                leftKey="ogrn" leftLabel="ОГРН" leftValue={ogrn} leftOnChange={setOgrn} leftPlaceholder="ОГРН"
                leftIconEmpty={Icon11} leftIconFilled={Icon12}
                rightKey="contactPerson" rightLabel="Контактное лицо" rightValue={contactPerson} rightOnChange={setContactPerson} rightPlaceholder="ФИО"
                rightIconEmpty={Sup111} rightIconFilled={Sup112}
              />
            </div>
            {/* Руководитель | Должность конт. лица */}
            <div style={{ marginTop: ROW_GAP }}>
              <FieldRow 
                leftKey="director" leftLabel="Руководитель" leftValue={director} leftOnChange={setDirector} leftPlaceholder="ФИО"
                leftIconEmpty={Sup111} leftIconFilled={Sup112}
                rightKey="contactPosition" rightLabel="Должность конт. лица" rightValue={contactPosition} rightOnChange={setContactPosition} rightPlaceholder="Должность"
                rightIconEmpty={Sup211} rightIconFilled={Sup212}
              />
            </div>
            {/* Должность руководителя | Телефон конт. лица */}
            <div style={{ marginTop: ROW_GAP }}>
              <FieldRow 
                leftKey="directorPosition" leftLabel="Должность руководителя" leftValue={directorPosition} leftOnChange={setDirectorPosition} leftPlaceholder="Должность"
                leftIconEmpty={Sup211} leftIconFilled={Sup212}
                rightKey="contactPhone" rightLabel="Телефон конт. лица" rightValue={contactPhone} rightOnChange={setContactPhone} rightPlaceholder="Телефон"
                rightIconEmpty={Sup81} rightIconFilled={Sup82}
              />
            </div>
          </div>
          {/* Описание */}
          <div style={{ position: 'absolute', top: rowsHeight + 30, left: 0, right: 0, bottom: 0 }}>
            <span style={labelStyle}>Описание</span>
            <div style={{ width: '100%', borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 8, position: 'relative', height: 'calc(100% - 25px)', paddingLeft: 13, paddingTop: 12, boxSizing: 'border-box' }}>
              <img src={description.trim() ? Icon52 : Icon51} alt="" style={{ position: 'absolute', top: 12, left: 13, width: 18, height: 18 }} />
              <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingLeft: 28, paddingRight: 12, paddingTop: 0, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box', position: 'absolute', top: 12, left: 13 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 475, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: TOP, left: 30, right: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Банк */}
          <div><span style={labelStyle}>Банк</span>
            <div style={{ ...inputBaseStyle, border: getFieldBorderStyle('bankName', !!bankName.trim()) }}>
              <img src={bankName.trim() ? Sup312 : Sup311} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <input style={inputStyle} value={bankName} onChange={e => { setBankName(e.target.value); clearFieldError('bankName'); }} placeholder="Наименование банка" />
            </div>
          </div>
          {/* БИК */}
          <div><span style={labelStyle}>БИК</span>
            <div style={{ ...inputBaseStyle, border: getFieldBorderStyle('bik', !!bik.trim()) }}>
              <img src={bik.trim() ? Icon12 : Icon11} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <input style={inputStyle} value={bik} onChange={e => { setBik(e.target.value); clearFieldError('bik'); }} placeholder="БИК" />
            </div>
          </div>
          {/* Корреспондентский счет */}
          <div><span style={labelStyle}>Корреспондентский счет</span>
            <div style={{ ...inputBaseStyle, border: getFieldBorderStyle('correspondentAccount', !!correspondentAccount.trim()) }}>
              <img src={correspondentAccount.trim() ? Sup412 : Sup411} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <input style={inputStyle} value={correspondentAccount} onChange={e => { setCorrespondentAccount(e.target.value); clearFieldError('correspondentAccount'); }} placeholder="Корр. счет" />
            </div>
          </div>
          {/* Расчетный счет */}
          <div><span style={labelStyle}>Расчетный счет</span>
            <div style={{ ...inputBaseStyle, border: getFieldBorderStyle('settlementAccount', !!settlementAccount.trim()) }}>
              <img src={settlementAccount.trim() ? Sup512 : Sup511} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
              <input style={inputStyle} value={settlementAccount} onChange={e => { setSettlementAccount(e.target.value); clearFieldError('settlementAccount'); }} placeholder="Расч. счет" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...blockStyle, width: 413, height: BLOCK_H, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 30 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Логотип</span></div>
        <div style={{ position: 'absolute', top: 49, left: 30, width: 353, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localFileInputRef.current?.click()}>
            <img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {displayImages.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
            {displayImages.length > 0 ? (
              <div onContextMenu={(e) => handleImageContextMenu(e, localSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenImage(true)}><img src={displayImages[localSelectedIndex]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет логотипа</span>}
            {displayImages.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
          </div>
          <div style={{ width: 351, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {displayImages.map((img, idx) => (<div key={idx} onClick={() => setLocalSelectedIndex(idx)} onContextMenu={(e) => handleImageContextMenu(e, idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === localSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}><img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}
          </div>
        </div>
        <input ref={localFileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleLocalImageUpload} />
      </div>

      {contextMenu && (<div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}><button onClick={() => { isLocal ? handleLocalDeleteImage(contextMenu.index) : handleDeleteImage(displayImages[contextMenu.index]?.uid); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button></div>)}
      {fullscreenImage && displayImages[localSelectedIndex]?.url && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onContextMenu={(e) => { e.preventDefault(); handleImageContextMenu(e, localSelectedIndex); }} onClick={() => setFullscreenImage(false)}><img src={displayImages[localSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} /></div>)}
    </div>
  );
};

export default SupplierRequisitesTab;