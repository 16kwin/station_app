// MainPage.tsx — главная страница: панель «Информационная панель (Топ-менеджмент)» в белом блоке 1800×840
import React from 'react';
import EconomicDashboard from './economic/EconomicDashboard';

const MainPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: 1800, height: 840, padding: 0 }}>
      <EconomicDashboard />
    </div>
  );
};

export default MainPage;
