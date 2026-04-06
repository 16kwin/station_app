// components/StationsPage/StationCell.tsx
import React, { useState } from 'react';

// Импорт фонов
import SectionCard1 from '../../assets/Station/StationCard1.svg';
import SectionCard2 from '../../assets/Station/StationCard2.svg';
import SectionCard3 from '../../assets/Station/StationCard3.svg';
import SectionCard4 from '../../assets/Station/StationCard4.svg';
import ArrowLeft from '../../assets/Station/arrow-left.svg';
import ArrowRight from '../../assets/Station/arrow-right.svg';
import ArrowBack from '../../assets/Station/arrow-back.svg';

interface StationCellProps {
  uid?: string;
  name?: string;
  workshop?: string;
  section?: string;
  status?: string;
  stationType?: string;
  hasError?: boolean;
  isTmc?: boolean;
  isSgd?: boolean;
  isOk?: boolean;
  filledCellsPercent?: number;
  remainingNomenclaturePercent?: number;
  readyPartsPercent?: number;
}

type CardSide = 'front' | 'back1' | 'back2';

const StationCell: React.FC<StationCellProps> = ({
  uid,
  name,
  workshop,
  section,
  status,
  stationType,
  isTmc,
  isSgd,
  isOk,
  filledCellsPercent,
  remainingNomenclaturePercent,
  readyPartsPercent,
}) => {
  const [side, setSide] = useState<CardSide>('front');

  // Определение фона в зависимости от статуса
  const getBackgroundImage = () => {
    switch (status) {
      case 'WORKING': return SectionCard1;
      case 'OFFLINE': return SectionCard2;
      case 'MINIMAL_STOCK': return SectionCard3;
      case 'CRITICAL_STOCK': return SectionCard4;
      default: return SectionCard2;
    }
  };

  // Определение цвета кнопок в зависимости от статуса
  const getButtonColor = () => {
    switch (status) {
      case 'WORKING': return '#666EFE';
      case 'OFFLINE': return '#777777';
      case 'MINIMAL_STOCK': return '#FDA373';
      case 'CRITICAL_STOCK': return '#FF3052';
      default: return '#777777';
    }
  };

  // Определение цвета статуса (для текста)
  const getStatusColor = () => {
    switch (status) {
      case 'WORKING': return '#4CAF50';
      case 'OFFLINE': return '#9E9E9E';
      case 'MINIMAL_STOCK': return '#FFC107';
      case 'CRITICAL_STOCK': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'WORKING': return 'В работе';
      case 'OFFLINE': return 'Не в сети';
      case 'MINIMAL_STOCK': return 'Минимальный остаток';
      case 'CRITICAL_STOCK': return 'Критический остаток';
      default: return status || '—';
    }
  };

  const handleFlipLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'front') {
      setSide('back1');
    } else if (side === 'back1') {
      setSide('front');
    } else if (side === 'back2') {
      setSide('front');
    }
  };

  const handleFlipRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'front') {
      setSide('back2');
    } else if (side === 'back1') {
      setSide('front');
    } else if (side === 'back2') {
      setSide('front');
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSide('front');
  };

  const getRotationY = () => {
    switch (side) {
      case 'front': return '0deg';
      case 'back1': return '180deg';
      case 'back2': return '-180deg';
      default: return '0deg';
    }
  };

  const buttonColor = getButtonColor();

  // Контент для front
  const renderFront = () => (
    <>
      {/* Название станции */}
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#2D4059',
          marginBottom: '8px',
          marginTop: '20px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name || uid || '—'}
      </div>
      
      {/* UID */}
      <div
        style={{
          fontSize: '10px',
          color: '#8E9EAD',
          marginBottom: '8px',
        }}
      >
        UID: {uid || '—'}
      </div>
      
      {/* Цех / Участок */}
      <div
        style={{
          fontSize: '11px',
          color: '#5A6E82',
          marginBottom: '4px',
        }}
      >
        {workshop || '—'} / {section || '—'}
      </div>
      
      {/* Статус */}
      <div
        style={{
          fontSize: '11px',
          color: getStatusColor(),
          marginBottom: '8px',
          fontWeight: '500',
        }}
      >
        {getStatusText()}
      </div>
      
      {/* Проценты */}
      <div
        style={{
          fontSize: '10px',
          color: '#5A6E82',
          marginTop: '4px',
        }}
      >
        <div>Заполнено ячеек: {filledCellsPercent?.toFixed(1) || '—'}%</div>
        <div>Остаток номенклатуры: {remainingNomenclaturePercent?.toFixed(1) || '—'}%</div>
        <div>Готовых деталей: {readyPartsPercent?.toFixed(1) || '—'}%</div>
      </div>
      
      {/* Тип станции */}
      <div
        style={{
          fontSize: '9px',
          color: '#8E9EAD',
          marginTop: '8px',
          position: 'absolute',
          bottom: '8px',
          left: '12px',
        }}
      >
        {stationType === 'DRUM_TYPE' && 'Инструментальная барабанного типа'}
        {stationType === 'POSTAMAT_TYPE' && 'Универсальная постаматного типа'}
        {stationType === 'ADDITIONAL_MODULE' && 'Дополнительный модуль'}
      </div>
      
      {/* Флаги ТМЦ/СГД/ОК */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          display: 'flex',
          gap: '4px',
          fontSize: '8px',
        }}
      >
        {isTmc && <span style={{ color: '#666EFE' }}>ТМЦ</span>}
        {isSgd && <span style={{ color: '#4CAF50' }}>СГД</span>}
        {isOk && <span style={{ color: '#FF9800' }}>ОК</span>}
      </div>
    </>
  );

  // Контент для back1
  const renderBack1 = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2D4059', textAlign: 'center' }}>
        Дополнительные данные 1
      </div>
      <div style={{ fontSize: '12px', color: '#5A6E82', marginTop: '8px', textAlign: 'center' }}>
        Здесь будет информация для back1
      </div>
    </div>
  );

  // Контент для back2
  const renderBack2 = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2D4059', textAlign: 'center' }}>
        Дополнительные данные 2
      </div>
      <div style={{ fontSize: '12px', color: '#5A6E82', marginTop: '8px', textAlign: 'center' }}>
        Здесь будет информация для back2
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '220px',
        height: '295px',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'visible',
        perspective: '1000px',
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${getRotationY()})`,
          backgroundColor: 'transparent',
        }}
      >
        {/* Front сторона */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <img
            src={getBackgroundImage()}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '12px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'transparent',
            }}
          >
            {/* Левая стрелка */}
            <button
              onClick={handleFlipLeft}
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                width: '21px',
                height: '21px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                padding: 0,
              }}
            >
              <img 
                src={ArrowLeft} 
                alt="left" 
                style={{ 
                  width: '21px', 
                  height: '21px',
                  filter: `brightness(0) saturate(100%) invert(39%) sepia(89%) saturate(1236%) hue-rotate(${
                    status === 'WORKING' ? '200deg' : 
                    status === 'OFFLINE' ? '0deg' : 
                    status === 'MINIMAL_STOCK' ? '30deg' : '320deg'
                  }) brightness(1)`
                }} 
              />
            </button>

            {/* Правая стрелка */}
            <button
              onClick={handleFlipRight}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                width: '22px',
                height: '17px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                padding: 0,
              }}
            >
              <img 
                src={ArrowRight} 
                alt="right" 
                style={{ 
                  width: '22px', 
                  height: '17px',
                  filter: `brightness(0) saturate(100%) invert(39%) sepia(89%) saturate(1236%) hue-rotate(${
                    status === 'WORKING' ? '200deg' : 
                    status === 'OFFLINE' ? '0deg' : 
                    status === 'MINIMAL_STOCK' ? '30deg' : '320deg'
                  }) brightness(1)`
                }} 
              />
            </button>
            
            {renderFront()}
          </div>
        </div>

        {/* Back1 сторона */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: 'transparent',
          }}
        >
          <img
            src={getBackgroundImage()}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '12px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'transparent',
            }}
          >
            {/* Стрелка назад */}
            <button
              onClick={handleBack}
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                width: '21px',
                height: '21px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                padding: 0,
              }}
            >
              <img 
                src={ArrowBack} 
                alt="back" 
                style={{ 
                  width: '21px', 
                  height: '21px',
                  filter: `brightness(0) saturate(100%) invert(39%) sepia(89%) saturate(1236%) hue-rotate(${
                    status === 'WORKING' ? '200deg' : 
                    status === 'OFFLINE' ? '0deg' : 
                    status === 'MINIMAL_STOCK' ? '30deg' : '320deg'
                  }) brightness(1)`
                }} 
              />
            </button>
            
            {renderBack1()}
          </div>
        </div>

        {/* Back2 сторона */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            transform: 'rotateY(-180deg)',
            backgroundColor: 'transparent',
          }}
        >
          <img
            src={getBackgroundImage()}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '12px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'transparent',
            }}
          >
            {/* Стрелка назад */}
            <button
              onClick={handleBack}
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                width: '21px',
                height: '21px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                padding: 0,
              }}
            >
              <img 
                src={ArrowBack} 
                alt="back" 
                style={{ 
                  width: '21px', 
                  height: '21px',
                  filter: `brightness(0) saturate(100%) invert(39%) sepia(89%) saturate(1236%) hue-rotate(${
                    status === 'WORKING' ? '200deg' : 
                    status === 'OFFLINE' ? '0deg' : 
                    status === 'MINIMAL_STOCK' ? '30deg' : '320deg'
                  }) brightness(1)`
                }} 
              />
            </button>
            
            {renderBack2()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationCell;