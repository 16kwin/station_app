// StoredDataSection.tsx — раздел 7 «Хранимые данные выключенных функций» (9.2, 6.8): число строк в таблицах
// и объём каталогов; для видео — самая старая запись и срок хранения. Выключение функции данные не удаляет:
// «хранится, доступ закрыт». Удалить данные функции, выключенной потолком, может только администратор ИБ —
// кнопка на экране (в печать не попадает), дальше пароль и запись PURGE в журнал профиля.
import React from 'react';
import type { FeatureRow, SecurityReport, StoredDataRow } from '../api';
import { FILES_FORMS, canPurgeRow, countOf, formatBytes, formatCount, formatDate } from './format';
import { Missing, Mono, ReportSection, Table } from './ui';

interface StoredDataSectionProps {
  report: SecurityReport;
  /** Пользователь — администратор ИБ (решение сервера или роль) */
  viewerCanPurge: boolean;
  onPurge?: (row: StoredDataRow) => void;
  /** Печатная копия: без кнопок */
  print: boolean;
  anchor?: string;
}

const titleOf = (row: StoredDataRow, features: readonly FeatureRow[] | null): string =>
  row.title ?? features?.find(f => f.key === row.feature)?.title ?? row.feature;

const StoredDataSection: React.FC<StoredDataSectionProps> = ({ report, viewerCanPurge, onPurge, print, anchor }) => {
  const rows = report.storedData;
  const showPurge = !print && !!onPurge && (rows ?? []).some(r => canPurgeRow(r, report.features, viewerCanPurge));
  return (
    <ReportSection
      n={7}
      title="Хранимые данные выключенных функций"
      anchor={anchor}
      lead="Выключение функции не удаляет данные: таблицы и файлы хранятся, доступ к ним закрыт. Повторное включение возвращает всё как было. Удалить данные функции, выключенной потолком, может только администратор ИБ — с паролем и записью в журнал профиля."
    >
      {rows === null ? (
        <Missing />
      ) : rows.length === 0 ? (
        <Missing>У выключенных функций хранимых данных нет.</Missing>
      ) : (
        <Table
          widths={showPurge ? [17, 20, 22, 12, 9, 10, 10] : [19, 22, 25, 13, 10, 11]}
          columns={[
            'Функция',
            'Таблицы (строк)',
            'Каталоги (файлов, объём)',
            'Самая старая запись',
            'Срок хранения',
            'Состояние',
            ...(showPurge ? [''] : []),
          ]}
          rows={rows.map(r => [
            <>
              <div className="sp-cell-title">{titleOf(r, report.features)}</div>
              <Mono>{r.feature}</Mono>
            </>,
            r.tables.length ? (
              <ul className="sp-plain">
                {r.tables.map(t => (
                  <li key={t.name}>
                    <Mono>{t.name}</Mono>: {formatCount(t.rows)}
                  </li>
                ))}
              </ul>
            ) : (
              '—'
            ),
            r.dirs.length ? (
              <ul className="sp-plain">
                {r.dirs.map(d => (
                  <li key={d.path}>
                    <Mono wrap>{d.path}</Mono>: {d.files === null ? '' : `${countOf(d.files, FILES_FORMS)}, `}
                    {formatBytes(d.bytes)}
                  </li>
                ))}
              </ul>
            ) : (
              '—'
            ),
            formatDate(r.oldest),
            r.retentionDays === null ? '—' : `${r.retentionDays} дн.`,
            r.note ?? 'хранится, доступ закрыт',
            ...(showPurge
              ? [
                  canPurgeRow(r, report.features, viewerCanPurge) ? (
                    <button type="button" className="sp-btn sp-btn-danger sp-btn-small" onClick={() => onPurge?.(r)}>
                      Удалить данные
                    </button>
                  ) : (
                    ''
                  ),
                ]
              : []),
          ])}
        />
      )}
    </ReportSection>
  );
};

export default StoredDataSection;
