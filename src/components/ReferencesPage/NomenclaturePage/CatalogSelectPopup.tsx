// components/ReferencesPage/NomenclaturePage/CatalogSelectPopup.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CreateGroupPopup from './CreateGroupPopup';
import Icon1 from '../../../assets/References/Icon1.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';

export interface Column {
  key: string;
  title: string;
  left?: number;
}

export interface TreeItem {
  id: string;
  name: string;
  children?: TreeItem[];
  [key: string]: any;
}

export type PopupType = 
  | 'catalog'
  | 'accountingGroup'
  | 'nomenclatureGroup'
  | 'nomenclatureType'
  | 'unit'
  | 'manufacturer'
  | 'brand'
  | 'model'
  | 'country';

interface PopupConfig {
  title: string;
  columns: Column[];
}

const getPopupConfig = (type: PopupType): PopupConfig => {
  switch (type) {
    case 'catalog':
      return {
        title: 'Справочник: Номенклатура (выбор каталога)',
        columns: [{ key: 'groupCode', title: 'КОД ГРУППЫ', left: 500 }],
      };
    case 'accountingGroup':
      return {
        title: 'Справочник: Группы учета (Выбор)',
        columns: [{ key: 'description', title: 'ОПИСАНИЕ', left: 500 }],
      };
    case 'nomenclatureGroup':
      return {
        title: 'Справочник: Группы номенклатуры (Выбор)',
        columns: [{ key: 'accountingGroup', title: 'ГРУППА УЧЕТА', left: 500 }],
      };
    case 'nomenclatureType':
      return {
        title: 'Справочник: Виды номенклатуры (Выбор)',
        columns: [{ key: 'nomenclatureGroup', title: 'ГРУППЫ НОМЕНКЛАТУРЫ', left: 500 }],
      };
    case 'unit':
      return {
        title: 'Справочник: Единицы измерения (Выбор)',
        columns: [{ key: 'description', title: 'ОПИСАНИЕ', left: 500 }],
      };
    case 'manufacturer':
      return {
        title: 'Справочник: Производители (Выбор)',
        columns: [{ key: 'description', title: 'ОПИСАНИЕ', left: 500 }],
      };
    case 'brand':
      return {
        title: 'Справочник: Бренды (Выбор)',
        columns: [{ key: 'manufacturer', title: 'ПРОИЗВОДИТЕЛЬ', left: 500 }],
      };
    case 'model':
      return {
        title: 'Справочник: Модели (Выбор)',
        columns: [
          { key: 'brand', title: 'БРЕНД', left: 500 },
          { key: 'manufacturer', title: 'ПРОИЗВОДИТЕЛЬ', left: 700 },
        ],
      };
    case 'country':
      return {
        title: 'Справочник: Страны (Выбор)',
        columns: [],
      };
    default:
      return { title: '', columns: [] };
  }
};

interface BackendGroup {
  uid: string;
  name: string;
  children: BackendGroup[];
  materials: any[];
}

const getStaticData = (type: PopupType): TreeItem[] => {
  switch (type) {
    case 'accountingGroup':
      return [
        { id: '1', name: 'Основные средства', description: 'ОС' },
        { id: '2', name: 'Материалы', description: 'Мат' },
        { id: '3', name: 'Инструменты', description: 'Инс' },
        { id: '4', name: 'Запчасти', description: 'З/ч' },
        { id: '5', name: 'Расходные материалы', description: 'Расх' },
      ];
    case 'nomenclatureGroup':
      return [
        { id: '1', name: 'Крепёж', accountingGroup: 'Материалы' },
        { id: '2', name: 'Подшипники', accountingGroup: 'Запчасти' },
        { id: '3', name: 'Ремни', accountingGroup: 'Запчасти' },
        { id: '4', name: 'Смазки', accountingGroup: 'Расходные материалы' },
        { id: '5', name: 'Электрика', accountingGroup: 'Запчасти' },
        { id: '6', name: 'Уплотнения', accountingGroup: 'Материалы' },
      ];
    case 'nomenclatureType':
      return [
        { id: '1', name: 'Болт', nomenclatureGroup: 'Крепёж' },
        { id: '2', name: 'Гайка', nomenclatureGroup: 'Крепёж' },
        { id: '3', name: 'Шариковый', nomenclatureGroup: 'Подшипники' },
        { id: '4', name: 'Роликовый', nomenclatureGroup: 'Подшипники' },
        { id: '5', name: 'Клиновой', nomenclatureGroup: 'Ремни' },
        { id: '6', name: 'Зубчатый', nomenclatureGroup: 'Ремни' },
        { id: '7', name: 'Масло', nomenclatureGroup: 'Смазки' },
      ];
    case 'unit':
      return [
        { id: '1', name: 'мм', description: 'Миллиметр' },
        { id: '2', name: 'см', description: 'Сантиметр' },
        { id: '3', name: 'м', description: 'Метр' },
        { id: '4', name: 'шт', description: 'Штука' },
        { id: '5', name: 'кг', description: 'Килограмм' },
        { id: '6', name: 'л', description: 'Литр' },
        { id: '7', name: 'компл', description: 'Комплект' },
      ];
    case 'manufacturer':
      return [
        { id: '1', name: 'ООО "СтанкоДеталь"', description: 'Производство оснастки' },
        { id: '2', name: 'АО "ПромТех"', description: 'Промышленное оборудование' },
        { id: '3', name: 'ИП Иванов', description: 'Метизы' },
        { id: '4', name: 'ООО "СмазТех"', description: 'Смазочные материалы' },
        { id: '5', name: 'АО "ЭлектроПром"', description: 'Электрооборудование' },
      ];
    case 'brand':
      return [
        { id: '1', name: 'SKF', manufacturer: 'SKF Group' },
        { id: '2', name: 'FAG', manufacturer: 'Schaeffler' },
        { id: '3', name: 'NSK', manufacturer: 'NSK Ltd' },
        { id: '4', name: 'Gates', manufacturer: 'Gates Corp' },
        { id: '5', name: 'Mobil', manufacturer: 'ExxonMobil' },
        { id: '6', name: 'Shell', manufacturer: 'Shell PLC' },
      ];
    case 'model':
      return [
        { id: '1', name: '6204-2RS', brand: 'SKF', manufacturer: 'SKF Group' },
        { id: '2', name: '6205-C3', brand: 'FAG', manufacturer: 'Schaeffler' },
        { id: '3', name: '6306-ZZ', brand: 'NSK', manufacturer: 'NSK Ltd' },
        { id: '4', name: 'A-1000', brand: 'Gates', manufacturer: 'Gates Corp' },
        { id: '5', name: 'Mobilux EP2', brand: 'Mobil', manufacturer: 'ExxonMobil' },
      ];
    case 'country':
      return [
        { id: '1', name: 'Россия' },
        { id: '2', name: 'Германия' },
        { id: '3', name: 'Япония' },
        { id: '4', name: 'США' },
        { id: '5', name: 'Китай' },
        { id: '6', name: 'Италия' },
        { id: '7', name: 'Франция' },
      ];
    default:
      return [];
  }
};

const convertBackendTree = (backendGroups: BackendGroup[]): TreeItem[] => {
  return backendGroups.map(g => ({
    id: g.uid,
    name: g.name,
    groupCode: '',
    children: g.children && g.children.length > 0 ? convertBackendTree(g.children) : undefined,
  }));
};

const flattenGroups = (items: TreeItem[]): { uid: string; name: string }[] => {
  let result: { uid: string; name: string }[] = [];
  items.forEach(item => {
    result.push({ uid: item.id, name: item.name });
    if (item.children) result = result.concat(flattenGroups(item.children));
  });
  return result;
};

interface CatalogSelectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (id: string, name: string) => void;
  popupType: PopupType;
}

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 58;
const VISIBLE_ROWS = 7;
const TABLE_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS + HEADER_HEIGHT + 4;

const CatalogSelectPopup: React.FC<CatalogSelectPopupProps> = ({
  isOpen,
  onClose,
  onSelect,
  popupType,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [data, setData] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const config = getPopupConfig(popupType);
  const isCatalog = popupType === 'catalog';

  const loadData = async () => {
    if (isCatalog) {
      setIsLoading(true);
      try {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        setData(convertBackendTree(response.data));
      } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setData(getStaticData(popupType));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOpenFolders(new Set());
      loadData();
    }
  }, [isOpen, popupType]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const checkScroll = () => {
    const c = scrollContainerRef.current;
    if (!c) return;
    setHasScroll(c.scrollHeight > c.clientHeight);
  };

  useEffect(() => {
    const t = setTimeout(checkScroll, 350);
    return () => clearTimeout(t);
  }, [openFolders, data]);

  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    checkScroll();
    c.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(c);
    return () => { c.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const handleItemClick = (id: string, name: string) => {
    onSelect?.(id, name);
    onClose();
  };

  const handleCreateGroup = async (groupName: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      await AxiosService.post('/api/nomenclature/groups', {
        name: groupName,
        parentUid: parentUid === '__current__' ? null : parentUid,
      });
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      setData(convertBackendTree(response.data));
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Ошибка создания группы:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const countRows = (items: TreeItem[]): number => {
    let count = 0;
    items.forEach(item => {
      count += 1;
      if (openFolders.has(item.id) && item.children) {
        count += countRows(item.children);
      }
    });
    return count;
  };

  const renderTree = (items: TreeItem[], depth: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    items.forEach(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openFolders.has(item.id);
      const shift = depth * 20;

      result.push(
        <div
          key={item.id}
          onClick={() => hasChildren && toggleFolder(item.id)}
          onDoubleClick={() => handleItemClick(item.id, item.name)}
          style={{
            height: ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            userSelect: 'none',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
            paddingLeft: 20 + shift,
            paddingRight: 40,
          }}
        >
          <img 
            src={hasChildren ? (isOpen ? Icon12 : Icon11) : Icon11} 
            alt="" 
            style={{ 
              width: hasChildren && isOpen ? 19 : 18, 
              height: 16, 
              flexShrink: 0,
            }} 
          />
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059',
            marginLeft: 10,
            maxWidth: 400 - shift,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
          {config.columns.map(col => (
            <span
              key={col.key}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
                position: 'absolute',
                left: col.left,
              }}
            >
              {item[col.key] || ''}
            </span>
          ))}
        </div>
      );

      if (isOpen && hasChildren) {
        result.push(...renderTree(item.children!, depth + 1));
      }
    });
    return result;
  };

  const totalRows = countRows(data);
  const emptyRows = Math.max(0, VISIBLE_ROWS - totalRows);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 1052, height: 680, backgroundColor: '#FFFFFF', borderRadius: 15,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', position: 'relative',
          }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 30, width: 14, height: 14, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
              <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>

          <h2 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: '30px 0 0', textAlign: 'center' }}>
            {config.title}
          </h2>

          {isCatalog && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 30, paddingLeft: 45, paddingRight: 45 }}>
              <button style={{ width: 40, height: 40, backgroundColor: '#FFFFFF', border: '2px solid #666EFE', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <img src={Icon1} alt="" style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: 'flex', gap: 15, marginLeft: 'auto' }}>
                <button onClick={() => setShowCreateGroup(true)} style={{ width: 189, height: 40, backgroundColor: '#FFFFFF', border: '2px solid #666EFE', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                  <img src={Icon5} alt="" style={{ width: 22, height: 20, marginLeft: 15 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать группу</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', marginTop: isCatalog ? 15 : 60, alignSelf: 'center', position: 'relative', width: 992, height: TABLE_HEIGHT }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '2px solid #666EFE', boxSizing: 'border-box' }}>
              <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 40, boxSizing: 'border-box', position: 'relative' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>НАИМЕНОВАНИЕ</span>
                {config.columns.map(col => (
                  <span key={col.key} style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: col.left }}>
                    {col.title}
                  </span>
                ))}
              </div>
              <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {isLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9CA3AF' }}>Загрузка...</span>
                  </div>
                ) : (
                  <>
                    {renderTree(data)}
                    {Array.from({ length: emptyRows }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ height: ROW_HEIGHT, backgroundColor: '#FFFFFF', boxSizing: 'border-box', boxShadow: 'inset 0px -0.7px 0px 0px #666EFE' }} />
                    ))}
                  </>
                )}
              </div>
            </div>
            {hasScroll && (
              <div style={{ position: 'absolute', right: -20, top: HEADER_HEIGHT, bottom: 0, width: 10 }}>
                <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT - 4} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {isCatalog && (
        <CreateGroupPopup
          isOpen={showCreateGroup}
          currentParentName={null}
          groups={flattenGroups(data)}
          onClose={() => setShowCreateGroup(false)}
          onSubmit={handleCreateGroup}
          isLoading={isCreatingGroup}
        />
      )}
    </>
  );
};

export default CatalogSelectPopup;