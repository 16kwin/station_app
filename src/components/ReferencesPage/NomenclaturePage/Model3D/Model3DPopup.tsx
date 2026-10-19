// Model3DPopup.tsx — окно «3D-модель» карточки номенклатуры: слева просмотр (WebGL, грузится лениво),
// справа список моделей с кнопками «Загрузить», «Скачать исходник», «Удалить». Файл можно перетащить в окно.
// При загрузке браузер сам готовит облегчённую копию GLB (воркер), на сервер уходят исходник и копия.
// Загрузка и удаление — функция model3d.upload (нужны и загрузки файлов, uploads): без неё окно только для
// просмотра и скачивания исходника — кнопок, поля выбора файла и приёма перетаскивания нет.
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useFeature } from '../../../../services/features/featureStore';
import { apiErrorText, deleteModel, downloadModelSource, fetchModels, fetchModelView, uploadModel } from './api';
import { convertModel, isAbortError } from './convert';
import { formatBytes, formatDate, formatTrianglesShort, stageText } from './display';
import type { JobStage } from './display';
import { ModelError } from './errors';
import { CAD_EXPORT_HINTS, checkModelFile, defaultMeta, FILE_ACCEPT, FORMAT_LABELS, SUPPORTED_FORMATS } from './formats';
import { AlertIcon, CloseIcon, CubeIcon, DownloadIcon, TrashIcon, UploadIcon } from './icons';
import Model3DLoadBoundary from './LoadBoundary';
import { COLORS, FONT, POPUP, SHADOWS } from './theme';
import { ActionButton, Model3DKeyframes, ProgressBar, Spinner, StatusOverlay } from './ui';
import { dropCachedView, getCachedView, putCachedView } from './viewCache';
import type { ModelFormat, NomenclatureModel, ViewSource } from './types';

const ModelViewer = lazy(() => import('./ModelViewer'));

interface Model3DPopupProps {
  materialUid: string;
  /** Наименование номенклатуры — подзаголовок окна */
  title: string;
  onClose: () => void;
  /** Число моделей для счётчика на кнопке «3D» */
  onCountChange: (count: number) => void;
}

interface UploadJob {
  name: string;
  format: ModelFormat;
  stage: JobStage;
  ratio: number | null;
}

const subscribeResize = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
const viewportWidth = () => window.innerWidth;
const viewportHeight = () => window.innerHeight;

const HEADER_HEIGHT = 76;

// ==================== Части окна ====================

interface ModelCardProps {
  model: NomenclatureModel;
  selected: boolean;
  onSelect: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, selected, onSelect }) => (
  <motion.button
    type="button"
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0, borderColor: selected ? COLORS.accent : COLORS.accentLine, backgroundColor: selected ? COLORS.accentSoft : COLORS.white }}
    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    whileHover={selected ? undefined : { y: -1, boxShadow: SHADOWS.buttonHover }}
    transition={{ duration: 0.2 }}
    onClick={onSelect}
    aria-pressed={selected}
    style={{
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      border: '1px solid',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: FONT,
      outline: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      flexShrink: 0,
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, width: '100%' }}>
      <span
        style={{
          padding: '2px 7px',
          borderRadius: 6,
          backgroundColor: selected ? COLORS.white : COLORS.accentSoft,
          color: COLORS.accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.03em',
          flexShrink: 0,
        }}
      >
        {FORMAT_LABELS[model.format] ?? model.format.toUpperCase()}
      </span>
      <span
        title={model.originalName}
        style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
      >
        {model.originalName}
      </span>
    </span>
    <span style={{ fontSize: 12, color: COLORS.muted, lineHeight: '16px' }}>
      {formatBytes(model.fileSize)}
      {model.triangles !== null && model.triangles > 0 ? ` · ${formatTrianglesShort(model.triangles)}` : ''}
    </span>
    <span style={{ fontSize: 12, color: COLORS.muted, lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {formatDate(model.createdAt)}
      {model.author ? ` · ${model.author}` : ''}
    </span>
  </motion.button>
);

const JobCard: React.FC<{ job: UploadJob; onCancel: () => void }> = ({ job, onCancel }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      padding: '12px 14px',
      borderRadius: 12,
      border: `1px dashed ${COLORS.accentDash}`,
      backgroundColor: COLORS.white,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flexShrink: 0,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Spinner size={14} />
      <span title={job.name} style={{ flex: 1, fontSize: 14, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {job.name}
      </span>
      <button
        type="button"
        aria-label="Отменить загрузку"
        title="Отменить загрузку"
        onClick={onCancel}
        style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, padding: 0 }}
      >
        <CloseIcon size={11} color={COLORS.muted} />
      </button>
    </div>
    <ProgressBar ratio={job.ratio} />
    <span style={{ fontSize: 12, color: COLORS.muted }}>{stageText(job.stage, job.ratio)}</span>
  </motion.div>
);

/** Пустое окно без загрузки (нет функции model3d.upload): моделей нет, добавить их здесь нельзя */
const EmptyViewOnly: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25 }}
    style={{ position: 'absolute', inset: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: FONT }}
  >
    <CubeIcon />
    <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>3D-моделей у этой номенклатуры нет</span>
  </motion.div>
);

/** Пустое окно: зона перетаскивания, форматы и как выгрузить модель из САПР */
const EmptyState: React.FC<{ onPick: () => void }> = ({ onPick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25 }}
    style={{ position: 'absolute', inset: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: FONT }}
  >
    <button
      type="button"
      onClick={onPick}
      style={{
        width: '100%',
        maxWidth: 560,
        padding: '26px 24px 22px',
        borderRadius: 16,
        border: `2px dashed ${COLORS.accentDash}`,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT,
        outline: 'none',
      }}
    >
      <CubeIcon />
      <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>Перетащите файл или нажмите «Загрузить»</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
        {SUPPORTED_FORMATS.map(label => (
          <span
            key={label}
            style={{ padding: '3px 9px', borderRadius: 8, backgroundColor: COLORS.white, border: `1px solid ${COLORS.accentLine}`, fontSize: 12, fontWeight: 600, color: COLORS.text }}
          >
            {label}
          </span>
        ))}
      </span>
      <span style={{ fontSize: 12, color: COLORS.muted }}>До 300 МБ. Браузер сам подготовит облегчённую копию для быстрого просмотра.</span>
    </button>
    <div style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Как выгрузить модель из САПР</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {CAD_EXPORT_HINTS.map(hint => (
          <div key={hint.cad} style={{ padding: '9px 12px', borderRadius: 12, backgroundColor: COLORS.white, boxShadow: SHADOWS.button }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{hint.cad}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: '16px' }}>{hint.how}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8, lineHeight: '16px' }}>
        Файлы КОМПАС (*.a3d, *.m3d), T-FLEX (*.grb) и DWG браузер не читает — сохраните их в одном из форматов выше.
      </div>
    </div>
  </motion.div>
);

const ErrorOverlay: React.FC<{ message: string; actionLabel?: string; onAction?: () => void }> = ({ message, actionLabel, onAction }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 40,
      backgroundColor: 'rgba(251, 252, 255, 0.9)',
      fontFamily: FONT,
      textAlign: 'center',
      zIndex: 4,
    }}
  >
    <AlertIcon size={34} />
    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, maxWidth: 460, lineHeight: '21px' }}>{message}</div>
    {actionLabel && onAction && <ActionButton label={actionLabel} onClick={onAction} height={40} />}
  </motion.div>
);

// ==================== Окно ====================

const Model3DPopup: React.FC<Model3DPopupProps> = ({ materialUid, title, onClose, onCountChange }) => {
  const vw = useSyncExternalStore(subscribeResize, viewportWidth);
  const vh = useSyncExternalStore(subscribeResize, viewportHeight);
  const width = Math.max(720, Math.min(POPUP.width, vw - POPUP.margin * 2));
  const height = Math.max(480, Math.min(POPUP.height, vh - POPUP.margin * 2));
  /** Загрузка и удаление моделей (model3d.upload вместе с uploads) */
  const canUpload = useFeature('model3d.upload');

  const [models, setModels] = useState<NomenclatureModel[]>([]);
  const [listState, setListState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [source, setSource] = useState<ViewSource | null>(null);
  const [axisKey, setAxisKey] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState<{ stage: JobStage; ratio: number | null } | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [job, setJob] = useState<UploadJob | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NomenclatureModel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  /** Меняется на «Повторить» — область просмотра создаётся заново (после сбоя видеокарты старый контекст WebGL мёртв) */
  const [viewerKey, setViewerKey] = useState(0);

  const aborters = useRef<{ view: AbortController | null; job: AbortController | null }>({ view: null, job: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const dragDepth = useRef(0);
  /** Что сейчас в просмотре — чтобы после отправки выделить новую модель, только если на экране всё ещё она */
  const shown = useRef<ViewSource | null>(null);

  const selected = models.find(model => model.uid === selectedUid) ?? null;

  const showSource = useCallback((next: ViewSource | null) => {
    shown.current = next;
    setSource(next);
  }, []);

  /** Открыть модель в просмотре: из памяти, иначе копию GLB с сервера; без копии — подготовить из исходника */
  const openModel = useCallback(async (model: NomenclatureModel) => {
    aborters.current.view?.abort();
    const controller = new AbortController();
    aborters.current.view = controller;
    setSelectedUid(model.uid);
    setViewError(null);
    const fallbackMeta = defaultMeta(model.format);
    const cached = getCachedView(model.uid);
    if (cached) {
      setViewLoading(null);
      setAxisKey(model.uid);
      // Та же модель уже на экране — сцену не пересобираем
      if (shown.current?.buffer !== cached) showSource({ buffer: cached, fallbackMeta });
      return;
    }
    setViewLoading({ stage: 'download', ratio: null });
    try {
      const buffer = await fetchModelView(model.uid, ratio => setViewLoading({ stage: 'download', ratio }), controller.signal);
      let glb = buffer;
      if (!model.hasView && model.format !== 'glb' && model.format !== 'gltf') {
        const result = await convertModel(
          { name: model.originalName, format: model.format, buffer },
          (stage, ratio) => setViewLoading({ stage, ratio }),
          controller.signal,
        );
        if (!result.glb) throw new ModelError('Не удалось подготовить модель к просмотру.');
        glb = result.glb;
      }
      if (controller.signal.aborted) return;
      putCachedView(model.uid, glb);
      setAxisKey(model.uid);
      showSource({ buffer: glb, fallbackMeta });
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      setViewError(error instanceof ModelError ? error.message : await apiErrorText(error, 'Не удалось загрузить модель с сервера.'));
    } finally {
      if (aborters.current.view === controller) {
        aborters.current.view = null;
        setViewLoading(null);
      }
    }
  }, [showSource]);

  const loadList = useCallback(
    (signal?: AbortSignal) => {
      fetchModels(materialUid, signal)
        .then(list => {
          setModels(list);
          setListState('ready');
          if (list[0]) void openModel(list[0]);
        })
        .catch(async (error: unknown) => {
          if (isAbortError(error)) return;
          setNotice(await apiErrorText(error, 'Не удалось получить список 3D-моделей.'));
          setListState('error');
        });
    },
    [materialUid, openModel],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadList(controller.signal);
    return () => controller.abort();
  }, [loadList]);

  // Закрытие окна прерывает загрузки
  useEffect(() => {
    const current = aborters.current;
    return () => {
      current.view?.abort();
      current.job?.abort();
    };
  }, []);

  useEffect(() => {
    if (listState === 'ready') onCountChange(models.length);
  }, [listState, models.length, onCountChange]);

  // Вкладка приложения скрыта (display: none) — окно прячем вместе с ней, состояние сохраняется
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      setTabHidden(!rect || (rect.width === 0 && rect.height === 0));
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const busy = job !== null;

  const requestClose = useCallback(() => {
    aborters.current.job?.abort();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (tabHidden) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmDelete) {
        if (!deleting) setConfirmDelete(null);
        return;
      }
      // Во время загрузки окно закрывается только крестиком — чтобы не прервать её случайно
      if (!busy) requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabHidden, confirmDelete, deleting, busy, requestClose]);

  /** Загрузка одного файла: проверка → подготовка копии → показ → отправка. false — пользователь отменил */
  const uploadOne = async (file: File): Promise<boolean> => {
    const check = checkModelFile(file);
    if (!check.ok) {
      setNotice(`«${file.name}»: ${check.message}`);
      return true;
    }
    const controller = new AbortController();
    aborters.current.job = controller;
    setNotice(null);
    setJob({ name: file.name, format: check.format, stage: 'read', ratio: null });
    const update = (stage: JobStage, ratio: number | null) => setJob(prev => (prev ? { ...prev, stage, ratio } : prev));
    try {
      const buffer = await file.arrayBuffer();
      const result = await convertModel({ name: file.name, format: check.format, buffer }, update, controller.signal);
      // Модель видна сразу, пока она отправляется на сервер; файл уже передан воркеру — для GLB читаем ещё раз
      const preview = result.glb ?? (await file.arrayBuffer());
      aborters.current.view?.abort();
      setSelectedUid(null);
      setViewError(null);
      setViewLoading(null);
      setAxisKey(null);
      const previewSource: ViewSource = { buffer: preview, fallbackMeta: result.meta };
      showSource(previewSource);
      update('upload', 0);
      const saved = await uploadModel(
        materialUid,
        { file, view: result.glb, triangles: result.stats.triangles || null },
        ratio => update('upload', ratio),
        controller.signal,
      );
      putCachedView(saved.uid, preview);
      setModels(list => [...list, saved]);
      if (shown.current === previewSource) {
        setSelectedUid(saved.uid);
        setAxisKey(saved.uid);
      }
      return true;
    } catch (error) {
      if (isAbortError(error)) return false;
      setNotice(
        error instanceof ModelError
          ? `«${file.name}»: ${error.message}`
          : `Модель «${file.name}» не сохранена: ${await apiErrorText(error, 'ошибка сервера.')}`,
      );
      return true;
    } finally {
      if (aborters.current.job === controller) aborters.current.job = null;
      setJob(null);
    }
  };

  const startUpload = async (files: File[]) => {
    if (files.length === 0 || !canUpload) return;
    if (busy) {
      setNotice('Дождитесь окончания текущей загрузки.');
      return;
    }
    for (const file of files) {
      if (!(await uploadOne(file))) break;
    }
  };

  const confirmDeletion = async () => {
    const model = confirmDelete;
    if (!model || !canUpload) return;
    setDeleting(true);
    try {
      await deleteModel(model.uid);
      dropCachedView(model.uid);
      const rest = models.filter(item => item.uid !== model.uid);
      setModels(rest);
      setConfirmDelete(null);
      if (selectedUid === model.uid) {
        if (rest[0]) {
          void openModel(rest[0]);
        } else {
          aborters.current.view?.abort();
          setSelectedUid(null);
          showSource(null);
          setAxisKey(null);
          setViewError(null);
          setViewLoading(null);
        }
      }
    } catch (error) {
      setConfirmDelete(null);
      setNotice(await apiErrorText(error, 'Не удалось удалить модель.'));
    } finally {
      setDeleting(false);
    }
  };

  const download = async (model: NomenclatureModel) => {
    setDownloading(true);
    try {
      await downloadModelSource(model);
    } catch (error) {
      setNotice(await apiErrorText(error, 'Не удалось скачать исходный файл.'));
    } finally {
      setDownloading(false);
    }
  };

  // Без загрузки перетаскивание не принимается: файл, брошенный в окно, гасит обработчик подложки
  const hasFiles = (event: React.DragEvent) => canUpload && Array.from(event.dataTransfer.types).includes('Files');

  const onDragEnter = (event: React.DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragOver = (event: React.DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (canUpload) void startUpload(Array.from(event.dataTransfer.files));
  };

  const showEmpty = listState === 'ready' && models.length === 0 && !source && !job && !viewLoading;
  const showJobOverlay = job !== null && !source;

  const viewer = (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${COLORS.accentLine}`,
        background: `linear-gradient(180deg, ${COLORS.viewerTop} 0%, ${COLORS.viewerBottom} 100%)`,
      }}
    >
      {source && (
        // Просмотрщик с three.js не загрузился — сообщение в области просмотра, список и кнопки окна работают
        <Model3DLoadBoundary variant="inline">
          <Suspense fallback={<StatusOverlay title="Загрузка просмотрщика…" />}>
            <ModelViewer key={viewerKey} source={source} axisKey={axisKey} paused={tabHidden} onError={setViewError} />
          </Suspense>
        </Model3DLoadBoundary>
      )}
      <AnimatePresence>
        {showEmpty && (canUpload ? <EmptyState key="empty" onPick={() => fileInputRef.current?.click()} /> : <EmptyViewOnly key="empty-view" />)}
        {listState === 'loading' && <StatusOverlay key="list" title="Загружаем список моделей…" />}
        {viewLoading && (
          <StatusOverlay key="view" title={stageText(viewLoading.stage, viewLoading.ratio)} ratio={viewLoading.ratio} showProgress />
        )}
        {showJobOverlay && job && (
          <StatusOverlay key="job" title={stageText(job.stage, job.ratio)} subtitle={job.name} ratio={job.ratio} showProgress />
        )}
        {viewError && !viewLoading && (
          <ErrorOverlay
            key="error"
            message={viewError}
            actionLabel={selected ? 'Повторить' : undefined}
            onAction={
              selected
                ? () => {
                    // Повтор — с загрузкой заново: копия в памяти могла оказаться неполной
                    dropCachedView(selected.uid);
                    setViewerKey(key => key + 1);
                    void openModel(selected);
                  }
                : undefined
            }
          />
        )}
        {listState === 'error' && !viewError && (
          <ErrorOverlay
            key="list-error"
            message="Не удалось получить список 3D-моделей."
            actionLabel="Повторить"
            onAction={() => {
              setListState('loading');
              setNotice(null);
              loadList();
            }}
          />
        )}
        {dragOver && (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: 12,
              border: `2px dashed ${COLORS.accent}`,
              backgroundColor: 'rgba(102, 110, 254, 0.08)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              pointerEvents: 'none',
              zIndex: 6,
            }}
          >
            <CubeIcon size={48} />
            <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>
              {busy ? 'Дождитесь окончания текущей загрузки' : 'Отпустите файл, чтобы загрузить модель'}
            </span>
          </motion.div>
        )}
        {notice && (
          <motion.div
            key="notice"
            role="alert"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              backgroundColor: COLORS.white,
              borderLeft: `4px solid ${COLORS.danger}`,
              boxShadow: SHADOWS.card,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              zIndex: 7,
            }}
          >
            <AlertIcon size={18} />
            <span style={{ flex: 1, fontSize: 13, color: COLORS.text, lineHeight: '18px' }}>{notice}</span>
            <button
              type="button"
              aria-label="Закрыть сообщение"
              onClick={() => setNotice(null)}
              style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CloseIcon size={11} color={COLORS.muted} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const side = (
    <div style={{ width: POPUP.sideWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Модели</span>
        {models.length > 0 && (
          <span style={{ minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11, backgroundColor: COLORS.accentSoft, color: COLORS.accent, fontSize: 12, fontWeight: 700, lineHeight: '22px', textAlign: 'center', boxSizing: 'border-box' }}>
            {models.length}
          </span>
        )}
      </div>
      {canUpload && (
        <ActionButton
          label="Загрузить"
          variant="primary"
          icon={<UploadIcon />}
          fullWidth
          disabled={busy || listState !== 'ready'}
          title={busy ? 'Дождитесь окончания текущей загрузки' : 'Выбрать файл модели на компьютере'}
          onClick={() => fileInputRef.current?.click()}
        />
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 4px 4px 2px', margin: '0 -4px 0 -2px', scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {job && <JobCard key="job" job={job} onCancel={() => aborters.current.job?.abort()} />}
          {models.map(model => (
            <ModelCard key={model.uid} model={model} selected={model.uid === selectedUid} onSelect={() => void openModel(model)} />
          ))}
        </AnimatePresence>
        {listState === 'ready' && models.length === 0 && !job && (
          <div style={{ padding: '18px 8px', textAlign: 'center', fontSize: 13, color: COLORS.muted, lineHeight: '18px' }}>
            {canUpload ? 'Моделей пока нет. Загрузите файл из САПР — его можно просто перетащить в окно.' : 'Моделей пока нет.'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionButton
          label="Скачать исходник"
          icon={<DownloadIcon />}
          fullWidth
          disabled={!selected}
          busy={downloading}
          title={selected ? `Скачать «${selected.originalName}»` : 'Выберите модель в списке'}
          onClick={() => selected && void download(selected)}
        />
        {canUpload && (
          <ActionButton
            label="Удалить"
            variant="danger"
            icon={<TrashIcon />}
            fullWidth
            disabled={!selected || busy}
            title={selected ? 'Удалить модель с сервера' : 'Выберите модель в списке'}
            onClick={() => selected && setConfirmDelete(selected)}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <span ref={sentinelRef} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, display: 'block', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      {createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={event => {
            event.stopPropagation();
            if (!busy && !confirmDelete) requestClose();
          }}
          onDragOver={event => event.preventDefault()}
          onDrop={event => event.preventDefault()}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: COLORS.overlay,
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: tabHidden ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Model3DKeyframes />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="3D-модель"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={event => event.stopPropagation()}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              position: 'relative',
              width,
              height,
              backgroundColor: COLORS.white,
              borderRadius: 20,
              boxShadow: SHADOWS.modal,
              fontFamily: FONT,
              color: COLORS.text,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: HEADER_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px 0 28px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: '22px' }}>3D-модель</div>
                <div title={title} style={{ fontSize: 13, color: COLORS.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {title || 'Номенклатура'}
                </div>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                title={busy ? 'Закрыть и прервать загрузку' : 'Закрыть'}
                onClick={requestClose}
                style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, flexShrink: 0 }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: '0 28px 28px' }}>
              {viewer}
              {side}
            </div>

            {canUpload && (
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                style={{ display: 'none' }}
                onChange={event => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = '';
                  void startUpload(files);
                }}
              />
            )}

            <AnimatePresence>
              {confirmDelete && canUpload && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => !deleting && setConfirmDelete(null)}
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.18)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
                >
                  <motion.div
                    role="alertdialog"
                    aria-label="Удаление 3D-модели"
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={event => event.stopPropagation()}
                    style={{ width: 420, padding: 30, borderRadius: 20, backgroundColor: COLORS.white, boxShadow: SHADOWS.modal, display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>Удалить 3D-модель?</div>
                    <div style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: '20px', wordBreak: 'break-word' }}>
                      «{confirmDelete.originalName}» и её копия для просмотра будут удалены с сервера. Отменить удаление нельзя.
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
                      <motion.button
                        type="button"
                        onClick={() => void confirmDeletion()}
                        disabled={deleting}
                        whileHover={deleting ? undefined : { y: -1 }}
                        whileTap={deleting ? undefined : { scale: 0.97 }}
                        style={{
                          height: 44,
                          padding: '0 24px',
                          border: 'none',
                          borderRadius: 10,
                          backgroundColor: COLORS.danger,
                          color: COLORS.white,
                          fontFamily: FONT,
                          fontSize: 15,
                          fontWeight: 500,
                          cursor: deleting ? 'progress' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 4px 14px rgba(255, 48, 82, 0.25)',
                        }}
                      >
                        {deleting && <Spinner color={COLORS.white} />}
                        Удалить
                      </motion.button>
                      <ActionButton label="Отмена" disabled={deleting} onClick={() => setConfirmDelete(null)} />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>,
        document.body,
      )}
    </>
  );
};

export default Model3DPopup;
