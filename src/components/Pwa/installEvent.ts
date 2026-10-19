// installEvent.ts — системное предложение установки Chromium (Chrome, Яндекс Браузер на Android).
// Событие beforeinstallprompt может прийти до монтирования React, поэтому слушать его начинает bootstrapPwa
// сразу, как установка разрешила pwa, — до вставки манифеста: без манифеста браузер событие не шлёт.
import { useSyncExternalStore } from 'react';
import { isStandalone, isTouchDevice } from './env';

/** Событие Chromium; в стандартных типах DOM его нет */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const setDeferred = (event: BeforeInstallPromptEvent | null) => {
  deferred = event;
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** true — браузер готов показать диалог установки по нашей кнопке */
export const useCanInstall = (): boolean => useSyncExternalStore(subscribe, () => deferred !== null, () => false);

let listening = false;

export function listenInstallPrompt(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    // На компьютерах не вмешиваемся: там есть кнопка установки в адресной строке
    if (!isTouchDevice() || isStandalone()) return;
    // Вместо мини-панели браузера покажем своё ненавязчивое предложение
    event.preventDefault();
    setDeferred(event as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => setDeferred(null));
}

/** Показать системный диалог установки. true — пользователь согласился */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  // prompt() у события срабатывает только один раз
  setDeferred(null);
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome === 'accepted';
  } catch {
    return false;
  }
}
