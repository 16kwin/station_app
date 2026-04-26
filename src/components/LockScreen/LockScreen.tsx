// components/LockScreen/LockScreen.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { userInfo, checkPassword } = useAuth();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setShowForm(false);
    setPassword('');
    setError('');
  }, []);

  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => {
        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (input) input.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showForm]);

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

  return (
    <div className="w-full h-full overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {!showForm && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <button
                onClick={() => setShowForm(true)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 rounded-2xl text-xl font-medium hover:bg-white/20 transition-all duration-300"
                style={{
                  transform: `scale(${scale})`,
                }}
              >
                Разблокировать
              </button>
            </motion.div>
          )}

          {showForm && (
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
    </div>
  );
};

export default LockScreen;