// useDismiss.ts — закрыть выпадающую панель или меню по щелчку снаружи и по Esc.
import { useEffect } from 'react';
import type React from 'react';

/** Закрыть выпадающую панель по щелчку снаружи или Esc; refs — панель и кнопка, которая её открыла */
export const useDismiss = (open: boolean, refs: readonly React.RefObject<HTMLElement | null>[], onClose: () => void): void => {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && refs.some(r => r.current?.contains(target))) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    // Подписка со следующего кадра — щелчок, открывший панель, её не закрывает
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, refs, onClose]);
};
