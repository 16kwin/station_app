// CameraSettingsCard.tsx — карточка камер вверху страницы: наименование, IP, тип, MAC, строка подключения
// и кнопка «Поток». Поля правятся на месте и сохраняются при уходе из поля или по Enter.
// Правка — функция установки video.cameras: выключена — поля только для чтения (без полей ввода), «Поток» —
// при живом просмотре (video.live). Пароль камеры в строке подключения сервер всегда присылает как «***».
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CameraType, VideoCamera, VideoCameraUpdate } from './types';
import { updateCamera, errorText } from './api';
import { COLORS, FONT, SHADOWS } from './theme';
import { BulletCameraIcon, ChevronDownIcon, DomeCameraIcon } from './icons';
import { ActionButton, RecBadge, Spinner } from './ui';
import { useCanSetupCameras, useCanViewLive } from './access';

/** Положение карточки на холсте 1800×840 */
const CARD = { left: 40, top: 100, width: 1720 } as const;
const ROW_TOP = 30;
const ROW_PITCH = 111;
const INPUT_TOP = 28;
const INPUT_H = 45;

/** Поля строки камеры: положение по горизонтали относительно карточки */
const COLUMNS = {
  icon: { left: 56 },
  name: { left: 161, width: 177, label: 'Наименование камеры:' },
  ip: { left: 381, width: 165, label: 'IP адрес камеры' },
  type: { left: 586, width: 159, label: 'Тип камеры:' },
  mac: { left: 786, width: 175, label: 'MAC адрес камеры:' },
  url: { left: 1009, width: 534, label: 'URL подключения:' },
  stream: { left: 1575, width: 114 },
} as const;

type EditableKey = 'name' | 'ip' | 'mac' | 'rtspUrl';

interface CameraSettingsCardProps {
  cameras: VideoCamera[];
  onUpdated: (camera: VideoCamera) => void;
  onOpenStream: (camera: VideoCamera) => void;
  onMessage: (kind: 'ok' | 'error', text: string) => void;
}

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '17px',
  color: COLORS.text,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const inputStyle = (focused: boolean, invalid: boolean): React.CSSProperties => ({
  width: '100%',
  height: INPUT_H,
  boxSizing: 'border-box',
  padding: '0 16px',
  borderRadius: 10,
  border: `1px solid ${invalid ? COLORS.error : focused ? COLORS.fieldBorderFocus : COLORS.fieldBorder}`,
  boxShadow: focused ? '0 0 0 3px rgba(102, 110, 254, 0.12)' : 'none',
  backgroundColor: COLORS.white,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  color: COLORS.accent,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  textOverflow: 'ellipsis',
});

interface TextFieldProps {
  value: string;
  onCommit: (value: string) => Promise<boolean>;
  placeholder?: string;
  monospace?: boolean;
  ariaLabel: string;
}

/** Поле, которое сохраняется при уходе фокуса. Ошибка сохранения подсвечивает рамку и возвращает прежнее значение */
const TextField: React.FC<TextFieldProps> = ({ value, onCommit, placeholder, monospace, ariaLabel }) => {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  const commit = async () => {
    setFocused(false);
    if (draft.trim() === value.trim()) {
      setDraft(value);
      return;
    }
    setSaving(true);
    const ok = await onCommit(draft.trim());
    setSaving(false);
    setInvalid(!ok);
    if (!ok) {
      setDraft(value);
      window.setTimeout(() => setInvalid(false), 2400);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={draft}
        aria-label={ariaLabel}
        placeholder={placeholder}
        spellCheck={false}
        onChange={event => setDraft(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
          if (event.key === 'Escape') {
            setDraft(value);
            (event.target as HTMLInputElement).blur();
          }
        }}
        style={{ ...inputStyle(focused, invalid), fontFamily: monospace ? "'Inter', sans-serif" : FONT }}
      />
      {saving && (
        <span style={{ position: 'absolute', right: 12, top: (INPUT_H - 14) / 2, display: 'flex' }}>
          <Spinner />
        </span>
      )}
    </div>
  );
};

/** Значение без правки (настройка камер выключена): тот же размер, что у поля, без рамки ввода и курсора */
const ReadOnlyField: React.FC<{ value: string; ariaLabel: string }> = ({ value, ariaLabel }) => (
  <div
    aria-label={ariaLabel}
    title={value || undefined}
    style={{
      ...inputStyle(false, false),
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${COLORS.rowBorder}`,
      backgroundColor: COLORS.pageBg,
      color: value ? COLORS.text : COLORS.placeholder,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</span>
  </div>
);

const CAMERA_TYPE_TITLES: Record<CameraType, string> = { station: 'Станция', overview: 'Обзорная' };

/** Выбор типа камеры — оформлен как поле ввода */
const TypeSelect: React.FC<{ value: CameraType; onCommit: (value: CameraType) => Promise<boolean> }> = ({ value, onCommit }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        aria-label="Тип камеры"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={event => onCommit(event.target.value as CameraType)}
        style={{ ...inputStyle(focused, false), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: 34 }}
      >
        <option value="station">Станция</option>
        <option value="overview">Обзорная</option>
      </select>
      <span style={{ position: 'absolute', right: 14, top: (INPUT_H - 7) / 2, pointerEvents: 'none', display: 'flex' }}>
        <ChevronDownIcon color={COLORS.accent} />
      </span>
    </div>
  );
};

const CameraSettingsCard: React.FC<CameraSettingsCardProps> = ({ cameras, onUpdated, onOpenStream, onMessage }) => {
  const editable = useCanSetupCameras();
  const canStream = useCanViewLive();
  const height = ROW_TOP + Math.max(1, cameras.length) * ROW_PITCH - 9;

  const save = async (camera: VideoCamera, patch: VideoCameraUpdate, fieldTitle: string): Promise<boolean> => {
    try {
      const updated = await updateCamera(camera.id, patch);
      onUpdated(updated);
      onMessage('ok', `${camera.name}: ${fieldTitle} сохранено`);
      return true;
    } catch (error) {
      onMessage('error', errorText(error, `Не удалось сохранить ${fieldTitle.toLowerCase()}`));
      return false;
    }
  };

  const textField = (camera: VideoCamera, key: EditableKey, title: string, placeholder?: string) =>
    editable ? (
      <TextField
        value={(camera[key] as string | null) ?? ''}
        placeholder={placeholder}
        ariaLabel={`${title} ${camera.name}`}
        monospace={key === 'rtspUrl'}
        onCommit={value => save(camera, { [key]: value }, title)}
      />
    ) : (
      <ReadOnlyField value={(camera[key] as string | null) ?? ''} ariaLabel={`${title} ${camera.name}`} />
    );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Камеры"
      style={{
        position: 'absolute',
        left: CARD.left,
        top: CARD.top,
        width: CARD.width,
        height,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        boxShadow: SHADOWS.card,
      }}
    >
      {cameras.length === 0 && (
        <div style={{ ...labelStyle, left: 0, right: 0, top: height / 2 - 10, textAlign: 'center', color: COLORS.muted, fontWeight: 500 }}>
          Камеры не заведены
        </div>
      )}

      {cameras.map((camera, index) => {
        const top = ROW_TOP + index * ROW_PITCH;
        const field = (column: { left: number; width: number; label?: string }, content: React.ReactNode) => (
          <>
            {column.label && <span style={{ ...labelStyle, left: column.left, top }}>{column.label}</span>}
            <div style={{ position: 'absolute', left: column.left, top: top + INPUT_TOP, width: column.width }}>{content}</div>
          </>
        );

        return (
          <React.Fragment key={camera.id}>
            {/* Иконка камеры; во время записи — отметка REC */}
            <div
              style={{ position: 'absolute', left: COLUMNS.icon.left, top: top + INPUT_TOP + INPUT_H / 2 - 32, width: 64, height: 64 }}
              title={camera.cameraType === 'overview' ? 'Обзорная камера' : 'Камера станции'}
            >
              {camera.cameraType === 'overview' ? <BulletCameraIcon /> : <DomeCameraIcon />}
              <AnimatePresence>
                {camera.recording && (
                  <span style={{ position: 'absolute', left: 30, top: -6 }}>
                    <RecBadge compact />
                  </span>
                )}
              </AnimatePresence>
            </div>

            {field(COLUMNS.name, textField(camera, 'name', 'Наименование камеры'))}
            {field(COLUMNS.ip, textField(camera, 'ip', 'IP адрес камеры', '192.168.1.64'))}
            {field(COLUMNS.type, editable ? (
              <TypeSelect value={camera.cameraType} onCommit={value => save(camera, { cameraType: value }, 'Тип камеры')} />
            ) : (
              <ReadOnlyField value={CAMERA_TYPE_TITLES[camera.cameraType] ?? camera.cameraType} ariaLabel={`Тип камеры ${camera.name}`} />
            ))}
            {field(COLUMNS.mac, textField(camera, 'mac', 'MAC адрес камеры', '00:1A:2B:3C:4D:5E'))}
            {field(COLUMNS.url, textField(camera, 'rtspUrl', 'URL подключения', 'rtsp://admin:пароль@192.168.1.64:554/ISAPI/Streaming/Channels/101'))}

            {canStream && (
              <div style={{ position: 'absolute', left: COLUMNS.stream.left, top: top + INPUT_TOP - 2 }}>
                <ActionButton label="Поток" width={COLUMNS.stream.width} height={INPUT_H + 4} onClick={() => onOpenStream(camera)} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </motion.section>
  );
};

export default CameraSettingsCard;
