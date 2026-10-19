// GppPage.tsx — документ «График подготовки производства (ГПП по предприятию)»: заголовок с избранным, тулбар,
// таблица-дерево и диаграмма Ганта, «Рассчитать план закупок», «Записать», «Закрыть». План считается здесь
// (schedule.ts), сервер хранит строки как есть. Править может руководитель (ADMIN, DIRECTOR), остальные — смотреть.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTabs } from '../../../context/TabContext';
import { useIsManager } from '../../../services/roles';
import type { GppDocumentDTO, GppRowDTO, GppSaveRequest, GppType, GppViewSettings, RowKind, SortMode } from './types';
import { BAR_PALETTE, COLORS, FONT, GANTT_WIDTH, LAYOUT, TYPE_LABEL } from './theme';
import { isoDay, monthEnd, monthIndex, monthStart, parseDay, periodLabel, ruDateTime, today } from './dates';
import { errorStatus, errorText, fetchGpp, loadErrorText, saveGpp } from './api';
import { applyBarEdit, applyStage, buildLinks, computePlan, planBounds, visibleDeps } from './schedule';
import type { StagePatch } from './schedule';
import { ancestors, buildIndex, copySubtrees, deleteSubtrees, expandableUids, newUid, nextOpNumber, normalize, placeNewRow, subtreeOf, visibleRows } from './tree';
import { makeTimeline } from './geometry';
import { loadFavorite, loadSettings, saveFavorite, saveSettings } from './settings';
import { buildPrintHtml, printHtml } from './print';
import { ChevronDownIcon, EyeIcon, RefreshIcon, StarIcon, WarningIcon } from './icons';
import { BottomButton, Dialog, Notice, PillButton, Spinner } from './ui';
import type { NoticeMessage } from './ui';
import GppToolbar from './GppToolbar';
import GppGrid from './GppGrid';
import type { EditTarget, RowPatch } from './GppTable';
import StagePopup from './StagePopup';
import PurchasePlanPopup from './PurchasePlanPopup';
import RowContextMenu from './RowContextMenu';
import type { ContextMenuState } from './RowContextMenu';
import IconW from '../../../assets/Schablon/IconW.svg';

const TAB_PATH = '/documents/gpp';
const DEFAULT_TITLE = 'График подготовки производства (ГПП по предприятию)';

/** Отпечаток сохраняемого состояния: «Записать» активна, только если он отличается от сохранённого */
const signature = (rows: readonly GppRowDTO[], type: GppType, autoCalc: boolean, from: number, to: number): string =>
  JSON.stringify([
    type,
    autoCalc,
    isoDay(from),
    isoDay(to),
    rows.map(r => [r.uid, r.parentUid, r.position, r.opNumber, r.code, r.name, r.kind, r.quantity, r.unit, r.start, r.finish, r.durationDays, (r.color ?? '').toUpperCase(), r.dependsOn]),
  ]);

/** Период документа; пустой или перевёрнутый — полгода от текущего месяца */
const periodOf = (doc: GppDocumentDTO): { from: number; to: number } => {
  const from = parseDay(doc.periodFrom) ?? monthStart(monthIndex(today()));
  const to = parseDay(doc.periodTo);
  return { from, to: to !== null && to >= from ? to : monthEnd(monthIndex(from) + 5) };
};

type LoadState = 'loading' | 'ready' | 'error';

const GppPage: React.FC = () => {
  const isManager = useIsManager();
  const { tabs, activeTabId, closeTab, switchTab, registerTabCloseGuard, unregisterTabCloseGuard } = useTabs();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [doc, setDoc] = useState<GppDocumentDTO | null>(null);
  const [rows, setRows] = useState<GppRowDTO[]>([]);
  const [gppType, setGppType] = useState<GppType>('GENERAL');
  const [autoCalc, setAutoCalc] = useState(true);
  const [periodFrom, setPeriodFrom] = useState(() => monthStart(monthIndex(today())));
  const [periodTo, setPeriodTo] = useState(() => monthEnd(monthIndex(today()) + 5));
  const [savedSignature, setSavedSignature] = useState('');

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('order');
  const [kinds, setKinds] = useState<Set<RowKind>>(new Set());
  const [settings, setSettings] = useState<GppViewSettings>(loadSettings);
  const [favorite, setFavorite] = useState(loadFavorite);
  const [infoOpen, setInfoOpen] = useState(true);

  const [hovered, setHovered] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);
  const [stageUid, setStageUid] = useState<string | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [deleteAsk, setDeleteAsk] = useState<string[] | null>(null);
  const [closeAsk, setCloseAsk] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeMessage | null>(null);

  const showNotice = useCallback((text: string, tone: NoticeMessage['tone'] = 'info') => setNotice({ id: Date.now(), text, tone }), []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 2800);
    return () => window.clearTimeout(id);
  }, [notice]);

  /** Принять документ с сервера; keepView — после записи не сбрасывать отметки и свёрнутые узлы */
  const applyDoc = useCallback((d: GppDocumentDTO, keepView = false) => {
    const normalized = normalize(d.rows ?? []);
    const period = periodOf(d);
    setDoc(d);
    setRows(normalized);
    setGppType(d.gppType === 'SEQUENTIAL' ? 'SEQUENTIAL' : 'GENERAL');
    setAutoCalc(d.autoCalc);
    setPeriodFrom(period.from);
    setPeriodTo(period.to);
    setSavedSignature(signature(normalized, d.gppType, d.autoCalc, period.from, period.to));
    if (!keepView) {
      setCollapsed(new Set(normalized.filter(r => r.collapsed).map(r => r.uid)));
      setChecked(new Set());
      setEditing(null);
    } else {
      // После своей записи открытая правка на месте не закрывается молча — набранное в ней не пропадёт
      const alive = new Set(normalized.map(r => r.uid));
      setChecked(prev => new Set([...prev].filter(u => alive.has(u))));
      setEditing(prev => (prev && alive.has(prev.uid) ? prev : null));
    }
  }, []);

  const loadDocument = useCallback(
    () =>
      fetchGpp()
        .then(d => {
          applyDoc(d);
          setLoadState('ready');
        })
        .catch(error => {
          setLoadError(loadErrorText(error));
          setLoadState('error');
        }),
    [applyDoc],
  );

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const reload = () => {
    setLoadState('loading');
    setConflict(null);
    loadDocument();
  };

  // ---------- Производные ----------
  const editable = loadState === 'ready' && !!doc?.canEdit && isManager;
  const options = useMemo(() => ({ autoCalc, type: gppType, fallbackStart: periodFrom }), [autoCalc, gppType, periodFrom]);
  const currentSignature = useMemo(() => signature(rows, gppType, autoCalc, periodFrom, periodTo), [rows, gppType, autoCalc, periodFrom, periodTo]);
  const dirty = loadState === 'ready' && currentSignature !== savedSignature;
  const visible = useMemo(() => visibleRows(rows, { collapsed, search, kinds, sort }), [rows, collapsed, search, kinds, sort]);
  const timeline = useMemo(() => makeTimeline(periodFrom, periodTo, settings.scale, GANTT_WIDTH), [periodFrom, periodTo, settings.scale]);
  const expandable = useMemo(() => expandableUids(rows), [rows]);
  const anyExpanded = expandable.some(u => !collapsed.has(u));
  const violations = useMemo(() => (autoCalc ? 0 : buildLinks(rows, gppType).filter(l => l.violated).length), [rows, gppType, autoCalc]);
  const bounds = useMemo(() => planBounds(rows), [rows]);
  const counts = useMemo(
    () => ({
      products: rows.filter(r => r.kind === 'PRODUCT').length,
      parts: rows.filter(r => r.kind === 'PART').length,
      materials: rows.filter(r => r.kind === 'MATERIAL').length,
    }),
    [rows],
  );
  const periodText = periodLabel(periodFrom, periodTo);
  const title = doc?.title || DEFAULT_TITLE;
  const ownTabId = tabs.find(t => t.path === TAB_PATH)?.id ?? null;

  // ---------- Правки ----------
  /** Новые строки; с автоРасчётом план сразу пересчитывается */
  const commitRows = useCallback(
    (next: GppRowDTO[]) => setRows(autoCalc ? computePlan(next, gppType, periodFrom) : next),
    [autoCalc, gppType, periodFrom],
  );

  const handleType = (type: GppType) => {
    if (type === gppType) return;
    setGppType(type);
    if (autoCalc) setRows(computePlan(rows, type, periodFrom));
  };

  const handleAutoCalc = (on: boolean) => {
    setAutoCalc(on);
    if (on) setRows(computePlan(rows, gppType, periodFrom));
  };

  const handleBarEdit = (uid: string, mode: 'move' | 'resize', delta: number) => {
    if (!editable) return;
    setRows(applyBarEdit(rows, uid, mode, delta, options));
  };

  const handleStage = (uid: string, patch: StagePatch) => {
    setRows(applyStage(rows, uid, patch, options));
    setStageUid(null);
  };

  const handleCommitEdit = (uid: string, patch: RowPatch) => {
    setRows(prev => prev.map(r => (r.uid === uid ? { ...r, ...patch } : r)));
    setEditing(null);
  };

  const handleCopy = () => {
    if (!editable || checked.size === 0) return;
    const { rows: next, copies } = copySubtrees(rows, checked);
    commitRows(next);
    setChecked(new Set(copies));
    showNotice(copies.length === 1 ? 'Строка скопирована — копия стоит сразу после оригинала' : `Скопировано строк: ${copies.length}`, 'success');
  };

  const handleDelete = (uids: string[]) => {
    const next = deleteSubtrees(rows, uids);
    commitRows(next);
    // Отметки остаются только у живых строк: у удалённых вложенных тоже снимаются
    const alive = new Set(next.map(r => r.uid));
    setChecked(prev => new Set([...prev].filter(u => alive.has(u))));
    setDeleteAsk(null);
  };

  const handleAdd = (kind: RowKind, anchorUid: string | null) => {
    if (!editable) return;
    const place = placeNewRow(rows, kind, anchorUid);
    const index = buildIndex(rows);
    const parent = place.parentUid ? index.byUid.get(place.parentUid) : undefined;
    const productUid = parent ? index.productOf.get(parent.uid) : undefined;
    const partsInProduct = rows.filter(r => r.kind === 'PART' && index.productOf.get(r.uid) === productUid).length;
    const now = today();
    const defaultStart = now >= periodFrom && now <= periodTo ? now : periodFrom;
    const start = parseDay(parent?.start) ?? defaultStart;
    const uid = newUid();
    const row: GppRowDTO = {
      uid,
      parentUid: place.parentUid,
      position: place.position,
      opNumber: kind === 'PRODUCT' ? '000' : kind === 'PART' ? nextOpNumber(rows.filter(r => r.kind === 'PART' && index.productOf.get(r.uid) === productUid)) : null,
      code: null,
      name: kind === 'PRODUCT' ? 'Новое изделие' : kind === 'PART' ? 'Новая деталь' : 'Новый материал',
      kind,
      quantity: kind === 'MATERIAL' ? 1 : parent?.quantity ?? 1,
      unit: 'шт',
      start: kind === 'MATERIAL' ? null : isoDay(start),
      finish: kind === 'MATERIAL' ? null : isoDay(start + 9),
      durationDays: kind === 'MATERIAL' ? null : 10,
      color: kind === 'MATERIAL' ? null : kind === 'PRODUCT' ? BAR_PALETTE[0] : BAR_PALETTE[1 + (partsInProduct % (BAR_PALETTE.length - 1))],
      dependsOn: [],
      collapsed: false,
    };
    const next = normalize([...rows, row]);
    commitRows(next);
    // Новая строка должна быть видна: раскрываются все её предки (при поиске узлы были раскрыты только на время),
    // поиск и фильтр сбрасываются
    const open = new Set(ancestors(buildIndex(next), uid));
    if (open.size > 0) setCollapsed(prev => new Set([...prev].filter(u => !open.has(u))));
    setSearch('');
    setKinds(new Set());
    setEditing({ uid, field: 'name' });
    setReveal(uid);
  };

  const onRevealed = useCallback(() => setReveal(null), []);

  const askDelete = (uids: string[]) => {
    if (!editable || uids.length === 0) return;
    setDeleteAsk(uids);
  };

  const handlePeriod = (fromMonth: number, toMonth: number) => {
    setPeriodFrom(monthStart(fromMonth));
    setPeriodTo(monthEnd(Math.max(fromMonth, toMonth)));
  };

  const handleSettings = (next: GppViewSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const toggleFavorite = () => {
    setFavorite(prev => {
      saveFavorite(!prev);
      return !prev;
    });
  };

  const toggleCheck = (uid: string) =>
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  /** «Отметить все» при поиске и фильтре — только найденные строки, без приглушённых предков: иначе «Удалить» и
   *  «Копировать» взяли бы изделие целиком вместе со строками, скрытыми поиском */
  const toggleAll = () => {
    const selectable = visible.filter(v => !v.context);
    const all = selectable.length > 0 && selectable.every(v => checked.has(v.row.uid));
    setChecked(all ? new Set() : new Set(selectable.map(v => v.row.uid)));
  };

  const toggleExpand = (uid: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  // ---------- Запись ----------
  const save = async (): Promise<boolean> => {
    if (!doc || !editable || saving) return false;
    setSaving(true);
    const body: GppSaveRequest = {
      version: doc.version,
      gppType,
      autoCalc,
      periodFrom: isoDay(periodFrom),
      periodTo: isoDay(periodTo),
      // Зависимости, которых экран не показывает и не учитывает (не детали того же изделия), не сохраняются
      rows: visibleDeps(normalize(rows)).map(r =>
        r.kind === 'MATERIAL'
          ? { ...r, start: null, finish: null, durationDays: null, dependsOn: [], collapsed: collapsed.has(r.uid) }
          : { ...r, collapsed: collapsed.has(r.uid) },
      ),
    };
    try {
      const saved = await saveGpp(body);
      applyDoc(saved, true);
      showNotice('Сохранено', 'success');
      return true;
    } catch (error) {
      const status = errorStatus(error);
      if (status === 409) setConflict(errorText(error, 'График уже изменил другой пользователь. Загрузите документ заново.'));
      else if (status === 400) showNotice(errorText(error, 'Сервер не принял документ: проверьте строки.'), 'error');
      else if (status === 403) showNotice('Нет прав на запись документа — записывать может руководитель.', 'error');
      else if (status === null) showNotice('Не удалось сохранить: нет связи с сервером.', 'error');
      else showNotice(errorText(error, `Не удалось сохранить документ (код ${status}).`), 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const closeOwnTab = () => {
    const id = ownTabId ?? activeTabId;
    if (id) closeTab(id);
  };

  const handleClose = () => {
    if (editable && dirty) setCloseAsk(true);
    else closeOwnTab();
  };

  // Ctrl+S — «Записать», пока вкладка документа активна. Открытая правка на месте сначала принимается: уход фокуса
  // из поля — как Enter (неверное значение отменяется, как и при щелчке по «Записать»), запись — после обновления строк
  const saveAfterEdit = useRef(false);
  useEffect(() => {
    if (!ownTabId || activeTabId !== ownTabId) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
        event.preventDefault();
        if (editing !== null && document.activeElement instanceof HTMLElement) {
          saveAfterEdit.current = true;
          document.activeElement.blur();
          return;
        }
        if (editable && dirty && !saving) void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!saveAfterEdit.current || editing !== null) return;
    saveAfterEdit.current = false;
    if (editable && dirty && !saving) void save();
  });

  // Перезагрузка или закрытие вкладки браузера с несохранёнными правками — браузер переспросит
  useEffect(() => {
    if (!editable || !dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [editable, dirty]);

  // Крестик вкладки в панели вкладок: с несохранёнными правками — тот же вопрос, что у «Закрыть»
  useEffect(() => {
    if (!ownTabId || !editable || !dirty) return;
    registerTabCloseGuard(ownTabId, () => {
      switchTab(ownTabId);
      setCloseAsk(true);
    });
    return () => unregisterTabCloseGuard(ownTabId);
  }, [ownTabId, editable, dirty, registerTabCloseGuard, unregisterTabCloseGuard, switchTab]);

  const print = (asPdf: boolean) => {
    const fileTitle = `ГПП по предприятию — ${periodText}`;
    printHtml(
      buildPrintHtml({
        title,
        rows,
        type: gppType,
        periodFrom,
        periodTo,
        periodText,
        updatedAt: doc?.updatedAt ?? null,
        updatedBy: doc?.updatedBy ?? null,
        showLinks: settings.showLinks,
      }),
      fileTitle,
    );
    if (asPdf) showNotice('В окне печати выберите «Сохранить как PDF» — имя файла уже подставлено', 'info');
  };

  const stageRow = stageUid ? rows.find(r => r.uid === stageUid && r.kind !== 'MATERIAL') ?? null : null;

  // Вопрос об удалении называет, сколько строк уйдёт на самом деле — вместе с вложенными и скрытыми поиском
  const deleteText = (() => {
    if (!deleteAsk) return '';
    const gone = subtreeOf(rows, deleteAsk);
    const shown = new Set(visible.map(v => v.row.uid));
    const hidden = search.trim() !== '' || kinds.size > 0 ? [...gone].filter(u => !shown.has(u)).length : 0;
    const what =
      deleteAsk.length === 1
        ? gone.size > 1
          ? `Строка будет удалена вместе с вложенными — всего строк: ${gone.size}.`
          : 'Строка будет удалена.'
        : gone.size > deleteAsk.length
          ? `Будут удалены отмеченные строки (${deleteAsk.length}) вместе с вложенными — всего строк: ${gone.size}.`
          : `Будут удалены отмеченные строки (${deleteAsk.length}).`;
    return `${what}${hidden > 0 ? ` Из них скрыто поиском или фильтром: ${hidden}.` : ''} Пока документ не записан, изменения можно не сохранять.`;
  })();

  // ---------- Разметка ----------
  const chip = (content: React.ReactNode, tone: 'muted' | 'warn' | 'danger') => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 26,
        padding: '0 10px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        backgroundColor: tone === 'danger' ? COLORS.dangerSoft : tone === 'warn' ? '#FFF3EA' : '#EEF1F7',
        color: tone === 'danger' ? COLORS.danger : tone === 'warn' ? '#E0803C' : COLORS.muted,
        whiteSpace: 'nowrap',
      }}
    >
      {content}
    </span>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: COLORS.pageBg, overflow: 'hidden', fontFamily: FONT, color: COLORS.text }}>
      <style>{'.gpp-search::placeholder { color: rgba(255, 255, 255, 0.72); }'}</style>

      <div style={{ position: 'absolute', top: LAYOUT.titleTop, left: 36, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
        <motion.button
          type="button"
          aria-label={infoOpen ? 'Скрыть сведения о документе' : 'Показать сведения о документе'}
          aria-expanded={infoOpen}
          onClick={() => setInfoOpen(v => !v)}
          animate={{ rotate: infoOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          style={{ width: 20, height: 20, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronDownIcon size={16} strokeWidth={2.6} />
        </motion.button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '29px', whiteSpace: 'nowrap' }}>Документ: {title}</h1>
        <motion.button
          type="button"
          aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-pressed={favorite}
          title={favorite ? 'В избранном' : 'Добавить в избранное'}
          onClick={toggleFavorite}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          style={{ marginLeft: 12, width: 26, height: 26, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <StarIcon filled={favorite} size={21} />
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {infoOpen && loadState === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'absolute', top: LAYOUT.infoTop, left: 60, right: 40, height: 26, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: COLORS.muted, zIndex: 1 }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>
              {TYPE_LABEL[gppType]} · период {periodText} · изделий {counts.products}, деталей {counts.parts}, материалов {counts.materials}
              {doc?.updatedAt ? ` · сохранён ${ruDateTime(doc.updatedAt)}${doc.updatedBy ? `, ${doc.updatedBy}` : ''}` : ''}
            </span>
            {!editable && chip(<><EyeIcon size={14} color={COLORS.muted} /> Только просмотр</>, 'muted')}
            {editable && dirty && chip(<><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FF9F6B' }} /> Есть несохранённые изменения</>, 'warn')}
            {violations > 0 && chip(<><WarningIcon size={14} color={COLORS.danger} /> Нарушено зависимостей: {violations}</>, 'danger')}
          </motion.div>
        )}
      </AnimatePresence>

      {loadState === 'ready' && (
        <>
          <GppToolbar
            editable={editable}
            search={search}
            onSearch={setSearch}
            sort={sort}
            onSort={setSort}
            kinds={kinds}
            onKinds={setKinds}
            anyExpanded={anyExpanded}
            onCollapseAll={() => setCollapsed(new Set(expandable))}
            onExpandAll={() => setCollapsed(new Set())}
            checkedCount={checked.size}
            onCopy={handleCopy}
            onDelete={() => askDelete([...checked])}
            periodFrom={monthIndex(periodFrom)}
            periodTo={monthIndex(periodTo)}
            planMonths={bounds ? { from: monthIndex(bounds.from), to: monthIndex(bounds.to) } : null}
            onPeriod={handlePeriod}
            autoCalc={autoCalc}
            onAutoCalc={handleAutoCalc}
            type={gppType}
            onType={handleType}
            onPrint={() => print(false)}
            onPdf={() => print(true)}
            settings={settings}
            onSettings={handleSettings}
          />

          <GppGrid
            rows={rows}
            visible={visible}
            timeline={timeline}
            scale={settings.scale}
            type={gppType}
            autoCalc={autoCalc}
            editable={editable}
            showLinks={settings.showLinks}
            showToday={settings.showToday}
            fallbackStart={periodFrom}
            checked={checked}
            hovered={hovered}
            editing={editing}
            canToggle={search.trim() === '' && kinds.size === 0}
            search={search}
            emptyText={rows.length === 0 ? 'В документе пока нет строк' : 'Ничего не найдено'}
            emptyAction={rows.length === 0 && editable ? <PillButton label="Добавить изделие" variant="primary" onClick={() => handleAdd('PRODUCT', null)} /> : undefined}
            onHover={setHovered}
            onToggleCheck={toggleCheck}
            onToggleAll={toggleAll}
            onToggleExpand={toggleExpand}
            onStartEdit={setEditing}
            onCommitEdit={handleCommitEdit}
            onCancelEdit={() => setEditing(null)}
            onContextMenu={(event, uid) => {
              if (!editable) return;
              setMenu({ x: event.clientX, y: event.clientY, uid });
            }}
            onBarEdit={handleBarEdit}
            onOpenStage={setStageUid}
            revealUid={reveal}
            onRevealed={onRevealed}
          />
        </>
      )}

      {loadState === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 15, color: COLORS.muted }}>
          <Spinner size={18} /> Загрузка документа…
        </div>
      )}

      {loadState === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 460, padding: '34px 40px', borderRadius: 20, backgroundColor: COLORS.white, boxShadow: '0 10px 40px rgba(226, 236, 249, 0.9)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: COLORS.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningIcon size={22} color={COLORS.danger} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Документ не загрузился</div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: '20px', color: COLORS.muted }}>{loadError}</div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
              <PillButton label="Повторить" variant="primary" icon={<RefreshIcon size={16} color={COLORS.white} />} onClick={reload} />
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', right: LAYOUT.left, bottom: LAYOUT.bottomButtonsBottom, display: 'flex', alignItems: 'center', gap: 30 }}>
        {loadState === 'ready' && <BottomButton label="Рассчитать план закупок" width={239} onClick={() => setPurchaseOpen(true)} />}
        {editable && (
          <BottomButton
            label={saving ? 'Сохранение…' : 'Записать'}
            width={154}
            icon={<img src={IconW} alt="" style={{ width: 20, height: 20 }} />}
            disabled={!dirty}
            busy={saving}
            title={dirty ? 'Записать изменения (Ctrl+S)' : 'Изменений нет'}
            onClick={() => void save()}
          />
        )}
        <BottomButton label="Закрыть" width={116} onClick={handleClose} />
      </div>

      <Notice notice={notice} />

      {menu && (
        <RowContextMenu
          menu={menu}
          onAdd={handleAdd}
          onDelete={uid => askDelete(checked.has(uid) ? [...checked] : [uid])}
          onClose={() => setMenu(null)}
        />
      )}

      <StagePopup
        row={stageRow}
        rows={rows}
        type={gppType}
        autoCalc={autoCalc}
        editable={editable}
        fallbackStart={periodFrom}
        onApply={handleStage}
        onClose={() => setStageUid(null)}
      />

      <PurchasePlanPopup open={purchaseOpen} rows={rows} periodText={periodText} onClose={() => setPurchaseOpen(false)} />

      <Dialog
        isOpen={deleteAsk !== null}
        onClose={() => setDeleteAsk(null)}
        title="Удалить строки?"
        text={deleteText}
        actions={[
          { label: 'Отмена', onClick: () => setDeleteAsk(null) },
          { label: 'Удалить', variant: 'danger', onClick: () => deleteAsk && handleDelete(deleteAsk) },
        ]}
      />

      <Dialog
        isOpen={closeAsk}
        onClose={() => setCloseAsk(false)}
        title="Сохранить изменения?"
        text="В документе есть несохранённые изменения."
        width={500}
        actions={[
          { label: 'Отмена', onClick: () => setCloseAsk(false) },
          {
            label: 'Не сохранять',
            onClick: () => {
              setCloseAsk(false);
              closeOwnTab();
            },
          },
          {
            label: 'Сохранить',
            variant: 'primary',
            busy: saving,
            onClick: async () => {
              const ok = await save();
              setCloseAsk(false);
              if (ok) closeOwnTab();
            },
          },
        ]}
      />

      <Dialog
        isOpen={conflict !== null}
        onClose={() => setConflict(null)}
        title="Документ изменил другой пользователь"
        text={
          <>
            {conflict}
            <br />
            При загрузке несохранённые правки будут потеряны.
          </>
        }
        width={520}
        actions={[
          { label: 'Отмена', onClick: () => setConflict(null) },
          { label: 'Загрузить заново', variant: 'primary', onClick: reload },
        ]}
      />
    </div>
  );
};

export default GppPage;
