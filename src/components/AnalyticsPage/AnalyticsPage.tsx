// AnalyticsPage.tsx — ПОЛНЫЙ ФАЙЛ
// Раздел функции orders (заказы и ТКП): без неё раздел закрыт целиком, а кнопки «Заказы» и «ТКП» ещё и
// скрыты — точки входа выключенной функции нет (раздел 8.2 проекта «Дискретное отключение функций»)
import React from 'react';
import { useTabs } from '../../context/TabContext';
import { Feature } from '../../services/features/FeatureGate';
import { useCompact } from '../hooks/useViewport';

const AnalyticsPage = () => {
  const { openTab } = useTabs();
  // Телефон и планшет: плитки столбиком во всю ширину, иконка слева от подписи
  const compact = useCompact();

  const handleOrdersClick = () => {
    openTab('/orders', 'Заказы', null);
  };

  const handleTkpClick = () => {
    openTab('/tkp', 'ТКП', null);
  };

  const buttonStyle: React.CSSProperties = compact ? {
    width: '100%',
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 600,
    color: '#2D4059',
  } : {
    width: 300,
    height: 120,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    fontFamily: 'Inter, sans-serif',
    fontSize: 20,
    fontWeight: 600,
    color: '#2D4059',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={compact
      ? { position: 'relative', backgroundColor: '#FAFBFC', padding: '14px 12px', fontFamily: 'Inter, sans-serif' }
      : { position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {compact && <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: '22px', color: '#2D4059', margin: '0 4px 12px' }}>Аналитика</h1>}
      <div style={compact ? { display: 'flex', flexDirection: 'column', gap: 8 } : { display: 'flex', gap: 40 }}>
        <Feature when="orders">
          <button onClick={handleOrdersClick} style={buttonStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Заказы
          </button>
          <button onClick={handleTkpClick} style={buttonStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            ТКП
          </button>
        </Feature>
      </div>
    </div>
  );
};

export default AnalyticsPage;