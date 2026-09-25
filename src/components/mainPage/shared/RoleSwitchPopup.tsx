// RoleSwitchPopup.tsx — выбор роли главной страницы: фон затемняется и размывается,
// поверх появляется окно со списком доступных информационных панелей.
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon24Black from '../../../assets/Icons/CloseIcons/CloseIcon24Black.svg';
import CheckboxOff from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxOn from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import { COLORS, FONT, SHADOWS } from './layout';
import { ROLES } from './roles';
import type { RoleKey } from './roles';

interface RoleSwitchPopupProps {
  isOpen: boolean;
  /** Текущая роль — её строка отмечена */
  value: RoleKey;
  onSelect: (role: RoleKey) => void;
  onClose: () => void;
}

const ROW_HEIGHT = 84;
const ROW_GAP = 14;
const CONTENT_TOP = 104;
const SIDE = 32;
/** Больше четырёх ролей не помещаются столбцом по высоте — раскладываем в две колонки */
const COLUMNS = ROLES.length > 4 ? 2 : 1;
const COLUMN_GAP = 16;
const WINDOW_WIDTH = COLUMNS === 2 ? 880 : 560;
const ROW_WIDTH = (WINDOW_WIDTH - SIDE * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;
const ROW_COUNT = Math.ceil(ROLES.length / COLUMNS);
const WINDOW_HEIGHT = CONTENT_TOP + ROW_COUNT * ROW_HEIGHT + (ROW_COUNT - 1) * ROW_GAP + SIDE;

const RoleSwitchBody: React.FC<Omit<RoleSwitchPopupProps, 'isOpen'>> = ({ value, onSelect, onClose }) => {

  const handleSelect = (role: RoleKey) => {
    if (role !== value) onSelect(role);
    onClose();
  };

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
      onClick={onClose}
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
          boxShadow: SHADOWS.modal,
          position: 'relative',
          fontFamily: FONT,
          userSelect: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
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
          }}
        >
          <img src={CloseIcon24Black} alt="" draggable={false} style={{ width: 24, height: 24 }} />
        </button>

        <div
          style={{
            position: 'absolute',
            left: SIDE,
            top: 30,
            fontSize: 20,
            fontWeight: 600,
            lineHeight: '24px',
            color: COLORS.text,
          }}
        >
          Информационная панель
        </div>
        <div
          style={{
            position: 'absolute',
            left: SIDE,
            top: 62,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: '17px',
            color: COLORS.textMuted,
          }}
        >
          Выберите рабочее место — от него зависит состав панелей
        </div>

        {ROLES.map((role, index) => {
          const active = role.key === value;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => handleSelect(role.key)}
              style={{
                position: 'absolute',
                left: SIDE + (index % COLUMNS) * (ROW_WIDTH + COLUMN_GAP),
                top: CONTENT_TOP + Math.floor(index / COLUMNS) * (ROW_HEIGHT + ROW_GAP),
                width: ROW_WIDTH,
                height: ROW_HEIGHT,
                padding: '0 20px',
                borderRadius: 12,
                border: `1.5px solid ${active ? COLORS.accentBorder : '#E5ECF5'}`,
                backgroundColor: active ? 'rgba(102, 110, 254, 0.06)' : COLORS.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                outline: 'none',
                textAlign: 'left',
                fontFamily: FONT,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 600, lineHeight: '21px', color: COLORS.text }}>{role.name}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: '17px',
                    color: COLORS.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {role.hint}
                </span>
              </span>
              <img
                src={active ? CheckboxOn : CheckboxOff}
                alt=""
                draggable={false}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

const RoleSwitchPopup: React.FC<RoleSwitchPopupProps> = ({ isOpen, ...rest }) => (
  <AnimatePresence>{isOpen && <RoleSwitchBody {...rest} />}</AnimatePresence>
);

export default RoleSwitchPopup;
