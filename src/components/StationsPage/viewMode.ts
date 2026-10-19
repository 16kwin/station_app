// viewMode.ts — режимы панели станций: плитка, список и карта. Карта — функция установки map (раздел 4.2
// проекта «Дискретное отключение функций»): выключена — кнопки «Карта» нет, а сохранённый режим «map»
// (localStorage stationsPageState, фильтры пользователя на сервере) открывается плиткой.
// Отдельный файл без зависимостей — чтобы правило выбора режима проверялось тестом без страницы.

export type ViewMode = 'grid' | 'list' | 'map';

/** Кнопки режима на панели: 9 — плитка, 10 — список, 12 — карта */
export const VIEW_MODE_BUTTONS: Readonly<Record<ViewMode, number>> = { grid: 9, list: 10, map: 12 };

const ALL_VIEW_BUTTONS: readonly number[] = [VIEW_MODE_BUTTONS.grid, VIEW_MODE_BUTTONS.list, VIEW_MODE_BUTTONS.map];
const BASIC_VIEW_BUTTONS: readonly number[] = [VIEW_MODE_BUTTONS.grid, VIEW_MODE_BUTTONS.list];

/** Кнопки режима, которые видны на панели: без карты — только плитка и список */
export const viewButtonIndexes = (mapOn: boolean): readonly number[] => (mapOn ? ALL_VIEW_BUTTONS : BASIC_VIEW_BUTTONS);

/** Кнопка режима (в том числе «Карта», когда её не видно: сохранённое состояние кнопок может её содержать) */
export const isViewButton = (index: number): boolean => ALL_VIEW_BUTTONS.includes(index);

/** Сохранённое или присланное значение режима; «map» без функции карты и всё незнакомое — плитка */
export const toViewMode = (value: unknown, mapOn: boolean): ViewMode =>
  value === 'list' ? 'list' : value === 'map' && mapOn ? 'map' : 'grid';

/** Режим кнопки панели */
export const viewModeOfButton = (index: number, mapOn: boolean): ViewMode =>
  index === VIEW_MODE_BUTTONS.list ? 'list' : index === VIEW_MODE_BUTTONS.map && mapOn ? 'map' : 'grid';
