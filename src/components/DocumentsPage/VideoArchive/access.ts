// access.ts — права на видео для файлов модуля. Сама политика (роль ∧ функция установки) — в
// services/features/videoAccess.ts, вне каталога модуля: её спрашивают и станции, и карта, не подключая модуль.
// Роли — как на сервере (VideoAccess): администратор и директор — живой просмотр, запись, настройки камер и
// события; остальные — только журнал. Выключенная на установке подфункция закрыта для всех ролей.
export {
  useCanDownloadVideo,
  useCanRecordClips,
  useCanSendEvents,
  useCanSetupCameras,
  useCanViewLive,
  useCanViewVideoArchive,
  useVideoAccess,
  videoAccessFor,
} from '../../../services/features/videoAccess';
export type { VideoAccess } from '../../../services/features/videoAccess';

/** Прежнее имя: «полный доступ к видео» — это живой просмотр станций */
export { useCanViewLive as useCanManageVideo } from '../../../services/features/videoAccess';
