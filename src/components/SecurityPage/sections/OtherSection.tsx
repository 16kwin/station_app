// OtherSection.tsx — «Прочие сведения»: разделы ответа сервера, которых интерфейс не знает. Печатаются как есть,
// чтобы на бумаге было не меньше, чем прислал сервер (новый раздел появится в отчёте и без правки интерфейса).
import React from 'react';
import { plainValue, type SecurityReport } from '../api';
import { Mono, ReportSection, Table } from './ui';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const Value: React.FC<{ value: unknown }> = ({ value }) => {
  if (Array.isArray(value) && value.length > 0 && value.every(isRecord)) {
    const keys: string[] = [];
    value.forEach(v => Object.keys(v).forEach(k => keys.includes(k) || keys.push(k)));
    return <Table compact columns={keys} rows={value.map(v => keys.map(k => plainValue(v[k])))} />;
  }
  if (isRecord(value)) {
    return (
      <dl className="sp-facts">
        {Object.entries(value).map(([k, v]) => (
          <div className="sp-fact" key={k}>
            <dt>{k}</dt>
            <dd>{plainValue(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p>{plainValue(value)}</p>;
};

const OtherSection: React.FC<{ report: SecurityReport; n: number; anchor?: string }> = ({ report, n, anchor }) =>
  report.extra.length === 0 ? null : (
    <ReportSection n={n} title="Прочие сведения" anchor={anchor} lead="Разделы ответа сервера, которые интерфейс печатает как есть.">
      {report.extra.map(({ key, value }) => (
        <div key={key} className="sp-other">
          <h3 className="sp-h3">
            <Mono>{key}</Mono>
          </h3>
          <Value value={value} />
        </div>
      ))}
    </ReportSection>
  );

export default OtherSection;
