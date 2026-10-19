// EventPanel.tsx — кнопки имитации событий станции внизу страницы: «Блок событий 1» (Login / Logout)
// и «Блок событий 2» (Выдача начало / Выдача окончание), плюс «Закрыть».
// Кнопка начала события залита акцентом, пока идёт его запись — как «Login» на макете.
import React from 'react';
import type { VideoEventPhase, VideoEventType } from './types';
import { COLORS, FONT } from './theme';
import { ActionButton } from './ui';

/** Положение элементов на холсте 1800×840 (по макету) */
const BUTTONS_TOP = 760;
const BUTTON_H = 50;
const LABEL_TOP = 712;
const BRACKET_TOP = 740;

interface BlockSpec {
  title: string;
  type: VideoEventType;
  start: { label: string; left: number; width: number };
  stop: { label: string; left: number; width: number };
}

const BLOCKS: BlockSpec[] = [
  {
    title: 'Блок событий 1',
    type: 'authority',
    start: { label: 'Login', left: 933, width: 99 },
    stop: { label: 'Logout', left: 1063, width: 110 },
  },
  {
    title: 'Блок событий 2',
    type: 'issue',
    start: { label: 'Выдача начало', left: 1215, width: 179 },
    stop: { label: 'Выдача окончание', left: 1425, width: 183 },
  },
];

const CLOSE = { left: 1645, width: 113 } as const;

export type BusyKey = `${VideoEventType}:${VideoEventPhase}` | null;

interface EventPanelProps {
  /** Идёт ли запись события каждого вида */
  active: Record<VideoEventType, boolean>;
  busy: BusyKey;
  /** Почему события недоступны (нет станции, нет FFmpeg); null — доступны */
  disabledReason: string | null;
  onEvent: (type: VideoEventType, phase: VideoEventPhase) => void;
  onClose: () => void;
  /** Кнопки событий — только у ролей с полным доступом к видео; «Закрыть» есть всегда */
  showEvents?: boolean;
}

/** Пунктирная скобка под подписью блока: горизонталь, концы вниз к кнопкам, засечка вверх к подписи */
const Bracket: React.FC<{ left: number; width: number }> = ({ left, width }) => (
  <svg
    width={width}
    height={16}
    viewBox={`0 0 ${width} 16`}
    style={{ position: 'absolute', left, top: BRACKET_TOP, overflow: 'visible' }}
    aria-hidden="true"
  >
    <path
      d={`M0.5 14V5.5H${width - 0.5}V14M${width / 2} 5.5V0`}
      fill="none"
      stroke={COLORS.muted}
      strokeWidth={1}
      strokeDasharray="3 3"
    />
  </svg>
);

const EventPanel: React.FC<EventPanelProps> = ({ active, busy, disabledReason, onEvent, onClose, showEvents = true }) => (
  <>
    {showEvents && BLOCKS.map(block => {
      const isActive = active[block.type];
      const left = block.start.left;
      const right = block.stop.left + block.stop.width;
      const startBusy = busy === `${block.type}:start`;
      const stopBusy = busy === `${block.type}:stop`;
      const anyBusy = busy !== null;

      return (
        <React.Fragment key={block.type}>
          <span
            style={{
              position: 'absolute',
              left,
              top: LABEL_TOP,
              width: right - left,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 500,
              color: COLORS.text,
              userSelect: 'none',
            }}
          >
            {block.title}
          </span>
          <Bracket left={left + 30} width={right - left - 60} />

          <div style={{ position: 'absolute', left: block.start.left, top: BUTTONS_TOP }}>
            <ActionButton
              label={block.start.label}
              width={block.start.width}
              height={BUTTON_H}
              active={isActive}
              busy={startBusy}
              disabled={!isActive && (disabledReason !== null || (anyBusy && !startBusy))}
              title={disabledReason ?? (isActive ? 'Запись события идёт' : 'Начать событие и запись камер')}
              onClick={isActive ? undefined : () => onEvent(block.type, 'start')}
            />
          </div>
          <div style={{ position: 'absolute', left: block.stop.left, top: BUTTONS_TOP }}>
            <ActionButton
              label={block.stop.label}
              width={block.stop.width}
              height={BUTTON_H}
              busy={stopBusy}
              disabled={!isActive || (anyBusy && !stopBusy)}
              title={isActive ? 'Закончить событие и сохранить видео' : 'Событие ещё не начато'}
              onClick={() => onEvent(block.type, 'stop')}
            />
          </div>
        </React.Fragment>
      );
    })}

    <div style={{ position: 'absolute', left: CLOSE.left, top: BUTTONS_TOP }}>
      <ActionButton label="Закрыть" width={CLOSE.width} height={BUTTON_H} onClick={onClose} />
    </div>
  </>
);

export default EventPanel;
