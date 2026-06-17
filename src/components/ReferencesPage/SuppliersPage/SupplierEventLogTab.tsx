// SupplierEventLogTab.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonSupplierProps } from './SupplierCreatePage';

interface EventLogItem {
  uid: string;
  supplierUid: string;
  eventType: string;
  eventDescription: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  author: string;
  source: string;
  createdAt: string;
}

const SupplierEventLogTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const fetchEvents = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiSupplierEvents(uid));
      setEvents(res.data || []);
    } catch (e) {
      console.error('Ошибка загрузки событий:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uid) fetchEvents();
  }, [uid]);

  useEffect(() => {
    const handler = () => { if (uid) fetchEvents(); };
    window.addEventListener('refreshSupplierEvents', handler);
    return () => window.removeEventListener('refreshSupplierEvents', handler);
  }, [uid]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [events]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });
    } catch { return dateStr; }
  };

  const getEventTypeBadge = (eventType: string): React.CSSProperties => {
    switch (eventType) {
      case 'CREATE': return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
      case 'UPDATE': return { backgroundColor: '#FFF3E0', color: '#E65100' };
      case 'ADD': return { backgroundColor: '#E3F2FD', color: '#1565C0' };
      case 'DELETE': return { backgroundColor: '#FFEBEE', color: '#C62828' };
      default: return { backgroundColor: '#F5F5F5', color: '#616161' };
    }
  };

  const getEventTypeLabel = (eventType: string): string => {
    switch (eventType) {
      case 'CREATE': return 'Создание';
      case 'UPDATE': return 'Изменение';
      case 'ADD': return 'Добавление';
      case 'DELETE': return 'Удаление';
      default: return eventType;
    }
  };

  const TABLE_WIDTH = 1665;
  const HEADER_HEIGHT = 54;
  const ROW_HEIGHT = 54;
  const TABLE_HEIGHT = 486;

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 600, color: '#2D4059' }}>
            Журнал событий
          </span>
        </div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ДАТА И ВРЕМЯ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 120 }}>ТИП</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>ИСТОЧНИК</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>АВТОР</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>СОБЫТИЕ</span>
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
                </div>
              ) : events.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет событий</span>
                </div>
              ) : (
                events.map(event => {
                  const badgeStyle = getEventTypeBadge(event.eventType);
                  return (
                    <div key={event.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', position: 'relative' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 200 }}>{formatDate(event.createdAt)}</span>
                      <span style={{ 
                        width: 100, height: 28, borderRadius: 6, 
                        backgroundColor: badgeStyle.backgroundColor, 
                        color: badgeStyle.color,
                        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginRight: 20
                      }}>
                        {getEventTypeLabel(event.eventType)}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.source}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.author}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.eventDescription}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>
    </div>
  );
};

export default SupplierEventLogTab;