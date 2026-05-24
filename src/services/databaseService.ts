import {apiClient} from './api';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const databaseService = {
    testConnection: (config: { host: string; port: string; database: string; login: string; password: string }) => {
        if (useMock) {
            return Promise.resolve({success: true, message: 'Подключение успешно'});
        }
        return apiClient.post('/database/test-connection', config).then(res => res.data);
    },

    getTables: (connectionId: string) => {
        if (useMock) {
            return Promise.resolve([
                {name: 'users', columns: ['id', 'name', 'email']},
                {name: 'orders', columns: ['id', 'user_id', 'amount', 'date']},
                {name: 'products', columns: ['id', 'name', 'price']},
            ]);
        }
        return apiClient.get(`/database/connections/${connectionId}/tables`).then(res => res.data);
    },
};
