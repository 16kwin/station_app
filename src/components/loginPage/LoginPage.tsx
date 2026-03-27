import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuth, refreshAuth, setLocked } = useAuth();

  useEffect(() => {
    // Если уже авторизован, идем на главную
    if (isAuth) {
      setLocked(false); // Снимаем блокировку если была
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
        // navigate будет в useEffect
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
    <div className="flex h-screen bg-gray-100 justify-center items-center">
      <div className="w-80 bg-white p-6 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Вход в систему</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              name="username"
              placeholder="Имя пользователя"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <input
              name="password"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {message && (
            <p className="text-red-500 text-sm mb-4 text-center">{message}</p>
          )}
          
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;