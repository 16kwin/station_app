import React, { useContext, useEffect, useState, type ReactNode } from 'react';

import ConstantInfo from '../info/ConstantInfo';
import AxiosService from './AxiosService';

interface ModalProps {
  children?: ReactNode; // Универсальный тип для children
}

interface ValueType {
  isAuth: boolean;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  userInfo: {
    id: string;
    name: string;
    role: string;
    roleDescription: string;
    firstName: string;
    middleName: string;
    lastName: string;
    imgAvatar: any;
  };
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  isOperator: boolean;
  setIsOperator: React.Dispatch<React.SetStateAction<boolean>>;
  refreshAuth: () => Promise<void>;
}

// Контекст, проверяющий аутентификацию и авторизацию
const AuthContext = React.createContext<ValueType | null>(null);

export const AuthProvider: React.FC<ModalProps> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    id: '',
    name: '',
    role: '',
    roleDescription: '',
    firstName: '',
    middleName: '',
    lastName: '',
    imgAvatar: undefined,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperator, setIsOperator] = useState(false);

  // Функция для проверки авторизации
  const checkAuth = async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiCheckAuth);
      setIsAuth(true);
      setUserInfo({
        id: response.data.id,
        name: response.data.username,
        role: response.data.role,
        roleDescription: response.data.roleDescription,
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        lastName: response.data.lastName,
        imgAvatar: response.data?.imgAvatar || undefined,
      });
      setIsAdmin(response.data.role === 'ROLE_ADMIN');
      setIsOperator(response.data.role === 'ROLE_OPERATOR');
    } catch {
      setIsAuth(false);
      setIsAdmin(false);
      setIsOperator(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновляем авторизацию вручную
  const refreshAuth = async () => {
    setIsLoading(true); // Отображаем лоадер при обновлении
    await checkAuth(); // Перезапускаем проверку авторизации
  };

  useEffect(() => {
    checkAuth(); // Проверяем авторизацию при первом рендере

    const interval = setInterval(() => {
      refreshAuth(); // обновляем каждые 180 минут в автомате
    }, 180 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        setIsAuth,
        isLoading,
        userInfo,
        isAdmin,
        setIsAdmin,
        isOperator,
        setIsOperator,
        refreshAuth,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): ValueType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
