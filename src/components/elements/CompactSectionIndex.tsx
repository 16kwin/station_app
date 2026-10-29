// CompactSectionIndex.tsx — оглавление раздела на телефоне и планшете (справочники, документы, аналитика):
// заголовок 18 px, группы с подписью и плитки в две колонки высотой от 40 px. На компьютере разделы рисуют
// прежние ряды кнопок сами.
import React from 'react';

export interface CompactIndexItem {
  key: string;
  label: string;
  onClick: () => void;
}

export interface CompactIndexGroup {
  /** Подпись группы; без неё плитки идут сразу под заголовком */
  title?: string;
  items: CompactIndexItem[];
}

interface Props {
  title: string;
  groups: CompactIndexGroup[];
}

const TEXT = '#2D4059';
const MUTED = 'rgba(45, 64, 89, 0.55)';

const CompactSectionIndex: React.FC<Props> = ({ title, groups }) => (
  <div style={{ padding: '14px 12px 16px', fontFamily: 'Inter, sans-serif' }}>
    <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: '22px', color: TEXT, margin: '0 4px 12px' }}>{title}</h1>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.filter(group => group.items.length > 0).map((group, index) => (
        <section key={group.title ?? index}>
          {group.title && (
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, margin: '0 4px 6px' }}>
              {group.title}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
            {group.items.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                style={{ minHeight: 40, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.18)', backgroundColor: '#FFFFFF', color: TEXT, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, lineHeight: '16px', textAlign: 'left', cursor: 'pointer' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

export default CompactSectionIndex;
