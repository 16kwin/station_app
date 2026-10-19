// HeaderSection.tsx — раздел 1 «Шапка» (9.2): версия и сборка, хост, пресет и его источник, отпечаток профиля,
// файл потолка (путь, SHA-256, дата, владелец), основание, режим переключателей, голова журнала, секреты,
// источник роли и параметры безопасности потолка (4.5) с источником каждого значения.
import React from 'react';
import type { FrontendBuild, SecurityReport } from '../api';
import {
  adminModeText,
  formatDateTime,
  presetSourceText,
  presetText,
  roleSourceText,
  secretsText,
} from './format';
import { Badge, FactList, Missing, Mono, Pairs, ReportSection, Table, type Pair } from './ui';

interface HeaderSectionProps {
  report: SecurityReport;
  build: FrontendBuild | null;
  anchor?: string;
}

const buildText = (build: FrontendBuild | null): string => {
  if (!build) return 'файл сборки не найден: сборка без варианта поставки';
  const parts = [build.variant ? `вариант ${build.variant}` : null, build.buildId, build.builtAt ? formatDateTime(build.builtAt) : null];
  return parts.filter(Boolean).join(' · ');
};

const HeaderSection: React.FC<HeaderSectionProps> = ({ report, build, anchor }) => {
  const { header } = report;
  const file = header.ceilingFile;
  const secrets = secretsText(header.secretsState, header.secretsText);
  const role = roleSourceText(header.roleSource);
  const head = header.journalHead;
  const backend = [header.backendVersion, header.backendBuildTime ? `сборка ${formatDateTime(header.backendBuildTime)}` : null]
    .filter(Boolean)
    .join(' · ');

  const items: Pair[] = [
    { label: 'Сформирован', value: formatDateTime(report.generatedAt) },
    { label: 'Сервер', value: header.host ?? '—' },
    { label: 'Версия сервера', value: backend || 'нет данных (build-info не сформирован)' },
    { label: 'Сборка интерфейса', value: buildText(build) },
    {
      label: 'Профиль функций',
      value: `${presetText(header.preset)} — ${presetSourceText(header.presetSource)}`,
      ok: header.presetSource === 'file' ? null : false,
    },
    { label: 'Отпечаток профиля', value: <Mono wrap>{header.fingerprint}</Mono> },
    { label: 'Ревизия', value: header.revision ? <Mono>{header.revision}</Mono> : '—' },
    {
      label: 'Файл потолка',
      value: file?.path ? (
        <>
          <Mono wrap>{file.path}</Mono>
          {file.exists === false && <span className="sp-fact-note">файл не найден — действует изолированный минимум</span>}
        </>
      ) : (
        '—'
      ),
      ok: file?.exists === false ? false : null,
    },
    { label: 'SHA-256 файла потолка', value: file?.sha256 ? <Mono wrap>{file.sha256}</Mono> : '—' },
    {
      label: 'Изменён, владелец',
      value: [file?.modifiedAt ? formatDateTime(file.modifiedAt) : null, file?.owner].filter(Boolean).join(' · ') || '—',
    },
    { label: 'Основание изменения', value: header.ticket ?? 'не указано (awms.features.ticket)' },
    { label: 'Переключатели администратора', value: adminModeText(header.adminMode) },
    {
      label: 'Голова журнала профиля',
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
    { label: 'Секреты установки', value: secrets.text, ok: secrets.ok },
    { label: 'Источник роли пользователя', value: role.text, ok: role.ok },
  ];
  if (header.dbUser) {
    items.push({
      label: 'Учётная запись БД приложения',
      value: `${header.dbUser.name ?? '—'}${header.dbUser.superuser ? ' — суперпользователь' : ''}`,
      ok: header.dbUser.superuser ? false : null,
    });
  }

  return (
    <ReportSection n={1} title="Шапка" anchor={anchor}>
      {header.warnings.length > 0 && (
        <ul className="sp-warnings">
          {header.warnings.map((w, i) => (
            <li key={i}>
              <Badge tone="warn">Внимание</Badge> {w}
            </li>
          ))}
        </ul>
      )}
      <Pairs items={items} />
      <FactList facts={header.extra} />
      <h3 className="sp-h3">Параметры безопасности потолка</h3>
      {report.params === null ? (
        <Missing />
      ) : report.params.length === 0 ? (
        <Missing>Параметров нет.</Missing>
      ) : (
        <Table
          compact
          widths={[34, 36, 30]}
          columns={['Параметр', 'Значение', 'Источник']}
          rows={report.params.map(p => [
            <Mono wrap>{p.key}</Mono>,
            p.value ? <Mono wrap>{p.value}</Mono> : <span className="sp-muted">пусто</span>,
            p.origin ?? '—',
          ])}
        />
      )}
    </ReportSection>
  );
};

export default HeaderSection;
