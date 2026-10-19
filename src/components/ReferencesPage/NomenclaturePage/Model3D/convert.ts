// convert.ts — подготовка модели со стороны страницы: запускает воркер конвертации (convert.worker.ts)
// и передаёт ему файл без копирования. 3MF разбирается здесь: его загрузчику нужен DOMParser, которого в воркере нет.
import type { BufferAttribute, InterleavedBufferAttribute, Mesh } from 'three';
import { ModelError } from './errors';
import type { ConvertRequest, ConvertResponse, ConvertResult, ConvertStage, ModelFormat, RawMesh } from './types';

export interface ConvertInput {
  name: string;
  format: ModelFormat;
  /** Содержимое файла; передаётся воркеру и после вызова недоступно */
  buffer: ArrayBuffer;
}

export type ConvertProgress = (stage: ConvertStage, ratio: number | null) => void;

/** Отмена пользователем — не ошибка, сообщение не показываем */
export const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'CanceledError');

const abortError = () => new DOMException('Отменено пользователем', 'AbortError');

/** Поток чтения STEP/IGES лежит в public/vendor/occt — адрес абсолютный, его открывает воркер */
const occtWorkerUrl = (): string => new URL(`${import.meta.env.BASE_URL}vendor/occt/occt-mesh-worker.js`, window.location.href).href;

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** Атрибут → плотный Float32Array из трёх компонент (позиции, нормали, цвета) */
const toFloat32 = (attribute: BufferAttribute | InterleavedBufferAttribute): Float32Array => {
  const array = new Float32Array(attribute.count * 3);
  for (let i = 0; i < attribute.count; i++) {
    array[i * 3] = attribute.getX(i);
    array[i * 3 + 1] = attribute.getY(i);
    array[i * 3 + 2] = attribute.getZ(i);
  }
  return array;
};

const runWorker = (request: ConvertRequest, transfer: Transferable[], onProgress: ConvertProgress, signal?: AbortSignal): Promise<ConvertResult> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const worker = new Worker(new URL('./convert.worker.ts', import.meta.url), { type: 'module', name: 'model3d-convert' });
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      finish();
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    worker.onmessage = (event: MessageEvent<ConvertResponse>) => {
      const data = event.data;
      if (data.type === 'progress') {
        onProgress(data.stage, data.ratio);
      } else if (data.type === 'done') {
        finish();
        resolve({ glb: data.glb, stats: data.stats, meta: data.meta });
      } else {
        finish();
        reject(new ModelError(data.message));
      }
    };
    worker.onerror = event => {
      event.preventDefault();
      finish();
      console.error('Воркер подготовки 3D-модели:', event.message);
      reject(new ModelError('Не удалось запустить подготовку модели в фоновом потоке. Обновите страницу и попробуйте ещё раз.'));
    };
    worker.postMessage(request, transfer);
  });

/** 3MF → сетки в координатах модели. Блокирует поток на время разбора — перед ним даём индикатору отрисоваться */
const parse3mf = async (buffer: ArrayBuffer, onProgress: ConvertProgress): Promise<RawMesh[]> => {
  onProgress('parse', null);
  await nextFrame();
  await nextFrame();
  // Загрузчик 3MF — отдельный кусок сборки. Не догрузился (после выкатки старых файлов на сервере нет, оборвалась
  // сеть) — понятное сообщение в окне, а не «ошибка сервера»; окно и текущие загрузки не трогаем
  let modules;
  try {
    modules = await Promise.all([import('three/examples/jsm/loaders/3MFLoader.js'), import('./merge')]);
  } catch (error) {
    console.error('3MF: не загрузился модуль разбора', error);
    throw new ModelError('Не удалось загрузить модуль разбора 3MF — обновите страницу.');
  }
  const [{ ThreeMFLoader }, { subsetGeometry }] = modules;
  let root;
  try {
    root = new ThreeMFLoader().parse(buffer);
  } catch (error) {
    console.error('3MF:', error);
    throw new ModelError('Не удалось прочитать 3MF: файл повреждён или в нём нет сеток.');
  }
  root.updateMatrixWorld(true);
  const meshes: RawMesh[] = [];
  root.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const parts =
      materials.length > 1 && mesh.geometry.groups.length > 0 && mesh.geometry.index
        ? mesh.geometry.groups.map(group => ({
            geometry: subsetGeometry(mesh.geometry, (mesh.geometry.index?.array ?? []).slice(group.start, group.start + group.count)),
            material: materials[group.materialIndex ?? 0],
          }))
        : [{ geometry: mesh.geometry.clone(), material: materials[0] }];
    for (const part of parts) {
      const geometry = part.geometry.applyMatrix4(mesh.matrixWorld);
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      const color = geometry.getAttribute('color');
      const index = geometry.getIndex();
      const materialColor = (part.material as { color?: { getHex: () => number } }).color;
      meshes.push({
        position: toFloat32(position),
        normal: normal ? toFloat32(normal) : null,
        index: index ? Uint32Array.from(index.array) : null,
        color: materialColor ? materialColor.getHex() : 0xb4bdcb,
        opacity: part.material.transparent ? part.material.opacity : 1,
        vertexColor: color && part.material.vertexColors ? toFloat32(color) : null,
      });
    }
  });
  return meshes;
};

/**
 * Подготовка модели: разбор, слияние по материалу, копия GLB. Возвращает glb === null, если GLB/glTF
 * можно смотреть как есть. Отмена через signal — ошибка AbortError.
 */
export const convertModel = async (input: ConvertInput, onProgress: ConvertProgress, signal?: AbortSignal): Promise<ConvertResult> => {
  if (input.format === '3mf') {
    const meshes = await parse3mf(input.buffer, onProgress);
    if (signal?.aborted) throw abortError();
    const transfer = meshes.flatMap(mesh =>
      [mesh.position, mesh.normal, mesh.index, mesh.vertexColor]
        .filter((array): array is Float32Array | Uint32Array => array !== null)
        .map(array => array.buffer as ArrayBuffer),
    );
    return runWorker({ type: 'raw', name: input.name, format: input.format, meshes }, transfer, onProgress, signal);
  }
  return runWorker(
    { type: 'file', name: input.name, format: input.format, buffer: input.buffer, occtWorkerUrl: occtWorkerUrl() },
    [input.buffer],
    onProgress,
    signal,
  );
};
