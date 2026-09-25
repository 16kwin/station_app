// simulation.ts — обёртка над d3-force: силы как у графа Obsidian (ползунки «Силы»),
// переиспользование узлов по ключу, «разлёт» из центра и прогноз итоговой раскладки для камеры.
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import type { GraphEdgeKind, GraphForces } from './types';

export interface SimNode extends SimulationNodeDatum {
  id: string;
  radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  kind: GraphEdgeKind;
}

export interface SimNodeSpec {
  id: string;
  radius: number;
}

export interface SimLinkSpec {
  id: string;
  kind: GraphEdgeKind;
  source: string;
  target: string;
}

/**
 * Раскладка «веером» мини-карточки: узел-хаб тянется в точку (x, y), остальные узлы —
 * в точку (othersX, othersY) с силой притяжения центра.
 */
export interface HubAnchor {
  id: string;
  x: number;
  y: number;
  strength: number;
  othersX: number;
  othersY: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Перевод ползунков «Силы» в единицы d3: расстояние связи = d × distanceFactor,
 * отталкивание = −r × repelFactor, столкновение = радиус + collideGap.
 */
export interface ForceTuning {
  distanceFactor: number;
  repelFactor: number;
  collideGap: number;
}

/** Коэффициенты из спецификации (подобраны под точки Obsidian) — ими считается мини-карточка */
export const SPEC_TUNING: ForceTuning = { distanceFactor: 0.45, repelFactor: 32, collideGap: 10 };

/**
 * Коэффициенты полной страницы. Узлы здесь в 4 раза крупнее точек Obsidian и несут подписи
 * и цены, поэтому связи длиннее, а отталкивание сильнее: на демо-данных пересечений
 * «подпись — подпись» 5 вместо 22, «подпись — узел» 4 вместо 35 (прогон 42 узлов, 3 сида).
 * Ползунки, их диапазоны и значения по умолчанию — как в спецификации.
 */
export const FULL_TUNING: ForceTuning = { distanceFactor: 0.8, repelFactor: 80, collideGap: 24 };

const LINK_STRENGTH_FACTOR = 0.7;
const AFFILIATED_DISTANCE = 0.6;
const AFFILIATED_STRENGTH = 0.15;
const CENTER_FACTOR = 0.12;
const REPEL_DISTANCE_MAX = 900;
const VELOCITY_DECAY = 0.4;
/** Радиус круга, в который «Запустить анимацию» собирает узлы перед разлётом */
export const EXPLODE_RADIUS = 40;
/** Разогрев при смене состава графа и при изменении ползунков сил */
export const REHEAT_ALPHA = 0.6;
export const FORCES_ALPHA = 0.5;
/** Цель alpha, пока узел тянут мышью */
export const DRAG_ALPHA_TARGET = 0.3;

const endpointId = (end: string | number | SimNode): string => (typeof end === 'object' ? end.id : String(end));

const isPlaced = (node: SimNode): boolean => Number.isFinite(node.x) && Number.isFinite(node.y);

/** Навешивает силы — одна функция для живой симуляции и для прогноза раскладки */
const applyForces = (
  sim: Simulation<SimNode, SimLink>,
  links: SimLink[],
  forces: GraphForces,
  tuning: ForceTuning,
  hub: HubAnchor | null,
): void => {
  const distance = forces.distance * tuning.distanceFactor;
  const center = forces.center * CENTER_FACTOR;
  const isHub = (d: SimNode): boolean => hub !== null && d.id === hub.id;
  const targetX = (d: SimNode): number => (hub ? (isHub(d) ? hub.x : hub.othersX) : 0);
  const targetY = (d: SimNode): number => (hub ? (isHub(d) ? hub.y : hub.othersY) : 0);
  const pull = (d: SimNode): number => (hub && isHub(d) ? hub.strength : center);
  sim
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id(d => d.id)
        .distance(l => (l.kind === 'affiliated' ? distance * AFFILIATED_DISTANCE : distance))
        .strength(l => (l.kind === 'affiliated' ? AFFILIATED_STRENGTH * forces.link : forces.link * LINK_STRENGTH_FACTOR)),
    )
    .force('charge', forceManyBody<SimNode>().strength(-forces.repel * tuning.repelFactor).distanceMax(REPEL_DISTANCE_MAX))
    .force('x', forceX<SimNode>(targetX).strength(pull))
    .force('y', forceY<SimNode>(targetY).strength(pull))
    .force('collide', forceCollide<SimNode>(d => d.radius + tuning.collideGap));
};

export class GraphSimulation {
  private readonly sim: Simulation<SimNode, SimLink>;
  /** Все узлы, которые когда-либо были на графе: ключ → объект с позицией */
  private readonly cache = new Map<string, SimNode>();
  private readonly random: () => number;
  private readonly tuning: ForceTuning;
  private forces: GraphForces;
  private hub: HubAnchor | null = null;
  nodes: SimNode[] = [];
  links: SimLink[] = [];

  constructor(
    forces: GraphForces,
    onTick: () => void,
    onEnd: () => void,
    options: { tuning?: ForceTuning; random?: () => number } = {},
  ) {
    this.forces = forces;
    this.tuning = options.tuning ?? SPEC_TUNING;
    this.random = options.random ?? Math.random;
    this.sim = forceSimulation<SimNode, SimLink>([]).velocityDecay(VELOCITY_DECAY).stop();
    this.sim.on('tick', onTick).on('end', onEnd);
    this.applyForces();
  }

  private applyForces(sim: Simulation<SimNode, SimLink> = this.sim, links: SimLink[] = this.links): void {
    applyForces(sim, links, this.forces, this.tuning, this.hub);
  }

  get alpha(): number {
    return this.sim.alpha();
  }

  node(id: string): SimNode | undefined {
    return this.cache.get(id);
  }

  /**
   * Новый состав графа. Оставшиеся узлы сохраняют позиции и скорости, новые встают рядом
   * с соседями. Если ни у одного узла ещё нет позиции — «разлёт» из центра (alpha 1).
   * Возвращает true, если узлы расставлены разлётом.
   */
  setGraph(nodeSpecs: readonly SimNodeSpec[], linkSpecs: readonly SimLinkSpec[], alpha = REHEAT_ALPHA): boolean {
    const nodes = nodeSpecs.map(spec => {
      const cached = this.cache.get(spec.id);
      if (cached) {
        cached.radius = spec.radius;
        return cached;
      }
      const created: SimNode = { id: spec.id, radius: spec.radius, x: NaN, y: NaN, vx: 0, vy: 0 };
      this.cache.set(spec.id, created);
      return created;
    });
    const exploded = nodes.length > 0 && !nodes.some(isPlaced);
    if (exploded) this.scatter(nodes);
    else this.placeNewNodes(nodes, linkSpecs);

    this.nodes = nodes;
    this.links = linkSpecs.map(spec => ({ id: spec.id, kind: spec.kind, source: spec.source, target: spec.target }));
    this.sim.nodes(nodes);
    this.applyForces();
    if (nodes.length === 0) {
      this.sim.stop();
      return false;
    }
    this.sim.alpha(exploded ? 1 : Math.max(this.sim.alpha(), alpha)).restart();
    return exploded;
  }

  /** Ползунки «Силы»: пересобрать силы и разогреть */
  setForces(forces: GraphForces): void {
    this.forces = forces;
    this.applyForces();
    if (this.nodes.length) this.sim.alpha(Math.max(this.sim.alpha(), FORCES_ALPHA)).restart();
  }

  /** Узел-хаб мини-карточки; null — без него. Возвращает true, если раскладка изменилась */
  setHub(hub: HubAnchor | null): boolean {
    const prev = this.hub;
    const same =
      hub === prev ||
      (hub !== null &&
        prev !== null &&
        hub.id === prev.id &&
        hub.x === prev.x &&
        hub.y === prev.y &&
        hub.strength === prev.strength &&
        hub.othersX === prev.othersX &&
        hub.othersY === prev.othersY);
    if (same) return false;
    this.hub = hub;
    this.applyForces();
    return true;
  }

  /** Новые радиусы (ползунок «Размер узла») — силе столкновений нужны актуальные */
  setRadii(radiusOf: (id: string) => number | undefined): void {
    let changed = false;
    this.nodes.forEach(node => {
      const radius = radiusOf(node.id);
      if (radius !== undefined && Math.abs(radius - node.radius) > 1e-9) {
        node.radius = radius;
        changed = true;
      }
    });
    if (!changed) return;
    this.sim.force('collide', forceCollide<SimNode>(d => d.radius + this.tuning.collideGap));
    if (this.nodes.length) this.sim.alpha(Math.max(this.sim.alpha(), 0.3)).restart();
  }

  /** «Запустить анимацию»: узлы в случайные точки круга радиуса 40 вокруг центра и alpha 1 */
  explode(): void {
    if (!this.nodes.length) return;
    this.scatter(this.nodes);
    this.sim.alpha(1).restart();
  }

  /** Закрепить узел в точке (перетаскивание) */
  pin(id: string, x: number, y: number): void {
    const node = this.cache.get(id);
    if (!node) return;
    node.fx = x;
    node.fy = y;
  }

  /** Отпустить узел — дальше он снова подчиняется силам, как в Obsidian */
  release(id: string): void {
    const node = this.cache.get(id);
    if (!node) return;
    node.fx = null;
    node.fy = null;
  }

  /** Мягко разогреть (например, сменилась точка притяжения хаба) */
  reheat(alpha: number): void {
    if (this.nodes.length) this.sim.alpha(Math.max(this.sim.alpha(), alpha)).restart();
  }

  /** Пока тянут узел, симуляция не остывает (alphaTarget 0.3), после — плавно затухает */
  setDragging(active: boolean): void {
    this.sim.alphaTarget(active ? DRAG_ALPHA_TARGET : 0);
    if (active) this.sim.restart();
  }

  /** Текущие позиции видимых узлов */
  positions(): Map<string, Point> {
    return new Map(this.nodes.map(node => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }] as const));
  }

  /**
   * Прогноз раскладки после остывания: копия узлов и тех же сил, тики без отрисовки.
   * Камера заранее «вписывает» граф туда, где он окажется, и едет одновременно с узлами.
   */
  predict(maxTicks = 400): Map<string, Point> {
    const clones: SimNode[] = this.nodes.map(node => ({
      id: node.id,
      radius: node.radius,
      x: node.x,
      y: node.y,
      vx: node.vx,
      vy: node.vy,
      fx: node.fx,
      fy: node.fy,
    }));
    const links: SimLink[] = this.links.map(link => ({
      id: link.id,
      kind: link.kind,
      source: endpointId(link.source),
      target: endpointId(link.target),
    }));
    const copy = forceSimulation<SimNode, SimLink>(clones).stop().velocityDecay(VELOCITY_DECAY);
    this.applyForces(copy, links);
    const alpha = this.sim.alpha();
    const alphaMin = copy.alphaMin();
    if (alpha > alphaMin) {
      copy.alpha(alpha).alphaTarget(0);
      const ticks = Math.ceil(Math.log(alphaMin / alpha) / Math.log(1 - copy.alphaDecay()));
      copy.tick(Math.min(maxTicks, Math.max(0, ticks)));
    }
    copy.on('tick', null).on('end', null);
    return new Map(clones.map(node => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }] as const));
  }

  /** Остановить таймер d3 (размонтирование) */
  destroy(): void {
    this.sim.stop();
    this.sim.on('tick', null).on('end', null);
  }

  /**
   * Узлы в круг радиуса EXPLODE_RADIUS вокруг (0, 0), скорости сброшены.
   * Без хаба — случайные точки. С хабом (мини-карточка) — тот же круг, но упорядоченно:
   * хаб со стороны своей точки притяжения, остальные дугой напротив. Иначе поставщик
   * может «застрять» над хабом и лечь на его подпись.
   */
  private scatter(nodes: SimNode[]): void {
    const hub = this.hub;
    const hubNode = hub ? nodes.find(node => node.id === hub.id) : undefined;
    const place = (node: SimNode, angle: number, r: number) => {
      node.x = Math.cos(angle) * r;
      node.y = Math.sin(angle) * r;
      node.vx = 0;
      node.vy = 0;
    };
    if (!hub || !hubNode) {
      nodes.forEach(node => place(node, this.random() * Math.PI * 2, Math.sqrt(this.random()) * EXPLODE_RADIUS));
      return;
    }
    const hubAngle = Math.atan2(hub.y - hub.othersY, hub.x - hub.othersX);
    place(hubNode, hubAngle, EXPLODE_RADIUS * 0.6);
    const others = nodes.filter(node => node !== hubNode);
    const spread = Math.PI * 0.9;
    others.forEach((node, i) => {
      const t = others.length === 1 ? 0.5 : i / (others.length - 1);
      const angle = hubAngle + Math.PI + (0.5 - t) * spread + (this.random() - 0.5) * 0.12;
      place(node, angle, EXPLODE_RADIUS * (0.6 + 0.4 * this.random()));
    });
  }

  /** Новые узлы — рядом с уже расставленными соседями; без соседей — на краю текущего графа */
  private placeNewNodes(nodes: SimNode[], links: readonly SimLinkSpec[]): void {
    const byId = new Map(nodes.map(node => [node.id, node] as const));
    const neighbors = new Map<string, string[]>();
    links.forEach(link => {
      neighbors.set(link.source, [...(neighbors.get(link.source) ?? []), link.target]);
      neighbors.set(link.target, [...(neighbors.get(link.target) ?? []), link.source]);
    });
    const placed = nodes.filter(isPlaced);
    const cx = placed.reduce((acc, node) => acc + (node.x ?? 0), 0) / Math.max(1, placed.length);
    const cy = placed.reduce((acc, node) => acc + (node.y ?? 0), 0) / Math.max(1, placed.length);
    const spread = Math.max(80, ...placed.map(node => Math.hypot((node.x ?? 0) - cx, (node.y ?? 0) - cy)));

    let pending = nodes.filter(node => !isPlaced(node));
    let progress = true;
    while (pending.length && progress) {
      progress = false;
      const rest: SimNode[] = [];
      pending.forEach(node => {
        const around = (neighbors.get(node.id) ?? []).map(id => byId.get(id)).filter((n): n is SimNode => !!n && isPlaced(n));
        if (!around.length) {
          rest.push(node);
          return;
        }
        const angle = this.random() * Math.PI * 2;
        const r = 30 + this.random() * 30;
        node.x = around.reduce((acc, n) => acc + (n.x ?? 0), 0) / around.length + Math.cos(angle) * r;
        node.y = around.reduce((acc, n) => acc + (n.y ?? 0), 0) / around.length + Math.sin(angle) * r;
        node.vx = 0;
        node.vy = 0;
        progress = true;
      });
      pending = rest;
    }
    pending.forEach(node => {
      const angle = this.random() * Math.PI * 2;
      const r = spread * (0.7 + 0.3 * this.random());
      node.x = cx + Math.cos(angle) * r;
      node.y = cy + Math.sin(angle) * r;
      node.vx = 0;
      node.vy = 0;
    });
  }
}
