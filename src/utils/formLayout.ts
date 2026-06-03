import type { EditorComponent } from '@/store/editorStore';
import type { ComponentDefinition } from '@/store/componentStore';
import type { FormFieldDefinition, FormMode } from '@/types/form';
import { getComponentMinSize } from '@/utils/componentMinSize';

export const TZ_DEFAULT_FORM_FIELDS: FormFieldDefinition[] = [
    { name: 'text', label: 'Текст', type: 'text', placeholder: 'Введите текст' },
    { name: 'number', label: 'Число', type: 'number', placeholder: '0' },
    { name: 'date', label: 'Дата', type: 'date' },
    { name: 'select', label: 'Список', type: 'select', options: ['Вариант 1', 'Вариант 2', 'Вариант 3'] },
];

/** Фиксированная высота блока поиска (вертикальный ресайз отключён). */
export const SEARCH_FIXED_HEIGHT = 72;
export const SEARCH_MIN_WIDTH = 280;
export const SEARCH_MAX_WIDTH = 720;
export const DEFAULT_SEARCH_BAR_MAX_WIDTH = 560;
const SEARCH_HORIZONTAL_PADDING = 32;

const PADDING_Y = 24;
const FIELD_ROW_HEIGHT = 54;
const FIELD_GAP = 10;
const SUBMIT_ROW_HEIGHT = 36;

export const isFormSearchMode = (props: Record<string, unknown> | undefined): boolean =>
    (props?.formMode as FormMode) === 'search';

export const getSearchBarMaxWidth = (props: Record<string, unknown> | undefined): number => {
    const raw = props?.searchBarMaxWidth;
    return typeof raw === 'number' && raw > 0 ? raw : DEFAULT_SEARCH_BAR_MAX_WIDTH;
};

/** Ширина строки поиска внутри компонента (растёт с компонентом до потолка). */
export const getSearchBarDisplayWidth = (componentWidth: number, props?: Record<string, unknown>): number => {
    const cap = getSearchBarMaxWidth(props);
    const available = Math.max(160, componentWidth - SEARCH_HORIZONTAL_PADDING);
    return Math.min(available, cap);
};

export interface FormSearchResizeConstraints {
    fixedHeight: number;
    minWidth: number;
    maxWidth: number;
    barMaxWidth: number;
}

export const getFormSearchResizeConstraints = (
    props: Record<string, unknown> | undefined
): FormSearchResizeConstraints => ({
    fixedHeight: SEARCH_FIXED_HEIGHT,
    minWidth: SEARCH_MIN_WIDTH,
    maxWidth: SEARCH_MAX_WIDTH,
    barMaxWidth: getSearchBarMaxWidth(props),
});

export const clampSearchFormDimensions = (
    width: number,
    props?: Record<string, unknown>
): { width: number; height: number } => {
    const { minWidth, maxWidth, fixedHeight } = getFormSearchResizeConstraints(props);
    return {
        width: Math.min(maxWidth, Math.max(minWidth, width)),
        height: fixedHeight,
    };
};

export const calculateFormContentHeight = (params: {
    formMode: FormMode;
    fields: FormFieldDefinition[];
    layout: string;
    width: number;
}): number => {
    if (params.formMode === 'search') {
        return SEARCH_FIXED_HEIGHT;
    }

    const contentFields = params.fields.filter((field) => field.type !== 'submit');
    const fieldCount = Math.max(contentFields.length, 1);

    if (params.layout === 'horizontal') {
        const columnWidth = 160;
        const columns = Math.max(1, Math.floor((params.width - 24) / columnWidth));
        const rows = Math.ceil(fieldCount / columns);
        return PADDING_Y + rows * FIELD_ROW_HEIGHT + FIELD_GAP + SUBMIT_ROW_HEIGHT;
    }

    return (
        PADDING_Y
        + fieldCount * FIELD_ROW_HEIGHT
        + Math.max(0, fieldCount - 1) * FIELD_GAP
        + FIELD_GAP
        + SUBMIT_ROW_HEIGHT
    );
};

export const getFormFieldsFromProps = (
    props: Record<string, unknown> | undefined
): FormFieldDefinition[] => {
    const fields = props?.fields as FormFieldDefinition[] | undefined;
    if (Array.isArray(fields) && fields.length > 0) {
        return fields;
    }
    return TZ_DEFAULT_FORM_FIELDS;
};

export const resolveFormHeight = (
    component: Pick<EditorComponent, 'width' | 'height' | 'props' | 'type'>,
    definition?: ComponentDefinition
): number => {
    const props = component.props ?? {};
    const formMode = (props.formMode as FormMode) || 'default';

    if (formMode === 'search') {
        return SEARCH_FIXED_HEIGHT;
    }

    const layout = String(props.layout ?? 'vertical');
    const fields = getFormFieldsFromProps(props);
    const contentHeight = calculateFormContentHeight({
        formMode,
        fields,
        layout,
        width: component.width,
    });
    const { minHeight } = getComponentMinSize(
        { ...component, type: 'form' } as EditorComponent,
        definition
    );
    return Math.max(contentHeight, minHeight);
};

export const syncFormComponentHeight = (
    component: EditorComponent,
    updateComponent: (id: string, patch: Partial<EditorComponent>) => void,
    definition?: ComponentDefinition
): void => {
    if (component.type !== 'form') {
        return;
    }

    const props = component.props ?? {};
    if (isFormSearchMode(props)) {
        const { width, height } = clampSearchFormDimensions(component.width, props);
        if (component.height !== height || component.width !== width) {
            updateComponent(component.id, { width, height });
        }
        return;
    }

    const nextHeight = resolveFormHeight(component, definition);
    if (component.height !== nextHeight) {
        updateComponent(component.id, { height: nextHeight });
    }
};
