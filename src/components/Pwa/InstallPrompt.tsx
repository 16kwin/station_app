// InstallPrompt.tsx — ненавязчивое предложение установить приложение на телефоне или планшете.
// Chromium (Chrome, Яндекс Браузер на Android) — кнопка открывает системный диалог установки;
// iOS Safari — одноразовая инструкция «Поделиться → На экран „Домой“» (события установки там нет).
// На компьютерах и в уже установленном приложении ничего не показывает. Отказ запоминается.
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isIosSafari, isStandalone, readFlag, writeFlag } from './env';
import { promptInstall, useCanInstall } from './installEvent';
import { NARROW_QUERY, useMediaQuery } from './useMediaQuery';
import { APPEAR, COLORS, FONT, PWA_Z_INDEX, SHADOWS } from './theme';
import { AddToHomeIcon, CheckIcon, InstallIcon, ShareIcon } from './icons';
import { CloseButton, IconBadge, PwaButton } from './ui';

const DISMISS_KEY = 'awms.pwa.installDismissedAt';
const IOS_HINT_KEY = 'awms.pwa.iosHintShown';
/** После «Не сейчас» снова предложим не раньше чем через месяц */
const DISMISS_DAYS = 30;
/** Не мешаем первому экрану: предложение появляется с задержкой */
const SHOW_DELAY_MS = 4000;

const dismissedRecently = (): boolean => {
  const at = Number(readFlag(DISMISS_KEY));
  return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

const IOS_STEPS: { icon: React.ReactNode; text: React.ReactNode }[] = [
  {
    icon: <ShareIcon size={18} />,
    text: (
      <>
        Нажмите «Поделиться»
        <span style={{ color: COLORS.textMuted }}> — в iOS 26 оно в меню «•••»</span>
      </>
    ),
  },
  { icon: <AddToHomeIcon size={18} />, text: 'Выберите «На экран „Домой“»' },
  { icon: <CheckIcon size={18} />, text: 'Нажмите «Добавить»' },
];

interface Props {
  /** Скрыть, пока на экране уведомление об обновлении */
  suppressed?: boolean;
}

const InstallPrompt: React.FC<Props> = ({ suppressed = false }) => {
  const canInstall = useCanInstall();
  const narrow = useMediaQuery(NARROW_QUERY);
  // Решения, зависящие от окружения и истории, принимаются один раз при открытии страницы
  const [declined] = useState(dismissedRecently);
  const [iosHint] = useState(() => isIosSafari() && !isStandalone() && readFlag(IOS_HINT_KEY) === null);
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const mode: 'install' | 'ios' | null =
    !ready || closed || suppressed ? null : canInstall && !declined ? 'install' : iosHint ? 'ios' : null;

  // Инструкция для iOS — одноразовая: отмечаем, как только показали
  useEffect(() => {
    if (mode === 'ios') writeFlag(IOS_HINT_KEY, String(Date.now()));
  }, [mode]);

  const decline = () => {
    writeFlag(DISMISS_KEY, String(Date.now()));
    setClosed(true);
  };

  const install = async () => {
    setBusy(true);
    const accepted = await promptInstall();
    setBusy(false);
    if (!accepted) writeFlag(DISMISS_KEY, String(Date.now()));
    setClosed(true);
  };

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          key={`pwa-install-${mode}`}
          role="region"
          aria-label="Установка приложения"
          {...APPEAR}
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            zIndex: PWA_Z_INDEX,
            maxWidth: narrow ? undefined : 440,
            margin: '0 auto',
            boxSizing: 'border-box',
            padding: '16px 12px 16px 16px',
            backgroundColor: COLORS.white,
            borderRadius: 20,
            boxShadow: `${SHADOWS.card}, ${SHADOWS.modal}`,
            fontFamily: FONT,
            color: COLORS.text,
            transformOrigin: 'bottom center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <img
              src="/icons/apple-touch-icon.png"
              alt=""
              width={48}
              height={48}
              draggable={false}
              style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(45, 64, 89, 0.12)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '21px' }}>
                {mode === 'install' ? 'Установить «Динамику»' : 'Добавьте «Динамику» на экран «Домой»'}
              </div>
              <div style={{ marginTop: 3, fontSize: 13, lineHeight: '18px', color: COLORS.textMuted }}>
                Откроется в отдельном окне без адресной строки, ярлык появится на главном экране
              </div>
            </div>
            <CloseButton onClick={mode === 'install' ? decline : () => setClosed(true)} />
          </div>

          {mode === 'install' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, paddingRight: 4 }}>
              <PwaButton onClick={decline}>Не сейчас</PwaButton>
              <PwaButton primary busy={busy} onClick={() => void install()}>
                {!busy && <InstallIcon size={18} />}
                Установить
              </PwaButton>
            </div>
          ) : (
            <>
              <ol style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {IOS_STEPS.map((step, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, lineHeight: '19px' }}>
                    <IconBadge size={34}>{step.icon}</IconBadge>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingRight: 4 }}>
                <PwaButton primary onClick={() => setClosed(true)}>
                  Понятно
                </PwaButton>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
