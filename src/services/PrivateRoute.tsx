import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import FullscreenPreloader from '../components/commonComponents/FullScreenPreloader';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children?: ReactNode; // Универсальный тип для children
}

// Защищенные маршруты
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuth, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullscreenPreloader />; // Пока идёт проверка авторизации, показываем прелоадер
  }

  if (!isAuth) {
    // Сохраняем текущий путь для редиректа
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;
