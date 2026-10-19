import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Шрифт Inter — локально из @fontsource (латиница и кириллица), без обращения в интернет
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './services/AuthContext.tsx';
import PwaLayer from './components/Pwa/PwaLayer';
import { bootstrapPwa } from './components/Pwa/bootstrapPwa';

// PWA по флагу установки (GET /api/features/public, до входа): манифест, событие установки и service worker —
// только при pwa; выключено — SW и кэши awms-* снимаются; флаги не получены — ничего не меняется.
// Запрос идёт сразу, параллельно загрузке приложения; service worker регистрируется после загрузки страницы
void bootstrapPwa();

// Полная блокировка масштабирования
window.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    e.stopPropagation();
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
    e.preventDefault();
    e.stopPropagation();
  }
});

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('gestureend', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
    {/* Сборка без PWA (вариант поставки) не содержит слоя: условие по флагу сборки вырезает импорт */}
    {__AWMS_HAS_PWA__ && <PwaLayer />}
  </StrictMode>
);