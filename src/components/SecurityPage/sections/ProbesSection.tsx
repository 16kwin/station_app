// ProbesSection.tsx — раздел 10 «Проверка из браузера» (9.2, протокол 9.3 п. 4): адрес каждой выключенной
// функции запрошен методами GET и HEAD под учётной записью и без входа; ожидается 404 везде. Результат пишется
// в журнал профиля (PROBE_RUN). В печатной копии — результат последней проверки или «не выполнялась».
import React from 'react';
import type { ProbeAttempt, ProbeRun, ProbeTarget } from '../probes';
import { OUTCOME_TEXT, PROBE_PLAN } from '../probes';
import { formatDateTime } from './format';
import { Badge, Missing, Mono, ReportSection, Table } from './ui';

interface ProbesSectionProps {
  targets: readonly ProbeTarget[];
  run: ProbeRun | null;
  /** Ход проверки: выполнено / всего; null — не идёт */
  progress: { done: number; total: number } | null;
  onRun?: () => void;
  print: boolean;
  /** Записалась ли проверка в журнал профиля; null — ещё не отправляли */
  logged: boolean | null;
  anchor?: string;
}

const COLUMN_TITLES = PROBE_PLAN.map(p => `${p.method} ${p.auth === 'session' ? 'с входом' : 'без входа'}`);

const AttemptCell: React.FC<{ attempt: ProbeAttempt | undefined }> = ({ attempt }) => {
  if (!attempt) return <span className="sp-muted">—</span>;
  const ok = attempt.outcome === 'closed';
  return (
    <span className={ok ? 'sp-value-ok' : 'sp-value-bad'} title={OUTCOME_TEXT[attempt.outcome]}>
      {attempt.status === null ? 'нет ответа' : attempt.status === 0 ? 'перенаправление' : attempt.status}
      {!ok && <span className="sp-cell-note">{OUTCOME_TEXT[attempt.outcome]}</span>}
    </span>
  );
};

const ProbesSection: React.FC<ProbesSectionProps> = ({ targets, run, progress, onRun, print, logged, anchor }) => {
  const running = progress !== null;
  const button = !print && onRun && targets.length > 0 && (
    <button type="button" className="sp-btn sp-btn-small" onClick={onRun} disabled={running}>
      {running ? `Проверяем… ${progress.done} из ${progress.total}` : run ? 'Проверить ещё раз' : 'Проверить из браузера'}
    </button>
  );
  const byUrl = new Map((run?.results ?? []).map(r => [r.target.url, r]));
  return (
    <ReportSection
      n={10}
      title="Проверка из браузера"
      anchor={anchor}
      actions={button || undefined}
      lead="Адрес каждой выключенной функции запрашивается методами GET и HEAD — под вашей учётной записью и без входа. Ворота сервера стоят раньше правил доступа, поэтому закрытая функция отвечает 404 во всех четырёх случаях."
    >
      {targets.length === 0 ? (
        <Missing>У выключенных функций нет адресов для проверки: их маршрутов на сервере нет или все функции включены.</Missing>
      ) : (
        <>
          {run ? (
            <p className="sp-summary">
              {run.failed === 0 ? (
                <Badge tone="ok">
                  Все ответили 404: {run.total} из {run.total}
                </Badge>
              ) : (
                <Badge tone="bad">
                  Не 404: {run.failed} из {run.total}
                </Badge>
              )}{' '}
              Проверка {formatDateTime(run.finishedAt)}
              {logged === false && <span className="sp-muted"> · в журнал профиля не записана</span>}
            </p>
          ) : (
            <p className="sp-summary sp-muted">{print ? 'Проверка из браузера не выполнялась.' : 'Проверка ещё не выполнялась.'}</p>
          )}
          <Table
            compact
            widths={[22, 26, 10, 10, 10, 10, 12]}
            columns={['Функция', 'Адрес', ...COLUMN_TITLES, 'Итог']}
            rows={targets.map(t => {
              const result = byUrl.get(t.url);
              return [
                <>
                  <div className="sp-cell-title">{t.title}</div>
                  <Mono>{t.feature}</Mono>
                </>,
                <Mono wrap>{t.url}</Mono>,
                ...PROBE_PLAN.map((_, i) => <AttemptCell attempt={result?.attempts[i]} />),
                result ? (
                  result.ok ? <Badge tone="ok">закрыто</Badge> : <Badge tone="bad">проверить</Badge>
                ) : (
                  <span className="sp-muted">—</span>
                ),
              ];
            })}
          />
        </>
      )}
    </ReportSection>
  );
};

export default ProbesSection;
