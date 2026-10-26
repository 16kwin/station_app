// CoreStartPage.tsx — стартовая страница ядра: главная, когда информационных панелей нет (функция dashboards
// выключена на установке или панели недоступны роли пользователя, раздел 4.2 проекта «Дискретное отключение
// функций»). Нейтральная: только разделы ядра учёта (раздел 4.4), без запросов к серверу и без упоминания
// выключенного. Холст тот же, что у панелей (1800×840): белый блок главной не меняет размер.
import React from 'react';
import { useTabs } from '../../context/TabContext';
import { CANVAS, COLORS, FONT, SHADOWS } from './shared/layout';
import StationsIcon from '../../assets/Menu/2.svg';
import ReferencesIcon from '../../assets/Menu/3.svg';
import DocumentsIcon from '../../assets/Menu/4.svg';
import AccountIcon from '../../assets/Menu/9.svg';

interface StartLink {
  /** Раздел ядра (routes.ts, CORE_ROUTES) */
  path: string;
  /** Подпись вкладки — как у меню и раздела «Справочники» */
  tabLabel: string;
  title: string;
  text: string;
  /** Белая иконка меню на цветной плашке */
  icon: string;
  iconWidth: number;
  iconHeight: number;
  color: string;
}

/** Разделы ядра — как пункты меню */
const SECTIONS: readonly StartLink[] = [
  {
    path: '/stations',
    tabLabel: 'Станции',
    title: 'Станции',
    text: 'Панель управления станциями: состояние, ячейки и остатки',
    icon: StationsIcon,
    iconWidth: 24,
    iconHeight: 24,
    color: COLORS.accent,
  },
  {
    path: '/references',
    tabLabel: 'Справочники',
    title: 'Справочники',
    text: 'Номенклатура, поставщики, производители, станции и расположения',
    icon: ReferencesIcon,
    iconWidth: 22,
    iconHeight: 24,
    color: COLORS.tealDark,
  },
  {
    path: '/documents',
    tabLabel: 'Документы',
    title: 'Документы',
    text: 'Пополнение, контроль уровня остатков и заказы на перемещение',
    icon: DocumentsIcon,
    iconWidth: 20,
    iconHeight: 24,
    color: COLORS.amber,
  },
  {
    path: '/account',
    tabLabel: 'Аккаунт',
    title: 'Аккаунт',
    text: 'Учётная запись пользователя',
    icon: AccountIcon,
    iconWidth: 24,
    iconHeight: 24,
    color: COLORS.violet,
  },
];

/** Частые документы и справочники ядра */
const SHORTCUTS: readonly StartLink[] = [
  {
    path: '/references/nomenclature',
    tabLabel: 'Справочник: Номенклатура',
    title: 'Номенклатура',
    text: 'Справочник',
    icon: ReferencesIcon,
    iconWidth: 22,
    iconHeight: 24,
    color: COLORS.tealDark,
  },
  {
    path: '/references/templates',
    tabLabel: 'Справочник: Шаблоны пополнения',
    title: 'Шаблоны пополнения',
    text: 'Справочник',
    icon: ReferencesIcon,
    iconWidth: 22,
    iconHeight: 24,
    color: COLORS.tealDark,
  },
  {
    path: '/documents/refill',
    tabLabel: 'Документ: Пополнение',
    title: 'Пополнение',
    text: 'Документ',
    icon: DocumentsIcon,
    iconWidth: 20,
    iconHeight: 24,
    color: COLORS.amber,
  },
  {
    path: '/documents/stock-level-control',
    tabLabel: 'Документ: Контроль уровня остатков',
    title: 'Контроль уровня остатков',
    text: 'Документ',
    icon: DocumentsIcon,
    iconWidth: 20,
    iconHeight: 24,
    color: COLORS.amber,
  },
];

// Геометрия в координатах холста 1800×840 — как у панелей: поля 40, промежуток между карточками 30
const SIDE = 40;
const GAP = 30;
const HEADER_HEIGHT = 107;
const TITLE_HEIGHT = 54;
const SECTION_TOP = 137;
const SECTION_HEIGHT = 360;
const SECTION_WIDTH = (CANVAS.width - SIDE * 2 - GAP * (SECTIONS.length - 1)) / SECTIONS.length;
const SHORTCUTS_TOP = SECTION_TOP + SECTION_HEIGHT + GAP;
const SHORTCUTS_HEIGHT = CANVAS.height - SIDE - SHORTCUTS_TOP;
const SHORTCUT_GAP = 20;
const CARD_PADDING = 28;

/** Подсветка карточки-кнопки при наведении — как у кликабельных строк лент */
const HOVER_BG = '#F5F7FD';

const CSS = `
.awms-start-link { transition: background-color 0.15s ease; }
.awms-start-link:hover { background-color: ${HOVER_BG} !important; }
.awms-start-link:focus-visible { outline: 2px solid ${COLORS.accent}; outline-offset: 2px; }
`;

const Plaque: React.FC<{ link: StartLink; size: number; radius: number; scale: number }> = ({ link, size, radius, scale }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      backgroundColor: link.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <img src={link.icon} alt="" draggable={false} style={{ width: link.iconWidth * scale, height: link.iconHeight * scale }} />
  </span>
);

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke={COLORS.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const linkButton: React.CSSProperties = {
  border: 'none',
  backgroundColor: COLORS.white,
  cursor: 'pointer',
  outline: 'none',
  textAlign: 'left',
  fontFamily: FONT,
  boxSizing: 'border-box',
};

const CoreStartPage: React.FC = () => {
  const { openTab } = useTabs();
  const open = (link: StartLink) => openTab(link.path, link.tabLabel, null);
  const shortcutWidth = (CANVAS.width - SIDE * 2 - CARD_PADDING * 2 - SHORTCUT_GAP * (SHORTCUTS.length - 1)) / SHORTCUTS.length;

  return (
    <div style={{ position: 'relative', width: CANVAS.width, height: CANVAS.height, fontFamily: FONT, userSelect: 'none' }}>
      <style>{CSS}</style>

      {/* Шапка — как у панелей: заголовок слева на полосе высотой 107 */}
      <div
        style={{
          position: 'absolute',
          left: SIDE,
          top: (HEADER_HEIGHT - TITLE_HEIGHT) / 2,
          height: TITLE_HEIGHT,
          padding: '0 20px',
          borderRadius: 15,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '29px', color: COLORS.text, whiteSpace: 'nowrap' }}>Главная</h1>
        <span style={{ fontSize: 16, fontWeight: 500, lineHeight: '19px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
          Разделы системы учёта
        </span>
      </div>

      {/* Разделы ядра */}
      {SECTIONS.map((link, index) => (
        <button
          key={link.path}
          type="button"
          className="awms-start-link"
          onClick={() => open(link)}
          style={{
            ...linkButton,
            position: 'absolute',
            left: SIDE + index * (SECTION_WIDTH + GAP),
            top: SECTION_TOP,
            width: SECTION_WIDTH,
            height: SECTION_HEIGHT,
            padding: 32,
            borderRadius: 15,
            boxShadow: SHADOWS.card,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Plaque link={link} size={72} radius={18} scale={1.35} />
          <span style={{ marginTop: 32, fontSize: 24, fontWeight: 600, lineHeight: '29px', color: COLORS.text }}>{link.title}</span>
          <span style={{ marginTop: 12, fontSize: 16, fontWeight: 500, lineHeight: '22px', color: COLORS.textMuted }}>{link.text}</span>
          <span
            style={{
              marginTop: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              lineHeight: '18px',
              color: COLORS.accent,
            }}
          >
            Открыть
            <ArrowIcon />
          </span>
        </button>
      ))}

      {/* Быстрый переход: частые документы и справочники */}
      <div
        style={{
          position: 'absolute',
          left: SIDE,
          top: SHORTCUTS_TOP,
          width: CANVAS.width - SIDE * 2,
          height: SHORTCUTS_HEIGHT,
          borderRadius: 15,
          backgroundColor: COLORS.white,
          boxShadow: SHADOWS.card,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', left: CARD_PADDING, top: 22, fontSize: 17, fontWeight: 500, lineHeight: '21px', color: COLORS.text }}>
          Быстрый переход
        </div>
        {SHORTCUTS.map((link, index) => (
          <button
            key={link.path}
            type="button"
            className="awms-start-link"
            onClick={() => open(link)}
            style={{
              ...linkButton,
              position: 'absolute',
              left: CARD_PADDING + index * (shortcutWidth + SHORTCUT_GAP),
              top: 70,
              width: shortcutWidth,
              bottom: CARD_PADDING,
              padding: '0 24px',
              borderRadius: 12,
              border: '1.5px solid #E5ECF5',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <Plaque link={link} size={52} radius={13} scale={1} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '22px', color: COLORS.text }}>{link.title}</span>
              <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '17px', color: COLORS.textMuted }}>{link.text}</span>
            </span>
            <ArrowIcon />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoreStartPage;
