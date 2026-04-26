// components/loginPage/LoginPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';
import LOGO from '../../assets/LOGO.svg';
import LOGIN_IMAGE from '../../assets/Login.svg';
import Hand from '../../assets/Hand.svg';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Ripple {
  id: number;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshAuth, setLocked } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isStandalone, setIsStandalone] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isYandex, setIsYandex] = useState(false);

  const [scale, setScale] = useState(1);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    setShowForm(false);
    setUsername('');
    setPassword('');
    setMessage('');
  }, []);

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

  useEffect(() => {
    const ua = navigator.userAgent;
    const yandex = /YaBrowser/.test(ua) && !/Chrome/.test(ua);
    setIsYandex(yandex);

    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const installed = localStorage.getItem('pwa_installed') === 'true';
    setIsPwaInstalled(installed);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      localStorage.setItem('pwa_installed', 'true');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

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
        setMessage('Ошибка входа');
      }
    } catch (error) {
      const typeError = error as AxiosError;
      console.log(typeError);
      if (typeError.response?.status === 401) {
        setMessage('Неверные данные для входа');
      } else {
        setMessage(typeError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = 66 * scale;

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
            <div className="w-[1253px] h-[800px] bg-[#FFFFFF] rounded-2xl shadow-xl flex relative overflow-hidden font-roboto">
              <div className="absolute left-[15px] top-[15px] flex items-center gap-[9px]">
                <img src={LOGO} alt="ДИНАМИКА" className="w-[57px] h-[49px]" />
                <div>
                  <h1 className="text-[23px] font-black tracking-[2px] text-gray-900">
                    ДИНАМИКА
                  </h1>
                  <p className="text-[16px] font-medium tracking-[0px] text-gray-600">
                    ПРОМЫШЛЕННЫЕ СИСТЕМЫ
                  </p>
                </div>
              </div>

              <div className="w-[615px] h-full flex flex-col justify-center px-[60px]">
                <h2 className="text-gray-900 font-roboto font-bold text-[40px] leading-[110%] tracking-[-0.04em] mb-2">
                  Вход в аккаунт
                </h2>
                <p className="text-gray-500 text-[16px] mb-8">
                  Войдите в учетную запись для продолжения работы
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label className="block text-gray-700 text-[14px] font-medium mb-2">
                      Логин
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-[16px] placeholder-gray-400 focus:outline-none focus:border-[#666EFE] focus:ring-1 focus:ring-[#666EFE] transition-all"
                      name="username"
                      placeholder="admin"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-gray-700 text-[14px] font-medium mb-2">
                      Пароль
                    </label>
                    <input
                      name="password"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-[16px] placeholder-gray-400 focus:outline-none focus:border-[#666EFE] focus:ring-1 focus:ring-[#666EFE] transition-all"
                      placeholder=""
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center mb-6">
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

                  {message && (
                    <p className="text-red-500 text-sm mb-4">{message}</p>
                  )}

                  <button
                    className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-3 rounded-lg font-medium text-[16px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </button>
                </form>

                {!isStandalone && !isPwaInstalled && (
                  <div className="mt-4 text-center">
                    {isYandex ? (
                      <p className="text-gray-400 text-[14px]">
                        Чтобы установить приложение, нажмите ⋮ → «Установить приложение»
                      </p>
                    ) : (
                      <button
                        onClick={handleInstallPwa}
                        className="text-[#4A90E2] text-[14px] hover:text-[#3A80D2] transition-colors underline cursor-pointer"
                      >
                        Скачать как приложение
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute right-[15px] top-[15px] w-[608px] h-[770px] rounded-2xl overflow-hidden">
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