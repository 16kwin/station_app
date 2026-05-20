// NomenclaturePage.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import CreateGroupPopup from './CreateGroupPopup';
import Icon1 from '../../../assets/References/Icon1.svg';
import Icon2 from '../../../assets/References/Icon2.svg';
import Icon3 from '../../../assets/References/Icon3.svg';
import Icon4 from '../../../assets/References/Icon4.svg';
import Icon5 from '../../../assets/References/Icon5.svg';
import Icon6 from '../../../assets/References/Icon6.svg';
import Icon7 from '../../../assets/References/Icon7.svg';
import Icon8 from '../../../assets/References/Icon8.svg';
import Icon9 from '../../../assets/References/Icon9.svg';
import Icon10 from '../../../assets/References/Icon10.svg';
import Icon11 from '../../../assets/References/Icon11.svg';
import Icon12 from '../../../assets/References/Icon12.svg';
import Icon13 from '../../../assets/References/Icon13.svg';

interface MaterialItem {
  uid: string;
  name: string;
  article: string;
  code: number | null;
  unit: string | null;
  quantity: number | null;
  price: number | null;
}

interface GroupTreeNode {
  uid: string;
  name: string;
  children: GroupTreeNode[];
  materials: MaterialItem[];
}

const NomenclaturePage = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<GroupTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const TABLE_WIDTH = 1720;
  const TABLE_OUTER_HEIGHT = 642;
  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 58;
  const VISIBLE_ROWS = 10;

  const COL_NAME = 85;
  const COL_CODE = 340;
  const COL_ARTICLE = 510;
  const COL_ACCOUNT_GROUP = 700;
  const COL_NOMENCLATURE_GROUP = 930;
  const COL_NOMENCLATURE_TYPE = 1160;
  const COL_USAGE = 1390;

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        setTreeData(response.data);
      } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTree();
  }, []);

  const getAllGroupsFlat = (nodes: GroupTreeNode[]): { uid: string; name: string }[] => {
    let result: { uid: string; name: string }[] = [];
    nodes.forEach(node => {
      result.push({ uid: node.uid, name: node.name });
      if (node.children) {
        result = result.concat(getAllGroupsFlat(node.children));
      }
    });
    return result;
  };

  const getCurrentParentName = (): string | null => null;

  const toggleFolder = (folderUid: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderUid)) next.delete(folderUid);
      else next.add(folderUid);
      return next;
    });
  };

  const handleCreateClick = async () => {
    try {
      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureGenerate);
      const { uid, code } = response.data;
      const path = `/references/nomenclature/create/${uid}/${code}`;
      navigate(path);
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
    }
  };

  const handleCreateGroup = async (groupName: string, parentUid: string | null) => {
    setIsCreatingGroup(true);
    try {
      await AxiosService.post('/api/nomenclature/groups', {
        name: groupName,
        parentUid: parentUid === '__current__' ? null : parentUid,
      });

      const response = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      setTreeData(response.data);
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Ошибка создания группы:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasVerticalScroll(container.scrollHeight > container.clientHeight);
    setHasHorizontalScroll(container.scrollWidth > container.clientWidth);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 350);
    return () => clearTimeout(timer);
  }, [expandedFolders, treeData]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, []);

  const smallButtonStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  };

  const mediumButtonStyle: React.CSSProperties = {
    height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    padding: 0, flexShrink: 0,
  };

  const EmptySquare = ({ color = '#2D4059', opacity = 0.5 }: { color?: string; opacity?: number }) => (
    <div style={{
      width: 18, height: 18,
      borderRadius: 2,
      border: `2px solid ${color}`,
      opacity: opacity,
      flexShrink: 0,
      boxSizing: 'border-box',
    }} />
  );

  const countRows = (nodes: GroupTreeNode[]): number => {
    let count = 0;
    nodes.forEach(node => {
      count += 1;
      if (expandedFolders.has(node.uid)) {
        if (node.children) count += countRows(node.children);
        if (node.materials) count += node.materials.length;
      }
    });
    return count;
  };

  const renderTree = (nodes: GroupTreeNode[], depth: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      const hasMaterials = node.materials && node.materials.length > 0;
      const canOpen = hasChildren || hasMaterials;
      const isOpen = expandedFolders.has(node.uid);
      const shift = depth * 20;

      result.push(
        <div
          key={node.uid}
          onClick={() => canOpen && toggleFolder(node.uid)}
          style={{
            height: ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            cursor: canOpen ? 'pointer' : 'default',
            userSelect: 'none',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
          }}
        >
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}>
            <EmptySquare />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: shift + 19 }}>
            <img 
              src={canOpen ? (isOpen ? Icon12 : Icon11) : Icon11} 
              alt="" 
              style={{ 
                width: canOpen && isOpen ? 19 : 18, 
                height: canOpen && isOpen ? 16 : 16, 
                flexShrink: 0,
              }} 
            />
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#2D4059',
              marginLeft: 10,
              maxWidth: 408 - shift,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {node.name}
            </span>
          </div>
        </div>
      );

      if (!isOpen || !canOpen) return;

      if (hasChildren) {
        result.push(...renderTree(node.children!, depth + 1));
      }

      if (hasMaterials) {
        node.materials!.forEach(material => {
          const materialShift = (depth + 1) * 20;

          result.push(
            <div
              key={material.uid}
              style={{
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                position: 'relative',
                cursor: 'pointer',
                boxSizing: 'border-box',
                boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
              }}
            >
              <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center' }}>
                <EmptySquare />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginLeft: materialShift + 19 }}>
                <img 
                  src={Icon13} 
                  alt="" 
                  style={{ width: 20, height: 20, flexShrink: 0 }} 
                />
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059',
                  marginLeft: 10,
                  maxWidth: 408 - materialShift,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {material.name || '—'}
                </span>
              </div>

              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_CODE }}>
                {material.code || '—'}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', position: 'absolute', left: COL_ARTICLE }}>
                {material.article || ''}
              </span>
            </div>
          );
        });
      }
    });

    return result;
  };

  const totalRows = countRows(treeData);
  const emptyRows = Math.max(0, VISIBLE_ROWS - totalRows);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFC' }}>
      <div style={{ paddingTop: 35, paddingLeft: 60 }}>
        <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 30, fontWeight: 'bold', color: '#2D4059', margin: 0 }}>Справочник: Номенклатура</h1>
      </div>

      <div style={{ position: 'absolute', top: 104, left: 55, right: 55, height: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon1} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon2} alt="" style={{ width: 20, height: 14 }} /></button>
          <button style={smallButtonStyle}><img src={Icon3} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ position: 'absolute', left: 586, display: 'flex', gap: 15 }}>
          <button style={{ ...mediumButtonStyle, width: 124 }} onClick={handleCreateClick}>
            <img src={Icon4} alt="" style={{ width: 16, height: 16, marginLeft: 12 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать</span>
          </button>
          <button style={{ ...mediumButtonStyle, width: 186 }} onClick={() => setShowCreateGroup(true)}>
            <img src={Icon5} alt="" style={{ width: 22, height: 20, marginLeft: 15 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059', marginLeft: 15 }}>Создать группу</span>
          </button>
          <button style={smallButtonStyle}><img src={Icon6} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon7} alt="" style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <button style={smallButtonStyle}><img src={Icon8} alt="" style={{ width: 18, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon9} alt="" style={{ width: 14, height: 18 }} /></button>
          <button style={smallButtonStyle}><img src={Icon10} alt="" style={{ width: 18, height: 16 }} /></button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 159, left: 40 }}>
        <div style={{ 
          width: TABLE_WIDTH, 
          height: TABLE_OUTER_HEIGHT, 
          backgroundColor: '#F5F6FA', 
          borderRadius: 10, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          border: '2px solid #666EFE',
          boxSizing: 'border-box',
        }}>
          <div style={{ 
            height: HEADER_HEIGHT, 
            minHeight: HEADER_HEIGHT, 
            backgroundColor: '#666EFE', 
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative', 
            paddingLeft: 20, 
            paddingRight: 40, 
            boxSizing: 'border-box',
            boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
          }}>
            <EmptySquare color="#FFFFFF" opacity={1} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginLeft: 47 }}>НАИМЕНОВАНИЕ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_CODE }}>КОД</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ARTICLE }}>АРТИКУЛ</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_ACCOUNT_GROUP }}>ГРУППА УЧЕТА</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NOMENCLATURE_GROUP }}>ГРУППА НОМ.</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_NOMENCLATURE_TYPE }}>ВИД НОМ.</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', position: 'absolute', left: COL_USAGE }}>ИСПОЛЬЗ.</span>
          </div>

          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ minWidth: TABLE_WIDTH - 40 }}>
              {renderTree(treeData)}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    height: ROW_HEIGHT,
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 20,
                    boxShadow: 'inset 0px -0.7px 0px 0px #666EFE',
                  }}
                >
                  <EmptySquare />
                </div>
              ))}
            </div>
          </div>
        </div>

        {hasVerticalScroll && (
          <div style={{ position: 'absolute', right: -25, top: HEADER_HEIGHT, height: TABLE_OUTER_HEIGHT - HEADER_HEIGHT - 4, width: 10 }}>
            <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_OUTER_HEIGHT - HEADER_HEIGHT - 4} />
          </div>
        )}
        {hasHorizontalScroll && (
          <div style={{ position: 'absolute', bottom: -21, left: 0, width: TABLE_WIDTH, height: 10 }}>
            <CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="horizontal" trackSize={TABLE_WIDTH} />
          </div>
        )}
      </div>

      <CreateGroupPopup
        isOpen={showCreateGroup}
        currentParentName={getCurrentParentName()}
        groups={getAllGroupsFlat(treeData)}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={handleCreateGroup}
        isLoading={isCreatingGroup}
      />
    </div>
  );
};

export default NomenclaturePage;