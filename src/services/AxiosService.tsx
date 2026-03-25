import axios from 'axios';
import ConstantInfo from '../info/ConstantInfo';
import { navigateTo } from './navigate';

declare global {
  interface Window {
    config: { ip_api: string };
  }
}

// Настройка axios
const AxiosService = axios.create({
  baseURL: window.config.ip_api + ':' + ConstantInfo.serverPort,
  withCredentials: true,
});

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

AxiosService.interceptors.request.use(async (config) => {
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

AxiosService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Пробуем обновить токен
        await axios.get(window.config.ip_api + ':' + ConstantInfo.serverPort + ConstantInfo.restApiRefreshToken, { withCredentials: true });

        // Повторяем исходный запрос
        return AxiosService(originalRequest);
      } catch (refreshError) {
        console.warn('Не удалось обновить токен');
        navigateTo('/login'); //
      }
    }
    console.log('ошибка interceptors');
    console.log(error);
    return Promise.reject(error);
  }
);

export default AxiosService;
