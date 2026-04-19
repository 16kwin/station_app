// components/StationsPage/StationRow.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Импорт фонов для ряда
import Line1 from '../../assets/Station/Line1.svg';
import Line2 from '../../assets/Station/Line2.svg';
import Line3 from '../../assets/Station/Line3.svg';
import Line4 from '../../assets/Station/Line4.svg';

// Импорт иконок для статусов
import KRIT from '../../assets/Station/KRIT.svg';
import KRIT2 from '../../assets/Station/KRIT2.svg';
import ERR from '../../assets/Station/ERR2.svg';

// Импорт иконок для информации
import TMC from '../../assets/Station/TMC.svg';
import SGD from '../../assets/Station/SGD.svg';
import OK from '../../assets/Station/OK.svg';
import CHAIN from '../../assets/Station/CHAIN.svg';

// Импорт иконок для прогресс-баров
import Icon1 from '../../assets/Station/Icon1.svg';
import Icon2 from '../../assets/Station/Icon2.svg';
import Icon3 from '../../assets/Station/Icon3.svg';

// Импорт картинки станции
import Station from '../../assets/Station/Station.svg';

// Импорт фонов для блока станции
import FonStation1 from '../../assets/Station/FonStation1.svg';
import FonStation2 from '../../assets/Station/FonStation2.svg';
import FonStation3 from '../../assets/Station/FonStation3.svg';
import FonStation4 from '../../assets/Station/FonStation4.svg';

// Импорт иконок для кнопок справа
import Analytic1 from '../../assets/Station/Analitic1.svg';
import Analytic2 from '../../assets/Station/Analitic2.svg';
import Analytic3 from '../../assets/Station/Analitic3.svg';
import Analytic4 from '../../assets/Station/Analitic4.svg';
import ArrowRight1 from '../../assets/Station/arrow-right1.svg';
import ArrowRight2 from '../../assets/Station/arrow-right2.svg';
import ArrowRight3 from '../../assets/Station/arrow-right3.svg';
import ArrowRight4 from '../../assets/Station/arrow-right4.svg';

// Импорт иконок для конфигурации
import Config1_1 from '../../assets/Station/Config11.svg';
import Config1_2 from '../../assets/Station/Config12.svg';
import Config1_3 from '../../assets/Station/Config13.svg';
import Config1_4 from '../../assets/Station/Config14.svg';
import Config2_1 from '../../assets/Station/Config21.svg';
import Config2_2 from '../../assets/Station/Config22.svg';
import Config2_3 from '../../assets/Station/Config23.svg';
import Config2_4 from '../../assets/Station/Config24.svg';
import Config3_1 from '../../assets/Station/Config31.svg';
import Config3_2 from '../../assets/Station/Config32.svg';
import Config3_3 from '../../assets/Station/Config33.svg';
import Config3_4 from '../../assets/Station/Config34.svg';
import Config4_1 from '../../assets/Station/Config41.svg';
import Config4_2 from '../../assets/Station/Config42.svg';
import Config4_3 from '../../assets/Station/Config43.svg';
import Config4_4 from '../../assets/Station/Config44.svg';

// Импорт стрелок назад для конфигурации
import ArrowBack1 from '../../assets/Station/arrow-back1.svg';
import ArrowBack2 from '../../assets/Station/arrow-back2.svg';
import ArrowBack3 from '../../assets/Station/arrow-back3.svg';
import ArrowBack4 from '../../assets/Station/arrow-back4.svg';

interface StationRowProps {
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

const StationRow: React.FC<StationRowProps> = ({
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
  readyPartsCount = 0,
}) => {
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showWorkshopTooltip, setShowWorkshopTooltip] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  
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

  const getBackgroundImage = () => {
    switch (status) {
      case 'WORKING': return Line1;
      case 'OFFLINE': return Line2;
      case 'MINIMAL_STOCK': return Line3;
      case 'CRITICAL_STOCK': return Line4;
      default: return Line2;
    }
  };

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

  const getAnalyticIcon = () => {
    switch (status) {
      case 'WORKING': return Analytic1;
      case 'OFFLINE': return Analytic2;
      case 'MINIMAL_STOCK': return Analytic3;
      case 'CRITICAL_STOCK': return Analytic4;
      default: return Analytic2;
    }
  };

  const getArrowRightIcon = () => {
    switch (status) {
      case 'WORKING': return ArrowRight1;
      case 'OFFLINE': return ArrowRight2;
      case 'MINIMAL_STOCK': return ArrowRight3;
      case 'CRITICAL_STOCK': return ArrowRight4;
      default: return ArrowRight2;
    }
  };

  const getArrowBackIcon = () => {
    switch (status) {
      case 'WORKING': return ArrowBack1;
      case 'OFFLINE': return ArrowBack2;
      case 'MINIMAL_STOCK': return ArrowBack3;
      case 'CRITICAL_STOCK': return ArrowBack4;
      default: return ArrowBack2;
    }
  };

  const getConfig1Icon = () => {
    switch (status) {
      case 'WORKING': return Config1_1;
      case 'OFFLINE': return Config1_2;
      case 'MINIMAL_STOCK': return Config1_3;
      case 'CRITICAL_STOCK': return Config1_4;
      default: return Config1_2;
    }
  };

  const getConfig2Icon = () => {
    switch (status) {
      case 'WORKING': return Config2_1;
      case 'OFFLINE': return Config2_2;
      case 'MINIMAL_STOCK': return Config2_3;
      case 'CRITICAL_STOCK': return Config2_4;
      default: return Config2_2;
    }
  };

  const getConfig3Icon = () => {
    switch (status) {
      case 'WORKING': return Config3_1;
      case 'OFFLINE': return Config3_2;
      case 'MINIMAL_STOCK': return Config3_3;
      case 'CRITICAL_STOCK': return Config3_4;
      default: return Config3_2;
    }
  };

  const getConfig4Icon = () => {
    switch (status) {
      case 'WORKING': return Config4_1;
      case 'OFFLINE': return Config4_2;
      case 'MINIMAL_STOCK': return Config4_3;
      case 'CRITICAL_STOCK': return Config4_4;
      default: return Config4_2;
    }
  };

  const displayName = name || uid || '—';
  const workshopSectionText = `${workshop || '—'} ${section || '—'}`;

  // Собираем массив иконок для отображения
  const statusIcons: string[] = [];
  if (isTmc) statusIcons.push(TMC);
  if (isSgd) statusIcons.push(SGD);
  if (isOk) statusIcons.push(OK);
  if (parentUid) statusIcons.push(CHAIN);
  if (hasError) statusIcons.push(ERR);

  const renderStatusIcons = () => {
    const count = statusIcons.length;
    
    if (count === 0) return null;
    
    const iconWidth = 30;
    const iconHeight = 17;
    const gap = 4;
    
    if (count === 1) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconWidth,
            height: '100%',
          }}
        >
          <img src={statusIcons[0]} alt="" style={{ width: iconWidth, height: iconHeight }} />
        </div>
      );
    }
    
    if (count === 2) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${gap}px`,
          }}
        >
          {statusIcons.map((icon, idx) => (
            <img key={idx} src={icon} alt="" style={{ width: iconWidth, height: iconHeight }} />
          ))}
        </div>
      );
    }
    
    if (count === 3) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${gap}px`,
          }}
        >
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            <img src={statusIcons[0]} alt="" style={{ width: iconWidth, height: iconHeight }} />
            <img src={statusIcons[1]} alt="" style={{ width: iconWidth, height: iconHeight }} />
          </div>
          <img src={statusIcons[2]} alt="" style={{ width: iconWidth, height: iconHeight }} />
        </div>
      );
    }
    
    if (count === 4) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${gap}px`,
          }}
        >
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            <img src={statusIcons[0]} alt="" style={{ width: iconWidth, height: iconHeight }} />
            <img src={statusIcons[1]} alt="" style={{ width: iconWidth, height: iconHeight }} />
          </div>
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            <img src={statusIcons[2]} alt="" style={{ width: iconWidth, height: iconHeight }} />
            <img src={statusIcons[3]} alt="" style={{ width: iconWidth, height: iconHeight }} />
          </div>
        </div>
      );
    }
    
    if (count === 5) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${gap}px`,
          }}
        >
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            <img src={statusIcons[0]} alt="" style={{ width: iconWidth, height: iconHeight }} />
            <img src={statusIcons[1]} alt="" style={{ width: iconWidth, height: iconHeight }} />
          </div>
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            <img src={statusIcons[2]} alt="" style={{ width: iconWidth, height: iconHeight }} />
            <img src={statusIcons[3]} alt="" style={{ width: iconWidth, height: iconHeight }} />
          </div>
          <img src={statusIcons[4]} alt="" style={{ width: iconWidth, height: iconHeight }} />
        </div>
      );
    }
    
    return null;
  };

  const showKrit = status === 'MINIMAL_STOCK' || status === 'CRITICAL_STOCK';
  const kritIcon = status === 'MINIMAL_STOCK' ? KRIT : KRIT2;
  
  const labelColor = status === 'OFFLINE' ? '#777777' : '#2D4059';
  const valueColor = status === 'OFFLINE' ? '#777777' : '#2D4059';

  const handleRightButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfigMode(true);
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfigMode(false);
  };

  return (
    <div
      style={{
        width: '1720px',
        height: '112px',
        borderRadius: '25px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Фоновое изображение */}
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
          zIndex: 0,
        }}
      />

      {/* Статичные элементы */}
      {/* Иконка станции */}
      <div
        style={{
          width: '84px',
          height: '92px',
          position: 'absolute',
          left: '30px',
          top: '10px',
          zIndex: 2,
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

      {/* Блок с иконками статусов (TMC, SGD, OK, CHAIN, ERR) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          left: '144px',
          height: '100%',
          zIndex: 2,
        }}
      >
        {renderStatusIcons()}
      </div>

      {/* Информация о станции - название, цех, статус */}
      <div
        style={{
          position: 'absolute',
          left: '243px',
          top: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          zIndex: 2,
        }}
      >
        {/* Название */}
        <div
          style={{
            position: 'relative',
            width: '148px',
          }}
          onMouseEnter={() => setShowNameTooltip(true)}
          onMouseLeave={() => setShowNameTooltip(false)}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: '15px',
              lineHeight: '18px',
              color: '#2D4059',
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
        
        {/* Цех и участок */}
        <div
          style={{
            position: 'relative',
            width: '148px',
            marginTop: '1px',
          }}
          onMouseEnter={() => setShowWorkshopTooltip(true)}
          onMouseLeave={() => setShowWorkshopTooltip(false)}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '14px',
              color: '#2D4059',
              opacity: 0.5,
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
            fontSize: '13px',
            color: getStatusColor(),
            width: '148px',
            marginTop: '7px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
          }}
        >
          {getStatusText()}
        </div>
      </div>

      {/* Анимируемая часть */}
      <AnimatePresence mode="wait">
        {!isConfigMode ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            {/* Иконка КРИТ на 421px от левого края */}
            <div
              style={{
                position: 'absolute',
                left: '421px',
                top: '44px',
                width: '26px',
                height: '24px',
              }}
            >
              {showKrit && (
                <img
                  src={kritIcon}
                  alt="krit"
                  style={{
                    width: '26px',
                    height: '24px',
                  }}
                />
              )}
            </div>

            {/* Блок "Использование ячеек" - на 477px от левого края */}
            <div
              style={{
                position: 'absolute',
                left: '477px',
                top: '25px',
                width: '194px',
                height: '62px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: labelColor,
                  textAlign: 'center',
                  lineHeight: '14px',
                }}
              >
                Использование ячеек
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '7px',
                }}
              >
                <img 
                  src={Icon1} 
                  alt="" 
                  style={{ 
                    width: '24px', 
                    height: '12px',
                    flexShrink: 0,
                  }} 
                />
                <div
                  style={{
                    width: '130px',
                    height: '16px',
                    backgroundColor: 'rgba(45, 64, 89, 0.08)',
                    borderRadius: '8px',
                    marginLeft: '6px',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(animatedFilled, 100)}%`,
                      height: '16px',
                      backgroundColor: getProgressBarColor(),
                      borderRadius: '8px',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: valueColor,
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {Math.round(animatedFilled)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: valueColor,
                  textAlign: 'center',
                  marginTop: '7px',
                  lineHeight: '12px',
                }}
              >
                {filledCells} / {totalCells}
              </div>
            </div>

            {/* Блок "Остаток ТМЦ в станциях" - на 698px от левого края */}
            <div
              style={{
                position: 'absolute',
                left: '698px',
                top: '25px',
                width: '194px',
                height: '62px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: labelColor,
                  textAlign: 'center',
                  lineHeight: '14px',
                }}
              >
                Остаток ТМЦ в станциях
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '7px',
                }}
              >
                <img 
                  src={Icon2} 
                  alt="" 
                  style={{ 
                    width: '24px', 
                    height: '22px',
                    flexShrink: 0,
                  }} 
                />
                <div
                  style={{
                    width: '130px',
                    height: '16px',
                    backgroundColor: 'rgba(45, 64, 89, 0.08)',
                    borderRadius: '8px',
                    marginLeft: '6px',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(animatedRemaining, 100)}%`,
                      height: '16px',
                      backgroundColor: getProgressBarColor(),
                      borderRadius: '8px',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: valueColor,
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {Math.round(animatedRemaining)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: valueColor,
                  textAlign: 'center',
                  marginTop: '7px',
                  lineHeight: '12px',
                }}
              >
                {remainingNomenclatureCount}
              </div>
            </div>

            {/* Блок "Готовые детали" - на 919px от левого края */}
            <div
              style={{
                position: 'absolute',
                left: '919px',
                top: '25px',
                width: '194px',
                height: '62px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: labelColor,
                  textAlign: 'center',
                  lineHeight: '14px',
                }}
              >
                Готовые детали
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '7px',
                }}
              >
                <img 
                  src={Icon3} 
                  alt="" 
                  style={{ 
                    width: '13px', 
                    height: '22px',
                    flexShrink: 0,
                  }} 
                />
                <div
                  style={{
                    width: '130px',
                    height: '16px',
                    backgroundColor: 'rgba(45, 64, 89, 0.08)',
                    borderRadius: '8px',
                    marginLeft: '6px',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(animatedReady, 100)}%`,
                      height: '16px',
                      backgroundColor: getProgressBarColor(),
                      borderRadius: '8px',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: valueColor,
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {Math.round(animatedReady)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: valueColor,
                  textAlign: 'center',
                  marginTop: '7px',
                  lineHeight: '12px',
                }}
              >
                {readyPartsCount}
              </div>
            </div>

            {/* Текстовые значения справа от прогресс-баров - на 1159px от левого края */}
            <div
              style={{
                position: 'absolute',
                left: '1159px',
                top: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              {/* ТМЦ в станции */}
              <div
                style={{
                  width: '193px',
                  height: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                  ТМЦ в станции
                </span>
                <div
                  style={{
                    width: '40px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                    {totalCells}
                  </span>
                </div>
              </div>

              {/* Выдано ТМЦ */}
              <div
                style={{
                  width: '193px',
                  height: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                  Выдано ТМЦ
                </span>
                <div
                  style={{
                    width: '40px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                    {filledCells}
                  </span>
                </div>
              </div>

              {/* Выдано сверхнормы */}
              <div
                style={{
                  width: '193px',
                  height: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                  Выдано сверхнормы
                </span>
                <div
                  style={{
                    width: '40px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                    {Math.max(0, templateNomenclatureCount - remainingNomenclatureCount)}
                  </span>
                </div>
              </div>

              {/* Готовые детали */}
              <div
                style={{
                  width: '193px',
                  height: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                  Готовые детали
                </span>
                <div
                  style={{
                    width: '40px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                    {readyPartsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Кнопка Пополнить - 157px от правого края */}
            <button
              style={{
                position: 'absolute',
                right: '157px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '164px',
                height: '30px',
                backgroundColor: getButtonColor(),
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 500,
                color: '#2D4059',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Пополнить', uid);
              }}
            >
              Пополнить
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            {/* Заголовок "Конфигурация:" */}
            <div
              style={{
                position: 'absolute',
                left: '443px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '15px',
                fontWeight: 500,
                color: '#2D4059',
                opacity: 0.5,
              }}
            >
              Конфигурация:
            </div>

            {/* Кнопка 1 - Шаблоны загрузки */}
            <button
              style={{
                position: 'absolute',
                left: '570px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '192px',
                height: '37px',
                backgroundColor: getButtonColor(),
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Шаблоны загрузки', uid);
              }}
            >
              <img src={getConfig1Icon()} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                Шаблоны загрузки
              </span>
            </button>

            {/* Кнопка 2 - Карта загрузки */}
            <button
              style={{
                position: 'absolute',
                left: '830px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '166px',
                height: '37px',
                backgroundColor: getButtonColor(),
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Карта загрузки', uid);
              }}
            >
              <img src={getConfig2Icon()} alt="" style={{ width: '22px', height: '17px', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                Карта загрузки
              </span>
            </button>

            {/* Кнопка 3 - Отчет движения ТМЦ/деталей */}
            <button
              style={{
                position: 'absolute',
                left: '1064px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '278px',
                height: '37px',
                backgroundColor: getButtonColor(),
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Отчет движения ТМЦ/деталей', uid);
              }}
            >
              <img src={getConfig3Icon()} alt="" style={{ width: '22px', height: '22px', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                Отчет движения ТМЦ/деталей
              </span>
            </button>

            {/* Кнопка 4 - Настройки станций */}
            <button
              style={{
                position: 'absolute',
                left: '1410px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '192px',
                height: '37px',
                backgroundColor: getButtonColor(),
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Настройки станций', uid);
              }}
            >
              <img src={getConfig4Icon()} alt="" style={{ width: '21px', height: '21px', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>
                Настройки станций
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки справа с анимацией */}
      <AnimatePresence mode="wait">
        {!isConfigMode ? (
          <motion.div
            key="main-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '20px',
              zIndex: 3,
            }}
          >
            <button
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Аналитика', uid);
              }}
            >
              <img 
                src={getAnalyticIcon()} 
                alt="Аналитика" 
                style={{ 
                  width: '24px', 
                  height: '18px',
                }} 
              />
            </button>
            <button
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onClick={handleRightButtonClick}
            >
              <img 
                src={getArrowRightIcon()} 
                alt="Перейти" 
                style={{ 
                  width: '28px', 
                  height: '21px',
                }} 
              />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="back-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
            }}
          >
            <button
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onClick={handleBackClick}
            >
              <img 
                src={getArrowBackIcon()} 
                alt="Назад" 
                style={{ 
                  width: '24px', 
                  height: '24px',
                }} 
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StationRow;