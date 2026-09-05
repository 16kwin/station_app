// EventLogTab.tsx — ПОЛНЫЙ ФАЙЛ (HistoryTable + поиск)
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import HistoryTable from '../../elements/HistoryTable';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps } from './NomenclatureCreatePage';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';

interface EventLogItem {
  uid: string;
  materialUid: string;
  eventType: string;
  eventDescription: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  author: string;
  source: string;
  createdAt: string;
}

const BTN_COLLAPSED = 40;
const BTN_SEARCH_EXPANDED = 280;

const EventLogTab: React.FC<CommonProps> = (props) => {
  const { uid } = props;

  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureEvents(uid));
      setEvents(res.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid) fetchEvents(); }, [uid]);
  useEffect(() => { const handler = () => { if (uid) fetchEvents(); }; window.addEventListener('refreshEvents', handler); return () => window.removeEventListener('refreshEvents', handler); }, [uid]);
  useEffect(() => { if (searchExpanded && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100); }, [searchExpanded]);

  const historyEvents = events.map(e => ({
    uid: e.uid,
    createdAt: e.createdAt,
    author: e.author,
    eventDescription: e.eventDescription,
  }));

  const searchWidth = searchExpanded ? BTN_SEARCH_EXPANDED : BTN_COLLAPSED;
  const tween = { type: 'tween' as const, duration: 0.2 };

  return (
    <div style={{ position: 'absolute', top: 155, left: 30, right: 30, bottom: 96 }}>
      <div style={{ position: 'absolute', top: 0, left: 15, zIndex: 10, height: 40 }}>
        <motion.div 
          style={{ position: 'absolute', left: 0, top: 0, height: 40, borderRadius: 10, backgroundColor: searchExpanded ? '#666EFE' : '#FFFFFF', border: searchExpanded ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'default', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }} 
          animate={{ width: searchWidth }} 
          transition={tween}
        >
          <div onClick={searchExpanded ? () => { setSearchExpanded(false); setSearchValue(''); } : () => setSearchExpanded(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <img src={searchExpanded ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </div>
          {searchExpanded && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 8 }}>
              <input ref={searchInputRef} type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', maxWidth: 211, height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
            </div>
          )}
        </motion.div>
      </div>
      <div style={{ position: 'absolute', top: 52, left: 0 }}>
        <HistoryTable
          events={historyEvents}
          isLoading={isLoading}
          tableWidth={1740}
          visibleRows={8}
          rowHeight={58}
          headerHeight={58}
          dateLabel="Дата и время"
          authorLabel="Автор"
          eventLabel="Событие"
          searchValue={searchValue}
        />
      </div>
    </div>
  );
};

export default EventLogTab;