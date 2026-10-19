// ui.tsx — элементы разметки отчёта «Профиль безопасности»: раздел с номером, «свойство — значение», таблица,
// метка состояния, отметка самопроверки. Внешний вид — классы sp-* из print.css: один и тот же отчёт на экране
// (карточки) и на бумаге (A4, без фона и теней).
import React, { type ReactNode } from 'react';
import type { Fact, FactSection, FactTable } from '../api';

interface ReportSectionProps {
  /** Номер раздела отчёта (9.2) */
  n: number | null;
  title: string;
  /** Якорь для оглавления на экране; в печатной копии не ставится (иначе id повторится) */
  anchor?: string;
  /** Пояснение под заголовком */
  lead?: ReactNode;
  /** Кнопки раздела на экране (в печать не попадают) */
  actions?: ReactNode;
  children?: ReactNode;
}

export const ReportSection: React.FC<ReportSectionProps> = ({ n, title, anchor, lead, actions, children }) => (
  <section className="sp-section" id={anchor}>
    <div className="sp-section-head">
      <h2 className="sp-h2">
        {n !== null && <span className="sp-num">{n}.</span>}
        {title}
      </h2>
      {actions && <div className="sp-section-actions sp-no-print">{actions}</div>}
    </div>
    {lead && <p className="sp-lead">{lead}</p>}
    {children}
  </section>
);

/** Раздел не пришёл с сервера: честно говорим об этом, а не прячем раздел */
export const Missing: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <p className="sp-missing">{children ?? 'Сервер не прислал этот раздел отчёта.'}</p>
);

export const Mono: React.FC<{ children: ReactNode; wrap?: boolean }> = ({ children, wrap = false }) => (
  <span className={wrap ? 'sp-mono sp-mono-wrap' : 'sp-mono'}>{children}</span>
);

export type Tone = 'ok' | 'warn' | 'bad' | 'off' | 'neutral';

export const Badge: React.FC<{ tone: Tone; children: ReactNode }> = ({ tone, children }) => (
  <span className={`sp-badge sp-badge-${tone}`}>{children}</span>
);

/** Отметка самопроверки: да / нет / не проверялось */
export const CheckMark: React.FC<{ ok: boolean | null }> = ({ ok }) => {
  if (ok === null) return <span className="sp-mark sp-mark-unknown" aria-label="не проверялось">?</span>;
  return ok ? (
    <span className="sp-mark sp-mark-ok" aria-label="да">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M1.5 5.2l2.2 2.2L8.5 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ) : (
    <span className="sp-mark sp-mark-bad" aria-label="нет">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
};

const toneOf = (ok: boolean | null): string => (ok === true ? ' sp-value-ok' : ok === false ? ' sp-value-bad' : '');

export interface Pair {
  label: string;
  value: ReactNode;
  ok?: boolean | null;
}

/** «Свойство — значение» с разметкой в значении (хэши моноширинным шрифтом) */
export const Pairs: React.FC<{ items: readonly Pair[] }> = ({ items }) => (
  <dl className="sp-facts">
    {items.map(item => (
      <div className="sp-fact" key={item.label}>
        <dt>{item.label}</dt>
        <dd className={toneOf(item.ok ?? null).trim() || undefined}>{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** Список «свойство — значение» */
export const FactList: React.FC<{ facts: readonly Fact[] }> = ({ facts }) =>
  facts.length === 0 ? null : (
    <dl className="sp-facts">
      {facts.map((f, i) => (
        <div className="sp-fact" key={`${f.label}-${i}`}>
          <dt>{f.label}</dt>
          <dd className={toneOf(f.ok).trim() || undefined}>
            {f.value}
            {f.note && <span className="sp-fact-note">{f.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );

interface TableProps {
  columns: readonly ReactNode[];
  rows: ReadonlyArray<readonly ReactNode[]>;
  /** Ширины столбцов в процентах (печать: таблица во всю ширину листа) */
  widths?: readonly number[];
  caption?: ReactNode;
  /** Классы строк (выделение тревожных событий) */
  rowClass?: (index: number) => string | undefined;
  compact?: boolean;
}

export const Table: React.FC<TableProps> = ({ columns, rows, widths, caption, rowClass, compact = false }) => (
  <div className="sp-table-wrap">
    {caption && <div className="sp-table-caption">{caption}</div>}
    <table className={compact ? 'sp-table sp-table-compact' : 'sp-table'}>
      {widths && (
        <colgroup>
          {widths.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
      )}
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={rowClass?.(i)}>
            {r.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FactTableView: React.FC<{ table: FactTable }> = ({ table }) => (
  <Table caption={table.title} columns={table.columns} rows={table.rows} compact />
);

/** Раздел из фактов, списков и таблиц (входящие, исходящие, фон, компоненты) */
export const FactSectionBody: React.FC<{ section: FactSection }> = ({ section }) => (
  <>
    <FactList facts={section.facts} />
    {section.lists.map(list => (
      <div className="sp-list" key={list.title}>
        <div className="sp-table-caption">{list.title}</div>
        <ul>
          {list.items.map((item, i) => (
            <li key={i}>
              <Mono wrap>{item}</Mono>
            </li>
          ))}
        </ul>
      </div>
    ))}
    {section.tables.map((t, i) => (
      <FactTableView table={t} key={`${t.title}-${i}`} />
    ))}
    {section.facts.length === 0 && section.lists.length === 0 && section.tables.length === 0 && <Missing>Раздел пуст.</Missing>}
  </>
);
