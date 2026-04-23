// ConstantInfo.ts - добавить новые ендпоинты
const ConstantInfo = {
  // База
  serverPort: '8084',
  serverHost: window.config.ip_api.replace('http://', '').replace('https://', ''), // Хост без http://
  fileDir: window.config.ip_api + ':8084/',

  // API базовый URL
  apiBaseUrl: `${window.config.ip_api}:8084`,
  
  // WebSocket базовый URL
  wsBaseUrl: `ws://${window.config.ip_api.replace('http://', '').replace('https://', '')}:8084`,

  // Авторизация и т.п.
  restApiLogin: '/api/auth/login',
  restApiCheckAuth: '/api/auth/check_auth',
  restApiRefreshToken: '/api/auth/refresh_token',
  restApiLogout: '/api/auth/logout',
  checkAuthPeriod: 50000,
  
  // Спящий режим
  restApiCheckPassword: '/api/auth/check_password',
  inactivityTimeout: 5 * 60 * 1000, // 5 минут бездействия до блокировки
  warningTimeout: 30 * 1000, // 30 секунд предупреждение до блокировки
  
  // Станции
  restApiStationsStatic: '/api/stations/static',
  restApiStationsDynamic: '/api/stations/dynamic',
  restApiStationStatic: (uid: string) => `/api/stations/static/${uid}`,
  restApiStationDynamic: (uid: string) => `/api/stations/dynamic/${uid}`,
  
  // WebSocket
  wsStationsStatic: '/topic/stations/static',
  wsStationsDynamic: '/topic/stations/dynamic',
  wsStationsPath: '/ws-stations',
  
  // Иерархия размещения
  restApiLocationHierarchy: '/api/locations/hierarchy',
  
  // Фильтры пользователя
  restApiUserFilters: '/api/user/filters',
  
  // Остальные эндпоинты
  restApiCreateLocation: '/api/locations',
  restApiCreateStation: '/api/stations',
  restApiDashboardStats: '/api/dashboard/stats',
  restApiUploadLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  restApiGetLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  restApiDeleteLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  restApiCreateOrUpdateStationPosition: '/api/station-positions',
  restApiGetStationPositionsByLocation: (locationId: number) => `/api/station-positions/location/${locationId}`,
  restApiGetStationPositionsByStation: (stationId: number) => `/api/station-positions/station/${stationId}`,
  restApiGetStationPosition: (stationId: number, locationId: number) => `/api/station-positions/${stationId}/${locationId}`,
  restApiDeleteStationPosition: (stationId: number, locationId: number) => `/api/station-positions/${stationId}/${locationId}`,
  restApiDeleteAllStationPositionsByStation: (stationId: number) => `/api/station-positions/station/${stationId}`,
  restApiDeleteAllStationPositionsByLocation: (locationId: number) => `/api/station-positions/location/${locationId}`,
  getLocationPhotoUrl: (filePath: string, fileName: string) => 
    `${ConstantInfo.fileDir}uploads/${filePath}${fileName}`,
  restApiStationsStaticFiltered: '/api/stations/static/filtered',
restApiStationsDynamicFiltered: '/api/stations/dynamic/filtered',
  // Тестовые документы
  restApiTestDocuments: '/api/test-documents',
  restApiTestDocumentsDrafts: '/api/test-documents/drafts',
  restApiTestDocument: (id: number) => `/api/test-documents/${id}`,
};

export default ConstantInfo;