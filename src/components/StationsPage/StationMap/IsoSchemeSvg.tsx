// IsoSchemeSvg.tsx — рисунок автоматической схемы цеха (геометрия — isoScheme.ts): тень здания, пол, задние
// стены, зоны участков с подписями на полу, разметка проходов и низкий передний бортик.
import React from 'react';
import type { IsoScheme } from './isoScheme';
import { COLORS, FONT } from './theme';

interface IsoSchemeSvgProps {
  scheme: IsoScheme;
  /** Подсвеченный участок: его зона ярче и в акцентной рамке, остальные приглушены */
  highlightKey: string | null;
}

const IsoSchemeSvg: React.FC<IsoSchemeSvgProps> = ({ scheme, highlightKey }) => (
  <svg
    width={scheme.width}
    height={scheme.height}
    viewBox={`0 0 ${scheme.width} ${scheme.height}`}
    style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    aria-hidden="true"
  >
    <defs>
      <filter id="sm-scheme-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <polygon points={scheme.shadow} fill="rgba(45, 64, 89, 0.16)" filter="url(#sm-scheme-shadow)" transform="translate(0 10)" />
    <polygon points={scheme.floor} fill="#FAFBFD" />
    {scheme.backWalls.map((face, i) => (
      <polygon key={`b${i}`} points={face.points} fill={face.fill} />
    ))}
    {scheme.zones.map(zone => {
      const active = highlightKey === zone.key;
      const dimmed = highlightKey !== null && !active;
      return (
        <g key={zone.key} style={{ opacity: dimmed ? 0.45 : 1, transition: 'opacity 0.25s ease' }}>
          <polygon
            points={zone.points}
            fill={zone.tone.floor}
            stroke={active ? COLORS.accent : zone.tone.edge}
            strokeWidth={active ? 3 : 1.5}
            strokeLinejoin="round"
          />
          {active && <polygon points={zone.points} fill="rgba(102, 110, 254, 0.08)" />}
          <text
            transform={zone.label.transform}
            fontSize={zone.label.fontSize}
            fontFamily={FONT}
            fontWeight={700}
            letterSpacing="0.08em"
            fill={active ? COLORS.accent : zone.tone.ink}
          >
            {zone.label.text}
          </text>
        </g>
      );
    })}
    {scheme.aisles.map((a, i) => (
      <line key={`a${i}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#EBCB72" strokeWidth={2} strokeDasharray="14 10" strokeLinecap="round" opacity={0.85} />
    ))}
    {scheme.frontWalls.map((face, i) => (
      <polygon key={`f${i}`} points={face.points} fill={face.fill} />
    ))}
  </svg>
);

export default IsoSchemeSvg;
