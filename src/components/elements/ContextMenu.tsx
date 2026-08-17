// ContextMenu.tsx — ПОЛНЫЙ ФАЙЛ (без onMouseDown, только onClick stopPropagation)
import React from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  width?: number;
  itemHeight?: number;
  iconSize?: number;
  iconLeft?: number;
  textLeft?: number;
  gapBetween?: number;
  paddingVertical?: number;
  fontSize?: number;
  textColor?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  width = 174,
  itemHeight = 18,
  iconSize = 16,
  iconLeft = 21,
  textLeft = 17,
  gapBetween = 22,
  paddingVertical = 20,
  fontSize = 15,
  textColor = '#2D4059',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        width,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 10001,
        padding: `${paddingVertical}px 0`,
      }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <div
          key={item.id}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
          }}
          style={{
            width: '100%',
            height: itemHeight,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: idx < items.length - 1 ? gapBetween : 0,
          }}
        >
          <img src={item.icon} alt="" style={{ width: iconSize, height: iconSize, marginLeft: iconLeft }} />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize,
              fontWeight: 400,
              color: textColor,
              marginLeft: textLeft,
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;