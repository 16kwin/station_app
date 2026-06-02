// ProgressBar.tsx
import React, { useState } from 'react';
import BarIcon11 from '../../../assets/References/ProgressBar/BarIcon11.svg';
import BarIcon12 from '../../../assets/References/ProgressBar/BarIcon12.svg';
import BarIcon21 from '../../../assets/References/ProgressBar/BarIcon21.svg';
import BarIcon22 from '../../../assets/References/ProgressBar/BarIcon22.svg';
import BarIcon31 from '../../../assets/References/ProgressBar/BarIcon31.svg';
import BarIcon32 from '../../../assets/References/ProgressBar/BarIcon32.svg';
import BarIcon41 from '../../../assets/References/ProgressBar/BarIcon41.svg';
import BarIcon42 from '../../../assets/References/ProgressBar/BarIcon42.svg';

const ProgressBar: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const barWidth = 1121;
  const barHeight = 5;
  const pipWidth = 4;
  const pipHeight = 10;
  const pipRadius = 3;
  const gradientEnd = 416;

  const pipPositions = [120, 416, 668, 930];
  const fillPositions = [0, 147, 440, 700, 1121];

  const steps = [
    { label: 'Заполнение основных полей', iconInactive: BarIcon11, iconActive: BarIcon12, iconWidth: 18, iconHeight: 20 },
    { label: 'Достаточно для работы системы', iconInactive: BarIcon21, iconActive: BarIcon22, iconWidth: 20, iconHeight: 20 },
    { label: 'Достаточно для быстрых запросов на поставку', iconInactive: BarIcon31, iconActive: BarIcon32, iconWidth: 31, iconHeight: 21 },
    { label: 'Достаточно для полной аналитики', iconInactive: BarIcon41, iconActive: BarIcon42, iconWidth: 18, iconHeight: 20 },
  ];

  const handleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    let newStep = 0;
    for (let i = 0; i < pipPositions.length; i++) {
      if (x >= pipPositions[i]) {
        newStep = i + 1;
      }
    }
    setCurrentStep(newStep);
  };

  const getPipColor = (index: number) => {
    if (index >= currentStep) return 'rgba(45, 64, 89, 0.25)';
    const pos = pipPositions[index];
    if (pos <= gradientEnd) {
      const percent = pos / gradientEnd;
      if (percent <= 0.5) return '#666EFE';
      return '#2EB2C1';
    }
    return '#07E098';
  };

  const getLabelColor = (index: number) => {
    return index < currentStep ? '#2D4059' : 'rgba(45, 64, 89, 0.44)';
  };

  const fillWidth = fillPositions[currentStep];

  return (
    <div 
      onClick={handleClick}
      style={{ 
        width: barWidth,
        height: 85,
        position: 'relative',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      {/* Иконки и текст */}
      {pipPositions.map((pos, index) => (
        <div
          key={`icon-${index}`}
          style={{
            position: 'absolute',
            left: pos,
            bottom: barHeight + pipHeight + 6,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: getLabelColor(index),
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: '13px',
          }}>
            {steps[index].label}
          </span>
          <img 
            src={index < currentStep ? steps[index].iconActive : steps[index].iconInactive}
            alt=""
            style={{
              width: steps[index].iconWidth,
              height: steps[index].iconHeight,
            }}
          />
        </div>
      ))}

      {/* Фоновая линия */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: barWidth,
        height: barHeight,
        borderRadius: barHeight / 2,
        backgroundColor: 'rgba(45, 64, 89, 0.15)',
        pointerEvents: 'none',
      }} />

      {/* Заполненная линия */}
      {fillWidth > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: fillWidth,
          height: barHeight,
          borderRadius: barHeight / 2,
          background: `linear-gradient(90deg, #666EFE 0%, #2EB2C1 50%, #07E098 100%)`,
          backgroundSize: `${gradientEnd}px ${barHeight}px`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#07E098',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Пипки */}
      {pipPositions.map((pos, index) => (
        <div
          key={`pip-${index}`}
          style={{
            position: 'absolute',
            left: pos,
            bottom: barHeight,
            transform: 'translateX(-50%)',
            width: pipWidth,
            height: pipHeight,
            borderTopLeftRadius: pipRadius,
            borderTopRightRadius: pipRadius,
            backgroundColor: getPipColor(index),
            transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

export default ProgressBar;