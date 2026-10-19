// x3d.ts — небольшой разбор X3D (XML) в объекты three: Transform/Group, Shape, Appearance/Material,
// IndexedFaceSet/IndexedTriangleSet/TriangleSet c Coordinate, простые тела Box/Sphere/Cylinder/Cone, DEF/USE.
// Файл читается как текст: HTML-страница со сценой X3D (экспорт FreeCAD для X3DOM) никогда не вставляется
// в документ и не исполняется. DOMParser в воркере недоступен, поэтому теги разбираются своим лексером.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import type { Object3D } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ModelError } from './errors';
import { DEFAULT_CREASE_ANGLE, DEFAULT_MODEL_COLOR } from './merge';

type Attributes = Map<string, string>;

interface MaterialData {
  color: Color;
  opacity: number;
}

/** Геометрия в разборе: атрибуты тега и дочерние узлы Coordinate/Normal/Color */
interface GeometryState {
  kind: 'ifs' | 'its' | 'ts';
  attrs: Attributes;
  points: number[] | null;
  normals: number[] | null;
  colors: { values: number[]; size: 3 | 4 } | null;
  def: string | null;
}

interface ShapeState {
  material: MaterialData | null;
  geometry: BufferGeometry | null;
  def: string | null;
}

interface Frame {
  name: string;
  /** Узел группировки, куда добавляются дочерние объекты */
  group?: Group;
  shape?: ShapeState;
  geometry?: GeometryState;
  /** Switch: какой по счёту дочерний узел показывать (-1 — никакой) */
  whichChoice?: number;
  /** DEF у Appearance: материал запоминается при закрытии */
  appearanceDef?: string;
  childCount: number;
}

/** Координаты под DEF вне геометрии (например, у рёбер) разбираем, только если их кто-то использует */
interface LazyPoints {
  raw: string;
}

const GROUPING = new Set(['transform', 'group', 'staticgroup', 'collision', 'anchor', 'billboard', 'switch', 'lod', 'scene']);

const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTRIBUTE = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

const parseAttributes = (source: string): Attributes => {
  const attrs: Attributes = new Map();
  ATTRIBUTE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTRIBUTE.exec(source)) !== null) attrs.set(match[1], match[2] ?? match[3] ?? '');
  return attrs;
};

const numbers = (value: string | undefined): number[] => {
  if (!value) return [];
  const result: number[] = [];
  NUMBER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NUMBER.exec(value)) !== null) result.push(Number(match[0]));
  return result;
};

const vector = (value: string | undefined, fallback: [number, number, number]): Vector3 => {
  const list = numbers(value);
  return list.length >= 3 ? new Vector3(list[0], list[1], list[2]) : new Vector3(...fallback);
};

const rotation = (value: string | undefined): Quaternion => {
  const list = numbers(value);
  const axis = list.length >= 4 ? new Vector3(list[0], list[1], list[2]) : new Vector3(0, 0, 1);
  if (list.length < 4 || axis.lengthSq() === 0) return new Quaternion();
  return new Quaternion().setFromAxisAngle(axis.normalize(), list[3]);
};

/** Матрица Transform по X3D: T · C · R · SR · S · −SR · −C */
const transformMatrix = (attrs: Attributes): Matrix4 => {
  const translation = vector(attrs.get('translation'), [0, 0, 0]);
  const center = vector(attrs.get('center'), [0, 0, 0]);
  const scale = vector(attrs.get('scale'), [1, 1, 1]);
  const scaleOrientation = rotation(attrs.get('scaleOrientation'));
  return new Matrix4()
    .makeTranslation(translation.x + center.x, translation.y + center.y, translation.z + center.z)
    .multiply(new Matrix4().makeRotationFromQuaternion(rotation(attrs.get('rotation'))))
    .multiply(new Matrix4().makeRotationFromQuaternion(scaleOrientation))
    .multiply(new Matrix4().makeScale(scale.x, scale.y, scale.z))
    .multiply(new Matrix4().makeRotationFromQuaternion(scaleOrientation.clone().invert()))
    .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
};

const bool = (value: string | undefined, fallback: boolean): boolean => (value === undefined ? fallback : value.trim().toLowerCase() === 'true');

/** Многоугольники из списка индексов с разделителем −1 → треугольники веером */
const polygonsToTriangles = (indices: number[], ccw: boolean): number[] => {
  const triangles: number[] = [];
  let start = 0;
  for (let i = 0; i <= indices.length; i++) {
    if (i < indices.length && indices[i] >= 0) continue;
    for (let k = start + 1; k + 1 < i; k++) {
      if (ccw) triangles.push(indices[start], indices[k], indices[k + 1]);
      else triangles.push(indices[start], indices[k + 1], indices[k]);
    }
    start = i + 1;
  }
  return triangles;
};

/** Геометрия из IndexedFaceSet / IndexedTriangleSet / TriangleSet: треугольники россыпью с нормалями */
const buildGeometry = (state: GeometryState): BufferGeometry | null => {
  const points = state.points;
  if (!points || points.length < 9) return null;
  const vertexCount = Math.floor(points.length / 3);
  const ccw = bool(state.attrs.get('ccw'), true);
  let corners: number[];
  if (state.kind === 'ifs') corners = polygonsToTriangles(numbers(state.attrs.get('coordIndex')), ccw);
  else if (state.kind === 'its') corners = polygonsToTriangles(numbers(state.attrs.get('index')).flatMap((value, i) => ((i + 1) % 3 === 0 ? [value, -1] : [value])), ccw);
  else corners = Array.from({ length: vertexCount - (vertexCount % 3) }, (_, i) => i);
  corners = corners.filter((_, i, list) => i < list.length - (list.length % 3));
  if (corners.some(index => index >= vertexCount)) corners = corners.filter((_, i) => {
    const base = i - (i % 3);
    return corners[base] < vertexCount && corners[base + 1] < vertexCount && corners[base + 2] < vertexCount;
  });
  if (corners.length === 0) return null;

  const position = new Float32Array(corners.length * 3);
  corners.forEach((vertex, i) => {
    position[i * 3] = points[vertex * 3];
    position[i * 3 + 1] = points[vertex * 3 + 1];
    position[i * 3 + 2] = points[vertex * 3 + 2];
  });
  let geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));

  // Цвет вершин: только для colorPerVertex без отдельного colorIndex — самый частый случай экспорта
  const colors = state.colors;
  if (colors && bool(state.attrs.get('colorPerVertex'), true) && !state.attrs.has('colorIndex')) {
    const array = new Float32Array(corners.length * 3);
    const linear = new Color();
    corners.forEach((vertex, i) => {
      const offset = vertex * colors.size;
      linear.setRGB(colors.values[offset] ?? 1, colors.values[offset + 1] ?? 1, colors.values[offset + 2] ?? 1, SRGBColorSpace);
      array[i * 3] = linear.r;
      array[i * 3 + 1] = linear.g;
      array[i * 3 + 2] = linear.b;
    });
    geometry.setAttribute('color', new BufferAttribute(array, 3));
  }

  const normals = state.normals;
  const normalsPerVertex = bool(state.attrs.get('normalPerVertex'), true) && !state.attrs.has('normalIndex');
  if (normals && normalsPerVertex && normals.length >= vertexCount * 3) {
    const array = new Float32Array(corners.length * 3);
    corners.forEach((vertex, i) => {
      array[i * 3] = normals[vertex * 3];
      array[i * 3 + 1] = normals[vertex * 3 + 1];
      array[i * 3 + 2] = normals[vertex * 3 + 2];
    });
    geometry.setAttribute('normal', new BufferAttribute(array, 3));
  } else {
    // В X3D по умолчанию creaseAngle = 0 (всё гранями); экспорт из САПР его обычно не пишет — сглаживаем как САПР
    const crease = numbers(state.attrs.get('creaseAngle'))[0];
    if (crease !== undefined && crease <= 0) geometry.computeVertexNormals();
    else geometry = toCreasedNormals(geometry, crease ?? DEFAULT_CREASE_ANGLE);
  }
  return geometry;
};

const primitive = (name: string, attrs: Attributes): BufferGeometry | null => {
  const first = (key: string, fallback: number) => numbers(attrs.get(key))[0] ?? fallback;
  switch (name) {
    case 'box': {
      const size = vector(attrs.get('size'), [2, 2, 2]);
      return new BoxGeometry(size.x, size.y, size.z);
    }
    case 'sphere':
      return new SphereGeometry(first('radius', 1), 48, 24);
    case 'cylinder':
      return new CylinderGeometry(first('radius', 1), first('radius', 1), first('height', 2), 48);
    case 'cone':
      return new ConeGeometry(first('bottomRadius', 1), first('height', 2), 48);
    default:
      return null;
  }
};

/** Разбор текста X3D (или XHTML/HTML со сценой X3D) в группу three */
export const parseX3d = (text: string): Group => {
  const lower = text.toLowerCase();
  const sceneStart = lower.indexOf('<scene');
  if (sceneStart < 0) {
    throw new ModelError(
      lower.includes('<x3d') ? 'В файле X3D нет сцены (Scene).' : 'В файле нет сцены X3D. Загрузите саму модель: STEP, GLB, X3D…',
    );
  }
  const sceneEnd = lower.lastIndexOf('</scene');
  const source = text.slice(sceneStart, sceneEnd > sceneStart ? sceneEnd + 8 : text.length).replace(/<!--[\s\S]*?-->/g, '');

  const root = new Group();
  const defs = new Map<string, Object3D | MaterialData | BufferGeometry | number[] | LazyPoints>();
  const stack: Frame[] = [{ name: '#root', group: root, childCount: 0 }];
  /** Глубина, до которой пропускаем содержимое (USE с вложенными тегами, неактивные ветки Switch/LOD) */
  let skipDepth = -1;

  const parentGroup = (): Group => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const group = stack[i].group;
      if (group) return group;
    }
    return root;
  };
  const currentShape = (): ShapeState | undefined => stack[stack.length - 1]?.shape ?? stack[stack.length - 2]?.shape;
  const currentGeometry = (): GeometryState | undefined => stack[stack.length - 1]?.geometry;

  /** Ветка Switch/LOD, которую не показываем */
  const hiddenByParent = (): boolean => {
    const parent = stack[stack.length - 1];
    if (!parent) return false;
    const childIndex = parent.childCount;
    parent.childCount += 1;
    if (parent.name === 'switch') return parent.whichChoice !== childIndex;
    if (parent.name === 'lod') return childIndex !== 0;
    return false;
  };

  const finishShape = (shape: ShapeState) => {
    if (!shape.geometry) return;
    const material = shape.material ?? { color: new Color(DEFAULT_MODEL_COLOR), opacity: 1 };
    const hasColors = shape.geometry.hasAttribute('color');
    const mesh = new Mesh(
      shape.geometry,
      new MeshStandardMaterial({
        color: hasColors ? new Color(0xffffff) : material.color,
        opacity: material.opacity,
        transparent: material.opacity < 1,
        vertexColors: hasColors,
      }),
    );
    parentGroup().add(mesh);
    if (shape.def) defs.set(shape.def, mesh);
  };

  TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG.exec(source)) !== null) {
    const closing = match[1] === '/';
    const name = match[2].toLowerCase();
    const rawAttrs = match[3];
    const selfClosing = rawAttrs.trimEnd().endsWith('/');

    if (closing) {
      if (stack.length <= 1) continue;
      // Закрываем до ближайшего одноимённого узла: так переживаем несбалансированные теги HTML
      let depth = stack.length - 1;
      while (depth > 0 && stack[depth].name !== name) depth--;
      if (depth === 0) continue;
      while (stack.length > depth) {
        const frame = stack.pop() as Frame;
        if (skipDepth >= 0 && stack.length <= skipDepth) skipDepth = -1;
        if (frame.geometry) {
          const geometry = buildGeometry(frame.geometry);
          const shape = currentShape();
          if (geometry && shape) shape.geometry = geometry;
          if (geometry && frame.geometry.def) defs.set(frame.geometry.def, geometry);
        }
        if (frame.shape && skipDepth < 0) finishShape(frame.shape);
        if (frame.appearanceDef) {
          const material = currentShape()?.material;
          if (material) defs.set(frame.appearanceDef, material);
        }
      }
      continue;
    }

    const attrs = parseAttributes(rawAttrs);
    const frame: Frame = { name, childCount: 0 };
    const skipped = skipDepth >= 0 || hiddenByParent();
    if (!skipped) {
      const use = attrs.get('USE');
      const def = attrs.get('DEF') ?? null;
      const used = use !== undefined ? defs.get(use) : undefined;
      if (use !== undefined) {
        // USE: повторное использование узла; вложенное содержимое у таких тегов не разбираем
        if (used instanceof Group || used instanceof Mesh) parentGroup().add(used.clone());
        else if (used instanceof BufferGeometry) {
          const shape = currentShape();
          if (shape) shape.geometry = used;
        } else if (Array.isArray(used) || (used && 'raw' in used)) {
          const geometry = currentGeometry();
          if (geometry && (name === 'coordinate' || name === 'coordinatedouble')) {
            geometry.points = Array.isArray(used) ? used : numbers(used.raw);
          }
        } else if (used && 'opacity' in used) {
          const shape = currentShape();
          if (shape) shape.material = used;
        }
        if (!selfClosing) {
          stack.push(frame);
          skipDepth = stack.length - 1;
        }
        continue;
      }

      if (GROUPING.has(name)) {
        const group = new Group();
        if (name === 'transform') {
          group.matrixAutoUpdate = false;
          group.matrix.copy(transformMatrix(attrs));
        }
        if (name === 'switch') frame.whichChoice = numbers(attrs.get('whichChoice'))[0] ?? -1;
        parentGroup().add(group);
        if (def) defs.set(def, group);
        frame.group = group;
      } else if (name === 'shape') {
        frame.shape = { material: null, geometry: null, def };
      } else if (name === 'appearance') {
        if (def) frame.appearanceDef = def;
      } else if (name === 'material' || name === 'physicalmaterial' || name === 'twosidedmaterial') {
        const shape = currentShape();
        const rgb = numbers(attrs.get(name === 'physicalmaterial' ? 'baseColor' : 'diffuseColor'));
        const transparency = numbers(attrs.get('transparency'))[0] ?? 0;
        const data: MaterialData = {
          color: rgb.length >= 3 ? new Color().setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace) : new Color(0xcccccc),
          opacity: Math.min(1, Math.max(0, 1 - transparency)),
        };
        if (shape) shape.material = data;
        if (def) defs.set(def, data);
      } else if (name === 'indexedfaceset' || name === 'indexedtriangleset' || name === 'triangleset') {
        frame.geometry = {
          kind: name === 'indexedfaceset' ? 'ifs' : name === 'indexedtriangleset' ? 'its' : 'ts',
          attrs,
          points: null,
          normals: null,
          colors: null,
          def,
        };
      } else if (name === 'coordinate' || name === 'coordinatedouble') {
        const geometry = currentGeometry();
        if (geometry) {
          geometry.points = numbers(attrs.get('point'));
          if (def) defs.set(def, geometry.points);
        } else if (def) {
          defs.set(def, { raw: attrs.get('point') ?? '' });
        }
      } else if (name === 'normal') {
        const geometry = currentGeometry();
        if (geometry) geometry.normals = numbers(attrs.get('vector'));
      } else if (name === 'color' || name === 'colorrgba') {
        const geometry = currentGeometry();
        if (geometry) geometry.colors = { values: numbers(attrs.get('color')), size: name === 'colorrgba' ? 4 : 3 };
      } else {
        const geometry = primitive(name, attrs);
        const shape = currentShape();
        if (geometry && shape) shape.geometry = geometry;
        if (geometry && def) defs.set(def, geometry);
      }
    }

    if (selfClosing) {
      // Самозакрывающийся тег: сразу завершаем его так же, как по закрывающему
      if (frame.geometry) {
        const geometry = buildGeometry(frame.geometry);
        const shape = currentShape();
        if (geometry && shape) shape.geometry = geometry;
        if (geometry && frame.geometry.def) defs.set(frame.geometry.def, geometry);
      }
      continue;
    }
    stack.push(frame);
    if (skipped && skipDepth < 0) skipDepth = stack.length - 1;
  }

  return root;
};
