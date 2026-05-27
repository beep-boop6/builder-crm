import {apiClient} from './api';
import {mockApi} from './mockApi';
import { isMockEnabled } from '@/config/env';

export const componentService = {
    getByPage: (projectId: string, pageId: string) => {
        return isMockEnabled ? mockApi.getComponents(projectId, pageId) : apiClient.get(`/projects/${projectId}/pages/${pageId}/components`).then(res => res.data);
    },

    create: (projectId: string, pageId: string, data: Record<string, unknown>) => {
        return isMockEnabled ? mockApi.createComponent(projectId, pageId, data) : apiClient.post(`/projects/${projectId}/pages/${pageId}/components`, data).then(res => res.data);
    },

    update: (projectId: string, pageId: string, componentId: string, data: Partial<Record<string, unknown>>) => {
        return isMockEnabled ? mockApi.updateComponent(projectId, pageId, componentId, data) : apiClient.put(`/projects/${projectId}/pages/${pageId}/components/${componentId}`, data).then(res => res.data);
    },

    delete: (projectId: string, pageId: string, componentId: string) => {
        return isMockEnabled ? mockApi.deleteComponent(projectId, pageId, componentId) : apiClient.delete(`/projects/${projectId}/pages/${pageId}/components/${componentId}`).then(res => res.data);
    },
};
