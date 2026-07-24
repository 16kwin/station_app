// TkpViewPage.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import CustomScrollbar from '../../components/CustomScrollbar';
import Icon7 from '../../assets/References/NomenclatureCreatePage/Icon7.svg';

interface TkpProduct {
  product_uid: string;
  product: string;
  article: string;
  quantity: number;
  price: number;
  cost: number;
  group?: string;
  type?: string;
  description?: string;
  manufacturer?: string;
  country?: string;
  brand?: string;
  model?: string;
  images?: string[];
  draws?: string[];
  barcode?: { code: string; codeimage: string };
  sku?: { code: string; image: string };
  specifications?: { characteristic: string; unit: string; value: string }[];
  analogues?: { uid: string; name: string; model: string }[];
}

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const TABLE_WIDTH = 1720;
const TABLE_HEIGHT = 500;
const VISIBLE_ROWS = 9;

const TkpViewPage = () => {
  const { uid } = useParams<{ uid: string }>();
  const { tabs, activeTabId, closeTab } = useTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

  const [tkpData, setTkpData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TkpProduct | null>(null);

  const COL_NAME = 60;
  const COL_ARTICLE = 500;
  const COL_QUANTITY = 850;
  const COL_PRICE = 1100;
  const COL_COST = 1400;

  useEffect(() => {
    if (!uid) return;
    loadTkpData(uid);
  }, [uid]);

  const loadTkpData = async (tkpUid: string) => {
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiTkpGet(tkpUid));
      setTkpData(res.data);
    } catch (e) {
      console.error('Ошибка загрузки ТКП:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const canConfirm = tkpData && (!tkpData.statusinvoice || tkpData.statusinvoice === 'unaccept');
  const canCancel = tkpData && (!tkpData.statusinvoice || tkpData.statusinvoice === 'unaccept');
  const isProcessed = tkpData && (
    tkpData.statusinvoice === 'accept' || 
    tkpData.statusinvoice === 'inrealise' || 
    tkpData.statusinvoice === 'paid' || 
    tkpData.statusinvoice === 'unpaid' || 
    tkpData.statusinvoice === 'cancelcustomer' || 
    tkpData.statusinvoice === 'cancelprovider'
  );

  const handleConfirm = async () => {
    if (!uid) return;
    setIsConfirming(true);
    try {
      await AxiosService.post(`${ConstantInfo.restApiTkpGet(uid)}/confirm`, { status: 'Подтверждён' });
      setIsConfirmed(true);
      loadTkpData(uid);
    } catch (e) {
      console.error('Ошибка подтверждения ТКП:', e);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!uid) return;
    setIsConfirming(true);
    try {
      await AxiosService.post(`${ConstantInfo.restApiTkpGet(uid)}/cancel`);
      setIsConfirmed(true);
      loadTkpData(uid);
    } catch (e) {
      console.error('Ошибка отклонения ТКП:', e);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    const t = tabs.find(tab => tab.id === activeTabId);
    if (t) closeTab(t.id);
  };

  const handleProductClick = (product: TkpProduct) => {
    setSelectedProduct(product);
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
      default: return 'Ожидает';
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

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const timer = setTimeout(checkScroll, 350); return () => clearTimeout(timer); }, [tkpData]);
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

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  if (!tkpData) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>ТКП не найден</span>
      </div>
    );
  }

  const products: TkpProduct[] = tkpData.products || [];
  const emptyRows = Math.max(0, VISIBLE_ROWS - products.length);

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF' }}>
      <h1 style={{ position: 'absolute', top: 35, left: 60, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#2D4059', margin: 0, lineHeight: '29px' }}>
        ТКП: {tkpData.ordernumber || uid}
      </h1>
      <button onClick={() => setShowClosePopup(true)} style={{ position: 'absolute', top: 40, right: 40, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
        <img src={Icon7} alt="Закрыть" style={{ width: 18, height: 18 }} />
      </button>

      <div style={{ position: 'absolute', top: 80, left: 60, right: 60, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>UID ТКП: </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{uid}</span>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>UID заказа: </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{tkpData.order_uid}</span>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Заказчик: </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{tkpData.customer}</span>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Дата поставки: </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{tkpData.delivery_date}</span>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059' }}>Статус ТКП: </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: getStatusInvoiceColor(tkpData.statusinvoice) }}>{getStatusInvoiceLabel(tkpData.statusinvoice)}</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, color: '#2D4059' }}>
            Итого: {Number(tkpData.total_cost).toLocaleString()} ₽
          </span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 130, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 60, paddingRight: 40 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NAME }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_QUANTITY }}>КОЛ-ВО</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_PRICE }}>ЦЕНА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_COST }}>СТОИМОСТЬ</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {products.map((product, index) => {
                const isFirst = index === 0;
                const isLast = index === products.length - 1;
                return (
                  <div key={product.product_uid || index} style={{
                    height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
                    backgroundColor: '#FFFFFF', position: 'relative',
                    borderTop: isFirst ? 'none' : '0.5px solid #E5ECF5',
                    borderBottom: isLast ? 'none' : '0.5px solid #E5ECF5',
                    paddingLeft: 60, paddingRight: 40,
                  }}>
                    <span onClick={() => handleProductClick(product)} style={{ position: 'absolute', left: COL_NAME, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#666EFE', maxWidth: COL_ARTICLE - COL_NAME - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline' }}>
                      {product.product}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_ARTICLE }}>{product.article || '—'}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_QUANTITY }}>{product.quantity}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_PRICE }}>{product.price?.toLocaleString()} ₽</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', position: 'absolute', left: COL_COST }}>{product.cost?.toLocaleString()} ₽</span>
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
        {!isProcessed ? (
          <>
            {canConfirm && (
              <button onClick={handleConfirm} disabled={isConfirming} style={{
                ...bottomButtonStyle, width: 180,
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
                color: '#FFFFFF',
                backgroundColor: !isConfirming ? '#10B981' : '#BCC8FF',
                border: 'none', opacity: isConfirming ? 0.6 : 1,
                cursor: !isConfirming ? 'pointer' : 'not-allowed',
              }}>
                {isConfirming ? 'Подтверждение...' : 'Подтвердить'}
              </button>
            )}
            {canCancel && (
              <button onClick={handleCancel} disabled={isConfirming} style={{
                ...bottomButtonStyle, width: 180,
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
                color: '#FFFFFF',
                backgroundColor: !isConfirming ? '#FF3052' : '#BCC8FF',
                border: 'none', opacity: isConfirming ? 0.6 : 1,
                cursor: !isConfirming ? 'pointer' : 'not-allowed',
              }}>
                {isConfirming ? 'Отклонение...' : 'Отклонить'}
              </button>
            )}
          </>
        ) : (
          <button disabled style={{
            ...bottomButtonStyle, width: 180,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400,
            color: '#FFFFFF',
            backgroundColor: '#10B981',
            border: 'none', cursor: 'not-allowed',
          }}>
            ✓ Обработано
          </button>
        )}
        <button onClick={() => setShowClosePopup(true)} style={{ ...bottomButtonStyle, width: 116, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>
          Закрыть
        </button>
      </div>

      {selectedProduct && (
        <div onClick={() => setSelectedProduct(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 900, maxHeight: '80vh', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2D4059' }}>{selectedProduct.product}</h2>
              <button onClick={() => setSelectedProduct(null)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: 18, color: '#2D4059' }}>✕</button>
            </div>
            <Section title="Основная информация">
              <DetailRow label="UID" value={selectedProduct.product_uid} />
              <DetailRow label="Артикул" value={selectedProduct.article} />
              <DetailRow label="Группа" value={selectedProduct.group} />
              <DetailRow label="Вид" value={selectedProduct.type} />
              <DetailRow label="Производитель" value={selectedProduct.manufacturer} />
              <DetailRow label="Страна" value={selectedProduct.country} />
              <DetailRow label="Бренд" value={selectedProduct.brand} />
              <DetailRow label="Модель" value={selectedProduct.model} />
              <DetailRow label="Количество" value={selectedProduct.quantity} />
              <DetailRow label="Цена" value={`${selectedProduct.price?.toLocaleString()} ₽`} />
              <DetailRow label="Стоимость" value={`${selectedProduct.cost?.toLocaleString()} ₽`} />
              {selectedProduct.description && <DetailRow label="Описание" value={selectedProduct.description} />}
            </Section>
            {selectedProduct.specifications?.length > 0 && (
              <Section title="Характеристики">
                {selectedProduct.specifications.map((spec, i) => (
                  <DetailRow key={i} label={spec.characteristic} value={`${spec.value} ${spec.unit || ''}`} />
                ))}
              </Section>
            )}
            {selectedProduct.barcode && (
              <Section title="Штрихкод">
                <DetailRow label="Код" value={selectedProduct.barcode.code} />
                {selectedProduct.barcode.codeimage && <img src={`data:image/png;base64,${selectedProduct.barcode.codeimage}`} alt="Штрихкод" style={{ maxWidth: 300, marginTop: 8 }} />}
              </Section>
            )}
            {selectedProduct.sku && (
              <Section title="SKU">
                <DetailRow label="Код" value={selectedProduct.sku.code} />
                {selectedProduct.sku.image && <img src={`data:image/png;base64,${selectedProduct.sku.image}`} alt="SKU" style={{ maxWidth: 150, marginTop: 8 }} />}
              </Section>
            )}
            {selectedProduct.images?.length > 0 && (
              <Section title="Изображения">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selectedProduct.images.map((img, i) => <img key={i} src={`data:image/png;base64,${img}`} alt="" style={{ width: 150, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}
                </div>
              </Section>
            )}
            {selectedProduct.draws?.length > 0 && (
              <Section title="Чертежи">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selectedProduct.draws.map((draw, i) => <img key={i} src={`data:image/png;base64,${draw}`} alt="" style={{ width: 200, height: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(102,110,254,0.15)' }} />)}
                </div>
              </Section>
            )}
            {selectedProduct.analogues?.length > 0 && (
              <Section title="Аналоги">
                {selectedProduct.analogues.map((analog, i) => (
                  <div key={i} style={{ display: 'flex', gap: 20, padding: '8px 0' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059' }}>{analog.name}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>{analog.model}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>UID: {analog.uid}</span>
                  </div>
                ))}
              </Section>
            )}
          </div>
        </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#666EFE', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(102,110,254,0.15)' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#2D4059', minWidth: 150 }}>{label}:</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', wordBreak: 'break-word' }}>{String(value)}</span>
    </div>
  );
}

export default TkpViewPage;