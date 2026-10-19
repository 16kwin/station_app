// pipeline.ts — подготовка модели к просмотру: файл → объекты three → слияние по материалу → GLB.
// Выполняется в воркере (convert.worker.ts); от DOM не зависит, поэтому проверяется и в Node.
import { BufferAttribute, BufferGeometry, Color, Group, Mesh, MeshStandardMaterial } from 'three';
import type { Object3D } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { ModelError } from './errors';
import { defaultMeta } from './formats';
import { inspectGltf } from './gltfInfo';
import { parseGltf, parsePly, parseObj, parseStl, parseVrml, readText } from './loaders';
import { mergeByMaterial } from './merge';
import { looksLikeStep, occtToGroup, readWithOcct } from './occt';
import { parseX3d } from './x3d';
import type { ConvertRequest, ConvertResult, ConvertStage, RawMesh } from './types';

/** GLB с таким числом сеток и меньше открывается быстро и без копии */
const KEEP_GLB_PRIMITIVES = 64;

export type ProgressHandler = (stage: ConvertStage, ratio: number | null) => void;

/** Сетки 3MF, разобранные на основном потоке */
const rawToGroup = (meshes: RawMesh[]): Group => {
  const group = new Group();
  for (const raw of meshes) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(raw.position, 3));
    if (raw.normal) geometry.setAttribute('normal', new BufferAttribute(raw.normal, 3));
    if (raw.vertexColor) geometry.setAttribute('color', new BufferAttribute(raw.vertexColor, 3));
    if (raw.index) geometry.setIndex(new BufferAttribute(raw.index, 1));
    const material = new MeshStandardMaterial({
      color: raw.vertexColor ? new Color(0xffffff) : new Color(raw.color),
      vertexColors: raw.vertexColor !== null,
      opacity: raw.opacity,
      transparent: raw.opacity < 1,
    });
    group.add(new Mesh(geometry, material));
  }
  return group;
};

const exportGlb = async (scene: Object3D): Promise<ArrayBuffer> => {
  const result = await new GLTFExporter().parseAsync(scene, { binary: true });
  // В режиме binary экспортёр отдаёт ArrayBuffer; проверяем по форме, а не instanceof (другой realm в тестах)
  if (typeof (result as ArrayBuffer).byteLength !== 'number') throw new ModelError('Не удалось сохранить копию модели в GLB.');
  return result as ArrayBuffer;
};

/** Разбор файла в объекты three. null — файл GLB/glTF можно смотреть как есть, без копии */
const parseFile = async (request: Extract<ConvertRequest, { type: 'file' }>, progress: ProgressHandler): Promise<Object3D | null> => {
  const { buffer, format } = request;
  switch (format) {
    case 'glb':
    case 'gltf': {
      const info = inspectGltf(buffer);
      // Текстуры и анимацию слияние по цвету потеряет; небольшой GLB и так открывается быстро
      if (info.hasTextures || info.animated || (format === 'glb' && info.primitiveInstances <= KEEP_GLB_PRIMITIVES)) return null;
      progress('parse', null);
      return parseGltf(buffer);
    }
    case 'step':
    case 'iges': {
      if (format === 'step' && !looksLikeStep(buffer)) throw new ModelError('Это не файл STEP: нет заголовка ISO-10303-21.');
      progress('occt', null);
      return occtToGroup(await readWithOcct(request.occtWorkerUrl, format, buffer), format === 'iges');
    }
    case 'vrml':
      progress('parse', null);
      return parseVrml(buffer);
    case 'stl':
      progress('parse', null);
      return parseStl(buffer);
    case 'obj':
      progress('parse', null);
      return parseObj(buffer);
    case 'ply':
      progress('parse', null);
      return parsePly(buffer);
    case 'x3d':
      progress('parse', null);
      return parseX3d(await readText(buffer));
    case '3mf':
      throw new ModelError('3MF разбирается на основном потоке.');
  }
};

export const runPipeline = async (request: ConvertRequest, progress: ProgressHandler): Promise<ConvertResult> => {
  const meta = defaultMeta(request.format);
  let root: Object3D | null;
  if (request.type === 'raw') {
    root = rawToGroup(request.meshes);
  } else {
    root = await parseFile(request, progress);
    if (!root) {
      const info = inspectGltf(request.buffer);
      return { glb: null, stats: { triangles: info.triangles, sourceMeshes: info.primitiveInstances, drawCalls: info.primitiveInstances }, meta };
    }
  }

  let lastRatio = -1;
  progress('merge', 0);
  const merged = mergeByMaterial(root, ratio => {
    if (ratio - lastRatio < 0.02 && ratio < 1) return;
    lastRatio = ratio;
    progress('merge', ratio);
  });
  if (merged.triangles === 0 && merged.points === 0) {
    throw new ModelError('В файле нет поверхностей: возможно, выгружен только каркас (линии) или 2D-чертёж.');
  }

  progress('export', null);
  // Сведения о модели уходят в extras сцены GLB — их читает просмотр
  merged.scene.userData = { awms: meta };
  const glb = await exportGlb(merged.scene);
  return {
    glb,
    stats: { triangles: merged.triangles, sourceMeshes: merged.sourceMeshes, drawCalls: merged.drawCalls },
    meta,
  };
};
