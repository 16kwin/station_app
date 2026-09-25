// GraphSettingsPanel.tsx — панель настроек графа как в Obsidian (12.png, 14.png): секции
// «Фильтры», «Группировка», «Отображение», «Силы» сворачиваются шевроном; в шапке — сброс ⟲ и ×.
// Ползунки и переключатели своего рисунка, акцент #666EFE, значение ползунка — слева.
import React, { useEffect, useRef } from 'react';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import { formatSliderValue } from './format';
import { BurstIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, ResetIcon, SearchIcon } from './icons';
import { GROUP_PALETTE, SLIDERS, nextGroupId, nextPaletteColor } from './settings';
import type { SliderRange } from './settings';
import type { ColorGroup, GraphDisplay, GraphFilters, GraphForces, GraphSettings, GradientMode, SettingsSection } from './types';

interface GraphSettingsPanelProps {
  settings: GraphSettings;
  /** Лимит из ответа API — значение ползунка, пока пользователь его не двигал */
  apiLimit: number;
  onChange: (next: GraphSettings) => void;
  onReset: () => void;
  onClose: () => void;
  onAnimate: () => void;
}

const TRACK = '#E3E7EF';
const DIVIDER = '#EEF1F6';

const PANEL_CSS = `
.pg-settings-scroll::-webkit-scrollbar { width: 6px; }
.pg-settings-scroll::-webkit-scrollbar-thumb { background: #CBD3E1; border-radius: 3px; }
.pg-settings button.pg-ghost:hover { background-color: #F4F6FB !important; }
.pg-slider:focus-visible .pg-slider-thumb, .pg-switch:focus-visible { box-shadow: 0 0 0 3px rgba(102, 110, 254, 0.3) !important; }
`;

const iconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  border: 'none',
  borderRadius: 7,
  background: 'transparent',
  color: COLORS.textMuted,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
};

const labelText: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '18px',
  color: COLORS.text,
};

/* ---------- Переключатель ---------- */

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className="pg-switch"
    onClick={() => onChange(!checked)}
    style={{
      position: 'relative',
      width: 36,
      height: 20,
      flexShrink: 0,
      padding: 0,
      border: 'none',
      borderRadius: 10,
      backgroundColor: checked ? COLORS.accent : '#D5DBE6',
      cursor: 'pointer',
      outline: 'none',
      transition: 'background-color 0.15s ease',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        transition: 'left 0.15s ease',
      }}
    />
  </button>
);

/* ---------- Ползунок ---------- */

const snap = (value: number, range: SliderRange): number => {
  const stepped = Math.round((value - range.min) / range.step) * range.step + range.min;
  const clamped = Math.min(range.max, Math.max(range.min, stepped));
  return Number(clamped.toFixed(4));
};

const Slider: React.FC<{ value: number; range: SliderRange; onChange: (value: number) => void; label: string }> = ({
  value,
  range,
  onChange,
  label,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  // Последнее отправленное значение: быстрые нажатия клавиш шагают от него, а не от прошлого рендера
  const latestRef = useRef(value);
  const t = (Math.min(range.max, Math.max(range.min, value)) - range.min) / (range.max - range.min);

  useEffect(() => {
    latestRef.current = value;
  }, [value]);

  const commit = (next: number) => {
    latestRef.current = next;
    onChange(next);
  };

  const valueAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return latestRef.current;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(range.min + ratio * (range.max - range.min), range);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    commit(valueAt(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) commit(valueAt(e.clientX));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = (range.max - range.min) / 10;
    const delta: Record<string, number> = {
      ArrowRight: range.step,
      ArrowUp: range.step,
      ArrowLeft: -range.step,
      ArrowDown: -range.step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key === 'Home') commit(range.min);
    else if (e.key === 'End') commit(range.max);
    else if (delta[e.key] !== undefined) commit(snap(latestRef.current + delta[e.key], range));
    else return;
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 40, flexShrink: 0, fontSize: 13, fontWeight: 500, color: COLORS.text, fontVariantNumeric: 'tabular-nums' }}>
        {formatSliderValue(value, range.decimals)}
      </span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={value}
        className="pg-slider"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        style={{ position: 'relative', flex: 1, height: 20, cursor: 'pointer', touchAction: 'none', outline: 'none' }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 4, borderRadius: 2, backgroundColor: TRACK }} />
        <div style={{ position: 'absolute', left: 0, width: `${t * 100}%`, top: 8, height: 4, borderRadius: 2, backgroundColor: COLORS.accent }} />
        <div
          className="pg-slider-thumb"
          style={{
            position: 'absolute',
            top: 1,
            left: `calc(${t * 100}% - 9px)`,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: COLORS.white,
            border: '1px solid #D9DEE8',
            boxSizing: 'border-box',
            boxShadow: '0 1px 4px rgba(45, 64, 89, 0.25)',
          }}
        />
      </div>
    </div>
  );
};

const SliderRow: React.FC<{ label: string; value: number; range: SliderRange; onChange: (value: number) => void }> = props => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
    <span style={labelText}>{props.label}</span>
    <Slider value={props.value} range={props.range} onChange={props.onChange} label={props.label} />
  </div>
);

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 34 }}>
    <span style={labelText}>{label}</span>
    <Switch checked={checked} onChange={onChange} label={label} />
  </div>
);

/* ---------- Секция ---------- */

const Section: React.FC<{
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}> = ({ title, collapsed, onToggle, actions, children, last }) => (
  <div style={{ borderBottom: last ? 'none' : `1px solid ${DIVIDER}`, padding: '4px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px 8px 10px' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: COLORS.text,
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          lineHeight: '20px',
          textAlign: 'left',
          outline: 'none',
        }}
      >
        <span style={{ color: COLORS.textMuted, display: 'flex' }}>{collapsed ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
        {title}
      </button>
      {actions}
    </div>
    {!collapsed && <div style={{ padding: '0 16px 12px' }}>{children}</div>}
  </div>
);

const ghostButtonStyle: React.CSSProperties = {
  height: 34,
  padding: '0 14px',
  border: '1px solid #E1E6EF',
  borderRadius: 8,
  backgroundColor: COLORS.white,
  color: COLORS.text,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  outline: 'none',
  transition: 'background-color 0.15s ease',
};

/* ---------- Цветовая группа ---------- */

const GroupRow: React.FC<{ group: ColorGroup; onChange: (group: ColorGroup) => void; onRemove: () => void }> = ({ group, onChange, onRemove }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <input
      type="text"
      value={group.query}
      onChange={e => onChange({ ...group, query: e.target.value })}
      placeholder="Запрос: часть имени…"
      aria-label="Запрос группы"
      style={{
        flex: 1,
        minWidth: 0,
        height: 32,
        padding: '0 10px',
        border: '1px solid #E1E6EF',
        borderRadius: 8,
        outline: 'none',
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 500,
        color: COLORS.text,
        userSelect: 'text',
      }}
    />
    <button
      type="button"
      aria-label="Сменить цвет группы"
      title="Сменить цвет"
      onClick={() => onChange({ ...group, color: nextPaletteColor(group.color) })}
      style={{
        width: 22,
        height: 22,
        flexShrink: 0,
        padding: 0,
        borderRadius: 11,
        border: '2px solid #FFFFFF',
        boxShadow: '0 0 0 1px #D9DEE8',
        backgroundColor: group.color,
        cursor: 'pointer',
        outline: 'none',
      }}
    />
    <button type="button" aria-label="Удалить группу" title="Удалить группу" onClick={onRemove} className="pg-ghost" style={iconButtonStyle}>
      <CloseIcon size={14} />
    </button>
  </div>
);

/* ---------- Панель ---------- */

const GraphSettingsPanel: React.FC<GraphSettingsPanelProps> = ({ settings, apiLimit, onChange, onReset, onClose, onAnimate }) => {
  const { filters, display, forces, groups, collapsed } = settings;

  const setFilters = (patch: Partial<GraphFilters>) => onChange({ ...settings, filters: { ...filters, ...patch } });
  const setDisplay = (patch: Partial<GraphDisplay>) => onChange({ ...settings, display: { ...display, ...patch } });
  const setForces = (patch: Partial<GraphForces>) => onChange({ ...settings, forces: { ...forces, ...patch } });
  const setGroups = (next: ColorGroup[]) => onChange({ ...settings, groups: next });
  const toggleSection = (section: SettingsSection) =>
    onChange({ ...settings, collapsed: { ...collapsed, [section]: !collapsed[section] } });

  const addGroup = () =>
    setGroups([...groups, { id: nextGroupId(groups), query: '', color: GROUP_PALETTE[groups.length % GROUP_PALETTE.length] }]);

  const gradientOptions: { value: GradientMode; label: string }[] = [
    { value: 'fixed', label: 'Фикс. длина' },
    { value: 'ratio', label: '10:90' },
  ];

  return (
    <div
      className="pg-settings"
      style={{
        width: 300,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        border: '1px solid #E8ECF3',
        boxShadow: SHADOWS.modal,
        fontFamily: FONT,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{PANEL_CSS}</style>
      <div className="pg-settings-scroll" style={{ overflowY: 'auto', minHeight: 0 }}>
        <Section
          title="Фильтры"
          collapsed={collapsed.filters}
          onToggle={() => toggleSection('filters')}
          actions={
            <>
              <button type="button" aria-label="Сбросить настройки" title="Сбросить настройки" onClick={onReset} className="pg-ghost" style={iconButtonStyle}>
                <ResetIcon size={16} />
              </button>
              <button type="button" aria-label="Закрыть настройки" title="Закрыть" onClick={onClose} className="pg-ghost" style={iconButtonStyle}>
                <CloseIcon size={16} />
              </button>
            </>
          }
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 34,
              padding: '0 10px',
              marginBottom: 6,
              border: '1px solid #E1E6EF',
              borderRadius: 8,
              color: COLORS.textMuted,
              cursor: 'text',
            }}
          >
            <SearchIcon size={15} />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters({ search: e.target.value })}
              placeholder="Искать в…"
              aria-label="Искать в графе"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 500,
                color: COLORS.text,
                userSelect: 'text',
              }}
            />
          </label>
          <ToggleRow label="Рядовые закупки" checked={filters.showRegular} onChange={v => setFilters({ showRegular: v })} />
          <ToggleRow label="Свыше лимита цены" checked={filters.showOverLimit} onChange={v => setFilters({ showOverLimit: v })} />
          <ToggleRow label="Якорные поставщики" checked={filters.showAnchor} onChange={v => setFilters({ showAnchor: v })} />
          <ToggleRow label="Аффилированность" checked={filters.showAffiliated} onChange={v => setFilters({ showAffiliated: v })} />
          <ToggleRow label="Объекты без связей" checked={filters.showOrphans} onChange={v => setFilters({ showOrphans: v })} />
        </Section>

        <Section title="Группировка" collapsed={collapsed.groups} onToggle={() => toggleSection('groups')}>
          {groups.map(group => (
            <GroupRow
              key={group.id}
              group={group}
              onChange={next => setGroups(groups.map(item => (item.id === group.id ? next : item)))}
              onRemove={() => setGroups(groups.filter(item => item.id !== group.id))}
            />
          ))}
          <button type="button" onClick={addGroup} className="pg-ghost" style={{ ...ghostButtonStyle, width: '100%' }}>
            Новая группа
          </button>
        </Section>

        <Section title="Отображение" collapsed={collapsed.display} onToggle={() => toggleSection('display')}>
          <ToggleRow label="Направление связей" checked={display.arrows} onChange={v => setDisplay({ arrows: v })} />
          <SliderRow label="Порог исчезания текста" value={display.textFade} range={SLIDERS.textFade} onChange={v => setDisplay({ textFade: v })} />
          <SliderRow label="Размер узла" value={display.nodeSize} range={SLIDERS.nodeSize} onChange={v => setDisplay({ nodeSize: v })} />
          <SliderRow label="Толщина линий" value={display.lineWidth} range={SLIDERS.lineWidth} onChange={v => setDisplay({ lineWidth: v })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
            <span style={labelText}>Градиент линии</span>
            <div role="radiogroup" aria-label="Градиент линии" style={{ display: 'flex', padding: 3, borderRadius: 9, backgroundColor: '#F1F3F8' }}>
              {gradientOptions.map(option => {
                const active = display.gradient === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDisplay({ gradient: option.value })}
                    style={{
                      flex: 1,
                      height: 28,
                      border: 'none',
                      borderRadius: 7,
                      backgroundColor: active ? COLORS.white : 'transparent',
                      boxShadow: active ? '0 1px 4px rgba(45, 64, 89, 0.15)' : 'none',
                      color: active ? COLORS.accent : COLORS.textMuted,
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <SliderRow
            label="Лимит превышения цены, %"
            value={display.limitPercent ?? apiLimit}
            range={SLIDERS.limitPercent}
            onChange={v => setDisplay({ limitPercent: v })}
          />
          <ToggleRow label="Цены на связях" checked={display.prices} onChange={v => setDisplay({ prices: v })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" onClick={onAnimate} className="pg-ghost" style={ghostButtonStyle}>
              <BurstIcon size={15} color={COLORS.accent} />
              Запустить анимацию
            </button>
          </div>
        </Section>

        <Section title="Силы" collapsed={collapsed.forces} onToggle={() => toggleSection('forces')} last>
          <SliderRow label="Сила притяжения" value={forces.center} range={SLIDERS.center} onChange={v => setForces({ center: v })} />
          <SliderRow label="Сила отталкивания" value={forces.repel} range={SLIDERS.repel} onChange={v => setForces({ repel: v })} />
          <SliderRow label="Сила связи" value={forces.link} range={SLIDERS.link} onChange={v => setForces({ link: v })} />
          <SliderRow label="Расстояние между узлами" value={forces.distance} range={SLIDERS.distance} onChange={v => setForces({ distance: v })} />
        </Section>
      </div>
    </div>
  );
};

export default GraphSettingsPanel;
