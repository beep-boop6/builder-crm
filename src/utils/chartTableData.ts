import type { EditorComponent } from '@/store/editorStore';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
import type { DataRow } from '@/utils/dataValidation';
import { resolveTableRows } from '@/utils/tableColumns';

const mergeFilters = (
    canvasComponents: EditorComponent[],
    chartComponentId: string,
    tableComponentId: string
) => {
    const seen = new Set<string>();
    const merged = [
        ...collectFiltersForTarget(canvasComponents, chartComponentId),
        ...collectFiltersForTarget(canvasComponents, tableComponentId),
    ].filter((filter) => {
        const key = `${filter.filterType}|${filter.fieldKey}|${filter.value}|${filter.valueTo ?? ''}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
    return merged;
};

export const resolveChartRowsFromTable = (
    canvasComponents: EditorComponent[],
    tableComponentId: string,
    chartComponentId: string,
    sourceRows?: DataRow[] | null
): DataRow[] => {
    const table = canvasComponents.find(
        (component) => component.id === tableComponentId && component.type === 'table'
    );
    if (!table) {
        return [];
    }

    const rawRows = resolveTableRows(table, sourceRows);
    const filters = mergeFilters(canvasComponents, chartComponentId, tableComponentId);
    return applyFiltersToRows(rawRows, filters);
};

export const getTableComponentById = (
    canvasComponents: EditorComponent[],
    tableComponentId: string | undefined
): EditorComponent | undefined => {
    if (!tableComponentId) {
        return undefined;
    }
    return canvasComponents.find(
        (component) => component.id === tableComponentId && component.type === 'table'
    );
};
