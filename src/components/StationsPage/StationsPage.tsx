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
  selectedEnterprises: string[];
  selectedWorkshops: string[];
  selectedSections: string[];
}

const StationsPage = () => {
  const [activeButtons, setActiveButtons] = useState<number[]>([9]);
  const [expandedButton, setExpandedButton] = useState<number | null>(null);
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

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedOverissue, setSelectedOverissue] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const [filterCascade, setFilterCascade] = useState<FilterCascadeState>({
    activeType: null,
    activeItemIndex: 0,
    selectedEnterprises: [],
    selectedWorkshops: [],
    selectedSections: [],
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

  const statusOptions = [
    'В работе',
    'Не в сети',
    'Минимальный остаток',
    'Критический остаток',
  ];

  const typeOptions = [
    'СГД',
    'Операционная карта',
    'ТМЦ',
    'Связанные модули',
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

  const isFilterActive = selectedEnterprises.length > 0 || 
                         selectedWorkshops.length > 0 || 
                         selectedSections.length > 0 ||
                         selectedStatuses.length > 0 || 
                         selectedTypes.length > 0 || 
                         selectedOverissue !== null || 
                         selectedError !== null;
  
  const isOstatokActive = minOstatokEnabled || criticalOstatokEnabled;
  const isEnterpriseActive = selectedEnterprises.length > 0;
  const isWorkshopActive = selectedWorkshops.length > 0;
  const isSectionActive = selectedSections.length > 0;

  const isPlacementActive = selectedEnterprises.length > 0 || selectedWorkshops.length > 0 || selectedSections.length > 0;
  const isStatusActive = selectedStatuses.length > 0;
  const isTypeActive = selectedTypes.length > 0;
  const isOverissueActive = selectedOverissue !== null;
  const isErrorActive = selectedError !== null;

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

  const getFilterWorkshops = (enterpriseIds: string[]): Workshop[] => {
    if (enterpriseIds.length === 0) return mockWorkshops;
    return mockWorkshops.filter(w => enterpriseIds.includes(w.enterpriseId));
  };

  const getFilterSections = (workshopIds: string[]): Section[] => {
    if (workshopIds.length === 0) return [];
    return mockSections.filter(s => workshopIds.includes(s.workshopId));
  };

  useEffect(() => {
    setFilterCascade(prev => ({
      ...prev,
      selectedEnterprises: selectedEnterprises,
      selectedWorkshops: [],
      selectedSections: [],
    }));
  }, [selectedEnterprises]);

  useEffect(() => {
    if (selectedWorkshops.length > 0) {
      setFilterCascade(prev => ({
        ...prev,
        selectedWorkshops: selectedWorkshops,
        selectedSections: [],
      }));
    }
  }, [selectedWorkshops]);

  useEffect(() => {
    if (selectedSections.length > 0) {
      setFilterCascade(prev => ({
        ...prev,
        selectedSections: selectedSections,
      }));
    }
  }, [selectedSections]);

  useEffect(() => {
    const availableWorkshopIds = getAvailableWorkshops().map(w => w.id);
    setSelectedWorkshops(prev => prev.filter(id => availableWorkshopIds.includes(id)));
  }, [selectedEnterprises]);

  useEffect(() => {
    const availableSectionIds = getAvailableSections().map(s => s.id);
    setSelectedSections(prev => prev.filter(id => availableSectionIds.includes(id)));
  }, [selectedWorkshops]);

  const getFilteredAndSortedStations = () => {
    let filtered = [...stationsStatic];

    if (searchQuery.trim()) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (hasSortSelection) {
      switch (sortOption) {
        case 'nameAsc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'nameDesc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'tmcSgd':
          filtered.sort((a, b) => {
            if (a.isTmc && !b.isTmc) return -1;
            if (!a.isTmc && b.isTmc) return 1;
            return 0;
          });
          break;
        case 'sgdTmc':
          filtered.sort((a, b) => {
            if (a.isSgd && !b.isSgd) return -1;
            if (!a.isSgd && b.isSgd) return 1;
            return 0;
          });
          break;
      }
    }

    return filtered;
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
      
      if (closingIndex === 1 && !hasSortSelection) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 0 && !hasSearchQuery) {
        setActiveButtons(prev => prev.filter(i => i !== closingIndex));
      }
      if (closingIndex === 2 && !isFilterActive) {
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
      setFilterCascade(prev => ({
        ...prev,
        activeType: null,
        activeItemIndex: 0,
      }));
      setShowOstatokDropdown(false);
      setShowEnterpriseDropdown(false);
      setShowWorkshopDropdown(false);
      setShowSectionDropdown(false);
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
    
    setExpandedButton(index);
    if (index === 1) setShowSortDropdown(true);
    if (index === 2) {
      setShowFilterDropdown(true);
      setFilterCascade(prev => ({
        ...prev,
        selectedEnterprises: selectedEnterprises,
        selectedWorkshops: selectedWorkshops,
        selectedSections: selectedSections,
      }));
    }
    if (index === 8) setShowOstatokDropdown(true);
    if (index === 3) setShowEnterpriseDropdown(true);
    if (index === 4) setShowWorkshopDropdown(true);
    if (index === 5) setShowSectionDropdown(true);
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
        closeExpanded();
      }
      openButton(index);
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
      setSelectedEnterprises([]);
      setSelectedWorkshops([]);
      setSelectedSections([]);
      setSelectedStatuses([]);
      setSelectedTypes([]);
      setSelectedOverissue(null);
      setSelectedError(null);
      setFilterCascade({
        activeType: null,
        activeItemIndex: 0,
        selectedEnterprises: [],
        selectedWorkshops: [],
        selectedSections: [],
      });
      return;
    }
    
    if (filterCascade.activeType === type) {
      setFilterCascade(prev => ({
        ...prev,
        activeType: null,
        activeItemIndex: 0,
      }));
      return;
    }
    
    setFilterCascade(prev => ({
      ...prev,
      activeType: type,
      activeItemIndex: index,
      selectedEnterprises: selectedEnterprises,
      selectedWorkshops: selectedWorkshops,
      selectedSections: selectedSections,
    }));
  };

  const toggleFilterEnterprise = (e: React.MouseEvent, enterpriseId: string) => {
    e.stopPropagation();
    setSelectedEnterprises(prev =>
      prev.includes(enterpriseId)
        ? prev.filter(id => id !== enterpriseId)
        : [...prev, enterpriseId]
    );
    setSelectedWorkshops([]);
    setSelectedSections([]);
  };

  const toggleFilterWorkshop = (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    setSelectedWorkshops(prev =>
      prev.includes(workshopId)
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]
    );
    setSelectedSections([]);
  };

  const toggleFilterSection = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectOverissue = (value: string) => {
    setSelectedOverissue(value);
  };

  const selectError = (value: string) => {
    setSelectedError(value);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        if (expandedButton !== null) {
          closeExpanded();
        }
        return;
      }
      
      if (expandedButton === null) {
        if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
          setShowSortDropdown(false);
        }
        if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
          setShowFilterDropdown(false);
          setFilterCascade(prev => ({
            ...prev,
            activeType: null,
            activeItemIndex: 0,
          }));
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedButton, expandedRef]);

  const renderFilterCascadeWindows = () => {
    if (!showFilterDropdown || !filterCascade.activeType) return null;

    const windows: JSX.Element[] = [];
    let leftOffset = 230;
    const itemHeight = 38;
    const baseTop = filterCascade.activeItemIndex * itemHeight;

    if (filterCascade.activeType === 'placement') {
      const availableEnterprises = mockEnterprises;
      
      windows.push(
        <motion.div
          key="enterprise"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '54px',
              backgroundColor: '#666EFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
              Предприятие
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableEnterprises.map((enterprise) => {
              const isChecked = selectedEnterprises.includes(enterprise.id);
              return (
                <div
                  key={enterprise.id}
                  onClick={(e) => toggleFilterEnterprise(e, enterprise.id)}
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
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: 500, 
                    color: isChecked ? '#2D4059' : '#9CA3AF' 
                  }}>
                    {enterprise.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFilterEnterprise(e as any, enterprise.id);
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      );
      leftOffset += 230;
    }

    if (filterCascade.activeType === 'placement' && selectedEnterprises.length > 0) {
      const workshops = getFilterWorkshops(selectedEnterprises);
      
      windows.push(
        <motion.div
          key="workshop"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '54px',
              backgroundColor: '#666EFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
              Цех
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {workshops.map((workshop) => {
              const isChecked = selectedWorkshops.includes(workshop.id);
              return (
                <div
                  key={workshop.id}
                  onClick={(e) => toggleFilterWorkshop(e, workshop.id)}
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
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: 500, 
                    color: isChecked ? '#2D4059' : '#9CA3AF' 
                  }}>
                    {workshop.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFilterWorkshop(e as any, workshop.id);
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      );
      leftOffset += 230;
    }

    if (filterCascade.activeType === 'placement' && selectedWorkshops.length > 0) {
      const sections = getFilterSections(selectedWorkshops);
      
      windows.push(
        <motion.div
          key="section"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              height: '54px',
              backgroundColor: '#666EFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: '400' }}>
              Участок
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {sections.map((section) => {
              const isChecked = selectedSections.includes(section.id);
              return (
                <div
                  key={section.id}
                  onClick={(e) => toggleFilterSection(e, section.id)}
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
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: 500, 
                    color: isChecked ? '#2D4059' : '#9CA3AF' 
                  }}>
                    {section.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFilterSection(e as any, section.id);
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      );
      leftOffset += 230;
    }

    if (filterCascade.activeType === 'status') {
      windows.push(
        <motion.div
          key="status"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map((status) => {
            const isChecked = selectedStatuses.includes(status);
            return (
              <div
                key={status}
                onClick={() => toggleStatus(status)}
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
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: 500, 
                  color: isChecked ? '#2D4059' : '#9CA3AF' 
                }}>
                  {status}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStatus(status)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </motion.div>
      );
    }

    if (filterCascade.activeType === 'type') {
      windows.push(
        <motion.div
          key="type"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {typeOptions.map((type) => {
            const isChecked = selectedTypes.includes(type);
            return (
              <div
                key={type}
                onClick={() => toggleType(type)}
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
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: 500, 
                  color: isChecked ? '#2D4059' : '#9CA3AF' 
                }}>
                  {type}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleType(type)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </motion.div>
      );
    }

    if (filterCascade.activeType === 'overissue') {
      windows.push(
        <motion.div
          key="overissue"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {['Да', 'Нет'].map((option) => {
            const isChecked = selectedOverissue === option;
            return (
              <div
                key={option}
                onClick={() => selectOverissue(option)}
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
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: 500, 
                  color: isChecked ? '#2D4059' : '#9CA3AF' 
                }}>
                  {option}
                </span>
                <input
                  type="radio"
                  name="overissue"
                  checked={isChecked}
                  onChange={() => selectOverissue(option)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </motion.div>
      );
    }

    if (filterCascade.activeType === 'error') {
      windows.push(
        <motion.div
          key="error"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${baseTop}px`,
            width: '226px',
            backgroundColor: '#FFFFFF',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {['Да', 'Нет'].map((option) => {
            const isChecked = selectedError === option;
            return (
              <div
                key={option}
                onClick={() => selectError(option)}
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
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#E2E8FF';
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: 500, 
                  color: isChecked ? '#2D4059' : '#9CA3AF' 
                }}>
                  {option}
                </span>
                <input
                  type="radio"
                  name="error"
                  checked={isChecked}
                  onChange={() => selectError(option)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#666EFE' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </motion.div>
      );
    }

    return windows;
  };

  const getExpandedWidth = (index: number): number => {
    if (index === 0) return 314;
    return 226;
  };

  const calculateGapWidth = () => {
    if (expandedButton === null) return 342;
    
    if (expandedButton <= 2) {
      const expandedWidth = getExpandedWidth(expandedButton);
      const extraWidth = expandedWidth - 54;
      return Math.max(0, 342 - extraWidth);
    }
    
    return 342;
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
    
    const showAsActive = isActive;
    const backgroundColor = showAsActive ? '#666EFE' : '#FFFFFF';

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
      const showAsActiveForSearch = isSearchActive;
      const backgroundColorForSearch = showAsActiveForSearch ? '#666EFE' : '#FFFFFF';
      const expandedWidth = 314;
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? expandedWidth : 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#666EFE' : backgroundColorForSearch,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0 7px' : '0',
              boxShadow: (showAsActiveForSearch && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease, padding 0.4s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div style={{ width: 74, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400, whiteSpace: 'nowrap' }}>
                      Поиск
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder=""
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                      width: 227,
                      height: 42,
                      borderRadius: 27,
                      backgroundColor: '#E9EDFF',
                      border: 'none',
                      padding: '0 16px',
                      fontSize: 14,
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForSearch ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isSortButton) {
      const isSortActive = activeButtons.includes(globalIdx) || hasSortSelection;
      const showAsActiveForSort = isSortActive;
      const backgroundColorForSort = showAsActiveForSort ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForSort,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForSort && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={sortDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
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
                                  height: 38,
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
                                    fontSize: 15,
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForSort ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isFilterButton) {
      const isFilterButtonActive = activeButtons.includes(globalIdx) || isFilterActive;
      const showAsActiveForFilter = isFilterButtonActive;
      const backgroundColorForFilter = showAsActiveForFilter ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForFilter,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForFilter && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={filterDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
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
                            let isItemActive = false;
                            
                            if (item.type === 'placement') isItemActive = isPlacementActive;
                            else if (item.type === 'status') isItemActive = isStatusActive;
                            else if (item.type === 'type') isItemActive = isTypeActive;
                            else if (item.type === 'overissue') isItemActive = isOverissueActive;
                            else if (item.type === 'error') isItemActive = isErrorActive;
                            
                            return (
                              <div
                                key={item.label}
                                onClick={(e) => handleFilterItemClick(e, item.type, index)}
                                style={{
                                  height: 38,
                                  padding: '0 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  backgroundColor: isItemActive ? '#BCC8FF' : '#FFFFFF',
                                  transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isItemActive) e.currentTarget.style.backgroundColor = '#E2E8FF';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isItemActive) e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: isItemActive ? '#2D4059' : '#9CA3AF',
                                  }}
                                >
                                  {item.label}
                                </span>
                                {!isClearFilter && (
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4L10 8L6 12" stroke={isItemActive ? '#2D4059' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForFilter ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isOstatokButton) {
      const isOstatokButtonActive = activeButtons.includes(globalIdx) || isOstatokActive;
      const showAsActiveForOstatok = isOstatokButtonActive;
      const backgroundColorForOstatok = showAsActiveForOstatok ? '#666EFE' : '#FFFFFF';
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForOstatok,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForOstatok && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={ostatokDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
                      overflow: 'hidden',
                      padding: 16,
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
                            gap: 16,
                          }}
                        >
                          <div 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMinOstatokEnabled(!minOstatokEnabled);
                            }}
                          >
                            <span style={{ fontSize: 15, fontWeight: 500, color: '#2D4059' }}>
                              Минимальный остаток
                            </span>
                            <input
                              type="checkbox"
                              checked={minOstatokEnabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                setMinOstatokEnabled(e.target.checked);
                              }}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#666EFE' }}
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
                            <span style={{ fontSize: 15, fontWeight: 500, color: '#2D4059' }}>
                              Критический остаток
                            </span>
                            <input
                              type="checkbox"
                              checked={criticalOstatokEnabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                setCriticalOstatokEnabled(e.target.checked);
                              }}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#666EFE' }}
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForOstatok ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isEnterpriseButton) {
      const isEnterpriseButtonActive = activeButtons.includes(globalIdx) || isEnterpriseActive;
      const showAsActiveForEnterprise = isEnterpriseButtonActive;
      const backgroundColorForEnterprise = showAsActiveForEnterprise ? '#666EFE' : '#FFFFFF';
      const availableEnterprises = mockEnterprises;
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForEnterprise,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForEnterprise && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={enterpriseDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: 300,
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
                                  height: 38,
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
                                    fontSize: 15,
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
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#666EFE' }}
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForEnterprise ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isWorkshopButton) {
      const isWorkshopButtonActive = activeButtons.includes(globalIdx) || isWorkshopActive;
      const showAsActiveForWorkshop = isWorkshopButtonActive;
      const backgroundColorForWorkshop = showAsActiveForWorkshop ? '#666EFE' : '#FFFFFF';
      const availableWorkshops = getAvailableWorkshops();
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForWorkshop,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForWorkshop && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={workshopDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: 300,
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
                                  height: 38,
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
                                    fontSize: 15,
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
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#666EFE' }}
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForWorkshop ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (isSectionButton) {
      const isSectionButtonActive = activeButtons.includes(globalIdx) || isSectionActive;
      const showAsActiveForSection = isSectionButtonActive;
      const backgroundColorForSection = showAsActiveForSection ? '#666EFE' : '#FFFFFF';
      const availableSections = getAvailableSections();
      
      return (
        <div key={`button-${globalIdx}`} style={{ display: 'inline-flex', position: 'relative' }}>
          <div
            ref={isExpanded ? expandedRef : null}
            onClick={() => handleButtonClick(globalIdx)}
            style={{
              width: isExpanded ? 226 : 54,
              height: isExpanded ? 'auto' : 54,
              minHeight: isExpanded ? 'auto' : 54,
              borderRadius: 27,
              backgroundColor: isExpanded ? '#FFFFFF' : backgroundColorForSection,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              boxShadow: (showAsActiveForSection && !isExpanded)
                ? '0 4px 12px rgba(102, 110, 254, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'width 0.4s ease, height 0.4s ease, min-height 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isExpanded ? 200 : 1,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              {isExpanded && (
                <>
                  <div
                    style={{
                      height: 54,
                      backgroundColor: '#666EFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 27,
                      borderTopRightRadius: 27,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 400 }}>
                      {button.label}
                    </span>
                  </div>
                  <div
                    ref={sectionDropdownRef}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 27,
                      borderBottomRightRadius: 27,
                      overflow: 'hidden',
                      padding: '8px 0',
                      maxHeight: 300,
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
                                  height: 38,
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
                                    fontSize: 15,
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
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#666EFE' }}
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
                opacity: isExpanded ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isExpanded ? 'none' : 'auto',
              }}
            >
              <img
                src={button.icon}
                alt={`icon${globalIdx + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  filter: showAsActiveForSection ? 'brightness(0) invert(1)' : 'none',
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
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
    </motion.div>
  );

  const renderStationsList = () => (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
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
    </motion.div>
  );

  const gapWidth = calculateGapWidth();

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
              width: `${gapWidth}px`,
              transition: 'width 0.4s ease',
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
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? renderStationsGrid() : renderStationsList()}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default StationsPage;