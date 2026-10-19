// env.ts — окружение PWA: режим запуска, тип устройства, платформа, запоминание отказов.

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

/** Запущено как установленное приложение (отдельное окно, без адресной строки) */
export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  (navigator as NavigatorWithStandalone).standalone === true;

/** Основной указатель — палец: телефон, планшет, ТСД. Ноутбук с сенсорным экраном сюда не попадает */
export const isTouchDevice = (): boolean => window.matchMedia('(pointer: coarse)').matches;

/** iPhone, iPod, iPad. iPadOS представляется как Mac — отличаем по сенсорному экрану */
export const isIos = (): boolean => {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};

/** Safari на iOS: установка только вручную — «Поделиться → На экран „Домой“» */
export const isIosSafari = (): boolean =>
  isIos() && /Safari\//.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|GSA|DuckDuckGo/.test(navigator.userAgent);

/** localStorage может быть недоступен (приватный режим, запрет данных сайта) — тогда просто не запоминаем */
export const readFlag = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeFlag = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // не запомнили — предложение покажется ещё раз
  }
};
