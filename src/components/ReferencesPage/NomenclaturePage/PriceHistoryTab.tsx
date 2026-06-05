// PriceHistoryTab.tsx — полный файл
import React from 'react';
import type { CommonProps } from './NomenclatureCreatePage';
import IconUp from '../../../assets/References/NomenclatureCreatePage/IconUp.svg';
import IconDown from '../../../assets/References/NomenclatureCreatePage/IconDown.svg';
import IconRavno from '../../../assets/References/NomenclatureCreatePage/IconRavno.svg';

const PriceHistoryTab: React.FC<CommonProps> = (props) => {
  const {
    prices, suppliers, showAddPricePopup,
    newPrice, newPriceDate, newPriceSupplierUid,
    setShowAddPricePopup, setNewPrice, setNewPriceDate, setNewPriceSupplierUid,
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

    const allPts = sortedPrices.map(p => {
      const t = new Date(p.priceDate).getTime();
      return {
        x: pad.left + ((t - firstTime) / timeRange) * pw,
        y: pad.top + ph - ((p.price - minP) / range) * ph,
      };
    });

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

    const catmullRomToBezier = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const smoothPath = catmullRomToBezier(allPts);

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
        {allPts.map((pt, i) => (
          <circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r="4" fill="#666EFE" />
        ))}
        {allMonths.map((m, i) => (
          <text key={`m-${i}`} x={m.x} y={ch - 3} textAnchor="middle" fontSize="10" fill="#2D4059">{m.label}</text>
        ))}
      </svg>
    );
  };

  const getDynamicsIcon = (change: number | null) => {
    if (change === null || change === 0) return <img src={IconRavno} alt="=" style={{ width: 22, height: 4 }} />;
    if (change > 0) return <img src={IconUp} alt="▲" style={{ width: 44, height: 15 }} />;
    return <img src={IconDown} alt="▼" style={{ width: 44, height: 15 }} />;
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
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 100, textAlign: 'center', paddingRight: 16 }}>ДИНАМИКА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 160 }}>ЦЕНА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ПОСТАВЩИК</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {sortedPrices.length > 0 ? sortedPrices.map((p, i) => {
                const prev = i > 0 ? sortedPrices[i - 1].price : null;
                const change = prev !== null ? p.price - prev : null;
                return (
                  <div key={p.uid} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', width: 250 }}>{new Date(p.priceDate).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ width: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingRight: 16 }}>
                      {getDynamicsIcon(change)}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', width: 160 }}>{p.price.toFixed(2)} ₽</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1 }}>{p.supplierName || '—'}</span>
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
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Поставщик</label>
              <select value={newPriceSupplierUid} onChange={e => setNewPriceSupplierUid(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                <option value="">Без поставщика</option>
                {suppliers.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
              </select>
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