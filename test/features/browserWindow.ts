// browserWindow.ts — минимальный window для тестов, которым нужен модуль, читающий window.config при загрузке
// (ConstantInfo через AuthContext). Импортируется первым: сборщик сохраняет порядок исполнения модулей, поэтому
// window появляется раньше, чем его прочитает ConstantInfo. Каждый файл тестов node --test идёт в своём
// процессе — другим тестам этот window не виден.
const scope = globalThis as { window?: unknown };
if (scope.window === undefined) {
  scope.window = { config: { ip_api: 'http://localhost' }, location: { href: 'http://localhost/' } };
}

export {};
