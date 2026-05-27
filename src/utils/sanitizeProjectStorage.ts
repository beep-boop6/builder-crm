import type { Project } from '@/types';
import type { EditorComponent } from '@/store/editorStore';

const isInlineImage = (value: unknown): value is string =>
    typeof value === 'string' && (value.startsWith('data:') || value.length > 2048);

const sanitizeCardProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const next = { ...props };

    if (isInlineImage(next.photoUrl) && next.photoId) {
        next.photoUrl = '';
    }

    if (isInlineImage(next.photoUrl) && !next.photoId) {
        delete next.photoUrl;
    }

    if (isInlineImage(next.coverImageUrl)) {
        delete next.coverImageUrl;
    }

    return next;
};

export const sanitizeEditorComponent = (component: EditorComponent): EditorComponent => {
    if (component.type !== 'card' || !component.props) {
        return component;
    }

    return {
        ...component,
        props: sanitizeCardProps(component.props),
    };
};

export const sanitizeProjectsForStorage = (projects: Project[]): Project[] =>
    projects.map((project) => ({
        ...project,
        pages: (project.pages ?? []).map((page) => ({
            ...page,
            components: (page.components ?? []).map((component) => sanitizeEditorComponent(component)),
        })),
    }));
