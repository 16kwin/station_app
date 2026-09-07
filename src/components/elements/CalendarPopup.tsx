// CalendarPopup.tsx — ПОЛНЫЙ ФАЙЛ (открывается на сегодня или выбранной дате)
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string) => void;
  selectedDate?: string;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const BLOCK_WIDTH = 40;
const BLOCK_GAP = 11;
const GRID_LEFT_OFFSET = 21;

const formatDate = (year: number, month: number, day: number): string => {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${d}.${m}.${year}`;
};

const CalendarPopup: React.FC<CalendarPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  anchorRef,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // При каждом открытии устанавливаем дату
  useEffect(() => {
    if (isOpen) {
      if (selectedDate && selectedDate.includes('.')) {
        const parts = selectedDate.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && month > 0 && month <= 12) {
            setSelectedDay(day);
            setCurrentMonth(month);
            setCurrentYear(year);
          } else {
            setSelectedDay(today.getDate());
            setCurrentMonth(today.getMonth() + 1);
            setCurrentYear(today.getFullYear());
          }
        }
      } else {
        setSelectedDay(today.getDate());
        setCurrentMonth(today.getMonth() + 1);
        setCurrentYear(today.getFullYear());
      }
    }
  }, [isOpen, selectedDate]);

  // Позиционирование под полем
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popupWidth = 387;
      const left = rect.left + rect.width / 2 - popupWidth / 2;
      const top = rect.bottom + 8;
      setPosition({ top, left });
    }
  }, [isOpen, anchorRef]);

  const handlePrevMonth = () => {
    setSlideDirection('right');
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSlideDirection('left');
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
    
    let firstWeekday = firstDayOfMonth.getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;
    
    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
    
    for (let i = firstWeekday - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 1 ? 12 : currentMonth - 1,
        year: currentMonth === 1 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }
    
    const remainingDays = 35 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: currentMonth === 12 ? 1 : currentMonth + 1,
        year: currentMonth === 12 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }
    
    return days.slice(0, 35);
  }, [currentYear, currentMonth]);

  const handleDateClick = (day: number, month: number, year: number, isCurrentMonth: boolean) => {
    setSelectedDay(day);
    if (!isCurrentMonth) {
      setCurrentMonth(month);
      setCurrentYear(year);
    }
  };

  const handleConfirm = () => {
    if (selectedDay) {
      const dateStr = formatDate(currentYear, currentMonth, selectedDay);
      onConfirm(dateStr);
      onClose();
    }
  };

  const isSelected = (day: number, month: number, year: number) => {
    return selectedDay === day && currentMonth === month && currentYear === year;
  };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: 387,
            height: 432,
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ height: 70, flexShrink: 0, position: 'relative', borderBottom: '1px solid #D8D8D8' }}>
            <span style={{
              position: 'absolute',
              top: 26,
              left: 31,
              fontFamily: 'Inter, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#2D4059',
              lineHeight: '18px',
            }}>
              {MONTHS[currentMonth - 1]} {currentYear}
            </span>
            
            <div style={{
              position: 'absolute',
              top: 24,
              right: 33,
              display: 'flex',
              gap: 12,
            }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: '#E7E9EE',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                  userSelect: 'none',
                }}
              >
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M5 1L1 5L5 9" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={handleNextMonth}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: '#E7E9EE',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                  userSelect: 'none',
                }}
              >
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="#2D4059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{ height: 261, flexShrink: 0, position: 'relative', borderBottom: '1px solid #D8D8D8', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: 24,
              left: GRID_LEFT_OFFSET,
              display: 'flex',
              gap: BLOCK_GAP,
            }}>
              {DAYS_OF_WEEK.map((day, index) => (
                <div key={index} style={{
                  width: BLOCK_WIDTH,
                  height: 19,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#2D4059',
                    lineHeight: '18px',
                  }}>
                    {day}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              position: 'absolute',
              top: 59,
              left: 0,
              right: 0,
              overflow: 'hidden',
            }}>
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={`${currentYear}-${currentMonth}`}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <div key={rowIndex} style={{
                      display: 'flex',
                      gap: BLOCK_GAP,
                      height: 38,
                    }}>
                      {calendarDays.slice(rowIndex * 7, rowIndex * 7 + 7).map((dayInfo, colIndex) => {
                        const selected = isSelected(dayInfo.day, dayInfo.month, dayInfo.year);
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleDateClick(dayInfo.day, dayInfo.month, dayInfo.year, dayInfo.isCurrentMonth)}
                            style={{
                              width: BLOCK_WIDTH,
                              height: 38,
                              borderRadius: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              backgroundColor: selected ? '#666EFE' : 'transparent',
                              transition: 'background-color 0.2s ease',
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 15,
                              fontWeight: 500,
                              color: selected 
                                ? '#FFFFFF' 
                                : dayInfo.isCurrentMonth 
                                  ? '#2D4059' 
                                  : 'rgba(45, 64, 89, 0.6)',
                              lineHeight: '18px',
                            }}>
                              {dayInfo.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <button
              onClick={handleConfirm}
              style={{
                position: 'absolute',
                bottom: 30,
                width: 138,
                height: 39,
                borderRadius: 8,
                backgroundColor: '#666EFE',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                outline: 'none',
                userSelect: 'none',
              }}
            >
              Подтвердить
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarPopup;