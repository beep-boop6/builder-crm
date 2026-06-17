import { mockApi } from './mockApi';
import { Project, Page } from '../types';
import { backendBaseUrl, isMockEnabled } from '@/config/env';
import { requestWithFallback } from './api';
import { elementService } from './elementService';
import { pageService } from './pageService';
import { signalrService } from './signalrService';
import { syncProjectPages } from './projectSyncService';
import { projectMetaService } from './projectMetaService';
import { cloneTemplatePagesForProject } from '@/utils/templateClone';
import type { AxiosError } from 'axios';
import {
    fromBackendNavigation,
    toBackendNavigation,
    type BackendNavigationType,
} from '@/utils/backendNavigation';

type RawProject = Partial<Project> & {
    Id?: string;
    Name?: string;
    NavigationType?: unknown;
};

const applyNavigationOverride = (project: Project): Project => {
    const navigationOverride = projectMetaService.getNavigationType(project.id);
    if (!navigationOverride) {
        return project;
    }
    return { ...project, navigationType: navigationOverride };
};

const mapProject = (input: RawProject): Project => ({
    id: String(input.id ?? input.Id ?? ''),
    name: String(input.name ?? input.Name ?? 'Без названия'),
    navigationType: fromBackendNavigation(input.navigationType ?? input.NavigationType),
    pages: input.pages ?? [],
    components: input.components ?? [],
    updatedAt: input.updatedAt,
    createdAt: typeof input.createdAt === 'number'
        ? input.createdAt
        : input.createdAt
            ? Date.parse(String(input.createdAt))
            : undefined,
});

const unwrapProjectList = (payload: unknown): Project[] => {
    if (Array.isArray(payload)) {
        return payload.map((project) => mapProject(project as RawProject));
    }

    const wrapped = payload as { projects?: unknown[]; Projects?: unknown[] } | undefined;
    const projects = wrapped?.projects ?? wrapped?.Projects ?? [];
    return projects.map((project) => mapProject(project as RawProject));
};

const loadProjectPages = async (project: Project): Promise<Page[]> => {
    let pages = await pageService.getByProject(project.id);

    if (pages.length === 0) {
        const defaultPage = await pageService.create(project.id, {
            title: 'Главная',
            route: '/',
        });
        pages = [defaultPage];
    }

    const pagesWithComponents: Page[] = [];

    for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const elements = await elementService.getByPageId(page.id);
        const components = elementService.parseComponentsFromElements(elements, page.id);

        pagesWithComponents.push({
            ...page,
            components,
            order: index + 1,
        });
    }

    return pagesWithComponents;
};

export const projectService = {
    getAll: (): Promise<Project[]> => {
        return isMockEnabled
            ? mockApi.getProjects()
            : requestWithFallback<unknown>({
                method: 'GET',
                paths: ['/projects'],
            }).then(unwrapProjectList);
    },

    getById: async (id: string): Promise<Project> => {
        if (isMockEnabled) {
            const project = await mockApi.getProject(id);
            if (!project) {
                throw new Error('Проект не найден');
            }
            return project;
        }

        const rawProject = await requestWithFallback<RawProject>({
            method: 'GET',
            paths: [`/projects/${id}`],
        });

        const project = mapProject(rawProject);
        const pages = await loadProjectPages(project);

        return applyNavigationOverride({
            ...project,
            pages,
        });
    },

    create: async (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        if (isMockEnabled) {
            return mockApi.createProject(data);
        }

        const created = await requestWithFallback<
            RawProject,
            { name: string; navigationType: BackendNavigationType }
        >({
            method: 'POST',
            paths: ['/projects'],
            data: {
                name: data.name,
                navigationType: toBackendNavigation(data.navigationType),
            },
        });

        const project = mapProject({
            ...created,
            navigationType: data.navigationType,
        });

        const defaultPage = await pageService.create(project.id, {
            title: 'Главная',
            route: '/',
        });

        return {
            ...project,
            pages: [{ ...defaultPage, components: [], order: 1 }],
        };
    },

    update: async (id: string, data: Partial<Project>): Promise<Project> => {
        if (isMockEnabled) {
            return mockApi.updateProject(id, data);
        }

        const current = await projectService.getById(id);
        const nextPages = data.pages ?? current.pages;
        const nextName = data.name ?? current.name;
        const nextNavigationType = data.navigationType ?? current.navigationType;

        if (nextName !== current.name) {
            await requestWithFallback<unknown, { id: string; json: string }>({
                method: 'PUT',
                paths: [`/projects/${id}/set-name`],
                data: {
                    id,
                    json: nextName,
                },
            });
        }

        if (data.navigationType && data.navigationType !== current.navigationType) {
            try {
                await requestWithFallback<unknown, { NavigationType: BackendNavigationType }>({
                    method: 'PUT',
                    paths: [`/projects/${id}/set-navigation`],
                    data: {
                        NavigationType: toBackendNavigation(data.navigationType),
                    },
                });
                projectMetaService.removeNavigationOverride(id);
            } catch (error) {
                const status = (error as AxiosError).response?.status;
                if (status === 404 || status === 405) {
                    projectMetaService.setNavigationType(id, data.navigationType);
                } else {
                    throw error;
                }
            }
        }

        const { pages: syncedPages } = data.pages
            ? await syncProjectPages(id, nextPages)
            : { pages: current.pages };

        return {
            ...current,
            ...data,
            name: nextName,
            navigationType: nextNavigationType,
            pages: syncedPages,
        };
    },

    delete: async (id: string): Promise<void> => {
        if (isMockEnabled) {
            await mockApi.deleteProject(id);
            return;
        }

        await requestWithFallback<void>({
            method: 'DELETE',
            paths: [`/projects/${id}`],
        });
    },

    /**
     * Применяет шаблон к уже созданному проекту:
     * 1) привязывает страницы шаблона к реальным id страниц на бэкенде;
     * 2) синхронизирует метаданные страниц через REST;
     * 3) сохраняет компоненты через SignalR SaveElementPositionAsync.
     */
    applyTemplate: async (
        projectId: string,
        templatePages: Page[],
        defaultPageId: string
    ): Promise<Project> => {
        const pages = cloneTemplatePagesForProject(templatePages, defaultPageId);

        if (isMockEnabled) {
            return mockApi.updateProject(projectId, { pages });
        }

        // SignalR нужен до открытия редактора — компоненты шаблона пишутся через хаб.
        const connected = await signalrService.ensureConnected(30000);
        if (!connected) {
            throw new Error(
                `Не удалось подключиться к SignalR (${backendBaseUrl}/crmConstructorHub). Проверьте, что бэкенд запущен.`
            );
        }

        const updated = await projectService.update(projectId, { pages });

        await elementService.syncPagesViaHub(updated.pages);

        return updated;
    },
};
