// FeaturesSection.tsx — раздел 2 «Функции» (9.2): состояние каждой функции словами, честный уровень отключения
// (L1–L4), источник значения, роли и самопроверки сервера («бин VideoController отсутствует», «потоков live-* нет»).
// У функций с ролями до перехода на роль из БД — пометка «не гарантируется» (раздел 9.4).
import React from 'react';
import type { FeatureRow, SecurityReport } from '../api';
import { featureStateKind, featureStateText, levelText, rolesNotGuaranteed, rolesText, type FeatureStateKind } from './format';
import { Badge, CheckMark, Missing, Mono, ReportSection, Table, type Tone } from './ui';

const TONES: Record<FeatureStateKind, Tone> = {
  on: 'ok',
  ceiling: 'off',
  dependency: 'off',
  build: 'off',
  absent: 'off',
  switch: 'warn',
  tamper: 'bad',
};

const Checks: React.FC<{ feature: FeatureRow }> = ({ feature }) =>
  feature.checks.length === 0 ? (
    <span className="sp-muted">—</span>
  ) : (
    <ul className="sp-checks">
      {feature.checks.map((c, i) => (
        <li key={i}>
          <CheckMark ok={c.ok} /> {c.text}
        </li>
      ))}
    </ul>
  );

const FeaturesSection: React.FC<{ report: SecurityReport; anchor?: string }> = ({ report, anchor }) => {
  const features = report.features;
  const roleSource = report.header.roleSource;
  const on = features?.filter(f => f.enabled).length ?? 0;
  return (
    <ReportSection
      n={2}
      title="Функции"
      anchor={anchor}
      lead={
        features
          ? `Включено ${on} из ${features.length}. Уровень указан у выключенных функций: L1 — скрыто в интерфейсе, ` +
            'L2 — маршрут закрыт (сервер отвечает 404), L3 — код не загружен, L4 — нет в поставке.'
          : undefined
      }
    >
      {features === null ? (
        <Missing />
      ) : (
        <Table
          widths={[22, 15, 14, 15, 12, 22]}
          columns={['Функция', 'Состояние', 'Уровень', 'Источник значения', 'Роли', 'Самопроверки']}
          rowClass={i => (featureStateKind(features[i]) === 'tamper' ? 'sp-row-alert' : undefined)}
          rows={features.map(f => [
            <>
              <div className="sp-cell-title">{f.title}</div>
              <Mono>{f.key}</Mono>
            </>,
            <>
              <Badge tone={TONES[featureStateKind(f)]}>{featureStateText(f)}</Badge>
              {f.reasonText && featureStateKind(f) !== 'on' && <div className="sp-cell-note">{f.reasonText}</div>}
            </>,
            levelText(f),
            f.origin ?? '—',
            <>
              {rolesText(f)}
              {rolesNotGuaranteed(f, roleSource) && <div className="sp-cell-note sp-value-bad">роль из токена, ключ общий — не гарантируется</div>}
            </>,
            <Checks feature={f} />,
          ])}
        />
      )}
    </ReportSection>
  );
};

export default FeaturesSection;
