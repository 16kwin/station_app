import { useEffect, useState } from 'react';
import FullScreenPreloader from './components/commonComponents/FullScreenPreloader';
import { Routes, Route, useNavigate } from 'react-router-dom';
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

const App = () => {
  const [needPreloader, setNeedPreloader] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    setNeedPreloader(false);

    AxiosService.get(window.config.ip_api + ':' + ConstantInfo.serverPort + '/csrf')
      .then((res) => {
        const csrfToken = res.data.token;
        AxiosService.defaults.headers['X-XSRF-TOKEN'] = csrfToken;
      })
      .catch((e) => {
        console.error('Ошибка получения CSRF', e);
      });
  }, []);

  if (needPreloader) {
    return <FullScreenPreloader />;
  }

  return (
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
    </Routes>
  );
};

export default App;