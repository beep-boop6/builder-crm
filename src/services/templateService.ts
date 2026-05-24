import {apiClient} from './api';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const templateService = {
    getAll: () => {
        if (useMock) {
            return Promise.resolve([
                {id: '1', name: 'Дашборд продаж', preview: '', category: 'dashboard'},
                {id: '2', name: 'Список клиентов', preview: '', category: 'list'},
                {id: '3', name: 'Карточка товара', preview: '', category: 'detail'},
            ]);
        }
        return apiClient.get('/templates').then(res => res.data);
    },

    getById: (id: string) => {
        return useMock ? Promise.resolve({id, name: 'Template', components: []}) : apiClient.get(`/templates/${id}`).then(res => res.data);
    },

    apply: (templateId: string, projectId: string, pageId: string) => {
        return useMock ? Promise.resolve({success: true}) : apiClient.post(`/templates/${templateId}/apply`, { projectId, pageId }).then(res => res.data);
    },
};
