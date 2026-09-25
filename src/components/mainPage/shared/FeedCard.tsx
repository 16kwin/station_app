// FeedCard.tsx — карточка-лента со строкой поиска и списком событий:
// «Выпуск продукции» на панели «Показатели», «Заказы на поставку» и «Экран событий» у оператора,
// ленты панелей ролей (контролер, начальник цеха, служба закупа, аудитор).
// Все новые возможности включаются необязательными пропсами; без них лента выглядит как раньше.
import React, { useMemo, useRef, useState } from 'react';
import CustomScrollbar from '../../elements/CustomScrollbar';
import { COLORS, FONT } from './layout';
import type { CardRect } from './layout';
import { formatDateTimeRu } from './format';
import { CloseSearchIcon, FeedIcon, SecondScreenIcon } from './FeedIcons';
import type { FeedIconKind } from './FeedIcons';

export type { FeedIconKind } from './FeedIcons';

export interface FeedItem {
  id: number | string;
  title: string;
  /** ISO-дата события; выводится под названием */
  at: string;
  /** Справа в строке заголовка серым: «Подразделение: Цех 1, Участок 2» */
  meta?: string;
  /** Строки под заголовком: «Исполнитель: …», «Контролер: …» */
  lines?: string[];
  /** Строка-ссылка акцентным цветом под датой: «Заказ № 106» */
  link?: string;
}

export interface FeedTab {
  key: string;
  label: string;
}

export interface FeedCardProps {
  rect: CardRect;
  /** Подпись строки поиска — она же заголовок ленты */
  title: string;
  items: FeedItem[];
  /** Цвет плашки иконки строки (и строки-ссылки) */
  accentColor?: string;
  /** Вкладки над списком; если не переданы — список без вкладок */
  tabs?: FeedTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  /** Белая иконка в плашке строки; 'default' — прежняя коробка */
  icon?: FeedIconKind;
  /**
   * 'search' (по умолчанию) — строка поиска, подпись которой — заголовок ленты;
   * 'title' — заголовок по центру, под ним лупа (открывает поле «Поиск») и кнопка «второй экран»
   */
  header?: 'search' | 'title';
  /** Если задан — в шапке кнопка «второй экран»; без него кнопки нет */
  onSecondScreen?: () => void;
  /** Если задан — строки кликабельны */
  onItemClick?: (id: number | string) => void;
  /** Цвет активной вкладки: текст и подчёркивание; по умолчанию акцентный */
  tabAccent?: string;
}

const SEARCH_TOP = 20;
const SEARCH_HEIGHT = 36;
const TABS_HEIGHT = 40;
const LIST_TOP_GAP = 12;
const ROW_HEIGHT = 58;
const SIDE = 20;
const ICON_SIZE = 36;
const ROW_BORDER = '1px solid #EEF2F8';

/* ---------- Шапка 'title': заголовок, под ним строка инструментов или поле поиска ---------- */
const TOOLS_HEIGHT = 36;
const TOOL_BUTTON = 36;

/* ---------- Богатая строка (meta / lines / link) ---------- */
const RICH_PAD_Y = 12;
const RICH_ICON_RADIUS = 8;
/** Строки и ссылка начинаются там же, где текст справа от плашки */
const RICH_TEXT_INDENT = ICON_SIZE + 12;
const RICH_LINE_H = 17;
const RICH_LINES_TOP = 10;
const RICH_LINES_GAP = 6;
const RICH_LINK_TOP = 8;
const RICH_LINK_H = 17;

/** Подсветка кликабельной строки при наведении */
const ROW_HOVER_BG = '#F5F7FD';

/** Лупа; по умолчанию 16×16 серого цвета — как в строке поиска */
const SearchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = COLORS.textMuted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.3" stroke={color} strokeWidth="1.6" />
    <path d="M11 11L14.5 14.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Прозрачная кнопка-иконка; size — квадратная область нажатия (без неё — по размеру иконки) */
const iconButtonStyle = (size?: number): React.CSSProperties => ({
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  outline: 'none',
  display: 'flex',
  width: size,
  height: size,
  alignItems: size ? 'center' : undefined,
  justifyContent: size ? 'center' : undefined,
  flexShrink: 0,
});

const SecondScreenButton: React.FC<{ onClick: () => void; size?: number }> = ({ onClick, size }) => (
  <button type="button" aria-label="Открыть на втором экране" title="Открыть на втором экране" onClick={onClick} style={iconButtonStyle(size)}>
    <SecondScreenIcon />
  </button>
);

const isRichItem = (item: FeedItem): boolean => Boolean(item.meta) || (item.lines?.length ?? 0) > 0 || Boolean(item.link);

/** Высота богатой строки по содержимому (без рамки-разделителя) */
const richRowHeight = (item: FeedItem): number => {
  const lines = item.lines?.length ?? 0;
  return (
    RICH_PAD_Y * 2 +
    ICON_SIZE +
    (lines > 0 ? RICH_LINES_TOP + lines * RICH_LINE_H + (lines - 1) * RICH_LINES_GAP : 0) +
    (item.link ? RICH_LINK_TOP + RICH_LINK_H : 0)
  );
};

/** Поиск без учёта регистра по названию, meta, строкам и ссылке */
const matchesQuery = (item: FeedItem, needle: string): boolean =>
  [item.title, item.meta, item.link, ...(item.lines ?? [])].some(text => text !== undefined && text.toLowerCase().includes(needle));

const FeedCard: React.FC<FeedCardProps> = ({
  rect,
  title,
  items,
  accentColor = COLORS.accent,
  tabs,
  activeTab,
  onTabChange,
  icon = 'default',
  header = 'search',
  onSecondScreen,
  onItemClick,
  tabAccent = COLORS.accent,
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoverId, setHoverId] = useState<number | string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const headerHeight = SEARCH_HEIGHT + (header === 'title' ? TOOLS_HEIGHT : 0);
  const listTop = SEARCH_TOP + headerHeight + (tabs ? TABS_HEIGHT : 0) + LIST_TOP_GAP;
  const listHeight = rect.h - listTop - 16;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => matchesQuery(item, needle));
  }, [items, query]);

  // Если хоть одна строка ленты «богатая» — все строки ленты рисуются в богатой раскладке
  const rich = items.some(isRichItem);
  const contentHeight = rich
    ? visible.reduce((sum, item, index) => sum + richRowHeight(item) + (index === 0 ? 0 : 1), 0)
    : visible.length * ROW_HEIGHT;
  const hasScroll = contentHeight > listHeight;

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  // Esc очищает поиск; в шапке 'title' ещё и закрывает поле
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return;
    if (header === 'title') closeSearch();
    else setQuery('');
  };

  /** Обработчики и стиль кликабельной строки; без onItemClick — пусто, строка как раньше */
  const clickableRow = (id: number | string) =>
    onItemClick
      ? {
          role: 'button',
          tabIndex: 0,
          onClick: () => onItemClick(id),
          onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onItemClick(id);
          },
          onMouseEnter: () => setHoverId(id),
          onMouseLeave: () => setHoverId(current => (current === id ? null : current)),
        }
      : {};

  const clickableStyle = (id: number | string): React.CSSProperties =>
    onItemClick
      ? {
          cursor: 'pointer',
          backgroundColor: hoverId === id ? ROW_HOVER_BG : COLORS.white,
          transition: 'background-color 0.15s ease',
        }
      : {};

  const iconPlate = (radius: number) => (
    <div
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: radius,
        backgroundColor: accentColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <FeedIcon kind={icon} />
    </div>
  );

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
      {header === 'title' ? (
        <>
          {/* Заголовок по центру */}
          <div
            style={{
              position: 'absolute',
              left: SIDE,
              top: SEARCH_TOP,
              width: rect.w - SIDE * 2,
              height: SEARCH_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '19px',
              color: COLORS.text,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          </div>

          {/* Под заголовком: лупа и «второй экран»; лупа раскрывает поле поиска */}
          <div
            style={{
              position: 'absolute',
              left: SIDE,
              top: SEARCH_TOP + SEARCH_HEIGHT,
              width: rect.w - SIDE * 2,
              height: TOOLS_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: searchOpen ? 10 : 26,
            }}
          >
            {searchOpen ? (
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 32,
                  padding: '0 10px',
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  border: '1px solid #E5ECF5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <SearchIcon />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Поиск"
                  aria-label="Поиск"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: '17px',
                    color: COLORS.text,
                  }}
                />
                <button type="button" aria-label="Закрыть поиск" onClick={closeSearch} style={iconButtonStyle(20)}>
                  <CloseSearchIcon />
                </button>
              </div>
            ) : (
              <button type="button" aria-label="Поиск" onClick={() => setSearchOpen(true)} style={iconButtonStyle(TOOL_BUTTON)}>
                <SearchIcon size={18} color={COLORS.text} />
              </button>
            )}
            {onSecondScreen && <SecondScreenButton onClick={onSecondScreen} size={TOOL_BUTTON} />}
          </div>
        </>
      ) : (
        /* Строка поиска */
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
            onKeyDown={handleSearchKeyDown}
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
          {/* Без действия кнопки нет: прежняя «Развернуть» ничего не делала */}
          {onSecondScreen && <SecondScreenButton onClick={onSecondScreen} />}
        </div>
      )}

      {/* Вкладки «В работе» / «Завершено» */}
      {tabs && (
        <div style={{ position: 'absolute', left: SIDE, top: SEARCH_TOP + headerHeight, height: TABS_HEIGHT, display: 'flex', gap: 22 }}>
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
                  color: active ? tabAccent : COLORS.textMuted,
                  borderBottom: `2px solid ${active ? tabAccent : 'transparent'}`,
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
        {rich
          ? visible.map((item, index) => {
              const lines = item.lines ?? [];
              return (
                <div
                  key={item.id}
                  {...clickableRow(item.id)}
                  style={{
                    height: richRowHeight(item) + (index === 0 ? 0 : 1),
                    padding: `${RICH_PAD_Y}px 0`,
                    borderTop: index === 0 ? 'none' : ROW_BORDER,
                    boxSizing: 'border-box',
                    ...clickableStyle(item.id),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {iconPlate(RICH_ICON_RADIUS)}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
                        <span
                          style={{
                            flex: '1 1 auto',
                            minWidth: 0,
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
                        {item.meta && (
                          <span
                            style={{
                              flex: '0 1 auto',
                              minWidth: 0,
                              maxWidth: '60%',
                              fontSize: 12,
                              fontWeight: 500,
                              lineHeight: '15px',
                              color: COLORS.textMuted,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '15px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                        {formatDateTimeRu(item.at)}
                      </span>
                    </div>
                  </div>

                  {lines.length > 0 && (
                    <div
                      style={{
                        marginTop: RICH_LINES_TOP,
                        marginLeft: RICH_TEXT_INDENT,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: RICH_LINES_GAP,
                      }}
                    >
                      {lines.map((line, lineIndex) => (
                        <span
                          key={lineIndex}
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            lineHeight: `${RICH_LINE_H}px`,
                            color: COLORS.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.link && (
                    <div
                      style={{
                        marginTop: RICH_LINK_TOP,
                        marginLeft: RICH_TEXT_INDENT,
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: `${RICH_LINK_H}px`,
                        color: accentColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.link}
                    </div>
                  )}
                </div>
              );
            })
          : visible.map((item, index) => (
              <div
                key={item.id}
                {...clickableRow(item.id)}
                style={{
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderTop: index === 0 ? 'none' : ROW_BORDER,
                  boxSizing: 'border-box',
                  ...clickableStyle(item.id),
                }}
              >
                {iconPlate(10)}
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
