import type { EditorComponent } from '@/store/editorStore';

export interface FilterMinSize {
    minWidth: number;
    minHeight: number;
}

export const FILTER_PADDING_X = 12;
export const FILTER_PADDING_TOP = 10;
export const FILTER_PADDING_BOTTOM = 10;
/** Дополнительный зазор под последним полем при минимальной высоте. */
export const FILTER_MIN_BOTTOM_EXTRA = 8;
export const FILTER_ROW_GAP = 6;

export const FILTER_HEADER_HEIGHT = 15;
export const FILTER_CONTROL_HEIGHT = 24;
export const FILTER_HINT_HEIGHT = 15;

export const FILTER_MIN_CONTROL_WIDTH = 140;
const FILTER_BINDING_BADGE_WIDTH = 72;
const FILTER_HEADER_GAP = 8;

type FilterType = 'status' | 'date' | 'field' | string;

const estimateTextWidth = (text: string, charWidth = 7.5): number =>
    Math.ceil(text.trim().length * charWidth);

const getFilterProps = (component: EditorComponent) => {
    const props = component.props ?? {};
    return {
        filterType: (props.filterType as FilterType) || 'status',
        fieldKey: String(props.fieldKey ?? ''),
        label: String(props.label ?? 'Фильтр'),
        hasTarget: ((props.targetComponentIds as string[] | undefined) ?? []).length > 0,
    };
};

/** Высота видимых блоков фильтра + вертикальные отступы и промежутки. */
export const calculateFilterContentHeight = (
    props: ReturnType<typeof getFilterProps>
): number => {
    const sectionHeights: number[] = [FILTER_HEADER_HEIGHT];

    sectionHeights.push(props.hasTarget ? FILTER_CONTROL_HEIGHT : FILTER_HINT_HEIGHT);

    if (props.fieldKey) {
        if (props.filterType === 'date') {
            sectionHeights.push(FILTER_CONTROL_HEIGHT * 2 + FILTER_ROW_GAP);
        } else {
            sectionHeights.push(FILTER_CONTROL_HEIGHT);
        }
    }

    const sectionsHeight = sectionHeights.reduce((sum, height) => sum + height, 0);
    const gapsHeight = Math.max(0, sectionHeights.length - 1) * FILTER_ROW_GAP;

    return FILTER_PADDING_TOP
        + FILTER_PADDING_BOTTOM
        + FILTER_MIN_BOTTOM_EXTRA
        + sectionsHeight
        + gapsHeight;
};

/** Минимальная ширина под заголовок и самое широкое поле. */
export const calculateFilterContentWidth = (
    props: ReturnType<typeof getFilterProps>,
    includeBindingBadge = true
): number => {
    const headerWidth =
        estimateTextWidth(props.label)
        + (includeBindingBadge ? FILTER_HEADER_GAP + FILTER_BINDING_BADGE_WIDTH : 0);

    const controlLabels = [
        'Колонка таблицы',
        'Значение',
        'Значение для поиска',
        'Привяжите фильтр к таблице',
    ];
    const widestControlLabel = Math.max(...controlLabels.map((text) => estimateTextWidth(text, 6.5)));

    const controlWidth = Math.max(
        FILTER_MIN_CONTROL_WIDTH,
        widestControlLabel + 36,
        props.filterType === 'date' && props.fieldKey ? 168 : 0
    );

    return FILTER_PADDING_X * 2 + Math.max(headerWidth, controlWidth);
};

export const getFilterMinSize = (
    component: EditorComponent,
    options?: { includeBindingBadge?: boolean }
): FilterMinSize => {
    const props = getFilterProps(component);
    const includeBindingBadge = options?.includeBindingBadge ?? true;

    return {
        minWidth: calculateFilterContentWidth(props, includeBindingBadge),
        minHeight: calculateFilterContentHeight(props),
    };
};
