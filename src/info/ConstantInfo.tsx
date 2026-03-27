const ConstantInfo = {
  // База
  serverPort: '8084',
  fileDir: window.config.ip_api + ':8084/',

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
  
  // Остальные эндпоинты
  restApiLocationHierarchy: '/api/locations/hierarchy/first',
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
};

export default ConstantInfo;