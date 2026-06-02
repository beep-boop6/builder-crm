import { apiClient } from './api';
import { mockApi } from './mockApi';
import { isMockEnabled } from '@/config/env';
import type { Page } from '@/types';
import { titleToRoute } from '@/utils/pageRoute';

type RawPage = {
    id?: string;
    Id?: string;
    name?: string;
    Name?: string;
    title?: string;
    Title?: string;
    route?: string;
    Route?: string;
    projectId?: string;
    ProjectId?: string;
    createdAt?: string;
    CreatedAt?: string;
};

const mapPage = (raw: RawPage, order: number): Page => {
    const title = String(raw.title ?? raw.Title ?? raw.name ?? raw.Name ?? 'Страница');
    return {
        id: String(raw.id ?? raw.Id ?? ''),
        title,
        route: raw.route ?? raw.Route ?? titleToRoute(title),
        components: [],
        order,
    };
};

const unwrapPageList = (payload: unknown): Page[] => {
    if (Array.isArray(payload)) {
        return payload.map((page, index) => mapPage(page as RawPage, index + 1));
    }

    const wrapped = payload as { pages?: RawPage[]; Pages?: RawPage[] } | undefined;
    const pages = wrapped?.pages ?? wrapped?.Pages ?? [];
    return pages.map((page, index) => mapPage(page, index + 1));
};

export const pageService = {
    getByProject: (projectId: string): Promise<Page[]> => {
        if (isMockEnabled) {
            return mockApi.getPages(projectId);
        }

        return apiClient
            .get<unknown>(`/pages/by-project-id/${projectId}`, {
                headers: { 'X-Skip-Error-Toast': 'true' },
            })
            .then((response) => unwrapPageList(response.data));
    },

    create: (projectId: string, data: { title: string; route: string }): Promise<Page> => {
        if (isMockEnabled) {
            return mockApi.createPage(projectId, data);
        }

        return apiClient
            .post<RawPage>('/pages', {
                projectId,
                name: data.title,
            })
            .then((response) => mapPage(response.data, 1));
    },

    rename: (pageId: string, title: string): Promise<void> => {
        if (isMockEnabled) {
            return mockApi.getPages('').then(() => undefined);
        }

        return apiClient
            .put(`/pages/${pageId}`, { name: title })
            .then(() => undefined);
    },

    update: (projectId: string, pageId: string, data: Partial<{ title: string; route: string }>) => {
        if (isMockEnabled) {
            return mockApi.getPages(projectId).then((pages) => {
                const page = pages.find((item) => item.id === pageId);
                if (page && data.title) {
                    page.title = data.title;
                }
                if (page && data.route) {
                    page.route = data.route;
                }
                return page;
            });
        }

        if (data.title) {
            return pageService.rename(pageId, data.title);
        }

        return Promise.resolve(undefined);
    },

    delete: (pageId: string): Promise<void> => {
        if (isMockEnabled) {
            return mockApi.deletePage('', pageId);
        }

        return apiClient.delete(`/pages/${pageId}`).then(() => undefined);
    },
};
