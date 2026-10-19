// StationCard.tsx — карточка станции при наведении на маркер (на планшете — по касанию): статус, «Цех › Участок»,
// модель, заполненность, ошибки, выдача, готовые детали. Закреплённая карточка — с быстрыми действиями страницы.
import React from 'react';
import { motion } from 'framer-motion';
import type { MapStation, MapStationDynamic, StationActions } from './types';
import { COLORS, FONT, SHADOWS, statusGradient, statusStyle } from './theme';
import { CloseIcon, TemplatesIcon, VideoIcon } from './icons';

export const CARD_WIDTH = 300;

interface StationCardProps {
  station: MapStation;
  dynamic?: MapStationDynamic;
  pinned: boolean;
  actions: StationActions;
  onClose: () => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 24 }}>
    <span style={{ fontSize: 13, color: COLORS.muted }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, textAlign: 'right' }}>{children}</span>
  </div>
);

const ActionLink: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ y: -1, boxShadow: SHADOWS.buttonHover }}
    whileTap={{ scale: 0.97 }}
    style={{
      flex: 1,
      height: 36,
      border: 'none',
      borderRadius: 10,
      backgroundColor: COLORS.white,
      boxShadow: SHADOWS.button,
      color: COLORS.text,
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {icon}
    {label}
  </motion.button>
);

/** Число или «—», если данных нет */
const num = (v: number | null | undefined): string => (typeof v === 'number' && Number.isFinite(v) ? String(v) : '—');

const StationCard: React.FC<StationCardProps> = ({ station, dynamic, pinned, actions, onClose }) => {
  const status = statusStyle(station.status);
  const total = dynamic?.totalCells ?? null;
  const filled = dynamic?.filledCells ?? null;
  const percent = dynamic?.filledCellsPercent ?? (total && filled !== null ? (filled / total) * 100 : null);
  const share = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const place = [station.workshop, station.section].filter(Boolean).join(' › ') || 'Размещение не указано';
  const ready = dynamic?.readyPartsCount ?? null;
  const readyMax = dynamic?.maxReadyParts ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      data-no-pan
      onPointerDown={event => event.stopPropagation()}
      onWheel={event => event.stopPropagation()}
      style={{
        position: 'relative',
        width: CARD_WIDTH,
        padding: '16px 18px 16px',
        borderRadius: 16,
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        boxShadow: SHADOWS.tooltip,
        fontFamily: FONT,
        color: COLORS.text,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {pinned && (
        <button
          type="button"
          aria-label="Закрыть карточку"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseIcon size={14} color={COLORS.muted} />
        </button>
      )}

      <div style={{ display: 'flex', gap: 12, paddingRight: pinned ? 22 : 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusGradient(station.status), flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '19px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={station.name}>
              {station.name}
            </span>
          </div>
          <div style={{ marginTop: 3, paddingLeft: 18, fontSize: 12, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={place}>
            {place}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: 104 }}>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Модель</div>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={station.modelName ?? undefined}>
            {station.modelName || '—'}
          </div>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: COLORS.line, margin: '12px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: COLORS.muted }}>
          Заполнено <b style={{ color: COLORS.text, fontWeight: 600 }}>{num(filled)}</b> из <b style={{ color: COLORS.text, fontWeight: 600 }}>{num(total)}</b>
        </span>
        <span style={{ fontWeight: 600 }}>{percent === null ? '—' : `${Math.round(share)}%`}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.track, overflow: 'hidden', margin: '7px 0 10px' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${share}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: statusGradient(station.status, 90) }}
        />
      </div>

      <Row label="Статус">
        <span style={{ color: status.dot }}>{status.label}</span>
      </Row>
      <Row label="Ошибки">
        {station.hasError ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COLORS.error }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLORS.error }} />
            Есть
          </span>
        ) : (
          'Нет'
        )}
      </Row>
      <Row label="Выдано">—</Row>
      <Row label="Выдано сверх нормы">—</Row>
      <Row label="Готовые детали">{ready === null ? '—' : readyMax ? `${ready} из ${readyMax}` : String(ready)}</Row>

      {pinned ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <ActionLink label="Шаблоны загрузки" icon={<TemplatesIcon size={16} />} onClick={() => actions.onOpenTemplates(station)} />
          {actions.canViewVideo && <ActionLink label="Видео" icon={<VideoIcon size={16} />} onClick={() => actions.onOpenVideo(station)} />}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 11, color: COLORS.faint, textAlign: 'center' }}>Нажмите на станцию, чтобы открыть действия</div>
      )}
    </motion.div>
  );
};

export default StationCard;
