// PriceHistoryTab.tsx — все месяцы снизу
import React from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import type { CommonProps } from './NomenclatureCreatePage';

const PriceHistoryTab: React.FC<CommonProps> = (props) => {
  const {
    prices, showAddPricePopup,
    newPrice, newPriceDate,
    setShowAddPricePopup, setNewPrice, setNewPriceDate,
    handleAddPrice, handleDeletePrice,
  } = props;

  const sortedPrices = [...prices].sort((a, b) => new Date(a.priceDate).getTime() - new Date(b.priceDate).getTime());

  const renderChart = () => {
    if (sortedPrices.length === 0) return null;
    const cw = 490, ch = 220;
    const pad = { top: 15, right: 15, bottom: 22, left: 5 };
    const pw = cw - pad.left - pad.right, ph = ch - pad.top - pad.bottom;
    const maxP = Math.max(...sortedPrices.map(p => p.price)) * 1.1;
    const minP = Math.min(...sortedPrices.map(p => p.price)) * 0.9;
    const range = maxP - minP || 1;

    const firstDate = new Date(sortedPrices[0].priceDate);
    const lastDate = new Date(sortedPrices[sortedPrices.length - 1].priceDate);
    const firstTime = firstDate.getTime();
    const lastTime = lastDate.getTime();
    const timeRange = lastTime - firstTime || 1;

    // Все точки
    const allPts = sortedPrices.map(p => {
      const t = new Date(p.priceDate).getTime();
      return {
        x: pad.left + ((t - firstTime) / timeRange) * pw,
        y: pad.top + ph - ((p.price - minP) / range) * ph,
      };
    });

    // Точки по месяцам (ближайшая к 1 числу)
    const monthlyPoints = () => {
      const months = new Map<string, typeof sortedPrices[0]>();
      sortedPrices.forEach(p => {
        const d = new Date(p.priceDate);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!months.has(key) || Math.abs(d.getDate() - 1) < Math.abs(new Date(months.get(key)!.priceDate).getDate() - 1)) {
          months.set(key, p);
        }
      });
      return Array.from(months.values()).sort((a, b) => new Date(a.priceDate).getTime() - new Date(b.priceDate).getTime());
    };

    const monthPts = monthlyPoints();

    // Все месяцы в диапазоне
    const allMonths: { x: number; label: string }[] = [];
    const startMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const endMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    for (let d = new Date(startMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
      const t = d.getTime();
      allMonths.push({
        x: pad.left + ((t - firstTime) / timeRange) * pw,
        label: d.toLocaleDateString('ru', { month: 'short' }),
      });
    }

    // Плавная кривая
    let smoothPath = '';
    if (allPts.length === 1) {
      smoothPath = `M ${allPts[0].x} ${allPts[0].y}`;
    } else if (allPts.length === 2) {
      smoothPath = `M ${allPts[0].x} ${allPts[0].y} L ${allPts[1].x} ${allPts[1].y}`;
    } else {
      smoothPath = `M ${allPts[0].x} ${allPts[0].y}`;
      for (let i = 1; i < allPts.length - 1; i++) {
        const xc = (allPts[i].x + allPts[i + 1].x) / 2;
        const yc = (allPts[i].y + allPts[i + 1].y) / 2;
        smoothPath += ` Q ${allPts[i].x} ${allPts[i].y} ${xc} ${yc}`;
      }
      smoothPath += ` L ${allPts[allPts.length - 1].x} ${allPts[allPts.length - 1].y}`;
    }

    const gradientId = `pg-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <svg width={cw} height={ch} style={{ fontFamily: 'Inter, sans-serif', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#666EFE" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#666EFE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${smoothPath} L ${allPts[allPts.length - 1].x} ${ch - pad.bottom} L ${allPts[0].x} ${ch - pad.bottom} Z`} fill={`url(#${gradientId})`} />
        <path d={smoothPath} fill="none" stroke="#666EFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Точки данных по месяцам */}
        {monthPts.map((p, i) => {
          const t = new Date(p.priceDate).getTime();
          const x = pad.left + ((t - firstTime) / timeRange) * pw;
          const y = pad.top + ph - ((p.price - minP) / range) * ph;
          return <circle key={`pt-${i}`} cx={x} cy={y} r="4" fill="#666EFE" />;
        })}
        {/* Подписи всех месяцев */}
        {allMonths.map((m, i) => (
          <text key={`m-${i}`} x={m.x} y={ch - 3} textAnchor="middle" fontSize="10" fill="#2D4059">{m.label}</text>
        ))}
      </svg>
    );
  };

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <div style={smallButtonStyle} />
          <div style={smallButtonStyle} />
          <button onClick={() => setShowAddPricePopup(true)} style={{ ...smallButtonStyle, width: 40 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={{ position: 'absolute', bottom: 156, left: 73, width: 490, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {sortedPrices.length > 0 ? renderChart() : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#9CA3AF' }}>Нет данных о ценах</span>}
        </div>
        <div style={{ position: 'absolute', top: 83, right: 40, display: 'flex', gap: 10 }}>
          <div style={{ width: 1054, height: 432, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 250 }}>ДАТА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 100 }}>ДИНАМИКА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ЦЕНА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ПОСТАВЩИК</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {sortedPrices.length > 0 ? sortedPrices.map((p, i) => {
                const prev = i > 0 ? sortedPrices[i - 1].price : null;
                const change = prev !== null ? p.price - prev : null;
                const isLast = i === sortedPrices.length - 1;
                return (
                  <div key={p.uid} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 40, borderTop: '0.7px solid #666EFE', backgroundColor: isLast ? '#F0F1FF' : '#FFFFFF', position: 'relative' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', width: 250 }}>{new Date(p.priceDate).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ width: 100, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: change === null ? '#9CA3AF' : change > 0 ? '#22C55E' : change < 0 ? '#EF4444' : '#9CA3AF' }}>
                      {change === null ? '—' : change > 0 ? `▲ +${change.toFixed(2)}` : change < 0 ? `▼ ${change.toFixed(2)}` : '—'}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', width: 200 }}>{p.price.toFixed(2)} ₽</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1 }}>{p.supplierName || '—'}</span>
                    <button onClick={() => handleDeletePrice(p.uid)} style={{ position: 'absolute', right: 10, width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, opacity: 0.5 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="3" y1="3" x2="11" y2="11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                );
              }) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Нет данных</span></div>}
            </div>
          </div>
        </div>
      </div>
      {showAddPricePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPricePopup(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавить цену</h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Цена</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Введите цену" style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Дата</label>
              <input type="datetime-local" value={newPriceDate} onChange={e => setNewPriceDate(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPricePopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddPrice} disabled={!newPrice} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newPrice ? '#666EFE' : '#BCC8FF', cursor: newPrice ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryTab;