// components/InactivityWarning/InactivityWarning.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConstantInfo from '../../info/ConstantInfo';

interface InactivityWarningProps {
  show: boolean;
  onClose: () => void;
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({ show, onClose }) => {
  const [countdown, setCountdown] = useState(() => Math.ceil(ConstantInfo.warningTimeout / 1000));
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('app_inactivity_channel');
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!show) {
      setCountdown(Math.ceil(ConstantInfo.warningTimeout / 1000));
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    setCountdown(Math.ceil(ConstantInfo.warningTimeout / 1000));

    // Таймер обратного отсчета
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Таймер автоблокировки
    timeoutRef.current = setTimeout(() => {
      // Отправляем событие блокировки
      channelRef.current?.postMessage({ type: 'lock' });
    }, ConstantInfo.warningTimeout);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show]);

  const handleContinue = () => {
    // Отправляем событие отмены предупреждения
    channelRef.current?.postMessage({ type: 'cancel_warning' });
    onClose();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-[#2D4059] mb-4">Предупреждение</h2>
            <p className="text-gray-600 mb-2">
              Вы скоро будете заблокированы из-за бездействия.
            </p>
            <p className="text-lg font-semibold text-[#666EFE] mb-6">
              Блокировка через {countdown} секунд
            </p>
            <button
              onClick={handleContinue}
              className="w-full bg-[#666EFE] hover:bg-[#5555dd] text-white py-3 rounded-xl transition-colors font-medium"
            >
              Продолжить работу
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InactivityWarning;