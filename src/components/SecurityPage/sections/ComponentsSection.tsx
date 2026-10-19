// ComponentsSection.tsx — раздел 8 «Компоненты» (9.2): SBOM бэкенда (или «не сформирован») и пакеты интерфейса
// из awms-build.json варианта поставки; отдельной строкой — OCCT под LGPL: в составе или исключён из сборки.
import React from 'react';
import type { FrontendBuild, SecurityReport } from '../api';
import { FactSectionBody, Missing, Mono, Pairs, ReportSection, Table, type Pair } from './ui';

/** Строка OCCT (просмотр 3D-моделей, лицензия LGPL) по файлу сборки */
const occtText = (build: FrontendBuild | null): string => {
  if (!build) return 'нет данных: файл сборки интерфейса не найден';
  if (build.excluded.some(m => /model3d|3d/i.test(m))) return 'исключён из сборки вместе с 3D-моделями';
  const pkg = [...build.vendored, ...build.packages].find(p => /occt/i.test(p.name));
  if (!pkg) return 'в составе сборки нет';
  return `в составе: ${pkg.name} ${pkg.version ?? ''}${pkg.license ? ` (${pkg.license})` : ''}`.replace(/\s+/g, ' ').trim();
};

const ComponentsSection: React.FC<{ report: SecurityReport; build: FrontendBuild | null; anchor?: string }> = ({
  report,
  build,
  anchor,
}) => {
  const items: Pair[] = [
    { label: 'Вариант сборки интерфейса', value: build?.variant ?? 'нет данных' },
    { label: 'Исключено из сборки', value: build ? (build.excluded.length ? build.excluded.join(', ') : 'ничего') : 'нет данных' },
    { label: 'OCCT (LGPL), просмотр 3D', value: occtText(build) },
  ];
  return (
    <ReportSection n={8} title="Компоненты" anchor={anchor}>
      <h3 className="sp-h3">Сервер</h3>
      {report.components === null ? <Missing /> : <FactSectionBody section={report.components} />}
      <h3 className="sp-h3">Интерфейс</h3>
      <Pairs items={items} />
      {build && build.packages.length > 0 && (
        <Table
          compact
          widths={[50, 25, 25]}
          caption={`Пакеты npm в сборке: ${build.packages.length}`}
          columns={['Пакет', 'Версия', 'Лицензия']}
          rows={build.packages.map(p => [<Mono>{p.name}</Mono>, p.version ?? '—', p.license ?? '—'])}
        />
      )}
      {build && build.vendored.length > 0 && (
        <Table
          compact
          widths={[30, 20, 25, 25]}
          caption="Готовые файлы библиотек (public/vendor)"
          columns={['Пакет', 'Версия', 'Лицензия', 'Каталог']}
          rows={build.vendored.map(p => [<Mono>{p.name}</Mono>, p.version ?? '—', p.license ?? '—', p.path ? <Mono wrap>{p.path}</Mono> : '—'])}
        />
      )}
    </ReportSection>
  );
};

export default ComponentsSection;
