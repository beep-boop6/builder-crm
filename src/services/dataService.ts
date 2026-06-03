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
}

const MOCK_DEALS: DealData[] = [
    { id: '1', title: 'Поставка оборудования', client: 'ООО Альфа', status: 'lead', amount: 120000 },
    { id: '2', title: 'Лицензии ПО', client: 'ИП Бета', status: 'negotiation', amount: 85000 },
    { id: '3', title: 'Сервисный контракт', client: 'ЗАО Гамма', status: 'deal', amount: 240000 },
    { id: '4', title: 'Консалтинг', client: 'ООО Дельта', status: 'closed', amount: 45000 },
    { id: '5', title: 'Интеграция CRM', client: 'ООО Эпсилон', status: 'lead', amount: 310000 },
];

const MOCK_REGISTRY: Record<string, DataRow[]> = {
    users: MOCK_USERS as unknown as DataRow[],
    sales: MOCK_SALES as unknown as DataRow[],
    deals: MOCK_DEALS as unknown as DataRow[],
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
