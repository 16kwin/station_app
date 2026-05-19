// SchablonTableCell.tsx
import React, { useState } from 'react';

import Schablon7 from '../../../assets/Schablon/Schablon7.svg';
import Schablon8 from '../../../assets/Schablon/Schablon8.svg';
import Schablon9 from '../../../assets/Schablon/Schablon9.svg';
import Schablon10 from '../../../assets/Schablon/Schablon10.svg';
import Schablon11 from '../../../assets/Schablon/Schablon11.svg';
import arrow1 from '../../../assets/Schablon/arrow1.svg';
import arrow2 from '../../../assets/Schablon/arrow2.svg';

interface TableRow {
  id: number;
  name: string;
}

interface SchablonTableCellProps {
  row: TableRow;
  isSelected: boolean;
  isExpanded: boolean;
  isMultiSelect: boolean;
  selectedColumn: number;
  onSelect: (id: number, ctrlKey: boolean) => void;
  onToggleExpand: (id: number) => void;
  onDoubleClick: (id: number) => void;
  setRef: (id: number, element: HTMLDivElement | null) => void;
}

const SchablonTableCell: React.FC<SchablonTableCellProps> = ({
  row,
  isSelected,
  isExpanded,
  isMultiSelect,
  selectedColumn,
  onSelect,
  onToggleExpand,
  onDoubleClick,
  setRef,
}) => {
  const stripeColor = isMultiSelect ? '#07E098' : '#666EFE';
  const [isHovered, setIsHovered] = useState(false);

  const cellNumber = `${selectedColumn}-${row.id}`;
  const nomenclature = `Номенклатура ${row.id}`;
  const quantity = Math.floor(Math.random() * 100) + 1;
  const purposes = ['ТМЦ', 'СГД', 'ОК'][row.id % 3];

  const backgroundColor = isExpanded 
    ? '#F5FAFF' 
    : isHovered 
      ? '#F5FAFF' 
      : '#FFFFFF';

  return (
    <div
      ref={(el) => setRef(row.id, el)}
      onClick={(e) => onSelect(row.id, e.ctrlKey || e.metaKey)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(row.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: isExpanded ? '240px' : '80px',
        backgroundColor,
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        transition: 'height 0.3s ease, background-color 0.2s ease',
        overflow: 'hidden',
      }}
    >
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

      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(row.id);
        }}
        style={{
          position: 'absolute',
          right: '30px',
          top: '35px',
          width: '10px',
          height: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 2,
        }}
      >
        <img 
          src={isExpanded ? arrow2 : arrow1} 
          alt="" 
          style={{ width: '10px', height: '15px' }} 
        />
      </div>

      <div style={{ height: '80px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: isExpanded ? '30px' : '0px',
            right: isExpanded ? '30px' : '0px',
            height: '1px',
            backgroundColor: '#E5E7EB',
            transition: 'left 0.3s ease, right 0.3s ease',
          }}
        />

        <div style={{ paddingTop: '11px', height: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', paddingLeft: '30px', paddingRight: '50px' }}>
            <div style={{ width: '165px', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
                Номер ячейки
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
                {cellNumber}
              </div>
            </div>

            <div style={{ width: '615px', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
                Номенклатура
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomenclature}
              </div>
            </div>

            <div style={{ width: '179px', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
                Количество
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
                {quantity}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
                Назначения
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#2D4059', height: '20px', lineHeight: '20px', marginTop: '4px' }}>
                {purposes}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          height: '160px',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.2s ease 0.15s',
          paddingTop: '20px',
        }}
      >
        <div style={{ display: 'flex', paddingLeft: '30px', paddingRight: '30px' }}>
          <div style={{ width: '153px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Изображение
            </div>
          </div>
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Код номенклатуры
            </div>
          </div>
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Тип применения номенклатуры
            </div>
          </div>
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Партия
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px' }}>
              Цена, руб.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', paddingLeft: '30px', paddingRight: '30px', marginTop: '4px' }}>
          <div style={{ width: '153px', flexShrink: 0 }}>
            <div style={{
              width: '100px',
              height: '100px',
              backgroundColor: '#E9F2F9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              color: '#6C7A8B',
            }}>
              В разработке
            </div>
          </div>

          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{
              width: '220px',
              height: '49px',
              backgroundColor: '#E9F2F9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '15px',
              marginBottom: '20px',
            }}>
              <img src={Schablon7} alt="" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '13px',
                color: '#6C7A8B',
                marginLeft: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                В разработке
              </span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: 'rgba(45, 64, 89, 0.5)', height: '16px', lineHeight: '16px', marginBottom: '1px' }}>
              Ссылки
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#2D4059', height: '16px', lineHeight: '16px', marginRight: '5px' }}>
                Характеристики
              </span>
              <img src={Schablon11} alt="" style={{ width: '13px', height: '13px', flexShrink: 0, marginRight: '30px' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#2D4059', height: '16px', lineHeight: '16px', marginRight: '5px', whiteSpace: 'nowrap' }}>
                Документ - Возможные поставщики
              </span>
              <img src={Schablon11} alt="" style={{ width: '13px', height: '13px', flexShrink: 0 }} />
            </div>
          </div>

          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{
              width: '220px',
              height: '49px',
              backgroundColor: '#E9F2F9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '15px',
            }}>
              <img src={Schablon8} alt="" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '13px',
                color: '#6C7A8B',
                marginLeft: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                В разработке
              </span>
            </div>
          </div>

          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{
              width: '220px',
              height: '49px',
              backgroundColor: '#E9F2F9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '15px',
            }}>
              <img src={Schablon9} alt="" style={{ width: '21px', height: '15px', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '13px',
                color: '#6C7A8B',
                marginLeft: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                В разработке
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              width: '220px',
              height: '49px',
              backgroundColor: '#E9F2F9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
              <img 
                src={Schablon10} 
                alt="" 
                style={{ 
                  width: '22px', 
                  height: '22px', 
                  position: 'absolute',
                  top: '11px',
                  left: '11px',
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchablonTableCell;