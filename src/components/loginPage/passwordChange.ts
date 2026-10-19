// passwordChange.ts — обязательная смена пароля при первом входе (пакет B10 проекта «Дискретное отключение
// функций», раздел 6.7): пользователь, созданный командой create-user, и засеянный admin с паролем из V1 должны
// сменить пароль, пока не сменят — остальные API отвечают 403.
// Контракт с сервером (B10 реализует его, F-часть волны 1.5 сверяет с живым API):
//  • ответ POST /api/auth/login — JSON с признаком mustChangePassword: true; прежний ответ (строка) — смена
//    не нужна, поэтому вход на сервере без B10 работает как раньше;
//  • POST /api/auth/change_password (вошедший, CSRF), тело { currentPassword, newPassword }:
//    200/204 — пароль сменён, сессия продолжается; 400 — пароль не принят (неверный текущий, слабый, тот же),
//    в теле { message } или текст для пользователя; 401 — сессия истекла.
//    Неверный текущий пароль — 400, а не 401/403: на 401/403 перехватчик Axios обновляет токен и уводит на /login.

export const CHANGE_PASSWORD_API = '/api/auth/change_password';

/** Минимальная длина нового пароля в форме. Окончательную политику задаёт сервер (B10), его отказ показывается как есть */
export const MIN_PASSWORD_LENGTH = 8;

export interface LoginResult {
  /** Сервер требует сменить пароль до начала работы */
  mustChangePassword: boolean;
}

/** Разбор ответа входа: смена нужна, только если сервер прислал ровно true */
export const parseLoginResponse = (data: unknown): LoginResult => ({
  mustChangePassword:
    typeof data === 'object' && data !== null && (data as { mustChangePassword?: unknown }).mustChangePassword === true,
});

export type PasswordProblem = 'current' | 'empty' | 'short' | 'mismatch' | 'same';

export const PASSWORD_PROBLEM_TEXT: Readonly<Record<PasswordProblem, string>> = {
  current: 'Введите текущий пароль',
  empty: 'Введите новый пароль',
  short: `Новый пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
  mismatch: 'Пароли не совпадают',
  same: 'Новый пароль должен отличаться от текущего',
};

/** Проверка формы до отправки; null — можно отправлять */
export const checkNewPassword = (current: string, next: string, repeat: string): PasswordProblem | null => {
  if (!current) return 'current';
  if (!next) return 'empty';
  if (next.length < MIN_PASSWORD_LENGTH) return 'short';
  if (next !== repeat) return 'mismatch';
  if (next === current) return 'same';
  return null;
};

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/** rejected — сервер не принял пароль; session — сессия истекла, нужен новый вход; network, server — сбой */
export type PasswordChangeFailure = 'rejected' | 'session' | 'network' | 'server';

export type PasswordChangeResult = { ok: true } | { ok: false; reason: PasswordChangeFailure; message: string };

/** HTTP-клиент: подходит экземпляр Axios (AxiosService); тесты подставляют заглушку */
export interface PasswordHttp {
  get(url: string): Promise<{ data: unknown }>;
  post(url: string, body: unknown): Promise<{ status: number; data: unknown }>;
  defaults: { headers: Record<string, unknown> };
}

const SERVICE_ERROR = 'Внимание! Ошибка на стороне сервиса';

/** Текст отказа сервера для пользователя: строка тела или поле message; иначе — общий */
const serverMessage = (data: unknown): string => {
  const text =
    typeof data === 'string' ? data : typeof data === 'object' && data !== null ? (data as { message?: unknown }).message : null;
  return typeof text === 'string' && text.trim() !== '' && text.length <= 300 ? text.trim() : 'Пароль не принят сервером';
};

/** Сменить пароль. Перед запросом — свежий CSRF-токен, как перед входом (сервер мог сменить его при входе) */
export const changePassword = async (http: PasswordHttp, request: PasswordChangeRequest): Promise<PasswordChangeResult> => {
  try {
    const csrf = await http.get('/csrf');
    const token = (csrf.data as { token?: unknown } | null)?.token;
    if (typeof token === 'string') http.defaults.headers['X-XSRF-TOKEN'] = token;
    const response = await http.post(CHANGE_PASSWORD_API, request);
    if (response.status >= 200 && response.status < 300) return { ok: true };
    return { ok: false, reason: 'server', message: SERVICE_ERROR };
  } catch (error) {
    const failure = error as { response?: { status?: number; data?: unknown }; code?: string };
    const status = failure.response?.status;
    if (status === 400) return { ok: false, reason: 'rejected', message: serverMessage(failure.response?.data) };
    if (status === 401 || status === 403) {
      return { ok: false, reason: 'session', message: 'Сеанс завершён. Войдите снова со своим текущим паролем' };
    }
    if (failure.code === 'ERR_NETWORK' || !failure.response) return { ok: false, reason: 'network', message: SERVICE_ERROR };
    return { ok: false, reason: 'server', message: SERVICE_ERROR };
  }
};
