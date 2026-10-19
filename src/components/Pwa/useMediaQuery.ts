// useMediaQuery.ts — подписка на медиа-запрос (инлайн-стили не умеют @media).
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** Узкий экран — телефон или ТСД: карточки PWA во всю ширину */
export const NARROW_QUERY = '(max-width: 560px)';
