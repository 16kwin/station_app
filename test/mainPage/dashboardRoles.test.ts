// dashboardRoles.test.ts — какие роли и блоки главной видны при разном составе функций (пакет F5, раздел 4.2
// проекта «Дискретное отключение функций»): блок виден, только если доступны все его данные; роли без блоков
// нет; панелей нет совсем — главная показывает стартовую страницу ядра (MainPage: пустой список ролей).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURE_KEYS, isFeatureKey, type FeatureKey } from '../../src/services/features/catalog';
import { resolveEnabledFeatures } from '../../src/services/features/featureStore';
import {
  DASHBOARD_DATA,
  ROLES,
  availableRoles,
  isBlockAvailable,
  pickRole,
  type DashboardRole,
} from '../../src/components/mainPage/shared/roles';

/** Состав функций пользователя так, как его считает хранилище: родители, зависимости, сборка */
const enabledBy = (features: Record<string, boolean>) => {
  const on = resolveEnabledFeatures(features);
  return (key: FeatureKey) => on.has(key);
};

/** Флаги пресета из таблицы 4.2 (только функции панелей; остальное на главную не влияет) */
const PRESET = {
  isolated: {},
  standard: { dashboards: true, 'dashboards.economic': true, 'dashboards.audit': true, 'dashboards.screen': true },
  full: {
    dashboards: true,
    'dashboards.economic': true,
    'dashboards.audit': true,
    'dashboards.graph': true,
    'dashboards.screen': true,
  },
} as const satisfies Record<string, Partial<Record<FeatureKey, boolean>>>;

const keys = (roles: readonly DashboardRole[]) => roles.map(role => role.key);

describe('роли главной по составу функций', () => {
  test('full: все роли и блоки как раньше, те же объекты и пояснения', () => {
    const roles = availableRoles(enabledBy(PRESET.full));
    assert.deepEqual(roles, [...ROLES]);
    roles.forEach((role, index) => assert.equal(role, ROLES[index], `${role.key}: роль не пересобирается`));
  });

  test('standard: все роли, у аудитора нет графа закупок — пояснение без него', () => {
    const roles = availableRoles(enabledBy(PRESET.standard));
    assert.deepEqual(keys(roles), keys(ROLES));
    const auditor = roles.find(role => role.key === 'auditor');
    assert.ok(auditor);
    assert.equal(auditor.hint, 'Затраты, инциденты и закупки с завышенной ценой');
    assert.doesNotMatch(auditor.hint, /граф/i);
    assert.deepEqual(
      roles.find(role => role.key === 'top')?.blocks.map(block => block.key),
      ['economic', 'quality'],
    );
  });

  test('isolated и ничего не включено (профиль ещё не загружен): панелей нет — стартовая страница ядра', () => {
    assert.deepEqual(availableRoles(enabledBy(PRESET.isolated)), []);
    assert.deepEqual(availableRoles(() => false), []);
  });

  test('без экономических данных: нет аудитора и службы закупа, у топ-менеджмента только «Показатели»', () => {
    const roles = availableRoles(enabledBy({ dashboards: true, 'dashboards.audit': true, 'dashboards.screen': true }));
    assert.deepEqual(keys(roles), ['top', 'shopHead', 'chiefController', 'controller', 'operator']);
    const top = roles[0];
    assert.deepEqual(
      top.blocks.map(block => block.key),
      ['quality'],
    );
    assert.equal(top.hint, 'Показатели', 'пояснение не упоминает недоступный экономический блок');
    assert.equal(top.title, ROLES[0].title);
  });

  test('без панели аудита: аудитора нет, остальные роли на месте', () => {
    const roles = availableRoles(enabledBy({ dashboards: true, 'dashboards.economic': true }));
    assert.deepEqual(keys(roles), ['top', 'purchasing', 'shopHead', 'chiefController', 'controller', 'operator']);
  });

  test('граф без панели аудита не включается: зависимость dashboards.graph → dashboards.audit', () => {
    const roles = availableRoles(enabledBy({ dashboards: true, 'dashboards.economic': true, 'dashboards.graph': true }));
    assert.ok(!keys(roles).includes('auditor'));
  });

  test('подфункции без родителя dashboards не показывают блоков', () => {
    const childrenOnly = (key: FeatureKey) => key !== 'dashboards';
    assert.deepEqual(availableRoles(childrenOnly), []);
    for (const role of ROLES) for (const block of role.blocks) assert.equal(isBlockAvailable(block, childrenOnly), false);
  });

  test('выбранная роль недоступна — первая доступная; ролей нет — null', () => {
    const roles = availableRoles(enabledBy({ dashboards: true }));
    assert.equal(pickRole(roles, 'auditor')?.key, roles[0].key);
    assert.equal(pickRole(roles, 'operator')?.key, 'operator');
    assert.equal(pickRole([], 'top'), null);
  });
});

describe('данные блоков и функции', () => {
  test('данные панелей открывают функции dashboards из каталога', () => {
    for (const [data, feature] of Object.entries(DASHBOARD_DATA)) {
      assert.ok(isFeatureKey(feature), `${data}: ${feature} нет в каталоге`);
      assert.match(feature, /^dashboards(\.|$)/, `${data}: данные панелей — только функции dashboards`);
    }
  });

  test('у каждого блока есть данные, необязательные карточки — функции каталога', () => {
    for (const role of ROLES) {
      assert.ok(role.blocks.length > 0, role.key);
      for (const block of role.blocks) {
        assert.ok(block.data.length > 0, `${role.key}/${block.key}: блок без данных показывался бы всегда`);
        for (const key of block.optional ?? []) assert.ok((FEATURE_KEYS as readonly string[]).includes(key), key);
      }
    }
  });
});
