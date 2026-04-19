import React, { useContext, useEffect, useState, type ReactNode } from 'react';
import ConstantInfo from '../info/ConstantInfo';
import AxiosService from './AxiosService';

interface ModalProps {
  children?: ReactNode;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  roleDescription: string;
  firstName: string;
  middleName: string;
  lastName: string;
  imgAvatar: any;
}

interface ValueType {
  isAuth: boolean;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  userInfo: UserInfo;
  isAdmin: boolean;
  isOperator: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  checkPassword: (password: string) => Promise<boolean>;
  setLocked: (locked: boolean) => void;
  isLocked: boolean;
}

const AuthContext = React.createContext<ValueType | null>(null);

const LOCKED_STORAGE_KEY = 'app_locked_state';

export const AuthProvider: React.FC<ModalProps> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLockedState] = useState(() => {
    // Загружаем состояние блокировки из localStorage при инициализации
    try {
      const saved = localStorage.getItem(LOCKED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [userInfo, setUserInfo] = useState<UserInfo>({
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

  // Обёртка для setLocked, которая сохраняет состояние в localStorage
  const setLocked = (locked: boolean) => {
    setIsLockedState(locked);
    try {
      localStorage.setItem(LOCKED_STORAGE_KEY, JSON.stringify(locked));
    } catch (e) {
      console.error('Failed to save locked state:', e);
    }
  };

  const checkAuth = async (): Promise<boolean> => {
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
      return true;
    } catch {
      setIsAuth(false);
      setIsAdmin(false);
      setIsOperator(false);
      setUserInfo({
        id: '',
        name: '',
        role: '',
        roleDescription: '',
        firstName: '',
        middleName: '',
        lastName: '',
        imgAvatar: undefined,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    setIsLoading(true);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await AxiosService.post(ConstantInfo.restApiLogout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuth(false);
      setIsAdmin(false);
      setIsOperator(false);
      setLocked(false); // Используем обёртку, которая сохраняет в localStorage
      setUserInfo({
        id: '',
        name: '',
        role: '',
        roleDescription: '',
        firstName: '',
        middleName: '',
        lastName: '',
        imgAvatar: undefined,
      });
      
      localStorage.removeItem('tabs_state');
      localStorage.removeItem('drafts_state');
    }
  };

  const checkPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await AxiosService.post(ConstantInfo.restApiCheckPassword, { password });
      return response.status === 200;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkAuth();

    const interval = setInterval(() => {
      refreshAuth();
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
        isOperator,
        refreshAuth,
        logout,
        checkPassword,
        setLocked,
        isLocked,
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