// src/store/dataStore.ts
import { create } from 'zustand';
import { dataService } from '../services/dataService';

export type DataSourceType = 'mock' | 'rest';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  endpoint: string; // Например 'users' или 'sales' для моковых данных
  data: any | null;
  isLoading: boolean;
  error: string | null;
}

interface DataState {
  sources: DataSource[];
  addSource: (source: Omit<DataSource, 'data' | 'isLoading' | 'error'>) => void;
  removeSource: (id: string) => void;
  loadData: (sourceId: string) => Promise<void>;
  getDataById: (sourceId: string) => any | null;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Добавим пару источников по умолчанию для тестирования
  sources: [
    { id: 'src-users', name: 'Список пользователей', type: 'mock', endpoint: 'users', data: null, isLoading: false, error: null },
    { id: 'src-sales', name: 'Продажи по месяцам', type: 'mock', endpoint: 'sales', data: null, isLoading: false, error: null }
  ],

  addSource: (source) => set((state) => ({
    sources: [...state.sources, { ...source, data: null, isLoading: false, error: null }]
  })),

  removeSource: (id) => set((state) => ({
    sources: state.sources.filter(s => s.id !== id)
  })),

  loadData: async (sourceId) => {
    const source = get().sources.find(s => s.id === sourceId);
    if (!source) return;

    // Устанавливаем статус загрузки
    set((state) => ({
      sources: state.sources.map(s => 
        s.id === sourceId ? { ...s, isLoading: true, error: null } : s
      )
    }));

    try {
      let fetchedData = null;
      if (source.type === 'mock') {
        fetchedData = await dataService.fetchMockData(source.endpoint);
      }
      // В будущем здесь можно добавить логику: if (source.type === 'rest') { fetch(source.endpoint)... }
      
      set((state) => ({
        sources: state.sources.map(s => 
          s.id === sourceId ? { ...s, data: fetchedData, isLoading: false } : s
        )
      }));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      set((state) => ({
        sources: state.sources.map(s => 
          s.id === sourceId ? { ...s, isLoading: false, error: error.message || 'Ошибка загрузки' } : s
        )
      }));
    }
  },

  getDataById: (sourceId) => {
    const source = get().sources.find(s => s.id === sourceId);
    return source ? source.data : null;
  }
}));