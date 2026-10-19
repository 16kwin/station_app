// merge.ts — слияние сцены по материалу: все сетки одного цвета — в одну. Модели из САПР состоят из тысяч
// мелких сеток (Heat gun.wrl — 6449 вызовов отрисовки), после слияния их единицы — просмотр не тормозит.
// Работает и в воркере (без DOM), и на основном потоке.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Scene,
} from 'three';
import type { InstancedMesh, InterleavedBufferAttribute, Material, Object3D } from 'three';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Цвет модели без материалов (STL, STEP без цветов) — светлый стальной */
export const DEFAULT_MODEL_COLOR = 0xb4bdcb;

/** Угол сглаживания, если нормалей в файле нет: скругления гладкие, кромки острые (≈ 34°) */
export const DEFAULT_CREASE_ANGLE = 0.6;

/** Больше вершин не сшиваем: mergeVertices на таких объёмах слишком долгий и прожорливый */
const WELD_LIMIT = 4_000_000;

interface Look {
  key: string;
  color: Color;
  opacity: number;
  metalness: number;
  roughness: number;
  emissive: Color;
  vertexColors: boolean;
  points: boolean;
}

export interface MergeResult {
  scene: Scene;
  triangles: number;
  points: number;
  sourceMeshes: number;
  drawCalls: number;
}

type AnyAttribute = BufferAttribute | InterleavedBufferAttribute;

const readColor = (material: Material | undefined, key: 'color' | 'emissive'): Color | null => {
  const value = material ? (material as unknown as Record<string, unknown>)[key] : undefined;
  return value instanceof Color ? value : null;
};

const readNumber = (material: Material | undefined, key: 'metalness' | 'roughness'): number | null => {
  const value = material ? (material as unknown as Record<string, unknown>)[key] : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const round = (value: number, step: number) => Math.round(value / step) * step;

/** Внешний вид материала — по нему сетки объединяются */
const lookOf = (material: Material | undefined, points: boolean, hasColorAttribute: boolean): Look => {
  const vertexColors = hasColorAttribute && (material ? material.vertexColors : true);
  const color = readColor(material, 'color')?.clone() ?? new Color(vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR);
  const opacity = material && material.transparent ? round(Math.min(1, Math.max(0.05, material.opacity)), 0.05) : 1;
  const metalness = round(readNumber(material, 'metalness') ?? 0.1, 0.05);
  const roughness = round(readNumber(material, 'roughness') ?? 0.6, 0.05);
  const emissive = readColor(material, 'emissive')?.clone() ?? new Color(0x000000);
  const key = [
    points ? 'points' : 'mesh',
    color.getHexString(),
    opacity.toFixed(2),
    metalness.toFixed(2),
    roughness.toFixed(2),
    emissive.getHexString(),
    vertexColors ? 'vc' : '',
  ].join('|');
  return { key, color, opacity, metalness, roughness, emissive, vertexColors, points };
};

/** Копия атрибута в обычный Float32Array: из чередующихся и нормализованных (KHR_mesh_quantization) тоже */
const plainAttribute = (attribute: AnyAttribute, itemSize: number): BufferAttribute => {
  if (!('isInterleavedBufferAttribute' in attribute) && attribute.array instanceof Float32Array && attribute.itemSize === itemSize && !attribute.normalized) {
    return new BufferAttribute(attribute.array.slice(0, attribute.count * itemSize), itemSize);
  }
  const array = new Float32Array(attribute.count * itemSize);
  for (let i = 0; i < attribute.count; i++) {
    const offset = i * itemSize;
    array[offset] = attribute.getX(i);
    if (itemSize > 1) array[offset + 1] = attribute.getY(i);
    if (itemSize > 2) array[offset + 2] = attribute.getZ(i);
  }
  return new BufferAttribute(array, itemSize);
};

/**
 * Часть геометрии по списку вершин треугольников: неиспользуемые вершины отбрасываются.
 * Нужна, когда одна сетка раскрашена по граням (STEP) или состоит из групп с разными материалами.
 */
export const subsetGeometry = (geometry: BufferGeometry, vertexIndices: ArrayLike<number>): BufferGeometry => {
  const position = geometry.getAttribute('position');
  const remap = new Int32Array(position.count).fill(-1);
  const index = new Uint32Array(vertexIndices.length);
  let next = 0;
  for (let i = 0; i < vertexIndices.length; i++) {
    const vertex = vertexIndices[i];
    let mapped = remap[vertex];
    if (mapped < 0) {
      mapped = next;
      remap[vertex] = next;
      next += 1;
    }
    index[i] = mapped;
  }
  const result = new BufferGeometry();
  for (const name of ['position', 'normal', 'color']) {
    if (!geometry.hasAttribute(name)) continue;
    const source = geometry.getAttribute(name);
    const itemSize = Math.min(3, source.itemSize);
    const array = new Float32Array(next * itemSize);
    for (let vertex = 0; vertex < position.count; vertex++) {
      const target = remap[vertex];
      if (target < 0) continue;
      array[target * itemSize] = source.getX(vertex);
      if (itemSize > 1) array[target * itemSize + 1] = source.getY(vertex);
      if (itemSize > 2) array[target * itemSize + 2] = source.getZ(vertex);
    }
    result.setAttribute(name, new BufferAttribute(array, itemSize));
  }
  result.setIndex(new BufferAttribute(index, 1));
  return result;
};

/** Части сетки с несколькими материалами (groups); у сетки с одним материалом — она сама */
const splitByMaterial = (geometry: BufferGeometry, materials: Material[]): { geometry: BufferGeometry; material: Material | undefined }[] => {
  if (materials.length <= 1 || geometry.groups.length === 0) return [{ geometry, material: materials[0] }];
  const index = geometry.getIndex();
  const vertexCount = geometry.getAttribute('position').count;
  return geometry.groups.map(group => {
    const total = index ? index.count : vertexCount;
    const start = Math.max(0, group.start);
    const end = Math.min(total, Number.isFinite(group.count) ? start + group.count : total);
    const vertices = new Uint32Array(Math.max(0, end - start));
    for (let i = 0; i < vertices.length; i++) vertices[i] = index ? index.getX(start + i) : start + i;
    return { geometry: subsetGeometry(geometry, vertices), material: materials[group.materialIndex ?? 0] };
  });
};

const sequentialIndex = (geometry: BufferGeometry): BufferGeometry => {
  const count = geometry.getAttribute('position').count;
  const index = new Uint32Array(count - (count % 3));
  for (let i = 0; i < index.length; i++) index[i] = i;
  geometry.setIndex(new BufferAttribute(index, 1));
  return geometry;
};

/** Доля вершин, на которые ссылается индекс: в GLB из САПР десятки сеток делят один общий буфер вершин */
const usedVertexShare = (index: ArrayLike<number>, vertexCount: number): number => {
  const used = new Uint8Array(vertexCount);
  let count = 0;
  for (let i = 0; i < index.length; i++) {
    const vertex = index[i];
    if (vertex < vertexCount && used[vertex] === 0) {
      used[vertex] = 1;
      count += 1;
    }
  }
  return vertexCount > 0 ? count / vertexCount : 1;
};

/** Нулевые нормали (вырожденные треугольники) экспортёр GLB не принимает — ставим любую единичную */
const fixZeroNormals = (geometry: BufferGeometry) => {
  const normal = geometry.getAttribute('normal');
  if (!normal) return;
  for (let i = 0; i < normal.count; i++) {
    if (normal.getX(i) === 0 && normal.getY(i) === 0 && normal.getZ(i) === 0) normal.setXYZ(i, 0, 1, 0);
  }
};

/** Копия части сетки в координатах модели: только позиции, нормали и цвета вершин, всегда с индексом (кроме точек) */
const prepare = (source: BufferGeometry, matrix: Matrix4, look: Look): BufferGeometry | null => {
  const position = source.getAttribute('position');
  if (!position || position.count === 0) return null;
  const sourceIndex = source.getIndex();
  const indexLength = sourceIndex ? sourceIndex.count - (sourceIndex.count % 3) : 0;
  let geometry: BufferGeometry;
  if (sourceIndex && usedVertexShare(sourceIndex.array.subarray(0, indexLength), position.count) < 0.9) {
    // Берём только используемые вершины, иначе каждая часть потянет за собой весь общий буфер
    geometry = subsetGeometry(source, sourceIndex.array.subarray(0, indexLength));
    if (!look.vertexColors && geometry.hasAttribute('color')) geometry.deleteAttribute('color');
    if (look.points && geometry.hasAttribute('normal')) geometry.deleteAttribute('normal');
  } else {
    geometry = new BufferGeometry();
    geometry.setAttribute('position', plainAttribute(position, 3));
    if (!look.points && source.hasAttribute('normal')) geometry.setAttribute('normal', plainAttribute(source.getAttribute('normal'), 3));
    if (look.vertexColors) geometry.setAttribute('color', plainAttribute(source.getAttribute('color'), 3));
    if (sourceIndex) {
      const index = new Uint32Array(indexLength);
      index.set(sourceIndex.array.subarray(0, indexLength));
      geometry.setIndex(new BufferAttribute(index, 1));
    }
  }
  geometry.applyMatrix4(matrix);

  if (look.points) return geometry.index ? geometry.toNonIndexed() : geometry;

  if (!geometry.hasAttribute('normal')) {
    if (geometry.index) geometry.computeVertexNormals();
    else geometry = toCreasedNormals(geometry, DEFAULT_CREASE_ANGLE);
  }
  if (!geometry.index) {
    // Треугольники «россыпью» (STL, VRML, OBJ) сшиваем по совпадающим вершинам — GLB становится в разы меньше
    geometry = geometry.getAttribute('position').count <= WELD_LIMIT ? mergeVertices(geometry) : sequentialIndex(geometry);
  }
  if (!geometry.index || geometry.index.count < 3) return null;
  // Экспортёр GLB требует единичные нормали
  geometry.normalizeNormals();
  fixZeroNormals(geometry);
  return geometry;
};

/** Склейка геометрий с одинаковым набором атрибутов прямо в типизированные массивы */
const concatGeometries = (list: BufferGeometry[]): BufferGeometry => {
  if (list.length === 1) return list[0];
  const result = new BufferGeometry();
  const names = Object.keys(list[0].attributes);
  const vertices = list.reduce((sum, geometry) => sum + geometry.getAttribute('position').count, 0);
  for (const name of names) {
    const itemSize = list[0].getAttribute(name).itemSize;
    const array = new Float32Array(vertices * itemSize);
    let offset = 0;
    for (const geometry of list) {
      const source = geometry.getAttribute(name).array as Float32Array;
      array.set(source, offset);
      offset += source.length;
    }
    result.setAttribute(name, new BufferAttribute(array, itemSize));
  }
  if (list[0].index) {
    const total = list.reduce((sum, geometry) => sum + (geometry.index?.count ?? 0), 0);
    const index = vertices > 65535 ? new Uint32Array(total) : new Uint16Array(total);
    let offset = 0;
    let base = 0;
    for (const geometry of list) {
      const source = geometry.index?.array ?? [];
      for (let i = 0; i < source.length; i++) index[offset + i] = source[i] + base;
      offset += source.length;
      base += geometry.getAttribute('position').count;
    }
    result.setIndex(new BufferAttribute(index, 1));
  }
  return result;
};

const materialOf = (look: Look): Material => {
  if (look.points) {
    return new PointsMaterial({
      color: look.color,
      size: 2,
      sizeAttenuation: false,
      vertexColors: look.vertexColors,
      transparent: look.opacity < 1,
      opacity: look.opacity,
    });
  }
  return new MeshStandardMaterial({
    color: look.color,
    metalness: look.metalness,
    roughness: look.roughness,
    emissive: look.emissive,
    vertexColors: look.vertexColors,
    transparent: look.opacity < 1,
    opacity: look.opacity,
    // Нормали из САПР бывают развёрнуты внутрь — видны обе стороны
    side: DoubleSide,
  });
};

/** Слияние всех сеток и облаков точек сцены по внешнему виду. Линии (рёбра из VRML/X3D) отбрасываются — рёбра строит просмотр */
export const mergeByMaterial = (root: Object3D, onProgress?: (ratio: number) => void): MergeResult => {
  root.updateMatrixWorld(true);
  const sources: (Mesh | Points)[] = [];
  root.traverse(object => {
    if ((object as Mesh).isMesh || (object as Points).isPoints) sources.push(object as Mesh | Points);
  });

  const buckets = new Map<string, { look: Look; geometries: BufferGeometry[] }>();
  const matrix = new Matrix4();
  const instanceMatrix = new Matrix4();
  sources.forEach((object, objectIndex) => {
    const points = (object as Points).isPoints === true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const instanced = (object as InstancedMesh).isInstancedMesh === true ? (object as InstancedMesh) : null;
    const copies = instanced ? instanced.count : 1;
    for (const part of splitByMaterial(object.geometry, materials)) {
      const look = lookOf(part.material, points, part.geometry.hasAttribute('color'));
      let bucket = buckets.get(look.key);
      if (!bucket) {
        bucket = { look, geometries: [] };
        buckets.set(look.key, bucket);
      }
      for (let copy = 0; copy < copies; copy++) {
        matrix.copy(object.matrixWorld);
        if (instanced) {
          instanced.getMatrixAt(copy, instanceMatrix);
          matrix.multiply(instanceMatrix);
        }
        const geometry = prepare(part.geometry, matrix, look);
        if (geometry) bucket.geometries.push(geometry);
      }
    }
    onProgress?.((objectIndex + 1) / sources.length);
  });

  const scene = new Scene();
  let triangles = 0;
  let pointCount = 0;
  for (const { look, geometries } of buckets.values()) {
    if (geometries.length === 0) continue;
    const geometry = concatGeometries(geometries);
    if (look.points) {
      pointCount += geometry.getAttribute('position').count;
      scene.add(new Points(geometry, materialOf(look)));
    } else {
      triangles += (geometry.index?.count ?? 0) / 3;
      scene.add(new Mesh(geometry, materialOf(look)));
    }
  }
  return { scene, triangles: Math.round(triangles), points: pointCount, sourceMeshes: sources.length, drawCalls: scene.children.length };
};
