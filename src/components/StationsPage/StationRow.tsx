// components/StationsPage/StationRow.tsx
import React, { useState } from 'react';

// Импорт фонов для ряда
import Line1 from '../../assets/Station/Line1.svg';
import Line2 from '../../assets/Station/Line2.svg';
import Line3 from '../../assets/Station/Line3.svg';
import Line4 from '../../assets/Station/Line4.svg';

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
  readyPartsCount = 0,
}) => {
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showWorkshopTooltip, setShowWorkshopTooltip] = useState(false);

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

  const displayName = name || uid || '—';
  const workshopSectionText = `${workshop || '—'} ${section || '—'}`;
  const overNorm = templateNomenclatureCount > 0 ? Math.max(0, templateNomenclatureCount - remainingNomenclatureCount) : 0;

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

      {/* Иконка станции */}
      <div
        style={{
          width: '84px',
          height: '92px',
          position: 'relative',
          flexShrink: 0,
          marginLeft: '30px',
          marginTop: '10px',
          marginBottom: '10px',
          zIndex: 1,
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
          marginLeft: '30px',
          height: '100%',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {renderStatusIcons()}
      </div>

      {/* Информация о станции - начинается на 243px от левого края */}
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
          zIndex: 1,
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

      {/* Иконка КРИТ на 421px от левого края */}
      <div
        style={{
          position: 'absolute',
          left: '421px',
          top: '44px',
          width: '26px',
          height: '24px',
          flexShrink: 0,
          zIndex: 1,
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

      {/* Прогресс бары - начинаются на 421 + 26 + 30 = 477px от левого края */}
      <div
        style={{
          position: 'absolute',
          left: '477px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 1,
        }}
      >
        {/* Прогресс бар 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                width: `${Math.min(filledCellsPercent, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(filledCellsPercent)}%
          </span>
        </div>

        {/* Прогресс бар 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                width: `${Math.min(remainingNomenclaturePercent, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(remainingNomenclaturePercent)}%
          </span>
        </div>

        {/* Прогресс бар 3 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                width: `${Math.min(readyPartsPercent, 100)}%`,
                height: '6px',
                backgroundColor: getProgressBarColor(),
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6C7A8B', minWidth: '36px' }}>
            {Math.round(readyPartsPercent)}%
          </span>
        </div>
      </div>

      {/* Данные - справа от прогресс баров */}
      <div
        style={{
          position: 'absolute',
          left: '650px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#6C7A8B', minWidth: '50px' }}>ТМЦ</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059', minWidth: '40px', textAlign: 'center' }}>{totalCells}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#6C7A8B', minWidth: '50px' }}>Выдано</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059', minWidth: '40px', textAlign: 'center' }}>{filledCells}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#6C7A8B', minWidth: '50px' }}>Сверх</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059', minWidth: '40px', textAlign: 'center' }}>{overNorm}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#6C7A8B', minWidth: '50px' }}>Готово</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4059', minWidth: '40px', textAlign: 'center' }}>{readyPartsCount}</span>
        </div>
      </div>

      {/* Кнопка Пополнить */}
      <button
        style={{
          position: 'absolute',
          left: '780px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '6px 16px',
          backgroundColor: getButtonColor(),
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#2D4059',
          flexShrink: 0,
          zIndex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Пополнить', uid);
        }}
      >
        Пополнить
      </button>

      {/* Два пустых значка справа */}
      <div
        style={{
          position: 'absolute',
          right: '30px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '20px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#F0F2F5',
            borderRadius: '8px',
          }}
        />
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#F0F2F5',
            borderRadius: '8px',
          }}
        />
      </div>
    </div>
  );
};

export default StationRow;