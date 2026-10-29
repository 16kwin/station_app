// components/loginPage/LoginPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';
import type { AxiosError } from 'axios';
import LOGO from '../../assets/LOGO.svg';
import LOGIN_VIDEO from '../../assets/Videos/Login.mp4';
import Hand from '../../assets/Hand.svg';
import Checkbox from '../elements/Checkbox';
import EyeIconSvg from '../../assets/Eye.svg';
import EyeOffIconSvg from '../../assets/EyeOff.svg';
import EyeRedIconSvg from '../../assets/EyeRed.svg';
import EyeOffRedIconSvg from '../../assets/EyeOffRed.svg';
import { loadPublicFeatures } from '../../services/features/publicFeatures';
import ChangePasswordForm from './ChangePasswordForm';
import { offerToSavePassword } from './browserCredentials';
import { parseLoginResponse } from './passwordChange';
import { useViewport } from '../hooks/useViewport';

interface CircleData {
  id: number;
  bornAt: number;
}

/** Через сколько бездействия форма входа возвращается к заставке */
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

/** Смена пароля после входа: логин и пароль, с которым вошли (второй раз его не спрашиваем) */
interface PendingPasswordChange {
  login: string;
  password: string;
}

/** Закрыть на сервере сессию, открытую входом, если пароль так и не сменили: ответ не важен */
const logoutQuietly = () => {
  void AxiosService.post(ConstantInfo.restApiLogout).catch(() => undefined);
};

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
  // Сервер ответил на вход mustChangePassword (B10): вместо приложения — форма смены пароля
  const [passwordChange, setPasswordChange] = useState<PendingPasswordChange | null>(null);
  const passwordChangeRef = useRef(false);

  const [windowSize, setWindowSize] = useState({ width: 1920, height: 960 });
  // Телефон и планшет: экран приветствия и форма по ширине экрана, без видео справа (компьютер — как раньше)
  const viewport = useViewport();
  const compact = viewport !== 'desktop';
  const phone = viewport === 'phone';
  const fieldWidth = compact ? '100%' : '399px';
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setTick] = useState(0);
  const circlesRef = useRef<CircleData[]>([]);
  const nextIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_WIDTH = 1920; const MIN_HEIGHT = 900; const MAX_WIDTH = 1920; const MAX_HEIGHT = 960;

  useEffect(() => {
    const width = window.innerWidth; const height = window.innerHeight;
    let finalWidth = width; let finalHeight = height;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) { finalWidth = MIN_WIDTH; finalHeight = MIN_HEIGHT; }
    if (width > MAX_WIDTH || height > MAX_HEIGHT) { finalWidth = MAX_WIDTH; finalHeight = MAX_HEIGHT; }
    setWindowSize({ width: finalWidth, height: finalHeight });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setUsername('');
    setPassword('');
    setMessage('');
    setHasError(false);
  }, [showForm]);

  useEffect(() => {
    passwordChangeRef.current = passwordChange !== null;
  }, [passwordChange]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (showForm) {
        inactivityTimerRef.current = setTimeout(() => {
          // Ушли со смены пароля — сессию входа не оставляем открытой
          if (passwordChangeRef.current) {
            logoutQuietly();
            setPasswordChange(null);
          }
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
    if (!showForm) {
      const LIFE_DURATION = 6000;
      const SPAWN_DELAY = 2000;

      startTimeRef.current = performance.now();
      lastSpawnTimeRef.current = 0;
      circlesRef.current = [{ id: nextIdRef.current++, bornAt: 0 }];

      const animate = () => {
        const now = performance.now() - startTimeRef.current;
        
        circlesRef.current = circlesRef.current.filter(c => {
          const age = now - c.bornAt;
          return age < LIFE_DURATION;
        });

        if (now - lastSpawnTimeRef.current >= SPAWN_DELAY) {
          lastSpawnTimeRef.current = now;
          circlesRef.current.push({ id: nextIdRef.current++, bornAt: now });
        }

        setTick(prev => prev + 1);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    } else {
      circlesRef.current = [];
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [showForm]);

  const getCircleStyle = (circle: CircleData): React.CSSProperties => {
    const now = performance.now() - startTimeRef.current;
    const age = now - circle.bornAt;

    const LIFE_DURATION = 6000;
    const FADE_IN_END = 2000;
    const GROWTH_END = 4000;

    const START_SIZE = 40;
    const MID_SIZE = 80;
    const FADE_START_SIZE = 120;
    const MAX_SIZE = 160;

    let sizeRatio: number;
    if (age < FADE_IN_END) {
      const p = age / FADE_IN_END;
      sizeRatio = (START_SIZE + (MID_SIZE - START_SIZE) * p) / START_SIZE;
    } else if (age < GROWTH_END) {
      const p = (age - FADE_IN_END) / (GROWTH_END - FADE_IN_END);
      const currentSize = MID_SIZE + (FADE_START_SIZE - MID_SIZE) * p;
      sizeRatio = currentSize / START_SIZE;
    } else {
      const p = (age - GROWTH_END) / (LIFE_DURATION - GROWTH_END);
      const currentSize = FADE_START_SIZE + (MAX_SIZE - FADE_START_SIZE) * p;
      sizeRatio = currentSize / START_SIZE;
    }

    let opacity = 0;
    if (age < FADE_IN_END) {
      opacity = (age / FADE_IN_END) * 0.4;
    } else if (age < GROWTH_END) {
      opacity = 0.4;
    } else if (age < LIFE_DURATION) {
      const fadeOutProgress = (age - GROWTH_END) / (LIFE_DURATION - GROWTH_END);
      opacity = 0.4 * (1 - fadeOutProgress);
    }

    return {
      position: 'absolute' as const,
      width: `${START_SIZE}px`,
      height: `${START_SIZE}px`,
      borderRadius: '50%',
      left: '50%',
      top: '50%',
      transform: `translate(-50%, -50%) scale(${sizeRatio})`,
      background: `radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,${opacity}) 80%, rgba(255,255,255,${opacity}) 100%)`,
      pointerEvents: 'none' as const,
      willChange: 'transform, opacity',
    };
  };

  // Предложить браузеру сохранить пароль — только если установка разрешает passwords (флаг из того же запроса,
  // что у bootstrapPwa; при сбое он выключен). Вход ответа не ждёт: флаг к этому времени почти всегда получен
  const offerToSave = (user: string, pass: string) => {
    void loadPublicFeatures().then(flags => offerToSavePassword(user, pass, flags.passwords));
  };

  const finishLogin = async (user: string, pass: string) => {
    offerToSave(user, pass);
    try {
      localStorage.setItem('app_login_event', Date.now().toString());
    } catch {
      // другие вкладки узнают о входе при своей проверке сессии
    }
    await refreshAuth();
    setLocked(false);
    navigate('/main');
  };

  // «Выйти» со смены пароля или сеанс истёк: сессию входа закрываем, возвращаемся к форме входа
  const cancelPasswordChange = (notice?: string) => {
    logoutQuietly();
    setPasswordChange(null);
    setPassword('');
    setMessage(notice ?? '');
    setHasError(Boolean(notice));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.length || !password.length) return;
    
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
        if (parseLoginResponse(response.data).mustChangePassword) {
          // Пароль выдан администратором: пока он не сменён, остальные API отвечают 403 — приложение не открываем
          setPasswordChange({ login: username, password });
          return;
        }
        await finishLogin(username, password);
      } else {
        setMessage('Не удалось войти: неверный логин или пароль!');
        setHasError(true);
      }
    } catch (error) {
      const typeError = error as AxiosError;
      // Не сам объект ошибки: в нём тело запроса с паролем
      console.warn('Вход не выполнен:', typeError.response?.status ?? typeError.code);
      if (typeError.response?.status === 401) {
        setMessage('Не удалось войти: неверный логин или пароль!');
        setHasError(true);
      } else if (typeError.code === 'ERR_NETWORK' || !typeError.response) {
        setMessage('Внимание! Ошибка на стороне сервиса');
        setHasError(true);
      } else {
        setMessage('Внимание! Ошибка на стороне сервиса');
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonActive = username.length > 0 && password.length > 0;

  const getLegendColor = (field: 'username' | 'password'): string => {
    if (hasError) return '#FF3052';
    if (field === 'username' && (username || focusedField === 'username')) return '#666EFE';
    if (field === 'password' && (password || focusedField === 'password')) return '#666EFE';
    return 'rgba(45, 64, 89, 0.5)';
  };

  const getBorderColor = (field: 'username' | 'password'): string => {
    if (hasError) return '#FF3052';
    if (field === 'username' && (username || focusedField === 'username')) return '#666EFE';
    if (field === 'password' && (password || focusedField === 'password')) return '#666EFE';
    return 'rgba(45, 64, 89, 0.5)';
  };

  const getEyeIcon = (): string => {
    if (hasError) return showPassword ? EyeRedIconSvg : EyeOffRedIconSvg;
    return showPassword ? EyeIconSvg : EyeOffIconSvg;
  };

  const autofillInputStyle: React.CSSProperties = {
    fontSize: '17px', fontWeight: 400, fontFamily: 'Inter, sans-serif',
    border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#2D4059',
    boxShadow: '0 0 0 30px white inset', WebkitBoxShadow: '0 0 0 30px white inset',
    WebkitTextFillColor: '#2D4059', caretColor: '#2D4059',
  };

  if (!isLoaded) return null;

  return (
    <div className="w-full h-dvh relative overflow-auto" style={compact ? undefined : { minWidth: `${windowSize.width}px`, minHeight: `${windowSize.height}px` }}>
      <div className="w-full h-full flex items-center justify-center">
        <div style={compact ? { width: '100%', height: '100%' } : { width: `${windowSize.width}px`, height: `${windowSize.height}px` }} className="relative">
          <style>{`input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus,input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 30px white inset!important;-webkit-text-fill-color:#2D4059!important;transition:background-color 5000s ease-in-out 0s;font-size:17px!important;font-family:Inter,sans-serif!important}`}</style>
          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', paddingTop: compact ? '14vh' : '181px', paddingBottom: compact ? '10vh' : '120px' }}>
                <div className="flex flex-col items-center" style={compact ? { padding: '0 16px', textAlign: 'center' } : undefined}>
                  <img src={LOGO} alt="logo" draggable={false} style={{ width: phone ? '160px' : compact ? '240px' : '322px', height: phone ? '139px' : compact ? '208px' : '279px', pointerEvents: 'none', userSelect: 'none' }} />
                  <div style={{ minHeight: compact ? undefined : '67px', display: 'flex', alignItems: 'center', marginTop: compact ? '18px' : '25px' }}>
                    <h1 style={{ fontSize: phone ? '30px' : compact ? '44px' : '55px', fontWeight: 800, letterSpacing: compact ? '2px' : '3px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF', margin: 0 }}>ДИНАМИКА:AWMS</h1>
                  </div>
                  <div style={{ width: phone ? '260px' : compact ? '420px' : '574px', maxWidth: '100%', height: '2px', marginTop: compact ? '12px' : '15px', background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)' }} />
                  <div style={{ minHeight: compact ? undefined : '36px', display: 'flex', alignItems: 'center', marginTop: compact ? '12px' : '15px' }}>
                    <p style={{ fontSize: phone ? '14px' : compact ? '22px' : '30px', fontWeight: 600, letterSpacing: '1px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF', margin: 0 }}>СИСТЕМА УПРАВЛЕНИЯ АВТОМАТИЧЕСКИМИ СКЛАДАМИ</p>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  {circlesRef.current.map((circle) => (<div key={circle.id} style={getCircleStyle(circle)} />))}
                  <button onClick={() => setShowForm(true)} className="relative z-10 rounded-full transition-transform duration-500 flex items-center justify-center bg-transparent hover:scale-110" style={{ width: '66px', height: '66px' }}>
                    <img src={Hand} alt="hand" draggable={false} style={{ width: '30px', height: '30px', pointerEvents: 'none', userSelect: 'none' }} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: compact ? '16px' : undefined, boxSizing: 'border-box' }}>
                <div style={compact
                  ? { width: '440px', maxWidth: '100%', maxHeight: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', position: 'relative' }
                  : { width: '1250px', height: '800px', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
                  <div style={compact
                    ? { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', position: 'relative', boxSizing: 'border-box' }
                    : { width: '625px', height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', position: 'relative' }}>
                    <img src={LOGO} alt="ДИНАМИКА" draggable={false} style={{ width: '63px', height: '57px', pointerEvents: 'none', userSelect: 'none' }} />
                    <div style={{ height: '25px', display: 'flex', alignItems: 'center', marginTop: '7px' }}>
                      <h1 style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '3.15px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>ДИНАМИКА:AWMS</h1>
                    </div>
                    <div style={{ width: '211px', height: '2px', marginTop: '7px', background: 'linear-gradient(to right, rgba(45,64,89,0) 0%, #2D4059 50%, rgba(45,64,89,0) 100%)' }} />
                    <div style={{ minHeight: '21px', display: 'flex', alignItems: 'center', marginTop: '7px', textAlign: 'center' }}>
                      <p style={{ fontSize: phone ? '12px' : compact ? '14px' : '17px', fontWeight: 600, letterSpacing: '0.17px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>СИСТЕМА УПРАВЛЕНИЯ АВТОМАТИЧЕСКИМИ СКЛАДАМИ</p>
                    </div>
                    {passwordChange ? (
                      <ChangePasswordForm
                        login={passwordChange.login}
                        currentPassword={passwordChange.password}
                        onChanged={newPassword => void finishLogin(passwordChange.login, newPassword)}
                        onCancel={cancelPasswordChange}
                      />
                    ) : (
                      <>
                        <div style={{ marginTop: compact ? '32px' : '75px', width: '100%', paddingLeft: compact ? 0 : '113px' }}>
                          <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
                            <h2 style={{ fontSize: compact ? '24px' : '29px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>Авторизация</h2>
                          </div>
                          <div style={{ minHeight: '24px', display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.16px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0, opacity: 0.5 }}>Войдите в учетную запись для продолжения работы</p>
                          </div>
                        </div>
                        <form ref={formRef} onSubmit={handleSubmit} style={{ marginTop: compact ? '28px' : '36px', width: fieldWidth }}>
                          <div style={{ marginBottom: '30px', position: 'relative' }}>
                            <fieldset style={{ width: fieldWidth, height: '59px', borderColor: getBorderColor('username'), borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid', padding: 0, display: 'flex', alignItems: 'center', margin: 0, position: 'relative', boxSizing: 'border-box' }}
                              onFocus={() => { setFocusedField('username'); setHasError(false); }} onBlur={() => setFocusedField(null)}>
                              <legend style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', width: '48px', height: '21px', lineHeight: '21px', color: getLegendColor('username'), padding: '0 4px', marginLeft: '12px', position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)', backgroundColor: '#FFFFFF' }}>Логин</legend>
                              <input style={{ ...autofillInputStyle, paddingLeft: '16px', paddingRight: '16px', width: '100%', height: '100%', borderRadius: '8px' }}
                                name="username" autoComplete="username" placeholder="Введите логин" type="text" value={username}
                                onChange={(e) => { setUsername(e.target.value); setHasError(false); }} disabled={isLoading} />
                            </fieldset>
                          </div>
                          <div style={{ marginBottom: '20px', position: 'relative' }}>
                            <fieldset style={{ width: fieldWidth, height: '59px', borderColor: getBorderColor('password'), borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid', padding: 0, display: 'flex', alignItems: 'center', margin: 0, position: 'relative', boxSizing: 'border-box' }}
                              onFocus={() => { setFocusedField('password'); setHasError(false); }} onBlur={() => setFocusedField(null)}>
                              <legend style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', width: '57px', height: '21px', lineHeight: '21px', color: getLegendColor('password'), padding: '0 4px', marginLeft: '12px', position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)', backgroundColor: '#FFFFFF' }}>Пароль</legend>
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                                <input style={{ ...autofillInputStyle, paddingLeft: '16px', paddingRight: '8px', flex: 1, height: '100%', borderRadius: '8px' }}
                                  name="password" autoComplete="current-password" placeholder="Введите пароль" type={showPassword ? 'text' : 'password'} value={password}
                                  onChange={(e) => { setPassword(e.target.value); setHasError(false); }} disabled={isLoading} />
                                <motion.button type="button" onClick={() => setShowPassword(!showPassword)} whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}>
                                  <motion.img key={showPassword ? 'eye' : 'eyeoff'} src={getEyeIcon()} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                                    style={{ width: '24px', height: '24px', position: 'absolute' }} />
                                </motion.button>
                              </div>
                            </fieldset>
                          </div>
                          <div style={{ height: '18px', display: 'flex', alignItems: 'center', marginBottom: compact ? '32px' : '47px' }}>
                            <Checkbox checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} size={18} />
                            <span style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#2D4059' }}>Запомнить учетную запись</span>
                          </div>
                          <button type="submit" disabled={!isButtonActive || isLoading}
                            style={{ width: fieldWidth, height: '59px', borderRadius: '10px', border: 'none', backgroundColor: '#666EFE', opacity: isButtonActive ? 1 : 0.5, cursor: isButtonActive ? 'pointer' : 'not-allowed', fontSize: '17px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
                            {isLoading ? 'Вход...' : 'Войти'}
                          </button>
                          {message && <p style={{ fontSize: '15px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#FF3052', marginTop: '8px', textAlign: 'center' }}>{message}</p>}
                        </form>
                      </>
                    )}
                  </div>
                  {!compact && <div style={{ width: '625px', height: '800px', overflow: 'hidden' }}>
                    <video
                      src={LOGIN_VIDEO}
                      autoPlay
                      loop
                      muted
                      playsInline
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                    />
                  </div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;