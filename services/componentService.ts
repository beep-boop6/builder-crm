import {apiClient} from './api';
import {mockApi} from './mockApi';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const componentService = {
    getByPage: (projectId: string, pageId: string) => {
        return useMock ? mockApi.getComponents(projectId, pageId) : apiClient.get(`/projects/${projectId}/pages/${pageId}/components`).then(res => res.data);
    },

    create: (projectId: string, pageId: string, data: any) => {
        return useMock ? mockApi.createComponent(projectId, pageId, data) : apiClient.post(`/projects/${projectId}/pages/${pageId}/components`, data).then(res => res.data);
    },

    update: (projectId: string, pageId: string, componentId: string, data: Partial<any>) => {
        return useMock ? mockApi.updateComponent(projectId, pageId, componentId, data) : apiClient.put(`/projects/${projectId}/pages/${pageId}/components/${componentId}`, data).then(res => res.data);
    },

    delete: (projectId: string, pageId: string, componentId: string) => {
        return useMock ? mockApi.deleteComponent(projectId, pageId, componentId) : apiClient.delete(`/projects/${projectId}/pages/${pageId}/components/${componentId}`).then(res => res.data);
    },
};
