// CatalogSelectPopup.tsx — полный файл с созданием для nomenclatureGroup и nomenclatureType
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
import Icon32 from '../../../assets/References/NomenclatureCreatePage/Icon32.svg';
import Icon72 from '../../../assets/References/NomenclatureCreatePage/Icon72.svg';

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
  createButtonLabel?: string;
  isFlat?: boolean;
}

const getPopupConfig = (type: PopupType): PopupConfig => {
  switch (type) {
    case 'catalog':
      return {
        title: 'Справочник: Номенклатура (выбор каталога)',
        columns: [{ key: 'groupCode', title: 'КОД ГРУППЫ', left: 500 }],
        createButtonLabel: 'Создать каталог',
        isFlat: false,
      };
    case 'nomenclatureGroup':
      return {
        title: 'Справочник: Группы номенклатуры (Выбор)',
        columns: [{ key: 'typeMaterialName', title: 'ГРУППА УЧЕТА', left: 500 }],
        createButtonLabel: 'Создать группу номенклатуры',
        isFlat: true,
      };
    case 'nomenclatureType':
      return {
        title: 'Справочник: Виды номенклатуры (Выбор)',
        columns: [{ key: 'typePurposeName', title: 'ГРУППА НОМЕНКЛАТУРЫ', left: 500 }],
        createButtonLabel: 'Создать вид номенклатуры',
        isFlat: true,
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

interface FlatReferenceItem {
  uid: string;
  typeName?: string;
  typeMaterialName?: string;
  typePurposeName?: string;
}

const getStaticData = (type: PopupType): TreeItem[] => {
  switch (type) {
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

const convertFlatReference = (items: FlatReferenceItem[]): TreeItem[] => {
  return items.map(item => ({
    id: item.uid,
    name: item.typeName || '',
    typeMaterialName: item.typeMaterialName || '',
    typePurposeName: item.typePurposeName || '',
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
  filterParam?: string;
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
  filterParam,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [data, setData] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Для создания в плоских справочниках
  const [showCreateFlatPopup, setShowCreateFlatPopup] = useState(false);
  const [flatFormName, setFlatFormName] = useState('');
  const [isCreatingFlat, setIsCreatingFlat] = useState(false);

  const config = getPopupConfig(popupType);
  const isCatalog = popupType === 'catalog';
  const isFlatReference = popupType === 'nomenclatureGroup' || popupType === 'nomenclatureType';

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isCatalog) {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        const converted = convertBackendTree(response.data);
        setData(converted);
        if (converted.length > 0) {
          setOpenFolders(new Set([converted[0].id]));
        }
      } else if (popupType === 'nomenclatureGroup' && filterParam) {
        const response = await AxiosService.get(
          `${ConstantInfo.restApiNomenclatureTypePurposes}?typeMaterialUid=${filterParam}`
        );
        setData(convertFlatReference(response.data));
      } else if (popupType === 'nomenclatureGroup' && !filterParam) {
        // Без фильтра — все группы номенклатуры
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTypePurposes);
        setData(convertFlatReference(response.data));
      } else if (popupType === 'nomenclatureType' && filterParam) {
        const response = await AxiosService.get(
          `${ConstantInfo.restApiNomenclatureTypeProducts}?typePurposeUid=${filterParam}`
        );
        setData(convertFlatReference(response.data));
      } else if (popupType === 'nomenclatureType' && !filterParam) {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTypeProducts);
        setData(convertFlatReference(response.data));
      } else {
        setData(getStaticData(popupType));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOpenFolders(new Set());
      loadData();
    }
  }, [isOpen, popupType, filterParam]);

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

  // Создание группы в каталоге
  const handleCreateGroup = async (groupName: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      await AxiosService.post('/api/nomenclature/groups', {
        name: groupName,
        parentUid: parentUid,
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

  // Открытие попапа создания для плоского справочника
  const handleCreateFlatClick = () => {
    setFlatFormName('');
    setShowCreateFlatPopup(true);
  };

  // Создание в плоском справочнике
  const handleCreateFlatSubmit = async () => {
    if (!flatFormName.trim()) return;
    setIsCreatingFlat(true);
    try {
      if (popupType === 'nomenclatureGroup') {
        await AxiosService.post(ConstantInfo.restApiNomenclatureTypePurposes, {
          name: flatFormName.trim(),
          typeMaterialUid: filterParam || null,
        });
      } else if (popupType === 'nomenclatureType') {
        await AxiosService.post(ConstantInfo.restApiNomenclatureTypeProducts, {
          name: flatFormName.trim(),
          typePurposeUid: filterParam || null,
        });
      }
      await loadData();
      setShowCreateFlatPopup(false);
    } catch (error) {
      console.error('Ошибка создания:', error);
    } finally {
      setIsCreatingFlat(false);
    }
  };

  const countRows = (items: TreeItem[]): number => {
    if (config.isFlat) return items.length;
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
          onClick={() => hasChildren ? toggleFolder(item.id) : handleItemClick(item.id, item.name)}
          onDoubleClick={() => handleItemClick(item.id, item.name)}
          style={{
            height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
            backgroundColor: '#FFFFFF', cursor: 'pointer', userSelect: 'none',
            boxSizing: 'border-box', position: 'relative',
            boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
            paddingLeft: 20 + shift, paddingRight: 40,
          }}
        >
          <img 
            src={hasChildren ? (isOpen ? Icon12 : Icon11) : Icon11} 
            alt="" 
            style={{ width: hasChildren && isOpen ? 19 : 18, height: 16, flexShrink: 0 }} 
          />
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059',
            marginLeft: 10, maxWidth: 400 - shift,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
          {config.columns.map(col => (
            <span key={col.key} style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
              position: 'absolute', left: col.left,
            }}>
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

  const renderFlatList = (items: TreeItem[]): React.ReactNode[] => {
    const isNomenclatureGroup = popupType === 'nomenclatureGroup';
    const isNomenclatureType = popupType === 'nomenclatureType';
    
    const iconLeft = 18;
    const textLeft = 50;
    
    return items.map(item => (
      <div
        key={item.id}
        onClick={() => handleItemClick(item.id, item.name)}
        onDoubleClick={() => handleItemClick(item.id, item.name)}
        style={{
          height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
          backgroundColor: '#FFFFFF', cursor: 'pointer', userSelect: 'none',
          boxSizing: 'border-box', position: 'relative',
          boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
          paddingLeft: iconLeft, paddingRight: 40,
        }}
      >
        {isNomenclatureGroup && (
          <img src={Icon32} alt="" style={{ width: 14.5, height: 18, flexShrink: 0 }} />
        )}
        {isNomenclatureType && (
          <img src={Icon72} alt="" style={{ width: 16, height: 16, flexShrink: 0 }} />
        )}
        {!isNomenclatureGroup && !isNomenclatureType && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
        )}
        {(isNomenclatureGroup || isNomenclatureType) && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
            marginLeft: textLeft - iconLeft - (isNomenclatureGroup ? 14.5 : 16),
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </span>
        )}
        {config.columns.map(col => (
          <span key={col.key} style={{
            fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059',
            position: 'absolute', left: col.left,
          }}>
            {item[col.key] || ''}
          </span>
        ))}
      </div>
    ));
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
          WebkitBackdropFilter: 'blur(8px)', zIndex: 10002,
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

          {(isCatalog || isFlatReference) && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 30, paddingLeft: 45, paddingRight: 45 }}>
              <button style={{ width: 40, height: 40, backgroundColor: '#FFFFFF', border: '2px solid #666EFE', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <img src={Icon1} alt="" style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: 'flex', gap: 15, marginLeft: 'auto' }}>
                <button 
                  onClick={() => { 
                    if (isCatalog) setShowCreateGroup(true); 
                    else if (isFlatReference) handleCreateFlatClick();
                  }} 
                  style={{ width: 220, height: 40, backgroundColor: '#FFFFFF', border: '2px solid #666EFE', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  <img src={Icon5} alt="" style={{ width: 22, height: 20, marginLeft: 15 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>
                    {config.createButtonLabel || 'Создать'}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', marginTop: (isCatalog || isFlatReference) ? 15 : 60, alignSelf: 'center', position: 'relative', width: 992, height: TABLE_HEIGHT }}>
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
                    {config.isFlat ? renderFlatList(data) : renderTree(data)}
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

      {/* Попап создания группы в каталоге */}
      {isCatalog && (
        <CreateGroupPopup
          isOpen={showCreateGroup}
          currentParentName={null}
          currentParentUid={null}
          groups={flattenGroups(data)}
          onClose={() => setShowCreateGroup(false)}
          onSubmit={handleCreateGroup}
          isLoading={isCreatingGroup}
        />
      )}

      {/* Попап создания для плоских справочников */}
      {showCreateFlatPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreateFlatPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>
              {popupType === 'nomenclatureGroup' ? 'Создание группы номенклатуры' : 'Создание вида номенклатуры'}
            </h3>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label>
              <input 
                type="text" 
                value={flatFormName} 
                onChange={e => setFlatFormName(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFlatSubmit(); else if (e.key === 'Escape') setShowCreateFlatPopup(false); }} 
                placeholder="Введите название" 
                autoFocus 
                style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCreateFlatPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={handleCreateFlatSubmit} disabled={isCreatingFlat || !flatFormName.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: flatFormName.trim() && !isCreatingFlat ? '#666EFE' : '#BCC8FF', cursor: flatFormName.trim() && !isCreatingFlat ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isCreatingFlat ? 'Сохранение...' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogSelectPopup;