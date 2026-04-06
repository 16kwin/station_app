// components/LockScreen/LockScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import LOGO from '../../assets/LOGO.svg';
import Hand from '../../assets/Hand.svg';

interface LockScreenProps {
  onUnlock: () => void;
}

interface Ripple {
  id: number;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { userInfo, checkPassword } = useAuth();
  const [scale, setScale] = useState(1);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextIdRef = useRef(0);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowLoginForm(false);
    setPassword('');
    setError('');
  }, []);

  useEffect(() => {
    if (showLoginForm) {
      const timer = setTimeout(() => {
        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (input) input.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showLoginForm]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scaleX = width / 1920;
      const scaleY = height / 1080;
      setScale(Math.min(scaleX, scaleY));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Бесконечная генерация кругов
  useEffect(() => {
    if (!showLoginForm) {
      const interval = setInterval(() => {
        setRipples(prev => [...prev, { id: nextIdRef.current++ }]);
      }, 800);

      // Удаляем старые круги после анимации
      const cleanup = setInterval(() => {
        setRipples(prev => prev.slice(-20));
      }, 2000);

      return () => {
        clearInterval(interval);
        clearInterval(cleanup);
      };
    } else {
      setRipples([]);
    }
  }, [showLoginForm]);

  const handleWakeUp = () => {
    setShowLoginForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const isValid = await checkPassword(password);
    
    if (isValid) {
      setPassword('');
      onUnlock();
    } else {
      setError('Неверный пароль');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  const buttonSize = 66 * scale;

  return (
    <div className="w-full h-full overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {!showLoginForm && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-between"
              style={{ 
                paddingTop: `${200 * scale}px`, 
                paddingBottom: `${120 * scale}px` 
              }}
            >
              <div className="flex flex-col items-center">
                <img 
                  src={LOGO} 
                  alt="logo" 
                  style={{ 
                    width: `${332 * scale}px`, 
                    height: `${287 * scale}px` 
                  }}
                />

                <h1 
                  className="text-white"
                  style={{ 
                    fontSize: `${65 * scale}px`, 
                    fontWeight: 700,
                    letterSpacing: `${3 * scale}px`,
                    marginTop: `${32 * scale}px`,
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  ДИНАМИКА
                </h1>

                <p 
                  className="text-white"
                  style={{ 
                    fontSize: `${32 * scale}px`, 
                    fontWeight: 600,
                    letterSpacing: `${1 * scale}px`,
                    marginTop: `${21 * scale}px`,
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  ПРОМЫШЛЕННЫЕ СИСТЕМЫ
                </p>
              </div>

              {/* Кнопка с бесконечными кругами */}
              <div 
                ref={buttonContainerRef}
                className="relative flex items-center justify-center"
              >
                {/* Рендерим все активные круги */}
                {ripples.map((ripple) => (
                  <div
                    key={ripple.id}
                    className="absolute rounded-full border-2 border-white"
                    style={{
                      width: `${buttonSize}px`,
                      height: `${buttonSize}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      animation: 'rippleExpand 2s linear forwards',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                
                {/* Кнопка */}
                <button
                  onClick={handleWakeUp}
                  className="relative z-10 rounded-full transition-transform duration-300 flex items-center justify-center bg-transparent hover:-translate-y-2"
                  style={{
                    width: `${buttonSize}px`,
                    height: `${buttonSize}px`,
                  }}
                >
                  <img 
                    src={Hand} 
                    alt="hand" 
                    style={{ 
                      width: `${30 * scale}px`, 
                      height: `${30 * scale}px` 
                    }}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {showLoginForm && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center'
                }}
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#666EFE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-white font-bold">
                      {userInfo.firstName?.charAt(0) || userInfo.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D4059]">
                    {userInfo.firstName || userInfo.name || 'Пользователь'}
                  </h2>
                  <p className="text-gray-500 mt-1">Введите пароль для разблокировки</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#666EFE] transition-colors mb-4"
                  />
                  
                  {error && (
                    <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#666EFE] hover:bg-[#5555dd] text-white py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Проверка...' : 'Разблокировать'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LockScreen;