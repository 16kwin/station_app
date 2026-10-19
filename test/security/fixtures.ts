// fixtures.ts — заглушка ответа GET /api/security-profile по контракту из src/components/SecurityPage/api.ts
// (разделы 6.7 и 9.2 проекта). Пока сервер не отдаёт отчёт (пакет B6), на ней работают тесты страницы
// и проверка внешнего вида. Состав функций — по таблице 4.2: столбцы I/S/F, уровни, адреса проб из реестра.

export type Preset = 'isolated' | 'standard' | 'full';

interface FeatureSpec {
  key: string;
  title: string;
  presets: readonly Preset[];
  level: string;
  probe: string | null;
  checks?: readonly string[];
}

const S_F: readonly Preset[] = ['standard', 'full'];
const F: readonly Preset[] = ['full'];
const NONE: readonly Preset[] = [];

/** Функции реестра (Feature.java) в его порядке */
export const FEATURES: readonly FeatureSpec[] = [
  { key: 'video', title: 'Видео с IP-камер', presets: F, level: 'L3', probe: '/api/video/status', checks: ['бин VideoController', 'потоки live-*, clip-*'] },
  { key: 'video.live', title: 'Живой просмотр и кадр', presets: F, level: 'L2', probe: '/api/video/cameras/1/snapshot' },
  { key: 'video.clips', title: 'Запись фрагмента по кнопке', presets: F, level: 'L2', probe: '/api/video/cameras/1/clips' },
  { key: 'video.recording', title: 'Запись по событиям станции', presets: F, level: 'L2', probe: '/api/video/events' },
  { key: 'video.archive', title: 'Журнал видеоархива и просмотр', presets: F, level: 'L2', probe: '/api/video/records' },
  { key: 'video.download', title: 'Скачивание видео на рабочее место', presets: F, level: 'L1', probe: '/api/video/files/1/download' },
  { key: 'video.cameras', title: 'Изменение адресов камер и проверка потока', presets: F, level: 'L2', probe: '/api/video/cameras/1' },
  { key: 'map', title: 'Карта станций (мнемосхема)', presets: S_F, level: 'L1', probe: null },
  { key: 'map.plan', title: 'Интерактивный план цеха (просмотр)', presets: S_F, level: 'L3', probe: '/api/station-plans/workshops/0', checks: ['бин StationPlanController'] },
  { key: 'map.edit', title: 'Загрузка плана и правка расстановки', presets: S_F, level: 'L2', probe: '/api/station-plans/workshops/1/positions' },
  { key: 'model3d', title: '3D-модели номенклатуры (просмотр)', presets: S_F, level: 'L3', probe: '/api/nomenclature/1/models', checks: ['бин NomenclatureModelController'] },
  { key: 'model3d.upload', title: 'Загрузка и удаление 3D-моделей', presets: S_F, level: 'L2', probe: null },
  { key: 'gpp', title: 'ГПП — график подготовки производства', presets: S_F, level: 'L2', probe: '/api/gpp' },
  { key: 'dashboards', title: 'Информационные панели главной', presets: S_F, level: 'L3', probe: '/api/dashboard/control-events', checks: ['бин DashboardController'] },
  { key: 'dashboards.economic', title: 'Экономический блок (затраты, бюджет)', presets: S_F, level: 'L2', probe: '/api/dashboard/economic' },
  { key: 'dashboards.audit', title: 'Панель аудитора', presets: S_F, level: 'L2', probe: '/api/dashboard/audit' },
  { key: 'dashboards.graph', title: 'Граф закупок и аффилированности', presets: F, level: 'L2', probe: '/api/dashboard/purchase-graph' },
  { key: 'dashboards.screen', title: '«Второй экран» (лента событий)', presets: S_F, level: 'L2', probe: '/api/dashboard/day-events' },
  { key: 'orders', title: 'Заказы и ТКП (обмен с внешней системой)', presets: F, level: 'L3', probe: '/api/orders/active', checks: ['бин OrderController', 'бинов RestTemplate'] },
  { key: 'websocket', title: 'Живые обновления (WebSocket)', presets: F, level: 'L3', probe: '/ws-stations/info', checks: ['бин WebSocketConfig', 'потоки clientInboundChannel-*'] },
  { key: 'export', title: 'Выгрузка PDF/Excel/Word и печать', presets: S_F, level: 'L1', probe: '/api/x/export-pdf' },
  { key: 'uploads', title: 'Загрузка файлов на сервер', presets: S_F, level: 'L2', probe: null },
  { key: 'integrations', title: 'Вкладки «Интеграции» (журнал обмена 1С/SAP, без соединений)', presets: F, level: 'L2', probe: '/api/nomenclature/1/integrations' },
  { key: 'anonymous', title: 'Анонимный доступ (режим табло)', presets: F, level: 'L2', probe: null },
  { key: 'pwa', title: 'Установка как приложение (service worker)', presets: F, level: 'L1', probe: null },
  { key: 'passwords', title: 'Предлагать браузеру сохранить пароль', presets: NONE, level: 'L1', probe: null },
  { key: 'drafts', title: 'Черновики карточек в браузере', presets: S_F, level: 'L1', probe: null },
  { key: 'stubs', title: 'Заглушки «Отчёты», «Настройки», «Уведомления», «Карта загрузки», «Списание»', presets: F, level: 'L1', probe: null },
  { key: 'testsync', title: 'Тестовые документы и синхронизация', presets: NONE, level: 'L3', probe: '/api/sync/x', checks: ['бин TestDocumentController'] },
  { key: 'legacy', title: 'Унаследованная раздача /images, /proc_docs и других каталогов', presets: NONE, level: 'L3', probe: null, checks: ['бин ImgConfig'] },
  { key: 'photoimport', title: 'Импорт migration_photos при старте', presets: NONE, level: 'L3', probe: null, checks: ['бин MigrationPhotoImporter'] },
];

export const FINGERPRINT = '2fc45350c8153b7a9d04e6f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5';
export const JOURNAL_HASH = '9f3a51c0e8d24b6a7c1f0e2d3b4a5968778695a4b3c2d1e0f9e8d7c6b5a49382';
export const FILE_SHA = 'f9dba58a11c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8';

const parentOf = (key: string): string | null => (key.includes('.') ? key.slice(0, key.lastIndexOf('.')) : null);

/** Состояние функций пресета с каскадом по родителю (как FeatureResolver) */
const featureRows = (preset: Preset) => {
  const on = new Map<string, boolean>();
  for (const f of FEATURES) {
    const parent = parentOf(f.key);
    const self = f.presets.includes(preset);
    const parentOn = parent === null || on.get(parent) === true;
    on.set(f.key, self && parentOn);
  }
  return FEATURES.map(f => {
    const enabled = on.get(f.key) === true;
    const parent = parentOf(f.key);
    const byParent = !enabled && f.presets.includes(preset) && parent !== null;
    return {
      key: f.key,
      title: f.title,
      enabled,
      reason: byParent ? `DEPENDENCY:${parent}` : 'PRESET',
      reasonText: enabled ? 'включена пресетом' : byParent ? `выключена: выключена функция ${parent}` : 'выключена пресетом',
      level: f.level,
      origin: `пресет ${preset}`,
      roles: f.key === 'export' && preset !== 'isolated' ? ['ADMIN', 'DIRECTOR'] : [],
      probe: f.probe,
      checks: (f.checks ?? []).map(text => ({ text: enabled ? `${text}: есть` : `${text}: отсутствует`, ok: true })),
    };
  });
};

/** Отчёт сервера для пресета */
export const stubReport = (preset: Preset = 'isolated') => {
  const features = featureRows(preset);
  const videoOn = features.find(f => f.key === 'video')?.enabled === true;
  return {
    generatedAt: '2026-10-14T07:20:30Z',
    viewer: { login: 'director_test', role: 'DIRECTOR', canPurge: false },
    header: {
      backend: { version: '0.0.1-SNAPSHOT', buildTime: '2026-10-13T18:00:00Z' },
      host: 'srv-awms-01',
      preset,
      presetSource: 'file',
      fingerprint: FINGERPRINT,
      revision: FINGERPRINT.slice(0, 12) + '-0',
      ceilingFile: {
        path: 'C:/AWMS/config/awms-features.properties',
        exists: true,
        sha256: FILE_SHA,
        modifiedAt: '2026-10-14T05:41:00Z',
        owner: 'BUILTIN\\Administrators',
      },
      ticket: 'СЗ-ИБ-2026-041 от 14.10.2026',
      adminMode: 'disable-only',
      journalHead: { id: 128, hash: JOURNAL_HASH },
      secrets: { state: 'generated' },
      roleSource: 'token',
      dbUser: { name: 'awms_app', superuser: false },
      warnings: [],
    },
    features,
    params: [
      { key: 'server.port', value: '8084', origin: 'файл awms-features.properties:4' },
      { key: 'server.address', value: '', origin: 'jar: умолчание' },
      { key: 'awms.cors.allowed-origins', value: 'http://localhost,http://localhost:3000', origin: 'файл awms-features.properties:9' },
      { key: 'awms.network.outbound.allowed', value: '', origin: 'jar: умолчание' },
      { key: 'awms.video.allow-file-source', value: 'false', origin: 'jar: умолчание' },
      { key: 'awms.video.retention-days', value: '30', origin: 'файл awms-features.properties:7' },
      { key: 'video.ffmpeg-path', value: 'C:/ffmpeg/bin/ffmpeg.exe', origin: 'jar: умолчание' },
      { key: 'awms.features.admin.mode', value: 'disable-only', origin: 'файл awms-features.properties:8' },
    ],
    absent: [
      { key: 'ai', title: 'ИИ, ML, распознавание лиц', reason: 'В составе нет ML-библиотек и моделей' },
      { key: 'telemetry', title: 'Телеметрия, отчёты об ошибках', reason: 'Нет actuator, Sentry и подобного' },
      { key: 'remote', title: 'Удалённый доступ поставщика', reason: 'Нет агентов, туннелей, SSH/VNC' },
      { key: 'autoupdate', title: 'Автообновление, сетевая проверка лицензии', reason: 'Обновление — офлайн-пакет' },
      { key: 'push', title: 'Web Push', reason: 'Нет push-подписок' },
      { key: 'cloud', title: 'Облачные сервисы, CDN', reason: 'Шрифты и WASM локально' },
      { key: 'mail', title: 'Почта (SMTP)', reason: 'Нет spring-boot-starter-mail' },
    ],
    runtime: [
      { text: 'actuator в classpath отсутствует', ok: true },
      { text: 'devtools в classpath отсутствует', ok: true },
      { text: 'JDWP (отладка) не включён', ok: true },
      { text: 'JMX remote не включён', ok: true },
    ],
    inbound: {
      port: 8084,
      address: '',
      tls: false,
      websocket: preset === 'full',
      routes: {
        total: preset === 'full' ? 412 : 318,
        byPrefix: [
          { prefix: '/api/nomenclature', count: 57 },
          { prefix: '/api/stations', count: 21 },
          ...(preset === 'full' ? [{ prefix: '/api/video', count: 18 }] : []),
        ],
      },
      gated: preset === 'full' ? [] : [{ feature: 'gpp', rule: '/api/gpp/**' }],
      anonymous: preset === 'full' ? ['GET /api/features/public', 'GET /api/stations/static'] : ['GET /api/features/public'],
    },
    outbound: {
      database: 'localhost:5432',
      syncService: preset === 'full' ? 'http://localhost:8085' : null,
      restTemplates: preset === 'full' ? 1 : 0,
      cameras: { count: 2, polled: videoOn, withPassword: 2, encrypted: false, passwordInArgs: videoOn },
    },
    background: {
      threads: [
        { prefix: 'http-nio-', count: 10 },
        { prefix: 'feature-denied-summary', count: 1 },
        ...(videoOn ? [{ prefix: 'live-idle', count: 1 }] : []),
      ],
      scheduled: 0,
      childProcesses: [],
      startupTasks: ['StartupProfileAuditor: запись STARTUP', 'VideoRetentionJob: срок хранения видео'],
      ffmpeg: { path: 'C:/ffmpeg/bin/ffmpeg.exe', exists: videoOn },
    },
    storedData: videoOn
      ? []
      : [
          {
            feature: 'video',
            title: 'Видео с IP-камер',
            tables: [
              { name: 'video_camera', rows: 2 },
              { name: 'video_record', rows: 340 },
              { name: 'video_record_file', rows: 680 },
            ],
            dirs: [{ path: 'video-archive', files: 680, bytes: 13207024435 }],
            oldest: '2026-09-14T08:00:00Z',
            retentionDays: 30,
            note: 'хранится, доступ закрыт',
          },
        ],
    components: { backendSbom: null },
    journal: {
      chainValid: true,
      brokenAt: null,
      keyed: false,
      head: { id: 128, hash: JOURNAL_HASH },
      entries: [
        { id: 128, occurredAt: '2026-10-14T07:19:00Z', type: 'REPORT_VIEWED', featureKey: null, actor: 'director_test' },
        { id: 127, occurredAt: '2026-10-14T05:42:10Z', type: 'CEILING_CHANGED', featureKey: 'video', oldValue: 'on', newValue: 'off', actor: 'awms-service', ticket: 'СЗ-ИБ-2026-041 от 14.10.2026' },
        { id: 126, occurredAt: '2026-10-14T05:42:10Z', type: 'STARTUP', actor: 'awms-service' },
      ],
    },
    roles: {
      source: 'token',
      matrix: [
        { role: 'ADMIN', title: 'Администратор', users: 2, can: ['всё, кроме удаления данных функций', 'выключать функции (этап 2)'] },
        { role: 'DIRECTOR', title: 'Директор', users: 1, can: ['справочники и документы', 'профиль безопасности — просмотр'] },
        { role: 'OPERATOR', title: 'Оператор', users: 14, can: ['станции, документы пополнения'] },
        { role: 'SECURITY', title: 'Администратор ИБ', users: 1, can: ['профиль безопасности', 'удаление данных выключенных функций', 'остальное — только чтение'] },
      ],
    },
    usage: {
      days: 30,
      rows: [
        { actor: 'director_test', role: 'DIRECTOR', counts: { VIDEO_VIEWED: 3, EXPORT: 12 } },
        { actor: 'operator1', role: 'OPERATOR', counts: { EXPORT: 4 } },
      ],
    },
  };
};
