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

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      channelRef.current?.postMessage({ type: 'lock' });
    }, ConstantInfo.warningTimeout);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show]);

  const handleContinue = () => {
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 90000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 32,
              maxWidth: 448,
              width: '100%',
              margin: '0 16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2D4059', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>Предупреждение</h2>
            <p style={{ color: '#6B7280', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
              Вы скоро будете заблокированы из-за бездействия.
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#666EFE', marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
              Блокировка через {countdown} секунд
            </p>
            <button
              onClick={handleContinue}
              style={{
                width: '100%',
                backgroundColor: '#666EFE',
                color: '#FFFFFF',
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5555dd')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#666EFE')}
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