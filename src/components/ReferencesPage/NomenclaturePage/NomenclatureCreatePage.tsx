// components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CatalogSelectPopup from './CatalogSelectPopup';
import type { PopupType } from './CatalogSelectPopup';
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
import Icon6 from '../../../assets/References/NomenclatureCreatePage/Icon6.svg';
import Icon7 from '../../../assets/References/NomenclatureCreatePage/Icon7.svg';

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
  name?: string;
  status?: string;
  date?: string;
}

const NomenclatureCreatePage = () => {
  const { uid, code } = useParams<{ uid: string; code: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();
  
  const [activeTab, setActiveTab] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  
  const [name, setName] = useState('');
  const [article, setArticle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [articleFocused, setArticleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [selectedAccountingGroup, setSelectedAccountingGroup] = useState('');
  const [selectedNomenclatureGroup, setSelectedNomenclatureGroup] = useState('');
  const [selectedNomenclatureType, setSelectedNomenclatureType] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<PopupType>('catalog');
  const [showClosePopup, setShowClosePopup] = useState(false);

  const [folders, setFolders] = useState<Folder[]>([
    {
      id: 1,
      name: 'Габаритные характеристики',
      isOpen: false,
      items: [
        { id: 1, characteristic: 'Длина', designation: 'L', unit: 'мм', value: '1200' },
        { id: 2, characteristic: 'Ширина', designation: 'W', unit: 'мм', value: '800' },
        { id: 3, characteristic: 'Высота', designation: 'H', unit: 'мм', value: '450' },
      ],
    },
    {
      id: 2,
      name: 'Весовые характеристики',
      isOpen: false,
      items: [
        { id: 4, characteristic: 'Масса нетто', designation: 'M_net', unit: 'кг', value: '25.5' },
        { id: 5, characteristic: 'Масса брутто', designation: 'M_gross', unit: 'кг', value: '28.0' },
      ],
    },
    {
      id: 3,
      name: 'Электрические характеристики',
      isOpen: false,
      items: [
        { id: 6, characteristic: 'Напряжение', designation: 'U', unit: 'В', value: '220' },
        { id: 7, characteristic: 'Мощность', designation: 'P', unit: 'кВт', value: '5.5' },
        { id: 8, characteristic: 'Частота', designation: 'f', unit: 'Гц', value: '50' },
      ],
    },
  ]);

  const tabs_list = [
    'Основное',
    'Характеристики',
    'Документы',
    'Поставщики',
    'История цен',
    'Аналоги',
    'Рейтинг',
    'Интеграция',
  ];

  const handleSave = async () => {
    if (!uid || !code) return;
    setIsSaving(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureDraft, {
        uid,
        code: parseInt(code),
        name,
        article,
        description,
        groupUid: selectedCatalogId || null,
      });
      console.log('Черновик сохранён');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) {
      closeTab(currentTab.id);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    handleClose();
  };

  const handleCloseWithoutSaving = () => {
    handleClose();
  };

  const openPopup = (type: PopupType) => {
    setPopupType(type);
    setPopupOpen(true);
  };

  const handlePopupSelect = (id: string, name: string) => {
    switch (popupType) {
      case 'catalog':
        setSelectedCatalog(name);
        setSelectedCatalogId(id);
        break;
      case 'accountingGroup': setSelectedAccountingGroup(name); break;
      case 'nomenclatureGroup': setSelectedNomenclatureGroup(name); break;
      case 'nomenclatureType': setSelectedNomenclatureType(name); break;
      case 'unit': setSelectedUnit(name); break;
      case 'manufacturer': setSelectedManufacturer(name); break;
      case 'brand': setSelectedBrand(name); break;
      case 'model': setSelectedModel(name); break;
      case 'country': setSelectedCountry(name); break;
    }
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: 151, height: 40, borderRadius: 10,
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
    color: isActive ? '#FFFFFF' : '#2D4059', transition: 'all 0.3s ease',
  });

  const blockStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
  };

  const bottomButtonStyle: React.CSSProperties = {
    height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059',
  };

  const smallButtonStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const fieldBaseStyle: React.CSSProperties = {
    width: 340, height: 44, borderRadius: 10,
    marginTop: 11, display: 'flex', alignItems: 'center',
    paddingLeft: 12, paddingRight: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    outline: 'none', border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', position: 'relative',
  };

  const selectFieldStyle = (hasValue: boolean): React.CSSProperties => ({
    width: 388, height: 44, borderRadius: 10,
    border: hasValue ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', marginTop: 11,
    display: 'flex', alignItems: 'center', paddingLeft: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: hasValue ? '#666EFE' : '#9CA3AF', cursor: 'pointer',
  });

  const selectFieldStyleSmall = (hasValue: boolean): React.CSSProperties => ({
    width: 300, height: 44, borderRadius: 10,
    border: hasValue ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', marginTop: 11,
    display: 'flex', alignItems: 'center', paddingLeft: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: hasValue ? '#666EFE' : '#9CA3AF', cursor: 'pointer',
  });

  const toggleFolder = (folderId: number) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isOpen: !f.isOpen } : f));
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasScroll(container.scrollHeight > container.clientHeight);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 350);
    return () => clearTimeout(timer);
  }, [folders]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, []);

  const renderContent = () => {
    const contentStyle: React.CSSProperties = {
      position: 'absolute', top: 164, left: 30, right: 30, bottom: 111,
    };

    switch (activeTab) {
      case 0:
        return (
          <div style={{ ...contentStyle, display: 'flex', gap: 30 }}>
            <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 40, left: 30 }}>
                <span style={labelStyle}>Код:</span>
                <div style={{
                  ...fieldBaseStyle,
                  backgroundColor: '#F5F6FA',
                  border: '1px solid rgba(102, 110, 254, 0.5)',
                  cursor: 'not-allowed',
                }}>
                  <img src={code ? Icon12 : Icon11} alt="" style={{ width: 20, height: 40, position: 'absolute', left: 12 }} />
                  <span style={{ marginLeft: 44, color: '#666EFE', opacity: 0.5 }}>
                    {code || 'Код'}
                  </span>
                </div>
                <div style={{ marginTop: 25 }}>
                  <span style={labelStyle}>Артикул:</span>
                  <div style={{
                    ...fieldBaseStyle,
                    border: (article || articleFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  }}>
                    <img src={article ? Icon12 : Icon11} alt="" style={{ width: 20, height: 40, position: 'absolute', left: 12 }} />
                    <input
                      style={{
                        width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none',
                        marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                        color: article ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent',
                      }}
                      value={article}
                      onChange={e => setArticle(e.target.value)}
                      onFocus={() => setArticleFocused(true)}
                      onBlur={() => setArticleFocused(false)}
                      placeholder="Артикул"
                    />
                    {article && (
                      <button
                        onClick={() => setArticle('')}
                        style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      >
                        <img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 40, right: 52 }}>
                <span style={labelStyle}>Наименование:</span>
                <div style={{
                  ...fieldBaseStyle,
                  border: (name || nameFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                }}>
                  <img src={name ? Icon22 : Icon21} alt="" style={{ width: 16, height: 16, position: 'absolute', left: 14 }} />
                  <input
                    style={{
                      width: 'calc(100% - 50px)', height: '100%', border: 'none', outline: 'none',
                      marginLeft: 44, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                      color: name ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent',
                    }}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Введите название номенклатуры"
                  />
                  {name && (
                    <button
                      onClick={() => setName('')}
                      style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    >
                      <img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 25 }}>
                  <span style={labelStyle}>Каталог:</span>
                  <div style={{
                    ...fieldBaseStyle,
                    cursor: 'pointer',
                    border: selectedCatalog ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  }} onClick={() => openPopup('catalog')}>
                    <img src={selectedCatalog ? Icon32 : Icon31} alt="" style={{ width: 14.5, height: 18, position: 'absolute', left: 15 }} />
                    <span style={{ marginLeft: 44, color: selectedCatalog ? '#666EFE' : '#A0A3BD' }}>
                      {selectedCatalog || 'Выберите группу'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openPopup('catalog'); }}
                      style={{ position: 'absolute', right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    >
                      <img src={selectedCatalog ? Icon42 : Icon41} alt="Открыть" style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 268, left: 30, right: 30 }}>
                <span style={labelStyle}>Описание:</span>
                <div style={{
                  width: 732, height: 263, borderRadius: 10,
                  border: (description || descriptionFocused) ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative',
                }}>
                  <img src={description ? Icon52 : Icon51} alt="" style={{ width: 16, height: 16, position: 'absolute', top: 15, left: 15 }} />
                  <textarea
                    style={{
                      width: '100%', height: '100%', border: 'none', outline: 'none',
                      paddingTop: 15, paddingLeft: 44, paddingRight: 40, paddingBottom: 15,
                      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                      color: description ? '#666EFE' : '#A0A3BD',
                      backgroundColor: 'transparent', resize: 'none',
                      borderRadius: 10, boxSizing: 'border-box',
                    }}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                    placeholder="Введите описание номенклатуры"
                  />
                  {description && (
                    <button
                      onClick={() => setDescription('')}
                      style={{ position: 'absolute', top: 15, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    >
                      <img src={Icon6} alt="Очистить" style={{ width: 18, height: 18 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 40, left: 57, right: 30 }}>
                <span style={labelStyle}>Группа учета:</span>
                <div onClick={() => openPopup('accountingGroup')} style={selectFieldStyle(!!selectedAccountingGroup)}>
                  {selectedAccountingGroup || 'Выбрать группу учета'}
                </div>
              </div>
              <div style={{ position: 'absolute', top: 145, left: 57, right: 30 }}>
                <span style={labelStyle}>Группа номенклатуры:</span>
                <div onClick={() => openPopup('nomenclatureGroup')} style={selectFieldStyle(!!selectedNomenclatureGroup)}>
                  {selectedNomenclatureGroup || 'Выбрать группу'}
                </div>
              </div>
              <div style={{ position: 'absolute', top: 250, left: 57, right: 30 }}>
                <span style={labelStyle}>Вид номенклатуры:</span>
                <div onClick={() => openPopup('nomenclatureType')} style={selectFieldStyle(!!selectedNomenclatureType)}>
                  {selectedNomenclatureType || 'Выбрать вид'}
                </div>
              </div>
              <div style={{ position: 'absolute', top: 345, left: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Многократное использование</span>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(102, 110, 254, 0.3)', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача в лом (отходы)</span>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(102, 110, 254, 0.3)', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 415, height: 24, marginTop: 15 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Сдача на переточку</span>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(102, 110, 254, 0.3)', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
                </div>
              </div>
            </div>

            <div style={{ ...blockStyle, width: 413, height: 565, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 30, left: 30, right: 30 }}>
                <span style={labelStyle}>Изображение:</span>
                <div style={{ width: 353, height: 353, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11 }} />
                <div style={{ marginTop: 25 }}>
                  <span style={labelStyle}>Штрихкод:</span>
                  <div style={{ width: 353, height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11 }} />
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ ...contentStyle, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ ...blockStyle, width: 1740, height: 132, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', gap: 45 }}>
                <div><span style={labelStyle}>Единица измерения:</span><div onClick={() => openPopup('unit')} style={selectFieldStyleSmall(!!selectedUnit)}>{selectedUnit || 'Выбрать'}</div></div>
                <div><span style={labelStyle}>Производитель:</span><div onClick={() => openPopup('manufacturer')} style={selectFieldStyleSmall(!!selectedManufacturer)}>{selectedManufacturer || 'Выбрать'}</div></div>
                <div><span style={labelStyle}>Бренд:</span><div onClick={() => openPopup('brand')} style={selectFieldStyleSmall(!!selectedBrand)}>{selectedBrand || 'Выбрать'}</div></div>
                <div><span style={labelStyle}>Модель:</span><div onClick={() => openPopup('model')} style={selectFieldStyleSmall(!!selectedModel)}>{selectedModel || 'Выбрать'}</div></div>
                <div><span style={labelStyle}>Страна происхождения:</span><div onClick={() => openPopup('country')} style={selectFieldStyleSmall(!!selectedCountry)}>{selectedCountry || 'Выбрать'}</div></div>
              </div>
            </div>
            <div style={{ ...blockStyle, width: 1740, height: 418, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 15, left: 64, width: 518, height: 259, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF' }} />
              <div style={{ position: 'absolute', top: 15, left: 649, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
              <div style={{ position: 'absolute', top: 64, left: 634, display: 'flex', gap: 10 }}>
                <div style={{ width: 1056, height: 324, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
                  <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 300 }}>ХАРАКТЕРИСТИКА</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ОБОЗНАЧЕНИЕ</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>ЕД.ИЗМ.</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>ЗНАЧЕНИЕ</span>
                  </div>
                  <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {folders.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                          <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: folder.isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                        </div>
                        <AnimatePresence>
                          {folder.isOpen && folder.items.map((item) => (
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
                {hasScroll && (<div style={{ width: 10, height: 324, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={324 - 54} /></div>)}
              </div>
            </div>
          </div>
        );
      case 2: case 3: case 5:
        return (
          <div style={contentStyle}>
            <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
              <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
                <div style={{ width: 1665, height: 450, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
                  <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 52, paddingRight: 40 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: 600 }}>СТАТУС</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto' }}>ДАТА ВРЕМЯ</span>
                  </div>
                  <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {folders.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                          <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: folder.isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                        </div>
                        <AnimatePresence>
                          {folder.isOpen && folder.items.map((item) => (
                            <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                              <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 40, paddingRight: 40, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15 }}>{item.characteristic}</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: 600 }}>-</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', marginLeft: 'auto' }}>2026-05-14 12:00</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {hasScroll && (<div style={{ width: 10, height: 450, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={450 - 54} /></div>)}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={contentStyle}>
            <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
              <div style={{ position: 'absolute', top: '50%', left: 73, transform: 'translateY(-50%)', width: 490, height: 220, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#9CA3AF' }}>В разработке</span>
              </div>
              <div style={{ position: 'absolute', top: '50%', right: 40, transform: 'translateY(-50%)', display: 'flex', gap: 10 }}>
                <div style={{ width: 1054, height: 432, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
                  <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 250 }}>ДАТА</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ЦЕНА</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ПОСТАВЩИК</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>СТАТУС</span>
                  </div>
                  <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {folders.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                          <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: folder.isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                        </div>
                        <AnimatePresence>
                          {folder.isOpen && folder.items.map((item) => (
                            <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                              <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15, width: 250 }}>2026-05-14</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 200 }}>12 500 ₽</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 200 }}>ООО "Поставщик"</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>Активен</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {hasScroll && (<div style={{ width: 10, height: 432, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={432 - 54} /></div>)}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div style={{ ...contentStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ ...blockStyle, width: 1740, height: 72, flexShrink: 0 }} />
            <div style={{ ...blockStyle, width: 1740, height: 477, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
              <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
                <div style={{ width: 1665, height: 378, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
                  <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 52, paddingRight: 40 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: 600 }}>СТАТУС</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto' }}>ДАТА ВРЕМЯ</span>
                  </div>
                  <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {folders.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                          <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: folder.isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                        </div>
                        <AnimatePresence>
                          {folder.isOpen && folder.items.map((item) => (
                            <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                              <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 40, paddingRight: 40, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15 }}>{item.characteristic}</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: 600 }}>-</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', marginLeft: 'auto' }}>2026-05-14 12:00</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {hasScroll && (<div style={{ width: 10, height: 378, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={378 - 54} /></div>)}
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div style={contentStyle}>
            <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 39, left: 25, display: 'flex', gap: 10 }}>
                <div style={{ width: 1665, height: 486, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
                  <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 52, paddingRight: 40 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: 600 }}>СТАТУС</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto' }}>ДАТА ВРЕМЯ</span>
                  </div>
                  <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {folders.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                          <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: folder.isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                        </div>
                        <AnimatePresence>
                          {folder.isOpen && folder.items.map((item) => (
                            <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                              <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 40, paddingRight: 40, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15 }}>{item.characteristic}</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: 600 }}>-</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', marginLeft: 'auto' }}>2026-05-14 12:00</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {hasScroll && (<div style={{ width: 10, height: 486, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={486 - 54} /></div>)}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ position: 'absolute', top: 35, left: 60, right: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 30, fontWeight: 'bold', color: '#2D4059', margin: 0 }}>Справочник: Номенклатура (Создание)</h1>
        <button
          onClick={() => setShowClosePopup(true)}
          style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
        >
          <img src={Icon7} alt="Закрыть" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ position: 'absolute', top: 99, left: 60, right: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 25 }}>
          {tabs_list.map((tab, index) => (
            <button key={index} onClick={() => setActiveTab(index)} style={buttonStyle(activeTab === index)}>{tab}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }} />
        </div>
      </div>
      {renderContent()}
      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        <div style={{ width: 400, height: 51, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#9CA3AF', flexShrink: 0 }}>
          В разработке
        </div>
        <button style={{ ...bottomButtonStyle, width: 234 }}>Синхронизировать</button>
        <button style={{ ...bottomButtonStyle, width: 121, opacity: isSaving ? 0.6 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Сохранение...' : 'Записать'}
        </button>
        <button style={{ ...bottomButtonStyle, width: 116 }} onClick={() => setShowClosePopup(true)}>Закрыть</button>
      </div>
      
      <CatalogSelectPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} onSelect={handlePopupSelect} popupType={popupType} />

      {/* Попап закрытия */}
      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Сохранить изменения перед закрытием?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleSaveAndClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Сохранить и закрыть</button>
              <button onClick={handleCloseWithoutSaving} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Закрыть без сохранения</button>
              <button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NomenclatureCreatePage;