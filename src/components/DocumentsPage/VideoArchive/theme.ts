// theme.ts — цвета, тени и размеры страницы видеоархива. Значения — из общих элементов приложения:
// поля FormField, таблица DataTable, белые кнопки с тенью, модальные окна ConfigurationPopup.

export const FONT = "'Inter', sans-serif";

export const COLORS = {
  text: '#2D4059',
  muted: '#7B91B0',
  placeholder: '#A0A3BD',
  accent: '#666EFE',
  accentHover: '#5A61F0',
  /** Рамка заполненного поля — светлый оттенок акцента, как на макете */
  fieldBorder: '#B3B6FF',
  fieldBorderFocus: '#666EFE',
  error: '#EF4444',
  rec: '#FF3052',
  track: '#E7EAF2',
  rowBorder: '#E5ECF5',
  rowHover: '#F5F6FF',
  pageBg: '#FAFBFF',
  white: '#FFFFFF',
  ok: '#07B07B',
  okSoft: '#E6F8F1',
  errorSoft: '#FFECEF',
  overlay: 'rgba(0, 0, 0, 0.3)',
  hintBg: '#2B3445',
} as const;

export const SHADOWS = {
  card: '0 10px 40px rgba(226, 236, 249, 0.9)',
  button: '0 2px 8px rgba(0, 0, 0, 0.08)',
  buttonHover: '0 4px 14px rgba(102, 110, 254, 0.18)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
} as const;

/** Холст страницы — белый блок 1800×840 в MainLayout */
export const CANVAS = { width: 1800, height: 840 } as const;

/** Как часто опрашивать состояние записи, мс */
export const STATUS_POLL_MS = 2500;
