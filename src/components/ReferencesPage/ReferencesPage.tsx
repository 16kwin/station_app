// ReferencesPage.tsx — ПОЛНЫЙ ФАЙЛ
import React from 'react';
import { useTabs } from '../../context/TabContext';
import { useCompact } from '../hooks/useViewport';
import CompactSectionIndex from '../elements/CompactSectionIndex';

/** Телефон и планшет: справочники по группам (на компьютере — прежний ряд кнопок) */
const COMPACT_GROUPS: { title: string; paths: string[] }[] = [
  {
    title: 'Номенклатура',
    paths: ['/references/nomenclature', '/references/accounting-groups', '/references/nomenclature-groups', '/references/nomenclature-types',
      '/references/attribute-groups', '/references/attribute-types', '/references/units', '/references/nomenclature-units', '/references/templates'],
  },
  {
    title: 'Производители и поставщики',
    paths: ['/references/manufacturers', '/references/brands', '/references/models', '/references/countries', '/references/suppliers',
      '/references/supplier-directions', '/references/supplier-brands', '/references/production-directions'],
  },
  {
    title: 'Организация',
    paths: ['/references/locations', '/references/holdings', '/references/enterprises', '/references/workshops', '/references/sections', '/references/employees'],
  },
  {
    title: 'Станции',
    paths: ['/references/stations', '/references/station-types', '/references/station-manufacturers', '/references/station-models', '/references/station-configurations'],
  },
];

const ReferencesPage = () => {
  const { openTab } = useTabs();
  const compact = useCompact();

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

  const items: { path: string; label: string; tabLabel: string }[] = [
    { path: '/references/locations', label: 'Расположения', tabLabel: 'Справочник: Расположения' },
    { path: '/references/holdings', label: 'Холдинги', tabLabel: 'Справочник: Холдинги' },
    { path: '/references/nomenclature', label: 'Номенклатура', tabLabel: 'Справочник: Номенклатура' },
    { path: '/references/templates', label: 'Шаблоны пополнения', tabLabel: 'Справочник: Шаблоны пополнения' },
    { path: '/references/accounting-groups', label: 'Группы учета', tabLabel: 'Справочник: Группы учета' },
    { path: '/references/nomenclature-groups', label: 'Группы номенклатуры', tabLabel: 'Справочник: Группы номенклатуры' },
    { path: '/references/nomenclature-types', label: 'Виды номенклатуры', tabLabel: 'Справочник: Виды номенклатуры' },
    { path: '/references/attribute-groups', label: 'Группы характеристик', tabLabel: 'Справочник: Группы характеристик' },
    { path: '/references/attribute-types', label: 'Виды характеристик', tabLabel: 'Справочник: Виды характеристик' },
    { path: '/references/units', label: 'Единицы измерения характеристик', tabLabel: 'Справочник: Единицы измерения характеристик' },
    { path: '/references/nomenclature-units', label: 'Единицы измерения', tabLabel: 'Справочник: Единицы измерения' },
    { path: '/references/production-directions', label: 'Направления производства', tabLabel: 'Справочник: Направления производства' },
    { path: '/references/manufacturers', label: 'Производители', tabLabel: 'Справочник: Производители' },
    { path: '/references/brands', label: 'Бренды', tabLabel: 'Справочник: Бренды' },
    { path: '/references/models', label: 'Модели', tabLabel: 'Справочник: Модели' },
    { path: '/references/countries', label: 'Страны', tabLabel: 'Справочник: Страны' },
    { path: '/references/supplier-directions', label: 'Направления поставщиков', tabLabel: 'Справочник: Направления поставщиков' },
    { path: '/references/supplier-brands', label: 'Бренды поставщиков', tabLabel: 'Справочник: Бренды поставщиков' },
    { path: '/references/suppliers', label: 'Поставщики', tabLabel: 'Справочник: Поставщики' },
    { path: '/references/enterprises', label: 'Предприятия', tabLabel: 'Справочник: Предприятия' },
    { path: '/references/workshops', label: 'Цеха', tabLabel: 'Справочник: Цеха' },
    { path: '/references/sections', label: 'Участки', tabLabel: 'Справочник: Участки' },
    { path: '/references/employees', label: 'Сотрудники', tabLabel: 'Справочник: Сотрудники' },
    { path: '/references/station-types', label: 'Типы станций', tabLabel: 'Справочник: Типы станций' },
    { path: '/references/station-manufacturers', label: 'Производители станций', tabLabel: 'Справочник: Производители станций' },
    { path: '/references/station-models', label: 'Модели станций', tabLabel: 'Справочник: Модели станций' },
    { path: '/references/station-configurations', label: 'Конфигурации станций', tabLabel: 'Справочник: Конфигурации станций' },
    { path: '/references/stations', label: 'Станции', tabLabel: 'Справочник: Станции' },
  ];

  if (compact) {
    const byPath = new Map(items.map(item => [item.path, item]));
    const grouped = new Set(COMPACT_GROUPS.flatMap(group => group.paths));
    // Справочник, не попавший в группы (добавят новый), — в «Прочие», чтобы не пропал
    const others = items.filter(item => !grouped.has(item.path)).map(item => item.path);
    const groups = others.length > 0 ? [...COMPACT_GROUPS, { title: 'Прочие', paths: others }] : COMPACT_GROUPS;
    return (
      <CompactSectionIndex
        title="Справочники"
        groups={groups.map(group => ({
          title: group.title,
          items: group.paths.flatMap(path => {
            const item = byPath.get(path);
            return item ? [{ key: item.path, label: item.label, onClick: () => openTab(item.path, item.tabLabel, null) }] : [];
          }),
        }))}
      />
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ paddingTop: '35px', paddingLeft: '60px' }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '30px', fontWeight: 'bold', letterSpacing: '0', color: '#2D4059', margin: 0 }}>Справочники</h1>
      </div>
      <div style={{ paddingLeft: '60px', paddingTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map(item => (
          <button
            key={item.path}
            onClick={() => openTab(item.path, item.tabLabel, null)}
            style={buttonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5559E0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#666EFE'; }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReferencesPage;