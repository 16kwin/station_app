// UpdateToast.tsx — уведомление «Доступна новая версия · Обновить» в правом нижнем углу
// (на телефоне — снизу во всю ширину). Не блокирует работу; перезагрузка только по кнопке, чтобы
// не потерять несохранённые данные. Крестик скрывает уведомление до следующего открытия страницы.
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { applyUpdate, useUpdateState } from './serviceWorker';
import { NARROW_QUERY, useMediaQuery } from './useMediaQuery';
import { APPEAR, COLORS, FONT, PWA_Z_INDEX, SHADOWS } from './theme';
import { RefreshIcon } from './icons';
import { CloseButton, IconBadge, PwaButton } from './ui';

const UpdateToast: React.FC = () => {
  const { available, updating } = useUpdateState();
  const narrow = useMediaQuery(NARROW_QUERY);
  const [hidden, setHidden] = useState(false);
  const visible = available && (!hidden || updating);

  const button = (
    <PwaButton primary busy={updating} onClick={applyUpdate} height={40} fullWidth={narrow}>
      {updating ? 'Обновляем' : 'Обновить'}
    </PwaButton>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pwa-update"
          role="status"
          aria-live="polite"
          {...APPEAR}
          style={{
            position: 'fixed',
            ...(narrow ? { left: 16, right: 16 } : { right: 24, width: 540 }),
            bottom: `calc(${narrow ? 16 : 24}px + env(safe-area-inset-bottom, 0px))`,
            zIndex: PWA_Z_INDEX,
            boxSizing: 'border-box',
            padding: narrow ? 14 : '14px 12px 14px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: 14,
            rowGap: 12,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            boxShadow: `${SHADOWS.card}, ${SHADOWS.modal}`,
            fontFamily: FONT,
            transformOrigin: narrow ? 'bottom center' : 'bottom right',
          }}
        >
          <IconBadge>
            <motion.span
              animate={updating ? { rotate: 360 } : { rotate: 0 }}
              transition={updating ? { duration: 0.9, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <RefreshIcon size={22} />
            </motion.span>
          </IconBadge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>Доступна новая версия</div>
            <div style={{ marginTop: 2, fontSize: 13, lineHeight: '18px', color: COLORS.textMuted }}>
              {updating ? 'Перезапускаем приложение…' : 'Сохраните изменения и обновите страницу'}
            </div>
          </div>
          {!narrow && button}
          {!updating && <CloseButton onClick={() => setHidden(true)} />}
          {narrow && <div style={{ flexBasis: '100%', display: 'flex' }}>{button}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateToast;
