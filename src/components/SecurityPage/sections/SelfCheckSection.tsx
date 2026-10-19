// SelfCheckSection.tsx — раздел 11 «Как проверить самостоятельно» (9.2): команды, которые безопасник выполняет
// сам, без приложения, и ожидаемый результат. Если сервер команды не прислал, они строятся по отчёту: адреса
// проб выключенных функций, порт приложения, путь и SHA-256 файла потолка, отпечаток.
import React from 'react';
import type { SecurityReport } from '../api';
import { fallbackSelfCheck } from './format';
import { Mono, ReportSection, Table } from './ui';

const SelfCheckSection: React.FC<{ report: SecurityReport; probeUrls: readonly string[]; anchor?: string }> = ({
  report,
  probeUrls,
  anchor,
}) => {
  const rows = report.selfCheck ?? fallbackSelfCheck(report, probeUrls);
  return (
    <ReportSection
      n={11}
      title="Как проверить самостоятельно"
      anchor={anchor}
      lead="Команды выполняются с ноутбука безопасника или на сервере; вместо <сервер> подставьте адрес сервера."
    >
      <Table
        compact
        widths={[30, 50, 20]}
        columns={['Что проверить', 'Команда', 'Ожидается']}
        rows={rows.map(r => [r.title || '—', <Mono wrap>{r.command}</Mono>, r.expected ?? '—'])}
      />
    </ReportSection>
  );
};

export default SelfCheckSection;
