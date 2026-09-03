// SupplierRequisitesTab.tsx — ПОЛНЫЙ ФАЙЛ (новые иконки)
import React, { useState } from 'react';
import type { CommonSupplierProps, LocalImageItem } from './SupplierCreatePage';
import FormField from '../../elements/FormField';
import LogoUploader from '../../elements/LogoUploader';
import CloseIcon18Blue from '../../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import DescriptionIcon16Gray from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Gray.svg';
import DescriptionIcon16Blue from '../../../assets/Icons/DescriptionIcons/DescriptionIcon16Blue.svg';
import ManIcon16Gray from '../../../assets/Icons/ManIcons/ManIcon16Gray.svg';
import ManIcon16Blue from '../../../assets/Icons/ManIcons/ManIcon16Blue.svg';
import PostIcon18Gray from '../../../assets/Icons/PostIcons/PostIcon18Gray.svg';
import PostIcon18Blue from '../../../assets/Icons/PostIcons/PostIcon18Blue.svg';
import PhoneIcon16Gray from '../../../assets/Icons/PhoneIcons/PhoneIcon16Gray.svg';
import PhoneIcon16Blue from '../../../assets/Icons/PhoneIcons/PhoneIcon16Blue.svg';
import BankIcon16Gray from '../../../assets/Icons/BankIcons/BankIcon16Gray.svg';
import BankIcon16Blue from '../../../assets/Icons/BankIcons/BankIcon16Blue.svg';
import ScoreIcon14Gray from '../../../assets/Icons/ScoreIcons/ScoreIcon14Gray.svg';
import ScoreIcon14Blue from '../../../assets/Icons/ScoreIcons/ScoreIcon14Blue.svg';
import CardIcon18Gray from '../../../assets/Icons/CardIcons/CardIcon18Gray.svg';
import CardIcon18Blue from '../../../assets/Icons/CardIcons/CardIcon18Blue.svg';

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

  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);

  const clearFieldError = (fieldKey: string) => { setValidationErrors(prev => { const next = new Set(prev); next.delete(fieldKey); return next; }); };

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', display: 'block', marginBottom: 11, lineHeight: '17px' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };

  const FIELD_WIDTH = 340;
  const FIELD_HEIGHT = 44;
  const FIELD_WIDTH_MIDDLE = 360;
  const ROW_GAP = 25;
  const MIDDLE_ROW_GAP = 30;
  const START_TOP = 30;
  const START_LEFT = 30;
  const LABEL_MARGIN = 11;
  const COL2_OFFSET = FIELD_WIDTH + 50;

  const getTop = (row: number) => START_TOP + row * (17 + LABEL_MARGIN + FIELD_HEIGHT + ROW_GAP);

  const displayImages = [
    ...images.map(img => ({ uid: img.uid, url: img.url, originalName: img.originalName, isLocal: false })),
    ...localImages.map(img => ({ uid: img.url, url: img.url, originalName: img.file.name, isLocal: true })),
  ];

  return (
    <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96, display: 'flex', gap: 30, overflow: 'auto' }}>
      {/* ЛЕВЫЙ БЛОК 790 */}
      <div style={{ ...blockStyle, width: 790, height: 565, flexShrink: 0, position: 'relative' }}>
        {/* Левая колонка */}
        <div style={{ position: 'absolute', top: getTop(0), left: START_LEFT }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="ИНН:" value={inn} placeholder="ИНН" type="input" onChange={e => { setInn(e.target.value); clearFieldError('inn'); }} onClear={() => setInn('')} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(1), left: START_LEFT }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="ОГРН:" value={ogrn} placeholder="ОГРН" type="input" onChange={e => { setOgrn(e.target.value); clearFieldError('ogrn'); }} onClear={() => setOgrn('')} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(2), left: START_LEFT }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Руководитель:" value={director} placeholder="ФИО" type="input" onChange={e => { setDirector(e.target.value); clearFieldError('director'); }} onClear={() => setDirector('')} icon={ManIcon16Gray} iconActive={ManIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(3), left: START_LEFT }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Должность руководителя:" value={directorPosition} placeholder="Должность" type="input" onChange={e => { setDirectorPosition(e.target.value); clearFieldError('directorPosition'); }} onClear={() => setDirectorPosition('')} icon={PostIcon18Gray} iconActive={PostIcon18Blue} iconWidth={18} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>

        {/* Правая колонка */}
        <div style={{ position: 'absolute', top: getTop(0), left: START_LEFT + COL2_OFFSET }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="КПП:" value={kpp} placeholder="КПП" type="input" onChange={e => { setKpp(e.target.value); clearFieldError('kpp'); }} onClear={() => setKpp('')} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(1), left: START_LEFT + COL2_OFFSET }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Контактное лицо:" value={contactPerson} placeholder="ФИО" type="input" onChange={e => { setContactPerson(e.target.value); clearFieldError('contactPerson'); }} onClear={() => setContactPerson('')} icon={ManIcon16Gray} iconActive={ManIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(2), left: START_LEFT + COL2_OFFSET }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Должность контактного лица:" value={contactPosition} placeholder="Должность" type="input" onChange={e => { setContactPosition(e.target.value); clearFieldError('contactPosition'); }} onClear={() => setContactPosition('')} icon={PostIcon18Gray} iconActive={PostIcon18Blue} iconWidth={18} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: getTop(3), left: START_LEFT + COL2_OFFSET }}>
          <FormField width={FIELD_WIDTH} height={FIELD_HEIGHT} label="Номер телефона контактного лица:" value={contactPhone} placeholder="Телефон" type="input" onChange={e => { setContactPhone(e.target.value); clearFieldError('contactPhone'); }} onClear={() => setContactPhone('')} icon={PhoneIcon16Gray} iconActive={PhoneIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>

        {/* Дополнительная информация */}
        <div style={{ position: 'absolute', top: getTop(4), left: START_LEFT, width: 730 }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: LABEL_MARGIN, lineHeight: '17px' }}>Дополнительная информация:</span>
          <div style={{ width: 730, height: 89, borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid #A0A3BD', backgroundColor: '#FFFFFF', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, left: 13, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={description ? DescriptionIcon16Blue : DescriptionIcon16Gray} alt="" style={{ width: 16, height: 16 }} />
            </div>
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '14px 35px 14px 42px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите дополнительную информацию" />
            {description && (
              <button onClick={() => setDescription('')} style={{ position: 'absolute', top: 13, right: 13, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <img src={CloseIcon18Blue} alt="" style={{ width: 18, height: 18 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* СРЕДНИЙ БЛОК 420 */}
      <div style={{ ...blockStyle, width: 420, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: START_TOP, left: START_LEFT, right: START_LEFT }}>
          <FormField width={FIELD_WIDTH_MIDDLE} height={FIELD_HEIGHT} label="Банк:" value={bankName} placeholder="Наименование банка" type="input" onChange={e => { setBankName(e.target.value); clearFieldError('bankName'); }} onClear={() => setBankName('')} icon={BankIcon16Gray} iconActive={BankIcon16Blue} iconWidth={16} iconHeight={16} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: START_TOP + 17 + LABEL_MARGIN + FIELD_HEIGHT + MIDDLE_ROW_GAP, left: START_LEFT, right: START_LEFT }}>
          <FormField width={FIELD_WIDTH_MIDDLE} height={FIELD_HEIGHT} label="БИК:" value={bik} placeholder="БИК" type="input" onChange={e => { setBik(e.target.value); clearFieldError('bik'); }} onClear={() => setBik('')} icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} iconWidth={20} iconHeight={14} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: START_TOP + 2 * (17 + LABEL_MARGIN + FIELD_HEIGHT + MIDDLE_ROW_GAP), left: START_LEFT, right: START_LEFT }}>
          <FormField width={FIELD_WIDTH_MIDDLE} height={FIELD_HEIGHT} label="Корреспондентский счет:" value={correspondentAccount} placeholder="Корр. счет" type="input" onChange={e => { setCorrespondentAccount(e.target.value); clearFieldError('correspondentAccount'); }} onClear={() => setCorrespondentAccount('')} icon={ScoreIcon14Gray} iconActive={ScoreIcon14Blue} iconWidth={14} iconHeight={18} labelMarginBottom={LABEL_MARGIN} />
        </div>
        <div style={{ position: 'absolute', top: START_TOP + 3 * (17 + LABEL_MARGIN + FIELD_HEIGHT + MIDDLE_ROW_GAP), left: START_LEFT, right: START_LEFT }}>
          <FormField width={FIELD_WIDTH_MIDDLE} height={FIELD_HEIGHT} label="Расчетный счет:" value={settlementAccount} placeholder="Расч. счет" type="input" onChange={e => { setSettlementAccount(e.target.value); clearFieldError('settlementAccount'); }} onClear={() => setSettlementAccount('')} icon={CardIcon18Gray} iconActive={CardIcon18Blue} iconWidth={18} iconHeight={14} labelMarginBottom={LABEL_MARGIN} />
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК 470 — ИДЕНТИЧЕН MainTab */}
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

export default SupplierRequisitesTab;