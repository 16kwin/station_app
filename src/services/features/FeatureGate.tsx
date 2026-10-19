// FeatureGate.tsx — обёртки интерфейса над хранилищем функций (раздел 8.1 проекта):
//  • <Feature when="…"> — показывает содержимое, только если функция включена (скрыто, а не затенено);
//  • <FeatureRoute when="…"> — маршрут вне вкладок (/screen/*): выключено — «Раздел недоступен» во весь экран;
//  • <FeatureProvider> — загружает профиль после входа: до ответа — прелоадер, при ошибке — приложение
//    в закрытом режиме (только ядро) и плашка «Профиль функций не получен»; уведомляет об изменении состава
//    функций и перезапрашивает профиль, когда вкладка браузера возвращается из фона.
import React, { useEffect, type ReactNode } from 'react';
import FullScreenPreloader from '../../components/commonComponents/FullScreenPreloader';
import { COLORS, FONT, SHADOWS } from '../../components/mainPage/shared/layout';
import type { FeatureKey } from './catalog';
import FeatureUnavailablePage from './FeatureUnavailablePage';
import {
  acknowledgeFeatureChanges,
  hidePresetNotice,
  isFeatureOn,
  loadFeatures,
  refreshIfStale,
  useFeature,
  useFeatureSnapshot,
  useFeatureStatus,
  type FeatureSnapshot,
} from './featureStore';

/** Профиль старше этого перезапрашивается, когда вкладка браузера становится видимой (раздел 8.3) */
const PROFILE_MAX_AGE_MS = 5 * 60 * 1000;
/** Сколько висит уведомление «Состав функций изменён администратором» */
const CHANGE_NOTICE_MS = 8000;
/** Поверх модальных окон приложения (у них до 99999), как уведомления PWA */
const NOTICE_Z_INDEX = 100000;

interface FeatureProps {
  /** Ключ функции или несколько (нужны все) */
  when: FeatureKey | readonly FeatureKey[];
  /** Что показать, когда функция выключена; по умолчанию — ничего */
  fallback?: ReactNode;
  children?: ReactNode;
}

/** Содержимое только при включённой функции */
export const Feature: React.FC<FeatureProps> = ({ when, fallback = null, children }) => (useFeature(when) ? <>{children}</> : <>{fallback}</>);

interface FeatureRouteProps {
  when: FeatureKey | readonly FeatureKey[];
  children?: ReactNode;
}

/** Маршрут вне вкладок приложения: до загрузки профиля — прелоадер, функция выключена — «Раздел недоступен» */
export const FeatureRoute: React.FC<FeatureRouteProps> = ({ when, children }) => {
  const status = useFeatureStatus();
  const on = useFeature(when);
  useEffect(() => {
    if (status === 'idle') void loadFeatures();
  }, [status]);
  if (status === 'idle' || status === 'loading') return <FullScreenPreloader />;
  if (on) return <>{children}</>;
  // Какая функция закрывает маршрут: страница отличает «выключена» от «профиль не получен»
  const blocking = (typeof when === 'string' ? [when] : when).find(key => !isFeatureOn(key));
  return <FeatureUnavailablePage variant="screen" feature={blocking} />;
};

// ---------- Уведомления ----------

const Notice: React.FC<{ title: string; text: string; tone: 'warning' | 'info'; children?: ReactNode }> = ({ title, text, tone, children }) => (
  <div
    role={tone === 'warning' ? 'alert' : 'status'}
    aria-live="polite"
    style={{
      boxSizing: 'border-box',
      width: 'min(560px, calc(100vw - 32px))',
      padding: '12px 14px 12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      backgroundColor: COLORS.white,
      borderRadius: 16,
      borderLeft: `4px solid ${tone === 'warning' ? COLORS.orange : COLORS.accent}`,
      boxShadow: `${SHADOWS.card}, ${SHADOWS.modal}`,
      fontFamily: FONT,
      pointerEvents: 'auto',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>{title}</div>
      <div style={{ marginTop: 2, fontSize: 13, lineHeight: '18px', color: COLORS.textMuted }}>{text}</div>
    </div>
    {children}
  </div>
);

const NoticeButton: React.FC<{ onClick: () => void; disabled?: boolean; children: ReactNode }> = ({ onClick, disabled = false, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      height: 34,
      padding: '0 14px',
      borderRadius: 17,
      border: `1px solid ${COLORS.accent}`,
      backgroundColor: COLORS.white,
      color: COLORS.accent,
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {children}
  </button>
);

// Что пользователь уже видел (changesSeen, presetNoticeHidden), хранится в хранилище функций, а не в состоянии
// компонента: FeatureProvider размонтируется на время экрана блокировки, и после разблокировки прежние
// уведомления не должны появляться снова. Сбрасывается при выходе (resetFeatures)
const FeatureNotices: React.FC<{ snapshot: FeatureSnapshot }> = ({ snapshot }) => {
  const { status, profile, pending, changes, changesSeen, presetNoticeHidden } = snapshot;
  const changeVisible = changes > changesSeen;

  // Уведомление об изменении состава скрывается само
  useEffect(() => {
    if (!changeVisible) return;
    const timer = setTimeout(() => acknowledgeFeatureChanges(changes), CHANGE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [changeVisible, changes]);

  // Файла потолка нет — сервер работает в изолированном минимуме; видят те, кому доступна страница «Безопасность»
  const presetVisible = !presetNoticeHidden && profile?.presetSource === 'default' && profile.canViewSecurity;

  if (status !== 'error' && !changeVisible && !presetVisible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        zIndex: NOTICE_Z_INDEX,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {status === 'error' && (
        <Notice tone="warning" title="Профиль функций не получен" text="Показаны только основные разделы. Проверьте связь с сервером.">
          <NoticeButton onClick={() => void loadFeatures()} disabled={pending}>
            {pending ? 'Запрашиваем…' : 'Повторить'}
          </NoticeButton>
        </Notice>
      )}
      {changeVisible && (
        <Notice tone="info" title="Состав функций изменён администратором" text="Недоступные разделы закрыты, меню обновлено.">
          <NoticeButton onClick={() => acknowledgeFeatureChanges(changes)}>Понятно</NoticeButton>
        </Notice>
      )}
      {presetVisible && (
        <Notice
          tone="warning"
          title="Профиль функций установки не задан"
          text="Сервер работает в режиме «Изолированный минимум». Профиль задаёт администратор сервера."
        >
          <NoticeButton onClick={hidePresetNotice}>Скрыть</NoticeButton>
        </Notice>
      )}
    </div>
  );
};

// ---------- Провайдер ----------

/**
 * Ставится внутри ветки вошедшего пользователя, выше TabProvider: восстановление вкладок и меню читают
 * уже загруженный профиль. При ошибке (status = 'error') приложение тоже показывается, но профиля нет:
 * функции не выключены, а неизвестны. Поэтому сохранённые вкладки отбрасываются только по isPathKnownOff
 * (routes.ts), а не по !isPathAllowed — иначе разовый сбой при загрузке страницы стёр бы их навсегда
 */
export const FeatureProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const snapshot = useFeatureSnapshot();
  const { status } = snapshot;

  useEffect(() => {
    if (status === 'idle') void loadFeatures();
  }, [status]);

  // Постоянного опроса нет: изменения приходят заголовком ревизии в ответах API. Вернувшись из фона,
  // вкладка перезапрашивает профиль, если он старше 5 минут
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshIfStale(PROFILE_MAX_AGE_MS);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (status === 'idle' || status === 'loading') return <FullScreenPreloader />;
  return (
    <>
      {children}
      <FeatureNotices snapshot={snapshot} />
    </>
  );
};
