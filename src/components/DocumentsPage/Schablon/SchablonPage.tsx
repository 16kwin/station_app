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

const SchablonPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);

  const [stationName, setStationName] = useState<string>(uid || '');
  const [adaptiveTopPadding, setAdaptiveTopPadding] = useState(35);
  const [adaptiveBottomPadding, setAdaptiveBottomPadding] = useState(40);
  const [adaptiveButtonGap, setAdaptiveButtonGap] = useState(16);

  const BASE_TOP_PADDING = 35;
  const BASE_BOTTOM_PADDING = 40;
  const BASE_BUTTON_GAP = 16;

  // Загружаем название станции
  useEffect(() => {
    if (!uid) return;

    const fetchStationName = async () => {
      try {
        const response = await AxiosService.get(`${ConstantInfo.restApiStationsStatic}/${uid}`);
        setStationName(response.data?.name || uid);
      } catch {
        setStationName(uid);
      }
    };

    fetchStationName();
  }, [uid]);

  // Адаптивные отступы
  const calculateAdaptivePaddings = useCallback(() => {
    if (!containerRef.current) return;

    const whiteBlock = containerRef.current.closest('.white-block');
    if (!whiteBlock) return;

    const whiteBlockHeight = whiteBlock.clientHeight;
    const baseWhiteBlockHeight = 960;
    const scale = whiteBlockHeight / baseWhiteBlockHeight;

    setAdaptiveTopPadding(Math.max(5, Math.round(BASE_TOP_PADDING * scale)));
    setAdaptiveBottomPadding(Math.max(5, Math.round(BASE_BOTTOM_PADDING * scale)));
    setAdaptiveButtonGap(Math.max(5, Math.round(BASE_BUTTON_GAP * scale)));
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

  const title = `Документ - Шаблон загрузки станции ${stationName}`;

  const leftIcons = [Schablon1, Schablon2, Schablon3];
  const rightIcons = [Schablon4, Schablon5, Schablon6];

  // Стиль для круглой кнопки
  const roundButtonStyle: React.CSSProperties = {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    flexShrink: 0,
  };

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
            lineHeight: '28px',
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
            <line
              x1="1.5"
              y1="1.5"
              x2="12.5"
              y2="12.5"
              stroke="#2D4059"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="12.5"
              y1="1.5"
              x2="1.5"
              y2="12.5"
              stroke="#2D4059"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Основной контент */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${adaptiveTopPadding + 28 + 30}px`,
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
            height: '641px',
            backgroundColor: '#F3F4F6',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 500, color: '#9CA3AF' }}>
            В разработке
          </span>
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
              height: '54px',
              marginBottom: `${adaptiveButtonGap}px`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Левая группа кнопок */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '30px' }}>
              {leftIcons.map((icon, index) => (
                <button key={`left-${index}`} style={roundButtonStyle}>
                  <img src={icon} alt="" style={{ width: '24px', height: '24px' }} />
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
                <button key={`right-${index}`} style={roundButtonStyle}>
                  <img src={icon} alt="" style={{ width: '24px', height: '24px' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Окно */}
          <div
            style={{
              width: '1183px',
              height: '640px',
              backgroundColor: '#F3F4F6',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 500, color: '#9CA3AF' }}>
              В разработке
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchablonPage;