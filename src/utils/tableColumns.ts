import type { EditorComponent } from '@/store/editorStore';
import type { TableColumnMapping } from '@/types/data';
import { applyTableMapping } from '@/utils/dataMapping';
import type { DataRow } from '@/utils/dataValidation';

export type TableColumnOption = { id: string; title: string };

export { getTableRowId, TABLE_ROW_ID_KEY } from '@/utils/dataMapping';

export const getLinkedTableComponent = (
    canvasComponents: EditorComponent[],
    targetIds: string[]
): EditorComponent | undefined => {
    const tableId = targetIds.find((id) => {
        const component = canvasComponents.find((item) => item.id === id);
        return component?.type === 'table';
    });
    if (!tableId) {
        return undefined;
    }
    return canvasComponents.find((component) => component.id === tableId);
};

export const resolveTableColumns = (
    tableComponent: EditorComponent | undefined,
    sourceRows?: DataRow[] | null
): TableColumnOption[] => {
    if (!tableComponent || tableComponent.type !== 'table') {
        return [];
    }

    const props = tableComponent.props ?? {};
    const dataSourceId = props.dataSourceId as string | undefined;
    const isDataBound = Boolean(dataSourceId && dataSourceId !== 'none');

    if (props.customColumns) {
        return props.customColumns as TableColumnOption[];
    }

    if (isDataBound) {
        const mappings = props.columnMappings as TableColumnMapping[] | undefined;
        if (mappings?.length) {
            return mappings.map((mapping) => ({
                id: mapping.sourceField,
                title: mapping.title || mapping.sourceField,
            }));
        }
        if (sourceRows?.length) {
            return applyTableMapping(sourceRows, mappings).columns;
        }
        return [];
    }

    const raw = props.columns as string[] | undefined;
    if (raw?.length) {
        return raw.map((title, index) => ({ id: `col${index + 1}`, title }));
    }

    return [
        { id: 'col1', title: 'Колонка 1' },
        { id: 'col2', title: 'Колонка 2' },
        { id: 'col3', title: 'Колонка 3' },
    ];
};

export const resolveTableRows = (
    tableComponent: EditorComponent | undefined,
    sourceRows?: DataRow[] | null
): DataRow[] => {
    if (!tableComponent || tableComponent.type !== 'table') {
        return [];
    }

    const props = tableComponent.props ?? {};
    const dataSourceId = props.dataSourceId as string | undefined;
    const isDataBound = Boolean(dataSourceId && dataSourceId !== 'none');

    if (props.customData) {
        return props.customData as DataRow[];
    }

    if (isDataBound) {
        if (!sourceRows?.length) {
            return [];
        }
        const mappings = props.columnMappings as TableColumnMapping[] | undefined;
        return applyTableMapping(sourceRows, mappings).data as DataRow[];
    }

    return [];
};

export const getDistinctColumnValues = (rows: DataRow[], fieldKey: string): string[] => {
    if (!fieldKey) {
        return [];
    }
    const values = new Set<string>();
    rows.forEach((row) => {
        const raw = row[fieldKey];
        if (raw === null || raw === undefined) {
            return;
        }
        const text = String(raw).trim();
        if (text) {
            values.add(text);
        }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ru'));
};
