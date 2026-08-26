// CustomScrollbar.tsx — ПОЛНЫЙ ФАЙЛ (исправлено обновление)
import React, { useState, useCallback, useEffect } from 'react';

interface CustomScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  orientation: 'vertical' | 'horizontal';
  trackSize: number;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  scrollContainerRef,
  orientation,
  trackSize,
}) => {
  const [thumbSize, setThumbSize] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [hasScroll, setHasScroll] = useState(false);

  const updateScrollbar = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isVertical = orientation === 'vertical';
    const scrollSize = isVertical ? container.scrollHeight : container.scrollWidth;
    const clientSize = isVertical ? container.clientHeight : container.clientWidth;

    if (scrollSize <= clientSize) {
      setHasScroll(false);
      setThumbSize(0);
      return;
    }

    setHasScroll(true);

    const trackInnerSize = trackSize;
    const thumb = (clientSize / scrollSize) * trackInnerSize;
    const scrollPos = isVertical ? container.scrollTop : container.scrollLeft;
    const maxScroll = scrollSize - clientSize;
    const scrollRatio = maxScroll > 0 ? scrollPos / maxScroll : 0;
    const thumbPos = scrollRatio * (trackInnerSize - thumb);

    setThumbSize(Math.max(20, thumb));
    setThumbOffset(thumbPos);
  }, [scrollContainerRef, orientation, trackSize]);

  useEffect(() => {
    updateScrollbar();

    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateScrollbar);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollbar();
    });
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(() => {
      updateScrollbar();
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Периодическое обновление для гарантии
    const interval = setInterval(() => {
      updateScrollbar();
    }, 100);

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      clearInterval(interval);
    };
  }, [updateScrollbar]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = scrollContainerRef.current;
    if (!container) return;

    const isVertical = orientation === 'vertical';
    const scrollSize = isVertical ? container.scrollHeight : container.scrollWidth;
    const clientSize = isVertical ? container.clientHeight : container.clientWidth;
    const maxScroll = scrollSize - clientSize;
    const trackInnerSize = trackSize;

    const startCoord = isVertical ? e.clientY : e.clientX;
    const startScrollPos = isVertical ? container.scrollTop : container.scrollLeft;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const currentCoord = isVertical ? moveEvent.clientY : moveEvent.clientX;
      const delta = currentCoord - startCoord;
      const trackAvailable = trackInnerSize - thumbSize;
      const scrollRatio = trackAvailable > 0 ? delta / trackAvailable : 0;
      const newScrollPos = startScrollPos + scrollRatio * maxScroll;

      if (isVertical) {
        container.scrollTop = Math.max(0, Math.min(newScrollPos, maxScroll));
      } else {
        container.scrollLeft = Math.max(0, Math.min(newScrollPos, maxScroll));
      }
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = prevUserSelect;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isVertical = orientation === 'vertical';

  const trackStyle: React.CSSProperties = {
    width: isVertical ? '10px' : `${trackSize}px`,
    height: isVertical ? `${trackSize}px` : '10px',
    backgroundColor: '#F2F4F9',
    borderRadius: '5px',
    position: 'relative',
    flexShrink: 0,
    userSelect: 'none',
  };

  const thumbStyle: React.CSSProperties = isVertical
    ? {
        position: 'absolute',
        top: `${thumbOffset}px`,
        left: '1px',
        width: '8px',
        height: `${thumbSize}px`,
        backgroundColor: '#2D4059',
        borderRadius: '4px',
        cursor: 'pointer',
        userSelect: 'none',
      }
    : {
        position: 'absolute',
        left: `${thumbOffset}px`,
        top: '1px',
        height: '8px',
        width: `${thumbSize}px`,
        backgroundColor: '#2D4059',
        borderRadius: '4px',
        cursor: 'pointer',
        userSelect: 'none',
      };

  return (
    <div style={trackStyle}>
      {hasScroll && (
        <div onMouseDown={handleThumbMouseDown} style={thumbStyle} />
      )}
    </div>
  );
};

export default CustomScrollbar;