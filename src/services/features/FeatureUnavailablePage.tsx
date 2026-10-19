// FeatureUnavailablePage.tsx — «Раздел недоступен на этой установке» (раздел 8.3 проекта): вкладка раздела
// выключенной функции, закладка или прямая ссылка на него. Тихого перехода нет — пользователь видит, почему
// раздела нет. Ключей функций и технических подробностей на экране нет: состав функций — дело администратора
// сервера. Тем, кому доступна страница «Безопасность», — ссылка на профиль безопасности.
// Если профиль функций не получен (сбой связи при загрузке), раздел не выключен, а пока неизвестен: страница
// говорит об этом и предлагает повторить запрос; когда профиль придёт, вкладка получит свой раздел.
import React, { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import { COLORS, FONT, SHADOWS } from '../../components/mainPage/shared/layout';
import type { FeatureKey } from './catalog';
import { isFeatureKnownOff, loadFeatures, useFeatureSnapshot } from './featureStore';

interface FeatureUnavailablePageProps {
  /**
   * Функция раздела: на экран не выводится. По ней страница отличает «выключено» от «профиль не получен»;
   * без неё (заглушка модуля, которого нет в сборке) — всегда «недоступен на этой установке»
   */
  feature?: FeatureKey;
  /** tab — внутри вкладки приложения; screen — отдельная вкладка браузера без меню (/screen/*), без TabProvider */
  variant?: 'tab' | 'screen';
}

const ACCENT_HOVER = '#5559E0';
const ACCENT_SOFT = '#F0F1FF';

const ActionButton: React.FC<{ primary?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }> = ({
  primary = false,
  disabled = false,
  onClick,
  children,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        opacity: disabled ? 0.6 : 1,
        height: 44,
        padding: '0 22px',
        borderRadius: 22,
        border: primary ? 'none' : `1px solid ${COLORS.accent}`,
        backgroundColor: primary ? (hover ? ACCENT_HOVER : COLORS.accent) : hover ? ACCENT_SOFT : COLORS.white,
        color: primary ? COLORS.white : COLORS.accent,
        boxShadow: primary ? '0 4px 12px rgba(102, 110, 254, 0.3)' : 'none',
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background-color 0.2s ease',
      }}
    >
      {children}
    </button>
  );
};

const SecurityLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      marginTop: 18,
      padding: 0,
      border: 'none',
      background: 'none',
      color: COLORS.accent,
      fontFamily: FONT,
      fontSize: 14,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      cursor: 'pointer',
    }}
  >
    Профиль безопасности
  </button>
);

interface ActionsProps {
  canViewSecurity: boolean;
  /** Профиль не получен: главная кнопка — «Повторить» вместо «На главную» */
  retry: { pending: boolean } | null;
}

/** «Повторить» — запрос профиля, как кнопка плашки «Профиль функций не получен» */
const RetryButton: React.FC<{ pending: boolean }> = ({ pending }) => (
  <ActionButton primary disabled={pending} onClick={() => void loadFeatures()}>
    {pending ? 'Запрашиваем…' : 'Повторить'}
  </ActionButton>
);

/** Действия во вкладке приложения */
const TabActions: React.FC<ActionsProps> = ({ canViewSecurity, retry }) => {
  const { activeTabId, closeTab, openTab } = useTabs();
  return (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {retry ? (
          <RetryButton pending={retry.pending} />
        ) : (
          <ActionButton primary onClick={() => openTab('/main', 'Главная', null)}>
            На главную
          </ActionButton>
        )}
        <ActionButton onClick={() => activeTabId && closeTab(activeTabId)}>Закрыть вкладку</ActionButton>
      </div>
      {canViewSecurity && <SecurityLink onClick={() => openTab('/security', 'Безопасность', null)} />}
    </>
  );
};

/** Действия в отдельной вкладке браузера (/screen/*): вкладок приложения там нет */
const ScreenActions: React.FC<ActionsProps> = ({ canViewSecurity, retry }) => {
  const navigate = useNavigate();
  return (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {retry ? (
          <RetryButton pending={retry.pending} />
        ) : (
          <ActionButton primary onClick={() => navigate('/main')}>
            На главную
          </ActionButton>
        )}
        {/* Экран открывается из приложения через window.open — такую вкладку браузер разрешает закрыть */}
        <ActionButton onClick={() => window.close()}>Закрыть вкладку</ActionButton>
      </div>
      {canViewSecurity && <SecurityLink onClick={() => navigate('/security')} />}
    </>
  );
};

const FeatureUnavailablePage: React.FC<FeatureUnavailablePageProps> = ({ feature, variant = 'tab' }) => {
  const { status, pending, profile } = useFeatureSnapshot();
  const canViewSecurity = profile?.canViewSecurity === true;
  // Профиль не получен, а модуль раздела в сборке есть: раздел не выключен, а пока неизвестен
  const notReceived = status === 'error' && feature !== undefined && !isFeatureKnownOff(feature);
  const retry = notReceived ? { pending } : null;
  const screen = variant === 'screen';
  return (
    <div
      role="status"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: screen ? undefined : '100%',
        minHeight: screen ? '100vh' : 360,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: FONT,
        backgroundColor: screen ? '#FAFBFC' : undefined,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          padding: '36px 40px 32px',
          borderRadius: 20,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: ACCENT_SOFT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M5.6 5.6l12.8 12.8" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, lineHeight: '28px', color: COLORS.text }}>
          {notReceived ? 'Раздел пока недоступен' : 'Раздел недоступен на этой установке'}
        </div>
        <div style={{ marginTop: 10, marginBottom: 26, fontSize: 15, lineHeight: '22px', color: COLORS.textMuted }}>
          {notReceived
            ? 'Профиль функций не получен. Раздел откроется, когда связь с сервером восстановится.'
            : 'Состав функций определяет администратор сервера.'}
        </div>
        {screen ? (
          <ScreenActions canViewSecurity={canViewSecurity} retry={retry} />
        ) : (
          <TabActions canViewSecurity={canViewSecurity} retry={retry} />
        )}
      </div>
    </div>
  );
};

/** Та же страница во весь экран — для маршрутов /screen/* (вне вкладок приложения) */
export const FeatureUnavailableScreen: React.FC = () => <FeatureUnavailablePage variant="screen" />;

/** Страница во вкладке — заглушка ленивого раздела, которого нет в сборке */
export const FeatureUnavailableTab: React.FC = () => <FeatureUnavailablePage variant="tab" />;

export default FeatureUnavailablePage;
