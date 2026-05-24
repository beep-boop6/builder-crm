import {apiClient} from './api';
import {mockApi} from './mockApi';
import {Project} from '../types';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const projectService = {
    getAll: (): Promise<Project[]> => {
        return useMock ? mockApi.getProjects() : apiClient.get('/projects').then(res => res.data);
    },

    getById: (id: string): Promise<Project> => {
        return useMock ? mockApi.getProject(id).then(p => {
            if (!p) throw new Error('Project not found');
            return p;
        }) : apiClient.get(`/projects/${id}`).then(res => res.data);
    },

    create: (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        return useMock ? mockApi.createProject(data) : apiClient.post('/projects', data).then(res => res.data);
    },

    update: (id: string, data: Partial<Project>): Promise<Project> => {
        return useMock ? mockApi.updateProject(id, data) : apiClient.put(`/projects/${id}`, data).then(res => res.data);
    },

    delete: (id: string): Promise<void> => {
        return useMock ? mockApi.deleteProject(id) : apiClient.delete(`/projects/${id}`).then(res => res.data);
    },
};
