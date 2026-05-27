import React, { useEffect } from 'react';
import { useDataStore } from '../../../store/dataStore';
import { useEditorStore } from '../../../store/editorStore';
import styles from './TableWidget.module.css';

interface TableWidgetProps {
    componentId: string;
    props: any;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ componentId, props }) => {
    const { sources, loadData } = useDataStore();
    const updateComponentProps = useEditorStore(state => state.updateComponentProps);

    const selectedComponentId = useEditorStore(state => state.selectedComponentId);
    const isSelected = selectedComponentId === componentId;

    const dataSourceId = props.dataSourceId;
    const source = sources.find(s => s.id === dataSourceId);

    useEffect(() => {
        if (dataSourceId && dataSourceId !== 'none' && source && !source.data && !source.isLoading) {
            loadData(dataSourceId);
        }
    }, [dataSourceId, source, loadData]);

    const baseData = source?.data || [];
    const baseCols = baseData.length > 0
        ? Object.keys(baseData[0]).map(k => ({ id: k, title: k }))
        : [{ id: 'col1', title: 'Колонка 1' }, { id: 'col2', title: 'Колонка 2' }];

    const defaultRows = baseData.length > 0
        ? baseData.map((row: any, i: number) => ({ ...row, id: row.id || `row-${i}` }))
        : [{ id: 'row1', col1: 'Данные', col2: 'Данные' }, { id: 'row2', col1: 'Данные', col2: 'Данные' }];

    const columns = props.customColumns || baseCols;
    const data = props.customData || defaultRows;

    const handleHeaderChange = (colId: string, newTitle: string) => {
        const updatedCols = columns.map((c: any) => c.id === colId ? { ...c, title: newTitle } : c);
        updateComponentProps(componentId, { customColumns: updatedCols });
    };

    const handleCellChange = (rowId: string, colId: string, newValue: string) => {
        const updatedRows = data.map((r: any) => r.id === rowId ? { ...r, [colId]: newValue } : r);
        updateComponentProps(componentId, { customData: updatedRows, customColumns: columns });
    };

    const addColumn = () => {
        const newColId = `col${Date.now()}`;
        const updatedCols = [...columns, { id: newColId, title: 'Новая' }];
        const updatedRows = data.map((r: any) => ({ ...r, [newColId]: '' }));
        updateComponentProps(componentId, { customColumns: updatedCols, customData: updatedRows });
    };

    const addRow = () => {
        const newRowId = `row${Date.now()}`;
        const newRow: any = { id: newRowId };
        columns.forEach((c: any) => { newRow[c.id] = ''; });
        updateComponentProps(componentId, { customData: [...data, newRow], customColumns: columns });
    };

    // Новые функции удаления
    const removeColumn = (colId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот столбец?')) {
            const updatedCols = columns.filter((c: any) => c.id !== colId);
            updateComponentProps(componentId, { customColumns: updatedCols, customData: data });
        }
    };

    const removeRow = (rowId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту строку?')) {
            const updatedRows = data.filter((r: any) => r.id !== rowId);
            updateComponentProps(componentId, { customData: updatedRows, customColumns: columns });
        }
    };

    if (source?.isLoading) return <div>Загрузка данных...</div>;
    if (source?.error) return <div style={{ color: 'red' }}>Ошибка: {source.error}</div>;

    const appliedStyles = {
        ...props.style,
        width: props.style?.width || '100%',
        height: props.style?.height || '100%',
    };

    return (
        <div className={styles.tableWrapper} style={appliedStyles}>
            <table className={styles.table}>
                <thead>
                <tr>
                    {columns.map((col: any) => (
                        <th key={col.id}>
                            <input
                                className={styles.editInput}
                                value={col.title}
                                onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                placeholder="Заголовок"
                            />
                            {/* Крестик удаления столбца */}
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
                {data.map((row: any) => (
                    <tr key={row.id}>
                        {columns.map((col: any) => (
                            <td key={`${row.id}-${col.id}`}>
                                <input
                                    className={styles.editInput}
                                    value={row[col.id] || ''}
                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                />
                            </td>
                        ))}
                        {/* Крестик удаления строки в крайней правой ячейке */}
                        {isSelected && (
                            <td style={{ width: '40px', padding: 0 }}>
                                <button
                                    className={styles.deleteRowBtn}
                                    onClick={() => removeRow(row.id)}
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