// ProfileReport.tsx — отчёт «Профиль безопасности» целиком (раздел 9.2 проекта): тринадцать разделов, оговорки,
// прочие сведения. Один компонент для экрана и для бумаги:
//  • screen — карточки разделов с якорями оглавления, кнопками проверки из браузера и удаления данных;
//  • print — лист A4: таблица-рамка, у которой шапка (thead) и подвал (tfoot) повторяются браузером на каждой
//    странице — на каждой странице отпечаток профиля и голова журнала; в конце блок подписей; без кнопок.
// Компонент только показывает: запросы, печать и события журнала — в SecurityPage.
import React, { type ReactNode } from 'react';
import type { FrontendBuild, SecurityReport, StoredDataRow } from './api';
import type { ProbeRun, ProbeTarget } from './probes';
import AbsentSection from './sections/AbsentSection';
import CaveatsSection from './sections/CaveatsSection';
import ComponentsSection from './sections/ComponentsSection';
import FactsSection from './sections/FactsSection';
import FeaturesSection from './sections/FeaturesSection';
import HeaderSection from './sections/HeaderSection';
import JournalSection from './sections/JournalSection';
import OtherSection from './sections/OtherSection';
import ProbesSection from './sections/ProbesSection';
import RolesSection from './sections/RolesSection';
import SelfCheckSection from './sections/SelfCheckSection';
import SignaturesBlock from './sections/SignaturesBlock';
import StoredDataSection from './sections/StoredDataSection';
import UsageSection from './sections/UsageSection';
import { formatDateTime, presetText, shortHash } from './sections/format';
import { anchorOf } from './sections/outline';
import { Mono } from './sections/ui';

export interface ProfileReportProps {
  report: SecurityReport;
  build: FrontendBuild | null;
  mode: 'screen' | 'print';
  probeTargets: readonly ProbeTarget[];
  probeRun: ProbeRun | null;
  probeProgress: { done: number; total: number } | null;
  /** Проверка записана в журнал профиля; null — не отправляли */
  probeLogged: boolean | null;
  onRunProbes?: () => void;
  /** Кнопка «Удалить данные» доступна пользователю (администратор ИБ) */
  viewerCanPurge: boolean;
  onPurge?: (row: StoredDataRow) => void;
  /** Время печати для подвала листа */
  printedAt?: string;
}

/** Шапка каждого листа: отчёт, сервер, отпечаток, голова журнала */
const RunningHead: React.FC<{ report: SecurityReport }> = ({ report }) => {
  const { header } = report;
  const head = header.journalHead ?? report.journal?.head ?? null;
  return (
    <div className="sp-run-head">
      <div className="sp-run-title">
        Профиль безопасности AWMS «ДИНАМИКА»
        {header.host ? ` · ${header.host}` : ''} · сформирован {formatDateTime(report.generatedAt)}
      </div>
      <div>
        Отпечаток профиля: <Mono>{header.fingerprint}</Mono>
      </div>
      <div>
        Голова журнала: {head ? (
          <>
            запись № {head.id ?? '—'} · <Mono>{head.hash ?? '—'}</Mono>
          </>
        ) : (
          'нет данных'
        )}
      </div>
    </div>
  );
};

const RunningFoot: React.FC<{ report: SecurityReport; printedAt?: string }> = ({ report, printedAt }) => (
  <div className="sp-run-foot">
    Напечатан {formatDateTime(printedAt ?? report.generatedAt)} · отпечаток {shortHash(report.header.fingerprint, 12)} ·
    подписи — на последней странице
  </div>
);

/** Таблица-рамка печатной копии: thead и tfoot браузер повторяет на каждой странице */
const PrintFrame: React.FC<{ report: SecurityReport; printedAt?: string; children: ReactNode }> = ({ report, printedAt, children }) => (
  <table className="sp-frame">
    <thead>
      <tr>
        <td>
          <RunningHead report={report} />
        </td>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <td>
          <RunningFoot report={report} printedAt={printedAt} />
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr>
        <td>{children}</td>
      </tr>
    </tbody>
  </table>
);

const ProfileReport: React.FC<ProfileReportProps> = props => {
  const { report, build, mode } = props;
  const print = mode === 'print';
  // Якоря — только у экранной копии: печатная живёт в том же документе, id не должны повторяться
  const anchor = (n: number) => (print ? undefined : anchorOf(n));
  const probeUrls = props.probeTargets.map(t => t.url);

  const body = (
    <div className={print ? 'sp-report sp-report--print' : 'sp-report sp-report--screen'}>
      {print && (
        <div className="sp-doc-title">
          <h1>Профиль безопасности установки</h1>
          <div className="sp-doc-sub">
            AWMS «ДИНАМИКА» · профиль функций {presetText(report.header.preset)}
            {report.header.ticket ? ` · основание: ${report.header.ticket}` : ''}
          </div>
        </div>
      )}
      <HeaderSection report={report} build={build} anchor={anchor(1)} />
      <FeaturesSection report={report} anchor={anchor(2)} />
      <AbsentSection report={report} anchor={anchor(3)} />
      <FactsSection
        n={4}
        title="Входящие"
        section={report.inbound}
        anchor={anchor(4)}
        lead="Порт и адрес приложения, таблица маршрутизации, маршруты, закрытые воротами, и адреса, доступные без входа."
      />
      <FactsSection
        n={5}
        title="Исходящие"
        section={report.outbound}
        anchor={anchor(5)}
        lead="Куда сервер устанавливает соединения сам: база данных, внешняя система заказов, камеры."
      />
      <FactsSection
        n={6}
        title="Фон"
        section={report.background}
        anchor={anchor(6)}
        lead="Потоки, задачи по расписанию и при старте, дочерние процессы сервера."
      />
      <StoredDataSection
        report={report}
        viewerCanPurge={props.viewerCanPurge}
        onPurge={props.onPurge}
        print={print}
        anchor={anchor(7)}
      />
      <ComponentsSection report={report} build={build} anchor={anchor(8)} />
      <JournalSection report={report} anchor={anchor(9)} />
      <ProbesSection
        targets={props.probeTargets}
        run={props.probeRun}
        progress={props.probeProgress}
        onRun={props.onRunProbes}
        print={print}
        logged={props.probeLogged}
        anchor={anchor(10)}
      />
      <SelfCheckSection report={report} probeUrls={probeUrls} anchor={anchor(11)} />
      <RolesSection report={report} anchor={anchor(12)} />
      <UsageSection report={report} anchor={anchor(13)} />
      <CaveatsSection report={report} n={14} anchor={anchor(14)} />
      <OtherSection report={report} n={15} anchor={anchor(15)} />
      {print && <SignaturesBlock fingerprint={report.header.fingerprint} />}
    </div>
  );

  return print ? (
    <PrintFrame report={report} printedAt={props.printedAt}>
      {body}
    </PrintFrame>
  ) : (
    body
  );
};

export default ProfileReport;
