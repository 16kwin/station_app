// components/CustomScrollbar.tsx
import React, { useState, useCallback, useEffect } from 'react';

interface CustomScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  orientation: 'vertical' | 'horizontal';
  trackSize: number;
  thumbColor?: string;
  trackColor?: string;
  triangleColor?: string;
}

const TRIANGLE_SIZE = 6;
const TRIANGLE_MARGIN = 4;

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  scrollContainerRef,
  orientation,
  trackSize,
  thumbColor = '#2D4059',
  trackColor = 'rgba(45, 64, 89, 0.04)',
  triangleColor = '#2D4059',
}) => {
  const [thumbSize, setThumbSize] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);

  const updateScrollbar = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isVertical = orientation === 'vertical';
    const scrollSize = isVertical ? container.scrollHeight : container.scrollWidth;
    const clientSize = isVertical ? container.clientHeight : container.clientWidth;

    if (scrollSize <= clientSize) {
      setThumbSize(0);
      return;
    }

    const trackInnerSize = trackSize - (TRIANGLE_SIZE + TRIANGLE_MARGIN) * 2;
    const thumb = (clientSize / scrollSize) * trackInnerSize;
    const scrollPos = isVertical ? container.scrollTop : container.scrollLeft;
    const maxScroll = scrollSize - clientSize;
    const scrollRatio = maxScroll > 0 ? scrollPos / maxScroll : 0;
    const thumbPos = scrollRatio * (trackInnerSize - thumb);

    setThumbSize(Math.max(20, thumb));
    setThumbOffset(thumbPos);
  }, [scrollContainerRef, orientation, trackSize]);

  useEffect(() => {
    // Сразу обновляем при маунте
    updateScrollbar();

    const container = scrollContainerRef.current;
    if (!container) return;

    // Слушаем скролл
    container.addEventListener('scroll', updateScrollbar);

    // Отслеживаем изменение размеров контейнера
    const resizeObserver = new ResizeObserver(() => {
      updateScrollbar();
    });
    resizeObserver.observe(container);

    // Отслеживаем изменение содержимого (дети добавляются/удаляются)
    const mutationObserver = new MutationObserver(() => {
      updateScrollbar();
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollbar]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;

    const isVertical = orientation === 'vertical';
    const scrollSize = isVertical ? container.scrollHeight : container.scrollWidth;
    const clientSize = isVertical ? container.clientHeight : container.clientWidth;
    const maxScroll = scrollSize - clientSize;
    const trackInnerSize = trackSize - (TRIANGLE_SIZE + TRIANGLE_MARGIN) * 2;

    const startCoord = isVertical ? e.clientY : e.clientX;
    const startScrollPos = isVertical ? container.scrollTop : container.scrollLeft;

    const handleMouseMove = (moveEvent: MouseEvent) => {
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isVertical = orientation === 'vertical';
  const thumbStyle: React.CSSProperties = isVertical
    ? {
        position: 'absolute',
        top: `${thumbOffset}px`,
        width: '8px',
        height: `${thumbSize}px`,
        backgroundColor: thumbColor,
        borderRadius: '4px',
        cursor: 'pointer',
      }
    : {
        position: 'absolute',
        left: `${thumbOffset}px`,
        height: '8px',
        width: `${thumbSize}px`,
        backgroundColor: thumbColor,
        borderRadius: '4px',
        cursor: 'pointer',
      };

  const trackStyle: React.CSSProperties = isVertical
    ? {
        width: '8px',
        height: `${trackSize - (TRIANGLE_SIZE + TRIANGLE_MARGIN) * 2}px`,
        backgroundColor: trackColor,
        borderRadius: '4px',
        position: 'relative',
        marginTop: `${TRIANGLE_MARGIN}px`,
        marginBottom: `${TRIANGLE_MARGIN}px`,
        flexShrink: 0,
      }
    : {
        height: '8px',
        width: `${trackSize - (TRIANGLE_SIZE + TRIANGLE_MARGIN) * 2}px`,
        backgroundColor: trackColor,
        borderRadius: '4px',
        position: 'relative',
        marginLeft: `${TRIANGLE_MARGIN}px`,
        marginRight: `${TRIANGLE_MARGIN}px`,
        flexShrink: 0,
      };

  const wrapperStyle: React.CSSProperties = isVertical
    ? {
        width: '15px',
        height: `${trackSize}px`,
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }
    : {
        height: '15px',
        width: `${trackSize}px`,
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
      };

  if (thumbSize === 0) return null;

  return (
    <div style={wrapperStyle}>
      <div
        style={
          isVertical
            ? {
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: `${TRIANGLE_SIZE}px solid ${triangleColor}`,
                flexShrink: 0,
              }
            : {
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderRight: `${TRIANGLE_SIZE}px solid ${triangleColor}`,
                flexShrink: 0,
              }
        }
      />

      <div style={trackStyle}>
        <div onMouseDown={handleThumbMouseDown} style={thumbStyle} />
      </div>

      <div
        style={
          isVertical
            ? {
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `${TRIANGLE_SIZE}px solid ${triangleColor}`,
                flexShrink: 0,
              }
            : {
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: `${TRIANGLE_SIZE}px solid ${triangleColor}`,
                flexShrink: 0,
              }
        }
      />
    </div>
  );
};

export default CustomScrollbar;