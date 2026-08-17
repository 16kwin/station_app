// FormField.tsx — ПОЛНЫЙ ФАЙЛ (исправлены пути импортов)
import React from 'react';
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
  locked?: boolean;
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
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: '#2D4059',
  display: 'block',
  marginBottom: 4,
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
  locked,
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
}) => {
  const isActive = active ?? (value.length > 0);
  const iconSrc = isActive && iconActive ? iconActive : icon;

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
    border: locked
      ? '1px solid rgba(102, 110, 254, 0.6)'
      : isActive
      ? '1px solid #666EFE'
      : '1px solid #A0A3BD',
    cursor: locked ? 'not-allowed' : type === 'select' || type === 'calendar' ? 'pointer' : 'default',
  };

  const textColor = locked
    ? 'rgba(102, 110, 254, 0.6)'
    : isActive
    ? '#666EFE'
    : '#A0A3BD';

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
                <img src={iconSrc} alt="" style={{ width: iconWidth, height: iconHeight, opacity: locked ? 0.6 : 1 }} />
              ) : (
                <div style={{ width: iconWidth, height: iconHeight, backgroundColor: 'red', borderRadius: 2, opacity: locked ? 0.6 : 1 }} />
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
                cursor: locked ? 'not-allowed' : 'default',
              }}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={locked}
            />
            {isActive && onClear && !locked && (
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
                <img src={iconSrc} alt="" style={{ width: 16, height: 18, opacity: locked ? 0.6 : 1 }} />
              ) : (
                <div style={{ width: 16, height: 18, backgroundColor: 'red', borderRadius: 2, opacity: locked ? 0.6 : 1 }} />
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
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.6 : 1,
              }}
              onClick={(e) => {
                if (!locked) {
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
        return (
          <>
            <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 }}>
              {iconSrc ? (
                <img src={iconSrc} alt="" style={{ width: selectIconWidth, height: selectIconHeight, opacity: locked ? 0.6 : 1 }} />
              ) : (
                <div style={{ width: selectIconWidth, height: selectIconHeight, backgroundColor: 'red', borderRadius: 2, opacity: locked ? 0.6 : 1 }} />
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
              {value || placeholder || 'Выберите'}
            </span>
            <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>
              <img src={isActive ? PopupIcon16Blue : PopupIcon16Gray} alt="" style={{ width: 16, height: 4, opacity: locked ? 0.6 : 1 }} />
            </div>
          </>
        );
    }
  };

  return (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={fieldStyle} onClick={type === 'select' && !locked ? onClick : type === 'calendar' && !locked ? onCalendarClick : undefined}>
        {renderContent()}
      </div>
    </div>
  );
};

export default FormField;