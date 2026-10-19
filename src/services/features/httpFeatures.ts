// httpFeatures.ts — реакция HTTP-клиента приложения (AxiosService) на состав функций установки (раздел 8.2
// проекта «Дискретное отключение функций»). Перехватчики ставит AxiosService при создании клиента:
//  • заголовок X-AWMS-Features в ответе (удачном или с ошибкой) отличается от ревизии профиля — сервер
//    перезапущен с другим потолком или администратор переключил функцию: профиль перезапрашивается
//    (featureStore.noteFeaturesRevision). Меню и вкладки перестраиваются сами по новому составу (TabContext);
//  • 404 на адрес API функции — функцию могли выключить на ходу: профиль перезапрашивается
//    (routes.noteApiNotFound, не чаще раза в 15 с; 404 на адрес ядра — обычный ответ, профиль не нужен);
//  • FormData с файлом (File или Blob) при выключенной функции uploads не уходит на сервер: запрос отклоняется
//    на месте с понятным текстом. FormData без файлов (штрихкоды, QR, SKU, поставки без документа) уходит как
//    раньше. Сервер закрывает загрузку и сам (404 воротами) — здесь только понятная ошибка вместо «не найдено».
//    Отклоняется, только если функция точно выключена (профиль получен или модуля нет в сборке): пока профиль
//    неизвестен (сбой связи), решает сервер — разовый сбой не должен ломать загрузку там, где она разрешена.
// Модуль не обращается к AxiosService (его подключают туда), поэтому проверяется тестами на своём клиенте Axios.
import { AxiosError, AxiosHeaders, isAxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isFeatureKnownOff, noteFeaturesRevision } from './featureStore';
import { noteApiNotFound } from './routes';

/** Заголовок ревизии профиля в ответах /api/** (ставят ворота сервера, FeatureGateFilter) */
export const FEATURES_REVISION_HEADER = 'X-AWMS-Features';

/** Код ошибки Axios для запроса с файлом при выключенной загрузке файлов */
export const UPLOADS_DISABLED_CODE = 'ERR_AWMS_UPLOADS_DISABLED';

export const UPLOADS_DISABLED_MESSAGE =
  'Загрузка файлов на сервер отключена на этой установке. Состав функций определяет администратор сервера.';

/** В FormData есть файл: File или Blob (File — тоже Blob) */
export const formDataHasFile = (data: FormData): boolean => {
  for (const value of data.values()) {
    if (value instanceof Blob) return true;
  }
  return false;
};

const isFormData = (data: unknown): data is FormData => typeof FormData !== 'undefined' && data instanceof FormData;

/** Запрос несёт файл, а загрузка файлов на установке выключена */
export const isBlockedUpload = (data: unknown): boolean =>
  isFormData(data) && formDataHasFile(data) && isFeatureKnownOff('uploads');

/** Ошибка запроса с файлом при выключенных uploads: без response — это не ответ сервера */
export const uploadsDisabledError = (config?: InternalAxiosRequestConfig): AxiosError =>
  new AxiosError(UPLOADS_DISABLED_MESSAGE, UPLOADS_DISABLED_CODE, config);

/** Перехватчик запроса: файл при выключенных uploads не отправляется */
export const guardUploadRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (isBlockedUpload(config.data)) {
    console.warn(UPLOADS_DISABLED_MESSAGE, config.url);
    throw uploadsDisabledError(config);
  }
  return config;
};

/** Ревизия из заголовков ответа; null — заголовка нет (старый сервер, кросс-доменный ответ без exposedHeaders) */
export const revisionFromHeaders = (headers: unknown): string | null => {
  if (headers === null || headers === undefined) return null;
  try {
    const value = AxiosHeaders.from(headers as AxiosHeaders).get(FEATURES_REVISION_HEADER);
    return typeof value === 'string' && value !== '' ? value : null;
  } catch {
    return null;
  }
};

/** Ответ API (удачный или с ошибкой): сверить ревизию профиля */
export const noteFeatureResponse = (response: Pick<AxiosResponse, 'headers'> | null | undefined) => {
  const revision = revisionFromHeaders(response?.headers);
  if (revision !== null) noteFeaturesRevision(revision);
};

/** Ошибка запроса: ревизия из ответа и 404 на адрес API функции */
export const noteFeatureError = (error: unknown) => {
  if (!isAxiosError(error) || !error.response) return;
  noteFeatureResponse(error.response);
  const url = error.config?.url;
  if (error.response.status === 404 && url) noteApiNotFound(url);
};

/**
 * Поставить перехватчики на клиент. Вызывать после остальных перехватчиков клиента: перехватчик запроса тогда
 * идёт первым (файл отклоняется до запроса CSRF), перехватчик ответа — после обновления токена (видит ответ
 * повторного запроса). Сбой здесь не должен ломать запрос — перехватчики ответа ничего не бросают
 */
export const installFeatureInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(guardUploadRequest);
  client.interceptors.response.use(
    response => {
      try {
        noteFeatureResponse(response);
      } catch (error) {
        console.warn('Не удалось сверить ревизию профиля функций', error);
      }
      return response;
    },
    error => {
      try {
        noteFeatureError(error);
      } catch (inner) {
        console.warn('Не удалось сверить ревизию профиля функций', inner);
      }
      return Promise.reject(error);
    },
  );
};
