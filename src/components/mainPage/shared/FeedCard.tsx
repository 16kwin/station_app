// FeedCard.tsx — карточка-лента со строкой поиска и списком событий:
// «Выпуск продукции» на панели «Показатели», «Заказы на поставку» и «Экран событий» у оператора.
import React, { useMemo, useRef, useState } from 'react';
import CustomScrollbar from '../../elements/CustomScrollbar';
import { COLORS, FONT } from './layout';
import type { CardRect } from './layout';
import { formatDateTimeRu } from './format';

export interface FeedItem {
  id: number | string;
  title: string;
  /** ISO-дата события; выводится под названием */
  at: string;
}

export interface FeedTab {
  key: string;
  label: string;
}

interface FeedCardProps {
  rect: CardRect;
  /** Подпись строки поиска — она же заголовок ленты */
  title: string;
  items: FeedItem[];
  /** Цвет плашки иконки строки */
  accentColor?: string;
  /** Вкладки над списком; если не переданы — список без вкладок */
  tabs?: FeedTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

const SEARCH_TOP = 20;
const SEARCH_HEIGHT = 36;
const TABS_HEIGHT = 40;
const LIST_TOP_GAP = 12;
const ROW_HEIGHT = 58;
const SIDE = 20;
const ICON_SIZE = 36;
const ROW_BORDER = '1px solid #EEF2F8';

/** Лупа 16×16 */
const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.3" stroke={COLORS.textMuted} strokeWidth="1.6" />
    <path d="M11 11L14.5 14.5" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Иконка строки 16×16 — коробка */
const BoxIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.6L14 4.8V11.2L8 14.4L2 11.2V4.8L8 1.6Z" stroke={COLORS.white} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M2 4.8L8 8L14 4.8M8 8V14.4" stroke={COLORS.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Иконка «развернуть» 16×16 */
const ExpandIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 2H2V6M10 2H14V6M10 14H14V10M6 14H2V10"
      stroke={COLORS.textMuted}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FeedCard: React.FC<FeedCardProps> = ({ rect, title, items, accentColor = COLORS.accent, tabs, activeTab, onTabChange }) => {
  const [query, setQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const listTop = SEARCH_TOP + SEARCH_HEIGHT + (tabs ? TABS_HEIGHT : 0) + LIST_TOP_GAP;
  const listHeight = rect.h - listTop - 16;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => item.title.toLowerCase().includes(needle));
  }, [items, query]);

  const hasScroll = visible.length * ROW_HEIGHT > listHeight;

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: '0 10px 40px rgba(226, 236, 249, 0.9)',
        boxSizing: 'border-box',
        fontFamily: FONT,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Строка поиска */}
      <div
        style={{
          position: 'absolute',
          left: SIDE,
          top: SEARCH_TOP,
          width: rect.w - SIDE * 2,
          height: SEARCH_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SearchIcon />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={title}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '19px',
            color: COLORS.text,
          }}
        />
        <button
          type="button"
          aria-label="Развернуть"
          style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', outline: 'none', display: 'flex' }}
        >
          <ExpandIcon />
        </button>
      </div>

      {/* Вкладки «В работе» / «Завершено» */}
      {tabs && (
        <div style={{ position: 'absolute', left: SIDE, top: SEARCH_TOP + SEARCH_HEIGHT, height: TABS_HEIGHT, display: 'flex', gap: 22 }}>
          {tabs.map(tab => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '0 0 8px',
                  alignSelf: 'flex-end',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  lineHeight: '17px',
                  color: active ? COLORS.accent : COLORS.textMuted,
                  borderBottom: `2px solid ${active ? COLORS.accent : 'transparent'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Список */}
      <div
        ref={scrollContainerRef}
        style={{
          position: 'absolute',
          left: SIDE,
          top: listTop,
          width: rect.w - SIDE * 2 - (hasScroll ? 14 : 0),
          height: listHeight,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {visible.length === 0 && (
          <div style={{ paddingTop: 16, fontSize: 13, fontWeight: 500, color: COLORS.textMuted }}>Ничего не найдено</div>
        )}
        {visible.map((item, index) => (
          <div
            key={item.id}
            style={{
              height: ROW_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderTop: index === 0 ? 'none' : ROW_BORDER,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 10,
                backgroundColor: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BoxIcon />
            </div>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: '17px',
                  color: COLORS.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '15px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                {formatDateTimeRu(item.at)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasScroll && (
        <div style={{ position: 'absolute', right: 8, top: listTop, height: listHeight, width: 10 }}>
          <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={listHeight} />
        </div>
      )}
    </div>
  );
};

export default FeedCard;
