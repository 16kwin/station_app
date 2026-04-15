// components/StationsPage/StationRow.tsx
import React, { useState, useEffect } from 'react';

// Импорт иконок для статусов
import KRIT from '../../assets/Station/KRIT.svg';
import KRIT2 from '../../assets/Station/KRIT2.svg';
import ERR from '../../assets/Station/ERR.svg';

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
  maxReadyParts = 0,
  readyPartsCount = 0,
}) => {
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showWorkshopTooltip, setShowWorkshopTooltip] = useState(false);
  
  // Состояния для анимированных процентов
  const [animatedFilled, setAnimatedFilled] = useState(0);
  const [animatedRemaining, setAnimatedRemaining] = useState(0);
  const [animatedReady, setAnimatedReady] = useState(0);
  
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

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

  const displayName = name || uid || '—';
  const workshopSectionText = `${workshop || '—'} ${section || '—'}`;
  const overNorm = templateNomenclatureCount > 0 ? Math.max(0, templateNomenclatureCount - remainingNomenclatureCount) : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '80px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Индикаторы статуса и ошибки */}
      {status === 'MINIMAL_STOCK' && (
        <img
          src={KRIT}
          alt="krit"
          style={{
            position: 'absolute',
            left: '4px',
            top: '4px',
            width: '16px',
            height: '14px',
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
            left: '4px',
            top: '4px',
            width: '16px',
            height: '14px',
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
            left: '4px',
            top: (status === 'MINIMAL_STOCK' || status === 'CRITICAL_STOCK') ? '22px' : '4px',
            width: '16px',
            height: '14px',
            zIndex: 2,
          }}
        />
      )}

      {/* Иконка станции */}
      <div
        style={{
          width: '48px',
          height: '52px',
          position: 'relative',
          flexShrink: 0,
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
            width: '38px',
            height: '42px',
            objectFit: 'contain',
            zIndex: 1,
          }}
        />
      </div>

      {/* Информация о станции */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: '160px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '160px',
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
            }}
          >
            {displayName}
          </div>
          {showNameTooltip && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
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
        
        <div
          style={{
            position: 'relative',
            maxWidth: '160px',
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
            }}
          >
            {workshopSectionText}
          </div>
          {showWorkshopTooltip && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
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
      </div>

      {/* Статус */}
      <div
        style={{
          fontWeight: 500,
          fontSize: '13px',
          color: getStatusColor(),
          minWidth: '130px',
          flexShrink: 0,
        }}
      >
        {getStatusText()}
      </div>

      {/* Иконки информации */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: '80px',
          flexShrink: 0,
        }}
      >
        {isTmc && <img src={TMC} alt="TMC" style={{ width: '24px', height: '14px' }} />}
        {isSgd && <img src={SGD} alt="SGD" style={{ width: '24px', height: '14px' }} />}
        {isOk && <img src={OK} alt="OK" style={{ width: '24px', height: '14px' }} />}
        {parentUid && <img src={CHAIN} alt="CHAIN" style={{ width: '24px', height: '14px' }} />}
      </div>

      {/* Прогресс бары */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flex: 1,
        }}
      >
        {/* Прогресс бар 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <img src={Icon1} alt="" style={{ width: '14px', height: '7px' }} />
          <div
            style={{
              width: '100px',
              height: '6px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '3px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedFilled, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(animatedFilled)}%
          </span>
        </div>

        {/* Прогресс бар 2 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <img src={Icon2} alt="" style={{ width: '13px', height: '12px' }} />
          <div
            style={{
              width: '100px',
              height: '6px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '3px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedRemaining, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(animatedRemaining)}%
          </span>
        </div>

        {/* Прогресс бар 3 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <img src={Icon3} alt="" style={{ width: '8px', height: '13px' }} />
          <div
            style={{
              width: '100px',
              height: '6px',
              backgroundColor: 'rgba(45, 64, 89, 0.08)',
              borderRadius: '3px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.min(animatedReady, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(animatedReady)}%
          </span>
        </div>
      </div>

      {/* Данные */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '11px', color: '#6C7A8B' }}>ТМЦ</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>{totalCells}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '11px', color: '#6C7A8B' }}>Выдано</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>{filledCells}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '11px', color: '#6C7A8B' }}>Сверх</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>{overNorm}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '11px', color: '#6C7A8B' }}>Готово</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059' }}>{readyPartsCount}</div>
        </div>
      </div>

      {/* Кнопка Пополнить */}
      <button
        style={{
          padding: '6px 16px',
          backgroundColor: getButtonColor(),
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#2D4059',
          flexShrink: 0,
          marginLeft: 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Пополнить', uid);
        }}
      >
        Пополнить
      </button>
    </div>
  );
};

export default StationRow;