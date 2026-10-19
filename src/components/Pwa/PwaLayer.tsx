// PwaLayer.tsx — слой PWA поверх приложения: уведомление о новой версии и предложение установки.
// Монтируется в main.tsx рядом с <App/>; от авторизации и маршрутов не зависит. Показывается, только если
// bootstrapPwa включил PWA по флагу установки: при выключенной pwa ни «Установить», ни «Обновить» не появляются.
import React from 'react';
import UpdateToast from './UpdateToast';
import InstallPrompt from './InstallPrompt';
import { useUpdateState } from './serviceWorker';
import { usePwaEnabled } from './bootstrapPwa';

const PwaLayer: React.FC = () => {
  const enabled = usePwaEnabled();
  const { available } = useUpdateState();
  if (!enabled) return null;
  return (
    <>
      <UpdateToast />
      {/* Обе карточки внизу экрана — обновление важнее, установку предложим позже */}
      <InstallPrompt suppressed={available} />
    </>
  );
};

export default PwaLayer;
