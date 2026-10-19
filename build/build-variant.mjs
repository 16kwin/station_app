// build-variant.mjs — сборка варианта поставки фронтенда (раздел 8.5 проекта «Дискретное отключение функций»):
//
//   node build/build-variant.mjs isolated|standard|full [аргументы vite build, например --outDir C:/tmp/dist]
//   npm run build:isolated -- --outDir C:/tmp/dist
//
// Состав пресетов и сама проверка — в плагине build/awmsBuildVariant.ts; скрипт только передаёт ему имя
// варианта (AWMS_VARIANT). Свой скрипт нужен, потому что переменные окружения в npm-скриптах на Windows
// задаются иначе, чем в Linux. Свой состав модулей — переменной AWMS_EXCLUDE=video,model3d,pwa и `npm run build`.
// Каталог сборки всегда очищается (--emptyOutDir): файлы прежней полной сборки в нём оказались бы частью
// урезанного варианта. Проверка готового каталога — node build/verify-dist.mjs <каталог> --expect=<вариант>.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIANTS = ['isolated', 'standard', 'full'];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const [variant, ...rest] = process.argv.slice(2);
if (!VARIANTS.includes(variant)) {
  console.error(`build-variant: ${variant ? `варианта «${variant}» нет` : 'не указан вариант'}. Есть: ${VARIANTS.join(', ')}`);
  console.error('Запуск: node build/build-variant.mjs isolated|standard|full [аргументы vite build]');
  process.exit(2);
}
if (!existsSync(vite)) {
  console.error(`build-variant: нет ${vite} — выполните npm ci`);
  process.exit(2);
}

const env = { ...process.env, AWMS_VARIANT: variant };
if (env.AWMS_EXCLUDE) {
  // Вариант задан явно — свой состав из окружения не подмешиваем, иначе собрался бы не тот вариант
  console.warn(`build-variant: AWMS_EXCLUDE=${env.AWMS_EXCLUDE} не учитывается — состав задаёт вариант ${variant}`);
  delete env.AWMS_EXCLUDE;
}
const cleanup = rest.filter((arg) => /^--(?:no-)?emptyOutDir(?:=|$)/.test(arg));
if (cleanup.some((arg) => arg !== '--emptyOutDir')) {
  console.error(`build-variant: ${cleanup.join(' ')} не поддерживается — каталог варианта собирается начисто`);
  process.exit(2);
}
const args = [vite, 'build', ...(cleanup.length ? [] : ['--emptyOutDir']), ...rest];

const { status, error } = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
if (error) {
  console.error(`build-variant: vite не запустился: ${error.message}`);
  process.exit(1);
}
process.exit(status ?? 1);
