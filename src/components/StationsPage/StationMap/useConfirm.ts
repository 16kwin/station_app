// useConfirm.ts — подтверждение в стиле приложения с ответом через Promise:
// const ok = await confirm({ title, text, confirmLabel }); окно рисует <ConfirmDialog {...dialog} />.
// Выбор из трёх: const answer = await choose({ ..., altLabel }) — 'confirm' | 'alt' | 'cancel'.
import { useCallback, useRef, useState } from 'react';
import type { ConfirmAnswer, ConfirmRequest } from './ui';

export interface ConfirmState {
  open: boolean;
  request: ConfirmRequest | null;
  onAnswer: (answer: ConfirmAnswer) => void;
}

export const useConfirm = (): {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  choose: (request: ConfirmRequest) => Promise<ConfirmAnswer>;
  dialog: ConfirmState;
} => {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolveRef = useRef<((answer: ConfirmAnswer) => void) | null>(null);

  const choose = useCallback((next: ConfirmRequest) => {
    // Предыдущий незакрытый вопрос считается отменённым
    resolveRef.current?.('cancel');
    setRequest(next);
    setOpen(true);
    return new Promise<ConfirmAnswer>(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  const confirm = useCallback((next: ConfirmRequest) => choose(next).then(answer => answer === 'confirm'), [choose]);

  const onAnswer = useCallback((answer: ConfirmAnswer) => {
    setOpen(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(answer);
  }, []);

  return { confirm, choose, dialog: { open, request, onAnswer } };
};
