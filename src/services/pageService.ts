import {apiClient} from './api';
import {mockApi} from './mockApi';
import { isMockEnabled } from '@/config/env';

export const pageService = {
    getByProject: (projectId: string) => {
        return isMockEnabled ? mockApi.getPages(projectId) : apiClient.get(`/projects/${projectId}/pages`).then(res => res.data);
    },

    create: (projectId: string, data: { title: string; route: string }) => {
        return isMockEnabled ? mockApi.createPage(projectId, data) : apiClient.post(`/projects/${projectId}/pages`, data).then(res => res.data);
    },

    update: (projectId: string, pageId: string, data: Partial<{ title: string; route: string }>) => {
        return isMockEnabled ? mockApi.getPages(projectId).then(pages => {
            const page = pages.find(p => p.id === pageId);
            if (page) Object.assign(page, data);
            return page;
        }) : apiClient.put(`/projects/${projectId}/pages/${pageId}`, data).then(res => res.data);
    },

    delete: (projectId: string, pageId: string) => {
        return isMockEnabled ? mockApi.deletePage(projectId, pageId) : apiClient.delete(`/projects/${projectId}/pages/${pageId}`).then(res => res.data);
    },
};
