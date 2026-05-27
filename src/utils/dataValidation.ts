import { z } from 'zod';
import type { ChartFieldMapping, TableColumnMapping } from '@/types/data';

const DataCellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const DataRowSchema = z.record(z.string(), DataCellSchema);
export const DataArraySchema = z.array(DataRowSchema);

export type DataRow = z.infer<typeof DataRowSchema>;

export const validateDataPayload = (
    data: unknown
): { success: true; rows: DataRow[] } | { success: false; error: string } => {
    if (data === null || data === undefined) {
        return { success: false, error: 'Источник вернул пустой ответ' };
    }

    let rows: unknown = data;

    if (!Array.isArray(rows)) {
        if (typeof rows === 'object' && rows !== null) {
            const wrapped = rows as Record<string, unknown>;
            if (Array.isArray(wrapped.data)) {
                rows = wrapped.data;
            } else if (Array.isArray(wrapped.items)) {
                rows = wrapped.items;
            } else if (Array.isArray(wrapped.results)) {
                rows = wrapped.results;
            } else {
                rows = [wrapped];
            }
        } else {
            return { success: false, error: 'Данные должны быть массивом объектов' };
        }
    }

    const parsed = DataArraySchema.safeParse(rows);
    if (!parsed.success) {
        return {
            success: false,
            error: 'Некорректная структура: ожидается массив объектов с полями',
        };
    }

    if (parsed.data.length === 0) {
        return { success: false, error: 'Источник не содержит записей' };
    }

    return { success: true, rows: parsed.data };
};

export const validateTableMapping = (
    rows: DataRow[],
    mappings: TableColumnMapping[]
): { valid: boolean; error?: string } => {
    if (mappings.length === 0) {
        return { valid: true };
    }

    const sample = rows[0];
    const missing = mappings
        .map((mapping) => mapping.sourceField)
        .filter((field) => field && !(field in sample));

    if (missing.length > 0) {
        return {
            valid: false,
            error: `В данных нет полей: ${missing.join(', ')}`,
        };
    }

    return { valid: true };
};

export const validateChartMapping = (
    rows: DataRow[],
    mapping: ChartFieldMapping
): { valid: boolean; error?: string } => {
    if (!mapping.xField || !mapping.yField) {
        return { valid: false, error: 'Укажите поля для осей X и Y' };
    }

    const sample = rows[0];
    const missing: string[] = [];

    if (!(mapping.xField in sample)) {
        missing.push(mapping.xField);
    }
    if (!(mapping.yField in sample)) {
        missing.push(mapping.yField);
    }

    if (missing.length > 0) {
        return {
            valid: false,
            error: `В данных нет полей: ${missing.join(', ')}`,
        };
    }

    const hasNumericY = rows.some((row) => {
        const value = row[mapping.yField];
        return typeof value === 'number' || (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value)));
    });

    if (!hasNumericY) {
        return {
            valid: false,
            error: `Поле «${mapping.yField}» должно содержать числовые значения`,
        };
    }

    return { valid: true };
};
