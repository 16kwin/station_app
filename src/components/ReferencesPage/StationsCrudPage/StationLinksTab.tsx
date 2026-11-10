// StationLinksTab.tsx — ПОЛНЫЙ ФАЙЛ (3 колонки: incoming / наш склад / outgoing)
import React, { useState, useEffect, useCallback } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

interface StationOption {
  uid: string;
  name: string;
  code: number | null;
  isDistribution: boolean;
}

interface LinksResponse {
  stationUid: string;
  stationName: string;
  stationCode: number | null;
  stationIsDistribution: boolean;
  incomingCandidates: StationOption[];
  incomingSelected: string[];
  outgoingCandidates: StationOption[];
  outgoingSelected: string[];
}

interface StationLinksTabProps {
  stationUid: string;
  isDistribution: boolean;
  isEdit: boolean;
}

const StationLinksTab: React.FC<StationLinksTabProps> = ({ stationUid, isDistribution, isEdit }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationCode, setStationCode] = useState<number | null>(null);
  const [stationIsDistribution, setStationIsDistribution] = useState(isDistribution);

  const [incomingCandidates, setIncomingCandidates] = useState<StationOption[]>([]);
  const [incomingSelected, setIncomingSelected] = useState<Set<string>>(new Set());
  const [searchIncoming, setSearchIncoming] = useState('');

  const [outgoingCandidates, setOutgoingCandidates] = useState<StationOption[]>([]);
  const [outgoingSelected, setOutgoingSelected] = useState<Set<string>>(new Set());
  const [searchOutgoing, setSearchOutgoing] = useState('');

  const loadLinks = useCallback(async () => {
    if (!stationUid) return;
    setLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiStationDistributionLinks(stationUid));
      const data: LinksResponse = res.data;
      setStationName(data.stationName || '');
      setStationCode(data.stationCode ?? null);
      setStationIsDistribution(!!data.stationIsDistribution);
      setIncomingCandidates(data.incomingCandidates || []);
      setIncomingSelected(new Set(data.incomingSelected || []));
      setOutgoingCandidates(data.outgoingCandidates || []);
      setOutgoingSelected(new Set(data.outgoingSelected || []));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [stationUid]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const toggleIncoming = (uid: string) => {
    setIncomingSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const toggleOutgoing = (uid: string) => {
    setOutgoingSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleSave = async () => {
    if (!stationUid) return;
    setSaving(true);
    try {
      await AxiosService.post(
        ConstantInfo.restApiStationDistributionLinkSetIncoming(stationUid),
        Array.from(incomingSelected),
      );
      if (stationIsDistribution) {
        await AxiosService.post(
          ConstantInfo.restApiStationDistributionLinkSetOutgoing(stationUid),
          Array.from(outgoingSelected),
        );
      }
      await loadLinks();
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения связей: ' + (e as any).message);
    } finally { setSaving(false); }
  };

  const filteredIncoming = searchIncoming.trim()
    ? incomingCandidates.filter(s => s.name.toLowerCase().includes(searchIncoming.toLowerCase()))
    : incomingCandidates;

  const filteredOutgoing = searchOutgoing.trim()
    ? outgoingCandidates.filter(s => s.name.toLowerCase().includes(searchOutgoing.toLowerCase()))
    : outgoingCandidates;

  const selectedIncomingCount = incomingSelected.size;
  const selectedOutgoingCount = outgoingSelected.size;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', borderRadius: 15, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ЛЕВАЯ КОЛОНКА — распределительные склады (откуда получаем) */}
        <div style={{ width: 420, flexShrink: 0, borderRight: '1px solid #E6E9F4', padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059', margin: 0, marginBottom: 4 }}>
            Откуда получаем
          </h3>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            Распределительные склады, которые могут отправлять в наш
          </span>
          <input
            type="text"
            value={searchIncoming}
            onChange={e => setSearchIncoming(e.target.value)}
            placeholder="Поиск..."
            style={{
              width: '100%', height: 40, borderRadius: 8, border: '1px solid #D1D5DB',
              padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 14,
              outline: 'none', boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          {incomingCandidates.length === 0 && !loading && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет распределительных складов</span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredIncoming.map(s => {
              const isSel = incomingSelected.has(s.uid);
              return (
                <div
                  key={s.uid}
                  onClick={() => toggleIncoming(s.uid)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: isSel ? '#EFF1FF' : '#F5F6FA',
                    border: isSel ? '1px solid #666EFE' : '1px solid transparent',
                    fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D4059',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: 4, border: '1px solid #666EFE',
                      backgroundColor: isSel ? '#666EFE' : '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSel && <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  {s.code != null && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>
                      {String(s.code).padStart(4, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА — наш склад */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid #E6E9F4', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFF' }}>
          <div style={{
            width: '100%', padding: 20, borderRadius: 12,
            backgroundColor: '#FFFFFF', border: '2px solid #666EFE',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#666EFE', textTransform: 'uppercase', letterSpacing: 1 }}>
              Наш склад
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, color: '#2D4059', textAlign: 'center' }}>
              {stationName}
            </span>
            {stationCode != null && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280' }}>
                Код: {String(stationCode).padStart(4, '0')}
              </span>
            )}
            {stationIsDistribution && (
              <span style={{
                marginTop: 6, padding: '4px 10px', borderRadius: 6,
                backgroundColor: '#EFF1FF', color: '#666EFE',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              }}>
                Распределительный
              </span>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Получаем от: <strong style={{ color: '#2D4059' }}>{selectedIncomingCount}</strong>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Отправляем в: <strong style={{ color: '#2D4059' }}>{selectedOutgoingCount}</strong>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА — куда отправляем */}
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#2D4059', margin: 0, marginBottom: 4 }}>
            Куда отправляем
          </h3>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {stationIsDistribution
              ? 'Склады, которые наш склад может снабжать'
              : 'Недоступно: наш склад не распределительный'}
          </span>
          <input
            type="text"
            value={searchOutgoing}
            onChange={e => setSearchOutgoing(e.target.value)}
            placeholder="Поиск..."
            disabled={!stationIsDistribution}
            style={{
              width: '100%', height: 40, borderRadius: 8, border: '1px solid #D1D5DB',
              padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 14,
              outline: 'none', boxSizing: 'border-box', marginBottom: 12,
              opacity: stationIsDistribution ? 1 : 0.5,
            }}
          />
          {!stationIsDistribution && (
            <div style={{
              padding: 16, borderRadius: 8, backgroundColor: '#FEF3C7', border: '1px solid #F59E0B',
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#92400E',
            }}>
              Чтобы склад мог отправлять в другие, включите у него флаг «Распределительный» на вкладке «Основное».
            </div>
          )}
          {stationIsDistribution && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredOutgoing.length === 0 && !loading && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Нет складов</span>
              )}
              {filteredOutgoing.map(s => {
                const isSel = outgoingSelected.has(s.uid);
                return (
                  <div
                    key={s.uid}
                    onClick={() => toggleOutgoing(s.uid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      backgroundColor: isSel ? '#EFF1FF' : '#F5F6FA',
                      border: isSel ? '1px solid #666EFE' : '1px solid transparent',
                      fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2D4059',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: 4, border: '1px solid #666EFE',
                        backgroundColor: isSel ? '#666EFE' : '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSel && <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    {s.isDistribution && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#666EFE', fontWeight: 600 }}>
                        распределительный
                      </span>
                    )}
                    {s.code != null && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>
                        {String(s.code).padStart(4, '0')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E6E9F4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#FAFBFF' }}>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            height: 44, padding: '0 28px', borderRadius: 8, border: 'none',
            backgroundColor: '#666EFE', color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
            cursor: saving || loading ? 'not-allowed' : 'pointer',
            opacity: saving || loading ? 0.6 : 1,
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить связи'}
        </button>
      </div>
    </div>
  );
};

export default StationLinksTab;