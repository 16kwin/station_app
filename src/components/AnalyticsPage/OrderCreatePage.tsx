// OrderCreatePage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import CatalogSelectPopup from '../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import type { PopupType } from '../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import CustomScrollbar from '../../components/CustomScrollbar';
import Icon7 from '../../assets/References/NomenclatureCreatePage/Icon7.svg';
import Icon31 from '../../assets/References/NomenclatureCreatePage/Icon31.svg';
import Icon32 from '../../assets/References/NomenclatureCreatePage/Icon32.svg';

interface OrderProduct {
  localId: string;
  productUid: string;
  productName: string;
  article: string;
  quantity: number;
}

const TRACK_STAGES: Record<string, string> = {
  'notinwork': 'Не в работе',
  'inwork': 'Принят в работу',
  'intransitoutside': 'Транзит за пределами РФ',
  'customs': 'На таможне',
  'intransitinside': 'Транзит на территории РФ',
  'warehouse': 'Прибыл на склад',
  'sorting': 'Сортировка',
  'sent': 'Отправлен получателю',
  'courier': 'У курьера',
  'done': 'Вручен',
};

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 600;
const VISIBLE_ROWS = 9;

const OrderCreatePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancellable, setIsCancellable] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const getPopupOpenKey = () => `order_popup_open_${uid}`;
  const [popupOpen, setPopupOpen] = useState(() => sessionStorage.getItem(getPopupOpenKey()) === 'true');
  const [popupType, setPopupType] = useState<PopupType>('analogSelect');

  const COL_NAME = 60;
  const COL_ARTICLE = 620;
  const COL_QUANTITY = 1100;
  const COL_ACTIONS = 1450;

  useEffect(() => {
    if (!uid) return;
    const cp = window.location.pathname;
    const isCreate = cp.includes('/create/');
    setIsEdit(!isCreate);

    if (!isCreate) {
      loadOrderData(uid);
    }

    sessionStorage.setItem(getPopupOpenKey(), 'false');
  }, [uid]);

  const loadOrderData = async (orderUid: string) => {
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiOrderGet(orderUid));
      const data = res.data;
      setOrderData(data);

      if (data && data.products) {
        const loadedProducts: OrderProduct[] = data.products.map((p: any) => ({
          localId: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productUid: p.product_uid || '',
          productName: p.product || '',
          article: p.article || '',
          quantity: p.quantity || 1,
        }));
        setProducts(loadedProducts);
      }
      
      // Можно отменить только если нет ТКП и заказ не closed
      const orderStatus = data.status || '';
      const orderStatusReason = data.statusreason || '';
      if (orderStatus !== 'closed' && orderStatusReason !== 'posttkpprovider' && orderStatusReason !== 'cancelcustomer') {
        setIsCancellable(true);
      }
      
      setIsSent(true);
    } catch (e) {
      console.error('Ошибка загрузки заказа:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const openPopup = () => {
    if (isSent || isEdit) return;
    setPopupType('analogSelect');
    setPopupOpen(true);
    if (uid) sessionStorage.setItem(getPopupOpenKey(), 'true');
  };

  const handlePopupSelect = (id: string, nm: string) => {
    const existing = products.find(p => p.productUid === id);
    if (existing) return;

    setProducts(prev => [...prev, {
      localId: `prod_${Date.now()}`,
      productUid: id,
      productName: nm,
      article: '',
      quantity: 1,
    }]);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    if (uid) sessionStorage.removeItem(getPopupOpenKey());
  };

  const updateQuantity = (localId: string, value: number) => {
    if (isSent || isEdit) return;
    setProducts(prev => prev.map(p =>
      p.localId === localId ? { ...p, quantity: Math.max(1, value) } : p
    ));
  };

  const removeProduct = (localId: string) => {
    if (isSent || isEdit) return;
    setProducts(prev => prev.filter(p => p.localId !== localId));
  };

  const handleSend = async () => {
    if (!uid || products.length === 0 || isSent) return;
    setIsSending(true);
    try {
      const body = {
        products: products.map(p => ({
          productUid: p.productUid,
          quantity: p.quantity,
        })),
        orderNumber: `ORD-${Date.now()}`,
      };
      await AxiosService.post(ConstantInfo.restApiOrderCreate(uid!), body);

      if (uid) sessionStorage.removeItem(getPopupOpenKey());
      setIsSent(true);
    } catch (e) {
      console.error('Ошибка отправки заказа:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!uid) return;
    setIsCancelling(true);
    try {
      await AxiosService.post(`${ConstantInfo.restApiOrderCreate(uid)}/cancel`);
      setIsSent(true);
      setIsCancellable(false);
    } catch (e) {
      console.error('Ошибка отмены заказа:', e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    const t = tabs.find(tab => tab.id === activeTabId);
    if (t) closeTab(t.id);
    if (uid) sessionStorage.removeItem(getPopupOpenKey());
  };

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

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [products]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll); ro.observe(container);
    return () => { container.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const bottomButtonStyle: React.CSSProperties = {
    height: 51, borderRadius: 10,
    border: '1px solid rgba(102, 110, 254, 0.15)',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const cellTextStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
    position: 'absolute', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };

  const emptyRows = Math.max(0, VISIBLE_ROWS - products.length);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  const readOnly = isEdit || isSent;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
        {isEdit ? 'Заказ (Просмотр)' : 'Заказ (Создание)'}
      </h1>
      <button onClick={() => setShowClosePopup(true)} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
        <img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} />
      </button>

      {isEdit && orderData && (
        <div style={{ position: 'absolute', top: 75, left: 60, right: 60 }}>
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>UID:</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280' }}>{uid}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Статус:</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: orderData.status === 'closed' ? '#FF3052' : '#666EFE' }}>{orderData.status || 'active'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Состояние:</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{getStatusReasonLabel(orderData.statusreason)}</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(102, 110, 254, 0.15)', padding: 20, marginBottom: 10 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Трек поставки: </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#10B981' }}>{TRACK_STAGES[orderData.statustrack] || 'Не в работе'}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {Object.entries(TRACK_STAGES).map(([value, label]) => (
                <div
                  key={value}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    border: '1px solid rgba(102, 110, 254, 0.15)',
                    backgroundColor: orderData.statustrack === value ? '#10B981' : '#F5F6FA',
                    color: orderData.statustrack === value ? '#FFFFFF' : '#9CA3AF',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                    opacity: orderData.statustrack === value ? 1 : 0.5,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!readOnly && (
        <div style={{ position: 'absolute', top: 100, right: 60 }}>
          <button onClick={openPopup} style={{
            height: 44, paddingLeft: 20, paddingRight: 20,
            borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)',
            backgroundColor: '#FFFFFF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
          }}>
            <img src={Icon31} alt="" style={{ width: 14.5, height: 18 }} />
            Добавить номенклатуру
          </button>
        </div>
      )}

      <div style={{ position: 'absolute', top: isEdit ? 220 : 162, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 60, paddingRight: 40 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_QUANTITY }}>КОЛИЧЕСТВО</span>
            {!readOnly && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ACTIONS }}>ДЕЙСТВИЯ</span>
            )}
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {products.map((product, index) => {
                const isFirst = index === 0;
                const isLast = index === products.length - 1;
                return (
                  <div key={product.localId} style={{
                    height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
                    backgroundColor: '#FFFFFF', position: 'relative',
                    borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
                    borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
                    paddingLeft: 60, paddingRight: 40,
                  }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', maxWidth: COL_ARTICLE - 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.productName}
                    </span>
                    <span style={{ ...cellTextStyle, left: COL_ARTICLE, maxWidth: COL_QUANTITY - COL_ARTICLE - 20 }}>
                      {product.article || '—'}
                    </span>
                    <input type="number" value={product.quantity} onChange={e => updateQuantity(product.localId, parseInt(e.target.value) || 1)} min="1" disabled={readOnly} style={{
                      position: 'absolute', left: COL_QUANTITY, width: 100, height: 36,
                      borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)',
                      paddingLeft: 10, fontFamily: 'Inter, sans-serif', fontSize: 14,
                      fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box',
                      backgroundColor: readOnly ? '#F5F6FA' : '#FFFFFF',
                    }} />
                    {!readOnly && (
                      <button onClick={() => removeProduct(product.localId)} style={{
                        position: 'absolute', left: COL_ACTIONS, height: 36, paddingLeft: 15, paddingRight: 15,
                        borderRadius: 8, border: '1px solid rgba(102, 110, 254, 0.15)',
                        backgroundColor: '#FFFFFF', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FF3052',
                      }}>
                        Удалить
                      </button>
                    )}
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

      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
        {!readOnly ? (
          <button onClick={handleSend} disabled={isSending || products.length === 0} style={{
            ...bottomButtonStyle, width: 180,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
            color: '#FFFFFF',
            backgroundColor: products.length > 0 && !isSending ? '#666EFE' : '#BCC8FF',
            border: 'none', opacity: isSending ? 0.6 : 1,
            cursor: products.length > 0 && !isSending ? 'pointer' : 'not-allowed',
          }}>
            {isSending ? 'Отправка...' : 'Отправить заказ'}
          </button>
        ) : isSent && !isEdit ? (
          <button disabled style={{
            ...bottomButtonStyle, width: 180,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
            color: '#FFFFFF',
            backgroundColor: '#10B981',
            border: 'none', cursor: 'not-allowed',
          }}>
            ✓ Записано
          </button>
        ) : null}
        {isEdit && isCancellable && (
          <button onClick={handleCancelOrder} disabled={isCancelling} style={{
            ...bottomButtonStyle, width: 180,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
            color: '#FFFFFF',
            backgroundColor: !isCancelling ? '#FF3052' : '#BCC8FF',
            border: 'none', opacity: isCancelling ? 0.6 : 1,
            cursor: !isCancelling ? 'pointer' : 'not-allowed',
          }}>
            {isCancelling ? 'Отмена...' : 'Отменить заказ'}
          </button>
        )}
        <button onClick={() => setShowClosePopup(true)} style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
          Закрыть
        </button>
      </div>

      {!readOnly && (
        <CatalogSelectPopup isOpen={popupOpen} onClose={handlePopupClose} onSelect={handlePopupSelect} popupType={popupType} filterParam={undefined} />
      )}

      {showClosePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClosePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Закрыть вкладку</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Закрыть вкладку?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleClose} style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Закрыть</button>
              <button onClick={() => setShowClosePopup(false)} style={{ height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreatePage;