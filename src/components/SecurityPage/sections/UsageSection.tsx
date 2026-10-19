// UsageSection.tsx — раздел 13 «Использование» (9.2, 10.2): сводка журнала доступа по пользователям — просмотры
// и скачивания видео, живой поток, записи, выгрузки, исходники 3D, смены адресов камер, исходящие запросы.
import React from 'react';
import type { SecurityReport } from '../api';
import { USAGE_TITLES, formatCount } from './format';
import { Missing, Mono, ReportSection, Table } from './ui';

const UsageSection: React.FC<{ report: SecurityReport; anchor?: string }> = ({ report, anchor }) => {
  const usage = report.usage;
  const days = usage?.days ?? 30;
  return (
    <ReportSection n={13} title="Использование" anchor={anchor} lead={`Сводка журнала доступа за ${days} дн. по пользователям.`}>
      {usage === null ? (
        <Missing />
      ) : usage.rows.length === 0 ? (
        <Missing>За этот период событий в журнале доступа нет.</Missing>
      ) : (
        <Table
          compact
          columns={['Пользователь', 'Роль', ...usage.types.map(t => USAGE_TITLES[t] ?? t)]}
          rows={usage.rows.map(r => [
            r.actor,
            r.role ? <Mono>{r.role}</Mono> : '—',
            ...usage.types.map(t => (r.counts[t] ? formatCount(r.counts[t]) : '—')),
          ])}
        />
      )}
    </ReportSection>
  );
};

export default UsageSection;
