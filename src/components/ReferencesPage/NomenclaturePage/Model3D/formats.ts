// formats.ts — поддерживаемые форматы 3D-моделей, отказы с подсказкой для собственных форматов САПР
// и подсказки, как выгрузить модель из САПР. Белый список совпадает с сервером (NomenclatureModelFormats.java).
import type { ModelFormat, SceneMeta, UpAxis } from './types';

/** Предел размера файла модели — как на сервере */
export const MAX_MODEL_SIZE = 300 * 1024 * 1024;

const EXTENSIONS: Record<string, ModelFormat> = {
  glb: 'glb',
  gltf: 'gltf',
  stp: 'step',
  step: 'step',
  igs: 'iges',
  iges: 'iges',
  wrl: 'vrml',
  vrml: 'vrml',
  wrz: 'vrml',
  stl: 'stl',
  obj: 'obj',
  '3mf': '3mf',
  ply: 'ply',
  x3d: 'x3d',
  // Страница со сценой X3D (экспорт FreeCAD для X3DOM) разбирается как текст, HTML не исполняется
  xhtml: 'x3d',
  html: 'x3d',
  htm: 'x3d',
};

export const FORMAT_LABELS: Record<ModelFormat, string> = {
  glb: 'GLB',
  gltf: 'glTF',
  step: 'STEP',
  iges: 'IGES',
  vrml: 'VRML',
  stl: 'STL',
  obj: 'OBJ',
  '3mf': '3MF',
  ply: 'PLY',
  x3d: 'X3D',
};

/** Чипы «Поддерживаемые форматы» в пустом окне */
export const SUPPORTED_FORMATS = Object.values(FORMAT_LABELS);

const KOMPAS_HINT =
  'Это файл КОМПАС-3D: формат закрытый, браузер его не прочитает. Сохраните модель в КОМПАС-3D как STEP AP214 (*.stp) или VRML (*.wrl) и загрузите ещё раз.';
const TFLEX_HINT =
  'Это файл T-FLEX CAD: формат закрытый, браузер его не прочитает. Выгрузите модель из T-FLEX CAD в GLB (*.glb) или STEP (*.stp) и загрузите ещё раз.';
const DWG_HINT =
  'Чертежи DWG/DXF не открываются как 3D-модель. nanoCAD: экспорт в GLB или STEP; AutoCAD: экспорт в STL, STEP — через AutoCAD Mechanical.';
const STEP_HINT = 'Этот формат браузер не прочитает. Выгрузите модель из САПР в STEP (*.stp) или GLB (*.glb) и загрузите ещё раз.';

/** Собственные форматы САПР и частые ошибки выбора файла → что сделать */
const REJECTIONS: Record<string, string> = {
  a3d: KOMPAS_HINT,
  m3d: KOMPAS_HINT,
  cdw: 'Это чертёж КОМПАС-3D (2D), в нём нет 3D-модели. Откройте модель детали или сборки и сохраните её как STEP AP214 (*.stp) или VRML (*.wrl).',
  frw: 'Это фрагмент КОМПАС-3D (2D), в нём нет 3D-модели. Откройте модель детали или сборки и сохраните её как STEP AP214 (*.stp) или VRML (*.wrl).',
  grb: TFLEX_HINT,
  grs: TFLEX_HINT,
  dwg: DWG_HINT,
  dxf: DWG_HINT,
  sldprt: STEP_HINT,
  sldasm: STEP_HINT,
  ipt: STEP_HINT,
  iam: STEP_HINT,
  prt: STEP_HINT,
  asm: STEP_HINT,
  x_t: STEP_HINT,
  x_b: STEP_HINT,
  sat: STEP_HINT,
  jt: STEP_HINT,
  catpart: STEP_HINT,
  catproduct: STEP_HINT,
  f3d: STEP_HINT,
  '3dm': STEP_HINT,
  bin: 'Это буфер данных glTF, сам по себе он не открывается. Загрузите модель одним файлом GLB (*.glb) или glTF со встроенными данными.',
  mtl: 'Это файл материалов OBJ. Загрузите сам файл модели *.obj — цвета из *.mtl не используются.',
  zip: 'Архивы не принимаются: распакуйте архив и загрузите сам файл модели (GLB, STEP, VRML, STL…).',
};

/** Для поля выбора файла: поддерживаемые форматы и форматы САПР — на них пользователь получит подсказку */
export const FILE_ACCEPT = [...Object.keys(EXTENSIONS), 'a3d', 'm3d', 'cdw', 'grb', 'grs', 'dwg', 'dxf']
  .map(ext => `.${ext}`)
  .join(',');

/** Как выгрузить модель из САПР, которыми пользуются на заводах */
export const CAD_EXPORT_HINTS: { cad: string; how: string }[] = [
  { cad: 'КОМПАС-3D', how: 'Файл → Сохранить как → STEP AP214 (*.stp) или VRML (*.wrl)' },
  { cad: 'T-FLEX CAD', how: 'Файл → Экспорт → GLB (*.glb) или STEP (*.stp)' },
  { cad: 'nanoCAD', how: 'Экспорт → GLB (*.glb) или STEP (*.stp)' },
  { cad: 'AutoCAD', how: 'Экспорт → STL (*.stl); STEP — в AutoCAD Mechanical (команда STEPOUT)' },
];

/** Расширение без точки в нижнем регистре */
export const fileExtension = (fileName: string): string => {
  const name = fileName.replace(/\\/g, '/').split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
};

export type FormatCheck = { ok: true; format: ModelFormat } | { ok: false; message: string };

/** Проверка файла до чтения: формат, размер, пустой файл */
export const checkModelFile = (file: { name: string; size: number }): FormatCheck => {
  const ext = fileExtension(file.name);
  const format = EXTENSIONS[ext];
  if (!format) {
    const message =
      REJECTIONS[ext] ??
      (ext
        ? `Формат .${ext} не поддерживается. Поддерживаются: ${SUPPORTED_FORMATS.join(', ')}.`
        : `У файла нет расширения. Поддерживаются: ${SUPPORTED_FORMATS.join(', ')}.`);
    return { ok: false, message };
  }
  if (file.size === 0) return { ok: false, message: 'Файл пустой.' };
  if (file.size > MAX_MODEL_SIZE) {
    return { ok: false, message: 'Файл больше 300 МБ. Выгрузите из САПР облегчённую модель (меньше деталей или грубее сетка).' };
  }
  return { ok: true, format };
};

/** Вертикальная ось по умолчанию: в 3D-печати и сканах принята Z, в остальных форматах — Y */
export const defaultUpAxis = (format: ModelFormat): UpAxis => (format === 'stl' || format === '3mf' || format === 'ply' ? 'Z' : 'Y');

/** Единицы координат: STEP/IGES переводятся в мм, 3MF по умолчанию в мм, glTF по стандарту в метрах */
export const formatUnit = (format: ModelFormat): string => {
  if (format === 'step' || format === 'iges' || format === '3mf') return 'мм';
  if (format === 'glb' || format === 'gltf') return 'м';
  return '';
};

export const defaultMeta = (format: ModelFormat): SceneMeta => ({ sourceFormat: format, upAxis: defaultUpAxis(format), unit: formatUnit(format) });
