// coreStartPage.test.ts — стартовая страница ядра (пакет F5, раздел 4.4 проекта «Дискретное отключение функций»)
// ведёт только в разделы ядра: её показывают, когда панелей нет (изолированный минимум), и ссылка на раздел
// выключенной функции открыла бы «Раздел недоступен». Страницу с картинками тест не собирает: ссылки читаются из
// исходника (поле path в списках SECTIONS и SHORTCUTS), подписи вкладок сверяются с меню разделов.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_ROUTES, featureForPath, isCoreRoute } from '../../src/services/features/routes';

// Тесты запускаются из корня проекта (test/run-tests.mjs), собранный файл лежит в node_modules/.cache
const source = readFileSync(join(process.cwd(), 'src/components/mainPage/CoreStartPage.tsx'), 'utf8');

/** Пары «путь → подпись вкладки» из списков ссылок страницы */
const links = [...source.matchAll(/path:\s*'([^']+)',\s*tabLabel:\s*'([^']+)'/g)].map(([, path, tabLabel]) => ({ path, tabLabel }));

describe('стартовая страница ядра', () => {
  test('ссылки найдены в исходнике: четыре раздела и быстрый переход', () => {
    assert.ok(links.length >= 6, `ссылок ${links.length} — разбор исходника устарел`);
    assert.equal(new Set(links.map(link => link.path)).size, links.length, 'пути не повторяются');
  });

  test('каждая ссылка — раздел ядра, ни одна не относится к функции', () => {
    for (const { path } of links) {
      assert.ok(CORE_ROUTES.includes(path) && isCoreRoute(path), `${path} — не раздел ядра (routes.ts, CORE_ROUTES)`);
      assert.equal(featureForPath(path), null, `${path} относится к функции ${featureForPath(path)}`);
    }
  });

  test('подписи вкладок справочников и документов — как у разделов («Справочник: …», «Документ: …»)', () => {
    for (const { path, tabLabel } of links) {
      if (path.startsWith('/references/')) assert.match(tabLabel, /^Справочник: /, path);
      if (path.startsWith('/documents/')) assert.match(tabLabel, /^Документ: /, path);
    }
  });
});
