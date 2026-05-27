import type { EditorComponent } from '@/store/editorStore';
import type { ComponentDefinition } from '@/store/componentStore';

export interface PageComponentListItem {
    id: string;
    order: number;
    label: string;
}

export const buildPageComponentLabels = (
    components: EditorComponent[],
    getDefinition: (type: string) => ComponentDefinition | undefined
): PageComponentListItem[] => {
    const typeCounts: Record<string, number> = {};

    return components.map((component, index) => {
        const definition = getDefinition(component.type);
        const baseName = definition?.name ?? (component.text?.trim() || component.type);
        typeCounts[component.type] = (typeCounts[component.type] ?? 0) + 1;

        return {
            id: component.id,
            order: index + 1,
            label: `${baseName} ${typeCounts[component.type]}`,
        };
    });
};
