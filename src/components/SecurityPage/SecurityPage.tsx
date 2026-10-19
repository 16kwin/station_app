// SecurityPage.tsx — страница «Безопасность» (раздел 9 проекта «Дискретное отключение функций», пакет F8): отчёт
// «Профиль безопасности» установки для администратора ИБ заказчика. Доступна ролям SECURITY_VIEWERS
// (администратор, директор, администратор ИБ) и входит в ядро: работает при любом составе функций.
//
// Что умеет страница:
//  • показывает отчёт сервера (GET /api/security-profile) — тринадцать разделов 9.2, оговорки 9.4;
//  • печатает его на A4 (отпечаток профиля и голова журнала на каждой странице, блок подписей в конце);
//  • выгружает JSON: отчёт сервера как есть, файл сборки интерфейса и результат проверки из браузера;
//  • «Проверить из браузера»: GET и HEAD на адреса выключенных функций, с входом и без, ожидается 404;
//  • администратору ИБ — «Удалить данные» функции, выключенной потолком (пароль, запись PURGE);
//  • просмотр, печать, выгрузка и проверка пишутся в журнал профиля (POST /api/security-profile/events).
// Вкладку «Переключатели» (этап 2) добавит пакет F9: полоса вкладок встанет под шапкой страницы (sp-tabs в print.css).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../services/AuthContext';
import { useFeatureSnapshot } from '../../services/features/featureStore';
import { roleName } from '../../services/roles';
import {
  fetchFrontendBuild,
  fetchSecurityReport,
  postSecurityEvent,
  ReportLoadError,
  type FrontendBuild,
  type ReportFailure,
  type SecurityReport,
  type StoredDataRow,
} from './api';
import { probeEventDetails, probeTargets, runProbes, type ProbeRun } from './probes';
import { usePrintReport } from './printing';
import ProfileReport from './ProfileReport';
import PurgeDialog from './PurgeDialog';
import { buildExport, exportFileName, formatDateTime, presetText, shortHash } from './sections/format';
import { OUTLINE } from './sections/outline';
import './print.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: SecurityReport; refreshing: boolean }
  | { status: 'error'; failure: ReportFailure };

const FAILURE_TEXT: Record<ReportFailure['kind'], { title: string; text: string }> = {
  forbidden: {
    title: 'Нет доступа к профилю безопасности',
    text: 'Отчёт доступен администратору, директору и администратору ИБ.',
  },
  unsupported: {
    title: 'Сервер не отдаёт отчёт «Профиль безопасности»',
    text: 'Нужна новая версия сервера. Состав функций по-прежнему действует — его задаёт файл потолка установки.',
  },
  format: {
    title: 'Ответ сервера не разобран',
    text: 'Сервер прислал отчёт без отпечатка профиля или в неизвестном виде. Такой отчёт нельзя сверить и печатать.',
  },
  network: { title: 'Нет связи с сервером', text: 'Проверьте подключение и повторите.' },
  server: { title: 'Ошибка сервера', text: 'Сервер не смог сформировать отчёт. Повторите позже.' },
};

/** Скачать файл, собранный в браузере */
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

const Banner: React.FC<{ tone: 'warn' | 'bad' | 'info'; children: React.ReactNode; action?: React.ReactNode }> = ({ tone, children, action }) => (
  <div className={`sp-banner sp-banner-${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
    <div>{children}</div>
    {action}
  </div>
);

const StateCard: React.FC<{ title: string; text: string; action?: React.ReactNode }> = ({ title, text, action }) => (
  <div className="sp-state">
    <div className="sp-state-title">{title}</div>
    <div className="sp-state-text">{text}</div>
    {action}
  </div>
);

const SecurityPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { userInfo } = useAuth();
  const featureSnapshot = useFeatureSnapshot();
  const storeProfile = featureSnapshot.profile;
  // Профиль функций уже сказал, что страница пользователю недоступна, — отчёт не запрашиваем
  const denied = featureSnapshot.status === 'ready' && storeProfile !== null && !storeProfile.canViewSecurity;

  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [build, setBuild] = useState<FrontendBuild | null>(null);
  const [viewLogged, setViewLogged] = useState<boolean | null>(null);
  const [probeRun, setProbeRun] = useState<ProbeRun | null>(null);
  const [probeProgress, setProbeProgress] = useState<{ done: number; total: number } | null>(null);
  const [probeLogged, setProbeLogged] = useState<boolean | null>(null);
  const [purgeRow, setPurgeRow] = useState<StoredDataRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const probeAbort = useRef<AbortController | null>(null);
  /** Отпечаток последнего полученного отчёта: проверка из браузера относится к нему */
  const lastFingerprint = useRef<string | null>(null);

  const report = load.status === 'ready' ? load.report : null;

  // Отчёт: при открытии и по кнопке «Обновить». Каждый полученный отчёт — событие REPORT_VIEWED
  useEffect(() => {
    if (denied) return;
    let cancelled = false;
    fetchSecurityReport().then(
      next => {
        if (cancelled) return;
        setLoad({ status: 'ready', report: next, refreshing: false });
        // Проверка из браузера относится к профилю: другой отпечаток — прежний результат не показываем
        if (lastFingerprint.current !== next.header.fingerprint) setProbeRun(null);
        lastFingerprint.current = next.header.fingerprint;
        void postSecurityEvent('REPORT_VIEWED', next).then(ok => !cancelled && setViewLogged(ok));
      },
      (error: unknown) => {
        if (cancelled) return;
        const failure: ReportFailure = error instanceof ReportLoadError ? error.failure : { kind: 'network' };
        setLoad(prev => (prev.status === 'ready' && failure.kind === 'network' ? { ...prev, refreshing: false } : { status: 'error', failure }));
        if (failure.kind === 'network') setNotice('Отчёт не обновлён: нет связи с сервером.');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, denied]);

  // Файл сборки интерфейса (вариант поставки) — один раз
  useEffect(() => {
    let cancelled = false;
    void fetchFrontendBuild().then(b => !cancelled && setBuild(b));
    return () => {
      cancelled = true;
    };
  }, []);

  // Уход со страницы прерывает проверку из браузера
  useEffect(() => () => probeAbort.current?.abort(), []);

  const reload = useCallback(() => {
    setNotice(null);
    setLoad(prev => (prev.status === 'ready' ? { ...prev, refreshing: true } : { status: 'loading' }));
    setAttempt(a => a + 1);
  }, []);

  const onPrint = useCallback(() => {
    if (report) void postSecurityEvent('REPORT_PRINTED', report, { probesRun: probeRun !== null });
  }, [report, probeRun]);
  const { printing, printedAt, print } = usePrintReport(rootRef, report !== null, onPrint);

  const targets = useMemo(() => (report ? probeTargets(report) : []), [report]);

  const runBrowserProbes = useCallback(async () => {
    if (!report || probeProgress) return;
    probeAbort.current?.abort();
    const controller = new AbortController();
    probeAbort.current = controller;
    setProbeLogged(null);
    setProbeProgress({ done: 0, total: targets.length * 4 });
    const run = await runProbes(targets, {
      baseUrl: window.config.ip_api,
      signal: controller.signal,
      onProgress: (done, total) => !controller.signal.aborted && setProbeProgress({ done, total }),
    });
    if (controller.signal.aborted) return;
    setProbeRun(run);
    setProbeProgress(null);
    setProbeLogged(await postSecurityEvent('PROBE_RUN', report, probeEventDetails(run)));
  }, [report, targets, probeProgress]);

  const exportJson = useCallback(() => {
    if (!report) return;
    const now = new Date();
    const name = exportFileName(report, now);
    download(name, JSON.stringify(buildExport(report, build, probeRun, now), null, 2));
    void postSecurityEvent('REPORT_EXPORTED', report, { file: name, probesRun: probeRun !== null }).then(
      ok => !ok && setNotice('Выгрузка не записана в журнал профиля: сервер не принял событие.'),
    );
  }, [report, build, probeRun]);

  // Удалять данные может только администратор ИБ: решает сервер (viewer.canPurge), иначе — роль пользователя
  const viewerCanPurge = report
    ? (report.viewer.canPurge ?? roleName(report.viewer.role ?? userInfo.role) === 'SECURITY')
    : false;
  const purgeTitle = (row: StoredDataRow) => row.title ?? report?.features?.find(f => f.key === row.feature)?.title ?? row.feature;

  const scrollTo = (anchor: string) => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ---------- Состояния без отчёта ----------

  if (denied) {
    return (
      <div className="sp-page" ref={rootRef}>
        <StateCard title={FAILURE_TEXT.forbidden.title} text={FAILURE_TEXT.forbidden.text} />
      </div>
    );
  }

  const header = report?.header ?? null;
  const revisionChanged =
    header?.revision != null && storeProfile?.revision != null && storeProfile.revision !== header.revision;
  const outline = OUTLINE.filter(item => item.n !== 15 || (report?.extra.length ?? 0) > 0);

  return (
    <div className="sp-page" ref={rootRef}>
      <div className="sp-topbar">
        <div>
          <h1 className="sp-title">Безопасность</h1>
          <div className="sp-subtitle">
            {header ? (
              <>
                Профиль {presetText(header.preset)} · отпечаток <span className="sp-mono">{shortHash(header.fingerprint)}</span> ·
                сформирован {formatDateTime(report?.generatedAt)}
              </>
            ) : (
              'Профиль безопасности установки'
            )}
          </div>
        </div>
        <div className="sp-toolbar">
          <button type="button" className="sp-btn" onClick={reload} disabled={load.status === 'loading' || (load.status === 'ready' && load.refreshing)}>
            {load.status === 'ready' && load.refreshing ? 'Обновляем…' : 'Обновить'}
          </button>
          <button type="button" className="sp-btn" onClick={() => void runBrowserProbes()} disabled={!report || targets.length === 0 || probeProgress !== null}>
            {probeProgress ? `Проверяем… ${probeProgress.done} из ${probeProgress.total}` : 'Проверить из браузера'}
          </button>
          <button type="button" className="sp-btn" onClick={exportJson} disabled={!report}>
            Выгрузить JSON
          </button>
          <button type="button" className="sp-btn sp-btn-primary" onClick={print} disabled={!report}>
            Печать
          </button>
        </div>
      </div>

      {load.status === 'loading' && <StateCard title="Формируем отчёт…" text="Сервер собирает сведения о профиле установки." />}

      {load.status === 'error' && (
        <StateCard
          title={FAILURE_TEXT[load.failure.kind].title}
          text={
            load.failure.kind === 'server'
              ? `${FAILURE_TEXT.server.text} Код ответа: ${load.failure.status}.`
              : load.failure.kind === 'format'
                ? `${FAILURE_TEXT.format.text} (${load.failure.message})`
                : FAILURE_TEXT[load.failure.kind].text
          }
          action={
            load.failure.kind !== 'forbidden' && (
              <button type="button" className="sp-btn sp-btn-primary" onClick={reload}>
                Повторить
              </button>
            )
          }
        />
      )}

      {report && header && (
        <>
          <div className="sp-banners">
            {header.presetSource === 'default' && (
              <Banner tone="warn">
                Файл потолка не найден: действует «Изолированный минимум». Состав функций задаётся файлом
                config/awms-features.properties на сервере.
              </Banner>
            )}
            {header.presetSource === 'env' && (
              <Banner tone="bad">Профиль задан переменной окружения AWMS_FEATURES_PRESET: для согласования он непригоден.</Banner>
            )}
            {report.journal?.chainValid === false && (
              <Banner tone="bad">
                Цепочка журнала профиля нарушена
                {report.journal.brokenAt !== null ? ` на записи № ${report.journal.brokenAt}` : ''}: записи журнала изменены в
                обход приложения.
              </Banner>
            )}
            {report.features?.some(f => f.reason === 'TAMPER') && (
              <Banner tone="bad">Состояние переключателей изменено в обход приложения: такие функции выключены.</Banner>
            )}
            {header.secretsState === 'repository' && (
              <Banner tone="bad">Секреты установки совпадают со значениями из репозитория: их нужно сгенерировать заново.</Banner>
            )}
            {revisionChanged && (
              <Banner
                tone="info"
                action={
                  <button type="button" className="sp-btn sp-btn-small" onClick={reload}>
                    Обновить отчёт
                  </button>
                }
              >
                Профиль функций изменился после формирования отчёта. Обновите отчёт перед печатью.
              </Banner>
            )}
            {notice && <Banner tone="warn">{notice}</Banner>}
            {viewLogged === false && (
              <Banner tone="warn">Просмотр не записан в журнал профиля: сервер не принял событие.</Banner>
            )}
          </div>

          <div className="sp-layout">
            <nav className="sp-toc" aria-label="Разделы отчёта">
              {outline.map(item => (
                <button key={item.anchor} type="button" className="sp-toc-item" onClick={() => scrollTo(item.anchor)}>
                  <span className="sp-toc-num">{item.n}</span>
                  {item.title}
                </button>
              ))}
            </nav>
            <div className="sp-main">
              <ProfileReport
                report={report}
                build={build}
                mode="screen"
                probeTargets={targets}
                probeRun={probeRun}
                probeProgress={probeProgress}
                probeLogged={probeLogged}
                onRunProbes={() => void runBrowserProbes()}
                viewerCanPurge={viewerCanPurge}
                onPurge={setPurgeRow}
              />
            </div>
          </div>

          {printing &&
            createPortal(
              <div className="sp-print-root">
                <ProfileReport
                  report={report}
                  build={build}
                  mode="print"
                  probeTargets={targets}
                  probeRun={probeRun}
                  probeProgress={null}
                  probeLogged={probeLogged}
                  viewerCanPurge={false}
                  printedAt={printedAt ?? undefined}
                />
              </div>,
              document.body,
            )}

          {purgeRow && (
            <PurgeDialog
              row={purgeRow}
              title={purgeTitle(purgeRow)}
              onClose={() => setPurgeRow(null)}
              onDone={() => {
                setPurgeRow(null);
                reload();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SecurityPage;
