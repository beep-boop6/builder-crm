import type { EditorComponent } from '@/store/editorStore';
import type { ComponentDefinition } from '@/store/componentStore';
import type { FormFieldDefinition, FormMode } from '@/types/form';
import { getComponentMinSize } from '@/utils/componentMinSize';

export const TZ_DEFAULT_FORM_FIELDS: FormFieldDefinition[] = [
    { name: 'header', label: 'Заголовок', type: 'text', required: true, placeholder: 'Заголовок' },
    { name: 'value1', label: 'Значение', type: 'text', placeholder: '' },
];

/** Скругление контейнера поиска (как у Ant Design Input large). */
export const SEARCH_FORM_BORDER_RADIUS = 8;

/** Высота поля поиска (Ant Design Input large). */
export const SEARCH_INPUT_HEIGHT = 40;
export const SEARCH_COMPACT_MIN_WIDTH = 160;

export const MIN_FORM_FIELD_WIDTH = 80;
export const MAX_FORM_FIELD_WIDTH = 720;

const PADDING_Y = 24;
const FIELD_ROW_HEIGHT = 54;
const FIELD_GAP = 10;
const SUBMIT_ROW_HEIGHT = 36;

export const isFormSearchMode = (props: Record<string, unknown> | undefined): boolean =>
    (props?.formMode as FormMode) === 'search';

export interface SearchFormMetrics {
    fitContent: boolean;
    padding: number;
    height: number;
    minWidth: number;
    barWidth: number;
}

/** Размеры формы поиска: контейнер = поле, фон задаётся рамкой компонента. */
export const resolveSearchFormMetrics = (componentWidth: number): SearchFormMetrics => {
    const width = Math.max(SEARCH_COMPACT_MIN_WIDTH, componentWidth);
    return {
        fitContent: true,
        padding: 0,
        height: SEARCH_INPUT_HEIGHT,
        minWidth: SEARCH_COMPACT_MIN_WIDTH,
        barWidth: width,
    };
};

/** Ширина строки поиска внутри компонента. */
export const getSearchBarDisplayWidth = (componentWidth: number): number =>
    resolveSearchFormMetrics(componentWidth).barWidth;

export interface FormSearchResizeConstraints {
    fixedHeight: number;
    minWidth: number;
    lockHeight: boolean;
}

export const getFormSearchResizeConstraints = (componentWidth: number): FormSearchResizeConstraints => {
    const metrics = resolveSearchFormMetrics(componentWidth);
    return {
        fixedHeight: metrics.height,
        minWidth: metrics.minWidth,
        lockHeight: true,
    };
};

export const clampSearchFormDimensions = (width: number): { width: number; height: number } => {
    const metrics = resolveSearchFormMetrics(width);
    return {
        width: Math.max(metrics.minWidth, width),
        height: metrics.height,
    };
};

export const getWidestFormFieldWidth = (fields: FormFieldDefinition[]): number =>
    Math.max(MIN_FORM_FIELD_WIDTH, ...fields.map((field) => field.fieldWidth ?? 0));

export const calculateFormContentHeight = (params: {
    formMode: FormMode;
    fields: FormFieldDefinition[];
    width: number;
}): number => {
    if (params.formMode === 'search') {
        return resolveSearchFormMetrics(params.width).height;
    }

    const contentFields = params.fields.filter((field) => field.type !== 'submit');
    const fieldCount = Math.max(contentFields.length, 1);

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
        return resolveSearchFormMetrics(component.width).height;
    }

    const fields = getFormFieldsFromProps(props);
    const contentHeight = calculateFormContentHeight({
        formMode,
        fields,
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
        const { width, height } = clampSearchFormDimensions(component.width);
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
