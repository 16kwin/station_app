// components/StationsPage/StationCell.tsx
import React, { useState, useEffect } from 'react';

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

// Импорт иконок для информации
import TMC from '../../assets/Station/TMC.svg';
import SGD from '../../assets/Station/SGD.svg';
import OK from '../../assets/Station/OK.svg';
import CHAIN from '../../assets/Station/CHAIN.svg';

// Импорт иконок для конфигурации
import Config1 from '../../assets/Station/Config1.svg';
import Config2 from '../../assets/Station/Config2.svg';
import Config3 from '../../assets/Station/Config3.svg';
import Config4 from '../../assets/Station/Config4.svg';

// Импорт иконок для статусов
import KRIT from '../../assets/Station/KRIT.svg';
import KRIT2 from '../../assets/Station/KRIT2.svg';

interface StationCellProps {
  uid?: string;
  name?: string;
  workshop?: string;
  section?: string;
  status?: string;
  stationType?: string;
  parentUid?: string | null;
  hasError?: boolean;
  isTmc?: boolean;
  isSgd?: boolean;
  isOk?: boolean;
  filledCellsPercent?: number;
  remainingNomenclaturePercent?: number;
  readyPartsPercent?: number;
  totalCells?: number;
  filledCells?: number;
  templateNomenclatureCount?: number;
  remainingNomenclatureCount?: number;
  maxReadyParts?: number;
  readyPartsCount?: number;
}

type CardSide = 'front' | 'back1' | 'back2';

const StationCell: React.FC<StationCellProps> = ({
  uid,
  name,
  workshop,
  section,
  status,
  stationType,
  parentUid,
  hasError = false,
  isTmc,
  isSgd,
  isOk,
  filledCellsPercent = 0,
  remainingNomenclaturePercent = 0,
  readyPartsPercent = 0,
  totalCells = 0,
  filledCells = 0,
  templateNomenclatureCount = 0,
  remainingNomenclatureCount = 0,
  maxReadyParts = 0,
  readyPartsCount = 0,
}) => {
  const [side, setSide] = useState<CardSide>('front');
  const [displaySide, setDisplaySide] = useState<CardSide>('front');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showWorkshopTooltip, setShowWorkshopTooltip] = useState(false);
  
  // Состояния для анимированных процентов
  const [animatedFilled, setAnimatedFilled] = useState(0);
  const [animatedRemaining, setAnimatedRemaining] = useState(0);
  const [animatedReady, setAnimatedReady] = useState(0);
  
  // Состояние для начала анимации
  const [startAnimation, setStartAnimation] = useState(false);

  // Задержка перед началом анимации
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Анимация процентов
  useEffect(() => {
    if (!startAnimation) return;
    
    const duration = 1000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedFilled(filledCellsPercent * progress);
      setAnimatedRemaining(remainingNomenclaturePercent * progress);
      setAnimatedReady(readyPartsPercent * progress);
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedFilled(filledCellsPercent);
        setAnimatedRemaining(remainingNomenclaturePercent);
        setAnimatedReady(readyPartsPercent);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [startAnimation, filledCellsPercent, remainingNomenclaturePercent, readyPartsPercent]);

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
      case 'CRITICAL_STOCK': return '#FF3052';
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
      case 'CRITICAL_STOCK': return '#FFDAE0';
      default: return '#E2E2E2';
    }
  };

  const handleFlipLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newSide = side === 'front' ? 'back1' : 'front';
    setSide(newSide);
    
    if (side === 'front') {
      setDisplaySide(newSide);
      setIsAnimating(false);
    } else {
      setTimeout(() => {
        setDisplaySide(newSide);
        setIsAnimating(false);
      }, 600);
    }
  };

  const handleFlipRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newSide = side === 'front' ? 'back2' : 'front';
    setSide(newSide);
    
    if (side === 'front') {
      setDisplaySide(newSide);
      setIsAnimating(false);
    } else {
      setTimeout(() => {
        setDisplaySide(newSide);
        setIsAnimating(false);
      }, 600);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSide('front');
    
    setTimeout(() => {
      setDisplaySide('front');
      setIsAnimating(false);
    }, 600);
  };

  const getContainerTransform = () => {
    switch (side) {
      case 'front': return 'rotateY(0deg)';
      case 'back1': return 'rotateY(180deg)';
      case 'back2': return 'rotateY(-180deg)';
      default: return 'rotateY(0deg)';
    }
  };

  const arrows = getArrows();
  const displayName = name || uid || '—';
  const workshopSectionText = `${workshop || '—'} ${section || '—'}`;

  // Вычисляем данные для отображения
  const overNorm = templateNomenclatureCount > 0 ? Math.max(0, templateNomenclatureCount - remainingNomenclatureCount) : 0;

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
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={Icon1}
            alt=""
            style={{
              width: '17px',
              height: '8px',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
              marginLeft: '3px',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedFilled, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <div
            style={{
              marginLeft: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {Math.round(animatedFilled)}%
          </div>
        </div>

        {/* Прогресс бар 2 */}
        <div
          style={{
            width: '184px',
            height: '15px',
            position: 'relative',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={Icon2}
            alt=""
            style={{
              width: '15px',
              height: '14px',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
              marginLeft: '5px',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedRemaining, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <div
            style={{
              marginLeft: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {Math.round(animatedRemaining)}%
          </div>
        </div>

        {/* Прогресс бар 3 */}
        <div
          style={{
            width: '184px',
            height: '15px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={Icon3}
            alt=""
            style={{
              width: '9px',
              height: '15px',
              marginLeft: '3px',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              width: '130px',
              height: '8px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '4px',
              marginLeft: '8px',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedReady, 100)}%`,
                height: '8px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '4px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <div
            style={{
              marginLeft: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6C7A8B',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {Math.round(animatedReady)}%
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
          console.log('Пополнить');
        }}
      >
        Пополнить
      </button>

      {/* Индикаторы статуса и ошибки */}
      {status === 'MINIMAL_STOCK' && (
        <img
          src={KRIT}
          alt="krit"
          style={{
            position: 'absolute',
            left: '10px',
            top: '41px',
            width: '21px',
            height: '19px',
            zIndex: 2,
          }}
        />
      )}
      
      {status === 'CRITICAL_STOCK' && (
        <img
          src={KRIT2}
          alt="krit2"
          style={{
            position: 'absolute',
            left: '10px',
            top: '41px',
            width: '21px',
            height: '19px',
            zIndex: 2,
          }}
        />
      )}
      
      {hasError && (
        <img
          src={ERR}
          alt="error"
          style={{
            position: 'absolute',
            left: '10px',
            top: (status === 'MINIMAL_STOCK' || status === 'CRITICAL_STOCK') ? '70px' : '41px',
            width: '21px',
            height: '19px',
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
        paddingTop: '9px',
      }}
    >
      {/* Заголовок Информация */}
      <div
        style={{
          color: getStatusColor(),
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0px',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Информация
      </div>
      
      {/* Название станции */}
      <div
        style={{
          maxWidth: '184px',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: '10px',
        }}
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
      </div>
      
      {/* Иконки */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '15px',
        }}
      >
        {isTmc && <img src={TMC} alt="TMC" style={{ width: '30px', height: '17px' }} />}
        {isSgd && <img src={SGD} alt="SGD" style={{ width: '30px', height: '17px' }} />}
        {isOk && <img src={OK} alt="OK" style={{ width: '30px', height: '17px' }} />}
        {parentUid && <img src={CHAIN} alt="CHAIN" style={{ width: '30px', height: '17px' }} />}
      </div>
      
      {/* Данные */}
      <div
        style={{
          width: '100%',
          paddingLeft: '15px',
          paddingRight: '27px',
          boxSizing: 'border-box',
        }}
      >
        {/* ТМЦ в станции */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '17px',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
              lineHeight: '17px',
            }}
          >
            ТМЦ в станции
          </span>
          <div
            style={{
              width: '40px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0px',
                color: '#2D4059',
                lineHeight: '17px',
              }}
            >
              {totalCells}
            </span>
          </div>
        </div>
        
        {/* Выдано ТМЦ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '17px',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
              lineHeight: '17px',
            }}
          >
            Выдано ТМЦ
          </span>
          <div
            style={{
              width: '40px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0px',
                color: '#2D4059',
                lineHeight: '17px',
              }}
            >
              {filledCells}
            </span>
          </div>
        </div>
        
        {/* Выдано сверхнормы */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '17px',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
              whiteSpace: 'nowrap',
              lineHeight: '17px',
            }}
          >
            Выдано сверхнормы
          </span>
          <div
            style={{
              width: '40px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0px',
                color: '#2D4059',
                lineHeight: '17px',
              }}
            >
              {overNorm}
            </span>
          </div>
        </div>
        
        {/* Готовые детали */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '17px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
              lineHeight: '17px',
            }}
          >
            Готовые детали
          </span>
          <div
            style={{
              width: '40px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0px',
                color: '#2D4059',
                lineHeight: '17px',
              }}
            >
              {readyPartsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка Аналитика */}
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
          console.log('Аналитика');
        }}
      >
        Аналитика
      </button>
    </div>
  );

  // Контент для back2
  const renderBack2 = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        paddingTop: '9px',
      }}
    >
      {/* Заголовок Конфигурация */}
      <div
        style={{
          color: getStatusColor(),
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0px',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Конфигурация
      </div>
      
      {/* Название станции */}
      <div
        style={{
          maxWidth: '184px',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: '1px',
        }}
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
      </div>
      
      {/* Цех и Участок */}
      <div
        style={{
          maxWidth: '184px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
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
      </div>
      
      {/* Меню конфигурации */}
      <div
        style={{
          width: '100%',
          paddingLeft: '60px',
          paddingRight: '10px',
          boxSizing: 'border-box',
          marginTop: '23px',
        }}
      >
        {/* Шаблоны загрузки */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '28px',
            position: 'relative',
          }}
        >
          <img
            src={Config1}
            alt=""
            style={{
              position: 'absolute',
              left: '-33px',
              width: '21px',
              height: '21px',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
            }}
          >
            Шаблоны загрузки
          </span>
        </div>
        
        {/* Карта загрузки */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '28px',
            position: 'relative',
          }}
        >
          <img
            src={Config2}
            alt=""
            style={{
              position: 'absolute',
              left: '-33px',
              width: '21px',
              height: '16px',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
            }}
          >
            Карта загрузки
          </span>
        </div>
        
        {/* Отчет движения ТМЦ/деталей */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '28px',
            position: 'relative',
          }}
        >
          <img
            src={Config3}
            alt=""
            style={{
              position: 'absolute',
              left: '-33px',
              width: '21px',
              height: '21px',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
              lineHeight: '16px',
            }}
          >
            Отчет движения<br />ТМЦ/деталей
          </span>
        </div>
        
        {/* Настройки станций */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <img
            src={Config4}
            alt=""
            style={{
              position: 'absolute',
              left: '-33px',
              width: '21px',
              height: '21px',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0px',
              color: '#2D4059',
            }}
          >
            Настройки станций
          </span>
        </div>
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
          transform: getContainerTransform(),
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
            zIndex: displaySide === 'front' ? 2 : 1,
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
            zIndex: displaySide === 'back1' ? 2 : 1,
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
            zIndex: displaySide === 'back2' ? 2 : 1,
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