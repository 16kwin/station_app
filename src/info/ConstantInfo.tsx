// ConstantInfo.ts — полный файл (добавлены все недостающие эндпоинты)
const ConstantInfo = {
  // База
  serverHost: window.config.ip_api.replace('http://', '').replace('https://', ''),
  fileDir: window.config.ip_api + '/',

  // API базовый URL
  apiBaseUrl: `${window.config.ip_api}`,
  
  // WebSocket базовый URL
  wsBaseUrl: `ws://${window.config.ip_api.replace('http://', '').replace('https://', '')}`,

  // Авторизация и т.п.
  restApiLogin: '/api/auth/login',
  restApiCheckAuth: '/api/auth/check_auth',
  restApiRefreshToken: '/api/auth/refresh_token',
  restApiLogout: '/api/auth/logout',
  checkAuthPeriod: 50000,
  
  // Спящий режим
  restApiCheckPassword: '/api/auth/check_password',
  inactivityTimeout: 5 * 60 * 1000,
  warningTimeout: 30 * 1000,
  
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
  
  // Номенклатура
  restApiNomenclatureGenerate: '/api/nomenclature/generate',
  restApiNomenclatureDraft: '/api/nomenclature/draft',
  restApiNomenclatureTree: '/api/nomenclature/tree',
  restApiNomenclatureDeleteItems: '/api/nomenclature/items',
  restApiNomenclatureCopyItems: '/api/nomenclature/items/copy',
  restApiNomenclatureMoveItems: '/api/nomenclature/items/move',
  restApiNomenclatureGroups: '/api/nomenclature/groups',
  restApiNomenclatureGetMaterial: (uid: string) => `/api/nomenclature/${uid}`,
  restApiNomenclatureRenameGroup: (uid: string) => `/api/nomenclature/groups/${uid}`,
  
  // Справочники для формы номенклатуры
  restApiNomenclatureTypeMaterials: '/api/nomenclature/type-materials',
  restApiNomenclatureTypePurposes: '/api/nomenclature/type-purposes',
  restApiNomenclatureTypeProducts: '/api/nomenclature/type-products',
  restApiNomenclatureMeasures: '/api/nomenclature/measures',
  restApiNomenclatureManufacturers: '/api/nomenclature/manufacturers',
  restApiNomenclatureBrands: '/api/nomenclature/brands',
  restApiNomenclatureModels: '/api/nomenclature/models',
  restApiNomenclatureCountries: '/api/nomenclature/countries',
  restApiNomenclatureImages: (materialUid: string) => `/api/nomenclature/${materialUid}/images`,
  restApiNomenclatureDeleteImage: (uid: string) => `/api/nomenclature/images/${uid}`,
  restApiNomenclatureBlueprints: (materialUid: string) => `/api/nomenclature/${materialUid}/blueprints`,
  restApiNomenclatureDeleteBlueprint: (uid: string) => `/api/nomenclature/blueprints/${uid}`,
  restApiNomenclatureQrcodes: (materialUid: string) => `/api/nomenclature/${materialUid}/qrcodes`,
  restApiNomenclatureDeleteQrcode: (uid: string) => `/api/nomenclature/qrcodes/${uid}`,
  restApiNomenclaturePrices: (materialUid: string) => `/api/nomenclature/${materialUid}/prices`,
  restApiNomenclatureDeletePrice: (priceUid: string) => `/api/nomenclature/prices/${priceUid}`,
  restApiNomenclatureSuppliers: '/api/nomenclature/suppliers',
  restApiNomenclatureCharacteristics: (materialUid: string) => `/api/nomenclature/${materialUid}/characteristics`,
  restApiNomenclatureAddCharacteristic: (materialUid: string) => `/api/nomenclature/${materialUid}/characteristics`,
  restApiNomenclatureUpdateCharacteristic: (uid: string) => `/api/nomenclature/characteristics/${uid}`,
  restApiNomenclatureDeleteCharacteristic: (uid: string) => `/api/nomenclature/characteristics/${uid}`,
  restApiNomenclatureTypeAttributes: '/api/nomenclature/type-attributes',
  restApiNomenclatureDocuments: (materialUid: string) => `/api/nomenclature/${materialUid}/documents`,
  restApiNomenclatureDeleteDocument: (uid: string) => `/api/nomenclature/documents/${uid}`,
  restApiNomenclatureSuppliersCRUD: '/api/nomenclature/suppliers',
  restApiNomenclatureSupplier: (uid: string) => `/api/nomenclature/suppliers/${uid}`,
  restApiNomenclatureSupply: (materialUid: string) => `/api/nomenclature/${materialUid}/supply`,
  restApiNomenclatureDeleteSupply: (uid: string) => `/api/nomenclature/supply/${uid}`,
  restApiNomenclatureAnalogs: (materialUid: string) => `/api/nomenclature/${materialUid}/analogs`,
  restApiNomenclatureCalculateCompatibility: '/api/nomenclature/calculate-compatibility',
  restApiNomenclatureDeleteAnalog: (uid: string) => `/api/nomenclature/analogs/${uid}`,
  restApiNomenclatureRatings: (materialUid: string) => `/api/nomenclature/${materialUid}/ratings`,
  restApiNomenclatureRatingsAverage: (materialUid: string) => `/api/nomenclature/${materialUid}/ratings/average`,
  restApiNomenclatureDeleteRating: (uid: string) => `/api/nomenclature/ratings/${uid}`,
  restApiNomenclatureIntegrations: (materialUid: string) => `/api/nomenclature/${materialUid}/integrations`,
  restApiNomenclatureDeleteIntegration: (uid: string) => `/api/nomenclature/integrations/${uid}`,
  restApiNomenclatureCodes: (materialUid: string) => `/api/nomenclature/${materialUid}/codes`,
  restApiNomenclatureDeleteCode: (uid: string) => `/api/nomenclature/codes/${uid}`,
  restApiNomenclatureEvents: (materialUid: string) => `/api/nomenclature/${materialUid}/events`,

  // Поставщики
  restApiSupplierGenerate: '/api/suppliers/generate',
  restApiSupplierDraft: '/api/suppliers/draft',
  restApiSuppliersList: '/api/suppliers',
  restApiSupplierGet: (uid: string) => `/api/suppliers/${uid}`,
  restApiSupplierDelete: (uid: string) => `/api/suppliers/${uid}`,
  restApiSupplierImages: (supplierUid: string) => `/api/suppliers/${supplierUid}/images`,
  restApiSupplierDeleteImage: (uid: string) => `/api/suppliers/images/${uid}`,
  restApiSupplierDocuments: (supplierUid: string) => `/api/suppliers/${supplierUid}/documents`,
  restApiSupplierDeleteDocument: (uid: string) => `/api/suppliers/documents/${uid}`,
  restApiSupplierRatings: (supplierUid: string) => `/api/suppliers/${supplierUid}/ratings`,
  restApiSupplierRatingsAverage: (supplierUid: string) => `/api/suppliers/${supplierUid}/ratings/average`,
  restApiSupplierDeleteRating: (uid: string) => `/api/suppliers/ratings/${uid}`,
  restApiSupplierIntegrations: (supplierUid: string) => `/api/suppliers/${supplierUid}/integrations`,
  restApiSupplierDeleteIntegration: (uid: string) => `/api/suppliers/integrations/${uid}`,
  restApiSupplierDescriptionTypes: '/api/suppliers/description-types',
  restApiSupplierEvents: (supplierUid: string) => `/api/suppliers/${supplierUid}/events`,
  restApiSupplierDeliveries: (supplierUid: string) => `/api/suppliers/${supplierUid}/deliveries`,
  restApiSupplierDeleteDelivery: (uid: string) => `/api/suppliers/deliveries/${uid}`,
  restApiSupplierAssortment: (supplierUid: string) => `/api/suppliers/${supplierUid}/assortment`,

  // Шаблоны
  restApiTemplatesCategories: '/api/templates/categories',
  restApiTemplatesCategory: (id: number) => `/api/templates/categories/${id}`,
  restApiTemplates: '/api/templates',
  restApiTemplate: (uid: string) => `/api/templates/${uid}`,
  restApiTemplateCopy: '/api/templates/copy',
  restApiTemplateStations: (uid: string) => `/api/templates/${uid}/stations`,
  restApiTemplateCells: (uid: string) => `/api/templates/${uid}/cells`,
  restApiTemplateCell: (uid: string) => `/api/templates/cells/${uid}`,
  restApiTemplateCellsClearBatch: '/api/templates/cells/clear-batch',
  restApiTemplateCellsCreate: '/api/templates/cells',

  // Предприятия, цеха, участки
  restApiEnterprises: '/api/enterprises',
  restApiEnterprise: (id: number) => `/api/enterprises/${id}`,
  restApiWorkshops: '/api/workshops',
  restApiWorkshop: (id: number) => `/api/workshops/${id}`,
  restApiSections: '/api/sections',
  restApiSection: (id: number) => `/api/sections/${id}`,

  // Типы, производители, модели станций
  restApiStationTypes: '/api/station-types',
  restApiStationType: (uid: string) => `/api/station-types/${uid}`,
  restApiStationManufacturers: '/api/station-manufacturers',
  restApiStationManufacturer: (uid: string) => `/api/station-manufacturers/${uid}`,
  restApiStationModels: '/api/station-models',
  restApiStationModel: (uid: string) => `/api/station-models/${uid}`,
  restApiStationModelGenerateCode: '/api/station-models/generate-code',
  restApiStationModelImages: (modelUid: string) => `/api/station-models/${modelUid}/images`,
  restApiStationModelDeleteImage: (imageUid: string) => `/api/station-models/images/${imageUid}`,

  // Конфигурации станций
  restApiStationConfigurations: '/api/station-configurations',
  restApiStationConfiguration: (uid: string) => `/api/station-configurations/${uid}`,
  restApiStationConfigurationsByModel: (modelId: string) => `/api/station-configurations?modelId=${modelId}`,

  // CRUD станций
  restApiStationsCrud: (userId: number) => `/api/stations/crud?userId=${userId}`,
  restApiStationsCrudGenerateCode: '/api/stations/crud/generate-code',
  restApiStationCrud: (uid: string) => `/api/stations/crud/${uid}`,
  restApiStationDocuments: (stationUid: string) => `/api/stations/${stationUid}/documents`,
  restApiStationDeleteDocument: (stationUid: string, documentUid: string) => `/api/stations/${stationUid}/documents/${documentUid}`,

  // Настройки станций (колонки, фильтры, сортировка)
  restApiStationColumnsSettings: (userId: number) => `/api/stations/columns-settings?userId=${userId}`,
  restApiStationColumnsSettingsSave: (userId: number) => `/api/stations/columns-settings?userId=${userId}`,
  
  restApiStationFiltersSettings: (userId: number) => `/api/stations/filters-settings?userId=${userId}`,
  restApiStationFiltersSettingsSave: (userId: number) => `/api/stations/filters-settings?userId=${userId}`,
  
  restApiStationSortSettings: (userId: number) => `/api/stations/sort-settings?userId=${userId}`,
  restApiStationSortSettingsSave: (userId: number) => `/api/stations/sort-settings?userId=${userId}`,
  
  restApiStationAllSettings: (userId: number) => `/api/stations/settings?userId=${userId}`,
  restApiStationAllSettingsSave: (userId: number) => `/api/stations/settings?userId=${userId}`,

  // Холдинги
  restApiHoldings: '/api/holdings',
  restApiHoldingAllSettings: (userId: number) => `/api/holdings/settings?userId=${userId}`,

  // Заказы
  restApiOrdersActive: '/api/orders/active',
  restApiOrdersClosed: '/api/orders/closed',
  restApiOrderCreate: (orderUid: string) => `/api/orders/${orderUid}`,
  restApiOrderGet: (orderUid: string) => `/api/orders/${orderUid}`,

  // ТКП
  restApiTkpActive: '/api/tkp/active',
  restApiTkpClosed: '/api/tkp/closed',
  restApiTkpGet: (tkpUid: string) => `/api/tkp/${tkpUid}`,
  restApiStationEvents: '/api/stations/crud/events',
  restApiStationModelDocuments: (modelUid: string) => `/api/station-models/${modelUid}/documents`,
  restApiStationModelDeleteDocument: (documentUid: string) => `/api/station-models/documents/${documentUid}`,

  // Расположения (locations)
  restApiLocationsCrud: '/api/locations-crud',
  restApiLocationCrud: (uid: string) => `/api/locations-crud/${uid}`,
  restApiLocationEvents: '/api/locations-crud/events',
  restApiLocationEventsByUid: (uid: string) => `/api/locations-crud/${uid}/events`,
  restApiLocationColumnsSettings: (userId: number) => `/api/locations-crud/columns-settings?userId=${userId}`,
  restApiLocationColumnsSettingsSave: (userId: number) => `/api/locations-crud/columns-settings?userId=${userId}`,

  // Страны (countries)
  restApiCountriesCrud: '/api/countries-crud',
  restApiCountryCrud: (uid: string) => `/api/countries-crud/${uid}`,
  restApiCountryEvents: '/api/countries-crud/events',
  restApiCountryEventsByUid: (uid: string) => `/api/countries-crud/${uid}/events`,
  restApiCountryColumnsSettings: (userId: number) => `/api/countries-crud/columns-settings?userId=${userId}`,
  restApiCountryColumnsSettingsSave: (userId: number) => `/api/countries-crud/columns-settings?userId=${userId}`,
  restApiCountryAllSettings: (userId: number) => `/api/countries-crud/settings?userId=${userId}`,
  restApiCountrySortSettings: (userId: number) => `/api/countries-crud/sort-settings?userId=${userId}`,
  restApiCountrySortSettingsSave: (userId: number) => `/api/countries-crud/sort-settings?userId=${userId}`,
  restApiCountryFiltersSettings: (userId: number) => `/api/countries-crud/filters-settings?userId=${userId}`,
  restApiCountryFiltersSettingsSave: (userId: number) => `/api/countries-crud/filters-settings?userId=${userId}`,

  // Типы станций — события и настройки
  restApiStationTypeEvents: '/api/station-types/events',
  restApiStationTypeEventsByUid: (uid: string) => `/api/station-types/${uid}/events`,
  restApiStationTypeColumnsSettings: (userId: number) => `/api/station-types/columns-settings?userId=${userId}`,
  restApiStationTypeColumnsSettingsSave: (userId: number) => `/api/station-types/columns-settings?userId=${userId}`,
  restApiStationTypeFiltersSettings: (userId: number) => `/api/station-types/filters-settings?userId=${userId}`,
  restApiStationTypeFiltersSettingsSave: (userId: number) => `/api/station-types/filters-settings?userId=${userId}`,
  restApiStationTypeSortSettings: (userId: number) => `/api/station-types/sort-settings?userId=${userId}`,
  restApiStationTypeSortSettingsSave: (userId: number) => `/api/station-types/sort-settings?userId=${userId}`,

  // Производители станций — события и настройки
  restApiStationManufacturerEvents: '/api/station-manufacturers/events',
  restApiStationManufacturerEventsByUid: (uid: string) => `/api/station-manufacturers/${uid}/events`,
  restApiStationManufacturerColumnsSettings: (userId: number) => `/api/station-manufacturers/columns-settings?userId=${userId}`,
  restApiStationManufacturerColumnsSettingsSave: (userId: number) => `/api/station-manufacturers/columns-settings?userId=${userId}`,
  restApiStationManufacturerFiltersSettings: (userId: number) => `/api/station-manufacturers/filters-settings?userId=${userId}`,
  restApiStationManufacturerFiltersSettingsSave: (userId: number) => `/api/station-manufacturers/filters-settings?userId=${userId}`,
  restApiStationManufacturerSortSettings: (userId: number) => `/api/station-manufacturers/sort-settings?userId=${userId}`,
  restApiStationManufacturerSortSettingsSave: (userId: number) => `/api/station-manufacturers/sort-settings?userId=${userId}`,

  // Холдинги — события и настройки
  restApiHoldingEvents: '/api/holdings/events',
  restApiHoldingEventsById: (id: number) => `/api/holdings/${id}/events`,
  restApiHoldingColumnsSettings: (userId: number) => `/api/holdings/columns-settings?userId=${userId}`,
  restApiHoldingColumnsSettingsSave: (userId: number) => `/api/holdings/columns-settings?userId=${userId}`,
  restApiHoldingFiltersSettings: (userId: number) => `/api/holdings/filters-settings?userId=${userId}`,
  restApiHoldingFiltersSettingsSave: (userId: number) => `/api/holdings/filters-settings?userId=${userId}`,
  restApiHoldingSortSettings: (userId: number) => `/api/holdings/sort-settings?userId=${userId}`,
  restApiHoldingSortSettingsSave: (userId: number) => `/api/holdings/sort-settings?userId=${userId}`,

  // Предприятия — события и настройки
  restApiEnterpriseEvents: '/api/enterprises/events',
  restApiEnterpriseEventsById: (id: number) => `/api/enterprises/${id}/events`,
  restApiEnterpriseColumnsSettings: (userId: number) => `/api/enterprises/columns-settings?userId=${userId}`,
  restApiEnterpriseColumnsSettingsSave: (userId: number) => `/api/enterprises/columns-settings?userId=${userId}`,
  restApiEnterpriseFiltersSettings: (userId: number) => `/api/enterprises/filters-settings?userId=${userId}`,
  restApiEnterpriseFiltersSettingsSave: (userId: number) => `/api/enterprises/filters-settings?userId=${userId}`,
  restApiEnterpriseSortSettings: (userId: number) => `/api/enterprises/sort-settings?userId=${userId}`,
  restApiEnterpriseSortSettingsSave: (userId: number) => `/api/enterprises/sort-settings?userId=${userId}`,

  // Цеха — события и настройки
  restApiWorkshopEvents: '/api/workshops/events',
  restApiWorkshopEventsById: (id: number) => `/api/workshops/${id}/events`,
  restApiWorkshopColumnsSettings: (userId: number) => `/api/workshops/columns-settings?userId=${userId}`,
  restApiWorkshopColumnsSettingsSave: (userId: number) => `/api/workshops/columns-settings?userId=${userId}`,
  restApiWorkshopFiltersSettings: (userId: number) => `/api/workshops/filters-settings?userId=${userId}`,
  restApiWorkshopFiltersSettingsSave: (userId: number) => `/api/workshops/filters-settings?userId=${userId}`,
  restApiWorkshopSortSettings: (userId: number) => `/api/workshops/sort-settings?userId=${userId}`,
  restApiWorkshopSortSettingsSave: (userId: number) => `/api/workshops/sort-settings?userId=${userId}`,

  // Участки — события и настройки
  restApiSectionEvents: '/api/sections/events',
  restApiSectionEventsById: (id: number) => `/api/sections/${id}/events`,
  restApiSectionColumnsSettings: (userId: number) => `/api/sections/columns-settings?userId=${userId}`,
  restApiSectionColumnsSettingsSave: (userId: number) => `/api/sections/columns-settings?userId=${userId}`,
  restApiSectionFiltersSettings: (userId: number) => `/api/sections/filters-settings?userId=${userId}`,
  restApiSectionFiltersSettingsSave: (userId: number) => `/api/sections/filters-settings?userId=${userId}`,
  restApiSectionSortSettings: (userId: number) => `/api/sections/sort-settings?userId=${userId}`,
  restApiSectionSortSettingsSave: (userId: number) => `/api/sections/sort-settings?userId=${userId}`,

  // Модели станций — события и настройки
  restApiStationModelEvents: '/api/station-models/events',
  restApiStationModelEventsByUid: (uid: string) => `/api/station-models/${uid}/events`,
  restApiStationModelColumnsSettings: (userId: number) => `/api/station-models/columns-settings?userId=${userId}`,
  restApiStationModelColumnsSettingsSave: (userId: number) => `/api/station-models/columns-settings?userId=${userId}`,
  restApiStationModelFiltersSettings: (userId: number) => `/api/station-models/filters-settings?userId=${userId}`,
  restApiStationModelFiltersSettingsSave: (userId: number) => `/api/station-models/filters-settings?userId=${userId}`,
  restApiStationModelSortSettings: (userId: number) => `/api/station-models/sort-settings?userId=${userId}`,
  restApiStationModelSortSettingsSave: (userId: number) => `/api/station-models/sort-settings?userId=${userId}`,

  // Конфигурации станций — события и настройки
  restApiStationConfigurationEvents: '/api/station-configurations/events',
  restApiStationConfigurationEventsByUid: (uid: string) => `/api/station-configurations/${uid}/events`,
  restApiStationConfigurationColumnsSettings: (userId: number) => `/api/station-configurations/columns-settings?userId=${userId}`,
  restApiStationConfigurationColumnsSettingsSave: (userId: number) => `/api/station-configurations/columns-settings?userId=${userId}`,
  restApiStationConfigurationFiltersSettings: (userId: number) => `/api/station-configurations/filters-settings?userId=${userId}`,
  restApiStationConfigurationFiltersSettingsSave: (userId: number) => `/api/station-configurations/filters-settings?userId=${userId}`,
  restApiStationConfigurationSortSettings: (userId: number) => `/api/station-configurations/sort-settings?userId=${userId}`,
  restApiStationConfigurationSortSettingsSave: (userId: number) => `/api/station-configurations/sort-settings?userId=${userId}`,
  // Расположения — все настройки
restApiLocationAllSettings: (userId: number) => `/api/locations-crud/settings?userId=${userId}`,
restApiLocationSortSettings: (userId: number) => `/api/locations-crud/sort-settings?userId=${userId}`,
restApiLocationSortSettingsSave: (userId: number) => `/api/locations-crud/sort-settings?userId=${userId}`,
restApiLocationFiltersSettings: (userId: number) => `/api/locations-crud/filters-settings?userId=${userId}`,
restApiLocationFiltersSettingsSave: (userId: number) => `/api/locations-crud/filters-settings?userId=${userId}`,
restApiEnterpriseAllSettings: (userId: number) => `/api/enterprises/settings?userId=${userId}`,
restApiSectionAllSettings: (userId: number) => `/api/sections/settings?userId=${userId}`,
restApiWorkshopAllSettings: (userId: number) => `/api/workshops/settings?userId=${userId}`,
restApiStationTypeAllSettings: (userId: number) => `/api/station-types/settings?userId=${userId}`,
restApiStationManufacturerAllSettings: (userId: number) => `/api/station-manufacturers/settings?userId=${userId}`,

restApiStationModelAllSettings: (userId: number) => `/api/station-models/settings?userId=${userId}`,
// Конфигурации станций — все настройки
restApiStationConfigurationAllSettings: (userId: number) => `/api/station-configurations/settings?userId=${userId}`,
};

export default ConstantInfo;