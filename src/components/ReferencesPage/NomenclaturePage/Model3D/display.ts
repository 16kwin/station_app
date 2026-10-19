// display.ts — подписи окна «3D-модель»: размер файла, дата, число треугольников, габариты, этапы подготовки.
import type { ConvertStage } from './types';

/** 4,2 МБ · 820 КБ · 1,1 ГБ */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ['КБ', 'МБ', 'ГБ'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
};

/** Дата сервера без часового пояса «2026-10-13T14:05:31.123» → «13.10.2026 14:05» */
export const formatDate = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day, hours, minutes] = match;
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const plural = (value: number, one: string, few: string, many: string): string => {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

/** «124 620 треугольников» */
export const formatTriangles = (value: number): string =>
  `${Math.round(value).toLocaleString('ru-RU')} ${plural(Math.round(value), 'треугольник', 'треугольника', 'треугольников')}`;

/** Коротко для карточки: «124,6 тыс. треуг.», «1,2 млн треуг.» */
export const formatTrianglesShort = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн треуг.`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс. треуг.`;
  return `${value} треуг.`;
};

const formatLength = (value: number): string => {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 1 : abs >= 1 ? 2 : 3;
  return value.toLocaleString('ru-RU', { maximumFractionDigits: digits });
};

/** Габариты по осям файла: «78,7 × 269,9 × 255,4 мм» */
export const formatDimensions = (size: { x: number; y: number; z: number }, unit: string): string =>
  `${formatLength(size.x)} × ${formatLength(size.y)} × ${formatLength(size.z)}${unit ? ` ${unit}` : ''}`;

export type JobStage = ConvertStage | 'upload' | 'download';

export const STAGE_LABELS: Record<JobStage, string> = {
  read: 'Чтение файла',
  parse: 'Разбор модели',
  occt: 'Построение сетки по STEP/IGES',
  merge: 'Объединение деталей',
  export: 'Сохранение копии для просмотра',
  upload: 'Отправка на сервер',
  download: 'Загрузка модели',
};

/** «Отправка на сервер · 45%» */
export const stageText = (stage: JobStage, ratio: number | null): string =>
  ratio !== null && ratio > 0 && ratio < 1 ? `${STAGE_LABELS[stage]} · ${Math.round(ratio * 100)}%` : STAGE_LABELS[stage];
