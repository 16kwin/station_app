// GraphLegend.tsx — легенда графа закупок (слева снизу, как в 13.png): маленький узел и образец
// линии с тем же градиентом, что на графе
import React, { useId } from 'react';
import { COLORS, FONT } from '../shared/layout';
import { FIXED_GRADIENT_LENGTH, FIXED_GRADIENT_SOLID } from './graphEngine';
import { CubeGlyph, ShopGlyph } from './icons';
import type { GradientMode } from './types';

interface GraphLegendProps {
  gradient: GradientMode;
  limitPercent: number;
}

type Sample = 'solid' | 'gradient' | 'dashed';

interface LegendItem {
  key: string;
  label: string;
  color: string;
  glyph: 'shop' | 'cube' | null;
  sample: Sample;
}

const SAMPLE_W = 64;
const SAMPLE_H = 28;
const NODE_R = 11;

const LegendSample: React.FC<{ item: LegendItem; gradient: GradientMode; gid: string }> = ({ item, gradient, gid }) => {
  const solid = gradient === 'fixed' ? FIXED_GRADIENT_SOLID / FIXED_GRADIENT_LENGTH : 0.1;
  const cy = SAMPLE_H / 2;
  if (item.sample === 'dashed') {
    return (
      <svg width={SAMPLE_W} height={SAMPLE_H} viewBox={`0 0 ${SAMPLE_W} ${SAMPLE_H}`} aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx={7} cy={cy} r={6} fill={COLORS.rose} />
        <circle cx={SAMPLE_W - 7} cy={cy} r={6} fill={COLORS.rose} />
        <line x1={15} y1={cy} x2={SAMPLE_W - 15} y2={cy} stroke={COLORS.rose} strokeWidth={2} strokeDasharray="6 4" />
      </svg>
    );
  }
  const gradientId = `${gid}-${item.key}`;
  return (
    <svg width={SAMPLE_W} height={SAMPLE_H} viewBox={`0 0 ${SAMPLE_W} ${SAMPLE_H}`} aria-hidden="true" style={{ flexShrink: 0 }}>
      {item.sample === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={NODE_R + 3} y1={cy} x2={SAMPLE_W - 2} y2={cy}>
            <stop offset={0} stopColor={item.color} />
            <stop offset={solid} stopColor={item.color} />
            <stop offset={1} stopColor={COLORS.accent} />
          </linearGradient>
        </defs>
      )}
      <line
        x1={NODE_R + 3}
        y1={cy}
        x2={SAMPLE_W - 3}
        y2={cy}
        stroke={item.sample === 'gradient' ? `url(#${gradientId})` : item.color}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={NODE_R + 2} cy={cy} r={NODE_R} fill={item.color} />
      <g transform={`translate(${NODE_R + 2 - 6.3} ${cy - 6.3}) scale(0.7)`}>{item.glyph === 'cube' ? <CubeGlyph /> : <ShopGlyph />}</g>
    </svg>
  );
};

const GraphLegend: React.FC<GraphLegendProps> = ({ gradient, limitPercent }) => {
  const gid = `pgl${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const items: LegendItem[] = [
    { key: 'regular', label: 'Рядовая закупка', color: COLORS.accent, glyph: 'shop', sample: 'solid' },
    {
      key: 'over',
      label: `Закупка свыше установленного лимита превышения цены (${Math.round(limitPercent)}%)`,
      color: COLORS.rose,
      glyph: 'shop',
      sample: 'gradient',
    },
    { key: 'anchor', label: 'Якорный поставщик', color: COLORS.anchorGreen, glyph: 'shop', sample: 'gradient' },
    { key: 'nom', label: 'Номенклатура', color: COLORS.accent, glyph: 'cube', sample: 'solid' },
    { key: 'affiliated', label: 'Аффилированность', color: COLORS.rose, glyph: null, sample: 'dashed' },
  ];

  return (
    <div
      className="pg-legend"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 16px 12px 12px',
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 4px 18px rgba(226, 236, 249, 0.9)',
        fontFamily: FONT,
        userSelect: 'none',
        maxWidth: 360,
      }}
    >
      {items.map(item => (
        <div key={item.key} className="pg-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LegendSample item={item} gradient={gradient} gid={gid} />
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: '16px', color: COLORS.text }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default GraphLegend;
