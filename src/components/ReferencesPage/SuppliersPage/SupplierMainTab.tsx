// SupplierMainTab.tsx — ПОЛНЫЙ ФАЙЛ (с LogoUploader)
import React, { useState, useEffect } from 'react';
import type { CommonSupplierProps, LocalImageItem } from './SupplierCreatePage';
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
import RatingIcon16Black from '../../../assets/Icons/RatingIcons/RatingIcon16Black.svg';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

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
  return <div style={{ display: 'flex', gap: 8 }}>{stars}</div>;
};

const FIELD_WIDTH = 340;
const FIELD_HEIGHT = 44;

const SupplierMainTab: React.FC<CommonSupplierProps> = (props) => {
  const {
    code,
    name = '',
    selectedCountry = '',
    selectedCountryId = '',
    address = '',
    selectedShortDescription = '',
    selectedShortDescriptionId = '',
    description = '',
    email = '',
    website = '',
    phone = '',
    averageRating = 0,
    images = [],
    localImages = [],
    setLocalImages = () => {},
    validationErrors = new Set(),
    setValidationErrors = () => {},
    setName = () => {},
    setAddress = () => {},
    setDescription = () => {},
    setEmail = () => {},
    setWebsite = () => {},
    setPhone = () => {},
    setSelectedCountry = () => {},
    setSelectedCountryId = () => {},
    setSelectedShortDescription = () => {},
    setSelectedShortDescriptionId = () => {},
    handleDeleteImage = () => {},
    openPopup = () => {},
  } = props;

  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);

  const [countryOptions, setCountryOptions] = useState<{ uid: string; name: string }[]>([]);
  const [shortDescriptionOptions, setShortDescriptionOptions] = useState<{ uid: string; name: string }[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const countriesR = await AxiosService.get(`${ConstantInfo.apiBaseUrl}/api/countries-crud`);
        setCountryOptions((countriesR.data?.data || countriesR.data || []).map((c: any) => ({ uid: c.uid || c.name, name: c.name || c.typeName })));
      } catch (e) { console.error(e); }
      try {
        const dirR = await AxiosService.get(ConstantInfo.restApiSupplierDescriptionTypes);
        setShortDescriptionOptions((dirR.data || []).map((d: any) => ({ uid: d.uid, name: d.name })));
      } catch (e) { console.error(e); }
    };
    fetchOptions();
  }, []);

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', display: 'block', marginBottom: 11, lineHeight: '17px' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };

  const getRatingStatus = (): string => {
    if (!averageRating || averageRating === 0) return 'Рейтинг отсутствует';
    if (averageRating <= 2) return 'Низкий рейтинг';
    if (averageRating <= 4) return 'Средний рейтинг';
    return 'Высокий рейтинг';
  };

  // Объединяем бэкендовские и локальные изображения
  const displayImages = [
    ...images.map(img => ({ uid: img.uid, url: img.url, originalName: img.originalName, isLocal: false })),
    ...localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name, isLocal: true })),
  ];

  // Позиции
  const ROW1 = 30;
  const ROW2 = ROW1 + 17 + 11 + 44 + 30;
  const ROW3 = ROW2 + 17 + 11 + 44 + 30;
  const RATING_ROW = ROW3 + 17 + 11 + 44 + 143; // 143 ниже поля телефона
  const RATING_STARS_TOP = RATING_ROW + 19 + 12; // строка + 12 отступ
  const RATING_STATUS_TOP = RATING_STARS_TOP + 18 + 19; // звёзды + 19

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
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Краткое описание (направление):" value={selectedShortDescription} placeholder="Выберите тип" type="select" icon={DirectionIcon16Gray} iconActive={DirectionIcon16Blue} selectIconWidth={16} selectIconHeight={16} searchOptions={shortDescriptionOptions} onSelectOption={(uid, name) => { setSelectedShortDescription(name); setSelectedShortDescriptionId(uid); clearFieldError('shortDescription'); }} onOpenFullList={() => { clearFieldError('shortDescription'); openPopup('shortDescription'); }} searchTitle="Найденное направление" searchNotFoundText="Направления не найдены" labelMarginBottom={11} />
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
        
        {/* РЕЙТИНГ */}
        <div style={{ position: 'absolute', top: RATING_ROW, left: 0, right: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 30 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Рейтинг поставщика:</span>
            <button onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 6 } }))} style={{ marginLeft: 9, width: 16, height: 16, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
              <img src={RatingIcon16Black} alt="Рейтинг" style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, paddingLeft: 40 }}>
            <StarRatingSmall value={averageRating || 0} size={18} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 46 }}>Средний рейтинг: {averageRating || 0}</span>
          </div>
        </div>
        
        <div style={{ position: 'absolute', top: RATING_STATUS_TOP, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#666EFE' }}>{getRatingStatus()}</span>
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
              const imgs: LocalImageItem[] = [];
              for (let i = 0; i < files.length; i++) {
                imgs.push({ file: files[i], url: URL.createObjectURL(files[i]) });
              }
              setLocalImages((p: LocalImageItem[]) => {
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
                setLocalImages((p: LocalImageItem[]) => {
                  const n = [...p];
                  if (n[localIndex]) URL.revokeObjectURL(n[localIndex].url);
                  n.splice(localIndex, 1);
                  return n;
                });
                if (localSelectedIndex >= displayImages.length - 1) {
                  setLocalSelectedIndex(Math.max(0, displayImages.length - 2));
                }
              } else if (targetImage) {
                handleDeleteImage(uid);
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

export default SupplierMainTab;