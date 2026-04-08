// components/StationsPage/StationCell.tsx
import React, { useState } from 'react';

// Импорт фонов
import SectionCard1 from '../../assets/Station/StationCard1.svg';
import SectionCard2 from '../../assets/Station/StationCard2.svg';
import SectionCard3 from '../../assets/Station/StationCard3.svg';
import SectionCard4 from '../../assets/Station/StationCard4.svg';

// Импорт стрелок для WORKING
import ArrowLeft1 from '../../assets/Station/arrow-left1.svg';
import ArrowRight1 from '../../assets/Station/arrow-right1.svg';
import ArrowBack1 from '../../assets/Station/arrow-back1.svg';

// Импорт стрелок для OFFLINE
import ArrowLeft2 from '../../assets/Station/arrow-left2.svg';
import ArrowRight2 from '../../assets/Station/arrow-right2.svg';
import ArrowBack2 from '../../assets/Station/arrow-back2.svg';

// Импорт стрелок для MINIMAL_STOCK
import ArrowLeft3 from '../../assets/Station/arrow-left3.svg';
import ArrowRight3 from '../../assets/Station/arrow-right3.svg';
import ArrowBack3 from '../../assets/Station/arrow-back3.svg';

// Импорт стрелок для CRITICAL_STOCK
import ArrowLeft4 from '../../assets/Station/arrow-left4.svg';
import ArrowRight4 from '../../assets/Station/arrow-right4.svg';
import ArrowBack4 from '../../assets/Station/arrow-back4.svg';

// Импорт фонов для блока станции
import FonStation1 from '../../assets/Station/FonStation1.svg';
import FonStation2 from '../../assets/Station/FonStation2.svg';
import FonStation3 from '../../assets/Station/FonStation3.svg';
import FonStation4 from '../../assets/Station/FonStation4.svg';

// Импорт картинки станции
import Station from '../../assets/Station/Station.svg';

// Импорт иконок для прогресс-баров
import Icon1 from '../../assets/Station/Icon1.svg';
import Icon2 from '../../assets/Station/Icon2.svg';
import Icon3 from '../../assets/Station/Icon3.svg';

// Импорт иконки ошибки
import ERR from '../../assets/Station/ERR.svg';

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
  hasError = false,
  isTmc,
  isSgd,
  isOk,
  filledCellsPercent = 0,
  remainingNomenclaturePercent = 0,
  readyPartsPercent = 0,
}) => {
  const [side, setSide] = useState<CardSide>('front');
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showWorkshopTooltip, setShowWorkshopTooltip] = useState(false);

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

  // Определение стрелок в зависимости от статуса
  const getArrows = () => {
    switch (status) {
      case 'WORKING': 
        return { left: ArrowLeft1, right: ArrowRight1, back: ArrowBack1 };
      case 'OFFLINE': 
        return { left: ArrowLeft2, right: ArrowRight2, back: ArrowBack2 };
      case 'MINIMAL_STOCK': 
        return { left: ArrowLeft3, right: ArrowRight3, back: ArrowBack3 };
      case 'CRITICAL_STOCK': 
        return { left: ArrowLeft4, right: ArrowRight4, back: ArrowBack4 };
      default: 
        return { left: ArrowLeft2, right: ArrowRight2, back: ArrowBack2 };
    }
  };

  // Определение фона для блока станции
  const getFonStation = () => {
    switch (status) {
      case 'WORKING': return FonStation1;
      case 'OFFLINE': return FonStation2;
      case 'MINIMAL_STOCK': return FonStation3;
      case 'CRITICAL_STOCK': return FonStation4;
      default: return FonStation2;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'WORKING': return '#666EFE';
      case 'OFFLINE': return '#777777';
      case 'MINIMAL_STOCK': return '#FDA373';
      case 'CRITICAL_STOCK': return '#1774FF'; // Исправлено с #FF3052
      default: return '#777777';
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

  const getProgressBarColor = () => {
    return status === 'OFFLINE' ? '#777777' : '#666EFE';
  };

  const getButtonColor = () => {
    switch (status) {
      case 'WORKING': return '#E8E9FF';
      case 'OFFLINE': return '#E2E2E2';
      case 'MINIMAL_STOCK': return '#FEE8DC';
      case 'CRITICAL_STOCK': return '#E8F0FE'; // Исправлено с #FFDAE0
      default: return '#E2E2E2';
    }
  };

  const handleFlipLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'front') {
      setSide('back1');
    } else {
      setSide('front');
    }
  };

  const handleFlipRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'front') {
      setSide('back2');
    } else {
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

  const arrows = getArrows();
  const displayName = name || uid || '—';
  const workshopSectionText = `${workshop || '—'} ${section || '—'}`;

  // Контент для front
  const renderFront = () => (
    <>
      {/* Блок с фоном статуса и картинкой станции */}
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '84px',
          height: '92px',
        }}
      >
        <img
          src={getFonStation()}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        
        <img
          src={Station}
          alt="Station"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '68px',
            height: '76px',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
      </div>

      {/* Контейнер для текстов */}
      <div
        style={{
          position: 'absolute',
          top: '111px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '184px',
        }}
      >
        {/* Название станции с тултипом */}
        <div
          style={{
            position: 'relative',
            maxWidth: '150px',
            marginBottom: '1px',
          }}
          onMouseEnter={() => setShowNameTooltip(true)}
          onMouseLeave={() => setShowNameTooltip(false)}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: '17px',
              lineHeight: '20px',
              color: '#2D4059',
              letterSpacing: '0px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            {displayName}
          </div>
          {showNameTooltip && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '4px',
                padding: '4px 8px',
                backgroundColor: 'rgba(45, 64, 89, 0.9)',
                color: '#FFFFFF',
                fontSize: '12px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {displayName}
            </div>
          )}
        </div>
        
        {/* Цех и Участок с тултипом */}
        <div
          style={{
            position: 'relative',
            maxWidth: '150px',
            marginBottom: '8px',
          }}
          onMouseEnter={() => setShowWorkshopTooltip(true)}
          onMouseLeave={() => setShowWorkshopTooltip(false)}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '16px',
              color: '#2D4059',
              opacity: 0.5,
              letterSpacing: '0px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            {workshopSectionText}
          </div>
          {showWorkshopTooltip && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '4px',
                padding: '4px 8px',
                backgroundColor: 'rgba(45, 64, 89, 0.9)',
                color: '#FFFFFF',
                fontSize: '12px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {workshopSectionText}
            </div>
          )}
        </div>

        {/* Статус */}
        <div
          style={{
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '16px',
            color: getStatusColor(),
            letterSpacing: '0px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            marginBottom: '4px',
          }}
        >
          {getStatusText()}
        </div>

        {/* Прогресс бар 1 */}
        <div
          style={{
            width: '184px',
            height: '15px',
            position: 'relative',
            marginBottom: '6px',
          }}
        >
          <img
            src={Icon1}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '17px',
              height: '8px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                width: `${Math.min(filledCellsPercent, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
            }}
          >
            {Math.round(filledCellsPercent)}%
          </div>
        </div>

        {/* Прогресс бар 2 */}
        <div
          style={{
            width: '184px',
            height: '15px',
            position: 'relative',
            marginBottom: '6px',
          }}
        >
          <img
            src={Icon2}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '15px',
              height: '14px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                width: `${Math.min(remainingNomenclaturePercent, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
            }}
          >
            {Math.round(remainingNomenclaturePercent)}%
          </div>
        </div>

        {/* Прогресс бар 3 */}
        <div
          style={{
            width: '184px',
            height: '15px',
            position: 'relative',
          }}
        >
          <img
            src={Icon3}
            alt=""
            style={{
              position: 'absolute',
              left: '3px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '9px',
              height: '15px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                width: `${Math.min(readyPartsPercent, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
            }}
          >
            {Math.round(readyPartsPercent)}%
          </div>
        </div>
      </div>

      {/* Кнопка Пополнить */}
      <button
        style={{
          position: 'absolute',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '164px',
          height: '30px',
          backgroundColor: getButtonColor(),
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: '#2D4059',
          letterSpacing: '0px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Заглушка
          console.log('Пополнить');
        }}
      >
        Пополнить
      </button>

      {/* Индикатор ошибки */}
      {hasError && (
        <img
          src={ERR}
          alt="error"
          style={{
            position: 'absolute',
            left: '10px',
            top: '41px',
            width: '21px',
            height: '13px',
            zIndex: 2,
          }}
        />
      )}
    </>
  );

  // Контент для back1
  const renderBack1 = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Заголовок Информация */}
      <div
        style={{
          position: 'absolute',
          top: '9px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#8F9CAB',
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0px',
          textAlign: 'center',
        }}
      >
        Информация
      </div>
      
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
                src={arrows.left} 
                alt="left" 
                style={{ 
                  width: '21px', 
                  height: '21px',
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
                src={arrows.right} 
                alt="right" 
                style={{ 
                  width: '22px', 
                  height: '17px',
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
                src={arrows.back} 
                alt="back" 
                style={{ 
                  width: '21px', 
                  height: '21px',
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
                src={arrows.back} 
                alt="back" 
                style={{ 
                  width: '21px', 
                  height: '21px',
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