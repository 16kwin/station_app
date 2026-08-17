// StationModelFilesTab.tsx — ПОЛНЫЙ ФАЙЛ (полные названия файлов, колонки с маленькой буквы)
import React, { useState, useRef, useEffect } from 'react';
import DataTable from '../../elements/DataTable';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import DeleteIcon18Black from '../../../assets/Icons/DeleteIcons/DeleteIcon18Black.svg';
import FilesIcon14Black from '../../../assets/Icons/FilesIcons/FilesIcon14Black.svg';

interface DocumentItem {
  uid: string;
  documentName: string;
  originalName: string;
  url: string;
  createdAt: string;
}

interface LocalDocumentItem {
  localId: string;
  documentName: string;
  file: File;
}

interface StationModelFilesTabProps {
  modelUid: string;
  isEdit: boolean;
  localDocuments?: LocalDocumentItem[];
  setLocalDocuments?: React.Dispatch<React.SetStateAction<LocalDocumentItem[]>>;
}

const FILE_COLUMNS = [
  { key: 'documentName', label: 'Наименование' },
  { key: 'originalName', label: 'Файл' },
  { key: 'createdAt', label: 'Дата' },
];

const StationModelFilesTab: React.FC<StationModelFilesTabProps> = ({ modelUid, isEdit, localDocuments = [], setLocalDocuments }) => {
  const [serverDocuments, setServerDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileLocalRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; uid: string } | null>(null);

  useEffect(() => { if (modelUid && isEdit) fetchDocuments(); }, [modelUid, isEdit]);
  useEffect(() => { if (!contextMenu) return; const h = () => setContextMenu(null); document.addEventListener('click', h, true); return () => document.removeEventListener('click', h, true); }, [contextMenu]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiStationModelDocuments(modelUid));
      setServerDocuments(res.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const allDocuments = [
    ...serverDocuments,
    ...localDocuments.map(d => ({
      uid: d.localId,
      documentName: d.documentName,
      originalName: d.file.name,
      url: '',
      createdAt: new Date().toISOString(),
    })),
  ];

  const handleCheckboxClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = allDocuments.length > 0 && allDocuments.every(d => selectedIds.has(d.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(allDocuments.map(d => d.uid))); };
  const handleRowClick = (uid: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const handleContextMenu = (e: React.MouseEvent, uid: string) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, uid }); };
  const handleDoubleClick = (uid: string) => { const d = allDocuments.find(x => x.uid === uid); if (d?.url) window.open(d.url, '_blank'); };
  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      for (const uid of selectedIds) {
        if (localDocuments.some(d => d.localId === uid)) {
          setLocalDocuments?.(prev => prev.filter(d => d.localId !== uid));
        } else {
          await AxiosService.delete(ConstantInfo.restApiStationModelDeleteDocument(uid));
        }
      }
      await fetchDocuments();
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    } catch (e) { console.error(e); }
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    if (isEdit) {
      (async () => {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('documentName', file.name);
          await AxiosService.post(ConstantInfo.restApiStationModelDocuments(modelUid), fd);
          await fetchDocuments();
        } catch (err) { console.error(err); } finally {
          setIsUploading(false);
          if (fileLocalRef.current) fileLocalRef.current.value = '';
        }
      })();
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setLocalDocuments?.(prev => [...prev, { localId, documentName: file.name, file }]);
      setIsUploading(false);
      if (fileLocalRef.current) fileLocalRef.current.value = '';
    }
  };

  const formatDate = (d: string) => { if (!d) return ''; try { return new Date(d).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
  const renderCell = (key: string, item: any): string => { const v = item[key]; if (v === null || v === undefined) return '-'; if (key === 'createdAt') return formatDate(v); return String(v); };
  const isGrayColumn = (key: string): boolean => key !== 'documentName';
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

  return (
    <div style={{ position: 'absolute', top: 165, left: 30, right: 30, bottom: 96 }}>
      <div style={{ position: 'absolute', top: 0, left: 15, display: 'flex', gap: 15 }}>
        <button style={smallButtonStyle}><img src={SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
        <button style={smallButtonStyle}><img src={SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} /></button>
        <button style={smallButtonStyle} onClick={() => fileLocalRef.current?.click()}><img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} /></button>
        <button style={{ ...smallButtonStyle, opacity: selectedIds.size > 0 ? 1 : 0.5 }} onClick={handleDeleteSelected}><img src={DeleteIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
      </div>
      <input ref={fileLocalRef} type="file" style={{ display: 'none' }} onChange={handleLocalFileUpload} />
      <div style={{ position: 'absolute', top: 52, left: 0 }}>
        <DataTable
          columns={FILE_COLUMNS}
          visibleKeys={['documentName', 'originalName', 'createdAt']}
          data={allDocuments}
          selectedIds={selectedIds}
          onCheckboxClick={handleCheckboxClick}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
          renderCell={renderCell}
          isGrayColumn={isGrayColumn}
          tableWidth={1740}
          visibleRows={8}
          rowHeight={58}
          headerHeight={58}
          firstColLeft={60}
          rowIcon={FilesIcon14Black}
          rowIconSize={20}
          noWrapColumns={['documentName', 'originalName', 'createdAt']}
        />
      </div>
      {isUploading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666EFE' }}>Загрузка...</span>
        </div>
      )}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, width: 174, backgroundColor: '#FFFFFF', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10001, display: 'flex', flexDirection: 'column', padding: '8px 0' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setSelectedIds(new Set([contextMenu.uid])); setContextMenu(null); setTimeout(() => setShowDeleteConfirm(true), 50); }} style={{ width: '100%', height: 40, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Удалить</button>
        </div>
      )}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Подтверждение удаления</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', margin: 0, textAlign: 'center' }}>Вы уверены, что хотите удалить выбранные файлы?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#FF3052', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationModelFilesTab;