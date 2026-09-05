// ManufacturerMainTab.tsx — ПОЛНЫЙ ФАЙЛ (с LogoUploader)
import React, { useState, useEffect } from 'react';
import type { CommonManufacturerProps, LocalManufacturerImage } from './ManufacturerCreatePage';
import FormField from '../../elements/FormField';
import LogoUploader from '../../elements/LogoUploader';
import CodeIcon20LightBlue from '../../../assets/Icons/CodeIcons/CodeIcon20LightBlue.svg';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import CloseIcon18Blue from '../../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';
import CountrieIcon14Gray from '../../../assets/Icons/CountrieIcons/CountrieIcon14Gray.svg';
import CountrieIcon14Blue from '../../../assets/Icons/CountrieIcons/CountrieIcon14Blue.svg';
import DirectionIcon16Gray from '../../../assets/Icons/DirectionIcons/DirectionIcon16Gray.svg';
import DirectionIcon16Blue from '../../../assets/Icons/DirectionIcons/DirectionIcon16Blue.svg';
import AddressIcon18Gray from '../../../assets/Icons/AddressIcons/AddressIcon18Gray.svg';
import AddressIcon18Blue from '../../../assets/Icons/AddressIcons/AddressIcon18Blue.svg';
import MailIcon18Gray from '../../../assets/Icons/MailIcons/MailIcon18Gray.svg';
import MailIcon18Blue from '../../../assets/Icons/MailIcons/MailIcon18Blue.svg';
import NetworkIcon16Gray from '../../../assets/Icons/NetworkIcons/NetworkIcon16Gray.svg';
import NetworkIcon16Blue from '../../../assets/Icons/NetworkIcons/NetworkIcon16Blue.svg';
import PhoneIcon16Gray from '../../../assets/Icons/PhoneIcons/PhoneIcon16Gray.svg';
import PhoneIcon16Blue from '../../../assets/Icons/PhoneIcons/PhoneIcon16Blue.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

const FIELD_WIDTH = 340;
const FIELD_HEIGHT = 44;

const ManufacturerMainTab: React.FC<CommonManufacturerProps> = (props) => {
  const {
    code,
    name = '',
    nameFocused = false,
    selectedCountry = '',
    selectedCountryId = '',
    address = '',
    selectedDirection = '',
    selectedDirectionId = '',
    description = '',
    email = '',
    website = '',
    phone = '',
    validationErrors = new Set(),
    setValidationErrors = () => {},
    setName = () => {},
    setNameFocused = () => {},
    setAddress = () => {},
    setDescription = () => {},
    setEmail = () => {},
    setWebsite = () => {},
    setPhone = () => {},
    setSelectedCountry = () => {},
    setSelectedCountryId = () => {},
    setSelectedDirection = () => {},
    setSelectedDirectionId = () => {},
    openPopup = () => {},
    uid,
    isEdit,
    images = [],
    setImages = () => {},
    localImages = [],
    setLocalImages = () => {},
  } = props;

  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);

  const [countryOptions, setCountryOptions] = useState<{ uid: string; name: string }[]>([]);
  const [directionOptions, setDirectionOptions] = useState<{ uid: string; name: string }[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const countriesR = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/countries-crud`);
        setCountryOptions((countriesR.data?.data || countriesR.data || []).map((c: any) => ({ uid: c.uid || c.name, name: c.name || c.typeName })));
      } catch (e) { console.error(e); }
      try {
        const dirR = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/production-directions?userId=1`);
        setDirectionOptions((dirR.data?.data || dirR.data || []).map((d: any) => ({ uid: d.uid, name: d.name })));
      } catch (e) { console.error(e); }
    };
    fetchOptions();
  }, []);

  const fetchImages = async () => {
    if (!uid) return;
    try {
      const res = await AxiosService.get(ConstantInfo.restApiManufacturerImages(uid));
      setImages((res.data || []).map((img: any) => ({ uid: img.uid, url: img.fileUrl ? ConstantInfo.fileDir + img.fileUrl.replace(/^\//, '') : '', originalName: img.originalName || '' })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (uid && isEdit) fetchImages(); }, [uid, isEdit]);

  const handleDeleteServerImage = async (imageUid: string) => {
    try {
      await AxiosService.delete(ConstantInfo.restApiManufacturerDeleteImage(imageUid));
      await fetchImages();
    } catch (e) { console.error(e); }
  };

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', display: 'block', marginBottom: 11, lineHeight: '17px' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };

  const displayImages = [
    ...images.map(img => ({ uid: img.uid, url: img.url, originalName: img.originalName, isLocal: false })),
    ...localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name, isLocal: true })),
  ];

  const ROW1 = 30;
  const ROW2 = ROW1 + 17 + 11 + 44 + 30;
  const ROW3 = ROW2 + 17 + 11 + 44 + 30;

  return (
    <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, display: 'flex', gap: 30, overflow: 'auto' }}>
      {/* ЛЕВЫЙ БЛОК 790 */}
      <div style={{ ...blockStyle, width: 790, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: ROW1, left: 30 }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Код:" value={code ? String(code).padStart(4, '0') : ''} type="input" disabled icon={CodeIcon20LightBlue} iconWidth={20} iconHeight={14} labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW2, left: 30 }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Страна:" value={selectedCountry} placeholder="Выберите страну" type="select" icon={CountrieIcon14Gray} iconActive={CountrieIcon14Blue} selectIconWidth={14} selectIconHeight={18} searchOptions={countryOptions} onSelectOption={(uid, name) => { setSelectedCountry(name); setSelectedCountryId(uid); clearFieldError('country'); }} onOpenFullList={() => { clearFieldError('country'); openPopup('country'); }} searchTitle="Найденная страна" searchNotFoundText="Страны не найдены" labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW3, left: 30 }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Направление производства:" value={selectedDirection} placeholder="Выберите направление" type="select" icon={DirectionIcon16Gray} iconActive={DirectionIcon16Blue} selectIconWidth={16} selectIconHeight={16} searchOptions={directionOptions} onSelectOption={(uid, name) => { setSelectedDirection(name); setSelectedDirectionId(uid); clearFieldError('direction'); }} onOpenFullList={() => { clearFieldError('direction'); openPopup('direction'); }} searchTitle="Найденное направление" searchNotFoundText="Направления не найдены" labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW3 + 17 + 11 + 44 + 30, left: 30, width: 730 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: 730, height: 171, borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid #A0A3BD', backgroundColor: '#FFFFFF', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, left: 13, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={description ? DescriptionIcon16Blue : DescriptionIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
            </div>
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '14px 35px 14px 42px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
            {description && (
              <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 13, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <img src={CloseIcon18Blue} alt="" style={{ width: 18, height: 18 }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', top: ROW1, left: 420 }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Наименование:" value={name} placeholder="Введите название" type="input" onChange={e => { setName(e.target.value); clearFieldError('name'); }} onClear={() => setName('')} icon={NameIcon18Gray} iconActive={NameIcon18Blue} iconWidth={18} iconHeight={18} labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW2, left: 420 }}>
          <span style={labelStyle}>Адрес:</span>
          <div style={{ width: FIELD_WIDTH, height: 146, borderRadius: 10, border: address ? '1px solid #666EFE' : '1px solid #A0A3BD', backgroundColor: '#FFFFFF', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, left: 13, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={address ? AddressIcon18Blue : AddressIcon18Gray} alt="" style={{ width: 18, height: 18 }} />
            </div>
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '14px 35px 14px 42px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: address ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={address} onChange={e => { setAddress(e.target.value); clearFieldError('address'); }} placeholder="Введите адрес" />
            {address && (
              <button onClick={() => setAddress('')} style={{ position: 'absolute', top: 13, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <img src={CloseIcon18Blue} alt="" style={{ width: 18, height: 18 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК 420 */}
      <div style={{ ...blockStyle, width: 420, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: ROW1, left: 30, right: 30 }}>
          <FormField width={360} height={FIELD_HEIGHT} label="E-mail:" value={email} placeholder="Введите email" type="input" onChange={e => { setEmail(e.target.value); clearFieldError('email'); }} onClear={() => setEmail('')} icon={MailIcon18Gray} iconActive={MailIcon18Blue} iconWidth={18} iconHeight={14} labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW2, left: 30, right: 30 }}>
          <FormField width={360} height={FIELD_HEIGHT} label="Сайт:" value={website} placeholder="Введите сайт" type="input" onChange={e => { setWebsite(e.target.value); clearFieldError('website'); }} onClear={() => setWebsite('')} icon={NetworkIcon16Gray} iconActive={NetworkIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
        </div>
        <div style={{ position: 'absolute', top: ROW3, left: 30, right: 30 }}>
          <FormField width={360} height={FIELD_HEIGHT} label="Телефон:" value={phone} placeholder="Введите телефон" type="input" onChange={e => { setPhone(e.target.value); clearFieldError('phone'); }} onClear={() => setPhone('')} icon={PhoneIcon16Gray} iconActive={PhoneIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={11} />
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК 470 */}
      <div style={{ ...blockStyle, width: 470, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, left: 30 }}>
          <span style={labelStyle}>Логотип</span>
          <LogoUploader
            images={displayImages}
            selectedIndex={localSelectedIndex}
            onSelectImage={(idx) => setLocalSelectedIndex(idx)}
            onUpload={(files) => {
              const imgs: LocalManufacturerImage[] = [];
              for (let i = 0; i < files.length; i++) {
                imgs.push({ file: files[i], url: URL.createObjectURL(files[i]) });
              }
              setLocalImages((p: LocalManufacturerImage[]) => {
                const newLocalImages = [...p, ...imgs];
                const newTotalCount = images.length + newLocalImages.length;
                setLocalSelectedIndex(newTotalCount - 1);
                return newLocalImages;
              });
            }}
            onDelete={(uid, index) => {
              const targetImage = displayImages[index];
              if (targetImage?.isLocal) {
                const localIndex = index - images.length;
                setLocalImages((p: LocalManufacturerImage[]) => {
                  const n = [...p];
                  if (n[localIndex]) URL.revokeObjectURL(n[localIndex].url);
                  n.splice(localIndex, 1);
                  return n;
                });
                if (localSelectedIndex >= displayImages.length - 1) {
                  setLocalSelectedIndex(Math.max(0, displayImages.length - 2));
                }
              } else if (targetImage) {
                handleDeleteServerImage(uid);
                if (localSelectedIndex >= displayImages.length - 1) {
                  setLocalSelectedIndex(Math.max(0, displayImages.length - 2));
                }
              }
            }}
            width={410}
            height={283}
          />
        </div>
      </div>
    </div>
  );
};

export default ManufacturerMainTab;