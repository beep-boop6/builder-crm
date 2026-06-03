import type { EditorComponent } from '@/store/editorStore';
import type { DataRow } from '@/utils/dataValidation';

export type FilterType = 'status' | 'date' | 'field';

export interface ActiveFilter {
    filterType: FilterType;
    fieldKey: string;
    value: string;
    valueTo?: string;
}

const getTargetIds = (props: Record<string, unknown> | undefined): string[] => {
    const raw = props?.targetComponentIds;
    return Array.isArray(raw) ? raw.map(String) : [];
};

export const collectFiltersForTarget = (
    canvasComponents: EditorComponent[],
    targetComponentId: string
): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    canvasComponents.forEach((component) => {
        const props = component.props ?? {};

        if (component.type === 'filter') {
            const targets = getTargetIds(props);
            if (!targets.includes(targetComponentId)) {
                return;
            }
            const value = String(props.value ?? '').trim();
            if (!value) {
                return;
            }
            filters.push({
                filterType: (props.filterType as FilterType) || 'field',
                fieldKey: String(props.fieldKey ?? 'status'),
                value,
                valueTo: props.valueTo ? String(props.valueTo) : undefined,
            });
            return;
        }

        if (component.type === 'form') {
            const targets = getTargetIds(props);
            if (!targets.includes(targetComponentId)) {
                return;
            }

            if (props.formMode === 'search') {
                const searchValue = String(props.searchValue ?? '').trim();
                const fieldKey = String(
                    props.searchFieldKey ?? (props.fields as { name?: string }[] | undefined)?.[0]?.name ?? ''
                );
                if (!searchValue || !fieldKey) {
                    return;
                }
                filters.push({
                    filterType: 'field',
                    fieldKey,
                    value: searchValue,
                });
                return;
            }

            const formValues = props.appliedFormValues as Record<string, string> | undefined;
            if (!formValues) {
                return;
            }
            Object.entries(formValues).forEach(([fieldKey, rawValue]) => {
                const value = String(rawValue ?? '').trim();
                if (!value) {
                    return;
                }
                filters.push({
                    filterType: 'field',
                    fieldKey,
                    value,
                });
            });
        }
    });

    return filters;
};

export const applyFiltersToRows = (rows: DataRow[], filters: ActiveFilter[]): DataRow[] => {
    if (filters.length === 0) {
        return rows;
    }

    return rows.filter((row) =>
        filters.every((filter) => {
            const raw = row[filter.fieldKey];
            const cell = raw === null || raw === undefined ? '' : String(raw).toLowerCase();
            const value = filter.value.toLowerCase();

            if (filter.filterType === 'date') {
                if (filter.valueTo) {
                    const to = filter.valueTo.toLowerCase();
                    return cell >= value && cell <= to;
                }
                return cell.includes(value);
            }

            if (filter.filterType === 'status') {
                return cell === value || cell.includes(value);
            }

            return cell.includes(value);
        })
    );
};

export const isCardComponentType = (type: string): boolean =>
    type === 'card' || type.startsWith('card-');

export const resolveCardVariant = (type: string): 'client' | 'deal' | 'summary' | 'kpi' => {
    if (type === 'card-deal') return 'deal';
    if (type === 'card-summary') return 'summary';
    if (type === 'card-kpi') return 'kpi';
    return 'client';
};
