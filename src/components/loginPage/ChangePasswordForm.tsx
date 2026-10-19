// ChangePasswordForm.tsx — форма обязательной смены пароля при первом входе (B10, раздел 6.7 проекта
// «Дискретное отключение функций»). Показывается в карточке входа вместо формы «Авторизация», когда сервер
// ответил на вход признаком mustChangePassword. Пока пароль не сменён, остальные API отвечают 403, поэтому
// приложение не открывается: «Сменить пароль и войти» или «Выйти».
// Пароль, с которым только что вошли, форма получает от страницы входа и второй раз не спрашивает; без него
// (повторное открытие сессии, где смена ещё не выполнена) показывает поле «Текущий пароль».
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AxiosService from '../../services/AxiosService';
import EyeIconSvg from '../../assets/Eye.svg';
import EyeOffIconSvg from '../../assets/EyeOff.svg';
import EyeRedIconSvg from '../../assets/EyeRed.svg';
import EyeOffRedIconSvg from '../../assets/EyeOffRed.svg';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_PROBLEM_TEXT,
  changePassword,
  checkNewPassword,
  type PasswordHttp,
} from './passwordChange';

const TEXT = '#2D4059';
const ACCENT = '#666EFE';
const ERROR = '#FF3052';
const IDLE = 'rgba(45, 64, 89, 0.5)';
const FONT = 'Inter, sans-serif';

type FieldName = 'current' | 'next' | 'repeat';

interface Props {
  /** Логин вошедшего пользователя: для менеджера паролей и подписи формы */
  login: string;
  /** Пароль, с которым только что вошли; не задан — форма спрашивает текущий пароль */
  currentPassword?: string;
  /** Клиент API; по умолчанию AxiosService */
  http?: PasswordHttp;
  /** Пароль сменён: страница входа продолжает вход с новым паролем */
  onChanged: (newPassword: string) => void;
  /** «Выйти» или сеанс истёк: вернуться к форме входа (message — что показать там) */
  onCancel: (message?: string) => void;
}

const inputStyle: React.CSSProperties = {
  fontSize: '17px', fontWeight: 400, fontFamily: FONT,
  border: 'none', outline: 'none', backgroundColor: 'transparent', color: TEXT,
  boxShadow: '0 0 0 30px white inset', WebkitBoxShadow: '0 0 0 30px white inset',
  WebkitTextFillColor: TEXT, caretColor: TEXT,
  paddingLeft: '16px', paddingRight: '8px', flex: 1, height: '100%', borderRadius: '8px',
};

const ChangePasswordForm: React.FC<Props> = ({ login, currentPassword, http = AxiosService, onChanged, onCancel }) => {
  const askCurrent = currentPassword === undefined;
  const [values, setValues] = useState<Record<FieldName, string>>({ current: '', next: '', repeat: '' });
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const current = askCurrent ? values.current : currentPassword;
  const isButtonActive = (!askCurrent || values.current.length > 0) && values.next.length > 0 && values.repeat.length > 0;

  const setValue = (name: FieldName, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setHasError(false);
    setMessage('');
  };

  const color = (name: FieldName): string => {
    if (hasError) return ERROR;
    return values[name] || focused === name ? ACCENT : IDLE;
  };

  const eyeIcon = hasError ? (showPassword ? EyeRedIconSvg : EyeOffRedIconSvg) : showPassword ? EyeIconSvg : EyeOffIconSvg;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();
    if (!isButtonActive || isLoading) return;
    const problem = checkNewPassword(current, values.next, values.repeat);
    if (problem) {
      setMessage(PASSWORD_PROBLEM_TEXT[problem]);
      setHasError(true);
      return;
    }
    setIsLoading(true);
    const result = await changePassword(http, { currentPassword: current, newPassword: values.next });
    setIsLoading(false);
    if (result.ok) {
      onChanged(values.next);
      return;
    }
    if (result.reason === 'session') {
      onCancel(result.message);
      return;
    }
    setMessage(result.message);
    setHasError(true);
  };

  const field = (name: FieldName, legend: string, placeholder: string, autoComplete: string, withEye: boolean, autoFocus: boolean) => (
    <div style={{ marginBottom: '26px', position: 'relative' }}>
      <fieldset
        style={{ width: '399px', height: '59px', borderColor: color(name), borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid', padding: 0, display: 'flex', alignItems: 'center', margin: 0, position: 'relative', boxSizing: 'border-box' }}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
      >
        <legend style={{ fontSize: '14px', fontWeight: 600, fontFamily: FONT, whiteSpace: 'nowrap', height: '21px', lineHeight: '21px', color: color(name), padding: '0 4px', marginLeft: '12px', position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)', backgroundColor: '#FFFFFF' }}>
          {legend}
        </legend>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
          <input
            style={{ ...inputStyle, paddingRight: withEye ? '8px' : '16px' }}
            name={name === 'current' ? 'current-password' : name === 'next' ? 'new-password' : 'new-password-repeat'}
            autoComplete={autoComplete}
            placeholder={placeholder}
            type={showPassword ? 'text' : 'password'}
            value={values[name]}
            onChange={e => setValue(name, e.target.value)}
            disabled={isLoading}
            autoFocus={autoFocus}
          />
          {withEye && (
            <motion.button
              type="button"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              onClick={() => setShowPassword(!showPassword)}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}
            >
              <motion.img key={showPassword ? 'eye' : 'eyeoff'} src={eyeIcon} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} style={{ width: '24px', height: '24px', position: 'absolute' }} />
            </motion.button>
          )}
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      <div style={{ marginTop: '75px', width: '100%', paddingLeft: '113px' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: '29px', fontWeight: 600, fontFamily: FONT, color: TEXT, margin: 0 }}>Смена пароля</h2>
        </div>
        <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginTop: '8px' }}>
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.16px', fontFamily: FONT, color: TEXT, margin: 0, opacity: 0.5 }}>
            Задайте новый пароль для продолжения работы
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ marginTop: '28px', width: '399px' }}>
        {/* Логин — для менеджера паролей браузера: новый пароль запоминается к нужной учётной записи */}
        <input type="text" name="username" autoComplete="username" value={login} readOnly hidden />
        <p style={{ fontSize: '15px', fontWeight: 500, fontFamily: FONT, color: TEXT, margin: '0 0 22px' }}>
          <span style={{ opacity: 0.5 }}>Учётная запись: </span>
          {login}
        </p>
        {askCurrent && field('current', 'Текущий пароль', 'Введите текущий пароль', 'current-password', false, true)}
        {field('next', 'Новый пароль', 'Введите новый пароль', 'new-password', true, !askCurrent)}
        {field('repeat', 'Повторите пароль', 'Введите новый пароль ещё раз', 'new-password', false, false)}
        <p style={{ fontSize: '14px', fontWeight: 500, fontFamily: FONT, color: TEXT, opacity: 0.5, margin: '-12px 0 28px' }}>
          Не короче {MIN_PASSWORD_LENGTH} символов и не совпадает с текущим
        </p>
        <button
          type="submit"
          disabled={!isButtonActive || isLoading}
          style={{ width: '399px', height: '59px', borderRadius: '10px', border: 'none', backgroundColor: ACCENT, opacity: isButtonActive ? 1 : 0.5, cursor: isButtonActive ? 'pointer' : 'not-allowed', fontSize: '17px', fontWeight: 600, fontFamily: FONT, color: '#FFFFFF' }}
        >
          {isLoading ? 'Сохранение...' : 'Сменить пароль и войти'}
        </button>
        {message && <p style={{ fontSize: '15px', fontWeight: 500, fontFamily: FONT, color: ERROR, margin: '8px 0 0', textAlign: 'center' }}>{message}</p>}
        <button
          type="button"
          onClick={() => onCancel()}
          disabled={isLoading}
          style={{ width: '399px', height: '40px', marginTop: '6px', border: 'none', background: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 500, fontFamily: FONT, color: TEXT, opacity: 0.6 }}
        >
          Выйти
        </button>
      </form>
    </>
  );
};

export default ChangePasswordForm;
