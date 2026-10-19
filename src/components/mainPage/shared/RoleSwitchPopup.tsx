// RoleSwitchPopup.tsx — выбор роли главной страницы: фон затемняется и размывается,
// поверх появляется окно со списком доступных информационных панелей. Список ролей передаёт главная:
// только роли, данные которых доступны пользователю (roles.ts, availableRoles).
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon24Black from '../../../assets/Icons/CloseIcons/CloseIcon24Black.svg';
import CheckboxOff from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxOn from '../../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import { COLORS, FONT, SHADOWS } from './layout';
import type { DashboardRole, RoleKey } from './roles';

interface RoleSwitchPopupProps {
  isOpen: boolean;
  /** Доступные роли */
  roles: readonly DashboardRole[];
  /** Текущая роль — её строка отмечена */
  value: RoleKey;
  onSelect: (role: RoleKey) => void;
  onClose: () => void;
}

const ROW_HEIGHT = 84;
const ROW_GAP = 14;
const CONTENT_TOP = 104;
const SIDE = 32;
const COLUMN_GAP = 16;

/** Раскладка окна по числу ролей: больше четырёх не помещаются столбцом по высоте — две колонки */
const windowLayout = (count: number) => {
  const columns = count > 4 ? 2 : 1;
  const width = columns === 2 ? 880 : 560;
  const rowWidth = (width - SIDE * 2 - COLUMN_GAP * (columns - 1)) / columns;
  const rowCount = Math.ceil(count / columns);
  const height = CONTENT_TOP + rowCount * ROW_HEIGHT + (rowCount - 1) * ROW_GAP + SIDE;
  return { columns, width, rowWidth, height };
};

const RoleSwitchBody: React.FC<Omit<RoleSwitchPopupProps, 'isOpen'>> = ({ roles, value, onSelect, onClose }) => {
  const { columns, width, rowWidth, height } = windowLayout(roles.length);

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
          width,
          height,
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

        {roles.map((role, index) => {
          const active = role.key === value;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => handleSelect(role.key)}
              style={{
                position: 'absolute',
                left: SIDE + (index % columns) * (rowWidth + COLUMN_GAP),
                top: CONTENT_TOP + Math.floor(index / columns) * (ROW_HEIGHT + ROW_GAP),
                width: rowWidth,
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
