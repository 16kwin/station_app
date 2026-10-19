// hooks/useInactivityLock.ts
// Таймауты автоблокировки задаёт профиль установки (awms.ui.inactivity-minutes, awms.ui.warning-minutes в файле
// потолка, ответ /api/features → ui). Пока профиля нет или сервер их не прислал — значения ConstantInfo.
import { useEffect, useRef, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '../../services/AuthContext';
import ConstantInfo from '../../info/ConstantInfo';
import { getFeatureSnapshot, subscribeFeatures } from '../../services/features/featureStore';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'wheel'];

const MINUTE_MS = 60 * 1000;

export interface InactivityTimeouts {
  /** Через сколько миллисекунд бездействия экран блокируется */
  inactivityMs: number;
  /** За сколько миллисекунд до блокировки показывается предупреждение */
  warningMs: number;
}

/**
 * Таймауты из профиля установки (минуты; null — не заданы). Предупреждение не дольше половины срока
 * блокировки: иначе оно появлялось бы сразу после любого действия пользователя
 */
export const inactivityTimeouts = (inactivityMinutes: number | null, warningMinutes: number | null): InactivityTimeouts => {
  const inactivityMs = inactivityMinutes !== null ? inactivityMinutes * MINUTE_MS : ConstantInfo.inactivityTimeout;
  const warningMs = warningMinutes !== null ? warningMinutes * MINUTE_MS : ConstantInfo.warningTimeout;
  return { inactivityMs, warningMs: Math.min(warningMs, Math.floor(inactivityMs / 2)) };
};

// Числа, а не объект ui: обновление профиля с теми же таймаутами не перезапускает таймеры
const getInactivityMinutes = () => getFeatureSnapshot().profile?.ui.inactivityMinutes ?? null;
const getWarningMinutes = () => getFeatureSnapshot().profile?.ui.warningMinutes ?? null;

/** Хук: таймауты автоблокировки из профиля установки */
export const useInactivityTimeouts = (): InactivityTimeouts => {
  const inactivityMinutes = useSyncExternalStore(subscribeFeatures, getInactivityMinutes);
  const warningMinutes = useSyncExternalStore(subscribeFeatures, getWarningMinutes);
  return useMemo(() => inactivityTimeouts(inactivityMinutes, warningMinutes), [inactivityMinutes, warningMinutes]);
};

export const useInactivityLock = () => {
  const { isAuth, isLocked, setLocked } = useAuth();
  const { inactivityMs, warningMs } = useInactivityTimeouts();
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const showWarningRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    if (!isAuth || isLocked) return;

    clearTimers();

    // Таймер до предупреждения
    warningTimerRef.current = setTimeout(() => {
      if (isAuth && !isLocked) {
        showWarningRef.current = true;
        setShowWarning(true);
        // Отправляем событие в другие вкладки
        channelRef.current?.postMessage({ type: 'warning' });
      }
    }, inactivityMs - warningMs);

    // Таймер до блокировки
    timerRef.current = setTimeout(() => {
      if (isAuth && !isLocked) {
        setLocked(true);
        showWarningRef.current = false;
        setShowWarning(false);
        // Отправляем событие в другие вкладки
        channelRef.current?.postMessage({ type: 'lock' });
      }
    }, inactivityMs);
  }, [isAuth, isLocked, setLocked, clearTimers, inactivityMs, warningMs]);

  const resetTimers = useCallback(() => {
    if (!isAuth || isLocked) return;

    clearTimers();
    showWarningRef.current = false;
    setShowWarning(false);
    startTimers();
  }, [isAuth, isLocked, startTimers, clearTimers]);

  useEffect(() => {
    // Создаем BroadcastChannel
    channelRef.current = new BroadcastChannel('app_inactivity_channel');

    const handleChannelMessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || !message.type) return;

      switch (message.type) {
        case 'activity':
          // Активность в другой вкладке — сбрасываем таймеры (только если предупреждение не показывается)
          if (!showWarningRef.current) {
            resetTimers();
          }
          break;
        case 'warning':
          // Предупреждение из другой вкладки
          showWarningRef.current = true;
          setShowWarning(true);
          break;
        case 'cancel_warning':
          // Отмена предупреждения из другой вкладки
          resetTimers();
          break;
        case 'lock':
          // Блокировка из другой вкладки
          setLocked(true);
          showWarningRef.current = false;
          setShowWarning(false);
          clearTimers();
          break;
        case 'unlock':
          // Разблокировка из другой вкладки
          setLocked(false);
          showWarningRef.current = false;
          setShowWarning(false);
          resetTimers();
          break;
        default:
          break;
      }
    };

    channelRef.current.onmessage = handleChannelMessage;

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [resetTimers, setLocked, clearTimers]);

  useEffect(() => {
    if (!isAuth || isLocked) {
      showWarningRef.current = false;
      setShowWarning(false);
      clearTimers();
      return;
    }

    startTimers();

    const handleActivity = () => {
      // Если предупреждение показывается — игнорируем движение
      if (showWarningRef.current) return;

      // Отправляем событие активности в другие вкладки
      channelRef.current?.postMessage({ type: 'activity' });
      resetTimers();
    };

    // Слушаем на document с capture
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, { capture: true } as any);
      });
      clearTimers();
    };
  }, [isAuth, isLocked, startTimers, resetTimers, clearTimers]);

  return { showWarning, setShowWarning };
};