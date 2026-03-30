// AxiosService.ts
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

let csrfInitialized = false;

AxiosService.interceptors.request.use(async (config) => {
  // Для GET запросов на /csrf не добавляем CSRF токен
  if (config.url?.includes('/csrf')) {
    return config;
  }
  
  // Если CSRF ещё не инициализирован, получаем токен
  if (!csrfInitialized) {
    try {
      const csrfResponse = await AxiosService.get('/csrf');
      const csrfToken = csrfResponse.data.token;
      // Устанавливаем в дефолтные заголовки
      AxiosService.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
      csrfInitialized = true;
      console.log('CSRF инициализирован в интерцепторе');
    } catch (error) {
      console.error('Ошибка получения CSRF в интерцепторе:', error);
    }
  }
  
  // Устанавливаем CSRF токен в заголовок для не-GET запросов
  if (config.method !== 'get') {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
      console.log('CSRF токен добавлен в заголовок:', csrfToken);
    } else {
      // Если токена в cookie нет, используем из defaults
      const defaultToken = AxiosService.defaults.headers.common['X-XSRF-TOKEN'];
      if (defaultToken) {
        config.headers['X-XSRF-TOKEN'] = defaultToken;
      }
    }
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
        navigateTo('/login');
      }
    }
    console.log('ошибка interceptors');
    console.log(error);
    return Promise.reject(error);
  }
);

export default AxiosService;