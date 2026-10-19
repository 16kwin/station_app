// GppToolbar.tsx — тулбар документа ГПП (слева направо, как на макете): поиск, сортировка, фильтр по виду элемента,
// «Свернуть/Развернуть все», копировать, удалить, «Период выборки»; справа — «Автоматический расчет»,
// «Тип ГПП», печать, PDF и настройки вида. Выпадающие панели закрываются щелчком снаружи и Esc.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GppType, GppViewSettings, RowKind, ScaleMode, SortMode } from './types';
import { COLORS, FONT, KIND_LABEL, LAYOUT, SHADOWS, TYPE_LABEL } from './theme';
import { ChevronDownIcon, CollapseAllIcon, ExpandAllIcon, SequenceIcon, SquareCheck, TreeTypeIcon } from './icons';
import { HoverHint, MenuItem, Popover, Toggle, ToolButton } from './ui';
import { useDismiss } from './useDismiss';
import PeriodPicker from './PeriodPicker';

import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import SortingIcon20White from '../../../assets/Icons/SortingIcons/SortingIcon20White.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';
import FilterIcon18White from '../../../assets/Icons/FilterIcons/FilterIcon18White.svg';
import CopyIcon16Black from '../../../assets/Icons/CopyIcons/CopyIcon16Black.svg';
import DeleteIcon16Black from '../../../assets/Icons/DeleteIcons/DeleteIcon16Black.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import PrintIcon18Black from '../../../assets/Icons/PrintIcons/PrintIcon18Black.svg';
import PrintPDFIcon14Black from '../../../assets/Icons/PrintPDFIcons/PrintPDFIcon14Black.svg';
import ConfigurationIcon18Black from '../../../assets/Icons/ConfigurationIcons/ConfigurationIcon18Black.svg';

type Panel = 'sort' | 'filter' | 'period' | 'type' | 'settings';

const SORTS: { key: SortMode; label: string }[] = [
  { key: 'order', label: 'По порядку' },
  { key: 'name', label: 'По наименованию' },
  { key: 'start', label: 'По дате начала' },
];

const KINDS: RowKind[] = ['PRODUCT', 'PART', 'MATERIAL'];

const SCALES: { key: ScaleMode; label: string }[] = [
  { key: 'days', label: 'Дни' },
  { key: 'weeks', label: 'Недели' },
  { key: 'months', label: 'Месяцы' },
];

const SEARCH_OPEN_WIDTH = 220;

interface ToolbarProps {
  editable: boolean;
  search: string;
  onSearch: (value: string) => void;
  sort: SortMode;
  onSort: (sort: SortMode) => void;
  kinds: ReadonlySet<RowKind>;
  onKinds: (kinds: Set<RowKind>) => void;
  anyExpanded: boolean;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  checkedCount: number;
  onCopy: () => void;
  onDelete: () => void;
  periodFrom: number;
  periodTo: number;
  planMonths: { from: number; to: number } | null;
  onPeriod: (fromMonth: number, toMonth: number) => void;
  autoCalc: boolean;
  onAutoCalc: (on: boolean) => void;
  type: GppType;
  onType: (type: GppType) => void;
  onPrint: () => void;
  onPdf: () => void;
  settings: GppViewSettings;
  onSettings: (settings: GppViewSettings) => void;
}

const caption: React.CSSProperties = { padding: '16px 20px 6px 30px', fontSize: 13, fontWeight: 500, color: COLORS.muted };

const GppToolbar: React.FC<ToolbarProps> = props => {
  const { editable, search, sort, kinds, settings, type } = props;
  const [panel, setPanel] = useState<Panel | null>(null);
  const [searchOpen, setSearchOpen] = useState(search !== '');
  const inputRef = useRef<HTMLInputElement>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => {
    const byPanel = { sort: sortRef, filter: filterRef, period: periodRef, type: typeRef, settings: settingsRef };
    return panel ? [byPanel[panel]] : [];
  }, [panel]);
  const close = useCallback(() => setPanel(null), []);
  useDismiss(panel !== null, refs, close);

  const toggle = (p: Panel) => setPanel(prev => (prev === p ? null : p));

  const openSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
      props.onSearch('');
      return;
    }
    setSearchOpen(true);
    setPanel(null);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  const narrow = searchOpen;
  const nothingChecked = props.checkedCount === 0;

  return (
    <div style={{ position: 'absolute', top: LAYOUT.toolbarTop, left: LAYOUT.left, width: LAYOUT.width, height: LAYOUT.toolButton, zIndex: 30, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 15, top: 0, display: 'flex', alignItems: 'center', gap: 15 }}>
        {/* Поиск: раскрывается в поле, как в документе «Пополнение» */}
        <motion.div
          animate={{ width: searchOpen ? SEARCH_OPEN_WIDTH : LAYOUT.toolButton }}
          transition={{ type: 'tween', duration: 0.2 }}
          style={{
            height: LAYOUT.toolButton,
            borderRadius: 10,
            backgroundColor: searchOpen ? COLORS.accent : COLORS.white,
            boxShadow: searchOpen ? SHADOWS.active : SHADOWS.button,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            title={searchOpen ? 'Закрыть поиск' : 'Поиск'}
            aria-label="Поиск"
            onClick={openSearch}
            style={{ width: LAYOUT.toolButton, height: LAYOUT.toolButton, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <img src={searchOpen ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </button>
          <AnimatePresence>
            {searchOpen && (
              <motion.input
                ref={inputRef}
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.08 } }}
                exit={{ opacity: 0 }}
                value={search}
                placeholder="Код или наименование"
                onChange={e => props.onSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false);
                    props.onSearch('');
                  }
                }}
                className="gpp-search"
                style={{ flex: 1, minWidth: 0, height: 38, marginRight: 12, border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT, fontSize: 14, fontWeight: 500, color: COLORS.white }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        <div ref={sortRef} style={{ position: 'relative' }}>
          <ToolButton title="Сортировка" active={sort !== 'order' || panel === 'sort'} onClick={() => toggle('sort')}>
            <img src={sort !== 'order' || panel === 'sort' ? SortingIcon20White : SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />
          </ToolButton>
          <Popover open={panel === 'sort'} width={250} style={{ top: 48, left: 0, paddingBottom: 10 }}>
            <div style={caption}>Сортировка внутри уровня</div>
            {SORTS.map(s => (
              <MenuItem key={s.key} label={s.label} selected={sort === s.key} onClick={() => { props.onSort(s.key); close(); }} />
            ))}
          </Popover>
        </div>

        <div ref={filterRef} style={{ position: 'relative' }}>
          <ToolButton title="Фильтр по виду элемента" active={kinds.size > 0 || panel === 'filter'} onClick={() => toggle('filter')}>
            <img src={kinds.size > 0 || panel === 'filter' ? FilterIcon18White : FilterIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </ToolButton>
          <Popover open={panel === 'filter'} width={240} style={{ top: 48, left: 0 }}>
            <div style={caption}>Вид элемента</div>
            {KINDS.map(k => {
              const on = kinds.has(k);
              return (
                <MenuItem
                  key={k}
                  label={KIND_LABEL[k]}
                  selected={on}
                  trailing={<SquareCheck checked={on} />}
                  onClick={() => {
                    const next = new Set(kinds);
                    if (on) next.delete(k);
                    else next.add(k);
                    props.onKinds(next);
                  }}
                />
              );
            })}
            <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 6 }}>
              <button
                type="button"
                disabled={kinds.size === 0}
                onClick={() => props.onKinds(new Set())}
                style={{ width: '100%', height: 44, border: 'none', background: 'transparent', cursor: kinds.size === 0 ? 'default' : 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 500, color: kinds.size === 0 ? COLORS.faint : COLORS.text, borderRadius: '0 0 15px 15px' }}
              >
                Очистить фильтр
              </button>
            </div>
          </Popover>
        </div>

        <ToolButton
          title={props.anyExpanded ? 'Свернуть все узлы' : 'Развернуть все узлы'}
          width={174}
          onClick={props.anyExpanded ? props.onCollapseAll : props.onExpandAll}
          style={{ marginLeft: narrow ? 9 : 34, justifyContent: 'flex-start' }}
        >
          {props.anyExpanded ? <CollapseAllIcon size={18} /> : <ExpandAllIcon size={18} />}
          <span>{props.anyExpanded ? 'Свернуть все' : 'Развернуть все'}</span>
        </ToolButton>

        <ToolButton title={nothingChecked ? 'Копировать: отметьте строки' : 'Копировать отмеченные строки'} disabled={!editable || nothingChecked} onClick={props.onCopy}>
          <img src={CopyIcon16Black} alt="" style={{ width: 16, height: 16 }} />
        </ToolButton>
        <ToolButton title={nothingChecked ? 'Удалить: отметьте строки' : 'Удалить отмеченные строки'} disabled={!editable || nothingChecked} onClick={props.onDelete}>
          <img src={DeleteIcon16Black} alt="" style={{ width: 16, height: 16 }} />
        </ToolButton>

        <div ref={periodRef} style={{ position: 'relative', marginLeft: narrow ? 15 : 35 }}>
          <ToolButton title="Период выборки" width={187} active={panel === 'period'} onClick={() => toggle('period')}>
            <img src={CalendarIcon16Gray} alt="" style={{ width: 16, height: 18, filter: panel === 'period' ? 'brightness(0) invert(1)' : 'none' }} />
            <span>Период выборки</span>
          </ToolButton>
          <Popover open={panel === 'period'} width={524} style={{ top: 48, left: 0 }}>
            <PeriodPicker
              from={props.periodFrom}
              to={props.periodTo}
              plan={props.planMonths}
              onCancel={close}
              onApply={(a, b) => {
                props.onPeriod(a, b);
                close();
              }}
            />
          </Popover>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 15, top: 0, height: LAYOUT.toolButton, display: 'flex', alignItems: 'center' }}>
        <HoverHint
          width={300}
          text="Включён — даты считаются из длительностей и зависимостей, тянуть можно изделие целиком и правый край этапа. Выключен — этапы двигаются свободно, нарушенные зависимости подсвечиваются красным."
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'help' }}>
            <img src={InfoIcon18Black} alt="" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, whiteSpace: 'nowrap' }}>Автоматический расчет</span>
          </span>
        </HoverHint>
        <span style={{ marginLeft: 12, display: 'flex' }}>
          <Toggle on={props.autoCalc} onChange={props.onAutoCalc} disabled={!editable} label="Автоматический расчет" />
        </span>

        <span style={{ marginLeft: 50, fontSize: 14, fontWeight: 500, color: COLORS.text, whiteSpace: 'nowrap' }}>Тип ГПП</span>
        <div ref={typeRef} style={{ position: 'relative', marginLeft: 12 }}>
          <ToolButton title={editable ? 'Тип ГПП' : 'Тип ГПП — только просмотр'} width={244} disabled={!editable} onClick={() => toggle('type')} style={{ justifyContent: 'flex-start', color: COLORS.accent, opacity: 1 }}>
            {type === 'GENERAL' ? <TreeTypeIcon size={18} color={COLORS.accent} /> : <SequenceIcon size={18} color={COLORS.accent} />}
            <span style={{ flex: 1, textAlign: 'left' }}>{TYPE_LABEL[type]}</span>
            {editable && (
              <motion.span animate={{ rotate: panel === 'type' ? 180 : 0 }} style={{ display: 'flex' }}>
                <ChevronDownIcon size={16} color={COLORS.accent} />
              </motion.span>
            )}
          </ToolButton>
          <Popover open={panel === 'type'} width={276} style={{ top: 48, left: 0, padding: '8px 0' }}>
            {(['GENERAL', 'SEQUENTIAL'] as GppType[]).map(t => (
              <MenuItem
                key={t}
                label={TYPE_LABEL[t]}
                selected={type === t}
                icon={t === 'GENERAL' ? <TreeTypeIcon size={16} color={type === t ? COLORS.accent : COLORS.text} /> : <SequenceIcon size={16} color={type === t ? COLORS.accent : COLORS.text} />}
                onClick={() => {
                  props.onType(t);
                  close();
                }}
              />
            ))}
          </Popover>
        </div>

        <div style={{ display: 'flex', gap: 15, marginLeft: 50 }}>
          <ToolButton title="Печать" onClick={props.onPrint}>
            <img src={PrintIcon18Black} alt="" style={{ width: 18, height: 18 }} />
          </ToolButton>
          <ToolButton title="Сохранить в PDF" onClick={props.onPdf}>
            <img src={PrintPDFIcon14Black} alt="" style={{ width: 14, height: 18 }} />
          </ToolButton>
          <div ref={settingsRef} style={{ position: 'relative' }}>
            <ToolButton title="Настройки вида" active={panel === 'settings'} onClick={() => toggle('settings')}>
              <img src={ConfigurationIcon18Black} alt="" style={{ width: 20, height: 18, filter: panel === 'settings' ? 'brightness(0) invert(1)' : 'none' }} />
            </ToolButton>
            <Popover open={panel === 'settings'} width={300} style={{ top: 48, right: 0, padding: '18px 20px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.muted, marginBottom: 10 }}>Масштаб шкалы</div>
              <div style={{ display: 'flex', padding: 3, borderRadius: 10, backgroundColor: '#F1F3F9' }}>
                {SCALES.map(s => {
                  const on = settings.scale === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => props.onSettings({ ...settings, scale: s.key })}
                      style={{
                        flex: 1,
                        height: 32,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontFamily: FONT,
                        fontSize: 14,
                        fontWeight: on ? 600 : 500,
                        color: on ? COLORS.accent : COLORS.text,
                        backgroundColor: on ? COLORS.white : 'transparent',
                        boxShadow: on ? SHADOWS.button : 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, fontSize: 14, fontWeight: 500 }}>
                Стрелки зависимостей
                <Toggle on={settings.showLinks} onChange={on => props.onSettings({ ...settings, showLinks: on })} label="Стрелки зависимостей" />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 14, fontWeight: 500 }}>
                Линия «сегодня»
                <Toggle on={settings.showToday} onChange={on => props.onSettings({ ...settings, showToday: on })} label="Линия «сегодня»" />
              </label>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GppToolbar;
