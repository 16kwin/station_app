// SchablonSaveAsPopup.tsx — ПОПАП «Записать как»
import React, { useState, useEffect } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

interface CategoryOption {
  id: number;
  name: string;
}

interface SchablonSaveAsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  configurationName: string;
  onConfirm: (name: string, categoryId: number | null) => Promise<boolean>;
}

const SchablonSaveAsPopup: React.FC<SchablonSaveAsPopupProps> = ({
  isOpen,
  onClose,
  defaultName,
  configurationName,
  onConfirm,
}) => {
  const [name, setName] = useState(defaultName);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setCategoryId(null);
      setShowCategoryDropdown(false);
      AxiosService.get(ConstantInfo.restApiTemplatesCategories)
        .then(res => setCategories((res.data || []).map((c: any) => ({ id: c.id, name: c.name }))))
        .catch(e => console.error(e));
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSubmit = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    const ok = await onConfirm(name.trim(), categoryId);
    setIsSaving(false);
    if (ok) onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    paddingLeft: 12, paddingRight: 12,
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
    color: '#2D4059', outline: 'none', boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
  };

  const disabledFieldStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#F5F6FA',
    color: '#A0A3BD',
    cursor: 'not-allowed',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: 500, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Записать как</h3>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); else if (e.key === 'Escape') onClose(); }}
            placeholder="Введите название"
            autoFocus
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Конфигурация</label>
          <input type="text" value={configurationName || '—'} disabled style={disabledFieldStyle} />
        </div>

        <div style={{ position: 'relative' }}>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Папка</label>
          <div
            onClick={() => setShowCategoryDropdown(v => !v)}
            style={{
              ...inputStyle,
              display: 'flex', alignItems: 'center',
              cursor: 'pointer',
              border: categoryId ? '1px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: categoryId ? '#666EFE' : '#A0A3BD' }}>
              {selectedCategory?.name || 'Выберите папку'}
            </span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke={categoryId ? '#666EFE' : '#A0A3BD'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {showCategoryDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              backgroundColor: '#FFFFFF', borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(102, 110, 254, 0.15)',
              maxHeight: 220, overflowY: 'auto', zIndex: 10, padding: '8px 0',
            }}>
              {categories.length === 0 ? (
                <div style={{ padding: '10px 15px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет папок</div>
              ) : categories.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); setShowCategoryDropdown(false); }}
                  style={{
                    padding: '10px 15px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                    color: categoryId === c.id ? '#666EFE' : '#2D4059',
                    backgroundColor: categoryId === c.id ? '#F0F2FF' : 'transparent',
                  }}
                  onMouseEnter={e => { if (categoryId !== c.id) e.currentTarget.style.backgroundColor = '#F5F6FA'; }}
                  onMouseLeave={e => { if (categoryId !== c.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !categoryId || isSaving}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none',
              backgroundColor: name.trim() && categoryId && !isSaving ? '#666EFE' : '#BCC8FF',
              cursor: name.trim() && categoryId && !isSaving ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF',
            }}
          >
            {isSaving ? 'Создание...' : 'Создать копию'}
          </button>
          <button
            onClick={onClose}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10,
              border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchablonSaveAsPopup;