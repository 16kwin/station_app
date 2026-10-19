// GppTable.tsx — таблица-дерево слева от диаграммы: флажок, № п/п (сквозной по видимым строкам), номер операции,
// наименование с «−/+» и отступом по уровню, вид элемента, количество. Двойной щелчок по номеру операции,
// наименованию или количеству — правка на месте (Enter — принять, Esc — отмена).
import React, { useEffect, useRef, useState } from 'react';
import type { GppRowDTO, VisibleRow } from './types';
import { COLORS, COLUMNS, FONT, KIND_LABEL, LAYOUT, TABLE_WIDTH, TREE } from './theme';
import { MinusIcon, PlusIcon, SquareCheck } from './icons';
import { formatQty } from './purchase';
import { MAX_QUANTITY } from './schedule';

export type EditField = 'op' | 'name' | 'qty';

export interface EditTarget {
  uid: string;
  field: EditField;
}

/** Изменения строки из правки на месте */
export type RowPatch = Partial<Pick<GppRowDTO, 'opNumber' | 'code' | 'name' | 'quantity'>>;

const headText: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '17px',
  color: COLORS.white,
  textAlign: 'center',
};

interface HeaderProps {
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: () => void;
}

export const GppTableHeader: React.FC<HeaderProps> = ({ allChecked, someChecked, onToggleAll }) => (
  <div style={{ display: 'flex', alignItems: 'center', width: TABLE_WIDTH, height: LAYOUT.headerHeight, flexShrink: 0 }}>
    <div style={{ width: COLUMNS.check, display: 'flex', justifyContent: 'center' }}>
      <button
        type="button"
        aria-label={allChecked ? 'Снять отметку со всех строк' : 'Отметить все строки'}
        onClick={onToggleAll}
        style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', display: 'flex' }}
      >
        <SquareCheck checked={allChecked} partial={someChecked} white />
      </button>
    </div>
    <div style={{ ...headText, width: COLUMNS.num }}>№<br />п/п</div>
    <div style={{ ...headText, width: COLUMNS.op }}>Номер<br />операции</div>
    <div style={{ ...headText, width: COLUMNS.name, textAlign: 'left', paddingLeft: TREE.left }}>Наименование</div>
    <div style={{ ...headText, width: COLUMNS.kind }}>Вид<br />элемента</div>
    <div style={{ ...headText, width: COLUMNS.qty }}>Кол-во</div>
  </div>
);

/** Подсветка найденного текста */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark style={{ backgroundColor: 'rgba(102, 110, 254, 0.18)', color: 'inherit', borderRadius: 3, padding: '0 1px' }}>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
};

const inputStyle = (invalid: boolean): React.CSSProperties => ({
  height: 34,
  minWidth: 0,
  padding: '0 10px',
  border: `1px solid ${invalid ? COLORS.danger : COLORS.accent}`,
  borderRadius: 8,
  outline: 'none',
  backgroundColor: COLORS.white,
  boxShadow: invalid ? '0 0 0 3px rgba(255, 48, 82, 0.12)' : '0 0 0 3px rgba(102, 110, 254, 0.12)',
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  color: COLORS.text,
});

/** Количество из поля: «1,5» и «1.5»; не больше 3 знаков после запятой, от нуля до предела сервера (NUMERIC(15,3)) */
const parseQty = (value: string): number | null => {
  const text = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,3})?$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n <= MAX_QUANTITY ? n : null;
};

const QTY_HINT = 'От 0 до 999 999 999 999,999, не больше 3 знаков после запятой';

interface EditorProps {
  row: GppRowDTO;
  field: EditField;
  onCommit: (patch: RowPatch) => void;
  onCancel: () => void;
}

/** Поля правки на месте; уход фокуса из полей — как Enter, если значение верное */
const CellEditor: React.FC<EditorProps> = ({ row, field, onCommit, onCancel }) => {
  const [op, setOp] = useState(row.opNumber ?? '');
  const [code, setCode] = useState(row.code ?? '');
  const [name, setName] = useState(row.name);
  const [qty, setQty] = useState(formatQty(row.quantity));
  const boxRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    firstRef.current?.select();
  }, []);

  const invalid = field === 'name' ? name.trim() === '' : field === 'qty' ? parseQty(qty) === null : false;

  const commit = () => {
    if (invalid) return;
    if (field === 'op') onCommit({ opNumber: op.trim() || null });
    if (field === 'name') onCommit({ code: code.trim() || null, name: name.trim() });
    if (field === 'qty') onCommit({ quantity: parseQty(qty) ?? row.quantity });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  const onBlur = (event: React.FocusEvent) => {
    if (boxRef.current?.contains(event.relatedTarget as Node | null)) return;
    if (invalid) onCancel();
    else commit();
  };

  return (
    <div ref={boxRef} onBlur={onBlur} onKeyDown={onKeyDown} onDoubleClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
      {field === 'op' && <input ref={firstRef} value={op} maxLength={10} onChange={e => setOp(e.target.value)} aria-label="Номер операции" style={{ ...inputStyle(false), width: 76, textAlign: 'center' }} />}
      {field === 'name' && (
        <>
          <input ref={firstRef} value={code} maxLength={100} placeholder="Код" onChange={e => setCode(e.target.value)} aria-label="Код" style={{ ...inputStyle(false), width: 170 }} />
          <input value={name} maxLength={500} placeholder="Наименование" onChange={e => setName(e.target.value)} aria-label="Наименование" style={{ ...inputStyle(invalid), flex: 1 }} />
        </>
      )}
      {field === 'qty' && (
        <input
          ref={firstRef}
          value={qty}
          inputMode="decimal"
          onChange={e => setQty(e.target.value)}
          aria-label="Количество"
          aria-invalid={invalid}
          title={invalid ? QTY_HINT : undefined}
          style={{ ...inputStyle(invalid), width: 96, textAlign: 'center' }}
        />
      )}
    </div>
  );
};

interface BodyProps {
  visible: readonly VisibleRow[];
  checked: ReadonlySet<string>;
  hovered: string | null;
  editing: EditTarget | null;
  editable: boolean;
  /** Во время поиска узлы раскрыты принудительно — «−/+» не работает */
  canToggle: boolean;
  search: string;
  onHover: (uid: string | null) => void;
  onToggleCheck: (uid: string) => void;
  onToggleExpand: (uid: string) => void;
  onStartEdit: (target: EditTarget) => void;
  onCommitEdit: (uid: string, patch: RowPatch) => void;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, uid: string | null) => void;
}

const cell: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: FONT,
  fontSize: 15,
  lineHeight: '18px',
  flexShrink: 0,
};

export const GppTableBody: React.FC<BodyProps> = ({
  visible,
  checked,
  hovered,
  editing,
  editable,
  canToggle,
  search,
  onHover,
  onToggleCheck,
  onToggleExpand,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onContextMenu,
}) => (
  <div style={{ width: TABLE_WIDTH, flexShrink: 0 }} onMouseLeave={() => onHover(null)}>
    {visible.map(v => {
      const { row } = v;
      const isChecked = checked.has(row.uid);
      const strong = row.kind !== 'MATERIAL';
      const editHere = (field: EditField) => editing?.uid === row.uid && editing.field === field;
      const startEdit = (field: EditField) => (editable ? () => onStartEdit({ uid: row.uid, field }) : undefined);
      return (
        <div
          key={row.uid}
          data-row={row.uid}
          onMouseEnter={() => onHover(row.uid)}
          onContextMenu={event => {
            event.preventDefault();
            onContextMenu(event, row.uid);
          }}
          style={{
            display: 'flex',
            height: LAYOUT.rowHeight,
            borderBottom: `1px solid ${COLORS.line}`,
            boxSizing: 'border-box',
            backgroundColor: isChecked ? COLORS.rowChecked : hovered === row.uid ? COLORS.rowHover : COLORS.white,
            transition: 'background-color 0.12s ease',
            color: v.context ? COLORS.faint : COLORS.text,
          }}
        >
          <div style={{ ...cell, width: COLUMNS.check }}>
            <button
              type="button"
              aria-label={isChecked ? 'Снять отметку' : 'Отметить строку'}
              onClick={() => onToggleCheck(row.uid)}
              style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', display: 'flex' }}
            >
              <SquareCheck checked={isChecked} />
            </button>
          </div>
          <div style={{ ...cell, width: COLUMNS.num }}>{v.number}</div>
          <div style={{ ...cell, width: COLUMNS.op, cursor: editable ? 'text' : 'default' }} onDoubleClick={startEdit('op')}>
            {editHere('op') ? (
              <CellEditor row={row} field="op" onCommit={patch => onCommitEdit(row.uid, patch)} onCancel={onCancelEdit} />
            ) : (
              row.opNumber ?? ''
            )}
          </div>
          <div
            style={{ ...cell, width: COLUMNS.name, justifyContent: 'flex-start', paddingLeft: TREE.left + v.depth * TREE.indent, paddingRight: 16, boxSizing: 'border-box', cursor: editable ? 'text' : 'default' }}
            onDoubleClick={startEdit('name')}
          >
            <div style={{ width: TREE.toggle, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {v.hasChildren && (
                <button
                  type="button"
                  aria-label={v.expanded ? 'Свернуть' : 'Развернуть'}
                  aria-expanded={v.expanded}
                  onClick={canToggle ? () => onToggleExpand(row.uid) : undefined}
                  onDoubleClick={e => e.stopPropagation()}
                  style={{ width: 18, height: 18, marginLeft: -3, padding: 0, border: 'none', background: 'transparent', cursor: canToggle ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                >
                  {v.expanded ? <MinusIcon size={15} color={COLORS.accent} strokeWidth={2.4} /> : <PlusIcon size={15} color={COLORS.text} strokeWidth={2.4} />}
                </button>
              )}
            </div>
            {editHere('name') ? (
              <CellEditor row={row} field="name" onCommit={patch => onCommitEdit(row.uid, patch)} onCancel={onCancelEdit} />
            ) : (
              <span
                title={row.code ? `${row.code} ${row.name}` : row.name}
                style={{
                  fontWeight: strong ? 600 : 400,
                  fontSize: strong ? 15 : 14,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                <Highlight text={row.code ? `${row.code} ${row.name}` : row.name} query={search} />
              </span>
            )}
          </div>
          <div style={{ ...cell, width: COLUMNS.kind, fontSize: 14 }}>{KIND_LABEL[row.kind]}</div>
          <div style={{ ...cell, width: COLUMNS.qty, fontSize: 14, cursor: editable ? 'text' : 'default' }} onDoubleClick={startEdit('qty')}>
            {editHere('qty') ? (
              <CellEditor row={row} field="qty" onCommit={patch => onCommitEdit(row.uid, patch)} onCancel={onCancelEdit} />
            ) : (
              // Длинное число не вылезает на соседние колонки: обрезается многоточием, целиком — в подсказке
              <span title={formatQty(row.quantity)} style={{ maxWidth: '100%', padding: '0 4px', boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatQty(row.quantity)}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
