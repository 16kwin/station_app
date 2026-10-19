// AxiosService.ts (заглушка тестов) — настоящий AxiosService при загрузке читает window.config, которого в Node нет.
// Тест хранилища функций подключает свой клиент через connectFeatureHttp; обращение сюда — ошибка теста.
const AxiosService = {
  async get(url: string): Promise<{ data: unknown }> {
    throw new Error(`AxiosService в тестах не подключён (${url}): подключите заглушку через connectFeatureHttp`);
  },
};

export default AxiosService;
