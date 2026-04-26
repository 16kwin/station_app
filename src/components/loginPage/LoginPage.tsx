// components/loginPage/LoginPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';
import LOGO from '../../assets/LOGO.svg';
import LOGIN_IMAGE from '../../assets/Login.svg';
import Hand from '../../assets/Hand.svg';

interface Ripple {
  id: number;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuth, setLocked } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const skipSplash = searchParams.get('skipSplash') === 'true';
  const [showForm, setShowForm] = useState(skipSplash);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  const [scale, setScale] = useState(1);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextIdRef = useRef(0);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

  const [EyeIcon, setEyeIcon] = useState<string | null>(null);
  const [EyeOffIcon, setEyeOffIcon] = useState<string | null>(null);

  useEffect(() => {
    import('../../assets/Eye.svg').then(m => setEyeIcon(m.default));
    import('../../assets/EyeOff.svg').then(m => setEyeOffIcon(m.default));
  }, []);

  useEffect(() => {
    setUsername('');
    setPassword('');
    setMessage('');
    setHasError(false);
  }, [showForm]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (showForm) {
        inactivityTimerRef.current = setTimeout(() => {
          setShowForm(false);
        }, INACTIVITY_TIMEOUT);
      }
    };

    resetInactivityTimer();

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => document.addEventListener(event, resetInactivityTimer));

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => document.removeEventListener(event, resetInactivityTimer));
    };
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

  useEffect(() => {
    if (!showForm) {
      const interval = setInterval(() => {
        setRipples(prev => [...prev, { id: nextIdRef.current++ }]);
      }, 800);

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
  }, [showForm]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);
    setMessage('');

    try {
      const newCsrf = await AxiosService.get('/csrf');
      const csrfToken = newCsrf.data.token;
      AxiosService.defaults.headers['X-XSRF-TOKEN'] = csrfToken;

      const response = await AxiosService.post(ConstantInfo.restApiLogin, {
        username,
        password,
      });

      if (response.status === 200) {
        await refreshAuth();
        setLocked(false);
        navigate('/main');
      } else {
        setMessage('Логин или пароль введены неправильно, введите заново');
        setHasError(true);
      }
    } catch (error) {
      const typeError = error as AxiosError;
      console.log(typeError);
      if (typeError.response?.status === 401) {
        setMessage('Логин или пароль введены неправильно, введите заново');
        setHasError(true);
      } else {
        setMessage(typeError.message);
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldActive = (field: 'username' | 'password'): boolean => {
    return focusedField === field || (field === 'username' && username.length > 0) || (field === 'password' && password.length > 0);
  };

  const getLegendStyle = (field: 'username' | 'password'): React.CSSProperties => {
    const width = field === 'username' ? '48px' : '57px';
    return {
      fontSize: '14px',
      fontWeight: 500,
      fontFamily: 'Roboto, sans-serif',
      width: width,
      height: '21px',
      lineHeight: '21px',
      color: hasError ? '#FF3052' : isFieldActive(field) ? '#666EFE' : 'rgba(45, 64, 89, 0.5)',
      padding: '0 4px',
      marginLeft: '12px',
      position: 'absolute',
      top: 0,
      left: 0,
      transform: 'translateY(-50%)',
      backgroundColor: '#FFFFFF',
    };
  };

  const getFieldsetStyle = (field: 'username' | 'password'): React.CSSProperties => {
    return {
      width: '399px',
      height: '59px',
      borderColor: hasError ? '#FF3052' : isFieldActive(field) ? '#666EFE' : '#D1D5DB',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      margin: 0,
      position: 'relative',
      boxSizing: 'border-box',
    };
  };

  const buttonSize = 66 * scale;
  const isButtonActive = username.length > 0 && password.length > 0;

  return (
    <div className="w-full h-screen overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <AnimatePresence mode="wait">
        {!showForm ? (
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

            <div className="relative flex items-center justify-center">
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

              <button
                onClick={() => setShowForm(true)}
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
                    height: `${30 * scale}px`,
                  }}
                />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-screen items-center justify-center"
          >
            <div className="w-[1250px] h-[800px] bg-[#FFFFFF] rounded-[15px] shadow-xl flex relative overflow-hidden font-roboto">
              {/* Левая часть */}
              <div className="w-[600px] h-full flex flex-col" style={{ paddingTop: '40px' }}>
                {/* Логотип */}
                <div className="flex justify-center">
                  <img src={LOGO} alt="ДИНАМИКА" className="w-[68px] h-[58px]" />
                </div>

                {/* Название */}
                <h1
                  className="text-gray-900 font-roboto text-center"
                  style={{
                    fontSize: '21px',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    marginTop: '5px',
                    width: '216px',
                    height: '25px',
                    lineHeight: '25px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  ДИНАМИКА:AWMS
                </h1>

                {/* Подзаголовок */}
                <p
                  className="text-gray-600 font-roboto text-center whitespace-nowrap"
                  style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    letterSpacing: '1px',
                    marginTop: '30px',
                  }}
                >
                  СИСТЕМА УПРАВЛЕНИЯ АВТОМАТИЧЕСКИМИ СКЛАДАМИ
                </p>

                {/* Заголовок формы */}
                <h2
                  className="text-gray-900 font-roboto"
                  style={{
                    fontSize: '30px',
                    fontWeight: 700,
                    marginTop: '50px',
                    marginLeft: '113px',
                  }}
                >
                  Вход в аккаунт
                </h2>

                {/* Подзаголовок формы */}
                <p
                  className="text-[#2D4059] font-roboto whitespace-nowrap"
                  style={{
                    fontSize: '18px',
                    fontWeight: 400,
                    opacity: 0.5,
                    marginTop: '10px',
                    marginLeft: '113px',
                  }}
                >
                  Войдите в учетную запись для продолжения работы
                </p>

                {/* Форма входа */}
                <form onSubmit={handleSubmit} style={{ marginTop: '36px', marginLeft: '113px', marginRight: '113px' }}>
                  {/* Поле Логин */}
                  <div className="mb-[30px]">
                    <fieldset
                      style={getFieldsetStyle('username')}
                      onFocus={() => { setFocusedField('username'); setHasError(false); }}
                      onBlur={() => setFocusedField(null)}
                    >
                      <legend style={getLegendStyle('username')}>Логин</legend>
                      <input
                        className="w-full bg-transparent text-gray-900 focus:outline-none placeholder-gray-400"
                        style={{
                          fontSize: '16px',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          paddingLeft: '16px',
                          paddingRight: '16px',
                        }}
                        name="username"
                        placeholder="Введите логин"
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setHasError(false); }}
                        disabled={isLoading}
                      />
                    </fieldset>
                  </div>

                  {/* Поле Пароль */}
                  <div className="mb-[25px]">
                    <fieldset
                      style={getFieldsetStyle('password')}
                      onFocus={() => { setFocusedField('password'); setHasError(false); }}
                      onBlur={() => setFocusedField(null)}
                    >
                      <legend style={getLegendStyle('password')}>Пароль</legend>
                      <input
                        className="w-full bg-transparent text-gray-900 focus:outline-none placeholder-gray-400"
                        style={{
                          fontSize: '16px',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          paddingLeft: '16px',
                          paddingRight: '40px',
                        }}
                        name="password"
                        placeholder="Введите пароль"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setHasError(false); }}
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
                    </fieldset>
                  </div>

                  {/* Запомнить учетную запись */}
                  <div className="flex items-center" style={{ marginBottom: '50px' }}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#666EFE] focus:ring-[#666EFE]"
                      />
                      <span className="ml-2 text-gray-700 text-[14px]">
                        Запомнить учетную запись
                      </span>
                    </label>
                  </div>

                  {/* Кнопка Войти */}
                  <button
                    className="w-full text-white rounded-lg font-medium text-[16px] transition-all"
                    style={{
                      width: '399px',
                      height: '59px',
                      backgroundColor: '#666EFE',
                      opacity: isButtonActive ? 1 : 0.5,
                    }}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </button>

                  {/* Сообщение об ошибке */}
                  {message && (
                    <p
                      className="text-[#FF3052] font-roboto whitespace-nowrap"
                      style={{
                        fontSize: '14px',
                        fontWeight: 400,
                        marginTop: '8px',
                        textAlign: 'center',
                      }}
                    >
                      {message}
                    </p>
                  )}
                </form>
              </div>

              {/* Правая часть - картинка */}
              <div className="absolute right-0 top-0 w-[650px] h-full overflow-hidden rounded-r-[15px]">
                <img src={LOGIN_IMAGE} alt="Login" className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default LoginPage;