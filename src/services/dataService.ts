import { validateDataPayload } from '@/utils/dataValidation';
import type { DataRow } from '@/utils/dataValidation';

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

export interface DealData {
    id: string;
    title: string;
    client: string;
    status: 'lead' | 'negotiation' | 'deal' | 'closed';
    amount: number;
    date: string;
}

const MOCK_DEALS: DealData[] = [
    { id: '1', title: 'Поставка оборудования', client: 'ООО Альфа', status: 'lead', amount: 120000, date: '2026-01-12' },
    { id: '2', title: 'Лицензии ПО', client: 'ИП Бета', status: 'negotiation', amount: 85000, date: '2026-02-03' },
    { id: '3', title: 'Сервисный контракт', client: 'ЗАО Гамма', status: 'deal', amount: 240000, date: '2026-02-18' },
    { id: '4', title: 'Консалтинг', client: 'ООО Дельта', status: 'closed', amount: 45000, date: '2026-03-01' },
    { id: '5', title: 'Интеграция CRM', client: 'ООО Эпсилон', status: 'lead', amount: 310000, date: '2026-03-15' },
];

export interface ClientData {
    id: string;
    name: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive' | 'new';
}

const MOCK_CLIENTS: ClientData[] = [
    { id: '1', name: 'Иван Иванов', phone: '+7 (999) 123-45-67', email: 'ivan@example.com', status: 'active' },
    { id: '2', name: 'Петр Петров', phone: '+7 (999) 234-56-78', email: 'petr@example.com', status: 'active' },
    { id: '3', name: 'Анна Смирнова', phone: '+7 (999) 345-67-89', email: 'anna@example.com', status: 'inactive' },
    { id: '4', name: 'Ольга Козлова', phone: '+7 (999) 456-78-90', email: 'olga@example.com', status: 'new' },
    { id: '5', name: 'Сергей Волков', phone: '+7 (999) 567-89-01', email: 'sergey@example.com', status: 'active' },
];

export interface TransactionData {
    id: string;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
}

const MOCK_TRANSACTIONS: TransactionData[] = [
    { id: '1', date: '2026-01-05', type: 'income', amount: 120000, category: 'Продажи' },
    { id: '2', date: '2026-01-18', type: 'expense', amount: 45000, category: 'Зарплата' },
    { id: '3', date: '2026-02-02', type: 'income', amount: 85000, category: 'Услуги' },
    { id: '4', date: '2026-02-14', type: 'expense', amount: 22000, category: 'Маркетинг' },
    { id: '5', date: '2026-03-01', type: 'income', amount: 240000, category: 'Контракт' },
    { id: '6', date: '2026-03-10', type: 'expense', amount: 18000, category: 'Офис' },
];

const MOCK_REGISTRY: Record<string, DataRow[]> = {
    users: MOCK_USERS as unknown as DataRow[],
    sales: MOCK_SALES as unknown as DataRow[],
    deals: MOCK_DEALS as unknown as DataRow[],
    clients: MOCK_CLIENTS as unknown as DataRow[],
    transactions: MOCK_TRANSACTIONS as unknown as DataRow[],
};

export const dataService = {
    async fetchMockData(endpoint: string): Promise<DataRow[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const dataset = MOCK_REGISTRY[endpoint];
                if (!dataset) {
                    reject(new Error(`Mock-источник «${endpoint}» не найден`));
                    return;
                }
                resolve(dataset);
            }, 400);
        });
    },

    async fetchRestData(url: string): Promise<DataRow[]> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: не удалось загрузить данные`);
        }

        const payload = await response.json();
        const validated = validateDataPayload(payload);
        if (!validated.success) {
            throw new Error(validated.error);
        }

        return validated.rows;
    },

    async fetchByType(type: 'mock' | 'rest', endpoint: string): Promise<DataRow[]> {
        if (type === 'mock') {
            const rows = await dataService.fetchMockData(endpoint);
            const validated = validateDataPayload(rows);
            if (!validated.success) {
                throw new Error(validated.error);
            }
            return validated.rows;
        }

        return dataService.fetchRestData(endpoint);
    },
};
