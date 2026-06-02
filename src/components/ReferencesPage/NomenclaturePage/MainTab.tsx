// MainTab.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import type { CommonProps } from './NomenclatureCreatePage';

const ToggleSwitch = React.memo(({ value, onChange }: { value: boolean; onChange: () => void }) => {
  const trackWidth = 26;
  const trackHeight = 13;
  const knobSize = 11;
  const padding = (trackHeight - knobSize) / 2;
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} style={{ width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: value ? '#666EFE' : 'rgba(45, 64, 89, 0.44)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background-color 0.3s ease' }}>
      <motion.div initial={false} animate={{ x: value ? trackWidth - knobSize - padding * 2 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }} style={{ width: knobSize, height: knobSize, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: padding, left: padding }} />
    </div>
  );
});

const MainTab: React.FC<CommonProps> = (props) => {
  const {
    uid, code, name, article, description, isEdit, isUploading, isUploadingBarcode,
    barcode, barcodeCode, barcodeImage, images, selectedImageIndex,
    selectedCatalog, selectedCatalogId,
    selectedAccountingGroup, selectedAccountingGroupId, accountingGroupOpen,
    selectedNomenclatureGroup, selectedNomenclatureGroupId,
    selectedNomenclatureType, selectedNomenclatureTypeId,
    usage, wasteMaterial, recycleMaterial,
    nameFocused, articleFocused, descriptionFocused,
    showBarcodePopup, fullscreenImage,
    typeMaterials, fileInputRef, barcodeImageInputRef,
    setName, setArticle, setDescription,
    setNameFocused, setArticleFocused, setDescriptionFocused,
    toggleUsage, toggleWasteMaterial, toggleRecycleMaterial,
    setSelectedCatalog, setSelectedCatalogId,
    setSelectedAccountingGroup, setSelectedAccountingGroupId, setAccountingGroupOpen,
    setSelectedNomenclatureGroup, setSelectedNomenclatureGroupId,
    setSelectedNomenclatureType, setSelectedNomenclatureTypeId,
    setImages, setSelectedImageIndex, setIsUploading, setFullscreenImage,
    setBarcode, setShowBarcodePopup, setBarcodeImage, setBarcodeCode, setIsUploadingBarcode,
    handleImageUpload, handleDeleteImage,
    fetchBarcodeData, handleBarcodeSave, handleBarcodeImageUpload, handleDeleteBarcodeImage,
    openPopup, handleAccountingGroupSelect,
  } = props;

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const fieldBaseStyle: React.CSSProperties = { width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', position: 'relative' };
  const selectFieldStyle = (hv: boolean): React.CSSProperties => ({ width: 388, height: 44, borderRadius: 10, border: hv ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: hv ? '#666EFE' : '#9CA3AF', cursor: 'pointer', position: 'relative' as const, boxSizing: 'border-box' });
  const arrowIconStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0, transition: 'transform 0.3s ease' };

  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedImageIndex((p: number) => p > 0 ? p - 1 : images.length - 1); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedImageIndex((p: number) => p < images.length - 1 ? p + 1 : 0); };

  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}>
          <span style={labelStyle}>Код:</span>
          <div style={{ ...fieldBaseStyle, backgroundColor: '#F5F6FA', border: '1px solid rgba(102, 110, 254, 0.5)', cursor: 'not-allowed' }}>
            <img src={code ? Icon12 : Icon11} alt="" style={{ width: 20, height: 40, position: 'absolute', left: 12 }} />
            <span style={{ marginLeft: 44, color: '#666EFE', opacity: 0.5 }}>{code || 'Код'}</span>
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Артикул:</span>
            <div style={{ ...fieldBaseStyle, border: (article || articleFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}>
              <img src={article ? Icon12 : Icon11} alt="" style={{ width: 20, height: 40, position: 'absolute', left: 12 }} />
              <input style={{ width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none', marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: article ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={article} onChange={e => setArticle(e.target.value)} onFocus={() => setArticleFocused(true)} onBlur={() => setArticleFocused(false)} placeholder="Артикул" />
              {article && <button onClick={() => setArticle('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}>
          <span style={labelStyle}>Наименование:</span>
          <div style={{ ...fieldBaseStyle, border: (name || nameFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }}>
            <img src={name ? Icon22 : Icon21} alt="" style={{ width: 16, height: 16, position: 'absolute', left: 14 }} />
            <input style={{ width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none', marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: name ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent' }} value={name} onChange={e => setName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Введите название" />
            {name && <button onClick={() => setName('')} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}
          </div>
          <div style={{ marginTop: 25 }}>
            <span style={labelStyle}>Каталог:</span>
            <div style={{ ...fieldBaseStyle, cursor: 'pointer', border: selectedCatalog ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)' }} onClick={() => openPopup('catalog')}>
              <img src={selectedCatalog ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, position: 'absolute', left: 15 }} />
              <span style={{ marginLeft: 44, color: selectedCatalog ? '#666EFE' : '#A0A3BD' }}>{selectedCatalog || 'Выберите группу'}</span>
              <button onClick={(e) => { e.stopPropagation(); openPopup('catalog'); }} style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={selectedCatalog ? Icon42 : Icon41} alt="Открыть" style={{ width: 18, height: 18 }} /></button>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 268, left: 30, right: 30 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: 732, height: 263, borderRadius: 10, border: (description || descriptionFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
            <img src={description ? Icon52 : Icon51} alt="" style={{ width: 16, height: 16, position: 'absolute', top: 15, left: 15 }} />
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 15, paddingLeft: 44, paddingRight: 40, paddingBottom: 15, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} onFocus={() => setDescriptionFocused(true)} onBlur={() => setDescriptionFocused(false)} placeholder="Введите описание" />
            {description && <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 15, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} /></button>}
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Группа учета:</span></div>
          <div className="accounting-group-dropdown" style={{ position: 'relative' }}>
            <div onClick={() => setAccountingGroupOpen(!accountingGroupOpen)} style={selectFieldStyle(!!selectedAccountingGroup)}>
              <img src={selectedAccountingGroup ? Icon62 : Icon61} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedAccountingGroup ? '#666EFE' : '#9CA3AF' }}>{selectedAccountingGroup || 'Выбрать группу учета'}</span>
              <motion.img src={Icon9} alt="" style={{ ...arrowIconStyle, transform: accountingGroupOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }} />
            </div>
            <AnimatePresence>
              {accountingGroupOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 48, left: 0, width: 388, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                  {typeMaterials.map(o => (
                    <div key={o.uid} onClick={() => handleAccountingGroupSelect(o)} style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', cursor: 'pointer', backgroundColor: selectedAccountingGroupId === o.uid ? '#F0F1FF' : '#FFFFFF' }}
                      onMouseEnter={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#F5F6FA'; }}
                      onMouseLeave={(e) => { if (selectedAccountingGroupId !== o.uid) (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}>
                      {o.typeName}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 145, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Группа номенклатуры:</span></div>
          <div onClick={() => openPopup('nomenclatureGroup')} style={{ ...selectFieldStyle(!!selectedNomenclatureGroup), opacity: selectedAccountingGroupId ? 1 : 0.5, cursor: selectedAccountingGroupId ? 'pointer' : 'not-allowed' }}>
            <img src={selectedNomenclatureGroup ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
            <span style={{ marginLeft: 15.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedNomenclatureGroup ? '#666EFE' : '#9CA3AF' }}>{selectedNomenclatureGroup || (selectedAccountingGroupId ? 'Выбрать группу' : 'Сначала выберите группу учета')}</span>
            <img src={selectedNomenclatureGroup ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 250, left: 30, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><img src={Icon8} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} /><span style={{ ...labelStyle, marginLeft: 9 }}>Вид номенклатуры:</span></div>
          <div onClick={() => openPopup('nomenclatureType')} style={{ ...selectFieldStyle(!!selectedNomenclatureType), opacity: selectedNomenclatureGroupId ? 1 : 0.5, cursor: selectedNomenclatureGroupId ? 'pointer' : 'not-allowed' }}>
            <img src={selectedNomenclatureType ? Icon72 : Icon71} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ marginLeft: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedNomenclatureType ? '#666EFE' : '#9CA3AF' }}>{selectedNomenclatureType || (selectedNomenclatureGroupId ? 'Выбрать вид' : 'Сначала выберите группу номенклатуры')}</span>
            <img src={selectedNomenclatureType ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 345, left: 30 }}>
          <div onClick={toggleUsage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span><ToggleSwitch value={usage} onChange={toggleUsage} /></div>
          <div onClick={toggleWasteMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span><ToggleSwitch value={wasteMaterial} onChange={toggleWasteMaterial} /></div>
          <div onClick={toggleRecycleMaterial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15, cursor: 'pointer' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span><ToggleSwitch value={recycleMaterial} onChange={toggleRecycleMaterial} /></div>
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 51 }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Изображение</span></div>
        <div style={{ position: 'absolute', top: 49, left: 51, width: 311, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => fileInputRef?.current?.click()}><img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
            {images.length > 1 && <button onClick={prevImage} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
            {images.length > 0 && images[selectedImageIndex] ? (
              <div onClick={() => setFullscreenImage(true)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <img src={images[selectedImageIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>{isUploading ? 'Загрузка...' : 'Нет изображений'}</span>}
            {images.length > 1 && <button onClick={nextImage} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
          </div>
          <div style={{ width: 309, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <div key={img.uid} onClick={() => setSelectedImageIndex(idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === selectedImageIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.uid); }} style={{ position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255, 48, 82, 0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><line x1="1" y1="1" x2="5" y2="5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="1" x2="1" y2="5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 380, left: 51, right: 51 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Штрихкод:</span>
          <div onClick={() => { fetchBarcodeData(); setShowBarcodePopup(true); }} style={{ width: 311, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#666EFE" strokeWidth="2"/><line x1="5" y1="6" x2="5" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="5" x2="9" y2="13" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="6" x2="13" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: barcode ? '#666EFE' : '#9CA3AF' }}>{barcode || 'Добавить штрихкод'}</span>
          </div>
        </div>
      </div>

      <input ref={fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {showBarcodePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBarcodePopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Штрихкод</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Изображение штрихкода</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {barcodeImage ? (
                  <div style={{ position: 'relative', width: 100, height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(102, 110, 254, 0.15)' }}>
                    <img src={barcodeImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button onClick={handleDeleteBarcodeImage} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255, 48, 82, 0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
                  </div>
                ) : (
                  <div onClick={() => barcodeImageInputRef?.current?.click()} style={{ width: 100, height: 100, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="12" y1="6" x2="12" y2="18" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="12" x2="18" y2="12" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg></div>
                )}
              </div>
            </div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Код</label><input type="text" value={barcodeCode} onChange={e => setBarcodeCode(e.target.value)} placeholder="Введите код штрихкода" style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setShowBarcodePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button><button onClick={handleBarcodeSave} disabled={isUploadingBarcode} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: isUploadingBarcode ? '#BCC8FF' : '#666EFE', cursor: isUploadingBarcode ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isUploadingBarcode ? 'Сохранение...' : 'Сохранить'}</button></div>
          </div>
        </div>
      )}
      <input ref={barcodeImageInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBarcodeImageUpload} />

      {fullscreenImage && images[selectedImageIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenImage(false)}>
          <img src={images[selectedImageIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default MainTab;