import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuth, refreshAuth } = useAuth();

  useEffect(() => {
    refreshAuth();
    if (isAuth) {
      navigate('/main');
    }
  }, [isAuth, navigate]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        navigate('/main');
      } else {
        alert('Ошибка входа');
      }
    } catch (error) {
      const typeError = error as AxiosError;
      console.log(typeError);
      if (typeError.response?.status === 401) {
        alert('Неверные данные для входа');
      } else {
        setMessage(typeError.message);
      }
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
            />
          </div>
          
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
            type="submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;