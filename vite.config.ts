import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import awmsBuildVariant, { makeBuildId } from './build/awmsBuildVariant'

/** Метка в public/sw.js, вместо которой при сборке ставится идентификатор сборки */
const SW_BUILD_MARK = '__AWMS_BUILD_ID__'

/**
 * Идентификатор сборки: 20261013-192200-123 (UTC). По нему в DevTools → Cache Storage видно, какая сборка
 * закэширована; тот же идентификатор пишется в awms-build.json (отчёт «Профиль безопасности»)
 */
const BUILD_ID = makeBuildId()

/**
 * Идентификатор сборки в sw.js. Браузер находит новую версию service worker только по изменившимся байтам
 * sw.js, а public/ копируется в сборку как есть — без подстановки уведомление «Доступна новая версия»
 * после выкатки не появлялось. Время сборки делает каждый sw.js новым; в dev-режиме плагин не работает.
 */
function swBuildId(buildId: string): Plugin {
  let config: ResolvedConfig
  return {
    name: 'awms-sw-build-id',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    // public/ к этому моменту уже скопирован в outDir; исходник читаем из public/, чтобы метка была всегда
    writeBundle(options) {
      if (!config.build.copyPublicDir || !config.publicDir) return
      const source = readFileSync(resolve(config.publicDir, 'sw.js'), 'utf8')
      if (!source.includes(SW_BUILD_MARK)) this.error(`public/sw.js: нет метки ${SW_BUILD_MARK} — некуда подставить идентификатор сборки`)
      writeFileSync(resolve(options.dir ?? resolve(config.root, config.build.outDir), 'sw.js'), source.replaceAll(SW_BUILD_MARK, buildId))
    },
  }
}

/**
 * Вариант поставки (build/awmsBuildVariant.ts, раздел 8.5 проекта «Дискретное отключение функций»): флаги
 * сборки __AWMS_HAS_*__, проверка, что кода исключённых модулей нет в чанках, ликвидатор sw.js без PWA,
 * awms-build.json и SHA256SUMS. Вариант задаёт build/build-variant.mjs (AWMS_VARIANT) или AWMS_EXCLUDE;
 * без них — полная сборка, как раньше
 */
const variant = awmsBuildVariant({ buildId: BUILD_ID })

export default defineConfig({
  // Вариант — после swBuildId: он дописывает sw.js, который тот уже положил в сборку
  plugins: [react(), swBuildId(BUILD_ID), variant.plugin],
  // Воркеры (подготовка 3D-моделей) собираются отдельно: их модули и пакеты проверяются так же
  worker: {
    plugins: () => [variant.workerPlugin()],
  },
  define: {
    // globalThis, а не window: в основной вкладке это тот же window, а в Web Worker'е (подготовка 3D-моделей)
    // window нет — dev-сервер вставляет эту подстановку в каждый модуль, и воркер падал бы при запуске
    global: 'globalThis',
  },
  // three.js подгружается лениво (окно 3D-модели) — без заранее подготовленной зависимости
  // dev-сервер перезагрузил бы страницу при первом открытии окна
  optimizeDeps: {
    include: ['three'],
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    // Локальные имена, а также адрес и домен рабочего сервера команды: там фронтенд — этот dev-сервер за nginx,
    // и без них Vite отвечает на запросы по домену «Blocked request». Не убирать
    allowedHosts: [
      'localhost',
      '127.0.0.1',
          '109.69.22.155',
    'dynamikaawms.ru',
    ]
  }
})
