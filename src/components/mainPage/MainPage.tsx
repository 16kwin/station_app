// MainPage.tsx
import React, { useState, useEffect, memo } from 'react';
import AxiosService from '../../services/AxiosService';
import ConstantInfo from '../../info/ConstantInfo';

interface TestDocument {
  id?: number;
  title: string | null;
  field2: string | null;
  field3: string | null;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Компонент модального окна подтверждения (вынесен)
const ConfirmDialog = ({ onSave, onClose }: { onSave: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold mb-4">Несохранённые изменения</h3>
      <p className="text-gray-600 mb-6">
        У вас есть несохранённые изменения. Хотите сохранить черновик?
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Не сохранять
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Сохранить черновик
        </button>
      </div>
    </div>
  </div>
);

// Компонент списка черновиков (вынесен)
const DraftsList = ({ drafts, loading, onClose, onOpenDraft }: { 
  drafts: TestDocument[]; 
  loading: boolean; 
  onClose: () => void; 
  onOpenDraft: (draft: TestDocument) => void;
}) => (
  <div className="bg-white rounded-lg p-6 shadow">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Черновики</h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 text-2xl"
      >
        ×
      </button>
    </div>
    
    {loading ? (
      <div className="text-center py-8 text-gray-500">Загрузка...</div>
    ) : drafts.length === 0 ? (
      <div className="text-center py-8 text-gray-500">Нет сохранённых черновиков</div>
    ) : (
      <div className="space-y-3 max-h-[60vh] overflow-auto">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            onClick={() => onOpenDraft(draft)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="font-medium text-gray-900">{draft.title || 'Без названия'}</div>
            <div className="text-sm text-gray-500 mt-1">
              {draft.field2 && <span className="mr-3">Поле 2: {draft.field2}</span>}
              {draft.field3 && <span>Поле 3: {draft.field3}</span>}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Обновлён: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : '—'}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Компонент формы документа (вынесен)
const DocumentForm = ({ 
  documentId, 
  title, field2, field3,
  onTitleChange, onField2Change, onField3Change,
  onCancel, onSaveDraft, onSaveComplete,
  isSaving 
}: {
  documentId: number | null;
  title: string; field2: string; field3: string;
  onTitleChange: (v: string) => void;
  onField2Change: (v: string) => void;
  onField3Change: (v: string) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveComplete: () => void;
  isSaving: boolean;
}) => (
  <div className="bg-white rounded-lg p-6 shadow">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">
        {documentId ? 'Редактирование документа' : 'Новый документ'}
      </h2>
      <button
        onClick={onCancel}
        className="text-gray-400 hover:text-gray-600 text-2xl"
      >
        ×
      </button>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название документа
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Введите название..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поле 2
        </label>
        <input
          type="text"
          value={field2}
          onChange={(e) => onField2Change(e.target.value)}
          placeholder="Введите данные..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поле 3
        </label>
        <input
          type="text"
          value={field3}
          onChange={(e) => onField3Change(e.target.value)}
          placeholder="Введите данные..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить черновик'}
        </button>
        <button
          onClick={onSaveComplete}
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  </div>
);

const MainPage = memo(() => {
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [drafts, setDrafts] = useState<TestDocument[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Получение CSRF токена при монтировании
  useEffect(() => {
    const initCsrf = async () => {
      try {
        const response = await AxiosService.get('/csrf');
        const csrfToken = response.data.token;
        AxiosService.defaults.headers['X-XSRF-TOKEN'] = csrfToken;
        console.log('CSRF токен установлен:', csrfToken);
      } catch (error) {
        console.error('Ошибка получения CSRF:', error);
      }
    };
    initCsrf();
  }, []);

  // Загрузка черновиков
  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const response = await AxiosService.get(ConstantInfo.restApiTestDocumentsDrafts);
      setDrafts(response.data);
      setShowDraftsList(true);
    } catch (error) {
      console.error('Ошибка загрузки черновиков:', error);
      alert('Ошибка загрузки черновиков');
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Создание нового документа
  const handleCreateNew = () => {
    setCurrentDocumentId(null);
    setTitle('');
    setField2('');
    setField3('');
    setShowDocumentForm(true);
    setShowDraftsList(false);
  };

  // Открыть черновик
  const handleOpenDraft = (draft: TestDocument) => {
    setCurrentDocumentId(draft.id || null);
    setTitle(draft.title || '');
    setField2(draft.field2 || '');
    setField3(draft.field3 || '');
    setShowDocumentForm(true);
    setShowDraftsList(false);
  };

  // Сохранение на бекенд
  const sendToBackend = async (completed: boolean) => {
    const data: TestDocument = {
      title: title.trim() || null,
      field2: field2.trim() || null,
      field3: field3.trim() || null,
      completed,
    };

    setIsSaving(true);
    try {
      let response;
      if (currentDocumentId) {
        response = await AxiosService.put(
          ConstantInfo.restApiTestDocument(currentDocumentId),
          data
        );
      } else {
        response = await AxiosService.post(
          ConstantInfo.restApiTestDocuments,
          data
        );
        setCurrentDocumentId(response.data.id);
      }
      
      console.log('Сохранено:', response.data);
      
      if (completed) {
        alert('Документ успешно сохранён и завершён');
        setTitle('');
        setField2('');
        setField3('');
        setCurrentDocumentId(null);
        setShowDocumentForm(false);
      } else {
        alert('Черновик сохранён');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  // Проверка на несохранённые изменения
  const hasUnsavedChanges = () => {
    return title.trim() !== '' || field2.trim() !== '' || field3.trim() !== '';
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmDialog(true);
    } else {
      setShowDocumentForm(false);
      setTitle('');
      setField2('');
      setField3('');
      setCurrentDocumentId(null);
    }
  };

  const handleSaveDraftAndClose = async () => {
    setIsSaving(true);
    try {
      const data: TestDocument = {
        title: title.trim() || null,
        field2: field2.trim() || null,
        field3: field3.trim() || null,
        completed: false,
      };

      if (currentDocumentId) {
        await AxiosService.put(
          ConstantInfo.restApiTestDocument(currentDocumentId),
          data
        );
      } else {
        const response = await AxiosService.post(
          ConstantInfo.restApiTestDocuments,
          data
        );
        setCurrentDocumentId(response.data.id);
      }
      
      alert('Черновик сохранён');
      setShowDocumentForm(false);
      setTitle('');
      setField2('');
      setField3('');
      setCurrentDocumentId(null);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения');
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCloseWithoutSave = () => {
    setShowDocumentForm(false);
    setTitle('');
    setField2('');
    setField3('');
    setCurrentDocumentId(null);
    setShowConfirmDialog(false);
  };

  return (
    <div className="h-full overflow-auto p-6">
      {showConfirmDialog && (
        <ConfirmDialog 
          onSave={handleSaveDraftAndClose}
          onClose={handleCloseWithoutSave}
        />
      )}
      
      {!showDocumentForm && !showDraftsList && (
        <div className="flex gap-4">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать документ
          </button>
          <button
            onClick={loadDrafts}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Открыть черновики
          </button>
        </div>
      )}
      
      {showDocumentForm && (
        <DocumentForm
          documentId={currentDocumentId}
          title={title}
          field2={field2}
          field3={field3}
          onTitleChange={setTitle}
          onField2Change={setField2}
          onField3Change={setField3}
          onCancel={handleCancel}
          onSaveDraft={() => sendToBackend(false)}
          onSaveComplete={() => sendToBackend(true)}
          isSaving={isSaving}
        />
      )}
      
      {showDraftsList && (
        <DraftsList
          drafts={drafts}
          loading={loadingDrafts}
          onClose={() => setShowDraftsList(false)}
          onOpenDraft={handleOpenDraft}
        />
      )}
    </div>
  );
});

export default MainPage;