// SupplierAssortmentTab.tsx — ПОЛНЫЙ ФАЙЛ
import React from 'react';
import type { CommonSupplierProps } from './SupplierCreatePage';

const SupplierAssortmentTab: React.FC<CommonSupplierProps> = () => {
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };
  return (
    <div style={{ ...cs, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Ассортимент</span>
    </div>
  );
};

export default SupplierAssortmentTab;