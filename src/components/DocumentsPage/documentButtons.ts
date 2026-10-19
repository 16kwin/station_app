// documentButtons.ts — разделы «Документов»: кнопки страницы «Документы» (DocumentsPage.tsx) и строки выплывающего
// окна «Документы» нижнего меню (FloatingMenu.tsx). Один список на оба места — чтобы не расходились. Раздел
// выключенной функции (видеоархив, ГПП) не показывается ни там, ни там: доступность — по пути вкладки (routes.ts).

export interface DocumentButton {
  /** Путь вкладки */
  path: string;
  /** Подпись вкладки */
  label: string;
  /** Текст кнопки */
  text: string;
}

export const DOCUMENT_BUTTONS: readonly DocumentButton[] = [
  { path: '/documents/stock-level-control', label: 'Документ: Контроль уровня остатков', text: 'Контроль уровня остатков' },
  { path: '/documents/refill', label: 'Документ: Пополнение', text: 'Пополнение' },
  { path: '/documents/move-orders', label: 'Документ: Заказ на перемещение', text: 'Заказ на перемещение' },
  { path: '/documents/video-archive', label: 'Журнал событий: видеоархив', text: 'Журнал событий: видеоархив' },
  { path: '/documents/gpp', label: 'Документ: ГПП', text: 'График подготовки производства' },
];
