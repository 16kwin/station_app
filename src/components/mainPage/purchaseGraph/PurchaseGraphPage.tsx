// PurchaseGraphPage.tsx — страница «Граф закупок» (/screen/purchase-graph?focus&from&to), открывается
// в отдельной вкладке без меню приложения: сверху фильтры и период, слева дерево номенклатуры
// и легенда, справа настройки как в Obsidian, в центре — граф с физикой d3-force.
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DateRangePopup from '../shared/DateRangePopup';
import type { AnchorRect } from '../shared/DateRangePopup';
import { COLORS, DEFAULT_RANGE, FONT, SHADOWS } from '../shared/layout';
import type { DateRange } from '../shared/types';
import { fetchPurchaseGraph } from './api';
import GraphLegend from './GraphLegend';
import GraphNavTree from './GraphNavTree';
import GraphPrintTable, { GraphPrintHeader } from './GraphPrintTable';
import GraphSettingsPanel from './GraphSettingsPanel';
import GraphToolbar from './GraphToolbar';
import GraphView from './GraphView';
import { CloseIcon } from './icons';
import { PAGE_GAP, SETTINGS_WIDTH, SIDE_LEFT, SIDE_WIDTH, TOOLBAR_HEIGHT } from './layout';
import { buildGraph, isFavorite } from './model';
import { DEFAULT_SETTINGS, loadFavorites, loadSettings, saveFavorites, saveSettings } from './settings';
import type { FavoriteOverrides } from './settings';
import type { GraphModel, GraphNode, GraphSettings, PurchaseGraphData } from './types';

const PAGE_TITLE = 'Граф закупок — AWMS';
const FETCH_ERROR_TEXT = 'Не удалось загрузить граф закупок';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Пустая модель, пока данных нет */
const EMPTY_MODEL: GraphModel = {
  nodes: [],
  edges: [],
  limitPercent: 20,
  focusKey: null,
  emptyReason: null,
  nomByKey: new Map(),
  supplierByKey: new Map(),
  groupByKey: new Map(),
};

/**
 * Печать: скрыть панели и тулбар, граф в текущем виде (движок на время печати вписывает его
 * через viewBox), под ним легенда и таблица видимых закупок.
 */
const PAGE_CSS = `
.pg-print-only { display: none; }
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  html, body { background: #FFFFFF !important; }
  body * { visibility: hidden !important; }
  .pg-root, .pg-root * { visibility: visible !important; }
  .pg-root { position: absolute !important; left: 0 !important; top: 0 !important; right: auto !important; bottom: auto !important;
    width: 100% !important; height: auto !important; overflow: visible !important; background: #FFFFFF !important; }
  .pg-inner { position: static !important; min-width: 0 !important; min-height: 0 !important; width: 100% !important; height: auto !important; }
  .pg-toolbar, .pg-nav-wrap, .pg-settings-wrap, .pg-chip, .pg-message { display: none !important; }
  .pg-canvas { position: relative !important; left: auto !important; top: auto !important; right: auto !important; bottom: auto !important;
    width: 100% !important; height: 120mm !important; border: 0.3mm solid #E3E8F0; border-radius: 3mm; }
  .pg-side { position: static !important; width: auto !important; height: auto !important; display: block !important; margin-top: 3mm; }
  .pg-legend { flex-direction: row !important; flex-wrap: wrap !important; max-width: none !important; box-shadow: none !important;
    background: transparent !important; padding: 0 !important; column-gap: 8mm !important; }
  .pg-print-only { display: block !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

const rangeFromParams = (params: URLSearchParams): DateRange => {
  const from = params.get('from');
  const to = params.get('to');
  if (from && to && ISO_RE.test(from) && ISO_RE.test(to)) return from <= to ? { from, to } : { from: to, to: from };
  return { ...DEFAULT_RANGE };
};

interface PurchaseGraphPageProps {
  /** Начальные данные (печать, проверки); запрос за период всё равно выполняется */
  initialData?: PurchaseGraphData | null;
}

const PurchaseGraphPage: React.FC<PurchaseGraphPageProps> = ({ initialData = null }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState<DateRange>(() => rangeFromParams(searchParams));
  const [focusKey, setFocusKey] = useState<string | null>(() => searchParams.get('focus') || null);
  const [nomSelection, setNomSelection] = useState<string[] | null>(null);
  const [supplierSelection, setSupplierSelection] = useState<string[] | null>(null);
  const [settings, setSettings] = useState<GraphSettings>(loadSettings);
  const [favorites, setFavorites] = useState<FavoriteOverrides>(loadFavorites);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [explodeKey, setExplodeKey] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<AnchorRect | null>(null);
  const [data, setData] = useState<PurchaseGraphData | null>(initialData);
  const [retry, setRetry] = useState(0);
  // Ключ последнего завершённого запроса: «загрузка» выводится из него, без setState в эффекте
  const [settledKey, setSettledKey] = useState<string | null>(null);
  // Ключ упавшего запроса: ошибка показывается только для текущего, новый запрос её снимает
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const requestKey = `${range.from}|${range.to}|${retry}`;
  const loading = settledKey !== requestKey;
  const error = failedKey === requestKey ? FETCH_ERROR_TEXT : null;

  // Данные за период; пока идёт запрос, старый граф остаётся на экране
  useEffect(() => {
    let cancelled = false;
    fetchPurchaseGraph(range)
      .then(result => {
        if (cancelled) return;
        setData(result);
        setFailedKey(null);
        setSettledKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        setFailedKey(requestKey);
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [range, requestKey]);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const apiLimit = data?.limitPercent ?? 20;
  const limitPercent = settings.display.limitPercent ?? apiLimit;
  const { filters, groups, display, forces } = settings;

  const model = useMemo(
    () =>
      data
        ? buildGraph(data, {
            limitPercent,
            filters,
            groups,
            nomSelection,
            supplierSelection,
            focusKey,
            showVolumes: true,
          })
        : EMPTY_MODEL,
    [data, limitPercent, filters, groups, nomSelection, supplierSelection, focusKey],
  );

  const focusName = model.focusKey ? (model.nomByKey.get(model.focusKey)?.name ?? null) : null;

  /* ---------- Адрес страницы: фокус и период переживают перезагрузку вкладки ---------- */

  const syncUrl = (next: { focus?: string | null; range?: DateRange }) => {
    const params = new URLSearchParams(searchParams);
    if (next.focus !== undefined) {
      if (next.focus) params.set('focus', next.focus);
      else params.delete('focus');
    }
    if (next.range) {
      params.set('from', next.range.from);
      params.set('to', next.range.to);
    }
    setSearchParams(params, { replace: true });
  };

  const changeFocus = (key: string | null) => {
    setFocusKey(key);
    syncUrl({ focus: key });
  };

  // Клик по номенклатуре на графе — фокус; повторный клик — выход. Поставщик подсвечивается в самом графе
  const handleNodeClick = (node: GraphNode) => {
    if (node.kind === 'nom') changeFocus(focusKey === node.key ? null : node.key);
  };

  // «Все позиции» в дереве снимает и фокус, и выбор номенклатуры
  const handleTreeFocus = (key: string | null) => {
    if (key === null) setNomSelection(null);
    changeFocus(key);
  };

  const handleNomSelection = (next: string[] | null) => {
    setNomSelection(next);
    if (focusKey) changeFocus(null);
  };

  const handleSupplierSelection = (next: string[] | null) => {
    setSupplierSelection(next);
    if (focusKey) changeFocus(null);
  };

  const handleToggleFavorite = (key: string) => {
    const nom = data?.nomenclature.find(item => item.key === key);
    if (!nom) return;
    setFavorites(prev => ({ ...prev, [key]: !isFavorite(nom, prev) }));
  };

  const handleDateClick = (anchor: AnchorRect) => {
    setDateAnchor(anchor);
    setDateOpen(open => !open);
  };

  const applyRange = (next: DateRange) => {
    setRange(next);
    syncUrl({ range: next });
  };

  const handleDateReset = () => {
    setDateOpen(false);
    applyRange({ ...DEFAULT_RANGE });
  };

  /* ---------- Раскладка ---------- */

  const leftInset = SIDE_LEFT + SIDE_WIDTH + PAGE_GAP;
  const rightInset = settingsOpen ? SETTINGS_WIDTH + 2 * PAGE_GAP : PAGE_GAP;
  const insets = useMemo(() => ({ left: leftInset, right: rightInset, top: PAGE_GAP, bottom: PAGE_GAP }), [leftInset, rightInset]);
  // Камера вписывает граф заново при смене фокуса, выбора и после загрузки периода
  const fitKey = `${focusKey ?? ''}|${nomSelection?.join(',') ?? '*'}|${supplierSelection?.join(',') ?? '*'}|${settledKey ?? ''}`;

  const filtersNote = [
    focusName ? `Фокус: ${focusName}` : '',
    !focusName && nomSelection ? `Номенклатура: выбрано ${nomSelection.length}` : '',
    !focusName && supplierSelection ? `Поставщики: выбрано ${supplierSelection.length}` : '',
    !filters.showRegular ? 'без рядовых закупок' : '',
    !filters.showOverLimit ? 'без закупок свыше лимита' : '',
    !filters.showAnchor ? 'без якорных поставщиков' : '',
    filters.search.trim() ? `поиск «${filters.search.trim()}»` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const message = (() => {
    if (error && !data) return error;
    if (!data) return loading ? 'Загрузка графа закупок…' : null;
    if (model.emptyReason === 'no-data') return 'Нет закупок за выбранный период';
    if (model.emptyReason === 'nothing-selected') return 'Ничего не выбрано — отметьте позиции в фильтре';
    if (model.emptyReason === 'filtered') return 'Под фильтры не попала ни одна закупка';
    return null;
  })();

  return (
    <div
      className="pg-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        overflow: 'auto',
        backgroundColor: COLORS.white,
        fontFamily: FONT,
        color: COLORS.text,
        userSelect: 'none',
      }}
    >
      <style>{PAGE_CSS}</style>
      <div className="pg-inner" style={{ position: 'relative', width: '100%', height: '100%', minWidth: 1280, minHeight: 720 }}>
        {/* Период печати — тот, за который загружены данные, а не только что выбранный */}
        <GraphPrintHeader
          range={data ? { from: data.from, to: data.to } : range}
          limitPercent={limitPercent}
          filtersNote={filtersNote}
        />

        <GraphToolbar
          data={data}
          limitPercent={limitPercent}
          focusName={focusName}
          nomSelection={nomSelection}
          supplierSelection={supplierSelection}
          onNomSelectionChange={handleNomSelection}
          onSupplierSelectionChange={handleSupplierSelection}
          range={range}
          onDateClick={handleDateClick}
          onDateReset={handleDateReset}
          onPrint={() => window.print()}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen(open => !open)}
        />

        {/* Холст графа — на всю ширину, панели лежат поверх него */}
        <div className="pg-canvas" style={{ position: 'absolute', left: 0, right: 0, top: TOOLBAR_HEIGHT, bottom: 0 }}>
          <GraphView
            model={model}
            mode="full"
            display={display}
            forces={forces}
            explodeKey={explodeKey}
            fitKey={fitKey}
            insets={insets}
            onNodeClick={handleNodeClick}
            controlsOffset={{ right: rightInset + 8, bottom: PAGE_GAP + 8 }}
          />
        </div>

        {/* Левая колонка: дерево номенклатуры и легенда */}
        <div
          className="pg-side"
          style={{
            position: 'absolute',
            left: SIDE_LEFT,
            top: TOOLBAR_HEIGHT + PAGE_GAP,
            bottom: PAGE_GAP + 8,
            width: SIDE_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            zIndex: 6,
            pointerEvents: 'none',
          }}
        >
          <div className="pg-nav-wrap" style={{ flex: 1, minHeight: 0, pointerEvents: 'auto' }}>
            <GraphNavTree
              data={data}
              favorites={favorites}
              focusKey={model.focusKey}
              onFocus={handleTreeFocus}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
          <div style={{ flexShrink: 0, pointerEvents: 'auto' }}>
            <GraphLegend gradient={display.gradient} limitPercent={limitPercent} />
          </div>
        </div>

        {/* Панель настроек, плавающая справа сверху */}
        {settingsOpen && (
          <div
            className="pg-settings-wrap"
            style={{
              position: 'absolute',
              right: PAGE_GAP,
              top: TOOLBAR_HEIGHT + PAGE_GAP,
              bottom: PAGE_GAP,
              width: SETTINGS_WIDTH,
              display: 'flex',
              alignItems: 'flex-start',
              zIndex: 8,
              pointerEvents: 'none',
            }}
          >
            <div style={{ maxHeight: '100%', display: 'flex', pointerEvents: 'auto' }}>
              <GraphSettingsPanel
                settings={settings}
                apiLimit={apiLimit}
                onChange={setSettings}
                onReset={() => setSettings(DEFAULT_SETTINGS)}
                onClose={() => setSettingsOpen(false)}
                onAnimate={() => setExplodeKey(key => key + 1)}
              />
            </div>
          </div>
        )}

        {/* Фокус и загрузка — плашки сверху по центру свободной области */}
        <div
          className="pg-chip"
          style={{
            position: 'absolute',
            left: leftInset,
            right: rightInset,
            top: TOOLBAR_HEIGHT + PAGE_GAP,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            zIndex: 7,
            pointerEvents: 'none',
          }}
        >
          {focusName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 6px 0 14px',
                borderRadius: 17,
                backgroundColor: COLORS.white,
                boxShadow: SHADOWS.card,
                border: '1px solid rgba(102, 110, 254, 0.35)',
                fontSize: 13.5,
                fontWeight: 500,
                pointerEvents: 'auto',
              }}
            >
              <span style={{ color: COLORS.textMuted }}>Фокус:</span>
              <span style={{ fontWeight: 600, color: COLORS.accent }}>{focusName}</span>
              <button
                type="button"
                aria-label="Выйти из фокуса"
                title="Показать все позиции"
                onClick={() => changeFocus(null)}
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  border: 'none',
                  borderRadius: 12,
                  background: 'transparent',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={13} />
              </button>
            </div>
          )}
          {loading && data && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 34,
                padding: '0 14px',
                borderRadius: 17,
                backgroundColor: COLORS.white,
                boxShadow: SHADOWS.card,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textMuted,
              }}
            >
              Загрузка…
            </div>
          )}
          {error && data && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 34,
                padding: '0 6px 0 14px',
                borderRadius: 17,
                backgroundColor: COLORS.white,
                boxShadow: SHADOWS.card,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.roseDark,
                pointerEvents: 'auto',
              }}
            >
              {error}
              <button
                type="button"
                onClick={() => setRetry(value => value + 1)}
                style={{ height: 26, padding: '0 10px', border: 'none', borderRadius: 13, backgroundColor: COLORS.accent, color: COLORS.white, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Повторить
              </button>
            </div>
          )}
        </div>

        {/* Пустой граф или ошибка без данных — сообщение в центре холста */}
        {message && (
          <div
            className="pg-message"
            style={{
              position: 'absolute',
              left: leftInset,
              right: rightInset,
              top: TOOLBAR_HEIGHT,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 500, color: error && !data ? COLORS.roseDark : COLORS.textMuted }}>{message}</div>
            {error && !data && (
              <button
                type="button"
                onClick={() => setRetry(value => value + 1)}
                style={{ height: 34, padding: '0 16px', border: 'none', borderRadius: 10, backgroundColor: COLORS.accent, color: COLORS.white, fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: 'pointer', pointerEvents: 'auto' }}
              >
                Повторить
              </button>
            )}
          </div>
        )}

        <GraphPrintTable model={model} />
      </div>

      <DateRangePopup
        isOpen={dateOpen}
        anchorRect={dateAnchor}
        range={range}
        onClose={() => setDateOpen(false)}
        onConfirm={applyRange}
      />
    </div>
  );
};

export default PurchaseGraphPage;
