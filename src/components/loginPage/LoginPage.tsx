import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';
import LOGO from '../../assets/LOGO.svg';
import LOGIN_IMAGE from '../../assets/Login.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshAuth, setLocked } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

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
        setLocked(false);
        navigate('/main');
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
    <div className="flex h-screen items-center justify-center">
      <div className="w-[1253px] h-[800px] bg-[#FFFFFF] rounded-2xl shadow-xl flex relative overflow-hidden font-roboto">
        {/* Логотип в левом верхнем углу */}
        <div className="absolute left-[15px] top-[15px] flex items-center gap-[9px]">
          <img src={LOGO} alt="ДИНАМИКА" className="w-[57px] h-[49px]" />
          <div>
            <h1 className="text-[23px] font-black tracking-[2px] text-gray-900">
              ДИНАМИКА
            </h1>
            <p className="text-[16px] font-medium tracking-[0px] text-gray-600">
              ПРОМЫШЛЕННЫЕ СИСТЕМЫ
            </p>
          </div>
        </div>

        {/* Левая часть - форма логина */}
        <div className="w-[615px] h-full flex flex-col justify-center px-[60px]">
          <h2 className="text-gray-900 font-roboto font-bold text-[40px] leading-[110%] tracking-[-0.04em] mb-2">
            Вход в аккаунт
          </h2>
          <p className="text-gray-500 text-[16px] mb-8">
            Войдите в учетную запись для продолжения работы
          </p>

          <form onSubmit={handleSubmit}>
            {/* Логин */}
            <div className="mb-5">
              <label className="block text-gray-700 text-[14px] font-medium mb-2">
                Логин
              </label>
              <input
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-[16px] placeholder-gray-400 focus:outline-none focus:border-[#666EFE] focus:ring-1 focus:ring-[#666EFE] transition-all"
                name="username"
                placeholder="admin"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Пароль */}
            <div className="mb-5">
              <label className="block text-gray-700 text-[14px] font-medium mb-2">
                Пароль
              </label>
              <input
                name="password"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-[16px] placeholder-gray-400 focus:outline-none focus:border-[#666EFE] focus:ring-1 focus:ring-[#666EFE] transition-all"
                placeholder=""
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
                  className="w-4 h-4 rounded border-gray-300 text-[#666EFE] focus:ring-[#666EFE]"
                />
                <span className="ml-2 text-gray-700 text-[14px]">
                  Запомнить учетную запись
                </span>
              </label>
            </div>

            {/* Сообщение об ошибке */}
            {message && (
              <p className="text-red-500 text-sm mb-4">{message}</p>
            )}

            {/* Кнопка */}
            <button
              className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-3 rounded-lg font-medium text-[16px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>

        {/* Правая часть - картинка */}
        <div className="absolute right-[15px] top-[15px] w-[608px] h-[770px] rounded-2xl overflow-hidden">
          <img src={LOGIN_IMAGE} alt="Login" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;