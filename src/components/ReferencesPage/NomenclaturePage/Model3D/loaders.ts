// loaders.ts — разбор форматов-сеток загрузчиками three.js в воркере (без DOM): glTF/GLB, VRML, STL, OBJ, PLY.
// Текстуры в воркере не грузим (ImageLoader требует document): модели, у которых они есть, конвертер не трогает.
import { BufferGeometry, Color, Group, LoadingManager, Mesh, MeshStandardMaterial, Points, PointsMaterial, Texture, TextureLoader } from 'three';
import type { Material, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ModelError } from './errors';
import { DEFAULT_MODEL_COLOR } from './merge';

const decodeText = (buffer: ArrayBuffer): string => new TextDecoder('utf-8').decode(buffer);

const isGzip = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
};

/** Текст файла; сжатый gzip (.wrz) распаковывается встроенным DecompressionStream */
export const readText = async (buffer: ArrayBuffer): Promise<string> => {
  if (!isGzip(buffer)) return decodeText(buffer);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
};

const shortError = (error: unknown): string => (error instanceof Error ? error.message : String(error)).slice(0, 160);

/** Материалы модели — по одному на сетку или массивом */
const materialsOf = (object: Object3D): Material[] => {
  const material = (object as Mesh).material;
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
};

export const EXTERNAL_GLTF_REFS_ERROR = 'Модель ссылается на внешние файлы — такие модели не открываются.';

/** Встроенные данные (data:) и куски самого файла: картинки из bufferView GLTFLoader отдаёт как blob: */
const isEmbeddedUrl = (url: string): boolean => /^(data|blob):/i.test(url);

/**
 * glTF/GLB. Файл проверен только по описанию сцены (inspectGltf): по buffers[].uri и images[].uri загрузчик
 * пошёл бы по любому адресу — во внутреннюю сеть, на чужой сервер, в наш API с cookie (адрес без схемы
 * считается от адреса приложения). Как и просмотр (viewer.ts), пропускаем только встроенные данные, прочее
 * отклоняем до запроса
 */
export const parseGltf = async (buffer: ArrayBuffer): Promise<Group> => {
  const blocked: string[] = [];
  const manager = new LoadingManager();
  manager.setURLModifier(url => {
    if (isEmbeddedUrl(url)) return url;
    blocked.push(url);
    throw new ModelError(EXTERNAL_GLTF_REFS_ERROR);
  });
  const loader = new GLTFLoader(manager);
  loader.setMeshoptDecoder(MeshoptDecoder);
  let scene: Group;
  try {
    scene = (await loader.parseAsync(buffer, '')).scene;
  } catch (error) {
    if (blocked.length > 0) throw new ModelError(EXTERNAL_GLTF_REFS_ERROR);
    throw new ModelError(`Не удалось прочитать glTF: ${shortError(error)}`);
  }
  // Незагруженная текстура разбор не прерывает (GLTFLoader ставит вместо неё null) — проверяем отдельно
  if (blocked.length > 0) throw new ModelError(EXTERNAL_GLTF_REFS_ERROR);
  return scene;
};

let texturesDisabled = false;

/** В воркере нет document: VRMLLoader не должен пытаться грузить ImageTexture */
const disableTextureLoading = () => {
  if (texturesDisabled) return;
  texturesDisabled = true;
  TextureLoader.prototype.load = function load() {
    return new Texture();
  };
};

/**
 * VRML 2.0 (VRML97). КОМПАС-3D пишет имена DEF/USE с цифры (DEF 000000005F1ADE90) — по стандарту так нельзя,
 * и VRMLLoader падает; добавляем «_» в начало. emissiveColor у КОМПАС равен цвету — модель выходит «выбеленной», обнуляем.
 */
export const parseVrml = async (buffer: ArrayBuffer): Promise<Object3D> => {
  const text = await readText(buffer);
  const head = text.trimStart().slice(0, 32);
  if (/^#VRML V1\.0/i.test(head)) throw new ModelError('Это VRML 1.0 — сохраните модель в VRML 2.0 (VRML97).');
  if (!/^#VRML V2\.0/i.test(head)) throw new ModelError('Это не файл VRML 2.0: нет заголовка «#VRML V2.0».');
  const fixed = text.replace(/\b(DEF|USE)(\s+)([0-9][^\s{}[\]]*)/g, '$1$2_$3');
  disableTextureLoading();
  let scene: Object3D;
  try {
    scene = new VRMLLoader().parse(fixed, '');
  } catch (error) {
    throw new ModelError(`Не удалось разобрать VRML: ${shortError(error)}`);
  }
  scene.traverse(object => {
    for (const material of materialsOf(object)) {
      const emissive = (material as MeshStandardMaterial).emissive;
      if (emissive instanceof Color) emissive.setRGB(0, 0, 0);
    }
  });
  return scene;
};

const wrap = (object: Object3D): Group => {
  const group = new Group();
  group.add(object);
  return group;
};

const meshMaterial = (geometry: BufferGeometry) =>
  new MeshStandardMaterial({
    color: geometry.hasAttribute('color') ? 0xffffff : DEFAULT_MODEL_COLOR,
    vertexColors: geometry.hasAttribute('color'),
  });

export const parseStl = (buffer: ArrayBuffer): Group => {
  let geometry: BufferGeometry;
  try {
    geometry = new STLLoader().parse(buffer);
  } catch (error) {
    throw new ModelError(`Не удалось прочитать STL: ${shortError(error)}`);
  }
  // Нормали STL — по граням, модель выглядит гранёной. Пересчитываем со сглаживанием по углу, как в САПР
  geometry.deleteAttribute('normal');
  return wrap(new Mesh(geometry, meshMaterial(geometry)));
};

/** OBJ без файла .mtl: материалы-заглушки белые — красим в цвет модели по умолчанию; линии и точки не нужны */
export const parseObj = async (buffer: ArrayBuffer): Promise<Group> => {
  let group: Group;
  try {
    group = new OBJLoader().parse(await readText(buffer));
  } catch (error) {
    throw new ModelError(`Не удалось прочитать OBJ: ${shortError(error)}`);
  }
  const extra: Object3D[] = [];
  group.traverse(object => {
    if (!(object as Mesh).isMesh) {
      if (object !== group && !(object as Group).isGroup) extra.push(object);
      return;
    }
    for (const material of materialsOf(object)) {
      const color = (material as MeshStandardMaterial).color;
      if (color instanceof Color && !material.vertexColors && color.getHex() === 0xffffff) color.setHex(DEFAULT_MODEL_COLOR);
    }
  });
  extra.forEach(object => object.removeFromParent());
  return group;
};

/** PLY: с гранями — сетка, без граней — облако точек (сканы) */
export const parsePly = (buffer: ArrayBuffer): Group => {
  let geometry: BufferGeometry;
  try {
    geometry = new PLYLoader().parse(buffer);
  } catch (error) {
    throw new ModelError(`Не удалось прочитать PLY: ${shortError(error)}`);
  }
  if (geometry.getIndex()) return wrap(new Mesh(geometry, meshMaterial(geometry)));
  const hasColors = geometry.hasAttribute('color');
  return wrap(
    new Points(
      geometry,
      new PointsMaterial({ color: hasColors ? 0xffffff : DEFAULT_MODEL_COLOR, vertexColors: hasColors, size: 2, sizeAttenuation: false }),
    ),
  );
};
