// OrdersPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface OrderItem {
  order_uid: string;
  customer_id: string;
  order_number: string;
  order_datetime: string;
  status?: string;
  statusreason?: string;
  statustrack?: string;
}

type ContextMenuType = 'order';

interface ContextMenuState {
  x: number;
  y: number;
  uid: string;
  type: ContextMenuType;
}

const OrdersPage = () => {
  const navigate = useNavigate();
  const { activeTabId, openTab } = useTabs();
  const tabIdRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

  const [activeListTab, setActiveListTab] = useState<'active' | 'closed'>('active');
  const activeListTabRef = useRef(activeListTab);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const TABLE_WIDTH = 1720;
  const TABLE_HEIGHT = 638;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 10;

  const COL_CHECKBOX = 20;
  const COL_UID = 340;
  const COL_CUSTOMER = 580;
  const COL_NUMBER = 840;
  const COL_DATETIME = 1060;
  const COL_STATUS = 1280;
  const COL_STATUSREASON = 1440;
  const COL_TRACK = 1620;

  const getStatusReasonLabel = (statusreason: string): string => {
    const labels: Record<string, string> = {
      'inprocessing': 'В обработке',
      'inworkprovider': 'В работе у поставщика',
      'posttkpprovider': 'ТКП направлено',
      'done': 'Завершён',
      'cancelcustomer': 'Отменён заказчиком',
      'cancelprovider': 'Отменён поставщиком',
    };
    return labels[statusreason] || statusreason || '—';
  };

  const getTrackLabel = (statustrack: string): string => {
    const labels: Record<string, string> = {
      'notinwork': 'Не в работе',
      'inwork': 'В работе',
      'intransitoutside': 'Транзит зарубеж',
      'customs': 'Таможня',
      'intransitinside': 'Транзит РФ',
      'warehouse': 'На складе',
      'sorting': 'Сортировка',
      'sent': 'Отправлен',
      'courier': 'У курьера',
      'done': 'Вручен',
    };
    return labels[statustrack] || '—';
  };

  useEffect(() => {
    tabIdRef.current = activeTabId;
  }, []);

  useEffect(() => {
    activeListTabRef.current = activeListTab;
  }, [activeListTab]);

  const fetchOrders = async () => {
    try {
      const url = activeListTab === 'active' ? ConstantInfo.restApiOrdersActive : ConstantInfo.restApiOrdersClosed;
      const response = await AxiosService.get(url);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTabId && activeTabId === tabIdRef.current && orders.length > 0) {
      fetchOrders();
    }
  }, [activeTabId]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  useEffect(() => {
    fetchOrders();
  }, [activeListTab]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8085/ws-stations'),
      onConnect: () => {
        console.log('AWMS OrdersPage WebSocket connected')
        
        const refresh = () => {
          const tab = activeListTabRef.current;
          const url = tab === 'active' ? ConstantInfo.restApiOrdersActive : ConstantInfo.restApiOrdersClosed;
          AxiosService.get(url).then(res => {
            setOrders(res.data || []);
          }).catch(err => {
            console.error('Ошибка загрузки заказов:', err);
          }).finally(() => {
            setIsLoading(false);
          });
        };
        
        client.subscribe('/topic/tkp/new', refresh);
        client.subscribe('/topic/tkp/status', refresh);
        client.subscribe('/topic/orders/refresh', refresh);
      },
      onDisconnect: () => console.log('AWMS OrdersPage WebSocket disconnected'),
      onStompError: (frame) => console.error('STOMP error:', frame)
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [])

  const toggleSelectAll = () => {
    if (orders.length === 0) return;
    const allSelected = orders.every(o => selectedIds.has(o.order_uid));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) orders.forEach(o => next.delete(o.order_uid));
      else orders.forEach(o => next.add(o.order_uid));
      return next;
    });
  };

  const toggleSelectItem = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, uid: string, type: ContextMenuType) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, uid, type });
  };

  const handleContextOpen = () => {
    if (!contextMenu) return;
    const { uid } = contextMenu;
    setContextMenu(null);
    openTab(`/orders/${uid}`, `Заказ ${uid.slice(0, 8)}`, null);
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    setContextMenu(null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleCreateClick = async () => {
    const newUid = crypto.randomUUID();
    openTab(`/orders/create/${newUid}`, 'Заказ (новый)', null);
  };

  const handleOrderClick = (orderUid: string) => {
    openTab(`/orders/${orderUid}`, `Заказ ${orderUid.slice(0, 8)}`, null);
  };

  const isHeaderSelected = (): boolean => {
    if (orders.length === 0) return false;
    return orders.every(o => selectedIds.has(o.order_uid));
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [orders]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(container);
    return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const mediumButtonStyle: React.CSSProperties = { height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 };

  const EmptySquare = ({ isSelected = false, onClick, isHeader = false }: { isSelected?: boolean; onClick?: (e: React.MouseEvent) => void; isHeader?: boolean }) => (
    <div onClick={(e) => { e.stopPropagation(); onClick?.(e); }} style={{ width: 18, height: 18, borderRadius: 2, border: isSelected ? 'none' : `2px solid ${isHeader ? '#FFFFFF' : '#2D4059'}`, opacity: isHeader && !isSelected ? 1 : isSelected ? 1 : 0.5, flexShrink: 0, boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isSelected && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  const contextMenuButtonStyle: React.CSSProperties = { height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' };

  const cellTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400, color: '#2D4059',
    position: 'absolute', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };

  const emptyRows = Math.max(0, VISIBLE_ROWS - orders.length);

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
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: '#2D4059', margin: 0, lineHeight: '29px', height: 29 }}>Заказы</h1>
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
        <div style={{ position: 'absolute', left: 586, display: 'flex', gap: 15 }}>
          <button style={{ ...mediumButtonStyle, width: 124 }} onClick={handleCreateClick}>
            <img src={Icon4} alt="" style={{ width: 16, height: 16, marginLeft: 12 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать</span>
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
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: 20, paddingRight: 40, boxSizing: 'border-box' }}>
            <EmptySquare isSelected={isHeaderSelected()} onClick={toggleSelectAll} isHeader />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 47 }}>UID ЗАКАЗА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_CUSTOMER }}>ЗАКАЗЧИК</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NUMBER }}>НОМЕР</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_DATETIME }}>ДАТА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_STATUS }}>СТАТУС</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_STATUSREASON }}>СОСТОЯНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_TRACK }}>ТРЕК</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {orders.map((order, index) => {
                const isSelected = selectedIds.has(order.order_uid);
                const isFirst = index === 0;
                const isLast = index === orders.length - 1;
                return (
                  <div
                    key={order.order_uid}
                    style={{
                      height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
                      backgroundColor: isSelected ? '#EDF6FF' : '#FFFFFF',
                      position: 'relative', cursor: 'pointer', boxSizing: 'border-box',
                      borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
                      borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
                    }}
                    onContextMenu={(e) => handleContextMenu(e, order.order_uid, 'order')}
                    onClick={() => handleOrderClick(order.order_uid)}
                  >
                    <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}>
                      <EmptySquare isSelected={isSelected} onClick={() => toggleSelectItem(order.order_uid)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 19 }}>
                      <img src={Popup1} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 10, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.order_uid}</span>
                    </div>
                    <span style={{ ...cellTextStyle, left: COL_CUSTOMER, maxWidth: COL_NUMBER - COL_CUSTOMER - 20 }}>{order.customer_id || '—'}</span>
                    <span style={{ ...cellTextStyle, left: COL_NUMBER, maxWidth: COL_DATETIME - COL_NUMBER - 20 }}>{order.order_number || '—'}</span>
                    <span style={{ ...cellTextStyle, left: COL_DATETIME, maxWidth: COL_STATUS - COL_DATETIME - 20 }}>{order.order_datetime || '—'}</span>
                    <span style={{ ...cellTextStyle, left: COL_STATUS, maxWidth: COL_STATUSREASON - COL_STATUS - 20, fontWeight: 500, color: order.status === 'closed' ? '#FF3052' : '#666EFE' }}>{order.status || '—'}</span>
                    <span style={{ ...cellTextStyle, left: COL_STATUSREASON, maxWidth: COL_TRACK - COL_STATUSREASON - 20, color: '#6B7280' }}>{getStatusReasonLabel(order.statusreason || '')}</span>
                    <span style={{ ...cellTextStyle, left: COL_TRACK, maxWidth: TABLE_WIDTH - COL_TRACK - 60, color: '#10B981', fontWeight: 500 }}>{getTrackLabel(order.statustrack || '')}</span>
                  </div>
                );
              })}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', paddingLeft: 20, borderTop: '0.5px solid #E5ECF5', borderBottom: '0.5px solid #E5ECF5' }}><EmptySquare /></div>
              ))}
            </div>
          </div>
        </div>
        {hasVerticalScroll && (<div style={{ position: 'absolute', right: -25, top: HEADER_HEIGHT, height: TABLE_HEIGHT - HEADER_HEIGHT, width: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>)}
        {hasHorizontalScroll && (<div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} /></div>)}
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button style={contextMenuButtonStyle} onClick={handleContextOpen}>
            <img src={Icon4} alt="" style={{ width: 16, height: 16, marginRight: 16 }} />
            Открыть
          </button>
          <button style={contextMenuButtonStyle} onClick={handleContextDelete}>
            <img src={Icon7} alt="" style={{ width: 18, height: 18, marginRight: 16 }} />
            Удалить
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные элементы? Это действие нельзя отменить.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;