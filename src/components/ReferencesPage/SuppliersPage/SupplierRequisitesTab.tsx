// SupplierRequisitesTab.tsx — ПОЛНЫЙ ФАЙЛ
import React from 'react';
import type { CommonSupplierProps } from './SupplierCreatePage';

const SupplierRequisitesTab: React.FC<CommonSupplierProps> = (props) => {
  const { inn, ogrn, kpp, contactPerson, contactPosition, contactPhone, director, directorPosition, bankName, bik, correspondentAccount, settlementAccount, description, setInn, setOgrn, setKpp, setContactPerson, setContactPosition, setContactPhone, setDirector, setDirectorPosition, setBankName, setBik, setCorrespondentAccount, setSettlementAccount, setDescription } = props;

  const labelStyle: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' };
  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const fieldStyle: React.CSSProperties = { width: 340, height: 44, borderRadius: 10, marginTop: 11, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', backgroundColor: '#FFFFFF', position: 'relative', boxSizing: 'border-box', border: '1px solid rgba(102, 110, 254, 0.15)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '100%', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#666EFE', backgroundColor: 'transparent' };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={{ ...cs, display: 'flex', gap: 30 }}>
      {/* ЛЕВЫЙ БЛОК — реквизиты */}
      <div style={{ ...blockStyle, width: 792, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30 }}>
          <span style={labelStyle}>ИНН:</span>
          <div style={fieldStyle}><input style={inputStyle} value={inn} onChange={e => setInn(e.target.value)} placeholder="Введите ИНН" /></div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>ОГРН:</span>
            <div style={fieldStyle}><input style={inputStyle} value={ogrn} onChange={e => setOgrn(e.target.value)} placeholder="Введите ОГРН" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>КПП:</span>
            <div style={fieldStyle}><input style={inputStyle} value={kpp} onChange={e => setKpp(e.target.value)} placeholder="Введите КПП" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Контактное лицо:</span>
            <div style={fieldStyle}><input style={inputStyle} value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="ФИО" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Должность контактного лица:</span>
            <div style={fieldStyle}><input style={inputStyle} value={contactPosition} onChange={e => setContactPosition(e.target.value)} placeholder="Должность" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Телефон контактного лица:</span>
            <div style={fieldStyle}><input style={inputStyle} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Телефон" /></div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 40, right: 52 }}>
          <span style={labelStyle}>Руководитель:</span>
          <div style={fieldStyle}><input style={inputStyle} value={director} onChange={e => setDirector(e.target.value)} placeholder="ФИО" /></div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Должность руководителя:</span>
            <div style={fieldStyle}><input style={inputStyle} value={directorPosition} onChange={e => setDirectorPosition(e.target.value)} placeholder="Должность" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Банк:</span>
            <div style={fieldStyle}><input style={inputStyle} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Наименование банка" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>БИК:</span>
            <div style={fieldStyle}><input style={inputStyle} value={bik} onChange={e => setBik(e.target.value)} placeholder="Введите БИК" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Корр. счет:</span>
            <div style={fieldStyle}><input style={inputStyle} value={correspondentAccount} onChange={e => setCorrespondentAccount(e.target.value)} placeholder="Корреспондентский счет" /></div>
          </div>
          <div style={{ marginTop: 25 }}><span style={labelStyle}>Расч. счет:</span>
            <div style={fieldStyle}><input style={inputStyle} value={settlementAccount} onChange={e => setSettlementAccount(e.target.value)} placeholder="Расчетный счет" /></div>
          </div>
        </div>
      </div>

      {/* ПРАВЫЙ БЛОК — описание */}
      <div style={{ ...blockStyle, width: 475, height: 565, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 40, left: 30, right: 30 }}>
          <span style={labelStyle}>Описание:</span>
          <div style={{ width: 415, height: 400, borderRadius: 10, border: description ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', marginTop: 11, position: 'relative' }}>
            <textarea style={{ width: '100%', height: '100%', border: 'none', outline: 'none', paddingTop: 12, paddingLeft: 14, paddingRight: 14, paddingBottom: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: description ? '#666EFE' : '#A0A3BD', backgroundColor: 'transparent', resize: 'none', borderRadius: 10, boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Введите описание" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierRequisitesTab;