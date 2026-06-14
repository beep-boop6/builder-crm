import type { EditorComponent } from '@/store/editorStore';
import { useComponentStore } from '@/store/componentStore';
import { clampComponentSize } from '@/utils/componentMinSize';

export const TEMPLATE_SECTION_GAP = 16;

const getDefinition = (type: string) => useComponentStore.getState().getComponentDefinition(type);

const overlaps = (a: EditorComponent, b: EditorComponent): boolean =>
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;

export const clampTemplateComponents = (
    components: EditorComponent[]
): EditorComponent[] =>
    components.map((component) => ({
        ...component,
        ...clampComponentSize(component, getDefinition(component.type)),
    }));

/** Сдвигает перекрывающиеся компоненты вниз с учётом минимального зазора. */
export const resolveTemplateOverlaps = (
    components: EditorComponent[],
    gap = TEMPLATE_SECTION_GAP
): EditorComponent[] => {
    const sorted = [...components].sort((left, right) => {
        if (left.y !== right.y) {
            return left.y - right.y;
        }
        return left.x - right.x;
    });

    const placed = sorted.map((component) => ({ ...component }));

    for (let index = 0; index < placed.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < placed.length; otherIndex += 1) {
            const anchor = placed[index];
            const candidate = placed[otherIndex];

            if (!overlaps(anchor, candidate)) {
                continue;
            }

            placed[otherIndex] = {
                ...candidate,
                y: anchor.y + anchor.height + gap,
            };
        }
    }

    return placed;
};

export const normalizeTemplateComponents = (
    components: EditorComponent[]
): EditorComponent[] => {
    let normalized = clampTemplateComponents(components);

    for (let pass = 0; pass < components.length; pass += 1) {
        const next = resolveTemplateOverlaps(normalized);
        const changed = next.some((component, index) =>
            component.y !== normalized[index]?.y
            || component.width !== normalized[index]?.width
            || component.height !== normalized[index]?.height
        );
        normalized = next;
        if (!changed) {
            break;
        }
    }

    return normalized;
};
