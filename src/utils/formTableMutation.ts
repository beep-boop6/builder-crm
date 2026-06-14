import type { EditorComponent } from '@/store/editorStore';
import type { FormFieldDefinition, FormLayout } from '@/types/form';
import { ensureTableRowIds, TABLE_ROW_ID_KEY } from '@/utils/dataMapping';
import type { DataRow } from '@/utils/dataValidation';
import {
    getLinkedTableComponent,
    resolveTableColumns,
    resolveTableRows,
    type TableColumnOption,
} from '@/utils/tableColumns';

let uidCounter = 0;
const uid = () => `t${Date.now()}-${++uidCounter}`;

export const getFormHeaderField = (fields: FormFieldDefinition[]): FormFieldDefinition =>
    fields.find((field) => field.type !== 'submit') ?? fields[0];

export const getFormValueFields = (fields: FormFieldDefinition[]): FormFieldDefinition[] => {
    const header = getFormHeaderField(fields);
    return fields.filter((field) => field.type !== 'submit' && field.name !== header.name);
};

const ensureMutableRows = (cols: TableColumnOption[], rows: DataRow[]): DataRow[] => {
    if (rows.length > 0) {
        return ensureTableRowIds(rows);
    }
    return [
        {
            [TABLE_ROW_ID_KEY]: uid(),
            ...Object.fromEntries(cols.map((column) => [column.id, ''])),
        },
    ];
};

export const mutateTableFromForm = (
    tableComponent: EditorComponent,
    layout: FormLayout,
    fields: FormFieldDefinition[],
    formValues: Record<string, string>,
    sourceRows?: DataRow[] | null
): { customColumns: TableColumnOption[]; customData: DataRow[] } | { error: string } => {
    const headerField = getFormHeaderField(fields);
    const headerValue = String(formValues[headerField.name] ?? '').trim();
    if (!headerValue) {
        return { error: 'Заполните поле «Заголовок»' };
    }

    const valueFields = getFormValueFields(fields);
    const columns = resolveTableColumns(tableComponent, sourceRows);
    if (columns.length === 0) {
        return { error: 'У таблицы нет колонок' };
    }

    const rows = ensureMutableRows(columns, resolveTableRows(tableComponent, sourceRows));

    if (layout === 'column') {
        const newColId = uid();
        const nextColumns = [...columns, { id: newColId, title: headerValue }];
        const nextRows = rows.map((row, rowIndex) => {
            const valueField = valueFields[rowIndex];
            const cellValue = valueField
                ? String(formValues[valueField.name] ?? '').trim()
                : '';
            return { ...row, [newColId]: cellValue };
        });
        return {
            customColumns: nextColumns,
            customData: ensureTableRowIds(nextRows),
        };
    }

    const nextRow: DataRow = { [TABLE_ROW_ID_KEY]: uid() };
    columns.forEach((column, columnIndex) => {
        if (columnIndex === 0) {
            nextRow[column.id] = headerValue;
            return;
        }
        const valueField = valueFields[columnIndex - 1];
        nextRow[column.id] = valueField
            ? String(formValues[valueField.name] ?? '').trim()
            : '';
    });

    return {
        customColumns: columns,
        customData: ensureTableRowIds([...rows, nextRow]),
    };
};

export const applyFormSubmissionToTable = (
    canvasComponents: EditorComponent[],
    targetIds: string[],
    layout: FormLayout,
    fields: FormFieldDefinition[],
    formValues: Record<string, string>,
    sourceRowsByTableId: Record<string, DataRow[] | undefined>
): { tableId: string; patch: Record<string, unknown> } | { error: string } => {
    const table = getLinkedTableComponent(canvasComponents, targetIds);
    if (!table) {
        return { error: 'Привяжите форму к таблице в панели свойств → «Привязка к данным»' };
    }

    const mutation = mutateTableFromForm(
        table,
        layout,
        fields,
        formValues,
        sourceRowsByTableId[table.id]
    );

    if ('error' in mutation) {
        return mutation;
    }

    return {
        tableId: table.id,
        patch: {
            customColumns: mutation.customColumns,
            customData: mutation.customData,
        },
    };
};
