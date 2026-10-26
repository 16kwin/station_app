// useViewport.ts — класс экрана для адаптации под телефоны, ТСД и планшеты (PWA). Размеры — C:\AWMS\docs\mobile.
// Компьютер (от 1024 px по ширине) — прежний холст 1920×(920–1080) без изменений; уже — раскладка по ширине
// экрана: рамка вкладок, рабочая область и меню подстраиваются, широкие страницы прокручиваются внутри области.
import { useCallback, useSyncExternalStore } from 'react';

export type Viewport = 'phone' | 'tablet' | 'desktop';

/** Телефон и ТСД: до 599 px по ширине (ТСД 5" — 360×640, телефоны — 360–430) */
export const PHONE_MAX_WIDTH = 599;
/** Планшет: 600–1023 px (iPad и Android 8–10" в портрете). От 1024 — компьютерный вид */
export const TABLET_MAX_WIDTH = 1023;

/** Телефон и в горизонтальном положении: узкий экран или низкий (до 499 px) и не шире планшета */
export const PHONE_QUERY = `(max-width: ${PHONE_MAX_WIDTH}px), (max-height: 499px) and (max-width: ${TABLET_MAX_WIDTH}px)`;
export const COMPACT_QUERY = `(max-width: ${TABLET_MAX_WIDTH}px)`;

const useMatch = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
};

/** Класс экрана по ширине; меняется на лету (поворот планшета, окно браузера) */
export function useViewport(): Viewport {
  const phone = useMatch(PHONE_QUERY);
  const compact = useMatch(COMPACT_QUERY);
  if (phone) return 'phone';
  return compact ? 'tablet' : 'desktop';
}

/** Телефон или планшет: раскладка по ширине экрана вместо холста 1920 */
export const useCompact = (): boolean => useViewport() !== 'desktop';

/** Нижнее меню на телефоне и планшете: высота полосы и отступ под неё у рабочей области (с вырезом экрана) */
export const COMPACT_MENU_HEIGHT = 56;
export const COMPACT_MENU_SPACE = `calc(env(safe-area-inset-bottom, 0px) + ${COMPACT_MENU_HEIGHT + 16}px)`;

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

/** Ширина окна (меняется при повороте телефона): по ней разделы подбирают число колонок и масштаб */
export const useWindowWidth = (): number =>
  useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1920);
