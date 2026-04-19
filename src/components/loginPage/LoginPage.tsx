import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';
import LOGO from '../../assets/LOGO.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuth, refreshAuth, setLocked } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuth) {
      setLocked(false);
      navigate('/main');
    }
  }, [isAuth, navigate, setLocked]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newCsrf = await AxiosService.get('/csrf');
      const csrfToken = newCsrf.data.token;
      AxiosService.defaults.headers['X-XSRF-TOKEN'] = csrfToken;

      const response = await AxiosService.post(ConstantInfo.restApiLogin, {
        username,
        password,
      });

      if (response.status === 200) {
        await refreshAuth();
      } else {
        setMessage('Ошибка входа');
      }
    } catch (error) {
      const typeError = error as AxiosError;
      console.log(typeError);
      if (typeError.response?.status === 401) {
        setMessage('Неверные данные для входа');
      } else {
        setMessage(typeError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Заголовок с логотипом */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={LOGO} alt="ДИНАМИКА" className="w-10 h-10" />
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white tracking-wider">ДИНАМИКА</h1>
              <p className="text-xs text-white/80 tracking-wider">ПРОМЫШЛЕННЫЕ СИСТЕМЫ</p>
            </div>
          </div>
        </div>

        {/* Светло-серое окно */}
        <div className="bg-[#F0F0F0] rounded-2xl p-8 shadow-xl">
          <h2 className="text-gray-800 text-2xl font-semibold text-center mb-1">
            Вход в аккаунт
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Войдите в учетную запись для продолжения работы
          </p>

          <form onSubmit={handleSubmit}>
            {/* Логин */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1 ml-1">
                Логин
              </label>
              <input
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#666EFE] transition-colors"
                name="username"
                placeholder="Введите логин"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Пароль */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1 ml-1">
                Пароль
              </label>
              <input
                name="password"
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#666EFE] transition-colors"
                placeholder="Введите пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Запомнить */}
            <div className="flex items-center mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-400 text-[#666EFE] focus:ring-[#666EFE]"
                />
                <span className="ml-2 text-gray-600 text-sm">
                  Запомнить учетную запись
                </span>
              </label>
            </div>

            {/* Сообщение об ошибке */}
            {message && (
              <p className="text-red-500 text-sm mb-4 text-center">{message}</p>
            )}

            {/* Кнопка */}
            <button
              className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;