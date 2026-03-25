// Блок констант
const ConstantInfo = {
  // База
  serverPort: '8084',
  fileDir: window.config.ip_api + ':8084/',

  // Авторизация и т.п.
  restApiLogin: '/api/auth/login',
  restApiCheckAuth: '/api/auth/check_auth',
  restApiRefreshToken: '/api/auth/refresh_token',
  restApiLogout: '/logout',
  checkAuthPeriod: 50000, // таймер проверки авторизации (в мс)
  restApiLocationHierarchy: '/api/locations/hierarchy/first',
  restApiCreateLocation: '/api/locations',
  restApiCreateStation: '/api/stations',
  
  // Новый эндпоинт для Dashboard
  restApiDashboardStats: '/api/dashboard/stats',
  
  // Эндпоинты для фото локаций
  restApiUploadLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  restApiGetLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  restApiDeleteLocationPhoto: (locationId: number) => `/api/locations/${locationId}/photo`,
  
  // Новые эндпоинты для позиций станций
  restApiCreateOrUpdateStationPosition: '/api/station-positions',
  restApiGetStationPositionsByLocation: (locationId: number) => `/api/station-positions/location/${locationId}`,
  restApiGetStationPositionsByStation: (stationId: number) => `/api/station-positions/station/${stationId}`,
  restApiGetStationPosition: (stationId: number, locationId: number) => `/api/station-positions/${stationId}/${locationId}`,
  restApiDeleteStationPosition: (stationId: number, locationId: number) => `/api/station-positions/${stationId}/${locationId}`,
  restApiDeleteAllStationPositionsByStation: (stationId: number) => `/api/station-positions/station/${stationId}`,
  restApiDeleteAllStationPositionsByLocation: (locationId: number) => `/api/station-positions/location/${locationId}`,
  
  // URL для прямого доступа к файлу
  getLocationPhotoUrl: (filePath: string, fileName: string) => 
    `${ConstantInfo.fileDir}uploads/${filePath}${fileName}`,
};

export default ConstantInfo;