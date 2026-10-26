// writeControls.ts — как ReadOnlyGuard узнаёт кнопки записи: по подписи (aria-label, title или текст кнопки).

/**
 * Подпись кнопки записи: глагол в начале, без продолжения слова («Создать», «Создать каталог», но не «Созданные»).
 * «Изменить», «Загрузить», «Копировать» не берём: «Изменить период», «Загрузить ещё», «Копировать ссылку» — просмотр
 */
export const WRITE_LABEL = /^(записать|сохранить|создать|удалить|добавить|провести|пополнить|редактировать|отправить|переместить|дублировать|заменить|восстановить)(?![а-яё])/i;

export const HIDDEN_ATTR = 'data-awms-ro-hidden';
export const LOCKED_ATTR = 'data-awms-ro-locked';
export const CANDIDATES = 'button, [role="button"], [role="menuitem"], a, div[style*="cursor: pointer"], span[style*="cursor: pointer"]';
/** Длиннее — это уже не кнопка, а блок с текстом */
const MAX_LABEL = 40;

const labelOf = (element: Element): string =>
  (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').replace(/\s+/g, ' ').trim();

/** Кнопка записи: подпись с глаголом записи, внутри нет других кнопок, не меню приложения */
export const isWriteControl = (element: Element): boolean => {
  if (element.closest('nav[aria-label="Меню"], [data-awms-allow-write]')) return false;
  const label = labelOf(element);
  if (!label || label.length > MAX_LABEL || !WRITE_LABEL.test(label)) return false;
  return element.querySelector('button, [role="button"]') === null;
};
