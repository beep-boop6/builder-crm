import { apiClient } from './api';
import type { ProjectTemplate } from '@/types/template';
import { useTemplateStore } from '@/store/templateStore';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const templateService = {
    getAll: (): Promise<ProjectTemplate[]> => {
        if (useMock) {
            return Promise.resolve(useTemplateStore.getState().templates);
        }
        return apiClient.get('/templates').then((res) => res.data);
    },

    getById: (id: string): Promise<ProjectTemplate> => {
        if (useMock) {
            const template = useTemplateStore.getState().templates.find((item) => item.id === id);
            if (!template) {
                return Promise.reject(new Error('Шаблон не найден'));
            }
            return Promise.resolve(template);
        }
        return apiClient.get(`/templates/${id}`).then((res) => res.data);
    },

    apply: (templateId: string, projectId: string, pageId: string) => {
        return useMock
            ? Promise.resolve({ success: true })
            : apiClient.post(`/templates/${templateId}/apply`, { projectId, pageId }).then((res) => res.data);
    },
};
