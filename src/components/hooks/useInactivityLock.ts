// hooks/useInactivityLock.ts
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import ConstantInfo from '../../info/ConstantInfo';

export const useInactivityLock = () => {
  const { isAuth, isLocked, setLocked } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimers = () => {
    if (!isAuth || isLocked) return;

    // Сбрасываем предупреждение
    setShowWarning(false);
    
    // Очищаем таймеры
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    // Устанавливаем таймер предупреждения
    warningTimerRef.current = setTimeout(() => {
      if (!isLocked && isAuth) {
        setShowWarning(true);
      }
    }, ConstantInfo.inactivityTimeout - ConstantInfo.warningTimeout);

    // Устанавливаем таймер блокировки
    timerRef.current = setTimeout(() => {
      if (!isLocked && isAuth) {
        setLocked(true);
        setShowWarning(false);
      }
    }, ConstantInfo.inactivityTimeout);
  };

  useEffect(() => {
    if (!isAuth || isLocked) return;

    resetTimers();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuth, isLocked]);

  return { showWarning, setShowWarning };
};