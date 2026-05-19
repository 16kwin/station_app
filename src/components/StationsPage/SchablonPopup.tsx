// components/SchablonPopup.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CustomScrollbar from '../../components/CustomScrollbar';
import PopupIcon1 from '../../assets/Station/PopupIcon1.svg';
import PopupIcon2 from '../../assets/Station/PopupIcon2.svg';
import PopupIcon3 from '../../assets/Station/PopupIcon3.svg';
import PopupIcon4 from '../../assets/Station/PopupIcon4.svg';
import PopupIcon5 from '../../assets/Station/PopupIcon5.svg';
import PopupIcon7 from '../../assets/Station/PopupIcon7.svg';

interface SchablonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  uid?: string;
  name?: string;
  workshop?: string;
  section?: string;
  status?: string;
}

interface Folder {
  id: number;
  name: string;
  isOpen: boolean;
  items: FolderItem[];
}

interface FolderItem {
  id: number;
  name: string;
  status: string;
  date: string;
}

const SchablonPopup: React.FC<SchablonPopupProps> = ({
  isOpen,
  onClose,
  uid,
  name,
  workshop,
  section,
  status,
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: 1,
      name: 'Шаблоны для станций типа ТМЦ',
      isOpen: false,
      items: [
        { id: 1, name: 'Шаблон ТМЦ №1', status: '', date: '2026-05-14 12:00' },
        { id: 2, name: 'Шаблон ТМЦ №2', status: '', date: '2026-05-13 10:00' },
        { id: 3, name: 'Шаблон ТМЦ №3', status: '', date: '2026-05-12 09:00' },
      ],
    },
    {
      id: 2,
      name: 'Шаблоны для станций типа СГД',
      isOpen: false,
      items: [
        { id: 4, name: 'Шаблон СГД №1', status: '', date: '2026-05-14 11:00' },
        { id: 5, name: 'Шаблон СГД №2', status: '', date: '2026-05-13 15:00' },
        { id: 6, name: 'Шаблон СГД №3', status: '', date: '2026-05-12 10:00' },
        { id: 7, name: 'Шаблон СГД №4', status: '', date: '2026-05-11 08:00' },
      ],
    },
    {
      id: 3,
      name: 'Шаблоны для станций барабанного типа',
      isOpen: false,
      items: [
        { id: 8, name: 'Барабанный шаблон №1', status: '', date: '2026-05-14 09:00' },
        { id: 9, name: 'Барабанный шаблон №2', status: '', date: '2026-05-13 14:00' },
      ],
    },
    {
      id: 4,
      name: 'Шаблоны для станций постомат',
      isOpen: false,
      items: [
        { id: 10, name: 'Постомат шаблон №1', status: '', date: '2026-05-14 08:00' },
        { id: 11, name: 'Постомат шаблон №2', status: '', date: '2026-05-12 16:00' },
        { id: 12, name: 'Постомат шаблон №3', status: '', date: '2026-05-10 12:00' },
      ],
    },
    {
      id: 5,
      name: 'Общие шаблоны',
      isOpen: false,
      items: [
        { id: 13, name: 'Общий шаблон №1', status: '', date: '2026-05-09 08:00' },
        { id: 14, name: 'Общий шаблон №2', status: '', date: '2026-05-08 17:00' },
      ],
    },
    {
      id: 6,
      name: 'Архивные шаблоны',
      isOpen: false,
      items: [
        { id: 15, name: 'Архивный шаблон №1', status: '', date: '2026-04-20 10:00' },
        { id: 16, name: 'Архивный шаблон №2', status: '', date: '2026-04-15 09:00' },
      ],
    },
  ]);

  const toggleFolder = (folderId: number) => {
    setFolders(prev =>
      prev.map(f =>
        f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
      )
    );
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setHasScroll(container.scrollHeight > container.clientHeight);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 350);
    return () => clearTimeout(timer);
  }, [folders]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener('scroll', checkScroll);

    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(() => checkScroll());
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const handleItemClick = (id: number) => {
    navigate(`/documents/schablon/${id}`);
    onClose();
  };

  const trackHeight = 378;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '1052px',
              height: '602px',
              backgroundColor: '#FFFFFF',
              borderRadius: '15px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Крестик закрытия */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '30px',
                width: '14px',
                height: '14px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
                <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>

            {/* Заголовок */}
            <h2
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '24px',
                fontWeight: 500,
                color: '#2D4059',
                margin: '20px 0 0 0',
                textAlign: 'center',
              }}
            >
              Каталог загрузки шаблонов станций
            </h2>

            {/* Текущий шаблон станции */}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#2D4059',
                margin: '30px 0 0 60px',
              }}
            >
              Текущий шаблон станции:
            </p>

            {/* Ряд кнопок */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '45px',
                paddingLeft: '45px',
                paddingRight: '45px',
              }}
            >
              {/* Левая кнопка 40x40 */}
              <button
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #666EFE',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <img src={PopupIcon1} alt="" style={{ width: '18px', height: '18px' }} />
              </button>

              {/* Правая группа кнопок */}
              <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto' }}>
                {/* Кнопка Создать 126x40 */}
                <button
                  style={{
                    width: '126px',
                    height: '40px',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #666EFE',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <img
                    src={PopupIcon2}
                    alt=""
                    style={{ width: '14px', height: '14px', marginLeft: '15px' }}
                  />
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#2D4059',
                      marginLeft: 'auto',
                      marginRight: '20px',
                    }}
                  >
                    Создать
                  </span>
                </button>

                {/* Кнопка Создать группу 189x40 */}
                <button
                  style={{
                    width: '189px',
                    height: '40px',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #666EFE',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <img
                    src={PopupIcon3}
                    alt=""
                    style={{ width: '22px', height: '20px', marginLeft: '15px' }}
                  />
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#2D4059',
                      marginLeft: 'auto',
                      marginRight: '20px',
                    }}
                  >
                    Создать группу
                  </span>
                </button>
              </div>
            </div>

            {/* Окно скролла + скроллбар */}
            <div
              style={{
                display: 'flex',
                marginTop: '10px',
                alignSelf: 'center',
                position: 'relative',
                width: '992px',
                height: '378px',
              }}
            >
              {/* Окно скролла */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#F5F6FA',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1.5px solid #666EFE',
                }}
              >
                {/* Шапка таблицы */}
                <div
                  style={{
                    height: '54px',
                    minHeight: '54px',
                    backgroundColor: '#666EFE',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    paddingLeft: '52px',
                    paddingRight: '106px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    НАИМЕНОВАНИЕ
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      position: 'absolute',
                      left: '647px',
                    }}
                  >
                    СТАТУС
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginLeft: 'auto',
                    }}
                  >
                    ДАТА ВРЕМЯ
                  </span>
                </div>

                {/* Строки со скроллом */}
                <div
                  ref={scrollContainerRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {folders.map((folder) => (
                    <React.Fragment key={folder.id}>
                      {/* Папка */}
                      <div
                        onClick={() => toggleFolder(folder.id)}
                        style={{
                          height: '54px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '20px',
                          paddingRight: '20px',
                          borderTop: '1.5px solid #666EFE',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={PopupIcon4}
                          alt=""
                          style={{ width: '14.5px', height: '18px', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#2D4059',
                            marginLeft: '17.5px',
                          }}
                        >
                          {folder.name}
                        </span>
                        <motion.img
                          src={PopupIcon5}
                          alt=""
                          animate={{
                            rotate: folder.isOpen ? 90 : 0,
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            width: '10px',
                            height: '6px',
                            flexShrink: 0,
                            marginLeft: '12px',
                          }}
                        />
                      </div>

                      {/* Элементы папки с анимацией выплывания */}
                      <AnimatePresence>
                        {folder.isOpen &&
                          folder.items.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: '54px', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div
                                onClick={() => handleItemClick(item.id)}
                                style={{
                                  height: '54px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  paddingLeft: '40px',
                                  paddingRight: '106px',
                                  borderTop: '1.5px solid #666EFE',
                                  backgroundColor: '#FFFFFF',
                                  position: 'relative',
                                  cursor: 'pointer',
                                }}
                              >
                                <img
                                  src={PopupIcon7}
                                  alt=""
                                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                                />
                                <span
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '15px',
                                    fontWeight: 400,
                                    color: '#2D4059',
                                    marginLeft: '15px',
                                  }}
                                >
                                  {item.name}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    color: '#2D4059',
                                    position: 'absolute',
                                    left: '647px',
                                  }}
                                >
                                  {item.status}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    color: '#2D4059',
                                    marginLeft: 'auto',
                                  }}
                                >
                                  {item.date}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Скроллбар absolute — показываем только если есть скролл */}
              {hasScroll && (
                <div style={{ position: 'absolute', right: '-20px', top: '54px', bottom: 0, width: '10px' }}>
                  <CustomScrollbar
                    scrollContainerRef={scrollContainerRef}
                    orientation="vertical"
                    trackSize={trackHeight - 54}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SchablonPopup;