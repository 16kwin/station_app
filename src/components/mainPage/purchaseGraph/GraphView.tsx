// GraphView.tsx — граф закупок на SVG. React строит разметку (узлы, связи, цены, градиенты)
// при смене данных, фильтров и настроек; движок graphEngine двигает её по тикам физики,
// ведёт камеру, перетаскивание и подсветку. Режимы: full — страница, compact — мини-карточка.
import React, { memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import { FIXED_GRADIENT_LENGTH, FIXED_GRADIENT_SOLID, GraphEngine } from './graphEngine';
import { CubeGlyph, FitIcon, MinusIcon, PlusIcon, ShopGlyph } from './icons';
import { arrowLength, describeHover, iconScale, labelLayout, nodeRadius } from './model';
import { DEFAULT_FORCES } from './settings';
import type {
  GraphDisplay,
  GraphEdge,
  GraphForces,
  GraphInsets,
  GraphMode,
  GraphModel,
  GraphNode,
  HoverTarget,
  TooltipContent,
  TooltipTone,
} from './types';

const ZERO_INSETS: GraphInsets = { left: 0, right: 0, top: 0, bottom: 0 };

/**
 * Стили, которые не задать инлайном: подсветка по data-атрибутам (движок ставит их без React),
 * курсоры перетаскивания и печать. Подписи гаснут через CSS-переменные на слое камеры.
 */
const GRAPH_CSS = `
.pgv-svg [data-dim] { transition: opacity 150ms ease; }
.pgv-svg .pgv-label { transition: opacity 150ms ease; }
.pgv-vp[data-hl-on] [data-dim]:not([data-hl]) { opacity: 0.12; }
.pgv-vp[data-hl-on] [data-hl] .pgv-label { opacity: 1 !important; }
.pgv-svg .pgv-node { cursor: grab; }
.pgv-svg[data-dragging], .pgv-svg[data-dragging] .pgv-node { cursor: grabbing; }
.pgv-svg[data-panning] { cursor: grabbing; }
.pgv-zoom button:hover { background-color: #F4F6FB !important; }
@media print {
  .pgv-vp { --pg-node-label: 1 !important; --pg-edge-label: 1 !important; }
  .pgv-svg [data-dim] { opacity: 1 !important; }
  .pgv-tooltip, .pgv-zoom { display: none !important; }
}
`;

/** Затухание подписей: прозрачность из CSS-переменных, которые движок ставит на слой камеры */
const NODE_LABEL_FADE: React.CSSProperties = { opacity: 'var(--pg-node-label, 1)' };
const PRICE_FADE: React.CSSProperties = { opacity: 'var(--pg-edge-label, 1)' };

/** Наконечник: острие в (0, 0), смотрит вдоль +x; движок ставит его у края номенклатуры */
const arrowPath = (lineWidth: number): string => {
  const len = arrowLength(lineWidth);
  const half = len * 0.45;
  return `M0 0L${-len} ${-half}L${-len * 0.78} 0L${-len} ${half}Z`;
};

interface MarkupProps {
  model: GraphModel;
  display: GraphDisplay;
  gid: string;
  compact: boolean;
}

const NodeShape: React.FC<{ node: GraphNode; display: GraphDisplay; compact: boolean }> = ({ node, display, compact }) => {
  const radius = nodeRadius(node, display.nodeSize);
  const layout = labelLayout(node, radius);
  return (
    <g data-node-id={node.id} data-dim="" className="pgv-node">
      <circle r={radius} fill={node.color} />
      <g transform={`scale(${iconScale(radius)}) translate(-9 -9)`} pointerEvents="none">
        {node.kind === 'nom' ? <CubeGlyph /> : <ShopGlyph />}
      </g>
      <g className="pgv-label" style={compact ? undefined : NODE_LABEL_FADE} pointerEvents="none">
        {node.nameLines.map((line, i) => (
          <text
            key={`name-${i}`}
            y={layout.name[i]}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={13}
            fontWeight={node.kind === 'nom' ? 600 : 500}
            fill={COLORS.text}
            stroke={COLORS.white}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {line}
          </text>
        ))}
        {node.subLines.map((line, i) => (
          <text
            key={`sub-${i}`}
            y={layout.sub[i]}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={11.5}
            fontWeight={500}
            fill={COLORS.textMuted}
            stroke={COLORS.white}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {line}
          </text>
        ))}
      </g>
    </g>
  );
};

const EdgeShape: React.FC<{ edge: GraphEdge; index: number; display: GraphDisplay; gid: string }> = ({ edge, index, display, gid }) => {
  const affiliated = edge.kind === 'affiliated';
  const gradient = !affiliated && edge.sourceColor !== edge.targetColor;
  const width = (affiliated ? 1.5 : 2) * display.lineWidth;
  const stroke = gradient ? `url(#${gid}-g${index})` : affiliated ? COLORS.rose : edge.sourceColor;
  return (
    <g data-edge-id={edge.id} data-dim="" className="pgv-edge">
      <line className="pgv-hit" stroke="transparent" strokeWidth={Math.max(12, width + 8)} pointerEvents="stroke" />
      <line
        className="pgv-line"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap={affiliated ? 'butt' : 'round'}
        strokeDasharray={affiliated ? '6 4' : undefined}
        pointerEvents="none"
      />
      {!affiliated && display.arrows && (
        <path className="pgv-arrow" d={arrowPath(display.lineWidth)} fill={edge.targetColor} pointerEvents="none" />
      )}
    </g>
  );
};

/** Разметка графа без позиций: координаты ставит движок сразу после коммита */
const GraphMarkup = memo(function GraphMarkup({ model, display, gid, compact }: MarkupProps) {
  const solidStop = display.gradient === 'fixed' ? FIXED_GRADIENT_SOLID / FIXED_GRADIENT_LENGTH : 0.1;
  return (
    <>
      <defs>
        {model.edges.map((edge, i) =>
          edge.kind === 'purchase' && edge.sourceColor !== edge.targetColor ? (
            <linearGradient key={edge.id} id={`${gid}-g${i}`} data-grad-for={edge.id} gradientUnits="userSpaceOnUse">
              <stop offset={0} stopColor={edge.sourceColor} />
              <stop offset={solidStop} stopColor={edge.sourceColor} />
              <stop offset={1} stopColor={edge.targetColor} />
            </linearGradient>
          ) : null,
        )}
      </defs>
      <g className="pgv-edges">
        {model.edges.map((edge, i) => (
          <EdgeShape key={edge.id} edge={edge} index={i} display={display} gid={gid} />
        ))}
      </g>
      {display.prices && (
        <g className="pgv-prices" pointerEvents="none">
          {model.edges.map(edge =>
            edge.kind === 'purchase' ? (
              <g key={edge.id} data-label-for={edge.id} data-dim="">
                <text
                  className="pgv-label"
                  dy={-5}
                  textAnchor="middle"
                  fontFamily={FONT}
                  fontSize={13}
                  fontWeight={600}
                  fill={COLORS.text}
                  stroke={COLORS.white}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={compact ? undefined : PRICE_FADE}
                >
                  {edge.priceLabel}
                </text>
              </g>
            ) : null,
          )}
        </g>
      )}
      <g className="pgv-nodes">
        {model.nodes.map(node => (
          <NodeShape key={node.id} node={node} display={display} compact={compact} />
        ))}
      </g>
    </>
  );
});

const TONE_COLORS: Record<TooltipTone, string> = {
  danger: COLORS.roseDark,
  success: '#0E9F34',
  muted: COLORS.textMuted,
};

/** Цвет текста плашки: для светлых цветов категорий — темнее, чтобы читалось */
const badgeTextColor = (color: string): string =>
  color === COLORS.anchorGreen ? '#0E9F34' : color === COLORS.rose ? COLORS.roseDark : color;

const TooltipCard: React.FC<{ content: TooltipContent }> = ({ content }) => (
  <div
    style={{
      minWidth: 220,
      maxWidth: 300,
      padding: '12px 14px',
      boxSizing: 'border-box',
      backgroundColor: COLORS.white,
      borderRadius: 12,
      border: '1px solid #E5ECF5',
      boxShadow: SHADOWS.tooltip,
      fontFamily: FONT,
      color: COLORS.text,
      userSelect: 'none',
    }}
  >
    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '18px' }}>{content.title}</div>
    {content.subtitle && (
      <div style={{ marginTop: 2, fontSize: 12, fontWeight: 500, lineHeight: '16px', color: COLORS.textMuted }}>{content.subtitle}</div>
    )}
    {content.badge && (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          padding: '3px 8px',
          borderRadius: 8,
          backgroundColor: `${content.badge.color}1F`,
          color: badgeTextColor(content.badge.color),
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '16px',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: content.badge.color, flexShrink: 0 }} />
        {content.badge.text}
      </div>
    )}
    {content.rows.length > 0 && (
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 16, rowGap: 5 }}>
        {content.rows.map(row => (
          <React.Fragment key={row.label}>
            <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: '17px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{row.label}</span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                lineHeight: '17px',
                textAlign: 'right',
                color: row.tone ? TONE_COLORS[row.tone] : COLORS.text,
              }}
            >
              {row.value}
            </span>
          </React.Fragment>
        ))}
      </div>
    )}
    {content.list && content.list.length > 0 && (
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #EEF1F6' }}>
        {content.listTitle && (
          <div style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: COLORS.textMuted, marginBottom: 4 }}>{content.listTitle}</div>
        )}
        {content.list.map((item, index) => (
          // Названия позиций могут совпасть — ключ с номером строки
          <div key={`${index}-${item.text}`} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12.5, lineHeight: '18px' }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
            <span style={{ fontWeight: 600, color: item.tone ? TONE_COLORS[item.tone] : COLORS.text, whiteSpace: 'nowrap' }}>{item.value}</span>
          </div>
        ))}
        {content.more && <div style={{ marginTop: 2, fontSize: 12, lineHeight: '16px', color: COLORS.textMuted }}>{content.more}</div>}
      </div>
    )}
  </div>
);

const zoomButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  padding: 0,
  backgroundColor: COLORS.white,
  boxShadow: SHADOWS.button,
  color: COLORS.text,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  transition: 'background-color 0.15s ease',
};

export interface GraphViewProps {
  model: GraphModel;
  mode: GraphMode;
  display: GraphDisplay;
  forces: GraphForces;
  /** Смена значения — «разлёт» из центра (как «Запустить анимацию») */
  explodeKey?: number;
  /** Смена значения — камера плавно вписывает граф (фокус, выбор в фильтрах, период) */
  fitKey?: string;
  /** Области, закрытые панелями поверх графа */
  insets?: GraphInsets;
  /** Мини-карточка: узел, который держится слева сверху (поставщики веером) */
  hubId?: string | null;
  onNodeClick?: (node: GraphNode) => void;
  /** Отступ кнопок масштаба от правого и нижнего края (полная страница) */
  controlsOffset?: { right: number; bottom: number };
}

const GraphView: React.FC<GraphViewProps> = ({
  model,
  mode,
  display,
  forces,
  explodeKey = 0,
  fitKey = '',
  insets = ZERO_INSETS,
  hubId = null,
  onNodeClick,
  controlsOffset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);
  const modelRef = useRef(model);
  const onNodeClickRef = useRef(onNodeClick);
  const fitKeyRef = useRef(fitKey);
  const explodeKeyRef = useRef(explodeKey);
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const gid = `pgv${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const compact = mode === 'compact';
  const { left: insetLeft, right: insetRight, top: insetTop, bottom: insetBottom } = insets;

  // Движок живёт, пока смонтирован граф; режим у экземпляра не меняется
  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const viewport = viewportRef.current;
    if (!container || !svg || !viewport) return;
    const engine = new GraphEngine({ mode, container, svg, viewport, getTooltip: () => tooltipRef.current, forces: DEFAULT_FORCES });
    engine.setCallbacks({
      onHover: setHover,
      onNodeClick: id => {
        const node = modelRef.current.nodes.find(item => item.id === id);
        if (node) onNodeClickRef.current?.(node);
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Ползунки «Силы»: пересобрать силы и разогреть
  useLayoutEffect(() => {
    engineRef.current?.setForces(forces);
  }, [forces]);

  useLayoutEffect(() => {
    engineRef.current?.setInsets({ left: insetLeft, right: insetRight, top: insetTop, bottom: insetBottom });
  }, [insetLeft, insetRight, insetTop, insetBottom]);

  // Новая разметка → связать элементы и поставить их на места до отрисовки кадра
  useLayoutEffect(() => {
    modelRef.current = model;
    engineRef.current?.sync(model, display, hubId);
  }, [model, display, hubId]);

  // Фокус, выбор или период сменились — камера едет к новой раскладке
  useEffect(() => {
    if (fitKeyRef.current === fitKey) return;
    fitKeyRef.current = fitKey;
    engineRef.current?.focusFit();
  }, [fitKey]);

  useEffect(() => {
    if (explodeKeyRef.current === explodeKey) return;
    explodeKeyRef.current = explodeKey;
    engineRef.current?.explode();
  }, [explodeKey]);

  // Подсказка встаёт у курсора в том же кадре, в котором появилась
  useLayoutEffect(() => {
    if (hover) engineRef.current?.positionTooltip();
  }, [hover]);

  const tooltip = hover ? describeHover(model, hover) : null;
  const zoomIn = () => engineRef.current?.zoomBy(1.3);
  const zoomOut = () => engineRef.current?.zoomBy(1 / 1.3);
  const fitAll = () => engineRef.current?.fit();

  return (
    <div
      ref={containerRef}
      className="pgv-root"
      style={{ position: 'relative', width: '100%', height: '100%', fontFamily: FONT, userSelect: 'none' }}
    >
      <style>{GRAPH_CSS}</style>
      <svg
        ref={svgRef}
        className="pgv-svg"
        width="100%"
        height="100%"
        role="img"
        aria-label="Граф закупок"
        style={{ display: 'block', touchAction: 'none', overflow: 'hidden', userSelect: 'none' }}
      >
        <g ref={viewportRef} className="pgv-vp">
          <GraphMarkup model={model} display={display} gid={gid} compact={compact} />
        </g>
      </svg>

      <div
        ref={tooltipRef}
        className="pgv-tooltip"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 30,
          pointerEvents: 'none',
          visibility: tooltip ? 'visible' : 'hidden',
          transition: 'opacity 120ms ease',
        }}
      >
        {tooltip && <TooltipCard content={tooltip} />}
      </div>

      {mode === 'full' && (
        <div
          className="pgv-zoom"
          style={{
            position: 'absolute',
            right: controlsOffset?.right ?? 24,
            bottom: controlsOffset?.bottom ?? 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 5,
          }}
        >
          <button type="button" aria-label="Приблизить" title="Приблизить" onClick={zoomIn} style={zoomButtonStyle}>
            <PlusIcon />
          </button>
          <button type="button" aria-label="Отдалить" title="Отдалить" onClick={zoomOut} style={zoomButtonStyle}>
            <MinusIcon />
          </button>
          <button type="button" aria-label="По размеру" title="По размеру (двойной клик по фону)" onClick={fitAll} style={zoomButtonStyle}>
            <FitIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default GraphView;
