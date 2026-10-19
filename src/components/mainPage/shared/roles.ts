// roles.ts — роли главной страницы и их информационные панели.
// Роль выбирается в окне, которое открывается по клику на заголовок панели.
// Блок виден, только если пользователю доступны все его данные (раздел 4.2 проекта «Дискретное отключение
// функций»): сервер закрывает эндпоинты панелей функциями dashboards, dashboards.economic, dashboards.audit.
// Роль без доступных блоков не показывается; нет ни одной роли — главная показывает стартовую страницу ядра.
import type { FeatureKey } from '../../../services/features/catalog';

export type RoleKey = 'top' | 'auditor' | 'purchasing' | 'shopHead' | 'chiefController' | 'controller' | 'operator';

/** Ключ информационной панели внутри роли */
export type BlockKey =
  | 'economic'
  | 'quality'
  | 'workshop'
  | 'auditor'
  | 'purchasing'
  | 'shopHead'
  | 'chiefController'
  | 'controller';

/**
 * Данные панелей (эндпоинты /api/dashboard/*) и функции, которые их открывают, — как ворота сервера
 * (Feature.java). Родитель dashboards выключает их все
 */
export const DASHBOARD_DATA = {
  /** GET /api/dashboard/economic, PATCH /api/dashboard/economic/settings */
  economic: 'dashboards.economic',
  /** GET /api/dashboard/quality */
  quality: 'dashboards',
  /** GET /api/dashboard/operator */
  operator: 'dashboards',
  /** GET /api/dashboard/control-events */
  controlEvents: 'dashboards',
  /** GET /api/dashboard/audit */
  audit: 'dashboards.audit',
} as const satisfies Record<string, FeatureKey>;

export type DashboardData = keyof typeof DASHBOARD_DATA;

/** Блок внутри роли — то, что листают стрелки переключателя в шапке */
export interface DashboardBlock {
  key: BlockKey;
  label: string;
  /** Данные, которые запрашивает панель блока: без любого из них блок не показывается */
  data: readonly DashboardData[];
  /** Функции необязательных карточек: без них блок виден, а карточки нет (граф закупок у аудитора) */
  optional?: readonly FeatureKey[];
}

export interface DashboardRole {
  key: RoleKey;
  /** Заголовок панели (кнопка в шапке) */
  title: string;
  /** Название роли в окне выбора */
  name: string;
  /** Пояснение под названием в окне выбора */
  hint: string;
  /**
   * Пояснение, когда часть блоков или карточек роли недоступна: недоступное не упоминается.
   * Не задано — названия доступных блоков
   */
  partialHint?: string;
  blocks: DashboardBlock[];
  /** Есть ли у панелей роли выбор периода */
  hasDateRange: boolean;
  /** Кнопки «Фильтр» и «Куб» рядом с пилюлей дат (по умолчанию есть) */
  showTools?: boolean;
}

export const ROLES: readonly DashboardRole[] = [
  {
    key: 'top',
    title: 'Информационная панель (Топ-менеджмент)',
    name: 'Топ-менеджмент',
    hint: 'Экономический блок и показатели по предприятию',
    blocks: [
      { key: 'economic', label: 'Экономический блок', data: ['economic'] },
      { key: 'quality', label: 'Показатели', data: ['quality'] },
    ],
    hasDateRange: true,
  },
  {
    key: 'auditor',
    title: 'Информационная панель (Аудитор)',
    name: 'Аудитор',
    hint: 'Затраты, инциденты и граф закупок',
    partialHint: 'Затраты, инциденты и закупки с завышенной ценой',
    blocks: [{ key: 'auditor', label: 'Аудит', data: ['economic', 'quality', 'audit'], optional: ['dashboards.graph'] }],
    hasDateRange: true,
    showTools: false,
  },
  {
    key: 'purchasing',
    title: 'Информационная панель (Служба закупа): Инструментальный отдел',
    name: 'Служба закупа',
    hint: 'Инструментальный отдел',
    blocks: [{ key: 'purchasing', label: 'Инструментальный отдел', data: ['economic', 'quality', 'operator'] }],
    hasDateRange: false,
  },
  {
    key: 'shopHead',
    title: 'Информационная панель (Начальник цеха): Цех №1',
    name: 'Начальник цеха',
    hint: 'Цех №1',
    blocks: [{ key: 'shopHead', label: 'Цех №1', data: ['operator', 'quality'] }],
    hasDateRange: false,
  },
  {
    key: 'chiefController',
    title: 'Информационная панель (Главный контролер): Предприятие',
    name: 'Главный контролер',
    hint: 'Контроль качества по предприятию',
    blocks: [{ key: 'chiefController', label: 'Предприятие', data: ['controlEvents', 'quality'] }],
    hasDateRange: false,
  },
  {
    key: 'controller',
    title: 'Информационная панель (Контролер): Цех №1, Участок №2',
    name: 'Контролер',
    hint: 'Цех №1, Участок №2',
    blocks: [{ key: 'controller', label: 'Цех №1, Участок №2', data: ['controlEvents', 'quality'] }],
    hasDateRange: false,
  },
  {
    key: 'operator',
    title: 'Информационная панель (Оператор склада): Цех №1, Участок №2',
    name: 'Оператор склада',
    hint: 'Цех №1, Участок №2',
    blocks: [{ key: 'workshop', label: 'Цех №1, Участок №2', data: ['operator'] }],
    hasDateRange: false,
  },
];

export const DEFAULT_ROLE: RoleKey = 'top';

/** Проверка функции: включена ли она для пользователя (обычно isFeatureOn или снимок хранилища функций) */
export type FeatureCheck = (key: FeatureKey) => boolean;

/** Блок доступен: включены панели и функции всех его данных */
export const isBlockAvailable = (block: DashboardBlock, isOn: FeatureCheck): boolean =>
  isOn('dashboards') && block.data.every(data => isOn(DASHBOARD_DATA[data]));

/**
 * Роли главной с доступными блоками — в порядке ROLES. У роли остаются только доступные блоки, роль без них
 * не попадает в список. Пустой список — панелей у пользователя нет
 */
export const availableRoles = (isOn: FeatureCheck): DashboardRole[] => {
  const result: DashboardRole[] = [];
  for (const role of ROLES) {
    const blocks = role.blocks.filter(block => isBlockAvailable(block, isOn));
    if (blocks.length === 0) continue;
    const partial =
      blocks.length < role.blocks.length || blocks.some(block => (block.optional ?? []).some(key => !isOn(key)));
    result.push(
      partial ? { ...role, blocks, hint: role.partialHint ?? blocks.map(block => block.label).join(', ') } : role,
    );
  }
  return result;
};

/** Роль из списка по ключу (выбранная роль могла стать недоступной); нет такой — первая, список пуст — null */
export const pickRole = (roles: readonly DashboardRole[], key: RoleKey): DashboardRole | null =>
  roles.find(role => role.key === key) ?? roles[0] ?? null;
