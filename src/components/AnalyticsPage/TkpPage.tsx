// TkpPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useRef, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import CustomScrollbar from '../../components/CustomScrollbar';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import { useTabs } from '../../context/TabContext';
import Icon4 from '../../assets/References/Icon4.svg';
import Icon7 from '../../assets/References/Icon7.svg';
import Icon8 from '../../assets/References/Icon8.svg';
import Icon9 from '../../assets/References/Icon9.svg';
import Icon10 from '../../assets/References/Icon10.svg';
import Popup1 from '../../assets/References/popup1.svg';

interface TkpItem {
  tkp_uid: string;
  order_uid: string;
  customer_id: string;
  order_number: string;
  order_datetime: string;
  total_cost: number;
  delivery_date: string;
  status?: string;
  statusinvoice?: string;
}

const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 638;
const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const VISIBLE_ROWS = 10;

const TkpPage = () => {
  const { activeTabId, openTab } = useTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'active' | 'closed'>('active');
  const activeListTabRef = useRef(activeListTab);
  const [tkpList, setTkpList] = useState<TkpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    activeListTabRef.current = activeListTab;
  }, [activeListTab]);

  const fetchTkp = async () => {
    try {
      const url = activeListTab === 'active' ? ConstantInfo.restApiTkpActive : ConstantInfo.restApiTkpClosed;
      const response = await AxiosService.get(url);
      setTkpList(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки ТКП:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTkp();
  }, [activeListTab]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8085/ws-stations'),
      onConnect: () => {
        console.log('AWMS TkpPage WebSocket connected')
        
        const refresh = () => {
          const tab = activeListTabRef.current;
          const url = tab === 'active' ? ConstantInfo.restApiTkpActive : ConstantInfo.restApiTkpClosed;
          AxiosService.get(url).then(res => {
            setTkpList(res.data || []);
          }).catch(err => {
            console.error('Ошибка загрузки ТКП:', err);
          }).finally(() => {
            setIsLoading(false);
          });
        };
        
        client.subscribe('/topic/tkp/new', refresh);
        client.subscribe('/topic/tkp/status', refresh);
        client.subscribe('/topic/orders/refresh', refresh);
      },
      onDisconnect: () => console.log('AWMS TkpPage WebSocket disconnected'),
      onStompError: (frame) => console.error('STOMP error:', frame)
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [])

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [tkpList]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(container);
    return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const handleTkpClick = (tkpUid: string) => {
    openTab(`/tkp/${tkpUid}`, `ТКП ${tkpUid.slice(0, 8)}`, null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#666EFE';
      case 'closed': return '#FF3052';
      default: return '#6B7280';
    }
  };

  const getStatusInvoiceColor = (statusinvoice: string) => {
    switch (statusinvoice) {
      case 'unaccept': return '#6B7280';
      case 'accept': return '#10B981';
      case 'inrealise': return '#666EFE';
      case 'paid': return '#F59E0B';
      case 'unpaid': return '#EF4444';
      case 'cancelcustomer': return '#FF3052';
      case 'cancelprovider': return '#FF3052';
      default: return '#6B7280';
    }
  };

  const getStatusInvoiceLabel = (statusinvoice: string) => {
    switch (statusinvoice) {
      case 'unaccept': return 'Не принят';
      case 'accept': return 'Подтверждён';
      case 'inrealise': return 'В реализации';
      case 'paid': return 'Оплачен';
      case 'unpaid': return 'Не оплачен';
      case 'cancelcustomer': return 'Отменён заказчиком';
      case 'cancelprovider': return 'Отменён поставщиком';
      default: return statusinvoice || '—';
    }
  };

  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const mediumButtonStyle: React.CSSProperties = { height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 };

  const emptyRows = Math.max(0, VISIBLE_ROWS - tkpList.length);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ position: 'absolute', top: 35, left: 60 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>ТКП</h1>
      </div>

      <div style={{ position: 'absolute', top: 110, left: 55, right: 55, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button onClick={() => setActiveListTab('active')} style={{ ...mediumButtonStyle, width: 124, backgroundColor: activeListTab === 'active' ? '#666EFE' : '#FFFFFF' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: activeListTab === 'active' ? '#FFFFFF' : '#2D4059', marginLeft: 12 }}>Активные</span>
          </button>
          <button onClick={() => setActiveListTab('closed')} style={{ ...mediumButtonStyle, width: 124, backgroundColor: activeListTab === 'closed' ? '#666EFE' : '#FFFFFF' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: activeListTab === 'closed' ? '#FFFFFF' : '#2D4059', marginLeft: 12 }}>Закрытые</span>
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon10} alt="" style={{ width: 18, height: 16 }} /></button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 162, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 40, paddingRight: 40 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 2.5 }}>UID ТКП</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 2.5 }}>UID ЗАКАЗА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1.5 }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1.5 }}>ЗАКАЗЧИК</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>СТОИМ.</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ПОСТАВКА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1.5 }}>ИНВОЙС</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 0.8 }}>СТАТУС</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {tkpList.map((tkp, index) => {
                const isFirst = index === 0;
                const isLast = index === tkpList.length - 1;
                return (
                  <div key={tkp.tkp_uid} onClick={() => handleTkpClick(tkp.tkp_uid)} style={{
                    height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
                    backgroundColor: '#FFFFFF', cursor: 'pointer',
                    borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
                    borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
                    paddingLeft: 40, paddingRight: 40,
                  }}>
                    <span style={{ flex: 2.5, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: '#2D4059', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tkp.tkp_uid}</span>
                    <span style={{ flex: 2.5, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tkp.order_uid}</span>
                    <span style={{ flex: 1.5, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{tkp.order_number || '—'}</span>
                    <span style={{ flex: 1.5, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{tkp.customer_id || '—'}</span>
                    <span style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>{tkp.total_cost?.toLocaleString()} ₽</span>
                    <span style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059' }}>{tkp.delivery_date || '—'}</span>
                    <span style={{ flex: 1.5, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: getStatusInvoiceColor(tkp.statusinvoice || '') }}>{getStatusInvoiceLabel(tkp.statusinvoice || '')}</span>
                    <span style={{ flex: 0.8, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: getStatusColor(tkp.status || '') }}>{tkp.status || '—'}</span>
                  </div>
                );
              })}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }} />
              ))}
            </div>
          </div>
        </div>
        {hasVerticalScroll && (<div style={{ position: 'absolute', right: -25, top: HEADER_HEIGHT, height: TABLE_HEIGHT - HEADER_HEIGHT, width: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>)}
        {hasHorizontalScroll && (<div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} /></div>)}
      </div>
    </div>
  );
};

export default TkpPage;