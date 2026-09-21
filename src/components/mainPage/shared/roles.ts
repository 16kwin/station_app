// roles.ts — роли главной страницы и их информационные панели.
// Роль выбирается в окне, которое открывается по клику на заголовок панели.

export type RoleKey = 'top' | 'operator';

/** Ключ информационной панели внутри роли */
export type BlockKey = 'economic' | 'quality' | 'workshop';

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
