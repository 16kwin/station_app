// viewer.ts — просмотр 3D-модели на three.js: вращение/сдвиг/масштаб мышью (OrbitControls с плавностью),
// мягкий свет, виды «Изометрия / Спереди / Сверху / Сбоку», «По размеру», рёбра. Отрисовка — только когда
// что-то изменилось. dispose() освобождает всё: геометрии, материалы, текстуры, контекст WebGL.
import {
  Box3,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  LoadingManager,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Sphere,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry, Material, Mesh, Object3D, Points } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ModelError } from './errors';
import type { SceneMeta, UpAxis } from './types';

export type ViewName = 'iso' | 'front' | 'top' | 'side';

/** Сведения о загруженной модели для подписи под просмотром */
export interface LoadedModelInfo {
  /** Габариты по осям файла (до поворота «вертикальной оси») */
  size: { x: number; y: number; z: number };
  triangles: number;
  meta: SceneMeta;
}

/** Направления камеры для видов; мир — Y вверх, «спереди» смотрим вдоль −Z */
const VIEW_DIRECTIONS: Record<ViewName, Vector3> = {
  iso: new Vector3(1, 1, 1).normalize(),
  front: new Vector3(0, 0, 1),
  // Крошечный сдвиг по Z: камера ровно над моделью теряет направление «вверх»
  top: new Vector3(0, 1, 1e-4).normalize(),
  side: new Vector3(1, 0, 0),
};

const EDGE_ANGLE = 30;
const TWEEN_MS = 450;

const EXTERNAL_REFS_ERROR = 'Модель ссылается на внешние файлы — такие модели не открываются.';

/** Встроенные данные (data:) и куски самого файла — картинки из bufferView GLTFLoader отдаёт как blob: */
const isEmbeddedUrl = (url: string) => /^(data|blob):/i.test(url);

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const isMesh = (object: Object3D): object is Mesh => (object as Mesh).isMesh === true;

const materialsOf = (object: Object3D): Material[] => {
  const material = (object as Mesh | Points).material;
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
};

const readMeta = (userData: Record<string, unknown>): SceneMeta | null => {
  const meta = userData.awms as Partial<SceneMeta> | undefined;
  if (!meta || (meta.upAxis !== 'Y' && meta.upAxis !== 'Z') || typeof meta.sourceFormat !== 'string') return null;
  return { sourceFormat: meta.sourceFormat, upAxis: meta.upAxis, unit: typeof meta.unit === 'string' ? meta.unit : '' };
};

/** Освобождение объектов three: геометрии, материалы и их текстуры */
const disposeObject = (root: Object3D) => {
  root.traverse(object => {
    const geometry = (object as Mesh).geometry as BufferGeometry | undefined;
    geometry?.dispose();
    for (const material of materialsOf(object)) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.dispose();
      }
      material.dispose();
    }
  });
};

interface Tween {
  fromPosition: Vector3;
  toPosition: Vector3;
  fromTarget: Vector3;
  toTarget: Vector3;
  start: number;
}

export class ModelViewerEngine {
  private readonly container: HTMLElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(35, 1, 0.1, 1000);
  private readonly controls: OrbitControls;
  /** Поворот «вертикальной оси»: модели с осью Z вверх кладём на бок */
  private readonly pivot = new Group();
  private readonly pmrem: PMREMGenerator;
  private readonly environment: Texture;
  private readonly resizeObserver: ResizeObserver;
  private readonly edgeMaterial = new LineBasicMaterial({ color: 0x2d4059, transparent: true, opacity: 0.42 });
  private model: Object3D | null = null;
  private edges: LineSegments[] = [];
  private edgesVisible = false;
  private edgesTask: Promise<void> | null = null;
  private radius = 1;
  private lastView: ViewName = 'iso';
  private tween: Tween | null = null;
  private frame = 0;
  private needsRender = true;
  private paused = false;
  private disposed = false;
  private loadToken = 0;

  constructor(container: HTMLElement, onContextLost: () => void) {
    this.container = container;
    // Ошибку создания (нет WebGL) ловит вызывающий код
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = NeutralToneMapping;
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.outline = 'none';
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      // dispose() сам гасит контекст (forceContextLoss) — это не сбой. В режиме разработки React
      // создаёт и сразу закрывает первый движок, и без этой проверки окно показывало ошибку видеокарты
      if (!this.disposed) onContextLost();
    });
    container.appendChild(canvas);

    // Мягкий свет: небо/земля и два направленных источника, привязанных к камере, — освещённая сторона та, на которую смотрим
    this.scene.add(new HemisphereLight(0xffffff, 0xb9c3d3, 1.1));
    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(1.2, 1.6, 2);
    const fill = new DirectionalLight(0xffffff, 0.45);
    fill.position.set(-2, -0.6, -1);
    this.camera.add(key, fill);
    this.scene.add(this.camera, this.pivot);
    // Отражения «комнаты» — металл из GLB без них выглядит чёрным
    this.pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = this.pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = 0.45;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.9;
    this.controls.zoomToCursor = true;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener('change', () => {
      this.needsRender = true;
    });
    this.controls.addEventListener('start', () => {
      this.tween = null;
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.frame = requestAnimationFrame(this.loop);
  }

  /** Загрузка GLB/glTF. Возвращает сведения о модели; бросает ModelError с понятным текстом */
  async load(buffer: ArrayBuffer, fallbackMeta: SceneMeta, upAxis: UpAxis | null): Promise<LoadedModelInfo> {
    const token = ++this.loadToken;
    // Файл с сервера проверен только по заголовку: по images[].uri / buffers[].uri браузер пошёл бы по любому
    // адресу (внутренняя сеть, чужой сервер, наш API с cookie). Пропускаем только встроенные данные — прочее
    // отклоняем до запроса
    const blocked: string[] = [];
    const manager = new LoadingManager();
    manager.setURLModifier(url => {
      if (isEmbeddedUrl(url)) return url;
      blocked.push(url);
      throw new ModelError(EXTERNAL_REFS_ERROR);
    });
    const loader = new GLTFLoader(manager);
    loader.setMeshoptDecoder(MeshoptDecoder);
    let root: Object3D;
    try {
      root = (await loader.parseAsync(buffer, '')).scene;
    } catch (error) {
      if (blocked.length > 0) {
        console.warn('GLTFLoader: внешние ссылки не загружены', blocked);
        throw new ModelError(EXTERNAL_REFS_ERROR);
      }
      console.error('GLTFLoader:', error);
      throw new ModelError('Не удалось открыть модель: файл повреждён или его формат не поддерживается.');
    }
    // Незагруженная текстура разбор не прерывает (GLTFLoader ставит вместо неё null) — проверяем отдельно
    if (blocked.length > 0) {
      console.warn('GLTFLoader: внешние ссылки не загружены', blocked);
      disposeObject(root);
      throw new ModelError(EXTERNAL_REFS_ERROR);
    }
    if (this.disposed || token !== this.loadToken) {
      disposeObject(root);
      throw new ModelError('Загрузка прервана');
    }

    const meta = readMeta(root.userData) ?? fallbackMeta;
    let triangles = 0;
    root.traverse(object => {
      if (isMesh(object)) {
        const geometry = object.geometry;
        triangles += (geometry.index ? geometry.index.count : geometry.getAttribute('position').count) / 3;
      }
      for (const material of materialsOf(object)) {
        // Нормали из САПР бывают развёрнуты; смещение глубины — чтобы рёбра не мерцали на гранях
        material.side = DoubleSide;
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;
      }
    });

    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root, true);
    if (box.isEmpty()) {
      disposeObject(root);
      throw new ModelError('В модели нет видимой геометрии.');
    }
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    // Модель — в начало координат: вращение вокруг её центра, нет дрожания на больших координатах
    root.position.sub(center);
    this.radius = Math.max(box.getBoundingSphere(new Sphere()).radius, 1e-6);

    this.clearModel();
    this.model = root;
    this.pivot.add(root);
    this.applyUpAxis(upAxis ?? meta.upAxis);
    this.setView('iso', false);
    if (this.edgesVisible) void this.setEdges(true);
    return { size: { x: size.x, y: size.y, z: size.z }, triangles: Math.round(triangles), meta };
  }

  /** Убрать модель (все модели удалены) */
  clear() {
    this.loadToken += 1;
    this.clearModel();
  }

  setUpAxis(axis: UpAxis) {
    this.applyUpAxis(axis);
    this.setView(this.lastView, true);
  }

  /** Вид с выбранной стороны с подбором расстояния под размер модели */
  setView(view: ViewName, animate = true) {
    this.lastView = view;
    this.moveCamera(VIEW_DIRECTIONS[view].clone(), animate);
  }

  /** «По размеру»: то же направление взгляда, модель целиком в кадре */
  fit(animate = true) {
    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() < 1e-12) direction.copy(VIEW_DIRECTIONS.iso);
    this.moveCamera(direction.normalize(), animate);
  }

  /** Рёбра по углу между гранями; строятся при первом включении, по сетке за кадр */
  async setEdges(visible: boolean): Promise<void> {
    this.edgesVisible = visible;
    if (visible && this.edges.length === 0) {
      if (!this.edgesTask) {
        const task: Promise<void> = this.buildEdges().finally(() => {
          if (this.edgesTask === task) this.edgesTask = null;
        });
        this.edgesTask = task;
      }
      await this.edgesTask;
    }
    this.edges.forEach(line => {
      line.visible = this.edgesVisible;
    });
    this.needsRender = true;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) {
      this.resize();
      this.needsRender = true;
    }
  }

  dispose() {
    this.disposed = true;
    this.loadToken += 1;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.clearModel();
    this.edgeMaterial.dispose();
    this.environment.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private applyUpAxis(axis: UpAxis) {
    this.pivot.rotation.set(axis === 'Z' ? -Math.PI / 2 : 0, 0, 0);
    this.pivot.updateMatrixWorld(true);
    this.needsRender = true;
  }

  private async buildEdges() {
    const model = this.model;
    if (!model) return;
    const meshes: Mesh[] = [];
    model.traverse(object => {
      if (isMesh(object)) meshes.push(object);
    });
    for (const mesh of meshes) {
      if (this.disposed || this.model !== model) return;
      const line = new LineSegments(new EdgesGeometry(mesh.geometry, EDGE_ANGLE), this.edgeMaterial);
      line.visible = this.edgesVisible;
      // Рёбра — дочерний объект сетки: повторяют её положение
      mesh.add(line);
      this.edges.push(line);
      this.needsRender = true;
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }

  private clearModel() {
    // Рёбра снимаем до освобождения модели: их материал общий и ещё понадобится
    this.edgesTask = null;
    this.edges.forEach(line => {
      line.removeFromParent();
      line.geometry.dispose();
    });
    this.edges = [];
    if (this.model) {
      this.pivot.remove(this.model);
      disposeObject(this.model);
      this.model = null;
    }
    this.needsRender = true;
  }

  private distanceFor(radius: number): number {
    const vertical = (this.camera.fov * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * this.camera.aspect);
    return (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.06;
  }

  private moveCamera(direction: Vector3, animate: boolean) {
    const distance = this.distanceFor(this.radius);
    this.camera.near = this.radius / 200;
    this.camera.far = this.radius * 60 + distance;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = this.radius * 0.02;
    this.controls.maxDistance = this.radius * 15;
    const toPosition = direction.multiplyScalar(distance);
    const toTarget = new Vector3(0, 0, 0);
    // Остаток инерции после вращения мышью гасим до начала перелёта
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
    if (!animate) {
      this.tween = null;
      this.camera.position.copy(toPosition);
      this.controls.target.copy(toTarget);
      this.controls.update();
      this.needsRender = true;
      return;
    }
    this.tween = {
      fromPosition: this.camera.position.clone(),
      toPosition,
      fromTarget: this.controls.target.clone(),
      toTarget,
      start: performance.now(),
    };
  }

  private resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }

  private loop = (time: number) => {
    this.frame = requestAnimationFrame(this.loop);
    if (this.paused) return;
    if (this.tween) {
      const t = Math.min(1, (time - this.tween.start) / TWEEN_MS);
      const k = easeInOutCubic(Math.max(0, t));
      this.camera.position.lerpVectors(this.tween.fromPosition, this.tween.toPosition, k);
      this.controls.target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, k);
      this.camera.lookAt(this.controls.target);
      this.needsRender = true;
      if (t >= 1) {
        this.tween = null;
        this.controls.update();
      }
    } else if (this.controls.update()) {
      this.needsRender = true;
    }
    if (this.needsRender) {
      this.needsRender = false;
      this.renderer.render(this.scene, this.camera);
    }
  };
}
