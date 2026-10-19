// awmsBuildVariant.ts — плагин варианта поставки фронтенда (уровень L4, раздел 8.5 проекта «Дискретное
// отключение функций»). Вариант исключает из сборки код модулей: видео, 3D-модели, карту станций, граф закупок,
// заказы и ТКП, живые обновления, PWA, вкладки «Интеграции».
//  • config — флаги сборки __AWMS_HAS_*__ (src/types/awms-build.d.ts): у исключённого модуля false, и условный
//    import() в src/services/features/lazyModules.ts в сборку не попадает;
//  • generateBundle — роняет сборку, если код исключённого модуля всё же оказался в чанках (модуль его каталога
//    или пакета с renderedLength > 0 — значит, его импортируют мимо lazyModules), и называет, откуда импорт.
//    Тут же собираются пакеты npm, реально вошедшие в сборку, и карта «файл → модули» для awms-build.json;
//  • writeBundle (после swBuildId) — без модуля убирает его файлы из public/ (vendor/occt, vendor/sockjs,
//    manifest.json, offline.html), без PWA ставит ликвидатор вместо sw.js, иначе называет кэш статики в sw.js
//    по варианту; пишет awms-build.json (вариант, исключения, пакеты, чанки, SHA-256 файлов) и SHA256SUMS.
// Вариант задают переменные окружения (их ставит build/build-variant.mjs):
//   AWMS_VARIANT=isolated|standard|full — пресет;  AWMS_EXCLUDE=video,model3d,pwa — свой состав.
// Без обеих — полная сборка, как `npm run build`. Неизвестное имя — ошибка: молча собрать полный вариант вместо
// урезанного хуже, чем не собрать. Списки ниже для обхода проверки не ослабляются: найденный статический
// импорт исправляет владелец файла.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ResolvedConfig, Rollup } from 'vite'

/** Модули, которые вариант поставки может исключить; порядок — как в src/services/features/buildFlags.ts */
export const BUILD_MODULE_KEYS = ['video', 'model3d', 'map', 'graph', 'orders', 'websocket', 'pwa', 'integrations'] as const
export type BuildModuleKey = (typeof BUILD_MODULE_KEYS)[number]

export interface BuildModuleSpec {
  /** Название для сообщений */
  title: string
  /** Константа сборки (src/types/awms-build.d.ts) */
  flag: string
  /** Каталоги исходников модуля, от корня проекта, с «/» на конце */
  dirs: readonly string[]
  /** Отдельные файлы модуля, от корня проекта */
  files: readonly string[]
  /** Пакеты npm, которые есть только у модуля */
  packages: readonly string[]
  /** Файлы и каталоги из public/, которые без модуля удаляются из сборки */
  publicPaths: readonly string[]
}

export const BUILD_MODULES: Readonly<Record<BuildModuleKey, BuildModuleSpec>> = {
  video: {
    title: 'видео',
    flag: '__AWMS_HAS_VIDEO__',
    dirs: ['src/components/DocumentsPage/VideoArchive/'],
    files: [],
    packages: [],
    publicPaths: [],
  },
  model3d: {
    title: '3D-модели',
    flag: '__AWMS_HAS_MODEL3D__',
    dirs: ['src/components/ReferencesPage/NomenclaturePage/Model3D/'],
    files: [],
    packages: ['three', 'occt-import-js'],
    publicPaths: ['vendor/occt'],
  },
  map: {
    title: 'карта станций',
    flag: '__AWMS_HAS_MAP__',
    dirs: ['src/components/StationsPage/StationMap/'],
    files: [],
    packages: [],
    publicPaths: [],
  },
  graph: {
    title: 'граф закупок',
    flag: '__AWMS_HAS_GRAPH__',
    dirs: ['src/components/mainPage/purchaseGraph/'],
    files: [],
    packages: ['d3-force'],
    publicPaths: [],
  },
  orders: {
    title: 'заказы и ТКП',
    flag: '__AWMS_HAS_ORDERS__',
    dirs: ['src/components/AnalyticsPage/'],
    files: [],
    packages: [],
    publicPaths: [],
  },
  websocket: {
    title: 'живые обновления',
    flag: '__AWMS_HAS_WEBSOCKET__',
    dirs: [],
    files: [],
    packages: ['@stomp/stompjs', 'sockjs-client'],
    publicPaths: ['vendor/sockjs'],
  },
  pwa: {
    title: 'PWA',
    flag: '__AWMS_HAS_PWA__',
    // Каталог Pwa/ не исключается: снятие service worker (disable) нужно и сборке без PWA. Регистрацию
    // ловит сигнатура serviceWorker.register в build/verify-dist.mjs, sw.js заменяется ликвидатором
    dirs: [],
    files: [],
    packages: [],
    publicPaths: ['manifest.json', 'offline.html'],
  },
  integrations: {
    title: 'вкладки «Интеграции»',
    flag: '__AWMS_HAS_INTEGRATIONS__',
    dirs: [],
    files: [
      'src/components/ReferencesPage/NomenclaturePage/IntegrationTab.tsx',
      'src/components/ReferencesPage/SuppliersPage/SupplierIntegrationTab.tsx',
      'src/components/ReferencesPage/ManufacturersPage/ManufacturerIntegrationTab.tsx',
    ],
    packages: [],
    publicPaths: [],
  },
}

/**
 * Пресеты — по столбцам I/S/F таблицы функций (раздел 4.2): что выключено в пресете потолка, того нет и в сборке.
 * standard оставляет 3D-модели и карту станций; full — всё, как `npm run build`
 */
export const BUILD_PRESETS = {
  isolated: [...BUILD_MODULE_KEYS],
  standard: ['video', 'graph', 'orders', 'websocket', 'pwa', 'integrations'],
  full: [],
} as const satisfies Record<string, readonly BuildModuleKey[]>
export type BuildPresetName = keyof typeof BUILD_PRESETS

export interface BuildVariant {
  /** Имя варианта: пресет или custom-<модули> */
  name: string
  /** Исключённые модули, в порядке BUILD_MODULE_KEYS */
  excluded: readonly BuildModuleKey[]
}

const isModuleKey = (value: string): value is BuildModuleKey => (BUILD_MODULE_KEYS as readonly string[]).includes(value)
const isPresetName = (value: string): value is BuildPresetName => Object.hasOwn(BUILD_PRESETS, value)
const ordered = (keys: Iterable<BuildModuleKey>): BuildModuleKey[] => {
  const set = new Set(keys)
  return BUILD_MODULE_KEYS.filter(key => set.has(key))
}
const sameModules = (a: readonly BuildModuleKey[], b: readonly BuildModuleKey[]) => ordered(a).join() === ordered(b).join()

/** Вариант по переменным окружения AWMS_VARIANT и AWMS_EXCLUDE; ошибка в имени — исключение с понятным текстом */
export function resolveVariant(env: Readonly<Record<string, string | undefined>>): BuildVariant {
  const presetName = (env.AWMS_VARIANT ?? '').trim()
  const list = (env.AWMS_EXCLUDE ?? '').trim()
  let fromPreset: BuildModuleKey[] | null = null
  if (presetName) {
    if (!isPresetName(presetName)) {
      throw new Error(`AWMS_VARIANT=${presetName}: такого варианта нет. Есть: ${Object.keys(BUILD_PRESETS).join(', ')}`)
    }
    fromPreset = [...BUILD_PRESETS[presetName]]
  }
  let fromList: BuildModuleKey[] | null = null
  if (list) {
    const items = list.split(',').map(item => item.trim()).filter(Boolean)
    const unknown = items.filter(item => !isModuleKey(item))
    if (unknown.length) {
      throw new Error(`AWMS_EXCLUDE: неизвестные модули ${unknown.join(', ')}. Есть: ${BUILD_MODULE_KEYS.join(', ')}`)
    }
    fromList = ordered(items.filter(isModuleKey))
  }
  if (fromPreset && fromList && !sameModules(fromPreset, fromList)) {
    throw new Error(
      `AWMS_VARIANT=${presetName} и AWMS_EXCLUDE=${list} задают разный состав сборки — оставьте одну переменную`,
    )
  }
  const excluded = ordered(fromPreset ?? fromList ?? [])
  const preset = presetName || Object.keys(BUILD_PRESETS).find(name => isPresetName(name) && sameModules(BUILD_PRESETS[name], excluded))
  return { name: preset || `custom-${excluded.join('-')}`, excluded }
}

/** Значения флагов сборки для define: 'true' — модуль в сборке */
export const buildDefines = (excluded: readonly BuildModuleKey[]): Record<string, string> =>
  Object.fromEntries(BUILD_MODULE_KEYS.map(key => [BUILD_MODULES[key].flag, String(!excluded.includes(key))]))

/** Идентификатор сборки: 20261013-192200-123 (UTC). Один на sw.js и awms-build.json */
export const makeBuildId = (date = new Date()): string =>
  date.toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').replace('Z', '')

// ---------- Модули сборщика → модули поставки ----------

/** id модуля сборщика → путь файла с «/»; null — служебный модуль без файла (\0vite/preload-helper и т. п.) */
export const modulePath = (id: string): string | null => {
  const path = (id.startsWith('\0') ? id.slice(1) : id).split('?')[0].replace(/\\/g, '/')
  return /^(?:[a-zA-Z]:)?\//.test(path) ? path : null
}

/** Пакет npm, которому принадлежит файл: имя и каталог (последний node_modules в пути) */
export const packageOf = (path: string): { name: string; dir: string } | null => {
  const marker = '/node_modules/'
  const at = path.lastIndexOf(marker)
  if (at < 0) return null
  const parts = path.slice(at + marker.length).split('/')
  const name = parts[0].startsWith('@') ? `${parts[0]}/${parts[1] ?? ''}` : parts[0]
  return name ? { name, dir: path.slice(0, at + marker.length) + name } : null
}

/** Путь файла от корня проекта (с «/»); null — вне проекта */
export const projectPath = (path: string, root: string): string | null => {
  const base = root.replace(/\\/g, '/').replace(/\/+$/, '') + '/'
  // На Windows регистр буквы диска в путях сборщика бывает разный
  const inside = process.platform === 'win32' ? path.toLowerCase().startsWith(base.toLowerCase()) : path.startsWith(base)
  return inside ? path.slice(base.length) : null
}

/** Модуль поставки, к которому относится файл; null — ядро */
export const moduleOfPath = (path: string, root: string): BuildModuleKey | null => {
  const pkg = packageOf(path)
  if (pkg) return BUILD_MODULE_KEYS.find(key => BUILD_MODULES[key].packages.includes(pkg.name)) ?? null
  const rel = projectPath(path, root)
  if (rel === null) return null
  return BUILD_MODULE_KEYS.find(key => BUILD_MODULES[key].dirs.some(dir => rel.startsWith(dir)) || BUILD_MODULES[key].files.includes(rel)) ?? null
}

/** Модуль поставки файла из public/ (по пути в сборке); sw.js относится к PWA, только если это не ликвидатор */
const moduleOfPublicPath = (path: string, killer: boolean): BuildModuleKey | null => {
  if (path === 'sw.js') return killer ? null : 'pwa'
  return BUILD_MODULE_KEYS.find(key => BUILD_MODULES[key].publicPaths.some(p => path === p || path.startsWith(p + '/'))) ?? null
}

/** Файлы из public/, которые лежат в сборке копиями «как есть» (vendor/occt — сборка occt-import-js из npm) */
const VENDORED = [
  { path: 'vendor/occt', package: 'occt-import-js' },
  { path: 'vendor/sockjs', package: 'sockjs-client' },
] as const

// ---------- Отчёт о составе ----------

export interface PackageInfo {
  name: string
  version: string
  license: string
}

const readPackageInfo = (dir: string, name: string): PackageInfo => {
  try {
    const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      version?: string
      license?: string | { type?: string }
      licenses?: Array<{ type?: string } | string>
    }
    const license =
      typeof json.license === 'string'
        ? json.license
        : json.license?.type ??
          json.licenses?.map(item => (typeof item === 'string' ? item : item.type)).filter(Boolean).join(' OR ')
    return { name, version: json.version ?? 'не указана', license: license || 'не указана' }
  } catch {
    return { name, version: 'не указана', license: 'не указана' }
  }
}

/** Что вошло в один выходной файл сборки */
interface OutputInfo {
  kind: 'entry' | 'dynamic' | 'shared' | 'worker'
  /** Модули поставки; 'core' — код ядра */
  modules: Set<BuildModuleKey | 'core'>
  packages: Set<string>
}

interface Violation {
  module: BuildModuleKey
  /** Файл модуля от корня проекта (или путь пакета) */
  file: string
  /** Выходной файл сборки */
  output: string
  /** Откуда импортирован извне модуля */
  importers: string[]
}

type ModuleInfoGetter = (id: string) => { importers: readonly string[]; dynamicImporters: readonly string[] } | null

/** Текст ошибки сборки: по модулям — где код модуля входит в сборку извне его каталога */
export const describeViolations = (variant: string, violations: readonly Violation[]): string => {
  const lines = [`Вариант поставки «${variant}»: в сборку попал код исключённых модулей (раздел 8.5 проекта).`]
  for (const key of BUILD_MODULE_KEYS) {
    const own = violations.filter(v => v.module === key)
    if (!own.length) continue
    const outputs = [...new Set(own.map(v => v.output))].join(', ')
    lines.push(`• ${BUILD_MODULES[key].title} (${key}): файлов модуля в сборке — ${own.length}, в ${outputs}.`)
    const entries = own.flatMap(v => v.importers.map(importer => `${importer} → ${v.file}`))
    const shown = entries.length ? entries : own.map(v => v.file)
    lines.push(entries.length ? '  Импорт извне модуля:' : '  Файлы модуля:')
    for (const line of [...new Set(shown)].slice(0, 15)) lines.push(`    ${line}`)
    if (new Set(shown).size > 15) lines.push(`    … ещё ${new Set(shown).size - 15}`)
  }
  lines.push(
    'Извне своего каталога модуль подключается только через src/services/features/lazyModules.ts, с флагом сборки',
    'прямо у import(); типы — через import type. Статический импорт исправляет владелец файла, списки исключений',
    'в build/awmsBuildVariant.ts не ослабляются.',
  )
  return lines.join('\n')
}

/**
 * Разбор выходных чанков: модули поставки и пакеты каждого файла, нарушения варианта. Учитывается только код,
 * который попал в чанк (renderedLength > 0): импорт одних типов и вырезанный сборщиком код нарушением не считаются
 */
export const inspectChunks = (
  bundle: Rollup.OutputBundle,
  root: string,
  excluded: readonly BuildModuleKey[],
  getModuleInfo: ModuleInfoGetter,
  kindOverride?: OutputInfo['kind'],
): { outputs: Map<string, OutputInfo>; packageDirs: Map<string, string>; violations: Violation[] } => {
  const outputs = new Map<string, OutputInfo>()
  const packageDirs = new Map<string, string>()
  const violations: Violation[] = []
  const shown = (path: string) => projectPath(path, root) ?? path
  for (const output of Object.values(bundle)) {
    if (output.type !== 'chunk') continue
    const info: OutputInfo = {
      kind: kindOverride ?? (output.isEntry ? 'entry' : output.isDynamicEntry ? 'dynamic' : 'shared'),
      modules: new Set(),
      packages: new Set(),
    }
    for (const [id, rendered] of Object.entries(output.modules)) {
      if (rendered.renderedLength <= 0) continue
      const path = modulePath(id)
      const module = path ? moduleOfPath(path, root) : null
      info.modules.add(module ?? 'core')
      const pkg = path ? packageOf(path) : null
      if (pkg) {
        info.packages.add(pkg.name)
        if (!packageDirs.has(pkg.name)) packageDirs.set(pkg.name, pkg.dir)
      }
      if (!module || !excluded.includes(module) || !path) continue
      const moduleInfo = getModuleInfo(id)
      const importers = [...(moduleInfo?.importers ?? []), ...(moduleInfo?.dynamicImporters ?? [])]
        .map(modulePath)
        .filter((importer): importer is string => importer !== null && moduleOfPath(importer, root) !== module)
        .map(shown)
      violations.push({ module, file: shown(path), output: output.fileName, importers: [...new Set(importers)] })
    }
    outputs.set(output.fileName, info)
  }
  return { outputs, packageDirs, violations }
}

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex')

/** Все файлы каталога, пути с «/» от него */
const listFiles = (dir: string, prefix = ''): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory() ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
      )
    : []

/** Имя кэша статики в public/sw.js: 'awms-static-v1' → 'awms-static-<вариант>-v1' (раздел 8.4) */
const STATIC_CACHE_RE = /(['"])awms-static-(v\d+)\1/g

export const renameStaticCache = (source: string, variant: string): { source: string; cacheName: string } => {
  const found = source.match(STATIC_CACHE_RE) ?? []
  if (found.length !== 1) {
    throw new Error(
      `sw.js: имя кэша статики 'awms-static-v<номер>' найдено ${found.length} раз вместо одного — некуда подставить вариант`,
    )
  }
  let cacheName = ''
  const renamed = source.replace(STATIC_CACHE_RE, (_, quote: string, version: string) => {
    cacheName = `awms-static-${variant}-${version}`
    return `${quote}${cacheName}${quote}`
  })
  return { source: renamed, cacheName }
}

/** Файлы, которые плагин пишет сам; в собственных списках их нет */
export const BUILD_REPORT = 'awms-build.json'
export const BUILD_SUMS = 'SHA256SUMS'
export const BUILD_REPORT_FORMAT = 'awms-build/1'

export interface AwmsBuildVariantOptions {
  /** Идентификатор сборки, тот же, что в sw.js (makeBuildId) */
  buildId: string
  /** Переменные окружения; по умолчанию process.env */
  env?: Readonly<Record<string, string | undefined>>
  /** Ликвидатор service worker; по умолчанию build/sw-kill.js рядом с плагином */
  killerFile?: string
}

export interface AwmsBuildVariant {
  /** Вариант, по которому собирается фронтенд */
  variant: BuildVariant
  /** Плагин основной сборки — в plugins после swBuildId */
  plugin: Plugin
  /** Плагин сборки Web Worker'ов — в worker.plugins: модули и пакеты воркеров тоже проверяются и попадают в отчёт */
  workerPlugin: () => Plugin
}

export default function awmsBuildVariant(options: AwmsBuildVariantOptions): AwmsBuildVariant {
  const variant = resolveVariant(options.env ?? process.env)
  const excluded = variant.excluded
  const killerFile = options.killerFile ?? fileURLToPath(new URL('./sw-kill.js', import.meta.url))
  let config: ResolvedConfig
  /** Выходные файлы воркеров: собираются отдельно, до основной сборки; в основной они — ассеты */
  let workerOutputs = new Map<string, OutputInfo>()
  let packageDirs = new Map<string, string>()
  let outputs = new Map<string, OutputInfo>()

  const remember = (found: ReturnType<typeof inspectChunks>) => {
    for (const [name, dir] of found.packageDirs) if (!packageDirs.has(name)) packageDirs.set(name, dir)
  }

  const plugin: Plugin = {
    name: 'awms-build-variant',
    // config работает и в dev-сервере: флаги нужны коду всегда
    config() {
      return { define: buildDefines(excluded) }
    },
    configResolved(resolved) {
      config = resolved
      if (resolved.command === 'build') {
        resolved.logger.info(
          `Вариант поставки: ${variant.name}` + (excluded.length ? ` (без модулей: ${excluded.join(', ')})` : ' (все модули)'),
        )
      }
    },
    buildStart() {
      workerOutputs = new Map()
      packageDirs = new Map()
      outputs = new Map()
    },
    generateBundle(_, bundle) {
      const found = inspectChunks(bundle, config.root, excluded, id => this.getModuleInfo(id))
      if (found.violations.length) this.error(describeViolations(variant.name, found.violations))
      remember(found)
      outputs = found.outputs
      // Ассеты: воркеры — по их собственной сборке, остальное (стили, картинки) — по чанкам, которые их подключают
      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset') continue
        const worker = workerOutputs.get(output.fileName)
        if (worker) {
          outputs.set(output.fileName, worker)
          continue
        }
        const users = Object.values(bundle).filter(
          chunk =>
            chunk.type === 'chunk' &&
            (chunk.viteMetadata?.importedAssets.has(output.fileName) || chunk.viteMetadata?.importedCss.has(output.fileName)),
        )
        if (!users.length) continue
        const modules = new Set(users.flatMap(chunk => [...(outputs.get(chunk.fileName)?.modules ?? [])]))
        outputs.set(output.fileName, { kind: 'shared', modules, packages: new Set() })
      }
    },
    writeBundle(outputOptions, bundle) {
      const outDir = resolve(outputOptions.dir ?? resolve(config.root, config.build.outDir))
      const removed: string[] = []
      const killer = excluded.includes('pwa')
      const publicDir = config.build.copyPublicDir && config.publicDir && existsSync(config.publicDir) ? config.publicDir : null
      let serviceWorker: { mode: 'pwa'; staticCache: string } | { mode: 'kill' } | { mode: 'none' } = { mode: 'none' }

      if (publicDir) {
        for (const key of excluded) {
          for (const path of BUILD_MODULES[key].publicPaths) {
            const target = join(outDir, path)
            if (!existsSync(target)) continue
            rmSync(target, { recursive: true, force: true })
            removed.push(path)
          }
        }
        const vendor = join(outDir, 'vendor')
        if (existsSync(vendor) && listFiles(vendor).length === 0) rmSync(vendor, { recursive: true, force: true })

        const swFile = join(outDir, 'sw.js')
        if (killer) {
          writeFileSync(swFile, readFileSync(killerFile))
          serviceWorker = { mode: 'kill' }
        } else if (existsSync(swFile)) {
          // Чанки прежнего варианта (с модулями) не должны остаться в кэше: activate в sw.js удаляет кэши awms-*
          // с другими именами, поэтому смена варианта сборки сбрасывает кэш статики целиком
          const renamed = renameStaticCache(readFileSync(swFile, 'utf8'), variant.name)
          writeFileSync(swFile, renamed.source)
          serviceWorker = { mode: 'pwa', staticCache: renamed.cacheName }
        } else {
          this.error('В сборке нет sw.js (public/sw.js): вариант с PWA без service worker не собирается')
        }
      }

      // Лишние файлы (остались от прежней сборки в каталоге без очистки) попали бы в суммы как часть варианта
      const files = listFiles(outDir).filter(path => path !== BUILD_REPORT && path !== BUILD_SUMS).sort()
      const expected = new Set(Object.keys(bundle))
      if (publicDir) {
        for (const path of listFiles(publicDir)) {
          if (!removed.some(gone => path === gone || path.startsWith(gone + '/'))) expected.add(path)
        }
      }
      const stale = files.filter(path => !expected.has(path))
      if (stale.length) {
        this.error(
          `В каталоге сборки ${outDir} есть файлы не из этой сборки: ${stale.slice(0, 10).join(', ')}` +
            (stale.length > 10 ? ` и ещё ${stale.length - 10}` : '') +
            '. Соберите с очисткой каталога (--emptyOutDir; build/build-variant.mjs добавляет её сам).',
        )
      }

      const modulesOf = (path: string): string[] => {
        const base = path.endsWith('.map') ? path.slice(0, -4) : path
        const known = outputs.get(base)?.modules
        if (known) return [...known].sort()
        const fromPublic = moduleOfPublicPath(path, killer)
        return fromPublic ? [fromPublic] : []
      }
      const fileEntries = files.map(path => {
        const data = readFileSync(join(outDir, path))
        const modules = modulesOf(path)
        return { path, size: data.length, sha256: sha256(data), ...(modules.length ? { modules } : {}) }
      })

      const used = new Set([...outputs.values()].flatMap(info => [...info.packages]))
      const packages = [...used]
        .sort()
        .map(name => readPackageInfo(packageDirs.get(name) ?? join(config.root, 'node_modules', name), name))
      const vendored = VENDORED.filter(item => existsSync(join(outDir, item.path))).map(item => ({
        path: item.path,
        ...readPackageInfo(join(config.root, 'node_modules', item.package), item.package),
      }))
      // Карта чанков: JS-файлы сборки и воркеров (стили и картинки — в files, с модулями тех, кто их подключает)
      const chunks = [...outputs.entries()]
        .filter(([file]) => /\.m?js$/.test(file))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, info]) => ({ file, kind: info.kind, modules: [...info.modules].sort(), packages: [...info.packages].sort() }))

      const report = {
        format: BUILD_REPORT_FORMAT,
        buildId: options.buildId,
        createdAt: new Date().toISOString(),
        variant: variant.name,
        modules: Object.fromEntries(BUILD_MODULE_KEYS.map(key => [key, !excluded.includes(key)])),
        excluded: [...excluded],
        removed,
        serviceWorker,
        packages,
        vendored,
        chunks,
        files: fileEntries,
      }
      const reportText = JSON.stringify(report, null, 2) + '\n'
      writeFileSync(join(outDir, BUILD_REPORT), reportText)
      const sums = [...fileEntries.map(f => ({ path: f.path, sha256: f.sha256 })), { path: BUILD_REPORT, sha256: sha256(Buffer.from(reportText)) }]
        .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
        .map(f => `${f.sha256}  ${f.path}\n`)
        .join('')
      writeFileSync(join(outDir, BUILD_SUMS), sums)
      config.logger.info(
        `Вариант поставки ${variant.name}: ${BUILD_REPORT} и ${BUILD_SUMS} записаны (${fileEntries.length + 1} файлов, пакетов npm — ${packages.length})` +
          (removed.length ? `; убрано из public/: ${removed.join(', ')}` : '') +
          (killer ? '; sw.js — ликвидатор' : ''),
      )
    },
  }

  const workerPlugin = (): Plugin => ({
    name: 'awms-build-variant-worker',
    generateBundle(_, bundle) {
      const found = inspectChunks(bundle, config.root, excluded, id => this.getModuleInfo(id), 'worker')
      if (found.violations.length) this.error(describeViolations(variant.name, found.violations))
      remember(found)
      for (const [file, info] of found.outputs) workerOutputs.set(file, info)
    },
  })

  return { variant, plugin, workerPlugin }
}
