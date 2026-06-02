// CharacteristicsTab.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../../components/CustomScrollbar';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import type { CommonProps } from './NomenclatureCreatePage';

interface Folder {
  id: number;
  name: string;
  isOpen: boolean;
  items: FolderItem[];
}

interface FolderItem {
  id: number;
  characteristic?: string;
  designation?: string;
  unit?: string;
  value?: string;
}

const CharacteristicsTab: React.FC<CommonProps> = (props) => {
  const {
    isUploadingBlueprint, blueprints, selectedBlueprintIndex,
    selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId,
    selectedBrand, selectedBrandId,
    selectedModel, selectedModelId,
    selectedCountry, selectedCountryId,
    fullscreenBlueprint,
    blueprintInputRef,
    setSelectedBlueprintIndex, setFullscreenBlueprint,
    handleBlueprintUpload, handleDeleteBlueprint,
    openPopup,
  } = props;

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const selectFieldStyleSmall = (hv: boolean): React.CSSProperties => ({ width: 300, height: 44, borderRadius: 10, border: hv ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: hv ? '#666EFE' : '#9CA3AF', cursor: 'pointer' });

  const prevBp = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedBlueprintIndex((p: number) => p > 0 ? p - 1 : blueprints.length - 1); };
  const nextBp = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedBlueprintIndex((p: number) => p < blueprints.length - 1 ? p + 1 : 0); };

  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const [folders] = useState<Folder[]>([
    { id: 1, name: 'Габаритные характеристики', isOpen: false, items: [{ id: 1, characteristic: 'Длина', designation: 'L', unit: 'мм', value: '1200' }, { id: 2, characteristic: 'Ширина', designation: 'W', unit: 'мм', value: '800' }, { id: 3, characteristic: 'Высота', designation: 'H', unit: 'мм', value: '450' }] },
    { id: 2, name: 'Весовые характеристики', isOpen: false, items: [{ id: 4, characteristic: 'Масса нетто', designation: 'M_net', unit: 'кг', value: '25.5' }, { id: 5, characteristic: 'Масса брутто', designation: 'M_gross', unit: 'кг', value: '28.0' }] },
    { id: 3, name: 'Электрические характеристики', isOpen: false, items: [{ id: 6, characteristic: 'Напряжение', designation: 'U', unit: 'В', value: '220' }, { id: 7, characteristic: 'Мощность', designation: 'P', unit: 'кВт', value: '5.5' }, { id: 8, characteristic: 'Частота', designation: 'f', unit: 'Гц', value: '50' }] },
  ]);

  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const toggleFolder = (fid: number) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid); else next.add(fid);
      return next;
    });
  };

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ ...blockStyle, width: 1740, height: 132, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', gap: 45 }}>
          <div><span style={labelStyle}>Единица измерения:</span><div onClick={() => openPopup('unit')} style={selectFieldStyleSmall(!!selectedUnit)}>{selectedUnit || 'Выбрать'}</div></div>
          <div><span style={labelStyle}>Производитель:</span><div onClick={() => openPopup('manufacturer')} style={selectFieldStyleSmall(!!selectedManufacturer)}>{selectedManufacturer || 'Выбрать'}</div></div>
          <div><span style={labelStyle}>Бренд:</span><div onClick={() => openPopup('brand')} style={{ ...selectFieldStyleSmall(!!selectedBrand), opacity: selectedManufacturerId ? 1 : 0.5, cursor: selectedManufacturerId ? 'pointer' : 'not-allowed' }}>{selectedBrand || (selectedManufacturerId ? 'Выбрать' : 'Сначала выберите производителя')}</div></div>
          <div><span style={labelStyle}>Модель:</span><div onClick={() => openPopup('model')} style={{ ...selectFieldStyleSmall(!!selectedModel), opacity: selectedBrandId ? 1 : 0.5, cursor: selectedBrandId ? 'pointer' : 'not-allowed' }}>{selectedModel || (selectedBrandId ? 'Выбрать' : 'Сначала выберите бренд')}</div></div>
          <div><span style={labelStyle}>Страна происхождения:</span><div onClick={() => openPopup('country')} style={selectFieldStyleSmall(!!selectedCountry)}>{selectedCountry || 'Выбрать'}</div></div>
        </div>
      </div>
      <div style={{ ...blockStyle, width: 1740, height: 418, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 15, left: 64 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Чертеж</span>
          <div style={{ marginTop: 12, width: 518, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => blueprintInputRef?.current?.click()}><img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} /></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
              {blueprints.length > 1 && <button onClick={prevBp} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
              {blueprints.length > 0 && blueprints[selectedBlueprintIndex] ? (
                <div onClick={() => setFullscreenBlueprint(true)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <img src={blueprints[selectedBlueprintIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>{isUploadingBlueprint ? 'Загрузка...' : 'Нет чертежей'}</span>}
              {blueprints.length > 1 && <button onClick={nextBp} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
            </div>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
              {blueprints.map((bp, idx) => (
                <div key={bp.uid} onClick={() => setSelectedBlueprintIndex(idx)} style={{ width: 43, height: 36, borderRadius: 4, border: idx === selectedBlueprintIndex ? '2px solid #666EFE' : '2px solid transparent', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F6FA' }}>
                  <img src={bp.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteBlueprint(bp.uid); }} style={{ position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255, 48, 82, 0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg width="6" height="6" viewBox="0 0 6 6" fill="none"><line x1="1" y1="1" x2="5" y2="5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="1" x2="1" y2="5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 15, left: 649, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
        <div style={{ position: 'absolute', top: 64, left: 634, display: 'flex', gap: 10 }}>
          <div style={{ width: 1056, height: 324, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 300 }}>ХАРАКТЕРИСТИКА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ОБОЗНАЧЕНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>ЕД.ИЗМ.</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>ЗНАЧЕНИЕ</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {folders.map(folder => (
                <React.Fragment key={folder.id}>
                  <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                    <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                    <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: openFolders.has(folder.id) ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                  </div>
                  <AnimatePresence>
                    {openFolders.has(folder.id) && folder.items.map(item => (
                      <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                        <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15, width: 280 }}>{item.characteristic}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 200 }}>{item.designation}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 150 }}>{item.unit}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{item.value}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <input ref={blueprintInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleBlueprintUpload} />
      {fullscreenBlueprint && blueprints[selectedBlueprintIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenBlueprint(false)}>
          <img src={blueprints[selectedBlueprintIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default CharacteristicsTab;