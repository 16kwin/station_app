// data/mockData.ts

export interface Enterprise {
  id: string;
  name: string;
}

export interface Workshop {
  id: string;
  name: string;
  enterpriseId: string;
}

export interface Section {
  id: string;
  name: string;
  workshopId: string;
}

// Предприятия
export const mockEnterprises: Enterprise[] = [
  { id: 'ent1', name: 'Завод №1' },
  { id: 'ent2', name: 'Завод №2' },
  { id: 'ent3', name: 'Завод №3' },
  { id: 'ent4', name: 'Комбинат "Восток"' },
];

// Цеха
export const mockWorkshops: Workshop[] = [
  // Завод №1
  { id: 'ws1', name: 'Цех сборки', enterpriseId: 'ent1' },
  { id: 'ws2', name: 'Цех покраски', enterpriseId: 'ent1' },
  { id: 'ws3', name: 'Цех упаковки', enterpriseId: 'ent1' },
  
  // Завод №2
  { id: 'ws4', name: 'Цех металлообработки', enterpriseId: 'ent2' },
  { id: 'ws5', name: 'Цех сварки', enterpriseId: 'ent2' },
  
  // Завод №3
  { id: 'ws6', name: 'Цех штамповки', enterpriseId: 'ent3' },
  { id: 'ws7', name: 'Цех термообработки', enterpriseId: 'ent3' },
  { id: 'ws8', name: 'Цех контроля', enterpriseId: 'ent3' },
  
  // Комбинат "Восток"
  { id: 'ws9', name: 'Цех подготовки', enterpriseId: 'ent4' },
  { id: 'ws10', name: 'Цех финишной обработки', enterpriseId: 'ent4' },
];

// Участки
export const mockSections: Section[] = [
  // Цех сборки (ws1)
  { id: 'sec1', name: 'Участок 1', workshopId: 'ws1' },
  { id: 'sec2', name: 'Участок 2', workshopId: 'ws1' },
  { id: 'sec3', name: 'Участок 3', workshopId: 'ws1' },
  
  // Цех покраски (ws2)
  { id: 'sec4', name: 'Линия покраски А', workshopId: 'ws2' },
  { id: 'sec5', name: 'Линия покраски Б', workshopId: 'ws2' },
  
  // Цех упаковки (ws3)
  { id: 'sec6', name: 'Упаковка 1', workshopId: 'ws3' },
  { id: 'sec7', name: 'Упаковка 2', workshopId: 'ws3' },
  
  // Цех металлообработки (ws4)
  { id: 'sec8', name: 'Токарный участок', workshopId: 'ws4' },
  { id: 'sec9', name: 'Фрезерный участок', workshopId: 'ws4' },
  
  // Цех сварки (ws5)
  { id: 'sec10', name: 'Сварочный пост 1', workshopId: 'ws5' },
  { id: 'sec11', name: 'Сварочный пост 2', workshopId: 'ws5' },
  
  // Цех штамповки (ws6)
  { id: 'sec12', name: 'Пресс 1', workshopId: 'ws6' },
  { id: 'sec13', name: 'Пресс 2', workshopId: 'ws6' },
  
  // Цех термообработки (ws7)
  { id: 'sec14', name: 'Печь А', workshopId: 'ws7' },
  { id: 'sec15', name: 'Печь Б', workshopId: 'ws7' },
  
  // Цех контроля (ws8)
  { id: 'sec16', name: 'ОТК 1', workshopId: 'ws8' },
  { id: 'sec17', name: 'ОТК 2', workshopId: 'ws8' },
  
  // Цех подготовки (ws9)
  { id: 'sec18', name: 'Подготовка сырья', workshopId: 'ws9' },
  
  // Цех финишной обработки (ws10)
  { id: 'sec19', name: 'Шлифовка', workshopId: 'ws10' },
  { id: 'sec20', name: 'Полировка', workshopId: 'ws10' },
];