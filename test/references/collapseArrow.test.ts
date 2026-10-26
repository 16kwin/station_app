// collapseArrow.test.ts — стрелка «свернуть вкладки» в карточках справочников. Она лежит внутри кнопки «Основное»,
// поэтому сама не кнопка (кнопка внутри кнопки — недопустимый HTML и ошибка в консоли), а span с role="button".
// Чтобы до неё по-прежнему доходили с клавиатуры, у span должны быть tabIndex и обработка Enter и Пробела, которые
// не доходят до внешней кнопки. Страницы целиком тест не собирает: разметка читается из исходника.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Тесты запускаются из корня проекта (test/run-tests.mjs)
const CARDS = [
  'src/components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage.tsx',
  'src/components/ReferencesPage/SuppliersPage/SupplierCreatePage.tsx',
  'src/components/ReferencesPage/ManufacturersPage/ManufacturerCreatePage.tsx',
  'src/components/ReferencesPage/StationModelsPage/StationModelCreatePage.tsx',
  'src/components/ReferencesPage/StationsCrudPage/StationCreatePage.tsx',
];
const LABEL = 'aria-label="Свернуть или развернуть вкладки"';

describe('стрелка «свернуть вкладки» в карточках справочников', () => {
  for (const file of CARDS) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    const name = file.split('/').pop();

    test(`${name}: span с клавиатурой, не кнопка внутри кнопки`, () => {
      const at = source.indexOf(LABEL);
      assert.ok(at >= 0, 'стрелка не найдена — разбор исходника устарел');
      assert.equal(source.indexOf(LABEL, at + 1), -1, 'стрелка одна');

      // Открывающий тег стрелки целиком
      const tagStart = source.lastIndexOf('<', at);
      const tag = source.slice(tagStart, source.indexOf('}}>', at) + 3);
      assert.match(tag, /^<span role="button" /, 'стрелка — span с role="button"');
      assert.match(tag, /tabIndex=\{0\}/, 'доступна по Tab');
      const onKeyDown = tag.slice(tag.indexOf('onKeyDown='));
      assert.match(onKeyDown, /e\.key === 'Enter'/, 'Enter');
      assert.match(onKeyDown, /e\.key === ' '/, 'Пробел');
      assert.match(onKeyDown, /e\.preventDefault\(\);\s*e\.stopPropagation\(\);\s*handleToggleCollapse\(\);/,
        'клавиша не прокручивает страницу и не доходит до кнопки «Основное»');

      // Внешняя кнопка «Основное»: внутри неё других кнопок нет
      const outerStart = source.lastIndexOf('<button', at);
      const outerEnd = source.indexOf('</button>', at);
      assert.ok(outerStart >= 0 && outerEnd > at, 'стрелка внутри кнопки «Основное»');
      assert.match(source.slice(outerStart, at), /^<button onClick=\{\(\) => handleTab\w+\(0\)\}[^>]*>\s*<span>Основное<\/span>/, 'внешняя кнопка — «Основное»');
      assert.equal(source.slice(outerStart + 1, outerEnd).includes('<button'), false, 'кнопки внутри кнопки нет');
    });
  }
});
