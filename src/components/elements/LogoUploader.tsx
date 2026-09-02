// LogoUploader.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useRef, useState, useEffect, useCallback } from 'react';
import CreateIcon14Gray from '../../assets/Icons/СreateIcons/СreateIcon14Gray.svg';
import CreateIcon14Blue from '../../assets/Icons/СreateIcons/СreateIcon14Blue.svg';
import DeleteIcon16Blue from '../../assets/Icons/DeleteIcons/DeleteIcon16Blue.svg';
import ArrowIcon18Up from '../../assets/Icons/ArrowIcons/ArrowIcon18Up.svg';
import ArrowIcon18Down from '../../assets/Icons/ArrowIcons/ArrowIcon18Down.svg';

interface LogoUploaderProps {
  images: { uid: string; url: string; originalName: string }[];
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
  onUpload?: (files: FileList) => void;
  onDelete?: (uid: string, index: number) => void;
  width?: number;
  height?: number;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  images,
  selectedIndex = 0,
  onSelectImage,
  onUpload,
  onDelete,
  width = 410,
  height = 283,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  const hasImage = images.length > 0;
  const currentImage = images[selectedIndex];

  const safeIndex = Math.min(selectedIndex, Math.max(0, images.length - 1));

  useEffect(() => {
    if (!contextMenu) return;
    const h = () => setContextMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [contextMenu]);

  const BIG_W = 42;
  const BIG_H = 35;
  const SMALL_W = 30;
  const SMALL_H = 25;
  const GAP_3 = 15;
  const GAP_4 = 11;
  const TOP_PADDING_3 = 20;
  const TOP_PADDING_4 = 11;

  const isManyImages = images.length >= 4;

  const maxStartIndex = images.length > 4 ? images.length - 4 : 0;

  const visibleIndices = Array.from({ length: Math.min(4, images.length) }, (_, i) => startIndex + i);

  const smoothScrollTo = useCallback((targetIndex: number) => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    const startValue = startIndex;
    const endValue = targetIndex;
    const duration = 300;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + (endValue - startValue) * eased);
      setStartIndex(currentValue);
      
      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    
    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, [startIndex]);

  useEffect(() => {
    if (images.length <= 4) return;
    
    let targetStart = startIndex;
    if (safeIndex < startIndex) {
      targetStart = safeIndex;
    } else if (safeIndex > startIndex + 3) {
      targetStart = safeIndex - 3;
    }
    
    if (targetStart !== startIndex) {
      smoothScrollTo(targetStart);
    }
  }, [safeIndex, images.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (images.length <= 4) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    if (e.deltaY > 0) {
      setStartIndex(prev => Math.min(maxStartIndex, prev + 1));
    } else {
      setStartIndex(prev => Math.max(0, prev - 1));
    }
  }, [images.length, maxStartIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  };

  const navigateTo = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= images.length) return;
    
    onSelectImage && onSelectImage(newIndex);
    
    if (images.length > 4) {
      let targetStart = startIndex;
      if (newIndex < startIndex) {
        targetStart = newIndex;
      } else if (newIndex > startIndex + 3) {
        targetStart = newIndex - 3;
      }
      
      if (targetStart !== startIndex) {
        smoothScrollTo(targetStart);
      }
    }
  }, [images.length, startIndex, onSelectImage, smoothScrollTo]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeIndex > 0) {
      navigateTo(safeIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeIndex < images.length - 1) {
      navigateTo(safeIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length <= 1) return;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (safeIndex > 0) {
          navigateTo(safeIndex - 1);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (safeIndex < images.length - 1) {
          navigateTo(safeIndex + 1);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length, safeIndex, navigateTo]);

  const getThumbSize = (position: number): { width: number; height: number } => {
    if (images.length <= 3) {
      return { width: BIG_W, height: BIG_H };
    }

    if (position === 1 || position === 2) {
      return { width: BIG_W, height: BIG_H };
    }
    
    return { width: SMALL_W, height: SMALL_H };
  };

  const allRenderIndices = new Set<number>();
  visibleIndices.forEach(i => allRenderIndices.add(i));
  if (images.length > 4) {
    const prevStart = Math.max(0, startIndex - 1);
    if (prevStart !== startIndex) {
      const prevIndices = Array.from({ length: 4 }, (_, i) => prevStart + i);
      prevIndices.forEach(i => allRenderIndices.add(i));
    }
    const nextStart = Math.min(maxStartIndex, startIndex + 1);
    if (nextStart !== startIndex) {
      const nextIndices = Array.from({ length: 4 }, (_, i) => nextStart + i);
      nextIndices.forEach(i => allRenderIndices.add(i));
    }
  }

  return (
    <div style={{ width, height, borderRadius: 10, border: hasImage ? '1px solid #666EFE' : '1px solid #A0A3BD', overflow: 'hidden', display: 'flex', position: 'relative' }}>
      {/* ЛЕВАЯ ПАНЕЛЬ 56 */}
      <div style={{ width: 56, height: height, flexShrink: 0, position: 'relative' }}>
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev} 
              disabled={safeIndex === 0}
              style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 115, width: 18, height: 18, border: 'none', background: 'transparent', cursor: safeIndex === 0 ? 'default' : 'pointer', padding: 0, zIndex: 2, opacity: safeIndex === 0 ? 0.3 : 1 }}
            >
              <img src={ArrowIcon18Up} alt="" style={{ width: 18, height: 18 }} />
            </button>
            <button 
              onClick={handleNext} 
              disabled={safeIndex === images.length - 1}
              style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 150, width: 18, height: 18, border: 'none', background: 'transparent', cursor: safeIndex === images.length - 1 ? 'default' : 'pointer', padding: 0, zIndex: 2, opacity: safeIndex === images.length - 1 ? 0.3 : 1 }}
            >
              <img src={ArrowIcon18Down} alt="" style={{ width: 18, height: 18 }} />
            </button>
          </>
        )}
      </div>

      {/* ЦЕНТРАЛЬНАЯ ОБЛАСТЬ С КАРТИНКОЙ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#FFFFFF' }}>
        {hasImage ? (
          <div 
            onContextMenu={(e) => handleContextMenu(e, safeIndex)}
            style={{ 
              width: '100%', 
              height: '100%', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              padding: '10px',
              boxSizing: 'border-box',
            }}
            onClick={() => setFullscreenImage(true)}
          >
            <img 
              src={currentImage?.url} 
              alt={currentImage?.originalName} 
              draggable={false}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }} 
            />
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: '#A0A3BD',
            }}
          >
            Добавьте изображение
          </button>
        )}
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ 56 */}
      <div style={{ width: 56, height: height, backgroundColor: 'rgba(102, 110, 254, 0.08)', flexShrink: 0, position: 'relative' }}>
        {/* Кнопка Добавить */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{ position: 'absolute', top: 17, left: '50%', transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', border: `2px solid ${hasImage ? '#666EFE' : '#A0A3BD'}`, backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 2 }}
        >
          <img src={hasImage ? CreateIcon14Blue : CreateIcon14Gray} alt="" style={{ width: 14, height: 14 }} />
        </button>

        {/* Кнопка Удалить */}
        {hasImage && (
          <button 
            onClick={() => onDelete && onDelete(currentImage?.uid, safeIndex)}
            style={{ position: 'absolute', top: 59, left: '50%', transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', border: '2px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 2 }}
          >
            <img src={DeleteIcon16Blue} alt="" style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Черта */}
        <div style={{ position: 'absolute', top: hasImage ? 106 : 76, left: '50%', transform: 'translateX(-50%)', width: 34, height: 1, backgroundColor: 'rgba(102, 110, 254, 0.3)' }} />

        {/* Мини-превью */}
        <div 
          onWheel={handleWheel}
          style={{ 
            position: 'absolute', 
            top: hasImage ? 107 : 77, 
            left: 0, 
            width: 56, 
            height: 175,
            overflow: 'hidden',
          }}
        >
          {Array.from(allRenderIndices).sort((a, b) => a - b).map((imgIdx) => {
            const img = images[imgIdx];
            if (!img) return null;
            
            const currentPosition = visibleIndices.indexOf(imgIdx);
            const isVisible = currentPosition !== -1;
            
            const isSelected = imgIdx === safeIndex;
            const thumbSize = getThumbSize(currentPosition !== -1 ? currentPosition : (imgIdx < startIndex ? 0 : 3));
            const gap = isManyImages ? GAP_4 : GAP_3;
            
            const topPadding = isManyImages ? TOP_PADDING_4 : TOP_PADDING_3;
            
            let positionY = topPadding;
            if (isManyImages) {
              if (imgIdx === startIndex) {
                positionY = topPadding;
              } else if (imgIdx === startIndex + 1) {
                positionY = topPadding + SMALL_H + gap;
              } else if (imgIdx === startIndex + 2) {
                positionY = topPadding + SMALL_H + gap + BIG_H + gap;
              } else if (imgIdx === startIndex + 3) {
                positionY = topPadding + SMALL_H + gap + BIG_H + gap + BIG_H + gap;
              } else if (imgIdx < startIndex) {
                const offset = startIndex - imgIdx;
                positionY = topPadding - offset * (SMALL_H + gap);
              } else {
                const offset = imgIdx - (startIndex + 3);
                positionY = topPadding + SMALL_H + gap + BIG_H + gap + BIG_H + gap + SMALL_H + gap + (offset - 1) * (SMALL_H + gap);
              }
            } else {
              positionY = topPadding + imgIdx * (BIG_H + gap);
            }
            
            return (
              <div 
                key={img.uid}
                onClick={() => onSelectImage && onSelectImage(imgIdx)}
                onContextMenu={(e) => handleContextMenu(e, imgIdx)}
                style={{ 
                  position: 'absolute',
                  top: positionY,
                  left: '50%',
                  transform: isVisible ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.5)',
                  width: thumbSize.width, 
                  height: thumbSize.height, 
                  borderRadius: 4, 
                  border: isSelected ? '2px solid #666EFE' : '2px solid transparent', 
                  cursor: 'pointer', 
                  overflow: 'hidden', 
                  backgroundColor: '#F5F6FA',
                  transition: 'top 0.3s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <img 
                  src={img.url} 
                  alt="" 
                  draggable={false}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }} 
                />
              </div>
            );
          })}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Контекстное меню */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 150, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { if (onDelete) onDelete(images[contextMenu.index]?.uid, contextMenu.index); setContextMenu(null); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
            Удалить
          </button>
        </div>
      )}

      {/* Полноэкранный просмотр */}
      {fullscreenImage && currentImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenImage(false)}>
          <img src={currentImage.url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default LogoUploader;