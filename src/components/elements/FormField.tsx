// FormField.tsx — ИСПРАВЛЕННЫЙ (без заголовка в дропдауне, просто список и кнопка "Весь список")
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import CloseIcon18Blue from '../../assets/Icons/CloseIcons/CloseIcon18Blue.svg';
import PopupIcon16Blue from '../../assets/Icons/PopupIcons/PopupIcon16Blue.svg';
import PopupIcon16Gray from '../../assets/Icons/PopupIcons/PopupIcon16Gray.svg';
import CalendarIcon16Blue from '../../assets/Icons/CalendarIcons/CalendarIcon16Blue.svg';
import CalendarIcon16Gray from '../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import CalendarIcon14Blue from '../../assets/Icons/CalendarIcons/CalendarIcon14Blue.svg';
import CalendarIcon14Gray from '../../assets/Icons/CalendarIcons/CalendarIcon14Gray.svg';

export interface FormFieldProps {
  width: number;
  height: number;
  label?: string;
  icon?: string;
  iconActive?: string;
  value: string;
  placeholder?: string;
  active?: boolean;
  type: 'input' | 'select' | 'display' | 'calendar';
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onClick?: () => void;
  onCalendarClick?: () => void;
  inputType?: string;
  selectIconWidth?: number;
  selectIconHeight?: number;
  iconWidth?: number;
  iconHeight?: number;
  searchOptions?: { uid: string; name: string }[];
  onSelectOption?: (uid: string, name: string) => void;
  onOpenFullList?: () => void;
  searchTitle?: string;
  searchNotFoundText?: string;
  disabled?: boolean;
  labelMarginBottom?: number;
}

const DROPDOWN_OFFSET = 8;
const DROPDOWN_PADDING_TOP = 15;
const DROPDOWN_ITEM_HEIGHT = 17;
const DROPDOWN_ITEM_GAP = 15;
const DROPDOWN_BTN_GAP = 20;
const DROPDOWN_BTN_HEIGHT = 34;
const DROPDOWN_HORIZONTAL_PADDING = 40;
const DROPDOWN_MAX_WIDTH = 500;
const MAX_VISIBLE_ITEMS = 5;

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ backgroundColor: 'rgba(102, 110, 254, 0.2)', color: '#2D4059' }}>{text.slice(idx, idx + highlight.length)}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
};

const FormField: React.FC<FormFieldProps> = ({
  width,
  height,
  label,
  icon,
  iconActive,
  value,
  placeholder,
  active,
  type,
  onChange,
  onClear,
  onClick,
  onCalendarClick,
  inputType = 'text',
  selectIconWidth = 14.5,
  selectIconHeight = 18,
  iconWidth = 20,
  iconHeight = 20,
  searchOptions = [],
  onSelectOption,
  onOpenFullList,
  searchTitle = 'Найденная',
  searchNotFoundText = 'не найдены',
  disabled = false,
  labelMarginBottom = 4,
}) => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = active ?? (value.length > 0 || isSearchMode);
  const iconSrc = isActive && iconActive ? iconActive : icon;

  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return [];
    const q = searchValue.toLowerCase();
    return searchOptions.filter(opt => opt.name.toLowerCase().includes(q));
  }, [searchOptions, searchValue]);

  const visibleOptions = filteredOptions.slice(0, MAX_VISIBLE_ITEMS);

  const getDropdownHeight = useCallback((): number => {
    let h = DROPDOWN_PADDING_TOP;
    
    if (filteredOptions.length === 0) {
      h += DROPDOWN_ITEM_HEIGHT;
    } else {
      visibleOptions.forEach(() => {
        h += DROPDOWN_ITEM_HEIGHT + DROPDOWN_ITEM_GAP;
      });
      h -= DROPDOWN_ITEM_GAP;
    }
    
    h += DROPDOWN_BTN_GAP + DROPDOWN_BTN_HEIGHT;
    h += DROPDOWN_PADDING_TOP;
    
    return h;
  }, [filteredOptions.length, visibleOptions.length]);

  const getDropdownWidth = useCallback((): number => {
    const minWidth = width;
    
    if (filteredOptions.length === 0) return minWidth;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return minWidth;
    ctx.font = '500 14px Inter, sans-serif';
    
    let maxTextWidth = 0;
    visibleOptions.forEach(opt => {
      const textWidth = ctx.measureText(opt.name).width;
      if (textWidth > maxTextWidth) maxTextWidth = textWidth;
    });
    
    const calculated = maxTextWidth + DROPDOWN_HORIZONTAL_PADDING * 2;
    return Math.min(Math.max(calculated, minWidth), DROPDOWN_MAX_WIDTH);
  }, [width, filteredOptions.length, visibleOptions]);

  const updateDropdownPosition = useCallback(() => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const dropdownWidth = getDropdownWidth();
    
    const left = rect.left + rect.width / 2 - dropdownWidth / 2;
    const top = rect.bottom + DROPDOWN_OFFSET;
    
    setDropdownPosition({ top, left, width: dropdownWidth });
  }, [getDropdownWidth]);

  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showDropdown, updateDropdownPosition, visibleOptions]);

  useEffect(() => {
    if (isSearchMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchMode, filteredOptions]);

  const handleClickOutside = (e: MouseEvent) => {
    if (outerRef.current && !outerRef.current.contains(e.target as Node)) {
      setIsSearchMode(false);
      setShowDropdown(false);
      setSearchValue('');
    }
  };

  const handleFieldClick = () => {
    if (disabled) return;
    if (type === 'select') {
      setIsSearchMode(true);
      setSearchValue('');
      setShowDropdown(false);
    } else if (type === 'calendar') {
      onCalendarClick?.();
    }
  };

  const handleRightIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (type === 'select' && onOpenFullList) {
      onOpenFullList();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (e.target.value.trim()) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleOptionClick = (uid: string, name: string) => {
    onSelectOption?.(uid, name);
    setIsSearchMode(false);
    setShowDropdown(false);
    setSearchValue('');
  };

  const handleTooltipEnter = (e: React.MouseEvent, text: string) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollWidth > target.clientWidth) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
      }, 400);
    }
  };

  const handleTooltipLeave = () => {
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setTooltip(null);
  };

  const fieldStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 14,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    boxSizing: 'border-box',
    border: disabled
      ? '1px solid rgba(102, 110, 254, 0.6)'
      : isActive
      ? '1px solid #666EFE'
      : '1px solid #A0A3BD',
    cursor: disabled ? 'not-allowed' : type === 'select' || type === 'calendar' ? 'pointer' : 'default',
  };

  const textColor = disabled
    ? 'rgba(102, 110, 254, 0.6)'
    : isActive
    ? '#666EFE'
    : '#A0A3BD';

  const renderSelectContent = () => {
    if (isSearchMode) {
      return (
        <>
          <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
            {iconSrc ? (
              <img src={iconSrc} alt="" style={{ width: selectIconWidth, height: selectIconHeight, opacity: 1 }} />
            ) : (
              <div style={{ width: selectIconWidth, height: selectIconHeight, backgroundColor: 'red', borderRadius: 2 }} />
            )}
          </div>
          <input
            type="text"
            autoFocus
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: '#666EFE',
              backgroundColor: 'transparent',
              minWidth: 0,
            }}
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Поиск..."
          />
          <div 
            style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8, cursor: 'pointer' }}
            onClick={handleRightIconClick}
          >
            <img src={isActive ? PopupIcon16Blue : PopupIcon16Gray} alt="" style={{ width: 16, height: 4 }} />
          </div>
        </>
      );
    }

    return (
      <>
        <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
          {iconSrc ? (
            <img src={iconSrc} alt="" style={{ width: selectIconWidth, height: selectIconHeight, opacity: disabled ? 0.6 : 1 }} />
          ) : (
            <div style={{ width: selectIconWidth, height: selectIconHeight, backgroundColor: 'red', borderRadius: 2, opacity: disabled ? 0.6 : 1 }} />
          )}
        </div>
        <span
          style={{
            color: textColor,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
          onMouseEnter={(e) => handleTooltipEnter(e, value)}
          onMouseLeave={handleTooltipLeave}
        >
          {value || placeholder || 'Выберите'}
        </span>
        <div 
          style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}
          onClick={handleRightIconClick}
        >
          <img src={isActive ? PopupIcon16Blue : PopupIcon16Gray} alt="" style={{ width: 16, height: 4, opacity: disabled ? 0.6 : 1 }} />
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'display':
        return (
          <span style={{ color: textColor, opacity: value ? 1 : 0.5 }}>
            {value || '—'}
          </span>
        );

      case 'input':
        return (
          <>
            <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
              {iconSrc ? (
                <img src={iconSrc} alt="" style={{ width: iconWidth, height: iconHeight, opacity: disabled ? 0.6 : 1 }} />
              ) : (
                <div style={{ width: iconWidth, height: iconHeight, backgroundColor: 'red', borderRadius: 2, opacity: disabled ? 0.6 : 1 }} />
              )}
            </div>
            <input
              type={inputType}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: textColor,
                backgroundColor: 'transparent',
                minWidth: 0,
                cursor: disabled ? 'not-allowed' : 'default',
              }}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
            />
            {isActive && onClear && !disabled && (
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8, cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onClear(); }}
              >
                <img src={CloseIcon18Blue} alt="Очистить" style={{ width: 18, height: 18 }} />
              </div>
            )}
          </>
        );

      case 'calendar':
        return (
          <>
            <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
              {iconSrc ? (
                <img src={iconSrc} alt="" style={{ width: 16, height: 18, opacity: disabled ? 0.6 : 1 }} />
              ) : (
                <div style={{ width: 16, height: 18, backgroundColor: 'red', borderRadius: 2, opacity: disabled ? 0.6 : 1 }} />
              )}
            </div>
            <span
              style={{
                color: textColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {value || placeholder || 'Выберите дату'}
            </span>
            <div
              style={{
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 8,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
              }}
              onClick={(e) => {
                if (!disabled) {
                  e.stopPropagation();
                  onCalendarClick?.();
                }
              }}
            >
              <img src={isActive ? CalendarIcon14Blue : CalendarIcon14Gray} alt="" style={{ width: 14, height: 16 }} />
            </div>
          </>
        );

      case 'select':
        return renderSelectContent();
    }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#2D4059',
    display: 'block',
    marginBottom: labelMarginBottom,
    lineHeight: '17px',
  };

  return (
    <div ref={outerRef}>
      {label && <span style={labelStyle}>{label}</span>}
      <div ref={fieldRef} style={fieldStyle} onClick={type === 'select' && !disabled ? handleFieldClick : undefined}>
        {renderContent()}
      </div>

      {createPortal(
        <AnimatePresence>
          {isSearchMode && showDropdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(102, 110, 254, 0.15)',
                zIndex: 10001,
              }}
            >
              <div style={{ paddingTop: DROPDOWN_PADDING_TOP, paddingLeft: 40, paddingRight: 40, paddingBottom: DROPDOWN_PADDING_TOP }}>
                {filteredOptions.length === 0 ? (
                  <div style={{ height: DROPDOWN_ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {searchNotFoundText}
                    </span>
                  </div>
                ) : (
                  visibleOptions.map((opt, idx) => (
                    <div 
                      key={opt.uid} 
                      style={{ 
                        height: DROPDOWN_ITEM_HEIGHT, 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        marginBottom: idx < visibleOptions.length - 1 ? DROPDOWN_ITEM_GAP : 0,
                      }}
                      onClick={() => handleOptionClick(opt.uid, opt.name)}
                    >
                      <span 
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onMouseEnter={(e) => handleTooltipEnter(e, opt.name)}
                        onMouseLeave={handleTooltipLeave}
                      >
                        <HighlightedText text={opt.name} highlight={searchValue} />
                      </span>
                    </div>
                  ))
                )}

                <div style={{ marginTop: DROPDOWN_BTN_GAP, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      onOpenFullList?.();
                      setIsSearchMode(false);
                      setShowDropdown(false);
                      setSearchValue('');
                    }}
                    style={{
                      width: 126,
                      height: DROPDOWN_BTN_HEIGHT,
                      borderRadius: 8,
                      backgroundColor: '#666EFE',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#FFFFFF',
                    }}
                  >
                    Весь список
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%)',
                backgroundColor: '#2D4059',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                zIndex: 10002,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default FormField;