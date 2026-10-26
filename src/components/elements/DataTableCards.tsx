// DataTableCards.tsx — строки DataTable на телефоне: компактный список вместо таблицы на 1720 px.
// Строка — название (первая видимая колонка) и под ним до трёх полей мелким шрифтом через «·»; нажатие раскрывает
// все поля строки, «Открыть карточку» — то же, что двойной щелчок по строке на компьютере. Телефон, повёрнутый
// горизонтально, показывает строки в две колонки.
import React, { useState } from 'react';

interface ColumnItem { key: string; label: string; }

/** Строка таблицы: uid и name есть у всех справочников и документов, остальное — по колонкам */
type Row = Record<string, unknown>;

interface Props {
  columns: ColumnItem[];
  visibleKeys: string[];
  data: Row[];
  renderCell: (key: string, item: Row) => string;
  renderCellNode?: (key: string, item: Row) => React.ReactNode;
  onOpen: (uid: string, name: string) => void;
  rowBackground?: (item: Row) => string | null;
}

/** Сколько полей видно под названием без раскрытия */
const PREVIEW_FIELDS = 3;

const TEXT = '#2D4059';
const MUTED = 'rgba(45, 64, 89, 0.55)';
const ACCENT = '#666EFE';
const LINE = 'rgba(102, 110, 254, 0.12)';

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true"
    style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}>
    <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DataTableCards: React.FC<Props> = ({ columns, visibleKeys, data, renderCell, renderCellNode, onOpen, rowBackground }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = columns.filter(column => visibleKeys.includes(column.key));
  const [titleColumn, ...rest] = visible;

  const text = (key: string, item: Row): string => {
    const value = renderCell(key, item);
    return value === '' || value === null || value === undefined ? '—' : value;
  };

  const node = (key: string, item: Row): React.ReactNode => {
    const custom = renderCellNode ? renderCellNode(key, item) : null;
    return custom !== null && custom !== undefined ? custom : text(key, item);
  };

  if (data.length === 0) {
    return (
      <div style={{ padding: '24px 12px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: MUTED }}>
        Записей нет
      </div>
    );
  }

  return (
    // Вертикально — одна колонка; повёрнутый телефон — две и больше (от 300 px на строку)
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 6, width: '100%', paddingBottom: 6, alignItems: 'start' }}>
      {data.map(item => {
        const uid = String(item.uid);
        const open = expanded === uid;
        const toggle = () => setExpanded(open ? null : uid);
        const preview = rest.slice(0, PREVIEW_FIELDS).map(column => text(column.key, item)).filter(value => value !== '—');
        return (
          <div
            key={uid}
            style={{
              backgroundColor: rowBackground?.(item) || '#FFFFFF',
              borderRadius: 10,
              border: `1px solid ${LINE}`,
              fontFamily: 'Inter, sans-serif',
              color: TEXT,
              boxSizing: 'border-box',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-expanded={open}
              onClick={toggle}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', minHeight: 44, boxSizing: 'border-box' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {titleColumn && (
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node(titleColumn.key, item)}
                  </div>
                )}
                {!open && preview.length > 0 && (
                  <div style={{ fontSize: 12, lineHeight: '16px', color: MUTED, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {preview.join(' · ')}
                  </div>
                )}
              </div>
              <Chevron open={open} />
            </div>
            {open && (
              <div style={{ borderTop: `1px solid ${LINE}`, padding: '8px 12px 10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 40%) minmax(0, 1fr)', columnGap: 10, rowGap: 4 }}>
                  {rest.map(column => (
                    <React.Fragment key={column.key}>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: '16px', wordBreak: 'break-word' }}>{column.label}</div>
                      <div style={{ fontSize: 12, lineHeight: '16px', wordBreak: 'break-word' }}>{node(column.key, item)}</div>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(uid, typeof item.name === 'string' ? item.name : '')}
                  style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', color: ACCENT, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Открыть карточку
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DataTableCards;
