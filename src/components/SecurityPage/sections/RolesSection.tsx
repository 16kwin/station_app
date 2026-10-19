// RolesSection.tsx — раздел 12 «Роли» (9.2, 6.6): матрица «роль → что может», число пользователей у роли
// и источник роли. Роль SECURITY вне страницы «Безопасность» только читает.
import React from 'react';
import type { SecurityReport } from '../api';
import { formatCount, roleSourceText } from './format';
import { Missing, Mono, Pairs, ReportSection, Table } from './ui';

const RolesSection: React.FC<{ report: SecurityReport; anchor?: string }> = ({ report, anchor }) => {
  const roles = report.roles;
  const source = roleSourceText(roles?.source ?? report.header.roleSource);
  return (
    <ReportSection n={12} title="Роли" anchor={anchor}>
      <Pairs items={[{ label: 'Откуда берётся роль', value: source.text, ok: source.ok }]} />
      {roles === null ? (
        <Missing />
      ) : roles.matrix.length === 0 ? (
        <Missing>Матрица ролей пуста.</Missing>
      ) : (
        <Table
          widths={[14, 20, 11, 55]}
          columns={['Роль', 'Название', 'Пользователей', 'Что может']}
          rows={roles.matrix.map(r => [
            <Mono>{r.role}</Mono>,
            r.title ?? '—',
            formatCount(r.users),
            r.can.length ? (
              <ul className="sp-plain">
                {r.can.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              '—'
            ),
          ])}
        />
      )}
    </ReportSection>
  );
};

export default RolesSection;
