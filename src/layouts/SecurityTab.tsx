// SecurityTab.tsx — вкладка «Безопасность» (/security): профиль безопасности установки (раздел 9 проекта
// «Дискретное отключение функций»). Это раздел ядра, но не для всех: только тем, кому сервер открыл страницу
// (canViewSecurity в профиле функций); остальным, в том числе по прямой ссылке, — «Раздел недоступен».
// Саму страницу делает пакет F8 (components/SecurityPage/SecurityPage.tsx, экспорт по умолчанию). Она
// подключается через import.meta.glob: пока файла нет, сборка не падает, а вкладка показывает заглушку; когда
// файл есть, страница грузится отдельным куском при первом открытии вкладки.
import React, { lazy, Suspense, type ComponentType } from 'react';
import ModuleBoundary from '../services/features/ModuleBoundary';
import FeatureUnavailablePage from '../services/features/FeatureUnavailablePage';
import { useFeatureSnapshot } from '../services/features/featureStore';

const pages = import.meta.glob<{ default: ComponentType }>('../components/SecurityPage/SecurityPage.tsx');
const loadPage = pages['../components/SecurityPage/SecurityPage.tsx'];

/** Страницы ещё нет в этой сборке интерфейса */
const SecurityPagePending: React.FC = () => (
  <div style={{ position: 'relative', height: '100%' }}>
    <div style={{ paddingTop: '35px', paddingLeft: '60px' }}>
      <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '30px', fontWeight: 'bold', letterSpacing: '0', color: '#2D4059', margin: 0 }}>Безопасность</h1>
    </div>
    <div style={{ paddingLeft: '60px', paddingTop: '20px', fontFamily: 'Roboto, sans-serif', fontSize: '17px', color: '#6B7A90' }}>
      Профиль безопасности появится после обновления интерфейса.
    </div>
  </div>
);

const LazySecurityPage = loadPage ? lazy(loadPage) : null;

/** Страница профиля: свой кусок сборки, своя граница ошибок (сбой загрузки не роняет приложение) */
const SecurityPage: React.FC = () =>
  LazySecurityPage ? (
    <ModuleBoundary variant="page">
      <Suspense fallback={null}>
        <LazySecurityPage />
      </Suspense>
    </ModuleBoundary>
  ) : (
    <SecurityPagePending />
  );

const SecurityTab: React.FC = () => {
  // Подписка на профиль функций: право на страницу может смениться вместе с ревизией профиля
  const { profile } = useFeatureSnapshot();
  return profile?.canViewSecurity === true ? <SecurityPage /> : <FeatureUnavailablePage />;
};

export default SecurityTab;
