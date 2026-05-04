// SchablonTableCell.tsx
import React from 'react';

interface TableRow {
  id: number;
  name: string;
}

interface SchablonTableCellProps {
  row: TableRow;
  isSelected: boolean;
  isExpanded: boolean;
  isMultiSelect: boolean;
  onSelect: (id: number, ctrlKey: boolean) => void;
  onToggleExpand: (id: number) => void;
  setRef: (id: number, element: HTMLDivElement | null) => void;
}

const SchablonTableCell: React.FC<SchablonTableCellProps> = ({
  row,
  isSelected,
  isExpanded,
  isMultiSelect,
  onSelect,
  onToggleExpand,
  setRef,
}) => {
  const stripeColor = isMultiSelect ? '#07E098' : '#666EFE';

  // Фейковые данные
  const cellNumber = row.id;
  const nomenclature = `Номенклатура ${row.id}`;
  const quantity = Math.floor(Math.random() * 100) + 1;
  const purposes = ['ТМЦ', 'СГД', 'ОК'][row.id % 3];

  return (
    <div
      ref={(el) => setRef(row.id, el)}
      onClick={(e) => onSelect(row.id, e.ctrlKey || e.metaKey)}
      onDoubleClick={(e) => {
        onSelect(row.id, e.ctrlKey || e.metaKey);
        onToggleExpand(row.id);
      }}
      style={{
        height: isExpanded ? '240px' : '80px',
        backgroundColor: isExpanded ? '#E2E8FF' : '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        transition: 'height 0.3s ease, background-color 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.backgroundColor = '#F0F1FF';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
        }
      }}
    >
      {/* Шторка выделения */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: isExpanded ? '13px' : '50%',
            transform: isExpanded ? 'none' : 'translateY(-50%)',
            width: '5px',
            height: isExpanded ? '214px' : '54px',
            backgroundColor: stripeColor,
            borderRadius: '0 5px 5px 0',
            transition: 'height 0.3s ease, top 0.3s ease, transform 0.3s ease',
            zIndex: 1,
          }}
        />
      )}

      {/* Стрелочка вправо */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(row.id);
        }}
        style={{
          position: 'absolute',
          right: '16px',
          top: isExpanded ? '11px' : '50%',
          transform: isExpanded ? 'rotate(180deg)' : 'translateY(-50%)',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.3s ease, top 0.3s ease',
          zIndex: 2,
        }}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Содержимое ячейки */}
      <div style={{ paddingTop: isExpanded ? '11px' : '11px', height: '100%', width: '100%' }}>
        {/* Строка с заголовками и значениями */}
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', paddingLeft: '30px', paddingRight: '50px' }}>
          {/* Номер ячейки */}
          <div style={{ width: '165px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Номер ячейки
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
              {cellNumber}
            </div>
          </div>

          {/* Номенклатура */}
          <div style={{ width: '615px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Номенклатура
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomenclature}
            </div>
          </div>

          {/* Количество */}
          <div style={{ width: '179px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Количество
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
              {quantity}
            </div>
          </div>

          {/* Назначения */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Назначения
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
              {purposes}
            </div>
          </div>
        </div>

        {/* Раскрытое содержимое (заглушка) */}
        {isExpanded && (
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#6C7A8B',
              paddingLeft: '30px',
              paddingRight: '50px',
              marginTop: '12px',
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 0.2s ease 0.15s',
            }}
          >
            Дополнительная информация для ячейки {row.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchablonTableCell;