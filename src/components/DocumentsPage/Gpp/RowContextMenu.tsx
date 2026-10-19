// RowContextMenu.tsx — меню строки по правой кнопке: добавить деталь, материал или изделие, удалить строку.
import React, { useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { RowKind } from './types';
import { COLORS, FONT, SHADOWS } from './theme';
import { useDismiss } from './useDismiss';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon16Black from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';

export interface ContextMenuState {
  x: number;
  y: number;
  /** Строка под курсором; null — пустое место под строками */
  uid: string | null;
}

interface RowContextMenuProps {
  menu: ContextMenuState;
  onAdd: (kind: RowKind, anchorUid: string | null) => void;
  onDelete: (uid: string) => void;
  onClose: () => void;
}

const WIDTH = 236;

const RowContextMenu: React.FC<RowContextMenuProps> = ({ menu, onAdd, onDelete, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [ref], []);
  const close = useCallback(() => onClose(), [onClose]);
  useDismiss(true, refs, close);

  const items: { key: string; label: string; icon: string; danger?: boolean; run: () => void }[] = [];
  if (menu.uid) {
    items.push(
      { key: 'part', label: 'Добавить деталь', icon: CreateIcon14Black, run: () => onAdd('PART', menu.uid) },
      { key: 'material', label: 'Добавить материал', icon: CreateIcon14Black, run: () => onAdd('MATERIAL', menu.uid) },
    );
  }
  items.push({ key: 'product', label: 'Добавить изделие', icon: CreateIcon14Black, run: () => onAdd('PRODUCT', menu.uid) });
  if (menu.uid) items.push({ key: 'delete', label: 'Удалить', icon: DeleteIcon16Black, danger: true, run: () => onDelete(menu.uid!) });

  const height = 20 * 2 + items.length * 40;
  const left = Math.min(menu.x, window.innerWidth - WIDTH - 8);
  const top = Math.min(menu.y, window.innerHeight - height - 8);

  return (
    <motion.div
      ref={ref}
      role="menu"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'fixed',
        left,
        top,
        width: WIDTH,
        padding: '12px 0',
        backgroundColor: COLORS.white,
        borderRadius: 10,
        boxShadow: SHADOWS.menu,
        zIndex: 2000,
        fontFamily: FONT,
        transformOrigin: 'top left',
      }}
    >
      {items.map(item => (
        <div
          key={item.key}
          role="menuitem"
          onClick={() => {
            item.run();
            onClose();
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = COLORS.rowHover;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          style={{
            height: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 20px',
            cursor: 'pointer',
            fontSize: 15,
            color: item.danger ? COLORS.danger : COLORS.text,
            borderTop: item.key === 'delete' ? `1px solid ${COLORS.line}` : 'none',
          }}
        >
          <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
            <img src={item.icon} alt="" style={{ width: item.key === 'delete' ? 16 : 14, height: item.key === 'delete' ? 16 : 14 }} />
          </span>
          {item.label}
        </div>
      ))}
    </motion.div>
  );
};

export default RowContextMenu;
