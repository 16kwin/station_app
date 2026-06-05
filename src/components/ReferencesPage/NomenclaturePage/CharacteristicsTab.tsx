// CharacteristicsTab.tsx — ПОЛНЫЙ ФАЙЛ (исправленный, работает с локальными характеристиками)
import React, { useState, useEffect } from 'react';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from './CatalogSelectPopup';
import type { CommonProps, LocalCharacteristic } from './NomenclatureCreatePage';

interface MeasureOption {
  uid: string;
  name: string;
}

const REQUIRED_ATTRIBUTES = ['Длина', 'Ширина', 'Высота', 'Масса'];

const CharacteristicsTab: React.FC<CommonProps> = (props) => {
  const {
    uid, isEdit,
    isUploadingBlueprint, blueprints, selectedBlueprintIndex,
    selectedUnit, selectedUnitId,
    selectedManufacturer, selectedManufacturerId,
    selectedBrand, selectedBrandId,
    selectedModel, selectedModelId,
    selectedCountry, selectedCountryId,
    fullscreenBlueprint,
    blueprintInputRef,
    localCharacteristics,
    setLocalCharacteristics,
    setSelectedBlueprintIndex, setFullscreenBlueprint,
    handleBlueprintUpload, handleDeleteBlueprint,
    openPopup,
  } = props;

  const [measures, setMeasures] = useState<MeasureOption[]>([]);
  const [editingCustomName, setEditingCustomName] = useState<string | null>(null);
  const [customNameInput, setCustomNameInput] = useState('');

  const [showAddCharPopup, setShowAddCharPopup] = useState(false);
  const [showAttributeTypePopup, setShowAttributeTypePopup] = useState(false);
  const [showMeasurePopup, setShowMeasurePopup] = useState(false);
  const [newCharAttributeTypeUid, setNewCharAttributeTypeUid] = useState('');
  const [newCharAttributeTypeName, setNewCharAttributeTypeName] = useState('');
  const [newCharMeasureUid, setNewCharMeasureUid] = useState('');
  const [newCharMeasureName, setNewCharMeasureName] = useState('');
  const [newCharValue, setNewCharValue] = useState('');

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const selectFieldStyleSmall = (hv: boolean): React.CSSProperties => ({ width: 300, height: 44, borderRadius: 10, border: hv ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: hv ? '#666EFE' : '#9CA3AF', cursor: 'pointer' });

  const prevBp = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedBlueprintIndex((p: number) => p > 0 ? p - 1 : blueprints.length - 1); };
  const nextBp = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedBlueprintIndex((p: number) => p < blueprints.length - 1 ? p + 1 : 0); };

  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fetchMeasures = async () => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureMeasures);
      setMeasures(res.data || []);
    } catch (e) {
      console.error('Ошибка загрузки единиц измерения:', e);
    }
  };

  useEffect(() => {
    fetchMeasures();
  }, []);

  const handleValueChange = (charLocalId: string, newValue: string) => {
    setLocalCharacteristics(prev => prev.map(c => c.localId === charLocalId ? { ...c, value: newValue } : c));
  };

  const handleMeasureChange = (charLocalId: string, measureUid: string) => {
    const selectedMeasure = measures.find(m => m.uid === measureUid);
    setLocalCharacteristics(prev => prev.map(c => c.localId === charLocalId ? { 
      ...c, 
      measureUid: measureUid || null, 
      measureName: selectedMeasure?.name || null 
    } : c));
  };

  const handleAddCharacteristic = () => {
    if (!uid) return;
    setNewCharAttributeTypeUid('');
    setNewCharAttributeTypeName('');
    setNewCharMeasureUid('');
    setNewCharMeasureName('');
    setNewCharValue('');
    setShowAddCharPopup(true);
  };

  const handleAddCharSubmit = () => {
    if (!newCharAttributeTypeUid) return;
    
    const newChar: LocalCharacteristic = {
      localId: generateLocalId(),
      uid: null,
      attributeTypeUid: newCharAttributeTypeUid,
      attributeName: newCharAttributeTypeName,
      customName: null,
      value: newCharValue || '',
      measureUid: newCharMeasureUid || null,
      measureName: newCharMeasureName || null,
      isCustom: false,
      isRequired: false,
    };
    
    setLocalCharacteristics(prev => [...prev, newChar]);
    setShowAddCharPopup(false);
    setNewCharAttributeTypeUid('');
    setNewCharAttributeTypeName('');
    setNewCharMeasureUid('');
    setNewCharMeasureName('');
    setNewCharValue('');
  };

  const handleDeleteCharacteristic = (charLocalId: string) => {
    const char = localCharacteristics.find(c => c.localId === charLocalId);
    if (char && char.isRequired) {
      alert('Нельзя удалить обязательную характеристику');
      return;
    }
    
    if (!confirm('Удалить характеристику?')) return;
    
    setLocalCharacteristics(prev => prev.filter(c => c.localId !== charLocalId));
  };

  const handleUpdateCustomName = (charLocalId: string) => {
    if (!customNameInput.trim()) return;
    
    setLocalCharacteristics(prev => prev.map(c => c.localId === charLocalId ? { 
      ...c, 
      customName: customNameInput.trim(),
    } : c));
    
    setEditingCustomName(null);
    setCustomNameInput('');
  };

  const startEditCustomName = (charLocalId: string, currentName: string | null) => {
    setEditingCustomName(charLocalId);
    setCustomNameInput(currentName || '');
  };

  const popupFieldStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
    display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', boxSizing: 'border-box',
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
                <div onClick={() => setFullscreenBlueprint(true)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}><img src={blueprints[selectedBlueprintIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
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

        <div style={{ position: 'absolute', top: 15, left: 649, display: 'flex', gap: 15 }}>
          <button onClick={handleAddCharacteristic} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ position: 'absolute', top: 64, left: 634, display: 'flex', gap: 10 }}>
          <div style={{ width: 1056, height: 324, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 250 }}>ХАРАКТЕРИСТИКА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 250 }}>ЕД.ИЗМ.</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ЗНАЧЕНИЕ</span>
              <span style={{ width: 40 }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {localCharacteristics.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет характеристик</span></div>
              ) : (
                localCharacteristics.map((char) => {
                  const isRequired = char.isRequired;
                  const isEmpty = !char.value || char.value.trim() === '';
                  
                  return (
                    <div key={char.localId} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: isRequired && isEmpty ? '#FFF8F0' : '#FFFFFF' }}>
                      <div style={{ width: 250, display: 'flex', alignItems: 'center' }}>
                        {char.isCustom ? (
                          editingCustomName === char.localId ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <input type="text" value={customNameInput} onChange={(e) => setCustomNameInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateCustomName(char.localId); if (e.key === 'Escape') setEditingCustomName(null); }} onBlur={() => handleUpdateCustomName(char.localId)} autoFocus style={{ width: 170, height: 32, borderRadius: 6, border: '1px solid #666EFE', paddingLeft: 8, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', outline: 'none' }} />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onDoubleClick={() => startEditCustomName(char.localId, char.customName)}>{char.customName || 'Пользовательская'}</span>
                            </div>
                          )
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: isRequired ? 600 : 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {char.attributeName || 'Характеристика'}
                              {isRequired && <span style={{ color: '#FF3052', marginLeft: 2 }}>*</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ width: 250 }}>
                        <select value={char.measureUid || ''} onChange={(e) => handleMeasureChange(char.localId, e.target.value)} style={{ width: 200, height: 36, borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', paddingLeft: 8, paddingRight: 8, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: char.measureUid ? '#2D4059' : '#9CA3AF', outline: 'none', cursor: 'pointer' }}>
                          <option value="">Не выбрана</option>
                          {measures.map((m) => (<option key={m.uid} value={m.uid}>{m.name}</option>))}
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input type="text" value={char.value || ''} onChange={(e) => handleValueChange(char.localId, e.target.value)} placeholder={isRequired ? 'Обязательно для заполнения' : 'Введите значение'} style={{ width: '100%', height: 36, borderRadius: 8, border: isRequired && isEmpty ? '1px solid #FF3052' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', paddingLeft: 12, paddingRight: 40, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', outline: 'none' }} />
                        </div>
                      </div>

                      <button onClick={() => handleDeleteCharacteristic(char.localId)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: isRequired ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, opacity: isRequired ? 0.3 : 1 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="3" y1="3" x2="11" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <input ref={blueprintInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleBlueprintUpload} />
      {fullscreenBlueprint && blueprints[selectedBlueprintIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenBlueprint(false)}><img src={blueprints[selectedBlueprintIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} /></div>
      )}

      {showAddCharPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddCharPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление характеристики</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Вид характеристики</label><div onClick={() => setShowAttributeTypePopup(true)} style={{ ...popupFieldStyle, color: newCharAttributeTypeName ? '#666EFE' : '#9CA3AF' }}><span>{newCharAttributeTypeName || 'Выберите вид характеристики'}</span></div></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Единица измерения</label><div onClick={() => setShowMeasurePopup(true)} style={{ ...popupFieldStyle, color: newCharMeasureName ? '#666EFE' : '#9CA3AF' }}><span>{newCharMeasureName || 'Выберите единицу измерения'}</span></div></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Значение</label><input type="text" value={newCharValue} onChange={e => setNewCharValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddCharSubmit(); else if (e.key === 'Escape') setShowAddCharPopup(false); }} placeholder="Введите значение" autoFocus style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setShowAddCharPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button><button onClick={handleAddCharSubmit} disabled={!newCharAttributeTypeUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newCharAttributeTypeUid ? '#666EFE' : '#BCC8FF', cursor: newCharAttributeTypeUid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Добавить</button></div>
          </div>
        </div>
      )}

      <CatalogSelectPopup isOpen={showAttributeTypePopup} onClose={() => setShowAttributeTypePopup(false)} onSelect={(id, name) => { setNewCharAttributeTypeUid(id); setNewCharAttributeTypeName(name); setShowAttributeTypePopup(false); }} popupType="attributeType" />
      <CatalogSelectPopup isOpen={showMeasurePopup} onClose={() => setShowMeasurePopup(false)} onSelect={(id, name) => { setNewCharMeasureUid(id); setNewCharMeasureName(name); setShowMeasurePopup(false); }} popupType="unit" />
    </div>
  );
};

export default CharacteristicsTab;