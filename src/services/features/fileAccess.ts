// fileAccess.ts — загрузка файлов на сервер и выгрузки в интерфейсе (функции uploads и export, разделы 4.2 и 8.2
// проекта «Дискретное отключение функций»). Закрывает их сервер (ворота, сторож); интерфейс только прячет точки входа:
//  • uploads выключена — режим «только просмотр»: загруженные раньше файлы и изображения открываются и скачиваются,
//    а добавить, заменить, переименовать или удалить файл нельзя. Формы, где файл необязателен (поставки,
//    ассортимент поставщика), без файла уходят JSON и работают при любом составе функций;
//  • export выключена — нет меню выгрузки PDF/Excel/Word и кнопок печати (серверный рендер). Уровень L1: таблица
//    на экране и печать браузера остаются.
import { isFeatureOn, useFeature } from './featureStore';

/** Хук: пользователю можно загружать файлы на сервер. false — режим «только просмотр» */
export const useCanUpload = (): boolean => useFeature('uploads');

/**
 * То же вне React — в момент действия (сохранение карточки, копирование станции): функцию могли выключить,
 * пока карточка открыта
 */
export const canUploadNow = (): boolean => isFeatureOn('uploads');

/** Хук: доступны выгрузка PDF/Excel/Word и серверная печать (функция export; роли — awms.features.export.roles) */
export const useCanExport = (): boolean => useFeature('export');

/** Поля формы; пустые значения не отправляются */
export type FormFields = Readonly<Record<string, string | null | undefined>>;

/**
 * Тело запроса формы, где файл необязателен (поставки номенклатуры и поставщика, ассортимент).
 * Без файла — объект: Axios отправит JSON, а сервер примет его и при выключенных uploads (JSON-варианты /supply,
 * /deliveries, пакет B4; после B4b multipart там закрыт целиком). С файлом — FormData, файл в поле file.
 * Пустые поля пропускаются в обоих случаях — как раньше в FormData
 */
export const optionalFileBody = (fields: FormFields, file?: File | null): FormData | Record<string, string> => {
  const present = Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '');
  if (!file) return Object.fromEntries(present);
  const form = new FormData();
  present.forEach(([key, value]) => form.append(key, value));
  form.append('file', file);
  return form;
};

/**
 * Скачать загруженный файл (/uploads/…) как Blob. С cookie сессии: при закрытом анонимном доступе (anonymous)
 * /uploads отдаёт файлы только вошедшему, а страница и API бывают на разных адресах (public/config.js).
 * Ответ с ошибкой — исключение: иначе вместо файла сохранилась бы страница ошибки
 */
export const fetchUploadedFile = async (url: string): Promise<Blob> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`Файл не получен: HTTP ${response.status}`);
  return response.blob();
};
