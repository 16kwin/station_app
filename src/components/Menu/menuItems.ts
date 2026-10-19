// menuItems.ts — пункты нижнего меню и их связь с функциями установки (раздел 8.2 проекта «Дискретное
// отключение функций»). Пункт выключенной функции не показывается вовсе (скрыто, а не затенено); пункт
// «Безопасность» — только тем, кому сервер открыл страницу профиля безопасности (canViewSecurity).
// Иконки — в FloatingMenu.tsx: здесь только данные, их проверяет тест.
import type { FeatureKey } from '../../services/features/catalog';

export type MenuIcon =
  | 'main'
  | 'stations'
  | 'references'
  | 'documents'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'notifications'
  | 'security'
  | 'account'
  | 'sleep';

export interface MenuItem {
  path: string;
  label: string;
  icon: MenuIcon;
  isSleep?: boolean;
  /** Пункт показывается, только если функция включена */
  feature?: FeatureKey;
  /** Пункт показывается, только если доступна страница «Безопасность» */
  security?: boolean;
  /**
   * Какой раздел открыть вместо path. «Уведомления» — заглушка без раздела: раньше пункт открывал пустую
   * вкладку, а адрес /notifications уводил на /main (раздел 8.3 проекта). Теперь пункт сразу открывает «Главную»
   */
  opens?: { path: string; label: string };
}

export const MENU_ITEMS: readonly MenuItem[] = [
  { path: '/main', label: 'Главная', icon: 'main' },
  { path: '/stations', label: 'Станции', icon: 'stations' },
  { path: '/references', label: 'Справочники', icon: 'references' },
  { path: '/documents', label: 'Документы', icon: 'documents' },
  { path: '/reports', label: 'Отчеты', icon: 'reports', feature: 'stubs' },
  { path: '/analytics', label: 'Аналитика', icon: 'analytics', feature: 'orders' },
  { path: '/settings', label: 'Настройки', icon: 'settings', feature: 'stubs' },
  {
    path: '/notifications',
    label: 'Уведомления',
    icon: 'notifications',
    feature: 'stubs',
    opens: { path: '/main', label: 'Главная' },
  },
  { path: '/security', label: 'Безопасность', icon: 'security', security: true },
  { path: '/account', label: 'Аккаунт', icon: 'account' },
  { path: '', label: 'Спящий режим', icon: 'sleep', isSleep: true },
];

/** Пункты, которые видит пользователь: функция пункта включена, страница «Безопасность» — по canViewSecurity */
export const visibleMenuItems = (
  isOn: (key: FeatureKey) => boolean,
  canViewSecurity: boolean,
  items: readonly MenuItem[] = MENU_ITEMS,
): MenuItem[] => items.filter(item => (item.feature === undefined || isOn(item.feature)) && (!item.security || canViewSecurity));
