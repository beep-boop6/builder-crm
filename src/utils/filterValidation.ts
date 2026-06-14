import type { DataRow } from '@/utils/dataValidation';

/** Допустимый ввод числа: пустая строка, цифры, опционально минус и десятичная точка. */
export const isValidNumberFilterInput = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
        return true;
    }
    if (/[a-zA-Zа-яА-ЯёЁ]/.test(trimmed)) {
        return false;
    }
    if (!/^-?\d*\.?\d*$/.test(trimmed)) {
        return false;
    }
    return trimmed !== '-' && trimmed !== '.';
};

export const isNumericColumn = (rows: DataRow[], fieldKey: string): boolean => {
    if (!fieldKey || rows.length === 0) {
        return false;
    }
    return rows.some((row) => {
        const raw = row[fieldKey];
        if (raw === null || raw === undefined || raw === '') {
            return false;
        }
        if (typeof raw === 'number') {
            return Number.isFinite(raw);
        }
        return typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw));
    });
};

export const shouldValidateFilterAsNumber = (
    filterType: string,
    rows: DataRow[],
    fieldKey: string
): boolean => filterType === 'number' || (filterType === 'field' && isNumericColumn(rows, fieldKey));

export const isFilterValueInvalid = (
    filterType: string,
    rows: DataRow[],
    fieldKey: string,
    value: string
): boolean => {
    if (!shouldValidateFilterAsNumber(filterType, rows, fieldKey)) {
        return false;
    }
    return value.trim() !== '' && !isValidNumberFilterInput(value);
};
