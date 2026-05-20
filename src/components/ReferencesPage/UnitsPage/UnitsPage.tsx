// components/ReferencesPage/UnitsPage/UnitsPage.tsx
import React, { useRef, useState, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import Icon1 from '../../../assets/References/Icon1.svg';
import Icon2 from '../../../assets/References/Icon2.svg';
import Icon3 from '../../../assets/References/Icon3.svg';
import Icon4 from '../../../assets/References/Icon4.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon6 from '../../../assets/References/Icon6.svg';
import Icon7 from '../../../assets/References/Icon7.svg';
import Icon8 from '../../../assets/References/Icon8.svg';
import Icon9 from '../../../assets/References/Icon9.svg';
import Icon10 from '../../../assets/References/Icon10.svg';

interface Unit {
  uid: string;
  name: string;
  description?: string;
}

const UnitsPage = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [data, setData] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const TABLE_WIDTH = 1720;
  const TABLE_HEIGHT = 638;

  useEffect(() => {
    setData([
      { uid: '1', name: 'мм', description: 'Миллиметр' },
      { uid: '2', name: 'см', description: 'Сантиметр' },
      { uid: '3', name: 'м', description: 'Метр' },
      { uid: '4', name: 'шт', description: 'Штука' },
      { uid: '5', name: 'кг', description: 'Килограмм' },
      { uid: '6', name: 'л', description: 'Литр' },
      { uid: '7', name: 'компл', description: 'Комплект' },
    ]);
    setIsLoading(false);
  }, []);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [data]);
  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    checkScroll();
    c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(c);
    return () => { c.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const smallButtonStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };
  const mediumButtonStyle: React.CSSProperties = {
    height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0,
  };
  const cellBorderStyle = '0.7px solid #666EFE';
  const tableBorderStyle = '2px solid #666EFE';

  if (isLoading) return <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span></div>;

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ paddingTop: 35, paddingLeft: 60 }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 30, fontWeight: 'bold', color: '#2D4059', margin: 0 }}>Справочник: Единицы измерения</h1>
      </div>
      <div style={{ position: 'absolute', top: 104, left: 55, right: 55, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon2} alt="" style={{ width: 20, height: 14 }} /></button>
          <button style={smallButtonStyle}><img src={Icon3} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ position: 'absolute', left: 586, display: 'flex', gap: 15 }}>
          <button style={{ ...mediumButtonStyle, width: 124 }}><img src={Icon4} alt="" style={{ width: 16, height: 16, marginLeft: 12 }} /></button>
          <button style={{ ...mediumButtonStyle, width: 186 }}><img src={Icon5} alt="" style={{ width: 22, height: 20, marginLeft: 15 }} /></button>
          <button style={smallButtonStyle}><img src={Icon6} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon7} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon10} alt="" style={{ width: 18, height: 16 }} /></button>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 159, left: 40 }}>
        <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: tableBorderStyle }}>
          <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 52, paddingRight: 40 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: 600 }}>ОПИСАНИЕ</span>
          </div>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {data.map(item => (
              <div key={item.uid} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 40, borderTop: cellBorderStyle, backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/>
                  <line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15, width: 400 }}>{item.name}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: 600 }}>{item.description || '—'}</span>
              </div>
            ))}
          </div>
        </div>
        {hasVerticalScroll && <div style={{ position: 'absolute', right: -25, top: 54, height: TABLE_HEIGHT - 54, width: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - 54} /></div>}
        {hasHorizontalScroll && <div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} /></div>}
      </div>
    </div>
  );
};

export default UnitsPage;
