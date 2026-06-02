// RatingTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../../components/CustomScrollbar';
import type { CommonProps } from './NomenclatureCreatePage';

const RatingTab: React.FC<CommonProps> = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);

  const [folders] = useState([
    { id: 1, name: 'Группа 1', isOpen: false, items: [{ id: 1, characteristic: 'Элемент 1', status: 'Активен', date: '2026-05-14 12:00' }, { id: 2, characteristic: 'Элемент 2', status: 'Неактивен', date: '2026-05-13 10:00' }] },
  ]);

  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const toggleFolder = (fid: number) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid); else next.add(fid);
      return next;
    });
  };

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [openFolders]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...blockStyle, width: 1740, height: 72, flexShrink: 0 }} />
      <div style={{ ...blockStyle, width: 1740, height: 477, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}><div style={smallButtonStyle} /><div style={smallButtonStyle} /><div style={smallButtonStyle} /></div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: 1665, height: 378, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: 54, minHeight: 54, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 52, paddingRight: 40 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: 600 }}>СТАТУС</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto' }}>ДАТА ВРЕМЯ</span>
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {folders.map(folder => (
                <React.Fragment key={folder.id}>
                  <div onClick={() => toggleFolder(folder.id)} style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                    <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ flexShrink: 0 }}><path d="M0 2C0 0.895431 0.895431 0 2 0H5.17157C5.70201 0 6.21071 0.210714 6.58579 0.585786L7.41421 1.41421C7.78929 1.78929 8.29799 2 8.82843 2H13C14.1046 2 15 2.89543 15 4V16C15 17.1046 14.1046 18 13 18H2C0.895431 18 0 17.1046 0 16V2Z" fill="#666EFE"/></svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059', marginLeft: 18 }}>{folder.name}</span>
                    <motion.svg width="10" height="6" viewBox="0 0 10 6" fill="none" animate={{ rotate: openFolders.has(folder.id) ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ flexShrink: 0, marginLeft: 12 }}><path d="M1 1L5 5L9 1" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></motion.svg>
                  </div>
                  <AnimatePresence>
                    {openFolders.has(folder.id) && folder.items.map(item => (
                      <motion.div key={item.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 54, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                        <div style={{ height: 54, display: 'flex', alignItems: 'center', paddingLeft: 40, paddingRight: 40, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', cursor: 'pointer', position: 'relative' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15 }}>{item.characteristic}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: 600 }}>-</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', marginLeft: 'auto' }}>2026-05-14 12:00</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: 378, paddingTop: 54 }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={378 - 54} /></div>}
        </div>
      </div>
    </div>
  );
};

export default RatingTab;