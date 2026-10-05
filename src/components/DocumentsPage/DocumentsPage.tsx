// DocumentsPage.tsx — ПОЛНЫЙ ФАЙЛ
import React from 'react';
import { useTabs } from '../../context/TabContext';

const DocumentsPage = () => {
  const { openTab } = useTabs();

  const buttonStyle: React.CSSProperties = {
    height: '54px',
    padding: '0 24px',
    borderRadius: '27px',
    backgroundColor: '#666EFE',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(102, 110, 254, 0.3)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ paddingTop: '35px', paddingLeft: '60px' }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '30px', fontWeight: 'bold', letterSpacing: '0', color: '#2D4059', margin: 0 }}>Документы</h1>
      </div>
      <div style={{ paddingLeft: '60px', paddingTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => openTab('/references/templates', 'Справочник: Шаблоны пополнения', null)} style={buttonStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5559E0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#666EFE'; }}>
          <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>Шаблоны пополнения</span>
        </button>
        <button onClick={() => openTab('/documents/stock-level-control', 'Документ: Контроль уровня остатков', null)} style={buttonStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5559E0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#666EFE'; }}>
          <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>Контроль уровня остатков</span>
        </button>
        <button onClick={() => openTab('/documents/refill', 'Документ: Пополнение', null)} style={buttonStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5559E0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#666EFE'; }}>
          <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>Пополнение</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentsPage;