import { apiClient } from './api';
import { isMockEnabled } from '@/config/env';
import type { EditorComponent } from '@/store/editorStore';
import type { Page } from '@/types';
import { dedupeComponentsById } from '@/utils/dedupeComponents';
import { signalrService } from './signalrService';

export interface BackendElement {
    id: string;
    json: string | null;
    lastModified?: string;
}

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

export const serializeComponent = (component: EditorComponent, pageId: string): string =>
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
    /** Только чтение при загрузке проекта. */
    getByPageId: async (pageId: string): Promise<BackendElement[]> => {
        if (isMockEnabled) {
            return [];
        }

        const response = await apiClient.get<unknown>(`/elements/by-page-id/${pageId}`, {
            headers: { 'X-Skip-Error-Toast': 'true' },
        });

        return unwrapElementList(response.data);
    },

    save: async (pageId: string, elementId: string, json: string): Promise<void> => {
        const ok = await signalrService.saveElementPosition(elementId, pageId, json);
        if (!ok) {
            throw new Error('Не удалось сохранить элемент через SignalR');
        }
    },

    delete: async (elementId: string): Promise<void> => {
        const ok = await signalrService.deleteElement(elementId);
        if (!ok) {
            throw new Error('Не удалось удалить элемент через SignalR');
        }
    },

    parseComponentsFromElements: (elements: BackendElement[], pageId: string) => {
        const components = elements
            .map((element) => parseComponent(element, pageId))
            .filter((component): component is EditorComponent => Boolean(component));
        return dedupeComponentsById(components);
    },

    /** Первичная выгрузка страниц с компонентами в БД (шаблон, импорт) — без REST diff. */
    syncPagesViaHub: async (pages: Page[]): Promise<void> => {
        if (isMockEnabled) {
            return;
        }

        if (!(await signalrService.ensureConnected())) {
            console.warn('elementService.syncPagesViaHub: нет подключения к хабу');
            return;
        }

        for (const page of pages) {
            for (const component of dedupeComponentsById(page.components)) {
                await elementService.save(page.id, component.id, serializeComponent(component, page.id));
            }
        }
    },
};
