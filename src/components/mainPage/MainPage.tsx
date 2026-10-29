// MainPage.tsx — главная страница: шапка с выбором роли и блока, период и активная информационная
// панель в белом блоке 1800×840.
// Роли и блоки — только те, данные которых доступны пользователю (shared/roles.ts). Панелей нет (функция
// dashboards выключена на установке или для роли пользователя) — нейтральная стартовая страница ядра.
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { getFeatureSnapshot, subscribeFeatures } from '../../services/features/featureStore';
import DashboardHeader from './shared/DashboardHeader';
import DateRangePopup from './shared/DateRangePopup';
import type { AnchorRect } from './shared/DateRangePopup';
import RoleSwitchPopup from './shared/RoleSwitchPopup';
import { DEFAULT_ROLE, availableRoles, pickRole } from './shared/roles';
import type { BlockKey, DashboardRole, RoleKey } from './shared/roles';
import { CANVAS, DEFAULT_RANGE } from './shared/layout';
import type { DateRange } from './shared/types';
import CoreStartPage from './CoreStartPage';
import EconomicDashboard from './economic/EconomicDashboard';
import QualityDashboard from './quality/QualityDashboard';
import OperatorDashboard from './operator/OperatorDashboard';
import PurchasingDashboard from './purchasing/PurchasingDashboard';
import AuditorDashboard from './auditor/AuditorDashboard';
import ControllerDashboard from './controller/ControllerDashboard';
import ShopHeadDashboard from './shopHead/ShopHeadDashboard';
import { useCompact } from '../hooks/useViewport';

/** Высота полосы шапки над карточками панели */
const HEADER_HEIGHT = 107;

/**
 * Включённые функции пользователя. Хранилище отдаёт тот же набор, пока состав не изменился, — главная
 * не перерисовывается от служебных изменений снимка (идёт запрос профиля и т. п.)
 */
const useEnabledFeatures = () => useSyncExternalStore(subscribeFeatures, () => getFeatureSnapshot().on);

interface DashboardsProps {
  /** Доступные роли, не пустой список */
  roles: readonly DashboardRole[];
}

const Dashboards: React.FC<DashboardsProps> = ({ roles }) => {
  const [roleKey, setRoleKey] = useState<RoleKey>(DEFAULT_ROLE);
  const [blockKey, setBlockKey] = useState<BlockKey | null>(null);
  const [range, setRange] = useState<DateRange>({ ...DEFAULT_RANGE });
  const [roleOpen, setRoleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<AnchorRect | null>(null);
  // Телефон и планшет: шапка над панелью, карточки панели — друг под другом во всю ширину (DashboardCard)
  const compact = useCompact();

  // Выбранная роль могла стать недоступной (сервер выключил её данные) — показываем первую доступную
  const role = pickRole(roles, roleKey) ?? roles[0];
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
    setBlockKey(null);
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

  const dashboard = (
    <>
      {block.key === 'economic' && <EconomicDashboard range={range} />}
      {block.key === 'quality' && <QualityDashboard range={range} />}
      {block.key === 'workshop' && <OperatorDashboard />}
      {block.key === 'purchasing' && <PurchasingDashboard />}
      {block.key === 'auditor' && <AuditorDashboard range={range} />}
      {block.key === 'controller' && <ControllerDashboard scope="section" />}
      {block.key === 'chiefController' && <ControllerDashboard scope="enterprise" />}
      {block.key === 'shopHead' && <ShopHeadDashboard />}
    </>
  );

  const header = (
    <DashboardHeader
      title={role.title}
      onTitleClick={() => setRoleOpen(true)}
      blocks={role.blocks.map(item => item.label)}
      blockIndex={blockIndex}
      onBlockChange={handleBlockChange}
      range={role.hasDateRange ? range : undefined}
      onDateClick={handleDateClick}
      onDateReset={handleDateReset}
      showTools={role.showTools !== false}
      compact={compact}
    />
  );

  return (
    <div style={compact ? { position: 'relative', width: '100%' } : { position: 'relative', width: CANVAS.width, height: CANVAS.height, padding: 0 }}>
      {compact ? (
        <>
          <div style={{ position: 'relative', zIndex: 6 }}>{header}</div>
          <div className="awms-dashboard-compact">{dashboard}</div>
        </>
      ) : (
        <>
          {dashboard}

          {/* Шапка лежит поверх панели: панель занимает весь холст и иначе перехватывала бы клики */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS.width, height: HEADER_HEIGHT, zIndex: 6 }}>
            {header}
          </div>
        </>
      )}

      <DateRangePopup
        isOpen={dateOpen && role.hasDateRange}
        anchorRect={dateAnchor}
        range={range}
        onClose={() => setDateOpen(false)}
        onConfirm={setRange}
      />

      <RoleSwitchPopup
        isOpen={roleOpen}
        roles={roles}
        value={role.key}
        onSelect={handleRoleSelect}
        onClose={() => setRoleOpen(false)}
      />
    </div>
  );
};

const MainPage: React.FC = () => {
  const enabled = useEnabledFeatures();
  const roles = useMemo(() => availableRoles(key => enabled.has(key)), [enabled]);
  return roles.length > 0 ? <Dashboards roles={roles} /> : <CoreStartPage />;
};

export default MainPage;
