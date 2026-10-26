// ReadOnlyGuard.tsx — режим «только просмотр» на телефонах, ТСД и планшетах (readOnly.ts). Кнопки записи в
// разделах написаны каждая по-своему (50+ файлов), поэтому страж находит их по подписи: «Записать», «Создать»,
// «Удалить», «Добавить», «Пополнить»… и прячет; в карточках и документах (create/edit) запирает поля ввода.
// Пропущенную кнопку не страшно: запрос не уйдёт (AxiosService), а сервер его всё равно отклонит. На компьютере
// страж ничего не делает. Подсказку «только просмотр» показывает по событию READ_ONLY_EVENT.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { READ_ONLY_EVENT, useReadOnly } from '../../services/readOnly';
import { isChildTabPath } from '../../layouts/tabRoutes';
import { COMPACT_MENU_SPACE } from '../hooks/useViewport';
import { CANDIDATES, HIDDEN_ATTR, LOCKED_ATTR, isWriteControl } from './writeControls';

const hideWriteControls = () => {
  document.body.querySelectorAll(CANDIDATES).forEach(element => {
    if (!element.hasAttribute(HIDDEN_ATTR) && isWriteControl(element)) element.setAttribute(HIDDEN_ATTR, '');
  });
};

/** Карточка или документ открыт: поля только для чтения (поиск в списках не трогаем) */
const lockCardFields = () => {
  if (!isChildTabPath(window.location.pathname)) return;
  document.querySelectorAll('.white-block input, .white-block textarea, .white-block select').forEach(element => {
    if (element.hasAttribute(LOCKED_ATTR)) return;
    if (element instanceof HTMLSelectElement) element.disabled = true;
    else if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio' || element.type === 'file')) element.disabled = true;
    else (element as HTMLInputElement | HTMLTextAreaElement).readOnly = true;
    element.setAttribute(LOCKED_ATTR, '');
  });
};

const unlockAll = () => {
  document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach(element => element.removeAttribute(HIDDEN_ATTR));
  document.querySelectorAll(`[${LOCKED_ATTR}]`).forEach(element => {
    if (element instanceof HTMLSelectElement || (element instanceof HTMLInputElement && ['checkbox', 'radio', 'file'].includes(element.type))) {
      (element as HTMLInputElement).disabled = false;
    } else {
      (element as HTMLInputElement).readOnly = false;
    }
    element.removeAttribute(LOCKED_ATTR);
  });
};

const ReadOnlyGuard = () => {
  const readOnly = useReadOnly();
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('awms-read-only', readOnly);
    if (!readOnly) {
      unlockAll();
      return;
    }
    let timer: number | null = null;
    const scan = () => {
      timer = null;
      hideWriteControls();
      lockCardFields();
    };
    // Разделы дорисовываются после загрузки данных и при открытии окон — проверяем после каждой правки DOM,
    // не чаще раза в 150 мс
    const observer = new MutationObserver(() => {
      if (timer === null) timer = window.setTimeout(scan, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scan();
    return () => {
      observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [readOnly]);

  useEffect(() => {
    let timer: number | null = null;
    const show = () => {
      setNotice(true);
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => setNotice(false), 3500);
    };
    window.addEventListener(READ_ONLY_EVENT, show);
    return () => {
      window.removeEventListener(READ_ONLY_EVENT, show);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: `calc(${COMPACT_MENU_SPACE} + 4px)`,
            zIndex: 10050,
            margin: '0 auto',
            maxWidth: 420,
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: '#2D4059',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            lineHeight: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          С телефона и планшета доступен только просмотр. Изменить данные можно с компьютера.
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReadOnlyGuard;
