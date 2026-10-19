// usePlanEditor.ts — план выбранного цеха и правка расстановки: загрузка плана и картинки, черновик позиций,
// сохранение пакетом с версией (409 — план изменил другой пользователь), загрузка и удаление картинки.
// Черновик начинается с полной расстановки цеха с сервера, поэтому станции, скрытые фильтрами страницы,
// при сохранении не теряют своих мест. Черновик помнит версию плана, с которой начата правка, и сохраняется
// именно с ней: чужое сохранение за время правки не затирается молча — сервер отвечает 409.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlanPoint, StationPlan } from './types';
import { deletePlanImage, errorStatus, errorText, fetchAllStations, fetchPlan, fetchPlanImage, savePositions, uploadPlanImage } from './api';

export interface SaveResult {
  ok: boolean;
  /** 409: план изменил другой пользователь. Актуальный план уже загружен, черновик оставлен как был */
  conflict?: {
    /** Версия актуального плана — с ней можно записать свою расстановку поверх чужой */
    version: number;
    /** Картинку плана загрузили или удалили: черновик относится к другой основе и к актуальному плану не подходит */
    basisChanged: boolean;
  };
  /** Станции, чьи места не сохранены: за время правки их перевели в другой цех или удалили */
  dropped?: string[];
  message?: string;
}

export interface PlanEditor {
  plan: StationPlan | null;
  loading: boolean;
  error: string | null;
  /** blob-ссылка картинки плана; null — картинки нет или она ещё грузится */
  imageSrc: string | null;
  imageLoading: boolean;
  imageError: string | null;
  /** Позиции для показа: черновик в режиме правки, иначе сохранённые */
  positions: ReadonlyMap<string, PlanPoint>;
  editing: boolean;
  /** Цех, для которого открыт черновик (null — правки нет) */
  draftFor: number | null;
  /** В черновике есть несохранённые изменения */
  dirty: boolean;
  saving: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  setPosition: (uid: string, point: PlanPoint | null) => void;
  /** Убрать все позиции из черновика — на схеме станции вернутся к авто-раскладке */
  clearPositions: () => void;
  /** overVersion — после 409: записать свою расстановку поверх версии, которую сохранил другой пользователь */
  save: (overVersion?: number) => Promise<SaveResult>;
  /** startEditing — сразу открыть правку, чтобы разместить станции на новом плане */
  upload: (file: File, onProgress?: (share: number) => void, startEditing?: boolean) => Promise<StationPlan>;
  removeImage: () => Promise<StationPlan>;
  reload: () => void;
}

interface EditState {
  forId: number;
  /** Версия плана, с которой начата правка: с ней черновик и уходит на сервер */
  baseVersion: number;
  /** Расстановка на начало правки — по ней видно, есть ли несохранённые изменения */
  base: ReadonlyMap<string, PlanPoint>;
  /** Позиции относятся к картинке плана (true) или к автоматической схеме */
  onImage: boolean;
  draft: Map<string, PlanPoint>;
}

const EMPTY = new Map<string, PlanPoint>();

const toMap = (plan: StationPlan | null): Map<string, PlanPoint> =>
  new Map((plan?.positions ?? []).map(p => [p.stationUid, { x: p.x, y: p.y }] as const));

const samePositions = (a: ReadonlyMap<string, PlanPoint>, b: ReadonlyMap<string, PlanPoint>): boolean => {
  if (a.size !== b.size) return false;
  for (const [uid, p] of a) {
    const q = b.get(uid);
    if (!q || Math.abs(q.x - p.x) > 1e-6 || Math.abs(q.y - p.y) > 1e-6) return false;
  }
  return true;
};

/** Правка с расстановки и версии плана */
const editFrom = (plan: StationPlan): EditState => {
  const base = toMap(plan);
  return { forId: plan.workshopId, baseVersion: plan.version, base, onImage: plan.image !== null, draft: new Map(base) };
};

/**
 * План перечитан во время правки («Повторить», возврат к цеху): черновик без изменений переходит на новую
 * версию, а черновик с изменениями остаётся на своей — при сохранении сервер ответит 409 и пользователь
 * выберет, чью расстановку оставить
 */
const followPlan = (edit: EditState | null, next: StationPlan): EditState | null =>
  edit && edit.forId === next.workshopId && edit.baseVersion !== next.version && samePositions(edit.draft, edit.base) ? editFrom(next) : edit;

/**
 * Позиции станций, которые сейчас числятся в цехе. Станцию могли перевести в другой цех или удалить, пока шла
 * правка: её место не сохраняется, а название попадает в dropped. Сервер такие позиции тоже пропускает
 * (skippedStationUids) — здесь их отсеиваем заранее ради названий в сообщении; names — названия всех станций.
 * Список станций не загрузился — пакет уходит как есть, его проверит сервер
 */
const keepWorkshopStations = async (
  workshopId: number,
  draft: ReadonlyMap<string, PlanPoint>,
): Promise<{ positions: ReadonlyMap<string, PlanPoint>; dropped: string[]; names: ReadonlyMap<string, string> }> => {
  if (draft.size === 0) return { positions: draft, dropped: [], names: new Map() };
  const stations = await fetchAllStations().catch(() => null);
  if (!stations) return { positions: draft, dropped: [], names: new Map() };
  const byUid = new Map(stations.map(s => [s.uid, s] as const));
  const positions = new Map<string, PlanPoint>();
  const dropped: string[] = [];
  for (const [uid, point] of draft) {
    const station = byUid.get(uid);
    if (station && station.workshopId === workshopId) positions.set(uid, point);
    else dropped.push(station?.name || uid);
  }
  return { positions, dropped, names: new Map(stations.map(s => [s.uid, s.name] as const)) };
};

export const usePlanEditor = (workshopId: number | null, enabled: boolean): PlanEditor => {
  // План привязан к цеху: пока не пришёл план нового цеха, старый не показывается
  const [loaded, setLoaded] = useState<{ forId: number; plan: StationPlan | null; error: string | null } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [image, setImage] = useState<{ key: string; src: string | null; error: string | null } | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const imageSrcRef = useRef<string | null>(null);
  // Текущий цех для ответов, пришедших после его смены: план прежнего цеха не должен занять место нового
  const workshopRef = useRef(workshopId);
  useEffect(() => {
    workshopRef.current = workshopId;
  }, [workshopId]);

  // План цеха
  useEffect(() => {
    if (!enabled || workshopId === null) return;
    let cancelled = false;
    fetchPlan(workshopId)
      .then(plan => {
        if (cancelled) return;
        setLoaded({ forId: workshopId, plan, error: null });
        setEdit(prev => followPlan(prev, plan));
      })
      .catch(error => {
        if (!cancelled) setLoaded({ forId: workshopId, plan: null, error: errorText(error, 'Не удалось загрузить план цеха') });
      });
    return () => {
      cancelled = true;
    };
  }, [workshopId, enabled, reloadToken]);

  const current = loaded && loaded.forId === workshopId ? loaded : null;
  const plan = current?.plan ?? null;
  const imageUrl = plan?.image?.url ?? null;

  // Картинка плана: blob по защищённой ссылке; уже загруженная под этим адресом не грузится повторно
  const haveImageFor = image?.key ?? null;
  useEffect(() => {
    if (!imageUrl || haveImageFor === imageUrl) return;
    let cancelled = false;
    fetchPlanImage(imageUrl)
      .then(src => {
        if (cancelled) {
          URL.revokeObjectURL(src);
          return;
        }
        if (imageSrcRef.current) URL.revokeObjectURL(imageSrcRef.current);
        imageSrcRef.current = src;
        setImage({ key: imageUrl, src, error: null });
      })
      .catch(error => {
        if (!cancelled) setImage({ key: imageUrl, src: null, error: errorText(error, 'Не удалось загрузить картинку плана') });
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, haveImageFor]);

  // Освободить картинку при уходе со страницы
  useEffect(
    () => () => {
      if (imageSrcRef.current) URL.revokeObjectURL(imageSrcRef.current);
      imageSrcRef.current = null;
    },
    [],
  );

  const serverPositions = useMemo(() => (plan ? toMap(plan) : EMPTY), [plan]);
  const editing = edit !== null && edit.forId === workshopId && plan !== null;
  const positions: ReadonlyMap<string, PlanPoint> = editing ? edit.draft : serverPositions;
  // Изменения считаются от начала правки: черновик, скрытый сменой цеха, тоже защищён от молчаливой потери
  const dirty = edit !== null && !samePositions(edit.draft, edit.base);

  /**
   * Новый план с сервера; ответ по цеху, с которого уже ушли, не применяется (false). sameImageAs — адрес
   * показанной картинки, если она не менялась (сохранили только расстановку): её blob переиспользуется
   */
  const applyPlan = useCallback((next: StationPlan, sameImageAs: string | null): boolean => {
    if (workshopRef.current !== next.workshopId) return false;
    setLoaded({ forId: next.workshopId, plan: next, error: null });
    if (sameImageAs && next.image) {
      const nextUrl = next.image.url;
      setImage(prev => (prev && prev.src && prev.key === sameImageAs ? { ...prev, key: nextUrl } : prev));
    }
    return true;
  }, []);

  const startEdit = useCallback(() => {
    if (plan) setEdit(editFrom(plan));
  }, [plan]);

  const cancelEdit = useCallback(() => setEdit(null), []);

  const setPosition = useCallback((uid: string, point: PlanPoint | null) => {
    setEdit(prev => {
      if (!prev) return prev;
      const draft = new Map(prev.draft);
      if (point) draft.set(uid, { x: Math.min(1, Math.max(0, point.x)), y: Math.min(1, Math.max(0, point.y)) });
      else draft.delete(uid);
      return { ...prev, draft };
    });
  }, []);

  const clearPositions = useCallback(() => {
    setEdit(prev => (prev ? { ...prev, draft: new Map() } : prev));
  }, []);

  const reload = useCallback(() => {
    // Картинка с ошибкой загрузится заново
    setImage(prev => (prev && prev.error ? null : prev));
    setReloadToken(t => t + 1);
  }, []);

  const save = useCallback(
    async (overVersion?: number): Promise<SaveResult> => {
      if (!editing || !edit || workshopId === null) return { ok: false };
      const target = workshopId;
      const sent = edit.draft;
      const shownImage = plan?.image?.url ?? null;
      setSaving(true);
      try {
        const { positions: kept, dropped, names } = await keepWorkshopStations(target, sent);
        const next = await savePositions(target, overVersion ?? edit.baseVersion, kept);
        applyPlan(next, shownImage);
        // Пока шло сохранение, станцию могли сдвинуть ещё раз: такая правка продолжается от сохранённой версии
        setEdit(prev => {
          if (!prev || prev.forId !== target) return prev;
          return prev.draft === sent ? null : { ...editFrom(next), draft: prev.draft };
        });
        // Станцию могли перевести уже после проверки выше — тогда о пропуске сообщает сервер
        const skipped = (next.skippedStationUids ?? []).map(uid => names.get(uid) || uid).filter(name => !dropped.includes(name));
        return { ok: true, dropped: [...dropped, ...skipped] };
      } catch (error) {
        if (errorStatus(error) !== 409) return { ok: false, message: errorText(error, 'Не удалось сохранить расстановку') };
        // Черновик не трогается: рядом загружается актуальный план, а чью расстановку оставить — решает пользователь
        const latest = await fetchPlan(target).catch(() => null);
        if (!latest) return { ok: false, message: 'Карту цеха изменил другой пользователь, а загрузить актуальный план не удалось. Повторите сохранение.' };
        applyPlan(latest, null);
        return { ok: false, conflict: { version: latest.version, basisChanged: (latest.image !== null) !== edit.onImage } };
      } finally {
        setSaving(false);
      }
    },
    [editing, edit, plan, workshopId, applyPlan],
  );

  const upload = useCallback(
    async (file: File, onProgress?: (share: number) => void, startEditing = false): Promise<StationPlan> => {
      if (workshopId === null) throw new Error('Цех не выбран');
      const next = await uploadPlanImage(workshopId, file, onProgress);
      if (applyPlan(next, null)) setEdit(startEditing ? editFrom(next) : null);
      return next;
    },
    [workshopId, applyPlan],
  );

  const removeImage = useCallback(async (): Promise<StationPlan> => {
    if (workshopId === null) throw new Error('Цех не выбран');
    const next = await deletePlanImage(workshopId);
    if (applyPlan(next, null)) setEdit(null);
    return next;
  }, [workshopId, applyPlan]);

  const imageReady = image && imageUrl && image.key === imageUrl ? image : null;

  return {
    plan,
    loading: enabled && workshopId !== null && current === null,
    error: current?.error ?? null,
    imageSrc: imageReady?.src ?? null,
    imageLoading: !!imageUrl && !imageReady,
    imageError: imageReady?.error ?? null,
    positions,
    editing,
    draftFor: edit?.forId ?? null,
    dirty,
    saving,
    startEdit,
    cancelEdit,
    setPosition,
    clearPositions,
    save,
    upload,
    removeImage,
    reload,
  };
};
