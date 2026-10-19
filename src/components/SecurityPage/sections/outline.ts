// outline.ts — разделы отчёта «Профиль безопасности» в порядке печати (9.2 проекта, плюс оговорки 9.4
// и прочие сведения): номер, якорь для оглавления страницы и заголовок.
export interface OutlineItem {
  n: number;
  anchor: string;
  title: string;
}

export const OUTLINE: readonly OutlineItem[] = [
  { n: 1, anchor: 'sp-s-header', title: 'Шапка' },
  { n: 2, anchor: 'sp-s-features', title: 'Функции' },
  { n: 3, anchor: 'sp-s-absent', title: 'Отсутствует в продукте' },
  { n: 4, anchor: 'sp-s-inbound', title: 'Входящие' },
  { n: 5, anchor: 'sp-s-outbound', title: 'Исходящие' },
  { n: 6, anchor: 'sp-s-background', title: 'Фон' },
  { n: 7, anchor: 'sp-s-stored', title: 'Хранимые данные' },
  { n: 8, anchor: 'sp-s-components', title: 'Компоненты' },
  { n: 9, anchor: 'sp-s-journal', title: 'Журнал профиля' },
  { n: 10, anchor: 'sp-s-probes', title: 'Проверка из браузера' },
  { n: 11, anchor: 'sp-s-selfcheck', title: 'Как проверить самостоятельно' },
  { n: 12, anchor: 'sp-s-roles', title: 'Роли' },
  { n: 13, anchor: 'sp-s-usage', title: 'Использование' },
  { n: 14, anchor: 'sp-s-caveats', title: 'Оговорки' },
  { n: 15, anchor: 'sp-s-other', title: 'Прочие сведения' },
];

/** Якорь раздела по номеру */
export const anchorOf = (n: number): string => OUTLINE.find(item => item.n === n)?.anchor ?? `sp-s-${n}`;
