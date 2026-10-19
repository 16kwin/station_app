// PurgeDialog.tsx — «Удалить данные» функции, выключенной потолком (разделы 6.7 и 6.8 проекта): только
// администратор ИБ, причина, подтверждение своим паролем, запись PURGE в журнал профиля. Окно показывает, что
// именно будет удалено, и требует отметить «понимаю, безвозвратно». Пароль живёт только в поле окна: уходит
// в теле запроса, после ответа (любого) поле очищается, в консоль и журнал не пишется.
import React, { useEffect, useRef, useState } from 'react';
import { purgeFeatureData, validatePurge, type PurgeResult, type StoredDataRow } from './api';
import { formatBytes, formatCount } from './sections/format';
import { Mono } from './sections/ui';

interface PurgeDialogProps {
  row: StoredDataRow;
  /** Название функции */
  title: string;
  onClose: () => void;
  /** Данные удалены: страница перезапрашивает отчёт */
  onDone: (result: PurgeResult) => void;
}

const Volumes: React.FC<{ tables: StoredDataRow['tables']; dirs: StoredDataRow['dirs'] }> = ({ tables, dirs }) => (
  <ul className="sp-plain sp-dialog-list">
    {tables.map(t => (
      <li key={t.name}>
        таблица <Mono>{t.name}</Mono> — {formatCount(t.rows)} строк
      </li>
    ))}
    {dirs.map(d => (
      <li key={d.path}>
        каталог <Mono wrap>{d.path}</Mono> — {d.files === null ? '' : `${formatCount(d.files)} файлов, `}
        {formatBytes(d.bytes)}
      </li>
    ))}
    {tables.length === 0 && dirs.length === 0 && <li>объёмы неизвестны — сервер их не прислал</li>}
  </ul>
);

const PurgeDialog: React.FC<PurgeDialogProps> = ({ row, title, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurgeResult | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    reasonRef.current?.focus();
  }, []);

  const close = () => {
    if (busy) return;
    if (result) onDone(result);
    else onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        if (result) onDone(result);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, result, onClose, onDone]);

  const invalid = validatePurge({ feature: row.feature, reason, password });
  const canSubmit = !busy && !result && understood && invalid === null;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const outcome = await purgeFeatureData({ feature: row.feature, reason, password });
    // Пароль не храним ни при успехе, ни при отказе: повтор — с вводом заново
    setPassword('');
    setBusy(false);
    if (outcome.ok) setResult(outcome.result);
    else setError(outcome.message);
  };

  return (
    <div className="sp-overlay" role="presentation" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="sp-dialog" role="dialog" aria-modal="true" aria-labelledby="sp-purge-title">
        <h2 className="sp-dialog-title" id="sp-purge-title">
          {result ? 'Данные удалены' : `Удалить данные: ${title}`}
        </h2>
        {result ? (
          <>
            <p className="sp-dialog-text">Удалено:</p>
            <Volumes tables={result.tables} dirs={result.dirs} />
            <p className="sp-dialog-text">
              {result.journalId !== null
                ? `Запись № ${result.journalId} в журнале профиля.`
                : 'Удаление записано в журнал профиля.'}
            </p>
            <div className="sp-dialog-actions">
              <button type="button" className="sp-btn sp-btn-primary" onClick={close}>
                Закрыть
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="sp-dialog-text">
              Функция <Mono>{row.feature}</Mono> выключена потолком установки. Будут удалены безвозвратно:
            </p>
            <Volumes tables={row.tables} dirs={row.dirs} />
            <p className="sp-dialog-text sp-muted">
              Повторное включение функции данные не вернёт. Удаление записывается в журнал профиля с вашим именем и
              причиной.
            </p>
            <label className="sp-field">
              <span>Причина удаления</span>
              <textarea
                ref={reasonRef}
                value={reason}
                maxLength={1000}
                rows={3}
                disabled={busy}
                onChange={e => setReason(e.target.value)}
                placeholder="Например: решение комиссии по ИБ, протокол № … от …"
              />
            </label>
            <label className="sp-field">
              <span>Ваш пароль</span>
              <input
                type="password"
                name="awms-purge-confirmation"
                autoComplete="off"
                value={password}
                disabled={busy}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void submit()}
              />
            </label>
            <label className="sp-check">
              <input type="checkbox" checked={understood} disabled={busy} onChange={e => setUnderstood(e.target.checked)} />
              <span>Понимаю: данные будут удалены безвозвратно</span>
            </label>
            {error && (
              <p className="sp-dialog-error" role="alert">
                {error}
              </p>
            )}
            <div className="sp-dialog-actions">
              <button type="button" className="sp-btn" onClick={close} disabled={busy}>
                Отмена
              </button>
              <button type="button" className="sp-btn sp-btn-danger" onClick={() => void submit()} disabled={!canSubmit}>
                {busy ? 'Удаляем…' : 'Удалить данные'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PurgeDialog;
