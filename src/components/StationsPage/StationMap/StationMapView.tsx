// StationMapView.tsx — режим «Карта» панели станций: слева «Структура станций», справа «Карты станций»
// с переключателем «Мнемоническая карта | Интерактивная карта». Данные — станции и иерархия, которые уже
// загрузила страница (с её фильтрами); план цеха и расстановка — с сервера карты станций. Схема цеха строится
// по полному составу цеха без фильтров: фильтры только скрывают станции, а зоны участков остаются на местах.
// Странице отдаётся confirmLeave(): перед уходом из режима карты спросить про несохранённую расстановку.
// Функции установки (раздел 4.2 проекта «Дискретное отключение функций»): без map.plan — только мнемосхема,
// без переключателя и запросов плана цеха; без map.edit — без загрузки плана и правки расстановки (картинке
// плана ещё нужна функция uploads). Сохранённый выбор «Интерактивная карта» не стирается: вернётся с функцией.
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { MapHierarchy, MapKind, MapStation, MapStationDynamic, StationActions } from './types';
import type { EnterpriseNode, SectionNode, WorkshopNode } from './model';
import { buildStructure, enterpriseOf, firstWorkshop } from './model';
import { COLORS, FONT, MAP_AREA, SHADOWS } from './theme';
import { usePlanEditor } from './usePlanEditor';
import { fetchAllStations } from './api';
import { useConfirm } from './useConfirm';
import StationTree from './StationTree';
import type { TreeSelection } from './StationTree';
import InteractiveMap from './InteractiveMap';
import type { MapViewHandle } from './InteractiveMap';
import MnemoMap from './MnemoMap';
import UploadPlanDialog from './UploadPlanDialog';
import { CircleButton, ConfirmDialog, Notice, PillButton } from './ui';
import type { NoticeMessage } from './ui';
import { CheckIcon, EditIcon, FitIcon, MinusIcon, PlusIcon, ResetIcon, UploadPlanIcon } from './icons';
import { useIsManager } from '../../../services/roles';
import { useFeature } from '../../../services/features/featureStore';

export interface StationMapHandle {
  /** Можно ли уйти из режима карты: при несохранённой расстановке — подтверждение в стиле приложения */
  confirmLeave: () => Promise<boolean>;
}

interface StationMapViewProps {
  stations: readonly MapStation[];
  dynamics: ReadonlyMap<string, MapStationDynamic>;
  hierarchy: MapHierarchy | null;
  loading: boolean;
  error: string | null;
  actions: StationActions;
  handleRef?: React.Ref<StationMapHandle>;
}

const STORAGE_KEY = 'stationsMapState';
const NOTICE_MS = 5000;

interface SavedState {
  kind: MapKind;
  workshopId: number | null;
}

const loadState = (): SavedState => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const { kind, workshopId } = parsed as Partial<SavedState>;
      return {
        kind: kind === 'mnemo' ? 'mnemo' : 'interactive',
        workshopId: typeof workshopId === 'number' ? workshopId : null,
      };
    }
  } catch {
    // хранилище недоступно или испорчено — начинаем с интерактивной карты
  }
  return { kind: 'interactive', workshopId: null };
};

const LEAVE_REQUEST = {
  title: 'Несохранённые изменения',
  text: 'Расстановка станций на карте не сохранена. Выйти без сохранения?',
  confirmLabel: 'Выйти без сохранения',
  cancelLabel: 'Остаться',
  danger: true,
} as const;

/** Сообщение после сохранения; dropped — станции, которые за время правки ушли из цеха, их места не сохранены */
const savedText = (dropped: readonly string[]): string => {
  if (dropped.length === 0) return 'Расстановка станций сохранена';
  const names = dropped.slice(0, 3).map(name => `«${name}»`).join(', ') + (dropped.length > 3 ? ` и ещё ${dropped.length - 3}` : '');
  return dropped.length === 1
    ? `Расстановка сохранена. Станция ${names} больше не числится в этом цехе — её место не сохранено`
    : `Расстановка сохранена. Станции ${names} больше не числятся в этом цехе — их места не сохранены`;
};

/** Переключатель «Мнемоническая карта | Интерактивная карта» с плавающей акцентной подложкой */
const KindSwitch: React.FC<{ value: MapKind; onChange: (kind: MapKind) => void }> = ({ value, onChange }) => (
  <LayoutGroup id="sm-kind">
    <div role="tablist" aria-label="Вид карты" style={{ display: 'flex', padding: 4, borderRadius: 22, backgroundColor: COLORS.pill }}>
      {(
        [
          ['mnemo', 'Мнемоническая карта'],
          ['interactive', 'Интерактивная карта'],
        ] as const
      ).map(([kind, label]) => {
        const active = value === kind;
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(kind)}
            style={{
              position: 'relative',
              width: 172,
              height: 36,
              border: 'none',
              borderRadius: 18,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 500,
              color: active ? COLORS.white : COLORS.muted,
              transition: 'color 0.2s ease',
              outline: 'none',
            }}
          >
            {active && (
              <motion.span
                layoutId="sm-kind-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 18, backgroundColor: COLORS.accent, boxShadow: SHADOWS.active }}
              />
            )}
            <span style={{ position: 'relative' }}>{label}</span>
          </button>
        );
      })}
    </div>
  </LayoutGroup>
);

const StationMapView: React.FC<StationMapViewProps> = ({ stations, dynamics, hierarchy, loading, error, actions, handleRef }) => {
  const isManager = useIsManager();
  const planOn = useFeature('map.plan');
  // Правка расстановки и загрузка плана — руководителю и только при включённых функциях
  const canEdit = useFeature('map.edit') && isManager;
  const canUploadPlan = useFeature('uploads') && canEdit;
  const [saved] = useState(loadState);
  const [selectedKind, setKind] = useState<MapKind>(saved.kind);
  /** Показанный вид карты: интерактивная — только при функции плана цеха */
  const kind: MapKind = planOn ? selectedKind : 'mnemo';
  const [workshopId, setWorkshopId] = useState<number | null>(saved.workshopId);
  /** Предприятие, выбранное в дереве для мнемосхемы */
  const [enterpriseKey, setEnterpriseKey] = useState<string | null>(null);
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [stationUid, setStationUid] = useState<string | null>(null);
  const [stationFocus, setStationFocus] = useState<{ uid: string; nonce: number } | null>(null);
  const [sectionFocus, setSectionFocus] = useState<{ key: string; nonce: number } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const nonceRef = useRef(0);
  const mapRef = useRef<MapViewHandle | null>(null);
  const { confirm, choose, dialog } = useConfirm();

  const structure = useMemo(() => buildStructure(hierarchy, stations), [hierarchy, stations]);

  // Полный состав цехов без фильтров страницы — по нему строится схема цеха. null — ещё грузится.
  // Станции страницы свежее (их обновляет WebSocket), поэтому заменяют записи полного списка
  const [allStations, setAllStations] = useState<readonly MapStation[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchAllStations()
      .then(list => {
        if (!cancelled) setAllStations(list);
      })
      .catch(() => {
        // не загрузился — схема строится по станциям страницы
        if (!cancelled) setAllStations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const fullStructure = useMemo(() => {
    if (!allStations) return null;
    const merged = new Map(allStations.map(s => [s.uid, s] as const));
    for (const station of stations) merged.set(station.uid, station);
    return buildStructure(hierarchy, [...merged.values()]);
  }, [hierarchy, allStations, stations]);

  // Цех открытой правки остаётся на карте, даже если фильтры страницы его скрыли: черновик не прячется молча
  const [draftWorkshopId, setDraftWorkshopId] = useState<number | null>(null);
  const draftWorkshop =
    draftWorkshopId !== null ? structure.workshops.get(draftWorkshopId) ?? fullStructure?.workshops.get(draftWorkshopId) : undefined;
  // Сохранённый цех мог пропасть из-за фильтров страницы — тогда первый цех дерева
  const workshop: WorkshopNode | null =
    draftWorkshop ?? (workshopId !== null ? structure.workshops.get(workshopId) : undefined) ?? firstWorkshop(structure);
  const hiddenByFilters = !!draftWorkshop && !structure.workshops.has(draftWorkshop.id);
  const enterprise: EnterpriseNode | null =
    (enterpriseKey ? structure.enterprises.find(e => e.key === enterpriseKey) : undefined) ?? enterpriseOf(structure, workshop?.id ?? null);

  const editor = usePlanEditor(workshop?.id ?? null, kind === 'interactive');
  const { dirty, editing, cancelEdit, draftFor, saving } = editor;
  // Цех черновика запоминается при начале и конце правки (обновление состояния во время отрисовки)
  if (draftFor !== draftWorkshopId) setDraftWorkshopId(draftFor);
  // Участки для схемы — по полному составу цеха; пока он грузится — null
  const layoutSections = workshop && fullStructure ? fullStructure.workshops.get(workshop.id)?.sections ?? workshop.sections : null;

  // Продолжение после вопроса о конфликте — свежей версией save: за время вопроса план уже обновился
  const saveRef = useRef(editor.save);
  useEffect(() => {
    saveRef.current = editor.save;
  }, [editor.save]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind: selectedKind, workshopId: workshop?.id ?? workshopId }));
    } catch {
      // хранилище недоступно — выбор просто не запомнится
    }
  }, [selectedKind, workshop, workshopId]);

  // Закрытие или перезагрузка вкладки браузера с несохранённой расстановкой
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const say = useCallback((text: string, tone: NoticeMessage['tone'] = 'info') => {
    nonceRef.current += 1;
    setNotice({ id: nonceRef.current, text, tone });
  }, []);

  /** Действие, уводящее с правки: при несохранённой расстановке — спросить; во время сохранения — подождать */
  const leaveEditing = useCallback(async (): Promise<boolean> => {
    // Ответ сохранения относится к этому цеху и этой правке — уходить можно после него
    if (saving) {
      say('Идёт сохранение расстановки — дождитесь его окончания');
      return false;
    }
    if (draftFor === null) return true;
    if (dirty && !(await confirm(LEAVE_REQUEST))) return false;
    cancelEdit();
    return true;
  }, [saving, draftFor, dirty, confirm, cancelEdit, say]);

  useImperativeHandle(handleRef, () => ({ confirmLeave: leaveEditing }), [leaveEditing]);

  const nextNonce = (): number => {
    nonceRef.current += 1;
    return nonceRef.current;
  };

  /* ---------- Выбор в дереве и на мнемосхеме ---------- */

  const selectWorkshop = async (target: WorkshopNode) => {
    if (target.id === workshop?.id) {
      setEnterpriseKey(null);
      setSectionKey(null);
      setStationUid(null);
      if (kind === 'interactive') mapRef.current?.fit();
      return;
    }
    if (!(await leaveEditing())) return;
    setWorkshopId(target.id);
    setEnterpriseKey(null);
    setSectionKey(null);
    setStationUid(null);
    setStationFocus(null);
    setSectionFocus(null);
  };

  const selectSection = async (target: WorkshopNode, section: SectionNode) => {
    if (target.id !== workshop?.id && !(await leaveEditing())) return;
    setWorkshopId(target.id);
    setEnterpriseKey(null);
    setStationUid(null);
    setStationFocus(null);
    setSectionKey(section.key);
    setSectionFocus({ key: section.key, nonce: nextNonce() });
  };

  const selectStation = async (target: WorkshopNode, station: MapStation) => {
    if (target.id !== workshop?.id && !(await leaveEditing())) return;
    setWorkshopId(target.id);
    setEnterpriseKey(null);
    setSectionKey(null);
    setSectionFocus(null);
    setStationUid(station.uid);
    setStationFocus({ uid: station.uid, nonce: nextNonce() });
    // На загруженном плане станция может быть ещё не размещена
    if (kind === 'interactive' && target.id === workshop?.id && editor.plan?.image && !editor.positions.has(station.uid)) {
      say(`Станция «${station.name}» ещё не размещена на плане цеха`);
    }
  };

  const selectEnterprise = (target: EnterpriseNode) => {
    if (kind === 'mnemo') setEnterpriseKey(target.key);
  };

  const openWorkshopMap = (target: WorkshopNode) => {
    // Без плана цеха заголовок цеха на мнемосхеме только выбирает цех
    if (planOn) setKind('interactive');
    setWorkshopId(target.id);
    setEnterpriseKey(null);
    setSectionKey(null);
    setStationUid(null);
    setStationFocus(null);
    setSectionFocus(null);
  };

  const changeKind = async (next: MapKind) => {
    if (next === kind) return;
    if (!(await leaveEditing())) return;
    setKind(next);
  };

  /* ---------- Правка ---------- */

  /** Начать правку; черновик другого цеха (его скрыли фильтры) не пропадает без вопроса */
  const startEdit = async () => {
    if (!(await leaveEditing())) return;
    editor.startEdit();
  };

  const openUpload = async () => {
    if (await leaveEditing()) setUploadOpen(true);
  };

  const save = async (overVersion?: number) => {
    const result = await saveRef.current(overVersion);
    if (result.ok) {
      const dropped = result.dropped ?? [];
      say(savedText(dropped), dropped.length > 0 ? 'info' : 'success');
      return;
    }
    const conflict = result.conflict;
    if (!conflict) {
      if (result.message) say(result.message, 'error');
      return;
    }
    // 409: актуальный план уже загружен, черновик цел — выбор за пользователем
    if (conflict.basisChanged) {
      cancelEdit();
      say('Пока вы правили, другой пользователь загрузил или удалил картинку плана — ваша расстановка к ней не подходит. Показан актуальный план.', 'error');
      return;
    }
    const answer = await choose({
      title: 'План изменил другой пользователь',
      text: `Пока вы правили расстановку, карту цеха «${workshop?.name ?? ''}» сохранил другой пользователь. Можно записать вашу расстановку поверх его изменений или отказаться от своей правки и загрузить актуальную.`,
      confirmLabel: 'Сохранить мою',
      altLabel: 'Загрузить актуальную',
      cancelLabel: 'Продолжить правку',
      danger: true,
    });
    if (answer === 'confirm') {
      await save(conflict.version);
    } else if (answer === 'alt') {
      cancelEdit();
      say('Загружена актуальная расстановка станций');
    }
  };

  const cancel = async () => {
    if (dirty && !(await confirm({ title: 'Отменить изменения?', text: 'Станции вернутся на сохранённые места.', confirmLabel: 'Отменить изменения', cancelLabel: 'Продолжить правку', danger: true }))) return;
    cancelEdit();
  };

  const upload = async (file: File, onProgress: (share: number) => void) => {
    const plan = await editor.upload(file, onProgress, true);
    say(plan.positions.length > 0 ? 'План цеха заменён — проверьте расстановку и сохраните' : 'План загружен — перетащите станции из лотка на план и сохраните', 'success');
  };

  const deletePlan = async () => {
    const ok = await confirm({
      title: 'Удалить план цеха?',
      text: 'Карта вернётся к автоматической схеме цеха, расстановка станций на плане будет сброшена.',
      confirmLabel: 'Удалить план',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!ok) return;
    try {
      await editor.removeImage();
      say('План удалён — показана автоматическая схема цеха', 'success');
    } catch (e) {
      const data = (e as { response?: { data?: { error?: unknown } } })?.response?.data;
      say(typeof data?.error === 'string' ? data.error : 'Не удалось удалить план', 'error');
    }
  };

  /* ---------- Разметка ---------- */

  const selection: TreeSelection = {
    enterpriseKey: kind === 'mnemo' ? enterprise?.key ?? null : null,
    workshopId: kind === 'mnemo' && enterpriseKey ? null : workshop?.id ?? null,
    sectionKey,
    stationUid,
  };

  const hasImage = !!editor.plan?.image;
  const interactive = kind === 'interactive';
  const title = interactive ? workshop?.name ?? 'Цех не выбран' : enterprise?.name ?? 'Предприятие';
  const subtitle = interactive ? workshop?.enterpriseName ?? '' : 'Мнемосхема предприятия';
  const shownNotice: NoticeMessage | null =
    notice ??
    (interactive && editor.error ? { id: -1, text: `${editor.error} — показана автоматическая схема`, tone: 'error' } : null) ??
    (interactive && hiddenByFilters ? { id: -2, text: 'Цех скрыт фильтрами страницы — он остаётся открытым до конца правки', tone: 'info' } : null);
  const initialLoading = loading && stations.length === 0;

  return (
    <div style={{ display: 'flex', gap: MAP_AREA.gap, width: '100%', height: '100%', fontFamily: FONT }}>
      <div style={{ width: MAP_AREA.treeWidth, flexShrink: 0, height: '100%' }}>
        <StationTree
          structure={structure}
          selection={selection}
          loading={initialLoading}
          onSelectEnterprise={selectEnterprise}
          onSelectWorkshop={w => void selectWorkshop(w)}
          onSelectSection={(w, s) => void selectSection(w, s)}
          onSelectStation={(w, s) => void selectStation(w, s)}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.white,
          borderRadius: 20,
          boxShadow: SHADOWS.card,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, height: 76, padding: '0 20px', flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.faint }}>Карты станций</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={title}>
                {title}
              </span>
              {interactive && editing ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: COLORS.accentSoft, color: COLORS.accent }}>Режим правки</span>
                  <AnimatePresence>
                    {dirty && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COLORS.warn }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLORS.warn }} />
                        не сохранено
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              ) : (
                subtitle && (
                  <span style={{ fontSize: 12, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }} title={subtitle}>
                    {subtitle}
                  </span>
                )
              )}
            </div>
          </div>

          {planOn ? <KindSwitch value={kind} onChange={next => void changeKind(next)} /> : <span />}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minWidth: 0 }}>
            {interactive && workshop && editing && (
              <>
                {!hasImage && (
                  <CircleButton title="Вернуть все станции на авто-места схемы" onClick={editor.clearPositions} size={40}>
                    <ResetIcon size={18} />
                  </CircleButton>
                )}
                <PillButton label="Отмена" onClick={() => void cancel()} disabled={editor.saving} />
                <PillButton label="Сохранить" variant="primary" icon={<CheckIcon size={16} color={COLORS.white} />} onClick={() => void save()} disabled={!dirty} busy={editor.saving} />
              </>
            )}
            {interactive && workshop && canEdit && !editing && (
              <>
                {canUploadPlan && (
                  <CircleButton title={hasImage ? 'Заменить или удалить план цеха' : 'Загрузить план цеха'} onClick={() => void openUpload()} disabled={editor.loading} size={40}>
                    <UploadPlanIcon size={19} />
                  </CircleButton>
                )}
                <CircleButton title="Редактировать расстановку станций" onClick={() => void startEdit()} disabled={editor.loading || !editor.plan} size={40}>
                  <EditIcon size={18} />
                </CircleButton>
              </>
            )}
            {interactive && workshop && (
              <>
                <span style={{ width: 1, height: 26, backgroundColor: COLORS.line, margin: '0 2px' }} />
                <CircleButton title="Уменьшить" onClick={() => mapRef.current?.zoomBy(1 / 1.4)} size={38}>
                  <MinusIcon size={18} />
                </CircleButton>
                <CircleButton title="Увеличить" onClick={() => mapRef.current?.zoomBy(1.4)} size={38}>
                  <PlusIcon size={18} />
                </CircleButton>
                <CircleButton title="По размеру" onClick={() => mapRef.current?.fit()} size={38}>
                  <FitIcon size={18} />
                </CircleButton>
              </>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0, padding: '0 16px 16px' }}>
          {initialLoading ? (
            <div style={{ height: '100%', borderRadius: 14, backgroundColor: COLORS.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: COLORS.muted }}>
              Загрузка станций…
            </div>
          ) : error && stations.length === 0 ? (
            <div style={{ height: '100%', borderRadius: 14, backgroundColor: COLORS.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: COLORS.error }}>
              {error}
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={interactive ? `i:${workshop?.id ?? 'none'}` : 'mnemo'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ width: '100%', height: '100%' }}
              >
                {interactive ? (
                  workshop ? (
                    <InteractiveMap
                      workshop={workshop}
                      layoutSections={layoutSections}
                      dynamics={dynamics}
                      editor={editor}
                      isManager={canEdit}
                      highlightKey={sectionKey}
                      sectionFocus={sectionFocus}
                      stationFocus={stationFocus}
                      actions={actions}
                      handleRef={mapRef}
                      onStartEdit={() => void startEdit()}
                    />
                  ) : (
                    <div style={{ height: '100%', borderRadius: 14, backgroundColor: COLORS.canvas, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: COLORS.muted }}>
                      <span style={{ color: COLORS.text, fontWeight: 500 }}>Нет цехов со станциями</span>
                      <span style={{ fontSize: 13 }}>Проверьте фильтры страницы или размещение станций в справочнике</span>
                    </div>
                  )
                ) : (
                  <MnemoMap
                    enterprise={enterprise}
                    selectedWorkshopId={workshop?.id ?? null}
                    highlightKey={sectionKey}
                    sectionFocus={sectionFocus}
                    stationFocus={stationFocus}
                    dynamics={dynamics}
                    actions={actions}
                    onOpenWorkshop={openWorkshopMap}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
          <div style={{ position: 'absolute', left: 16, right: 16, top: 0, height: 0 }}>
            <Notice notice={shownNotice} />
          </div>
        </div>
      </div>

      <ConfirmDialog {...dialog} />
      {workshop && canUploadPlan && (
        <UploadPlanDialog
          isOpen={uploadOpen}
          workshopName={workshop.name}
          current={editor.plan?.image ?? null}
          hasSchemePositions={!hasImage && (editor.plan?.positions.length ?? 0) > 0}
          onClose={() => setUploadOpen(false)}
          onUpload={upload}
          onDelete={() => {
            setUploadOpen(false);
            void deletePlan();
          }}
        />
      )}
    </div>
  );
};

export default StationMapView;
