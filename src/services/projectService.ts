import { mockApi } from './mockApi';
import { Project, Page } from '../types';
import { isMockEnabled } from '@/config/env';
import { requestWithFallback } from './api';
import { elementService } from './elementService';
import { pageService } from './pageService';
import { syncProjectPages } from './projectSyncService';
import { fromBackendNavigation, toBackendNavigation } from '@/utils/backendNavigation';

type RawProject = Partial<Project> & {
    Id?: string;
    Name?: string;
    NavigationType?: unknown;
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

const applyComponentIdRemaps = (pages: Page[], idRemaps: Record<string, string>): Page[] => {
    if (Object.keys(idRemaps).length === 0) {
        return pages;
    }

    return pages.map((page) => ({
        ...page,
        components: page.components.map((component) => ({
            ...component,
            id: idRemaps[component.id] ?? component.id,
        })),
    }));
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
                throw new Error('Project not found');
            }
            return project;
        }

        const rawProject = await requestWithFallback<RawProject>({
            method: 'GET',
            paths: [`/projects/${id}`],
        });

        const project = mapProject(rawProject);
        const pages = await loadProjectPages(project);

        return {
            ...project,
            pages,
        };
    },

    create: async (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        if (isMockEnabled) {
            return mockApi.createProject(data);
        }

        const created = await requestWithFallback<RawProject, { name: string; navigationType: string }>({
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

        const { pages: syncedPages } = await syncProjectPages(id, nextPages);

        const componentIdRemaps = await elementService.syncProjectElements(syncedPages);
        const finalPages = applyComponentIdRemaps(syncedPages, componentIdRemaps);

        return {
            ...current,
            ...data,
            name: nextName,
            navigationType: data.navigationType ?? current.navigationType,
            pages: finalPages,
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
};
