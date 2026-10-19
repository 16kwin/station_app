// convert.worker.ts — Web Worker подготовки 3D-модели: разбор файла, слияние по материалу и экспорт в GLB.
// Тяжёлая работа (STEP, VRML на десятки мегабайт) идёт здесь, интерфейс не замирает.
// В vite.config подстановка global должна быть 'globalThis', а не 'window', — иначе воркер не запустится
import { ModelError } from './errors';
import { runPipeline } from './pipeline';
import type { ConvertRequest, ConvertResponse } from './types';

/** Глобальный объект воркера; в lib.dom его типа нет, описываем то, чем пользуемся */
interface WorkerScope {
  onmessage: ((event: MessageEvent<ConvertRequest>) => void) | null;
  postMessage(message: ConvertResponse, transfer?: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

const errorMessage = (error: unknown): string => {
  if (error instanceof ModelError) return error.message;
  if (error instanceof RangeError) {
    return 'Браузеру не хватило памяти для этой модели. Выгрузите из САПР облегчённую модель (меньше деталей или грубее сетка).';
  }
  return 'Не удалось подготовить модель к просмотру: файл повреждён или его содержимое не поддерживается.';
};

scope.onmessage = event => {
  runPipeline(event.data, (stage, ratio) => scope.postMessage({ type: 'progress', stage, ratio }))
    .then(result => scope.postMessage({ type: 'done', ...result }, result.glb ? [result.glb] : []))
    .catch((error: unknown) => {
      console.error('Подготовка 3D-модели:', error);
      scope.postMessage({ type: 'error', message: errorMessage(error) });
    });
};
