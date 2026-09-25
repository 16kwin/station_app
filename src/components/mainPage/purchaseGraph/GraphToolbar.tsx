// GraphToolbar.tsx — верхняя панель страницы графа: заголовок, фильтры «Номенклатура» и «Поставщик»
// (список с поиском, группами и галочками, пункты «Все» и «Очистить»), пилюля периода,
// «Печатная форма» и шестерёнка настроек
import React, { useEffect, useRef, useState } from 'react';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import type { AnchorRect } from '../shared/DateRangePopup';
import type { DateRange } from '../shared/types';
import { isoToRu } from './format';
import { CalendarIcon, CheckIcon, ChevronDownIcon, CloseIcon, GearIcon, PrintIcon, SearchIcon } from './icons';
import { TOOLBAR_HEIGHT } from './layout';
import { isSelected, nomFilterOptions, normalizeSelection, setSelectionKeys, supplierFilterOptions, toggleSelection } from './model';
import type { FilterOption } from './model';
import type { GraphGroupDto, PurchaseGraphData } from './types';

const TOOLBAR_CSS = `
.pg-dd-row:hover { background-color: #F4F6FB; }
.pg-dd-list::-webkit-scrollbar { width: 6px; }
.pg-dd-list::-webkit-scrollbar-thumb { background: #CBD3E1; border-radius: 3px; }
.pg-toolbar button.pg-tool:hover { background-color: #F7F8FC !important; }
`;

/* ---------- Галочка с тремя состояниями ---------- */

const Checkbox: React.FC<{ state: 'on' | 'off' | 'mixed' }> = ({ state }) => (
  <span
    aria-hidden="true"
    style={{
      width: 16,
      height: 16,
      flexShrink: 0,
      boxSizing: 'border-box',
      borderRadius: 4,
      border: state === 'off' ? '1.5px solid #C5CDD9' : 'none',
      backgroundColor: state === 'off' ? COLORS.white : COLORS.accent,
      color: COLORS.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.12s ease',
    }}
  >
    {state === 'on' && <CheckIcon size={12} strokeWidth={2.2} />}
    {state === 'mixed' && <span style={{ width: 8, height: 2, borderRadius: 1, backgroundColor: COLORS.white }} />}
  </span>
);

/* ---------- Выпадающий фильтр ---------- */

interface FilterDropdownProps {
  label: string;
  valueLabel: string;
  options: FilterOption[];
  groups?: GraphGroupDto[];
  selection: string[] | null;
  onChange: (selection: string[] | null) => void;
  searchPlaceholder: string;
  disabled?: boolean;
  /** Подсветить кнопку акцентом, даже если выбор «Все» (например, включён фокус) */
  accent?: boolean;
}

const linkButton: React.CSSProperties = {
  padding: '4px 6px',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: COLORS.accent,
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none',
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  valueLabel,
  options,
  groups,
  selection,
  onChange,
  searchPlaceholder,
  disabled,
  accent = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Клик вне списка и Esc закрывают его
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    if (disabled) return;
    setQuery('');
    setOpen(value => !value);
  };

  const allKeys = options.map(option => option.key);
  const needle = query.trim().toLowerCase();
  const visible = options.filter(option => !needle || option.name.toLowerCase().includes(needle));
  const active = selection !== null || accent;

  const renderOption = (option: FilterOption, indent: boolean) => {
    const checked = isSelected(selection, option.key);
    return (
      <button
        key={option.key}
        type="button"
        role="menuitemcheckbox"
        aria-checked={checked}
        className="pg-dd-row"
        onClick={() => onChange(toggleSelection(selection, option.key, allKeys))}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 32,
          padding: `0 12px 0 ${indent ? 30 : 12}px`,
          border: 'none',
          borderRadius: 8,
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: FONT,
          outline: 'none',
        }}
      >
        <Checkbox state={checked ? 'on' : 'off'} />
        {option.color && <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: option.color, flexShrink: 0 }} />}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13.5,
            fontWeight: 500,
            color: COLORS.text,
          }}
        >
          {option.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>{option.hint}</span>
      </button>
    );
  };

  const renderGroups = () =>
    (groups ?? []).map(group => {
      const items = visible.filter(option => option.groupKey === group.key);
      if (!items.length) return null;
      const keys = items.map(item => item.key);
      const checkedCount = keys.filter(key => isSelected(selection, key)).length;
      const state = checkedCount === 0 ? 'off' : checkedCount === keys.length ? 'on' : 'mixed';
      return (
        <div key={group.key} style={{ marginBottom: 4 }}>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
            className="pg-dd-row"
            onClick={() => onChange(setSelectionKeys(selection, keys, state !== 'on', allKeys))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 32,
              padding: '0 12px',
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              color: COLORS.text,
              outline: 'none',
            }}
          >
            <Checkbox state={state} />
            {group.name}
          </button>
          {items.map(item => renderOption(item, true))}
        </div>
      );
    });

  const ungrouped = groups ? visible.filter(option => !groups.some(group => group.key === option.groupKey)) : visible;

  return (
    <div ref={rootRef} style={{ position: 'relative', flex: '0 1 auto', minWidth: 150 }}>
      <button
        type="button"
        className="pg-tool"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
        disabled={disabled}
        style={{
          height: 40,
          maxWidth: 'min(320px, 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 14px',
          border: `1px solid ${active ? 'rgba(102, 110, 254, 0.45)' : '#E6EAF1'}`,
          borderRadius: 10,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.button,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: FONT,
          fontSize: 14,
          outline: 'none',
          opacity: disabled ? 0.6 : 1,
          transition: 'background-color 0.15s ease',
        }}
      >
        <span style={{ fontWeight: 500, color: COLORS.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}:</span>
        <span
          style={{
            fontWeight: 600,
            color: active ? COLORS.accent : COLORS.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {valueLabel}
        </span>
        <span
          style={{
            color: COLORS.text,
            display: 'flex',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          <ChevronDownIcon size={14} />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          style={{
            position: 'absolute',
            left: 0,
            top: 48,
            width: 340,
            maxHeight: 440,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: COLORS.white,
            borderRadius: 12,
            border: '1px solid #E8ECF3',
            boxShadow: SHADOWS.modal,
            zIndex: 40,
            overflow: 'hidden',
            fontFamily: FONT,
          }}
        >
          <div style={{ padding: 10, borderBottom: '1px solid #EEF1F6' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 10px',
                borderRadius: 8,
                backgroundColor: '#F2F4F8',
                color: COLORS.textMuted,
                cursor: 'text',
              }}
            >
              <SearchIcon size={15} />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: FONT,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: COLORS.text,
                  userSelect: 'text',
                }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <button type="button" style={linkButton} onClick={() => onChange(null)} title="Снять фильтр — показать все">
                Все
              </button>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                {selection === null ? `Все: ${options.length}` : `Выбрано: ${selection.length} из ${options.length}`}
              </span>
              <button type="button" style={linkButton} onClick={() => onChange(normalizeSelection([], allKeys))} title="Снять все галочки">
                Очистить
              </button>
            </div>
          </div>
          <div className="pg-dd-list" style={{ overflowY: 'auto', padding: 6, minHeight: 0 }}>
            {groups && renderGroups()}
            {ungrouped.map(option => renderOption(option, false))}
            {visible.length === 0 && <div style={{ padding: '14px 12px', fontSize: 13, color: COLORS.textMuted }}>Ничего не найдено</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/** Подпись выбора: «Все», одно имя, «Выбрано: N» или «Не выбрано» */
const selectionLabel = (selection: string[] | null, options: FilterOption[]): string => {
  if (selection === null) return 'Все';
  if (selection.length === 0) return 'Не выбрано';
  if (selection.length === 1) return options.find(option => option.key === selection[0])?.name ?? '1';
  return `Выбрано: ${selection.length}`;
};

/* ---------- Панель ---------- */

interface GraphToolbarProps {
  data: PurchaseGraphData | null;
  limitPercent: number;
  focusName: string | null;
  nomSelection: string[] | null;
  supplierSelection: string[] | null;
  onNomSelectionChange: (selection: string[] | null) => void;
  onSupplierSelectionChange: (selection: string[] | null) => void;
  range: DateRange;
  onDateClick: (anchor: AnchorRect) => void;
  onDateReset: () => void;
  onPrint: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

const toolButton: React.CSSProperties = {
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: 'none',
  borderRadius: 10,
  backgroundColor: COLORS.white,
  boxShadow: SHADOWS.button,
  color: COLORS.text,
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
  flexShrink: 0,
  transition: 'background-color 0.15s ease',
};

const GraphToolbar: React.FC<GraphToolbarProps> = ({
  data,
  limitPercent,
  focusName,
  nomSelection,
  supplierSelection,
  onNomSelectionChange,
  onSupplierSelectionChange,
  range,
  onDateClick,
  onDateReset,
  onPrint,
  settingsOpen,
  onToggleSettings,
}) => {
  const nomOptions = data ? nomFilterOptions(data) : [];
  const supplierOptions = data ? supplierFilterOptions(data, limitPercent) : [];

  // Якорь календаря — положение пилюли в окне на момент клика
  const handleDateClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onDateClick({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  };

  return (
    <div
      className="pg-toolbar"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        height: TOOLBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 24px 0 32px',
        boxSizing: 'border-box',
        backgroundColor: COLORS.white,
        borderBottom: '1px solid #EEF1F6',
        fontFamily: FONT,
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      <style>{TOOLBAR_CSS}</style>
      <h1 style={{ margin: '0 26px 0 0', fontSize: 24, fontWeight: 600, lineHeight: '29px', color: COLORS.text, whiteSpace: 'nowrap' }}>
        Граф закупок
      </h1>

      <FilterDropdown
        label="Номенклатура"
        valueLabel={focusName ?? selectionLabel(nomSelection, nomOptions)}
        options={nomOptions}
        groups={data?.groups}
        selection={nomSelection}
        onChange={onNomSelectionChange}
        searchPlaceholder="Поиск номенклатуры"
        disabled={!data}
        accent={focusName !== null}
      />
      <FilterDropdown
        label="Поставщик"
        valueLabel={selectionLabel(supplierSelection, supplierOptions)}
        options={supplierOptions}
        selection={supplierSelection}
        onChange={onSupplierSelectionChange}
        searchPlaceholder="Поиск поставщика"
        disabled={!data}
      />

      <div style={{ flex: 1, minWidth: 12 }} />

      <div
        role="button"
        tabIndex={0}
        aria-label="Выбрать период"
        onClick={handleDateClick}
        onKeyDown={e => {
          if (e.key === 'Enter') onDateClick(e.currentTarget.getBoundingClientRect());
        }}
        style={{
          width: 266,
          height: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px 0 16px',
          boxSizing: 'border-box',
          borderRadius: 20,
          backgroundColor: COLORS.accent,
          boxShadow: SHADOWS.datePill,
          color: COLORS.white,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <CalendarIcon size={16} color={COLORS.white} />
        <span style={{ flex: 1, fontSize: 16, fontWeight: 500, lineHeight: '19px', whiteSpace: 'nowrap' }}>
          {isoToRu(range.from)} - {isoToRu(range.to)}
        </span>
        <button
          type="button"
          aria-label="Сбросить период"
          title="Период по умолчанию"
          onClick={e => {
            e.stopPropagation();
            onDateReset();
          }}
          style={{
            width: 24,
            height: 24,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: COLORS.white,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
          }}
        >
          <CloseIcon size={12} strokeWidth={2} />
        </button>
      </div>

      <button type="button" className="pg-tool" onClick={onPrint} style={{ ...toolButton, padding: '0 16px' }}>
        <PrintIcon size={17} />
        Печатная форма
      </button>

      <button
        type="button"
        className="pg-tool"
        aria-label="Настройки графа"
        aria-pressed={settingsOpen}
        title="Настройки графа"
        onClick={onToggleSettings}
        style={{
          ...toolButton,
          width: 40,
          padding: 0,
          color: settingsOpen ? COLORS.accent : COLORS.text,
          backgroundColor: settingsOpen ? 'rgba(102, 110, 254, 0.1)' : COLORS.white,
        }}
      >
        <GearIcon size={19} />
      </button>
    </div>
  );
};

export default GraphToolbar;
