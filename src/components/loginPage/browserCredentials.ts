// browserCredentials.ts — предложение браузеру сохранить пароль (функция passwords, уровень L1, раздел 4.2
// проекта «Дискретное отключение функций»). Только Credential Management API (PasswordCredential, Chrome и
// Яндекс Браузер), и только когда установка разрешает passwords: на общих ПК и ТСД безопасник обычно запрещает
// хранить пароли в браузере. Прежние обходные пути — скрытый iframe с формой и синхронный XHR на /login с паролем
// в теле — удалены совсем: они лишний раз отправляли пароль на адрес /login, который API не обслуживает.
// Собственную эвристику браузера («Сохранить пароль?» после отправки формы) приложение не отключает: это L1.

/** Конструктор PasswordCredential есть не во всех браузерах и не во всех типах DOM */
type PasswordCredentialConstructor = new (data: { id: string; password: string; name?: string }) => Credential;

/** Минимум окна для сохранения: подменяют тесты */
export interface CredentialWindow {
  PasswordCredential?: PasswordCredentialConstructor;
  navigator: { credentials?: Pick<CredentialsContainer, 'store'> };
}

/**
 * Предложить браузеру сохранить логин и пароль. allowed — флаг passwords с сервера (GET /api/features/public);
 * при сбое запроса он false. true — браузеру передано (решает и спрашивает он сам)
 */
export const offerToSavePassword = (
  login: string,
  password: string,
  allowed: boolean,
  win: CredentialWindow = window as unknown as CredentialWindow,
): boolean => {
  if (!allowed || !login || !password) return false;
  const Constructor = win.PasswordCredential;
  const credentials = win.navigator.credentials;
  if (typeof Constructor !== 'function' || !credentials) return false;
  try {
    void credentials.store(new Constructor({ id: login, password, name: login })).catch(() => undefined);
    return true;
  } catch {
    // браузер отказал (например, страница не в безопасном контексте) — просто не сохраняем
    return false;
  }
};
