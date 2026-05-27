import { apiClient, requestWithFallback, rootApiClient } from './api';
import { isMockEnabled } from '@/config/env';
import type { EditorComponent } from '@/store/editorStore';
import type { Page } from '@/types';

export interface BackendElement {
    id: string;
    json: string | null;
    lastModified?: string;
}

type RequestOptions = {
    skipErrorToast?: boolean;
};

const silentHeader = (options?: RequestOptions) => (
    options?.skipErrorToast ? { 'X-Skip-Error-Toast': 'true' } : undefined
);

const mapElement = (raw: Record<string, unknown>): BackendElement => ({
    id: String(raw.id ?? raw.Id ?? ''),
    json: (raw.json ?? raw.Json ?? null) as string | null,
    lastModified: (raw.lastModified ?? raw.LastModified) as string | undefined,
});

const unwrapElementList = (payload: unknown): BackendElement[] => {
    if (Array.isArray(payload)) {
        return payload.map((item) => mapElement(item as Record<string, unknown>));
    }

    const wrapped = payload as { elements?: unknown[]; Elements?: unknown[] } | undefined;
    const elements = wrapped?.elements ?? wrapped?.Elements ?? [];
    return elements.map((item) => mapElement(item as Record<string, unknown>));
};

const parseComponent = (element: BackendElement): (EditorComponent & { pageId?: string }) | null => {
    if (!element.json) {
        return null;
    }

    try {
        const parsed = JSON.parse(element.json) as EditorComponent & { pageId?: string };
        return {
            ...parsed,
            id: parsed.id || element.id,
        };
    } catch {
        return null;
    }
};

export const elementService = {
    getByProject: async (projectId: string): Promise<BackendElement[]> => {
        if (isMockEnabled) {
            return [];
        }

        try {
            const response = await rootApiClient.get<unknown>(`/by-project-id/${projectId}`, {
                headers: { 'X-Skip-Error-Toast': 'true' },
            });
            return unwrapElementList(response.data);
        } catch {
            const payload = await requestWithFallback<unknown>({
                method: 'GET',
                paths: [`/elements/by-project-id/${projectId}`],
            });
            return unwrapElementList(payload);
        }
    },

    create: async (
        projectId: string,
        json: string,
        options?: RequestOptions
    ): Promise<BackendElement> => {
        const payload = await apiClient.post<Record<string, unknown>>(
            '/elements',
            { projectId, json },
            { headers: silentHeader(options) }
        );

        return mapElement(payload.data);
    },

    update: async (
        elementId: string,
        json: string,
        options?: RequestOptions
    ): Promise<void> => {
        await apiClient.put(
            `/elements/${elementId}`,
            { json },
            { headers: silentHeader(options) }
        );
    },

    delete: async (elementId: string, options?: RequestOptions): Promise<void> => {
        await apiClient.delete(`/elements/${elementId}`, {
            headers: silentHeader(options),
        });
    },

    parseComponentsFromElements: (elements: BackendElement[]) => {
        return elements
            .map(parseComponent)
            .filter((component): component is EditorComponent & { pageId?: string } => Boolean(component));
    },

    syncProjectElements: async (
        projectId: string,
        pages: Page[]
    ): Promise<Record<string, string>> => {
        if (isMockEnabled) {
            return {};
        }

        const componentsWithPage = pages.flatMap((page) =>
            page.components.map((component) => ({
                ...component,
                pageId: page.id,
            }))
        );

        const serverElements = await elementService.getByProject(projectId);
        const serverIds = new Set(serverElements.map((element) => element.id.toLowerCase()));
        const localIds = new Set(componentsWithPage.map((component) => component.id.toLowerCase()));
        const idRemaps: Record<string, string> = {};

        for (const serverId of serverIds) {
            if (!localIds.has(serverId)) {
                await elementService.delete(serverId, { skipErrorToast: true });
            }
        }

        for (const component of componentsWithPage) {
            const payload = JSON.stringify(component);

            if (serverIds.has(component.id.toLowerCase())) {
                await elementService.update(component.id, payload, { skipErrorToast: true });
                continue;
            }

            const created = await elementService.create(projectId, payload, { skipErrorToast: true });
            if (created.id && created.id !== component.id) {
                idRemaps[component.id] = created.id;
            }
        }

        return idRemaps;
    },
};
