import { Project, Page } from '../types';
import { EditorComponent } from '../store/editorStore';
import { generateGuid } from '../utils';
import { sanitizeProjectsForStorage } from '../utils/sanitizeProjectStorage';

const STORAGE_KEY = 'builder_crm_projects';

// Вспомогательная функция для работы с localStorage
const getStoredProjects = (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveProjects = (projects: Project[]) => {
    const sanitized = sanitizeProjectsForStorage(projects);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            throw new Error(
                'Недостаточно места в хранилище браузера. Удалите старые фото из проектов или очистите данные сайта.'
            );
        }
        throw error;
    }
};

const generateId = () => generateGuid();

export const mockApi = {
    // Projects
    getProjects: async (): Promise<Project[]> => {
        return getStoredProjects();
    },

    getProject: async (id: string): Promise<Project | undefined> => {
        const projects = getStoredProjects();
        return projects.find(p => p.id === id);
    },

    createProject: async (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        const projects = getStoredProjects();
        
        const defaultPage: Page = {
            id: generateId(),
            title: 'Главная',
            route: '/',
            components: [],
            order: 1
        };

        const newProject: Project = {
            id: generateId(),
            name: data.name,
            navigationType: data.navigationType,
            createdAt: Date.now(),
            updatedAt: new Date().toISOString(),
            pages: [defaultPage],
        };
        
        saveProjects([...projects, newProject]);
        return newProject;
    },

    updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
        const projects = getStoredProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error('Проект не найден');
        
        const updatedProject = { ...projects[index], ...data, updatedAt: new Date().toISOString() };
        projects[index] = updatedProject;
        saveProjects(projects);
        
        return updatedProject;
    },

    deleteProject: async (id: string): Promise<void> => {
        const projects = getStoredProjects();
        const filtered = projects.filter(p => p.id !== id);
        saveProjects(filtered);
    },

    // Pages
    getPages: async (projectId: string): Promise<Page[]> => {
        const project = await mockApi.getProject(projectId);
        return project?.pages || [];
    },

    createPage: async (projectId: string, data: { title: string; route: string }): Promise<Page> => {
        const project = await mockApi.getProject(projectId);
        if (!project) throw new Error('Проект не найден');
        
        const newPage: Page = {
            id: generateId(),
            title: data.title,
            route: data.route,
            components: [],
            order: (project.pages?.length || 0) + 1,
        };
        
        const updatedProject = {
            ...project,
            pages: [...(project.pages || []), newPage],
        };
        
        await mockApi.updateProject(projectId, updatedProject);
        return newPage;
    },

    deletePage: async (projectId: string, pageId: string): Promise<void> => {
        const project = await mockApi.getProject(projectId);
        if (!project) throw new Error('Проект не найден');
        
        const updatedProject = {
            ...project,
            pages: (project.pages || []).filter(p => p.id !== pageId),
        };
        
        await mockApi.updateProject(projectId, updatedProject);
    },

    // Components
    getComponents: async (projectId: string, pageId: string): Promise<EditorComponent[]> => {
        const project = await mockApi.getProject(projectId);
        const page = project?.pages?.find(p => p.id === pageId);
        return page?.components || [];
    },

    createComponent: async (projectId: string, pageId: string, data: Partial<EditorComponent>): Promise<EditorComponent> => {
        const project = await mockApi.getProject(projectId);
        if (!project) throw new Error('Проект не найден');
        
        const pageIndex = project.pages?.findIndex(p => p.id === pageId);
        if (pageIndex === undefined || pageIndex === -1) throw new Error('Страница не найдена');
        
        const newComponent: EditorComponent = {
            id: generateId(),
            type: data.type || 'button',
            x: data.x ?? 0,
            y: data.y ?? 0,
            width: data.width ?? 100,
            height: data.height ?? 100,
            backgroundColor: data.backgroundColor || '#155DA4',
            text: data.text || 'Компонент',
            fontSize: data.fontSize ?? 14,
            fontWeight: data.fontWeight ?? 500,
            color: data.color || '#ffffff',
            borderRadius: data.borderRadius ?? 4,
            zIndex: data.zIndex ?? 1,
        };
        
        const updatedPages = [...(project.pages || [])];
        updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            components: [...(updatedPages[pageIndex].components || []), newComponent],
        };
        
        await mockApi.updateProject(projectId, { pages: updatedPages });
        return newComponent;
    },

    updateComponent: async (projectId: string, pageId: string, componentId: string, data: Partial<EditorComponent>): Promise<EditorComponent> => {
        const project = await mockApi.getProject(projectId);
        if (!project) throw new Error('Проект не найден');
        
        const pageIndex = project.pages?.findIndex(p => p.id === pageId);
        if (pageIndex === undefined || pageIndex === -1) throw new Error('Страница не найдена');
        
        const componentIndex = project.pages[pageIndex].components?.findIndex(c => c.id === componentId);
        if (componentIndex === undefined || componentIndex === -1) throw new Error('Компонент не найден');
        
        const updatedPages = [...(project.pages || [])];
        const updatedComponents = [...(updatedPages[pageIndex].components || [])];
        updatedComponents[componentIndex] = { ...updatedComponents[componentIndex], ...data };
        updatedPages[pageIndex] = { ...updatedPages[pageIndex], components: updatedComponents };
        
        await mockApi.updateProject(projectId, { pages: updatedPages });
        return updatedComponents[componentIndex];
    },

    deleteComponent: async (projectId: string, pageId: string, componentId: string): Promise<void> => {
        const project = await mockApi.getProject(projectId);
        if (!project) throw new Error('Проект не найден');
        
        const pageIndex = project.pages?.findIndex(p => p.id === pageId);
        if (pageIndex === undefined || pageIndex === -1) throw new Error('Страница не найдена');
        
        const updatedPages = [...(project.pages || [])];
        updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            components: (updatedPages[pageIndex].components || []).filter(c => c.id !== componentId),
        };
        
        await mockApi.updateProject(projectId, { pages: updatedPages });
    },
};
