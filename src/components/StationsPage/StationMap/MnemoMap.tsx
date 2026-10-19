// MnemoMap.tsx — мнемосхема предприятия без картинок: блоки цехов → участки → знаки станций (цвет статуса,
// имя, полоса заполненности). У блоков — счётчики и рамка худшего статуса. Фон спокойный, цвет — только
// у отклонений. Клик по цеху открывает его интерактивную карту, наведение на станцию — её карточку.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { MapStation, MapStationDynamic, StationActions } from './types';
import type { EnterpriseNode, NodeStats, SectionNode, WorkshopNode } from './model';
import { COLORS, FONT, SHADOWS, STATUS, statusOf } from './theme';
import StationCabinet from './StationCabinet';
import StationCard, { CARD_WIDTH } from './StationCard';
import { ChevronIcon } from './icons';
import WorkshopIcon from '../../../assets/Station/5.svg';

interface MnemoMapProps {
  enterprise: EnterpriseNode | null;
  selectedWorkshopId: number | null;
  highlightKey: string | null;
  sectionFocus: { key: string; nonce: number } | null;
  stationFocus: { uid: string; nonce: number } | null;
  dynamics: ReadonlyMap<string, MapStationDynamic>;
  actions: StationActions;
  onOpenWorkshop: (workshop: WorkshopNode) => void;
}

const MNEMO_CSS = `
.sm-mnemo::-webkit-scrollbar { width: 6px; height: 6px; }
.sm-mnemo::-webkit-scrollbar-thumb { background: #C9D2E0; border-radius: 3px; }
.sm-mnemo::-webkit-scrollbar-track { background: transparent; }
.sm-sign { transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease; }
.sm-sign:hover, .sm-sign[data-active="true"] { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(45, 64, 89, 0.12); }
.sm-sign:focus-visible { outline: 2px solid ${COLORS.accentRing}; outline-offset: 1px; }
.sm-wsh:hover .sm-wsh-open { opacity: 1; transform: translateX(0); }
@keyframes sm-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 48, 82, 0.0); } 50% { box-shadow: 0 0 0 4px rgba(255, 48, 82, 0.18); } }
.sm-sign[data-critical="true"] { animation: sm-glow 1.8s ease-in-out infinite; }
`;

/** Рамка блока по худшему отклонению: цвет только у проблем */
const blockBorder = (stats: NodeStats): string => {
  if (stats.critical > 0) return '#FF8FA0';
  if (stats.errors > 0) return '#FFB3BF';
  if (stats.minimal > 0) return '#FFC9A8';
  if (stats.total > 0 && stats.offline === stats.total) return '#C8CED8';
  return '#E3E8F0';
};

const Counter: React.FC<{ value: number; label: string; tone: 'neutral' | 'error' | 'warn' }> = ({ value, label, tone }) => {
  const colors = {
    neutral: { bg: COLORS.pill, fg: COLORS.muted },
    error: { bg: COLORS.errorSoft, fg: COLORS.error },
    warn: { bg: COLORS.warnSoft, fg: '#E8814C' },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        height: 22,
        padding: '3px 8px 0',
        borderRadius: 11,
        backgroundColor: colors.bg,
        color: colors.fg,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <b style={{ fontSize: 12, fontWeight: 700 }}>{value}</b>
      {label}
    </span>
  );
};

/** Счётчики блока: всего станций и только ненулевые отклонения */
const Counters: React.FC<{ stats: NodeStats }> = ({ stats }) => (
  <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
    <Counter value={stats.total} label="ст." tone="neutral" />
    {stats.errors > 0 && <Counter value={stats.errors} label="ошиб." tone="error" />}
    {stats.critical > 0 && <Counter value={stats.critical} label="крит." tone="error" />}
    {stats.minimal > 0 && <Counter value={stats.minimal} label="мин." tone="warn" />}
    {stats.offline > 0 && <Counter value={stats.offline} label="не в сети" tone="neutral" />}
  </span>
);

interface SignProps {
  station: MapStation;
  dynamic?: MapStationDynamic;
  active: boolean;
  signRef: (el: HTMLButtonElement | null) => void;
  onHover: (uid: string | null) => void;
  onPin: (uid: string) => void;
}

/** Знак станции: шкаф цвета статуса, имя и полоса заполненности */
const Sign: React.FC<SignProps> = ({ station, dynamic, active, signRef, onHover, onPin }) => {
  const status = statusOf(station.status);
  const deviation = status === 'CRITICAL_STOCK' ? 'error' : status === 'MINIMAL_STOCK' ? 'warn' : null;
  const percent = Math.max(0, Math.min(100, dynamic?.filledCellsPercent ?? 0));
  const barColor = deviation === 'error' ? STATUS.CRITICAL_STOCK.dot : deviation === 'warn' ? STATUS.MINIMAL_STOCK.dot : '#9AA7C0';
  return (
    <button
      ref={signRef}
      type="button"
      className="sm-sign"
      data-active={active}
      data-critical={status === 'CRITICAL_STOCK'}
      title={`${station.name} — ${STATUS[status].label}`}
      onPointerEnter={e => {
        if (e.pointerType === 'mouse') onHover(station.uid);
      }}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse') onHover(null);
      }}
      onClick={e => {
        e.stopPropagation();
        onPin(station.uid);
      }}
      style={{
        width: 82,
        padding: '8px 6px 7px',
        border: `1px solid ${deviation === 'error' ? '#FFC2CC' : deviation === 'warn' ? '#FFD9C2' : active ? COLORS.accentRing : COLORS.border}`,
        borderRadius: 12,
        backgroundColor: deviation === 'error' ? '#FFF5F7' : deviation === 'warn' ? '#FFF8F2' : COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        cursor: 'pointer',
        fontFamily: FONT,
        opacity: status === 'OFFLINE' ? 0.75 : 1,
      }}
    >
      <StationCabinet status={status} hasError={!!station.hasError} muted shadow={false} width={22} />
      <span
        style={{
          width: '100%',
          fontSize: 11,
          lineHeight: '13px',
          fontWeight: 500,
          color: COLORS.text,
          textAlign: 'center',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
          minHeight: 26,
        }}
      >
        {station.name}
      </span>
      <span style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: COLORS.track, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${percent}%`, height: '100%', borderRadius: 2, backgroundColor: barColor }} />
      </span>
    </button>
  );
};

const MnemoMap: React.FC<MnemoMapProps> = ({
  enterprise,
  selectedWorkshopId,
  highlightKey,
  sectionFocus,
  stationFocus,
  dynamics,
  actions,
  onOpenWorkshop,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cardBoxRef = useRef<HTMLDivElement | null>(null);
  const signRefs = useRef(new Map<string, HTMLElement>());
  const blockRefs = useRef(new Map<string, HTMLElement>());
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [pinnedUid, setPinnedUid] = useState<string | null>(null);

  // Выбор станции в дереве — закрепить её карточку
  const [seenFocus, setSeenFocus] = useState<number | null>(null);
  if (stationFocus && stationFocus.nonce !== seenFocus) {
    setSeenFocus(stationFocus.nonce);
    setPinnedUid(stationFocus.uid);
  }

  const cardUid = pinnedUid ?? hoveredUid;
  const stations = enterprise ? enterprise.workshops.flatMap(w => w.stations) : [];
  const cardStation = cardUid ? stations.find(s => s.uid === cardUid) ?? null : null;

  // Карточка рядом со знаком: справа, у правого края — слева
  const placeCard = useCallback((uid: string | null) => {
    const box = cardBoxRef.current;
    const content = contentRef.current;
    const sign = uid ? signRefs.current.get(uid) : undefined;
    if (!box || !content || !sign) return;
    const c = content.getBoundingClientRect();
    const s = sign.getBoundingClientRect();
    const scale = content.offsetWidth > 0 ? c.width / content.offsetWidth : 1;
    const left0 = (s.right - c.left) / scale + 10;
    const width = content.offsetWidth;
    const left = left0 + CARD_WIDTH > width - 4 ? (s.left - c.left) / scale - 10 - CARD_WIDTH : left0;
    const top = Math.max(0, (s.top - c.top) / scale - 20);
    box.style.transform = `translate(${Math.round(Math.max(4, left))}px, ${Math.round(top)}px)`;
  }, []);

  useLayoutEffect(() => {
    placeCard(cardStation ? cardStation.uid : null);
  }, [cardStation, placeCard]);

  // Станция из дерева — прокрутить к знаку
  const handledFocus = useRef<number | null>(null);
  useEffect(() => {
    if (!stationFocus || handledFocus.current === stationFocus.nonce) return;
    handledFocus.current = stationFocus.nonce;
    signRefs.current.get(stationFocus.uid)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [stationFocus]);

  // Цех или участок из дерева — прокрутить к блоку
  const scrollKey = sectionFocus ? `${sectionFocus.key}#${sectionFocus.nonce}` : selectedWorkshopId !== null ? `w:${selectedWorkshopId}` : null;
  useEffect(() => {
    if (!scrollKey) return;
    const key = scrollKey.split('#')[0];
    blockRefs.current.get(key)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scrollKey]);

  const registerSign = (uid: string) => (el: HTMLElement | null) => {
    if (el) signRefs.current.set(uid, el);
    else signRefs.current.delete(uid);
  };
  const registerBlock = (key: string) => (el: HTMLElement | null) => {
    if (el) blockRefs.current.set(key, el);
    else blockRefs.current.delete(key);
  };

  const onHover = (uid: string | null) => setHoveredUid(uid);
  const onPin = (uid: string) => setPinnedUid(prev => (prev === uid ? null : uid));

  const renderSection = (section: SectionNode) => {
    const active = highlightKey === section.key;
    return (
      <div
        key={section.key}
        ref={registerBlock(section.key)}
        style={{
          flex: '1 1 auto',
          minWidth: 120,
          padding: '9px 10px 10px',
          borderRadius: 12,
          backgroundColor: active ? 'rgba(102, 110, 254, 0.06)' : '#F7F9FC',
          border: `1px solid ${active ? COLORS.accentRing : 'transparent'}`,
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: active ? COLORS.accent : COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={section.name}>
            {section.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.faint }}>{section.stations.length}</span>
        </div>
        {section.stations.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {section.stations.map(station => (
              <Sign
                key={station.uid}
                station={station}
                dynamic={dynamics.get(station.uid)}
                active={cardUid === station.uid}
                signRef={registerSign(station.uid)}
                onHover={onHover}
                onPin={onPin}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: COLORS.faint, padding: '4px 0 2px' }}>Нет станций</div>
        )}
      </div>
    );
  };

  const renderWorkshop = (workshop: WorkshopNode) => {
    const selected = workshop.id === selectedWorkshopId;
    return (
      <div
        key={workshop.key}
        ref={registerBlock(workshop.key)}
        style={{
          flex: '1 1 300px',
          maxWidth: '100%',
          padding: 14,
          borderRadius: 16,
          backgroundColor: COLORS.white,
          border: `1.5px solid ${blockBorder(workshop.stats)}`,
          boxShadow: selected ? `0 0 0 3px ${COLORS.accentRing}, ${SHADOWS.button}` : SHADOWS.button,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <button
          type="button"
          className="sm-wsh"
          title="Открыть интерактивную карту цеха"
          onClick={() => onOpenWorkshop(workshop)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 0,
            marginBottom: 12,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: FONT,
            textAlign: 'left',
          }}
        >
          <img src={WorkshopIcon} alt="" aria-hidden="true" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: selected ? COLORS.accent : COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workshop.name}
          </span>
          <Counters stats={workshop.stats} />
          <span
            className="sm-wsh-open"
            style={{ display: 'flex', alignItems: 'center', opacity: selected ? 1 : 0.45, transform: 'translateX(-2px)', transition: 'opacity 0.15s ease, transform 0.15s ease' }}
          >
            <ChevronIcon size={16} color={COLORS.accent} strokeWidth={2.4} />
          </span>
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{workshop.sections.map(renderSection)}</div>
      </div>
    );
  };

  return (
    <div
      ref={scrollRef}
      className="sm-mnemo"
      onClick={() => setPinnedUid(null)}
      onScroll={() => {
        if (!pinnedUid) setHoveredUid(null);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: 14,
        backgroundColor: COLORS.canvas,
        fontFamily: FONT,
      }}
    >
      <style>{MNEMO_CSS}</style>
      <div ref={contentRef} style={{ position: 'relative', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '0 2px 14px', fontSize: 12, color: COLORS.muted }}>
          <span style={{ fontWeight: 600, color: COLORS.text }}>{enterprise?.name ?? 'Предприятие'}</span>
          {(['WORKING', 'OFFLINE', 'MINIMAL_STOCK', 'CRITICAL_STOCK'] as const).map(code => (
            <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <StationCabinet status={code} muted shadow={false} width={12} />
              {STATUS[code].label}
            </span>
          ))}
        </div>

        {enterprise && enterprise.workshops.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>{enterprise.workshops.map(renderWorkshop)}</div>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 14, color: COLORS.muted }}>Выберите предприятие или цех в структуре станций</div>
        )}

        <div
          ref={cardBoxRef}
          style={{ position: 'absolute', left: 0, top: 0, zIndex: 10, pointerEvents: pinnedUid ? 'auto' : 'none' }}
          onClick={e => e.stopPropagation()}
        >
          <AnimatePresence>
            {cardStation && (
              <StationCard
                key={cardStation.uid}
                station={cardStation}
                dynamic={dynamics.get(cardStation.uid)}
                pinned={pinnedUid === cardStation.uid}
                actions={actions}
                onClose={() => setPinnedUid(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MnemoMap;
