import React, { useEffect, useMemo } from 'react';
import { useDataStore } from '../../../store/dataStore';
import { useEditorStore } from '../../../store/editorStore';
import { applyTableMapping } from '@/utils/dataMapping';
import { validateTableMapping } from '@/utils/dataValidation';
import { applyFiltersToRows, collectFiltersForTarget } from '@/utils/componentFilters';
import type { TableColumnMapping } from '@/types/data';
import type { DataRow } from '@/utils/dataValidation';
import type { ComponentDataProps } from '@/types/data';
import styles from './TableWidget.module.css';

interface TableWidgetProps {
    componentId: string;
    props: ComponentDataProps & Record<string, unknown>;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ componentId, props }) => {
    const { sources, loadData } = useDataStore();
    const updateComponentProps = useEditorStore((state) => state.updateComponentProps);
    const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
    const canvasComponents = useEditorStore((state) => state.components);
    const isSelected = selectedComponentId === componentId;

    const dataSourceId = props.dataSourceId;
    const source = sources.find((item) => item.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading && !source.error) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    const activeFilters = useMemo(
        () => collectFiltersForTarget(canvasComponents, componentId),
        [canvasComponents, componentId]
    );

    const placeholderColumns = useMemo(() => {
        const rawColumns = props.columns as string[] | undefined;
        if (rawColumns?.length) {
            return rawColumns.map((title, index) => ({ id: `col${index + 1}`, title }));
        }
        return [
            { id: 'col1', title: 'Колонка 1' },
            { id: 'col2', title: 'Колонка 2' },
            { id: 'col3', title: 'Колонка 3' },
        ];
    }, [props.columns]);

    const mapped = useMemo(() => {
        if (props.customData && props.customColumns) {
            const filteredData = applyFiltersToRows(
                props.customData as DataRow[],
                activeFilters
            );
            return {
                columns: props.customColumns,
                data: filteredData,
                validationError: null as string | null,
            };
        }

        if (!source?.data || source.data.length === 0) {
            return {
                columns: placeholderColumns,
                data: [] as DataRow[],
                validationError: null as string | null,
            };
        }

        const mappings = props.columnMappings as TableColumnMapping[] | undefined;
        const validation = validateTableMapping(source.data, mappings ?? []);
        if (!validation.valid) {
            return {
                columns: [{ id: 'error', title: 'Ошибка' }],
                data: [{ id: 'error-row', error: validation.error }],
                validationError: validation.error ?? null,
            };
        }

        const filteredRows = applyFiltersToRows(source.data, activeFilters);
        const applied = applyTableMapping(filteredRows, mappings);
        return {
            ...applied,
            validationError: null as string | null,
        };
    }, [
        activeFilters,
        componentId,
        placeholderColumns,
        props.customColumns,
        props.customData,
        props.columnMappings,
        source?.data,
    ]);

    const { columns, data, validationError } = mapped;

    const handleHeaderChange = (colId: string, newTitle: string) => {
        const updatedCols = columns.map((column: { id: string; title: string }) =>
            column.id === colId ? { ...column, title: newTitle } : column
        );
        updateComponentProps(componentId, { customColumns: updatedCols, customData: data });
    };

    const handleCellChange = (rowId: string, colId: string, newValue: string) => {
        const updatedRows = data.map((row: Record<string, unknown>) =>
            row.id === rowId ? { ...row, [colId]: newValue } : row
        );
        updateComponentProps(componentId, { customData: updatedRows, customColumns: columns });
    };

    const addColumn = () => {
        const newColId = `col${Date.now()}`;
        const updatedCols = [...columns, { id: newColId, title: 'Новая' }];
        const updatedRows = data.map((row: Record<string, unknown>) => ({ ...row, [newColId]: '' }));
        updateComponentProps(componentId, { customColumns: updatedCols, customData: updatedRows });
    };

    const addRow = () => {
        const newRowId = `row${Date.now()}`;
        const newRow: Record<string, unknown> = { id: newRowId };
        columns.forEach((column: { id: string }) => {
            newRow[column.id] = '';
        });
        updateComponentProps(componentId, { customData: [...data, newRow], customColumns: columns });
    };

    const removeColumn = (colId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот столбец?')) {
            const updatedCols = columns.filter((column: { id: string }) => column.id !== colId);
            updateComponentProps(componentId, { customColumns: updatedCols, customData: data });
        }
    };

    const removeRow = (rowId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту строку?')) {
            const updatedRows = data.filter((row: Record<string, unknown>) => row.id !== rowId);
            updateComponentProps(componentId, { customData: updatedRows, customColumns: columns });
        }
    };

    if (source?.isLoading) {
        return <div>Загрузка данных...</div>;
    }

    if (source?.error) {
        return <div style={{ color: 'red' }}>Ошибка: {source.error}</div>;
    }

    if (validationError) {
        return <div style={{ color: '#d48806' }}>Маппинг: {validationError}</div>;
    }

    const textAlign = (props.textAlign as string) || 'left';
    const verticalAlign = (props.verticalAlign as string) || 'top';

    const cellStyle: React.CSSProperties = {
        textAlign: textAlign as React.CSSProperties['textAlign'],
        verticalAlign: verticalAlign as React.CSSProperties['verticalAlign'],
    };

    const appliedStyles = {
        ...(props.style as Record<string, unknown>),
        width: (props.style as { width?: string })?.width || '100%',
        height: (props.style as { height?: string })?.height || '100%',
    };

    return (
        <div className={styles.tableWrapper} style={appliedStyles}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col: { id: string; title: string }) => (
                            <th key={col.id} style={cellStyle}>
                                <input
                                    className={styles.editInput}
                                    style={{ textAlign: cellStyle.textAlign }}
                                    value={col.title}
                                    onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                    placeholder="Заголовок"
                                />
                                {isSelected && (
                                    <button
                                        className={styles.deleteColBtn}
                                        onClick={() => removeColumn(col.id)}
                                        title="Удалить столбец"
                                    >
                                        ×
                                    </button>
                                )}
                            </th>
                        ))}
                        {isSelected && (
                            <th style={{ width: '40px' }}>
                                <button className={styles.actionButton} onClick={addColumn}>+</button>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: Record<string, unknown>) => (
                        <tr key={String(row.id)}>
                            {columns.map((col: { id: string }) => (
                                <td key={`${row.id}-${col.id}`} style={cellStyle}>
                                    <input
                                        className={styles.editInput}
                                        style={{ textAlign: cellStyle.textAlign }}
                                        value={String(row[col.id] ?? '')}
                                        onChange={(e) => handleCellChange(String(row.id), col.id, e.target.value)}
                                    />
                                </td>
                            ))}
                            {isSelected && (
                                <td style={{ width: '40px', padding: 0 }}>
                                    <button
                                        className={styles.deleteRowBtn}
                                        onClick={() => removeRow(String(row.id))}
                                        title="Удалить строку"
                                    >
                                        ×
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {isSelected && (
                        <tr className={styles.controlsRow}>
                            <td colSpan={columns.length + 1}>
                                <button className={styles.actionButton} onClick={addRow}>+ Добавить строку</button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
