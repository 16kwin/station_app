// SchablonPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

// Иконки для кнопок
import Schablon1 from '../../../assets/Schablon/Schablon1.svg';
import Schablon2 from '../../../assets/Schablon/Schablon2.svg';
import Schablon3 from '../../../assets/Schablon/Schablon3.svg';
import Schablon4 from '../../../assets/Schablon/Schablon4.svg';
import Schablon5 from '../../../assets/Schablon/Schablon5.svg';
import Schablon6 from '../../../assets/Schablon/Schablon6.svg';
import StationFull from '../../../assets/StationAnimation/StationFull.svg';

// Иконки статусов
import TMC from '../../../assets/Station/TMC.svg';
import SGD from '../../../assets/Station/SGD.svg';
import OK from '../../../assets/Station/OK.svg';
import CHAIN from '../../../assets/Station/CHAIN.svg';

import SchablonTable from './SchablonTable';

const SchablonPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);

  const [stationName, setStationName] = useState<string>(uid || '');
  const [isTmc, setIsTmc] = useState(false);
  const [isSgd, setIsSgd] = useState(false);
  const [isOk, setIsOk] = useState(false);
  const [parentUid, setParentUid] = useState<string | null>(null);
  const [adaptiveTopPadding, setAdaptiveTopPadding] = useState(35);
  const [adaptiveTitleToButtonsGap, setAdaptiveTitleToButtonsGap] = useState(28);
  const [adaptiveButtonGap, setAdaptiveButtonGap] = useState(16);
  const [adaptiveBottomPadding, setAdaptiveBottomPadding] = useState(40);

  // Состояния для кнопок
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [activeButtons, setActiveButtons] = useState<number[]>([]);

  const BASE_TOP_PADDING = 35;
  const BASE_TITLE_TO_BUTTONS_GAP = 28;
  const BASE_BUTTON_GAP = 16;
  const BASE_BOTTOM_PADDING = 40;
  const TITLE_HEIGHT = 27;
  const BUTTONS_HEIGHT = 54;
  const BLOCKS_HEIGHT = 640;
  const FIXED_CONTENT_HEIGHT = TITLE_HEIGHT + BUTTONS_HEIGHT + BLOCKS_HEIGHT;
  const BASE_GAPS_SUM = BASE_TOP_PADDING + BASE_TITLE_TO_BUTTONS_GAP + BASE_BUTTON_GAP + BASE_BOTTOM_PADDING;

  const GRID_WIDTH = 331;
  const GRID_HEIGHT = 512;

  // Загружаем данные станции
  useEffect(() => {
    if (!uid) return;

    const fetchStationData = async () => {
      try {
        const response = await AxiosService.get(`${ConstantInfo.restApiStationsStatic}/${uid}`);
        const data = response.data;
        setStationName(data?.name || uid);
        setIsTmc(data?.isTmc || false);
        setIsSgd(data?.isSgd || false);
        setIsOk(data?.isOk || false);
        setParentUid(data?.parentUid || null);
      } catch {
        setStationName(uid);
      }
    };

    fetchStationData();
  }, [uid]);

  // Адаптивные отступы
  const calculateAdaptivePaddings = useCallback(() => {
    if (!containerRef.current) return;

    const whiteBlock = containerRef.current.closest('.white-block');
    if (!whiteBlock) return;

    const whiteBlockHeight = whiteBlock.clientHeight;
    const availableGapSpace = whiteBlockHeight - FIXED_CONTENT_HEIGHT;
    const scale = availableGapSpace / BASE_GAPS_SUM;

    setAdaptiveTopPadding(Math.max(5, Math.round(BASE_TOP_PADDING * scale)));
    setAdaptiveTitleToButtonsGap(Math.max(5, Math.round(BASE_TITLE_TO_BUTTONS_GAP * scale)));
    setAdaptiveButtonGap(Math.max(5, Math.round(BASE_BUTTON_GAP * scale)));
    setAdaptiveBottomPadding(Math.max(5, Math.round(BASE_BOTTOM_PADDING * scale)));
  }, []);

  useEffect(() => {
    calculateAdaptivePaddings();

    const resizeObserver = new ResizeObserver(calculateAdaptivePaddings);
    const whiteBlock = containerRef.current?.closest('.white-block');
    if (whiteBlock) {
      resizeObserver.observe(whiteBlock);
    }

    window.addEventListener('resize', calculateAdaptivePaddings);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateAdaptivePaddings);
    };
  }, [calculateAdaptivePaddings]);

  // Закрытие текущей вкладки
  const handleClose = () => {
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (currentTab) {
      closeTab(currentTab.id);
    }
  };

  const handleButtonClick = (index: number) => {
    if (index === 1) {
      setIsMultiSelect(prev => !prev);
      setActiveButtons(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setActiveButtons(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    }
  };

  const handleEnableMultiSelect = () => {
    if (!isMultiSelect) {
      setIsMultiSelect(true);
      setActiveButtons(prev => prev.includes(1) ? prev : [...prev, 1]);
    }
  };

  const title = `Документ - Шаблон загрузки станции ${stationName}`;

  const leftIcons = [Schablon1, Schablon2, Schablon3];
  const rightIcons = [Schablon4, Schablon5, Schablon6];

  // Собираем иконки статусов
  const statusIcons: string[] = [];
  if (isTmc) statusIcons.push(TMC);
  if (isSgd) statusIcons.push(SGD);
  if (isOk) statusIcons.push(OK);
  if (parentUid) statusIcons.push(CHAIN);

  const getRoundButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: isActive ? '0 4px 12px rgba(102, 110, 254, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%' }}>
      {/* Заголовок */}
      <div
        style={{
          paddingTop: `${adaptiveTopPadding}px`,
          paddingLeft: '60px',
          paddingRight: '35px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            color: '#2D4059',
            margin: 0,
            lineHeight: `${TITLE_HEIGHT}px`,
            height: `${TITLE_HEIGHT}px`,
          }}
        >
          {title}
        </h1>

        {/* Крестик закрытия */}
        <button
          onClick={handleClose}
          style={{
            width: '14px',
            height: '14px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '7px',
            position: 'relative',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
            <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Основной контент */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${adaptiveTopPadding + TITLE_HEIGHT + adaptiveTitleToButtonsGap}px`,
          bottom: 0,
        }}
      >
        {/* Левая часть */}
        <div
          style={{
            position: 'absolute',
            left: '40px',
            bottom: `${adaptiveBottomPadding}px`,
            width: '507px',
            height: `${BLOCKS_HEIGHT}px`,
            backgroundColor: '#F3F4F6',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Название станции */}
          <div
            style={{
              marginTop: '30px',
              height: '23px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '19px',
              lineHeight: '23px',
              color: '#2D4059',
              textAlign: 'center',
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stationName}
          </div>

          {/* Иконки статусов */}
          {statusIcons.length > 0 && (
            <div
              style={{
                marginTop: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
            >
              {statusIcons.map((icon, index) => (
                <img key={index} src={icon} alt="" style={{ width: '35px', height: '20px' }} />
              ))}
            </div>
          )}

          {/* Картинка станции */}
          <div
            style={{
              position: 'absolute',
              left: '88px',
              bottom: '30px',
              width: `${GRID_WIDTH}px`,
              height: `${GRID_HEIGHT}px`,
            }}
          >
            <img src={StationFull} alt="Station" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Правая часть */}
        <div
          style={{
            position: 'absolute',
            left: '577px',
            right: '40px',
            bottom: `${adaptiveBottomPadding}px`,
          }}
        >
          {/* Кнопки */}
          <div
            style={{
              width: '1183px',
              height: `${BUTTONS_HEIGHT}px`,
              marginBottom: `${adaptiveButtonGap}px`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Левая группа кнопок */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '30px' }}>
              {leftIcons.map((icon, index) => (
                <button
                  key={`left-${index}`}
                  onClick={() => handleButtonClick(index)}
                  style={getRoundButtonStyle(activeButtons.includes(index))}
                >
                  <img
                    src={icon}
                    alt=""
                    style={{
                      width: '24px',
                      height: '24px',
                      filter: activeButtons.includes(index) ? 'brightness(0) invert(1)' : 'none',
                      transition: 'filter 0.3s ease',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Отступ */}
            <div style={{ width: '145px', flexShrink: 0 }} />

            {/* Центральный блок */}
            <div
              style={{
                width: '429px',
                height: '54px',
                borderRadius: '27px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                flexShrink: 0,
              }}
            />

            {/* Отступ */}
            <div style={{ width: '145px', flexShrink: 0 }} />

            {/* Правая группа кнопок */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginRight: '30px' }}>
              {rightIcons.map((icon, index) => (
                <button
                  key={`right-${index}`}
                  onClick={() => handleButtonClick(index + 3)}
                  style={getRoundButtonStyle(activeButtons.includes(index + 3))}
                >
                  <img
                    src={icon}
                    alt=""
                    style={{
                      width: '24px',
                      height: '24px',
                      filter: activeButtons.includes(index + 3) ? 'brightness(0) invert(1)' : 'none',
                      transition: 'filter 0.3s ease',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Таблица */}
          <SchablonTable
            isMultiSelect={isMultiSelect}
            onEnableMultiSelect={handleEnableMultiSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default SchablonPage;