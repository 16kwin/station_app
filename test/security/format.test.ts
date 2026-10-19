// format.test.ts — подписи отчёта «Профиль безопасности»: состояния и уровни функций, роли, оговорки,
// команды самостоятельной проверки, кнопка удаления данных, выгрузка JSON.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSecurityReport, type FeatureRow } from '../../src/components/SecurityPage/api';
import {
  buildExport,
  canPurgeRow,
  EXPORT_FORMAT,
  exportFileName,
  fallbackCaveats,
  fallbackSelfCheck,
  featureStateText,
  formatBytes,
  levelText,
  rolesNotGuaranteed,
} from '../../src/components/SecurityPage/sections/format';
import { FINGERPRINT, FILE_SHA, stubReport } from './fixtures';

const row = (over: Partial<FeatureRow>): FeatureRow => ({
  key: 'video',
  title: 'Видео',
  enabled: false,
  reason: 'PRESET',
  reasonText: null,
  level: 'L3',
  levelText: null,
  origin: null,
  roles: [],
  rolesGuaranteed: null,
  probe: null,
  checks: [],
  ...over,
});

describe('состояние и уровень функции', () => {
  test('состояние словами по причине (9.2, строка 2)', () => {
    assert.equal(featureStateText(row({ enabled: true })), 'включена');
    assert.equal(featureStateText(row({ reason: 'PRESET' })), 'выключена потолком');
    assert.equal(featureStateText(row({ reason: 'PROPERTY' })), 'выключена потолком');
    assert.equal(featureStateText(row({ reason: 'SWITCH' })), 'выключена администратором');
    assert.equal(featureStateText(row({ reason: 'DEPENDENCY:video' })), 'выключена: выключена video');
    assert.equal(featureStateText(row({ reason: 'TAMPER' })), 'выключена: расхождение с журналом');
    assert.equal(featureStateText(row({ reason: 'ABSENT_IN_BUILD' })), 'отсутствует в сборке');
  });

  test('уровень — только у выключенной функции', () => {
    assert.equal(levelText(row({})), 'L3 — код не загружен');
    assert.equal(levelText(row({ level: 'L1' })), 'L1 — скрыто в интерфейсе');
    assert.equal(levelText(row({ level: 'L2', levelText: 'маршрут закрыт воротами' })), 'L2 — маршрут закрыт воротами');
    assert.equal(levelText(row({ enabled: true })), '—');
  });

  test('роли не гарантируются, пока роль берётся из токена', () => {
    assert.equal(rolesNotGuaranteed(row({ roles: ['ADMIN'] }), 'token'), true);
    assert.equal(rolesNotGuaranteed(row({ roles: ['ADMIN'] }), null), true);
    assert.equal(rolesNotGuaranteed(row({ roles: ['ADMIN'] }), 'db'), false);
    assert.equal(rolesNotGuaranteed(row({ roles: ['ADMIN'], rolesGuaranteed: false }), 'db'), true);
    assert.equal(rolesNotGuaranteed(row({ roles: [] }), 'token'), false);
  });
});

describe('удаление данных', () => {
  const features = [row({ key: 'video', reason: 'PRESET' }), row({ key: 'gpp', reason: 'SWITCH' }), row({ key: 'map', enabled: true })];

  test('только администратору ИБ и только для функции, выключенной потолком', () => {
    assert.equal(canPurgeRow({ feature: 'video', purgeAllowed: null }, features, true), true);
    assert.equal(canPurgeRow({ feature: 'video', purgeAllowed: null }, features, false), false);
    assert.equal(canPurgeRow({ feature: 'gpp', purgeAllowed: null }, features, true), false);
    assert.equal(canPurgeRow({ feature: 'map', purgeAllowed: null }, features, true), false);
    assert.equal(canPurgeRow({ feature: 'unknown', purgeAllowed: null }, features, true), false);
    // Решение сервера важнее
    assert.equal(canPurgeRow({ feature: 'video', purgeAllowed: false }, features, true), false);
    assert.equal(canPurgeRow({ feature: 'gpp', purgeAllowed: true }, features, true), true);
    assert.equal(canPurgeRow({ feature: 'gpp', purgeAllowed: true }, features, false), false);
  });
});

describe('оговорки и самостоятельная проверка', () => {
  test('оговорки по состоянию установки', () => {
    const token = fallbackCaveats(parseSecurityReport(stubReport('isolated')));
    assert.ok(token.some(c => c.includes('из токена')));
    assert.ok(token.some(c => c.includes('без ключа HMAC')));
    assert.ok(token.some(c => c.includes('L1')));
    const data = stubReport('full');
    data.header.roleSource = 'db';
    data.header.secrets = { state: 'repository' };
    data.journal.keyed = true;
    const db = fallbackCaveats(parseSecurityReport(data));
    assert.ok(!db.some(c => c.includes('из токена')));
    assert.ok(db.some(c => c.includes('из репозитория')));
    assert.ok(db.some(c => c.includes('в аргументах')));
  });

  test('команды по адресам проб, порту, файлу потолка и отпечатку', () => {
    const report = parseSecurityReport(stubReport('isolated'));
    const rows = fallbackSelfCheck(report, ['/api/video/status', '/api/video/files/1/download']);
    const commands = rows.map(r => r.command);
    assert.ok(commands.includes('curl -i http://<сервер>:8084/api/video/status'));
    assert.ok(commands.includes('curl -I http://<сервер>:8084/api/video/files/1/download'));
    assert.ok(commands.some(c => c.includes('findstr /i ffmpeg')));
    assert.ok(commands.some(c => c.includes('C:/ffmpeg/bin/ffmpeg.exe')));
    assert.ok(commands.some(c => c.includes('print-features --config="C:/AWMS/config/awms-features.properties"')));
    assert.equal(rows.find(r => r.command.startsWith('Get-FileHash -Algorithm SHA256 "C:'))?.expected, FILE_SHA.slice(0, 16) + '…');
    // Видео включено — проверок ffmpeg нет
    const full = fallbackSelfCheck(parseSecurityReport(stubReport('full')), []);
    assert.ok(!full.some(r => r.command.includes('ffmpeg')));
    assert.ok(!full.some(r => r.command.startsWith('curl')));
  });
});

describe('выгрузка JSON', () => {
  test('имя файла: хост, отпечаток, время; только безопасные знаки', () => {
    const report = parseSecurityReport(stubReport());
    const at = new Date(2026, 9, 14, 9, 5);
    assert.equal(exportFileName(report, at), `awms-security-profile-srv-awms-01-${FINGERPRINT.slice(0, 12)}-20261014-0905.json`);
    report.header.host = '../../etc/пароль сервер';
    assert.match(exportFileName(report, at), /^awms-security-profile-[A-Za-z0-9._-]+\.json$/);
    assert.ok(!exportFileName(report, at).includes('/'));
  });

  test('состав: отчёт сервера как есть, сборка интерфейса, проверка из браузера', () => {
    const data = stubReport();
    const report = parseSecurityReport(data);
    const at = new Date('2026-10-14T07:30:00Z');
    const result = buildExport(report, null, null, at);
    assert.deepEqual(Object.keys(result), ['format', 'exportedAt', 'fingerprint', 'report', 'frontendBuild', 'browserProbes']);
    assert.equal(result.format, EXPORT_FORMAT);
    assert.equal(result.exportedAt, '2026-10-14T07:30:00.000Z');
    assert.equal(result.report, data);
    assert.equal(result.fingerprint, FINGERPRINT);
  });

  test('объёмы', () => {
    assert.equal(formatBytes(0), '0 Б');
    assert.equal(formatBytes(1536), '1,5 КБ');
    assert.equal(formatBytes(13207024435), '12,3 ГБ');
    assert.equal(formatBytes(null), '—');
  });
});
