import type { Page } from '@/types';
import { pageService } from './pageService';

export type PageSyncResult = {
    pages: Page[];
    pageIdRemaps: Record<string, string>;
};

/**
 * Aligns local pages with backend: create missing, rename changed, delete removed.
 */
export const syncProjectPages = async (
    projectId: string,
    localPages: Page[]
): Promise<PageSyncResult> => {
    const serverPages = await pageService.getByProject(projectId);
    const pageIdRemaps: Record<string, string> = {};

    const serverById = new Map(serverPages.map((page) => [page.id.toLowerCase(), page]));
    const localById = new Map(localPages.map((page) => [page.id.toLowerCase(), page]));

    for (const serverPage of serverPages) {
        if (!localById.has(serverPage.id.toLowerCase())) {
            await pageService.delete(serverPage.id);
        }
    }

    const syncedPages: Page[] = [];

    for (const localPage of localPages) {
        const serverPage = serverById.get(localPage.id.toLowerCase());

        if (!serverPage) {
            const created = await pageService.create(projectId, {
                title: localPage.title,
                route: localPage.route,
            });
            pageIdRemaps[localPage.id] = created.id;
            syncedPages.push({
                ...localPage,
                id: created.id,
            });
            continue;
        }

        if (serverPage.title !== localPage.title) {
            await pageService.rename(localPage.id, localPage.title);
        }

        syncedPages.push({
            ...localPage,
            route: localPage.route || serverPage.route,
        });
    }

    return { pages: syncedPages, pageIdRemaps };
};
