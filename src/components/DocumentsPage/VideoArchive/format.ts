// format.ts — даты и длительности в форматах макета видеоархива

const pad = (value: number, size = 2): string => String(Math.floor(value)).padStart(size, '0');

/** Разбор ISO-даты сервера без сдвига часового пояса: '2026-09-30T13:15:44' */
export const parseServerDate = (iso: string): Date => {
  const [datePart, timePart = '00:00:00'] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ssRaw] = timePart.split(':');
  const ss = Number.parseFloat(ssRaw ?? '0');
  return new Date(y, m - 1, d, Number(hh), Number(mm), Math.floor(ss), Math.round((ss % 1) * 1000));
};

/** Таблица журнала: «2026.09.30 12:00» */
export const formatTableDate = (iso: string): string => {
  const date = parseServerDate(iso);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Плеер: «30.09.2026 13:15:44» */
export const formatDateTime = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

/** Заголовок плеера: «30.09.2026» */
export const formatDate = (date: Date): string => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

/** Таблица журнала: «01:28», с часами — «1:01:28» */
export const formatShortDuration = (seconds: number | null | undefined): string => {
  const total = Math.max(0, Math.round(seconds ?? 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** Плеер: «00:02:19» */
export const formatClock = (seconds: number | null | undefined): string => {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  return `${pad(total / 3600)}:${pad((total % 3600) / 60)}:${pad(total % 60)}`;
};

/** Номер видеозаписи: 1 → «001» */
export const formatRecordNumber = (value: number): string => pad(value, 3);
