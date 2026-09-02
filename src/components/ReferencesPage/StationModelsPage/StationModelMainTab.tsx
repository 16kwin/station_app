// StationModelMainTab.tsx — ИСПРАВЛЕННЫЙ (селекты открывают попап через onOpenFullList)
import React, { useState, useEffect, useRef } from 'react';
import type { PopupType } from '../NomenclaturePage/CatalogSelectPopup';
import FormField from '../../elements/FormField';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CloseIcon18Blue from '../../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';
import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import ArticleIcon18Gray from '../../../assets/Icons/ArticleIcons/ArticleIcon18Gray.svg';
import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';
import ManufacturerIcon18Gray from '../../../assets/Icons/ManufacturerIcons/ManufacturerIcon18Gray.svg';
import ManufacturerIcon18Blue from '../../../assets/Icons/ManufacturerIcons/ManufacturerIcon18Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import TypeIcon16Gray from '../../../assets/Icons/TypeIcons/TypeIcon16Gray.svg';
import TypeIcon16Blue from '../../../assets/Icons/TypeIcons/TypeIcon16Blue.svg';
import RevisionIcon18Gray from '../../../assets/Icons/RevisionIcons/RevisionIcon18Gray.svg';
import RevisionIcon18Blue from '../../../assets/Icons/RevisionIcons/RevisionIcon18Blue.svg';
import CreateIcon14Gray from '../../../assets/Icons/СreateIcons/СreateIcon14Gray.svg';
import DeleteIcon16Blue from '../../../assets/Icons/DeleteIcons/DeleteIcon16Blue.svg';

export interface LocalImageItem {
  file: File;
  url: string;
  isNew?: boolean;
}

interface StationModelMainTabProps {
  uid?: string;
  code: number;
  name: string;
  article: string;
  revision: string;
  description: string;
  typeId: string;
  typeName: string;
  manufacturerId: string;
  manufacturerName: string;
  modelImageUrl: string;
  localImage: LocalImageItem | null;
  setLocalImage?: (v: LocalImageItem | null) => void;
  setName: (v: string) => void;
  setArticle: (v: string) => void;
  setRevision: (v: string) => void;
  setDescription: (v: string) => void;
  setModelImageUrl?: (v: string) => void;
  deletedImageUid?: string | null;
  setDeletedImageUid?: (v: string | null) => void;
  openPopup: (type: PopupType, filter?: string) => void;
  isEdit: boolean;
}

const FIELD_WIDTH = 340;
const FIELD_HEIGHT = 44;
const COL_GAP = 100;
const START_LEFT = 40;
const START_TOP = 30;
const ROW_HEIGHT = 107;

const StationModelMainTab: React.FC<StationModelMainTabProps> = ({
  code, name, article, revision, description,
  typeId, typeName, manufacturerId, manufacturerName,
  modelImageUrl, localImage, setLocalImage, setModelImageUrl,
  deletedImageUid, setDeletedImageUid,
  setName, setArticle, setRevision, setDescription,
  openPopup, uid,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stationTypeOptions, setStationTypeOptions] = useState<{ uid: string; name: string }[]>([]);
  const [stationManufacturerOptions, setStationManufacturerOptions] = useState<{ uid: string; name: string }[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const r = await AxiosService.get(ConstantInfo.restApiStationTypes);
        const respData = r.data as any;
        const items = Array.isArray(respData) ? respData : (respData.data || []);
        setStationTypeOptions(items.map((item: any) => ({ uid: item.uid, name: item.name })));
      } catch (e) { console.error(e); }
      try {
        const r = await AxiosService.get(ConstantInfo.restApiStationManufacturers);
        const respData = r.data as any;
        const items = Array.isArray(respData) ? respData : (respData.data || []);
        setStationManufacturerOptions(items.map((item: any) => ({ uid: item.uid, name: item.name })));
      } catch (e) { console.error(e); }
    };
    fetchOptions();
  }, []);

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059',
    display: 'block', marginBottom: 11, lineHeight: '17px',
  };

  const col1Left = START_LEFT;
  const col2Left = START_LEFT + FIELD_WIDTH + COL_GAP;
  const col3Left = col2Left + FIELD_WIDTH + COL_GAP;
  const col3Width = 780;
  const col3Height = 476;

  const getTop = (row: number) => START_TOP + row * ROW_HEIGHT;

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localImage) URL.revokeObjectURL(localImage.url);
    setLocalImage?.({ file, url: URL.createObjectURL(file), isNew: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLocalImageDelete = () => {
    if (localImage) URL.revokeObjectURL(localImage.url);
    setLocalImage?.(null);
  };

  const handleServerImageDelete = async () => {
    if (!uid) return;
    try {
      const res = await AxiosService.get(ConstantInfo.restApiStationModelImages(uid));
      if (res.data?.length > 0) {
        const imageUid = res.data[0].uid;
        setDeletedImageUid?.(imageUid);
        setModelImageUrl?.('');
      }
    } catch (err) { console.error('Ошибка удаления изображения:', err); }
  };

  const displayImageUrl = localImage ? localImage.url : (deletedImageUid ? '' : modelImageUrl);
  const hasImage = !!displayImageUrl;

  const col1Fields = [
    { top: getTop(0), component: <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Код:" value={String(code).padStart(4, '0')} type="input" disabled icon={CodeIcon20LightBlue} iconWidth={20} iconHeight={14} /> },
    { top: getTop(1), component: <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Артикул:" value={article} placeholder="Артикул" type="input" onChange={e => setArticle(e.target.value)} onClear={() => setArticle('')} icon={ArticleIcon18Gray} iconActive={ArticleIcon18Blue} iconWidth={18} iconHeight={10} /> },
    { top: getTop(2), component: (
      <FormField 
        width={FIELD_WIDTH} 
        height={FIELD_HEIGHT} 
        label="Производитель:" 
        value={manufacturerName} 
        placeholder="Выберите производителя" 
        type="select" 
        icon={ManufacturerIcon18Gray} 
        iconActive={ManufacturerIcon18Blue} 
        selectIconWidth={18} 
        selectIconHeight={16} 
        searchOptions={stationManufacturerOptions}
        onSelectOption={(selectedUid, selectedName) => {
          // Находим элемент и вызываем openPopup для выбора
          const item = stationManufacturerOptions.find(o => o.uid === selectedUid);
          if (item) {
            openPopup('stationManufacturer', item.name);
          }
        }}
        onOpenFullList={() => openPopup('stationManufacturer')}
        searchTitle="Найденный производитель"
        searchNotFoundText="Производители не найдены"
      />
    )},
    { top: getTop(3), component: (
      <div>
        <span style={labelStyle}>Описание модели:</span>
        <div style={{ width: 780, height: 155, borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid #A0A3BD', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, left: 13, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={description ? DescriptionIcon16Blue : DescriptionIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
          </div>
          <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '14px 35px 14px 42px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание модели" />
          {description && (
            <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 13, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
              <img src={CloseIcon18Blue} alt="" style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>
      </div>
    )},
  ];

  const col2Fields = [
    { top: getTop(0), component: <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Наименование модели станции:" value={name} placeholder="Введите название" type="input" onChange={e => setName(e.target.value)} onClear={() => setName('')} icon={NameIcon18Gray} iconActive={NameIcon18Blue} iconWidth={18} iconHeight={18} /> },
    { top: getTop(1), component: (
      <FormField 
        width={FIELD_WIDTH} 
        height={FIELD_HEIGHT} 
        label="Тип станции:" 
        value={typeName} 
        placeholder="Выберите тип" 
        type="select" 
        icon={TypeIcon16Gray} 
        iconActive={TypeIcon16Blue} 
        selectIconWidth={16} 
        selectIconHeight={16} 
        searchOptions={stationTypeOptions}
        onSelectOption={(selectedUid, selectedName) => {
          const item = stationTypeOptions.find(o => o.uid === selectedUid);
          if (item) {
            openPopup('stationType', item.name);
          }
        }}
        onOpenFullList={() => openPopup('stationType')}
        searchTitle="Найденный тип"
        searchNotFoundText="Типы не найдены"
      />
    )},
    { top: getTop(2), component: <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Ревизия:" value={revision} placeholder="Ревизия" type="input" onChange={e => setRevision(e.target.value)} onClear={() => setRevision('')} icon={RevisionIcon18Gray} iconActive={RevisionIcon18Blue} iconWidth={18} iconHeight={18} /> },
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
      {col1Fields.map((field, i) => (
        <div key={`col1-${i}`} style={{ position: 'absolute', top: field.top, left: col1Left }}>{field.component}</div>
      ))}
      {col2Fields.map((field, i) => (
        <div key={`col2-${i}`} style={{ position: 'absolute', top: field.top, left: col2Left }}>{field.component}</div>
      ))}
      <div style={{ position: 'absolute', top: START_TOP, left: col3Left }}>
        <span style={labelStyle}>Изображение:</span>
        <div style={{ width: col3Width, height: col3Height, borderRadius: 10, border: hasImage ? '1px solid #666EFE' : '1px solid #A0A3BD', backgroundColor: hasImage ? '#FFFFFF' : '#F5F6FA', overflow: 'hidden', position: 'relative' }}>
          <button
            onClick={() => hasImage ? (localImage ? handleLocalImageDelete() : handleServerImageDelete()) : fileInputRef.current?.click()}
            style={{ position: 'absolute', top: 20, left: 20, zIndex: 2, width: 32, height: 32, borderRadius: '50%', border: `2px solid ${hasImage ? '#666EFE' : '#A0A3BD'}`, backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <img src={hasImage ? DeleteIcon16Blue : CreateIcon14Gray} alt="" style={{ width: hasImage ? 16 : 14, height: hasImage ? 16 : 14 }} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLocalImageUpload} />
          {displayImageUrl ? (
            <img src={displayImageUrl} alt="Модель" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '30px 100px' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет изображения</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationModelMainTab;