// model3dCount.ts — число 3D-моделей номенклатуры для счётчика на кнопке «3D» в блоке «Изображение».
// Лежит вне каталога Model3D/ (раздел 8.2 проекта «Дискретное отключение функций»): карточка номенклатуры — ядро
// и не должна тянуть модуль 3D в сборку без него. Без функции model3d (сервер её выключил, профиль функций не
// получен, модуля нет в сборке) запроса нет и счётчик 0: адрес списка моделей у выключенной функции отвечает 404.
import { useCallback, useEffect, useState } from 'react';
import AxiosService from '../../../services/AxiosService';
import { isFeatureOn, useFeature } from '../../../services/features/featureStore';

/** HTTP-клиент для списка моделей: подходит AxiosService; тесты подставляют свой */
export interface ModelCountHttp {
  get(url: string, config?: { signal?: AbortSignal }): Promise<{ data: unknown }>;
}

/** Адрес списка 3D-моделей номенклатуры; в сборке без модуля 3D строки адреса нет */
const modelListUrl = (materialUid: string): string | null =>
  __AWMS_HAS_MODEL3D__ ? `/api/nomenclature/${encodeURIComponent(materialUid)}/models` : null;

/**
 * Запросить число моделей записанной номенклатуры. null — запроса нет: номенклатура не записана, функция model3d
 * выключена или её нет в сборке. Иначе — отмена запроса (ответ после отмены не применяется)
 */
export const requestModelCount = (
  materialUid: string | null,
  onCount: (count: number) => void,
  http: ModelCountHttp = AxiosService,
): (() => void) | null => {
  const url = materialUid && isFeatureOn('model3d') ? modelListUrl(materialUid) : null;
  if (url === null) return null;
  const controller = new AbortController();
  http
    .get(url, { signal: controller.signal })
    .then(response => {
      if (!controller.signal.aborted) onCount(Array.isArray(response.data) ? response.data.length : 0);
    })
    // Не получили — на кнопке прежнее число; окно 3D при открытии само покажет ошибку
    .catch(() => undefined);
  return () => controller.abort();
};

/** [число моделей, установить после загрузки или удаления в окне 3D]. Без записанной номенклатуры и без model3d — 0 */
export const useModelCount = (materialUid: string | null): [number, (count: number) => void] => {
  // Функцию могут выключить и включить на ходу (новая ревизия профиля) — тогда счётчик запрашивается заново
  const uid = useFeature('model3d') ? materialUid : null;
  const [state, setState] = useState<{ uid: string | null; count: number }>({ uid: null, count: 0 });

  useEffect(() => requestModelCount(uid, count => setState({ uid, count })) ?? undefined, [uid]);

  const setCount = useCallback((count: number) => setState({ uid, count }), [uid]);
  return [uid && state.uid === uid ? state.count : 0, setCount];
};
