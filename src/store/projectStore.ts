import {create} from 'zustand';
import type {Project} from '../types';
import {projectService} from '../services/projectService';
import { getErrorMessage } from '@/utils/getErrorMessage';

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    error: string | null;
    settingsSaving: boolean;
    fetchProjects: () => Promise<void>;
    loadProject: (id: string) => Promise<void>;
    setCurrentProject: (project: Project) => void;
    createProject: (name: string, navigationType: 'sidebar' | 'topbar') => Promise<Project>;
    updateProjectSettings: (
        id: string,
        data: { name?: string; navigationType?: 'sidebar' | 'topbar' }
    ) => Promise<Project>;
    deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    settingsSaving: false,

    fetchProjects: async () => {
        set({loading: true, error: null});
        try {
            const projects = await projectService.getAll();
            set({projects, loading: false});
        } catch (error: unknown) {
            set({error: getErrorMessage(error, 'Не удалось загрузить проекты'), loading: false});
        }
    },

    loadProject: async (id) => {
        set({loading: true, error: null});
        try {
            const project = await projectService.getById(id);
            set({currentProject: project, loading: false});
        } catch (error: unknown) {
            set({error: getErrorMessage(error, 'Не удалось загрузить проект'), loading: false});
        }
    },

    setCurrentProject: (project) => set({currentProject: project}),

    createProject: async (name, navigationType) => {
        set({loading: true, error: null});
        try {
            const newProject = await projectService.create({name, navigationType});
            set(state => ({projects: [...state.projects, newProject], loading: false}));
            return newProject;
        } catch (error: unknown) {
            set({error: getErrorMessage(error, 'Не удалось создать проект'), loading: false});
            throw error;
        }
    },

    updateProjectSettings: async (id, data) => {
        set({settingsSaving: true, error: null});
        try {
            const updated = await projectService.update(id, data);
            set((state) => ({
                settingsSaving: false,
                currentProject:
                    state.currentProject?.id === id
                        ? { ...state.currentProject, ...updated }
                        : state.currentProject,
                projects: state.projects.map((project) =>
                    project.id === id ? { ...project, ...updated } : project
                ),
            }));
            return updated;
        } catch (error: unknown) {
            set({
                error: getErrorMessage(error, 'Не удалось сохранить настройки'),
                settingsSaving: false,
            });
            throw error;
        }
    },

    deleteProject: async (id) => {
        set({loading: true, error: null});
        try {
            await projectService.delete(id);
            set(state => ({
                projects: state.projects.filter(p => p.id !== id),
                loading: false
            }));
        } catch (error: unknown) {
            set({error: getErrorMessage(error, 'Не удалось удалить проект'), loading: false});
            throw error;
        }
    },
}));
