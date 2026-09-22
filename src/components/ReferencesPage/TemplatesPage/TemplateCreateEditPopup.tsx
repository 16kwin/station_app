// TemplateCreateEditPopup.tsx — ПОЛНЫЙ ФАЙЛ
import React, { useEffect, useState } from 'react';
import FormField from '../../elements/FormField';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import NameIcon from '../../../assets/References/Icon11.svg';
import GroupIcon from '../../../assets/Station/PopupIcon4.svg';
import ModelIcon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import ModelIcon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
import ConfigIcon31 from '../../../assets/References/NomenclatureCreatePage/Icon31.svg';
import ConfigIcon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';

export interface TemplateCreateEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  name: string;
  onNameChange: (v: string) => void;

  categoryUid: string | null;
  categoryName: string;
  onCategoryChange: (uid: string, name: string) => void;
  onOpenCategoryFullList: () => void;

  modelUid: string;
  modelName: string;
  onModelChange: (uid: string, name: string) => void;
  onOpenModelFullList: () => void;
  modelDisabled?: boolean;

  configUid: string;
  configName: string;
  onConfigChange: (uid: string, name: string) => void;
  onOpenConfigFullList: () => void;
  configDisabled?: boolean;

  isSubmitting: boolean;
  mode?: 'create' | 'copy';
}

const POPUP_WIDTH = 481;
const FIELD_WIDTH = 401;
const FIELD_HEIGHT = 44;
const USER_ID = 1;

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  return [];
};

// Рекурсивно уплощаем дерево категорий, чтобы в поиске были ВСЕ категории (и корневые, и вложенные)
const flattenCategories = (nodes: any[]): { uid: string; name: string }[] => {
  const result: { uid: string; name: string }[] = [];
  const walk = (arr: any[]) => {
    arr.forEach((n) => {
      if (n && n.uid && n.name) {
        result.push({ uid: n.uid, name: n.name });
      }
      if (Array.isArray(n?.children) && n.children.length > 0) {
        walk(n.children);
      }
    });
  };
  walk(nodes);
  return result;
};

const TemplateCreateEditPopup: React.FC<TemplateCreateEditPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  name,
  onNameChange,
  categoryUid,
  categoryName,
  onCategoryChange,
  onOpenCategoryFullList,
  modelUid,
  modelName,
  onModelChange,
  onOpenModelFullList,
  modelDisabled = false,
  configUid,
  configName,
  onConfigChange,
  onOpenConfigFullList,
  configDisabled = false,
  isSubmitting,
  mode = 'create',
}) => {
  const [modelOptions, setModelOptions] = useState<{ uid: string; name: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ uid: string; name: string }[]>([]);
  const [configOptions, setConfigOptions] = useState<{ uid: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await AxiosService.get(ConstantInfo.restApiTemplatesTreeWithSettings(USER_ID));
        const tree = res.data?.tree || [];
        if (!cancelled) {
          setCategoryOptions(flattenCategories(tree));
        }
      } catch (e) {
        console.error('Ошибка загрузки дерева категорий шаблонов:', e);
        if (!cancelled) setCategoryOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || modelDisabled) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await AxiosService.get(ConstantInfo.restApiStationModels);
        const list = toArray(res.data);
        if (!cancelled) {
          setModelOptions(list.map((m: any) => ({ uid: m.uid, name: m.name })));
        }
      } catch (e) {
        console.error('Ошибка загрузки моделей станций:', e);
        if (!cancelled) setModelOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, modelDisabled]);

  useEffect(() => {
    if (!isOpen || configDisabled) return;
    let cancelled = false;
    (async () => {
      try {
        const url = modelUid
          ? ConstantInfo.restApiStationConfigurationsByModel(modelUid)
          : ConstantInfo.restApiStationConfigurations;
        const res = await AxiosService.get(url);
        const list = toArray(res.data);
        if (!cancelled) {
          setConfigOptions(list.map((c: any) => ({ uid: c.uid, name: c.name })));
        }
      } catch (e) {
        console.error('Ошибка загрузки конфигураций:', e);
        if (!cancelled) setConfigOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, configDisabled, modelUid]);

  const handleSelectModel = (uid: string, name: string) => {
    onModelChange(uid, name);
    if (configUid) onConfigChange('', '');
  };

  const handleSelectConfig = (uid: string, name: string) => onConfigChange(uid, name);
  const handleSelectCategory = (uid: string, name: string) => onCategoryChange(uid, name);

  const title = mode === 'copy' ? 'Создание копии схемы загрузки' : 'Создание схемы загрузки';

  const requiredFilled =
    name.trim().length > 0 &&
    !!categoryUid &&
    (modelDisabled || !!modelUid) &&
    (configDisabled || !!configUid);

  const canSubmit = requiredFilled && !isSubmitting;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: POPUP_WIDTH,
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 0,
            right: 0,
            height: 21,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#2D4059',
              lineHeight: '21px',
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 30 + 21 + 30,
            left: 40,
            width: FIELD_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
          }}
        >
          <FormField
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            label="Наименование схемы"
            type="input"
            icon={NameIcon}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Введите наименование"
            labelMarginBottom={11}
            iconWidth={18}
            iconHeight={16}
          />

          <FormField
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            label="Группа схем"
            type="select"
            icon={GroupIcon}
            iconActive={GroupIcon}
            value={categoryName}
            active={!!categoryUid}
            placeholder="Выберите группу"
            labelMarginBottom={11}
            selectIconWidth={14.5}
            selectIconHeight={18}
            searchOptions={categoryOptions}
            onSelectOption={handleSelectCategory}
            onOpenFullList={onOpenCategoryFullList}
          />

          <FormField
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            label="Модель"
            type="select"
            icon={modelUid ? ModelIcon32 : ModelIcon31}
            iconActive={ModelIcon32}
            value={modelName}
            active={!!modelUid}
            disabled={modelDisabled}
            placeholder="Выберите модель"
            labelMarginBottom={11}
            selectIconWidth={14.5}
            selectIconHeight={18}
            searchOptions={modelOptions}
            onSelectOption={handleSelectModel}
            onOpenFullList={onOpenModelFullList}
          />

          <FormField
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            label="Конфигурация"
            type="select"
            icon={configUid ? ConfigIcon32 : ConfigIcon31}
            iconActive={ConfigIcon32}
            value={configName}
            active={!!configUid}
            disabled={configDisabled}
            placeholder="Выберите конфигурацию"
            labelMarginBottom={11}
            selectIconWidth={14.5}
            selectIconHeight={18}
            searchOptions={configOptions}
            onSelectOption={handleSelectConfig}
            onOpenFullList={onOpenConfigFullList}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 30 + 21 + 30 + (17 + 11 + FIELD_HEIGHT) * 4 + 30 * 3 + 47,
            right: 40,
            display: 'flex',
            gap: 30,
            alignItems: 'center',
          }}
        >
          <button
            onClick={canSubmit ? onConfirm : undefined}
            disabled={!canSubmit}
            style={{
              width: 113,
              height: 44,
              borderRadius: 10,
              border: 'none',
              backgroundColor: '#666EFE',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: '#FFFFFF',
              opacity: canSubmit ? 1 : 0.5,
              transition: 'opacity 0.15s ease',
            }}
          >
            {isSubmitting ? 'Создание...' : 'Создать'}
          </button>

          <button
            onClick={onClose}
            style={{
              width: 108,
              height: 44,
              borderRadius: 10,
              border: '1px solid rgba(102, 110, 254, 0.15)',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: '#2D4059',
            }}
          >
            Отмена
          </button>
        </div>

        <div
          style={{
            height:
              30 + 21 + 30 + (17 + 11 + FIELD_HEIGHT) * 4 + 30 * 3 + 47 + 44 + 30,
          }}
        />
      </div>
    </div>
  );
};

export default TemplateCreateEditPopup;