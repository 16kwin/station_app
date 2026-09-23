// MainPage.tsx — главная страница: шапка с выбором роли и блока, период и активная информационная
// панель в белом блоке 1800×840.
import React, { useState } from 'react';
import DashboardHeader from './shared/DashboardHeader';
import DateRangePopup from './shared/DateRangePopup';
import type { AnchorRect } from './shared/DateRangePopup';
import RoleSwitchPopup from './shared/RoleSwitchPopup';
import { DEFAULT_ROLE, findRole } from './shared/roles';
import type { BlockKey, RoleKey } from './shared/roles';
import { CANVAS, DEFAULT_RANGE } from './shared/layout';
import type { DateRange } from './shared/types';
import EconomicDashboard from './economic/EconomicDashboard';
import QualityDashboard from './quality/QualityDashboard';
import OperatorDashboard from './operator/OperatorDashboard';

/** Высота полосы шапки над карточками панели */
const HEADER_HEIGHT = 107;

const MainPage: React.FC = () => {
  const [roleKey, setRoleKey] = useState<RoleKey>(DEFAULT_ROLE);
  const [blockKey, setBlockKey] = useState<BlockKey>(findRole(DEFAULT_ROLE).blocks[0].key);
  const [range, setRange] = useState<DateRange>({ ...DEFAULT_RANGE });
  const [roleOpen, setRoleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<AnchorRect | null>(null);

  const role = findRole(roleKey);
  // Показанный блок всегда принадлежит текущей роли: если сохранённый ключ роли не подходит,
  // берём её первый блок. Так заголовок и содержимое панели не могут разойтись.
  const blockIndex = Math.max(
    0,
    role.blocks.findIndex(item => item.key === blockKey),
  );
  const block = role.blocks[blockIndex];

  // Смена роли начинает показ с первого блока роли и закрывает выбор периода
  const handleRoleSelect = (next: RoleKey) => {
    setRoleKey(next);
    setBlockKey(findRole(next).blocks[0].key);
    setDateOpen(false);
  };

  const handleBlockChange = (index: number) => {
    const target = role.blocks[index];
    if (target) setBlockKey(target.key);
  };

  const handleDateClick = (anchor: AnchorRect) => {
    setDateAnchor(anchor);
    setDateOpen(open => !open);
  };

  const handleDateReset = () => {
    setDateOpen(false);
    setRange({ ...DEFAULT_RANGE });
  };

  return (
    <div style={{ position: 'relative', width: CANVAS.width, height: CANVAS.height, padding: 0 }}>
      {block.key === 'economic' && <EconomicDashboard range={range} />}
      {block.key === 'quality' && <QualityDashboard range={range} />}
      {block.key === 'workshop' && <OperatorDashboard />}

      {/* Шапка лежит поверх панели: панель занимает весь холст и иначе перехватывала бы клики */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS.width, height: HEADER_HEIGHT, zIndex: 6 }}>
        <DashboardHeader
          title={role.title}
          onTitleClick={() => setRoleOpen(true)}
          blocks={role.blocks.map(item => item.label)}
          blockIndex={blockIndex}
          onBlockChange={handleBlockChange}
          range={role.hasDateRange ? range : undefined}
          onDateClick={handleDateClick}
          onDateReset={handleDateReset}
        />
      </div>

      <DateRangePopup
        isOpen={dateOpen && role.hasDateRange}
        anchorRect={dateAnchor}
        range={range}
        onClose={() => setDateOpen(false)}
        onConfirm={setRange}
      />

      <RoleSwitchPopup isOpen={roleOpen} value={roleKey} onSelect={handleRoleSelect} onClose={() => setRoleOpen(false)} />
    </div>
  );
};

export default MainPage;
