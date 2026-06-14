import type { EditorComponent } from '@/store/editorStore';
import { TABLE_ROW_ID_KEY } from '@/utils/dataMapping';
import type { DataRow } from '@/utils/dataValidation';

export type FilterType = 'status' | 'date' | 'field' | 'global';

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

/** Пропускаем фильтр, если в данных нет такой колонки — иначе таблица пустеет. */
const isFilterApplicable = (rows: DataRow[], fieldKey: string): boolean => {
    if (!fieldKey || rows.length === 0) {
        return false;
    }
    return rows.some((row) => Object.prototype.hasOwnProperty.call(row, fieldKey));
};

const rowMatchesFilter = (row: DataRow, filter: ActiveFilter): boolean => {
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
};

const rowMatchesGlobalSearch = (row: DataRow, query: string): boolean => {
    const needle = query.toLowerCase().trim();
    if (!needle) {
        return true;
    }

    return Object.entries(row).some(([key, raw]) => {
        if (key === TABLE_ROW_ID_KEY) {
            return false;
        }
        const cell = raw === null || raw === undefined ? '' : String(raw).toLowerCase();
        return cell.includes(needle);
    });
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
            const fieldKey = String(props.fieldKey ?? '').trim();
            if (!value || !fieldKey) {
                return;
            }
            filters.push({
                filterType: (props.filterType as FilterType) || 'field',
                fieldKey,
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
                const appliedSearch = String(props.appliedSearchValue ?? props.searchValue ?? '').trim();
                if (!appliedSearch) {
                    return;
                }
                filters.push({
                    filterType: 'global',
                    fieldKey: '',
                    value: appliedSearch,
                });
            }
            return;
        }
    });

    return filters;
};

export const applyFiltersToRows = (rows: DataRow[], filters: ActiveFilter[]): DataRow[] => {
    if (filters.length === 0) {
        return rows;
    }

    const globalFilters = filters.filter(
        (filter) => filter.filterType === 'global' && filter.value.trim()
    );
    const columnFilters = filters.filter((filter) => filter.filterType !== 'global');
    const applicableColumnFilters = columnFilters.filter((filter) =>
        isFilterApplicable(rows, filter.fieldKey)
    );

    if (globalFilters.length === 0 && applicableColumnFilters.length === 0) {
        return rows;
    }

    return rows.filter((row) => {
        const passesGlobal =
            globalFilters.length === 0
            || globalFilters.every((filter) => rowMatchesGlobalSearch(row, filter.value));
        const passesColumn =
            applicableColumnFilters.length === 0
            || applicableColumnFilters.every((filter) => rowMatchesFilter(row, filter));
        return passesGlobal && passesColumn;
    });
};

export const isCardComponentType = (type: string): boolean =>
    type === 'card' || type.startsWith('card-');

export const resolveCardVariant = (type: string): 'client' | 'deal' | 'summary' | 'kpi' => {
    if (type === 'card-deal') return 'deal';
    if (type === 'card-summary') return 'summary';
    if (type === 'card-kpi') return 'kpi';
    return 'client';
};
