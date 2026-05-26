// src/services/dataService.ts

// Типы для моковых данных
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface SalesData {
  month: string;
  amount: number;
}

// Моковые базы данных
const MOCK_USERS: UserData[] = [
  { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', role: 'Admin', status: 'active' },
  { id: '2', name: 'Петр Петров', email: 'petr@example.com', role: 'Manager', status: 'active' },
  { id: '3', name: 'Анна Смирнова', email: 'anna@example.com', role: 'Client', status: 'inactive' },
];

const MOCK_SALES: SalesData[] = [
  { month: 'Янв', amount: 1200 },
  { month: 'Фев', amount: 1900 },
  { month: 'Мар', amount: 1500 },
];

export const dataService = {
  // Имитация асинхронного запроса за данными
  async fetchMockData(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (endpoint === 'users') {
          resolve(MOCK_USERS);
        } else if (endpoint === 'sales') {
          resolve(MOCK_SALES);
        } else {
          reject(new Error(`Endpoint ${endpoint} not found`));
        }
      }, 600); // Искусственная задержка для имитации сети
    });
  }
};