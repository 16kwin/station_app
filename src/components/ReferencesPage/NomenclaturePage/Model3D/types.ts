// types.ts — типы окна «3D-модель»: модель с сервера, сообщения воркера конвертации, сведения о сцене.

/** Формат исходника — как на сервере (NomenclatureModelFormats.java) */
export type ModelFormat = 'glb' | 'gltf' | 'step' | 'iges' | 'vrml' | 'stl' | 'obj' | '3mf' | 'ply' | 'x3d';

/** 3D-модель номенклатуры (MaterialModelDTO) */
export interface NomenclatureModel {
  uid: string;
  materialUid: string;
  originalName: string;
  format: ModelFormat;
  fileSize: number;
  /** Есть копия GLB для просмотра; без неё просмотр готовит её из исходника */
  hasView: boolean;
  viewSize: number | null;
  triangles: number | null;
  author: string | null;
  createdAt: string;
}

/** Вертикальная ось модели: Y — glTF, VRML, X3D; Z — принято в 3D-печати (STL, 3MF, PLY) */
export type UpAxis = 'Y' | 'Z';

/** Сведения о модели, которые конвертер кладёт в GLB (extras сцены), а просмотр читает */
export interface SceneMeta {
  sourceFormat: ModelFormat;
  upAxis: UpAxis;
  /** Единицы координат: «мм», «м» или пусто — единицы файла не известны */
  unit: string;
}

/** Этапы подготовки модели — для индикатора */
export type ConvertStage = 'read' | 'parse' | 'occt' | 'merge' | 'export';

/** Сетка, разобранная на основном потоке (3MF: его загрузчику нужен DOMParser), — для слияния в воркере */
export interface RawMesh {
  /** Координаты уже в системе модели (с учётом вложенных преобразований) */
  position: Float32Array;
  normal: Float32Array | null;
  index: Uint32Array | null;
  /** Цвет sRGB, 0xRRGGBB */
  color: number;
  opacity: number;
  vertexColor: Float32Array | null;
}

export type ConvertRequest =
  | { type: 'file'; name: string; format: ModelFormat; buffer: ArrayBuffer; occtWorkerUrl: string }
  | { type: 'raw'; name: string; format: ModelFormat; meshes: RawMesh[] };

export interface ConvertStats {
  /** Треугольников в модели */
  triangles: number;
  /** Сеток в исходнике */
  sourceMeshes: number;
  /** Вызовов отрисовки после слияния по материалу */
  drawCalls: number;
}

/** Результат подготовки: glb === null — копия не нужна, просмотр открывает исходник (GLB/glTF как есть) */
export interface ConvertResult {
  glb: ArrayBuffer | null;
  stats: ConvertStats;
  meta: SceneMeta;
}

export type ConvertResponse =
  | { type: 'progress'; stage: ConvertStage; ratio: number | null }
  | ({ type: 'done' } & ConvertResult)
  | { type: 'error'; message: string };

/** Что показывает просмотр: GLB или glTF (JSON) — оба читает GLTFLoader. Новый объект — новая сцена */
export interface ViewSource {
  buffer: ArrayBuffer;
  /** Сведения на случай, если в файле их нет (исходный GLB из САПР) */
  fallbackMeta: SceneMeta;
}
