import { apiClient } from './api';
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

const serializeComponent = (component: EditorComponent, pageId: string): string =>
    JSON.stringify({ ...component, pageId });

const parseComponent = (
    element: BackendElement,
    _pageId: string
): EditorComponent | null => {
    if (!element.json) {
        return null;
    }

    try {
        const parsed = JSON.parse(element.json) as EditorComponent & { pageId?: string };
        const { pageId: _ignored, ...component } = parsed;
        return {
            ...component,
            id: parsed.id || element.id,
        };
    } catch {
        return null;
    }
};

export const elementService = {
    getByPageId: async (pageId: string): Promise<BackendElement[]> => {
        if (isMockEnabled) {
            return [];
        }

        const response = await apiClient.get<unknown>(`/elements/by-page-id/${pageId}`, {
            headers: { 'X-Skip-Error-Toast': 'true' },
        });

        return unwrapElementList(response.data);
    },

    create: async (
        pageId: string,
        json: string,
        options?: RequestOptions
    ): Promise<BackendElement> => {
        const payload = await apiClient.post<Record<string, unknown>>(
            '/elements',
            { projectId: pageId, json },
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
            { id: elementId, json },
            { headers: silentHeader(options) }
        );
    },

    delete: async (elementId: string, options?: RequestOptions): Promise<void> => {
        await apiClient.delete(`/elements/${elementId}`, {
            headers: silentHeader(options),
        });
    },

    parseComponentsFromElements: (elements: BackendElement[], pageId: string) => {
        return elements
            .map((element) => parseComponent(element, pageId))
            .filter((component): component is EditorComponent => Boolean(component));
    },

    syncProjectElements: async (pages: Page[]): Promise<Record<string, string>> => {
        if (isMockEnabled) {
            return {};
        }

        const idRemaps: Record<string, string> = {};

        for (const page of pages) {
            const serverElements = await elementService.getByPageId(page.id);
            const serverIds = new Set(serverElements.map((element) => element.id.toLowerCase()));
            const localIds = new Set(page.components.map((component) => component.id.toLowerCase()));

            for (const serverId of serverIds) {
                if (!localIds.has(serverId)) {
                    await elementService.delete(serverId, { skipErrorToast: true });
                }
            }

            for (const component of page.components) {
                const payload = serializeComponent(component, page.id);

                if (serverIds.has(component.id.toLowerCase())) {
                    await elementService.update(component.id, payload, { skipErrorToast: true });
                    continue;
                }

                const created = await elementService.create(page.id, payload, { skipErrorToast: true });
                if (created.id && created.id !== component.id) {
                    idRemaps[component.id] = created.id;
                }
            }
        }

        return idRemaps;
    },
};
