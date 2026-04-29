// components/LockScreen/LockScreen.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import LOGO from '../../assets/LOGO.svg';

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
  const [lockState, setLockState] = useState<'locked' | 'unlocking' | 'shaking'>('locked');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [EyeIcon, setEyeIcon] = useState<string | null>(null);
  const [EyeOffIcon, setEyeOffIcon] = useState<string | null>(null);

  useEffect(() => {
    import('../../assets/Eye.svg').then(m => setEyeIcon(m.default));
    import('../../assets/EyeOff.svg').then(m => setEyeOffIcon(m.default));
  }, []);

  useEffect(() => {
    setShowForm(false);
    setPassword('');
    setError('');
    setHasError(false);
  }, []);

  useEffect(() => {
    if (showForm) {
      setLockState('locked');
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
    setLockState('locked');
    setHasError(false);

    const isValid = await checkPassword(password);
    
    if (isValid) {
      setLockState('unlocking');
      setTimeout(() => {
        setPassword('');
        onUnlock();
      }, 600);
    } else {
      setLockState('shaking');
      setError('Неверный пароль');
      setHasError(true);
      setPassword('');
      setTimeout(() => {
        setLockState('locked');
      }, 500);
    }
    
    setIsLoading(false);
  };

  const isPasswordActive = focusedField || password.length > 0;

  const isButtonActive = password.length > 0;

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
                  ДИНАМИКА:AWMS
                </h1>

                <p
                  className="text-white"
                  style={{
                    fontSize: `${31 * scale}px`,
                    fontWeight: 600,
                    letterSpacing: `${1 * scale}px`,
                    marginTop: `${21 * scale}px`,
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  СИСТЕМА УПРАВЛЕНИЯ АВТОМАТИЧЕСКИМИ СКЛАДАМИ
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all duration-300"
                style={{
                  width: '399px',
                  height: '59px',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
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
                className="bg-white rounded-2xl shadow-2xl flex flex-col items-center relative"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '480px',
                  height: '426px',
                  paddingTop: '30px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'center'
                }}
              >
                {/* Аватар */}
                <div
                  className="bg-[#666EFE] rounded-full flex items-center justify-center"
                  style={{
                    width: '76px',
                    height: '76px',
                  }}
                >
                  <span className="text-white font-bold" style={{ fontSize: '30px' }}>
                    {userInfo.firstName?.charAt(0) || userInfo.name?.charAt(0) || 'U'}
                  </span>
                </div>

                {/* Имя пользователя */}
                <h2
                  className="text-[#2D4059]"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '26px',
                    fontWeight: 600,
                    marginTop: '15px',
                  }}
                >
                  {userInfo.firstName || userInfo.name || 'Пользователь'}
                </h2>

                {/* Подсказка */}
                <p
                  className="text-[#2D4059]"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '19px',
                    fontWeight: 500,
                    marginTop: '5px',
                    opacity: 0.5,
                  }}
                >
                  Введите пароль для разблокировки
                </p>

                {/* Иконка замка */}
                <motion.div
                  className="bg-white rounded-full flex items-center justify-center shadow-md relative"
                  style={{
                    width: '40px',
                    height: '40px',
                    marginTop: '10px',
                  }}
                  animate={lockState}
                  variants={{
                    locked: { x: 0 },
                    shaking: {
                      x: [0, -3, 3, -3, 3, 0],
                      transition: { duration: 0.4 }
                    },
                    unlocking: { x: 0 }
                  }}
                >
                  {/* Закрытый замок */}
                  <motion.svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    className="absolute"
                    animate={lockState}
                    variants={{
                      locked: { opacity: 1 },
                      shaking: { opacity: 1 },
                      unlocking: { opacity: 0 }
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ transform: 'scaleX(-1)' }}
                  >
                    <path d="M8 0C4.8 0 2.1226 1.50344 2.28572 5.25V7.875H1.33333C0.594667 7.875 0 8.40021 0 9.1125V16.7143C0 17.4266 0.594667 18 1.33333 18H14.6667C15.4053 18 16 17.4266 16 16.7143V9.1125C16 8.40021 15.4159 7.875 14.6667 7.875H13.7143V5.25C13.7143 1.5 11.2 0 8 0ZM8 2.25C9.6 2.25 11.4286 2.79084 11.4286 5.25V7.875H4.57143V5.25C4.57143 2.81517 6.4 2.25 8 2.25Z" fill="#2D4059"/>
                  </motion.svg>

                  {/* Открытый замок */}
                  <motion.svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    className="absolute"
                    animate={lockState}
                    variants={{
                      locked: { opacity: 0 },
                      shaking: { opacity: 0 },
                      unlocking: { opacity: 1 }
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ transform: 'scaleX(-1)' }}
                  >
                    <path d="M3.01271 2.1783L4.79983 3.9375C5.33899 2.60031 6.74033 2.25 8 2.25C9.6 2.25 11.4286 2.79084 11.4286 5.25V7.875H4.57143H2.28572H1.33333C0.594667 7.875 0 8.40021 0 9.1125V16.7143C0 17.4266 0.594667 18 1.33333 18H14.6667C15.4053 18 16 17.4266 16 16.7143V9.1125C16 8.40021 15.4159 7.875 14.6667 7.875H13.7143V5.25C13.7143 1.5 11.2 0 8 0C5.88756 0 4.00286 0.655171 3.01271 2.1783Z" fill="#2D4059"/>
                  </motion.svg>
                </motion.div>

                {/* Поле ввода пароля */}
                <div
                  className="relative flex items-center"
                  style={{
                    width: '399px',
                    height: '59px',
                    marginTop: '14px',
                  }}
                >
                  <input
                    className="w-full h-full bg-transparent text-gray-900 focus:outline-none placeholder-gray-400 border border-gray-300 rounded-[10px] focus:border-[#666EFE] transition-colors"
                    style={{
                      fontSize: '16px',
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 400,
                      paddingLeft: '16px',
                      paddingRight: '40px',
                      borderColor: hasError ? '#FF3052' : isPasswordActive ? '#666EFE' : '#D1D5DB',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    placeholder="Введите пароль"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setHasError(false); }}
                    onFocus={() => { setFocusedField(true); setHasError(false); }}
                    onBlur={() => setFocusedField(false)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    {showPassword ? (
                      EyeIcon ? <img src={EyeIcon} alt="show" className="w-6 h-6" /> : <span className="text-gray-400 text-sm">👁</span>
                    ) : (
                      EyeOffIcon ? <img src={EyeOffIcon} alt="hide" className="w-6 h-6" /> : <span className="text-gray-400 text-sm">🙈</span>
                    )}
                  </button>
                </div>

                {/* Ошибка */}
                {error && (
                  <p className="text-[#FF3052] text-sm text-center" style={{ marginTop: '8px' }}>{error}</p>
                )}

                {/* Кнопка */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="text-white rounded-[10px] transition-all font-medium absolute"
                  style={{
                    width: '399px',
                    height: '59px',
                    bottom: '20px',
                    fontSize: '16px',
                    backgroundColor: '#666EFE',
                    opacity: isButtonActive ? 1 : 0.5,
                  }}
                >
                  {isLoading ? 'Проверка...' : 'Разблокировать'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LockScreen;