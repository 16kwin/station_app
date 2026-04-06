import React, { useState, useRef, useEffect } from 'react';
import StationCell from './StationCell';
import ConstantInfo from '../../info/ConstantInfo';

import Icon1 from '../../assets/Station/1.svg';
import Icon2 from '../../assets/Station/2.svg';
import Icon3 from '../../assets/Station/3.svg';
import Icon4 from '../../assets/Station/4.svg';
import Icon5 from '../../assets/Station/5.svg';
import Icon6 from '../../assets/Station/6.svg';
import Icon7 from '../../assets/Station/7.svg';
import Icon8 from '../../assets/Station/8.svg';
import Icon9 from '../../assets/Station/9.svg';
import Icon10 from '../../assets/Station/10.svg';
import Icon11 from '../../assets/Station/11.svg';

interface StationStatic {
  uid: string;
  name: string;
  workshop: string;
  section: string;
  status: string;
  stationType: string;
  parentUid: string | null;
  hasError: boolean;
  isTmc: boolean;
  isSgd: boolean;
  isOk: boolean;
}

interface StationDynamic {
  uid: string;
  filledCellsPercent: number;
  remainingNomenclaturePercent: number;
  readyPartsPercent: number;
}

const StationsPage = () => {
  const [activeButtons, setActiveButtons] = useState<number[]>([]);
  const [expandedButton, setExpandedButton] = useState<number | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  
  const [stationsStatic, setStationsStatic] = useState<StationStatic[]>([]);
  const [stationsDynamic, setStationsDynamic] = useState<Map<string, StationDynamic>>(new Map());
  const [loading, setLoading] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);

  const buttons = [
    { icon: Icon1, label: 'Фильтр 1' },
    { icon: Icon2, label: 'Фильтр 2' },
    { icon: Icon3, label: 'Фильтр 3' },
    { icon: Icon4, label: 'Фильтр 4' },
    { icon: Icon5, label: 'Фильтр 5' },
    { icon: Icon6, label: 'Фильтр 6' },
    { icon: Icon7, label: 'Фильтр 7' },
    { icon: Icon8, label: 'Фильтр 8' },
    { icon: Icon9, label: 'Фильтр 9' },
    { icon: Icon10, label: 'Фильтр 10' },
    { icon: Icon11, label: 'Фильтр 11' },
  ];

  // Загрузка данных станций
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!window.config || !window.config.ip_api) {
          setStationsError('Не удалось определить адрес сервера');
          setLoading(false);
          return;
        }

        const host = window.config.ip_api.replace('http://', '').replace('https://', '');
        const baseUrl = `http://${host}:${ConstantInfo.serverPort}`;
        
        const [staticRes, dynamicRes] = await Promise.all([
          fetch(`${baseUrl}${ConstantInfo.restApiStationsStatic}`),
          fetch(`${baseUrl}${ConstantInfo.restApiStationsDynamic}`)
        ]);
        
        if (!staticRes.ok || !dynamicRes.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        
        const staticData: StationStatic[] = await staticRes.json();
        const dynamicData: StationDynamic[] = await dynamicRes.json();
        
        setStationsStatic(staticData || []);
        
        const dynamicMap = new Map();
        if (dynamicData && Array.isArray(dynamicData)) {
          dynamicData.forEach(d => dynamicMap.set(d.uid, d));
        }
        setStationsDynamic(dynamicMap);
        setStationsError(null);
      } catch (error) {
        console.error('Ошибка загрузки станций:', error);
        setStationsError('Не удалось загрузить данные станций');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // WebSocket подключение (не блокируем отображение при ошибке)
  useEffect(() => {
    if (!window.config || !window.config.ip_api) {
      return;
    }

    const host = window.config.ip_api.replace('http://', '').replace('https://', '');
    const wsUrl = `ws://${host}:${ConstantInfo.serverPort}/ws-stations`;
    
    let socket: WebSocket | null = null;
    
    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data) && data.length > 0 && 'uid' in data[0]) {
            setStationsStatic(data);
          }
          if (Array.isArray(data) && data.length > 0 && 'filledCellsPercent' in data[0]) {
            const dynamicMap = new Map();
            data.forEach((d: StationDynamic) => dynamicMap.set(d.uid, d));
            setStationsDynamic(dynamicMap);
          }
          if (data && data.uid && 'filledCellsPercent' in data) {
            setStationsDynamic(prev => new Map(prev).set(data.uid, data));
          }
          if (data && data.uid && 'name' in data) {
            setStationsStatic(prev => {
              const index = prev.findIndex(s => s.uid === data.uid);
              if (index !== -1) {
                const newStatic = [...prev];
                newStatic[index] = data;
                return newStatic;
              }
              return [...prev, data];
            });
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
    
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const toggleButton = (index: number) => {
    setActiveButtons(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleButtonClick = (index: number) => {
    if (index === 9 || index === 10) {
      toggleButton(index);
      return;
    }
    
    if (expandedButton === index) {
      setExpandedButton(null);
      if (activeButtons.includes(index)) {
        toggleButton(index);
      }
    } else {
      setExpandedButton(index);
      if (!activeButtons.includes(index)) {
        toggleButton(index);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        setExpandedButton(null);
      }
    };

    if (expandedButton !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedButton]);

  const renderButton = (button: typeof buttons[0], globalIdx: number) => {
    const isActive = activeButtons.includes(globalIdx);
    const isExpanded = expandedButton === globalIdx;
    const isRightTwo = globalIdx === 9 || globalIdx === 10;

    if (isRightTwo) {
      return (
        <button
          key={`button-${globalIdx}`}
          onClick={() => toggleButton(globalIdx)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isActive 
              ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
          }}
        >
          <img
            src={button.icon}
            alt={`icon${globalIdx + 1}`}
            style={{
              width: '24px',
              height: '24px',
              filter: isActive ? 'brightness(0) invert(1)' : 'none',
            }}
          />
        </button>
      );
    }

    return (
      <div
        key={`button-${globalIdx}`}
        style={{
          display: 'inline-flex',
        }}
      >
        <div
          ref={isExpanded ? expandedRef : null}
          onClick={() => handleButtonClick(globalIdx)}
          style={{
            width: isExpanded ? '226px' : '54px',
            height: isExpanded ? 'auto' : '54px',
            minHeight: isExpanded ? 'auto' : '54px',
            borderRadius: isExpanded ? '20px' : '50%',
            backgroundColor: isActive ? '#666EFE' : '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isExpanded ? 'flex-start' : 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '12px 16px' : '0',
            boxShadow: isActive 
              ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
            gap: isExpanded ? '12px' : '0',
            zIndex: isExpanded ? 200 : 1,
            position: 'relative',
          }}
        >
          {!isExpanded && (
            <img
              src={button.icon}
              alt={`icon${globalIdx + 1}`}
              style={{
                width: '24px',
                height: '24px',
                filter: isActive ? 'brightness(0) invert(1)' : 'none',
              }}
            />
          )}

          {isExpanded && (
            <>
              <span
                style={{
                  color: isActive ? '#FFFFFF' : '#2D4059',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {button.label}
              </span>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #E0E0E0',
                  fontSize: '14px',
                  color: isActive ? '#FFFFFF' : '#2D4059',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
                  cursor: 'pointer',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option>Опция 1</option>
                <option>Опция 2</option>
                <option>Опция 3</option>
              </select>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        style={{
          paddingTop: '35px',
          paddingLeft: '60px',
        }}
      >
        <h1
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontSize: '30px',
            fontWeight: 'bold',
            letterSpacing: '0',
            color: '#2D4059',
            margin: 0,
          }}
        >
          Станции
        </h1>
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingLeft: '70px',
          paddingRight: '70px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          minHeight: '54px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {buttons.slice(0, 3).map((button, idx) => renderButton(button, idx))}
          </div>

          <div style={{ width: '170px' }} />

          <div style={{ display: 'flex', gap: '20px' }}>
            {buttons.slice(3, 6).map((button, idx) => renderButton(button, idx + 3))}
          </div>

          <div style={{ width: '90px' }} />

          <div style={{ display: 'flex', gap: '20px' }}>
            {buttons.slice(6, 8).map((button, idx) => renderButton(button, idx + 6))}
          </div>

          <div style={{ width: '90px' }} />

          <div style={{ display: 'flex', gap: '20px' }}>
            {buttons.slice(8, 9).map((button, idx) => renderButton(button, idx + 8))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {buttons.slice(9, 11).map((button, idx) => renderButton(button, idx + 9))}
        </div>
      </div>

      {/* Контейнер с ячейками - абсолютно позиционирован */}
      <div
        style={{
          position: 'absolute',
          top: '160px',
          left: '40px',
          right: '40px',
          bottom: '20px',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            Загрузка станций...
          </div>
        ) : stationsError ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#F44336' }}>
            {stationsError}
          </div>
        ) : stationsStatic.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            Нет данных о станциях
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 220px)',
              gap: '30px 0',
              justifyContent: 'space-between',
              paddingTop: '10px',
              paddingBottom: '10px',
            }}
          >
            {stationsStatic.map((station) => {
              const dynamic = stationsDynamic.get(station.uid);
              return (
                <StationCell
                  key={station.uid}
                  uid={station.uid}
                  name={station.name}
                  workshop={station.workshop}
                  section={station.section}
                  status={station.status}
                  stationType={station.stationType}
                  hasError={station.hasError}
                  isTmc={station.isTmc}
                  isSgd={station.isSgd}
                  isOk={station.isOk}
                  filledCellsPercent={dynamic?.filledCellsPercent}
                  remainingNomenclaturePercent={dynamic?.remainingNomenclaturePercent}
                  readyPartsPercent={dynamic?.readyPartsPercent}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationsPage;