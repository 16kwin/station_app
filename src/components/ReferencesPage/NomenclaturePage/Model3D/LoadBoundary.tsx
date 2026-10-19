// LoadBoundary.tsx — граница ошибок вокруг ленивых частей 3D-просмотра: окна (CharacteristicsTab) и области
// просмотра с three.js (Model3DPopup). Без неё сбой загрузки куска сборки (после выкатки старых файлов на сервере
// уже нет, оборвалась сеть) React считает ошибкой отрисовки и размонтирует всё приложение — белый экран,
// несохранённая карточка пропадает. Здесь вместо этого — сообщение и кнопка «Обновить».
// Событие Vite «vite:preloadError» не слушаем: оно глобальное и приходит раньше ошибки React.lazy — граница окна
// закрывала бы окно со всей загрузкой при сбое просмотрщика (его ловит inline) и при сбое чужого куска в любой
// вкладке. Ошибку ленивого импорта и так получает ближайшая граница; сбой загрузчика 3MF разбирается в convert.ts.
import React from 'react';
import { motion } from 'framer-motion';
import { AlertIcon } from './icons';
import { COLORS, FONT, SHADOWS } from './theme';
import { ActionButton } from './ui';

const MESSAGE = 'Не удалось загрузить 3D-просмотр — обновите страницу';
const HINT = 'Если в карточке есть несохранённые изменения, сначала закройте окно и запишите их.';

interface Model3DLoadBoundaryProps {
  children: React.ReactNode;
  /** modal — окно ещё не загрузилось, сообщение поверх страницы; inline — внутри области просмотра окна */
  variant: 'modal' | 'inline';
  /** Окно открыто (для modal): Escape закрывает сообщение только у открытого окна, при закрытии граница сбрасывается */
  open?: boolean;
  onClose?: () => void;
}

interface Model3DLoadBoundaryState {
  failed: boolean;
}

class Model3DLoadBoundary extends React.Component<Model3DLoadBoundaryProps, Model3DLoadBoundaryState> {
  state: Model3DLoadBoundaryState = { failed: false };

  private overlay = React.createRef<HTMLDivElement>();

  static getDerivedStateFromError(): Model3DLoadBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('3D-просмотр:', error);
  }

  componentDidMount() {
    if (this.props.variant === 'modal') window.addEventListener('keydown', this.onKey);
  }

  componentDidUpdate(prev: Model3DLoadBoundaryProps) {
    // Окно с сообщением закрыли — следующее открытие начинается заново
    if (prev.open && !this.props.open && this.state.failed) this.setState({ failed: false });
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKey);
  }

  /** Escape — закрыть сообщение; в скрытой вкладке приложения (display: none, прямоугольников нет) — не реагируем */
  private onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.state.failed || !this.props.open) return;
    if (this.overlay.current?.getClientRects().length) this.props.onClose?.();
  };

  private reload = () => window.location.reload();

  render() {
    if (!this.state.failed) return this.props.children;
    const { variant, onClose } = this.props;
    const content = (
      <>
        <AlertIcon size={34} />
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, maxWidth: 420, lineHeight: '21px' }}>{MESSAGE}</div>
        <div style={{ fontSize: 13, color: COLORS.muted, maxWidth: 420, lineHeight: '18px' }}>{HINT}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <ActionButton label="Обновить" variant="primary" height={40} onClick={this.reload} />
          {variant === 'modal' && onClose && <ActionButton label="Закрыть" height={40} onClick={onClose} />}
        </div>
      </>
    );

    if (variant === 'inline') {
      return (
        <motion.div
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 40,
            backgroundColor: 'rgba(251, 252, 255, 0.9)',
            fontFamily: FONT,
            textAlign: 'center',
            zIndex: 4,
          }}
        >
          {content}
        </motion.div>
      );
    }

    // Как остальные окна карточки — position: fixed без портала: вкладка приложения скрыта — скрыто и сообщение
    return (
      <motion.div
        ref={this.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={event => {
          event.stopPropagation();
          onClose?.();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: COLORS.overlay,
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label="3D-модель"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={event => event.stopPropagation()}
          style={{
            width: 480,
            padding: '34px 30px 30px',
            borderRadius: 20,
            backgroundColor: COLORS.white,
            boxShadow: SHADOWS.modal,
            fontFamily: FONT,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {content}
        </motion.div>
      </motion.div>
    );
  }
}

export default Model3DLoadBoundary;
