import {Project, Page, ComponentConfig} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const mockProjects: Project[] = [
    {
        id: '1',
        name: 'Demo CRM',
        navigationType: 'sidebar',
        createdAt: '2025-04-01T10:00:00Z',
        updatedAt: '2025-04-20T15:30:00Z',
        pages: [],
    },
    {
        id: '2',
        name: 'Sales Dashboard',
        navigationType: 'topbar',
        createdAt: '2025-03-15T08:20:00Z',
        updatedAt: '2025-04-18T12:00:00Z',
        pages: [],
    },
];

let projects = [...mockProjects];

export const mockApi = {
    // Projects
    getProjects: (): Promise<Project[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve([...projects]), 300);
        });
    },

    getProject: (id: string): Promise<Project | undefined> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(projects.find(p => p.id === id)), 200);
        });
    },

    createProject: (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newProject: Project = {
                    id: generateId(),
                    name: data.name,
                    navigationType: data.navigationType,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    pages: [],
                };
                projects.push(newProject);
                resolve(newProject);
            }, 400);
        });
    },

    deleteProject: (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (projects.find(p => p.id === id)) {
                    projects = projects.filter(p => p.id !== id);
                    resolve();
                } else {
                    reject(new Error('Проект не найден'));
                }
            }, 300);
        });
    },

    // Pages
    getPages: (projectId: string): Promise<Page[]> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                resolve(project?.pages || []);
            }, 200);
        });
    },

    createPage: (projectId: string, data: { title: string; route: string }): Promise<Page> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                if (!project) {
                    reject(new Error('Проект не найден'));
                    return;
                }
                const newPage: Page = {
                    id: generateId(),
                    title: data.title,
                    route: data.route,
                    components: [],
                    order: project.pages.length + 1,
                };
                project.pages.push(newPage);
                resolve(newPage);
            }, 300);
        });
    },

    deletePage: (projectId: string, pageId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                if (!project || !project.pages.find(p => p.id === pageId)) {
                    reject(new Error('Страница не найдена'));
                    return;
                }
                project.pages = project.pages.filter(p => p.id !== pageId);
                resolve();
            }, 300);
        });
    },

    // Components
    getComponents: (projectId: string, pageId: string): Promise<ComponentConfig[]> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                resolve(page?.components || []);
            }, 200);
        });
    },

    createComponent: (projectId: string, pageId: string, data: Partial<ComponentConfig>): Promise<ComponentConfig> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                if (!page) {
                    reject(new Error('Страница не найдена'));
                    return;
                }
                const newComponent: ComponentConfig = {
                    id: generateId(),
                    type: data.type || 'button',
                    props: data.props || {},
                    layout: data.layout || {x: 0, y: 0, w: 100, h: 100},
                };
                page.components.push(newComponent);
                resolve(newComponent);
            }, 300);
        });
    },

    updateComponent: (projectId: string, pageId: string, componentId: string, data: Partial<ComponentConfig>): Promise<ComponentConfig> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                const component = page?.components.find(c => c.id === componentId);
                if (!component) {
                    reject(new Error('Компонент не найден'));
                    return;
                }
                Object.assign(component, data);
                resolve(component);
            }, 300);
        });
    },

    deleteComponent: (projectId: string, pageId: string, componentId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const project = projects.find(p => p.id === projectId);
                const page = project?.pages.find(p => p.id === pageId);
                if (!page || !page.components.find(c => c.id === componentId)) {
                    reject(new Error('Компонент не найден'));
                    return;
                }
                page.components = page.components.filter(c => c.id !== componentId);
                resolve();
            }, 300);
        });
    },
};
