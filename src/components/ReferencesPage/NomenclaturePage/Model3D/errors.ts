// errors.ts — ошибка подготовки модели, текст которой можно сразу показать пользователю.

export class ModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelError';
  }
}

/** Текст для пользователя: у ModelError — как есть, у прочих — запасной текст */
export const modelErrorText = (error: unknown, fallback: string): string =>
  error instanceof ModelError ? error.message : fallback;
