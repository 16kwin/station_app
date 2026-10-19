// ContextMenu.tsx — меню по правой кнопке мыши
import React, { useMemo } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  /** Ширина иконки внутри блока 20×20 (по умолчанию 20) */
  iconWidth?: number;
  /** Высота иконки внутри блока 20×20 (по умолчанию 20) */
  iconHeight?: number;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  fontSize?: number;
  textColor?: string;
}

const PADDING_X = 20;
const PADDING_Y = 20;
const ICON_BLOCK = 20;
const TEXT_GAP = 15;
const ITEM_GAP = 20;
const RADIUS = 16;

const getTextWidth = (text: string, fontSize: number, fontWeight: number): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * (fontSize * 0.6);
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  return ctx.measureText(text).width;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  fontSize = 15,
  textColor = '#2D4059',
}) => {
  const width = useMemo(() => {
    let maxText = 0;
    items.forEach(it => {
      const w = getTextWidth(it.label, fontSize, 400);
      if (w > maxText) maxText = w;
    });
    return Math.ceil(PADDING_X + ICON_BLOCK + TEXT_GAP + maxText + PADDING_X);
  }, [items, fontSize]);

  return (
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        width,
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 10001,
        paddingTop: PADDING_Y,
        paddingBottom: PADDING_Y,
        paddingLeft: PADDING_X,
        paddingRight: PADDING_X,
        boxSizing: 'border-box',
      }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, idx) => {
        const isDisabled = !!item.disabled;
        const iw = item.iconWidth ?? ICON_BLOCK;
        const ih = item.iconHeight ?? ICON_BLOCK;
        return (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              if (isDisabled) return;
              item.onClick();
            }}
            style={{
              width: '100%',
              height: ICON_BLOCK,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginBottom: idx < items.length - 1 ? ITEM_GAP : 0,
              opacity: isDisabled ? 0.4 : 1,
            }}
          >
            <div
              style={{
                width: ICON_BLOCK,
                height: ICON_BLOCK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={item.icon}
                alt=""
                style={{
                  width: iw,
                  height: ih,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <span
              style={{
                marginLeft: TEXT_GAP,
                fontFamily: 'Inter, sans-serif',
                fontSize,
                fontWeight: 400,
                color: textColor,
                lineHeight: `${ICON_BLOCK}px`,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ContextMenu;