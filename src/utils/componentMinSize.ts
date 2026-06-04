import type { EditorComponent } from '@/store/editorStore';
import type { ComponentDefinition } from '@/store/componentStore';
import { normalizeContactCardProps } from '@/utils/contactCardDefaults';
import {
    calculateFormContentHeight,
    getFormFieldsFromProps,
    getFormSearchResizeConstraints,
    getWidestFormFieldWidth,
    isFormSearchMode,
} from '@/utils/formLayout';
import type { FormMode } from '@/types/form';

export interface ComponentMinSize {
    minWidth: number;
    minHeight: number;
}

const ABSOLUTE_MIN_WIDTH = 48;
const ABSOLUTE_MIN_HEIGHT = 28;

const CARD_COVER_HEIGHT = 80;
const CARD_AVATAR_OVERLAP = 36;
const CARD_BODY_PADDING_TOP = 40;
const CARD_BODY_PADDING_BOTTOM = 16;
const CARD_HORIZONTAL_PADDING = 32;
const CARD_MIN_WIDTH = 240;

const estimateWrappedLines = (text: string, containerWidth: number, fontSize: number): number => {
    const trimmed = text.trim();
    if (!trimmed) {
        return 0;
    }

    const charsPerLine = Math.max(6, Math.floor((containerWidth - CARD_HORIZONTAL_PADDING) / (fontSize * 0.55)));
    return Math.max(1, Math.ceil(trimmed.length / charsPerLine));
};

const getCardMinSize = (component: EditorComponent): ComponentMinSize => {
    const contact = normalizeContactCardProps(component.props);
    const fontSize = component.fontSize ?? 14;
    const titleSize = fontSize + 4;
    const lineHeight = 1.45;
    const lineGap = 8;

    const phones = contact.phones.filter((phone) => phone.number.trim());

    let textLines = 1;
    if (contact.organization.trim()) textLines += 1;
    textLines += phones.length;
    if (contact.email.trim()) textLines += 1;
    textLines += estimateWrappedLines(contact.description, CARD_MIN_WIDTH, fontSize);

    const contentHeight =
        titleSize * lineHeight +
        Math.max(0, textLines - 1) * (fontSize * lineHeight + lineGap);

    const minHeight =
        CARD_COVER_HEIGHT +
        CARD_AVATAR_OVERLAP +
        CARD_BODY_PADDING_TOP +
        CARD_BODY_PADDING_BOTTOM +
        contentHeight;

    const longestLine = [
        contact.fullName,
        contact.organization,
        ...phones.map((phone) => (phone.label ? `${phone.label}: ${phone.number}` : phone.number)),
        contact.email,
    ]
        .map((value) => value.trim())
        .filter(Boolean)
        .reduce((max, value) => Math.max(max, value.length), 0);

    const minWidth = Math.max(
        CARD_MIN_WIDTH,
        CARD_HORIZONTAL_PADDING + Math.ceil(longestLine * fontSize * 0.58)
    );

    return { minWidth, minHeight: Math.ceil(minHeight) };
};

const getButtonMinSize = (component: EditorComponent): ComponentMinSize => {
    const fontSize = component.fontSize ?? 14;
    const text = component.text?.trim() || 'Кнопка';
    const horizontalPadding = 24;

    return {
        minWidth: Math.max(72, Math.ceil(text.length * fontSize * 0.62) + horizontalPadding),
        minHeight: Math.max(32, Math.ceil(fontSize * 1.8) + 12),
    };
};

const getTableMinSize = (component: EditorComponent, definition?: ComponentDefinition): ComponentMinSize => {
    const props = component.props ?? {};
    const customColumns = props.customColumns as Array<{ id: string; title: string }> | undefined;
    const columnMappings = props.columnMappings as Array<{ columnId: string; label?: string }> | undefined;
    const columnCount = customColumns?.length ?? columnMappings?.length ?? 3;

    const defaultWidth = definition?.defaultWidth ?? 400;
    const defaultHeight = definition?.defaultHeight ?? 300;

    return {
        minWidth: Math.max(200, Math.min(defaultWidth, columnCount * 72 + 24)),
        minHeight: Math.max(120, Math.round(defaultHeight * 0.45)),
    };
};

const getChartMinSize = (definition?: ComponentDefinition): ComponentMinSize => ({
    minWidth: Math.max(220, Math.round((definition?.defaultWidth ?? 400) * 0.55)),
    minHeight: Math.max(160, Math.round((definition?.defaultHeight ?? 300) * 0.55)),
});

const getFormMinSize = (component: EditorComponent, definition?: ComponentDefinition): ComponentMinSize => {
    const props = component.props ?? {};
    const formMode = (props.formMode as FormMode) || 'default';
    const layout = String(props.layout ?? 'vertical');
    const fields = getFormFieldsFromProps(props);
    if (isFormSearchMode(props)) {
        const search = getFormSearchResizeConstraints(component.width);
        return {
            minWidth: search.minWidth,
            minHeight: search.fixedHeight,
        };
    }

    const minHeight = calculateFormContentHeight({
        formMode,
        fields,
        layout,
        width: component.width,
    });

    const widestField = getWidestFormFieldWidth(fields);

    return {
        minWidth: Math.max(240, (definition?.defaultWidth ?? 400) * 0.6, widestField + 24),
        minHeight,
    };
};

const getGenericMinSize = (component: EditorComponent, definition?: ComponentDefinition): ComponentMinSize => {
    const fontSize = component.fontSize ?? 14;
    const text = component.text?.trim() || definition?.name || 'Элемент';

    return {
        minWidth: Math.max(
            definition ? Math.round(definition.defaultWidth * 0.45) : 80,
            Math.ceil(text.length * fontSize * 0.55) + 24
        ),
        minHeight: Math.max(
            definition ? Math.round(definition.defaultHeight * 0.4) : 40,
            Math.ceil(fontSize * 2) + 16
        ),
    };
};

export const getComponentMinSize = (
    component: EditorComponent,
    definition?: ComponentDefinition
): ComponentMinSize => {
    let size: ComponentMinSize;

    switch (component.type) {
        case 'card':
            size = getCardMinSize(component);
            break;
        case 'button':
            size = getButtonMinSize(component);
            break;
        case 'table':
            size = getTableMinSize(component, definition);
            break;
        case 'chart':
            size = getChartMinSize(definition);
            break;
        case 'form':
            size = getFormMinSize(component, definition);
            break;
        case 'filter':
            size = { minWidth: 200, minHeight: 64 };
            break;
        case 'card-deal':
            size = { minWidth: 240, minHeight: 120 };
            break;
        case 'card-summary':
            size = { minWidth: 240, minHeight: 140 };
            break;
        case 'card-kpi':
            size = { minWidth: 160, minHeight: 90 };
            break;
        default:
            size = getGenericMinSize(component, definition);
            break;
    }

    return {
        minWidth: Math.max(ABSOLUTE_MIN_WIDTH, size.minWidth),
        minHeight: Math.max(ABSOLUTE_MIN_HEIGHT, size.minHeight),
    };
};

export const clampComponentSize = (
    component: EditorComponent,
    definition?: ComponentDefinition
): Pick<EditorComponent, 'width' | 'height'> => {
    const { minWidth, minHeight } = getComponentMinSize(component, definition);

    return {
        width: Math.max(component.width, minWidth),
        height: Math.max(component.height, minHeight),
    };
};
