// toolbarExport.ts — выгрузка и печать в панели инструментов справочников (TableToolbar) под функцией export.
// Одно место на все справочники: при выключенной export обработчики обнуляются, и панель не показывает ни меню
// «Скачать PDF / Excel / Word», ни кнопку печати (печать здесь — серверный рендер /print). Отдельный файл без
// иконок — его проверяет юнит-тест (test/features/TableToolbar.test.tsx).
import { useCanExport } from '../../services/features/fileAccess';

export interface ToolbarExportHandlers {
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onDownloadExcel?: () => void;
  onDownloadWord?: () => void;
}

export interface ToolbarExport extends ToolbarExportHandlers {
  /** Показывать кнопку «Скачать» с меню PDF / Excel / Word */
  downloadMenu: boolean;
}

/**
 * Что панель показывает из выгрузки. При включённой export — как раньше: меню выгрузки есть всегда,
 * кнопка печати — если страница передала обработчик. При выключенной — ничего
 */
export const toolbarExport = (handlers: ToolbarExportHandlers, canExport: boolean): ToolbarExport =>
  canExport
    ? {
        onPrint: handlers.onPrint,
        onDownloadPdf: handlers.onDownloadPdf,
        onDownloadExcel: handlers.onDownloadExcel,
        onDownloadWord: handlers.onDownloadWord,
        downloadMenu: true,
      }
    : { downloadMenu: false };

/** Хук панели: выгрузка по функции export текущего пользователя */
export const useToolbarExport = (handlers: ToolbarExportHandlers): ToolbarExport => toolbarExport(handlers, useCanExport());
