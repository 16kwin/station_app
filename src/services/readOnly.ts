// readOnly.ts — режим «только просмотр» на телефонах, ТСД и планшетах (решение команды). Три рубежа:
// сервер отклоняет запись (MobileReadOnlyFilter, 403 с X-AWMS-Read-Only), AxiosService не отправляет её и
// показывает подсказку, ReadOnlyGuard прячет кнопки записи и запирает поля карточек. Выключается строкой потолка
// awms.mobile.read-only=false (приходит в профиле функций, ui.mobileReadOnly). На компьютере ничего не меняется.
import { useSyncExternalStore } from 'react';
import { isMobileDevice } from './device';
import { getFeatureSnapshot, subscribeFeatures } from './features/featureStore';

/** Заголовок отказа сервера (MobileReadOnlyFilter.READ_ONLY_HEADER) */
export const READ_ONLY_HEADER = 'x-awms-read-only';

/** Событие окна: запись не отправлена — показать подсказку (ReadOnlyGuard) */
export const READ_ONLY_EVENT = 'awms:read-only-blocked';

/** Только просмотр: мобильное устройство и установка не разрешила запись с телефонов */
export const isReadOnlyMode = (): boolean => {
  if (!isMobileDevice()) return false;
  return getFeatureSnapshot().profile?.ui.mobileReadOnly !== false;
};

export const useReadOnly = (): boolean => useSyncExternalStore(subscribeFeatures, isReadOnlyMode, () => false);

const READ_METHODS = new Set(['get', 'head', 'options']);

/**
 * Что меняющими методами можно и в режиме просмотра — как на сервере (PublicEndpoints.viewOnlyWritable):
 * вход и выход, выгрузки и печать, чтение методом POST, личные настройки вида, сохранённые фильтры
 */
const VIEW_ONLY_WRITABLE: readonly RegExp[] = [
  /^\/api\/auth\//,
  /^\/logout$/,
  /^\/api\/.+\/(columns-settings|filters-settings|sort-settings|settings)$/,
  /^\/api\/user\/filters$/,
  /^\/api\/.+\/(print|export-pdf|export-excel|export-word)$/,
  /^\/api\/stations\/(static|dynamic)\/filtered$/,
  /^\/api\/nomenclature\/calculate-compatibility$/,
  // Событие «отчёт безопасности просмотрен/напечатан» — запись аудита, не изменение данных
  /^\/api\/security-profile\/events$/,
  /^\/ws-stations\//,
];

/** Путь запроса без адреса сервера и параметров: http://host/api/x?y=1 → /api/x */
export const requestPath = (url: string): string => {
  const withoutOrigin = url.replace(/^[a-z]+:\/\/[^/]+/i, '');
  const path = withoutOrigin.replace(/[?#].*$/, '');
  return path.startsWith('/') ? path : '/' + path;
};

/** Запрос разрешён в режиме просмотра */
export const allowedInReadOnly = (method: string | undefined, url: string | undefined): boolean => {
  if (READ_METHODS.has((method ?? 'get').toLowerCase())) return true;
  const path = requestPath(url ?? '');
  return VIEW_ONLY_WRITABLE.some(rule => rule.test(path));
};

let lastNotice = 0;

/** Показать подсказку «только просмотр» (не чаще раза в 2 секунды: одна кнопка шлёт несколько запросов) */
export const notifyReadOnlyBlocked = (): void => {
  const now = Date.now();
  if (now - lastNotice < 2000) return;
  lastNotice = now;
  window.dispatchEvent(new Event(READ_ONLY_EVENT));
};

/** Ошибка запроса, не отправленного в режиме просмотра: у неё нет response, перехватчик токена её пропускает */
export class ReadOnlyBlockedError extends Error {
  readonly readOnlyBlocked = true;

  constructor() {
    super('С телефона и планшета доступен только просмотр');
    this.name = 'ReadOnlyBlockedError';
  }
}
