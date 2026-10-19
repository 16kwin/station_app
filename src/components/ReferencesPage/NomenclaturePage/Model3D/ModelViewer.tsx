// ModelViewer.tsx — область просмотра 3D-модели (грузится лениво вместе с three.js): холст WebGL,
// виды «Изометрия / Спереди / Сверху / Сбоку», кнопки-кружки «По размеру», «Рёбра», вертикальная ось,
// подпись габаритов и числа треугольников. Вся работа с three.js — в viewer.ts.
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { modelErrorText } from './errors';
import { formatDimensions, formatTriangles } from './display';
import { EdgesIcon, FitIcon } from './icons';
import { COLORS, FONT, SHADOWS } from './theme';
import { RoundButton, StatusOverlay } from './ui';
import { ModelViewerEngine } from './viewer';
import type { LoadedModelInfo, ViewName } from './viewer';
import type { UpAxis, ViewSource } from './types';

interface ModelViewerProps {
  source: ViewSource | null;
  /** uid модели — под ним запоминается выбранная вертикальная ось; null — модель ещё не сохранена */
  axisKey: string | null;
  /** Вкладка приложения скрыта — не рисуем */
  paused: boolean;
  onError: (message: string) => void;
}

const VIEWS: { id: ViewName; label: string }[] = [
  { id: 'iso', label: 'Изометрия' },
  { id: 'front', label: 'Спереди' },
  { id: 'top', label: 'Сверху' },
  { id: 'side', label: 'Сбоку' },
];

const AXIS_STORAGE = 'awms.model3d.upAxis.';

const readStoredAxis = (key: string | null): UpAxis | null => {
  if (!key) return null;
  try {
    const value = localStorage.getItem(AXIS_STORAGE + key);
    return value === 'Y' || value === 'Z' ? value : null;
  } catch {
    return null;
  }
};

const storeAxis = (key: string | null, axis: UpAxis) => {
  if (!key) return;
  try {
    localStorage.setItem(AXIS_STORAGE + key, axis);
  } catch {
    // Хранилище недоступно (приватный режим) — ось просто не запомнится
  }
};

interface Loaded {
  buffer: ArrayBuffer;
  info: LoadedModelInfo;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ source, axisKey, paused, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ModelViewerEngine | null>(null);
  const axisKeyRef = useRef(axisKey);
  const onErrorRef = useRef(onError);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<ArrayBuffer | null>(null);
  const [axis, setAxis] = useState<{ buffer: ArrayBuffer; axis: UpAxis } | null>(null);
  const [view, setView] = useState<ViewName>('iso');
  const [edges, setEdges] = useState(false);
  const [edgesBusy, setEdgesBusy] = useState(false);

  useEffect(() => {
    axisKeyRef.current = axisKey;
    onErrorRef.current = onError;
  });

  // Движок живёт, пока открыта область просмотра
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let engine: ModelViewerEngine;
    try {
      engine = new ModelViewerEngine(container, () =>
        onErrorRef.current('Видеокарта прервала 3D-просмотр. Нажмите «Повторить» — просмотр запустится заново.'),
      );
    } catch (error) {
      console.error('WebGL:', error);
      onErrorRef.current('Браузер не поддерживает WebGL — 3D-просмотр на этом компьютере недоступен.');
      return;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.dispose();
    };
  }, []);

  // Новая модель → в движок
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!source) {
      engine.clear();
      return;
    }
    let alive = true;
    engine
      .load(source.buffer, source.fallbackMeta, readStoredAxis(axisKeyRef.current))
      .then(info => {
        if (!alive) return;
        setLoaded({ buffer: source.buffer, info });
        setView('iso');
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setFailed(source.buffer);
        onErrorRef.current(modelErrorText(error, 'Не удалось открыть модель.'));
      });
    return () => {
      alive = false;
    };
  }, [source]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  const current = loaded && source && loaded.buffer === source.buffer ? loaded.info : null;
  const parsing = source !== null && current === null && failed !== source.buffer;
  const upAxis: UpAxis = axis && source && axis.buffer === source.buffer ? axis.axis : (readStoredAxis(axisKey) ?? current?.meta.upAxis ?? 'Y');

  const chooseView = (next: ViewName) => {
    setView(next);
    engineRef.current?.setView(next);
  };

  const toggleEdges = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !edges;
    setEdges(next);
    setEdgesBusy(true);
    try {
      await engine.setEdges(next);
    } finally {
      setEdgesBusy(false);
    }
  };

  const toggleAxis = () => {
    if (!source) return;
    const next: UpAxis = upAxis === 'Y' ? 'Z' : 'Y';
    setAxis({ buffer: source.buffer, axis: next });
    storeAxis(axisKey, next);
    engineRef.current?.setUpAxis(next);
  };

  const hasModel = current !== null;

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, cursor: hasModel ? 'grab' : 'default' }} />

      <AnimatePresence>
        {hasModel && (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, pointerEvents: 'none' }}
          >
            <div
              role="group"
              aria-label="Вид"
              style={{ display: 'flex', padding: 4, gap: 2, borderRadius: 14, backgroundColor: COLORS.white, boxShadow: SHADOWS.button, pointerEvents: 'auto' }}
            >
              {VIEWS.map(item => {
                const active = item.id === view;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => chooseView(item.id)}
                    whileTap={{ scale: 0.96 }}
                    animate={{ backgroundColor: active ? COLORS.accentSoft : 'rgba(255, 255, 255, 0)', color: active ? COLORS.accent : COLORS.text }}
                    transition={{ duration: 0.18 }}
                    style={{ height: 38, padding: '0 14px', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>
              <RoundButton label="По размеру" onClick={() => engineRef.current?.fit()}>
                <FitIcon />
              </RoundButton>
              <RoundButton label={edges ? 'Скрыть рёбра' : 'Показать рёбра'} active={edges} busy={edgesBusy} onClick={() => void toggleEdges()}>
                <EdgesIcon color={edges ? COLORS.white : COLORS.text} />
              </RoundButton>
              <RoundButton
                label={upAxis === 'Y' ? 'Вверх смотрит ось Y. Сделать вертикальной Z' : 'Вверх смотрит ось Z. Сделать вертикальной Y'}
                onClick={toggleAxis}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>{upAxis}↑</span>
              </RoundButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {current && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, pointerEvents: 'none' }}>
          <div
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              pointerEvents: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.86)',
              boxShadow: SHADOWS.button,
              fontSize: 13,
              color: COLORS.text,
              lineHeight: '18px',
            }}
          >
            <span title="Габариты по осям X × Y × Z файла">
              <span style={{ color: COLORS.muted }}>Габариты: </span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatDimensions(current.size, current.meta.unit)}</span>
              {!current.meta.unit && <span style={{ color: COLORS.muted }}> (единицы файла)</span>}
            </span>
            <span style={{ color: COLORS.muted }}> · {formatTriangles(current.triangles)}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, textAlign: 'right', lineHeight: '16px' }}>
            ЛКМ — вращение · ПКМ или Shift — сдвиг · колесо — масштаб
          </div>
        </div>
      )}

      <AnimatePresence>{parsing && <StatusOverlay key="parsing" title="Открываем модель…" />}</AnimatePresence>
    </div>
  );
};

export default ModelViewer;
