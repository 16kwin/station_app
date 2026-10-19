// UploadPlanDialog.tsx — загрузка, замена и удаление картинки плана цеха: выбор файла или перетаскивание,
// предпросмотр с размерами, проверка формата (PNG, JPEG, WebP), размера (до 20 МБ) и сторон (до 8192 px).
import React, { useEffect, useRef, useState } from 'react';
import type { PlanImage } from './types';
import { COLORS, FONT } from './theme';
import { ImageIcon, TrashIcon, UploadPlanIcon } from './icons';
import { Modal, PillButton } from './ui';
import { errorText } from './api';

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 8192;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const EXTENSIONS = /\.(png|jpe?g|webp)$/i;

interface UploadPlanDialogProps {
  isOpen: boolean;
  workshopName: string;
  current: PlanImage | null;
  /** На автоматической схеме уже есть сохранённая расстановка — она будет сброшена */
  hasSchemePositions: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress: (share: number) => void) => Promise<unknown>;
  onDelete: () => void;
}

interface Picked {
  file: File;
  preview: string;
  width: number;
  height: number;
}

const megabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1).replace('.', ',')} МБ`;

/** Размеры картинки — из браузера, до отправки на сервер */
const readSize = (url: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Не удалось открыть картинку'));
    img.src = url;
  });

const UploadPlanDialog: React.FC<UploadPlanDialogProps> = ({ isOpen, workshopName, current, hasSchemePositions, onClose, onUpload, onDelete }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  // Предпросмотр освобождается при смене файла и закрытии окна
  const preview = picked?.preview ?? null;
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const reset = () => {
    setPicked(null);
    setError(null);
    setProgress(null);
    setDragOver(false);
  };

  const close = () => {
    if (progress !== null) return;
    reset();
    onClose();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type) && !EXTENSIONS.test(file.name)) {
      setError('Поддерживаются только PNG, JPEG и WebP');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Файл ${megabytes(file.size)} — больше 20 МБ`);
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const size = await readSize(url);
      if (size.width > MAX_SIDE || size.height > MAX_SIDE) {
        URL.revokeObjectURL(url);
        setError(`Картинка ${size.width}×${size.height} px — больше ${MAX_SIDE} px по стороне`);
        return;
      }
      setPicked({ file, preview: url, ...size });
    } catch {
      URL.revokeObjectURL(url);
      setError('Не удалось открыть картинку — файл повреждён');
    }
  };

  const submit = async () => {
    if (!picked || progress !== null) return;
    setProgress(0);
    try {
      await onUpload(picked.file, share => setProgress(share));
      reset();
      onClose();
    } catch (e) {
      setProgress(null);
      setError(errorText(e, 'Не удалось загрузить план'));
    }
  };

  const ratioChanged =
    current && picked ? Math.abs(current.width / current.height - picked.width / picked.height) > 0.01 : false;

  const note = current
    ? ratioChanged
      ? 'Пропорции нового плана отличаются от текущего — проверьте расстановку станций после замены.'
      : 'Станции останутся на своих местах: позиции хранятся в долях плана.'
    : hasSchemePositions
      ? 'Расстановка на автоматической схеме будет сброшена — станции нужно будет разместить на плане.'
      : 'После загрузки разместите станции на плане в режиме правки.';

  return (
    <Modal isOpen={isOpen} onClose={close} width={600} title={current ? `Заменить план · ${workshopName}` : `Загрузить план · ${workshopName}`}>
      <div style={{ padding: '18px 40px 0', fontFamily: FONT }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
          style={{
            height: 270,
            borderRadius: 14,
            border: `2px dashed ${dragOver ? COLORS.accent : '#D5DCE8'}`,
            backgroundColor: dragOver ? 'rgba(102, 110, 254, 0.05)' : COLORS.canvas,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            outline: 'none',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
        >
          {picked ? (
            <img src={picked.preview} alt="Предпросмотр плана" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: COLORS.muted, fontSize: 14 }}>
              <ImageIcon size={40} color={COLORS.faint} strokeWidth={1.6} />
              <span style={{ color: COLORS.text, fontWeight: 500 }}>Перетащите картинку сюда или нажмите, чтобы выбрать</span>
              <span style={{ fontSize: 12 }}>PNG, JPEG или WebP · до 20 МБ · до 8192 px по стороне</span>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={e => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div style={{ minHeight: 40, marginTop: 12, fontSize: 13, lineHeight: '19px' }}>
          {picked && (
            <div style={{ color: COLORS.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {picked.file.name} · {picked.width}×{picked.height} px · {megabytes(picked.file.size)}
            </div>
          )}
          {error ? <div style={{ color: COLORS.error }}>{error}</div> : <div style={{ color: COLORS.muted }}>{note}</div>}
          {progress !== null && (
            <div style={{ height: 6, borderRadius: 3, backgroundColor: COLORS.track, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: COLORS.accent, transition: 'width 0.2s ease' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 40px 28px' }}>
        {current && (
          <PillButton
            label="Удалить план"
            variant="danger"
            icon={<TrashIcon size={16} color={COLORS.error} />}
            onClick={() => {
              reset();
              onDelete();
            }}
            disabled={progress !== null}
          />
        )}
        <span style={{ flex: 1 }} />
        <PillButton label="Отмена" onClick={close} disabled={progress !== null} />
        <PillButton
          label={progress !== null ? `Загрузка ${Math.round(progress * 100)}%` : current ? 'Заменить' : 'Загрузить'}
          variant="primary"
          icon={<UploadPlanIcon size={16} color={COLORS.white} />}
          onClick={submit}
          disabled={!picked}
          busy={progress !== null}
        />
      </div>
    </Modal>
  );
};

export default UploadPlanDialog;
