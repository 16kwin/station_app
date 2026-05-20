// CreateGroupPopup.tsx
import React, { useState } from 'react';

interface GroupOption {
  uid: string;
  name: string;
}

interface CreateGroupPopupProps {
  isOpen: boolean;
  currentParentName: string | null;
  groups: GroupOption[];
  onClose: () => void;
  onSubmit: (name: string, parentUid: string | null) => void;
  isLoading: boolean;
}

const CreateGroupPopup: React.FC<CreateGroupPopupProps> = ({ isOpen, currentParentName, groups, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [parentType, setParentType] = useState<'current' | 'root' | 'other'>('current');
  const [selectedOtherUid, setSelectedOtherUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;

    let parentUid: string | null = null;

    if (parentType === 'current' && currentParentName) {
      // Будет взято из openPath на уровне NomenclaturePage
      parentUid = '__current__'; // маркер — использовать текущий openPath
    } else if (parentType === 'other' && selectedOtherUid) {
      parentUid = selectedOtherUid;
    }
    // parentType === 'root' или нет текущей — parentUid остаётся null

    onSubmit(name.trim(), parentUid);
    setName('');
    setParentType('current');
    setSelectedOtherUid(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '500px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', display: 'flex', flexDirection: 'column', gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '22px', fontWeight: 'bold', color: '#2D4059', margin: 0 }}>
          Создание группы
        </h2>

        {/* Выбор родительской группы */}
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#2D4059', display: 'block', marginBottom: '8px' }}>
            Родительская группа
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {currentParentName && (
              <button
                onClick={() => setParentType('current')}
                style={{
                  height: '36px', paddingLeft: '14px', paddingRight: '14px', borderRadius: '8px',
                  border: parentType === 'current' ? '2px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                  backgroundColor: parentType === 'current' ? '#E8E9FF' : '#FFFFFF',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#2D4059',
                }}
              >
                Текущая: {currentParentName}
              </button>
            )}
            <button
              onClick={() => setParentType('root')}
              style={{
                height: '36px', paddingLeft: '14px', paddingRight: '14px', borderRadius: '8px',
                border: parentType === 'root' ? '2px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: parentType === 'root' ? '#E8E9FF' : '#FFFFFF',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#2D4059',
              }}
            >
              Корневая
            </button>
            <button
              onClick={() => setParentType('other')}
              style={{
                height: '36px', paddingLeft: '14px', paddingRight: '14px', borderRadius: '8px',
                border: parentType === 'other' ? '2px solid #666EFE' : '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: parentType === 'other' ? '#E8E9FF' : '#FFFFFF',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 400, color: '#2D4059',
              }}
            >
              Выбрать другую
            </button>
          </div>

          {parentType === 'other' && (
            <select
              value={selectedOtherUid || ''}
              onChange={(e) => setSelectedOtherUid(e.target.value || null)}
              style={{
                width: '100%', height: '40px', borderRadius: '10px',
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                paddingLeft: '12px', paddingRight: '12px', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', color: '#2D4059', outline: 'none', marginTop: '8px', boxSizing: 'border-box',
              }}
            >
              <option value="">Выберите группу</option>
              {groups.map(group => (
                <option key={group.uid} value={group.uid}>{group.name}</option>
              ))}
            </select>
          )}

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', margin: '8px 0 0 0' }}>
            {parentType === 'current' && currentParentName ? `Создать в: ${currentParentName}` :
             parentType === 'root' ? 'Создать в корне' :
             parentType === 'other' && selectedOtherUid ? `Создать в: ${groups.find(g => g.uid === selectedOtherUid)?.name}` :
             'Создать в корне'}
          </p>
        </div>

        {/* Название */}
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#2D4059', display: 'block', marginBottom: '8px' }}>
            Название группы
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите название"
            autoFocus
            style={{
              width: '100%', height: '44px', borderRadius: '10px',
              border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
              paddingLeft: '12px', paddingRight: '12px', fontFamily: 'Inter, sans-serif',
              fontSize: '15px', color: '#2D4059', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ height: '40px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '10px', border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 400, color: '#2D4059' }}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={isLoading || !name.trim()} style={{ height: '40px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '10px', border: 'none', backgroundColor: name.trim() && !isLoading ? '#666EFE' : '#BCC8FF', cursor: name.trim() && !isLoading ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>
            {isLoading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPopup;