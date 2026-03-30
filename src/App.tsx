// App.tsx
import { useEffect, useState } from 'react';
import FullScreenPreloader from './components/commonComponents/FullScreenPreloader';
import { Routes, Route, useNavigate,  Navigate } from 'react-router-dom';
import PrivateRoute from './services/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './components/loginPage/LoginPage';
import MainPage from './components/mainPage/MainPage';
import StationsPage from './components/StationsPage/StationsPage';
import ReferencesPage from './components/ReferencesPage/ReferencesPage';
import DocumentsPage from './components/DocumentsPage/DocumentsPage';
import ReportsPage from './components/ReportsPage/ReportsPage';
import AnalyticsPage from './components/AnalyticsPage/AnalyticsPage';
import SettingsPage from './components/SettingsPage/SettingsPage';
import AccountPage from './components/AccountPage/AccountPage';
import AxiosService from './services/AxiosService';
import ConstantInfo from './info/ConstantInfo';
import { setNavigator } from './services/navigate';
import { TabProvider } from './context/TabContext';
import { AuthProvider, useAuth } from './services/AuthContext';
import LockScreen from './components/LockScreen/LockScreen';
import InactivityWarning from './components/InactivityWarning/InactivityWarning';
import { useInactivityLock } from './components/hooks/useInactivityLock';

const AppContent = () => {
  const [needPreloader, setNeedPreloader] = useState(true);
  const navigate = useNavigate();
  const { isAuth, isLocked, setLocked } = useAuth();
  const { showWarning, setShowWarning } = useInactivityLock();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    // Получаем CSRF токен при старте
    AxiosService.get('/csrf')
      .then((res) => {
        const csrfToken = res.data.token;
        AxiosService.defaults.headers['X-XSRF-TOKEN'] = csrfToken;
        console.log('CSRF токен получен');
      })
      .catch((e) => {
        console.error('Ошибка получения CSRF', e);
      })
      .finally(() => {
        setNeedPreloader(false);
      });
  }, []);

  const handleUnlock = () => {
    setLocked(false);
  };

  if (needPreloader) {
    return <FullScreenPreloader />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <TabProvider>
              <MainLayout />
            </TabProvider>
          </PrivateRoute>
        }>
          <Route index element={<MainPage />} />
          <Route path="main" element={<MainPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="references" element={<ReferencesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/main" replace />} />
      </Routes>
      
      <InactivityWarning show={showWarning} onClose={() => setShowWarning(false)} />
      {isAuth && isLocked && <LockScreen onUnlock={handleUnlock} />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;