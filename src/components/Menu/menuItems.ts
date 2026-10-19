// menuItems.ts — пункты нижнего меню и их связь с функциями установки (раздел 8.2 проекта «Дискретное
// отключение функций»). Пункт выключенной функции не показывается вовсе (скрыто, а не затенено); пункт
// «Безопасность» — только тем, кому сервер открыл страницу профиля безопасности (canViewSecurity).
// Здесь же — строки выплывающих окон пунктов (поле popup): в окне только разделы, которые можно открыть.
// Иконки — в FloatingMenu.tsx: здесь только данные, их проверяет тест.
import type { FeatureKey } from '../../services/features/catalog';
import { isPathAllowed } from '../../services/features/routes';
import { DOCUMENT_BUTTONS, type DocumentButton } from '../DocumentsPage/documentButtons';

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

/** Выплывающее окно пункта: справочники, документы или «В разработке» */
export type MenuPopup = 'references' | 'documents' | 'dev';

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
  /**
   * Окно, которое выплывает над меню при наведении на пункт. Окно привязано к полю пункта, а не к его номеру:
   * номера сдвигаются, когда пункты выключенных функций скрыты
   */
  popup?: MenuPopup;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  { path: '/main', label: 'Главная', icon: 'main' },
  { path: '/stations', label: 'Станции', icon: 'stations' },
  { path: '/references', label: 'Справочники', icon: 'references', popup: 'references' },
  { path: '/documents', label: 'Документы', icon: 'documents', popup: 'documents' },
  { path: '/reports', label: 'Отчеты', icon: 'reports', feature: 'stubs', popup: 'dev' },
  { path: '/analytics', label: 'Аналитика', icon: 'analytics', feature: 'orders' },
  { path: '/settings', label: 'Настройки', icon: 'settings', feature: 'stubs', popup: 'dev' },
  {
    path: '/notifications',
    label: 'Уведомления',
    icon: 'notifications',
    feature: 'stubs',
    opens: { path: '/main', label: 'Главная' },
    popup: 'dev',
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

/** Строка окна — как кнопка страницы раздела: путь вкладки, подпись вкладки и текст строки */
export type PopupLink = DocumentButton;

/** Справочник: подпись вкладки — как у кнопки страницы «Справочники» (ReferencesPage.tsx) */
const reference = (path: string, text: string): PopupLink => ({ path, label: `Справочник: ${text}`, text });

/**
 * Строки окна «Справочники» — справочники страницы «Справочники» (ReferencesPage.tsx) с теми же подписями
 * вкладок, в порядке прежнего окна
 */
export const REFERENCE_LINKS: readonly PopupLink[] = [
  reference('/references/locations', 'Расположения'),
  reference('/references/holdings', 'Холдинги'),
  reference('/references/nomenclature', 'Номенклатура'),
  reference('/references/templates', 'Шаблоны пополнения'),
  reference('/references/accounting-groups', 'Группы учета'),
  reference('/references/nomenclature-groups', 'Группы номенклатуры'),
  reference('/references/nomenclature-types', 'Виды номенклатуры'),
  reference('/references/attribute-groups', 'Группы характеристик'),
  reference('/references/attribute-types', 'Виды характеристик'),
  reference('/references/units', 'Единицы измерения характеристик'),
  reference('/references/nomenclature-units', 'Единицы измерения'),
  reference('/references/production-directions', 'Направления производства'),
  reference('/references/manufacturers', 'Производители'),
  reference('/references/brands', 'Бренды'),
  reference('/references/models', 'Модели'),
  reference('/references/countries', 'Страны'),
  reference('/references/suppliers', 'Поставщики'),
  reference('/references/enterprises', 'Предприятия'),
  reference('/references/workshops', 'Цеха'),
  reference('/references/sections', 'Участки'),
  reference('/references/employees', 'Сотрудники'),
  reference('/references/station-types', 'Типы станций'),
  reference('/references/station-manufacturers', 'Производители станций'),
  reference('/references/station-models', 'Модели станций'),
  reference('/references/station-configurations', 'Конфигурации станций'),
  reference('/references/stations', 'Станции'),
  reference('/references/supplier-directions', 'Направления поставщиков'),
  reference('/references/supplier-brands', 'Бренды поставщиков'),
];

/** Строки окон; «Документы» — тот же список, что на странице «Документы»; у окна «В разработке» строк нет */
const POPUP_LINKS: Record<MenuPopup, readonly PopupLink[]> = {
  references: REFERENCE_LINKS,
  documents: DOCUMENT_BUTTONS,
  dev: [],
};

/** Строки окна, которые пользователь может открыть: раздел ядра или включённой функции (как DocumentsPage.tsx) */
export const popupLinks = (popup: MenuPopup, isOn: (key: FeatureKey) => boolean): PopupLink[] =>
  POPUP_LINKS[popup].filter(link => isPathAllowed(link.path, isOn));
