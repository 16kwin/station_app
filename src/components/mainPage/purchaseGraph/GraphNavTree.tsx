// GraphNavTree.tsx — дерево номенклатуры слева (как в 13.png): поиск, «Избранное», группы
// с позициями. Клик по позиции — фокус графа, звезда — избранное, серым — число поставщиков.
import React, { useState } from 'react';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import { DocIcon, GridIcon, LayersIcon, SearchIcon, StarIcon } from './icons';
import { buildNavSections } from './model';
import type { PurchaseGraphData } from './types';

interface GraphNavTreeProps {
  data: PurchaseGraphData | null;
  favorites: Readonly<Record<string, boolean>>;
  focusKey: string | null;
  onFocus: (key: string | null) => void;
  onToggleFavorite: (key: string) => void;
}

const STAR_COLOR = '#FFC83D';

/** Подсветка строк при наведении — через классы: инлайном :hover не задать */
const TREE_CSS = `
.pg-tree-row:hover { background-color: #F4F6FB; }
.pg-tree-row:hover .pg-tree-star { opacity: 1 !important; }
.pg-tree-list::-webkit-scrollbar { width: 6px; }
.pg-tree-list::-webkit-scrollbar-thumb { background: #2D4059; border-radius: 3px; }
.pg-tree-list::-webkit-scrollbar-track { background: transparent; }
`;

const rowBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 34,
  padding: '0 10px 0 12px',
  borderRadius: 9,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 0.15s ease',
};

const GraphNavTree: React.FC<GraphNavTreeProps> = ({ data, favorites, focusKey, onFocus, onToggleFavorite }) => {
  const [search, setSearch] = useState('');
  const sections = data ? buildNavSections(data, favorites, search) : [];
  const total = data?.nomenclature.length ?? 0;

  // Повторный клик по позиции в фокусе — выход из фокуса
  const handleItemClick = (key: string) => onFocus(focusKey === key ? null : key);

  return (
    <div
      className="pg-nav"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.card,
        fontFamily: FONT,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{TREE_CSS}</style>
      <div style={{ padding: '18px 18px 10px', fontSize: 16, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>Номенклатура</div>

      <div style={{ padding: '0 16px 10px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 12px',
            borderRadius: 18,
            backgroundColor: '#F2F4F8',
            color: COLORS.accent,
            cursor: 'text',
          }}
        >
          <SearchIcon size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск"
            aria-label="Поиск номенклатуры"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.text,
            }}
          />
        </label>
      </div>
      <div style={{ height: 1, margin: '0 16px', backgroundColor: '#EEF1F6' }} />

      <div className="pg-tree-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px 12px' }}>
        {/* «Все» — выход из фокуса: граф снова показывает все позиции */}
        <div
          role="button"
          tabIndex={0}
          className="pg-tree-row"
          onClick={() => onFocus(null)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFocus(null);
            }
          }}
          style={{
            ...rowBase,
            color: focusKey === null ? COLORS.accent : COLORS.text,
            backgroundColor: focusKey === null ? 'rgba(102, 110, 254, 0.08)' : undefined,
          }}
        >
          <GridIcon size={16} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Все позиции</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>{total}</span>
        </div>

        {sections.map(section => (
          <div key={section.key} style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', color: COLORS.text }}>
              {section.icon === 'star' ? <StarIcon size={16} /> : <LayersIcon size={16} />}
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '18px' }}>{section.title}</span>
            </div>
            {section.items.map(item => {
              const active = item.key === focusKey;
              return (
                <div
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  className="pg-tree-row"
                  aria-pressed={active}
                  onClick={() => handleItemClick(item.key)}
                  onKeyDown={e => {
                    // Enter на вложенной звёздочке — её собственное нажатие, фокус графа не трогаем
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item.key);
                    }
                  }}
                  title={item.name}
                  style={{
                    ...rowBase,
                    paddingLeft: 30,
                    color: active ? COLORS.accent : COLORS.text,
                    backgroundColor: active ? 'rgba(102, 110, 254, 0.08)' : undefined,
                  }}
                >
                  <DocIcon size={16} color={active ? COLORS.accent : COLORS.textMuted} />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      lineHeight: '18px',
                    }}
                  >
                    {item.name}
                  </span>
                  <button
                    type="button"
                    className="pg-tree-star"
                    aria-label={item.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                    title={item.favorite ? 'Убрать из избранного' : 'В избранное'}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(item.key);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.favorite ? STAR_COLOR : '#B7C2D3',
                      opacity: item.favorite ? 1 : 0.45,
                      transition: 'opacity 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <StarIcon size={15} filled={item.favorite} fillColor={STAR_COLOR} />
                  </button>
                  <span
                    title="Поставщиков за период"
                    style={{
                      minWidth: 16,
                      textAlign: 'right',
                      fontSize: 12,
                      fontWeight: 500,
                      color: item.suppliers ? COLORS.textMuted : '#C3CCD9',
                    }}
                  >
                    {item.suppliers}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {data && sections.length === 0 && (
          <div style={{ padding: '18px 12px', fontSize: 13, color: COLORS.textMuted }}>Ничего не найдено</div>
        )}
        {!data && <div style={{ padding: '18px 12px', fontSize: 13, color: COLORS.textMuted }}>Загрузка…</div>}
      </div>
    </div>
  );
};

export default GraphNavTree;
