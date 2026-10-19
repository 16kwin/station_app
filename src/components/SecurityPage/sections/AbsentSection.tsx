// AbsentSection.tsx — раздел 3 «Отсутствует в продукте» (9.2, 4.3): ИИ, телеметрия, удалённый доступ,
// автообновление, Push, облако, SMTP — каждое с обоснованием; ниже проверки среды сервера (actuator и devtools
// по classpath, JDWP и JMX remote по аргументам JVM).
import React from 'react';
import type { SecurityReport } from '../api';
import { CheckMark, Missing, Mono, ReportSection, Table } from './ui';

const AbsentSection: React.FC<{ report: SecurityReport; anchor?: string }> = ({ report, anchor }) => (
  <ReportSection n={3} title="Отсутствует в продукте" anchor={anchor} lead="Включить эти функции нельзя: их кода в продукте нет.">
    {report.absent === null ? (
      <Missing />
    ) : (
      <Table
        widths={[14, 30, 56]}
        columns={['Ключ', 'Что', 'Обоснование']}
        rows={report.absent.map(a => [<Mono>{a.key}</Mono>, a.title, a.reason || '—'])}
      />
    )}
    <h3 className="sp-h3">Проверки среды сервера</h3>
    {report.runtime === null ? (
      <Missing />
    ) : report.runtime.length === 0 ? (
      <Missing>Проверок нет.</Missing>
    ) : (
      <ul className="sp-checks sp-checks-block">
        {report.runtime.map((c, i) => (
          <li key={i}>
            <CheckMark ok={c.ok} /> {c.text}
          </li>
        ))}
      </ul>
    )}
  </ReportSection>
);

export default AbsentSection;
