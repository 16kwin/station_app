// ConfigurationPopup.tsx — ПОЛНЫЙ ФАЙЛ (пустые строки как в DataTable)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../components/CustomScrollbar';
import CheckboxIcon18OffBlack from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CloseIcon24Black from '../../assets/Icons/CloseIcons/CloseIcon24Black.svg';

interface ColumnItem {
  key: string;
  label: string;
}

interface ConfigurationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnItem[];
  visibleColumns: Set<string>;
  requiredColumns?: Set<string>;
  onSave: (visibleColumns: Set<string>) => void;
}

const ConfigurationPopup: React.FC<ConfigurationPopupProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  columns, 
  visibleColumns, 
  requiredColumns = new Set(),
  onSave 
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(visibleColumns));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);

  const TABLE_WIDTH = 646;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 7;
  const TABLE_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS + HEADER_HEIGHT;
  const SCROLL_OFFSET = 15;

  const toggleColumn = (key: string) => {
    if (requiredColumns.has(key)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleClose = () => {
    onSave(selected);
    onClose();
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasScroll(container.scrollHeight > container.clientHeight);
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set(visibleColumns));
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [isOpen, visibleColumns]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, []);

  const emptyRows = Math.max(0, VISIBLE_ROWS - columns.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 726,
              height: 585,
              backgroundColor: '#FFFFFF',
              borderRadius: 15,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 28,
                right: 28,
                width: 24,
                height: 24,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                zIndex: 1,
              }}
            >
              <img src={CloseIcon24Black} alt="Закрыть" style={{ width: 24, height: 24 }} />
            </button>

            <div
              style={{
                position: 'absolute',
                top: 30,
                left: 0,
                right: 0,
                height: 21,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 600, color: '#2D4059' }}>
                {title}
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 81,
                left: 40,
                width: TABLE_WIDTH,
                height: TABLE_HEIGHT,
                backgroundColor: '#F5F6FA',
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: HEADER_HEIGHT,
                  minHeight: HEADER_HEIGHT,
                  backgroundColor: '#666EFE',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  paddingLeft: 50,
                  paddingRight: 40,
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>
                  НАИМЕНОВАНИЕ ПОЛЯ СПИСКА
                </span>
                <span style={{ position: 'absolute', left: 446, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>
                  ВИДИМОСТЬ ПОЛЯ
                </span>
              </div>

              <div
                ref={scrollContainerRef}
                style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {columns.map((col, idx) => {
                  const isSelected = selected.has(col.key);
                  const isRequired = requiredColumns.has(col.key);
                  const isFirst = idx === 0;
                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      style={{
                        height: ROW_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        cursor: isRequired ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        borderTop: isFirst ? 'none' : '1px solid #E5ECF5',
                        boxSizing: 'border-box',
                        userSelect: 'none',
                        opacity: isRequired ? 0.7 : 1,
                      }}
                    >
                      <span
                        style={{
                          marginLeft: 50,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 15,
                          fontWeight: 500,
                          color: isRequired ? '#9CA3AF' : '#2D4059',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 350,
                        }}
                      >
                        {col.label}
                      </span>
                      <div style={{ position: 'absolute', left: 446, width: 160, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <motion.div
                          style={{ width: 18, height: 18, cursor: isRequired ? 'not-allowed' : 'pointer', position: 'relative', flexShrink: 0 }}
                          whileTap={isRequired ? undefined : { scale: 0.85 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.img
                            src={CheckboxIcon18OffBlack}
                            alt=""
                            style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }}
                            animate={{ opacity: isSelected ? 0 : (isRequired ? 0.3 : 1), scale: isSelected ? 0.85 : 1 }}
                            transition={{ duration: 0.15 }}
                          />
                          <motion.img
                            src={CheckboxIcon18OnBlue}
                            alt=""
                            style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }}
                            animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.85 }}
                            transition={{ duration: 0.15 }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: emptyRows }).map((_, i) => {
                  const isFirstEmpty = columns.length === 0 && i === 0;
                  return (
                    <div
                      key={`empty-${i}`}
                      style={{
                        height: ROW_HEIGHT,
                        backgroundColor: '#FFFFFF',
                        boxSizing: 'border-box',
                        borderTop: isFirstEmpty ? 'none' : '1px solid #E5ECF5',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {hasScroll && (
              <div style={{ position: 'absolute', left: 40 + TABLE_WIDTH + SCROLL_OFFSET, top: 81 + HEADER_HEIGHT, height: TABLE_HEIGHT - HEADER_HEIGHT, width: 10 }}>
                <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfigurationPopup;