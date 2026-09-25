// roles.ts — роли главной страницы и их информационные панели.
// Роль выбирается в окне, которое открывается по клику на заголовок панели.

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

/** Блок внутри роли — то, что листают стрелки переключателя в шапке */
export interface DashboardBlock {
  key: BlockKey;
  label: string;
}

export interface DashboardRole {
  key: RoleKey;
  /** Заголовок панели (кнопка в шапке) */
  title: string;
  /** Название роли в окне выбора */
  name: string;
  /** Пояснение под названием в окне выбора */
  hint: string;
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
      { key: 'economic', label: 'Экономический блок' },
      { key: 'quality', label: 'Показатели' },
    ],
    hasDateRange: true,
  },
  {
    key: 'auditor',
    title: 'Информационная панель (Аудитор)',
    name: 'Аудитор',
    hint: 'Затраты, инциденты и граф закупок',
    blocks: [{ key: 'auditor', label: 'Аудит' }],
    hasDateRange: true,
    showTools: false,
  },
  {
    key: 'purchasing',
    title: 'Информационная панель (Служба закупа): Инструментальный отдел',
    name: 'Служба закупа',
    hint: 'Инструментальный отдел',
    blocks: [{ key: 'purchasing', label: 'Инструментальный отдел' }],
    hasDateRange: false,
  },
  {
    key: 'shopHead',
    title: 'Информационная панель (Начальник цеха): Цех №1',
    name: 'Начальник цеха',
    hint: 'Цех №1',
    blocks: [{ key: 'shopHead', label: 'Цех №1' }],
    hasDateRange: false,
  },
  {
    key: 'chiefController',
    title: 'Информационная панель (Главный контролер): Предприятие',
    name: 'Главный контролер',
    hint: 'Контроль качества по предприятию',
    blocks: [{ key: 'chiefController', label: 'Предприятие' }],
    hasDateRange: false,
  },
  {
    key: 'controller',
    title: 'Информационная панель (Контролер): Цех №1, Участок №2',
    name: 'Контролер',
    hint: 'Цех №1, Участок №2',
    blocks: [{ key: 'controller', label: 'Цех №1, Участок №2' }],
    hasDateRange: false,
  },
  {
    key: 'operator',
    title: 'Информационная панель (Оператор склада): Цех №1, Участок №2',
    name: 'Оператор склада',
    hint: 'Цех №1, Участок №2',
    blocks: [{ key: 'workshop', label: 'Цех №1, Участок №2' }],
    hasDateRange: false,
  },
];

export const DEFAULT_ROLE: RoleKey = 'top';

export const findRole = (key: RoleKey): DashboardRole => ROLES.find(role => role.key === key) ?? ROLES[0];
