// SupplierDocumentsTab.tsx — ПОЛНЫЙ ФАЙЛ (как в DocumentsTab)
import React, { useState, useRef, useEffect } from 'react';
import CustomScrollbar from '../../../components/CustomScrollbar';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import type { CommonSupplierProps } from './SupplierCreatePage';

const SupplierDocumentsTab: React.FC<CommonSupplierProps> = (props) => {
  const { uid, isEdit, documents = [], setDocuments } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddDocPopup, setShowAddDocPopup] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileLocalRef = useRef<HTMLInputElement>(null);

  const blockStyle: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)' };
  const smallButtonStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };
  const cs: React.CSSProperties = { position: 'absolute', top: 164, left: 30, right: 30, bottom: 111 };

  const fetchDocuments = async () => {
    if (!uid || !setDocuments) return;
    setIsLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiSupplierDocuments(uid));
      const docs = (res.data || []).map((doc: any) => ({ ...doc, url: doc.fileUrl ? ConstantInfo.fileDir + doc.fileUrl.replace(/^\//, '') : '' }));
      setDocuments(docs);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (uid && isEdit) fetchDocuments(); }, [uid, isEdit]);

  const checkScroll = () => { const c = scrollContainerRef.current; if (c) setHasScroll(c.scrollHeight > c.clientHeight); };
  useEffect(() => { const t = setTimeout(checkScroll, 350); return () => clearTimeout(t); }, [documents]);
  useEffect(() => { const c = scrollContainerRef.current; if (!c) return; checkScroll(); c.addEventListener('scroll', checkScroll); return () => c.removeEventListener('scroll', checkScroll); }, []);

  const formatDate = (dateStr: string) => { if (!dateStr) return ''; try { return new Date(dateStr).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return dateStr; } };

  const handleAddClick = () => { setNewDocName(''); setSelectedFile(null); setShowAddDocPopup(true); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); };

  const handleAddDocSubmit = async () => {
    if (!uid || !newDocName.trim() || !selectedFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('documentName', newDocName.trim());
      await AxiosService.post(ConstantInfo.restApiSupplierDocuments(uid), fd);
      await fetchDocuments();
      setShowAddDocPopup(false);
    } catch (e) { console.error(e); } finally { setIsUploading(false); }
  };

  const handleDelete = async (docUid: string) => {
    if (!confirm('Удалить документ?')) return;
    try { await AxiosService.delete(ConstantInfo.restApiSupplierDeleteDocument(docUid)); await fetchDocuments(); } catch (e) { console.error(e); }
  };

  const TABLE_WIDTH = 1665; const HEADER_HEIGHT = 54; const ROW_HEIGHT = 54; const TABLE_HEIGHT = 450;

  return (
    <div style={cs}>
      <div style={{ ...blockStyle, width: 1740, height: 565, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 34, left: 40, display: 'flex', gap: 15 }}>
          <button onClick={handleAddClick} style={smallButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ position: 'absolute', top: 83, left: 25, display: 'flex', gap: 10 }}>
          <div style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT, backgroundColor: '#F5F6FA', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #666EFE', flexShrink: 0 }}>
            <div style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, backgroundColor: '#666EFE', borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 40, position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 450 }}>НАЗВАНИЕ</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', width: 350 }}>ИМЯ ФАЙЛА</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#FFFFFF', flex: 1 }}>ДАТА ЗАГРУЗКИ</span>
              <span style={{ width: 40 }} />
            </div>
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {isLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Загрузка...</span></div>
              : documents.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Нет документов</span></div>
              : documents.map(doc => (
                <div key={doc.uid} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, borderTop: '0.7px solid #666EFE', backgroundColor: '#FFFFFF', position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="14" height="14" rx="2" stroke="#666EFE" strokeWidth="1.5"/><line x1="5" y1="5" x2="11" y2="5" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="9" y2="11" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059', marginLeft: 15, width: 415, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.documentName}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', width: 335, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: '#2D4059', flex: 1 }}>{formatDate(doc.createdAt)}</span>
                  <button onClick={() => handleDelete(doc.uid)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="3" y1="3" x2="11" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="#FF3052" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          {hasScroll && <div style={{ width: 10, height: TABLE_HEIGHT, paddingTop: HEADER_HEIGHT }}><CustomScrollbar scrollContainerRef={scrollContainerRef} orientation="vertical" trackSize={TABLE_HEIGHT - HEADER_HEIGHT} /></div>}
        </div>
      </div>
      {showAddDocPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddDocPopup(false)}>
          <div style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 20, fontWeight: 500, color: '#2D4059', margin: 0, textAlign: 'center' }}>Добавление документа</h3>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Название</label><input type="text" value={newDocName} onChange={e => setNewDocName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddDocSubmit(); else if (e.key === 'Escape') setShowAddDocPopup(false); }} placeholder="Введите название документа" autoFocus style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(102, 110, 254, 0.15)', paddingLeft: 12, paddingRight: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} /></div>
            <div><label style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#2D4059', display: 'block', marginBottom: 7 }}>Файл</label><div onClick={() => fileLocalRef.current?.click()} style={{ width: '100%', height: 44, borderRadius: 10, border: '1px dashed rgba(102, 110, 254, 0.3)', backgroundColor: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#666EFE" strokeWidth="2" strokeLinecap="round"/></svg><span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: selectedFile ? '#666EFE' : '#9CA3AF' }}>{selectedFile ? selectedFile.name : 'Выберите файл'}</span></div><input ref={fileLocalRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setShowAddDocPopup(false)} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button><button onClick={handleAddDocSubmit} disabled={!newDocName.trim() || !selectedFile || isUploading} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: newDocName.trim() && selectedFile && !isUploading ? '#666EFE' : '#BCC8FF', cursor: newDocName.trim() && selectedFile && !isUploading ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#FFFFFF' }}>{isUploading ? 'Загрузка...' : 'Добавить'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDocumentsTab;