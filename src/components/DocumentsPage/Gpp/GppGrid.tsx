// GppGrid.tsx — карточка «таблица + диаграмма»: общая шапка #666EFE, общий вертикальный скролл строк,
// горизонтальный — только у диаграммы (шапка шкалы едет вместе с ней), тонкие полосы прокрутки приложения.
import React, { useEffect, useRef } from 'react';
import type { BarEditMode, GppRowDTO, GppType, ScaleMode, VisibleRow } from './types';
import { BODY_HEIGHT, COLORS, DIVIDER_WIDTH, FONT, GANTT_WIDTH, LAYOUT, SHADOWS, TABLE_WIDTH } from './theme';
import type { Timeline } from './geometry';
import { barGeometry } from './geometry';
import GppGantt, { GanttHeader } from './GppGantt';
import { GppTableBody, GppTableHeader } from './GppTable';
import type { EditTarget, RowPatch } from './GppTable';
import Scrollbar from './Scrollbar';

interface GridProps {
  rows: readonly GppRowDTO[];
  visible: readonly VisibleRow[];
  timeline: Timeline;
  scale: ScaleMode;
  type: GppType;
  autoCalc: boolean;
  editable: boolean;
  showLinks: boolean;
  showToday: boolean;
  fallbackStart: number;
  checked: ReadonlySet<string>;
  hovered: string | null;
  editing: EditTarget | null;
  canToggle: boolean;
  search: string;
  /** Пустая таблица: подпись и, если можно править, кнопка «Добавить изделие» */
  emptyText: string;
  emptyAction?: React.ReactNode;
  onHover: (uid: string | null) => void;
  onToggleCheck: (uid: string) => void;
  onToggleAll: () => void;
  onToggleExpand: (uid: string) => void;
  onStartEdit: (target: EditTarget) => void;
  onCommitEdit: (uid: string, patch: RowPatch) => void;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, uid: string | null) => void;
  onBarEdit: (uid: string, mode: BarEditMode, delta: number) => void;
  onOpenStage: (uid: string) => void;
  /** Строка, которую надо прокрутить в видимую область (например, только что добавленная) */
  revealUid: string | null;
  /** Прокрутка к строке сделана — дальше правки плана прокрутку не трогают */
  onRevealed: () => void;
}

const GppGrid: React.FC<GridProps> = props => {
  const { rows, visible, timeline, scale, checked, revealUid, onRevealed } = props;
  const bodyRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const visibleUids = new Set(visible.map(v => v.row.uid));
  // «Отметить все» — только найденные строки: приглушённые предки показаны лишь как путь к ним
  const selectable = visible.filter(v => !v.context);
  const allChecked = selectable.length > 0 && selectable.every(v => checked.has(v.row.uid));
  const someChecked = !allChecked && visible.some(v => checked.has(v.row.uid));

  // При смене масштаба или периода шкала встаёт на начало плана, а не на начало периода
  const firstBarX = (() => {
    let min = Infinity;
    barGeometry(rows, timeline).forEach(g => {
      min = Math.min(min, g.x0);
    });
    return Number.isFinite(min) ? min : 0;
  })();
  useEffect(() => {
    const el = ganttRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, firstBarX - 48);
    if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft;
    // Только при смене шкалы: правки плана не должны дёргать прокрутку
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, timeline.from, timeline.to]);

  // Прокрутка к строке — один раз: иначе любая правка (новый visible) возвращала бы таблицу к ней
  useEffect(() => {
    if (!revealUid) return;
    const at = visible.findIndex(v => v.row.uid === revealUid);
    const el = bodyRef.current;
    if (at >= 0 && el) {
      const top = at * LAYOUT.rowHeight;
      if (top < el.scrollTop) el.scrollTop = top;
      else if (top + LAYOUT.rowHeight > el.scrollTop + el.clientHeight) el.scrollTop = top + LAYOUT.rowHeight - el.clientHeight;
    }
    onRevealed();
  }, [revealUid, visible, onRevealed]);

  const cardHeight = LAYOUT.headerHeight + BODY_HEIGHT;
  const contentHeight = visible.length * LAYOUT.rowHeight;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.tableTop,
          left: LAYOUT.left,
          width: LAYOUT.width,
          height: cardHeight,
          borderRadius: 15,
          overflow: 'hidden',
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
        }}
      >
        <div style={{ display: 'flex', height: LAYOUT.headerHeight, backgroundColor: COLORS.accent }}>
          <GppTableHeader allChecked={allChecked} someChecked={someChecked} onToggleAll={props.onToggleAll} />
          <div style={{ width: DIVIDER_WIDTH, flexShrink: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', right: 2, top: 16, width: 2, height: 26, borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }} />
          </div>
          <div ref={headerRef} style={{ width: GANTT_WIDTH, overflow: 'hidden', flexShrink: 0 }}>
            <GanttHeader timeline={timeline} scale={scale} showToday={props.showToday} />
          </div>
        </div>

        <div ref={bodyRef} style={{ height: BODY_HEIGHT, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', position: 'relative' }}>
          <div style={{ display: 'flex', minHeight: contentHeight }}>
            <GppTableBody
              visible={visible}
              checked={checked}
              hovered={props.hovered}
              editing={props.editing}
              editable={props.editable}
              canToggle={props.canToggle}
              search={props.search}
              onHover={props.onHover}
              onToggleCheck={props.onToggleCheck}
              onToggleExpand={props.onToggleExpand}
              onStartEdit={props.onStartEdit}
              onCommitEdit={props.onCommitEdit}
              onCancelEdit={props.onCancelEdit}
              onContextMenu={props.onContextMenu}
            />
            {/* Разделитель таблицы и диаграммы: короткая черта в каждой строке, как на макете */}
            <div style={{ width: DIVIDER_WIDTH, flexShrink: 0 }}>
              {visible.map(v => (
                <div
                  key={v.row.uid}
                  style={{
                    height: LAYOUT.rowHeight,
                    position: 'relative',
                    borderBottom: `1px solid ${COLORS.line}`,
                    boxSizing: 'border-box',
                    backgroundColor: checked.has(v.row.uid) ? COLORS.rowChecked : props.hovered === v.row.uid ? COLORS.rowHover : COLORS.white,
                  }}
                >
                  <span style={{ position: 'absolute', right: 2, top: 16, width: 2, height: 26, borderRadius: 1, backgroundColor: COLORS.divider, opacity: 0.75 }} />
                </div>
              ))}
            </div>
            <div
              ref={ganttRef}
              onScroll={event => {
                if (headerRef.current) headerRef.current.scrollLeft = event.currentTarget.scrollLeft;
              }}
              style={{ width: GANTT_WIDTH, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', flexShrink: 0 }}
            >
              <GppGantt
                rows={rows}
                visible={visible}
                timeline={timeline}
                scale={scale}
                type={props.type}
                autoCalc={props.autoCalc}
                editable={props.editable}
                showLinks={props.showLinks}
                showToday={props.showToday}
                fallbackStart={props.fallbackStart}
                checked={checked}
                hovered={props.hovered}
                onHover={props.onHover}
                onBarEdit={props.onBarEdit}
                onOpenStage={props.onOpenStage}
                onContextMenu={props.onContextMenu}
              />
            </div>
          </div>
          {visible.length === 0 && (
            <div
              onContextMenu={event => {
                event.preventDefault();
                props.onContextMenu(event, null);
              }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: FONT, fontSize: 15, color: COLORS.muted }}
            >
              {props.emptyText}
              {props.emptyAction}
            </div>
          )}
          {visible.length > 0 && contentHeight < BODY_HEIGHT && (
            <div
              onContextMenu={event => {
                event.preventDefault();
                props.onContextMenu(event, null);
              }}
              style={{ height: BODY_HEIGHT - contentHeight }}
            />
          )}
        </div>

        <Scrollbar
          target={bodyRef}
          orientation="vertical"
          length={BODY_HEIGHT - 16}
          style={{ right: 5, top: LAYOUT.headerHeight + 8 }}
          watch={visibleUids.size}
        />
      </div>

      <Scrollbar
        target={ganttRef}
        orientation="horizontal"
        length={GANTT_WIDTH - 24}
        style={{ top: LAYOUT.tableTop + cardHeight + LAYOUT.scrollbarGap, left: LAYOUT.left + TABLE_WIDTH + DIVIDER_WIDTH + 12 }}
        watch={`${timeline.width}:${visible.length}`}
      />
    </>
  );
};

export default GppGrid;
