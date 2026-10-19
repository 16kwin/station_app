// FactsSection.tsx — разделы «Входящие» (4), «Исходящие» (5) и «Фон» (6) отчёта: сведения сервера
// «свойство — значение», списки и таблицы. Поля, которых интерфейс не знает, печатаются как есть.
import React, { type ReactNode } from 'react';
import type { FactSection } from '../api';
import { FactSectionBody, Missing, ReportSection } from './ui';

interface FactsSectionProps {
  n: number;
  title: string;
  section: FactSection | null;
  lead?: ReactNode;
  anchor?: string;
}

const FactsSection: React.FC<FactsSectionProps> = ({ n, title, section, lead, anchor }) => (
  <ReportSection n={n} title={title} anchor={anchor} lead={lead}>
    {section === null ? <Missing /> : <FactSectionBody section={section} />}
  </ReportSection>
);

export default FactsSection;
