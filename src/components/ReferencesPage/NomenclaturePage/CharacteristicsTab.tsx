// CharacteristicsTab.tsx — ПОЛНЫЙ ФАЙЛ (удаление только через правую кнопку мыши)
import React, { useState, useEffect, useRef } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import Icon10 from '../../../assets/References/NomenclatureCreatePage/Icon10.svg';
import Icon101 from '../../../assets/References/NomenclatureCreatePage/Icon101.svg';
import IconChar11 from '../../../assets/References/NomenclatureCreatePage/Characteristics11.svg';
import IconChar12 from '../../../assets/References/NomenclatureCreatePage/Characteristics12.svg';
import IconChar21 from '../../../assets/References/NomenclatureCreatePage/Characteristics21.svg';
import IconChar22 from '../../../assets/References/NomenclatureCreatePage/Characteristics22.svg';
import IconChar31 from '../../../assets/References/NomenclatureCreatePage/Characteristics31.svg';
import IconChar32 from '../../../assets/References/NomenclatureCreatePage/Characteristics32.svg';
import IconChar41 from '../../../assets/References/NomenclatureCreatePage/Characteristics41.svg';
import IconChar42 from '../../../assets/References/NomenclatureCreatePage/Characteristics42.svg';
import IconChar51 from '../../../assets/References/NomenclatureCreatePage/Characteristics51.svg';
import IconChar52 from '../../../assets/References/NomenclatureCreatePage/Characteristics52.svg';
import Icon41 from '../../../assets/References/NomenclatureCreatePage/Icon41.svg';
import Icon42 from '../../../assets/References/NomenclatureCreatePage/Icon42.svg';
import Button1 from '../../../assets/References/NomenclatureCreatePage/button1.svg';
import Button2 from '../../../assets/References/NomenclatureCreatePage/button2.svg';
import Button3 from '../../../assets/References/NomenclatureCreatePage/button3.svg';
import Button4 from '../../../assets/References/NomenclatureCreatePage/button4.svg';
import Button5 from '../../../assets/References/NomenclatureCreatePage/button5.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from './CatalogSelectPopup';
import type { CommonProps, LocalCharacteristic, LocalImageItem } from './NomenclatureCreatePage';

interface MeasureOption { uid: string; name: string; }
interface TypeAttributeOption { uid: string; name: string; designation: string; }

const REQUIRED_ATTRIBUTES = ['Длина', 'Ширина', 'Высота', 'Масса'];
const getDraftKey = (uid: string) => `nomenclature_draft_${uid}`;

const CharacteristicsTab: React.FC<CommonProps> = (props) => {
  const { uid, isEdit, isUploadingBlueprint, blueprints, selectedUnit, selectedUnitId, selectedManufacturer, selectedManufacturerId, selectedBrand, selectedBrandId, selectedModel, selectedModelId, selectedCountry, selectedCountryId, fullscreenBlueprint, localCharacteristics = [], setLocalCharacteristics, localBlueprints, setLocalBlueprints, setBlueprints, setFullscreenBlueprint, handleDeleteBlueprint, openPopup, validationErrors, setValidationErrors } = props;

  const [measures, setMeasures] = useState<MeasureOption[]>([]);
  const [typeAttributes, setTypeAttributes] = useState<TypeAttributeOption[]>([]);
  const [isLoadingChars, setIsLoadingChars] = useState(false);
  const [showAddCharPopup, setShowAddCharPopup] = useState(false);
  const [showAttributeTypePopup, setShowAttributeTypePopup] = useState(false);
  const [showMeasurePopup, setShowMeasurePopup] = useState(false);
  const [newCharAttributeTypeUid, setNewCharAttributeTypeUid] = useState('');
  const [newCharAttributeTypeName, setNewCharAttributeTypeName] = useState('');
  const [newCharMeasureUid, setNewCharMeasureUid] = useState('');
  const [newCharMeasureName, setNewCharMeasureName] = useState('');
  const [newCharValue, setNewCharValue] = useState('');
  const [showEditCharPopup, setShowEditCharPopup] = useState(false);
  const [editingCharLocalId, setEditingCharLocalId] = useState<string | null>(null);
  const [editCharAttributeTypeUid, setEditCharAttributeTypeUid] = useState('');
  const [editCharAttributeTypeName, setEditCharAttributeTypeName] = useState('');
  const [editCharMeasureUid, setEditCharMeasureUid] = useState('');
  const [editCharMeasureName, setEditCharMeasureName] = useState('');
  const [editCharValue, setEditCharValue] = useState('');
  const [showEditAttributeTypePopup, setShowEditAttributeTypePopup] = useState(false);
  const [showEditMeasurePopup, setShowEditMeasurePopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; localId: string; isRequired: boolean } | null>(null);
  const localBlueprintInputRef = useRef<HTMLInputElement>(null);
  const [localBlueprintSelectedIndex, setLocalBlueprintSelectedIndex] = useState(0);
  const [localBlueprintContextMenu, setLocalBlueprintContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);

  const TABLE_WIDTH = 1070; const TABLE_HEIGHT = 324; const ROW_HEIGHT = 54; const HEADER_HEIGHT = 54; const VISIBLE_ROWS = 5;
  const COL_CHAR = 50; const COL_DESIGNATION = 390; const COL_MEASURE = 644; const COL_VALUE = 844;

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const createButtonStyle: React.CSSProperties = { width: 122, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 };
  const cellTextStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };
  const getSelectBorder = (fieldKey: string, isFilled: boolean): string => { if (validationErrors.has(fieldKey)) return '2px solid #FF3052'; if (isFilled) return '1px solid #666EFE'; return '1px solid rgba(102, 110, 254, 0.15)'; };
  const selectFieldStyleSmall = (hv: boolean, fieldKey: string): React.CSSProperties => ({ width: 300, height: 44, borderRadius: 10, border: getSelectBorder(fieldKey, hv), backgroundColor: '#FFFFFF', marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 13, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: hv ? '#666EFE' : '#9CA3AF', cursor: 'pointer', position: 'relative' as const, boxSizing: 'border-box' });
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const displayBlueprints = (localBlueprints && localBlueprints.length > 0) ? localBlueprints.map(bp => ({ uid: bp.url, url: bp.url, originalName: bp.file.name })) : (blueprints || []);
  const isLocalBlueprints = localBlueprints && localBlueprints.length > 0;

  useEffect(() => { AxiosService.get(ConstantInfo.restApiNomenclatureMeasures).then(res => setMeasures(res.data || [])).catch(e => console.error(e)); AxiosService.get(ConstantInfo.restApiNomenclatureTypeAttributes).then(res => setTypeAttributes(res.data || [])).catch(e => console.error(e)); }, []);
  useEffect(() => { if (!uid) return; if (isEdit) { setIsLoadingChars(true); AxiosService.get(ConstantInfo.restApiNomenclatureCharacteristics(uid)).then(res => { const serverChars: LocalCharacteristic[] = (res.data || []).map((c: any) => ({ localId: generateLocalId(), uid: c.uid, attributeTypeUid: c.attributeTypeUid, attributeName: c.attributeName, customName: c.customName, value: c.value || '', measureUid: c.measureUid, measureName: c.measureName, isCustom: c.isCustom, isRequired: c.attributeName && REQUIRED_ATTRIBUTES.includes(c.attributeName) })); try { const draftKey = getDraftKey(uid); const raw = localStorage.getItem(draftKey); if (raw) { const draft = JSON.parse(raw); if (draft.localCharacteristics && Array.isArray(draft.localCharacteristics) && draft.localCharacteristics.length > 0) { setLocalCharacteristics(draft.localCharacteristics); return; } } } catch (e) {} setLocalCharacteristics(serverChars); }).catch(e => console.error(e)).finally(() => setIsLoadingChars(false)); } }, [uid, isEdit]);
  useEffect(() => { if (!localBlueprintContextMenu) return; const h = () => setLocalBlueprintContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [localBlueprintContextMenu]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const chars = localCharacteristics || [];
  const totalRows = Math.max(chars.length, VISIBLE_ROWS);
  const checkScroll = () => { const container = scrollContainerRef.current; if (!container) return; setHasVerticalScroll(container.scrollHeight > container.clientHeight); };
  useEffect(() => { const timer = setTimeout(checkScroll, 100); return () => clearTimeout(timer); }, [chars.length]);
  useEffect(() => { const container = scrollContainerRef.current; if (!container) return; checkScroll(); container.addEventListener('scroll', checkScroll); const ro = new ResizeObserver(checkScroll); ro.observe(container); return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); }; }, []);

  const handleLocalBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const imgs: LocalImageItem[] = []; for (let i = 0; i < files.length; i++) { imgs.push({ file: files[i], url: URL.createObjectURL(files[i]) }); } setLocalBlueprints((p: LocalImageItem[]) => [...p, ...imgs]); if (localBlueprintInputRef.current) localBlueprintInputRef.current.value = ''; };
  const handleLocalDeleteBlueprint = (index: number) => { setLocalBlueprints((p: LocalImageItem[]) => { const n = [...p]; URL.revokeObjectURL(n[index].url); n.splice(index, 1); return n; }); if (localBlueprintSelectedIndex >= displayBlueprints.length - 1) setLocalBlueprintSelectedIndex(Math.max(0, displayBlueprints.length - 2)); };
  const prevBp = (e: React.MouseEvent) => { e.stopPropagation(); setLocalBlueprintSelectedIndex((p: number) => p > 0 ? p - 1 : displayBlueprints.length - 1); };
  const nextBp = (e: React.MouseEvent) => { e.stopPropagation(); setLocalBlueprintSelectedIndex((p: number) => p < displayBlueprints.length - 1 ? p + 1 : 0); };
  const handleBlueprintContextMenu = (e: React.MouseEvent, index: number) => { e.preventDefault(); e.stopPropagation(); setLocalBlueprintContextMenu({ x: e.clientX, y: e.clientY, index }); };
  const getDesignationByAttributeType = (attributeTypeUid: string | null): string => { if (!attributeTypeUid) return '-'; const attr = typeAttributes.find(a => a.uid === attributeTypeUid); return attr?.designation || '-'; };
  const getMeasureName = (measureUid: string | null): string => { if (!measureUid) return '-'; const m = measures.find(m => m.uid === measureUid); return m?.name || '-'; };
  const handleContextMenu = (e: React.MouseEvent, localId: string, isRequired: boolean) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, localId, isRequired }); };
  const handleContextEdit = () => { if (!contextMenu) return; const char = localCharacteristics.find(c => c.localId === contextMenu.localId); if (!char) return; setEditingCharLocalId(char.localId); setEditCharAttributeTypeUid(char.attributeTypeUid || ''); setEditCharAttributeTypeName(char.attributeName || ''); setEditCharMeasureUid(char.measureUid || ''); setEditCharMeasureName(char.measureName || ''); setEditCharValue(char.value || ''); setShowEditCharPopup(true); setContextMenu(null); };
  const handleContextDelete = () => { if (!contextMenu) return; if (contextMenu.isRequired) { alert('Нельзя удалить обязательную характеристику'); setContextMenu(null); return; } if (!confirm('Удалить характеристику?')) { setContextMenu(null); return; } setLocalCharacteristics(prev => prev.filter(c => c.localId !== contextMenu.localId)); setContextMenu(null); };
  const handleDoubleClick = (localId: string) => { const char = localCharacteristics.find(c => c.localId === localId); if (!char) return; setEditingCharLocalId(char.localId); setEditCharAttributeTypeUid(char.attributeTypeUid || ''); setEditCharAttributeTypeName(char.attributeName || ''); setEditCharMeasureUid(char.measureUid || ''); setEditCharMeasureName(char.measureName || ''); setEditCharValue(char.value || ''); setShowEditCharPopup(true); };
  const handleEditCharSubmit = () => { if (!editingCharLocalId) return; let attributeName = editCharAttributeTypeName; if (editCharAttributeTypeUid) { const typeAttr = typeAttributes.find(a => a.uid === editCharAttributeTypeUid); if (typeAttr) attributeName = typeAttr.name; } setLocalCharacteristics(prev => prev.map(c => c.localId === editingCharLocalId ? { ...c, attributeTypeUid: editCharAttributeTypeUid || null, attributeName: attributeName || null, measureUid: editCharMeasureUid || null, measureName: editCharMeasureName || null, value: editCharValue || '' } : c)); if (attributeName) clearFieldError(`char_${attributeName}`); setShowEditCharPopup(false); setEditingCharLocalId(null); setEditCharAttributeTypeUid(''); setEditCharAttributeTypeName(''); setEditCharMeasureUid(''); setEditCharMeasureName(''); setEditCharValue(''); };
  const handleAddCharacteristic = () => { if (!uid) return; setNewCharAttributeTypeUid(''); setNewCharAttributeTypeName(''); setNewCharMeasureUid(''); setNewCharMeasureName(''); setNewCharValue(''); setShowAddCharPopup(true); };
  const handleAddCharSubmit = () => { if (!newCharAttributeTypeUid) return; let attributeName = newCharAttributeTypeName; const typeAttr = typeAttributes.find(a => a.uid === newCharAttributeTypeUid); if (typeAttr) attributeName = typeAttr.name; const newChar: LocalCharacteristic = { localId: generateLocalId(), uid: null, attributeTypeUid: newCharAttributeTypeUid, attributeName: attributeName || null, customName: null, value: newCharValue || '', measureUid: newCharMeasureUid || null, measureName: newCharMeasureName || null, isCustom: false, isRequired: false }; setLocalCharacteristics(prev => [...prev, newChar]); setShowAddCharPopup(false); setNewCharAttributeTypeUid(''); setNewCharAttributeTypeName(''); setNewCharMeasureUid(''); setNewCharMeasureName(''); setNewCharValue(''); };
  const popupFieldStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 13, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxSizing: 'border-box' };
  const renderSelectField = (fieldKey: string, isFilled: boolean, selectedText: string, placeholder: string, leftIcon: string, leftIconFilled: string, isDisabled: boolean, onClick: () => void) => (<div onClick={isDisabled ? undefined : onClick} style={{ ...selectFieldStyleSmall(isFilled, fieldKey), opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}><img src={isFilled ? leftIconFilled : leftIcon} alt="" style={{ width: 18, height: 18, flexShrink: 0, opacity: isDisabled ? 0.5 : 1 }} /><span style={{ marginLeft: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedText || placeholder}</span><img src={isFilled ? Icon42 : Icon41} alt="" style={{ width: 18, height: 18, flexShrink: 0, opacity: isDisabled ? 0.5 : 1 }} /></div>);
  const contextMenuButtonStyle: React.CSSProperties = { width: 174, height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' };
  const getRowSeparator = (index: number, isRealData: boolean): React.CSSProperties => { if (!isRealData) return { borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }; const isFirst = index === 0; const isLast = index === chars.length - 1; return { borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5', borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5' }; };

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ ...blockStyle, width: 1740, height: 132, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', gap: 45 }}>
          <div><span style={labelStyle}>Единица измерения:</span>{renderSelectField('unit', !!selectedUnit, selectedUnit, 'Выбрать', IconChar11, IconChar12, false, () => { clearFieldError('unit'); openPopup('unit'); })}</div>
          <div><span style={labelStyle}>Производитель:</span>{renderSelectField('manufacturer', !!selectedManufacturer, selectedManufacturer, 'Выбрать', IconChar21, IconChar22, false, () => { clearFieldError('manufacturer'); openPopup('manufacturer'); })}</div>
          <div><span style={labelStyle}>Бренд:</span>{renderSelectField('brand', !!selectedBrand, selectedBrand, selectedManufacturerId ? 'Выбрать' : 'Сначала выберите производителя', IconChar31, IconChar32, !selectedManufacturerId, () => { clearFieldError('brand'); openPopup('brand'); })}</div>
          <div><span style={labelStyle}>Модель:</span>{renderSelectField('model', !!selectedModel, selectedModel, selectedBrandId ? 'Выбрать' : 'Сначала выберите бренд', IconChar41, IconChar42, !selectedBrandId, () => { clearFieldError('model'); openPopup('model'); })}</div>
          <div><span style={labelStyle}>Страна происхождения:</span>{renderSelectField('country', !!selectedCountry, selectedCountry, 'Выбрать', IconChar51, IconChar52, false, () => { clearFieldError('country'); openPopup('country'); })}</div>
        </div>
      </div>
      <div style={{ ...blockStyle, width: 1740, height: 418, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 15, left: 64 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Чертеж</span>
          <div style={{ marginTop: 12, width: 518, height: 311, border: '1px solid rgba(230, 232, 248, 0.44)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(230, 232, 248, 0.44)', cursor: 'pointer' }} onClick={() => localBlueprintInputRef.current?.click()}><img src={Icon10} alt="Добавить" style={{ width: 21, height: 21 }} /></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FAFBFC' }}>
              {displayBlueprints.length > 1 && <button onClick={prevBp} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19, transform: 'scaleX(-1)' }} /></button>}
              {displayBlueprints.length > 0 && displayBlueprints[localBlueprintSelectedIndex] ? (<div onContextMenu={(e) => handleBlueprintContextMenu(e, localBlueprintSelectedIndex)} style={{ width: 231, height: 193, backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setFullscreenBlueprint(true)}><img src={displayBlueprints[localBlueprintSelectedIndex].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>) : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет чертежей</span>}
              {displayBlueprints.length > 1 && <button onClick={nextBp} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 19, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, zIndex: 1 }}><img src={Icon101} alt="" style={{ width: 13, height: 19 }} /></button>}
            </div>
            <div style={{ width: 516, height: 47, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 6, borderTop: '1px solid rgba(230, 232, 248, 0.44)', overflowX: 'auto' }}>
              {displayBlueprints.map((bp, idx) => (
                <div 
                  key={bp.uid || idx} 
                  onClick={() => setLocalBlueprintSelectedIndex(idx)} 
                  onContextMenu={(e) => handleBlueprintContextMenu(e, idx)} 
                  style={{ 
                    width: 43, height: 36, borderRadius: 4, 
                    border: idx === localBlueprintSelectedIndex ? '2px solid #666EFE' : '2px solid transparent', 
                    flexShrink: 0, cursor: 'pointer', overflow: 'hidden', 
                    position: 'relative', backgroundColor: '#F5F6FA' 
                  }}
                >
                  <img src={bp.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
          <input ref={localBlueprintInputRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={handleLocalBlueprintUpload} />
        </div>
        <div style={{ position: 'absolute', top: 14, left: 634, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8, paddingLeft: 15 }}>
            <button style={smallButtonStyle}><img src={Button1} alt="" style={{ width: 18, height: 18 }} /></button>
            <button style={smallButtonStyle}><img src={Button2} alt="" style={{ width: 20, height: 14 }} /></button>
            <button style={smallButtonStyle}><img src={Button3} alt="" style={{ width: 18, height: 18 }} /></button>
            <div style={{ width: 182 }} />
            <button onClick={handleAddCharacteristic} style={createButtonStyle}><img src={Button4} alt="" style={{ width: 14, height: 14, marginLeft: 13 }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 13 }}>Создать</span></button>
            <button style={smallButtonStyle}><img src={Button5} alt="" style={{ width: 18, height: 18 }} /></button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 0, paddingRight: 0, boxSizing: 'border-box' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_CHAR }}>ХАРАКТЕРИСТИКА</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_DESIGNATION }}>ОБОЗНАЧЕНИЕ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_MEASURE }}>ЕД.ИЗМ</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', position: 'absolute', left: COL_VALUE }}>ЗНАЧЕНИЕ</span>
              </div>
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ minWidth: TABLE_WIDTH }}>
                  {isLoadingChars ? (<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span></div>) : (
                    <>
                      {Array.from({ length: totalRows }).map((_, index) => { const char = chars[index]; const isRealData = !!char; if (!isRealData) { return (<div key={`empty-${index}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />); } const isRequired = char.isRequired; const fieldKey = `char_${char.attributeName}`; const hasError = validationErrors.has(fieldKey); const designation = getDesignationByAttributeType(char.attributeTypeUid); const measureName = getMeasureName(char.measureUid); return (<div key={char.localId} onDoubleClick={() => handleDoubleClick(char.localId)} onContextMenu={(e) => handleContextMenu(e, char.localId, isRequired)} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', cursor: 'pointer', userSelect: 'none', ...getRowSeparator(index, true) }}><span style={{ position: 'absolute', left: COL_CHAR, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: isRequired ? 600 : 400, color: hasError ? '#FF3052' : '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: COL_DESIGNATION - COL_CHAR - 20 }}>{char.attributeName || char.customName || 'Характеристика'}{isRequired && <span style={{ color: '#FF3052', marginLeft: 2 }}>*</span>}</span><span style={{ ...cellTextStyle, left: COL_DESIGNATION, maxWidth: COL_MEASURE - COL_DESIGNATION - 20, fontWeight: 600 }}>{designation}</span><span style={{ ...cellTextStyle, left: COL_MEASURE, maxWidth: COL_VALUE - COL_MEASURE - 20 }}>{measureName}</span><span style={{ ...cellTextStyle, left: COL_VALUE, maxWidth: TABLE_WIDTH - COL_VALUE - 60 }}>{char.value || '-'}</span></div>); })}
                    </>
                  )}
                </div>
              </div>
            </div>
            {hasVerticalScroll && (<div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>)}
          </div>
        </div>
      </div>
      {contextMenu && (<div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}><button style={contextMenuButtonStyle} onClick={handleContextEdit}>Редактировать</button><button style={{ ...contextMenuButtonStyle, opacity: contextMenu.isRequired ? 0.3 : 1, cursor: contextMenu.isRequired ? 'not-allowed' : 'pointer' }} onClick={handleContextDelete} disabled={contextMenu.isRequired}>Удалить</button></div>)}
      {localBlueprintContextMenu && (<div style={{ position: 'fixed', top: localBlueprintContextMenu.y, left: localBlueprintContextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}><button onClick={() => { isLocalBlueprints ? handleLocalDeleteBlueprint(localBlueprintContextMenu.index) : handleDeleteBlueprint(displayBlueprints[localBlueprintContextMenu.index]?.uid); setLocalBlueprintContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button></div>)}
      {fullscreenBlueprint && displayBlueprints[localBlueprintSelectedIndex] && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenBlueprint(false)}><img src={displayBlueprints[localBlueprintSelectedIndex].url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} /></div>)}
      {showAddCharPopup && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddCharPopup(false)}><div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}><h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление характеристики</h3><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Вид характеристики</label><div onClick={() => setShowAttributeTypePopup(true)} style={{ ...popupFieldStyle, color: newCharAttributeTypeName ? '#666EFE' : '#9CA3AF' }}><span>{newCharAttributeTypeName || 'Выберите вид характеристики'}</span></div></div><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Единица измерения</label><div onClick={() => setShowMeasurePopup(true)} style={{ ...popupFieldStyle, color: newCharMeasureName ? '#666EFE' : '#9CA3AF' }}><span>{newCharMeasureName || 'Выберите единицу измерения'}</span></div></div><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Значение</label><input type="text" value={newCharValue} onChange={e => setNewCharValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddCharSubmit(); else if (e.key === 'Escape') setShowAddCharPopup(false); }} placeholder="Введите значение" autoFocus style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /></div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={handleAddCharSubmit} disabled={!newCharAttributeTypeUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newCharAttributeTypeUid ? '#666EFE' : '#BCC8FF', cursor: newCharAttributeTypeUid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Добавить</button><button onClick={() => setShowAddCharPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button></div></div></div>)}
      {showEditCharPopup && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditCharPopup(false)}><div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}><h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Редактирование характеристики</h3><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Вид характеристики</label><div onClick={() => setShowEditAttributeTypePopup(true)} style={{ ...popupFieldStyle, color: editCharAttributeTypeName ? '#666EFE' : '#9CA3AF' }}><span>{editCharAttributeTypeName || 'Выберите вид характеристики'}</span></div></div><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Единица измерения</label><div onClick={() => setShowEditMeasurePopup(true)} style={{ ...popupFieldStyle, color: editCharMeasureName ? '#666EFE' : '#9CA3AF' }}><span>{editCharMeasureName || 'Выберите единицу измерения'}</span></div></div><div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Значение</label><input type="text" value={editCharValue} onChange={e => setEditCharValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditCharSubmit(); else if (e.key === 'Escape') setShowEditCharPopup(false); }} placeholder="Введите значение" autoFocus style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /></div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={handleEditCharSubmit} disabled={!editCharAttributeTypeUid} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: editCharAttributeTypeUid ? '#666EFE' : '#BCC8FF', cursor: editCharAttributeTypeUid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить</button><button onClick={() => setShowEditCharPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button></div></div></div>)}
      <CatalogSelectPopup isOpen={showAttributeTypePopup} onClose={() => setShowAttributeTypePopup(false)} onSelect={(id, name) => { setNewCharAttributeTypeUid(id); setNewCharAttributeTypeName(name); setShowAttributeTypePopup(false); }} popupType="attributeType" />
      <CatalogSelectPopup isOpen={showMeasurePopup} onClose={() => setShowMeasurePopup(false)} onSelect={(id, name) => { setNewCharMeasureUid(id); setNewCharMeasureName(name); setShowMeasurePopup(false); }} popupType="unit" />
      <CatalogSelectPopup isOpen={showEditAttributeTypePopup} onClose={() => setShowEditAttributeTypePopup(false)} onSelect={(id, name) => { setEditCharAttributeTypeUid(id); setEditCharAttributeTypeName(name); setShowEditAttributeTypePopup(false); }} popupType="attributeType" />
      <CatalogSelectPopup isOpen={showEditMeasurePopup} onClose={() => setShowEditMeasurePopup(false)} onSelect={(id, name) => { setEditCharMeasureUid(id); setEditCharMeasureName(name); setShowEditMeasurePopup(false); }} popupType="unit" />
    </div>
  );
};

export default CharacteristicsTab;