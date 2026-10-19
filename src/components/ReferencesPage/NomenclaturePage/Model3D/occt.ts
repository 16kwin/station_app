// occt.ts — STEP и IGES через occt-import-js (OpenCascade в WebAssembly). Чтение идёт в отдельном потоке
// /vendor/occt/occt-mesh-worker.js: его запускает воркер конвертации, основной поток не занят.
// Сетки STEP раскрашены по граням — грани одного цвета собираются в одну сетку.
import { BufferAttribute, BufferGeometry, Color, Group, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { ModelError } from './errors';
import { DEFAULT_MODEL_COLOR, subsetGeometry } from './merge';

type Rgb = [number, number, number];

/** Сетка из occt-mesh-worker.js */
export interface OcctMesh {
  name: string;
  position: Float32Array;
  normal: Float32Array | null;
  index: Uint32Array;
  color: Rgb | null;
  /** Грани исходного тела: диапазон треугольников и цвет грани */
  faces: { first: number; last: number; color: Rgb | null }[];
}

type OcctReply = { ok: true; meshes: OcctMesh[] } | { ok: false; message: string | null };

/** Точность сетки: доля габарита и угол — как в Online 3D Viewer; координаты переводятся в миллиметры */
const OCCT_PARAMS = {
  linearUnit: 'millimeter',
  linearDeflectionType: 'bounding_box_ratio',
  linearDeflection: 0.001,
  angularDeflection: 0.5,
};

/** Заголовок STEP: «ISO-10303-21;» в начале файла */
export const looksLikeStep = (buffer: ArrayBuffer): boolean => {
  // TextDecoder сам отбрасывает метку BOM
  const head = new TextDecoder('utf-8').decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512)));
  return /^\s*ISO-10303-21\s*;/i.test(head);
};

/** Чтение STEP/IGES в отдельном потоке. buffer передаётся без копирования и после вызова недоступен */
export const readWithOcct = (workerUrl: string, format: 'step' | 'iges', buffer: ArrayBuffer): Promise<OcctMesh[]> =>
  new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new ModelError('Браузер не умеет читать STEP в фоновом потоке. Обновите браузер (Chrome, Яндекс Браузер, Edge или Firefox).'));
      return;
    }
    const worker = new Worker(workerUrl);
    worker.onmessage = (event: MessageEvent<OcctReply>) => {
      worker.terminate();
      const reply = event.data;
      if (reply.ok) {
        resolve(reply.meshes);
        return;
      }
      if (reply.message) console.error('occt-import-js:', reply.message);
      reject(
        new ModelError(
          format === 'step'
            ? 'OpenCascade не смог прочитать STEP. Проверьте, что в файле есть 3D-тела (AP203, AP214 или AP242), а не только чертёж, и выгрузите его заново.'
            : 'OpenCascade не смог прочитать IGES. Выгрузите модель заново, лучше в STEP AP214.',
        ),
      );
    };
    worker.onerror = event => {
      event.preventDefault();
      worker.terminate();
      reject(new ModelError('Не удалось запустить чтение STEP/IGES: нет файлов /vendor/occt/ на сервере приложения или не хватило памяти.'));
    };
    worker.postMessage({ format, buffer: new Uint8Array(buffer), params: OCCT_PARAMS }, [buffer]);
  });

const colorKey = (rgb: Rgb | null) => (rgb ? rgb.map(value => Math.round(value * 255)).join(',') : 'none');

const materialFor = (rgb: Rgb | null) =>
  new MeshStandardMaterial({
    color: rgb ? new Color().setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace) : new Color(DEFAULT_MODEL_COLOR),
  });

const isBlack = (rgb: Rgb | null) => rgb !== null && rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0;

/**
 * Сетки OpenCascade → группа three: по сетке на каждый цвет граней тела.
 * blackIsUnset — у IGES «нет цвета» приходит как чёрный, такую модель красим цветом по умолчанию.
 * Целиком чёрную модель (так STEP выгружают САПР, когда цвет не назначен) тоже красим цветом по умолчанию:
 * чёрный силуэт без бликов не разглядеть. Чёрная деталь в цветной сборке остаётся чёрной.
 */
export const occtToGroup = (meshes: OcctMesh[], blackIsUnset = false): Group => {
  const group = new Group();
  const colors = meshes.flatMap(mesh => [mesh.color, ...mesh.faces.map(face => face.color)]).filter(rgb => rgb !== null);
  const dropBlack = blackIsUnset || (colors.length > 0 && colors.every(isBlack));
  const colorOf = (rgb: Rgb | null): Rgb | null => (dropBlack && isBlack(rgb) ? null : rgb);
  for (const source of meshes) {
    const mesh: OcctMesh = { ...source, color: colorOf(source.color), faces: source.faces.map(face => ({ ...face, color: colorOf(face.color) })) };
    if (mesh.position.length < 9 || mesh.index.length < 3) continue;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(mesh.position, 3));
    if (mesh.normal && mesh.normal.length === mesh.position.length) geometry.setAttribute('normal', new BufferAttribute(mesh.normal, 3));
    geometry.setIndex(new BufferAttribute(mesh.index, 1));

    // Треугольники по цветам граней; грань без цвета берёт цвет тела
    const byColor = new Map<string, { rgb: Rgb | null; ranges: [number, number][] }>();
    const lastTriangle = mesh.index.length / 3 - 1;
    for (const face of mesh.faces) {
      if (face.first < 0 || face.last < face.first || face.last > lastTriangle) continue;
      const rgb = face.color ?? mesh.color;
      const key = colorKey(rgb);
      const entry = byColor.get(key) ?? { rgb, ranges: [] };
      entry.ranges.push([face.first, face.last]);
      byColor.set(key, entry);
    }
    if (byColor.size <= 1) {
      const only = byColor.values().next().value;
      group.add(new Mesh(geometry, materialFor(only ? only.rgb : mesh.color)));
      continue;
    }
    for (const { rgb, ranges } of byColor.values()) {
      const count = ranges.reduce((sum, [first, last]) => sum + (last - first + 1) * 3, 0);
      const vertices = new Uint32Array(count);
      let offset = 0;
      for (const [first, last] of ranges) {
        vertices.set(mesh.index.subarray(first * 3, (last + 1) * 3), offset);
        offset += (last - first + 1) * 3;
      }
      group.add(new Mesh(subsetGeometry(geometry, vertices), materialFor(rgb)));
    }
  }
  return group;
};
