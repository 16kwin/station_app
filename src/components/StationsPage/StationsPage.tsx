// pages/StationsPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StationCell from './StationCell';
import StationRow from './StationRow';
import ConstantInfo from '../../info/ConstantInfo';
import { mockEnterprises, mockWorkshops, mockSections} from './mockData';
import type {Enterprise, Workshop, Section } from './mockData';

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
import type { JSX } from 'react/jsx-runtime';

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
  totalCells: number;
  filledCells: number;
  templateNomenclatureCount: number;
  remainingNomenclatureCount: number;
  maxReadyParts: number;
  readyPartsCount: number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'nameAsc' | 'nameDesc' | 'placementAsc' | 'placementDesc' | 'statusDesc' | 'tmcSgd' | 'sgdTmc';
type FilterSubmenuType = 'placement' | 'status' | 'type' | 'overissue' | 'error' | null;

interface FilterCascadeState {
  activeType: FilterSubmenuType;
  activeItemIndex: number;
  selectedEnterprise: string | null;
  selectedWorkshop: string | null;
  selectedSection: string | null;
}

const StationsPage = () => {
  const [activeButtons, setActiveButtons] = useState<number[]>([9]);
  const [expandedButton, setExpandedButton] = useState<number | null>(null);
  const [closingButton, setClosingButton] = useState<number | null>(null);
  const [openingButton, setOpeningButton] = useState<number | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const ostatokDropdownRef = useRef<HTMLDivElement>(null);
  const enterpriseDropdownRef = useRef<HTMLDivElement>(null);
  const workshopDropdownRef = useRef<HTMLDivElement>(null);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  
  const [stationsStatic, setStationsStatic] = useState<StationStatic[]>([]);
  const [stationsDynamic, setStationsDynamic] = useState<Map<string, StationDynamic>>(new Map());
  const [loading, setLoading] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [hasSortSelection, setHasSortSelection] = useState(false);
  const [hasFilterSelection, setHasFilterSelection] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearchQuery, setHasSearchQuery] = useState(false);

  const [showOstatokDropdown, setShowOstatokDropdown] = useState(false);
  const [minOstatokEnabled, setMinOstatokEnabled] = useState(false);
  const [criticalOstatokEnabled, setCriticalOstatokEnabled] = useState(false);

  const [showEnterpriseDropdown, setShowEnterpriseDropdown] = useState(false);
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  
  const [selectedEnterprises, setSelectedEnterprises] = useState<string[]>([]);
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [filterCascade, setFilterCascade] = useState<FilterCascadeState>({
    activeType: null,
    activeItemIndex: 0,
    selectedEnterprise: null,
    selectedWorkshop: null,
    selectedSection: null,
  });

  const sortOptions = [
    { value: 'nameAsc', label: 'По названию (А-Я)' },
    { value: 'nameDesc', label: 'По названию (Я-А)' },
    { value: 'placementAsc', label: 'По размещению ↓' },
    { value: 'placementDesc', label: 'По размещению ↑' },
    { value: 'statusDesc', label: 'По статусу ↓' },
    { value: 'tmcSgd', label: 'По типу (ТМЦ-СГД)' },
    { value: 'sgdTmc', label: 'По типу (СГД-ТМЦ)' },
  ];

  const filterItems = [
    { label: 'Размещение станции', type: 'placement' as FilterSubmenuType },
    { label: 'Статус станции', type: 'status' as FilterSubmenuType },
    { label: 'Тип станции', type: 'type' as FilterSubmenuType },
    { label: 'Выдано сверхнормы', type: 'overissue' as FilterSubmenuType },
    { label: 'Ошибка станции', type: 'error' as FilterSubmenuType },
    { label: 'Очистить фильтр', type: null },
  ];

  const buttons = [
    { icon: Icon1, label: 'Поиск' },
    { icon: Icon2, label: 'Сортировка' },
    { icon: Icon3, label: 'Фильтр' },
    { icon: Icon4, label: 'Предприятие' },
    { icon: Icon5, label: 'Цех' },
    { icon: Icon6, label: 'Участок' },
    { icon: Icon7, label: '' },
    { icon: Icon8, label: '' },
    { icon: Icon9, label: 'Остаток' },
    { icon: Icon10, label: '' },
    { icon: Icon11, label: '' },
  ];

  const isFilterActive = hasFilterSelection;
  const isOstatokActive = minOstatokEnabled || criticalOstatokEnabled;
  const isEnterpriseActive = selectedEnterprises.length > 0;
  const isWorkshopActive = selectedWorkshops.length > 0;
  const isSectionActive = selectedSections.length > 0;

  const getAvailableWorkshops = (): Workshop[] => {
    if (selectedEnterprises.length === 0) {
      return mockWorkshops;
    }
    return mockWorkshops.filter(w => selectedEnterprises.includes(w.enterpriseId));
  };

  const getAvailableSections = (): Section[] => {
    const availableWorkshops = getAvailableWorkshops();
    const workshopIds = availableWorkshops.map(w => w.id);
    
    if (selectedWorkshops.length === 0) {
      return mockSections.filter(s => workshopIds.includes(s.workshopId));
    }
    return mockSections.filter(s => selectedWorkshops.includes(s.workshopId));
  };

  const getFilterWorkshops = (enterpriseId: string): Workshop[] => {
    return mockWorkshops.filter(w => w.enterpriseId === enterpriseId);
  };

  const getFilterSections = (workshopId: string): Section[] => {
    return mockSections.filter(s => s.workshopId === workshopId);
  };

  useEffect(() => {
    const availableWorkshopIds = getAvailableWorkshops().map(w => w.id);
    setSelectedWorkshops(prev => prev.filter(id => availableWorkshopIds.includes(id)));
  }, [selectedEnterprises]);

  useEffect(() => {
    const availableSectionIds = getAvailableSections().map(s => s.id);
    setSelectedSections(prev => prev.filter(id => availableSectionIds.includes(id)));
  }, [selectedWorkshops]);

  const getFilteredAndSortedStations = () => {
    return stationsStatic;
  };

  const displayedStations = getFilteredAndSortedStations();

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
          if (Array.isArray(data) && data.length > 0 && 'name' in data[0]) {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
        setFilterCascade({
          activeType: null,
          activeItemIndex: 0,
          selectedEnterprise: null,
          selectedWorkshop: null,
          selectedSection: null,
        });
      }
      if (ostatokDropdownRef.current && !ostatokDropdownRef.current.contains(event.target as Node)) {
        setShowOstatokDropdown(false);
      }
      if (enterpriseDropdownRef.current && !enterpriseDropdownRef.current.contains(event.target as Node)) {
        setShowEnterpriseDropdown(false);
      }
      if (workshopDropdownRef.current && !workshopDropdownRef.current.contains(event.target as Node)) {
        setShowWorkshopDropdown(false);
      }
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setShowSectionDropdown(false);
      }
    };

    if (showSortDropdown || showFilterDropdown || showOstatokDropdown || showEnterpriseDropdown || showWorkshopDropdown || showSectionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown, showFilterDropdown, showOstatokDropdown, showEnterpriseDropdown, showWorkshopDropdown, showSectionDropdown]);

  const toggleButton = (index: number) => {
    setActiveButtons(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleViewModeToggle = (index: number) => {
    const newMode = index === 9 ? 'grid' : 'list';
    setViewMode(newMode);
    
    setActiveButtons(prev => {
      const otherIndex = index === 9 ? 10 : 9;
      const filtered = prev.filter(i => i !== otherIndex);
      if (!filtered.includes(index)) {
        return [...filtered, index];
      }
      return filtered;
    });
  };

  const closeExpanded = () => {
    if (expandedButton !== null) {
      const closingIndex = expandedButton;
      setClosingButton(closingIndex);
      
      if (closingIndex === 1 && !hasSortSelection) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 0 && !hasSearchQuery) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 2 && !hasFilterSelection) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 8 && !isOstatokActive) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 3 && !isEnterpriseActive) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 4 && !isWorkshopActive) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 5 && !isSectionActive) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      
      setExpandedButton(null);
      setShowSortDropdown(false);
      setShowFilterDropdown(false);
      setFilterCascade({
        activeType: null,
        activeItemIndex: 0,
        selectedEnterprise: null,
        selectedWorkshop: null,
        selectedSection: null,
      });
      setShowOstatokDropdown(false);
      setShowEnterpriseDropdown(false);
      setShowWorkshopDropdown(false);
      setShowSectionDropdown(false);
      
      setClosingButton(null);
    }
  };

  const openButton = (index: number) => {
    if ([0, 1, 2, 3, 4, 5, 8].includes(index)) {
      if (!activeButtons.includes(index)) {
        setActiveButtons(prev => [...prev, index]);
      }
    } else {
      if (!activeButtons.includes(index)) {
        setActiveButtons(prev => [...prev, index]);
      }
    }
    
    setOpeningButton(index);
    
    setTimeout(() => {
      setOpeningButton(null);
      setExpandedButton(index);
      if (index === 1) setShowSortDropdown(true);
      if (index === 2) setShowFilterDropdown(true);
      if (index === 8) setShowOstatokDropdown(true);
      if (index === 3) setShowEnterpriseDropdown(true);
      if (index === 4) setShowWorkshopDropdown(true);
      if (index === 5) setShowSectionDropdown(true);
    }, 150);
  };

  const handleButtonClick = (index: number) => {
    if (index === 9 || index === 10) {
      handleViewModeToggle(index);
      return;
    }
    
    if (index === 6 || index === 7) {
      toggleButton(index);
      return;
    }
    
    if (expandedButton === index) {
      closeExpanded();
    } else {
      if (expandedButton !== null) {
        const prevExpanded = expandedButton;
        
        if (prevExpanded === 1 && !hasSortSelection) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 0 && !hasSearchQuery) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 2 && !hasFilterSelection) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 8 && !isOstatokActive) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 3 && !isEnterpriseActive) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 4 && !isWorkshopActive) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        if (prevExpanded === 5 && !isSectionActive) setActiveButtons(prev => prev.filter(i => i !== prevExpanded));
        
        setExpandedButton(null);
        setShowSortDropdown(false);
        setShowFilterDropdown(false);
        setFilterCascade({
          activeType: null,
          activeItemIndex: 0,
          selectedEnterprise: null,
          selectedWorkshop: null,
          selectedSection: null,
        });
        setShowOstatokDropdown(false);
        setShowEnterpriseDropdown(false);
        setShowWorkshopDropdown(false);
        setShowSectionDropdown(false);
        
        setTimeout(() => {
          openButton(index);
        }, 50);
      } else {
        openButton(index);
      }
    }
  };

  const handleSortSelect = (value: SortOption) => {
    setSortOption(value);
    setHasSortSelection(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setHasSearchQuery(value.trim().length > 0);
  };

  const toggleEnterprise = (enterpriseId: string) => {
    setSelectedEnterprises(prev =>
      prev.includes(enterpriseId)
        ? prev.filter(id => id !== enterpriseId)
        : [...prev, enterpriseId]
    );
  };

  const toggleWorkshop = (workshopId: string) => {
    setSelectedWorkshops(prev =>
      prev.includes(workshopId)
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleFilterItemClick = (e: React.MouseEvent, type: FilterSubmenuType, index: number) => {
    e.stopPropagation();
    if (type === null) {
      setHasFilterSelection(false);
      setFilterCascade({
        activeType: null,
        activeItemIndex: 0,
        selectedEnterprise: null,
        selectedWorkshop: null,
        selectedSection: null,
      });
      return;
    }
    
    setFilterCascade({
      activeType: type,
      activeItemIndex: index,
      selectedEnterprise: null,
      selectedWorkshop: null,
      selectedSection: null,
    });
  };

  const handleFilterEnterpriseSelect = (e: React.MouseEvent, enterpriseId: string) => {
    e.stopPropagation();
    setFilterCascade(prev => ({
      ...prev,
      selectedEnterprise: enterpriseId,
      selectedWorkshop: null,
      selectedSection: null,
    }));
  };

  const handleFilterWorkshopSelect = (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    setFilterCascade(prev => ({
      ...prev,
      selectedWorkshop: workshopId,
      selectedSection: null,
    }));
  };

  const handleFilterSectionSelect = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    setFilterCascade(prev => ({
      ...prev,
      selectedSection: sectionId,
    }));
    setHasFilterSelection(true);
  };

  const handleFilterBack = (e: React.MouseEvent, level: 'enterprise' | 'workshop' | 'section') => {
    e.stopPropagation();
    if (level === 'enterprise') {
      setFilterCascade(prev => ({
        ...prev,
        selectedEnterprise: null,
        selectedWorkshop: null,
        selectedSection: null,
      }));
    } else if (level === 'workshop') {
      setFilterCascade(prev => ({
        ...prev,
        selectedWorkshop: null,
        selectedSection: null,
      }));
    } else if (level === 'section') {
      setFilterCascade(prev => ({
        ...prev,
        selectedSection: null,
      }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        if (expandedButton !== null) {
          closeExpanded();
        }
      }
    };

    if (expandedButton !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedButton, hasSortSelection, hasFilterSelection, hasSearchQuery, isOstatokActive, isEnterpriseActive, isWorkshopActive, isSectionActive]);

  const renderFilterCascadeWindows = () => {
    if (!showFilterDropdown || !filterCascade.activeType) return null;

    const windows: JSX.Element[] = [];
    let leftOffset = 226;
    const itemHeight = 38;
    const baseTop = filterCascade.activeItemIndex * itemHeight;

    if (filterCascade.activeType === 'placement') {
      windows.push(
        <div
          key="enterprise"
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '27px',
            borderTopLeftRadius: '27px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            padding: '8px 0',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '38px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4059' }}>
              Предприятие
            </span>
          </div>
          {mockEnterprises.map((enterprise) => (
            <div
              key={enterprise.id}
              onClick={(e) => handleFilterEnterpriseSelect(e, enterprise.id)}
              style={{
                height: '38px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: filterCascade.selectedEnterprise === enterprise.id ? '#BCC8FF' : '#FFFFFF',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (filterCascade.selectedEnterprise !== enterprise.id) {
                  e.currentTarget.style.backgroundColor = '#E2E8FF';
                }
              }}
              onMouseLeave={(e) => {
                if (filterCascade.selectedEnterprise !== enterprise.id) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              <span style={{ 
                fontSize: '15px', 
                fontWeight: 500, 
                color: filterCascade.selectedEnterprise === enterprise.id ? '#2D4059' : '#9CA3AF' 
              }}>
                {enterprise.name}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      );
      leftOffset += 226;
    }

    if (filterCascade.activeType === 'placement' && filterCascade.selectedEnterprise) {
      const workshops = getFilterWorkshops(filterCascade.selectedEnterprise);
      windows.push(
        <div
          key="workshop"
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '27px',
            borderTopLeftRadius: '27px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            padding: '8px 0',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '38px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={(e) => handleFilterBack(e, 'enterprise')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(180deg)' }}>
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4059' }}>
              Цех
            </span>
          </div>
          {workshops.map((workshop) => (
            <div
              key={workshop.id}
              onClick={(e) => handleFilterWorkshopSelect(e, workshop.id)}
              style={{
                height: '38px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: filterCascade.selectedWorkshop === workshop.id ? '#BCC8FF' : '#FFFFFF',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (filterCascade.selectedWorkshop !== workshop.id) {
                  e.currentTarget.style.backgroundColor = '#E2E8FF';
                }
              }}
              onMouseLeave={(e) => {
                if (filterCascade.selectedWorkshop !== workshop.id) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              <span style={{ 
                fontSize: '15px', 
                fontWeight: 500, 
                color: filterCascade.selectedWorkshop === workshop.id ? '#2D4059' : '#9CA3AF' 
              }}>
                {workshop.name}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      );
      leftOffset += 226;
    }

    if (filterCascade.activeType === 'placement' && filterCascade.selectedWorkshop) {
      const sections = getFilterSections(filterCascade.selectedWorkshop);
      windows.push(
        <div
          key="section"
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '27px',
            borderTopLeftRadius: '27px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            padding: '8px 0',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '38px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={(e) => handleFilterBack(e, 'workshop')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(180deg)' }}>
              <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4059' }}>
              Участок
            </span>
          </div>
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={(e) => handleFilterSectionSelect(e, section.id)}
              style={{
                height: '38px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: filterCascade.selectedSection === section.id ? '#BCC8FF' : '#FFFFFF',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (filterCascade.selectedSection !== section.id) {
                  e.currentTarget.style.backgroundColor = '#E2E8FF';
                }
              }}
              onMouseLeave={(e) => {
                if (filterCascade.selectedSection !== section.id) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              <span style={{ 
                fontSize: '15px', 
                fontWeight: 500, 
                color: filterCascade.selectedSection === section.id ? '#2D4059' : '#9CA3AF' 
              }}>
                {section.name}
              </span>
            </div>
          ))}
        </div>
      );
      leftOffset += 226;
    }

    if (filterCascade.activeType && filterCascade.activeType !== 'placement') {
      windows.push(
        <div
          key="placeholder"
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '27px',
            borderTopLeftRadius: '27px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            padding: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '15px', color: '#9CA3AF' }}>Скоро...</span>
        </div>
      );
    }

    return windows;
  };

  const renderButton = (button: typeof buttons[0], globalIdx: number) => {
    const isActive = activeButtons.includes(globalIdx);
    const isExpanded = expandedButton === globalIdx;
    const isRightTwo = globalIdx === 9 || globalIdx === 10;
    const isSearchButton = globalIdx === 0;
    const isSortButton = globalIdx === 1;
    const isFilterButton = globalIdx === 2;
    const isOstatokButton = globalIdx === 8;
    const isEnterpriseButton = globalIdx === 3;
    const isWorkshopButton = globalIdx === 4;
    const isSectionButton = globalIdx === 5;
    const isNonExpandable = [6, 7].includes(globalIdx);

    const isThisClosing = closingButton === globalIdx;
    const isThisOpening = openingButton === globalIdx;
    
    const showAsActive = isActive && !isThisClosing;
    const backgroundColor = showAsActive ? '#666EFE' : '#FFFFFF';
    
    const actuallyExpanded = isExpanded && !isThisClosing;

    if (isRightTwo) {
      return (
        <button
          key={`button-${globalIdx}`}
          onClick={() => handleButtonClick(globalIdx)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showAsActive
              ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src={button.icon}
            alt={`icon${globalIdx + 1}`}
            style={{
              width: '24px',
              height: '24px',
              filter: showAsActive ? 'brightness(0) invert(1)' : 'none',
              transition: 'filter 0.3s ease',
            }}
          />
        </button>
      );
    }

    if (isNonExpandable) {
      return (
        <button
          key={`button-${globalIdx}`}
          onClick={() => toggleButton(globalIdx)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showAsActive
              ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src={button.icon}
            alt={`icon${globalIdx + 1}`}
            style={{
              width: '24px',
              height: '24px',
              filter: showAsActive ? 'brightness(0) invert(1)' : 'none',
              transition: 'filter 0.3s ease',
            }}
          />
        </button>
      );
    }

    if (isSearchButton) {
      const isSearchActive = activeButtons.includes(globalIdx) || hasSearchQuery;
      const showAsActiveForSearch = isSearchActive && !isThisClosing;
      const backgroundColorForSearch = showAsActiveForSearch ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '314px' : '54px',
              height: '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#666EFE' : backgroundColorForSearch,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: actuallyExpanded ? 'flex-start' : 'center',
              padding: actuallyExpanded ? '0 7px' : '0',
              boxShadow: (showAsActiveForSearch && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease, padding 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0px',
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                width: actuallyExpanded ? 'auto' : '0',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div style={{ width: '74px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400', whiteSpace: 'nowrap' }}>
                      Поиск
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder=""
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                      width: '227px',
                      height: '42px',
                      borderRadius: '27px',
                      backgroundColor: '#E9EDFF',
                      border: 'none',
                      padding: '0 16px',
                      fontSize: '14px',
                      color: '#2D4059',
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForSearch ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isSortButton) {
      const isSortActive = activeButtons.includes(globalIdx) || hasSortSelection;
      const showAsActiveForSort = isSortActive && !isThisClosing;
      const backgroundColorForSort = showAsActiveForSort ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForSort,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForSort && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={sortDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence>
                      {showSortDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ backgroundColor: '#FFFFFF' }}
                        >
                          {sortOptions.map((option) => {
                            const isActive = sortOption === option.value;
                            
                            return (
                              <div
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSortSelect(option.value as SortOption);
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                                style={{
                                  height: '38px',
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: isActive ? '#BCC8FF' : '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: isActive ? '#2D4059' : '#9CA3AF',
                                  }}
                                >
                                  {option.label}
                                </span>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForSort ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isFilterButton) {
      const isFilterButtonActive = activeButtons.includes(globalIdx) || hasFilterSelection;
      const showAsActiveForFilter = isFilterButtonActive && !isThisClosing;
      const backgroundColorForFilter = showAsActiveForFilter ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForFilter,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForFilter && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={filterDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'visible',
                      position: 'relative',
                    }}
                  >
                    <AnimatePresence>
                      {showFilterDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ backgroundColor: '#FFFFFF', position: 'relative' }}
                        >
                          {filterItems.map((item, index) => {
                            const isClearFilter = item.type === null;
                            
                            return (
                              <div
                                key={item.label}
                                onClick={(e) => handleFilterItemClick(e, item.type, index)}
                                style={{
                                  height: '38px',
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  backgroundColor: '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isClearFilter) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isClearFilter) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: '#9CA3AF',
                                  }}
                                >
                                  {item.label}
                                </span>
                                {!isClearFilter && (
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {renderFilterCascadeWindows()}
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForFilter ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isOstatokButton) {
      const isOstatokButtonActive = activeButtons.includes(globalIdx) || isOstatokActive;
      const showAsActiveForOstatok = isOstatokButtonActive && !isThisClosing;
      const backgroundColorForOstatok = showAsActiveForOstatok ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForOstatok,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForOstatok && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={ostatokDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'hidden',
                      padding: '16px',
                    }}
                  >
                    <AnimatePresence>
                      {showOstatokDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                          }}
                        >
                          <div 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMinOstatokEnabled(!minOstatokEnabled);
                            }}
                          >
                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4059' }}>
                              Минимальный остаток
                            </span>
                            <input
                              type="checkbox"
                              checked={minOstatokEnabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                setMinOstatokEnabled(e.target.checked);
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCriticalOstatokEnabled(!criticalOstatokEnabled);
                            }}
                          >
                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4059' }}>
                              Критический остаток
                            </span>
                            <input
                              type="checkbox"
                              checked={criticalOstatokEnabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                setCriticalOstatokEnabled(e.target.checked);
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForOstatok ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isEnterpriseButton) {
      const isEnterpriseButtonActive = activeButtons.includes(globalIdx) || isEnterpriseActive;
      const showAsActiveForEnterprise = isEnterpriseButtonActive && !isThisClosing;
      const backgroundColorForEnterprise = showAsActiveForEnterprise ? '#666EFE' : '#FFFFFF';
      const availableEnterprises = mockEnterprises;
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForEnterprise,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForEnterprise && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={enterpriseDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    <AnimatePresence>
                      {showEnterpriseDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ backgroundColor: '#FFFFFF' }}
                        >
                          {availableEnterprises.map((enterprise) => {
                            const isChecked = selectedEnterprises.includes(enterprise.id);
                            
                            return (
                              <div
                                key={enterprise.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEnterprise(enterprise.id);
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                                style={{
                                  height: '38px',
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  backgroundColor: isChecked ? '#BCC8FF' : '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: isChecked ? '#2D4059' : '#9CA3AF',
                                  }}
                                >
                                  {enterprise.name}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleEnterprise(enterprise.id);
                                  }}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForEnterprise ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isWorkshopButton) {
      const isWorkshopButtonActive = activeButtons.includes(globalIdx) || isWorkshopActive;
      const showAsActiveForWorkshop = isWorkshopButtonActive && !isThisClosing;
      const backgroundColorForWorkshop = showAsActiveForWorkshop ? '#666EFE' : '#FFFFFF';
      const availableWorkshops = getAvailableWorkshops();
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForWorkshop,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForWorkshop && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={workshopDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    <AnimatePresence>
                      {showWorkshopDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ backgroundColor: '#FFFFFF' }}
                        >
                          {availableWorkshops.map((workshop) => {
                            const isChecked = selectedWorkshops.includes(workshop.id);
                            
                            return (
                              <div
                                key={workshop.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWorkshop(workshop.id);
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                                style={{
                                  height: '38px',
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  backgroundColor: isChecked ? '#BCC8FF' : '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: isChecked ? '#2D4059' : '#9CA3AF',
                                  }}
                                >
                                  {workshop.name}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleWorkshop(workshop.id);
                                  }}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForWorkshop ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isSectionButton) {
      const isSectionButtonActive = activeButtons.includes(globalIdx) || isSectionActive;
      const showAsActiveForSection = isSectionButtonActive && !isThisClosing;
      const backgroundColorForSection = showAsActiveForSection ? '#666EFE' : '#FFFFFF';
      const availableSections = getAvailableSections();
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: actuallyExpanded ? '226px' : '54px',
              height: actuallyExpanded ? 'auto' : '54px',
              minHeight: actuallyExpanded ? 'auto' : '54px',
              borderRadius: '27px',
              backgroundColor: actuallyExpanded ? '#FFFFFF' : backgroundColorForSection,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: actuallyExpanded ? '0' : '0',
              boxShadow: (showAsActiveForSection && !actuallyExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: actuallyExpanded 
                ? 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), min-height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease'
                : 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), background-color 0s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: actuallyExpanded ? 1 : 0,
                transition: actuallyExpanded
                  ? 'opacity 0.3s ease 0.45s' 
                  : 'opacity 0.15s ease',
                pointerEvents: actuallyExpanded ? 'auto' : 'none',
              }}
            >
              {actuallyExpanded && (
                <>
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '27px',
                      borderTopRightRadius: '27px',
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={sectionDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '27px',
                      borderBottomRightRadius: '27px',
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    <AnimatePresence>
                      {showSectionDropdown && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ backgroundColor: '#FFFFFF' }}
                        >
                          {availableSections.map((section) => {
                            const isChecked = selectedSections.includes(section.id);
                            
                            return (
                              <div
                                key={section.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSection(section.id);
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                                style={{
                                  height: '38px',
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  backgroundColor: isChecked ? '#BCC8FF' : '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: isChecked ? '#2D4059' : '#9CA3AF',
                                  }}
                                >
                                  {section.name}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSection(section.id);
                                  }}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: (!actuallyExpanded || isThisOpening) ? 1 : 0,
                transition: (!actuallyExpanded || isThisOpening)
                  ? 'opacity 0.3s ease 0.15s' 
                  : 'opacity 0.1s ease',
                pointerEvents: !actuallyExpanded ? 'auto' : 'none',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: '24px',
                  height: '24px',
                  filter: showAsActiveForSection ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0s ease',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderStationsGrid = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 220px)',
        gap: '30px',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '40px',
        paddingRight: '15px',
        width: 'max-content',
      }}
    >
      {displayedStations.map((station) => {
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
            parentUid={station.parentUid}
            hasError={station.hasError}
            isTmc={station.isTmc}
            isSgd={station.isSgd}
            isOk={station.isOk}
            filledCellsPercent={dynamic?.filledCellsPercent}
            remainingNomenclaturePercent={dynamic?.remainingNomenclaturePercent}
            readyPartsPercent={dynamic?.readyPartsPercent}
            totalCells={dynamic?.totalCells}
            filledCells={dynamic?.filledCells}
            templateNomenclatureCount={dynamic?.templateNomenclatureCount}
            remainingNomenclatureCount={dynamic?.remainingNomenclatureCount}
            maxReadyParts={dynamic?.maxReadyParts}
            readyPartsCount={dynamic?.readyPartsCount}
          />
        );
      })}
    </div>
  );

  const renderStationsList = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '40px',
        paddingRight: '15px',
        width: 'max-content',
      }}
    >
      {displayedStations.map((station) => {
        const dynamic = stationsDynamic.get(station.uid);
        return (
          <StationRow
            key={station.uid}
            uid={station.uid}
            name={station.name}
            workshop={station.workshop}
            section={station.section}
            status={station.status}
            stationType={station.stationType}
            parentUid={station.parentUid}
            hasError={station.hasError}
            isTmc={station.isTmc}
            isSgd={station.isSgd}
            isOk={station.isOk}
            filledCellsPercent={dynamic?.filledCellsPercent}
            remainingNomenclaturePercent={dynamic?.remainingNomenclaturePercent}
            readyPartsPercent={dynamic?.readyPartsPercent}
            totalCells={dynamic?.totalCells}
            filledCells={dynamic?.filledCells}
            templateNomenclatureCount={dynamic?.templateNomenclatureCount}
            remainingNomenclatureCount={dynamic?.remainingNomenclatureCount}
            maxReadyParts={dynamic?.maxReadyParts}
            readyPartsCount={dynamic?.readyPartsCount}
          />
        );
      })}
    </div>
  );

  const isFirstThreeExpanded = expandedButton !== null && expandedButton <= 2;

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
          Панель управления станциями
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

          <div 
            style={{ 
              width: isFirstThreeExpanded ? '0px' : '170px',
              transition: 'width 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
              overflow: 'hidden',
            }} 
          />

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

      <div
        style={{
          position: 'absolute',
          top: '160px',
          bottom: '30px',
          left: '0',
          right: '15px',
          overflow: 'auto',
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
          viewMode === 'grid' ? renderStationsGrid() : renderStationsList()
        )}
      </div>
    </div>
  );
};

export default StationsPage;