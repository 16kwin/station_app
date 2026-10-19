// printing.ts — печать отчёта «Профиль безопасности» средствами браузера (window.print), без сервера и без
// функции export (раздел 9.1, п. 2 проекта). Печатная копия отчёта монтируется порталом прямо в body только
// на время печати; класс sp-printing на body прячет при печати всё остальное приложение (print.css).
//
// Работает и кнопка «Печать», и Ctrl+P / печать из меню браузера: в beforeprint копия монтируется синхронно
// (flushSync), если страница «Безопасность» сейчас на экране. Если на экране другая вкладка приложения,
// печать идёт как обычно — отчёт в неё не попадает.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

export const PRINT_BODY_CLASS = 'sp-printing';

/** Элемент виден: вкладка приложения не скрыта (у скрытой вкладки display: none — прямоугольников нет) */
const isShown = (element: HTMLElement | null): boolean => !!element && element.getClientRects().length > 0;

export interface PrintControl {
  /** Идёт печать: печатная копия смонтирована */
  printing: boolean;
  /** Время начала печати (ISO) — для подвала листа */
  printedAt: string | null;
  /** Кнопка «Печать» */
  print: () => void;
}

/**
 * @param rootRef корень страницы «Безопасность»: по нему понятно, что печатают именно её
 * @param enabled отчёт получен (без отчёта печатать нечего)
 * @param onPrint печать началась — событие REPORT_PRINTED в журнал профиля
 */
export const usePrintReport = (rootRef: RefObject<HTMLElement | null>, enabled: boolean, onPrint: () => void): PrintControl => {
  const [printedAt, setPrintedAt] = useState<string | null>(null);
  const activeRef = useRef(false);
  const onPrintRef = useRef(onPrint);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onPrintRef.current = onPrint;
    enabledRef.current = enabled;
  }, [onPrint, enabled]);

  const begin = useCallback((): boolean => {
    if (activeRef.current) return true;
    if (!enabledRef.current || !isShown(rootRef.current)) return false;
    activeRef.current = true;
    // Синхронно: браузер раскладывает страницы для печати сразу после обработчика beforeprint
    flushSync(() => setPrintedAt(new Date().toISOString()));
    document.body.classList.add(PRINT_BODY_CLASS);
    onPrintRef.current();
    return true;
  }, [rootRef]);

  const end = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    document.body.classList.remove(PRINT_BODY_CLASS);
    setPrintedAt(null);
  }, []);

  useEffect(() => {
    const before = () => {
      begin();
    };
    const after = () => end();
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      // Уход со страницы посреди печати: не оставляем body с классом, прячущим приложение
      activeRef.current = false;
      document.body.classList.remove(PRINT_BODY_CLASS);
    };
  }, [begin, end]);

  const print = useCallback(() => {
    if (!begin()) return;
    // Chrome держит window.print() до закрытия диалога, afterprint приходит сам; на случай, если не придёт
    // (печать заблокирована политикой), снимаем режим печати сразу после возврата
    window.print();
    setTimeout(end, 0);
  }, [begin, end]);

  return { printing: printedAt !== null, printedAt, print };
};
