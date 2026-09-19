// SchablonProgressBar.tsx — ПОЛНЫЙ ФАЙЛ (убран onClick, переключение по клику)
import React from 'react';
import ProgressBarIcon18Blue1 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Blue1.svg';
import ProgressBarIcon18Gray1 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Gray1.svg';
import ProgressBarIcon18Blue2 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Blue2.svg';
import ProgressBarIcon18Gray2 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Gray2.svg';
import ProgressBarIcon18Blue3 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Blue3.svg';
import ProgressBarIcon18Gray3 from '../../../assets/Icons/ProgressBarIcons/ProgressBarIcon18Gray3.svg';

interface SchablonProgressBarProps {
  currentStep: number;
}

const SchablonProgressBar: React.FC<SchablonProgressBarProps> = ({ currentStep }) => {
  const BAR_WIDTH = 477;
  const BAR_HEIGHT = 5;
  const BLOCK_HEIGHT = 67;

  const PIP_WIDTH = 4;
  const PIP_HEIGHT = 10;
  const PIP_RADIUS = 3;

  const ICON_SIZE = 18;
  const ICON_GAP = 5;
  const TEXT_GAP = 5;

  const pipPositions = [93, 231, 369];
  const fillPositions = [0, 162, 300, 477];

  const steps = [
    {
      labelLines: ['Шаблон загрузки'],
      iconInactive: ProgressBarIcon18Gray1,
      iconActive: ProgressBarIcon18Blue1,
    },
    {
      labelLines: ['Документ', 'Пополнение станции'],
      iconInactive: ProgressBarIcon18Gray2,
      iconActive: ProgressBarIcon18Blue2,
    },
    {
      labelLines: ['Загрузка станции'],
      iconInactive: ProgressBarIcon18Gray3,
      iconActive: ProgressBarIcon18Blue3,
    },
  ];

  const getPipColor = (index: number) => {
    if (index >= currentStep) return 'rgba(45, 64, 89, 0.25)';
    return '#666EFE';
  };

  const getLabelColor = (index: number) => {
    return index < currentStep ? '#666EFE' : 'rgba(45, 64, 89, 0.5)';
  };

  const fillWidth = fillPositions[currentStep];

  return (
    <div
      style={{
        width: BAR_WIDTH,
        height: BLOCK_HEIGHT,
        position: 'relative',
        flexShrink: 0,
        backgroundColor: 'transparent',
      }}
    >
      {pipPositions.map((pos, index) => (
        <img
          key={`icon-${index}`}
          src={index < currentStep ? steps[index].iconActive : steps[index].iconInactive}
          alt=""
          style={{
            position: 'absolute',
            left: pos - ICON_SIZE / 2,
            bottom: BAR_HEIGHT + PIP_HEIGHT + ICON_GAP,
            width: ICON_SIZE,
            height: ICON_SIZE,
          }}
        />
      ))}

      {pipPositions.map((pos, index) => {
        const step = steps[index];
        return (
          <div
            key={`label-${index}`}
            style={{
              position: 'absolute',
              left: pos,
              bottom: BAR_HEIGHT + PIP_HEIGHT + ICON_GAP + ICON_SIZE + TEXT_GAP,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {step.labelLines.map((line, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: getLabelColor(index),
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  lineHeight: '13px',
                }}
              >
                {line}
              </span>
            ))}
          </div>
        );
      })}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        backgroundColor: 'rgba(45, 64, 89, 0.15)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: fillWidth,
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        backgroundColor: '#666EFE',
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }} />

      {pipPositions.map((pos, index) => (
        <div key={`pip-${index}`} style={{
          position: 'absolute',
          left: pos - PIP_WIDTH / 2,
          bottom: BAR_HEIGHT,
          width: PIP_WIDTH,
          height: PIP_HEIGHT,
          borderTopLeftRadius: PIP_RADIUS,
          borderTopRightRadius: PIP_RADIUS,
          backgroundColor: getPipColor(index),
          transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
};

export default SchablonProgressBar;