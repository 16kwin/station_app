// CaveatsSection.tsx — «Оговорки» (раздел 9.4 проекта): что отчёт не гарантирует. Список присылает сервер;
// если не прислал — строится по состоянию установки (format.fallbackCaveats), чтобы отчёт не обещал больше.
import React from 'react';
import type { SecurityReport } from '../api';
import { fallbackCaveats } from './format';
import { ReportSection } from './ui';

const CaveatsSection: React.FC<{ report: SecurityReport; n: number; anchor?: string }> = ({ report, n, anchor }) => {
  const caveats = report.caveats ?? fallbackCaveats(report);
  return (
    <ReportSection n={n} title="Оговорки" anchor={anchor} lead="Что этот отчёт не гарантирует.">
      <ul className="sp-caveats">
        {caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </ReportSection>
  );
};

export default CaveatsSection;
