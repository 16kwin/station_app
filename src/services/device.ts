// device.ts — с чего открыто приложение: компьютер или телефон, ТСД, планшет. На мобильных устройствах — только
// просмотр (решение команды, readOnly.ts); раскладка по ширине экрана — отдельно (hooks/useViewport.ts): телефон,
// повёрнутый горизонтально, остаётся телефоном, а сужённое окно компьютера — компьютером.

/** Заголовок для сервера: устройство без мыши (MobileReadOnlyFilter / ClientDevice на бэкенде) */
export const DEVICE_HEADER = 'X-AWMS-Device';

export interface DeviceSignals {
  userAgent: string;
  /** navigator.userAgentData.mobile (Chromium); undefined — браузер не сообщает */
  uaMobile?: boolean;
  maxTouchPoints: number;
  /** Основной указатель — палец (pointer: coarse) */
  coarsePointer: boolean;
  /** Есть хоть один точный указатель — мышь или тачпад (any-pointer: fine) */
  finePointer: boolean;
}

const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i;

/**
 * Мобильное устройство: браузер сам называет себя мобильным, или система мобильная, или iPad (называет себя
 * Macintosh, но с сенсорным экраном), или экран сенсорный без мыши («версия для ПК» в мобильном браузере).
 * Ноутбук с сенсорным экраном и тачпадом — компьютер
 */
export const isMobileSignals = (s: DeviceSignals): boolean => {
  if (s.uaMobile === true) return true;
  if (MOBILE_USER_AGENT.test(s.userAgent)) return true;
  if (/Macintosh/i.test(s.userAgent) && s.maxTouchPoints > 1) return true;
  return s.coarsePointer && !s.finePointer;
};

const browserSignals = (): DeviceSignals => {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const media = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  return {
    userAgent: nav.userAgent ?? '',
    uaMobile: nav.userAgentData?.mobile,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    coarsePointer: media('(pointer: coarse)'),
    finePointer: media('(any-pointer: fine)'),
  };
};

let cached: boolean | null = null;

/** Устройство за время работы страницы не меняется — определяем один раз */
export const isMobileDevice = (): boolean => {
  if (cached === null) cached = typeof navigator !== 'undefined' && isMobileSignals(browserSignals());
  return cached;
};
