import type { EditorComponent } from '@/store/editorStore';
import type { ComponentDefinition } from '@/store/componentStore';
import { getComponentMinSize } from '@/utils/componentMinSize';
import {
    clampSearchFormDimensions,
    getFormSearchResizeConstraints,
    isFormSearchMode,
} from '@/utils/formLayout';

export interface ComponentResizeBounds {
    minWidth: number;
    minHeight: number;
    maxWidth?: number;
    maxHeight?: number;
    lockHeight: boolean;
    horizontalOnly: boolean;
}

export const getComponentResizeBounds = (
    component: EditorComponent,
    definition?: ComponentDefinition
): ComponentResizeBounds => {
    if (component.type === 'form' && isFormSearchMode(component.props)) {
        const search = getFormSearchResizeConstraints(component.props);
        return {
            minWidth: search.minWidth,
            minHeight: search.fixedHeight,
            maxWidth: search.maxWidth,
            maxHeight: search.fixedHeight,
            lockHeight: true,
            horizontalOnly: true,
        };
    }

    const { minWidth, minHeight } = getComponentMinSize(component, definition);

    return {
        minWidth,
        minHeight,
        lockHeight: false,
        horizontalOnly: false,
    };
};

export const clampComponentAfterResize = (
    component: EditorComponent,
    width: number,
    height: number,
    definition?: ComponentDefinition
): { width: number; height: number } => {
    if (component.type === 'form' && isFormSearchMode(component.props)) {
        return clampSearchFormDimensions(width, component.props);
    }

    const { minWidth, minHeight } = getComponentMinSize(component, definition);
    return {
        width: Math.max(minWidth, width),
        height: Math.max(minHeight, height),
    };
};
