import type { Page } from '@/types';

export interface ProjectMeta {
    navigationType: 'sidebar' | 'topbar';
    pages: Array<Omit<Page, 'components'>>;
}

const STORAGE_KEY = 'builder_crm_project_meta';

const readAll = (): Record<string, ProjectMeta> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) as Record<string, ProjectMeta> : {};
    } catch {
        return {};
    }
};

const writeAll = (data: Record<string, ProjectMeta>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const projectMetaService = {
    get(projectId: string): ProjectMeta | null {
        return readAll()[projectId] ?? null;
    },

    getNavigationType(projectId: string): 'sidebar' | 'topbar' | null {
        return readAll()[projectId]?.navigationType ?? null;
    },

    setNavigationType(projectId: string, navigationType: 'sidebar' | 'topbar'): void {
        const all = readAll();
        const existing = all[projectId];
        all[projectId] = {
            navigationType,
            pages: existing?.pages ?? [],
        };
        writeAll(all);
    },

    removeNavigationOverride(projectId: string): void {
        const all = readAll();
        delete all[projectId];
        writeAll(all);
    },

    set(projectId: string, meta: ProjectMeta): void {
        const all = readAll();
        all[projectId] = meta;
        writeAll(all);
    },

    delete(projectId: string): void {
        const all = readAll();
        delete all[projectId];
        writeAll(all);
    },
};
