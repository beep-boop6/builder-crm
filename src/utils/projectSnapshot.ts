import type { Page } from '@/types';
import type { EditorComponent } from '@/store/editorStore';

export const mergeCurrentPageComponents = (
    pages: Page[],
    currentPageId: string | null,
    components: EditorComponent[],
): Page[] =>
    pages.map((page) =>
        page.id === currentPageId
            ? { ...page, components: components.map((component) => ({ ...component })) }
            : { ...page, components: page.components.map((component) => ({ ...component })) },
    );
