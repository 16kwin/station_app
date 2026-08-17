// Checkbox.tsx — круглый чекбокс (как в DataTable)
import React from 'react';
import CheckboxIcon18OnBlue from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OnBlue.svg';
import CheckboxIcon18OffBlack from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffBlack.svg';
import CheckboxIcon18OffGray from '../../assets/Icons/СheckboxIcons/СheckboxIcon18OffGray.svg';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: number;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  size = 18,
  disabled = false,
}) => {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={checked ? CheckboxIcon18OnBlue : CheckboxIcon18OffBlack}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default Checkbox;