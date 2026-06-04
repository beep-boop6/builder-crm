import type { EditorComponent } from '@/store/editorStore';

export const dedupeComponentsById = (components: EditorComponent[]): EditorComponent[] => {
    const byId = new Map<string, EditorComponent>();
    for (const component of components) {
        if (component.id) {
            byId.set(component.id, component);
        }
    }
    return Array.from(byId.values());
};
