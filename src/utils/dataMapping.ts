import type { ChartFieldMapping, TableColumnMapping } from '@/types/data';
import type { DataRow } from '@/utils/dataValidation';
import { formatFieldLabel } from '@/utils/displayLabels';

/** Стабильный идентификатор строки таблицы (не совпадает с колонкой данных `id`). */
export const TABLE_ROW_ID_KEY = '__rowId';

export const getTableRowId = (row: DataRow): string =>
    String(row[TABLE_ROW_ID_KEY] ?? row.id ?? '');

export const ensureTableRowIds = (rows: DataRow[]): DataRow[] =>
    rows.map((row, index) => {
        if (row[TABLE_ROW_ID_KEY]) {
            return row;
        }
        return {
            ...row,
            [TABLE_ROW_ID_KEY]: String(row.id ?? `row-${index}`),
        };
    });

export const getAvailableFields = (rows: DataRow[]): string[] => {
    if (rows.length === 0) {
        return [];
    }

    const fields = new Set<string>();
    rows.slice(0, 5).forEach((row) => {
        Object.keys(row).forEach((key) => fields.add(key));
    });

    return Array.from(fields);
};

export const buildDefaultTableMappings = (rows: DataRow[]): TableColumnMapping[] => {
    return getAvailableFields(rows).map((field) => ({
        sourceField: field,
        title: formatFieldLabel(field),
    }));
};

export const applyTableMapping = (
    rows: DataRow[],
    mappings?: TableColumnMapping[]
) => {
    if (!mappings || mappings.length === 0) {
        const fields = getAvailableFields(rows);
        const columns = fields.map((field) => ({ id: field, title: formatFieldLabel(field) }));
        const data = rows.map((row, index) => ({
            ...row,
            [TABLE_ROW_ID_KEY]: String(row.id ?? `row-${index}`),
        }));
        return { columns, data };
    }

    const columns = mappings.map((mapping) => ({
        id: mapping.sourceField,
        title: mapping.title || formatFieldLabel(mapping.sourceField),
    }));

    const data = rows.map((row, index) => {
        const mapped: Record<string, unknown> = {
            [TABLE_ROW_ID_KEY]: String(row.id ?? `row-${index}`),
        };
        mappings.forEach((mapping) => {
            mapped[mapping.sourceField] = row[mapping.sourceField] ?? '';
        });
        return mapped;
    });

    return { columns, data };
};

export const applyChartMapping = (
    rows: DataRow[],
    mapping?: ChartFieldMapping,
    fallback?: { xField?: string; yField?: string }
) => {
    const fields = getAvailableFields(rows);
    const xField = mapping?.xField || fallback?.xField || fields[0] || 'name';
    const yField = mapping?.yField || fallback?.yField || fields[1] || fields[0] || 'value';

    return {
        xField,
        yField,
        labels: rows.map((row) => String(row[xField] ?? '')),
        values: rows.map((row) => {
            const raw = row[yField];
            if (typeof raw === 'number') {
                return raw;
            }
            const parsed = Number(raw);
            return Number.isNaN(parsed) ? 0 : parsed;
        }),
    };
};
