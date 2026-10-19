// Scrollbar.tsx — тонкая полоса прокрутки в стиле приложения (светлая дорожка, тёмный бегунок) поверх
// контейнера со скрытой системной: одинаково выглядит в любом браузере и не съедает ширину таблицы.
import React, { useEffect, useRef, useState } from 'react';
import { COLORS, LAYOUT } from './theme';

interface ScrollbarProps {
  target: React.RefObject<HTMLDivElement | null>;
  orientation: 'vertical' | 'horizontal';
  /** Длина дорожки, px */
  length: number;
  style: React.CSSProperties;
  /** Показывать дорожку, даже когда прокручивать нечего */
  alwaysTrack?: boolean;
  /** Любое значение, при смене которого размеры содержимого надо перечитать */
  watch?: unknown;
}

interface Metrics {
  thumb: number;
  offset: number;
  scrollable: boolean;
}

const MIN_THUMB = 36;

const Scrollbar: React.FC<ScrollbarProps> = ({ target, orientation, length, style, alwaysTrack = false, watch }) => {
  const vertical = orientation === 'vertical';
  const [m, setM] = useState<Metrics>({ thumb: 0, offset: 0, scrollable: false });
  const dragRef = useRef<{ start: number; scroll: number } | null>(null);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const update = () => {
      const size = vertical ? el.scrollHeight : el.scrollWidth;
      const client = vertical ? el.clientHeight : el.clientWidth;
      const pos = vertical ? el.scrollTop : el.scrollLeft;
      if (size <= client + 1) {
        setM(prev => (prev.scrollable ? { thumb: 0, offset: 0, scrollable: false } : prev));
        return;
      }
      const thumb = Math.max(MIN_THUMB, (client / size) * length);
      const offset = ((length - thumb) * pos) / (size - client);
      setM({ thumb, offset, scrollable: true });
    };
    const frame = requestAnimationFrame(update);
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [target, vertical, length, watch]);

  const scrollTo = (value: number) => {
    const el = target.current;
    if (!el) return;
    el.scrollTo(vertical ? { top: value } : { left: value });
  };

  const onThumbDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target.current;
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { start: vertical ? event.clientY : event.clientX, scroll: vertical ? el.scrollTop : el.scrollLeft };
  };

  const onThumbMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target.current;
    const drag = dragRef.current;
    if (!el || !drag) return;
    const size = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const delta = (vertical ? event.clientY : event.clientX) - drag.start;
    scrollTo(drag.scroll + (delta * size) / Math.max(1, length - m.thumb));
  };

  const onTrackDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = target.current;
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const at = vertical ? event.clientY - rect.top : event.clientX - rect.left;
    const page = vertical ? el.clientHeight : el.clientWidth;
    const pos = vertical ? el.scrollTop : el.scrollLeft;
    scrollTo(at < m.offset ? pos - page : pos + page);
  };

  if (!m.scrollable && !alwaysTrack) return null;

  const size = LAYOUT.scrollbarSize;
  return (
    <div
      onPointerDown={m.scrollable ? onTrackDown : undefined}
      style={{
        position: 'absolute',
        width: vertical ? size : length,
        height: vertical ? length : size,
        borderRadius: 999,
        backgroundColor: COLORS.track,
        zIndex: 6,
        ...style,
      }}
    >
      {m.scrollable && (
        <div
          role="scrollbar"
          aria-orientation={orientation}
          aria-valuenow={Math.round(m.offset)}
          onPointerDown={onThumbDown}
          onPointerMove={onThumbMove}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          style={{
            position: 'absolute',
            ...(vertical ? { top: m.offset, left: 0 } : { left: m.offset, top: 0 }),
            width: vertical ? size : m.thumb,
            height: vertical ? m.thumb : size,
            borderRadius: 999,
            backgroundColor: COLORS.text,
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  );
};

export default Scrollbar;
