// model3dGltfRefs.test.ts — разбор glTF при подготовке копии модели (Model3D/loaders.ts, пакет F4a, раздел 8.2
// проекта): загрузчик не ходит по внешним адресам из файла (buffers[].uri, images[].uri) — ни на чужой сервер,
// ни в наш API с cookie. Пропускаются только встроенные данные (data:, blob:).
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { EXTERNAL_GLTF_REFS_ERROR, parseGltf } from '../../src/components/ReferencesPage/NomenclaturePage/Model3D/loaders';
import { ModelError } from '../../src/components/ReferencesPage/NomenclaturePage/Model3D/errors';

// Разбор идёт в воркере: three.js обращается к self (self.URL у картинок) и ProgressEvent (FileLoader),
// которых в Node нет. Тест запускается в своём процессе, подмена не выходит за его пределы
const workerGlobals = globalThis as Record<string, unknown>;
if (!('self' in workerGlobals)) workerGlobals.self = globalThis;
if (typeof workerGlobals.ProgressEvent === 'undefined') {
  workerGlobals.ProgressEvent = class ProgressEvent extends Event {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly total: number;
    constructor(type: string, init: { lengthComputable?: boolean; loaded?: number; total?: number } = {}) {
      super(type);
      this.lengthComputable = init.lengthComputable ?? false;
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
    }
  };
}

/** Треугольник: три вершины float32 */
const POSITIONS = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const EMBEDDED_BUFFER = 'data:application/octet-stream;base64,' + Buffer.from(POSITIONS.buffer).toString('base64');

interface GltfOptions {
  bufferUri?: string;
  imageUri?: string;
}

/** Текстовый glTF 2.0 с одной сеткой; с imageUri — ещё материал с текстурой по этому адресу */
const gltf = ({ bufferUri = EMBEDDED_BUFFER, imageUri }: GltfOptions = {}): ArrayBuffer => {
  const json: Record<string, unknown> = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, ...(imageUri ? { material: 0 } : {}) }] }],
    buffers: [{ byteLength: POSITIONS.byteLength, uri: bufferUri }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: POSITIONS.byteLength }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
  };
  if (imageUri) {
    json.materials = [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }];
    json.textures = [{ source: 0 }];
    json.images = [{ uri: imageUri }];
  }
  const bytes = new TextEncoder().encode(JSON.stringify(json));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

/** Адреса, по которым загрузчик пытался пойти сетью (встроенные data: пропускаются к настоящему fetch) */
let fetched: string[] = [];

beforeEach(() => {
  fetched = [];
  const realFetch = globalThis.fetch;
  mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('data:')) return realFetch(input, init);
    fetched.push(url);
    return Promise.reject(new Error('сеть в тесте запрещена: ' + url));
  });
  // GLTFLoader сам пишет в консоль о незагруженной текстуре
  mock.method(console, 'error', () => {});
  mock.method(console, 'warn', () => {});
});
afterEach(() => {
  mock.restoreAll();
});

const rejectsAsExternal = async (buffer: ArrayBuffer) => {
  await assert.rejects(parseGltf(buffer), (error: unknown) => {
    assert.ok(error instanceof ModelError, 'понятная пользователю ошибка');
    assert.equal(error.message, EXTERNAL_GLTF_REFS_ERROR);
    return true;
  });
};

describe('внешние ссылки glTF не загружаются', () => {
  test('буфер на чужом сервере', async () => {
    await rejectsAsExternal(gltf({ bufferUri: 'http://192.0.2.10/leak.bin' }));
    assert.deepEqual(fetched, []);
  });

  test('буфер по относительному адресу (считался бы от адреса приложения — с cookie)', async () => {
    await rejectsAsExternal(gltf({ bufferUri: 'model.bin' }));
    await rejectsAsExternal(gltf({ bufferUri: '/api/nomenclature/models/3d/x/source' }));
    assert.deepEqual(fetched, []);
  });

  test('текстура по внешнему адресу: разбор не прерывается, но модель отклоняется', async () => {
    await rejectsAsExternal(gltf({ imageUri: 'https://192.0.2.10/track.png' }));
    assert.deepEqual(fetched, []);
  });
});

describe('встроенные данные', () => {
  test('glTF со встроенным буфером (data:) разбирается', async () => {
    const scene = await parseGltf(gltf());
    let meshes = 0;
    scene.traverse(object => {
      if ((object as { isMesh?: boolean }).isMesh) meshes += 1;
    });
    assert.equal(meshes, 1);
    assert.deepEqual(fetched, []);
  });

  test('повреждённый файл — прежняя ошибка разбора, а не «внешние файлы»', async () => {
    const bytes = new TextEncoder().encode('{"asset":{"version":"2.0"},"buffers":');
    await assert.rejects(parseGltf(bytes.buffer as ArrayBuffer), (error: unknown) => {
      assert.ok(error instanceof ModelError);
      assert.match(error.message, /^Не удалось прочитать glTF/);
      return true;
    });
  });
});
