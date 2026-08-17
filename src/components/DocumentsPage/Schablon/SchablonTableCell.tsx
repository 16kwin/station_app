// SchablonTableCell.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useState } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

interface TableRow {
  id: number;
  name: string;
}

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  purposeMaterial?: string | null;
  purposeSgd?: string | null;
}

interface SchablonTableCellProps {
  row: TableRow;
  isSelected: boolean;
  isMultiSelect: boolean;
  selectedColumn: number;
  isMerged: boolean;
  mergeCount: number;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  cellData?: CellData;
  onSelect: (id: number, ctrlKey: boolean) => void;
  onDoubleClick: (id: number) => void;
  onClear?: () => void;
  onOpenDetails?: () => void;
  setRef: (id: number, element: HTMLDivElement | null) => void;
}

const SchablonTableCell: React.FC<SchablonTableCellProps> = ({
  row, isSelected, isMultiSelect, selectedColumn, isMerged,
  rowStart, rowEnd, colStart, colEnd, cellData, onSelect, onDoubleClick,
  onClear, onOpenDetails, setRef,
}) => {
  const stripeColor = isMultiSelect ? '#07E098' : '#666EFE';
  const [isHovered, setIsHovered] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  let cellNumber: string;
  if (colStart !== colEnd && rowStart !== rowEnd) cellNumber = `${colStart}-${colEnd}-${rowStart}-${rowEnd}`;
  else if (colStart !== colEnd) cellNumber = `${colStart}-${colEnd}-${rowStart}`;
  else if (rowStart !== rowEnd) cellNumber = `${colStart}-${rowStart}-${rowEnd}`;
  else cellNumber = `${colStart}-${rowStart}`;

  const materialName = cellData?.materialName || '—';
  const materialArticle = cellData?.materialArticle || '';
  const quantity = cellData?.quantity ?? 0;
  const purposes = [cellData?.purposeMaterial, cellData?.purposeSgd].filter(Boolean);
  const purposesText = purposes.length > 0 ? purposes.join(', ') : '—';
  const hasData = !!cellData?.materialName;

  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY }); };
  const closeContextMenu = () => setContextMenu(null);

  const handleClear = async () => {
    if (!cellData?.uid || isClearing) return;
    closeContextMenu();
    setIsClearing(true);
    try { await AxiosService.delete(ConstantInfo.restApiTemplateCell(cellData.uid)); onClear?.(); }
    catch (error) { console.error('Ошибка очистки ячейки:', error); }
    finally { setIsClearing(false); }
  };

  const handleOpenDetails = () => { closeContextMenu(); onOpenDetails?.(); };

  const backgroundColor = isHovered || contextMenu ? '#F5FAFF' : '#FFFFFF';

  return (
    <>
      <div ref={(el) => setRef(row.id, el)} onClick={(e) => onSelect(row.id, e.ctrlKey || e.metaKey)}
        onDoubleClick={(e) => { e.stopPropagation(); onSelect(row.id, e.ctrlKey || e.metaKey); }}
        onContextMenu={handleContextMenu} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
        style={{ height: '80px', backgroundColor, cursor: 'pointer', fontFamily: 'Inter, sans-serif', position: 'relative', transition: 'background-color 0.2s ease' }}>
        {isSelected && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '5px', height: '54px', backgroundColor: stripeColor, borderRadius: '0 5px 5px 0', zIndex: 1 }} />}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: '#E5E7EB' }} />
        <div style={{ paddingTop: '11px', height: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', paddingLeft: '30px', paddingRight: '50px' }}>
            <div style={{ width: '165px', flexShrink: 0 }}><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>Номер ячейки</div><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>{cellNumber}</div></div>
            <div style={{ width: '590px', flexShrink: 0 }}><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>Номенклатура</div><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: hasData ? 500 : 400, fontSize: '15px', color: hasData ? '#2D4059' : 'rgba(45, 64, 89, 0.4)', height: '20px', lineHeight: '20px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hasData ? `${materialName} ${materialArticle ? `(${materialArticle})` : ''}` : '—'}</div></div>
            <div style={{ width: '179px', flexShrink: 0 }}><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>Количество</div><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: hasData ? 500 : 400, fontSize: '15px', color: hasData ? '#2D4059' : 'rgba(45, 64, 89, 0.4)', height: '20px', lineHeight: '20px', marginTop: '4px' }}>{hasData ? quantity : '—'}</div></div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>Назначения</div><div style={{ fontFamily: 'Inter, sans-serif', fontWeight: hasData ? 500 : 400, fontSize: '15px', color: hasData ? '#2D4059' : 'rgba(45, 64, 89, 0.4)', height: '20px', lineHeight: '20px', marginTop: '4px' }}>{purposesText}</div></div>
          </div>
        </div>
      </div>
      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, backgroundColor: '#FFFFFF', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: '8px 0', zIndex: 2000, minWidth: '220px' }} onClick={(e) => e.stopPropagation()}>
          <div onClick={handleOpenDetails} style={{ padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2D4059', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5FAFF')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#666EFE" strokeWidth="1.5"/><path d="M8 4.5V8.5M8 11.5V11.51" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {hasData ? 'Посмотреть / Изменить' : 'Выбрать номенклатуру'}
          </div>
          {hasData && (
            <div onClick={handleClear} style={{ padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Очистить
            </div>
          )}
        </div>
      )}
      {contextMenu && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }} onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />}
    </>
  );
};

export default SchablonTableCell;