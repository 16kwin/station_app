// JournalSection.tsx — раздел 9 «Журнал профиля» (9.2, 10.1): проверка HMAC-цепочки («цела» или «нарушена на
// записи N»), голова цепочки для сверки с бумагой и файловым логом, последние записи. События TAMPER, PURGE
// и стирание паролей камер выделены.
import React from 'react';
import type { SecurityReport } from '../api';
import { ALERT_EVENTS, JOURNAL_EVENT_TITLES, formatDateTime, shortHash } from './format';
import { Missing, Mono, Pairs, ReportSection, Table, type Pair } from './ui';

/** Отпечаток или хэш (32+ шестнадцатеричных знака) — первые 16 знаков: полный отпечаток есть в шапке каждой страницы */
const HASH = /^[0-9a-f]{32,}$/i;

const journalValue = (value: string | null): string => (value === null ? '—' : HASH.test(value) ? shortHash(value, 16) : value);

const JournalSection: React.FC<{ report: SecurityReport; anchor?: string }> = ({ report, anchor }) => {
  const journal = report.journal;
  if (journal === null) {
    return (
      <ReportSection n={9} title="Журнал профиля" anchor={anchor}>
        <Missing />
      </ReportSection>
    );
  }
  const head = journal.head ?? report.header.journalHead;
  const chain: Pair = {
    label: 'HMAC-цепочка',
    value:
      journal.chainValid === null
        ? 'не проверялась'
        : journal.chainValid
          ? 'цела'
          : `нарушена${journal.brokenAt !== null ? ` на записи № ${journal.brokenAt}` : ''}`,
    ok: journal.chainValid,
  };
  const items: Pair[] = [
    chain,
    {
      label: 'Ключ HMAC',
      value:
        journal.keyed === null
          ? 'нет данных'
          : journal.keyed
            ? 'есть, хранится вне БД'
            : 'нет — цепочка без ключа, подделка администратором БД не выявляется',
      ok: journal.keyed === false ? false : null,
    },
    {
      label: 'Голова журнала',
      value: head ? (
        <>
          запись № {head.id ?? '—'}
          {head.hash && (
            <>
              {' · '}
              <Mono wrap>{head.hash}</Mono>
            </>
          )}
        </>
      ) : (
        'нет данных'
      ),
    },
  ];
  const entries = journal.entries;
  return (
    <ReportSection
      n={9}
      title="Журнал профиля"
      anchor={anchor}
      lead="Журнал только для добавления. Голову журнала сверяют с напечатанной в прошлом отчёте и с файловым логом AWMS.SECURITY: удаление хвоста видно по расхождению."
    >
      <Pairs items={items} />
      {entries.length === 0 ? (
        <Missing>Записей нет.</Missing>
      ) : (
        <Table
          compact
          caption={`Последние записи: ${entries.length}`}
          widths={[7, 13, 16, 11, 17, 13, 23]}
          columns={['№', 'Время', 'Событие', 'Функция', 'Было → стало', 'Кто', 'Основание, причина']}
          rowClass={i => (ALERT_EVENTS.has(entries[i].type) ? 'sp-row-alert' : undefined)}
          rows={entries.map(e => [
            e.id ?? '—',
            formatDateTime(e.occurredAt),
            JOURNAL_EVENT_TITLES[e.type] ?? e.type,
            e.featureKey ? <Mono>{e.featureKey}</Mono> : '—',
            e.oldValue || e.newValue ? `${journalValue(e.oldValue)} → ${journalValue(e.newValue)}` : '—',
            e.actor ?? '—',
            [e.ticket, e.reason].filter(Boolean).join(' · ') || '—',
          ])}
        />
      )}
    </ReportSection>
  );
};

export default JournalSection;
