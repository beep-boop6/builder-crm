import {mockApi} from './mockApi';
import {Project, Page} from '../types';
import { isMockEnabled } from '@/config/env';
import { requestWithFallback } from './api';
import { elementService } from './elementService';
import { projectMetaService } from './projectMetaService';
import { generateGuid } from '@/utils';

type RawProject = Partial<Project> & {
    Id?: string;
    Name?: string;
    NavigationType?: unknown;
    Elements?: unknown[];
    elements?: unknown[];
};

const mapNavigationType = (value: unknown): 'sidebar' | 'topbar' => {
    if (value === 'topbar' || value === 1 || value === 'Topbar') {
        return 'topbar';
    }
    return 'sidebar';
};

const mapProject = (input: RawProject): Project => ({
    id: String(input.id ?? input.Id ?? ''),
    name: String(input.name ?? input.Name ?? 'Без названия'),
    navigationType: mapNavigationType(input.navigationType ?? input.NavigationType),
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

const extractElementsFromProject = (input: RawProject) => {
    const rawElements = input.elements ?? input.Elements ?? [];
    return rawElements.map((element) => {
        const item = element as Record<string, unknown>;
        return {
            id: String(item.id ?? item.Id ?? ''),
            json: (item.json ?? item.Json ?? null) as string | null,
        };
    });
};

const buildPagesFromElements = (
    projectId: string,
    navigationType: 'sidebar' | 'topbar',
    elements: Array<{ id: string; json: string | null }>
): { navigationType: 'sidebar' | 'topbar'; pages: Page[] } => {
    const parsedComponents = elementService.parseComponentsFromElements(elements);
    const meta = projectMetaService.get(projectId);

    if (meta?.pages?.length) {
        const pages = meta.pages.map((page) => ({
            ...page,
            components: parsedComponents
                .filter((component) => (component.pageId ?? 'default') === page.id)
                .map(({ pageId: _pageId, ...component }) => component),
        }));

        return {
            navigationType: meta.navigationType ?? navigationType,
            pages,
        };
    }

    const defaultPage: Page = {
        id: 'default',
        title: 'Главная',
        route: '/',
        components: parsedComponents.map(({ pageId: _pageId, ...component }) => component),
        order: 1,
    };

    return {
        navigationType,
        pages: [defaultPage],
    };
};

const enrichProject = async (project: Project, rawProject?: RawProject): Promise<Project> => {
    if (isMockEnabled) {
        return project;
    }

    const embeddedElements = rawProject ? extractElementsFromProject(rawProject) : [];
    const elements = embeddedElements.length > 0
        ? embeddedElements
        : await elementService.getByProject(project.id);

    const { navigationType, pages } = buildPagesFromElements(
        project.id,
        project.navigationType,
        elements
    );

    return {
        ...project,
        navigationType,
        pages,
    };
};

const createDefaultMeta = (): Page[] => ([
    {
        id: generateGuid(),
        title: 'Главная',
        route: '/',
        components: [],
        order: 1,
    },
]);

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
        return enrichProject(project, rawProject);
    },

    create: async (data: { name: string; navigationType: 'sidebar' | 'topbar' }): Promise<Project> => {
        if (isMockEnabled) {
            return mockApi.createProject(data);
        }

        const created = await requestWithFallback<RawProject, { name: string }>({
            method: 'POST',
            paths: ['/projects'],
            data: { name: data.name },
        });

        const project = mapProject({
            ...created,
            navigationType: data.navigationType,
        });

        const pages = createDefaultMeta();
        projectMetaService.set(project.id, {
            navigationType: data.navigationType,
            pages: pages.map(({ components: _components, ...page }) => page),
        });

        return {
            ...project,
            pages,
        };
    },

    update: async (id: string, data: Partial<Project>): Promise<Project> => {
        if (isMockEnabled) {
            return mockApi.updateProject(id, data);
        }

        const current = await projectService.getById(id);
        const nextPages = data.pages ?? current.pages;

        projectMetaService.set(id, {
            navigationType: data.navigationType ?? current.navigationType,
            pages: nextPages.map(({ components: _components, ...page }) => page),
        });

        return {
            ...current,
            ...data,
            pages: nextPages,
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

        projectMetaService.delete(id);
    },
};
