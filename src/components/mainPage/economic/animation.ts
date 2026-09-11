// animation.ts — хуки анимации загрузки: прогресс 0..1 и «крутящееся» число

import { useEffect, useRef, useState } from 'react';

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Прогресс анимации 0..1 по requestAnimationFrame.
 * Перезапускается при смене `key`. `delay` — задержка старта в мс.
 * Функцию `easing` можно передавать инлайном — она читается через ref и не перезапускает анимацию.
 */
export const useProgress = (
  key: number,
  duration: number,
  delay = 0,
  easing: (t: number) => number = easeOutCubic,
): number => {
  const [progress, setProgress] = useState(0);
  const easingRef = useRef(easing);

  useEffect(() => {
    easingRef.current = easing;
  }, [easing]);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;

    // Сброс в 0 и первый кадр происходят внутри rAF — без синхронного setState в эффекте
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      const t = elapsed <= 0 ? 0 : Math.min(1, elapsed / duration);
      setProgress(t === 0 ? 0 : easingRef.current(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, duration, delay]);

  return progress;
};

/** Число, «нарастающее» от 0 до `target` за `duration` мс; перезапуск при смене `key` */
export const useCountUp = (target: number, key: number, duration = 2000, delay = 0): number => {
  const progress = useProgress(key, duration, delay);
  return target * progress;
};
