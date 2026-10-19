// viewCache.ts — последние открытые модели (GLB) в памяти вкладки: повторное открытие без загрузки и конвертации.
// Ограничено по объёму, чтобы большие модели не держали память браузера.

const LIMIT_BYTES = 160 * 1024 * 1024;
const cache = new Map<string, ArrayBuffer>();

export const getCachedView = (uid: string): ArrayBuffer | undefined => {
  const buffer = cache.get(uid);
  if (buffer) {
    // Обращение — в конец очереди на вытеснение
    cache.delete(uid);
    cache.set(uid, buffer);
  }
  return buffer;
};

export const putCachedView = (uid: string, buffer: ArrayBuffer) => {
  if (buffer.byteLength > LIMIT_BYTES) return;
  cache.delete(uid);
  cache.set(uid, buffer);
  let total = 0;
  for (const item of cache.values()) total += item.byteLength;
  for (const [key, item] of cache) {
    if (total <= LIMIT_BYTES) break;
    cache.delete(key);
    total -= item.byteLength;
  }
};

export const dropCachedView = (uid: string) => {
  cache.delete(uid);
};
