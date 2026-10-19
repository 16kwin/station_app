// ModuleBoundary.tsx — граница ошибок вокруг ленивого модуля из lazyModules.ts. Модули грузятся отдельными
// кусками сборки; после выкатки старых кусков на сервере уже нет, может оборваться сеть. Без границы React
// считает сбой загрузки ошибкой отрисовки и размонтирует всё приложение — белый экран, несохранённые карточки
// в соседних вкладках пропадают. Здесь вместо этого — сообщение с кнопкой «Обновить» (раздел или крупный блок)
// или ничего (кнопка, окно): сбой виден в консоли.
import React, { type ReactNode } from 'react';
import { COLORS, FONT } from '../../components/mainPage/shared/layout';

interface ModuleBoundaryProps {
  children: ReactNode;
  /** page — сообщение на месте модуля; silent — ничего не показывать */
  variant: 'page' | 'silent';
}

interface ModuleBoundaryState {
  failed: boolean;
}

class ModuleBoundary extends React.Component<ModuleBoundaryProps, ModuleBoundaryState> {
  state: ModuleBoundaryState = { failed: false };

  static getDerivedStateFromError(): ModuleBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Модуль интерфейса не загрузился:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.variant === 'silent') return null;
    return (
      <div
        role="alert"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          minHeight: 200,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>Не удалось загрузить раздел — обновите страницу</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Если в других вкладках есть несохранённые изменения, сначала запишите их.</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            height: 40,
            padding: '0 22px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: COLORS.accent,
            color: COLORS.white,
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Обновить
        </button>
      </div>
    );
  }
}

export default ModuleBoundary;
