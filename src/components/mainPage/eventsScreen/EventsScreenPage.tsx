// EventsScreenPage.tsx — «Экран событий текущего дня»: отдельная вкладка для второго монитора
// (/screen/events?source=…) с колонками «В работе» / «Завершено» и автообновлением раз в 30 секунд.
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, FONT, SHADOWS } from '../shared/layout';
import { formatDateTimeRu, isoToRu, toIso } from '../shared/format';
import { pollDayEvents } from './api';
import { DAY_SOURCE_NAMES, DEFAULT_DAY_SOURCE, isDaySource } from './types';
import type { DayEvent, DayEventTone, DayEventsData, DaySource } from './types';
import { CheckCircleIcon, CubeIcon, PartIcon } from './icons';

const PAGE_TITLE = 'Экран событий — AWMS';
const REFRESH_MS = 30_000;
const MINUTE_MS = 60_000;
/** Окно у́же 1400 px — колонка «исполнитель» скрывается, исполнитель уходит строкой под время */
const WIDE_QUERY = '(min-width: 1400px)';

const PAGE_BG = '#F7F9FC';
const CONTENT_MAX_WIDTH = 1600;
const PAGE_PADDING = 40;
const DIVIDER_COLOR = '#D8DEE9';
const ROW_BORDER = '1px solid #EEF2F8';
const ROW_MIN_HEIGHT = 72;
const BADGE_SIZE = 44;
/** Колонка «исполнитель»: 220 на широком мониторе; до ~2000 px окна у́же, иначе сжимается название */
const PERSON_WIDTH = 'clamp(160px, 11vw, 220px)';
/** Подсветка строки, появившейся при автообновлении, и её прозрачный конец */
const HIGHLIGHT_BG = 'rgba(102, 110, 254, 0.14)';
const HIGHLIGHT_CLEAR = 'rgba(102, 110, 254, 0)';
const SCROLLBAR_COLOR = '#C9D3E3';
/** Плавное торможение въезда строк (ease-out quint) */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Цвет плашки источника */
const SOURCE_COLORS: Record<DaySource, string> = {
  operator: COLORS.accent,
  control: COLORS.purple,
  release: COLORS.peach,
  overpriced: COLORS.accent,
};

/** Плашка статуса: текст и фон по тону */
const TONE_STYLES: Record<DayEventTone, { color: string; background: string }> = {
  progress: { color: '#06B77A', background: 'rgba(7, 224, 152, 0.14)' },
  success: { color: COLORS.accentBorder, background: 'rgba(102, 110, 254, 0.12)' },
  danger: { color: COLORS.roseDark, background: 'rgba(255, 92, 119, 0.14)' },
};

/* ---------- Внешние хранилища: часы и ширина окна (без setState в эффектах) ---------- */

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** Дата и минута по часам компьютера 'YYYY-MM-DDTHH:MM' — снимок хранилища часов */
const readMinuteStamp = (): string => {
  const now = new Date();
  return `${toIso(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

/** Часы будят React сразу после начала каждой новой минуты */
const subscribeMinute = (onTick: () => void): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer = setTimeout(() => {
      onTick();
      schedule();
    }, MINUTE_MS - (Date.now() % MINUTE_MS) + 50);
  };
  schedule();
  return () => clearTimeout(timer);
};

const subscribeViewport = (onChange: () => void): (() => void) => {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const readWideViewport = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/** Без окна (SSR-проверка) экран считается широким */
const readWideOnServer = (): boolean => true;

/** Время последнего успешного обновления 'ЧЧ:ММ:СС' */
const readTimeOfDay = (): string => {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
};

/** Ширина колонки статуса — по самой длинной подписи (≈8 px на символ 13px/500 + поля 12+12), 96…200 */
const statusColumnWidth = (data: DayEventsData | null): number => {
  let longest = 0;
  for (const item of data?.inWork ?? []) longest = Math.max(longest, item.status.length);
  for (const item of data?.done ?? []) longest = Math.max(longest, item.status.length);
  return Math.min(200, Math.max(96, longest * 8 + 24));
};

/* ---------- Стили ---------- */

const PAGE_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10,
  overflow: 'hidden',
  backgroundColor: PAGE_BG,
  fontFamily: FONT,
  color: COLORS.text,
  userSelect: 'none',
};

const CONTENT_STYLE: React.CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxWidth: CONTENT_MAX_WIDTH + PAGE_PADDING * 2,
  margin: '0 auto',
  padding: PAGE_PADDING,
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  columnGap: 24,
  flexShrink: 0,
  marginBottom: 28,
};

const BOARD_STYLE: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 1px minmax(0, 1fr)',
  gridTemplateRows: 'minmax(0, 1fr)',
  columnGap: 32,
};

const COLUMN_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 };

const COLUMN_TITLE_STYLE: React.CSSProperties = {
  flexShrink: 0,
  margin: '0 0 12px',
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '17px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
};

const LIST_STYLE: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${SCROLLBAR_COLOR} transparent`,
  scrollbarGutter: 'stable',
};

const LIST_NOTE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 40,
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: 15,
  lineHeight: '18px',
  color: COLORS.textMuted,
  pointerEvents: 'none',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  minHeight: ROW_MIN_HEIGHT,
  padding: '12px 8px',
  boxSizing: 'border-box',
  borderBottom: ROW_BORDER,
};

const BADGE_STYLE: React.CSSProperties = {
  width: BADGE_SIZE,
  height: BADGE_SIZE,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

/** Две строки и многоточие: длинные названия не раздвигают колонку */
const TWO_LINES: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
};

const TITLE_STYLE: React.CSSProperties = { ...TWO_LINES, fontSize: 16, fontWeight: 500, lineHeight: '20px', color: COLORS.text };

const TIME_STYLE: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  lineHeight: '16px',
  color: COLORS.textMuted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const PERSON_LINE_STYLE: React.CSSProperties = {
  marginTop: 3,
  fontSize: 14,
  lineHeight: '17px',
  color: COLORS.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const PERSON_CELL_STYLE: React.CSSProperties = {
  ...TWO_LINES,
  width: PERSON_WIDTH,
  flexShrink: 0,
  marginLeft: 8,
  fontSize: 15,
  lineHeight: '19px',
  color: COLORS.text,
};

const PILL_STYLE: React.CSSProperties = {
  display: 'inline-block',
  maxWidth: '100%',
  boxSizing: 'border-box',
  verticalAlign: 'middle',
  padding: '5px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/* ---------- Части экрана ---------- */

type ViewStatus = 'loading' | 'ready' | 'error';

/** rise — первая загрузка: строки въезжают снизу; highlight — строки автообновления подсвечиваются */
type RowEntrance = 'rise' | 'highlight';

const SourceIcon: React.FC<{ source: DaySource }> = ({ source }) => {
  switch (source) {
    case 'control':
      return <PartIcon />;
    case 'release':
      return <CheckCircleIcon />;
    default:
      return <CubeIcon />;
  }
};

const StatusPill: React.FC<{ status: string; tone: DayEventTone }> = ({ status, tone }) => {
  if (!status) return null;
  const palette = TONE_STYLES[tone];
  return (
    <span title={status} style={{ ...PILL_STYLE, color: palette.color, backgroundColor: palette.background }}>
      {status}
    </span>
  );
};

interface EventRowProps {
  item: DayEvent;
  index: number;
  source: DaySource;
  entrance: RowEntrance;
  wide: boolean;
  statusWidth: number;
}

/**
 * Строка события. Анимация задаётся при появлении строки (ключ — id): на первой загрузке въезд снизу
 * с шагом 40 мс, при автообновлении — раскрытие по высоте и подсветка фона на 1.5 с; ушедшая строка
 * гаснет и схлопывается (exit внутри AnimatePresence колонки).
 */
const EventRow: React.FC<EventRowProps> = ({ item, index, source, entrance, wide, statusWidth }) => {
  const rise = entrance === 'rise';
  return (
    <motion.div
      initial={
        rise
          ? { opacity: 0, y: 28, height: 'auto', backgroundColor: HIGHLIGHT_CLEAR }
          : { opacity: 0, y: 0, height: 0, backgroundColor: HIGHLIGHT_BG }
      }
      animate={{ opacity: 1, y: 0, height: 'auto', backgroundColor: HIGHLIGHT_CLEAR }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
      transition={{
        default: { duration: 0.45, ease: EASE_OUT, delay: rise ? Math.min(index, 15) * 0.04 : 0 },
        // Подсветка держится полсекунды и гаснет за секунду — всего 1.5 с
        backgroundColor: { duration: 1, delay: 0.5, ease: 'easeOut' },
      }}
      style={{ overflow: 'hidden', borderRadius: 10 }}
    >
      <div style={ROW_STYLE}>
        <div style={{ ...BADGE_STYLE, backgroundColor: SOURCE_COLORS[source] }}>
          <SourceIcon source={source} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div title={item.title} style={TITLE_STYLE}>
            {item.title}
          </div>
          <div style={TIME_STYLE}>{formatDateTimeRu(item.at)}</div>
          {!wide && item.person && <div style={PERSON_LINE_STYLE}>{item.person}</div>}
        </div>
        {wide && (
          <div title={item.person} style={PERSON_CELL_STYLE}>
            {item.person}
          </div>
        )}
        <div style={{ width: statusWidth, flexShrink: 0 }}>
          <StatusPill status={item.status} tone={item.tone} />
        </div>
      </div>
    </motion.div>
  );
};

/** Серый текст в пустой колонке; проявляется с задержкой, чтобы не мигать при быстром ответе */
const ListNote: React.FC<{ text: string }> = ({ text }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.35 }} style={LIST_NOTE_STYLE}>
    {text}
  </motion.div>
);

interface EventsColumnProps {
  label: string;
  /** null — первый ответ ещё не пришёл */
  items: DayEvent[] | null;
  source: DaySource;
  entrance: RowEntrance;
  wide: boolean;
  statusWidth: number;
}

const EventsColumn: React.FC<EventsColumnProps> = ({ label, items, source, entrance, wide, statusWidth }) => (
  <section aria-label={label} style={COLUMN_STYLE}>
    <h2 style={COLUMN_TITLE_STYLE}>{items ? `${label} · ${items.length}` : label}</h2>
    <div style={LIST_STYLE}>
      <AnimatePresence>
        {(items ?? []).map((item, index) => (
          <EventRow
            key={item.id}
            item={item}
            index={index}
            source={source}
            entrance={entrance}
            wide={wide}
            statusWidth={statusWidth}
          />
        ))}
      </AnimatePresence>
      {items === null && <ListNote text="Загрузка…" />}
      {items !== null && items.length === 0 && <ListNote text="Нет событий" />}
    </div>
  </section>
);

/** Плашка «нет связи»: на экране остаются данные последнего успешного ответа */
const OfflineBadge: React.FC = () => (
  <motion.div
    role="status"
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 8,
      backgroundColor: 'rgba(255, 92, 119, 0.12)',
      color: COLORS.roseDark,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: '16px',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.rose, flexShrink: 0 }} />
    Нет связи с сервером, повтор через 30 с
  </motion.div>
);

/** Первая загрузка не удалась: текст по центру и «Повторить» */
const LoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div
    style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      paddingBottom: 60,
    }}
  >
    <div style={{ fontSize: 18, fontWeight: 500, lineHeight: '22px', color: COLORS.text }}>Не удалось загрузить события</div>
    <button
      type="button"
      onClick={onRetry}
      style={{
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        padding: '10px 28px',
        borderRadius: 10,
        backgroundColor: COLORS.accent,
        boxShadow: SHADOWS.datePill,
        color: COLORS.white,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 500,
        lineHeight: '18px',
      }}
    >
      Повторить
    </button>
  </div>
);

interface EventsScreenViewProps {
  source: DaySource;
  /** Данные последнего успешного ответа */
  data: DayEventsData | null;
  /** loading — первый ответ ещё не пришёл; error — первая загрузка не удалась */
  status: ViewStatus;
  /** Последнее обновление не удалось — показываем плашку «нет связи» поверх старых данных */
  offline: boolean;
  entrance: RowEntrance;
  /** Часы 'ЧЧ:ММ' */
  clock: string;
  /** Дата компьютера 'YYYY-MM-DD' — для подзаголовка, пока сервер не прислал свою */
  today: string;
  /** Время последнего успешного обновления 'ЧЧ:ММ:СС' */
  updatedAt: string | null;
  /** Окно не у́же 1400 px — у исполнителя своя колонка */
  wide: boolean;
  onRetry: () => void;
}

/** Вид экрана целиком — без запросов и таймеров (его же рендерит SSR-проверка на фикстурах) */
export const EventsScreenView: React.FC<EventsScreenViewProps> = ({
  source,
  data,
  status,
  offline,
  entrance,
  clock,
  today,
  updatedAt,
  wide,
  onRetry,
}) => {
  const sourceName = data?.sourceName || DAY_SOURCE_NAMES[source];
  const dateRu = isoToRu(data?.date || today);
  const statusWidth = statusColumnWidth(data);
  const updatedLabel = updatedAt ? `Обновлено в ${updatedAt}` : '';

  return (
    <div style={PAGE_STYLE}>
      <div style={CONTENT_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={{ justifySelf: 'start', minWidth: 0 }}>
            <AnimatePresence>{offline && <OfflineBadge key="offline" />}</AnimatePresence>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '30px', color: COLORS.text }}>
              Экран событий текущего дня
            </h1>
            <div style={{ marginTop: 4, fontSize: 15, lineHeight: '18px', color: COLORS.textMuted }}>{`${sourceName} · ${dateRu}`}</div>
          </div>
          <div style={{ justifySelf: 'end', textAlign: 'right' }}>
            <div style={{ fontSize: 40, fontWeight: 600, lineHeight: '44px', color: COLORS.text, fontVariantNumeric: 'tabular-nums' }}>
              {clock}
            </div>
            <div style={{ marginTop: 2, minHeight: 16, fontSize: 13, lineHeight: '16px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
              {updatedLabel}
            </div>
          </div>
        </header>

        {status === 'error' ? (
          <LoadError onRetry={onRetry} />
        ) : (
          <div style={BOARD_STYLE}>
            <EventsColumn
              label="В работе"
              items={data ? data.inWork : null}
              source={source}
              entrance={entrance}
              wide={wide}
              statusWidth={statusWidth}
            />
            <div style={{ backgroundColor: DIVIDER_COLOR }} />
            <EventsColumn
              label="Завершено"
              items={data ? data.done : null}
              source={source}
              entrance={entrance}
              wide={wide}
              statusWidth={statusWidth}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Экран с данными ---------- */

/** Последние полученные данные и признаки обновления */
interface ScreenState {
  data: DayEventsData | null;
  /** Сколько раз данные пришли успешно: 1 — первая загрузка */
  loads: number;
  updatedAt: string | null;
  /** Последний запрос не удался */
  failed: boolean;
}

const INITIAL_SCREEN: ScreenState = { data: null, loads: 0, updatedAt: null, failed: false };

const EventsScreen: React.FC<{ source: DaySource }> = ({ source }) => {
  const [screen, setScreen] = useState<ScreenState>(INITIAL_SCREEN);
  const [requestSeq, setRequestSeq] = useState(0); // номер цикла загрузки: +1 по кнопке «Повторить»
  const [settledSeq, setSettledSeq] = useState(-1); // цикл, первый ответ которого уже пришёл
  const minuteStamp = useSyncExternalStore(subscribeMinute, readMinuteStamp, readMinuteStamp);
  const wide = useSyncExternalStore(subscribeViewport, readWideViewport, readWideOnServer);

  // Автообновление: запрос сразу и каждые 30 с, очистка снимает интервал и отменяет запрос.
  // setState — только в колбэках ответа, не в теле эффекта. «Повторить» перезапускает цикл
  useEffect(
    () =>
      pollDayEvents(source, REFRESH_MS, {
        onData: data => {
          const updatedAt = readTimeOfDay();
          setScreen(prev => ({ data, loads: prev.loads + 1, updatedAt, failed: false }));
          setSettledSeq(requestSeq);
        },
        onError: () => {
          setScreen(prev => ({ ...prev, failed: true }));
          setSettledSeq(requestSeq);
        },
      }),
    [source, requestSeq],
  );

  // Ошибку первой загрузки показываем, только пока не нажали «Повторить» (тогда снова «загрузка»)
  const cycleSettled = settledSeq === requestSeq;
  const status: ViewStatus = screen.data ? 'ready' : screen.failed && cycleSettled ? 'error' : 'loading';

  return (
    <EventsScreenView
      source={source}
      data={screen.data}
      status={status}
      offline={screen.data !== null && screen.failed}
      entrance={screen.loads > 1 ? 'highlight' : 'rise'}
      clock={minuteStamp.slice(11, 16)}
      today={minuteStamp.slice(0, 10)}
      updatedAt={screen.updatedAt}
      wide={wide}
      onRetry={() => setRequestSeq(seq => seq + 1)}
    />
  );
};

/** Страница маршрута /screen/events?source=… (открывается в новой вкладке, без меню приложения) */
const EventsScreenPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('source');
  const source: DaySource = isDaySource(requested) ? requested : DEFAULT_DAY_SOURCE;

  // Заголовок вкладки, пока открыт экран; при уходе возвращаем прежний
  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  // Другой источник в адресе — новый экран с чистым состоянием (ключ), без сброса состояния в эффекте
  return <EventsScreen key={source} source={source} />;
};

export default EventsScreenPage;
