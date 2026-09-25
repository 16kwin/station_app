// TemplateCreateEditPopup.tsx — ПОЛНЫЙ ФАЙЛ (иконка «Наименование шаблона» как в SupplierMainTab)
import React, { useEffect, useState } from 'react';
import FormField from '../../elements/FormField';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import NameIcon18Gray from '../../../assets/Icons/NameIcons/NameIcon18Gray.svg';
import NameIcon18Blue from '../../../assets/Icons/NameIcons/NameIcon18Blue.svg';
import TemplatesGroupIcon14Blue from '../../../assets/Icons/TemplatesGroupIcons/TemplatesGroupIcon14Blue.svg';
import TemplatesGroupIcon14Gray from '../../../assets/Icons/TemplatesGroupIcons/TemplatesGroupIcon14Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';

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

  const title = mode === 'copy' ? 'Создание копии шаблона загрузки' : 'Создание шаблона загрузки';

  const requiredFilled =
    name.trim().length > 0 &&
    !!categoryUid &&
    (modelDisabled || !!modelUid) &&
    (configDisabled || !!configUid);

  const canSubmit = requiredFilled && !isSubmitting;

  if (!isOpen) return null;

  const TITLE_TOP = 30;
  const TITLE_HEIGHT = 21;
  const GAP_TITLE_TO_FIRST_LABEL = 30;
  const LABEL_H = 17;
  const LABEL_TO_FIELD = 11;
  const FIELD_H = FIELD_HEIGHT;
  const FIELD_W = FIELD_WIDTH;
  const GAP_FIELD_TO_NEXT_LABEL = 30;
  const BLOCK_STEP = LABEL_H + LABEL_TO_FIELD + FIELD_H + GAP_FIELD_TO_NEXT_LABEL;

  const FIRST_LABEL_TOP = TITLE_TOP + TITLE_HEIGHT + GAP_TITLE_TO_FIRST_LABEL;
  const FIELD_TOP_1 = FIRST_LABEL_TOP + LABEL_H + LABEL_TO_FIELD;
  const FIELD_TOP_2 = FIELD_TOP_1 + BLOCK_STEP;
  const FIELD_TOP_3 = FIELD_TOP_2 + BLOCK_STEP;
  const FIELD_TOP_4 = FIELD_TOP_3 + BLOCK_STEP;

  const LAST_FIELD_BOTTOM = FIELD_TOP_4 + FIELD_H;
  const BUTTONS_TOP = LAST_FIELD_BOTTOM + 47;
  const POPUP_HEIGHT = BUTTONS_TOP + 44 + 30;

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
          height: POPUP_HEIGHT,
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            position: 'absolute',
            top: TITLE_TOP,
            left: 0,
            right: 0,
            height: TITLE_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 17,
              fontWeight: 500,
              color: '#2D4059',
              lineHeight: `${TITLE_HEIGHT}px`,
            }}
          >
            {title}
          </span>
        </div>

        {/* Поле 1: Наименование шаблона */}
        <div style={{ position: 'absolute', top: FIELD_TOP_1, left: 40 }}>
          <FormField
            width={FIELD_W}
            height={FIELD_H}
            label="Наименование шаблона"
            type="input"
            icon={NameIcon18Gray}
            iconActive={NameIcon18Blue}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Введите наименование"
            labelMarginBottom={LABEL_TO_FIELD}
            iconWidth={18}
            iconHeight={18}
          />
        </div>

        {/* Поле 2: Группа шаблонов */}
        <div style={{ position: 'absolute', top: FIELD_TOP_2, left: 40 }}>
          <FormField
            width={FIELD_W}
            height={FIELD_H}
            label="Группа шаблонов"
            type="select"
            icon={TemplatesGroupIcon14Gray}
            iconActive={TemplatesGroupIcon14Blue}
            value={categoryName}
            active={!!categoryUid}
            placeholder="Выберите группу"
            labelMarginBottom={LABEL_TO_FIELD}
            selectIconWidth={14}
            selectIconHeight={18}
            searchOptions={categoryOptions}
            onSelectOption={handleSelectCategory}
            onOpenFullList={onOpenCategoryFullList}
          />
        </div>

        {/* Поле 3: Модель станции */}
        <div style={{ position: 'absolute', top: FIELD_TOP_3, left: 40 }}>
          <FormField
            width={FIELD_W}
            height={FIELD_H}
            label="Модель станции"
            type="select"
            icon={StationIcon16Gray}
            iconActive={StationIcon16Blue}
            value={modelName}
            active={!!modelUid}
            disabled={modelDisabled}
            placeholder="Выберите модель"
            labelMarginBottom={LABEL_TO_FIELD}
            selectIconWidth={16}
            selectIconHeight={16}
            searchOptions={modelOptions}
            onSelectOption={handleSelectModel}
            onOpenFullList={onOpenModelFullList}
          />
        </div>

        {/* Поле 4: Конфигурация станции */}
        <div style={{ position: 'absolute', top: FIELD_TOP_4, left: 40 }}>
          <FormField
            width={FIELD_W}
            height={FIELD_H}
            label="Конфигурация станции"
            type="select"
            icon={StationIcon16Gray}
            iconActive={StationIcon16Blue}
            value={configName}
            active={!!configUid}
            disabled={configDisabled}
            placeholder="Выберите конфигурацию"
            labelMarginBottom={LABEL_TO_FIELD}
            selectIconWidth={16}
            selectIconHeight={16}
            searchOptions={configOptions}
            onSelectOption={handleSelectConfig}
            onOpenFullList={onOpenConfigFullList}
          />
        </div>

        {/* Кнопки внизу справа */}
        <div
          style={{
            position: 'absolute',
            top: BUTTONS_TOP,
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
      </div>
    </div>
  );
};

export default TemplateCreateEditPopup;