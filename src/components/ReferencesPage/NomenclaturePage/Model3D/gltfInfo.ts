// gltfInfo.ts — разбор JSON-части glTF/GLB без загрузки геометрии: внешние файлы, расширения,
// текстуры и число треугольников. Нужен до загрузки, чтобы объяснить отказ и решить, делать ли копию.
import { ModelError } from './errors';

interface GltfPrimitive {
  attributes?: Record<string, number>;
  indices?: number;
  mode?: number;
  targets?: unknown[];
}

interface GltfJson {
  asset?: { version?: string };
  buffers?: { uri?: string }[];
  images?: { uri?: string }[];
  meshes?: { primitives?: GltfPrimitive[] }[];
  nodes?: { mesh?: number; children?: number[] }[];
  scenes?: { nodes?: number[] }[];
  scene?: number;
  accessors?: { count?: number }[];
  skins?: unknown[];
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}

export interface GltfInfo {
  /** Текстуры есть — копию не делаем: слияние по цвету их потеряет */
  hasTextures: boolean;
  /** Скелетная анимация или морфинг — тоже без копии */
  animated: boolean;
  /** Сколько сеток рисуется с учётом повторного использования узлов */
  primitiveInstances: number;
  triangles: number;
}

/** Расширения, которые GLTFLoader понимает без внешних декодеров (meshopt подключается в загрузчике) */
const SUPPORTED_EXTENSIONS = new Set([
  'KHR_materials_anisotropy',
  'KHR_materials_bump',
  'KHR_materials_clearcoat',
  'KHR_materials_dispersion',
  'KHR_materials_emissive_strength',
  'KHR_materials_ior',
  'KHR_materials_iridescence',
  'KHR_materials_sheen',
  'KHR_materials_specular',
  'KHR_materials_transmission',
  'KHR_materials_unlit',
  'KHR_materials_volume',
  'KHR_lights_punctual',
  'KHR_mesh_quantization',
  'KHR_texture_transform',
  'EXT_meshopt_compression',
  'EXT_mesh_gpu_instancing',
  'EXT_texture_webp',
  'EXT_texture_avif',
]);

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'

/** true — двоичный GLB, false — текстовый glTF */
export const isGlbBuffer = (buffer: ArrayBuffer): boolean =>
  buffer.byteLength >= 12 && new DataView(buffer).getUint32(0, true) === GLB_MAGIC;

const readJson = (buffer: ArrayBuffer): GltfJson => {
  const decoder = new TextDecoder('utf-8');
  if (isGlbBuffer(buffer)) {
    const view = new DataView(buffer);
    const version = view.getUint32(4, true);
    if (version !== 2) throw new ModelError('Это GLB старой версии 1.0. Сохраните модель в glTF 2.0 (GLB).');
    if (buffer.byteLength < 20 || view.getUint32(16, true) !== CHUNK_JSON) throw new ModelError('Файл GLB повреждён: нет блока JSON.');
    const length = view.getUint32(12, true);
    if (20 + length > buffer.byteLength) throw new ModelError('Файл GLB повреждён или загружен не полностью.');
    return parseJson(decoder.decode(new Uint8Array(buffer, 20, length)));
  }
  return parseJson(decoder.decode(buffer));
};

const parseJson = (text: string): GltfJson => {
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === 'object') return value as GltfJson;
  } catch {
    // ниже — общий текст ошибки
  }
  throw new ModelError('Файл glTF повреждён: не удалось прочитать описание сцены (JSON).');
};

const isExternal = (uri: string | undefined): uri is string => typeof uri === 'string' && !uri.startsWith('data:');

/** Проверки до загрузки: версия, внешние файлы, неподдерживаемые расширения. Возвращает сведения для решения о копии */
export const inspectGltf = (buffer: ArrayBuffer): GltfInfo => {
  const json = readJson(buffer);
  const version = json.asset?.version ?? '';
  if (!version.startsWith('2')) throw new ModelError('Это glTF старой версии 1.0. Сохраните модель в glTF 2.0 (GLB).');

  // По схеме glTF 2.0 разделы buffers и images — всегда массивы; другая запись — повреждённый (или подделанный) файл
  const buffers = json.buffers ?? [];
  const images = json.images ?? [];
  if (!Array.isArray(buffers) || !Array.isArray(images)) throw new ModelError('Файл glTF повреждён: разделы buffers и images должны быть списками.');
  const external = [...buffers, ...images].map(item => item?.uri).filter(isExternal);
  if (external.length > 0) {
    const names = external.slice(0, 3).map(uri => decodeURIComponent(uri.split('/').pop() ?? uri)).join(', ');
    throw new ModelError(
      `Модель ссылается на внешние файлы (${names}${external.length > 3 ? '…' : ''}), а загрузить можно только один файл. ` +
        'Выгрузите модель одним файлом GLB (*.glb) или glTF со встроенными данными (Embedded).',
    );
  }

  const used = json.extensionsUsed ?? [];
  const required = json.extensionsRequired ?? [];
  if (used.includes('KHR_draco_mesh_compression')) {
    throw new ModelError('Геометрия сжата Draco — такой GLB без интернета не прочитать. Выгрузите модель без сжатия геометрии.');
  }
  if (required.includes('KHR_texture_basisu')) {
    throw new ModelError('Текстуры в формате KTX2/Basis не поддерживаются. Выгрузите GLB с текстурами PNG или JPEG.');
  }
  const unsupported = required.filter(name => !SUPPORTED_EXTENSIONS.has(name));
  if (unsupported.length > 0) throw new ModelError(`Расширение glTF ${unsupported.join(', ')} не поддерживается.`);

  // Сетки считаем по узлам сцены: одна сетка может рисоваться несколько раз
  const nodes = json.nodes ?? [];
  const meshes = json.meshes ?? [];
  const accessors = json.accessors ?? [];
  const sceneIndex = json.scene ?? 0;
  const children = new Set(nodes.flatMap(node => node.children ?? []));
  const roots = json.scenes?.[sceneIndex]?.nodes ?? nodes.map((_, index) => index).filter(index => !children.has(index));
  let primitiveInstances = 0;
  let triangles = 0;
  let morph = false;
  const visit = (nodeIndex: number, depth: number) => {
    const node = nodes[nodeIndex];
    if (!node || depth > 64) return;
    const mesh = node.mesh !== undefined ? meshes[node.mesh] : undefined;
    for (const primitive of mesh?.primitives ?? []) {
      primitiveInstances += 1;
      if (primitive.targets?.length) morph = true;
      const mode = primitive.mode ?? 4;
      const accessor = primitive.indices !== undefined ? primitive.indices : primitive.attributes?.POSITION;
      const count = accessor !== undefined ? (accessors[accessor]?.count ?? 0) : 0;
      if (mode === 4) triangles += Math.floor(count / 3);
      else if (mode === 5 || mode === 6) triangles += Math.max(0, count - 2);
    }
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  roots.forEach(root => visit(root, 0));

  return {
    hasTextures: (json.images?.length ?? 0) > 0,
    animated: (json.skins?.length ?? 0) > 0 || morph,
    primitiveInstances,
    triangles,
  };
};
