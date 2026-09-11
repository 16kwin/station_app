// DashboardSettingsPopup.tsx — модалка выбора видов номенклатуры для карточек панели: стиль ConfigurationPopup, упорядоченный выбор с ограничениями min/max
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../elements/CustomScrollbar';
import CheckboxIcon18OffBlack from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OnBlue from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CloseIcon24Black from '../../../assets/Icons/CloseIcons/CloseIcon24Black.svg';
import { COLORS, FONT } from './layout';
import type { NomenclatureTypeRef } from './types';

interface DashboardSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Все доступные виды номенклатуры — строки таблицы */
  types: NomenclatureTypeRef[];
  /** Упорядоченный список выбранных ключей (порядок = порядок на карточке) */
  selected: string[];
  /** Меньше выбрать нельзя */
  min: number;
  /** Больше выбрать нельзя */
  max: number;
  /** Вызывается при закрытии (крестик или клик по фону) с итоговым упорядоченным списком */
  onSave: (selected: string[]) => void;
}

// Геометрия — как в ConfigurationPopup
const WINDOW_WIDTH = 726;
const WINDOW_HEIGHT = 585;
const TABLE_LEFT = 40;
const TABLE_TOP = 81;
const TABLE_WIDTH = 646;
const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const VISIBLE_ROWS = 7;
const TABLE_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS + HEADER_HEIGHT;
const SCROLL_OFFSET = 15;
const CHECK_COLUMN_LEFT = 446;
const CHECK_COLUMN_WIDTH = 160;
const ROW_BORDER = '1px solid #E5ECF5';

type SettingsBodyProps = Omit<DashboardSettingsPopupProps, 'isOpen'>;

/** Содержимое модалки; монтируется при каждом открытии, поэтому черновик всегда стартует с текущего выбора */
const SettingsBody: React.FC<SettingsBodyProps> = ({ onClose, title, types, selected, min, max, onSave }) => {
  const [draft, setDraft] = useState<string[]>(selected);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Строки фиксированной высоты: скролл есть ровно тогда, когда строк больше видимых
  const hasScroll = types.length > VISIBLE_ROWS;
  const canAdd = draft.length < max;
  const canRemove = draft.length > min;

  // Новая галочка — в конец списка, снятие — удаление; ограничения проверяются по актуальному состоянию
  const toggleType = (key: string) => {
    setDraft(prev => {
      if (prev.includes(key)) return prev.length > min ? prev.filter(k => k !== key) : prev;
      return prev.length < max ? [...prev, key] : prev;
    });
  };

  const handleClose = () => {
    onSave(draft);
    onClose();
  };

  const emptyRows = Math.max(0, VISIBLE_ROWS - types.length);

  return (
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
          width: WINDOW_WIDTH,
          height: WINDOW_HEIGHT,
          backgroundColor: COLORS.white,
          borderRadius: 15,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          position: 'relative',
          userSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
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
            outline: 'none',
            zIndex: 1,
          }}
        >
          <img src={CloseIcon24Black} alt="" draggable={false} style={{ width: 24, height: 24 }} />
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
          <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600, color: COLORS.text }}>{title}</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: TABLE_TOP,
            left: TABLE_LEFT,
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
              backgroundColor: COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              paddingLeft: 50,
              paddingRight: 40,
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: COLORS.white }}>ВИД НОМЕНКЛАТУРЫ</span>
            <span style={{ position: 'absolute', left: CHECK_COLUMN_LEFT, fontFamily: FONT, fontSize: 15, fontWeight: 600, color: COLORS.white }}>
              ПОКАЗЫВАТЬ
            </span>
          </div>

          <div
            ref={scrollContainerRef}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {types.map((type, idx) => {
              const isSelected = draft.includes(type.key);
              // Достигнут максимум — невыбранные недоступны; достигнут минимум — выбранные нельзя снять
              const disabled = isSelected ? !canRemove : !canAdd;
              return (
                <div
                  key={type.key}
                  onClick={() => {
                    if (!disabled) toggleType(type.key);
                  }}
                  style={{
                    height: ROW_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: COLORS.white,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    borderTop: idx === 0 ? 'none' : ROW_BORDER,
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      marginLeft: 50,
                      fontFamily: FONT,
                      fontSize: 15,
                      fontWeight: 500,
                      color: COLORS.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 350,
                    }}
                  >
                    {type.name}
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      left: CHECK_COLUMN_LEFT,
                      width: CHECK_COLUMN_WIDTH,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <motion.div
                      style={{ width: 18, height: 18, position: 'relative', flexShrink: 0 }}
                      whileTap={disabled ? undefined : { scale: 0.85 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <motion.img
                        src={CheckboxIcon18OffBlack}
                        alt=""
                        draggable={false}
                        style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }}
                        animate={{ opacity: isSelected ? 0 : 1, scale: isSelected ? 0.85 : 1 }}
                        transition={{ duration: 0.15 }}
                      />
                      <motion.img
                        src={CheckboxIcon18OnBlue}
                        alt=""
                        draggable={false}
                        style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18 }}
                        animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.85 }}
                        transition={{ duration: 0.15 }}
                      />
                    </motion.div>
                  </div>
                </div>
              );
            })}

            {Array.from({ length: emptyRows }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  height: ROW_HEIGHT,
                  backgroundColor: COLORS.white,
                  boxSizing: 'border-box',
                  borderTop: types.length === 0 && i === 0 ? 'none' : ROW_BORDER,
                }}
              />
            ))}
          </div>
        </div>

        {hasScroll && (
          <div
            style={{
              position: 'absolute',
              left: TABLE_LEFT + TABLE_WIDTH + SCROLL_OFFSET,
              top: TABLE_TOP + HEADER_HEIGHT,
              height: TABLE_HEIGHT - HEADER_HEIGHT,
              width: 10,
            }}
          >
            <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: TABLE_LEFT,
            top: TABLE_TOP + TABLE_HEIGHT + 12,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: '16px',
            color: COLORS.textMuted,
            whiteSpace: 'nowrap',
          }}
        >
          Выбрано {draft.length} из {max} (минимум {min})
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardSettingsPopup: React.FC<DashboardSettingsPopupProps> = ({ isOpen, ...bodyProps }) => {
  return <AnimatePresence>{isOpen && <SettingsBody key="settings-body" {...bodyProps} />}</AnimatePresence>;
};

export default DashboardSettingsPopup;
