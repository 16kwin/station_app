// useTween.ts — плавный переход полос диаграммы к новому плану (смена типа графика, пересчёт, правка этапа).
// Положение считается кадр за кадром, поэтому стрелки и линии плана едут вместе с полосами.
import { useEffect, useState } from 'react';
import { lerpGeometry } from './geometry';
import type { Geometry } from './geometry';

const DURATION_MS = 420;

const easeInOut = (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

interface TweenState {
  from: Geometry;
  to: Geometry;
  k: number;
  /** Номер запуска анимации — по нему перезапускается цикл кадров */
  run: number;
  /** Смена шкалы или периода — без анимации, иначе полосы «поехали» бы относительно сетки */
  resetKey: string;
}

const shownOf = (s: TweenState): Geometry => (s.k >= 1 ? s.to : lerpGeometry(s.from, s.to, easeInOut(s.k)));

/**
 * Показываемая геометрия полос. instant — сразу к цели (перетаскивание мышью), resetKey — масштаб шкалы:
 * при его смене полосы встают на место без анимации.
 */
export const useTweenedGeometry = (target: Geometry, instant: boolean, resetKey: string): Geometry => {
  const [state, setState] = useState<TweenState>({ from: target, to: target, k: 1, run: 0, resetKey });

  // Новая цель: движение начинается от того, что видно сейчас (в том числе с середины прошлой анимации)
  if (state.to !== target || state.resetKey !== resetKey) {
    const jump = instant || state.resetKey !== resetKey;
    setState({
      from: jump ? target : shownOf(state),
      to: target,
      k: jump ? 1 : 0,
      run: jump ? state.run : state.run + 1,
      resetKey,
    });
  }

  useEffect(() => {
    if (state.run === 0) return;
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - started) / DURATION_MS);
      setState(s => (s.k >= 1 ? s : { ...s, k }));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [state.run]);

  return shownOf(state);
};
