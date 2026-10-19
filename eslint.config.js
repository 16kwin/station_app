import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Модули, которые вариант поставки исключает из сборки (раздел 8.1 проекта «Дискретное отключение функций»).
// Извне своего каталога модуль подключается только через src/services/features/lazyModules.ts: статический
// импорт оставил бы его код в сборке без модуля, а динамический import() без флага сборки рядом — его чанк.
// Типы (import type) можно — они стираются при сборке.
// Уровень warn, пока старые импорты не переведены (пакеты волны 1); после сквозной проверки V2 — error
const MODULE_IMPORTS_LEVEL = 'warn'
const LAZY_MODULES = 'src/services/features/lazyModules.ts'
// imports — шаблоны статических импортов (no-restricted-imports), dynamic — регулярное выражение для адреса
// в import('…') (no-restricted-syntax: no-restricted-imports динамический импорт не проверяет)
const MODULES = [
  {
    name: 'видео',
    files: ['src/components/DocumentsPage/VideoArchive/**/*.{ts,tsx}'],
    imports: ['**/VideoArchive', '**/VideoArchive/**'],
    dynamic: '(^|/)VideoArchive(/|$)',
  },
  {
    name: '3D-модели',
    files: ['src/components/ReferencesPage/NomenclaturePage/Model3D/**/*.{ts,tsx}'],
    imports: ['**/Model3D', '**/Model3D/**'],
    dynamic: '(^|/)Model3D(/|$)',
  },
  {
    name: 'карта станций',
    files: ['src/components/StationsPage/StationMap/**/*.{ts,tsx}'],
    imports: ['**/StationMap', '**/StationMap/**'],
    dynamic: '(^|/)StationMap(/|$)',
  },
  {
    name: 'граф закупок',
    files: ['src/components/mainPage/purchaseGraph/**/*.{ts,tsx}'],
    imports: ['**/purchaseGraph', '**/purchaseGraph/**'],
    dynamic: '(^|/)purchaseGraph(/|$)',
  },
  {
    name: 'заказы и ТКП',
    files: ['src/components/AnalyticsPage/**/*.{ts,tsx}'],
    imports: ['**/AnalyticsPage', '**/AnalyticsPage/**'],
    dynamic: '(^|/)AnalyticsPage(/|$)',
  },
  {
    name: 'интеграции',
    files: [
      'src/components/ReferencesPage/NomenclaturePage/IntegrationTab.tsx',
      'src/components/ReferencesPage/SuppliersPage/SupplierIntegrationTab.tsx',
      'src/components/ReferencesPage/ManufacturersPage/ManufacturerIntegrationTab.tsx',
    ],
    imports: ['**/IntegrationTab', '**/SupplierIntegrationTab', '**/ManufacturerIntegrationTab'],
    dynamic: '(^|/)(Supplier|Manufacturer)?IntegrationTab(\\.tsx?)?$',
  },
  // Клиент живых обновлений — единственное место, где грузятся библиотеки STOMP и SockJS
  {
    name: 'живые обновления',
    files: ['src/services/liveUpdatesClient.ts'],
    imports: ['@stomp/stompjs', '@stomp/stompjs/**', 'sockjs-client', 'sockjs-client/**'],
    dynamic: '^(@stomp/stompjs|sockjs-client)(/|$)',
    via: 'connectLiveUpdates из src/services/liveUpdatesClient.ts',
  },
]

const moduleMessage = (m) =>
  `Модуль «${m.name}» исключается из варианта поставки: подключайте его через ${m.via ?? LAZY_MODULES}`

/** Статические импорты вне модулей (own = null) или внутри модуля own: свой каталог модулю импортировать можно */
const moduleImports = (own) => [
  MODULE_IMPORTS_LEVEL,
  {
    patterns: MODULES.filter((m) => m !== own).map((m) => ({
      group: m.imports,
      allowTypeImports: true,
      message: `${moduleMessage(m)} (типы — через import type).`,
    })),
  },
]

/** То же для import('…'); «/» в регулярном выражении селектора экранируется */
const moduleDynamicImports = (own) => [
  MODULE_IMPORTS_LEVEL,
  ...MODULES.filter((m) => m !== own).map((m) => ({
    selector: `ImportExpression[source.value=/${m.dynamic.replaceAll('/', '\\/')}/]`,
    message: `${moduleMessage(m)}.`,
  })),
]

const moduleRules = (own) => ({
  '@typescript-eslint/no-restricted-imports': moduleImports(own),
  'no-restricted-syntax': moduleDynamicImports(own),
})

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [LAZY_MODULES],
    rules: moduleRules(null),
  },
  ...MODULES.map((m) => ({
    files: m.files,
    rules: moduleRules(m),
  })),
])
