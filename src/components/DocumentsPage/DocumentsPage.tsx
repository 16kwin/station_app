// DocumentsPage.tsx — ПОЛНЫЙ ФАЙЛ
// Раздел «Документы»: кнопки документов и журналов. Кнопки раздела выключенной функции (видеоархив, ГПП) нет —
// скрыто, а не затенено (раздел 8.3 проекта «Дискретное отключение функций»). Доступность — по пути вкладки (routes.ts).
import React from 'react';
import { useTabs } from '../../context/TabContext';
import { useFeatureSnapshot } from '../../services/features/featureStore';
import { isPathAllowed } from '../../services/features/routes';

interface DocumentButton {
  /** Путь вкладки */
  path: string;
  /** Подпись вкладки */
  label: string;
  /** Текст кнопки */
  text: string;
}

const DOCUMENT_BUTTONS: readonly DocumentButton[] = [
  { path: '/documents/stock-level-control', label: 'Документ: Контроль уровня остатков', text: 'Контроль уровня остатков' },
  { path: '/documents/refill', label: 'Документ: Пополнение', text: 'Пополнение' },
  { path: '/documents/move-orders', label: 'Документ: Заказ на перемещение', text: 'Заказ на перемещение' },
  { path: '/documents/video-archive', label: 'Журнал событий: видеоархив', text: 'Журнал событий: видеоархив' },
  { path: '/documents/gpp', label: 'Документ: ГПП', text: 'График подготовки производства' },
];

const DocumentsPage = () => {
  const { openTab } = useTabs();
  // Подписка на профиль функций: кнопки перерисовываются, когда меняется состав функций
  const { on } = useFeatureSnapshot();
  const buttons = DOCUMENT_BUTTONS.filter(button => isPathAllowed(button.path, key => on.has(key)));

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
        {buttons.map(button => (
          <button key={button.path} onClick={() => openTab(button.path, button.label, null)} style={buttonStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5559E0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#666EFE'; }}>
            <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>{button.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPage;
