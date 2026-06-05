// RatingTab.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonProps } from './NomenclatureCreatePage';

interface RatingItem {
  uid: string;
  materialUid: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

const RatingTab: React.FC<CommonProps> = (props) => {
  const { uid, isEdit } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const fetchRatings = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const [ratingsRes, avgRes] = await Promise.all([
        AxiosService.get(ConstantInfo.restApiNomenclatureRatings(uid)),
        AxiosService.get(ConstantInfo.restApiNomenclatureRatingsAverage(uid)),
      ]);
      setRatings(ratingsRes.data || []);
      setAverageRating(Math.round((avgRes.data || 0) * 10) / 10);
    } catch (e) {
      console.error('Ошибка загрузки рейтинга:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uid && isEdit) fetchRatings();
  }, [uid, isEdit]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [ratings]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const handleAddClick = () => {
    setNewAuthor('');
    setNewComment('');
    setNewRating(0);
    setHoverRating(0);
    setShowAddPopup(true);
  };

  const handleAddSubmit = async () => {
    if (!uid || newRating === 0) return;
    setIsAdding(true);
    try {
      await AxiosService.post(ConstantInfo.restApiNomenclatureRatings(uid), {
        rating: newRating,
        comment: newComment.trim(),
        author: newAuthor.trim(),
      });
      await fetchRatings();
      setShowAddPopup(false);
    } catch (e) {
      console.error('Ошибка добавления отзыва:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (ratingUid: string) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await AxiosService.delete(ConstantInfo.restApiNomenclatureDeleteRating(ratingUid));
      await fetchRatings();
    } catch (e) {
      console.error('Ошибка удаления отзыва:', e);
    }
  };

  // Компонент звёзд (с дробным заполнением)
  const StarRating = ({ value, size = 16, interactive = false, onChange, onHover }: { 
    value: number; 
    size?: number; 
    interactive?: boolean; 
    onChange?: (v: number) => void; 
    onHover?: (v: number) => void;
  }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fillPercent = Math.min(100, Math.max(0, (value - i + 1) * 100));
      const isHovered = interactive && hoverRating >= i;
      
      stars.push(
        <div
          key={i}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && onHover?.(i)}
          onMouseLeave={() => interactive && onHover?.(0)}
          style={{
            width: size,
            height: size,
            position: 'relative',
            cursor: interactive ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          {/* Пустая звезда */}
          <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
            <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" 
              fill={isHovered ? '#F59E0B' : '#E5E7EB'} 
              stroke={isHovered ? '#F59E0B' : '#D1D5DB'} 
              strokeWidth="1"
            />
          </svg>
          {/* Закрашенная звезда (clip) */}
          {fillPercent > 0 && (
            <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0, clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}>
              <path d="M10 1L12.39 6.53L18.18 7.27L13.92 11.37L15.09 17.23L10 14.25L4.91 17.23L6.08 11.37L1.82 7.27L7.61 6.53L10 1Z" 
                fill="#F59E0B" 
                stroke="#F59E0B" 
                strokeWidth="1"
              />
            </svg>
          )}
        </div>
      );
    }
    return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
  };

  const TABLE_WIDTH = 1665;
  const HEADER_HEIGHT = 54;
  const ROW_HEIGHT = 54;
  const TABLE_HEIGHT = 378;

  return (
    <div style={{ ...cs, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Верхний блок — средний рейтинг */}
      <div style={{ ...blockStyle, width: 1740, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>Средний рейтинг:</span>
        <StarRating value={averageRating} size={28} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: '#2D4059' }}>{averageRating}</span>
      </div>

      {/* Нижний блок — отзывы */}
      <div style={{ ...blockStyle, width: 1740, height: 477, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <button onClick={handleAddClick} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>ДАТА И ВРЕМЯ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>НАИМЕНОВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 150 }}>РЕЙТИНГ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 200 }}>АВТОР</span>
              <span style={{ width: 40 }} />
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span>
                </div>
              ) : ratings.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет отзывов</span>
                </div>
              ) : (
                ratings.map(r => (
                  <div key={r.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', position: 'relative' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 185 }}>{formatDate(r.createdAt)}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{r.comment || '—'}</span>
                    <div style={{ width: 150 }}>
                      <StarRating value={r.rating} size={14} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 185, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.author || '—'}</span>
                    <button
                      onClick={() => handleDelete(r.uid)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line x1="3" y1="3" x2="11" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="11" y1="3" x2="3" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>

      {/* Попап добавления отзыва */}
      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление отзыва</h3>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Автор</label>
              <input
                type="text"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setShowAddPopup(false); }}
                placeholder="Введите имя автора"
                autoFocus
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Текст отзыва</label>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Введите текст отзыва"
                rows={3}
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', resize: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Рейтинг</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StarRating 
                  value={hoverRating || newRating} 
                  size={32} 
                  interactive 
                  onChange={(v) => setNewRating(v)} 
                  onHover={(v) => setHoverRating(v)} 
                />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059' }}>
                  {hoverRating || newRating || 0}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowAddPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleAddSubmit} disabled={isAdding || newRating === 0} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newRating > 0 && !isAdding ? '#666EFE' : '#BCC8FF', cursor: newRating > 0 && !isAdding ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isAdding ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingTab;